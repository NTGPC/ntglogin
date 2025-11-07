// audioSpoof.js — Stable-noise AudioContext fingerprint patch

(() => {

  // ====== Seeded PRNG (xorshift32) – ổn định theo profile ======

  const LSK = '__fp_noise_seed__';

  let seed = 0;

  try {

    const stored = localStorage.getItem(LSK);

    if (stored) seed = parseInt(stored, 10) >>> 0;

    else {

      // tạo seed từ UA + cores + time (chỉ lần đầu profile)

      const base = (Date.now() ^ (navigator.hardwareConcurrency || 4) ^ navigator.userAgent.length) >>> 0;

      seed = (base ^ ((Math.random() * 0xffffffff) >>> 0)) >>> 0;

      localStorage.setItem(LSK, String(seed));

    }

  } catch (_) {

    seed = 123456789; // fallback

  }



  function rand() { // 0..1

    // xorshift32

    seed ^= seed << 13; seed >>>= 0;

    seed ^= seed >> 17; seed >>>= 0;

    seed ^= seed << 5;  seed >>>= 0;

    return (seed >>> 0) / 4294967296;

  }



  // biên độ nhiễu rất nhỏ, đủ đổi hash, không ảnh hưởng playback

  const NOISE_A = 1e-6;

  const NOISE_B = 1e-7;



  // ====== Patch AudioBuffer.getChannelData / copyFromChannel ======

  const AB = window.AudioBuffer && window.AudioBuffer.prototype;

  if (AB && !AB.__fp_patched__) {

    const _get = AB.getChannelData;

    const _copy = AB.copyFromChannel;



    Object.defineProperty(AB, 'getChannelData', {

      configurable: true,

      value: function (...args) {

        const arr = _get.apply(this, args);

        // chỉ “chấm muối” 1 lần để không tăng nhiễu theo thời gian

        if (!this.__fp_noised__) {

          this.__fp_noised__ = true;

          const len = Math.min(arr.length, 44100); // 1s đủ để fingerprint

          // rải nhiễu thưa để nhẹ hiệu năng

          for (let i = 0; i < len; i += 64) {

            arr[i] += (rand() - 0.5) * NOISE_A;

          }

        }

        return arr;

      }

    });



    if (typeof _copy === 'function') {

      AB.copyFromChannel = function (destination, channelNumber, startInChannel = 0) {

        const r = _copy.apply(this, arguments);

        // thêm 1 chút nhiễu vào buffer đích

        for (let i = 0; i < destination.length; i += 64) {

          destination[i] += (rand() - 0.5) * NOISE_B;

        }

        return r;

      };

    }



    AB.__fp_patched__ = true;

  }



  // ====== Patch AnalyserNode.getFloatTimeDomainData ======

  const AN = window.AnalyserNode && window.AnalyserNode.prototype;

  if (AN && !AN.__fp_patched__) {

    const _getFloat = AN.getFloatTimeDomainData;

    AN.getFloatTimeDomainData = function (array) {

      const r = _getFloat.apply(this, arguments);

      // chấm nhiễu thưa

      for (let i = 0; i < array.length; i += 64) {

        array[i] += (rand() - 0.5) * NOISE_B;

      }

      return r;

    };

    AN.__fp_patched__ = true;

  }



  // ====== Patch OfflineAudioContext: sampleRate + startRendering ======

  function patchOffline(ctxCtorName) {

    const Ctx = window[ctxCtorName];

    if (!Ctx || Ctx.__fp_patched__) return;

    const _start = Ctx.prototype.startRendering;



    // ép sampleRate “ổn định” nếu trang cố dựng rate lạ để nhận diện

    try {

      Object.defineProperty(Ctx.prototype, 'sampleRate', {

        get() { return 44100; }

      });

    } catch (_) { /* ignore */ }



    Ctx.prototype.startRendering = function () {

      // một số lib đọc kết quả sau render → thêm nhiễu ngay trước khi resolve

      const p = _start.apply(this, arguments);

      try {

        return Promise.resolve(p).then((buf) => {

          try {

            const chs = buf.numberOfChannels;

            for (let ch = 0; ch < chs; ch++) {

              const data = buf.getChannelData(ch);

              const len = Math.min(data.length, 44100);

              for (let i = 0; i < len; i += 64) {

                data[i] += (rand() - 0.5) * NOISE_A;

              }

            }

          } catch (_) {}

          return buf;

        });

      } catch (_) {

        return p;

      }

    };



    Ctx.__fp_patched__ = true;

  }



  patchOffline('OfflineAudioContext');

  patchOffline('webkitOfflineAudioContext');

})();

