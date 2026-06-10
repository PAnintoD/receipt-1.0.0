import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DocumentType, Receipt, ReceiptItem } from '../types';
import {
    saveReceiptToFirestore,
    deleteReceiptFromFirestore,
    subscribeToReceipts
} from '../services/firestore';
import { calcTotals } from '../utils/calculations';
import { getThaiDateKey } from '../utils/format';

type SaveReceiptResult = {
    id: string;
    status: 'saved' | 'error';
};

interface ReceiptState {
    currentItems: ReceiptItem[];
    discount: number;
    taxRate: number;
    customerName: string;
    customerAddress: string;
    date: string;
    documentType: DocumentType;
    isOriginal: boolean;
    watermarkText: string;
    proposerName: string;
    remarks: string;
    setDiscount: (amount: number) => void;
    setTaxRate: (rate: number) => void;
    setCustomerName: (name: string) => void;
    setCustomerAddress: (address: string) => void;
    setDate: (date: string) => void;
    setDocumentType: (type: DocumentType) => void;
    setIsOriginal: (isOriginal: boolean) => void;
    setWatermarkText: (text: string) => void;
    setProposerName: (name: string) => void;
    setRemarks: (remarks: string) => void;
    addItem: (item: Omit<ReceiptItem, 'id'>) => void;
    removeItem: (id: string) => void;
    updateItem: (id: string, updates: Partial<ReceiptItem>) => void;
    clearCurrentReceipt: () => void;

    editingId: string | null;
    isSaving: boolean;
    loadReceipt: (receipt: Receipt) => void;

    history: Receipt[];
    setHistory: (history: Receipt[]) => void;
    saveReceipt: () => Promise<SaveReceiptResult>;
    deleteReceipt: (id: string) => Promise<void>;
    getNextId: () => string;
    initializeFirestore: () => (() => void);
}

let pendingSave: Promise<SaveReceiptResult> | null = null;

export const useReceiptStore = create<ReceiptState>()(
    persist(
        (set, get) => ({
            currentItems: [],
            discount: 0,
            taxRate: 7, // Default 7% VAT
            customerName: '',
            customerAddress: '',
            date: new Date().toISOString(),
            documentType: 'receipt',
            isOriginal: true,
            watermarkText: '',
            proposerName: '',
            remarks: '',

            setDiscount: (amount) => set({ discount: amount }),
            setTaxRate: (rate) => set({ taxRate: rate }),
            setCustomerName: (name) => set({ customerName: name }),
            setCustomerAddress: (address) => set({ customerAddress: address }),
            setDate: (date) => set({ date }),
            setDocumentType: (type) => set({ documentType: type }),
            setIsOriginal: (isOriginal) => set({ isOriginal }),
            setWatermarkText: (text) => set({ watermarkText: text }),
            setProposerName: (name) => set({ proposerName: name }),
            setRemarks: (remarks) => set({ remarks }),

            editingId: null,
            isSaving: false,

            loadReceipt: (receipt) => {
                set({
                    currentItems: receipt.items || [],
                    discount: receipt.discount || 0,
                    taxRate: receipt.taxRate || 0,
                    customerName: receipt.customerName || '',
                    customerAddress: receipt.customerAddress || '',
                    date: receipt.date || new Date().toISOString(),
                    documentType: receipt.documentType || 'receipt',
                    isOriginal: receipt.isOriginal ?? true,
                    watermarkText: receipt.watermarkText || '',
                    proposerName: receipt.proposerName || '',
                    remarks: receipt.remarks || '',
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
                    date: new Date().toISOString(),
                    editingId: null,
                    watermarkText: '',
                    proposerName: '',
                    remarks: '',
                });
            },

            history: [],

            setHistory: (history) => set({ history }),

            getNextId: () => {
                const { history, documentType, date } = get();

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
                    case 'quotation':
                        prefixCode = 'QT';
                        break;
                    default:
                        prefixCode = 'INV';
                }

                if (!Array.isArray(history)) return `${prefixCode}-20260214-0001`;

                const dateKey = getThaiDateKey(date) || getThaiDateKey(new Date());
                const [year, month, day] = dateKey.split('-');
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
                if (pendingSave) return pendingSave;

                pendingSave = (async () => {
                    const {
                        currentItems,
                        discount,
                        taxRate,
                        customerName,
                        customerAddress,
                        date,
                        documentType,
                        isOriginal,
                        watermarkText,
                        proposerName,
                        remarks,
                        history,
                        editingId,
                    } = get();

                    try {
                        set({ isSaving: true });
                        const safeHistory = Array.isArray(history) ? history : [];
                        const safeCurrentItems = Array.isArray(currentItems) ? currentItems : [];

                        if (safeCurrentItems.length === 0) {
                            console.warn('Cannot save receipt with no items');
                            return { id: '', status: 'error' };
                        }

                        const { subtotal, discountAmount, taxAmount, total } = calcTotals(
                            safeCurrentItems,
                            discount,
                            taxRate
                        );
                        const selectedDate = new Date(date);

                        const newReceipt: Receipt = {
                            id: editingId || get().getNextId(),
                            date: isNaN(selectedDate.getTime()) ? new Date().toISOString() : selectedDate.toISOString(),
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
                            proposerName,
                            remarks,
                        };

                        await saveReceiptToFirestore(newReceipt);

                        set({
                            history: safeHistory.some(h => h.id === newReceipt.id)
                                ? safeHistory.map(h => h.id === newReceipt.id ? newReceipt : h)
                                : [newReceipt, ...safeHistory],
                            editingId: null,
                        });

                        return { id: newReceipt.id, status: 'saved' };
                    } catch (error) {
                        console.error('Failed to save receipt:', error);
                        return { id: '', status: 'error' };
                    } finally {
                        pendingSave = null;
                        set({ isSaving: false });
                    }
                })();

                return pendingSave;
            },

            deleteReceipt: async (id) => {
                try {
                    // Delete from Firestore
                    await deleteReceiptFromFirestore(id);

                    // Update local state
                    set((state) => ({
                        history: state.history.filter((r) => r.id !== id),
                        editingId: state.editingId === id ? null : state.editingId,
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
            partialize: (state) => ({
                ...state,
                isSaving: false,
            }),
        }
    )
);
