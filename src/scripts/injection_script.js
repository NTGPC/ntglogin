// File: src/scripts/injection_script.js
// Bộ não của hệ thống - Chứa đựng toàn bộ "phép thuật" giả mạo fingerprint

(function() {
  'use strict';

  console.log('[Injection] ✅ Script giả mạo fingerprint đã được tiêm thành công.');

  // ==========================================================
  // === SEEDED RANDOM NUMBER GENERATOR (xorshift32) ===
  // ==========================================================
  // Sử dụng seed để đảm bảo tính nhất quán (deterministic)
  const seed = parseInt('__SEED__') || 12345;
  
  function xorshift32(seed) {
    let x = seed >>> 0;
    return function() {
      x ^= x << 13;
      x ^= x >>> 17;
      x ^= x << 5;
      return (x >>> 0) / 4294967295;
    };
  }
  
  const rand = xorshift32(seed);

  // ==========================================================
  // === GIẢ MẠO NAVIGATOR OBJECT ===
  // ==========================================================
  try {
    if (typeof navigator !== 'undefined') {
      // Ẩn webdriver flag
      try {
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined,
          configurable: true
        });
      } catch(e) {}

      // User Agent (đã được CDP xử lý, nhưng vẫn fake ở đây để đảm bảo)
      try {
        Object.defineProperty(navigator, 'userAgent', {
          get: () => '__USER_AGENT__',
          configurable: true
        });
      } catch(e) {}

      // Platform
      try {
        Object.defineProperty(navigator, 'platform', {
          get: () => '__PLATFORM__',
          configurable: true
        });
      } catch(e) {}

      // Hardware Concurrency (CPU cores)
      try {
        Object.defineProperty(navigator, 'hardwareConcurrency', {
          get: () => __HARDWARE_CONCURRENCY__,
          configurable: true
        });
      } catch(e) {}

      // Device Memory (RAM in GB)
      try {
        Object.defineProperty(navigator, 'deviceMemory', {
          get: () => __DEVICE_MEMORY__,
          configurable: true
        });
      } catch(e) {}

      // Languages (array)
      try {
        Object.defineProperty(navigator, 'languages', {
          get: () => __LANGUAGES__,
          configurable: true
        });
      } catch(e) {}

      // Language (primary)
      try {
        const languages = __LANGUAGES__;
        Object.defineProperty(navigator, 'language', {
          get: () => (languages && languages.length > 0 ? languages[0] : 'en-US'),
          configurable: true
        });
      } catch(e) {}
    }
  } catch(e) {}

  // ==========================================================
  // === GIẢ MẠO CANVAS FINGERPRINT (Thêm nhiễu) ===
  // ==========================================================
  (function canvasPatch() {
    const canvasMode = '__CANVAS_MODE__'; // 'noise', 'off', 'block'
    const canvasSeed = parseInt('__CANVAS_SEED__') || seed;
    const canvasRand = xorshift32(canvasSeed);

    if (canvasMode === 'block') {
      try {
        HTMLCanvasElement.prototype.toDataURL = function() {
          throw new Error('Canvas blocked');
        };
        HTMLCanvasElement.prototype.toBlob = function() {
          throw new Error('Canvas blocked');
        };
      } catch(e) {}
      return;
    }

    if (canvasMode === 'noise' || canvasMode === 'Noise') {
      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      
      HTMLCanvasElement.prototype.getContext = function(type, ...args) {
        if (type === '2d') {
          const context = originalGetContext.call(this, type, ...args);
          if (!context) return context;

          const originalGetImageData = context.getImageData;
          
          context.getImageData = function(...imageDataArgs) {
            const imageData = originalGetImageData.apply(this, imageDataArgs);
            
            // Thêm nhiễu ngẫu nhiên có seed (deterministic) vào pixel data
            const len = imageData.data.length;
            for (let i = 0; i < len; i += 4) {
              const noise = Math.floor((canvasRand() - 0.5) * 6); // -3 to +2
              imageData.data[i] = (imageData.data[i] + noise) & 255;
              imageData.data[i+1] = (imageData.data[i+1] + noise) & 255;
              imageData.data[i+2] = (imageData.data[i+2] + noise) & 255;
              // Giữ nguyên alpha channel (i+3)
            }
            
            return imageData;
          };
          
          return context;
        }
        return originalGetContext.call(this, type, ...args);
      };
    }
  })();

  // ==========================================================
  // === GIẢ MẠO WEBGL FINGERPRINT ===
  // ==========================================================
  (function webglPatch() {
    const webglVendor = '__WEBGL_VENDOR__';
    const webglRenderer = '__WEBGL_RENDERER__';

    function hardDefine(obj, name, fn) {
      try {
        Object.defineProperty(obj, name, {
          value: fn,
          configurable: true
        });
      } catch(e) {
        try {
          obj[name] = fn;
        } catch(_) {}
      }
    }

    function patchProto(proto) {
      if (!proto) return;
      
      const origGetParameter = proto.getParameter;
      
      hardDefine(proto, 'getParameter', function(parameter) {
        try {
          // UNMASKED_VENDOR_WEBGL = 37445, UNMASKED_RENDERER_WEBGL = 37446
          if (parameter === 37445) {
            return webglVendor;
          }
          if (parameter === 37446) {
            return webglRenderer;
          }
          return origGetParameter.call(this, parameter);
        } catch(e) {
          return null;
        }
      });
    }

    // Patch WebGL1 và WebGL2
    if (window.WebGLRenderingContext) {
      patchProto(WebGLRenderingContext.prototype);
    }
    if (window.WebGL2RenderingContext) {
      patchProto(WebGL2RenderingContext.prototype);
    }

    // Patch OffscreenCanvas
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

  // ==========================================================
  // === GIẢ MẠO AUDIOCONTEXT FINGERPRINT ===
  // ==========================================================
  (function audioPatch() {
    const audioMode = '__AUDIO_CONTEXT_MODE__'; // 'noise', 'off'
    const audioSeed = parseInt('__AUDIO_SEED__') || seed;
    const audioRand = xorshift32(audioSeed);

    if (audioMode === 'noise' || audioMode === 'Noise') {
      try {
        // OfflineAudioContext (được dùng để render buffer rồi hash)
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
                      // Thêm nhiễu rất nhỏ nhưng ổn định theo seed
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

      // Realtime Analyser (ít site dùng, nhưng patch cho chắc)
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC && AC.prototype && AC.prototype.createAnalyser) {
          const origCreate = AC.prototype.createAnalyser;
          Object.defineProperty(AC.prototype, 'createAnalyser', {
            value: function() {
              const an = origCreate.call(this);
              if (an && an.getFloatTimeDomainData) {
                const orig = an.getFloatTimeDomainData.bind(an);
                an.getFloatTimeDomainData = function(arr) {
                  orig(arr);
                  for (let i = 0; i < arr.length; i += 128) {
                    arr[i] = arr[i] + ((audioRand() - 0.5) * 1e-7);
                  }
                };
              }
              return an;
            },
            configurable: true
          });
        }
      } catch(e) {}
    }
  })();

  // ==========================================================
  // === GIẢ MẠO CLIENT RECTS (getBoundingClientRect) ===
  // ==========================================================
  (function clientRectsPatch() {
    const clientRectsMode = '__CLIENT_RECTS_MODE__'; // 'noise', 'off'
    
    if (clientRectsMode === 'noise' || clientRectsMode === 'Noise') {
      try {
        const elProto = Element.prototype;
        const origGetBoundingClientRect = elProto.getBoundingClientRect;
        
        elProto.getBoundingClientRect = function() {
          const r = origGetBoundingClientRect.call(this);
          const jitter = ((seed % 5) - 2) / 100; // Small deterministic jitter
          return {
            x: r.x + jitter,
            y: r.y + jitter,
            width: r.width + jitter,
            height: r.height + jitter,
            top: r.top + jitter,
            left: r.left + jitter,
            right: r.right + jitter,
            bottom: r.bottom + jitter,
            toJSON: r.toJSON
          };
        };
      } catch(e) {}
    }
  })();

  // ==========================================================
  // === GIẢ MẠO WEBRTC (Chặn rò rỉ IP) ===
  // ==========================================================
  (function webrtcPatch() {
    try {
      const OrigPeer = window.RTCPeerConnection;
      if (!OrigPeer) return;

      const webrtcUseMainIP = __WEBRTC_USE_MAIN_IP__ === true || __WEBRTC_USE_MAIN_IP__ === 'true';

      function FakePC(...args) {
        const pc = new OrigPeer(...args);
        const origAddEvent = pc.addEventListener.bind(pc);
        
        pc.addEventListener = function(type, listener, ...rest) {
          if (type === 'icecandidate') {
            const wrapped = function(e) {
              if (!e || !e.candidate) {
                try {
                  listener.call(this, e);
                } catch(err) {}
                return;
              }
              
              const cand = e.candidate.candidate || '';
              
              // Nếu không dùng Main IP, chặn các địa chỉ private
              if (!webrtcUseMainIP) {
                // Drop local/private IP candidates
                if (/(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])|169\.254\.)/.test(cand)) {
                  return; // Không gọi listener cho private IP
                }
              }
              
              try {
                listener.call(this, e);
              } catch(err) {}
            };
            return origAddEvent(type, wrapped, ...rest);
          }
          return origAddEvent(type, listener, ...rest);
        };
        
        return pc;
      }
      
      FakePC.prototype = OrigPeer.prototype;
      window.RTCPeerConnection = FakePC;
    } catch(e) {}
  })();

  // ==========================================================
  // === GIẢ MẠO GEOLOCATION ===
  // ==========================================================
  (function geoPatch() {
    const geoEnabled = __GEO_ENABLED__ === true || __GEO_ENABLED__ === 'true';
    const geoLat = parseFloat('__GEO_LAT__') || 10.762622;
    const geoLon = parseFloat('__GEO_LON__') || 106.660172;

    if (geoEnabled) {
      try {
        const fakePos = {
          coords: {
            latitude: geoLat,
            longitude: geoLon,
            accuracy: 50,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null
          },
          timestamp: Date.now()
        };

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition = function(success, error, opts) {
            setTimeout(() => {
              if (success) success(fakePos);
            }, 10);
          };

          navigator.geolocation.watchPosition = function(success, error, opts) {
            const id = Math.floor(rand() * 100000);
            setTimeout(() => {
              if (success) success(fakePos);
            }, 10);
            return id;
          };
        }
      } catch(e) {}
    }
  })();

  // ==========================================================
  // === GIẢ MẠO FONTS (offsetWidth/offsetHeight jitter) ===
  // ==========================================================
  (function fontsPatch() {
    try {
      const origOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth') ||
                              Object.getOwnPropertyDescriptor(Element.prototype, 'offsetWidth');
      const origOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight') ||
                               Object.getOwnPropertyDescriptor(Element.prototype, 'offsetHeight');

      if (origOffsetWidth && origOffsetWidth.get) {
        Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
          get: function() {
            const val = origOffsetWidth.get.call(this);
            const jitter = ((seed % 3) - 1); // -1, 0, or 1
            return Math.max(0, val + jitter);
          },
          configurable: true
        });
      }

      if (origOffsetHeight && origOffsetHeight.get) {
        Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
          get: function() {
            const val = origOffsetHeight.get.call(this);
            const jitter = ((seed % 3) - 1); // -1, 0, or 1
            return Math.max(0, val + jitter);
          },
          configurable: true
        });
      }
    } catch(e) {}
  })();

  // ==========================================================
  // === GIẢ MẠO SCREEN PROPERTIES ===
  // ==========================================================
  (function screenPatch() {
    try {
      const screenWidth = parseInt('__SCREEN_WIDTH__') || 1920;
      const screenHeight = parseInt('__SCREEN_HEIGHT__') || 1080;
      const screenAvailWidth = parseInt('__SCREEN_AVAIL_WIDTH__') || screenWidth;
      const screenAvailHeight = parseInt('__SCREEN_AVAIL_HEIGHT__') || (screenHeight - 40);
      const colorDepth = parseInt('__SCREEN_COLOR_DEPTH__') || 24;
      const pixelDepth = parseInt('__SCREEN_PIXEL_DEPTH__') || 24;
      const devicePixelRatio = parseFloat('__DEVICE_PIXEL_RATIO__') || 1;

      Object.defineProperty(screen, 'width', {
        get: () => screenWidth,
        configurable: true
      });

      Object.defineProperty(screen, 'height', {
        get: () => screenHeight,
        configurable: true
      });

      Object.defineProperty(screen, 'availWidth', {
        get: () => screenAvailWidth,
        configurable: true
      });

      Object.defineProperty(screen, 'availHeight', {
        get: () => screenAvailHeight,
        configurable: true
      });

      Object.defineProperty(screen, 'colorDepth', {
        get: () => colorDepth,
        configurable: true
      });

      Object.defineProperty(screen, 'pixelDepth', {
        get: () => pixelDepth,
        configurable: true
      });

      Object.defineProperty(window, 'devicePixelRatio', {
        get: () => devicePixelRatio,
        configurable: true
      });
    } catch(e) {}
  })();

  // ==========================================================
  // === GIẢ MẠO TIMEZONE ===
  // ==========================================================
  (function timezonePatch() {
    const timezone = '__TIMEZONE__' || 'Asia/Bangkok';
    
    try {
      const origToLocaleString = Date.prototype.toLocaleString;
      Date.prototype.toLocaleString = function(locales, options) {
        if (options && !options.timeZone) {
          options = { ...options, timeZone: timezone };
        }
        return origToLocaleString.call(this, locales, options);
      };

      const origToLocaleDateString = Date.prototype.toLocaleDateString;
      Date.prototype.toLocaleDateString = function(locales, options) {
        if (options && !options.timeZone) {
          options = { ...options, timeZone: timezone };
        }
        return origToLocaleDateString.call(this, locales, options);
      };

      const origToLocaleTimeString = Date.prototype.toLocaleTimeString;
      Date.prototype.toLocaleTimeString = function(locales, options) {
        if (options && !options.timeZone) {
          options = { ...options, timeZone: timezone };
        }
        return origToLocaleTimeString.call(this, locales, options);
      };
    } catch(e) {}
  })();

  // ==========================================================
  // === GIẢ MẠO PLUGINS & MIME TYPES ===
  // ==========================================================
  (function pluginsPatch() {
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
          namedItem: function(type) {
            return null;
          }
        },
        {
          name: 'Chrome PDF Viewer',
          description: '',
          filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai',
          length: 1,
          item: function(index) {
            return null;
          },
          namedItem: function(type) {
            return null;
          }
        },
        {
          name: 'Native Client',
          description: '',
          filename: 'internal-nacl-plugin',
          length: 2,
          item: function(index) {
            return null;
          },
          namedItem: function(type) {
            return null;
          }
        }
      ];

      Object.defineProperty(navigator, 'plugins', {
        get: () => {
          const pluginArray = {
            length: fakePlugins.length,
            item: function(index) {
              return fakePlugins[index] || null;
            },
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
    } catch(e) {}
  })();

  // ==========================================================
  // === ẨN CÁC DẤU HIỆU TỰ ĐỘNG HÓA ===
  // ==========================================================
  try {
    // Xóa các biến Playwright/Puppeteer
    delete window.__playwright;
    delete window.__pw_manual;
    delete window.__pw_original;
    delete window.__PUPPETEER_WORLD__;
    delete window.__pw;
  } catch(e) {}

  try {
    // Giả mạo window.chrome
    delete window.chrome;
    window.chrome = {
      runtime: {},
      loadTimes: function() {},
      csi: function() {},
      app: {}
    };
  } catch(e) {}

  try {
    // Override permissions query
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
  } catch(e) {}

  // Đánh dấu đã inject để debug
  try {
    Object.defineProperty(window, '__INJECTED_FINGERPRINT__', {
      value: {
        seed: seed,
        injected: true,
        timestamp: Date.now()
      },
      configurable: false
    });
  } catch(e) {}

  console.log('[Injection] ✅ Tất cả các patch đã được áp dụng thành công.');
})();

