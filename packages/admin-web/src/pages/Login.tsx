import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Zap, ArrowRight, Eye, EyeOff } from 'lucide-react';

const Login = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    // State để bật/tắt hiện mật khẩu
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (username && password) {
            // Giả lập login thành công -> Vào Dashboard
            // (Sau này sẽ thay bằng gọi API thật)
            if (username === 'admin' && password === 'admin') {
                // Logic cũ
            }
            localStorage.setItem('auth_token', 'demo-token');
            // Lưu tạm quyền Super Admin để bạn test menu
            if (username === 'admin') {
                localStorage.setItem('user_role', 'SUPER_ADMIN');
            } else {
                localStorage.setItem('user_role', 'USER');
            }
            navigate('/dashboard');
        } else {
            alert("Vui lòng nhập tài khoản/mật khẩu!");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 font-sans">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-in fade-in zoom-in duration-300">

                {/* LOGO */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl mb-4 shadow-sm">
                        <Zap size={32} fill="currentColor" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-slate-800">Chào mừng trở lại</h2>
                    <p className="text-slate-500 mt-2">Đăng nhập để quản lý hệ thống</p>
                </div>

                {/* FORM */}
                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Tài khoản</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3.5 text-slate-400" size={20} />
                            <input
                                type="text"
                                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                                placeholder="Nhập username..."
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Mật khẩu</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3.5 text-slate-400" size={20} />
                            <input
                                // Kiểm tra state để hiện text hay password
                                type={showPassword ? "text" : "password"}
                                className="w-full pl-10 pr-12 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                            {/* Nút con mắt */}
                            <button
                                type="button" // Quan trọng: type button để không bị submit form
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-3.5 text-slate-400 hover:text-blue-600 transition"
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <label className="flex items-center text-slate-600 cursor-pointer">
                            <input type="checkbox" className="mr-2 rounded text-blue-600 focus:ring-blue-500" /> Ghi nhớ tôi
                        </label>
                        <span className="text-blue-600 font-bold cursor-pointer hover:underline">Quên mật khẩu?</span>
                    </div>

                    <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2">
                        Đăng Nhập <ArrowRight size={20} />
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-slate-500 text-sm">
                        Chưa có tài khoản? <span className="text-blue-600 font-bold cursor-pointer hover:underline">Đăng ký ngay</span>
                    </p>
                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <span onClick={() => navigate('/')} className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer">← Quay lại Trang chủ</span>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Login;
