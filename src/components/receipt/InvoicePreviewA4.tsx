import React from 'react';
import { useConfigStore } from '../../store/useConfigStore';
import type { DocumentType, ReceiptItem } from '../../types';
import { formatCurrency, formatDate } from '../../utils/format';
import { thaiBahtText } from '../../utils/thaiBaht';
import { calcLineTotal } from '../../utils/calculations';

const ITEMS_PER_PAGE = 10;

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
    documentType?: DocumentType;
    isOriginal?: boolean;
    watermarkText?: string;
    proposerName?: string;
    remarks?: string;
    // Pagination props
    pageNumber?: number;
    totalPages?: number;
    startIndex?: number;
    isLastPage?: boolean;
}

const formatPlainMoney = (amount: number) => formatCurrency(amount).replace('฿', '').trim();

const formatQty = (qty: number) => Number.isInteger(qty) ? String(qty) : String(qty);

export const InvoicePreviewA4 = React.memo(React.forwardRef<HTMLDivElement, InvoiceA4Props>((props, ref) => {
    const {
        items = [],
        total = 0,
        subtotal,
        discount,
        tax,
        taxRate,
        date,
        id,
        customerName,
        customerAddress,
        documentType = 'receipt',
        isOriginal = true,
        watermarkText,
        proposerName,
        remarks,
        pageNumber = 1,
        totalPages = 1,
        startIndex = 0,
        isLastPage = true,
    } = props;

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
            case 'quotation': return 'ใบเสนอราคา / Quotation';
            default: return 'ใบเสร็จรับเงิน / Receipt';
        }
    };

    // Fill empty rows to maintain consistent page height
    const emptyRowCount = Math.max(0, ITEMS_PER_PAGE - items.length);

    if (documentType === 'quotation') {
        const validUntil = new Date(new Date(displayDate).getTime() + 30 * 24 * 60 * 60 * 1000);

        return (
            <div
                ref={ref}
                className="bg-white w-full max-w-[210mm] h-[297mm] mx-auto px-[10mm] pt-[10mm] pb-[8mm] relative text-slate-800 font-sans leading-normal shadow-sm print:shadow-none print:w-full print:max-w-none box-border flex flex-col overflow-hidden"
            >
                <div className="flex justify-between gap-8 pb-5 border-b-2 border-slate-900 shrink-0">
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                        {config.logo && (
                            <div className="h-[76px] w-[76px] border border-slate-300 rounded-xl flex items-center justify-center shrink-0 bg-slate-50 overflow-hidden">
                                <img
                                    src={config.logo}
                                    alt="Logo"
                                    className="h-full w-full object-contain p-1"
                                />
                            </div>
                        )}
                        <div className="min-w-0 pt-1">
                            <h1 className="text-[22px] font-bold text-slate-800 leading-tight">{config.shopName}</h1>
                            <p className="text-[11px] text-slate-500 mt-2 whitespace-pre-wrap leading-snug max-w-[380px]">{config.shopAddress}</p>
                            {config.taxId && (
                                <p className="text-[11px] text-slate-600 mt-3 border-t border-slate-200 pt-2">
                                    เลขประจำตัวผู้เสียภาษี: <span className="font-medium">{config.taxId}</span>
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="w-[190px] shrink-0 text-right pt-1">
                        <h2 className="text-[34px] font-bold text-slate-800 leading-tight">ใบเสนอราคา</h2>
                        <div className="grid grid-cols-[74px_1fr] gap-y-2 mt-4 text-[12px] text-slate-700">
                            <span className="font-bold text-left">เลขที่</span>
                            <span className="font-mono font-bold">{id || 'QT-XXXX'}</span>
                            <span className="font-bold text-left">วันที่</span>
                            <span>{formatDate(displayDate).split(' ')[0]}</span>
                            <span className="font-bold text-left">ยืนราคาถึง</span>
                            <span>{formatDate(validUntil.toISOString()).split(' ')[0]}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-5 mt-6 mb-6 shrink-0">
                    <div className="border border-slate-300 rounded-2xl p-5 min-h-[132px] bg-slate-50/40">
                        <h3 className="text-[15px] font-bold text-slate-800 mb-4">เสนอราคาให้</h3>
                        {customerName ? (
                            <>
                                <p className="text-[14px] font-bold text-slate-900 leading-snug">{customerName}</p>
                                <p className="text-[12px] text-slate-600 whitespace-pre-wrap leading-snug mt-5">{customerAddress || '-'}</p>
                            </>
                        ) : (
                            <p className="text-[12px] text-slate-400 italic">ไม่ได้ระบุข้อมูลลูกค้า</p>
                        )}
                    </div>

                    <div className="border border-slate-300 rounded-2xl p-5 min-h-[132px] bg-slate-50/40">
                        <h3 className="text-[15px] font-bold text-slate-800 mb-4">เงื่อนไขการเสนอราคา</h3>
                        <p className="text-[12px] text-slate-600">ยืนราคาภายใน 30 วัน</p>
                    </div>
                </div>

                <h3 className="text-[15px] font-bold text-slate-800 mb-2">รายการสินค้า / บริการ</h3>
                <div className="shrink-0">
                    <table className="w-full border-collapse text-[11px]">
                        <thead>
                            <tr className="bg-slate-800 text-white">
                                <th className="border border-slate-800 py-2 px-2 text-center w-9">#</th>
                                <th className="border border-slate-800 py-2 px-3 text-left">รายละเอียด</th>
                                <th className="border border-slate-800 py-2 px-2 text-center w-20">จำนวน</th>
                                <th className="border border-slate-800 py-2 px-2 text-right w-24">ราคา/หน่วย</th>
                                <th className="border border-slate-800 py-2 px-2 text-right w-24">รวม</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, index) => (
                                <tr key={item.id} className="h-[42px]">
                                    <td className="border border-slate-300 text-center align-top pt-2 text-slate-700">{startIndex + index + 1}</td>
                                    <td className="border border-slate-300 px-3 py-2 align-top text-slate-700 leading-snug">{item.name}</td>
                                    <td className="border border-slate-300 px-2 py-2 text-center align-top text-slate-700">{formatQty(item.qty)}</td>
                                    <td className="border border-slate-300 px-2 py-2 text-right align-top font-mono text-slate-700">{formatPlainMoney(item.price)}</td>
                                    <td className="border border-slate-300 px-2 py-2 text-right align-top font-mono font-bold text-slate-700">{formatPlainMoney(calcLineTotal(item.price, item.qty))}</td>
                                </tr>
                            ))}

                            {items.length === 0 && (
                                <tr className="h-[44px]">
                                    <td colSpan={5} className="border border-slate-300 text-center text-slate-400 italic">ไม่มีรายการสินค้า</td>
                                </tr>
                            )}

                            {!isLastPage && (
                                <tr>
                                    <td colSpan={5} className="border border-slate-300 py-3 text-center text-slate-400 italic">
                                        ต่อหน้าถัดไป / Continued on next page
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {isLastPage && (
                    <>
                        <div className="grid grid-cols-[1.15fr_0.85fr] gap-5 mt-6">
                            <div className="border border-slate-300 rounded-2xl p-5 min-h-[120px] bg-slate-50/50">
                                <h3 className="text-[15px] font-bold text-slate-800 mb-3">หมายเหตุเพิ่มเติม</h3>
                                <div className="text-[12px] text-slate-600 leading-relaxed space-y-1">
                                    {(remarks || '').split('\n').map((line, i) => (
                                        <p key={i}>{line}</p>
                                    ))}
                                </div>
                            </div>

                            <div className="border border-slate-300 rounded-2xl overflow-hidden self-start">
                                <div className="px-5 py-3 space-y-2 text-[13px]">
                                    <div className="flex justify-between gap-4">
                                        <span className="font-bold text-slate-700">ยอดรวม</span>
                                        <span className="font-mono font-bold">{formatPlainMoney(effectiveSubtotal)}</span>
                                    </div>
                                    {effectiveDiscount > 0 && (
                                        <div className="flex justify-between gap-4 text-red-600">
                                            <span className="font-bold">ส่วนลด</span>
                                            <span className="font-mono font-bold">-{formatPlainMoney(effectiveDiscount)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between gap-4">
                                        <span className="font-bold text-slate-700">VAT {taxRate ?? 0}%</span>
                                        <span className="font-mono font-bold">{formatPlainMoney(effectiveTax)}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between gap-4 bg-slate-800 text-white px-5 py-4 text-[16px] font-bold">
                                    <span>รวมทั้งสิ้น</span>
                                    <span className="font-mono">{formatPlainMoney(total)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-10 mt-14 text-center text-[12px] text-slate-600">
                            <div>
                                <div className="h-10 mb-2 flex items-end justify-center font-semibold text-slate-700">
                                    {proposerName}
                                </div>
                                <div className="border-t border-slate-400 pt-3 mx-6">
                                    <p className="font-bold text-slate-800">ผู้เสนอราคา</p>
                                    <p className="text-[10px] text-slate-400 mt-1">ลงชื่อ / วันที่</p>
                                </div>
                            </div>
                            <div>
                                <div className="h-10 mb-2"></div>
                                <div className="border-t border-slate-400 pt-3 mx-6">
                                    <p className="font-bold text-slate-800">ผู้อนุมัติ / ผู้สั่งซื้อ</p>
                                    <p className="text-[10px] text-slate-400 mt-1">ลงชื่อ / วันที่</p>
                                </div>
                            </div>
                        </div>

                        <p className="mt-auto text-center text-[11px] text-slate-400 pt-8">
                            ขอบคุณที่ไว้วางใจใช้บริการ
                        </p>
                    </>
                )}

                <div className="absolute right-[12mm] bottom-[8mm] text-[11px] text-slate-400">
                    หน้า {pageNumber}/{totalPages}
                </div>
            </div>
        );
    }

    return (
        <div
            ref={ref}
            className="bg-white w-full max-w-[210mm] h-[297mm] mx-auto p-4 relative text-gray-800 font-sans leading-relaxed shadow-sm print:shadow-none print:w-full print:max-w-none box-border flex flex-col"
        >
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden opacity-60">
                <div className="transform -rotate-45 text-gray-200 text-9xl font-bold whitespace-nowrap select-none border-4 border-gray-200 p-4 rounded-3xl">
                    {watermarkText || config.defaultWatermark || config.shopName || ''}
                </div>
            </div>

            {/* Header — shown on every page */}
            <div className="flex justify-between items-start mb-4 shrink-0 relative z-10">
                <div className="flex gap-4">
                    {config.logo && (
                        <img src={config.logo} alt="Logo" className="h-16 w-16 object-contain" />
                    )}
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 mb-0.5">{config.shopName}</h1>
                        <p className="text-xs text-gray-500 max-w-sm whitespace-pre-wrap leading-tight">{config.shopAddress}</p>
                        {config.taxId && <p className="text-xs text-gray-500 mt-0.5">เลขประจำตัวผู้เสียภาษี: {config.taxId}</p>}
                    </div>
                </div>
                <div className="text-right z-10 relative">
                    <h2 className="text-xl font-bold mb-2 text-gray-900">{getDocumentTitle()}</h2>
                    <div className="bg-blue-50/50 rounded-lg p-2 border border-blue-100 min-w-[200px]">
                        <div className="flex justify-between text-sm mb-1">
                            <span className="font-bold text-blue-800">เลขที่:</span>
                            <span className="font-mono text-blue-600 font-bold">{id || 'INV-XXXX'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">วันที่:</span>
                            <span>{formatDate(displayDate)}</span>
                        </div>
                        <div className="flex justify-between text-xs mt-1 border-t border-blue-100 pt-1">
                            <span className="font-semibold text-blue-400">{isOriginal ? 'ต้นฉบับ / Original' : 'สำเนา / Copy'}</span>
                            <span className="font-semibold text-gray-400">หน้า {pageNumber}/{totalPages}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Customer Info — shown only on first page */}
            {pageNumber === 1 && (
                <div className="mb-4 border border-blue-100 rounded-xl bg-blue-50/30 p-3 shrink-0 relative z-10">
                    <h3 className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1">ข้อมูลลูกค้า / CUSTOMER INFO</h3>
                    {customerName ? (
                        <>
                            <p className="text-base font-bold text-gray-800 mb-0.5">{customerName}</p>
                            <p className="text-sm text-gray-600">{customerAddress || '-'}</p>
                        </>
                    ) : (
                        <p className="text-sm text-gray-400 italic">ไม่ได้ระบุข้อมูลลูกค้า</p>
                    )}
                </div>
            )}

            {/* Items Table — grows to fill available space */}
            <div className="flex-1 mb-4 relative z-10">
                <table className="w-full text-sm border-b border-gray-200">
                    <thead>
                        <tr className="bg-gray-100 text-gray-700 border-y border-gray-200 print:bg-gray-100 print:text-gray-900 print:border-gray-300">
                            <th className="py-2.5 px-3 text-center w-14 rounded-l-lg">ลำดับ</th>
                            <th className="py-2.5 px-3 text-left">รายละเอียด / Description</th>
                            <th className="py-2.5 px-3 text-center w-16">จำนวน</th>
                            <th className="py-2.5 px-3 text-center w-16">หน่วย</th>
                            <th className="py-2.5 px-3 text-right w-24">หน่วยละ</th>
                            <th className="py-2.5 px-3 text-right w-28 rounded-r-lg">รวมเงิน (บาท)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {items.map((item, index) => (
                            <tr key={item.id} className="h-[38px]">
                                <td className="px-3 text-center text-gray-400 font-mono align-middle">{startIndex + index + 1}</td>
                                <td className="px-3 font-medium text-gray-700 align-middle">
                                    <span className="line-clamp-2">{item.name}</span>
                                </td>
                                <td className="px-3 text-center bg-gray-50/50 font-mono align-middle">{item.qty}</td>
                                <td className="px-3 text-center text-gray-500 align-middle">{item.unit || 'ชิ้น'}</td>
                                <td className="px-3 text-right text-gray-600 font-mono align-middle">{formatCurrency(item.price).replace('฿', '')}</td>
                                <td className="px-3 text-right font-bold text-gray-800 font-mono align-middle">{formatCurrency(calcLineTotal(item.price, item.qty)).replace('฿', '')}</td>
                            </tr>
                        ))}
                        {/* Empty rows to fill the page */}
                        {Array.from({ length: emptyRowCount }).map((_, i) => (
                            <tr key={`empty-${i}`} className="h-[38px]">
                                <td className="px-3 text-center text-gray-200 align-middle">-</td>
                                <td className="px-3"></td>
                                <td className="px-3 bg-gray-50/30"></td>
                                <td className="px-3"></td>
                                <td className="px-3"></td>
                                <td className="px-3"></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer — depends on whether this is the last page */}
            <div className="shrink-0 mt-auto relative z-10">
                {isLastPage ? (
                    <>
                        {/* Totals */}
                        <div className="flex items-start gap-8 border-t-2 border-gray-900 pt-4">
                            {/* Left: Text Total */}
                            <div className="flex-1 bg-gray-50 rounded-lg p-3">
                                <span className="text-xs text-gray-500">ตัวอักษร:</span>
                                <p className="font-bold text-gray-800 italic mt-1 text-sm">{thaiBahtText(total)}</p>
                            </div>

                            {/* Right: Numbers */}
                            <div className="w-1/3 min-w-[220px]">
                                <div className="flex justify-between mb-1.5 text-gray-600 text-sm">
                                    <span>รวมยอดเงิน (Subtotal)</span>
                                    <span className="font-mono">{formatCurrency(effectiveSubtotal)}</span>
                                </div>
                                {effectiveDiscount > 0 && (
                                    <div className="flex justify-between mb-1.5 text-red-500 text-sm">
                                        <span>ส่วนลด (Discount)</span>
                                        <span className="font-mono">-{formatCurrency(effectiveDiscount)}</span>
                                    </div>
                                )}
                                {effectiveTax > 0 && (
                                    <div className="flex justify-between mb-2 text-gray-600 text-sm">
                                        <span>ภาษีมูลค่าเพิ่ม {taxRate}% (VAT)</span>
                                        <span className="font-mono">{formatCurrency(effectiveTax)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center bg-blue-600 text-white p-3 rounded-lg shadow-lg shadow-blue-200 print:shadow-none print:text-black print:bg-gray-100">
                                    <span className="font-bold text-base">ยอดสุทธิ</span>
                                    <span className="font-bold text-xl font-mono">{formatCurrency(total)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Signatures */}
                        <div className="flex justify-between mt-16 pb-0 break-inside-avoid">
                            <div className="text-center w-56 pt-6 border-t border-gray-300">
                                <p className="text-sm font-bold text-gray-700">ผู้รับเงิน / Receiver</p>
                                <p className="text-xs text-gray-400 mt-1">วันที่ ______________</p>
                            </div>
                            <div className="text-center w-56 pt-6 border-t border-gray-300">
                                <p className="text-sm font-bold text-gray-700">ผู้มีอำนาจลงนาม / Authorized</p>
                                <p className="text-xs text-gray-400 mt-1">วันที่ ______________</p>
                            </div>
                        </div>
                    </>
                ) : (
                    /* Intermediate page footer */
                    <div className="border-t-2 border-gray-300 pt-3 flex justify-between items-center">
                        <p className="text-sm text-gray-400 italic">— (ต่อหน้าถัดไป / Continued on next page) —</p>
                        <p className="text-xs text-gray-300">หน้า {pageNumber}/{totalPages}</p>
                    </div>
                )}
            </div>
        </div>
    );
}));

InvoicePreviewA4.displayName = 'InvoicePreviewA4';
