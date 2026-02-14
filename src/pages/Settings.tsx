import React, { useState } from 'react';
import { useConfigStore } from '../store/useConfigStore';
import { Upload, X, Store, MapPin, Hash, Type, Loader2 } from 'lucide-react';

const Settings = () => {
    const config = useConfigStore();
    const [uploading, setUploading] = useState(false);

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
                            <Hash size={16} className="text-purple-500" /> เลขประจำตัวผู้เสียภาษี (ถ้ามี)
                        </label>
                        <input
                            type="text"
                            value={config.taxId}
                            onChange={(e) => config.setTaxId(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder:text-gray-300 font-mono"
                            placeholder="xxxxxxxxxxxxx"
                        />
                    </div>

                    {/* Footer Message */}
                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                            <Type size={16} className="text-green-500" /> ข้อความท้ายใบเสร็จ
                        </label>
                        <input
                            type="text"
                            value={config.footerText}
                            onChange={(e) => config.setFooterText(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder:text-gray-300"
                            placeholder="ขอบคุณที่ใช้บริการ โอกาสหน้าเชิญใหม่ครับ"
                        />
                        <p className="text-xs text-gray-400 mt-2 ml-1">ข้อความนี้จะแสดงอยู่ด้านล่างสุดของใบเสร็จ</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
