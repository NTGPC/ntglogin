import React, { useState, useEffect } from 'react';
import { Smartphone, Folder, Play, Type, RefreshCw, CheckCircle, Settings, Image, FileVideo, HardDrive } from 'lucide-react';

interface VideoFile { id: number; name: string; fullPath: string; status: string; }
interface FileItem { name: string; path: string; }

export default function EditRatioVideo() {
    const [folderPath, setFolderPath] = useState('');
    const [videos, setVideos] = useState<VideoFile[]>([]);
    const [framePath, setFramePath] = useState('');
    const [fonts, setFonts] = useState<FileItem[]>([]);
    const [frames, setFrames] = useState<FileItem[]>([]);

    const [style, setStyle] = useState({
        titleText: '', prefix: '', suffix: '', removeHashtag: true,
        fontPath: '', fontSize: 60, textColor: '#ffffff', borderColor: '#000000', borderSize: 2,
        outputFolder: 'D:\\render_output'
    });

    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState('Ready');

    // Load tài nguyên (Font, Logo)
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Load Font
                const resFont = await fetch('http://localhost:3000/api/reels/fonts');
                const dataFont = await resFont.json();
                if (dataFont.fonts) {
                    setFonts(dataFont.fonts);
                    if (dataFont.fonts.length) setStyle(s => ({ ...s, fontPath: dataFont.fonts[0].path }));
                }
                // Load Frame
                const resFrame = await fetch('http://localhost:3000/api/reels/frames');
                const dataFrame = await resFrame.json();
                if (dataFrame.frames) setFrames(dataFrame.frames);
            } catch (e) { console.error("Lỗi kết nối server"); }
        };
        fetchData();
    }, []);

    // --- HÀM SCAN FOLDER (GIỐNG VIDEO EDITOR STUDIO) ---
    const scanFolder = async () => {
        if (!folderPath) return alert("⚠️ Vui lòng nhập đường dẫn folder Video vào ô!");
        try {
            const res = await fetch('http://localhost:3000/api/reels/scan-folder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ folderPath })
            });
            const data = await res.json();
            if (data.files && data.files.length > 0) {
                setVideos(data.files);
            } else {
                alert("❌ Không tìm thấy video nào trong thư mục này!");
                setVideos([]);
            }
        } catch (e) { alert("❌ Lỗi kết nối Backend. Server đã bật chưa?"); }
    };

    // --- MẸO: HÀM CHỌN FILE/FOLDER BẰNG INPUT CỦA TRÌNH DUYỆT ---
    // Lưu ý: Cách này chỉ hoạt động tương đối trên Web.
    // Để ngon nhất, bro copy đường dẫn paste vào ô.
    // Nhưng tôi sẽ cố gắng lấy đường dẫn nếu có thể.

    const handleFileChange = (e: any, setFunc: any) => {
        if (e.target.files && e.target.files.length > 0) {
            // TRÊN WEB: Bro chỉ nhận được tên file.
            // TRÊN APP .EXE: Bro nhận được đường dẫn full.
            const file = e.target.files[0];
            if (file.path) {
                // Nếu chạy bằng Electron (.exe) -> Ngon, lấy được full path
                setFunc(file.path);
            } else {
                // Nếu chạy bằng Web -> Không lấy được D:\...
                // GIẢI PHÁP: Hiển thị thông báo hướng dẫn người dùng Paste đường dẫn
                alert(`⚠️ TRÊN TRÌNH DUYỆT WEB: Google CHẶN lấy đường dẫn ổ cứng (D:\\...).\n\n👉 Bro vui lòng mở thư mục, COPY đường dẫn trên thanh địa chỉ và PASTE vào ô này nhé!\n\n(Chỉ khi đóng gói ra file .EXE nút này mới tự điền được)`);
            }
        }
    };

    const startRender = async () => {
        if (videos.length === 0) return alert("Chưa có video!");
        if (!style.outputFolder) return alert("Chưa chọn Output Folder");

        setIsProcessing(true); // Khóa nút
        setStatusText("🚀 Đang khởi động...");
        setProgress(0);

        try {
            // Gọi API bắt đầu
            await fetch('http://localhost:3000/api/reels/start-render', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    videos,
                    outputDir: style.outputFolder,
                    useTitle: false, // Set to false since we're using framePath overlay
                    style
                })
            });

            // Vòng lặp kiểm tra tiến độ
            const interval = setInterval(async () => {
                try {
                    const res = await fetch('http://localhost:3000/api/reels/progress');
                    const data = await res.json();

                    if (data.progress >= 0) {
                        setProgress(data.progress);
                    }

                    // Nếu xong (100) hoặc Lỗi (-1) thì DỪNG
                    if (data.progress >= 100 || data.progress === -1) {
                        clearInterval(interval);
                        setIsProcessing(false);

                        if (data.progress === 100) {
                            alert("✅ Render Xong Toàn Bộ! Kiểm tra thư mục Output.");
                        } else {
                            alert("❌ Có lỗi xảy ra! Check Terminal để xem chi tiết.");
                        }
                    }
                } catch (e) {
                    clearInterval(interval);
                    setIsProcessing(false);
                }
            }, 1000); // Check mỗi 1 giây

        } catch (e) {
            setIsProcessing(false);
            setStatusText("❌ LỖI!");
            alert("Lỗi kết nối Server!");
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-60px)] bg-gray-100 text-sm font-sans">
            <div className="flex flex-1 overflow-hidden p-3 gap-3">

                {/* === CỘT TRÁI: DANH SÁCH VIDEO === */}
                <div className="w-1/2 flex flex-col bg-white rounded-lg shadow-md border border-gray-200">
                    <div className="p-3 border-b bg-gray-50 font-bold text-gray-700 flex items-center gap-2">
                        <FileVideo className="text-blue-600" size={18} />
                        DANH SÁCH VIDEO ({videos.length})
                    </div>

                    <div className="p-3 border-b bg-white space-y-2">
                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <input
                                    className="w-full border border-gray-300 p-2 pl-9 rounded focus:ring-2 focus:ring-blue-500 outline-none transition"
                                    placeholder="D:\Videos\Nguon..."
                                    value={folderPath} onChange={e => setFolderPath(e.target.value)}
                                />
                                <Folder className="absolute left-2.5 top-2.5 text-gray-400" size={16} />
                            </div>
                            {/* Nút Scan Xịn */}
                            <button onClick={scanFolder} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-bold flex items-center gap-2 shadow-sm active:scale-95 transition">
                                <RefreshCw size={16} /> Quét (Scan)
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 italic ml-1">*Paste đường dẫn thư mục vào ô rồi bấm Quét</p>
                    </div>

                    <div className="flex-1 overflow-auto bg-gray-50">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-200 text-gray-700 sticky top-0 text-xs uppercase font-semibold">
                                <tr>
                                    <th className="p-3 border-b w-12 text-center">#</th>
                                    <th className="p-3 border-b">Tên Video</th>
                                    <th className="p-3 border-b w-28 text-center">Trạng Thái</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {videos.map((v, idx) => (
                                    <tr key={v.id} className="hover:bg-blue-50 transition-colors">
                                        <td className="p-3 text-center text-gray-500">{idx + 1}</td>
                                        <td className="p-3 font-medium text-gray-800 truncate max-w-[200px]" title={v.name}>{v.name}</td>
                                        <td className="p-3 text-center">
                                            {v.status === 'Waiting' && <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs">Waiting</span>}
                                            {v.status.includes('Running') && <span className="px-2 py-1 bg-orange-100 text-orange-600 rounded text-xs font-bold animate-pulse">{v.status}</span>}
                                            {v.status === 'Done' && <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold flex items-center justify-center gap-1"><CheckCircle size={12} /> Done</span>}
                                            {v.status === 'Error' && <span className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs font-bold">Failed</span>}
                                        </td>
                                    </tr>
                                ))}
                                {videos.length === 0 && (
                                    <tr><td colSpan={3} className="p-10 text-center text-gray-400">Chưa có video. Vui lòng nhập đường dẫn và bấm Quét.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* === CỘT PHẢI: CẤU HÌNH === */}
                <div className="w-1/2 bg-white rounded-lg shadow-md border border-gray-200 flex flex-col">
                    <div className="p-3 border-b bg-gray-50 font-bold text-gray-700 flex items-center gap-2">
                        <Settings className="text-teal-600" size={18} />
                        CẤU HÌNH RENDER
                    </div>

                    <div className="p-5 space-y-6 overflow-auto custom-scrollbar">

                        {/* 1. Chọn Khung */}
                        <div className="bg-teal-50 p-4 rounded-lg border border-teal-100">
                            <label className="block font-bold text-xs text-teal-800 mb-2 flex items-center gap-1 uppercase">
                                <Image size={14} /> 1. Chọn Khung Ảnh (.png)
                            </label>
                            <select
                                className="w-full border border-teal-200 p-2.5 rounded mb-2 text-sm bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                                onChange={e => { if (e.target.value) setFramePath(e.target.value); }}
                                value={framePath}
                            >
                                <option value="">-- Chọn ảnh trong folder 'logo' --</option>
                                {frames.map((f, i) => (
                                    <option key={i} value={f.path}>{f.name}</option>
                                ))}
                            </select>
                            {/* Input dự phòng */}
                            <input
                                className="w-full border p-2 rounded text-xs text-gray-500 bg-white"
                                placeholder="Hoặc paste đường dẫn ảnh từ bên ngoài vào đây..."
                                value={framePath} onChange={e => setFramePath(e.target.value)}
                            />
                        </div>

                        {/* 2. Chọn Font */}
                        <div>
                            <label className="block font-bold text-xs text-gray-600 mb-2 uppercase">2. Chọn Font Chữ</label>
                            <select className="w-full border border-gray-300 p-2.5 rounded bg-white text-sm" value={style.fontPath} onChange={e => setStyle({ ...style, fontPath: e.target.value })}>
                                {fonts.length === 0 && <option>⚠️ Chưa có font (Tạo folder 'fonts' ở gốc dự án)</option>}
                                {fonts.map((f, i) => <option key={i} value={f.path}>{f.name}</option>)}
                            </select>
                        </div>

                        {/* 3. Xử lý Text */}
                        <div className="border border-gray-200 p-4 rounded-lg space-y-3">
                            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                <label className="font-bold flex gap-2 text-sm text-gray-700"><Type size={16} /> 3. Xử lý Tiêu Đề</label>
                                <label className="flex items-center gap-2 cursor-pointer select-none bg-red-50 px-2 py-1 rounded border border-red-100">
                                    <input type="checkbox" className="accent-red-500" checked={style.removeHashtag} onChange={e => setStyle({ ...style, removeHashtag: e.target.checked })} />
                                    <span className="text-xs font-semibold text-red-600">Xóa Hashtag (#abc)</span>
                                </label>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] text-gray-400 uppercase font-bold">Thêm Đầu (Prefix)</label>
                                    <input className="w-full border p-2 rounded text-sm" placeholder="VD: Tin Hot -" value={style.prefix} onChange={e => setStyle({ ...style, prefix: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-[10px] text-gray-400 uppercase font-bold">Thêm Đuôi (Suffix)</label>
                                    <input className="w-full border p-2 rounded text-sm" placeholder="VD: - Xem Ngay" value={style.suffix} onChange={e => setStyle({ ...style, suffix: e.target.value })} />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] text-gray-400 uppercase font-bold">Nội dung cố định (Tùy chọn)</label>
                                <input className="w-full border p-2 rounded text-sm" placeholder="Nhập để thay thế toàn bộ tên file..." value={style.titleText} onChange={e => setStyle({ ...style, titleText: e.target.value })} />
                            </div>
                        </div>

                        {/* 4. Màu sắc & Size */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold block text-gray-600">Màu chữ & Cỡ chữ</label>
                                <div className="flex gap-2">
                                    <input type="color" className="h-9 w-10 p-0 border cursor-pointer rounded" value={style.textColor} onChange={e => setStyle({ ...style, textColor: e.target.value })} />
                                    <input type="number" className="border p-2 w-full rounded text-sm" value={style.fontSize} onChange={e => setStyle({ ...style, fontSize: Number(e.target.value) })} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold block text-gray-600">Màu viền & Độ dày</label>
                                <div className="flex gap-2">
                                    <input type="color" className="h-9 w-10 p-0 border cursor-pointer rounded" value={style.borderColor} onChange={e => setStyle({ ...style, borderColor: e.target.value })} />
                                    <input type="number" className="border p-2 w-full rounded text-sm" value={style.borderSize} onChange={e => setStyle({ ...style, borderSize: Number(e.target.value) })} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- PHẦN DƯỚI: ACTION --- */}
            <div className="p-4 bg-white border-t border-gray-200 shadow-lg z-10 flex gap-4 items-end">
                <div className="flex-1">
                    <label className="block font-bold text-xs mb-1 text-gray-600 flex items-center gap-1">
                        <HardDrive size={14} /> THƯ MỤC LƯU KẾT QUẢ (OUTPUT)
                    </label>
                    <div className="flex gap-2">
                        <input
                            className="flex-1 border border-gray-300 p-2.5 rounded bg-gray-50 font-mono text-sm text-gray-700"
                            value={style.outputFolder}
                            onChange={e => setStyle({ ...style, outputFolder: e.target.value })}
                        />
                    </div>
                </div>

                <button
                    onClick={startRender}
                    disabled={isProcessing}
                    className={`h-11 px-8 rounded-lg font-bold text-white shadow-lg flex gap-2 items-center justify-center transition-all transform active:scale-95 ${isProcessing
                        ? 'bg-orange-400 cursor-not-allowed opacity-80' // Màu cam khi đang chạy
                        : 'bg-green-600 hover:bg-green-700' // Màu xanh khi rảnh
                        }`}
                >
                    {isProcessing ? <RefreshCw className="animate-spin" /> : <Play fill="currentColor" />}
                    {isProcessing ? `ĐANG CHẠY (${progress}%)` : 'BẮT ĐẦU RENDER'}
                </button>
            </div>

            {/* Progress Bar */}
            {isProcessing && (
                <div className="h-1.5 bg-gray-200 w-full overflow-hidden">
                    <div className="h-full bg-green-500 transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
                </div>
            )}
        </div>
    );
}
