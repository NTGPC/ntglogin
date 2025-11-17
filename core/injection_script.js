(() => {
  'use strict';
  
  console.log('[+] Anti-Detect Core v3 (WebGL/Canvas/AudioContext only) ACTIVATED!');
  // LƯU Ý: User-Agent, Platform, appVersion đã được xử lý bởi CDP (Emulation.setUserAgentOverride) ở cấp engine,
  // nên KHÔNG CÒN fake ở đây nữa để tránh xung đột. Chỉ fake WebGL, Canvas, AudioContext, và các thuộc tính khác.

  const PROFILE_DATA = {
    navigator: {
      hardwareConcurrency: %%HARDWARE_CONCURRENCY%%,
      deviceMemory: %%DEVICE_MEMORY%%,
      languages: %%LANGUAGES%%,
      language: '%%LANGUAGE%%'
    },
    screen: {
      width: %%SCREEN_WIDTH%%,
      height: %%SCREEN_HEIGHT%%,
      availWidth: %%SCREEN_AVAIL_WIDTH%%,
      availHeight: %%SCREEN_AVAIL_HEIGHT%%,
      colorDepth: %%SCREEN_COLOR_DEPTH%%,
      pixelDepth: %%SCREEN_PIXEL_DEPTH%%,
      devicePixelRatio: %%DEVICE_PIXEL_RATIO%%
    },
    webgl: {
      vendor: '%%WEBGL_VENDOR%%',
      renderer: '%%WEBGL_RENDERER%%'
    },
    canvas: {
      mode: '%%CANVAS_MODE%%',
      seed: %%CANVAS_SEED%%
    },
    audioContext: {
      mode: '%%AUDIO_CONTEXT_MODE%%',
      seed: %%AUDIO_SEED%%
    },
    clientRects: {
      mode: '%%CLIENT_RECTS_MODE%%'
    },
    geo: {
      enabled: %%GEO_ENABLED%%,
      lat: %%GEO_LAT%%,
      lon: %%GEO_LON%%
    },
    webrtc: {
      useMainIP: %%WEBRTC_USE_MAIN_IP%%
    },
    timezone: '%%TIMEZONE%%',
    seed: %%SEED%%
  };

  const FP = PROFILE_DATA;
  const seed = (FP.seed || 12345) >>> 0;

  function xorshift32(seed) {
    let x = seed >>> 0;
    return function() {
      x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
      return (x >>> 0) / 4294967295;
    };
  }

  const rand = xorshift32(seed);

  try {
    if (typeof navigator !== 'undefined') {
      try { Object.defineProperty(navigator, 'webdriver', { get: () => undefined, configurable: true }); } catch(e){}
      
      // LƯU Ý: User-Agent, Platform, appVersion đã được xử lý bởi CDP (Emulation.setUserAgentOverride) ở cấp engine,
      // nên KHÔNG CÒN fake ở đây nữa để tránh xung đột.
      
      if (FP.navigator) {
        if (FP.navigator.hardwareConcurrency !== undefined) {
          try { Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => FP.navigator.hardwareConcurrency, configurable: true }); } catch(e){}
        }
        if (FP.navigator.deviceMemory !== undefined) {
          try { Object.defineProperty(navigator, 'deviceMemory', { get: () => FP.navigator.deviceMemory, configurable: true }); } catch(e){}
        }
        if (FP.navigator.languages) {
          try { Object.defineProperty(navigator, 'languages', { get: () => FP.navigator.languages, configurable: true }); } catch(e){}
        }
        if (FP.navigator.language) {
          try { Object.defineProperty(navigator, 'language', { get: () => FP.navigator.language, configurable: true }); } catch(e){}
        }
      }
    }
  } catch(e){}

  (function canvasPatch(){
    const mode = FP.canvas?.mode || 'Noise';
    if (mode === 'Block') {
      try {
        HTMLCanvasElement.prototype.toDataURL = function() { throw new Error('Canvas blocked'); };
        HTMLCanvasElement.prototype.toBlob = function() { throw new Error('Canvas blocked'); };
      } catch(e){}
      return;
    }
    if (mode === 'Noise') {
      const origGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(type, attrs) {
        const ctx = origGetContext.call(this, type, attrs);
        if (!ctx || type !== '2d') return ctx;
        try {
          const orig_getImageData = ctx.getImageData;
          ctx.getImageData = function(x, y, w, h) {
            const data = orig_getImageData.call(this, x, y, w, h);
            const canvasSeed = FP.canvas?.seed || seed;
            const canvasRand = xorshift32(canvasSeed);
            const len = data.data.length;
            for (let i = 0; i < len; i += 4) {
              const j = Math.floor((canvasRand() - 0.5) * 6);
              data.data[i] = (data.data[i] + j) & 255;
              data.data[i+1] = (data.data[i+1] + j) & 255;
              data.data[i+2] = (data.data[i+2] + j) & 255;
            }
            return data;
          };
        } catch(e){}
        return ctx;
      };
    }
  })();

  (function webglPatch(){
    const VENDOR = FP.webgl?.vendor || 'Intel Inc.';
    const RENDER = FP.webgl?.renderer || 'Intel Iris OpenGL Engine';
    
    function hardDefine(obj, name, fn) {
      try {
        Object.defineProperty(obj, name, { value: fn, configurable: true });
      } catch(e) {
        try { obj[name] = fn; } catch(_){}
      }
    }
    
    function patchProto(proto) {
      if (!proto) return;
      
      const orig_getParameter = proto.getParameter;
      hardDefine(proto, 'getParameter', function(param) {
        try {
          if (param === 37445) return VENDOR;
          if (param === 37446) return RENDER;
          return orig_getParameter.call(this, param);
        } catch(e) { return null; }
      });
    }
    
    if (window.WebGLRenderingContext) patchProto(WebGLRenderingContext.prototype);
    if (window.WebGL2RenderingContext) patchProto(WebGL2RenderingContext.prototype);
    
    if (window.OffscreenCanvas) {
      const orig = OffscreenCanvas.prototype.getContext;
      hardDefine(OffscreenCanvas.prototype, 'getContext', function(type, opts) {
        const ctx = orig.call(this, type, opts);
        if (ctx && (type === 'webgl' || type === 'webgl2')) {
          try {
            const p = Object.getPrototypeOf(ctx);
            patchProto(p);
          } catch(e) {}
        }
        return ctx;
      });
    }
  })();

  (function audioPatch(){
    const audioMode = FP.audioContext?.mode || 'Off';
    if (audioMode === 'Noise') {
      const audioSeed = FP.audioContext?.seed || seed;
      const audioRand = xorshift32(audioSeed);
      
      try {
        const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
        if (OAC && OAC.prototype && OAC.prototype.startRendering) {
          const origStart = OAC.prototype.startRendering;
          Object.defineProperty(OAC.prototype, 'startRendering', {
            value: function() {
              const ret = origStart.apply(this, arguments);
              return Promise.resolve(ret).then(buf => {
                try {
                  const ch = buf.numberOfChannels;
                  for (let c = 0; c < ch; c++) {
                    const data = buf.getChannelData(c);
                    for (let i = 0; i < data.length; i += 128) {
                      data[i] = data[i] + ((audioRand() - 0.5) * 1e-7);
                    }
                  }
                } catch(e) {}
                return buf;
              });
            },
            configurable: true
          });
        }
      } catch(e) {}
    }
  })();

  (function screenPatch(){
    if (FP.screen) {
      try {
        Object.defineProperty(screen, 'width', { get: () => FP.screen.width || 1920, configurable: true });
        Object.defineProperty(screen, 'height', { get: () => FP.screen.height || 1080, configurable: true });
        Object.defineProperty(screen, 'availWidth', { get: () => FP.screen.availWidth || FP.screen.width || 1920, configurable: true });
        Object.defineProperty(screen, 'availHeight', { get: () => FP.screen.availHeight || (FP.screen.height - 40) || 1040, configurable: true });
        Object.defineProperty(screen, 'colorDepth', { get: () => FP.screen.colorDepth || 24, configurable: true });
        Object.defineProperty(screen, 'pixelDepth', { get: () => FP.screen.pixelDepth || 24, configurable: true });
        if (FP.screen.devicePixelRatio !== undefined) {
          Object.defineProperty(window, 'devicePixelRatio', { get: () => FP.screen.devicePixelRatio || 1, configurable: true });
        }
      } catch(e){}
    }
  })();

  (function fontsPatch(){
    try {
      const origOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth') || 
        Object.getOwnPropertyDescriptor(Element.prototype, 'offsetWidth');
      const origOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight') || 
        Object.getOwnPropertyDescriptor(Element.prototype, 'offsetHeight');
      
      if (origOffsetWidth && origOffsetWidth.get) {
        Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
          get: function() {
            const val = origOffsetWidth.get.call(this);
            const jitter = ((seed % 3) - 1);
            return Math.max(0, val + jitter);
          },
          configurable: true
        });
      }
      
      if (origOffsetHeight && origOffsetHeight.get) {
        Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
          get: function() {
            const val = origOffsetHeight.get.call(this);
            const jitter = ((seed % 3) - 1);
            return Math.max(0, val + jitter);
          },
          configurable: true
        });
      }
    } catch(e){}
  })();

  (function pluginsPatch(){
    try {
      const fakePlugins = [
        {
          name: 'Chrome PDF Plugin',
          description: 'Portable Document Format',
          filename: 'internal-pdf-viewer',
          length: 1,
          item: function(index) {
            return index === 0 ? {
              type: 'application/pdf',
              suffixes: 'pdf',
              description: 'Portable Document Format',
              enabledPlugin: fakePlugins[0]
            } : null;
          },
          namedItem: function(type) { return null; }
        },
        {
          name: 'Chrome PDF Viewer',
          description: '',
          filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai',
          length: 1,
          item: function(index) { return null; },
          namedItem: function(type) { return null; }
        },
        {
          name: 'Native Client',
          description: '',
          filename: 'internal-nacl-plugin',
          length: 2,
          item: function(index) { return null; },
          namedItem: function(type) { return null; }
        }
      ];
      
      Object.defineProperty(navigator, 'plugins', {
        get: () => {
          const pluginArray = {
            length: fakePlugins.length,
            item: function(index) { return fakePlugins[index] || null; },
            namedItem: function(name) {
              for (const p of fakePlugins) {
                if (p.name === name) return p;
              }
              return null;
            },
            refresh: function() {},
            [Symbol.iterator]: function* () {
              for (const p of fakePlugins) yield p;
            }
          };
          for (let i = 0; i < fakePlugins.length; i++) {
            Object.defineProperty(pluginArray, i, {
              get: () => fakePlugins[i],
              configurable: true
            });
          }
          return pluginArray;
        },
        configurable: true
      });
      
      Object.defineProperty(navigator, 'mimeTypes', {
        get: () => {
          const mimeArray = {
            length: 1,
            item: function(index) {
              return index === 0 ? {
                type: 'application/pdf',
                suffixes: 'pdf',
                description: 'Portable Document Format',
                enabledPlugin: fakePlugins[0]
              } : null;
            },
            namedItem: function(type) {
              return type === 'application/pdf' ? {
                type: 'application/pdf',
                suffixes: 'pdf',
                description: 'Portable Document Format',
                enabledPlugin: fakePlugins[0]
              } : null;
            },
            [Symbol.iterator]: function* () {
              if (mimeArray.item(0)) yield mimeArray.item(0);
            }
          };
          Object.defineProperty(mimeArray, 0, {
            get: () => mimeArray.item(0),
            configurable: true
          });
          return mimeArray;
        },
        configurable: true
      });
    } catch(e){}
  })();

  (function timezonePatch(){
    if (FP.timezone) {
      try {
        const tz = FP.timezone;
        const origToLocaleString = Date.prototype.toLocaleString;
        Date.prototype.toLocaleString = function(locales, options) {
          if (options && options.timeZone) {
            options.timeZone = tz;
          }
          return origToLocaleString.call(this, locales, options);
        };
      } catch(e){}
    }
  })();

  (function webrtcPatch(){
    try {
      const OrigPeer = window.RTCPeerConnection;
      if (!OrigPeer) return;
      function FakePC(...args) {
        const pc = new OrigPeer(...args);
        const origAddEvent = pc.addEventListener.bind(pc);
        pc.addEventListener = function(type, listener, ...rest) {
          if (type === 'icecandidate') {
            const wrapped = function(e) {
              if (!e || !e.candidate) return;
              const cand = e.candidate.candidate || '';
              if (!FP.webrtc || !FP.webrtc.useMainIP) {
                if (/(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])|169\.254\.)/.test(cand)) return;
              }
              try { listener.call(this, e); } catch(err){}
            };
            return origAddEvent(type, wrapped, ...rest);
          }
          return origAddEvent(type, listener, ...rest);
        };
        return pc;
      }
      FakePC.prototype = OrigPeer.prototype;
      window.RTCPeerConnection = FakePC;
    } catch(e){}
  })();

  (function geoPatch(){
    if (FP.geo && FP.geo.enabled) {
      try {
        const fakePos = {
          coords: {
            latitude: FP.geo.lat || 10.762622,
            longitude: FP.geo.lon || 106.660172,
            accuracy: 50
          }
        };
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition = function(success, error, opts) {
            setTimeout(()=> success(fakePos), 10);
          };
          navigator.geolocation.watchPosition = function(success, error, opts) {
            const id = Math.floor(rand()*100000);
            setTimeout(()=> success(fakePos), 10);
            return id;
          };
        }
      } catch(e){}
    }
  })();

  try { Object.defineProperty(window, '__INJECTED_FINGERPRINT__', { value: FP, configurable:false }); } catch(e){}

  try { 
    delete window.chrome; 
    window.chrome = { 
      runtime: {},
      loadTimes: function() {},
      csi: function() {},
      app: {}
    };
  } catch(e){}

  try {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined, configurable: true });
  } catch(e){}

  try {
    if (navigator.permissions && navigator.permissions.query) {
      const originalQuery = navigator.permissions.query;
      navigator.permissions.query = function(parameters) {
        if (parameters.name === 'notifications') {
          return Promise.resolve({ state: Notification.permission || 'default' });
        }
        if (parameters.name === 'geolocation') {
          return Promise.resolve({ state: 'prompt' });
        }
        try {
          return originalQuery.call(this, parameters);
        } catch(e) {
          return Promise.resolve({ state: 'prompt' });
        }
      };
    }
  } catch(e){}

  try {
    delete window.__playwright;
    delete window.__pw_manual;
    delete window.__pw_original;
    delete window.__PUPPETEER_WORLD__;
    delete window.__pw;
  } catch(e){}
})();

