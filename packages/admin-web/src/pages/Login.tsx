import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleLogin = async (e: any) => {
        e.preventDefault();
        try {
            // Nhớ check lại port 3000 hoặc port backend của bạn
            const res = await fetch('http://localhost:3000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();

            if (res.ok) {
                login(data.user, data.token);
                navigate('/');
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError("Không kết nối được server");
        }
    };

    return (
        // THAY ĐỔI 1: Background màu xanh ngọc đậm (Teal) giống hệt Hình 1
        <div className="flex h-screen items-center justify-center bg-[#00a884]">

            {/* Card Login màu trắng nổi bật giữa nền xanh */}
            <div className="w-96 p-8 bg-white rounded-lg shadow-2xl">

                {/* Tiêu đề đổi màu xanh cho đồng bộ */}
                <h2 className="text-3xl font-bold mb-6 text-center text-[#00a884] uppercase">
                    NTG LOGIN SYSTEM
                </h2>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Tài khoản
                        </label>
                        <input
                            type="text"
                            placeholder="Nhập username"
                            className="w-full p-3 bg-gray-50 text-gray-900 border border-gray-300 rounded focus:outline-none focus:border-[#00a884] focus:ring-2 focus:ring-[#00a884]/50 transition-all"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Mật khẩu
                        </label>
                        <input
                            type="password"
                            placeholder="Nhập password"
                            className="w-full p-3 bg-gray-50 text-gray-900 border border-gray-300 rounded focus:outline-none focus:border-[#00a884] focus:ring-2 focus:ring-[#00a884]/50 transition-all"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                    </div>

                    {/* Nút bấm làm to và đậm hơn chút */}
                    <button
                        type="submit"
                        className="w-full p-3 mt-4 bg-[#00a884] hover:bg-[#008f70] text-white font-bold text-lg rounded shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                    >
                        ĐĂNG NHẬP
                    </button>
                </form>

                {/* THAY ĐỔI 2: Cập nhật năm 2026 */}
                <p className="mt-8 text-center text-gray-400 text-xs font-medium">
                    NTG LOGIN & VIDEO EDITOR © 2026
                </p>
            </div>
        </div>
    );
}
