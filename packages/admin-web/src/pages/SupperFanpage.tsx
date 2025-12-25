import React, { useState, useEffect } from 'react';
import {
    Rocket, Plus, Activity, Globe, Youtube, Facebook,
    X, Save, User, Video, Link as LinkIcon, Loader2,
    Play, Pause, Trash2, Edit, RefreshCcw, Settings
} from 'lucide-react';
import { apiRequest } from '../utils/api';

const SupperFanpage = () => {
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [profiles, setProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        sourceUrls: '',
        profileId: '',
        fanpageIds: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const resCamp = await apiRequest('/campaigns', 'GET');
            if (resCamp.success) setCampaigns(resCamp.data);

            const resProf = await apiRequest('/profiles', 'GET');
            if (resProf.success && Array.isArray(resProf.data)) setProfiles(resProf.data);
            else console.warn("Không load được Profile hoặc data rỗng.");
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu:", error);
        }
        setLoading(false);
    };

    // Helper để lấy icon và tên nền tảng
    const getPlatformInfo = (url: string) => {
        if (!url) return { icon: <LinkIcon size={16} className="text-gray-400" />, name: 'OTHER' };
        try {
            const domain = new URL(url).hostname.toLowerCase();
            if (domain.includes('youtube') || domain.includes('youtu.be'))
                return { icon: <Youtube size={16} className="text-red-600" />, name: 'YOUTUBE' };
            if (domain.includes('facebook') || domain.includes('fb.watch'))
                return { icon: <Facebook size={16} className="text-blue-600" />, name: 'FACEBOOK' };
            if (domain.includes('tiktok'))
                return { icon: <Video size={16} className="text-black" />, name: 'TIKTOK' };
            return { icon: <LinkIcon size={16} className="text-gray-400" />, name: 'OTHER' };
        } catch {
            return { icon: <LinkIcon size={16} className="text-gray-400" />, name: 'INVALID' };
        }
    };

    // Hàm xử lý nút Sửa
    const handleEdit = (cam: any) => {
        setEditingId(cam.id);
        setFormData({
            name: cam.name,
            sourceUrls: cam.sources.map((s: any) => s.url).join('\n'),
            profileId: String(cam.destinations?.[0]?.profileId || ''),
            fanpageIds: cam.destinations.map((d: any) => {
                try { return d.pageUrl.split('asset_id=')[1] || '' }
                catch { return '' }
            }).join('\n')
        });
        setIsEditMode(true);
        setIsModalOpen(true);
    };

    // Hàm xử lý Tạo Mới hoặc Cập Nhật
    const handleCreateOrUpdate = async () => {
        if (!formData.name || !formData.sourceUrls || !formData.profileId || !formData.fanpageIds) {
            return alert("Vui lòng nhập đầy đủ thông tin!");
        }

        const listSources = formData.sourceUrls.split(/[\n,]+/).map(u => u.trim()).filter(u => u);
        const listPageIds = formData.fanpageIds.split(/[\n,]+/).map(id => id.trim()).filter(id => id);

        if (listSources.length === 0 || listPageIds.length === 0) return alert("Nguồn hoặc Đích không hợp lệ!");

        const sourcesData = listSources.map(url => ({
            url: url,
            platform: getPlatformInfo(url).name
        }));

        const destinationsData = listPageIds.map(pageId => ({
            profileId: Number(formData.profileId),
            pageUrl: `https://business.facebook.com/latest/bulk_upload_composer?asset_id=${pageId}`
        }));

        let res;
        if (isEditMode && editingId !== null) {
            // Xóa chiến dịch cũ và tạo mới (vì backend chưa hỗ trợ update full)
            await apiRequest(`/campaigns/${editingId}`, 'DELETE');
            res = await apiRequest('/campaigns', 'POST', {
                name: formData.name,
                backfillMode: false,
                sources: sourcesData,
                destinations: destinationsData
            });
        } else {
            res = await apiRequest('/campaigns', 'POST', {
                name: formData.name,
                backfillMode: false,
                sources: sourcesData,
                destinations: destinationsData
            });
        }

        if (res && res.success) {
            alert(`✅ ${isEditMode ? 'Cập nhật' : 'Tạo'} chiến dịch thành công!`);
            setIsModalOpen(false);
            setFormData({ name: '', sourceUrls: '', profileId: '', fanpageIds: '' });
            setEditingId(null);
            setIsEditMode(false);
            loadData();
        } else {
            alert("❌ Lỗi: " + (res?.error || "Lỗi không xác định"));
        }
    };

    // Hàm thay đổi trạng thái Running/Paused
    const handleToggleStatus = async (id: number, currentStatus: string) => {
        const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
        try {
            const res = await apiRequest(`/campaigns/${id}`, 'PUT', { status: newStatus });
            if (res.success) {
                setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
            } else {
                alert("Lỗi khi cập nhật trạng thái!");
            }
        } catch (e) {
            alert("Lỗi mạng!");
        }
    };

    // Hàm xóa chiến dịch
    const handleDelete = async (id: number) => {
        if (!window.confirm("Bạn chắc chắn muốn xóa chiến dịch này?")) return;
        try {
            const res = await apiRequest(`/campaigns/${id}`, 'DELETE');
            if (res.success) {
                alert("✅ Xóa thành công!");
                loadData();
            } else {
                alert("❌ Lỗi khi xóa!");
            }
        } catch (e) {
            alert("Lỗi mạng!");
        }
    };

    const openCreateModal = () => {
        setIsEditMode(false);
        setEditingId(null);
        setFormData({ name: '', sourceUrls: '', profileId: '', fanpageIds: '' });
        setIsModalOpen(true);
    };

    // --- RENDER ---
    return (
        <div className="p-6 bg-slate-50 min-h-screen font-sans text-slate-800">

            {/* HEADER */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-900">
                        <Rocket className="text-teal-600" /> Supper Fanpage
                    </h1>
                    <p className="text-sm text-slate-500">Hệ thống nuôi Page & Reup Video tự động</p>
                </div>
                <div className="flex gap-3">
                    {/* Nút Refresh để load lại data */}
                    <button onClick={loadData} className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium border border-slate-200 text-slate-500 hover:bg-slate-100 transition">
                        <RefreshCcw size={16} /> Refresh
                    </button>
                    <button onClick={openCreateModal} className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-lg transition">
                        <Plus size={20} /> Tạo Chiến Dịch
                    </button>
                </div>
            </div>

            {/* DASHBOARD CARDS */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                {/* Card Đang chạy */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                    <div className="text-slate-500 text-xs font-bold uppercase mb-2">Đang chạy</div>
                    <div className="text-3xl font-black text-green-600">
                        {campaigns.filter(c => c.status === 'ACTIVE').length}
                    </div>
                </div>
                {/* Card Chiến dịch */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                    <div className="text-slate-500 text-xs font-bold uppercase mb-2">Chiến dịch</div>
                    <div className="text-3xl font-black text-blue-600">{campaigns.length}</div>
                </div>
                {/* Card Profile */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                    <div className="text-slate-500 text-xs font-bold uppercase mb-2">Profile hoạt động</div>
                    <div className="text-3xl font-black text-purple-600">{profiles.length}</div>
                </div>
                {/* Card Lỗi/Treo */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                    <div className="text-slate-500 text-xs font-bold uppercase mb-2">Lỗi / Treo</div>
                    <div className="text-3xl font-black text-red-500">0</div>
                </div>
            </div>

            {/* DANH SÁCH CHIẾN DỊCH */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-slate-700">Danh sách Chiến Dịch</h3>
                </div>

                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase">
                        <tr>
                            <th className="p-4">ID</th>
                            <th className="p-4">Tên Chiến Dịch</th>
                            <th className="p-4">Nguồn</th>
                            <th className="p-4">Profile</th>
                            <th className="p-4">Đích</th>
                            <th className="p-4">Trạng thái</th>
                            <th className="p-4 text-center">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                        {campaigns.length > 0 ? campaigns.map(cam => (
                            <tr key={cam.id} className="hover:bg-slate-50 transition">
                                <td className="p-4 text-slate-500">#{cam.id}</td>
                                <td className="p-4 font-bold text-slate-800">{cam.name}</td>
                                <td className="p-4">
                                    <div className="flex -space-x-2 items-center">
                                        {cam.sources?.slice(0, 3).map((s: any, i: number) => {
                                            const info = getPlatformInfo(s.url);
                                            return (
                                                <div key={i} className="w-8 h-8 rounded-full bg-white border-2 border-slate-100 shadow-sm flex items-center justify-center" title={s.url}>
                                                    {info.icon}
                                                </div>
                                            )
                                        })}
                                        {(cam.sources?.length || 0) > 3 && <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-xs font-bold text-slate-500">+{cam.sources.length - 3}</div>}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg w-fit">
                                        <User size={14} className="text-slate-500" />
                                        <span className="font-medium text-slate-700">{profiles.find(p => p.id === cam.destinations?.[0]?.profileId)?.name || `ID: ${cam.destinations?.[0]?.profileId}`}</span>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">
                                        {cam.destinations?.length || 0} Pages
                                    </span>
                                </td>
                                <td className="p-4">
                                    {cam.status === 'ACTIVE'
                                        ? <span className="flex items-center gap-1 text-green-600 font-bold text-xs bg-green-50 px-2 py-1 rounded"><Activity size={14} /> Running</span>
                                        : <span className="flex items-center gap-1 text-slate-400 font-bold text-xs bg-slate-100 px-2 py-1 rounded"><Pause size={14} /> Paused</span>
                                    }
                                </td>
                                <td className="p-4 text-center">
                                    <div className="flex justify-center gap-2">
                                        <button
                                            onClick={() => handleToggleStatus(cam.id, cam.status)}
                                            className={`p-2 rounded transition ${cam.status === 'ACTIVE' ? 'text-yellow-600 hover:bg-yellow-50' : 'text-green-600 hover:bg-green-50'}`}
                                            title={cam.status === 'ACTIVE' ? 'Tạm dừng' : 'Chạy ngay'}
                                        >
                                            {cam.status === 'ACTIVE' ? <Pause size={18} /> : <Play size={18} />}
                                        </button>
                                        <button onClick={() => handleEdit(cam)} className="p-2 text-blue-600 hover:bg-blue-50 rounded transition" title="Sửa">
                                            <Edit size={18} />
                                        </button>
                                        <button onClick={() => handleDelete(cam.id)} className="p-2 text-red-500 hover:bg-red-50 rounded transition" title="Xóa">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                                    {loading ? <span className="flex items-center justify-center gap-2"><Loader2 className="animate-spin" /> Đang tải...</span> : "Chưa có chiến dịch nào."}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* --- MODAL TẠO/SỬA CHIẾN DỊCH --- */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-in fade-in zoom-in duration-200">
                    <div className="bg-white rounded-xl w-[600px] shadow-2xl flex flex-col overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
                            <h2 className="text-lg font-bold text-slate-800">
                                {isEditMode ? 'Chỉnh Sửa Chiến Dịch' : 'Thiết lập Chiến Dịch Mới'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)}><X className="text-slate-400 hover:text-red-500" /></button>
                        </div>

                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            {/* Tên chiến dịch */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Tên chiến dịch</label>
                                <input className="w-full border p-2.5 rounded-lg focus:border-teal-500 outline-none" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Ví dụ: Reup Phim Hài..." />
                            </div>

                            {/* Nguồn Video */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Nguồn Video (Youtube/Facebook/Tiktok)</label>
                                <div className="relative">
                                    <div className="absolute left-2.5 top-2.5"><Globe size={16} className="text-slate-400" /></div>
                                    <textarea className="w-full border p-2.5 pl-9 rounded-lg focus:border-teal-500 outline-none h-24 text-sm font-mono" value={formData.sourceUrls} onChange={e => setFormData({ ...formData, sourceUrls: e.target.value })} placeholder="Dán link nguồn vào đây (Mỗi dòng 1 link)..." />
                                </div>
                            </div>

                            {/* Chọn Profile */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Chọn Profile Upload</label>
                                <div className="relative">
                                    <User className="absolute left-2.5 top-2.5 text-slate-400" size={16} />
                                    <select className="w-full border p-2.5 pl-9 rounded-lg focus:border-teal-500 outline-none bg-white appearance-none" value={formData.profileId} onChange={e => setFormData({ ...formData, profileId: e.target.value })}>
                                        <option value="">-- Chọn Profile Nuôi Nick --</option>
                                        {profiles.map((p) => (<option key={p.id} value={p.id}>{p.name} (ID: {p.id})</option>))}
                                    </select>
                                </div>
                            </div>

                            {/* Nhập List Fanpage ID */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Danh sách ID Fanpage Đích</label>
                                <div className="relative">
                                    <div className="absolute left-2.5 top-2.5 text-blue-600"><Facebook size={16} /></div>
                                    <textarea
                                        className="w-full border p-2.5 pl-9 rounded-lg focus:border-teal-500 outline-none font-mono h-24 text-sm"
                                        placeholder="Nhập ID Fanpage (Mỗi dòng 1 ID)..."
                                        value={formData.fanpageIds}
                                        onChange={e => setFormData({ ...formData, fanpageIds: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-slate-600 font-bold hover:bg-white border rounded-lg">Hủy</button>
                            <button onClick={handleCreateOrUpdate} className="px-6 py-2 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 shadow-lg flex items-center gap-2">
                                <Save size={18} /> {isEditMode ? 'Cập Nhật' : 'Lưu & Kích Hoạt'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default SupperFanpage;
