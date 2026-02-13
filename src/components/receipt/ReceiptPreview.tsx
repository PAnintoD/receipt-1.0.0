import React from 'react';
import { useConfigStore } from '../../store/useConfigStore';
import type { ReceiptItem } from '../../types';
import { formatCurrency, formatDate } from '../../utils/format';

interface ReceiptPreviewProps {
    items: ReceiptItem[];
    total: number;
    subtotal?: number;
    discount?: number;
    tax?: number;
    taxRate?: number;
    date?: string;
    id?: string;
    previewMode?: boolean;
}

export const ReceiptPreview = React.forwardRef<HTMLDivElement, ReceiptPreviewProps>(
    ({ items = [], total = 0, subtotal, discount, tax, taxRate, date, id }, ref) => {
        const configStore = useConfigStore();
        const config = configStore || { shopName: 'ร้านค้าของฉัน', address: '', taxId: '', logo: null };
        const displayDate = date || new Date().toISOString();

        // Calculate derived values if not provided (backward compatibility)
        const effectiveSubtotal = subtotal ?? items.reduce((sum, item) => sum + item.price * item.qty, 0);
        const effectiveDiscount = discount ?? 0;
        const effectiveTax = tax ?? 0;

        return (
            <div
                ref={ref}
                className="bg-white p-6 md:p-8 w-full max-w-[80mm] mx-auto shadow-sm border border-gray-100 print:shadow-none print:border-none print:w-full print:max-w-none text-black font-mono leading-tight"
                id="printable-receipt"
                lang="th"
            >
                {/* Header */}
                <div className="text-center mb-6">
                    {config.logo && (
                        <img
                            src={config.logo}
                            alt="Logo"
                            className="h-20 w-auto mx-auto mb-3 object-contain grayscale filters-contrast-125"
                        />
                    )}
                    <h1 className="text-xl font-bold uppercase tracking-wide">{config.shopName}</h1>
                    <p className="text-xs mt-1.5 whitespace-pre-wrap leading-relaxed">{config.address}</p>
                    {config.taxId && <p className="text-xs mt-1.5">TAX ID: {config.taxId}</p>}
                </div>

                {/* Meta */}
                <div className="border-b-2 border-black pb-2 mb-3 text-xs font-medium">
                    <div className="flex justify-between mb-1">
                        <span>วันที่:</span>
                        <span>{formatDate(displayDate)}</span>
                    </div>
                    {id && (
                        <div className="flex justify-between">
                            <span>เลขที่:</span>
                            <span>{id.slice(0, 8).toUpperCase()}</span>
                        </div>
                    )}
                </div>

                {/* Items */}
                <div className="min-h-[50px] mb-4">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b border-black border-dashed">
                                <th className="text-left py-1.5 w-8">ด.</th>
                                <th className="text-left py-1.5">รายการ</th>
                                <th className="text-right py-1.5 w-16">ราคา</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id} className="align-top">
                                    <td className="py-1.5">{item.qty}</td>
                                    <td className="py-1.5 pr-1">{item.name}</td>
                                    <td className="py-1.5 text-right">{formatCurrency(item.price * item.qty).replace('฿', '')}</td>
                                </tr>
                            ))}
                            {items.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="text-center py-6 text-gray-400 italic">-- ไม่มีรายการ --</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Totals */}
                <div className="border-t-2 border-black border-dashed pt-3 space-y-1">
                    {effectiveDiscount > 0 && (
                        <>
                            <div className="flex justify-between text-xs">
                                <span>รวมเป็นเงิน</span>
                                <span>{formatCurrency(effectiveSubtotal)}</span>
                            </div>
                            <div className="flex justify-between text-xs text-black/70">
                                <span>ส่วนลด</span>
                                <span>-{formatCurrency(effectiveDiscount)}</span>
                            </div>
                        </>
                    )}

                    {effectiveTax > 0 && (
                        <div className="flex justify-between text-xs text-black/70">
                            <span>VAT {taxRate ?? 7}%</span>
                            <span>{formatCurrency(effectiveTax)}</span>
                        </div>
                    )}

                    <div className="flex justify-between font-bold text-lg items-end pt-2 border-t border-black border-dashed mt-2">
                        <span>ยอดสุทธิ</span>
                        <span>{formatCurrency(total)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] mt-1 text-center w-full justify-center">
                        <span>(ราคารวมภาษีมูลค่าเพิ่มแล้ว)</span>
                    </div>
                </div>
            </div>
        );
    }
);

ReceiptPreview.displayName = 'ReceiptPreview';
