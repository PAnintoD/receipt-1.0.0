import React from 'react';
import { useReceiptStore } from '../store/useReceiptStore';
import { InvoicePreviewA4 } from '../components/receipt/InvoicePreviewA4';
import { User, MapPin, Printer, Save, Trash2, Plus, RefreshCw, ShoppingCart, Tag, Box, ChevronDown } from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { clsx } from 'clsx';

const NewReceipt = () => {
    const { currentItems, addItem, removeItem, clearCurrentReceipt, saveReceipt, discount, taxRate, customerName, customerAddress, setCustomerName, setCustomerAddress, documentType, setDocumentType, isOriginal, setIsOriginal, watermarkText, setWatermarkText, getNextId } = useReceiptStore();
    const [newItem, setNewItem] = React.useState({ name: '', price: '', qty: 1, unit: 'ชิ้น' });

    // ... (rest of methods)

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
    };

    const handlePrint = () => {
        window.print();
    };

    const safeCurrentItems = currentItems || [];
    const subtotal = safeCurrentItems.reduce((sum, item) => sum + item.price * item.qty, 0);
    const discountAmount = discount || 0;
    const afterDiscount = Math.max(0, subtotal - discountAmount);
    const taxAmount = (afterDiscount * taxRate) / 100;
    const total = afterDiscount + taxAmount;

    const nextId = getNextId();

    return (
        <>
            <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-140px)] animate-fade-in-up print:hidden">
                {/* Input Section */}
                <div className="flex-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-0 relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                            <ShoppingCart size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">สร้างใบเสร็จ</h2>
                            <p className="text-xs text-gray-500">เพิ่มข้อมูลลูกค้าและรายการสินค้า</p>
                        </div>
                    </div>

                    {/* Document Settings */}
                    <div className="mb-6">
                        <label className="block text-xs font-bold text-gray-500 mb-2 ml-1">ประเภทเอกสาร</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative">
                                <select
                                    value={documentType}
                                    onChange={(e) => setDocumentType(e.target.value as any)}
                                    className="w-full pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all shadow-sm appearance-none cursor-pointer text-sm font-medium text-gray-700"
                                >
                                    <option value="receipt">ใบเสร็จรับเงิน (Receipt)</option>
                                    <option value="tax_invoice">ใบกำกับภาษี (Tax Invoice)</option>
                                    <option value="delivery_note">ใบส่งของ (Delivery Note)</option>
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
                                    <input
                                        type="text"
                                        placeholder="ข้อความลายน้ำ (Watermark)..."
                                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all shadow-sm text-sm"
                                        value={watermarkText}
                                        onChange={(e) => setWatermarkText(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Customer Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">ชื่อลูกค้า / หน่วยงาน</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="ระบุชื่อลูกค้า..."
                                    className="w-full pl-10 pr-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all shadow-sm text-sm"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">ที่อยู่</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 text-gray-400" size={16} />
                                <textarea
                                    placeholder="ระบุที่อยู่..."
                                    className="w-full pl-10 pr-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all shadow-sm text-sm resize-none h-[42px]"
                                    value={customerAddress}
                                    onChange={(e) => setCustomerAddress(e.target.value)}
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
                                    autoFocus
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
                                min="1"
                                onChange={(e) => setNewItem({ ...newItem, qty: parseInt(e.target.value) || 1 })}
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
                    <div className="flex-1 overflow-y-auto border border-gray-100 rounded-xl mb-4 custom-scrollbar">
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
                                        <td colSpan={4} className="px-4 py-16 text-center text-gray-400">
                                            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-xl py-8 bg-gray-50/50 mx-4">
                                                <ShoppingCart size={32} className="opacity-20 mb-2" />
                                                <p className="font-medium text-gray-500">ยังไม่มีรายการสินค้า</p>
                                                <p className="text-xs mt-1 text-gray-400">เพิ่มรายการด้านบนเพื่อเริ่มสร้างใบเสร็จ</p>
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
                                        value={useReceiptStore(state => state.discount ?? 0)}
                                        onChange={(e) => useReceiptStore.getState().setDiscount(parseFloat(e.target.value) || 0)}
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
                                            value={useReceiptStore(state => state.taxRate ?? 7)}
                                            onChange={(e) => useReceiptStore.getState().setTaxRate(parseFloat(e.target.value) || 0)}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                                        />
                                        <span className="text-xs text-gray-400">%</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-gray-500 mb-1">ยอดสุทธิ</div>
                                <div className="text-4xl font-bold text-blue-600 font-mono tracking-tight">{formatCurrency(total)}</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            <button onClick={clearCurrentReceipt} className="px-4 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 hover:text-red-500 transition-colors flex items-center justify-center gap-2 font-medium" title="ล้างรายการทั้งหมด">
                                <RefreshCw size={18} /> <span className="hidden sm:inline">ล้าง</span>
                            </button>
                            <button onClick={() => {
                                const id = saveReceipt();
                                if (id) {
                                    alert(`บันทึกสำเร็จ! เลขที่ใบเสร็จ: ${id}`);
                                } else {
                                    alert('เกิดข้อผิดพลาดในการบันทึก กรุณาลองใหม่');
                                }
                            }} className="px-4 py-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2 font-medium shadow-sm">
                                <Save size={18} /> บันทึก
                            </button>
                            <button
                                onClick={handlePrint}
                                className={clsx(
                                    "col-span-2 px-6 py-3 bg-blue-600 text-white rounded-xl transition-all flex items-center justify-center gap-2 font-bold shadow-lg shadow-blue-200",
                                    safeCurrentItems.length === 0 ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700 hover:shadow-blue-300 transform hover:-translate-y-0.5"
                                )}
                                disabled={safeCurrentItems.length === 0}
                            >
                                <Printer size={20} /> พิมพ์ใบเสร็จ
                            </button>
                        </div>
                    </div>
                </div>

                {/* Preview Section */}
                <div className="hidden lg:flex w-[380px] flex-col min-h-0 bg-gray-100 rounded-2xl border border-gray-200 overflow-hidden">
                    <div className="p-4 bg-gray-200 border-b border-gray-300/50 flex items-center justify-between">
                        <h2 className="font-bold text-gray-700 flex items-center gap-2">
                            <Printer size={16} /> ตัวอย่างใบเสร็จ
                        </h2>
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">A4 Invoice</span>
                    </div>
                    <div className="flex-1 p-6 overflow-hidden flex items-start justify-center shadow-inner custom-scrollbar bg-gray-200/50 relative">
                        <div className="transform scale-[0.45] origin-top">
                            <div className="w-[210mm] min-h-[297mm] bg-white shadow-xl">
                                <InvoicePreviewA4
                                    items={safeCurrentItems}
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
                                    id={nextId}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Hidden Print Component - Moved outside the main print:hidden container */}
            <div id="printable-receipt" className="hidden print:block print:absolute print:left-0 print:top-0 print:w-full print:bg-white print:z-[9999]">
                <InvoicePreviewA4
                    items={safeCurrentItems}
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
                    id={nextId}
                />
            </div>
        </>
    );
};

export default NewReceipt;
