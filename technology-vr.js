/* ==============================================
   L-DAHS · Technology page — VR interactive demo
   Three.js scene with orbit-look, clickable objects, scripted tutor.
   Self-contained IIFE. Reads shared helpers from window.LDAHS_TECH.
   ============================================== */
(() => {
  'use strict';

  function initVR() {
    const T = window.LDAHS_TECH || {};
    const { lerp, clamp01, easeInOut, TAU, wireStart, prefersReduced } = T;
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

  // register + run after LDAHS_TECH exists (technology.js defines it)
  function register() {
    if (!window.LDAHS_TECH) return setTimeout(register, 0);
    window.LDAHS_TECH.initVR = initVR;
    initVR();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', register);
  else register();
})();
