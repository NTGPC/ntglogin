import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Users, Network, Fingerprint, Settings, MonitorPlay,
    ListTodo, PlaySquare, GitFork, ShieldCheck, BarChart2, Clapperboard,
    Smartphone, LogOut, UserCog, Menu
} from 'lucide-react';

interface SidebarProps {
    collapsed: boolean;
    toggleSidebar: () => void;
}

const Sidebar = ({ collapsed, toggleSidebar }: SidebarProps) => {
    const navigate = useNavigate();
    const role = localStorage.getItem('user_role');
    const isSuperAdmin = role === 'SUPER_ADMIN';

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    // Logic style cho nút menu
    const navItemClass = ({ isActive }: { isActive: boolean }) =>
        `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium text-sm whitespace-nowrap overflow-hidden ${isActive
            ? 'bg-teal-600 text-white shadow-md'
            : 'text-slate-600 hover:bg-teal-50 hover:text-teal-700'
        } ${collapsed ? 'justify-center px-2' : ''}`; // Nếu đóng thì căn giữa icon

    return (
        <div className={`bg-white border-r border-gray-200 flex flex-col h-full shadow-sm transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>

            {/* HEADER LOGO + 3 GẠCH */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100 shrink-0">
                {!collapsed && (
                    <div className="flex items-center gap-2 font-bold text-xl text-slate-800 transition-opacity duration-300">
                        <span className="text-2xl">🚀</span> NTG
                    </div>
                )}
                <button onClick={toggleSidebar} className="p-2 rounded-lg hover:bg-gray-100 text-slate-500 transition">
                    <Menu size={20} />
                </button>
            </div>

            {/* MENU LIST */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-hide">

                <NavLink to="/dashboard" end className={navItemClass} title="Dashboard">
                    <LayoutDashboard size={20} />
                    {!collapsed && <span>Dashboard</span>}
                </NavLink>

                {/* CÁC CHỨC NĂNG CŨ */}
                <NavLink to="/dashboard/profiles" className={navItemClass} title="Profiles">
                    <Users size={20} /> {!collapsed && <span>Profiles</span>}
                </NavLink>

                <NavLink to="/dashboard/proxies" className={navItemClass} title="Proxies">
                    <Network size={20} /> {!collapsed && <span>Proxies</span>}
                </NavLink>

                <NavLink to="/dashboard/fingerprints" className={navItemClass} title="Fingerprints">
                    <Fingerprint size={20} /> {!collapsed && <span>Fingerprints</span>}
                </NavLink>

                <NavLink to="/dashboard/settings" className={navItemClass} title="Settings">
                    <Settings size={20} /> {!collapsed && <span>Settings</span>}
                </NavLink>

                <NavLink to="/dashboard/sessions" className={navItemClass} title="Sessions">
                    <MonitorPlay size={20} /> {!collapsed && <span>Sessions</span>}
                </NavLink>

                <NavLink to="/dashboard/jobs" className={navItemClass} title="Jobs">
                    <ListTodo size={20} /> {!collapsed && <span>Jobs</span>}
                </NavLink>

                <NavLink to="/dashboard/executions" className={navItemClass} title="Executions">
                    <PlaySquare size={20} /> {!collapsed && <span>Executions</span>}
                </NavLink>

                <NavLink to="/dashboard/workflows" className={navItemClass} title="Workflows">
                    <GitFork size={20} /> {!collapsed && <span>Workflows</span>}
                </NavLink>

                <NavLink to="/dashboard/2fa" className={navItemClass} title="Giải 2FA">
                    <ShieldCheck size={20} /> {!collapsed && <span>Giải 2FA</span>}
                </NavLink>

                <NavLink to="/dashboard/social-analytics" className={navItemClass} title="Tool Phân Tích MXH">
                    <BarChart2 size={20} /> {!collapsed && <span>Tool Phân Tích MXH</span>}
                </NavLink>

                <NavLink to="/dashboard/video-editor" className={navItemClass} title="Video Editor Studio">
                    <Clapperboard size={20} /> {!collapsed && <span>Video Editor Studio</span>}
                </NavLink>

                {/* NATIVE TOOLS */}
                {!collapsed && <div className="mt-4 px-4 py-1 text-xs font-bold text-gray-400 uppercase">Native</div>}
                <NavLink to="/dashboard/edit-ratio" className={navItemClass} title="Edit Ratio Video">
                    <Smartphone size={20} /> {!collapsed && <span>Edit Ratio Video</span>}
                </NavLink>

                {/* SUPER ADMIN */}
                {isSuperAdmin && (
                    <>
                        {!collapsed && <div className="mt-4 px-4 py-1 text-xs font-bold text-red-400 uppercase">Admin</div>}
                        <NavLink to="/dashboard/users" className={navItemClass} title="Quản lý Tài khoản">
                            <UserCog size={20} /> {!collapsed && <span>Quản lý Tài khoản</span>}
                        </NavLink>
                    </>
                )}

            </nav>

            {/* FOOTER */}
            <div className="p-3 border-t border-gray-100 shrink-0">
                <button onClick={handleLogout} className={`flex items-center gap-3 px-4 py-2 w-full text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition text-sm font-medium ${collapsed ? 'justify-center' : ''}`} title="Đăng xuất">
                    <LogOut size={20} /> {!collapsed && <span>Đăng xuất</span>}
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
