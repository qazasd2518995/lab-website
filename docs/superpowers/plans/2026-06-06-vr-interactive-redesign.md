# VR 互動體驗重做 — 實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 technology.html §01 的 VR demo 從「自動播放 cinematic」重做成「可拖曳環視、可點擊物件、有導師劇本對話」的互動體驗，並保留自動導覽當切換模式。

**Architecture:** VR 引擎從 technology.js 抽到獨立的 technology-vr.js（technology.js 已 660+ 行）。新增 OrbitControls（CDN）做環視、Raycaster 做點擊偵測。場景物件參數化（每物件含位置/幾何/多國語內容/導師台詞/對話選項）。互動為預設模式，自動導覽保留為可切換模式。純前端、無後端、無 AI、無麥克風。

**Tech Stack:** Three.js r160（已有）、OrbitControls（three CDN）、Raycaster（內建）、Canvas 2D 貼圖、HTML/CSS HUD 疊層。

**驗證方式：** 無測試框架（純靜態站）。每個 Task 用 `node -e "new Function(fs.readFileSync('technology-vr.js'))"` 做語法檢查 + 瀏覽器目視/JS 探針驗證。本機 `python3 -m http.server 8000`，gstack headless browse（`~/.claude/skills/gstack/browse/dist/browse`）做截圖與 JS 注入驗證（不靠 Chrome 擴充）。每 Task 完成 commit。

**色彩/字體常數（沿用，勿自創）：** 背景 `#070b16`；accent 青 `#34e3cf`、橘 `#ffb74d`、粉 `#ff5d8f`、靛 `#7c8cff`；文字 `#e9e7dd`/`#a9b2cc`/`#6b7596`；字體 Fraunces/Spectral/JetBrains Mono。

**文案風格約束：** 英文文案不用 em dash、省略號、rule-of-three、not X but Y。

---

## 階段一 · 互動骨架（Task 1-5）

### Task 1: 把 VR 引擎抽到 technology-vr.js（純搬移，行為不變）

**Files:**
- Create: `technology-vr.js`
- Modify: `technology.js`（移除 initVR，調整 boot）
- Modify: `technology.html`（加載 technology-vr.js）

把現有 `initVR` 整個函式搬到新檔，行為完全不變（純重構，先確保搬移後 VR demo 跟現在一模一樣）。

- [ ] **Step 1: 建立 technology-vr.js，把 initVR 搬過去**

建立 `technology-vr.js`，一個獨立 IIFE。從 technology.js 複製整個 `initVR` 函式 body。共用工具改從 `window.LDAHS_TECH` 取得。骨架：

```javascript
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
    // ===== PASTE the existing initVR body here verbatim from technology.js =====
    // (everything from `const canvas = document.getElementById('vr-canvas');`
    //  to the end of the function, before its closing `}`)
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
```

注意：initVR body 內只依賴 lerp/clamp01/easeInOut/TAU/wireStart/prefersReduced（不用 mulberry32），這些從 `T` 解構。`T` 的解構要放在 initVR 內部第一行（register 時 LDAHS_TECH 已存在）。

- [ ] **Step 2: 從 technology.js 移除 initVR 並調整 boot**

在 technology.js：
1. 刪除整個 `function initVR() { ... }`。
2. 把 `window.LDAHS_TECH = { ..., initInterpreter, initVR };` 改為移除 initVR：`window.LDAHS_TECH = { mulberry32, prefersReduced, TAU, lerp, clamp01, easeInOut, wireStart, initInterpreter };`
3. boot() 中移除 `if (window.LDAHS_TECH.initVR) window.LDAHS_TECH.initVR();`（VR 改由 technology-vr.js 自己 init），只留 `if (window.LDAHS_TECH.initInterpreter) window.LDAHS_TECH.initInterpreter();`。

- [ ] **Step 3: technology.html 加載 technology-vr.js**

在 `<script defer src="technology.js"></script>` 之後加入：
```html
  <script defer src="technology-vr.js"></script>
```
（兩個都 defer，順序不影響，因為 technology-vr.js 的 register() 會等 LDAHS_TECH 出現。three.min.js 已在 head defer 先載。）

