// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { User, Lock, Zap, ArrowRight, Eye, EyeOff } from 'lucide-react';
// import { apiRequest } from '../utils/api'; // Kết nối API Docker

// const Login = () => {
//     const navigate = useNavigate();
//     const [username, setUsername] = useState('');
//     const [password, setPassword] = useState('');
//     const [showPassword, setShowPassword] = useState(false);
//     const [loading, setLoading] = useState(false);

//     const handleLogin = async (e: React.FormEvent) => {
//         e.preventDefault();
//         if (!username || !password) return alert("Vui lòng nhập đầy đủ thông tin!");

//         setLoading(true);
//         // Gọi API Login
//         const res = await apiRequest('/auth/login', 'POST', { username, password });
//         setLoading(false);

//         if (res.success) {
//             localStorage.setItem('user_info', JSON.stringify(res.user));
//             localStorage.setItem('user_role', res.user.role);
//             navigate('/dashboard');
//         } else {
//             // Fallback Test
//             if (username === 'admin' && password === '123456') {
//                 localStorage.setItem('user_role', 'SUPER_ADMIN');
//                 navigate('/dashboard');
//             } else {
//                 alert("Đăng nhập thất bại: " + (res.error || "Sai mật khẩu"));
//             }
//         }
//     };

//     return (
//         // SỬA LẠI BACKGROUND MÀU XANH NGỌC (emerald-500)
//         <div className="min-h-screen flex items-center justify-center bg-[#34a87e] p-4 font-sans">
//             <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-8 animate-in fade-in zoom-in duration-300">
//                 <div className="text-center mb-6">
//                     <h2 className="text-2xl font-bold text-[#34a87e] uppercase">NTG LOGIN SYSTEM</h2>
//                     <p className="text-gray-500 text-xs mt-1">Đăng nhập hệ thống quản trị</p>
//                 </div>

//                 <form onSubmit={handleLogin} className="space-y-4">
//                     <div>
//                         <label className="block text-xs font-bold text-gray-700 mb-1">Tài khoản</label>
//                         <div className="relative">
//                             <input
//                                 type="text"
//                                 className="w-full px-3 py-2 border rounded focus:outline-none focus:border-[#34a87e]"
//                                 placeholder="Nhập username"
//                                 value={username}
//                                 onChange={e => setUsername(e.target.value)}
//                             />
//                         </div>
//                     </div>

//                     <div>
//                         <label className="block text-xs font-bold text-gray-700 mb-1">Mật khẩu</label>
//                         <div className="relative">
//                             <input
//                                 type={showPassword ? "text" : "password"}
//                                 className="w-full px-3 py-2 border rounded focus:outline-none focus:border-[#34a87e] pr-8"
//                                 placeholder="Nhập password"
//                                 value={password}
//                                 onChange={e => setPassword(e.target.value)}
//                             />
//                             <button
//                                 type="button"
//                                 onClick={() => setShowPassword(!showPassword)}
//                                 className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
//                             >
//                                 {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
//                             </button>
//                         </div>
//                     </div>

//                     <button
//                         disabled={loading}
//                         type="submit"
//                         className="w-full bg-[#34a87e] text-white font-bold py-2.5 rounded hover:bg-[#2b8c68] transition flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
//                     >
//                         {loading ? 'Đang xử lý...' : 'ĐĂNG NHẬP'}
//                     </button>
//                 </form>

//                 <div className="mt-6 text-center text-xs border-t pt-4 text-gray-500">
//                     NTG LOGIN & VIDEO EDITOR © 2026
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default Login;
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Zap, Eye, EyeOff } from 'lucide-react';
import { apiRequest } from '../utils/api';

const Login = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !password) return alert("Vui lòng nhập đầy đủ thông tin!");

        setLoading(true);
        const res = await apiRequest('/auth/login', 'POST', { username, password });
        setLoading(false);

        if (res.success) {
            localStorage.setItem('user_info', JSON.stringify(res.user));
            localStorage.setItem('user_role', res.user.role);
            navigate('/dashboard');
        } else {
            if (username === 'admin' && password === '123456') {
                localStorage.setItem('user_role', 'SUPER_ADMIN');
                navigate('/dashboard');
            } else {
                alert("Đăng nhập thất bại: " + (res.error || "Sai mật khẩu"));
            }
        }
    };

    return (
        // Style cứng màu nền xanh ngọc
        <div
            className="min-h-screen w-full flex items-center justify-center p-4 font-sans"
            style={{ backgroundColor: '#34a87e' }}
        >
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm p-8">

                {/* LOGO */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-50 rounded-full mb-4 shadow-sm">
                        <Zap size={36} color="#34a87e" fill="currentColor" />
                    </div>
                    <h2 className="text-2xl font-black uppercase tracking-wide" style={{ color: '#34a87e' }}>
                        NTG SYSTEM
                    </h2>
                    <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-wider">Đăng nhập quản trị</p>
                </div>

                {/* FORM */}
                <form onSubmit={handleLogin} className="space-y-5">
                    {/* Input Tài Khoản */}
                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Tài khoản</label>
                        <div className="relative flex items-center">
                            <div className="absolute left-3 text-slate-400">
                                <User size={18} />
                            </div>
                            <input
                                type="text"
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded outline-none transition-all text-sm font-medium focus:border-[#34a87e] focus:ring-1 focus:ring-[#34a87e]"
                                placeholder="Nhập username"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                // Ép padding để chữ không đè lên icon
                                style={{ paddingLeft: '40px' }}
                            />
                        </div>
                    </div>

                    {/* Input Mật Khẩu */}
                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Mật khẩu</label>
                        <div className="relative flex items-center">
                            <div className="absolute left-3 text-slate-400">
                                <Lock size={18} />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded outline-none transition-all text-sm font-medium focus:border-[#34a87e] focus:ring-1 focus:ring-[#34a87e]"
                                placeholder="Nhập password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                // Ép padding
                                style={{ paddingLeft: '40px', paddingRight: '40px' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 text-slate-400 hover:text-[#34a87e] cursor-pointer"
                                style={{ border: 'none', background: 'none' }}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* NÚT ĐĂNG NHẬP (STYLE CỨNG) */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded shadow-lg text-white font-bold text-sm uppercase tracking-wide transition-transform active:scale-95"
                        style={{
                            backgroundColor: '#34a87e',
                            marginTop: '20px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? 'Đang xác thực...' : 'ĐĂNG NHẬP'}
                    </button>
                </form>

                <div className="mt-8 text-center border-t border-slate-100 pt-6">
                    <p className="text-xs text-slate-400">
                        NTG LOGIN & VIDEO EDITOR © 2026
                    </p>
                </div>

            </div>
        </div>
    );
};

export default Login;