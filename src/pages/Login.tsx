import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Zap } from 'lucide-react';

const Login = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Fake login để test
        if (username === 'admin' && password === 'admin') {
            localStorage.setItem('auth_token', 'fake-token');
            navigate('/dashboard');
        } else {
            alert("Sai mật khẩu! (Thử admin/admin)");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-xl mb-4">
                        <Zap size={24} fill="currentColor" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">Đăng Nhập Hệ Thống</h2>
                </div>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="relative">
                        <User className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input type="text" className="w-full pl-10 pr-4 py-2 border rounded-lg" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input type="password" className="w-full pl-10 pr-4 py-2 border rounded-lg" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700">
                        Đăng Nhập
                    </button>
                </form>
                <div className="mt-4 text-center">
                    <a href="/" className="text-sm text-gray-500 hover:text-blue-600">Quay lại trang chủ</a>
                </div>
            </div>
        </div>
    );
};

export default Login;