import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Receipt, ReceiptItem } from '../types';

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

    history: Receipt[];
    saveReceipt: () => string; // Returns new receipt ID
    deleteReceipt: (id: string) => void;
    getNextId: () => string;
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

            addItem: (item) => set((state) => ({
                currentItems: [...state.currentItems, { ...item, id: crypto.randomUUID() }]
            })),

            removeItem: (id) => set((state) => ({
                currentItems: state.currentItems.filter((i) => i.id !== id)
            })),

            updateItem: (id, updates) => set((state) => ({
                currentItems: state.currentItems.map((i) => (i.id === id ? { ...i, ...updates } : i))
            })),

            clearCurrentReceipt: () => set({ currentItems: [], discount: 0, customerName: '', customerAddress: '', documentType: 'receipt', isOriginal: true, watermarkText: '' }), // Keep tax rate preference?

            history: [],

            getNextId: () => {
                const { history } = get();
                // Safety check
                if (!Array.isArray(history)) return 'INV-20230101-0001';

                const today = new Date();
                const yyyy = today.getFullYear();
                const mm = String(today.getMonth() + 1).padStart(2, '0');
                const dd = String(today.getDate()).padStart(2, '0');
                const dateStr = `${yyyy}${mm}${dd}`;
                const prefix = `INV-${dateStr}-`;

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

            saveReceipt: () => {
                const { currentItems, history, discount, taxRate, customerName, customerAddress, getNextId } = get();
                if (!currentItems || currentItems.length === 0) return '';

                try {
                    const subtotal = currentItems.reduce((sum, item) => sum + item.price * item.qty, 0);
                    const discountAmount = discount || 0;
                    const afterDiscount = Math.max(0, subtotal - discountAmount);
                    const taxAmount = (afterDiscount * taxRate) / 100;
                    const total = afterDiscount + taxAmount;

                    const newId = getNextId();
                    const safeHistory = Array.isArray(history) ? history : [];

                    const newReceipt: Receipt = {
                        id: newId,
                        date: new Date().toISOString(),
                        items: [...currentItems],
                        subtotal,
                        discount: discountAmount,
                        tax: taxAmount,
                        taxRate,
                        total,
                        customerName: customerName || '',
                        customerAddress: customerAddress || '',
                        documentType: get().documentType || 'receipt',
                        isOriginal: get().isOriginal ?? true,
                        watermarkText: get().watermarkText || '',
                    };

                    set({
                        history: [newReceipt, ...safeHistory],
                        currentItems: [],
                        discount: 0,
                        customerName: '',
                        customerAddress: '',
                    });

                    return newReceipt.id;
                } catch (error) {
                    console.error("Failed to save receipt:", error);
                    return '';
                }
            },

            deleteReceipt: (id) => set((state) => ({
                history: state.history.filter((r) => r.id !== id)
            })),
        }),
        {
            name: 'receipt-storage',
        }
    )
);
