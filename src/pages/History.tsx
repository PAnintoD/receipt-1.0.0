import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useReceiptStore } from '../store/useReceiptStore';
import { formatDate, formatCurrency, formatTime } from '../utils/format';
import { Printer, Trash2, Eye, Search, FileText, X, Filter, Pencil } from 'lucide-react';
import { InvoicePreviewA4 } from '../components/receipt/InvoicePreviewA4';
import { PrintPortal } from '../components/PrintPortal';
import type { DocumentType, Receipt } from '../types';

const ITEMS_PER_PAGE = 10;
const EMPTY_RECEIPTS: Receipt[] = [];

/** Split an array into chunks of a given size */
function chunkArray<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks.length > 0 ? chunks : [[]];
}

type DocTypeFilter = 'all' | DocumentType;

const DOC_TYPE_LABELS: Record<DocTypeFilter, string> = {
    all: 'ทั้งหมด',
    receipt: 'ใบเสร็จรับเงิน',
    tax_invoice: 'ใบกำกับภาษี',
    delivery_note: 'ใบส่งของ',
    quotation: 'ใบเสนอราคา',
};

const DOC_TYPE_BADGE_LABEL: Record<string, string> = {
    receipt: 'ใบเสร็จ',
    tax_invoice: 'ใบกำกับภาษี',
    delivery_note: 'ใบส่งของ',
    quotation: 'ใบเสนอราคา',
};

const DOC_TYPE_COLORS: Record<string, string> = {
    receipt: 'bg-green-100 text-green-700',
    tax_invoice: 'bg-blue-100 text-blue-700',
    delivery_note: 'bg-orange-100 text-orange-700',
    quotation: 'bg-indigo-100 text-indigo-700',
};

