import React from 'react';
import { Outlet } from 'react-router-dom';

const AdminLayout = () => {
    return (
        <div className="flex h-screen bg-gray-100 font-sans text-slate-900">
            <div className="w-64 bg-white border-r p-4 font-bold text-red-500">
                SIDEBAR TẠM THỜI
            </div>
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white h-14 border-b flex items-center px-6">
                    <h2 className="font-bold">Admin Dashboard</h2>
                </header>
                <main className="flex-1 overflow-auto p-4">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
