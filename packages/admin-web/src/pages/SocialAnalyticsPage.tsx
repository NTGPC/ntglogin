import React, { useState, useEffect } from 'react';

import axios from 'axios';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { Copy, FileSpreadsheet, Play, Filter, Plus, Trash2, Edit, Save, X } from 'lucide-react'; // Thêm icon Edit, Save, X

const API_URL = 'http://localhost:3000/api/analytics';

export default function SocialAnalyticsPage() {
  const [viewMode, setViewMode] = useState<'LIST' | 'DETAIL'>('LIST');
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSession, setCurrentSession] = useState<any>(null);
  
  // State cho Form (Dùng chung cho Tạo Mới & Sửa)
  const [formData, setFormData] = useState({ id: '', name: '', url: '', min: 100000 });
  const [isEditing, setIsEditing] = useState(false); // Chế độ sửa
  useEffect(() => { loadSessions(); }, []);

  const loadSessions = async () => {
      try {
          const token = localStorage.getItem('auth_token');
          const res = await axios.get(`${API_URL}/list`, {
              headers: { Authorization: `Bearer ${token}` }
          });
          setSessions(res.data);
      } catch(e) { 
          console.error(e); 
      }
  };

  const resetForm = () => {
      setFormData({ id: '', name: '', url: '', min: 100000 });
      setIsEditing(false);
  };

  // Xử lý nút LƯU (Tạo mới hoặc Cập nhật)
  const handleSave = async () => {
      try {
          const token = localStorage.getItem('auth_token');
          if (isEditing) {
              // GỌI API SỬA
              await axios.put(`${API_URL}/${formData.id}`, { 
                  name: formData.name, targetUrl: formData.url, minView: formData.min 
              }, {
                  headers: { Authorization: `Bearer ${token}` }
              });
              alert("Đã cập nhật Project thành công! ✅");
          } else {
              // GỌI API TẠO MỚI
              await axios.post(`${API_URL}/create`, { 
                  name: formData.name, targetUrl: formData.url, minView: formData.min 
              }, {
                  headers: { Authorization: `Bearer ${token}` }
              });
          }
          resetForm();
          loadSessions();
      } catch(e: any) {
          alert("❌ Lỗi: " + (e.response?.data?.error || e.message));
      }
  };

  // Xử lý nút SỬA (Nạp dữ liệu vào form)
  const startEdit = (e: React.MouseEvent, s: any) => {
      e.stopPropagation();
      
      console.log("Đang sửa Project ID:", s.id); // Debug xem ID có chuẩn không
      
      setFormData({ 
          id: s.id, // <-- Quan trọng nhất dòng này
          name: s.name, 
          url: s.targetUrl, 
          min: s.minView 
      });
      setIsEditing(true);
      
      // Cuộn lên form
      window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  // Xử lý XÓA
  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
      e.stopPropagation();
      if (window.confirm(`Xóa project "${name}" và toàn bộ dữ liệu?`)) {
          try {
              const token = localStorage.getItem('auth_token');
              await axios.delete(`${API_URL}/${id}`, {
                  headers: { Authorization: `Bearer ${token}` }
              });
              loadSessions();
          } catch(err: any) {
              alert("Lỗi không xóa được: " + (err.response?.data?.error || err.message));
          }
      }
  };

  const openSession = async (id: string) => {
      try {
          const token = localStorage.getItem('auth_token');
          const res = await axios.get(`${API_URL}/${id}`, {
              headers: { Authorization: `Bearer ${token}` }
          });
          setCurrentSession(res.data);
          setViewMode('DETAIL');
      } catch(e: any) {
          alert("❌ Lỗi load session: " + (e.response?.data?.error || e.message));
      }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans">
      {viewMode === 'LIST' ? (
        <div>
           <h1 className="text-2xl font-bold mb-6 text-gray-800">🗂️ Quản Lý Project Phân Tích</h1>
           
           {/* FORM NHẬP LIỆU (TẠO / SỬA) */}
           <div className={`p-5 rounded-xl shadow-md mb-8 transition-all ${isEditing ? 'bg-yellow-50 border-2 border-yellow-400' : 'bg-white'}`}>
              <div className="flex justify-between mb-2">
                  <h3 className="font-bold text-gray-700 uppercase text-xs">
                      {isEditing ? '✏️ ĐANG CHỈNH SỬA PROJECT' : '✨ TẠO PROJECT MỚI'}
                  </h3>
                  {isEditing && <button onClick={resetForm} className="text-xs text-red-500 hover:underline">Hủy bỏ</button>}
              </div>
              
              <div className="flex gap-4 items-end">
                  <div className="flex-1">
                      <label className="text-xs font-bold text-gray-500">Tên Gợi Nhớ</label>
                      <input className="w-full border p-2 rounded mt-1" 
                          value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} placeholder="VD: Kênh Hài Hước" />
                  </div>
                  <div className="flex-[2]">
                      <label className="text-xs font-bold text-gray-500">Link Kênh</label>
                      <input className="w-full border p-2 rounded mt-1" 
                          value={formData.url} onChange={e=>setFormData({...formData, url: e.target.value})} placeholder="https://..." />
                  </div>
                  <div className="w-32">
                      <label className="text-xs font-bold text-gray-500">Min View</label>
                      <input type="number" className="w-full border p-2 rounded mt-1" 
                          value={formData.min} onChange={e=>setFormData({...formData, min: Number(e.target.value)})} />
                  </div>
                  <button onClick={handleSave} 
                      className={`p-2.5 rounded w-32 font-bold text-white flex justify-center items-center gap-2 shadow-sm hover:scale-105 transition-transform
                      ${isEditing ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
                      {isEditing ? <><Save size={16}/> LƯU</> : <><Plus size={16}/> TẠO MỚI</>}
                  </button>
              </div>
           </div>
           
           {/* DANH SÁCH PROJECT */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {sessions.map(ss => (
                  <div key={ss.id} onClick={() => openSession(ss.id)} 
                       className="group relative bg-white p-5 rounded-xl shadow-sm border border-gray-200 cursor-pointer hover:border-blue-500 hover:shadow-md transition-all">
                      
                      {/* BUTTON GROUP (EDIT & DELETE) */}
                      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => startEdit(e, ss)} className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-blue-100 hover:text-blue-600" title="Sửa">
                              <Edit size={14} />
                          </button>
                          <button onClick={(e) => handleDelete(e, ss.id, ss.name)} className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-red-100 hover:text-red-600" title="Xóa">
                              <Trash2 size={14} />
                          </button>
                      </div>
                      <h3 className="font-bold text-lg text-gray-800 pr-16 truncate">{ss.name}</h3>
                      <p className="text-sm text-gray-500 truncate mt-1">{ss.targetUrl}</p>
                      
                      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center text-xs font-medium text-gray-400">
                          <span className="bg-gray-100 px-2 py-1 rounded text-gray-600">Min: {ss.minView.toLocaleString()}</span>
                          <span>{format(new Date(ss.updatedAt), 'dd/MM/yyyy')}</span>
                      </div>
                  </div>
              ))}
              {sessions.length === 0 && (
                <div className="col-span-3 p-10 text-center text-gray-400">
                  Chưa có project nào. Tạo project mới để bắt đầu!
                </div>
              )}
           </div>
        </div>
      ) : (
        <SessionDetailView 
           session={currentSession} 
           onBack={() => { setViewMode('LIST'); loadSessions(); }} 
           refreshData={() => openSession(currentSession.id)}
        />
      )}
    </div>
  );
}

// --- COMPONENT CHI TIẾT (ĐÃ FIX LOGIC LỌC & HOVER) ---
function SessionDetailView({ session, onBack, refreshData }: any) {
    const [loading, setLoading] = useState(false);
    
    // MẶC ĐỊNH LÀ FALSE (HIỆN TẤT CẢ)
    const [filterHot, setFilterHot] = useState(false); 
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'lastUpdated', direction: 'desc' });

    if (!session) {
      return <div>Loading...</div>;
    }

    const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);

    // Logic Quét (Có Auto Refresh Realtime)
    const handleScan = async () => {
        setLoading(true);
        
        // --- BẮT ĐẦU CƠ CHẾ REALTIME ---
        // Cứ 2 giây gọi hàm refreshData một lần để cập nhật bảng
        const intervalId = setInterval(() => {
            console.log("Đang tải dữ liệu mới...");
            refreshData(); 
        }, 2000);
        try {
            const token = localStorage.getItem('auth_token');
            await axios.post('http://localhost:3000/api/analytics/scan', 
              { sessionId: session.id },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            alert("✅ Đã quét xong toàn bộ kênh!");
        } catch(e: any) { 
            console.error(e);
            alert("⚠️ Bot dừng: " + (e.response?.data?.error || e.message));
        } finally { 
            // Dừng refresh khi quét xong
            clearInterval(intervalId); 
            setLoading(false); 
            refreshData(); // Load lần cuối
        }
    };

    const handleExport = () => {
        const dataToExport = finalData.map(v => ({
            Link: v.videoUrl, View: v.rawView, Update: format(new Date(v.lastUpdated), 'dd/MM HH:mm'), Status: v.isDownloaded ? 'Done' : 'Pending'
        }));
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Data");
        XLSX.writeFile(wb, `Export.xlsx`);
    };

    const toggleStatus = async (videoId: number, currentStatus: boolean) => {
        session.videos = session.videos.map((v:any) => v.id === videoId ? { ...v, isDownloaded: !currentStatus } : v);
        refreshData(); 
        try {
            const token = localStorage.getItem('auth_token');
            await axios.put(`http://localhost:3000/api/analytics/video/${videoId}`, 
              { isDownloaded: !currentStatus },
              { headers: { Authorization: `Bearer ${token}` } }
            );
        } catch(e) {
            console.error("Lỗi lưu trạng thái", e);
            // Rollback
            session.videos = session.videos.map((v:any) => v.id === videoId ? { ...v, isDownloaded: currentStatus } : v);
            refreshData();
        }
    };

    // LOGIC LỌC CHUẨN MEN
    const processData = () => {
        let data = [...session.videos];

        // 1. Nếu Filter = TRUE -> Chỉ lấy video view >= minView
        //    Nếu Filter = FALSE -> Lấy hết (Không làm gì cả)
        if (filterHot) {
            data = data.filter((v: any) => v.viewCount >= session.minView);
        }

        if (searchTerm) data = data.filter((v: any) => v.videoUrl.includes(searchTerm));

        if (sortConfig.key) {
            data.sort((a: any, b: any) => {
                if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
                if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return data;
    };

    const finalData = processData();

    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'desc';
        if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <button onClick={onBack} className="text-gray-500 hover:text-black mb-1">← Quay lại</button>
                    <h1 className="text-2xl font-bold flex items-center gap-2">📂 {session.name}</h1>
                    <span className="text-blue-500 text-sm">{session.targetUrl}</span>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-black text-gray-800">{finalData.length}</div>
                    <div className="text-xs text-gray-500 font-bold uppercase">Video Hiển thị</div>
                </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4 flex gap-4 items-center justify-between">
                <div className="flex gap-3">
                    <button onClick={handleScan} disabled={loading} className={`px-5 py-2 rounded text-white font-bold ${loading ? 'bg-gray-400' : 'bg-purple-600 hover:bg-purple-700'}`}>
                        {loading ? 'Đang chạy...' : <><Play size={16} className="inline mr-1"/> QUÉT TIẾP</>}
                    </button>
                    {/* NÚT LỌC */}
                    <button onClick={() => setFilterHot(!filterHot)} 
                        className={`px-5 py-2 rounded border font-bold flex items-center gap-2 transition-all
                        ${filterHot ? 'bg-yellow-400 text-black border-yellow-500 shadow-inner' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
                        <Filter size={16}/> {filterHot ? 'ĐANG LỌC: CHỈ HIỆN HOT 🔥' : 'CHẾ ĐỘ: XEM TẤT CẢ'}
                    </button>
                </div>
                
                <div className="flex gap-3">
                    <input type="text" placeholder="🔍 Tìm link..." className="border p-2 rounded w-64" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
                    <button onClick={handleExport} className="px-4 py-2 border rounded hover:bg-green-50 text-green-700 font-bold"><FileSpreadsheet size={16} className="inline"/> Excel</button>
                </div>
            </div>
            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                <table className="w-full text-left">
                    <thead className="bg-gray-100 text-gray-600 text-xs font-bold uppercase">
                        <tr>
                            <th className="p-4 border-b">Video Link</th>
                            <th className="p-4 border-b cursor-pointer hover:bg-gray-200" onClick={() => requestSort('viewCount')}>Views ↕</th>
                            <th className="p-4 border-b cursor-pointer hover:bg-gray-200" onClick={() => requestSort('lastUpdated')}>Update ↕</th>
                            <th className="p-4 border-b text-center">Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {finalData.length > 0 ? finalData.map((vid: any) => {
                             const isHot = vid.viewCount >= session.minView;
                             
                             // LOGIC MÀU SẮC & HOVER
                             // 1. Luôn có hover (hover:bg-gray-50)
                             // 2. Nếu là HOT thì nền vàng nhạt, nhưng khi hover thì đậm hơn chút
                             // 3. Nếu đang Filter thì không cần tô màu nền nữa (vì toàn là hot rồi), chỉ tô khi xem ALL thôi
                             const rowClass = (!filterHot && isHot) ? 'bg-yellow-50 hover:bg-yellow-100' : 'hover:bg-gray-50';
                             return (
                                 <tr key={vid.id} className={`transition-colors ${rowClass}`}>
                                     <td className="p-3 border-r border-gray-100 flex items-center gap-3">
                                         <button onClick={() => copyToClipboard(vid.videoUrl)} className="p-1.5 rounded bg-gray-200 hover:bg-blue-200 text-gray-600"><Copy size={14}/></button>
                                         <a href={vid.videoUrl} target="_blank" className="text-blue-600 truncate max-w-md hover:underline font-mono text-sm">{vid.videoUrl}</a>
                                     </td>
                                     <td className="p-3 border-r border-gray-100">
                                         <span className={`font-bold ${isHot ? 'text-red-600 text-base' : 'text-gray-600'}`}>{vid.rawView}</span>
                                         {isHot && <span className="ml-2 text-[10px] bg-red-600 text-white px-1.5 rounded">HOT</span>}
                                     </td>
                                     <td className="p-3 text-sm text-gray-500 font-mono">{format(new Date(vid.lastUpdated), 'dd/MM HH:mm')}</td>
                                     <td className="p-3 text-center">
                                        <label className="inline-flex items-center cursor-pointer">
                                          <input type="checkbox" className="sr-only peer" checked={vid.isDownloaded || false} onChange={() => toggleStatus(vid.id, vid.isDownloaded || false)}/>
                                          <div className="relative w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                                        </label>
                                     </td>
                                 </tr>
                             )
                        }) : (
                            <tr>
                                <td colSpan={4} className="p-10 text-center text-gray-400">
                                    Không có dữ liệu hiển thị.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
