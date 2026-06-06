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

    // three relay segments. Each carries a source clip and a translation clip,
    // spoken by different macOS `say` voices so the relay sounds like two people.
    const SCRIPT = [
      { srcLang: 'EN', tgtLang: '中', color: '#34e3cf',
        src: 'Could you tell me where the nearest station is?',
        tgt: '請問最近的車站在哪裡？',
        srcAudio: 'audio/s1_src.mp3', tgtAudio: 'audio/s1_tgt.mp3' },
      { srcLang: '中', tgtLang: 'EN', color: '#ffb74d',
        src: '這道菜會不會太辣？',
        tgt: 'Is this dish too spicy?',
        srcAudio: 'audio/s2_src.mp3', tgtAudio: 'audio/s2_tgt.mp3' },
      { srcLang: '日', tgtLang: '中', color: '#ff5d8f',
        src: '写真を撮ってもいいですか？',
        tgt: '可以幫我拍張照嗎？',
        srcAudio: 'audio/s3_src.mp3', tgtAudio: 'audio/s3_tgt.mp3' },
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

    /* ── Web Audio: real amplitude drives the side waveforms ──
       One AudioContext, one analyser. The currently playing <audio> element is
       routed through a MediaElementSource into the analyser, so liveAmp() reads
       the true loudness of the speech being played. If Web Audio is unavailable,
       audioOK stays false and the visuals fall back to a synthetic envelope. */
    let actx = null, analyser = null, freqData = null, audioOK = false;
    const elements = new Map();   // audio-url -> { el, node }
    function ensureAudio() {
      if (actx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { audioOK = false; return; }
      try {
        actx = new AC();
        analyser = actx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.7;
        analyser.connect(actx.destination);
        freqData = new Uint8Array(analyser.frequencyBinCount);
        audioOK = true;
      } catch (e) { audioOK = false; }
    }
    // preload one <audio> per clip and wire it to the analyser once
    function getClip(url) {
      let rec = elements.get(url);
      if (rec) return rec;
      const el = new Audio(url);
      el.preload = 'auto';
      el.crossOrigin = 'anonymous';
      rec = { el, node: null };
      if (audioOK) {
        try {
          rec.node = actx.createMediaElementSource(el);
          rec.node.connect(analyser);
        } catch (e) { /* element already bound or blocked; play() still works */ }
      }
      elements.set(url, rec);
      return rec;
    }
    // current loudness 0..1 from the analyser (RMS of the time-ish data)
    function liveAmp() {
      if (!audioOK || !playing) return 0;
      analyser.getByteFrequencyData(freqData);
      let sum = 0;
      for (let i = 0; i < freqData.length; i++) sum += freqData[i];
      const avg = sum / freqData.length / 255;       // 0..1
      return clamp01(avg * 2.2);                      // lift quiet speech
    }

    let raf = 0, running = false;
    let segIndex = 0, phase = 'idle';   // idle | listen | translate | speak | done
    let phaseStart = 0;                 // performance.now() at phase entry
    let playing = null;                 // the <audio> element currently playing
    let clipProgress = 0;               // 0..1 progress of the playing clip
    const T_TRANSLATE = 1.1;            // seconds of MT "thinking" between clips

    function litStages(stages) {
      if (!hud.pipeline) return;
      hud.pipeline.querySelectorAll('i').forEach(el => {
        el.classList.toggle('lit', stages.includes(el.dataset.stage));
      });
    }

    // draw a waveform band on one side; amp 0..1 gates the motion
    function drawWave(cx, cy, half, color, amp, phaseShift) {
      ctx.save();
      ctx.strokeStyle = color; ctx.globalAlpha = 0.85; ctx.lineWidth = 2;
      ctx.beginPath();
      const N = 48, span = half * 0.9;
      for (let i = 0; i <= N; i++) {
        const x = cx - span + (2 * span) * (i / N);
        const env = Math.sin(Math.PI * i / N); // taper at ends
        const a = amp * env * (0.5 + 0.5 * rng());
        const y = cy + Math.sin(i * 0.5 + phaseShift) * a * (H * 0.16);
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
        // last chars flicker grey to mimic re-decoding while the clip plays
        ctx.fillStyle = (i === lines.length - 1 && prog < 1 && rng() > 0.6)
          ? 'rgba(160,170,200,0.6)' : color;
        ctx.fillText(ln, cx, topY + i * 26);
      });
      ctx.restore();
    }

    /* ── audio-driven state machine ──
       listen: play source clip, source wave + ASR text track its progress.
       translate: brief MT pause, pipeline shows MT, particles flow.
       speak: play translation clip (different voice), target wave + text track it.

       activeClip holds teardown for whatever is playing right now. Starting a new
       clip (or restarting) first tears the old one down, so a stale 'ended' event,
       guard timer, or paused-but-still-tracked element can never advance the new
       run. This is what stops two clips overlapping on segment switches and replay. */
    let activeClip = null;

    function stopPlaying() {
      if (activeClip) { activeClip.teardown(); activeClip = null; }
      playing = null;
    }

    function playClip(url, onEnded) {
      stopPlaying();                       // never let a previous clip keep running
      const clip = getClip(url);
      const el = clip.el;
      playing = el;
      clipProgress = 0;
      try { el.pause(); } catch (e) {}
      try { el.currentTime = 0; } catch (e) {}

      let finished = false;
      let guardTimer = 0;
      const onTime = () => { clipProgress = el.duration ? clamp01(el.currentTime / el.duration) : 0; };
      const teardown = () => {
        clearTimeout(guardTimer);
        el.removeEventListener('timeupdate', onTime);
        el.removeEventListener('ended', onEndedEvt);
        try { el.pause(); } catch (e) {}
      };
      const done = () => {
        if (finished) return;              // ended + guard can both fire: run once
        finished = true;
        teardown();
        clipProgress = 1;
        if (activeClip && activeClip.el === el) activeClip = null;
        if (playing === el) playing = null;
        onEnded();
      };
      const onEndedEvt = () => done();

      activeClip = { el, teardown: () => { teardown(); finished = true; } };
      el.addEventListener('timeupdate', onTime);
      el.addEventListener('ended', onEndedEvt);

      const p = el.play();
      if (p && p.catch) p.catch(() => { /* autoplay blocked: advance after a beat */ guardTimer = setTimeout(done, 1200); });
      // safety net if 'ended' never fires (load error / metadata missing). duration
      // is often NaN at play() time, so read it lazily and fall back generously.
      const guardMs = ((el.duration && isFinite(el.duration) ? el.duration : 4) + 1.5) * 1000;
      guardTimer = setTimeout(() => { if (playing === el) done(); }, guardMs);
    }

    function enterPhase(name) {
      phase = name;
      phaseStart = performance.now();
      const seg = SCRIPT[segIndex];
      if (name === 'listen') {
        if (audioOK) playClip(seg.srcAudio, () => enterPhase('translate'));
        else { /* no audio: fixed 2.4s listen */ }
      } else if (name === 'speak') {
        if (audioOK) playClip(seg.tgtAudio, () => advanceSegment());
        else { /* no audio: fixed 2.0s speak */ }
      }
    }

    function advanceSegment() {
      if (segIndex < SCRIPT.length - 1) { segIndex++; enterPhase('listen'); }
      else { phase = 'done'; }
    }

    // when audio is unavailable, drive phases purely by elapsed time
    const FALLBACK = { listen: 2.4, translate: T_TRANSLATE, speak: 2.0 };
    function fallbackAdvance(localT) {
      const dur = FALLBACK[phase];
      if (dur && localT >= dur) {
        if (phase === 'listen') enterPhase('translate');
        else if (phase === 'translate') enterPhase('speak');
        else if (phase === 'speak') advanceSegment();
      }
    }

    function frame(now) {
      if (!running) return;
      const seg = SCRIPT[segIndex];
      const localT = (now - phaseStart) / 1000;

      // translate phase is always a short timed pause
      if (phase === 'translate' && localT >= T_TRANSLATE) enterPhase('speak');
      if (!audioOK) fallbackAdvance(localT);

      // progress of the active text (audio progress when available, else timed)
      let asrP = 0, ttsP = 0;
      if (phase === 'listen') asrP = audioOK ? clipProgress : clamp01(localT / FALLBACK.listen);
      else if (phase === 'translate') asrP = 1;
      else if (phase === 'speak') { asrP = 1; ttsP = audioOK ? clipProgress : clamp01(localT / FALLBACK.speak); }
      else if (phase === 'done') { asrP = 1; ttsP = 1; }

      // HUD
      if (hud.srcLang) hud.srcLang.textContent = seg.srcLang;
      if (hud.tgtLang) hud.tgtLang.textContent = seg.tgtLang;
      const stages = ['vad'];
      if (phase === 'listen') stages.push('asr');
      if (phase === 'translate') stages.push('asr', 'mt');
      if (phase === 'speak') stages.push('mt', 'tts');
      litStages(phase === 'done' ? [] : stages);
      const tnow = now / 1000;
      if (hud.latency) hud.latency.textContent =
        String(180 + Math.floor(60 * Math.sin(tnow * 3) + 60 * rng())).padStart(3, '0');

      // clear + scene
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2;
      const pulse = 0.5 + 0.5 * Math.sin(tnow * 2.2);

      // real amplitude when a clip is playing, synthetic shimmer otherwise
      const amp = audioOK ? liveAmp() : 0;
      const srcAmp = phase === 'listen' ? (audioOK ? Math.max(amp, 0.06) : 0.5 + 0.5 * Math.sin(tnow * 9)) : 0.04;
      const tgtAmp = phase === 'speak' ? (audioOK ? Math.max(amp, 0.06) : 0.5 + 0.5 * Math.sin(tnow * 9 + 1)) : 0.04;

      const sideHalf = W * 0.20;
      drawWave(W * 0.22, cy, sideHalf, seg.color, srcAmp, tnow * 6);
      drawWave(W * 0.78, cy, sideHalf, seg.color, tgtAmp, tnow * 6 + 2);

      // device pulses harder with live loudness
      drawDevice(cx, cy, seg.color, clamp01(pulse * 0.6 + amp * 0.8));

      // texts under each wave
      drawTyped(seg.src, W * 0.22, cy + H * 0.22, W * 0.34, asrP, '#e9e7dd', true);
      if (phase === 'translate' || phase === 'speak' || phase === 'done')
        drawTyped(seg.tgt, W * 0.78, cy + H * 0.22, W * 0.34, phase === 'translate' ? 0.15 : ttsP, seg.color, false);

      // particles flow device → target during translate/speak
      if (phase === 'translate' || (phase === 'speak' && ttsP < 1)) {
        ctx.save();
        for (let p = 0; p < 14; p++) {
          const fp = ((tnow * 0.8 + p / 14) % 1);
          const x = lerp(cx, W * 0.78, easeInOut(fp));
          const y = cy + Math.sin(fp * TAU + p) * 10;
          ctx.globalAlpha = (1 - fp) * 0.8;
          ctx.fillStyle = seg.color;
          ctx.beginPath(); ctx.arc(x, y, 2.2, 0, TAU); ctx.fill();
        }
        ctx.restore();
      }

      if (phase === 'done') { running = false; drawReplay(cx, cy); return; }
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
      cancelAnimationFrame(raf);
      stopPlaying();               // kill any clip/timer still in flight from last run
      canvas.style.cursor = 'default';
      segIndex = 0; running = true;
      enterPhase('listen');
      raf = requestAnimationFrame(frame);
    }

    function renderStatic() {
      // reduced-motion: show a representative relay (first segment), no animation, no audio
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
      ensureAudio();
      if (actx && actx.state === 'suspended') actx.resume();
      // warm up the element→analyser graph so the first clip is wired
      if (audioOK) SCRIPT.forEach(s => { getClip(s.srcAudio); getClip(s.tgtAudio); });
      stopPlaying();
      segIndex = 0; running = true;
      enterPhase('listen');
      raf = requestAnimationFrame(frame);
    }

    window.addEventListener('resize', () => { if (W) resize(); });
    wireStart('interp-start', 'interp-hud', start);
  }


  /* ── expose internals to later-task engines via a page namespace ── */
  window.LDAHS_TECH = { mulberry32, prefersReduced, TAU, lerp, clamp01, easeInOut, wireStart, initInterpreter };

  /* ── boot ── */
  // The VR engine lives in technology-vr.js and self-registers + inits once
  // LDAHS_TECH exists. Here we only boot the interpreter demo.
  function boot() {
    if (window.LDAHS_TECH.initInterpreter) window.LDAHS_TECH.initInterpreter();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
