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
      cancelAnimationFrame(raf);
      canvas.style.cursor = 'default';
      t0 = 0; running = true; raf = requestAnimationFrame(frame);
    }

    function renderStatic() {
      // reduced-motion: show a representative relay (first segment), no animation
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
        props: 'tables', words: ['a flat white, please', 'for here or to go?'] },
      { name: 'Airport', color: 0x7c8cff, emissive: 0x2a3270, caption: 'Check in for your flight.',
        props: 'counter', words: ['window seat', 'boarding pass'] },
      { name: 'Meeting', color: 0xffb74d, emissive: 0x6b4d12, caption: 'Introduce yourself professionally.',
        props: 'screen', words: ['pleased to meet you', 'I lead the data team'] },
    ];
    const SCENE_SECS = 13;          // seconds per scene
    const TOTAL = SCENE_SECS * SCENES.length;

    function applyScene(s) {
      if (hud.scene) hud.scene.textContent = s.name;
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
