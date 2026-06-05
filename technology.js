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

  /* ============================================================
     VR DEMO — Three.js, scene journey with an AI tutor orb
     ============================================================ */
  function initVR() {
    const canvas = document.getElementById('vr-canvas');
    if (!canvas) return;
    if (typeof THREE === 'undefined') { console.warn('[tech] THREE not loaded'); return; }

    const hud = {
      scene: document.getElementById('vr-scene-name'),
      caption: document.getElementById('vr-caption'),
      dots: document.getElementById('vr-dots'),
      immersion: document.getElementById('vr-immersion'),
    };

    let renderer, scene, camera, tutor, grid, raf = 0, running = false, t0 = 0;
    let W = 0, H = 0;
    const vr = {}; // holds propsGroup / cardsGroup / beamMat across scenes
    let curScene = -1;

    function size() {
      const r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      if (!W || !H) return;
      renderer.setSize(W, H, false);
      camera.aspect = W / H; camera.updateProjectionMatrix();
    }

    function build() {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x070b16, 0.06);
      camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
      camera.position.set(0, 1.4, 6);

      scene.add(new THREE.AmbientLight(0x4455aa, 0.6));
      const key = new THREE.PointLight(0x7c8cff, 40, 30); key.position.set(2, 4, 3); scene.add(key);

      // perspective floor grid (shared across scenes, recolored per scene)
      grid = new THREE.GridHelper(40, 40, 0x34e3cf, 0x1b2550);
      grid.material.transparent = true; grid.material.opacity = 0.35;
      scene.add(grid);

      // AI tutor: breathing energy orb with a "mouth" ring that pulses while speaking
      const orbGeo = new THREE.IcosahedronGeometry(0.6, 3);
      const orbMat = new THREE.MeshStandardMaterial({
        color: 0x34e3cf, emissive: 0x0e6b63, metalness: 0.3, roughness: 0.2,
        wireframe: false, transparent: true, opacity: 0.92,
      });
      tutor = new THREE.Group();
      const orb = new THREE.Mesh(orbGeo, orbMat); tutor.add(orb);
      const ringGeo = new THREE.TorusGeometry(0.85, 0.02, 8, 64);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x34e3cf, transparent: true, opacity: 0.6 });
      const ring = new THREE.Mesh(ringGeo, ringMat); ring.rotation.x = Math.PI / 2; tutor.add(ring);
      tutor.userData = { orb, orbMat, ring, ringMat };
      tutor.position.set(0, 1.5, 0);
      scene.add(tutor);

      // swappable props group (rebuilt per scene)
      const propsGroup = new THREE.Group(); scene.add(propsGroup);
      // floating vocabulary cards group
      const cardsGroup = new THREE.Group(); scene.add(cardsGroup);
      // transition light-beam plane (flashes between scenes)
      const beamMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
      const beam = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), beamMat);
      beam.position.set(0, 1.5, 2.5);
      scene.add(beam);
      vr.propsGroup = propsGroup; vr.cardsGroup = cardsGroup; vr.beamMat = beamMat;

      size();
    }

    // parameterized scenes — edit freely to change demo content later.
    // color = accent for grid/orb/cards; emissive = dimmed glow so the orb
    // does not blow out against dark scenes; props/words drive the 3D content.
    const SCENES = [
      { name: 'Café', color: 0x34e3cf, emissive: 0x0e6b63, caption: 'Order a coffee in English.',
        props: 'tables', words: ['a flat white, please', 'for here or to go?'], bg: 'images/vr-cafe.jpg' },
      { name: 'Airport', color: 0x7c8cff, emissive: 0x2a3270, caption: 'Check in for your flight.',
        props: 'counter', words: ['window seat', 'boarding pass'], bg: 'images/vr-airport.jpg' },
      { name: 'Meeting', color: 0xffb74d, emissive: 0x6b4d12, caption: 'Introduce yourself professionally.',
        props: 'screen', words: ['pleased to meet you', 'I lead the data team'], bg: 'images/vr-meeting.jpg' },
    ];
    const SCENE_SECS = 13;          // seconds per scene
    const TOTAL = SCENE_SECS * SCENES.length;

    // lazy texture cache for scene backdrops; falls back to plain fog colour
    const bgCache = {};
    const bgLoader = new THREE.TextureLoader();
    function setSceneBackground(url) {
      if (!url) { scene.background = null; return; }
      if (bgCache[url]) { scene.background = bgCache[url]; return; }
      bgLoader.load(url, tex => {
        if (tex.colorSpace !== undefined) tex.colorSpace = THREE.SRGBColorSpace;
        bgCache[url] = tex;
        // only apply if this scene is still the current one
        if (SCENES[curScene] && SCENES[curScene].bg === url) scene.background = tex;
      }, undefined, () => { /* missing image: keep fog backdrop, demo still works */ });
    }

    function applyScene(s) {
      if (hud.scene) hud.scene.textContent = s.name;
      setSceneBackground(s.bg);
      grid.material.color.setHex(s.color);
      tutor.userData.orbMat.color.setHex(s.color);
      tutor.userData.orbMat.emissive.setHex(s.emissive);
      tutor.userData.ringMat.color.setHex(s.color);
      buildProps(s.props, s.color);
      buildCards(s.words, s.color);
      typeCaption(s.caption);
    }

    // build low-poly props for a scene into vr.propsGroup
    function buildProps(kind, colorHex) {
      const g = vr.propsGroup;
      while (g.children.length) g.remove(g.children[0]);
      const mat = new THREE.MeshStandardMaterial({ color: colorHex, emissive: colorHex,
        emissiveIntensity: 0.15, metalness: 0.2, roughness: 0.6, transparent: true, opacity: 0.9 });
      const line = new THREE.MeshBasicMaterial({ color: colorHex, wireframe: true, transparent: true, opacity: 0.35 });
      if (kind === 'tables') {
        for (let i = 0; i < 4; i++) {
          const top = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.08, 12), mat);
          top.position.set(-3 + i * 2, 0.7, -3 - (i % 2)); g.add(top);
          const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.7, 0.08), mat);
          leg.position.set(top.position.x, 0.35, top.position.z); g.add(leg);
        }
      } else if (kind === 'counter') {
        const c = new THREE.Mesh(new THREE.BoxGeometry(5, 1, 1), mat);
        c.position.set(0, 0.5, -3.5); g.add(c);
        const board = new THREE.Mesh(new THREE.PlaneGeometry(4, 1.2), line);
        board.position.set(0, 3, -5); g.add(board);
      } else if (kind === 'screen') {
        const table = new THREE.Mesh(new THREE.BoxGeometry(5, 0.15, 1.6), mat);
        table.position.set(0, 0.75, -2); g.add(table);
        const screen = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.9), line);
        screen.position.set(0, 2.4, -5); g.add(screen);
      }
    }

    // build floating vocab cards as canvas-texture sprites
    function makeCardTexture(text, colorHex) {
      const c = document.createElement('canvas'); c.width = 512; c.height = 160;
      const cx = c.getContext('2d');
      cx.fillStyle = 'rgba(14,21,48,0.85)'; cx.fillRect(0, 0, 512, 160);
      cx.strokeStyle = '#' + colorHex.toString(16).padStart(6, '0');
      cx.lineWidth = 4; cx.strokeRect(6, 6, 500, 148);
      cx.fillStyle = '#e9e7dd'; cx.font = '600 40px Spectral, serif';
      cx.textAlign = 'center'; cx.textBaseline = 'middle';
      cx.fillText(text, 256, 84);
      const tex = new THREE.CanvasTexture(c); tex.needsUpdate = true; return tex;
    }
    function buildCards(words, colorHex) {
      const g = vr.cardsGroup;
      while (g.children.length) g.remove(g.children[0]);
      words.forEach((w, i) => {
        const spr = new THREE.Sprite(new THREE.SpriteMaterial({
          map: makeCardTexture(w, colorHex), transparent: true, opacity: 0.95 }));
        spr.scale.set(1.6, 0.5, 1);
        spr.position.set(i === 0 ? -1.7 : 1.7, 1.9 - i * 0.2, 0.5);
        spr.userData = { baseY: spr.position.y, ph: i * 1.7 };
        g.add(spr);
      });
    }

    // typewriter for the HUD caption
    let typeTimer = 0;
    function typeCaption(text) {
      if (!hud.caption) return;
      clearInterval(typeTimer);
      hud.caption.textContent = '';
      let i = 0;
      typeTimer = setInterval(() => {
        hud.caption.textContent = text.slice(0, ++i);
        if (i >= text.length) clearInterval(typeTimer);
      }, 38);
    }

    function setDots(active, total) {
      if (!hud.dots) return;
      hud.dots.innerHTML = '';
      for (let i = 0; i < total; i++) {
        const el = document.createElement('i');
        if (i === active) el.className = 'on';
        hud.dots.appendChild(el);
      }
    }

    function frame(now) {
      if (!running) return;
      if (!t0) t0 = now;
      const t = (now - t0) / 1000;
      const done = t >= TOTAL;

      // scene switching
      const idx = Math.min(Math.floor(t / SCENE_SECS), SCENES.length - 1);
      if (idx !== curScene) { curScene = idx; setDots(idx, SCENES.length); applyScene(SCENES[idx]); }
      const localT = t - idx * SCENE_SECS;

      // light-beam transition flash near the start of each scene (except the first)
      let beamA = 0;
      if (idx > 0 && localT < 1.0) beamA = Math.sin(Math.PI * localT) * 0.9;
      vr.beamMat.opacity = beamA;

      // breathing orb; ring pulses faster in the first seconds of a scene (tutor "talks")
      const talk = localT < 4 ? Math.abs(Math.sin(t * 7)) : Math.abs(Math.sin(t * 3));
      tutor.userData.orb.scale.setScalar(1 + 0.06 * Math.sin(t * 2.2));
      tutor.userData.ring.scale.setScalar(1 + 0.18 * talk);
      tutor.userData.ringMat.opacity = 0.4 + 0.4 * talk;
      tutor.rotation.y = t * 0.4;
      tutor.position.y = 1.5 + 0.05 * Math.sin(t * 1.5);

      // floating cards bob
      vr.cardsGroup.children.forEach(spr => {
        spr.position.y = spr.userData.baseY + 0.08 * Math.sin(t * 1.6 + spr.userData.ph);
        spr.material.rotation = 0.04 * Math.sin(t + spr.userData.ph);
      });

      // camera: gentle dolly within a scene, plus a small lateral orbit
      camera.position.x = Math.sin(t * 0.15) * 0.8;
      camera.position.z = done ? lerp(camera.position.z, 9, 0.05) : lerp(6, 4.4, easeInOut(clamp01(localT / 5)));
      camera.position.y = 1.4;
      camera.lookAt(0, 1.5, 0);

      if (hud.immersion) hud.immersion.textContent = (90 + Math.floor(8 * Math.abs(Math.sin(t)))) + '%';

      // ending: collapse the journey into the manifold caption, keep the orb breathing
      if (done) {
        if (hud.scene) hud.scene.textContent = 'Manifold';
        if (hud.caption && hud.caption.textContent !== 'One manifold. Many worlds.')
          typeCaption('One manifold. Many worlds.');
        vr.beamMat.opacity = 0;
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    }

    function start() {
      build();
      if (prefersReduced) { curScene = 0; applyScene(SCENES[0]); renderer.render(scene, camera); return; }
      curScene = -1;
      running = true; t0 = 0; raf = requestAnimationFrame(frame);
    }

    window.addEventListener('resize', () => { if (renderer) size(); });
    wireStart('vr-start', 'vr-hud', start);
  }

  /* ── expose internals to later-task engines via a page namespace ── */
  window.LDAHS_TECH = { mulberry32, prefersReduced, TAU, lerp, clamp01, easeInOut, wireStart, initInterpreter, initVR };

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
