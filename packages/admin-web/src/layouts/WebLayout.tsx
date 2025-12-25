import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';

const WebLayout = () => {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-white font-sans text-slate-900">
            <header className="fixed w-full top-0 z-50 bg-white/90 backdrop-blur-md shadow-sm h-16">
                <div className="container mx-auto px-4 h-full flex justify-between items-center">
                    <div className="flex items-center gap-2 font-bold text-xl text-blue-900 cursor-pointer" onClick={() => navigate('/')}>
                        <Zap size={24} fill="currentColor" className="text-blue-600" /> NNT Login
                    </div>
                    <button onClick={() => navigate('/login')} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition">
                        Đăng nhập
                    </button>
                </div>
            </header>
            <main className="pt-16">
                <Outlet />
            </main>
        </div>
    );
};

export default WebLayout;
