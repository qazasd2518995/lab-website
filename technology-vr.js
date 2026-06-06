/* ==============================================
   L-DAHS · Technology page — VR interactive demo
   Three.js scene with orbit-look, clickable objects, scripted tutor.
   Self-contained IIFE. Reads shared helpers from window.LDAHS_TECH.
   ============================================== */
(() => {
  'use strict';

  /* ── OrbitLook: a small self-contained orbit controller ──
     three.js r160 dropped the UMD examples/js build, and the ESM OrbitControls
     can't load via a plain <script>. We only need look-around + zoom with
     damping and angle/distance limits, so this covers it in ~50 lines, with no
     external dependency. Drag rotates the camera around `target`; wheel zooms. */
  function makeOrbitLook(camera, dom, target) {
    const state = {
      enabled: false, target,
      az: 0, pol: Math.PI * 0.46, rad: 6,      // spherical around target
      minPol: Math.PI * 0.25, maxPol: Math.PI * 0.62,
      minRad: 2.5, maxRad: 8,
      damp: 0.12, vAz: 0, vPol: 0,
      dragging: false, lastX: 0, lastY: 0,
      homeTarget: target.clone(), homeRad: 6,  // the look-around home view to return to
    };
    function apply() {
      const x = state.target.x + state.rad * Math.sin(state.pol) * Math.sin(state.az);
      const y = state.target.y + state.rad * Math.cos(state.pol);
      const z = state.target.z + state.rad * Math.sin(state.pol) * Math.cos(state.az);
      camera.position.set(x, y, z);
      camera.lookAt(state.target);
    }
    function onDown(e) {
      if (!state.enabled) return;
      state.dragging = true;
      state.lastX = e.clientX; state.lastY = e.clientY;
    }
    function onMove(e) {
      if (!state.enabled || !state.dragging) return;
      const dx = e.clientX - state.lastX, dy = e.clientY - state.lastY;
      state.lastX = e.clientX; state.lastY = e.clientY;
      state.vAz += -dx * 0.005;
      state.vPol += -dy * 0.005;
    }
    function onUp() { state.dragging = false; }
    function onWheel(e) {
      if (!state.enabled) return;
      e.preventDefault();
      state.rad = Math.min(state.maxRad, Math.max(state.minRad, state.rad + e.deltaY * 0.002));
    }
    dom.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    dom.addEventListener('wheel', onWheel, { passive: false });
    let focus = null;  // { fromT, toT, fromRad, toRad, start, dur }
    function update() {
      if (focus) {
        const k = Math.min(1, (performance.now() - focus.start) / focus.dur);
        const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        state.target.lerpVectors(focus.fromT, focus.toT, e);
        state.rad = focus.fromRad + (focus.toRad - focus.fromRad) * e;
        if (k >= 1) focus = null;
      } else {
        state.az += state.vAz; state.pol += state.vPol;
        state.vAz *= (1 - state.damp); state.vPol *= (1 - state.damp);
      }
      state.pol = Math.min(state.maxPol, Math.max(state.minPol, state.pol));
      apply();
    }
    function reset(az, pol, rad) {
      state.az = az; state.pol = pol; state.rad = rad; state.vAz = 0; state.vPol = 0; focus = null;
      state.homeTarget = state.target.clone(); state.homeRad = rad;   // remember this as home
      apply();
    }
    function focusOn(point, dur) {
      focus = { fromT: state.target.clone(), toT: point.clone(),
        fromRad: state.rad, toRad: 3.2, start: performance.now(), dur: dur || 900 };
    }
    function unfocus(dur) {
      focus = { fromT: state.target.clone(), toT: state.homeTarget.clone(),
        fromRad: state.rad, toRad: state.homeRad, start: performance.now(), dur: dur || 800 };
    }
    function isFocused() {
      // focused = target has drifted from home (an object was clicked)
      return state.target.distanceTo(state.homeTarget) > 0.05 || Math.abs(state.rad - state.homeRad) > 0.05;
    }
    return {
      update, reset, apply, focusOn, unfocus, isFocused,
      get target() { return state.target; },
      set enabled(v) { state.enabled = v; },
      get enabled() { return state.enabled; },
    };
  }

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
    const dlg = {
      box: document.getElementById('vr-dialog'),
      line: document.getElementById('vr-dialog-line'),
      opts: document.getElementById('vr-dialog-opts'),
      xpEl: document.getElementById('vr-xp'),
      back: document.getElementById('vr-back'),
    };
    let xp = 0;

    let renderer, scene, camera, tutor, grid, controls, raf = 0, running = false, t0 = 0;
    let W = 0, H = 0;
    let mode = 'interactive';   // 'interactive' | 'auto'
    const vr = {}; // holds propsGroup / cardsGroup / beamMat / hotspotGroup across scenes
    let curScene = -1;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let hovered = null;

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
      // clickable hotspots group (rebuilt per scene)
      const hotspotGroup = new THREE.Group(); scene.add(hotspotGroup);
      vr.propsGroup = propsGroup; vr.cardsGroup = cardsGroup; vr.beamMat = beamMat;
      vr.hotspotGroup = hotspotGroup;

      // free-look controller for interactive mode (around the tutor)
      controls = makeOrbitLook(camera, renderer.domElement, new THREE.Vector3(0, 1.5, 0));

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

    // interactive objects per scene: id, label, 3D position, the vocab it teaches,
    // plus a tutor line. Click a hotspot to focus and learn it.
    const INTERACTIVES = {
      'Café': [
        { id: 'cup', label: 'Coffee cup', pos: [-1.2, 0.85, -1.5],
          word: 'a flat white, please', zh: '一杯小白咖啡，謝謝', ja: 'カフェラテをください',
          tutor: 'Tap the cup, then order a flat white.',
          opts: [
            { text: 'A flat white, please.', reply: 'Great. Clear and polite.', xp: 10 },
            { text: 'Give me coffee.', reply: 'Understandable, though a please goes a long way.', xp: 4 },
          ] },
        { id: 'menu', label: 'Menu board', pos: [1.4, 1.6, -2.2],
          word: 'for here or to go?', zh: '內用還是外帶？', ja: 'こちらで召し上がりますか',
          tutor: 'The barista may ask: for here or to go?',
          opts: [
            { text: 'For here, thanks.', reply: 'Good. Now find a seat.', xp: 10 },
            { text: 'To go.', reply: 'Sure, they will use a paper cup.', xp: 8 },
          ] },
      ],
    };

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
      buildInteractives(s.name, s.color);
      if (vr.hotspotGroup) vr.hotspotGroup.visible = (mode === 'interactive');
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

    // build clickable hotspots (glowing node + ring) for a scene
    function buildInteractives(sceneName, colorHex) {
      const g = vr.hotspotGroup;
      while (g.children.length) g.remove(g.children[0]);
      (INTERACTIVES[sceneName] || []).forEach(item => {
        const node = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16),
          new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.9 }));
        node.position.set(item.pos[0], item.pos[1], item.pos[2]);
        const ringMat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
        const ring = new THREE.Mesh(new THREE.RingGeometry(0.18, 0.22, 24), ringMat);
        ring.position.copy(node.position);
        node.userData = { item, ring, ringMat, baseOpacity: 0.5 };
        g.add(node); g.add(ring);
      });
    }

    // ── pointer + raycast picking (interactive mode only) ──
    function updatePointer(e) {
      const r = canvas.getBoundingClientRect();
      pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    }
    function pickHotspot() {
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(vr.hotspotGroup.children, false);
      const hit = hits.find(h => h.object.userData && h.object.userData.item);
      return hit ? hit.object : null;
    }
    function onPointerMove(e) {
      if (mode !== 'interactive') return;
      updatePointer(e);
      hovered = pickHotspot();
      canvas.style.cursor = hovered ? 'pointer' : 'grab';
    }
    function onPointerDown(e) {
      if (mode !== 'interactive') return;
      updatePointer(e);
      const obj = pickHotspot();
      if (obj) onHotspotClick(obj.userData.item, obj);
    }
    function onHotspotClick(item, obj) {
      controls.focusOn(obj.position, 900);
      showObjectCard(item, obj);
      tutorSay(item);
      showDialog(item);
    }

    // a trilingual card (EN / 中 / 日) floating above the clicked object
    function makeTriCard(item, colorHex) {
      const c = document.createElement('canvas'); c.width = 640; c.height = 260;
      const cx = c.getContext('2d');
      cx.fillStyle = 'rgba(14,21,48,0.92)'; cx.fillRect(0, 0, 640, 260);
      cx.strokeStyle = '#' + colorHex.toString(16).padStart(6, '0'); cx.lineWidth = 4; cx.strokeRect(6, 6, 628, 248);
      cx.textAlign = 'center';
      cx.fillStyle = '#e9e7dd'; cx.font = '600 38px Fraunces, serif'; cx.fillText(item.word, 320, 70);
      cx.fillStyle = '#a9b2cc'; cx.font = '400 32px Spectral, serif'; cx.fillText(item.zh, 320, 140);
      cx.fillStyle = '#6b7596'; cx.font = '400 30px Spectral, serif'; cx.fillText(item.ja, 320, 205);
      const tex = new THREE.CanvasTexture(c); tex.needsUpdate = true; return tex;
    }
    function showObjectCard(item, obj) {
      const g = vr.cardsGroup;
      while (g.children.length) g.remove(g.children[0]);
      const spr = new THREE.Sprite(new THREE.SpriteMaterial({
        map: makeTriCard(item, SCENES[curScene].color), transparent: true, opacity: 0 }));
      spr.scale.set(2.2, 0.9, 1);
      spr.position.set(obj.position.x, obj.position.y + 0.8, obj.position.z);
      spr.userData = { fadeStart: performance.now() };
      g.add(spr);
    }
    function tutorSay(item) {
      if (item.tutor) typeCaption(item.tutor);
      vr._tutorTalkUntil = performance.now() + 1600;
    }

    // scripted dialog: show the tutor line + choice buttons; choosing scores XP
    function showDialog(item) {
      if (!dlg.box) return;
      dlg.box.hidden = false;
      dlg.line.textContent = item.tutor || item.label;
      dlg.opts.innerHTML = '';
      (item.opts || []).forEach(o => {
        const b = document.createElement('button');
        b.className = 'vr-opt'; b.type = 'button'; b.textContent = o.text;
        b.addEventListener('click', () => chooseOpt(o));
        dlg.opts.appendChild(b);
      });
    }
    function chooseOpt(o) {
      xp += o.xp;
      if (dlg.xpEl) dlg.xpEl.textContent = xp;
      dlg.line.textContent = o.reply;
      dlg.opts.innerHTML = '';
      typeCaption(o.reply);
      vr._tutorTalkUntil = performance.now() + 1600;
    }

    // return from a focused object to the look-around home view
    function backToRoom() {
      controls.unfocus(800);
      if (dlg.box) dlg.box.hidden = true;
      while (vr.cardsGroup.children.length) vr.cardsGroup.remove(vr.cardsGroup.children[0]);
      typeCaption('Tap another glowing object to keep learning.');
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

    // interactive mode: user drives the camera; orb keeps breathing
    function interactiveFrame(now) {
      if (!running) return;
      if (!t0) t0 = now;
      const t = (now - t0) / 1000;
      controls.update();
      // tutor breathes; ring pulses faster while the tutor is "talking"
      const talking = performance.now() < (vr._tutorTalkUntil || 0);
      tutor.userData.orb.scale.setScalar(1 + 0.06 * Math.sin(t * 2.2));
      tutor.userData.ring.scale.setScalar(1 + (talking ? 0.2 : 0.1) * Math.abs(Math.sin(t * (talking ? 7 : 3))));
      tutor.userData.ringMat.opacity = 0.45 + 0.25 * Math.abs(Math.sin(t * (talking ? 7 : 3)));
      tutor.rotation.y = t * 0.2;
      tutor.position.y = 1.5 + 0.05 * Math.sin(t * 1.5);
      // trilingual card fades in above the focused object
      vr.cardsGroup.children.forEach(spr => {
        const k = clamp01((now - (spr.userData.fadeStart || now)) / 400);
        spr.material.opacity = k;
      });
      // pulse hotspots; brighten the hovered one, and face the rings to the camera
      vr.hotspotGroup.children.forEach(o => {
        if (o.userData && o.userData.ringMat) {
          const isHover = hovered && hovered === o;
          o.userData.ringMat.opacity = o.userData.baseOpacity + 0.3 * Math.abs(Math.sin(t * 3)) + (isHover ? 0.3 : 0);
          o.userData.ring.lookAt(camera.position);
        }
      });
      if (hud.immersion) hud.immersion.textContent = (90 + Math.floor(8 * Math.abs(Math.sin(t)))) + '%';
      renderer.render(scene, camera);
      raf = requestAnimationFrame(interactiveFrame);
    }

    function start() {
      build();
      curScene = 0;
      applyScene(SCENES[0]);
      running = true; t0 = 0;
      setMode('interactive');
    }

    function setMode(m) {
      mode = m;
      cancelAnimationFrame(raf);
      t0 = 0;
      if (vr.hotspotGroup) vr.hotspotGroup.visible = (m === 'interactive');
      if (dlg.box) dlg.box.hidden = true;   // dialog appears only after clicking an object
      if (m === 'interactive') {
        controls.enabled = true;
        controls.reset(0, Math.PI * 0.46, 6);
        if (curScene < 0) { curScene = 0; applyScene(SCENES[0]); }
        // interactive mode reveals a card only when an object is clicked
        while (vr.cardsGroup.children.length) vr.cardsGroup.remove(vr.cardsGroup.children[0]);
        if (hud.scene) hud.scene.textContent = SCENES[curScene].name;
        typeCaption('Look around. Tap a glowing object to learn it.');
        if (prefersReduced) { renderer.render(scene, camera); return; }
        raf = requestAnimationFrame(interactiveFrame);
      } else {
        controls.enabled = false;
        curScene = -1;
        if (prefersReduced) { curScene = 0; applyScene(SCENES[0]); renderer.render(scene, camera); return; }
        raf = requestAnimationFrame(frame);
      }
    }

    window.addEventListener('resize', () => { if (renderer) size(); });
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerdown', onPointerDown);
    if (dlg.back) dlg.back.addEventListener('click', backToRoom);
    wireStart('vr-start', 'vr-hud', start);

    const modeBtn = document.getElementById('vr-mode-btn');
    if (modeBtn) modeBtn.addEventListener('click', () => {
      if (mode === 'interactive') { setMode('auto'); modeBtn.textContent = '✋ Explore'; }
      else { setMode('interactive'); modeBtn.textContent = '▶ Auto tour'; }
    });
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
