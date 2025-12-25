import React from 'react';
import { Outlet } from 'react-router-dom';

// Import 2 cục mới tách ra
import Header from '../components/Header';
import Footer from '../components/Footer';

const WebLayout = () => {
    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 flex flex-col justify-between">

            {/* 1. Header (Cố định) */}
            <Header />

            {/* 2. Nội dung thay đổi (Home, Pricing, Download sẽ hiện ở đây) */}
            <main className="pt-20 flex-1">
                <Outlet />
            </main>

            {/* 3. Footer (Cố định) */}
            <Footer />

        </div>
    );
};

export default WebLayout;
