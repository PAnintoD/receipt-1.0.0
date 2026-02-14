import React from 'react';
import { useReceiptStore } from '../store/useReceiptStore';
import { formatDate, formatCurrency } from '../utils/format';
import { Printer, Trash2, Eye, Search, FileText, X } from 'lucide-react';
import { InvoicePreviewA4 } from '../components/receipt/InvoicePreviewA4';
import type { Receipt } from '../types';

const History = () => {
    const { history, deleteReceipt } = useReceiptStore();
    const [selectedReceipt, setSelectedReceipt] = React.useState<Receipt | null>(null);
    const [searchTerm, setSearchTerm] = React.useState('');

    const [printReceipt, setPrintReceipt] = React.useState<Receipt | null>(null);

    const handlePrint = (receipt: Receipt) => {
        setPrintReceipt(null); // Force re-render if same receipt
        setTimeout(() => {
            setPrintReceipt(receipt);
            setTimeout(() => window.print(), 500);
        }, 50);
    };

    const safeHistory = Array.isArray(history) ? history : [];
    const filteredHistory = safeHistory.filter(h =>
        (h.id?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (h.items || []).some(i => (i.name || '').toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="animate-fade-in-up h-full flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 shrink-0 print:hidden">
                {/* ... Header content ... */}
                <div>
                    <h2 className="text-3xl font-bold text-gray-800 tracking-tight">ประวัติการขาย</h2>
                    <p className="text-gray-500 mt-1">เรียกดูและจัดการบิลย้อนหลังทั้งหมดของคุณ</p>
                </div>

                <div className="relative w-full md:w-64 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="ค้นหาเลขบิล หรือชื่อสินค้า..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex-1 flex flex-col min-h-0 overflow-hidden print:hidden">
                {/* Desktop View */}
                <div className="hidden md:block overflow-auto flex-1">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10 backdrop-blur-sm bg-gray-50/90">
                            <tr>
                                <th className="px-6 py-4 text-left font-bold text-gray-600">วันที่</th>
                                <th className="px-6 py-4 text-left font-bold text-gray-600">เลขบิล</th>
                                <th className="px-6 py-4 text-left font-bold text-gray-600">รายการสินค้า (ตัวอย่าง)</th>
                                <th className="px-6 py-4 text-right font-bold text-gray-600">ยอดรวม</th>
                                <th className="px-6 py-4 text-center font-bold text-gray-600">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredHistory.map((receipt) => (
                                <tr key={receipt.id} className="hover:bg-blue-50/50 transition-colors group">
                                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-900">{formatDate(receipt.date).split(' ')[0]}</span>
                                            <span className="text-xs text-gray-400">{new Date(receipt.date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs text-gray-500">
                                        <span className="bg-gray-100 px-2 py-1 rounded text-gray-600 font-medium">#{receipt.id.toUpperCase()}</span>
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
                                        <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => setSelectedReceipt(receipt)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100" title="ดูรายละเอียด">
                                                <Eye size={16} />
                                            </button>
                                            <button onClick={() => handlePrint(receipt)} className="p-2 text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-100" title="พิมพ์ใบเสร็จ">
                                                <Printer size={16} />
                                            </button>
                                            <button onClick={() => { if (confirm('คุณแน่ใจหรือไม่ที่จะลบบิลนี้?')) deleteReceipt(receipt.id) }} className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100" title="ลบรายการ">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredHistory.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center text-gray-400">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                                                <FileText size={32} />
                                            </div>
                                            <p className="font-medium">ไม่พบรายการขาย</p>
                                            <p className="text-sm mt-1 text-gray-400">ลองค้นหาด้วยคำอื่น หรือสร้างใบเสร็จใหม่</p>
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
                            <div key={receipt.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 active:scale-[0.99] transition-transform">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-gray-900 text-lg">{formatCurrency(receipt.total)}</span>
                                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-mono">#{receipt.id}</span>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">{formatDate(receipt.date)}</p>
                                    </div>

                                </div>

                                <div className="py-3 border-t border-b border-gray-50 mb-3">
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

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setSelectedReceipt(receipt)}
                                        className="flex-1 py-2 text-blue-600 bg-blue-50 rounded-lg text-sm font-medium hover:bg-blue-100 flex items-center justify-center gap-2"
                                    >
                                        <Eye size={16} /> ดู
                                    </button>
                                    <button
                                        onClick={() => handlePrint(receipt)}
                                        className="flex-1 py-2 text-gray-600 bg-gray-50 rounded-lg text-sm font-medium hover:bg-gray-100 flex items-center justify-center gap-2"
                                    >
                                        <Printer size={16} /> พิมพ์
                                    </button>
                                    <button
                                        onClick={() => { if (confirm('คุณแน่ใจหรือไม่ที่จะลบบิลนี้?')) deleteReceipt(receipt.id) }}
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
                            <p className="font-medium">ไม่พบรายการขาย</p>
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
                            <h3 className="text-lg font-bold text-gray-800">รายละเอียดใบเสร็จ</h3>
                            <button
                                onClick={() => setSelectedReceipt(null)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="overflow-y-auto flex-1 flex justify-center bg-gray-100/50 rounded-xl p-6 custom-scrollbar">
                            <div className="shadow-lg">
                                <InvoicePreviewA4
                                    items={selectedReceipt.items}
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
                                />
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

            {/* Hidden Print Container - Visible ONLY during print */}
            <div id="printable-receipt" className="hidden print:block print:fixed print:inset-0 print:bg-white print:z-[9999]">
                {printReceipt && (
                    <InvoicePreviewA4
                        items={printReceipt.items}
                        total={printReceipt.total}
                        subtotal={printReceipt.subtotal}
                        discount={printReceipt.discount}
                        tax={printReceipt.tax}
                        taxRate={printReceipt.taxRate}
                        date={printReceipt.date}
                        id={printReceipt.id}
                        customerName={printReceipt.customerName}
                        customerAddress={printReceipt.customerAddress}
                        documentType={printReceipt.documentType}
                        isOriginal={printReceipt.isOriginal}
                        watermarkText={printReceipt.watermarkText}
                    />
                )}
            </div>
        </div>
    );
};

export default History;
