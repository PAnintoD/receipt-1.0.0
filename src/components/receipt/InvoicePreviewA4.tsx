import React from 'react';
import { useConfigStore } from '../../store/useConfigStore';
import type { ReceiptItem } from '../../types';
import { formatCurrency, formatDate } from '../../utils/format';
import { thaiBahtText } from '../../utils/thaiBaht';

interface InvoiceA4Props {
    items?: ReceiptItem[];
    total?: number;
    subtotal?: number;
    discount?: number;
    tax?: number;
    taxRate?: number;
    date?: string;
    id?: string;
    customerName?: string;
    customerAddress?: string;
    documentType?: 'receipt' | 'tax_invoice' | 'delivery_note';
    isOriginal?: boolean;
    watermarkText?: string;
}

export const InvoicePreviewA4 = React.forwardRef<HTMLDivElement, InvoiceA4Props>((props, ref) => {
    const { items = [], total = 0, subtotal, discount, tax, taxRate, date, id, customerName, customerAddress, documentType = 'receipt', isOriginal = true, watermarkText } = props;
    const configStore = useConfigStore();
    const config = configStore || { shopName: 'ร้านค้าของฉัน', shopAddress: '', taxId: '', logo: null };
    const displayDate = date || new Date().toISOString();

    const effectiveSubtotal = subtotal ?? items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const effectiveDiscount = discount ?? 0;
    const effectiveTax = tax ?? 0;

    const getDocumentTitle = () => {
        switch (documentType) {
            case 'tax_invoice': return 'ใบกำกับภาษี / Tax Invoice';
            case 'delivery_note': return 'ใบส่งของ / Delivery Note';
            default: return 'ใบเสร็จรับเงิน / Receipt';
        }
    };

    return (
        <div
            ref={ref}
            className="bg-white w-full max-w-[210mm] min-h-[297mm] mx-auto p-8 relative text-gray-800 font-sans leading-relaxed shadow-sm print:shadow-none print:w-full print:max-w-none box-border"
        >
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
                <div className="transform -rotate-45 opacity-[0.03] text-gray-900 text-9xl font-bold whitespace-nowrap select-none border-4 border-gray-900 p-4 rounded-3xl">
                    {watermarkText || config.shopName || 'CONFIDENTIAL'}
                </div>
            </div>

            {/* Header */}
            <div className="flex justify-between items-start mb-8">
                <div className="flex gap-4">
                    {config.logo && (
                        <img src={config.logo} alt="Logo" className="h-20 w-20 object-contain" />
                    )}
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-1">{config.shopName}</h1>
                        <p className="text-xs text-gray-500 max-w-sm whitespace-pre-wrap">{config.shopAddress}</p>
                        {config.taxId && <p className="text-xs text-gray-500 mt-1">เลขประจำตัวผู้เสียภาษี: {config.taxId}</p>}
                    </div>
                </div>
                <div className="text-right z-10 relative">
                    <h2 className="text-2xl font-bold mb-4 text-gray-900">{getDocumentTitle()}</h2>
                    <div className="bg-blue-50/50 rounded-lg p-3 border border-blue-100 min-w-[200px]">
                        <div className="flex justify-between text-sm mb-1">
                            <span className="font-bold text-blue-800">เลขที่:</span>
                            <span className="font-mono text-blue-600 font-bold">{id || 'INV-XXXX'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">วันที่:</span>
                            <span>{formatDate(displayDate)}</span>
                        </div>
                        <div className="flex justify-between text-sm mt-1 border-t border-blue-100 pt-1 text-blue-400">
                            <span className="text-xs font-semibold">{isOriginal ? 'ต้นฉบับ / Original' : 'สำเนา / Copy'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Customer Info */}
            <div className="mb-8 border border-blue-100 rounded-xl bg-blue-50/30 p-6">
                <h3 className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-3">ข้อมูลลูกค้า / CUSTOMER INFO</h3>
                {customerName ? (
                    <>
                        <p className="text-lg font-bold text-gray-800 mb-1">{customerName}</p>
                        <p className="text-sm text-gray-600">{customerAddress || '-'}</p>
                    </>
                ) : (
                    <p className="text-sm text-gray-400 italic">ไม่ได้ระบุข้อมูลลูกค้า</p>
                )}
            </div>

            {/* Items Table */}
            <div className="mb-8">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-900 text-white">
                            <th className="py-3 px-4 text-center w-16 rounded-l-lg">ลำดับ</th>
                            <th className="py-3 px-4 text-left">รายละเอียด / Description</th>
                            <th className="py-3 px-4 text-center w-20">จำนวน</th>
                            <th className="py-3 px-4 text-center w-20">หน่วย</th>
                            <th className="py-3 px-4 text-right w-24">หน่วยละ</th>
                            <th className="py-3 px-4 text-right w-28 rounded-r-lg">รวมเงิน (บาท)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {items.map((item, index) => (
                            <tr key={item.id}>
                                <td className="py-3 px-4 text-center text-gray-400 font-mono">{index + 1}</td>
                                <td className="py-3 px-4 font-medium text-gray-700">{item.name}</td>
                                <td className="py-3 px-4 text-center bg-gray-50/50 font-mono">{item.qty}</td>
                                <td className="py-3 px-4 text-center text-gray-500">{item.unit || 'ชิ้น'}</td>
                                <td className="py-3 px-4 text-right text-gray-600 font-mono">{formatCurrency(item.price).replace('฿', '')}</td>
                                <td className="py-3 px-4 text-right font-bold text-gray-800 font-mono">{formatCurrency(item.price * item.qty).replace('฿', '')}</td>
                            </tr>
                        ))}
                        {items.length < 5 && Array.from({ length: 5 - items.length }).map((_, i) => (
                            <tr key={`empty-${i}`}>
                                <td className="py-3 px-4 text-center text-gray-200">-</td>
                                <td className="py-3 px-4"></td>
                                <td className="py-3 px-4 text-center bg-gray-50/30"></td>
                                <td className="py-3 px-4"></td>
                                <td className="py-3 px-4"></td>
                                <td className="py-3 px-4"></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer / Totals */}
            <div className="flex items-start gap-8 border-t-2 border-gray-900 pt-6">
                {/* Left: Text Total */}
                <div className="flex-1 bg-gray-50 rounded-lg p-4">
                    <span className="text-xs text-gray-500">ตัวอักษร:</span>
                    <p className="font-bold text-gray-800 italic mt-1">{thaiBahtText(total)}</p>
                </div>

                {/* Right: Numbers */}
                <div className="w-1/3 min-w-[250px]">
                    <div className="flex justify-between mb-2 text-gray-600">
                        <span>รวมยอดเงิน (Subtotal)</span>
                        <span className="font-mono">{formatCurrency(effectiveSubtotal)}</span>
                    </div>
                    {effectiveDiscount > 0 && (
                        <div className="flex justify-between mb-2 text-red-500">
                            <span>ส่วนลด (Discount)</span>
                            <span className="font-mono">-{formatCurrency(effectiveDiscount)}</span>
                        </div>
                    )}
                    {effectiveTax > 0 && (
                        <div className="flex justify-between mb-3 text-gray-600">
                            <span>ภาษีมูลค่าเพิ่ม {taxRate}% (VAT)</span>
                            <span className="font-mono">{formatCurrency(effectiveTax)}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center bg-blue-600 text-white p-4 rounded-lg shadow-lg shadow-blue-200 print:shadow-none print:text-black print:bg-gray-100">
                        <span className="font-bold text-lg">ยอดสุทธิ</span>
                        <span className="font-bold text-2xl font-mono">{formatCurrency(total)}</span>
                    </div>
                </div>
            </div>

            {/* Signatures */}
            <div className="flex justify-between mt-12 pb-8 break-inside-avoid">
                <div className="text-center w-64 pt-8 border-t border-gray-300">
                    <p className="text-sm font-bold text-gray-700">ผู้รับเงิน / Receiver</p>
                    <p className="text-xs text-gray-400 mt-1">วันที่ ______________</p>
                </div>
                <div className="text-center w-64 pt-8 border-t border-gray-300">
                    <p className="text-sm font-bold text-gray-700">ผู้มีอำนาจลงนาม / Authorized</p>
                    <p className="text-xs text-gray-400 mt-1">วันที่ ______________</p>
                </div>
            </div>
        </div>
    );
});

InvoicePreviewA4.displayName = 'InvoicePreviewA4';
