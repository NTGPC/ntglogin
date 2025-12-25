// Đây là địa chỉ Server Node.js bạn vừa chạy
export const API_URL = 'http://localhost:4000/api';

// Hàm gọi API nhanh gọn
export const apiRequest = async (endpoint: string, method = 'GET', body?: any) => {
    const headers = {
        'Content-Type': 'application/json',
        // Sau này có thể thêm Token vào đây
    };

    const config: RequestInit = {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    };

    try {
        const response = await fetch(`${API_URL}${endpoint}`, config);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API Error:', error);
        return { success: false, error: 'Lỗi kết nối Server!' };
    }
};