- [ ] **Step 4: 語法檢查 + 瀏覽器驗證行為不變**

Run: `cd "/Users/justin/lab website" && node -e "new Function(require('fs').readFileSync('technology-vr.js','utf8')); console.log('VR_OK')" && node -e "new Function(require('fs').readFileSync('technology.js','utf8')); console.log('MAIN_OK')"`
Expected: VR_OK + MAIN_OK。
起 server，gstack browse 開 technology.html，點 VR Start，確認三幕自動播放跟搬移前一模一樣（能量球、場景、背景圖、字幕、§01 三幕切換），console 無錯。口譯 demo 也要確認沒被影響。

- [ ] **Step 5: Commit**

```bash
cd "/Users/justin/lab website"
git add technology.html technology.js technology-vr.js
git commit -m "Extract VR engine into technology-vr.js (no behavior change)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task 2: 載入 OrbitControls 並加入「互動 / 自動導覽」模式切換

**Files:**
- Modify: `technology.html`（加 OrbitControls CDN）
- Modify: `technology-vr.js`（mode 狀態 + OrbitControls + 互動 render loop）
- Modify: `styles.css`（模式按鈕樣式）

- [ ] **Step 1: technology.html 加 OrbitControls CDN**

在 three.min.js 那行之後加入：
```html
  <script defer src="https://cdn.jsdelivr.net/npm/three@0.160.0/examples/js/controls/OrbitControls.js"></script>
```
驗證可達：`curl -s -o /dev/null -w "%{http_code}\n" https://cdn.jsdelivr.net/npm/three@0.160.0/examples/js/controls/OrbitControls.js` 應為 200。若非 200，回報 BLOCKED（不要自換來源）。UMD build 會把它掛到 `THREE.OrbitControls`。注意 OrbitControls 也是 defer，與 three.min.js 同為 head defer，會在 three 之後載入。

- [ ] **Step 2: initVR 頂部加 mode/controls 宣告**

把 initVR 內 `let renderer, scene, camera, tutor, grid, raf = 0, running = false, t0 = 0;` 改為：
```javascript
    let renderer, scene, camera, tutor, grid, controls, raf = 0, running = false, t0 = 0;
    let mode = 'interactive';   // 'interactive' | 'auto'
```

- [ ] **Step 3: build() 末端初始化 OrbitControls**

在 build() 的 `size();` 之前加入：
```javascript
      // orbit controls for free-look (enabled only in interactive mode)
      controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true; controls.dampingFactor = 0.08;
      controls.enablePan = false;
      controls.minDistance = 2.5; controls.maxDistance = 8;
      controls.minPolarAngle = Math.PI * 0.25; controls.maxPolarAngle = Math.PI * 0.62;
      controls.target.set(0, 1.5, 0);
      controls.enabled = false;
```

- [ ] **Step 4: 加互動模式 render loop**

在 `frame` 函式之後加入 `interactiveFrame`：
```javascript
    function interactiveFrame(now) {
      if (!running) return;
      if (!t0) t0 = now;
      const t = (now - t0) / 1000;
      controls.update();
      tutor.userData.orb.scale.setScalar(1 + 0.06 * Math.sin(t * 2.2));
      tutor.userData.ring.scale.setScalar(1 + 0.1 * Math.abs(Math.sin(t * 3)));
      tutor.rotation.y = t * 0.2;
      tutor.position.y = 1.5 + 0.05 * Math.sin(t * 1.5);
      if (hud.immersion) hud.immersion.textContent = (90 + Math.floor(8 * Math.abs(Math.sin(t)))) + '%';
      renderer.render(scene, camera);
      raf = requestAnimationFrame(interactiveFrame);
    }
```

- [ ] **Step 5: 改 start()，加 setMode()**

