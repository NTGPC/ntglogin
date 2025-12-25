import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const AdminLayout = () => {
    // State quản lý đóng/mở menu
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="flex h-screen bg-slate-50 font-sans text-slate-900 transition-all duration-300">

            {/* MENU BÊN TRÁI (Truyền state xuống) */}
            <div className={`flex-shrink-0 transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
                <Sidebar collapsed={collapsed} toggleSidebar={() => setCollapsed(!collapsed)} />
            </div>

            {/* NỘI DUNG BÊN PHẢI */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header nhỏ */}
                <header className="bg-white h-16 border-b border-gray-100 flex items-center justify-between px-8 shadow-sm z-10">
                    <div className="flex items-center gap-4">
                        <h2 className="font-bold text-lg text-slate-700">Control Panel</h2>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-slate-500">Xin chào, Admin</span>
                        <div className="w-9 h-9 bg-gradient-to-r from-blue-500 to-teal-400 rounded-full border-2 border-white shadow-md"></div>
                    </div>
                </header>

                {/* Khu vực nội dung thay đổi */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 bg-slate-50 transition-all">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
