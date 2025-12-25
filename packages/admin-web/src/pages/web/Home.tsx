import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const navigate = useNavigate();
    return (
        <div className="bg-blue-50 min-h-screen flex flex-col items-center pt-20 text-center px-4">
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
                <span className="text-blue-600">Antidetect</span> Browser
            </h1>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl">
                Quản lý tài khoản & Trình duyệt tự động hóa số 1 Việt Nam.
            </p>
            <button onClick={() => navigate('/login')} className="bg-blue-600 text-white px-10 py-4 rounded-full font-bold text-lg shadow-xl hover:bg-blue-700 transition">
                BẮT ĐẦU NGAY
            </button>
        </div>
    );
};

export default Home;
