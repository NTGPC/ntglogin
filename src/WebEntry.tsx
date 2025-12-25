import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

// Import Giao diện Web
import WebLayout from './layouts/WebLayout';
import Home from './pages/web/Home';
import Pricing from './pages/web/Pricing';
import Download from './pages/web/Download';
import Login from './pages/Login';

// Tạm bỏ Admin để Web chạy trước
// import AdminLayout from './layouts/AdminLayout';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <HashRouter>
            <Routes>
                {/* 1. WEB KHÁCH (Mặc định) */}
                <Route path="/" element={<WebLayout />}>
                    <Route index element={<Home />} />
                    <Route path="pricing" element={<Pricing />} />
                    <Route path="download" element={<Download />} />
                </Route>

                {/* 2. LOGIN */}
                <Route path="/login" element={<Login />} />

                {/* 3. ĐÁ VỀ TRANG CHỦ NẾU SAI LINK */}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </HashRouter>
    </React.StrictMode>,
);
