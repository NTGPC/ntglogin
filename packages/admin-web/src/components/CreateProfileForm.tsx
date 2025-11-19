// File: packages/admin-web/src/components/CreateProfileForm.tsx
// Form tạo/sửa profile với logic đồng bộ OS và User Agent

import React, { useState, useEffect, useCallback } from 'react';
import { USER_AGENT_LIBRARY } from '../constants/user-agents';
import { WEBGL_RENDERER_LIBRARY, getWebGLRenderersByOS, findWebGLRenderer } from '../constants/webgl-renderers';
import { EUROPEAN_TIMEZONES } from '../constants/european-timezones';

interface Profile {
  id?: number;
  name: string;
  userAgent: string;
  os: string;
  arch: '32-bit' | '64-bit';
  browser: string;
  screenWidth: number;
  screenHeight: number;
  webglRenderer: string;
  webglVendor: string;
  canvasMode: 'noise' | 'off' | 'block';
  clientRectsMode: 'noise' | 'off';
  audioContextMode: 'noise' | 'off';
  geoEnabled: boolean;
  webrtcMainIP: boolean;
  timezone?: string;
  [key: string]: any;
}

interface CreateProfileFormProps {
  initial?: Profile;
  onSubmit: (data: Profile) => void;
  onCancel?: () => void;
}