const History = () => {
    const { history, deleteReceipt, loadReceipt } = useReceiptStore();
    const navigate = useNavigate();
    const [selectedReceipt, setSelectedReceipt] = React.useState<Receipt | null>(null);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [docTypeFilter, setDocTypeFilter] = React.useState<DocTypeFilter>('all');

    const [printQueue, setPrintQueue] = React.useState<Receipt[]>([]);
    const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

    const handlePrint = (receipt: Receipt) => {
        setPrintQueue([receipt]);
        // Wait for React to render the portal content, then print
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                window.print();
            });
        });
    };

    const handlePrintAll = () => {
        let receiptsToPrint: Receipt[] = [];

        if (selectedIds.size > 0) {
            // Print only selected
            receiptsToPrint = safeHistory.filter(h => selectedIds.has(h.id));
        } else {
            // Print all filtered
            receiptsToPrint = filteredHistory;
        }

        if (receiptsToPrint.length === 0) return;

        if (receiptsToPrint.length > 50) {
            if (!confirm(`คุณต้องการพิมพ์ทั้งหมด ${receiptsToPrint.length} รายการใช่หรือไม่? อาจใช้เวลานานและกระดาษจำนวนมาก`)) {
                return;
            }
        }

        setPrintQueue(receiptsToPrint);
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                window.print();
            });
        });
    };

    const handleEdit = (receipt: Receipt) => {
        loadReceipt(receipt);
        navigate('/new');
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredHistory.length && filteredHistory.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredHistory.map(h => h.id)));
        }
    };

    const toggleSelect = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const safeHistory = Array.isArray(history) ? history : EMPTY_RECEIPTS;

    // Count by type (for badge numbers)
    const typeCounts = (() => {
        const counts: Record<DocTypeFilter, number> = { all: safeHistory.length, receipt: 0, tax_invoice: 0, delivery_note: 0, quotation: 0 };
        safeHistory.forEach(h => {
            const t = h.documentType || 'receipt';
            if (counts[t] !== undefined) counts[t]++;
        });
        return counts;
    })();

    // Apply type filter first, then search
    const filteredHistory = (() => {
        const normalizedSearch = searchTerm.toLowerCase();
        return safeHistory
            .filter(h => docTypeFilter === 'all' || (h.documentType || 'receipt') === docTypeFilter)
            .filter(h =>
                (h.id?.toLowerCase() || '').includes(normalizedSearch) ||
                (h.customerName?.toLowerCase() || '').includes(normalizedSearch) ||
                (h.items || []).some(i => (i.name || '').toLowerCase().includes(normalizedSearch))
            );
    })();

    // Pagination for selected receipt (modal preview)
    const selectedPages = React.useMemo(() => {
        if (!selectedReceipt) return [[]];
        return chunkArray(selectedReceipt.items || [], ITEMS_PER_PAGE);
    }, [selectedReceipt]);

    return (
        <div className="animate-fade-in-up h-full flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 shrink-0 print:hidden">
                {/* ... Header content ... */}
                <div>
                    <h2 className="text-3xl font-bold text-gray-800 tracking-tight">ประวัติเอกสาร</h2>
                    <p className="text-gray-500 mt-1">เรียกดูและจัดการเอกสารย้อนหลังทั้งหมดของคุณ</p>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="ค้นหาเลขเอกสาร ลูกค้า หรือชื่อสินค้า..."
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all shadow-sm"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setSelectedIds(new Set()); // Reset selection on search
                            }}
                        />
                    </div>
                    {filteredHistory.length > 0 && (
                        <button
                            onClick={handlePrintAll}
                            className={`px-4 py-2.5 text-white rounded-xl shadow-lg transition-all flex items-center gap-2 font-medium shrink-0 ${selectedIds.size > 0
                                ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 hover:shadow-indigo-300'
                                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 hover:shadow-blue-300'
                                }`}
                        >
                            <Printer size={18} />
                            <span className="hidden sm:inline">
                                {selectedIds.size > 0 ? `พิมพ์ที่เลือก (${selectedIds.size})` : `พิมพ์ทั้งหมด (${filteredHistory.length})`}
                            </span>
                        </button>
                    )}
                </div>
            </div>

            {/* Document type filter tabs */}
            <div className="flex items-center gap-2 mb-4 shrink-0 print:hidden overflow-x-auto pb-1">
                <Filter size={16} className="text-gray-400 shrink-0" />
                {(Object.keys(DOC_TYPE_LABELS) as DocTypeFilter[]).map(type => (
                    <button
                        key={type}
                        onClick={() => {
                            setDocTypeFilter(type);
                            setSelectedIds(new Set()); // Reset on filter change
                        }}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${docTypeFilter === type
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        {DOC_TYPE_LABELS[type]}
                        <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${docTypeFilter === type
                            ? 'bg-white/20 text-white'
                            : 'bg-gray-100 text-gray-500'
                            }`}>
                            {typeCounts[type]}
                        </span>
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex-1 flex flex-col min-h-0 overflow-hidden print:hidden">
                {/* Desktop View */}
                <div className="hidden md:block overflow-auto flex-1">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10 backdrop-blur-sm bg-gray-50/90">
                            <tr>
                                <th className="px-6 py-4 w-12 text-center">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        checked={filteredHistory.length > 0 && selectedIds.size === filteredHistory.length}
                                        ref={input => {
                                            if (input) {
                                                input.indeterminate = selectedIds.size > 0 && selectedIds.size < filteredHistory.length;
                                            }
                                        }}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                                <th className="px-6 py-4 text-left font-bold text-gray-600">วันที่</th>
                                <th className="px-6 py-4 text-left font-bold text-gray-600">เลขบิล</th>
                                <th className="px-6 py-4 text-left font-bold text-gray-600">ประเภท</th>
                                <th className="px-6 py-4 text-left font-bold text-gray-600">รายการสินค้า (ตัวอย่าง)</th>
                                <th className="px-6 py-4 text-right font-bold text-gray-600">ยอดรวม</th>
                                <th className="px-6 py-4 text-center font-bold text-gray-600">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredHistory.map((receipt) => (
                                <tr
                                    key={receipt.id}
                                    className={`hover:bg-blue-50/50 transition-colors group cursor-pointer ${selectedIds.has(receipt.id) ? 'bg-blue-50/30' : ''}`}
                                    onClick={(e) => {
                                        // Toggle select on row click unless clicking buttons/action area
                                        if (!(e.target as HTMLElement).closest('button, a, input[type="checkbox"]')) {
                                            toggleSelect(receipt.id);
                                        }
                                    }}
                                >
                                    <td className="px-6 py-4 text-center">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                            checked={selectedIds.has(receipt.id)}
                                            onChange={() => toggleSelect(receipt.id)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-900">{formatDate(receipt.date).split(' ')[0]}</span>
                                            <span className="text-xs text-gray-400">{formatTime(receipt.date)}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs text-gray-500">
                                        <span className="bg-gray-100 px-2 py-1 rounded text-gray-600 font-medium">#{receipt.id.toUpperCase()}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${DOC_TYPE_COLORS[receipt.documentType || 'receipt'] || 'bg-gray-100 text-gray-600'}`}>
                                            {DOC_TYPE_BADGE_LABEL[receipt.documentType || 'receipt'] || 'ใบเสร็จ'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 max-w-xs truncate">
                                        {receipt.items && receipt.items.length > 0 ? (
                                            <span className="flex items-center gap-2">
                                                <span className="truncate">{receipt.items[0].name}</span>
                                                {receipt.items.length > 1 && <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">+{receipt.items.length - 1}</span>}
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-gray-900">{formatCurrency(receipt.total)}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center gap-2 transition-opacity">
                                            <button onClick={(e) => { e.stopPropagation(); setSelectedReceipt(receipt); }} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100" title="ดูรายละเอียด">
                                                <Eye size={16} />
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); handleEdit(receipt); }} className="p-2 text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors border border-orange-100" title="แก้ไข">
                                                <Pencil size={16} />
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); handlePrint(receipt); }} className="p-2 text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-100" title="พิมพ์เอกสาร">
                                                <Printer size={16} />
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); if (confirm('คุณแน่ใจหรือไม่ที่จะลบบิลนี้?')) deleteReceipt(receipt.id); }} className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100" title="ลบรายการ">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredHistory.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-20 text-center text-gray-400">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                                                <FileText size={32} />
                                            </div>
                                            <p className="font-medium">ไม่พบเอกสาร</p>
                                            <p className="text-sm mt-1 text-gray-400">ลองค้นหาด้วยคำอื่น หรือสร้างเอกสารใหม่</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View (Cards) */}
                <div className="md:hidden flex-1 overflow-auto p-4 space-y-4 bg-gray-50/50">
                    {filteredHistory.length > 0 ? (
                        filteredHistory.map((receipt) => (
                            <div
                                key={receipt.id}
                                className={`bg-white rounded-xl p-4 shadow-sm border active:scale-[0.99] transition-transform ${selectedIds.has(receipt.id) ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-100'}`}
                                onClick={() => toggleSelect(receipt.id)}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-start gap-3">
                                        <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                checked={selectedIds.has(receipt.id)}
                                                onChange={() => toggleSelect(receipt.id)}
                                            />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-gray-900 text-lg">{formatCurrency(receipt.total)}</span>
                                                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-mono">#{receipt.id}</span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <p className="text-xs text-gray-400">{formatDate(receipt.date)}</p>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${DOC_TYPE_COLORS[receipt.documentType || 'receipt'] || 'bg-gray-100 text-gray-600'}`}>
                                                    {DOC_TYPE_BADGE_LABEL[receipt.documentType || 'receipt'] || 'ใบเสร็จ'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="py-3 border-t border-b border-gray-50 mb-3 pl-8">
                                    <div className="text-sm text-gray-600">
                                        {receipt.items && receipt.items.length > 0 ? (
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{receipt.items[0].name}</span>
                                                {receipt.items.length > 1 && (
                                                    <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">
                                                        +{receipt.items.length - 1} รายการ
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 italic">ไม่มีรายการสินค้า</span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-2 pl-8">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setSelectedReceipt(receipt); }}
                                        className="flex-1 py-2 text-blue-600 bg-blue-50 rounded-lg text-sm font-medium hover:bg-blue-100 flex items-center justify-center gap-2"
                                    >
                                        <Eye size={16} /> ดู
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleEdit(receipt); }}
                                        className="flex-1 py-2 text-orange-600 bg-orange-50 rounded-lg text-sm font-medium hover:bg-orange-100 flex items-center justify-center gap-2"
                                    >
                                        <Pencil size={16} /> แก้ไข
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handlePrint(receipt); }}
                                        className="flex-1 py-2 text-gray-600 bg-gray-50 rounded-lg text-sm font-medium hover:bg-gray-100 flex items-center justify-center gap-2"
                                    >
                                        <Printer size={16} /> พิมพ์
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); if (confirm('คุณแน่ใจหรือไม่ที่จะลบบิลนี้?')) deleteReceipt(receipt.id); }}
                                        className="px-3 py-2 text-red-500 bg-red-50 rounded-lg hover:bg-red-100"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                            <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-300">
                                <Search size={24} />
                            </div>
                            <p className="font-medium">ไม่พบเอกสาร</p>
                        </div>
                    )}
                </div>

                <div className="hidden md:block bg-gray-50 border-t border-gray-100 p-3 text-xs text-gray-500 text-center">
                    แสดงทั้งหมด {filteredHistory.length} รายการ
                </div>
            </div>

            {/* Modal - Hidden during print */}
            {selectedReceipt && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 print:hidden animate-fade-in">
                    <div
                        className="bg-white rounded-2xl p-6 max-w-4xl w-full shadow-2xl relative flex flex-col max-h-[90vh] scale-100 animate-scale-in"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-800">
                                รายละเอียดเอกสาร
                                {selectedPages.length > 1 && (
                                    <span className="ml-2 text-sm font-normal text-gray-400">({selectedPages.length} หน้า)</span>
                                )}
                            </h3>
                            <button
                                onClick={() => setSelectedReceipt(null)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Scrollable Content — all pages stacked */}
                        <div className="overflow-y-auto flex-1 flex justify-center bg-gray-100/50 rounded-xl p-6 custom-scrollbar">
                            <div className="space-y-8">
                                {selectedPages.map((pageItems, pageIdx) => (
                                    <div key={pageIdx} className="shadow-lg">
                                        <InvoicePreviewA4
                                            items={pageItems}
                                            total={selectedReceipt.total}
                                            subtotal={selectedReceipt.subtotal}
                                            discount={selectedReceipt.discount}
                                            tax={selectedReceipt.tax}
                                            taxRate={selectedReceipt.taxRate}
                                            date={selectedReceipt.date}
                                            id={selectedReceipt.id}
                                            customerName={selectedReceipt.customerName}
                                            customerAddress={selectedReceipt.customerAddress}
                                            documentType={selectedReceipt.documentType}
                                            isOriginal={selectedReceipt.isOriginal}
                                            watermarkText={selectedReceipt.watermarkText}
                                            proposerName={selectedReceipt.proposerName}
                                            remarks={selectedReceipt.remarks}
                                            pageNumber={pageIdx + 1}
                                            totalPages={selectedPages.length}
                                            startIndex={pageIdx * ITEMS_PER_PAGE}
                                            isLastPage={pageIdx === selectedPages.length - 1}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="mt-4 flex justify-end gap-3 pt-4 border-t border-gray-100">
                            <button onClick={() => setSelectedReceipt(null)} className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors">ปิด</button>
                            <button onClick={() => handlePrint(selectedReceipt)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors shadow-lg shadow-blue-200 hover:shadow-blue-300 transform hover:-translate-y-0.5">
                                <Printer size={18} /> พิมพ์
                            </button>
                        </div>
                    </div>

                    {/* Background click to close */}
                    <div className="absolute inset-0 z-[-1]" onClick={() => setSelectedReceipt(null)}></div>
                </div>
            )}

            {/* Print Container — rendered via portal outside #root */}
            <PrintPortal>
                {printQueue.map((receipt, receiptIdx) => {
                    const pages = chunkArray(receipt.items || [], ITEMS_PER_PAGE);
                    const totalReceiptPages = pages.length;

                    return pages.map((pageItems, pageIdx) => {
                        // Check if this is the absolute last page of the entire print job
                        const isLastPageOfReceipt = pageIdx === totalReceiptPages - 1;
                        const isLastReceipt = receiptIdx === printQueue.length - 1;
                        const isAbsoluteLastPage = isLastReceipt && isLastPageOfReceipt;

                        // Only add break-after if it's NOT the last page of the last receipt
                        const shouldBreak = !isAbsoluteLastPage;

                        return (
                            <div
                                key={`${receipt.id}-${pageIdx}`}
                                style={shouldBreak ? { breakAfter: 'page' } : undefined}
                            >
                                <InvoicePreviewA4
                                    items={pageItems}
                                    total={receipt.total}
                                    subtotal={receipt.subtotal}
                                    discount={receipt.discount}
                                    tax={receipt.tax}
                                    taxRate={receipt.taxRate}
                                    date={receipt.date}
                                    id={receipt.id}
                                    customerName={receipt.customerName}
                                    customerAddress={receipt.customerAddress}
                                    documentType={receipt.documentType}
                                    isOriginal={receipt.isOriginal}
                                    watermarkText={receipt.watermarkText}
                                    proposerName={receipt.proposerName}
                                    remarks={receipt.remarks}
                                    pageNumber={pageIdx + 1}
                                    totalPages={totalReceiptPages}
                                    startIndex={pageIdx * ITEMS_PER_PAGE}
                                    isLastPage={isLastPageOfReceipt}
                                />
                            </div>
                        );
                    });
                })}
            </PrintPortal>
        </div>
    );
};

export default History;
