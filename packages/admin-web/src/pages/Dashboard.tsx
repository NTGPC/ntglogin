
import React, { useEffect, useState } from 'react';
import {
  Users, // Icon Profile
  Globe, // Icon Proxy
  Fingerprint, // Icon Fingerprint
  Monitor, // Icon Session
  Briefcase, // Icon Job
  PlayCircle, // Icon Executions
  GitFork, // Icon Workflow
  ShieldCheck, // Icon 2FA
  Video, // Icon Video Editor
  BarChart3 // Icon thống kê
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    profiles: 0,
    proxies: 0,
    fingerprints: 0,
    sessions: 0,
    jobs: 0,
    executions: 0,
    workflows: 0,
    twoFactor: 0,
    videos: 0
  });

  useEffect(() => {
    // Gọi API lấy số liệu thật
    const fetchStats = async () => {
      try {
        // Đường dẫn API Dashboard của bro
        const res = await fetch('http://localhost:3000/api/dashboard/stats');
        const data = await res.json();
        if (data.data) {
          setStats(data.data);
        }
      } catch (error) {
        console.error("Lỗi tải dashboard", error);
      }
    };
    fetchStats();
  }, []);

  // Cấu hình danh sách thẻ Dashboard
  const cardItems = [
    {
      title: 'Profiles',
      count: stats.profiles,
      icon: <Users size={28} />,
      color: 'bg-blue-50 text-blue-600',
      desc: 'Tổng số hồ sơ trình duyệt'
    },
    {
      title: 'Proxies',
      count: stats.proxies,
      icon: <Globe size={28} />,
      color: 'bg-green-50 text-green-600',
      desc: 'Proxy server đang hoạt động'
    },
    {
      title: 'Fingerprints',
      count: stats.fingerprints,
      icon: <Fingerprint size={28} />,
      color: 'bg-purple-50 text-purple-600',
      desc: 'Dữ liệu vân tay thiết bị'
    },
    {
      title: 'Sessions',
      count: stats.sessions,
      icon: <Monitor size={28} />,
      color: 'bg-orange-50 text-orange-600',
      desc: 'Phiên làm việc active'
    },
    {
      title: 'Jobs',
      count: stats.jobs,
      icon: <Briefcase size={28} />,
      color: 'bg-pink-50 text-pink-600',
      desc: 'Công việc đã lên lịch'
    },
    {
      title: 'Executions',
      count: stats.executions,
      icon: <PlayCircle size={28} />,
      color: 'bg-indigo-50 text-indigo-600',
      desc: 'Lượt chạy tự động'
    },
    {
      title: 'Workflows',
      count: stats.workflows,
      icon: <GitFork size={28} />,
      color: 'bg-cyan-50 text-cyan-600',
      desc: 'Quy trình kịch bản'
    },
    {
      title: 'Giải 2FA',
      count: stats.twoFactor,
      icon: <ShieldCheck size={28} />,
      color: 'bg-red-50 text-red-600',
      desc: 'Mã 2FA đã giải mã'
    },
    {
      title: 'Video Editor',
      count: stats.videos,
      icon: <Video size={28} />,
      color: 'bg-teal-50 text-teal-600',
      desc: 'Dự án video đã render'
    }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center gap-3 mb-8">
        <BarChart3 className="text-gray-700" size={32} />
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
          <p className="text-gray-500 text-sm">Tổng quan hệ thống NTG Login System</p>
        </div>
      </div>

      {/* Grid Layout: Tự động chia cột theo màn hình */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {cardItems.map((item, index) => (
          <div
            key={index}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:-translate-y-1 group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-lg ${item.color} group-hover:scale-110 transition-transform`}>
                {item.icon}
              </div>
              <span className="text-3xl font-bold text-gray-800">{item.count}</span>
            </div>

            <h3 className="font-semibold text-gray-700 text-lg mb-1">{item.title}</h3>
            <p className="text-xs text-gray-400 font-medium">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
