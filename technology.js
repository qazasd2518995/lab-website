/* ==============================================
   L-DAHS · Technology page — live demo engines
   VR (Three.js) + Multilingual interpreter (Canvas 2D)
   Self-contained IIFE. Does not touch script.js.
   ============================================== */
(() => {
  'use strict';

  /* ── shared helpers ── */
  // deterministic RNG so demos look identical every run (mirrors script.js style)
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  const prefersReduced = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TAU = Math.PI * 2;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp01 = t => t < 0 ? 0 : t > 1 ? 1 : t;
  const easeInOut = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

  /* ── start-button wiring shared by both demos ── */
  // wireStart: hides the button, reveals the HUD, then calls onStart(stage).
  function wireStart(startId, hudId, onStart) {
    const btn = document.getElementById(startId);
    const hud = document.getElementById(hudId);
    if (!btn) return;
    const stage = btn.closest('.demo-stage');
    btn.addEventListener('click', () => {
      btn.classList.add('is-hidden');
      setTimeout(() => { btn.hidden = true; }, 520);
      if (hud) hud.hidden = false;
      onStart(stage);
    }, { once: true });
  }

  /* ============================================================
     INTERPRETER DEMO — Canvas 2D, three-segment multilingual relay
     ============================================================ */
  function initInterpreter() {
    const canvas = document.getElementById('interp-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const hud = {
      srcLang: document.getElementById('interp-src-lang'),
      tgtLang: document.getElementById('interp-tgt-lang'),
      latency: document.getElementById('interp-latency'),
      pipeline: document.getElementById('interp-pipeline'),
    };
    const rng = mulberry32(73019);

    // three relay segments: source text, target text, language labels, theme color
    const SCRIPT = [
      { srcLang: 'EN', tgtLang: '中', color: '#34e3cf',
        src: 'Could you tell me where the nearest station is?',
        tgt: '請問最近的車站在哪裡？' },
      { srcLang: '中', tgtLang: 'EN', color: '#ffb74d',
        src: '這道菜會不會太辣？',
        tgt: 'Is this dish too spicy?' },
      { srcLang: '日', tgtLang: '中', color: '#ff5d8f',
        src: '写真を撮ってもいいですか？',
        tgt: '可以幫我拍張照嗎？' },
    ];

    // device pixel handling
    let W = 0, H = 0, DPR = Math.min(window.devicePixelRatio || 1, 2);
    function resize() {
      const r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = Math.round(W * DPR);
      canvas.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    // ── per-segment timeline (seconds) ──
    // 0.0 listen+ASR  →  2.6 translate  →  4.4 speak target  →  6.2 done/hold
    const T_ASR = 2.6, T_MT = 1.8, T_TTS = 1.8, T_HOLD = 1.0;
    const SEG = T_ASR + T_MT + T_TTS + T_HOLD; // 7.2s per segment

    let raf = 0, running = false, t0 = 0;

    function litStages(stages) {
      if (!hud.pipeline) return;
      hud.pipeline.querySelectorAll('i').forEach(el => {
        el.classList.toggle('lit', stages.includes(el.dataset.stage));
      });
    }

    // draw a waveform band on one side; amp 0..1 gates the motion
    function drawWave(cx, cy, half, color, amp, phase) {
      ctx.save();
      ctx.strokeStyle = color; ctx.globalAlpha = 0.85; ctx.lineWidth = 2;
      ctx.beginPath();
      const N = 48, span = half * 0.9;
      for (let i = 0; i <= N; i++) {
        const x = cx - span + (2 * span) * (i / N);
        const env = Math.sin(Math.PI * i / N); // taper at ends
        const a = amp * env * (0.5 + 0.5 * rng());
        const y = cy + Math.sin(i * 0.5 + phase) * a * (H * 0.16);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // central breathing device: concentric rings + pulsing core
    function drawDevice(cx, cy, color, pulse) {
      ctx.save();
      ctx.translate(cx, cy);
      const base = Math.min(W, H) * 0.13;
      for (let k = 3; k >= 1; k--) {
        ctx.beginPath();
        ctx.arc(0, 0, base * (1 + k * 0.5 + pulse * 0.12 * k), 0, TAU);
        ctx.strokeStyle = color; ctx.globalAlpha = 0.12 + 0.06 * (3 - k);
        ctx.lineWidth = 1.5; ctx.stroke();
      }
      const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, base);
      grd.addColorStop(0, color);
      grd.addColorStop(0.6, color + '55');
      grd.addColorStop(1, 'rgba(7,11,22,0)');
      ctx.globalAlpha = 0.55 + 0.25 * pulse;
      ctx.fillStyle = grd;
      ctx.beginPath(); ctx.arc(0, 0, base * (1 + pulse * 0.18), 0, TAU); ctx.fill();
      ctx.restore();
    }

    // typewriter with occasional grey→white correction flicker
    function drawTyped(text, cx, topY, maxW, prog, color, isSource) {
      ctx.save();
      ctx.font = isSource
        ? '500 18px "Spectral", serif'
        : '600 19px "Fraunces", serif';
      ctx.textAlign = 'center';
      const shown = Math.floor(text.length * clamp01(prog));
      let s = text.slice(0, shown);
      // wrap to maxW
      const words = s.split('');
      let line = '', lines = [];
      for (const ch of words) {
        if (ctx.measureText(line + ch).width > maxW && line) { lines.push(line); line = ch; }
        else line += ch;
      }
      if (line) lines.push(line);
      lines.forEach((ln, i) => {
        // last 2 chars flicker grey to mimic re-decoding
        ctx.fillStyle = (i === lines.length - 1 && prog < 1 && rng() > 0.6)
          ? 'rgba(160,170,200,0.6)' : color;
        ctx.fillText(ln, cx, topY + i * 26);
      });
      ctx.restore();
    }

    function frame(now) {
      if (!running) return;
      if (!t0) t0 = now;
      const elapsed = (now - t0) / 1000;
      const segIndex = Math.min(Math.floor(elapsed / SEG), SCRIPT.length - 1);
      const lt = elapsed - segIndex * SEG; // local time within segment
      const seg = SCRIPT[segIndex];
      const finished = elapsed >= SEG * SCRIPT.length;

      // phase progress
      const asrP = clamp01(lt / T_ASR);
      const mtP = clamp01((lt - T_ASR) / T_MT);
      const ttsP = clamp01((lt - T_ASR - T_MT) / T_TTS);

      // HUD updates
      if (hud.srcLang) hud.srcLang.textContent = seg.srcLang;
      if (hud.tgtLang) hud.tgtLang.textContent = seg.tgtLang;
      const stages = [];
      stages.push('vad');
      if (lt > 0.3) stages.push('asr');
      if (mtP > 0) stages.push('mt');
      if (ttsP > 0) stages.push('tts');
      litStages(finished ? [] : stages);
      if (hud.latency) hud.latency.textContent =
        String(180 + Math.floor(60 * Math.sin(elapsed * 3) + 60 * rng())).padStart(3, '0');

      // clear
      ctx.clearRect(0, 0, W, H);

      const cx = W / 2, cy = H / 2;
      const pulse = 0.5 + 0.5 * Math.sin(elapsed * 2.2);
      const srcAmp = asrP < 1 ? (0.5 + 0.5 * Math.sin(elapsed * 9)) : 0.04;
      const tgtAmp = ttsP > 0 && ttsP < 1 ? (0.5 + 0.5 * Math.sin(elapsed * 9 + 1)) : 0.04;

      // side waveforms
      const sideHalf = W * 0.20;
      drawWave(W * 0.22, cy, sideHalf, seg.color, srcAmp, elapsed * 6);
      drawWave(W * 0.78, cy, sideHalf, seg.color, tgtAmp, elapsed * 6 + 2);

      // device
      drawDevice(cx, cy, seg.color, pulse);

      // texts: source under left wave, target under right wave
      drawTyped(seg.src, W * 0.22, cy + H * 0.22, W * 0.34, asrP, '#e9e7dd', true);
      if (mtP > 0)
        drawTyped(seg.tgt, W * 0.78, cy + H * 0.22, W * 0.34, ttsP > 0 ? ttsP : mtP, seg.color, false);

      // flowing particles from device to target while translating
      if (mtP > 0 && ttsP < 1) {
        ctx.save();
        for (let p = 0; p < 14; p++) {
          const fp = ((elapsed * 0.8 + p / 14) % 1);
          const x = lerp(cx, W * 0.78, easeInOut(fp));
          const y = cy + Math.sin(fp * TAU + p) * 10;
          ctx.globalAlpha = (1 - fp) * 0.8;
          ctx.fillStyle = seg.color;
          ctx.beginPath(); ctx.arc(x, y, 2.2, 0, TAU); ctx.fill();
        }
        ctx.restore();
      }

      if (finished) { running = false; drawReplay(cx, cy); return; }
      raf = requestAnimationFrame(frame);
    }

    function drawReplay(cx, cy) {
      ctx.save();
      ctx.font = '500 14px "JetBrains Mono", monospace';
      ctx.fillStyle = '#a9b2cc'; ctx.textAlign = 'center';
      ctx.fillText('↻ click to replay', cx, cy + H * 0.36);
      ctx.restore();
      canvas.style.cursor = 'pointer';
      canvas.addEventListener('click', restart, { once: true });
    }
    function restart() {
      canvas.style.cursor = 'default';
      t0 = 0; running = true; raf = requestAnimationFrame(frame);
    }

    function renderStatic() {
      // reduced-motion: show final relay state, no animation
      resize();
      ctx.clearRect(0, 0, W, H);
      const seg = SCRIPT[0];
      drawDevice(W / 2, H / 2, seg.color, 1);
      drawTyped(seg.src, W * 0.22, H / 2 + H * 0.22, W * 0.34, 1, '#e9e7dd', true);
      drawTyped(seg.tgt, W * 0.78, H / 2 + H * 0.22, W * 0.34, 1, seg.color, false);
      if (hud.srcLang) hud.srcLang.textContent = seg.srcLang;
      if (hud.tgtLang) hud.tgtLang.textContent = seg.tgtLang;
    }

    function start() {
      resize();
      if (prefersReduced) { renderStatic(); return; }
      running = true; t0 = 0; raf = requestAnimationFrame(frame);
    }

    window.addEventListener('resize', () => { if (W) resize(); });
    wireStart('interp-start', 'interp-hud', start);
  }

  /* ── expose internals to later-task engines via a page namespace ── */
  window.LDAHS_TECH = { mulberry32, prefersReduced, TAU, lerp, clamp01, easeInOut, wireStart, initInterpreter };

  /* ── boot ── */
  function boot() {
    // engines register themselves here in later tasks:
    if (window.LDAHS_TECH.initVR) window.LDAHS_TECH.initVR();
    if (window.LDAHS_TECH.initInterpreter) window.LDAHS_TECH.initInterpreter();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
