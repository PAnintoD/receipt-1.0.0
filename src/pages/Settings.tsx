import React, { useState } from 'react';
import { useConfigStore } from '../store/useConfigStore';
import { Upload, X, Store, MapPin, Hash, Loader2, Plus, Trash2, Pencil, Save, Users } from 'lucide-react';
import type { CustomerInfo } from '../types';

const Settings = () => {
    const config = useConfigStore();
    const [uploading, setUploading] = useState(false);
    const [customerDraft, setCustomerDraft] = useState({ name: '', address: '' });
    const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 500 * 1024) {
            alert('ไฟล์มีขนาดใหญ่เกินไป กรุณาอัปโหลดรูปภาพขนาดไม่เกิน 500KB');
            return;
        }

        try {
            setUploading(true);
            // Convert to base64 data URL — no Firebase Storage needed
            const reader = new FileReader();
            const base64 = await new Promise<string>((resolve, reject) => {
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
            await config.setLogo(base64);
        } catch (error) {
            console.error('Upload failed:', error);
            alert('อัปโหลดโลโก้ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
        } finally {
            setUploading(false);
        }
    };

    const handleLogoDelete = async () => {
        try {
            setUploading(true);
            await config.setLogo('');
        } catch (error) {
            console.error('Delete failed:', error);
        } finally {
            setUploading(false);
        }
    };

    const resetCustomerForm = () => {
        setCustomerDraft({ name: '', address: '' });
        setEditingCustomerId(null);
    };

    const handleCustomerSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customerDraft.name.trim()) return;

        if (editingCustomerId) {
            await config.updateCustomer(editingCustomerId, customerDraft);
        } else {
            await config.addCustomer(customerDraft);
        }
        resetCustomerForm();
    };

    const handleCustomerEdit = (customer: CustomerInfo) => {
        setCustomerDraft({ name: customer.name, address: customer.address });
        setEditingCustomerId(customer.id);
    };

    return (
        <div className="max-w-3xl mx-auto animate-fade-in-up">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-800 tracking-tight">ตั้งค่าร้านค้า</h2>
                <p className="text-gray-500 mt-1">จัดการข้อมูลร้านค้าของคุณที่จะแสดงบนใบเสร็จ</p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-8">

                {/* Logo Section */}
                <div className="flex flex-col md:flex-row gap-8 items-start pb-8 border-b border-gray-100">
                    <div className="shrink-0">
                        <label className="block text-sm font-bold text-gray-700 mb-2">โลโก้ร้านค้า</label>
                        <div className="relative group">
                            {config.logo ? (
                                <>
                                    <img src={config.logo} alt="Logo Preview" className="h-32 w-32 object-cover border-2 border-gray-100 rounded-2xl shadow-sm bg-gray-50" />
                                    <button
                                        onClick={handleLogoDelete}
                                        disabled={uploading}
                                        className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1.5 hover:bg-red-200 transition-colors shadow-sm opacity-0 group-hover:opacity-100"
                                        title="ลบโลโก้"
                                    >
                                        {uploading ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
                                    </button>
                                </>
                            ) : (
                                <div className="h-32 w-32 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 flex flex-col items-center justify-center text-gray-400 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                                    <Store size={32} className="mb-2 opacity-50" />
                                    <span className="text-xs">ไม่มีโลโก้</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex-1">
                        <h3 className="font-bold text-gray-800 mb-1">อัปโหลดโลโก้ใหม่</h3>
                        <p className="text-sm text-gray-500 mb-4">แนะนำให้ใช้รูปสี่เหลี่ยมจัตุรัส (.png, .jpg) ขนาดไม่เกิน 500KB พื้นหลังโปร่งใสจะสวยที่สุด</p>
                        <label className={`inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl cursor-pointer hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm font-medium text-sm ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                            {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                            <span>{uploading ? 'กำลังอัปโหลด...' : 'เลือกรูปภาพ'}</span>
                            <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" disabled={uploading} />
                        </label>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Shop Name */}
                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                            <Store size={16} className="text-blue-500" /> ชื่อร้านค้า
                        </label>
                        <input
                            type="text"
                            value={config.shopName}
                            onChange={(e) => config.setShopName(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder:text-gray-300"
                            placeholder="เช่น ร้านกาแฟอารมณ์ดี"
                        />
                    </div>

                    {/* Default Watermark */}
                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                            <Store size={16} className="text-indigo-500" /> ลายน้ำเริ่มต้น (เมื่อไม่ได้ระบุในบิล)
                        </label>
                        <input
                            type="text"
                            value={config.defaultWatermark || ''}
                            onChange={(e) => config.setDefaultWatermark(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder:text-gray-300"
                            placeholder="เช่น ชื่อร้านค้า หรือข้อความที่ต้องการ"
                        />
                        <p className="text-xs text-gray-400 mt-2 ml-1">ข้อความนี้จะแสดงเป็นลายน้ำเมื่อคุณไม่ได้ระบุข้อความลายน้ำในหน้าบิล (ถ้าเว้นว่างจะใช้ชื่อร้านค้าแทน)</p>
                    </div>

                    {/* Address */}
                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                            <MapPin size={16} className="text-red-500" /> ที่อยู่
                        </label>
                        <textarea
                            value={config.shopAddress}
                            onChange={(e) => config.setShopAddress(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder:text-gray-300 resize-none"
                            placeholder="ที่อยู่ร้านค้า เบอร์โทรศัพท์"
                        />
                    </div>

                    {/* Tax ID */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                            <Hash size={16} className="text-purple-500" /> เลขประจำตัวผู้เสียภาษี
                        </label>
                        <input
                            type="text"
                            value={config.taxId}
                            onChange={(e) => config.setTaxId(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder:text-gray-300"
                            placeholder="เช่น 0-1234-56789-01-2"
                        />
                    </div>
                </div>

                {/* Customer Directory */}
                <div className="pt-8 border-t border-gray-100">
                    <div className="flex items-center justify-between gap-4 mb-4">
                        <div>
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <Users size={18} className="text-blue-500" />
                                รายชื่อลูกค้า / หน่วยงาน
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">บันทึกข้อมูลลูกค้าที่ใช้บ่อย แล้วเลือกเติมในหน้าออกเอกสารได้ทันที</p>
                        </div>
                    </div>

                    <form onSubmit={handleCustomerSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-3 bg-gray-50 border border-gray-100 rounded-xl p-4 mb-4">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">ชื่อลูกค้า / หน่วยงาน</label>
                            <input
                                type="text"
                                value={customerDraft.name}
                                onChange={(e) => setCustomerDraft((draft) => ({ ...draft, name: e.target.value }))}
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-sm"
                                placeholder="เช่น บริษัท ตัวอย่าง จำกัด"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">ที่อยู่</label>
                            <input
                                type="text"
                                value={customerDraft.address}
                                onChange={(e) => setCustomerDraft((draft) => ({ ...draft, address: e.target.value }))}
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-sm"
                                placeholder="ที่อยู่สำหรับออกเอกสาร"
                            />
                        </div>
                        <div className="flex items-end gap-2">
                            <button
                                type="submit"
                                className="flex-1 h-[42px] bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium shadow-lg shadow-blue-200"
                            >
                                {editingCustomerId ? <Save size={18} /> : <Plus size={18} />}
                                <span className="hidden sm:inline">{editingCustomerId ? 'บันทึก' : 'เพิ่ม'}</span>
                            </button>
                            {editingCustomerId && (
                                <button
                                    type="button"
                                    onClick={resetCustomerForm}
                                    className="h-[42px] w-[42px] border border-gray-200 text-gray-500 rounded-xl hover:bg-white transition-colors flex items-center justify-center"
                                    title="ยกเลิกแก้ไข"
                                >
                                    <X size={18} />
                                </button>
                            )}
                        </div>
                    </form>

                    <div className="border border-gray-100 rounded-xl overflow-hidden">
                        {(config.customers || []).length > 0 ? (
                            <div className="divide-y divide-gray-100">
                                {(config.customers || []).map((customer) => (
                                    <div key={customer.id} className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 hover:bg-blue-50/30 transition-colors">
                                        <div className="min-w-0">
                                            <p className="font-bold text-gray-800 truncate">{customer.name}</p>
                                            <p className="text-sm text-gray-500 mt-1 whitespace-pre-wrap">{customer.address || '-'}</p>
                                        </div>
                                        <div className="flex gap-2 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => handleCustomerEdit(customer)}
                                                className="p-2 text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors border border-orange-100"
                                                title="แก้ไขลูกค้า"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (confirm('คุณแน่ใจหรือไม่ที่จะลบรายชื่อลูกค้านี้?')) {
                                                        void config.deleteCustomer(customer.id);
                                                        if (editingCustomerId === customer.id) resetCustomerForm();
                                                    }
                                                }}
                                                className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100"
                                                title="ลบลูกค้า"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-10 text-center text-gray-400 bg-gray-50/50">
                                <Users size={28} className="mx-auto mb-2 opacity-40" />
                                <p className="text-sm font-medium">ยังไม่มีรายชื่อลูกค้าที่บันทึกไว้</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
