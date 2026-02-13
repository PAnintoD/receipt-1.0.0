export interface AppConfig {
    shopName: string;
    address: string;
    taxId: string;
    logo: string | null; // Base64 string or URL
    footerMessage: string;
    themeColor: string; // Hex code or Tailwind class prefix
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
    documentType?: 'receipt' | 'tax_invoice' | 'delivery_note';
    isOriginal?: boolean;
    watermarkText?: string;
}
