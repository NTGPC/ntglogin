import React, { useState, useEffect, useMemo } from 'react';
import { User, Trash2, Edit, Lock, RefreshCw, UserPlus, X, Save, Check, KeyRound, Eye, EyeOff } from 'lucide-react';
import Avatar, { genConfig } from 'react-nice-avatar';
import { apiRequest } from '../utils/api'; // Import API

const UserManagement = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Form State
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState('USER');
    const [showCreatePass, setShowCreatePass] = useState(false);

    // Avatar
    const [avatarSeed, setAvatarSeed] = useState(Date.now());
    const lockedAvatarConfig = useMemo(() => genConfig(), [avatarSeed]);

    // Edit/Password Modal
    const [editingUser, setEditingUser] = useState<any>(null);
    const [pwdUser, setPwdUser] = useState<any>(null);
    const [newPassword, setNewPassword] = useState('');

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        // GỌI API LẤY DANH SÁCH USER TỪ DOCKER
        const res = await apiRequest('/users', 'GET');
        if (res.success) {
            setUsers(res.data);
        } else {
            console.error(res.error);
        }
        setLoading(false);
    };

    const handleCreateUser = async () => {
        if (!username || !password) return alert("Thiếu Username hoặc Password!");

        // GỌI API TẠO USER
        const res = await apiRequest('/users', 'POST', {
            username, password, fullName, role,
            avatarConfig: lockedAvatarConfig
        });

        if (res.success) {
            alert("✅ Tạo tài khoản thành công (Đã lưu vào Docker)!");
            setUsername(''); setPassword(''); setFullName('');
            setAvatarSeed(Date.now());
            loadUsers();
        } else {
            alert("❌ Lỗi: " + res.error);
        }
    };

    // Helper render Avatar
    const renderAvatar = (avatarStr: any) => {
        try {
            const config = typeof avatarStr === 'string' ? JSON.parse(avatarStr) : avatarStr;
            return <Avatar style={{ width: '2.5rem', height: '2.5rem' }} {...config} />;
        } catch (e) {
            return <div className="w-10 h-10 bg-gray-300 rounded-full"></div>;
        }
    };

    return (
        <div className="p-6 bg-slate-50 min-h-screen text-slate-800 font-sans relative">
            <h1 className="text-2xl font-bold mb-6 text-gray-800 flex items-center">
                <User className="mr-2" /> Quản Lý Tài Khoản (Server Docker)
            </h1>

            {/* FORM TẠO MỚI */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
                <h2 className="text-lg font-bold mb-4 text-teal-700 flex items-center"><UserPlus size={20} className="mr-2" /> Thêm mới</h2>
                <div className="flex gap-6 items-start">
                    <div className="flex flex-col items-center gap-2">
                        <Avatar style={{ width: '5rem', height: '5rem' }} {...lockedAvatarConfig} />
                        <button onClick={() => setAvatarSeed(Date.now())} className="text-xs text-blue-600 hover:underline flex items-center"><RefreshCw size={12} className="mr-1" /> Random</button>
                    </div>
                    <div className="flex-1 grid grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Username</label>
                            <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full border p-2 rounded text-sm outline-none focus:border-teal-500" placeholder="admin123" />
                        </div>
                        <div className="relative">
                            <label className="block text-xs font-bold text-gray-500 mb-1">Password</label>
                            <input type={showCreatePass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} className="w-full border p-2 rounded text-sm outline-none focus:border-teal-500 pr-8" placeholder="******" />
                            <button onClick={() => setShowCreatePass(!showCreatePass)} className="absolute right-2 top-8 text-gray-400">{showCreatePass ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Họ Tên</label>
                            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full border p-2 rounded text-sm outline-none focus:border-teal-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Quyền</label>
                            <div className="flex gap-2">
                                <select value={role} onChange={e => setRole(e.target.value)} className="flex-1 border p-2 rounded text-sm outline-none focus:border-teal-500">
                                    <option value="USER">Member</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                                <button onClick={handleCreateUser} className="bg-green-600 hover:bg-green-700 text-white px-3 rounded font-bold text-sm">+ Tạo</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* DANH SÁCH USER */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-100 text-gray-600 text-xs font-bold uppercase">
                        <tr>
                            <th className="p-4 border-b">Avatar</th>
                            <th className="p-4 border-b">Username</th>
                            <th className="p-4 border-b">Tên hiển thị</th>
                            <th className="p-4 border-b">Role</th>
                            <th className="p-4 border-b text-center">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50 transition">
                                <td className="p-4">{renderAvatar(user.avatar)}</td>
                                <td className="p-4 font-bold">{user.username}</td>
                                <td className="p-4 text-gray-600">{user.fullName}</td>
                                <td className="p-4"><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold">{user.role}</span></td>
                                <td className="p-4 text-center text-gray-400">Chức năng sửa/xóa đang cập nhật API...</td>
                            </tr>
                        ))}
                        {users.length === 0 && !loading && <tr><td colSpan={5} className="p-6 text-center text-gray-400">Danh sách trống</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserManagement;
