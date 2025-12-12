import React, { useState, useEffect } from 'react';
import { Play, FolderOpen, Music, Video as VideoIcon, Layers, Scissors, Type, Link, Image as ImageIcon, Zap, FileVideo, FileAudio } from 'lucide-react';
import axios from 'axios';

interface MediaFile {
    name: string;
    path: string;
    cleanName?: string;
    url?: string;
}

export default function VideoEditorPage() {
    const [audios, setAudios] = useState<MediaFile[]>([]);
    const [videos, setVideos] = useState<MediaFile[]>([]);
    const [logos, setLogos] = useState<MediaFile[]>([]);

    const [selectedVideo, setSelectedVideo] = useState<MediaFile | null>(null);
    const [selectedAudio, setSelectedAudio] = useState<MediaFile | null>(null);

    const [customTitle, setCustomTitle] = useState('');
    const [titleColor, setTitleColor] = useState('#FFFFFF');
    const [titleSize, setTitleSize] = useState(80);
    const [selectedLogoPath, setSelectedLogoPath] = useState('');

    const [isRendering, setIsRendering] = useState(false);

    useEffect(() => {
        const fetchFiles = async () => {
            try {
                const res = await axios.get('http://localhost:3000/api/editor/scan');
                setVideos(res.data.videos);
                setAudios(res.data.audios);
                setLogos(res.data.logos || []);
            } catch (err) { console.error(err); }
        };
        fetchFiles();
    }, []);

    const handleRender = async () => {
        if (!selectedVideo || !selectedAudio) return alert("Chưa chọn Video/Audio");
        setIsRendering(true);
        try {
            const res = await axios.post('http://localhost:3000/api/editor/render', {
                videoPath: selectedVideo.path,
                audioPath: selectedAudio.path,
                customTitle: customTitle || selectedAudio.cleanName,
                titleColor,
                titleSize: Number(titleSize),
                logoPath: selectedLogoPath
            });
            alert(`Render xong: ${res.data.outputFile}`);
        } catch (error) { alert("Lỗi Render"); } finally { setIsRendering(false); }
    };

    return (
        // FIX QUAN TRỌNG: h-[calc(100vh-5rem)] để trừ đi chiều cao Header, tránh bị dôi ra gây cuộn trang
        <div className="flex h-[calc(100vh-5rem)] bg-[#1A222C] text-white overflow-hidden font-sans">

            {/* --- CSS ẨN THANH CUỘN (Nhưng vẫn lăn chuột được) --- */}
            <style>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;  /* IE and Edge */
                    scrollbar-width: none;  /* Firefox */
                }
            `}</style>

            {/* --- CỘT TRÁI: INPUT & LIST (CHIA ĐÔI MÀN HÌNH) --- */}
            <div className="w-[350px] border-r border-gray-700 flex flex-col bg-[#1A222C] h-full">

                {/* PHẦN 1: VIDEO LIST (CHIẾM 50% CHIỀU CAO) */}
                <div className="flex-1 flex flex-col min-h-0 border-b border-gray-700">
                    {/* Header Video */}
                    <div className="p-3 bg-[#131920] shrink-0 border-b border-gray-700">
                        <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-blue-500 text-[10px] uppercase tracking-wider flex items-center gap-1">
                                <VideoIcon size={14} /> VIDEO SOURCE
                            </span>
                            <span className="text-[10px] bg-blue-900/30 text-blue-400 px-1.5 rounded border border-blue-900/50">{videos.length}</span>
                        </div>
                        <div className="flex gap-2">
                            <div className="flex-1 bg-[#24303F] border border-gray-600 rounded px-2 py-1.5 text-[10px] text-gray-400 truncate flex items-center gap-2">
                                <FolderOpen size={12} /> D:\NTG_Studio\Videos
                            </div>
                        </div>
                    </div>
                    {/* List Video Scroll (Đã thêm class no-scrollbar) */}
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 no-scrollbar">
                        {videos.map((vid, idx) => (
                            <div key={idx} onClick={() => setSelectedVideo(vid)}
                                className={`flex items-center gap-3 p-2 rounded cursor-pointer border transition ${selectedVideo?.path === vid.path ? 'bg-[#24303F] border-blue-500' : 'bg-[#1A222C] border-transparent hover:bg-[#24303F]'}`}>
                                <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${selectedVideo?.path === vid.path ? 'bg-blue-600 text-white' : 'bg-[#2A3441] text-blue-500'}`}>
                                    <FileVideo size={16} />
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                    <span className={`truncate text-xs font-medium ${selectedVideo?.path === vid.path ? 'text-white' : 'text-gray-400'}`}>{vid.name}</span>
                                    <span className="text-[10px] text-gray-500">Video File</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* PHẦN 2: AUDIO LIST (CHIẾM 50% CÒN LẠI) */}
                <div className="flex-1 flex flex-col min-h-0">
                    {/* Header Audio */}
                    <div className="p-3 bg-[#131920] shrink-0 border-b border-gray-700">
                        <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-green-500 text-[10px] uppercase tracking-wider flex items-center gap-1">
                                <Music size={14} /> AUDIO SOURCE
                            </span>
                            <span className="text-[10px] bg-green-900/30 text-green-400 px-1.5 rounded border border-green-900/50">{audios.length}</span>
                        </div>
                        <div className="flex gap-2">
                            <div className="flex-1 bg-[#24303F] border border-gray-600 rounded px-2 py-1.5 text-[10px] text-gray-400 truncate flex items-center gap-2">
                                <FolderOpen size={12} /> D:\NTG_Studio\Audios
                            </div>
                        </div>
                    </div>
                    {/* List Audio Scroll (Đã thêm class no-scrollbar) */}
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 no-scrollbar">
                        {audios.map((aud, idx) => (
                            <div key={idx} onClick={() => { setSelectedAudio(aud); setCustomTitle(aud.cleanName || ''); }}
                                className={`flex items-center gap-3 p-2 rounded cursor-pointer border transition ${selectedAudio?.path === aud.path ? 'bg-[#24303F] border-green-500' : 'bg-[#1A222C] border-transparent hover:bg-[#24303F]'}`}>
                                <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${selectedAudio?.path === aud.path ? 'bg-green-600 text-white' : 'bg-[#2A3441] text-green-500'}`}>
                                    <FileAudio size={16} />
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                    <span className={`truncate text-xs font-medium ${selectedAudio?.path === aud.path ? 'text-white' : 'text-gray-400'}`}>{aud.name}</span>
                                    <span className="text-[10px] text-gray-500">Audio File</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- CỘT GIỮA: PREVIEW + TOOLBAR (GIỮ NGUYÊN) --- */}
            <div className="flex-1 flex flex-col border-r border-gray-700 bg-black relative h-full">
                {/* Màn hình Video */}
                <div className="flex-1 flex items-center justify-center bg-[#000] overflow-hidden p-4">
                    {selectedVideo ? (
                        <video src={selectedVideo.url} className="max-w-full max-h-full shadow-2xl" controls muted />
                    ) : (
                        <div className="border border-gray-800 p-10 flex flex-col items-center gap-2 bg-[#0F1115] rounded">
                            <span className="text-blue-500 border border-blue-500 px-4 py-2 uppercase font-bold tracking-widest text-xs">TITLE HERE</span>
                            <span className="text-[10px] text-gray-600">9:16 PREVIEW AREA</span>
                        </div>
                    )}
                </div>

                {/* TOOLBAR 4 NÚT (SHRINK-0 ĐỂ KHÔNG BỊ MẤT) */}
                <div className="h-16 shrink-0 bg-[#131920] border-t border-gray-700 flex divide-x divide-gray-700">
                    <button className="flex-1 flex flex-col items-center justify-center hover:bg-[#24303F] text-gray-400 gap-1.5 transition group">
                        <Scissors size={18} className="group-hover:text-white" />
                        <span className="text-[10px] uppercase font-bold">MUTE VIDEO</span>
                    </button>
                    <button className="flex-1 flex flex-col items-center justify-center hover:bg-[#24303F] text-gray-400 gap-1.5 transition group">
                        <Type size={18} className="group-hover:text-white" />
                        <span className="text-[10px] uppercase font-bold">CLEAN TXT</span>
                    </button>
                    <button className="flex-1 flex flex-col items-center justify-center hover:bg-[#24303F] text-blue-500 bg-[#1A222C] gap-1.5 transition border-t-2 border-blue-500">
                        <Link size={18} />
                        <span className="text-[10px] uppercase font-bold">PAIRING</span>
                    </button>
                    <button className="flex-1 flex flex-col items-center justify-center hover:bg-[#24303F] text-purple-400 gap-1.5 transition group">
                        <ImageIcon size={18} className="group-hover:text-white" />
                        <span className="text-[10px] uppercase font-bold">CREATE PNG</span>
                    </button>
                </div>
            </div>

            {/* --- CỘT PHẢI: PROPERTIES (GIỮ NGUYÊN) --- */}
            <div className="w-[320px] bg-[#1A222C] border-l border-gray-700 flex flex-col p-4 gap-4 h-full">
                <div className="shrink-0 border-b border-gray-700 pb-2 font-bold text-xs uppercase tracking-wider text-gray-400 flex items-center gap-2">
                    <Layers size={14} /> PROPERTIES
                </div>

                {/* Auto Title */}
                <div className="shrink-0 bg-[#24303F] p-3 rounded border border-gray-600">
                    <div className="flex items-center gap-2 mb-2">
                        <input type="checkbox" checked readOnly className="accent-blue-500 w-4 h-4" />
                        <span className="font-bold text-sm text-gray-200">Auto Title</span>
                    </div>
                    <div className="flex gap-2 mb-2">
                        <input type="color" className="h-9 w-1/3 cursor-pointer bg-transparent border border-gray-500 rounded p-0"
                            value={titleColor} onChange={(e) => setTitleColor(e.target.value)} />
                        <input type="number" className="w-2/3 bg-gray-700 border border-gray-500 rounded px-2 text-white font-bold focus:border-blue-500 focus:outline-none"
                            value={titleSize} onChange={(e) => setTitleSize(Number(e.target.value))} />
                    </div>
                    <textarea className="w-full bg-gray-700 border border-gray-500 rounded p-2 text-sm text-white focus:outline-none focus:border-blue-500"
                        rows={2} placeholder="Nhập tiêu đề..." value={customTitle} onChange={(e) => setCustomTitle(e.target.value)}
                    />
                    <button className="w-full mt-2 py-1.5 bg-gray-800 text-pink-500 text-[10px] font-bold border border-gray-600 rounded hover:bg-gray-700 uppercase">
                        📍 Set Location (Bottom)
                    </button>
                </div>

                {/* Add Logo */}
                <div className="shrink-0 bg-[#24303F] p-3 rounded border border-gray-600">
                    <div className="flex items-center gap-2 mb-2">
                        <input type="checkbox" className="accent-blue-500 w-4 h-4" />
                        <span className="font-bold text-sm text-gray-200">Add Logo</span>
                    </div>
                    <select className="w-full bg-gray-700 border border-gray-500 rounded p-2 text-sm text-white focus:outline-none mb-2"
                        value={selectedLogoPath} onChange={(e) => setSelectedLogoPath(e.target.value)}>
                        <option value="">-- Chọn Logo từ D:\Logos --</option>
                        {logos.map((logo, idx) => <option key={idx} value={logo.path}>{logo.name}</option>)}
                    </select>
                    <button className="w-full py-1.5 bg-gray-800 text-pink-500 text-[10px] font-bold border border-gray-600 rounded hover:bg-gray-700 uppercase">
                        📍 Set Location (Top-Right)
                    </button>
                </div>

                <div className="flex-1"></div>

                {/* Footer Buttons */}
                <div className="shrink-0 flex gap-2">
                    <button onClick={handleRender} disabled={isRendering}
                        className={`flex-1 py-3 rounded font-bold flex items-center justify-center gap-2 shadow-lg transition transform active:scale-95 ${isRendering ? 'bg-gray-600' : 'bg-green-600 hover:bg-green-500'}`}>
                        <Play size={16} fill="white" /> {isRendering ? 'RENDERING...' : 'START RENDER'}
                    </button>
                    <button className="px-4 bg-[#991B1B] hover:bg-red-800 text-white font-bold text-xs rounded shadow-lg flex items-center justify-center gap-1">
                        <Zap size={16} fill="white" /> AUTO
                    </button>
                </div>
            </div>
        </div>
    );
}