把 `start()` 改為：
```javascript
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
      if (m === 'interactive') {
        controls.enabled = true;
        controls.target.set(0, 1.5, 0);
        camera.position.set(0, 1.5, 6);
        if (prefersReduced) { renderer.render(scene, camera); return; }
        raf = requestAnimationFrame(interactiveFrame);
      } else {
        controls.enabled = false;
        curScene = -1;
        if (prefersReduced) { curScene = 0; applyScene(SCENES[0]); renderer.render(scene, camera); return; }
        raf = requestAnimationFrame(frame);
      }
    }
```
（移除舊 start() 裡的 prefersReduced/curScene/running 那幾行，統一由 setMode 處理。）

- [ ] **Step 6: technology.html HUD 加模式按鈕 + styles.css 樣式**

在 `#vr-hud` 內加入：
```html
            <button class="hud-mode-btn" id="vr-mode-btn" type="button">▶ Auto tour</button>
```
styles.css TECHNOLOGY PAGE 區段加入：
```css
.hud-mode-btn { position: absolute; right: 16px; bottom: 14px; pointer-events: auto;
  font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--ink);
  background: rgba(124,140,255,0.15); border: 1px solid rgba(124,140,255,0.5);
  border-radius: 999px; padding: 6px 12px; cursor: pointer; }
.hud-mode-btn:hover { background: rgba(124,140,255,0.28); }
```

- [ ] **Step 7: initVR 末端綁定模式按鈕**

在 `wireStart('vr-start', 'vr-hud', start);` 之後加入：
```javascript
    const modeBtn = document.getElementById('vr-mode-btn');
    if (modeBtn) modeBtn.addEventListener('click', () => {
      if (mode === 'interactive') { setMode('auto'); modeBtn.textContent = '✋ Explore'; }
      else { setMode('interactive'); modeBtn.textContent = '▶ Auto tour'; }
    });
```

- [ ] **Step 8: 語法檢查 + 瀏覽器驗證**

語法檢查兩檔。瀏覽器：點 VR Start → 預設互動模式，滑鼠拖曳能 360° 環視（受俯仰/距離限制）、能量球持續呼吸。點「▶ Auto tour」→ 切回自動三幕播放、按鈕變「✋ Explore」。再點 → 回互動。console 無錯。

- [ ] **Step 9: Commit**

```bash
cd "/Users/justin/lab website"
git add technology.html technology.js technology-vr.js styles.css
git commit -m "Add orbit-look interactive mode with auto-tour toggle to VR demo

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task 3: 場景物件參數化 + Raycaster 點擊偵測

**Files:**
- Modify: `technology-vr.js`

- [ ] **Step 1: 定義 INTERACTIVES（先做 Café）**

在 initVR 內、SCENES 之後加入：
```javascript
    // interactive objects per scene: id, label, 3D position, the vocab it teaches
    const INTERACTIVES = {
      'Café': [
        { id: 'cup', label: 'Coffee cup', pos: [-1.2, 0.85, -1.5],
          word: 'a flat white, please', zh: '一杯小白咖啡，謝謝', ja: 'カフェラテをください',
          tutor: 'Tap the cup, then order a flat white.' },
        { id: 'menu', label: 'Menu board', pos: [1.4, 1.6, -2.2],
          word: 'for here or to go?', zh: '內用還是外帶？', ja: 'こちらで召し上がりますか',
          tutor: 'The barista may ask: for here or to go?' },
      ],
    };
```

- [ ] **Step 2: build() 加 hotspotGroup；加 buildInteractives()**

build() 內，在 `vr.propsGroup = ...` 那段附近加入：
```javascript
      const hotspotGroup = new THREE.Group(); scene.add(hotspotGroup);
      vr.hotspotGroup = hotspotGroup;
```
在 buildCards 之後加入：
```javascript
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
```
在 applyScene 末端加入：`buildInteractives(s.name, s.color);`

- [ ] **Step 3: 加 Raycaster + pointer 事件**

initVR 頂部（mode 宣告附近）加入：
```javascript
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let hovered = null;
```
加處理函式（buildInteractives 附近）：
```javascript
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
      // expanded in Task 4 (focus + card + tutor). For now: pulse the ring.
      obj.userData.ring.scale.setScalar(1.6);
    }
