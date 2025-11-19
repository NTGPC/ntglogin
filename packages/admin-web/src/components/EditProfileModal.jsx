import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { USER_AGENT_LIBRARY } from '../constants/user-agents'
import { WEBGL_RENDERER_LIBRARY, getWebGLRenderersByOS } from '../constants/webgl-renderers'

/**
 * @typedef {Object} Profile
 * @property {number} [id]
 * @property {string} name
 * @property {string} userAgent
 * @property {'Windows 10'|'Windows 11'|'macOS'|'Linux'|'Android'|'iOS'|''} os
 * @property {'32-bit'|'64-bit'} arch
 * @property {'Chrome'|'Chromium (default)'|'Firefox'|'Edge'|'Auto'} browser
 * @property {'1366x768'|'1600x900'|'1920x1080'|'2560x1440'|'Auto'} screen
 * @property {'Noise'|'Off'|'Block'} canvas
 * @property {'Off'|'Noise'} clientRects
 * @property {'Off'|'Noise'} audioContext
 * @property {'Off'|'Noise'} webglImage
 * @property {'Mask'|'Real'} webglMetadata
 * @property {boolean} geoEnabled
 * @property {'original'|'custom'} [geoMode]
 * @property {boolean} webrtcMainIp
 * @property {'Manual'|'Library'} proxyMode
 * @property {{ host?: string; port?: string; username?: string; password?: string; }} [proxy]
 */

/**
 * @typedef {Object} Props
 * @property {boolean} open
 * @property {Profile} [initial]
 * @property {() => void} onClose
 * @property {(data: Profile) => void} onUpdate
 */

/**
 * EditProfileModal Component
 * @param {Props} props
 * @returns {JSX.Element|null}
 */
