import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';

// Layout & Pages
import WebLayout from './layouts/WebLayout';
import Home from './pages/web/Home';
import Pricing from './pages/web/Pricing';
import Download from './pages/web/Download';
import Login from './pages/Login';

// Admin (Tạm chưa dùng)
import AdminLayout from './layouts/AdminLayout';

function App() {
    return (
        <HashRouter>
            <Routes>
                {/* 1. TRANG KHÁCH (Mặc định vào đây) */}
                <Route path="/" element={<WebLayout />}>
                    <Route index element={<Home />} />
                    <Route path="pricing" element={<Pricing />} />
                    <Route path="download" element={<Download />} />
                </Route>

                {/* 2. TRANG ĐĂNG NHẬP (Chỉ vào khi gõ /login) */}
                <Route path="/login" element={<Login />} />

                {/* 3. TRANG ADMIN */}
                <Route path="/dashboard" element={<AdminLayout />}>
                    {/* Nội dung admin */}
                </Route>

            </Routes>
        </HashRouter>
    );
}

export default App;