```
initVR 末端綁定：
```javascript
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerdown', onPointerDown);
```

- [ ] **Step 4: interactiveFrame 加 hotspot 脈動 + hover 高亮**

在 interactiveFrame 的 `renderer.render` 之前加入：
```javascript
      vr.hotspotGroup.children.forEach(o => {
        if (o.userData && o.userData.ringMat) {
          const isHover = hovered && hovered === o;
          o.userData.ringMat.opacity = o.userData.baseOpacity + 0.3 * Math.abs(Math.sin(t * 3)) + (isHover ? 0.3 : 0);
        }
      });
```

- [ ] **Step 5: 語法檢查 + 瀏覽器驗證**

語法檢查。瀏覽器：互動模式 Café 場景出現 2 個發光提示環（咖啡杯、菜單），滑鼠移上去游標變 pointer + 環變亮，點下去環放大（暫時行為）。拖曳環視時環跟著場景。console 無錯。用 JS 探針注入 pointerdown 於 hotspot 螢幕座標，驗證 onHotspotClick 被觸發。

- [ ] **Step 6: Commit**

```bash
cd "/Users/justin/lab website"
git add technology-vr.js
git commit -m "Add parameterized interactive hotspots with raycaster picking

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task 4: 點擊物件 → 相機聚焦 + 浮三語卡 + 導師轉向

**Files:**
- Modify: `technology-vr.js`

- [ ] **Step 1: onHotspotClick 實作相機聚焦 tween**

initVR 加 `let focusTween = null;`。把 onHotspotClick 改為：
```javascript
    function onHotspotClick(item, obj) {
      const p = obj.position;
      const camTo = new THREE.Vector3(p.x * 0.5, p.y + 0.4, p.z + 2.2);
      focusTween = { fromT: controls.target.clone(), toT: p.clone(),
        fromP: camera.position.clone(), toP: camTo, start: performance.now(), dur: 900 };
      showObjectCard(item, obj);
      tutorSay(item);
    }
```
interactiveFrame 的 `controls.update()` 之前處理 tween：
```javascript
      if (focusTween) {
        const k = clamp01((now - focusTween.start) / focusTween.dur);
        const e = easeInOut(k);
        controls.target.lerpVectors(focusTween.fromT, focusTween.toT, e);
        camera.position.lerpVectors(focusTween.fromP, focusTween.toP, e);
        if (k >= 1) focusTween = null;
      }
```

- [ ] **Step 2: 三語卡 showObjectCard + makeTriCard**

在 makeCardTexture 附近加入：
```javascript
    function makeTriCard(item, colorHex) {
      const c = document.createElement('canvas'); c.width = 640; c.height = 260;
      const cx = c.getContext('2d');
      cx.fillStyle = 'rgba(14,21,48,0.92)'; cx.fillRect(0,0,640,260);
      cx.strokeStyle = '#' + colorHex.toString(16).padStart(6,'0'); cx.lineWidth = 4; cx.strokeRect(6,6,628,248);
      cx.textAlign = 'center';
      cx.fillStyle = '#e9e7dd'; cx.font = '600 38px Fraunces, serif'; cx.fillText(item.word, 320, 70);
      cx.fillStyle = '#a9b2cc'; cx.font = '400 32px Spectral, serif'; cx.fillText(item.zh, 320, 140);
      cx.fillStyle = '#6b7596'; cx.font = '400 30px Spectral, serif'; cx.fillText(item.ja, 320, 205);
      const tex = new THREE.CanvasTexture(c); tex.needsUpdate = true; return tex;
    }
    function showObjectCard(item, obj) {
      const g = vr.cardsGroup;
      while (g.children.length) g.remove(g.children[0]);
      const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeTriCard(item, SCENES[curScene].color), transparent: true, opacity: 0 }));
      spr.scale.set(2.2, 0.9, 1);
      spr.position.set(obj.position.x, obj.position.y + 0.8, obj.position.z);
      spr.userData = { fadeStart: performance.now() };
      g.add(spr);
    }
```
interactiveFrame 加卡片淡入（取代/補上 cardsGroup 處理）：
```javascript
      vr.cardsGroup.children.forEach(spr => {
        const k = clamp01((now - (spr.userData.fadeStart || now)) / 400);
        spr.material.opacity = k;
      });
```

