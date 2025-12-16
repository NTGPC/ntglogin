
import React, { useState, useEffect } from 'react';
import Avatar, { genConfig } from 'react-nice-avatar'; // #1 Thư viện Avatar

export default function UserManagement() {
    const [users, setUsers] = useState([]);

    // State cho Form tạo mới
    const [newUser, setNewUser] = useState({ username: '', password: '', fullName: '', role: 'USER', avatarConfig: genConfig() });

    // State cho Modal Edit
    const [editingUser, setEditingUser] = useState<any>(null);
    const [resetPassUser, setResetPassUser] = useState<any>(null);
    const [newPassInput, setNewPassInput] = useState('');

    const fetchUsers = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/users');
            const data = await res.json();
            setUsers(data);
        } catch (e) { console.error(e); }
    };

    useEffect(() => { fetchUsers(); }, []);

    // --- HÀM XỬ LÝ ---
    const handleCreate = async () => {
        if (!newUser.username || !newUser.password) return alert("Vui lòng nhập đủ thông tin");

        await fetch('http://localhost:3000/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...newUser,
                avatar: JSON.stringify(newUser.avatarConfig) // Lưu config avatar thành chuỗi
            })
        });
        setNewUser({ ...newUser, username: '', password: '', fullName: '', avatarConfig: genConfig() }); // Reset form và random avatar mới
        fetchUsers();
    };

    const handleUpdate = async () => {
        if (!editingUser) return;
        await fetch(`http://localhost:3000/api/users/${editingUser.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fullName: editingUser.fullName,
                role: editingUser.role,
                avatar: JSON.stringify(editingUser.avatarConfig)
            })
        });
        setEditingUser(null);
        fetchUsers();
    };

    const handleResetPass = async () => {
        if (!resetPassUser || !newPassInput) return;
        await fetch(`http://localhost:3000/api/users/${resetPassUser.id}/password`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newPassword: newPassInput })
        });
        setResetPassUser(null);
        setNewPassInput('');
        alert("Đã đổi mật khẩu!");
    };

    const handleDelete = async (id: number) => {
        if (window.confirm("Bạn chắc chắn muốn xóa user này?")) {
            await fetch(`http://localhost:3000/api/users/${id}`, { method: 'DELETE' });
            fetchUsers();
        }
    };

    // Hàm Random avatar khi click vào hình
    const refreshAvatar = (isEditing: boolean) => {
        const newConfig = genConfig();
        if (isEditing && editingUser) {
            setEditingUser({ ...editingUser, avatarConfig: newConfig });
        } else {
            setNewUser({ ...newUser, avatarConfig: newConfig });
        }
    };

    return (
        <div className="p-6 text-gray-800 bg-gray-50 min-h-screen">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">Quản Lý Tài Khoản</h2>

            {/* --- FORM TẠO MỚI (Đã fix #2, #3) --- */}
            <div className="mb-8 bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <h3 className="font-semibold mb-4 text-gray-600">Thêm tài khoản mới</h3>
                <div className="flex flex-wrap gap-4 items-end">

                    {/* #1 Avatar Picker: Click để đổi */}
                    <div className="flex flex-col items-center gap-2 cursor-pointer group" onClick={() => refreshAvatar(false)}>
                        <div className="w-12 h-12 border-2 border-transparent group-hover:border-green-500 rounded-full transition">
                            <Avatar className="w-12 h-12" {...newUser.avatarConfig} />
                        </div>
                        <span className="text-xs text-blue-500 underline">Đổi Avatar</span>
                    </div>

                    <div className="flex-1 min-w-[150px]">
                        <label className="block text-xs font-bold text-gray-500 mb-1">Username</label>
                        {/* #2 Fix Input: Có viền border-gray-300 */}
                        <input
                            className="w-full bg-white border border-gray-300 p-2.5 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all shadow-sm"
                            placeholder="Nhập tên đăng nhập"
                            value={newUser.username}
                            onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                        />
                    </div>

                    <div className="flex-1 min-w-[150px]">
                        <label className="block text-xs font-bold text-gray-500 mb-1">Password</label>
                        <input
                            className="w-full bg-white border border-gray-300 p-2.5 rounded focus:outline-none focus:ring-2 focus:ring-green-500 transition-all shadow-sm"
                            placeholder="Nhập mật khẩu"
                            value={newUser.password}
                            onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                        />
                    </div>

                    <div className="flex-1 min-w-[150px]">
                        <label className="block text-xs font-bold text-gray-500 mb-1">Họ Tên</label>
                        <input
                            className="w-full bg-white border border-gray-300 p-2.5 rounded focus:outline-none focus:ring-2 focus:ring-green-500 transition-all shadow-sm"
                            placeholder="Tên hiển thị"
                            value={newUser.fullName}
                            onChange={e => setNewUser({ ...newUser, fullName: e.target.value })}
                        />
                    </div>

                    <div className="w-32">
                        <label className="block text-xs font-bold text-gray-500 mb-1">Quyền</label>
                        <select
                            className="w-full bg-white border border-gray-300 p-2.5 rounded focus:ring-2 focus:ring-green-500 shadow-sm"
                            value={newUser.role}
                            onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                        >
                            <option value="USER">User</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                    </div>

                    {/* #3 Fix Button: Thêm hover, shadow, transition */}
                    <button
                        onClick={handleCreate}
                        className="bg-green-600 hover:bg-green-700 active:scale-95 text-white px-6 py-2.5 rounded font-bold shadow-md transition-all duration-200 h-[42px]"
                    >
                        + Tạo Mới
                    </button>
                </div>
            </div>

            {/* --- DANH SÁCH (Đã fix #4: Thêm cột Hành động) --- */}
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-100 text-gray-600 text-sm uppercase font-bold">
                        <tr>
                            <th className="p-4 border-b">Avatar</th>
                            <th className="p-4 border-b">Username</th>
                            <th className="p-4 border-b">Tên Hiển Thị</th>
                            <th className="p-4 border-b">Quyền</th>
                            <th className="p-4 border-b text-center">Hành Động (#4)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.map((u: any) => {
                            // Parse config avatar từ DB
                            const avatarConfig = u.avatar ? JSON.parse(u.avatar) : genConfig(u.username);
                            return (
                                <tr key={u.id} className="hover:bg-gray-50 transition">
                                    <td className="p-4">
                                        <div className="w-10 h-10">
                                            <Avatar className="w-10 h-10" {...avatarConfig} />
                                        </div>
                                    </td>
                                    <td className="p-4 font-medium">{u.username}</td>
                                    <td className="p-4 text-gray-600">{u.fullName}</td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    {/* #4 Cột Edit & Reset Pass */}
                                    <td className="p-4 text-center">
                                        <div className="flex items-center justify-center gap-3">

                                            {/* Nút 1: Sửa Info (Icon Bút chì) */}
                                            <button
                                                onClick={() => setEditingUser({ ...u, avatarConfig })}
                                                className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm group"
                                                title="Sửa thông tin"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                </svg>
                                            </button>

                                            {/* Nút 2: Đổi Pass (Icon Chìa khóa) */}
                                            <button
                                                onClick={() => setResetPassUser(u)}
                                                className="p-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-600 hover:text-white transition-all shadow-sm"
                                                title="Đổi mật khẩu"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                                </svg>
                                            </button>

                                            {/* Nút 3: Xóa (Icon Thùng rác) */}
                                            <button
                                                onClick={() => handleDelete(u.id)}
                                                className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm"
                                                title="Xóa tài khoản"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="3 6 5 6 21 6"></polyline>
                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                    <line x1="10" y1="11" x2="10" y2="17"></line>
                                                    <line x1="14" y1="11" x2="14" y2="17"></line>
                                                </svg>
                                            </button>

                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/* --- MODAL EDIT INFO --- */}
            {editingUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-96 shadow-xl">
                        <h3 className="text-xl font-bold mb-4">Cập nhật thông tin</h3>

                        <div className="flex justify-center mb-4" onClick={() => refreshAvatar(true)}>
                            <div className="w-20 h-20 cursor-pointer relative group">
                                <Avatar className="w-20 h-20" {...editingUser.avatarConfig} />
                                <div className="absolute inset-0 bg-black bg-opacity-20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white text-xs font-bold">
                                    Click đổi
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-gray-500">Họ tên</label>
                                <input
                                    className="w-full border p-2 rounded"
                                    value={editingUser.fullName}
                                    onChange={e => setEditingUser({ ...editingUser, fullName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500">Quyền</label>
                                <select
                                    className="w-full border p-2 rounded"
                                    value={editingUser.role}
                                    onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}
                                >
                                    <option value="USER">User</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-2">
                            <button onClick={() => setEditingUser(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Hủy</button>
                            <button onClick={handleUpdate} className="px-4 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700">Lưu</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL RESET PASS --- */}
            {resetPassUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-96 shadow-xl">
                        <h3 className="text-lg font-bold mb-4 text-orange-600">Đổi mật khẩu: {resetPassUser.username}</h3>
                        <input
                            type="text"
                            className="w-full border p-2 rounded focus:ring-2 focus:ring-orange-500 outline-none"
                            placeholder="Nhập mật khẩu mới"
                            value={newPassInput}
                            onChange={e => setNewPassInput(e.target.value)}
                        />
                        <div className="mt-6 flex justify-end gap-2">
                            <button onClick={() => { setResetPassUser(null); setNewPassInput('') }} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Hủy</button>
                            <button onClick={handleResetPass} className="px-4 py-2 bg-orange-600 text-white rounded font-bold hover:bg-orange-700">Xác nhận</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
