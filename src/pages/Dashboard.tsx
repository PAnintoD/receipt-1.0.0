import React from 'react';
import { useReceiptStore } from '../store/useReceiptStore';
import { formatCurrency } from '../utils/format';
import { TrendingUp, ShoppingBag, Calendar, ArrowRight, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
// @ts-ignore
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
    const { history } = useReceiptStore();

    const totalRevenue = history.reduce((sum, r) => sum + r.total, 0);
    const totalReceipts = history.length;

    // Calculate today's sales
    const today = new Date().toDateString();
    const todaySales = history
        .filter(r => new Date(r.date).toDateString() === today)
        .reduce((sum, r) => sum + r.total, 0);

    // Prepare chart data (Last 7 days)
    const chartData = React.useMemo(() => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toDateString();
            const revenue = history
                .filter(r => new Date(r.date).toDateString() === dateStr)
                .reduce((sum, r) => sum + r.total, 0);

            days.push({
                name: d.toLocaleDateString('th-TH', { weekday: 'short' }), // Mon, Tue...
                revenue,
                fullDate: d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
            });
        }
        return days;
    }, [history]);

    return (
        <div className="space-y-8 animate-fade-in-up">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800 tracking-tight">ภาพรวมร้านค้า</h2>
                    <p className="text-gray-500 mt-1">ยินดีต้อนรับกลับ! นี่คือสรุปยอดขายของคุณวันนี้</p>
                </div>
                <Link to="/new" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300 transform hover:-translate-y-0.5 text-sm font-medium flex items-center gap-2">
                    สร้างใบเสร็จใหม่ <ArrowRight size={18} />
                </Link>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md hover:border-blue-100 group">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-gray-500 text-sm font-medium">ยอดขายทั้งหมด</h3>
                            <p className="text-3xl font-bold text-gray-900 mt-2 font-mono tracking-tight group-hover:text-blue-600 transition-colors">{formatCurrency(totalRevenue)}</p>
                        </div>
                        <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <DollarSign size={24} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-xs text-green-600 font-medium">
                        <TrendingUp size={14} className="mr-1" />
                        <span>ตลอดการใช้งาน</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md hover:border-green-100 group">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-gray-500 text-sm font-medium">ยอดขายวันนี้</h3>
                            <p className="text-3xl font-bold text-gray-900 mt-2 font-mono tracking-tight group-hover:text-green-600 transition-colors">{formatCurrency(todaySales)}</p>
                        </div>
                        <div className="h-12 w-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Calendar size={24} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-xs text-gray-400">
                        <span>อัปเดตล่าสุด: ทันที</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md hover:border-purple-100 group">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-gray-500 text-sm font-medium">บิลทั้งหมด</h3>
                            <p className="text-3xl font-bold text-gray-900 mt-2 font-mono tracking-tight group-hover:text-purple-600 transition-colors">{totalReceipts}</p>
                        </div>
                        <div className="h-12 w-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <ShoppingBag size={24} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-xs text-purple-600 font-medium">
                        <span>รายการ</span>
                    </div>
                </div>
            </div>

            {/* Chart Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Chart */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 min-h-[400px]">
                    <h3 className="font-bold text-gray-800 text-lg mb-6 flex items-center gap-2">
                        <TrendingUp size={20} className="text-blue-500" />
                        แนวโน้มรายได้ (7 วันล่าสุด)
                    </h3>
                    <div className="h-[300px] w-full" style={{ minWidth: 0 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                                    tickMargin={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                                    tickFormatter={(value) => `฿${value}`}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: any) => [formatCurrency(Number(value)), 'รายได้']}
                                    labelFormatter={(label) => `วัน${label}`}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#2563eb"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorRevenue)"
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-gray-800 text-lg">รายการล่าสุด</h3>
                        <Link to="/history" className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline">ดูทั้งหมด</Link>
                    </div>

                    {history.length > 0 ? (
                        <div className="space-y-4">
                            {history.slice(0, 5).map(receipt => (
                                <div key={receipt.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-xl border border-transparent hover:border-gray-100 transition-all cursor-default group">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                            <ShoppingBag size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800 group-hover:text-blue-600 transition-colors">บิล {receipt.id}</p>
                                            <p className="text-xs text-gray-500">{new Date(receipt.date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-gray-900 font-mono text-sm group-hover:scale-105 transition-transform">{formatCurrency(receipt.total)}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-[200px] text-gray-400">
                            <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                <ShoppingBag size={24} className="opacity-50" />
                            </div>
                            <p className="text-sm">ยังไม่มีรายการขาย</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
