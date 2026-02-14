import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Receipt, ReceiptItem } from '../types';
import {
    saveReceiptToFirestore,
    deleteReceiptFromFirestore,
    subscribeToReceipts
} from '../services/firestore';
import { calcTotals } from '../utils/calculations';

interface ReceiptState {
    currentItems: ReceiptItem[];
    discount: number;
    taxRate: number;
    customerName: string;
    customerAddress: string;
    documentType: 'receipt' | 'tax_invoice' | 'delivery_note';
    isOriginal: boolean;
    watermarkText: string;
    setDiscount: (amount: number) => void;
    setTaxRate: (rate: number) => void;
    setCustomerName: (name: string) => void;
    setCustomerAddress: (address: string) => void;
    setDocumentType: (type: 'receipt' | 'tax_invoice' | 'delivery_note') => void;
    setIsOriginal: (isOriginal: boolean) => void;
    setWatermarkText: (text: string) => void;
    addItem: (item: Omit<ReceiptItem, 'id'>) => void;
    removeItem: (id: string) => void;
    updateItem: (id: string, updates: Partial<ReceiptItem>) => void;
    clearCurrentReceipt: () => void;

    editingId: string | null;
    loadReceipt: (receipt: Receipt) => void;

    history: Receipt[];
    setHistory: (history: Receipt[]) => void;
    saveReceipt: () => Promise<string>; // Returns new receipt ID
    deleteReceipt: (id: string) => Promise<void>;
    getNextId: () => string;
    initializeFirestore: () => (() => void);
}

export const useReceiptStore = create<ReceiptState>()(
    persist(
        (set, get) => ({
            currentItems: [],
            discount: 0,
            taxRate: 7, // Default 7% VAT
            customerName: '',
            customerAddress: '',
            documentType: 'receipt',
            isOriginal: true,
            watermarkText: '',

            setDiscount: (amount) => set({ discount: amount }),
            setTaxRate: (rate) => set({ taxRate: rate }),
            setCustomerName: (name) => set({ customerName: name }),
            setCustomerAddress: (address) => set({ customerAddress: address }),
            setDocumentType: (type) => set({ documentType: type }),
            setIsOriginal: (isOriginal) => set({ isOriginal }),
            setWatermarkText: (text) => set({ watermarkText: text }),

            editingId: null,

            loadReceipt: (receipt) => {
                set({
                    currentItems: receipt.items || [],
                    discount: receipt.discount || 0,
                    taxRate: receipt.taxRate || 0,
                    customerName: receipt.customerName || '',
                    customerAddress: receipt.customerAddress || '',
                    documentType: receipt.documentType || 'receipt',
                    isOriginal: receipt.isOriginal ?? true,
                    watermarkText: receipt.watermarkText || '',
                    editingId: receipt.id,
                });
            },

            addItem: (item) => {
                const newItem: ReceiptItem = {
                    ...item,
                    id: crypto.randomUUID(),
                };
                set((state) => ({
                    currentItems: [...state.currentItems, newItem],
                }));
            },

            removeItem: (id) => {
                set((state) => ({
                    currentItems: state.currentItems.filter((item) => item.id !== id),
                }));
            },

            updateItem: (id, updates) => {
                set((state) => ({
                    currentItems: state.currentItems.map((item) =>
                        item.id === id ? { ...item, ...updates } : item
                    ),
                }));
            },

            clearCurrentReceipt: () => {
                set({
                    currentItems: [],
                    discount: 0,
                    customerName: '',
                    customerAddress: '',
                    editingId: null,
                    watermarkText: '',
                });
            },

            history: [],

            setHistory: (history) => set({ history }),

            getNextId: () => {
                const { history, documentType } = get();

                let prefixCode = 'INV';
                switch (documentType) {
                    case 'receipt':
                        prefixCode = 'rcpt';
                        break;
                    case 'tax_invoice':
                        prefixCode = 'INV';
                        break;
                    case 'delivery_note':
                        prefixCode = 'DN';
                        break;
                    default:
                        prefixCode = 'INV';
                }

                if (!Array.isArray(history)) return `${prefixCode}-20260214-0001`;

                const today = new Date();
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const day = String(today.getDate()).padStart(2, '0');
                const prefix = `${prefixCode}-${year}${month}${day}-`;

                const todayReceipts = history.filter(r => r && r.id && r.id.startsWith(prefix));
                let maxSeq = 0;
                todayReceipts.forEach(r => {
                    const parts = r.id.split('-');
                    if (parts.length >= 3) {
                        const seqStr = parts[2];
                        const seq = parseInt(seqStr, 10);
                        if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
                    }
                });

                return `${prefix}${String(maxSeq + 1).padStart(4, '0')}`;
            },

            saveReceipt: async () => {
                const {
                    currentItems,
                    discount,
                    taxRate,
                    customerName,
                    customerAddress,
                    documentType,
                    isOriginal,
                    watermarkText,
                    history,
                    editingId,
                } = get();

                try {
                    const safeHistory = Array.isArray(history) ? history : [];
                    const safeCurrentItems = Array.isArray(currentItems) ? currentItems : [];

                    if (safeCurrentItems.length === 0) {
                        console.warn('Cannot save receipt with no items');
                        return '';
                    }

                    const { subtotal, discountAmount, taxAmount, total } = calcTotals(
                        safeCurrentItems,
                        discount,
                        taxRate
                    );

                    const newReceipt: Receipt = {
                        id: editingId || get().getNextId(),
                        date: new Date().toISOString(), // Always update date on save? Or keep original? Let's update to show "modified" time, or maybe we want to keep original date? Usually edit updates the record. Let's start with updating.
                        items: safeCurrentItems,
                        subtotal,
                        discount: discountAmount,
                        tax: taxAmount,
                        taxRate,
                        total,
                        customerName,
                        customerAddress,
                        documentType,
                        isOriginal,
                        watermarkText,
                    };

                    // Save to Firestore
                    await saveReceiptToFirestore(newReceipt);

                    // Update local state
                    if (editingId) {
                        set({
                            history: safeHistory.map(h => h.id === editingId ? newReceipt : h),
                            editingId: null, // Clear editing state after save
                        });
                    } else {
                        set({ history: [newReceipt, ...safeHistory] });
                    }

                    return newReceipt.id;
                } catch (error) {
                    console.error('Failed to save receipt:', error);
                    return '';
                }
            },

            deleteReceipt: async (id) => {
                try {
                    // Delete from Firestore
                    await deleteReceiptFromFirestore(id);

                    // Update local state
                    set((state) => ({
                        history: state.history.filter((r) => r.id !== id),
                    }));
                } catch (error) {
                    console.error('Failed to delete receipt:', error);
                }
            },

            initializeFirestore: () => {
                // Subscribe to Firestore changes
                const unsubscribe = subscribeToReceipts((receipts) => {
                    set({ history: receipts });
                });

                // Store unsubscribe function (optional, for cleanup)
                return unsubscribe;
            },
        }),
        {
            name: 'receipt-storage',
        }
    )
);