- [ ] **Step 3: tutorSay + 導師說話脈動**

加入：
```javascript
    function tutorSay(item) {
      if (item.tutor) typeCaption(item.tutor);
      vr._tutorTalkUntil = performance.now() + 1600;
    }
```
interactiveFrame 的 orb/ring 脈動處改為：說話時 ring 脈動更快：
```javascript
      const talking = performance.now() < (vr._tutorTalkUntil || 0);
      tutor.userData.ring.scale.setScalar(1 + (talking ? 0.2 : 0.1) * Math.abs(Math.sin(t * (talking ? 7 : 3))));
```

- [ ] **Step 4: 語法檢查 + 瀏覽器驗證**

語法檢查。瀏覽器：互動模式點咖啡杯 → 相機平滑聚焦 + 上方浮三語卡（英/中/日）淡入 + HUD 字幕顯示導師台詞 + 能量球加速脈動。點菜單 → 換內容。拖曳仍可環視。console 無錯。

- [ ] **Step 5: Commit**

```bash
cd "/Users/justin/lab website"
git add technology-vr.js
git commit -m "Click hotspot to focus camera and reveal trilingual card with tutor line

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task 5: 導師對話框 + 選項按鈕 + 計分（HTML/CSS 疊層）

**Files:**
- Modify: `technology.html`（對話框 DOM）
- Modify: `styles.css`（對話框樣式）
- Modify: `technology-vr.js`（對話狀態機）

- [ ] **Step 1: technology.html 加對話框疊層**

在 `#vr-hud` 內加入：
```html
            <div class="vr-dialog" id="vr-dialog" hidden>
              <div class="vr-dialog-line" id="vr-dialog-line"></div>
              <div class="vr-dialog-opts" id="vr-dialog-opts"></div>
              <div class="vr-score mono">XP <b id="vr-xp">0</b></div>
            </div>
```

- [ ] **Step 2: styles.css 加對話框樣式**

```css
.vr-dialog { position: absolute; left: 16px; bottom: 16px; width: min(360px, 42%);
  pointer-events: auto; background: rgba(11,17,36,0.82); border: 1px solid rgba(124,140,255,0.4);
  border-radius: 14px; padding: 14px 16px; backdrop-filter: blur(6px); }
.vr-dialog[hidden] { display: none; }
.vr-dialog-line { font-family: 'Spectral', serif; font-size: 15px; color: var(--ink); margin-bottom: 10px; line-height: 1.5; }
.vr-dialog-opts { display: flex; flex-direction: column; gap: 8px; }
.vr-opt { text-align: left; font-family: 'Spectral', serif; font-size: 14px; color: var(--ink);
  background: rgba(124,140,255,0.12); border: 1px solid rgba(124,140,255,0.35); border-radius: 8px;
  padding: 8px 12px; cursor: pointer; transition: background .15s; }
.vr-opt:hover { background: rgba(124,140,255,0.26); }
.vr-score { margin-top: 10px; font-size: 11px; color: var(--ink-faint); }
.vr-score b { color: var(--d1); }
```

- [ ] **Step 3: INTERACTIVES 加 opts；實作對話狀態機**

