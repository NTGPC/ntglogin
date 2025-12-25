import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Zap } from 'lucide-react';

const Header = () => {
    const navigate = useNavigate();

    return (
        <header className="fixed w-full top-0 z-50 bg-white shadow-sm border-b border-gray-100 h-20">
            <div className="container mx-auto px-4 h-full flex justify-between items-center">

                {/* LOGO */}
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                    <div className="w-10 h-10 bg-blue-700 rounded-lg text-white flex items-center justify-center">
                        <Zap size={24} fill="currentColor" />
                    </div>
                    <span className="text-2xl font-bold text-blue-900 uppercase">GEMLOGIN</span>
                </div>

                {/* MENU GIỮA */}
                <nav className="hidden md:flex items-center gap-8 font-medium text-gray-600">
                    <div className="flex items-center gap-1 cursor-pointer hover:text-blue-600 transition" onClick={() => navigate('/')}>
                        Sản phẩm <ChevronDown size={16} />
                    </div>
                    <div className="cursor-pointer hover:text-blue-600 transition" onClick={() => navigate('/pricing')}>
                        Bảng giá
                    </div>
                    <div className="cursor-pointer hover:text-blue-600 transition">
                        Chợ ứng dụng
                    </div>
                    <div className="cursor-pointer hover:text-blue-600 transition">
                        Cộng đồng
                    </div>
                </nav>

                {/* NÚT BẤM */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 border border-gray-200 px-2 py-1 rounded cursor-pointer bg-gray-50">
                        <span className="text-red-500 font-bold">★</span> <span className="text-sm font-bold text-slate-700">VN</span>
                    </div>
                    <button
                        onClick={() => navigate('/download')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded font-bold transition shadow-md"
                    >
                        Tải xuống
                    </button>
                    <button
                        onClick={() => navigate('/login')}
                        className="border-2 border-blue-600 text-blue-600 px-5 py-2 rounded font-bold hover:bg-blue-50 transition"
                    >
                        Đăng nhập
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
