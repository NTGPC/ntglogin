import React, { useState, useEffect, useMemo } from 'react';
import { User, Trash2, Edit, Lock, RefreshCw, UserPlus, X, Save, Check, KeyRound, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import Avatar, { genConfig } from 'react-nice-avatar';

// Fix TypeScript
declare global {
    interface Window {
        electronAPI: any;
    }
}

const UserManagement = () => {
    // --- STATE ---
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isApp, setIsApp] = useState(true);

    // Form State (Create)
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showCreatePass, setShowCreatePass] = useState(false); // Trạng thái ẩn/hiện pass tạo mới
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState('USER');

    // AVATAR LOCK
    const [avatarSeed, setAvatarSeed] = useState(Date.now());
    const lockedAvatarConfig = useMemo(() => {
        return genConfig();
    }, [avatarSeed]);

    // Modal State
    const [editingUser, setEditingUser] = useState<any>(null);
    const [pwdUser, setPwdUser] = useState<any>(null);
    const [newPassword, setNewPassword] = useState('');
    const [showChangePass, setShowChangePass] = useState(false); // Trạng thái ẩn/hiện pass đổi mới

    // --- API HELPER ---
    const getApi = () => (window as any).electronAPI?.user;

    // --- EFFECT ---
    useEffect(() => {
        if (!window.electronAPI) {
            setIsApp(false);
            return;
        }
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        const api = getApi();
        if (api) {
            const res = await api.getAll();
            if (res.success) {
                setUsers(res.data);
            } else {
                console.error(res.error);
            }
        }
        setLoading(false);
    };

    // --- HELPERS ---
    const renderAvatar = (avatarStr: any, size = '2.5rem') => {
        try {
            const config = typeof avatarStr === 'string' ? JSON.parse(avatarStr) : avatarStr;
            return <Avatar style={{ width: size, height: size }} {...config} />;
        } catch (e) {
            return <div style={{ width: size, height: size }} className="bg-gray-300 rounded-full"></div>;
        }
    };

    // --- ACTIONS ---
    const handleRandomAvatar = () => setAvatarSeed(Date.now());

    const handleCreateUser = async () => {
        if (!username || !password) return alert("Thiếu Username hoặc Password!");
        const api = getApi();
        if (!api) return;

        setLoading(true);
        const res = await api.create({
            username, password, fullName, role, avatarConfig: lockedAvatarConfig
        });
        setLoading(false);

        if (res.success) {
            alert("✅ Tạo thành công!");
            setUsername(''); setPassword(''); setFullName('');
            handleRandomAvatar();
            loadUsers();
        } else {
            alert("❌ Lỗi: " + res.error);
        }
    };

    const handleDeleteUser = async (id: number, username: string) => {
        if (!window.confirm(`Xóa user "${username}"?`)) return;
        const api = getApi();
        const res = await api.delete(id);
        if (res.success) loadUsers();
        else alert("Lỗi khi xóa: " + res.error);
    };

    const openEditModal = (user: any) => {
        let parsedAvatar = user.avatar;
        try { parsedAvatar = JSON.parse(user.avatar); } catch { }
        setEditingUser({ ...user, avatarConfig: parsedAvatar });
    };

    const handleUpdateUser = async () => {
        if (!editingUser) return;
        const api = getApi();
        const res = await api.update({
            id: editingUser.id,
            fullName: editingUser.fullName,
            role: editingUser.role,
            avatarConfig: editingUser.avatarConfig
        });

        if (res.success) {
            alert("✅ Cập nhật thành công!");
            setEditingUser(null);
            loadUsers();
        } else {
            alert("❌ Lỗi: " + res.error);
        }
    };

    const handleChangePassword = async () => {
        if (!pwdUser || !newPassword) return alert("Chưa nhập mật khẩu mới!");
        const api = getApi();
        const res = await api.changePassword({
            id: pwdUser.id,
            newPassword: newPassword
        });

        if (res.success) {
            alert("✅ Đổi mật khẩu thành công!");
            setPwdUser(null);
            setNewPassword(''); // Reset
        } else {
            alert("❌ Lỗi Backend: " + res.error);
        }
    };

    // --- RENDER ---
    if (!isApp) return <div className="p-10 text-center">Vui lòng chạy trên App (.exe)</div>;

    return (
        <div className="p-6 bg-gray-50 min-h-screen text-slate-800 font-sans relative">

            <h1 className="text-2xl font-bold mb-6 text-gray-800 flex items-center">
                <User className="mr-2" /> Quản Lý Tài Khoản
            </h1>

            {/* FORM TẠO MỚI */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
                <h2 className="text-lg font-bold mb-4 text-teal-700 flex items-center">
                    <UserPlus size={20} className="mr-2" /> Thêm tài khoản mới
                </h2>
                <div className="flex gap-6 items-start">
                    {/* Cột Avatar */}
                    <div className="flex flex-col items-center gap-2">
                        <Avatar style={{ width: '5rem', height: '5rem' }} {...lockedAvatarConfig} />
                        <button onClick={handleRandomAvatar} className="text-xs text-blue-600 hover:underline flex items-center cursor-pointer">
                            <RefreshCw size={12} className="mr-1" /> Đổi Avatar
                        </button>
                    </div>

                    {/* Cột Form */}
                    <div className="flex-1 grid grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                className="w-full border p-2 rounded text-sm outline-none focus:border-teal-500"
                                placeholder="admin123"
                            />
                        </div>

                        {/* PASSWORD INPUT (CREATE) */}
                        <div className="relative">
                            <label className="block text-xs font-bold text-gray-500 mb-1">Password</label>
                            <input
                                type={showCreatePass ? "text" : "password"}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full border p-2 rounded text-sm outline-none focus:border-teal-500 pr-8"
                                placeholder="******"
                            />
                            <button
                                onClick={() => setShowCreatePass(!showCreatePass)}
                                className="absolute right-2 top-8 text-gray-400 hover:text-gray-600"
                                tabIndex={-1}
                            >
                                {showCreatePass ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Họ Tên</label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={e => setFullName(e.target.value)}
                                className="w-full border p-2 rounded text-sm outline-none focus:border-teal-500"
                                placeholder="Tên hiển thị"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Quyền</label>
                            <div className="flex gap-2">
                                <select
                                    value={role}
                                    onChange={e => setRole(e.target.value)}
                                    className="flex-1 border p-2 rounded text-sm outline-none focus:border-teal-500"
                                >
                                    <option value="USER">Member</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                                <button onClick={handleCreateUser} className="bg-green-600 hover:bg-green-700 text-white px-3 rounded font-bold text-sm flex items-center gap-1">
                                    + Tạo
                                </button>
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
                            <th className="p-4 border-b w-24 text-center">Avatar</th>
                            <th className="p-4 border-b">Username</th>
                            <th className="p-4 border-b">Tên hiển thị</th>
                            <th className="p-4 border-b">Role</th>
                            <th className="p-4 border-b text-center w-32">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50 transition">
                                <td className="p-4 flex justify-center">{renderAvatar(user.avatar)}</td>
                                <td className="p-4 font-bold">{user.username}</td>
                                <td className="p-4 text-gray-600">{user.fullName || '-'}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="p-4 text-center">
                                    <div className="flex justify-center gap-2">
                                        <button onClick={() => openEditModal(user)} className="p-2 bg-yellow-50 text-yellow-600 rounded hover:bg-yellow-100" title="Sửa thông tin">
                                            <Edit size={16} />
                                        </button>
                                        <button onClick={() => { setPwdUser(user); setNewPassword(''); }} className="p-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100" title="Đổi mật khẩu">
                                            <Lock size={16} />
                                        </button>
                                        <button onClick={() => handleDeleteUser(user.id, user.username)} className="p-2 bg-red-50 text-red-600 rounded hover:bg-red-100" title="Xóa">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && !loading && <tr><td colSpan={5} className="p-6 text-center text-gray-400">Danh sách trống</td></tr>}
                    </tbody>
                </table>
            </div>

            {/* --- MODAL EDIT INFO --- */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in zoom-in duration-200">
                    <div className="bg-white p-6 rounded-lg w-[500px] shadow-xl border border-gray-200">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h3 className="text-lg font-bold text-gray-800">Sửa thông tin: {editingUser.username}</h3>
                            <button onClick={() => setEditingUser(null)} className="hover:text-red-500"><X size={20} /></button>
                        </div>
                        <div className="flex gap-4 mb-4">
                            <div className="flex flex-col items-center">
                                <Avatar style={{ width: '4rem', height: '4rem' }} {...editingUser.avatarConfig} />
                                <button onClick={() => setEditingUser({ ...editingUser, avatarConfig: genConfig() })} className="text-xs text-blue-600 mt-2 hover:underline">
                                    Đổi Avatar
                                </button>
                            </div>
                            <div className="flex-1 space-y-3">
                                <div>
                                    <label className="text-xs font-bold text-gray-500">Họ Tên</label>
                                    <input className="w-full border p-2 rounded text-sm focus:border-blue-500 outline-none" value={editingUser.fullName || ''} onChange={e => setEditingUser({ ...editingUser, fullName: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500">Quyền</label>
                                    <select className="w-full border p-2 rounded text-sm focus:border-blue-500 outline-none" value={editingUser.role} onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}>
                                        <option value="USER">Member</option>
                                        <option value="ADMIN">Admin</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <button onClick={handleUpdateUser} className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700 flex justify-center gap-2">
                            <Save size={18} /> Lưu Thay Đổi
                        </button>
                    </div>
                </div>
            )}

            {/* --- MODAL CHANGE PASSWORD --- */}
            {pwdUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in zoom-in duration-200">
                    <div className="bg-white p-6 rounded-lg w-[400px] shadow-xl border border-gray-200">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <KeyRound size={20} /> Đổi pass: <span className="text-blue-600">{pwdUser.username}</span>
                            </h3>
                            <button onClick={() => setPwdUser(null)} className="hover:text-red-500"><X size={20} /></button>
                        </div>

                        <div className="mb-4 relative">
                            <label className="text-xs font-bold text-gray-500 mb-1 block">Mật khẩu mới</label>
                            <input
                                type={showChangePass ? "text" : "password"}
                                className="w-full border p-2 rounded text-sm focus:border-red-500 outline-none pr-8"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                placeholder="Nhập mật khẩu mới..."
                                autoFocus
                            />
                            <button
                                onClick={() => setShowChangePass(!showChangePass)}
                                className="absolute right-2 top-8 text-gray-400 hover:text-gray-600"
                                tabIndex={-1}
                            >
                                {showChangePass ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>

                        <button onClick={handleChangePassword} className="w-full bg-red-600 text-white py-2 rounded font-bold hover:bg-red-700 flex justify-center gap-2">
                            <Check size={18} /> Xác Nhận Đổi
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default UserManagement;
