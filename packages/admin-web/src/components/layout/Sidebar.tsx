import React, { useRef, useState } from 'react';

import { NavLink, useLocation } from 'react-router-dom';

import { 

  LayoutDashboard, Users, Network, Fingerprint, Settings, 

  MonitorPlay, ListTodo, PlaySquare, Workflow, ShieldCheck, 

  BarChart2, X, Menu

} from 'lucide-react';

export default function Sidebar({ children }: { children: React.ReactNode }) {

  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const sidebar = useRef<any>(null);

  const menuItems = [

    { 

      path: '/', 

      name: 'Dashboard', 

      icon: <LayoutDashboard size={20} className="text-blue-600" /> // Màu xanh dương

    },

    { 

      path: '/profiles', 

      name: 'Profiles', 

      icon: <Users size={20} className="text-indigo-600" /> // Xanh chàm

    },

    { 

      path: '/proxies', 

      name: 'Proxies', 

      icon: <Network size={20} className="text-cyan-600" /> // Xanh lơ

    },

    { 

      path: '/fingerprints', 

      name: 'Fingerprints', 

      icon: <Fingerprint size={20} className="text-teal-600" /> // Xanh ngọc

    },

    { 

      path: '/settings', 

      name: 'Settings', 

      icon: <Settings size={20} className="text-slate-600" /> // Xám

    },

    { 

      path: '/sessions', 

      name: 'Sessions', 

      icon: <MonitorPlay size={20} className="text-orange-500" /> // Cam

    },

    { 

      path: '/jobs', 

      name: 'Jobs', 

      icon: <ListTodo size={20} className="text-yellow-600" /> // Vàng đất

    },

    { 

      path: '/executions', 

      name: 'Executions', 

      icon: <PlaySquare size={20} className="text-red-500" /> // Đỏ

    },

    { 

      path: '/workflows', 

      name: 'Workflows', 

      icon: <Workflow size={20} className="text-pink-600" /> // Hồng

    },

    // --- 2 MỤC ĐẠI CA YÊU CẦU ---

    { 

      path: '/2fa', 

      name: 'Giải 2FA', 

      icon: <ShieldCheck size={20} className="text-emerald-500" /> // Xanh lá bảo mật (Như hình cũ)

    },

    { 

      path: '/social-analytics', 

      name: 'Tool Phân Tích MXH', 

      icon: <BarChart2 size={20} className="text-violet-600" /> // Tím mộng mơ (Biểu đồ)

    },

  ];

  return (

    <div className="flex h-screen w-screen overflow-hidden bg-gray-50">

      {/* SIDEBAR với animation đóng/mở */}

      <aside

        ref={sidebar}

        className={`absolute left-0 top-0 z-50 flex h-screen flex-col overflow-y-hidden duration-300 ease-linear lg:static

        border-r border-stroke dark:border-strokedark

        bg-white dark:bg-boxdark text-black dark:text-white

        ${sidebarOpen ? 'w-72 translate-x-0' : 'w-0 -translate-x-full lg:w-0'}`}

      >

        {/* HEADER LOGO */}

        <div className="flex items-center justify-between gap-2 px-6 py-5.5 lg:py-6.5 border-b border-stroke dark:border-strokedark h-20 min-h-[80px]">

          <NavLink to="/" className="text-2xl font-bold text-black dark:text-white flex items-center gap-2 whitespace-nowrap">

             🚀 NTG LOGIN

          </NavLink>

          <button

            onClick={() => setSidebarOpen(false)}

            className="block lg:hidden text-black dark:text-white"

          >

            <X size={24} />

          </button>

        </div>

        {/* MENU LIST */}

        <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">

          <nav className="mt-5 py-4 px-4 lg:mt-9 lg:px-6">

            <ul className="mb-6 flex flex-col gap-1.5">

              {menuItems.map((item) => (

                 <li key={item.path}>

                   <NavLink

                     to={item.path}

                     className={({ isActive }) =>

                       `group relative flex items-center gap-3 rounded-lg py-2.5 px-4 font-medium duration-200 ease-in-out

                       ${isActive 

                          ? 'bg-[#9BDBC3] text-black shadow-md' 

                          : 'text-gray-600 hover:bg-gray-100 hover:text-black'

                       }`

                     }

                   >

                     {item.icon}

                     {item.name}

                   </NavLink>

                 </li>

              ))}

            </ul>

          </nav>

        </div>

      </aside>



      {/* KHUNG PHẢI (Chứa Header + Nội dung chính) */}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">

        {/* HEADER với nút Menu */}

        <header className="sticky top-0 z-30 flex h-16 w-full items-center gap-4 border-b border-gray-200 bg-white px-6 shadow-sm">

          {/* Hamburger Toggle - Hiện trên cả máy tính và mobile */}

          <div className="flex items-center gap-2 sm:gap-4">

            <button

              onClick={(e) => {

                e.stopPropagation();

                setSidebarOpen(!sidebarOpen);

              }}

              className="z-50 block rounded border border-stroke bg-white p-1.5 shadow-sm dark:border-strokedark dark:bg-boxdark dark:text-white"

            >

              <Menu className="h-5 w-5" />

            </button>

            {/* Logo (Chỉ hiện khi Sidebar đóng hoặc trên Mobile) */}

            <NavLink className="block flex-shrink-0 lg:hidden" to="/">

              <h1 className="font-bold text-primary">NTG</h1>

            </NavLink>

          </div>

          {/* Breadcrumb hoặc Tiêu đề */}

          <div className="flex-1"></div>

          {/* User Info / Avatar góc phải */}

          <div className="flex items-center gap-2">

            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">

              A

            </div>

          </div>

        </header>

        {/* MAIN CONTENT */}

        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 p-6 scroll-smooth">

          <div className="max-w-full mx-auto">

            {children} 

          </div>

        </main>

      </div>

    </div>

  );

}
