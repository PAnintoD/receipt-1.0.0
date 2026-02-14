import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, History, Settings, Menu, Store, X } from 'lucide-react';
import { clsx } from 'clsx';
import { useConfigStore } from '../store/useConfigStore';

export const Layout = () => {
    const { shopName, logo } = useConfigStore();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    // Localization map
    const navItems = [
        { to: '/', icon: LayoutDashboard, label: 'ภาพรวม' }, // Dashboard
        { to: '/new', icon: PlusCircle, label: 'สร้างใบเสร็จ' }, // New Receipt
        { to: '/history', icon: History, label: 'ประวัติการขาย' }, // History
        { to: '/settings', icon: Settings, label: 'ตั้งค่าร้านค้า' }, // Settings
    ];

    const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    return (
        <div className="flex h-screen bg-gray-50 text-gray-900 font-sans">
            {/* Sidebar for Desktop */}
            <aside className="hidden md:flex flex-col w-72 bg-white border-r border-gray-100 shadow-sm z-10 transition-all duration-300">
                <div className="p-6 border-b border-gray-50 flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-200">
                        {logo ? <img src={logo} className="h-full w-full object-cover rounded-lg" /> : <Store size={20} />}
                    </div>
                    <h1 className="text-lg font-bold text-gray-800 truncate tracking-tight">{shopName || 'ร้านค้าของฉัน'}</h1>
                </div>

                <nav className="flex-1 p-4 space-y-2 mt-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={({ isActive }) =>
                                clsx(
                                    'flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group',
                                    isActive
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-200 font-medium translate-x-1'
                                        : 'text-gray-500 hover:bg-blue-50 hover:text-blue-600 hover:translate-x-1'
                                )
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <item.icon size={22} className={isActive ? 'text-white' : 'group-hover:text-blue-600 transition-colors'} />
                                    <span className="text-sm">{item.label}</span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 m-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center">
                    <p className="text-xs text-gray-400">เวอร์ชัน 1.0.0</p>
                </div>
            </aside>

            {/* Mobile Header & Content */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
                {/* Mobile Header */}
                <header className="md:hidden bg-white/80 backdrop-blur-md border-b border-gray-100 p-4 flex items-center justify-between sticky top-0 z-20">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm">
                            <Store size={16} />
                        </div>
                        <h1 className="text-lg font-bold text-gray-800 truncate">{shopName}</h1>
                    </div>
                    <button onClick={toggleMenu} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        {isMobileMenuOpen ? <X size={24} className="text-gray-600" /> : <Menu size={24} className="text-gray-600" />}
                    </button>
                </header>

                {/* Mobile Menu Overlay */}
                <div className={clsx(
                    "md:hidden fixed inset-0 z-10 bg-black/20 backdrop-blur-sm transition-opacity duration-300",
                    isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )} onClick={() => setIsMobileMenuOpen(false)}></div>

                <div className={clsx(
                    "md:hidden absolute top-[73px] left-0 right-0 bg-white border-b border-gray-100 shadow-xl z-20 transition-all duration-300 origin-top transform",
                    isMobileMenuOpen ? "scale-y-100 opacity-100" : "scale-y-0 opacity-0"
                )}>
                    <nav className="p-4 space-y-2">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={({ isActive }) =>
                                    clsx(
                                        'flex items-center gap-3 px-4 py-4 rounded-xl transition-colors',
                                        isActive
                                            ? 'bg-blue-50 text-blue-600 font-medium'
                                            : 'text-gray-600 hover:bg-gray-50'
                                    )
                                }
                            >
                                <item.icon size={20} />
                                {item.label}
                            </NavLink>
                        ))}
                    </nav>
                </div>

                {/* Main Content */}
                <main className="flex-1 overflow-auto p-4 md:p-8 scroll-smooth pb-24 md:pb-8">
                    <div className="max-w-5xl mx-auto animate-fade-in">
                        <Outlet />
                    </div>
                </main>

                {/* Bottom Navigation for Mobile */}
                <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-2 z-30 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={({ isActive }) =>
                                clsx(
                                    'flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all duration-200 min-w-[64px]',
                                    isActive
                                        ? 'text-blue-600'
                                        : 'text-gray-400 hover:text-gray-600'
                                )
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <div className={clsx(
                                        "p-1.5 rounded-full transition-all duration-200",
                                        isActive ? "bg-blue-50" : "bg-transparent"
                                    )}>
                                        <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                                    </div>
                                    <span className="text-[10px] font-medium">{item.label}</span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </div>
            </div>
        </div>
    );
};
