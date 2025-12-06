import React from 'react';

import { NavLink, useLocation } from 'react-router-dom';

import { 

  LayoutDashboard, Users, Network, Fingerprint, Settings, 

  MonitorPlay, ListTodo, PlaySquare, Workflow, ShieldCheck, 

  BarChart2, Menu 

} from 'lucide-react'; // Đảm bảo import đủ icon

export default function Sidebar({ children }: { children: React.ReactNode }) {

  const location = useLocation();

  const menuItems = [

    { path: '/', name: 'Dashboard', icon: <LayoutDashboard size={20} /> },

    { path: '/profiles', name: 'Profiles', icon: <Users size={20} /> },

    { path: '/proxies', name: 'Proxies', icon: <Network size={20} /> },

    { path: '/fingerprints', name: 'Fingerprints', icon: <Fingerprint size={20} /> },

    { path: '/settings', name: 'Settings', icon: <Settings size={20} /> },

    { path: '/sessions', name: 'Sessions', icon: <MonitorPlay size={20} /> },

    { path: '/jobs', name: 'Jobs', icon: <ListTodo size={20} /> },

    { path: '/executions', name: 'Executions', icon: <PlaySquare size={20} /> },

    { path: '/workflows', name: 'Workflows', icon: <Workflow size={20} /> },

    { path: '/2fa', name: 'Giải 2FA', icon: <ShieldCheck size={20} className="text-green-600"/> },

    { path: '/social-analytics', name: 'Tool Phân Tích MXH', icon: <BarChart2 size={20} className="text-purple-600"/> },

  ];

  return (

    // 1. KHUNG BAO NGOÀI CÙNG (Full màn hình, không cuộn body)

    <div className="flex h-screen w-screen overflow-hidden bg-gray-50">

      

      {/* 2. SIDEBAR (Cố định bên trái) */}

      <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0 z-40 flex flex-col h-full shadow-sm">

        <div className="h-16 flex items-center px-6 border-b border-gray-100">

           <h1 className="text-xl font-black text-gray-800 tracking-tight">NTG Login Admin</h1>

        </div>

        

        <nav className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">

           {menuItems.map((item) => {

             const isActive = location.pathname === item.path;

             return (

               <NavLink key={item.path} to={item.path}

                 className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200

                 ${isActive 

                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 

                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'

                 }`}

               >

                 {item.icon}

                 <span>{item.name}</span>

               </NavLink>

             );

           })}

        </nav>

      </aside>



      {/* 3. KHUNG PHẢI (Chứa Header + Nội dung chính) */}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">

        

        {/* --- HEADER (SỬA LẠI Ở ĐÂY) --- */}

        {/* Đã xóa 'lg:ml-64', thêm 'w-full', 'bg-white' */}

        <header className="sticky top-0 z-30 flex h-16 w-full items-center gap-4 border-b border-gray-200 bg-white px-6 shadow-sm">

            {/* Nút Menu mobile (ẩn trên desktop) */}

            <button className="lg:hidden p-2 text-gray-600">

                <Menu size={20} />

            </button>

            

            {/* Breadcrumb hoặc Tiêu đề (Bro có thể custom thêm) */}

            <div className="flex-1"></div>



            {/* User Info / Avatar góc phải */}

            <div className="flex items-center gap-2">

                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">

                    A

                </div>

            </div>

        </header>



        {/* --- MAIN CONTENT (Cuộn nội dung ở đây) --- */}

        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 p-6 scroll-smooth">

            <div className="max-w-full mx-auto">

               {children} 

            </div>

        </main>



      </div>

    </div>

  );

}