export default function EditProfileModal({ open, initial, onClose, onUpdate }) {
  // --- NGUỒN CHÂN LÝ DUY NHẤT ---
  const [profile, setProfile] = useState(() => {
    const initialAgent = USER_AGENT_LIBRARY[0] || { value: '', os: '' };
    return {
      name: '',
      userAgent: initialAgent.value,
      os: initialAgent.os,
      arch: '64-bit',
      browser: 'Auto',
      screen: 'Auto',
      screenWidth: 1920,
      screenHeight: 1080,
      canvas: 'Noise',
      canvasMode: 'Noise',
      clientRects: 'Off',
      clientRectsMode: 'Off',
      audioContext: 'Off',
      audioContextMode: 'Off',
      webglImage: 'Off',
      webglImageMode: 'Off',
      webglMetadata: 'Mask',
      webglMetaMode: 'Mask',
      webglRenderer: '',
      webglVendor: '',
      geoEnabled: false,
      geoMode: 'original',
      webrtcMainIp: false,
      proxyMode: 'Manual',
      proxy: { host: '', port: '', username: '', password: '' },
    };
  });

  // State để quản lý nội dung của ô JSON
  const [fingerprintJson, setFingerprintJson] = useState('');

  const [isInitialLoad, setIsInitialLoad] = useState(true)

  // Load initial data when modal opens
  useEffect(() => {
    if (open && initial) {
      setIsInitialLoad(true)
      // Parse screen resolution string thành width/height
      const parseScreenResolution = (screenStr) => {
        if (!screenStr || screenStr === 'Auto') return { width: 1920, height: 1080 }
        const match = screenStr.match(/(\d+)x(\d+)/)
        if (match) {
          return { width: parseInt(match[1], 10), height: parseInt(match[2], 10) }
        }
        return { width: 1920, height: 1080 }
      }
      const { width, height } = parseScreenResolution(initial.screen)
      
      setProfile({
        name: initial.name || '',
        userAgent: initial.userAgent || initial.user_agent || USER_AGENT_LIBRARY[0]?.value || '',
        os: initial.os || initial.osName || USER_AGENT_LIBRARY[0]?.os || '',
        arch: initial.arch || '64-bit',
        browser: initial.browser || 'Auto',
        screen: initial.screen || 'Auto',
        screenWidth: initial.screenWidth || width,
        screenHeight: initial.screenHeight || height,
        canvas: initial.canvas || initial.canvasMode || 'Noise',
        canvasMode: initial.canvasMode || initial.canvas || 'Noise',
        clientRects: initial.clientRects || initial.clientRectsMode || 'Off',
        clientRectsMode: initial.clientRectsMode || initial.clientRects || 'Off',
        audioContext: initial.audioContext || initial.audioCtxMode || initial.audioContextMode || 'Off',
        audioContextMode: initial.audioContextMode || initial.audioCtxMode || initial.audioContext || 'Off',
        webglImage: initial.webglImage || initial.webglImageMode || 'Off',
        webglImageMode: initial.webglImageMode || initial.webglImage || 'Off',
        webglMetadata: initial.webglMetadata || initial.webglMetaMode || 'Mask',
        webglMetaMode: initial.webglMetaMode || initial.webglMetadata || 'Mask',
        webglRenderer: initial.webglRenderer || '',
        webglVendor: initial.webglVendor || '',
        geoEnabled: initial.geoEnabled || false,
        geoMode: initial.geoMode || 'original',
        webrtcMainIp: initial.webrtcMainIp || initial.webrtcMainIP || false,
        proxyMode: initial.proxyMode || 'Manual',
        proxy: initial.proxy || { host: '', port: '', username: '', password: '' },
      })
      
      // Set fingerprintJson từ initial data nếu có
      if (initial.fingerprintJson || initial.fingerprint) {
        setFingerprintJson(JSON.stringify(initial.fingerprintJson || initial.fingerprint, null, 2));
      }
      
      setTimeout(() => setIsInitialLoad(false), 100)
    } else if (open && !initial) {
      setIsInitialLoad(true)
      const initialAgent = USER_AGENT_LIBRARY[0] || { value: '', os: '' };
      setProfile({
        name: '',
        userAgent: initialAgent.value,
        os: initialAgent.os,
        arch: '64-bit',
        browser: 'Auto',
        screen: 'Auto',
        screenWidth: 1920,
        screenHeight: 1080,
      canvas: 'Noise',
      canvasMode: 'Noise',
      clientRects: 'Off',
      clientRectsMode: 'Off',
      audioContext: 'Off',
      audioContextMode: 'Off',
      webglImage: 'Off',
      webglImageMode: 'Off',
      webglMetadata: 'Mask',
      webglMetaMode: 'Mask',
      webglRenderer: '',
      webglVendor: '',
      geoEnabled: false,
      geoMode: 'original',
      webrtcMainIp: false,
      proxyMode: 'Manual',
      proxy: { host: '', port: '', username: '', password: '' },
      })
      setFingerprintJson(''); // Reset fingerprintJson khi tạo mới
      setTimeout(() => setIsInitialLoad(false), 100)
    }
  }, [open, initial])

  // Handle Esc key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && open) {
        onClose()
      }
    }
    
    if (open) {
      window.addEventListener('keydown', handleKeyDown)
      return () => {
        window.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [open, onClose])

  // --- BỘ NÃO ĐỒNG BỘ HÓA: TỪ LỰA CHỌN -> XUỐNG JSON ---
  useEffect(() => {
    if (isInitialLoad) return; // Bỏ qua lần render đầu tiên

    const generatedObject = {
      userAgent: profile.userAgent,
      user_agent: profile.userAgent,
      os: profile.os,
      osName: profile.os,
      viewport: { 
        width: profile.screenWidth, 
        height: profile.screenHeight 
      },
      screenWidth: profile.screenWidth,
      screenHeight: profile.screenHeight,
      canvasMode: profile.canvas,
      clientRectsMode: profile.clientRects,
      audioCtxMode: profile.audioContext,
      webglImageMode: profile.webglImage,
      webglMetaMode: profile.webglMetadata,
      geoEnabled: profile.geoEnabled,
      webrtcMainIP: profile.webrtcMainIp,
    };
    setFingerprintJson(JSON.stringify(generatedObject, null, 2));
  }, [profile, isInitialLoad]); // Chạy mỗi khi state `profile` thay đổi

  // ==========================================================
  // === HELPER FUNCTIONS: RÀNG BUỘC OS VÀ USER AGENT ===
  // ==========================================================
  
  // Detect OS từ User Agent string
  const detectOSFromUserAgent = (ua) => {
    if (!ua) return null;
    const uaLower = ua.toLowerCase();
    
    // Windows
    if (uaLower.includes('windows nt')) {
      if (uaLower.includes('windows nt 10.0')) {
        return uaLower.includes('win64') || uaLower.includes('x64') ? 'Windows 11' : 'Windows 10';
      }
      return 'Windows 10';
    }
    
    // macOS
    if (uaLower.includes('macintosh') || uaLower.includes('mac os x')) {
      return 'macOS';
    }
    
    // Linux
    if (uaLower.includes('linux x86_64') || uaLower.includes('x11; linux')) {
      return 'Linux';
    }
    
    // Android
    if (uaLower.includes('android')) {
      return 'Android';
    }
    
    // iOS
    if (uaLower.includes('iphone') || uaLower.includes('ipad') || uaLower.includes('cpu iphone os')) {
      return 'iOS';
    }
    
    return null;
  };

  // Normalize OS name để so sánh
  const normalizeOS = (os) => {
    if (!os) return null;
    const osLower = os.toLowerCase();
    if (osLower.includes('windows')) return 'Windows';
    if (osLower.includes('mac') || osLower.includes('macos')) return 'macOS';
    if (osLower.includes('linux')) return 'Linux';
    if (osLower.includes('android')) return 'Android';
    if (osLower.includes('ios')) return 'iOS';
    return os;
  };

  // Filter User Agents theo OS
  const getUserAgentsByOS = (os) => {
    if (!os) return USER_AGENT_LIBRARY;
    const normalizedOS = normalizeOS(os);
    if (!normalizedOS) return USER_AGENT_LIBRARY;
    
    return USER_AGENT_LIBRARY.filter(agent => {
      const agentOS = normalizeOS(agent.os);
      return agentOS === normalizedOS;
    });
  };

  // Kiểm tra User Agent có khớp với OS không
  const isUserAgentCompatibleWithOS = (ua, os) => {
    if (!ua || !os) return true; // Nếu thiếu thông tin, cho phép
    const detectedOS = detectOSFromUserAgent(ua);
    if (!detectedOS) return true; // Nếu không detect được, cho phép
    
    const normalizedDetected = normalizeOS(detectedOS);
    const normalizedOS = normalizeOS(os);
    
    return normalizedDetected === normalizedOS;
  };

  // --- HÀM CẬP NHẬT TỪ CÁC DROPDOWN ---
  const handleUserAgentChange = (e) => {
    const selectedValue = e.target.value;
    
    // Nếu chọn từ dropdown (có trong thư viện)
    const selectedAgent = USER_AGENT_LIBRARY.find(agent => agent.value === selectedValue);
    if (selectedAgent) {
      const newOS = selectedAgent.os;
      // Lấy WebGL Renderer ngẫu nhiên từ OS mới
      const compatibleGPUs = getWebGLRenderersByOS(newOS);
      const randomGPU = compatibleGPUs.length > 0 
        ? compatibleGPUs[Math.floor(Math.random() * compatibleGPUs.length)]
        : null;
      
      setProfile(prev => ({
        ...prev,
        userAgent: selectedAgent.value,
        os: newOS, // Tự động cập nhật OS từ User Agent
        webglRenderer: randomGPU ? randomGPU.renderer : prev.webglRenderer,
        webglVendor: randomGPU ? randomGPU.vendor : prev.webglVendor,
      }));
      return;
    }
    
    // Nếu nhập thủ công, tự động detect OS
    const detectedOS = detectOSFromUserAgent(selectedValue);
    if (detectedOS) {
      // Lấy WebGL Renderer ngẫu nhiên từ OS đã detect
      const compatibleGPUs = getWebGLRenderersByOS(detectedOS);
      const randomGPU = compatibleGPUs.length > 0 
        ? compatibleGPUs[Math.floor(Math.random() * compatibleGPUs.length)]
        : null;
      
      setProfile(prev => ({
        ...prev,
        userAgent: selectedValue,
        os: detectedOS, // Tự động cập nhật OS từ User Agent
        webglRenderer: randomGPU ? randomGPU.renderer : prev.webglRenderer,
        webglVendor: randomGPU ? randomGPU.vendor : prev.webglVendor,
      }));
    } else {
      // Nếu không detect được, chỉ cập nhật User Agent
      setProfile(prev => ({
        ...prev,
        userAgent: selectedValue,
      }));
    }
  };

  // Hàm xử lý khi thay đổi OS
  const handleOSChange = (e) => {
    const newOS = e.target.value;
    
    setProfile(prev => {
      // Kiểm tra User Agent hiện tại có khớp với OS mới không
      const isCompatible = isUserAgentCompatibleWithOS(prev.userAgent, newOS);
      
      // Lấy User Agent ngẫu nhiên từ OS mới (nếu không khớp hoặc chưa có)
      const compatibleAgents = getUserAgentsByOS(newOS);
      const randomAgent = compatibleAgents.length > 0 
        ? compatibleAgents[Math.floor(Math.random() * compatibleAgents.length)]
        : null;
      
      // Lấy WebGL Renderer ngẫu nhiên từ OS mới
      const compatibleGPUs = getWebGLRenderersByOS(newOS);
      const randomGPU = compatibleGPUs.length > 0 
        ? compatibleGPUs[Math.floor(Math.random() * compatibleGPUs.length)]
        : null;
      
      return {
        ...prev,
        os: newOS,
        // Tự động cập nhật User Agent nếu không khớp hoặc chưa có
        userAgent: (!isCompatible || !prev.userAgent) && randomAgent ? randomAgent.value : prev.userAgent,
        // Tự động cập nhật WebGL Renderer
        webglRenderer: randomGPU ? randomGPU.renderer : prev.webglRenderer,
        webglVendor: randomGPU ? randomGPU.vendor : prev.webglVendor,
      };
    });
  };

  const handleScreenResolutionChange = (e) => {
    const screenStr = e.target.value;
    if (screenStr === 'Auto') {
      setProfile(prev => ({
        ...prev,
        screen: 'Auto',
        screenWidth: 1920,
        screenHeight: 1080
      }));
    } else {
      const match = screenStr.match(/(\d+)x(\d+)/);
      if (match) {
        const width = parseInt(match[1], 10);
        const height = parseInt(match[2], 10);
        setProfile(prev => ({
          ...prev,
          screen: screenStr,
          screenWidth: width,
          screenHeight: height
        }));
      }
    }
  };

  const handleScreenWidthChange = (e) => {
    const width = parseInt(e.target.value, 10) || 1920;
    setProfile(prev => ({
      ...prev,
      screenWidth: width,
      screen: `${width}x${prev.screenHeight}`
    }));
  };

  const handleScreenHeightChange = (e) => {
    const height = parseInt(e.target.value, 10) || 1080;
    setProfile(prev => ({
      ...prev,
      screenHeight: height,
      screen: `${prev.screenWidth}x${height}`
    }));
  };

  // --- HÀM RANDOMIZE ALL ---
  const handleRandomizeAll = () => {
    // Random OS trước (CHỈ Windows hoặc macOS)
    const osOptions = ['Windows', 'Windows 10', 'Windows 11', 'macOS'];
    const randomOS = osOptions[Math.floor(Math.random() * osOptions.length)];
    
    // Lấy User Agent ngẫu nhiên từ OS đã chọn (ĐẢM BẢO RÀNG BUỘC)
    const compatibleAgents = getUserAgentsByOS(randomOS);
    const randomAgent = compatibleAgents.length > 0 
      ? compatibleAgents[Math.floor(Math.random() * compatibleAgents.length)]
      : USER_AGENT_LIBRARY[0];
    
    // Lấy WebGL Renderer ngẫu nhiên từ OS đã chọn (ĐẢM BẢO RÀNG BUỘC)
    const compatibleGPUs = getWebGLRenderersByOS(randomOS);
    const randomGPU = compatibleGPUs.length > 0 
      ? compatibleGPUs[Math.floor(Math.random() * compatibleGPUs.length)]
      : null;
    
    // Lấy ngẫu nhiên một độ phân giải
    const resolutions = [
      { w: 1920, h: 1080 },
      { w: 1366, h: 768 },
      { w: 1600, h: 900 },
      { w: 2560, h: 1440 }
    ];
    const randomRes = resolutions[Math.floor(Math.random() * resolutions.length)];

    // Randomize các trường fingerprint
    const canvasModes = ['Noise', 'Off', 'Block'];
    const offNoiseModes = ['Noise', 'Off']; // Noise đứng đầu
    const webglMetaModes = ['Mask', 'Real']; // Mask đứng đầu

    // Cập nhật TOÀN BỘ state cùng lúc
    setProfile(prev => ({
      ...prev,
      userAgent: randomAgent.value,
      os: randomOS, // Sử dụng OS đã random (ĐẢM BẢO RÀNG BUỘC)
      webglRenderer: randomGPU ? randomGPU.renderer : prev.webglRenderer,
      webglVendor: randomGPU ? randomGPU.vendor : prev.webglVendor,
      screenWidth: randomRes.w,
      screenHeight: randomRes.h,
      screen: `${randomRes.w}x${randomRes.h}`,
      canvas: canvasModes[Math.floor(Math.random() * canvasModes.length)],
      canvasMode: canvasModes[Math.floor(Math.random() * canvasModes.length)],
      clientRects: offNoiseModes[Math.floor(Math.random() * offNoiseModes.length)],
      clientRectsMode: offNoiseModes[Math.floor(Math.random() * offNoiseModes.length)],
      audioContext: offNoiseModes[Math.floor(Math.random() * offNoiseModes.length)],
      audioContextMode: offNoiseModes[Math.floor(Math.random() * offNoiseModes.length)],
      webglImage: offNoiseModes[Math.floor(Math.random() * offNoiseModes.length)],
      webglImageMode: offNoiseModes[Math.floor(Math.random() * offNoiseModes.length)],
      webglMetadata: webglMetaModes[Math.floor(Math.random() * webglMetaModes.length)],
      webglMetaMode: webglMetaModes[Math.floor(Math.random() * webglMetaModes.length)],
      geoEnabled: Math.random() > 0.5,
      webrtcMainIp: Math.random() > 0.5,
    }));
  };

  const handleNestedFormChange = (parent, field, value) => {
    setProfile((prev) => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value,
      },
    }))
  }

  const handleFieldChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  }

  const generateUserAgent = useCallback(async (skipCheck = false, currentProfile) => {
    if (!currentProfile) return
    
    if (!skipCheck && !currentProfile.os) {
      return
    }

    try {
      const browserMap = {
        'Chrome': 'chrome',
        'Chromium (default)': 'chrome',
        'Firefox': 'firefox',
        'Edge': 'edge',
        'Auto': 'chrome'
      }

      const browser = browserMap[currentProfile.browser] || 'chrome'
      let os = currentProfile.os

      if (!os) return

      if (os.startsWith('macOS')) {
        os = 'Mac OS'
      } else if (os.startsWith('Windows')) {
        os = os
      } else if (os === 'Linux') {
        os = 'Linux'
      } else if (os === 'Android') {
        os = 'Android'
      } else if (os === 'iOS') {
        os = 'iOS'
      }

      const response = await axios.post('/api/profiles/user-agent', {
        browser,
        os,
        versionHint: 138
      })

      if (response.data?.success && response.data?.userAgent) {
        setProfile((prev) => ({
          ...prev,
          userAgent: response.data.userAgent
        }))
      }
    } catch (error) {
      console.error('Error generating user agent:', error)
    }
  }, [])

  // Auto-generate User Agent when OS, browser, or arch changes
  useEffect(() => {
    if (!isInitialLoad && profile.os) {
      generateUserAgent(true, profile)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.os, profile.browser, profile.arch, isInitialLoad])

  const handleChange = (field, value) => {
    if (field.startsWith('proxy.')) {
      const proxyField = field.split('.')[1]
      handleNestedFormChange('proxy', proxyField, value)
    } else {
      const prevOs = profile.os
      if (field === 'os' && value !== prevOs && value) {
        setProfile((prev) => ({
          ...prev,
          [field]: value,
          userAgent: '',
        }))
      } else {
        handleFieldChange(field, value)
      }
    }
  }

  // ==========================================================
  // === HÀM SUBMIT KHÔNG NGU - LẤY TỪ NGUỒN CHÂN LÝ DUY NHẤT ===
  // ==========================================================
  const handleSubmit = (e) => {
    e.preventDefault()

    // ==========================================================
    // === VALIDATION: KIỂM TRA RÀNG BUỘC OS VÀ USER AGENT ===
    // ==========================================================
    if (profile.userAgent && profile.os) {
      const isCompatible = isUserAgentCompatibleWithOS(profile.userAgent, profile.os);
      if (!isCompatible) {
        const detectedOS = detectOSFromUserAgent(profile.userAgent);
        if (detectedOS) {
          alert(`⚠️ Cảnh báo: User Agent không khớp với OS đã chọn!\n\nUser Agent phát hiện OS: ${detectedOS}\nOS đã chọn: ${profile.os}\n\nHệ thống sẽ tự động điều chỉnh OS thành ${detectedOS}.`);
          setProfile(prev => ({
            ...prev,
            os: detectedOS, // Tự động điều chỉnh OS
          }));
          return; // Dừng submit để user xác nhận
        } else {
          // Nếu không detect được OS từ User Agent, random một User Agent từ OS đã chọn
          const compatibleAgents = getUserAgentsByOS(profile.os);
          if (compatibleAgents.length > 0) {
            const randomAgent = compatibleAgents[Math.floor(Math.random() * compatibleAgents.length)];
            alert(`⚠️ Cảnh báo: User Agent không khớp với OS đã chọn!\n\nHệ thống sẽ tự động thay đổi User Agent thành một User Agent tương thích với ${profile.os}.`);
            setProfile(prev => ({
              ...prev,
              userAgent: randomAgent.value, // Tự động điều chỉnh User Agent
            }));
            return; // Dừng submit để user xác nhận
          }
        }
      }
    }

    // ==========================================================
    // === ĐÂY LÀ PHẦN QUAN TRỌNG NHẤT ===
    // ==========================================================
    // Chúng ta sẽ KHÔNG đọc từ ô JSON.
    // Chúng ta sẽ tạo ra một object sạch sẽ DUY NHẤT từ state 'profile',
    // là nguồn chân lý duy nhất.

    const dataToSend = {
      name: profile.name,
      userAgent: profile.userAgent,
      user_agent: profile.userAgent,
      os: profile.os,
      osName: profile.os,
      arch: profile.arch,
      browser: profile.browser,
      screen: profile.screen,
      screenWidth: profile.screenWidth,
      screenHeight: profile.screenHeight,
      canvas: profile.canvas || profile.canvasMode,
      canvasMode: profile.canvasMode || profile.canvas,
      clientRects: profile.clientRects || profile.clientRectsMode,
      clientRectsMode: profile.clientRectsMode || profile.clientRects,
      audioContext: profile.audioContext || profile.audioContextMode,
      audioCtxMode: profile.audioContextMode || profile.audioContext,
      webglImage: profile.webglImage || profile.webglImageMode,
      webglImageMode: profile.webglImageMode || profile.webglImage,
      webglMetadata: profile.webglMetadata || profile.webglMetaMode,
      webglMetaMode: profile.webglMetaMode || profile.webglMetadata,
      webglRenderer: profile.webglRenderer,
      webglVendor: profile.webglVendor,
      geoEnabled: profile.geoEnabled,
      geoMode: profile.geoMode,
      webrtcMainIp: profile.webrtcMainIp,
      webrtcMainIP: profile.webrtcMainIp,
      proxyMode: profile.proxyMode,
      proxy: profile.proxy,
      id: initial?.id,
    };

    // Chỉ khi gửi đi, chúng ta mới tạo ra trường fingerprintJson
    // nếu backend của ông cần nó.
    const finalFingerprintObject = {
      userAgent: profile.userAgent,
      user_agent: profile.userAgent,
      os: profile.os,
      osName: profile.os,
      viewport: {
        width: profile.screenWidth,
        height: profile.screenHeight,
      },
      screenWidth: profile.screenWidth,
      screenHeight: profile.screenHeight,
      canvasMode: profile.canvas || profile.canvasMode,
      clientRectsMode: profile.clientRects || profile.clientRectsMode,
      audioCtxMode: profile.audioContext || profile.audioContextMode,
      webglImageMode: profile.webglImage || profile.webglImageMode,
      webglMetaMode: profile.webglMetadata || profile.webglMetaMode,
      webglRenderer: profile.webglRenderer,
      webglVendor: profile.webglVendor,
      geoEnabled: profile.geoEnabled,
      webrtcMainIP: profile.webrtcMainIp,
    };

    dataToSend.fingerprint = finalFingerprintObject;
    dataToSend.fingerprintJson = JSON.stringify(finalFingerprintObject, null, 2);

    console.log("DỮ LIỆU CUỐI CÙNG SẼ ĐƯỢC GỬI ĐẾN BACKEND:", dataToSend);

    // Bây giờ mới gọi API để lưu
    onUpdate(dataToSend);
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white dark:bg-[#0a0a0a] rounded-xl shadow-xl flex flex-col"
        style={{ 
          width: 'calc(100vw - 64px)', 
          maxWidth: '1600px',
          minWidth: '800px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2a2a2a] flex-shrink-0 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-foreground">Edit Profile</h2>
          <button
            type="button"
            onClick={handleRandomizeAll}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            🎲 Randomize All
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form id="edit-profile-form" onSubmit={handleSubmit} className="flex-1 max-h-[70vh] overflow-y-auto">
          <div className="px-6 py-4 space-y-6">
            {/* General Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-foreground">General</h3>
              
              <div>
                <label htmlFor="profile-name" className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">
                  Name *
                </label>
                <input
                  id="profile-name"
                  type="text"
                  value={profile.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="profile-ua" className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">
                  User Agent
                </label>
                
                {/* Dropdown User Agent từ thư viện */}
                <div className="mb-2">
                  <select
                    id="profile-ua-select"
                    value={profile.userAgent}
                    onChange={handleUserAgentChange} // <--- GỌI HÀM GIAO TIẾP
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Chọn từ thư viện hoặc nhập thủ công --</option>
                    {/* Filter User Agents theo OS đã chọn */}
                    {getUserAgentsByOS(profile.os).map(agent => (
                      <option key={agent.name} value={agent.value}>
                        {agent.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Chọn User Agent từ thư viện sẽ tự động cập nhật OS tương ứng.
                  </p>
                </div>

                <div className="flex gap-2">
                  <textarea
                    id="profile-ua"
                    value={profile.userAgent}
                    onChange={(e) => handleFieldChange('userAgent', e.target.value)}
                    rows={3}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                    placeholder="Mozilla/5.0..."
                  />
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => generateUserAgent(false, profile)}
                      disabled={!profile.os}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 whitespace-nowrap"
                    >
                      Generate
                    </button>
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Mặc định hệ thống tự sinh UA duy nhất, bạn chỉ nên sửa khi thật cần.
                </p>
              </div>
            </div>

            {/* System Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-foreground">System</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="profile-os" className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">
                    OS <span className="text-xs text-gray-500">(Tự động cập nhật khi chọn User Agent)</span>
                  </label>
                  <input
                    id="profile-os"
                    type="text"
                    value={profile.os} // <--- LUÔN ĐỒNG BỘ VỚI STATE
                    readOnly // Người dùng không nên sửa tay trường này khi đã chọn từ thư viện
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-gray-50 dark:bg-[#1a1a1a] text-gray-900 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-not-allowed"
                    aria-label="OS"
                    placeholder="Chọn User Agent từ thư viện để tự động điền"
                  />
                  {/* Vẫn cho phép chọn thủ công nếu cần */}
                  <select
                    id="profile-os-select"
                    value={profile.os || ''}
                    onChange={handleOSChange}
                    className="w-full mt-2 px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="OS Select"
                  >
                    <option value="">Hoặc chọn OS thủ công (sẽ random User Agent và WebGL Renderer tương ứng)</option>
                    <option value="Windows">Windows</option>
                    <option value="Windows 10">Windows 10</option>
                    <option value="Windows 11">Windows 11</option>
                    <option value="macOS">macOS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">
                    Architecture
                  </label>
                  <select
                    value={profile.arch}
                    onChange={(e) => handleFieldChange('arch', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="32-bit">32-bit</option>
                    <option value="64-bit">64-bit</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="profile-browser" className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">
                    Browser
                  </label>
                  <select
                    id="profile-browser"
                    value={profile.browser}
                    onChange={(e) => handleFieldChange('browser', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Browser"
                  >
                    <option value="Auto">Auto</option>
                    <option value="Chrome">Chrome</option>
                    <option value="Chromium (default)">Chromium (default)</option>
                    <option value="Firefox">Firefox</option>
                    <option value="Edge">Edge</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="profile-screen" className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">
                    Screen Resolution
                  </label>
                  <select
                    id="profile-screen"
                    value={profile.screen}
                    onChange={handleScreenResolutionChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Screen Resolution"
                  >
                    <option value="Auto">Auto</option>
                    <option value="1366x768">1366x768</option>
                    <option value="1600x900">1600x900</option>
                    <option value="1920x1080">1920x1080</option>
                    <option value="2560x1440">2560x1440</option>
                  </select>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Width</label>
                      <input
                        type="number"
                        value={profile.screenWidth}
                        onChange={handleScreenWidthChange}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Height</label>
                      <input
                        type="number"
                        value={profile.screenHeight}
                        onChange={handleScreenHeightChange}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-foreground"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fingerprint Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-foreground">Fingerprint</h3>
              
              {/* Ô Fingerprint (JSON) - Tự động đồng bộ từ các trường khác */}
              <div>
                <label htmlFor="profile-fingerprint-json" className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">
                  Fingerprint JSON <span className="text-xs text-gray-500">(Tự động cập nhật khi thay đổi các trường trên)</span>
                </label>
                <textarea
                  id="profile-fingerprint-json"
                  value={fingerprintJson}
                  onChange={(e) => {
                    // Đây là phần dành cho chuyên gia: cho phép dán JSON vào
                    // Khi dán vào, chúng ta có thể cố gắng parse và cập nhật ngược lại state `profile`
                    // Hoặc đơn giản là chỉ lưu chuỗi JSON này khi submit
                    setFingerprintJson(e.target.value);
                  }}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                  placeholder='{"userAgent": "...", "viewport": {...}, ...}'
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  JSON này được tự động tạo từ các trường trên. Bạn có thể chỉnh sửa trực tiếp hoặc dán JSON vào đây.
                </p>
              </div>
              
              {/* Canvas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-2">
                  Canvas
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleFieldChange('canvas', 'Noise');
                      handleFieldChange('canvasMode', 'Noise');
                    }}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      (profile.canvas || profile.canvasMode) === 'Noise'
                        ? 'bg-green-600 text-white'
                        : 'bg-white dark:bg-[#0f0f0f] text-gray-700 dark:text-foreground border border-gray-300 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-[#1a1a1a]'
                    }`}
                  >
                    Noise
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleFieldChange('canvas', 'Off');
                      handleFieldChange('canvasMode', 'Off');
                    }}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      (profile.canvas || profile.canvasMode) === 'Off'
                        ? 'bg-green-600 text-white'
                        : 'bg-white dark:bg-[#0f0f0f] text-gray-700 dark:text-foreground border border-gray-300 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-[#1a1a1a]'
                    }`}
                  >
                    Off
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleFieldChange('canvas', 'Block');
                      handleFieldChange('canvasMode', 'Block');
                    }}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      (profile.canvas || profile.canvasMode) === 'Block'
                        ? 'bg-green-600 text-white'
                        : 'bg-white dark:bg-[#0f0f0f] text-gray-700 dark:text-foreground border border-gray-300 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-[#1a1a1a]'
                    }`}
                  >
                    Block
                  </button>
                </div>
              </div>

              {/* Client Rects */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-2">
                  Client Rects
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleFieldChange('clientRects', 'Noise');
                      handleFieldChange('clientRectsMode', 'Noise');
                    }}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      (profile.clientRects || profile.clientRectsMode) === 'Noise'
                        ? 'bg-green-600 text-white'
                        : 'bg-white dark:bg-[#0f0f0f] text-gray-700 dark:text-foreground border border-gray-300 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-[#1a1a1a]'
                    }`}
                  >
                    Noise
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleFieldChange('clientRects', 'Off');
                      handleFieldChange('clientRectsMode', 'Off');
                    }}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      (profile.clientRects || profile.clientRectsMode) === 'Off'
                        ? 'bg-green-600 text-white'
                        : 'bg-white dark:bg-[#0f0f0f] text-gray-700 dark:text-foreground border border-gray-300 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-[#1a1a1a]'
                    }`}
                  >
                    Off
                  </button>
                </div>
              </div>

              {/* Audio Context */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-2">
                  Audio Context
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleFieldChange('audioContext', 'Noise');
                      handleFieldChange('audioContextMode', 'Noise');
                    }}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      (profile.audioContext || profile.audioContextMode) === 'Noise'
                        ? 'bg-green-600 text-white'
                        : 'bg-white dark:bg-[#0f0f0f] text-gray-700 dark:text-foreground border border-gray-300 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-[#1a1a1a]'
                    }`}
                  >
                    Noise
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleFieldChange('audioContext', 'Off');
                      handleFieldChange('audioContextMode', 'Off');
                    }}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      (profile.audioContext || profile.audioContextMode) === 'Off'
                        ? 'bg-green-600 text-white'
                        : 'bg-white dark:bg-[#0f0f0f] text-gray-700 dark:text-foreground border border-gray-300 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-[#1a1a1a]'
                    }`}
                  >
                    Off
                  </button>
                </div>
              </div>

              {/* WebGL Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-2">
                  WebGL Image
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleFieldChange('webglImage', 'Noise');
                      handleFieldChange('webglImageMode', 'Noise');
                    }}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      (profile.webglImage || profile.webglImageMode) === 'Noise'
                        ? 'bg-green-600 text-white'
                        : 'bg-white dark:bg-[#0f0f0f] text-gray-700 dark:text-foreground border border-gray-300 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-[#1a1a1a]'
                    }`}
                  >
                    Noise
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleFieldChange('webglImage', 'Off');
                      handleFieldChange('webglImageMode', 'Off');
                    }}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      (profile.webglImage || profile.webglImageMode) === 'Off'
                        ? 'bg-green-600 text-white'
                        : 'bg-white dark:bg-[#0f0f0f] text-gray-700 dark:text-foreground border border-gray-300 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-[#1a1a1a]'
                    }`}
                  >
                    Off
                  </button>
                </div>
              </div>

              {/* WebGL Metadata */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-2">
                  WebGL Metadata
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleFieldChange('webglMetadata', 'Mask');
                      handleFieldChange('webglMetaMode', 'Mask');
                    }}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      (profile.webglMetadata || profile.webglMetaMode) === 'Mask'
                        ? 'bg-green-600 text-white'
                        : 'bg-white dark:bg-[#0f0f0f] text-gray-700 dark:text-foreground border border-gray-300 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-[#1a1a1a]'
                    }`}
                  >
                    Mask
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleFieldChange('webglMetadata', 'Real');
                      handleFieldChange('webglMetaMode', 'Real');
                    }}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      (profile.webglMetadata || profile.webglMetaMode) === 'Real'
                        ? 'bg-green-600 text-white'
                        : 'bg-white dark:bg-[#0f0f0f] text-gray-700 dark:text-foreground border border-gray-300 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-[#1a1a1a]'
                    }`}
                  >
                    Real
                  </button>
                </div>
              </div>

              {/* WebGL Vendor */}
              <div>
                <label htmlFor="webgl-vendor" className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">
                  WebGL Vendor
                </label>
                <select
                  id="webgl-vendor"
                  value={profile.webglVendor || ''}
                  onChange={(e) => {
                    const selectedVendor = e.target.value;
                    // Tìm renderer tương ứng với vendor này
                    const compatibleGPUs = getWebGLRenderersByOS(profile.os || 'Windows');
                    const matchingGPU = compatibleGPUs.find(gpu => gpu.vendor === selectedVendor);
                    setProfile(prev => ({
                      ...prev,
                      webglVendor: selectedVendor,
                      webglRenderer: matchingGPU ? matchingGPU.renderer : prev.webglRenderer,
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Chọn WebGL Vendor --</option>
                  {(() => {
                    const compatibleGPUs = getWebGLRenderersByOS(profile.os || 'Windows');
                    const uniqueVendors = [...new Set(compatibleGPUs.map(gpu => gpu.vendor))];
                    return uniqueVendors.map(vendor => (
                      <option key={vendor} value={vendor}>{vendor}</option>
                    ));
                  })()}
                </select>
              </div>

              {/* WebGL Renderer */}
              <div>
                <label htmlFor="webgl-renderer" className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">
                  WebGL Renderer
                </label>
                <select
                  id="webgl-renderer"
                  value={profile.webglRenderer || ''}
                  onChange={(e) => {
                    const selectedRenderer = e.target.value;
                    const compatibleGPUs = getWebGLRenderersByOS(profile.os || 'Windows');
                    const matchingGPU = compatibleGPUs.find(gpu => gpu.renderer === selectedRenderer);
                    setProfile(prev => ({
                      ...prev,
                      webglRenderer: selectedRenderer,
                      webglVendor: matchingGPU ? matchingGPU.vendor : prev.webglVendor,
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Chọn WebGL Renderer --</option>
                  {(() => {
                    const compatibleGPUs = getWebGLRenderersByOS(profile.os || 'Windows');
                    const filteredGPUs = profile.webglVendor
                      ? compatibleGPUs.filter(gpu => gpu.vendor === profile.webglVendor)
                      : compatibleGPUs;
                    return filteredGPUs.map((gpu, idx) => (
                      <option key={idx} value={gpu.renderer}>
                        {gpu.vendor} - {gpu.renderer.substring(0, 80)}...
                      </option>
                    ));
                  })()}
                </select>
              </div>
            </div>

            {/* Privacy Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-foreground">Privacy</h3>
              
              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={profile.geoEnabled}
                    onChange={(e) => handleFieldChange('geoEnabled', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-foreground">Geolocation Enabled</span>
                </label>

                {profile.geoEnabled && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">
                      Geo Mode
                    </label>
                    <select
                      value={profile.geoMode}
                      onChange={(e) => handleFieldChange('geoMode', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="original">Original</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                )}

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={profile.webrtcMainIp}
                    onChange={(e) => handleFieldChange('webrtcMainIp', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-foreground">WebRTC Main IP</span>
                </label>
              </div>
            </div>

            {/* Proxy Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-foreground">Proxy</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">
                  Proxy Mode
                </label>
                <select
                  value={profile.proxyMode}
                  onChange={(e) => handleFieldChange('proxyMode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Manual">Manual</option>
                  <option value="Library">Library</option>
                </select>
              </div>

              {profile.proxyMode === 'Manual' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="profile-proxy-host" className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">
                      Host
                    </label>
                    <input
                      id="profile-proxy-host"
                      type="text"
                      value={profile.proxy?.host || ''}
                      onChange={(e) => handleChange('proxy.host', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="192.168.1.1"
                    />
                  </div>

                  <div>
                    <label htmlFor="profile-proxy-port" className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">
                      Port
                    </label>
                    <input
                      id="profile-proxy-port"
                      type="text"
                      value={profile.proxy?.port || ''}
                      onChange={(e) => handleChange('proxy.port', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="8080"
                    />
                  </div>

                  <div>
                    <label htmlFor="profile-proxy-username" className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">
                      Username
                    </label>
                    <input
                      id="profile-proxy-username"
                      type="text"
                      value={profile.proxy?.username || ''}
                      onChange={(e) => handleChange('proxy.username', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Optional"
                    />
                  </div>

                  <div>
                    <label htmlFor="profile-proxy-password" className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">
                      Password
                    </label>
                    <input
                      id="profile-proxy-password"
                      type="password"
                      value={profile.proxy?.password || ''}
                      onChange={(e) => handleChange('proxy.password', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Optional"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-[#2a2a2a] flex-shrink-0 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-foreground bg-white dark:bg-[#0f0f0f] border border-gray-300 dark:border-[#2a2a2a] rounded-md hover:bg-gray-50 dark:hover:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-profile-form"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  )
}