export function CreateProfileForm({ initial, onSubmit, onCancel }: CreateProfileFormProps) {
  // ==========================================================
  // === NGUỒN CHÂN LÝ DUY NHẤT: STATE PROFILE ===
  // ==========================================================
  const [profile, setProfile] = useState<Profile>(() => {
    const defaultOS = 'Windows';
    const compatibleAgents = USER_AGENT_LIBRARY.filter(agent => 
      agent.os === defaultOS || agent.os.includes(defaultOS)
    );
    const randomAgent = compatibleAgents.length > 0 
      ? compatibleAgents[Math.floor(Math.random() * compatibleAgents.length)]
      : USER_AGENT_LIBRARY[0] || { value: '', os: '' };
    
    const compatibleGPUs = getWebGLRenderersByOS(defaultOS);
    const randomGPU = compatibleGPUs.length > 0 
      ? compatibleGPUs[Math.floor(Math.random() * compatibleGPUs.length)]
      : WEBGL_RENDERER_LIBRARY[0];

    return {
      name: '',
      userAgent: randomAgent.value,
      os: defaultOS,
      arch: '64-bit',
      browser: 'Chrome',
      screenWidth: 1920,
      screenHeight: 1080,
      webglRenderer: randomGPU.renderer,
      webglVendor: randomGPU.vendor,
      canvasMode: 'noise',
      clientRectsMode: 'off',
      audioContextMode: 'off',
      geoEnabled: false,
      webrtcMainIP: false,
      timezone: 'Europe/London',
      ...initial,
    };
  });

  // ==========================================================
  // === BỘ NÃO ĐỒNG BỘ HÓA: OS ↔ USER AGENT ===
  // ==========================================================
  // Khi OS thay đổi, tự động chọn User Agent ngẫu nhiên tương ứng
  useEffect(() => {
    if (!profile.os) return;

    const compatibleAgents = USER_AGENT_LIBRARY.filter(agent => {
      const agentOS = agent.os || '';
      return agentOS === profile.os || 
             agentOS.includes(profile.os) || 
             profile.os.includes(agentOS);
    });

    if (compatibleAgents.length > 0) {
      const randomAgent = compatibleAgents[Math.floor(Math.random() * compatibleAgents.length)];
      setProfile(prev => ({
        ...prev,
        userAgent: randomAgent.value,
      }));
    }
  }, [profile.os]);

  // Khi OS thay đổi, tự động chọn WebGL Renderer tương ứng
  useEffect(() => {
    if (!profile.os) return;

    const compatibleGPUs = getWebGLRenderersByOS(profile.os);
    if (compatibleGPUs.length > 0) {
      const randomGPU = compatibleGPUs[Math.floor(Math.random() * compatibleGPUs.length)];
      setProfile(prev => ({
        ...prev,
        webglRenderer: randomGPU.renderer,
        webglVendor: randomGPU.vendor,
      }));
    }
  }, [profile.os]);

  // ==========================================================
  // === HANDLERS ===
  // ==========================================================
  const handleOSChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newOS = e.target.value;
    setProfile(prev => ({ ...prev, os: newOS }));
    // useEffect sẽ tự động cập nhật User Agent và WebGL Renderer
  }, []);

  const handleUserAgentChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedUA = USER_AGENT_LIBRARY.find(agent => agent.value === e.target.value);
    if (selectedUA) {
      setProfile(prev => ({
        ...prev,
        userAgent: selectedUA.value,
        os: selectedUA.os, // Đồng bộ OS từ User Agent
      }));
    }
  }, []);

  const handleGpuChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedRenderer = WEBGL_RENDERER_LIBRARY.find(gpu => gpu.renderer === e.target.value);
    if (selectedRenderer) {
      setProfile(prev => ({
        ...prev,
        webglRenderer: selectedRenderer.renderer,
        webglVendor: selectedRenderer.vendor,
      }));
    }
  }, []);

  const handleFieldChange = useCallback((field: string, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleScreenResolutionChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const resolution = e.target.value;
    if (resolution === 'custom') return; // Không làm gì nếu chọn custom
    
    const [width, height] = resolution.split('x').map(Number);
    setProfile(prev => ({
      ...prev,
      screenWidth: width,
      screenHeight: height,
    }));
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(profile);
  }, [profile, onSubmit]);

  // ==========================================================
  // === FILTERED DATA ===
  // ==========================================================
  // Lọc User Agents tương thích với OS hiện tại
  const compatibleUserAgents = USER_AGENT_LIBRARY.filter(agent => {
    if (!profile.os) return true;
    const agentOS = agent.os || '';
    return agentOS === profile.os || 
           agentOS.includes(profile.os) || 
           profile.os.includes(agentOS);
  });

  // Lọc WebGL Renderers tương thích với OS hiện tại
  const compatibleGPUs = getWebGLRenderersByOS(profile.os || 'Windows');

  // Common screen resolutions
  const screenResolutions = [
    { label: '1366x768', value: '1366x768' },
    { label: '1600x900', value: '1600x900' },
    { label: '1920x1080 (Full HD)', value: '1920x1080' },
    { label: '2560x1440 (QHD)', value: '2560x1440' },
    { label: '3840x2160 (4K)', value: '3840x2160' },
    { label: 'Custom', value: 'custom' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6">
      <h2 className="text-2xl font-bold mb-6">
        {initial ? 'Chỉnh sửa Profile' : 'Tạo Profile Mới'}
      </h2>

      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-2">
          Tên Profile <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          value={profile.name}
          onChange={(e) => handleFieldChange('name', e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Nhập tên profile..."
        />
      </div>

      {/* OS Selection */}
      <div>
        <label htmlFor="os" className="block text-sm font-medium mb-2">
          Hệ điều hành <span className="text-red-500">*</span>
        </label>
        <select
          id="os"
          name="os"
          value={profile.os}
          onChange={handleOSChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="Windows">Windows</option>
          <option value="Windows 10">Windows 10</option>
          <option value="Windows 11">Windows 11</option>
          <option value="macOS">macOS</option>
          <option value="Linux">Linux</option>
          <option value="Android">Android</option>
          <option value="iOS">iOS</option>
        </select>
        <p className="mt-1 text-xs text-gray-500">
          User Agent và WebGL Renderer sẽ tự động cập nhật khi bạn thay đổi OS
        </p>
      </div>

      {/* User Agent (Read-only, tự động cập nhật) */}
      <div>
        <label htmlFor="userAgent" className="block text-sm font-medium mb-2">
          User Agent <span className="text-red-500">*</span>
        </label>
        <select
          id="userAgent"
          name="userAgent"
          value={profile.userAgent}
          onChange={handleUserAgentChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
        >
          {compatibleUserAgents.map((agent, idx) => (
            <option key={idx} value={agent.value}>
              {agent.name} - {agent.value.substring(0, 60)}...
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500">
          Chỉ hiển thị các User Agent tương thích với OS đã chọn. Bạn có thể chọn thủ công hoặc để hệ thống tự động chọn ngẫu nhiên.
        </p>
      </div>

      {/* WebGL Renderer */}
      <div>
        <label htmlFor="webglRenderer" className="block text-sm font-medium mb-2">
          WebGL Renderer (GPU) <span className="text-red-500">*</span>
        </label>
        <select
          id="webglRenderer"
          name="webglRenderer"
          value={profile.webglRenderer}
          onChange={handleGpuChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {compatibleGPUs.map((gpu, idx) => (
            <option key={idx} value={gpu.renderer}>
              {gpu.vendor} - {gpu.renderer} ({gpu.category})
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500">
          Vendor: {profile.webglVendor} | Renderer: {profile.webglRenderer}
        </p>
      </div>

      {/* Screen Resolution */}
      <div>
        <label htmlFor="screenResolution" className="block text-sm font-medium mb-2">
          Độ phân giải màn hình
        </label>
        <select
          id="screenResolution"
          name="screenResolution"
          value={`${profile.screenWidth}x${profile.screenHeight}`}
          onChange={handleScreenResolutionChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {screenResolutions.map((res) => (
            <option key={res.value} value={res.value}>
              {res.label}
            </option>
          ))}
        </select>
        {screenResolutions.find(r => r.value === `${profile.screenWidth}x${profile.screenHeight}`)?.value === 'custom' && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Width"
              value={profile.screenWidth}
              onChange={(e) => handleFieldChange('screenWidth', parseInt(e.target.value) || 1920)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            />
            <input
              type="number"
              placeholder="Height"
              value={profile.screenHeight}
              onChange={(e) => handleFieldChange('screenHeight', parseInt(e.target.value) || 1080)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        )}
      </div>

      {/* Canvas Mode */}
      <div>
        <label htmlFor="canvasMode" className="block text-sm font-medium mb-2">
          Canvas Fingerprint
        </label>
        <select
          id="canvasMode"
          name="canvasMode"
          value={profile.canvasMode}
          onChange={(e) => handleFieldChange('canvasMode', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="noise">Noise (thêm nhiễu)</option>
          <option value="off">Off (tắt)</option>
          <option value="block">Block (chặn)</option>
        </select>
      </div>

      {/* Audio Context Mode */}
      <div>
        <label htmlFor="audioContextMode" className="block text-sm font-medium mb-2">
          Audio Context Fingerprint
        </label>
        <select
          id="audioContextMode"
          name="audioContextMode"
          value={profile.audioContextMode}
          onChange={(e) => handleFieldChange('audioContextMode', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="off">Off (tắt)</option>
          <option value="noise">Noise (thêm nhiễu)</option>
        </select>
      </div>

      {/* Geolocation */}
      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={profile.geoEnabled}
            onChange={(e) => handleFieldChange('geoEnabled', e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm font-medium">Bật Geolocation (fake vị trí)</span>
        </label>
      </div>

      {/* WebRTC */}
      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={profile.webrtcMainIP}
            onChange={(e) => handleFieldChange('webrtcMainIP', e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm font-medium">WebRTC: Sử dụng Main IP (không chặn IP private)</span>
        </label>
      </div>

      {/* Timezone (Châu Âu) */}
      <div>
        <label htmlFor="timezone" className="block text-sm font-medium mb-2">
          Múi giờ (Châu Âu)
        </label>
        <select
          id="timezone"
          name="timezone"
          value={profile.timezone || 'Europe/London'}
          onChange={(e) => handleFieldChange('timezone', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {EUROPEAN_TIMEZONES.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500">
          Chọn múi giờ châu Âu cho profile này
        </p>
      </div>

      {/* Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Hủy
          </button>
        )}
        <button
          type="submit"
          className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {initial ? 'Cập nhật' : 'Tạo mới'}
        </button>
      </div>
    </form>
  );
}

export default CreateProfileForm;

