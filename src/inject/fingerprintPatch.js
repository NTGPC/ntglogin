// --- WebGL vendor/renderer spoof ---
(function() {
  const VENDOR = 'Apple Inc.';
  const RENDERER = 'Apple M1';
  const PARAM_VENDOR = 0x1F00;
  const PARAM_RENDERER = 0x1F01;
  const EXT_PARAM_VENDOR = 0x9245;    // UNMASKED_VENDOR_WEBGL
  const EXT_PARAM_RENDERER = 0x9246;  // UNMASKED_RENDERER_WEBGL

  const wrap = (proto) => {
    const _getParameter = proto.getParameter;
    Object.defineProperty(proto, 'getParameter', {
      value: function(p) {
        try {
          if (p === PARAM_VENDOR) return VENDOR;
          if (p === PARAM_RENDERER) return RENDERER;
          if (p === EXT_PARAM_VENDOR) return VENDOR;
          if (p === EXT_PARAM_RENDERER) return RENDERER;
        } catch(e){}
        return _getParameter.apply(this, arguments);
      },
      configurable: true
    });
  };
  if (window.WebGLRenderingContext) wrap(WebGLRenderingContext.prototype);
  if (window.WebGL2RenderingContext) wrap(WebGL2RenderingContext.prototype);
})();

// --- AudioContext noise ---
(function() {
  const addNoise = (buf) => {
    if (!buf) return;
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] += (Math.random() - 0.5) * 1e-7;
  };
  const wrap = (Ctx) => {
    const _createBuffer = Ctx.prototype.createBuffer;
    Ctx.prototype.createBuffer = function() {
      const b = _createBuffer.apply(this, arguments);
      try { addNoise(b); } catch(e){}
      return b;
    };
  };
  if (window.OfflineAudioContext) wrap(OfflineAudioContext);
  if (window.webkitOfflineAudioContext) wrap(webkitOfflineAudioContext);
})();

// --- mediaDevices: ẩn nhãn thiết bị thật ---
(function() {
  const md = navigator.mediaDevices;
  if (!md || !md.enumerateDevices) return;
  const _enum = md.enumerateDevices.bind(md);
  md.enumerateDevices = async () => {
    const list = await _enum();
    return list.map((d, i) => ({
      ...d,
      label: d.label ? `Device ${i+1}` : '' // xóa nhãn thực
    }));
  };
})();

// --- WebRTC: chặn lộ IP LAN qua ICE candidates ---
(function() {
  const RTCPeer = window.RTCPeerConnection || window.webkitRTCPeerConnection;
  if (!RTCPeer) return;
  const _orig = RTCPeer;
  function Wrapped(cfg) {
    const c = new _orig(cfg);
    c.addEventListener('icecandidate', (e) => {
      if (e && e.candidate && /typ host|candidate:.*(192\.168\.|10\.|172\.(1[6-9]|2\d|3[0-1]))/i.test(e.candidate.candidate)) {
        // nuốt IP nội bộ
        e.candidate.candidate = '';
      }
    });
    return c;
  }
  Wrapped.prototype = _orig.prototype;
  window.RTCPeerConnection = Wrapped;
  window.webkitRTCPeerConnection = Wrapped;
})();

