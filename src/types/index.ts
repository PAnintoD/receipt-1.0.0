export type DocumentType = 'receipt' | 'tax_invoice' | 'delivery_note' | 'quotation';

export interface CustomerInfo {
    id: string;
    name: string;
    address: string;
}

export interface AppConfig {
    shopName: string;
    shopAddress: string;
    taxId: string;
    logo: string;
    footerText: string;
    defaultWatermark?: string;
    defaultRemarks?: string;
    customers?: CustomerInfo[];
}

export interface ReceiptItem {
    id: string;
    name: string;
    qty: number;
    price: number;
    unit?: string; // e.g. "ชิ้น", "กล่อง"
}

export interface Receipt {
    id: string;
    date: string; // ISO string
    items: ReceiptItem[];
    total: number;
    subtotal: number;
    discount?: number; // Fixed amount
    tax?: number; // Calculated tax amount
    taxRate?: number; // Percentage (e.g. 7)
    customerName?: string;
    customerAddress?: string;
    documentType?: DocumentType;
    isOriginal?: boolean;
    watermarkText?: string;
    proposerName?: string;
    remarks?: string;
}
