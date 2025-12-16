import React, { createContext, useState, useContext, useEffect } from 'react';

interface User {
    id: number;
    username: string;
    fullName: string;
    role: 'ADMIN' | 'USER';
    avatar?: string;
}

const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: any) => {
    // --- SỬA ĐOẠN NÀY ---
    // Thay vì để null, ta bắt nó đọc localStorage NGAY LẬP TỨC khi khởi tạo state
    const [user, setUser] = useState<User | null>(() => {
        try {
            const storedUser = localStorage.getItem('user');
            const token = localStorage.getItem('token');
            // Chỉ khi có cả User và Token thì mới coi là đã đăng nhập
            if (storedUser && token) {
                return JSON.parse(storedUser);
            }
            return null;
        } catch (error) {
            return null;
        }
    });
    // --------------------

    const login = (userData: User, token: string) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        // Chuyển hướng cứng về login để xóa sạch state rác nếu cần
        window.location.href = '/login';
    };

    // Thêm cái này để check token hết hạn (Option bổ sung)
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
