import React from 'react';
import { Download, Monitor, Apple } from 'lucide-react';

const DownloadPage = () => {
    return (
        <div className="py-24 bg-white min-h-screen">
            <div className="container mx-auto px-6 text-center">
                <h1 className="text-4xl font-bold text-slate-900 mb-6">Tải NTG Login ngay hôm nay</h1>
                <p className="text-slate-500 mb-12 max-w-2xl mx-auto">Phiên bản mới nhất 2.0.1 - Cập nhật ngày 20/12/2025. Tối ưu hóa hiệu năng và sửa lỗi Auto Reels.</p>

                <div className="flex flex-col md:flex-row justify-center gap-6">
                    {/* Windows */}
                    <div className="p-8 bg-slate-50 rounded-3xl border border-slate-200 w-full md:w-80 hover:border-teal-500 transition cursor-pointer group">
                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition">
                            <Monitor size={32} />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Windows</h3>
                        <p className="text-sm text-slate-500 mb-6">Windows 10, 11 (64-bit)</p>
                        <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition">
                            <Download size={18} /> Download .EXE
                        </button>
                    </div>

                    {/* MacOS */}
                    <div className="p-8 bg-slate-50 rounded-3xl border border-slate-200 w-full md:w-80 hover:border-slate-900 transition cursor-pointer group">
                        <div className="w-16 h-16 bg-slate-200 text-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition">
                            <Apple size={32} />
                        </div>
                        <h3 className="text-xl font-bold mb-2">macOS</h3>
                        <p className="text-sm text-slate-500 mb-6">Apple Silicon (M1/M2/M3)</p>
                        <button className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition">
                            <Download size={18} /> Download .DMG
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DownloadPage;
