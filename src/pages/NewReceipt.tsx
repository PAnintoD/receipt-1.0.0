import React from 'react';
import { useReceiptStore } from '../store/useReceiptStore';
import { useConfigStore } from '../store/useConfigStore';
import { InvoicePreviewA4 } from '../components/receipt/InvoicePreviewA4';
import { PrintPortal } from '../components/PrintPortal';
import { User, MapPin, Printer, Save, Trash2, Plus, RefreshCw, ShoppingCart, Tag, Box, ChevronDown, Users, CalendarClock } from 'lucide-react';
import { formatCurrency, fromThaiDateTimeLocalValue, toThaiDateTimeLocalValue } from '../utils/format';
import { calcTotals } from '../utils/calculations';
import { clsx } from 'clsx';
import { DebouncedInput, DebouncedTextarea } from '../components/ui/DebouncedInput';
import type { DocumentType } from '../types';

const ITEMS_PER_PAGE = 10;

/** Split an array into chunks of a given size */
function chunkArray<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks.length > 0 ? chunks : [[]];
}

const NewReceipt = () => {
    const { currentItems, addItem, removeItem, clearCurrentReceipt, saveReceipt, discount, setDiscount, taxRate, setTaxRate, customerName, customerAddress, setCustomerName, setCustomerAddress, date, setDate, documentType, setDocumentType, isOriginal, setIsOriginal, watermarkText, setWatermarkText, proposerName, setProposerName, remarks, setRemarks, getNextId, editingId, isSaving } = useReceiptStore();
    const config = useConfigStore();
    const customers = config.customers || [];
    const [newItem, setNewItem] = React.useState({ name: '', price: '', qty: 1, unit: 'ชิ้น' });

    // Local state to force re-render when store updates (if needed) but mostly handled by store subscription. 
    // Actually, for DebouncedInput to show store values (e.g. initial load), we pass defaults?
    // DebouncedInput handles internal state syncing via useEffect on 'value' prop.

    React.useEffect(() => {
        // Automatically set to current time when opening the page for a new document
        if (!editingId) {
            setDate(new Date().toISOString());
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItem.name || !newItem.price) return;

        addItem({
            name: newItem.name,
            price: parseFloat(newItem.price),
            qty: newItem.qty,
            unit: newItem.unit
        });
        setNewItem({ name: '', price: '', qty: 1, unit: 'ชิ้น' });
        // Focus back to name input?
    };

    const handlePrint = () => {
        // 1. Create a style tag to forcibly hide everything except the print portal
        // This is more robust for Webkit than just media queries sometimes
        const moveStyle = document.createElement('style');
        moveStyle.innerHTML = `
            @media print {
                body > * { display: none !important; }
                #printable-receipt { display: block !important; }
            }
        `;
        document.head.appendChild(moveStyle);

        // 2. Wait for extensive layout calc (Safari/Mac fix)
        setTimeout(() => {
            window.print();
            // Cleanup
            document.head.removeChild(moveStyle);
        }, 500);
    };

    const safeCurrentItems = React.useMemo(() => currentItems || [], [currentItems]);
    const { subtotal, discountAmount, taxAmount, total } = React.useMemo(
        () => calcTotals(safeCurrentItems, discount, taxRate),
        [safeCurrentItems, discount, taxRate]
    );

    const nextId = editingId || getNextId();

    // Pagination: split items into pages of 10
    const pages = React.useMemo(() => chunkArray(safeCurrentItems, ITEMS_PER_PAGE), [safeCurrentItems]);
    const totalPages = pages.length;

    return (
        <>
            <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-140px)] animate-fade-in-up print:hidden">
                {/* Input Section */}
                <div className="flex-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-0 relative overflow-y-auto overflow-x-hidden">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                            <ShoppingCart size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">{editingId ? 'แก้ไขเอกสาร' : 'สร้างเอกสาร'}</h2>
                            <p className="text-xs text-gray-500">{editingId ? 'แก้ไขข้อมูลเอกสารที่บันทึกไว้' : 'เพิ่มข้อมูลลูกค้าและรายการสินค้า'}</p>
                        </div>
                    </div>

                    {/* Document Settings */}
                    <div className="mb-6">
                        <label className="block text-xs font-bold text-gray-500 mb-2 ml-1">ประเภทเอกสาร</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative">
                                <select
                                    value={documentType}
                                    onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                                    className="w-full pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all shadow-sm appearance-none cursor-pointer text-sm font-medium text-gray-700"
                                >
                                    <option value="receipt">ใบเสร็จรับเงิน (Receipt)</option>
                                    <option value="tax_invoice">ใบกำกับภาษี (Tax Invoice)</option>
                                    <option value="delivery_note">ใบส่งของ (Delivery Note)</option>
                                    <option value="quotation">ใบเสนอราคา (Quotation)</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                            </div>
                            <div className="flex gap-4 items-center">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="isOriginal"
                                        checked={isOriginal}
                                        onChange={(e) => setIsOriginal(e.target.checked)}
                                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                    />
                                    <label htmlFor="isOriginal" className="text-sm text-gray-700 cursor-pointer select-none">ต้นฉบับ (Original)</label>
                                </div>
                                <div className="flex-1">
                                    <DebouncedInput
                                        placeholder="ข้อความลายน้ำ (Watermark)..."
                                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all shadow-sm text-sm"
                                        value={watermarkText}
                                        onChange={(val) => setWatermarkText(String(val))}
                                    />
                                </div>
                            </div>
                        </div>
                        {documentType === 'quotation' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">ชื่อผู้เสนอราคา</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <DebouncedInput
                                            placeholder="ระบุชื่อผู้เสนอราคา..."
                                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all shadow-sm text-sm"
                                            value={proposerName}
                                            onChange={(val) => setProposerName(String(val))}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">หมายเหตุเพิ่มเติม</label>
                                    <DebouncedTextarea
                                        placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all shadow-sm text-sm resize-none h-[42px]"
                                        value={remarks}
                                        onChange={(val) => setRemarks(val)}
                                    />
                                </div>
                            </div>
                        )}
                        <div className="mt-4">
                            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">วันที่และเวลาเอกสาร</label>
                            <div className="relative max-w-sm">
                                <CalendarClock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="datetime-local"
                                    value={toThaiDateTimeLocalValue(date)}
                                    onChange={(e) => setDate(fromThaiDateTimeLocalValue(e.target.value))}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all shadow-sm text-sm text-gray-700"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Customer Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                        {customers.length > 0 && (
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">เลือกลูกค้า / หน่วยงานที่บันทึกไว้</label>
                                <div className="relative">
                                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <select
                                        value=""
                                        onChange={(e) => {
                                            const customer = customers.find((item) => item.id === e.target.value);
                                            if (!customer) return;
                                            setCustomerName(customer.name);
                                            setCustomerAddress(customer.address);
                                        }}
                                        className="w-full pl-10 pr-10 py-2.5 bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all shadow-sm text-sm appearance-none cursor-pointer"
                                    >
                                        <option value="">เลือกจากรายชื่อที่บันทึกไว้...</option>
                                        {customers.map((customer) => (
                                            <option key={customer.id} value={customer.id}>
                                                {customer.name}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                                </div>
                            </div>
                        )}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">ชื่อลูกค้า / หน่วยงาน</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <DebouncedInput
                                    placeholder="ระบุชื่อลูกค้า..."
                                    className="w-full pl-10 pr-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all shadow-sm text-sm"
                                    value={customerName}
                                    onChange={(val) => setCustomerName(String(val))}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">ที่อยู่</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 text-gray-400" size={16} />
                                <DebouncedTextarea
                                    placeholder="ระบุที่อยู่..."
                                    className="w-full pl-10 pr-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all shadow-sm text-sm resize-none h-[42px]"
                                    value={customerAddress}
                                    onChange={(val) => setCustomerAddress(val)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleAddItem} className="grid grid-cols-12 gap-4 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div className="col-span-12 md:col-span-5">
                            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">ชื่อสินค้า</label>
                            <div className="relative">
                                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="ชื่อสินค้า..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all shadow-sm"
                                    value={newItem.name}
                                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="col-span-4 md:col-span-2">
                            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">จำนวน</label>
                            <input
                                type="number"
                                placeholder="1"
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all shadow-sm text-center"
                                value={newItem.qty}
                                min="0.01"
                                step="any"
                                onChange={(e) => { const v = parseFloat(e.target.value); setNewItem({ ...newItem, qty: isNaN(v) ? 1 : v }); }}
                            />
                        </div>
                        <div className="col-span-4 md:col-span-2">
                            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">หน่วย</label>
                            <div className="relative">
                                <Box className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                <input
                                    type="text"
                                    placeholder="ชิ้น"
                                    className="w-full pl-9 pr-2 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all shadow-sm text-sm"
                                    value={newItem.unit}
                                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="col-span-5 md:col-span-3">
                            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">ราคาต่อหน่วย</label>
                            <input
                                type="number"
                                placeholder="0.00"
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all shadow-sm text-right font-mono"
                                value={newItem.price}
                                step="0.01"
                                onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                            />
                        </div>
                        <div className="col-span-3 md:col-span-2 flex items-end">
                            <button type="submit" className="w-full h-[42px] bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300 transform active:scale-95">
                                <Plus size={20} />
                            </button>
                        </div>
                    </form>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto border border-gray-100 rounded-xl mb-4 custom-scrollbar min-h-[200px]">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-3 text-left font-bold text-gray-600 rounded-tl-xl">รายการ</th>
                                    <th className="px-4 py-3 text-center font-bold text-gray-600">จำนวน</th>
                                    <th className="px-4 py-3 text-center font-bold text-gray-600">หน่วย</th>
                                    <th className="px-4 py-3 text-right font-bold text-gray-600">รวม</th>
                                    <th className="px-4 py-3 w-10 rounded-tr-xl"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {safeCurrentItems.map((item) => (
                                    <tr key={item.id} className="hover:bg-blue-50/50 transition-colors group">
                                        <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                                        <td className="px-4 py-3 text-center text-gray-500 bg-gray-50/50 mx-2 rounded">{item.qty}</td>
                                        <td className="px-4 py-3 text-center text-gray-400 text-xs">{item.unit || '-'}</td>
                                        <td className="px-4 py-3 text-right font-bold text-gray-900 font-mono">{formatCurrency(item.price * item.qty)}</td>
                                        <td className="px-4 py-3 text-center">
                                            <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors" title="ลบรายการ">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {safeCurrentItems.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-16 text-center text-gray-400">
                                            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-xl py-8 bg-gray-50/50 mx-4">
                                                <ShoppingCart size={32} className="opacity-20 mb-2" />
                                                <p className="font-medium text-gray-500">ยังไม่มีรายการสินค้า</p>
                                                <p className="text-xs mt-1 text-gray-400">เพิ่มรายการด้านบนเพื่อเริ่มสร้างเอกสาร</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Total & Actions */}
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                        <div className="flex justify-between items-end px-2 border-b border-gray-100 pb-4 mb-4">
                            <div className="space-y-3 w-1/2">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">ส่วนลด (บาท)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={discount === 0 ? '' : discount}
                                        onChange={(e) => {
                                            const v = parseFloat(e.target.value);
                                            setDiscount(isNaN(v) ? 0 : v);
                                        }}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">ภาษีมูลค่าเพิ่ม (%)</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="any"
                                            value={taxRate === 0 ? '' : taxRate}
                                            onChange={(e) => {
                                                const v = parseFloat(e.target.value);
                                                setTaxRate(isNaN(v) ? 0 : v);
                                            }}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                                        />
                                        <span className="text-xs text-gray-400">%</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-gray-500 mb-1">ยอดสุทธิ</div>
                                <div className="text-4xl font-bold text-blue-600 font-mono tracking-tight">{formatCurrency(total)}</div>
                                {totalPages > 1 && (
                                    <div className="text-xs text-gray-400 mt-1">({totalPages} หน้า)</div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            <button onClick={clearCurrentReceipt} className="px-4 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 hover:text-red-500 transition-colors flex items-center justify-center gap-2 font-medium" title="ล้างรายการทั้งหมด">
                                <RefreshCw size={18} /> <span className="hidden sm:inline">ล้าง</span>
                            </button>
                            <button disabled={isSaving || safeCurrentItems.length === 0} onClick={async () => {
                                const result = await saveReceipt();
                                if (result.status === 'saved') {
                                    alert(`บันทึกสำเร็จ! เลขที่เอกสาร: ${result.id}`);
                                } else {
                                    alert('เกิดข้อผิดพลาดในการบันทึก กรุณาลองใหม่');
                                }
                            }} className={clsx(
                                "px-4 py-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl transition-colors flex items-center justify-center gap-2 font-medium shadow-sm",
                                isSaving || safeCurrentItems.length === 0 ? "opacity-60 cursor-not-allowed" : "hover:bg-emerald-100"
                            )}>
                                <Save size={18} /> {isSaving ? 'กำลังบันทึก...' : editingId ? 'บันทึกการแก้ไข' : 'บันทึก'}
                            </button>
                            <button
                                onClick={handlePrint}
                                className={clsx(
                                    "col-span-2 px-6 py-3 bg-blue-600 text-white rounded-xl transition-all flex items-center justify-center gap-2 font-bold shadow-lg shadow-blue-200",
                                    safeCurrentItems.length === 0 ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700 hover:shadow-blue-300 transform hover:-translate-y-0.5"
                                )}
                                disabled={safeCurrentItems.length === 0}
                            >
                                <Printer size={20} /> พิมพ์เอกสาร
                            </button>
                        </div>
                    </div>
                </div>

                {/* Preview Section — shows all pages stacked */}
                <div className="hidden lg:flex w-[380px] flex-col min-h-0 bg-gray-100 rounded-2xl border border-gray-200 overflow-hidden">
                    <div className="p-4 bg-gray-200 border-b border-gray-300/50 flex items-center justify-between">
                        <h2 className="font-bold text-gray-700 flex items-center gap-2">
                            <Printer size={16} /> ตัวอย่างเอกสาร
                        </h2>
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                            {totalPages > 1 ? `A4 · ${totalPages} หน้า` : 'A4 Invoice'}
                        </span>
                    </div>
                    <div className="flex-1 p-6 overflow-auto flex items-start justify-center shadow-inner custom-scrollbar bg-gray-200/50 relative">
                        <div className="transform scale-[0.45] origin-top">
                            <div className="space-y-8">
                                {pages.map((pageItems, pageIdx) => (
                                    <div key={pageIdx} className="w-[210mm] h-[297mm] bg-white shadow-xl">
                                        <InvoicePreviewA4
                                            items={pageItems}
                                            total={total}
                                            subtotal={subtotal}
                                            discount={discountAmount}
                                            tax={taxAmount}
                                            taxRate={taxRate}
                                            customerName={customerName}
                                            customerAddress={customerAddress}
                                            documentType={documentType}
                                            isOriginal={isOriginal}
                                            watermarkText={watermarkText}
                                            proposerName={proposerName}
                                            remarks={remarks || (documentType === 'quotation' ? config.defaultRemarks : undefined)}
                                            date={date}
                                            id={nextId}
                                            pageNumber={pageIdx + 1}
                                            totalPages={totalPages}
                                            startIndex={pageIdx * ITEMS_PER_PAGE}
                                            isLastPage={pageIdx === totalPages - 1}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Component — rendered via portal outside #root for proper multi-page printing */}
            <PrintPortal>
                {pages.map((pageItems, pageIdx) => (
                    <div
                        key={pageIdx}
                        style={pageIdx < totalPages - 1 ? { breakAfter: 'page' } : undefined}
                    >
                        <InvoicePreviewA4
                            items={pageItems}
                            total={total}
                            subtotal={subtotal}
                            discount={discountAmount}
                            tax={taxAmount}
                            taxRate={taxRate}
                            customerName={customerName}
                            customerAddress={customerAddress}
                            documentType={documentType}
                            isOriginal={isOriginal}
                            watermarkText={watermarkText}
                            proposerName={proposerName}
                            remarks={remarks || (documentType === 'quotation' ? config.defaultRemarks : undefined)}
                            date={date}
                            id={nextId}
                            pageNumber={pageIdx + 1}
                            totalPages={totalPages}
                            startIndex={pageIdx * ITEMS_PER_PAGE}
                            isLastPage={pageIdx === totalPages - 1}
                        />
                    </div>
                ))}
            </PrintPortal>
        </>
    );
};

export default NewReceipt;
