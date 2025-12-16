
// Helper component for User Menu in Sidebar
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { NavLink } from 'react-router-dom';

import Avatar, { genConfig } from 'react-nice-avatar';

export function UserMenu() {
    const { user, logout } = useAuth();
    const [showMenu, setShowMenu] = useState(false);

    // Thêm dòng này để xử lý avatar:
    const avatarConfig = user?.avatar ? JSON.parse(user.avatar) : genConfig(user?.username);

    return (
        <div className="relative">
            <div
                className="w-10 h-10 rounded-full border-2 border-white shadow-sm cursor-pointer hover:scale-105 transition-transform"
                onClick={() => setShowMenu(!showMenu)}
            >
                {/* Dùng thư viện Avatar thay vì chữ cái */}
                <Avatar className="w-full h-full" {...avatarConfig} />
            </div>

            {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-boxdark rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-strokedark">
                    <div className="px-4 py-2 text-sm text-black dark:text-white border-b border-gray-200 dark:border-strokedark">
                        Xin chào, <strong>{user?.fullName}</strong>
                        <p className="text-xs text-gray-500">{user?.role}</p>
                    </div>

                    {user?.role === 'ADMIN' && (
                        <NavLink to="/users" className="block px-4 py-2 text-sm text-black dark:text-white hover:bg-gray-100 dark:hover:bg-meta-4" onClick={() => setShowMenu(false)}>
                            Quản lý tài khoản
                        </NavLink>
                    )}

                    <button
                        onClick={logout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-meta-4"
                    >
                        Đăng xuất
                    </button>
                </div>
            )}
        </div>
    );
}
