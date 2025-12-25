import React from 'react';
import { Facebook, Twitter, Youtube, Github, Zap } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
            <div className="container mx-auto px-6">
                <div className="grid md:grid-cols-4 gap-8 mb-8">
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center gap-2 mb-4 text-white">
                            <Zap size={24} className="text-blue-500" fill="currentColor" />
                            <span className="text-xl font-bold">GEMLOGIN SYSTEM</span>
                        </div>
                        <p className="text-slate-400 max-w-sm text-sm leading-relaxed">
                            Giải pháp quản lý tài khoản đa nền tảng và tự động hóa quy trình Edit Video số 1 Việt Nam.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-4 uppercase text-xs tracking-wider">Sản phẩm</h4>
                        <ul className="space-y-2 text-sm">
                            <li><a href="#" className="hover:text-blue-400 transition">Browser Anti-Detect</a></li>
                            <li><a href="#" className="hover:text-blue-400 transition">Auto Reels</a></li>
                            <li><a href="#" className="hover:text-blue-400 transition">Proxy Manager</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-4 uppercase text-xs tracking-wider">Hỗ trợ</h4>
                        <ul className="space-y-2 text-sm">
                            <li><a href="#" className="hover:text-blue-400 transition">Liên hệ</a></li>
                            <li><a href="#" className="hover:text-blue-400 transition">Hướng dẫn</a></li>
                            <li><a href="#" className="hover:text-blue-400 transition">Điều khoản</a></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
                    <p>© 2025 NTG Team. All rights reserved.</p>
                    <div className="flex gap-4">
                        <Facebook size={18} className="hover:text-white cursor-pointer" />
                        <Twitter size={18} className="hover:text-white cursor-pointer" />
                        <Youtube size={18} className="hover:text-white cursor-pointer" />
                        <Github size={18} className="hover:text-white cursor-pointer" />
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