更新 Café 的兩個 item，補 opts。cup：
```javascript
          opts: [
            { text: 'A flat white, please.', reply: 'Great. Clear and polite.', xp: 10 },
            { text: 'Give me coffee.', reply: 'Understandable, though a please goes a long way.', xp: 4 },
          ]
```
menu：
```javascript
          opts: [
            { text: 'For here, thanks.', reply: 'Good. Now find a seat.', xp: 10 },
            { text: 'To go.', reply: 'Sure, they will use a paper cup.', xp: 8 },
          ]
```
technology-vr.js 加對話系統（initVR 內）：
```javascript
    const dlg = { box: document.getElementById('vr-dialog'), line: document.getElementById('vr-dialog-line'),
      opts: document.getElementById('vr-dialog-opts'), xpEl: document.getElementById('vr-xp') };
    let xp = 0;
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
      xp += o.xp; if (dlg.xpEl) dlg.xpEl.textContent = xp;
      dlg.line.textContent = o.reply;
      dlg.opts.innerHTML = '';
      typeCaption(o.reply);
      vr._tutorTalkUntil = performance.now() + 1600;
    }
```
onHotspotClick 末端加 `showDialog(item);`。

- [ ] **Step 4: 語法檢查 + 瀏覽器驗證**

語法檢查。瀏覽器：點咖啡杯 → 左下對話框出現導師台詞 + 2 選項。點選項 → 顯示回應、XP 增加、導師說話。點別物件 → 換對話。切到自動導覽時對話框應隱藏（在 setMode('auto') 加 `if (dlg.box) dlg.box.hidden = true;`）。console 無錯。

- [ ] **Step 5: Commit**

```bash
cd "/Users/justin/lab website"
git add technology.html styles.css technology-vr.js
git commit -m "Add scripted tutor dialog with choice options and XP scoring

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

**階段一完成檢查點：** 互動模式可拖曳環視、點物件聚焦+浮三語卡+導師台詞、對話框選項+計分、可切自動導覽。此時請使用者試玩確認方向，再進階段二/三/四。

---

## 階段二 · 學習互動深化（Task 6-7，細節做到時補齊）

### Task 6: 發音回饋環動畫 + 物件完成狀態
點選項後，物件提示環播放「評分填充」動畫（綠=高分/黃=中），物件標記為已完成（環變勾選色）。HUD 發音評分條動畫。

### Task 7: 場景內多物件對話串接
導師引導順序（點完 cup 引導去點 menu），場景全物件完成顯示小結 + 總 XP。

---

## 階段三 · 視覺升級（Task 8-11，細節做到時補齊）

### Task 8: 粒子系統 + 動態燈光
漂浮光點/塵埃粒子（THREE.Points），導師移動聚光，物件 hover 光暈。

### Task 9: HUD 技術數據層
中央準星、發音評分條、語意雷達（裝飾）、座標/FPS/注視物件名（mono 科技感）。

### Task 10: 控制器/光線視覺
raycaster 視覺化成一道光線，命中物件閃光；可選低多邊形控制器。

### Task 11: 實拍背景融入
背景圖色調統一、地面倒影/邊緣暈影、霧色與背景一致。

---

## 階段四 · 選場景/語言 + 打磨（Task 12-13，細節做到時補齊）

### Task 12: 場景/語言切換 UI + 其餘場景的 INTERACTIVES
HUD 場景選擇器（Café/Airport/Meeting）+ 語言選擇器；補 Airport/Meeting 的互動物件與對話。

### Task 13: RWD + 觸控 + 整頁打磨
觸控拖曳環視、行動裝置 HUD 排版、prefers-reduced-motion 降級、跨裝置驗證。

---

## 完成定義（階段一）

- [ ] VR 引擎在 technology-vr.js，technology.js 不再含 initVR，行為相容（自動三幕與口譯都正常）。
- [ ] 預設互動模式：滑鼠拖曳 360° 環視（受限）、能量球呼吸。
- [ ] 可切換「自動導覽」（保留原 cinematic 三幕）。
- [ ] Café 場景有可點擊發光物件，hover 高亮、點擊聚焦相機。
- [ ] 點物件浮三語卡（英/中/日）+ 導師台詞。
- [ ] 導師對話框 + 選項按鈕 + XP 計分。
- [ ] 全程式即時渲染、無後端、無 AI、無麥克風。console 無錯。
- [ ] 沿用既有色彩/字體；英文文案符合風格約束。
