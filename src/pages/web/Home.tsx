import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Play, Shield, Globe, Layers, Cpu } from 'lucide-react';

const Home = () => {
    const navigate = useNavigate();

    return (
        <div className="animate-in fade-in duration-500 bg-blue-50/50 min-h-screen">

            {/* HERO SECTION */}
            <section className="relative pt-24 pb-32 overflow-hidden text-center px-4">
                <div className="container mx-auto max-w-6xl relative z-10">

                    <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight text-slate-900 tracking-tight">
                        Quản Lý <span className="text-blue-600">Hàng Vạn Nick</span> <br />
                        & Edit Video Tự Động
                    </h1>

                    <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed font-medium">
                        Nền tảng All-in-One thay thế Gologin và CapCut. <br />
                        Nuôi tài khoản an toàn - Render video siêu tốc.
                    </p>

                    <div className="flex flex-col md:flex-row justify-center gap-4 mb-16">
                        <button
                            onClick={() => navigate('/download')}
                            className="px-8 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                        >
                            Tải Miễn Phí <ArrowRight size={20} />
                        </button>
                        <button className="px-8 py-4 bg-white text-slate-700 border border-gray-200 rounded-xl font-bold text-lg hover:bg-gray-50 transition flex items-center justify-center gap-2 shadow-sm">
                            <Play size={20} className="text-red-500 fill-current" /> Xem Demo
                        </button>
                    </div>

                    {/* Dashboard Preview Image (Giả lập) */}
                    <div className="relative mx-auto max-w-5xl">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-teal-400 rounded-2xl blur opacity-30"></div>
                        <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 aspect-video flex items-center justify-center">
                            <div className="text-center">
                                <Layers size={64} className="mx-auto text-gray-300 mb-4" />
                                <p className="text-gray-400 text-lg font-medium">Giao diện Dashboard Admin sẽ hiển thị ở đây</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FEATURES GRID */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-6">
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-lg transition">
                            <Shield size={40} className="text-blue-600 mb-4" />
                            <h3 className="text-xl font-bold mb-2">Anti-Detect Browser</h3>
                            <p className="text-gray-500">Fake thông số phần cứng, Canvas, WebGL giúp nuôi nick Facebook, Google an toàn tuyệt đối.</p>
                        </div>
                        <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-lg transition">
                            <Cpu size={40} className="text-red-500 mb-4" />
                            <h3 className="text-xl font-bold mb-2">Auto Reels Editor</h3>
                            <p className="text-gray-500">Tự động chuyển đổi video ngang sang dọc, thêm tiêu đề, watermark hàng loạt với tốc độ cao.</p>
                        </div>
                        <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-lg transition">
                            <Globe size={40} className="text-teal-500 mb-4" />
                            <h3 className="text-xl font-bold mb-2">Proxy Manager</h3>
                            <p className="text-gray-500">Quản lý và gán Proxy riêng biệt cho từng Profile. Hỗ trợ HTTP/SOCKS5.</p>
                        </div>
                    </div>
                </div>
            </section>

        </div>
    );
};

export default Home;