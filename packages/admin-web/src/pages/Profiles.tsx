import React, { useState, useEffect } from 'react';
import { User, Plus, Trash2, Globe, Monitor } from 'lucide-react';

declare global { interface Window { electronAPI: any; } }

const Profiles = () => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [proxy, setProxy] = useState('');
  const [userAgent, setUserAgent] = useState('Mozilla/5.0 (Windows NT 10.0; Win64; x64)...');

  // --- API ---
  const getApi = () => (window as any).electronAPI?.profile;

  useEffect(() => { loadProfiles(); }, []);

  const loadProfiles = async () => {
    setLoading(true);
    const api = getApi();
    if (api) {
      const res = await api.getAll();
      if (res.success) setProfiles(res.data);
      else console.error(res.error);
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    const api = getApi();
    if (!api) return;

    // Gửi dữ liệu xuống Backend (Native)
    const res = await api.create({
      name: name || `Profile ${profiles.length + 1}`,
      proxy,
      userAgent
    });

    if (res.success) {
      alert("✅ Tạo Profile thành công!");
      setIsModalOpen(false);
      loadProfiles();
    } else {
      alert("❌ Lỗi: " + res.error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Xóa profile này?")) return;
    const api = getApi();
    if (api && (await api.delete(id)).success) loadProfiles();
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center">
          <Monitor className="mr-2" /> Quản Lý Profiles
        </h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-teal-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-teal-700">
          <Plus size={20} /> Tạo Mới
        </button>
      </div>

      {/* LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {profiles.map(p => (
          <div key={p.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                  {p.id}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{p.name}</h3>
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <Globe size={10} /> {p.rawProxy || 'No Proxy'}
                  </div>
                </div>
              </div>
              <button onClick={() => handleDelete(p.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={18} /></button>
            </div>
            <div className="text-xs text-gray-400 bg-gray-50 p-2 rounded truncate">
              {p.userAgent || 'Default UA'}
            </div>
            <button className="w-full mt-3 border border-blue-600 text-blue-600 py-1.5 rounded font-bold text-sm hover:bg-blue-50">
              Mở Browser
            </button>
          </div>
        ))}
      </div>

      {/* MODAL CREATE */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-[600px] shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Tạo Profile Mới</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Tên Profile</label>
                <input className="w-full border p-2 rounded" value={name} onChange={e => setName(e.target.value)} placeholder="Nhập tên..." />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Proxy (IP:Port:User:Pass)</label>
                <input className="w-full border p-2 rounded" value={proxy} onChange={e => setProxy(e.target.value)} placeholder="Để trống nếu không dùng" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">User Agent</label>
                <textarea className="w-full border p-2 rounded h-20 text-xs" value={userAgent} onChange={e => setUserAgent(e.target.value)} />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded">Hủy</button>
              <button onClick={handleCreate} className="px-6 py-2 bg-teal-600 text-white font-bold rounded hover:bg-teal-700">Tạo Ngay</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profiles;
