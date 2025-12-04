import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

// Config API URL (Lấy từ biến môi trường hoặc hardcode localhost)
const API_URL = 'http://localhost:3000/api/social'; 

export default function SocialAnalyticsPage() {
  const [url, setUrl] = useState('https://www.tiktok.com/@sitcomtaichinh');
  const [minView, setMinView] = useState(100000); 
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await axios.get(`${API_URL}/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVideos(res.data);
    } catch(e) { 
      console.error(e); 
    }
  };

  const handleScan = async () => {
    setLoading(true);
    
    // --- CƠ CHẾ AUTO REFRESH (POLLING) ---
    // Cứ 3 giây reload bảng 1 lần trong khi bot đang chạy
    const intervalId = setInterval(() => {
        loadData(); // Gọi hàm lấy danh sách từ DB
    }, 3000);
    
    try {
      const token = localStorage.getItem('auth_token');
      // Gọi lệnh Quét (Lệnh này sẽ chạy rất lâu, nhưng kệ nó)
      await axios.post(`${API_URL}/scan`, 
        { channelUrl: url, minView },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`✅ Đã quét xong toàn bộ kênh!`);
    } catch (e: any) {
      alert("⚠️ Quá trình quét dừng hoặc lỗi: " + (e.response?.data?.error || e.message));
    } finally {
      // Khi quét xong (hoặc lỗi), dừng việc auto refresh
      clearInterval(intervalId);
      setLoading(false);
      loadData(); // Load lần cuối chốt hạ
    }
  };

  const toggleDownload = async (id: number, current: boolean) => {
    // Optimistic Update
    setVideos(prev => prev.map(v => v.id === id ? {...v, isDownloaded: !current} : v));
    try {
      const token = localStorage.getItem('auth_token');
      await axios.put(`${API_URL}/${id}/status`, 
        { isDownloaded: !current },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (e) {
      // Revert on error
      setVideos(prev => prev.map(v => v.id === id ? {...v, isDownloaded: current} : v));
      console.error('Failed to update status:', e);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
        📊 Tool Phân Tích Mạng Xã Hội (Content Hunter)
      </h1>

      {/* INPUT SECTION (ĐÃ UPDATE GIAO DIỆN) */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
      {/* Ô Link Kênh - Cho dài ra (Chiếm 8 cột) */}
      <div className="md:col-span-8">
        <label className="text-xs font-bold text-gray-500 uppercase">Link Kênh (TikTok / Facebook)</label>
        <input 
          type="text" 
          className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-blue-500 outline-none" 
          value={url} 
          onChange={e => setUrl(e.target.value)} 
          placeholder="https://www.tiktok.com/@... hoặc https://www.facebook.com/PageName" 
        />
      </div>
        {/* Ô Min View - (Chiếm 2 cột) */}
        <div className="md:col-span-2">
          <label className="text-xs font-bold text-gray-500 uppercase">Min View (Tô màu)</label>
          <input 
            type="number" 
            className="w-full border p-2 rounded mt-1" 
            value={minView} 
            onChange={e => setMinView(Number(e.target.value))} 
          />
        </div>
        {/* Nút Quét - (Chiếm 2 cột) */}
        <div className="md:col-span-2">
          <button 
            onClick={handleScan} 
            disabled={loading}
            className={`w-full py-2.5 rounded text-white font-bold shadow-md transition-all ${
              loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-105'
            }`}
          >
            {loading ? 'Đang chạy...' : 'QUÉT ALL 🚀'}
          </button>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-bold">
            <tr>
              <th className="p-4">Video Link</th>
              <th className="p-4">Views</th>
              <th className="p-4">Ngày Cập Nhật</th>
              <th className="p-4 text-center">Trạng Thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {videos.map((vid) => {
              const isHighView = vid.viewCount >= vid.minViewThreshold;
              return (
                <tr key={vid.id} className={`hover:bg-gray-50 transition-colors ${isHighView ? 'bg-yellow-50' : ''}`}>
                  <td className="p-4 max-w-lg truncate">
                    <a 
                      href={vid.videoUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-blue-600 font-medium hover:underline flex items-center gap-2"
                    >
                      🎥 {vid.videoUrl.replace('https://www.tiktok.com/@', '')}
                    </a>
                  </td>
                  <td className="p-4">
                    <div className="flex items-baseline gap-2">
                      <span className={`text-lg font-bold ${isHighView ? 'text-red-600' : 'text-gray-800'}`}>
                        {vid.rawView || '0'}
                      </span>
                      {isHighView && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">HOT 🔥</span>}
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-500">
                    {format(new Date(vid.lastUpdated), 'dd/MM/yyyy HH:mm')}
                  </td>
                  <td className="p-4 text-center">
                    <label className="inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={vid.isDownloaded}
                        onChange={() => toggleDownload(vid.id, vid.isDownloaded)}
                      />
                      <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      <span className="ml-3 text-sm font-medium text-gray-900">
                        {vid.isDownloaded ? 'Đã Tải ✅' : 'Chưa Tải'}
                      </span>
                    </label>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {videos.length === 0 && (
          <div className="p-10 text-center text-gray-400">
            Chưa có dữ liệu. Nhập link và bấm nút Quét ALL đi bro!
          </div>
        )}
      </div>
    </div>
  );
}

