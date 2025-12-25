import React, { useState, useEffect } from 'react';
import { Play, Folder, Image, Settings, RefreshCw, Type, Save, Upload, FileVideo, Trash2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const EditRatio = () => {
    // --- STATE ---
    const [folderPath, setFolderPath] = useState('');
    const [videos, setVideos] = useState<any[]>([]);
    const [fonts, setFonts] = useState<string[]>([]);

    // Settings
    const [pngPath, setPngPath] = useState('');
    const [selectedFont, setSelectedFont] = useState('');
    const [textColor, setTextColor] = useState('#000000');
    const [textSize, setTextSize] = useState(60);
    const [borderColor, setBorderColor] = useState('#00FF00');
    const [borderSize, setBorderSize] = useState(2);

    // Text Transform
    const [isUpperCase, setIsUpperCase] = useState(false);
    const [isFirstLetter, setIsFirstLetter] = useState(false);

    // Clear Title Settings
    const [removeSpaces, setRemoveSpaces] = useState(true);
    const [removeHashtag, setRemoveHashtag] = useState(true);
    const [deleteChars, setDeleteChars] = useState('');
    const [prefix, setPrefix] = useState('');
    const [suffix, setSuffix] = useState('');

    // Output
    const [outputFolder, setOutputFolder] = useState('D:\\render_output');

    // Processing
    const [isProcessing, setIsProcessing] = useState(false);
    const [progressMap, setProgressMap] = useState<{ [key: string]: number }>({});

    // --- API HELPER ---
    const getApi = () => (window as any).electronAPI?.videoEditor;

    // --- EFFECT ---
    useEffect(() => {
        const api = getApi();
        if (api) {
            loadFonts();
            api.onProgress(({ fileName, percent }: any) => {
                setProgressMap(prev => ({ ...prev, [fileName]: percent }));
            });
            api.onComplete(({ fileName }: any) => {
                setVideos(prev => prev.map(v => v.name === fileName ? { ...v, status: 'success' } : v));
                setProgressMap(prev => ({ ...prev, [fileName]: 100 }));
            });
            api.onError(({ fileName, error }: any) => {
                setVideos(prev => prev.map(v => v.name === fileName ? { ...v, status: 'failed' } : v));
            });
        }
        return () => {
            if (api) api.removeAllListeners();
        };
    }, []);

    const loadFonts = async () => {
        const api = getApi();
        if (!api) return;
        try {
            const f = await api.getFonts();
            setFonts(f);
            if (f.length > 0) setSelectedFont(f[0]);
        } catch (err) { console.error(err); }
    };

    // --- HANDLERS ---
    const handleBrowseFolder = async () => {
        const api = getApi(); if (!api) return;
        const path = await api.openFolder();
        if (path) {
            setFolderPath(path);
            const list = await api.scanVideos(path);
            setVideos(list);
        }
    };

    const handleBrowsePng = async () => {
        const api = getApi(); if (!api) return;
        const path = await api.openFile();
        if (path) setPngPath(path);
    };

    const handleBrowseOutput = async () => {
        const api = getApi(); if (!api) return;
        const path = await api.openFolder();
        if (path) setOutputFolder(path);
    };

    // --- LOGIC ACTIONS ---
    const handleClearTitle = async () => {
        const api = getApi(); if (!api) return;
        if (videos.length === 0) return alert("Chưa có video!");

        setIsProcessing(true);
        const newVideos = [];
        for (const vid of videos) {
            const res = await api.processTitle({
                videoPath: vid.path,
                removeSpaces, removeHashtag, deleteChars, prefix, suffix
            });
            if (res.success) {
                newVideos.push({ ...vid, name: res.newName, path: res.newPath, txtPath: res.txtPath });
            } else {
                newVideos.push(vid);
            }
        }
        setVideos(newVideos);
        setIsProcessing(false);
        alert("✅ Xong Bước 1: Đã xử lý tiêu đề & tạo file TXT!");
    };

    const handleCreatePng = async () => {
        const api = getApi(); if (!api) return;
        if (!pngPath) return alert("Chưa chọn ảnh PNG mẫu!");

        setIsProcessing(true);
        const updatedVideos = [];
        for (const vid of videos) {
            if (!vid.txtPath) {
                updatedVideos.push(vid); continue;
            }
            const res = await api.createPng({
                txtPath: vid.txtPath,
                bgPath: pngPath,
                fontName: selectedFont,
                color: textColor,
                size: Number(textSize),
                borderInfo: { color: borderColor, size: Number(borderSize) },
                isUpperCase, isFirstLetter
            });
            if (res.success) {
                updatedVideos.push({ ...vid, pngPath: res.pngPath });
            } else {
                updatedVideos.push(vid);
            }
        }
        setVideos(updatedVideos);
        setIsProcessing(false);
        alert("✅ Xong Bước 2: Đã tạo ảnh PNG Overlay!");
    };

    const handleStartRender = () => {
        const api = getApi(); if (!api) return;
        if (!outputFolder) return alert("Chưa chọn folder Output!");

        let hasJob = false;
        videos.forEach(vid => {
            if (vid.pngPath) {
                hasJob = true;
                setVideos(prev => prev.map(v => v.id === vid.id ? { ...v, status: 'processing' } : v));
                api.renderVideo({
                    videoPath: vid.path,
                    pngPath: vid.pngPath,
                    outputFolder
                });
            }
        });
        if (!hasJob) alert("Chưa có video nào đủ điều kiện (Cần chạy bước 1 & 2 trước)!");
    };

    // --- UI RENDER (LIGHT THEME - LAYOUT HÌNH 2) ---
    return (
        <div className="flex h-screen bg-gray-50 text-slate-800 font-sans p-4 gap-4 overflow-hidden">

            {/* --- CỘT TRÁI: DANH SÁCH VIDEO (65%) --- */}
            <div className="w-[65%] flex flex-col gap-4">

                {/* 1. Header & Input */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center gap-2 mb-2 text-teal-700 font-bold uppercase">
                        <FileVideo size={20} /> Danh sách Video ({videos.length})
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={folderPath}
                            readOnly
                            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-teal-500"
                            placeholder="Đường dẫn thư mục video..."
                        />
                        <button
                            onClick={handleBrowseFolder}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium flex items-center gap-2 transition"
                        >
                            <Folder size={16} /> Browser
                        </button>
                    </div>
                </div>

                {/* 2. Table List */}
                <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                    <div className="overflow-y-auto flex-1">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-100 text-gray-600 text-xs font-bold uppercase sticky top-0 z-10">
                                <tr>
                                    <th className="p-3 border-b">#</th>
                                    <th className="p-3 border-b">Tên Video</th>
                                    <th className="p-3 border-b text-center w-24">TXT</th>
                                    <th className="p-3 border-b text-center w-24">PNG</th>
                                    <th className="p-3 border-b text-center w-28">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-gray-100">
                                {videos.map((vid, idx) => (
                                    <tr key={idx} className="hover:bg-teal-50 transition">
                                        <td className="p-3 text-center text-gray-500">{idx + 1}</td>
                                        <td className="p-3 font-medium text-gray-700 truncate max-w-md" title={vid.name}>
                                            {vid.name}
                                            {/* Progress Bar */}
                                            {(vid.status === 'processing' || vid.status === 'success') && (
                                                <div className="w-full bg-gray-200 h-1.5 mt-1 rounded-full overflow-hidden">
                                                    <div className="bg-green-500 h-full transition-all" style={{ width: `${progressMap[vid.name] || 0}%` }}></div>
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-3 text-center">
                                            {vid.txtPath ? <CheckCircle size={16} className="text-green-500 mx-auto" /> : <span className="text-gray-300">-</span>}
                                        </td>
                                        <td className="p-3 text-center">
                                            {vid.pngPath ? <CheckCircle size={16} className="text-blue-500 mx-auto" /> : <span className="text-gray-300">-</span>}
                                        </td>
                                        <td className="p-3 text-center">
                                            {vid.status === 'success' && <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded font-bold">Thành công</span>}
                                            {vid.status === 'failed' && <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded font-bold">Thất bại</span>}
                                            {vid.status === 'processing' && <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded font-bold animate-pulse">Đang chạy</span>}
                                            {vid.status === 'pending' && <span className="text-gray-400 text-xs">Chờ...</span>}
                                        </td>
                                    </tr>
                                ))}
                                {videos.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-10 text-center text-gray-400 italic">Vui lòng bấm nút Quét để tải video.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Output Folder at Bottom of Left Panel */}
                    <div className="p-3 bg-gray-50 border-t border-gray-200">
                        <label className="text-xs font-bold text-gray-500 mb-1 block">THƯ MỤC LƯU KẾT QUẢ (OUTPUT):</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={outputFolder}
                                readOnly
                                className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm bg-white"
                            />
                            <button onClick={handleBrowseOutput} className="bg-gray-200 hover:bg-gray-300 px-3 rounded text-gray-700"><Folder size={14} /></button>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- CỘT PHẢI: CẤU HÌNH RENDER (35%) --- */}
            <div className="w-[35%] bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden">
                <div className="p-3 bg-teal-50 border-b border-teal-100 text-teal-800 font-bold flex items-center gap-2">
                    <Settings size={18} /> CẤU HÌNH RENDER
                </div>

                <div className="p-4 flex-1 overflow-y-auto space-y-5">

                    {/* 1. Chọn PNG */}
                    <div>
                        <label className="block text-xs font-bold text-teal-700 mb-1">1. CHỌN KHUNG ẢNH (.PNG)</label>
                        <div className="flex gap-2">
                            <select className="flex-1 border border-gray-300 rounded p-2 text-sm bg-white focus:border-teal-500 outline-none">
                                <option>{pngPath ? pngPath.split('\\').pop() : 'Chưa chọn ảnh...'}</option>
                            </select>
                            <input type="text" value={pngPath} className="hidden" readOnly />
                        </div>
                        <div className="mt-1 text-right">
                            <button onClick={handleBrowsePng} className="text-xs text-blue-600 hover:underline cursor-pointer">Browse file...</button>
                        </div>
                    </div>

                    {/* 2. Chọn Font */}
                    <div>
                        <label className="block text-xs font-bold text-teal-700 mb-1">2. CHỌN FONT CHỮ</label>
                        <select
                            value={selectedFont}
                            onChange={e => setSelectedFont(e.target.value)}
                            className="w-full border border-gray-300 rounded p-2 text-sm bg-white focus:border-teal-500 outline-none"
                        >
                            {fonts.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                    </div>

                    {/* 3. Xử lý tiêu đề */}
                    <div className="bg-gray-50 p-3 rounded border border-gray-200">
                        <label className="block text-xs font-bold text-teal-700 mb-2 border-b pb-1">3. XỬ LÝ TIÊU ĐỀ</label>

                        <div className="flex gap-4 mb-2 text-sm">
                            <label className="flex items-center cursor-pointer"><input type="checkbox" checked={removeHashtag} onChange={e => setRemoveHashtag(e.target.checked)} className="mr-1" /> Xóa Hashtag (#)</label>
                            <label className="flex items-center cursor-pointer"><input type="checkbox" checked={removeSpaces} onChange={e => setRemoveSpaces(e.target.checked)} className="mr-1" /> Xóa khoảng trắng thừa</label>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-2">
                            <div>
                                <label className="text-xs text-gray-500">Thêm đầu (Prefix)</label>
                                <input type="text" value={prefix} onChange={e => setPrefix(e.target.value)} className="w-full border p-1 rounded text-sm" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500">Thêm đuôi (Suffix)</label>
                                <input type="text" value={suffix} onChange={e => setSuffix(e.target.value)} className="w-full border p-1 rounded text-sm" />
                            </div>
                        </div>

                        <div className="mb-2">
                            <label className="text-xs text-gray-500">Ký tự muốn xóa (vd: @ | .)</label>
                            <input type="text" value={deleteChars} onChange={e => setDeleteChars(e.target.value)} className="w-full border p-1 rounded text-sm" />
                        </div>

                        {/* Nút Action 1 */}
                        <button onClick={handleClearTitle} className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-1.5 rounded text-sm font-bold shadow-sm transition">
                            Bước 1: Clean Title
                        </button>
                    </div>

                    {/* 4. Style Setting */}
                    <div className="bg-gray-50 p-3 rounded border border-gray-200">
                        <label className="block text-xs font-bold text-teal-700 mb-2 border-b pb-1">4. STYLE CHỮ & VIỀN</label>

                        <div className="grid grid-cols-2 gap-3 mb-2">
                            <div>
                                <label className="text-xs text-gray-500 block">Màu chữ & Cỡ chữ</label>
                                <div className="flex gap-1">
                                    <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="h-8 w-8 p-0 border-0" />
                                    <input type="number" value={textSize} onChange={e => setTextSize(Number(e.target.value))} className="w-full border p-1 rounded text-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 block">Màu viền & Độ dày</label>
                                <div className="flex gap-1">
                                    <input type="color" value={borderColor} onChange={e => setBorderColor(e.target.value)} className="h-8 w-8 p-0 border-0" />
                                    <input type="number" value={borderSize} onChange={e => setBorderSize(Number(e.target.value))} className="w-full border p-1 rounded text-sm" />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 mb-3 text-sm">
                            <label className="flex items-center"><input type="checkbox" checked={isUpperCase} onChange={e => setIsUpperCase(e.target.checked)} className="mr-1" /> IN HOA HẾT</label>
                            <label className="flex items-center"><input type="checkbox" checked={isFirstLetter} onChange={e => setIsFirstLetter(e.target.checked)} className="mr-1" /> Viết Hoa Đầu Từ</label>
                        </div>

                        {/* Nút Action 2 */}
                        <button onClick={handleCreatePng} className="w-full bg-blue-500 hover:bg-blue-600 text-white py-1.5 rounded text-sm font-bold shadow-sm transition">
                            Bước 2: Create PNG
                        </button>
                    </div>
                </div>

                {/* Footer Right Panel - Render Button */}
                <div className="p-4 bg-gray-100 border-t border-gray-200">
                    <button
                        onClick={handleStartRender}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg text-lg font-bold shadow-md flex justify-center items-center gap-2 transition transform hover:scale-[1.02]"
                    >
                        <Play size={24} fill="currentColor" /> BẮT ĐẦU RENDER
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditRatio;