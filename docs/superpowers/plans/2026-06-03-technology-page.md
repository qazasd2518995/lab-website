# Technology 頁實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 L-DAHS 官網新增 `Technology` tab，內含兩個純程式即時渲染、scripted 的炫酷 demo：VR + AI 外語學習（Three.js 三幕之旅）與多語即時口譯機器人（Canvas 2D 三段接力）。

**Architecture:** 純靜態網站，無建置流程。新增 `technology.html`（沿用既有 navbar/footer/styles.css/script.js）、`technology.js`（獨立 IIFE，兩個 demo 引擎，不污染 script.js）。CSS 追加在 styles.css 末端。Three.js 走 CDN 且只在按下 demo 按鈕時才初始化。所有畫面靠 Canvas/WebGL/requestAnimationFrame 即時算出，無錄影、無後端、無 API、無麥克風。

**Tech Stack:** HTML5、原生 ES (IIFE)、CSS 變數、Three.js (r160 CDN)、Canvas 2D、KaTeX（既有）。沿用既有 nav active 自動判定、`data-rise` 進場、scroll-top、hamburger（皆由 script.js 提供）。

**驗證方式說明：** 本專案無測試框架（純靜態站）。每個 Task 的「驗證」採用瀏覽器目視 + DOM/console 檢查取代單元測試。可用 `python3 -m http.server 8000` 在專案根目錄起本機伺服器，再用瀏覽器或 gstack/browse skill 開 `http://localhost:8000/technology.html` 檢查。每個 Task 完成後 commit。

**色彩與字體常數（全程沿用，勿自創）：**
- 背景 `--bg: #070b16`、`--bg-2: #0b1124`、面板 `--panel: #0e1530`
- 文字 `--ink: #e9e7dd`、`--ink-soft: #a9b2cc`、`--ink-faint: #6b7596`
- accent：青 `--d1: #34e3cf`、橘 `--d2: #ffb74d`、粉 `--d3: #ff5d8f`、靛 `--eig: #7c8cff`
- 線框 `--line: rgba(150,170,220,0.14)`
- 字體：標題 `Fraunces`、內文 `Spectral`、等寬 `JetBrains Mono`

**文案風格約束：** 英文文案不用 em dash、不用省略號、不用 rule-of-three、不用「not X but Y」句式。用平白句子。沿用 `Est. 2025`。

---

## Task 1: 建立 technology.html 骨架（navbar + hero + 空的 demo 區塊 + footer）

**Files:**
- Create: `technology.html`

本任務先把頁面靜態骨架建好，能正確顯示 navbar（Technology 高亮）、hero、兩個空 demo 容器、§03 stack、footer，但 demo 還不會動。

- [ ] **Step 1: 建立 technology.html**

完整貼入以下內容（head 沿用 research.html 的字體/KaTeX 設定，body 用既有 class 名）：

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Technology · L-DAHS</title>
  <meta name="description" content="Applied language technology demonstrations at L-DAHS: VR + AI language learning and multilingual live interpretation, rendered live in the browser.">
  <link rel="icon" type="image/svg+xml" href="favicon.svg">
  <link rel="stylesheet" href="styles.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400;1,9..144,500;1,9..144,600&family=Spectral:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
</head>
<body>
  <a href="#main" class="skip-link">Skip to main content</a>

  <nav class="navbar" role="navigation" aria-label="Main navigation">
    <div class="wrap">
      <a href="index.html" class="nav-brand">
        <span class="brand-mark"></span>
        <span>L-DAHS</span>
        <span class="brand-tag">Latent Manifold Lab</span>
      </a>
      <ul class="nav-menu" id="nav-menu">
        <li><a href="index.html">Home</a></li>
        <li><a href="framework.html">Framework</a></li>
        <li><a href="research.html">Research</a></li>
        <li><a href="technology.html">Technology</a></li>
        <li><a href="teaching.html">Teaching</a></li>
        <li><a href="visuals.html">Figures</a></li>
        <li><a href="team.html">Team</a></li>
        <li><a href="publications.html">Publications</a></li>
      </ul>
      <button class="hamburger" aria-label="Toggle navigation menu" aria-expanded="false" aria-controls="nav-menu">
        <span></span><span></span><span></span>
      </button>
    </div>
  </nav>

  <main id="main">
    <!-- § 00 HERO -->
    <header class="hero">
      <div class="wrap hero-grid">
        <div>
          <div class="eyebrow" data-rise>§ 00 — Applied Language Technology · Live Demonstrations</div>
          <h1 class="hero-title" data-rise>Where the latent manifold <em>meets the user</em>.</h1>
          <p class="hero-sub" data-rise>
            The lab's quantitative methods become things people can hold and speak to. Two
            systems run live in your browser, rendered frame by frame from code: an immersive
            language tutor that moves through 3D scenes, and a multilingual interpreter that
            turns speech into speech across languages.
          </p>
          <div class="cta-row" data-rise>
            <a class="btn primary" href="#demo-vr">↓ VR Language Learning</a>
            <a class="btn" href="#demo-interpreter">↓ Live Interpreter</a>
          </div>
        </div>

        <div class="eq-card" data-rise>
          <div class="tag">The stack at a glance</div>
          <div class="tech-chipwall">
            <span>WebGL</span><span>Three.js</span><span>Spatial Audio</span>
            <span>ASR</span><span>Neural MT</span><span>TTS</span>
            <span>Transformer</span><span>Seq2Seq</span><span>Canvas 2D</span>
          </div>
          <p class="eq-note mono">rendered live · no recordings · no servers</p>
        </div>
      </div>
    </header>

    <!-- § 01 DEMO ONE: VR + AI LANGUAGE LEARNING -->
    <section id="demo-vr" class="section-lg">
      <div class="wrap">
        <div class="section-marker" data-rise><span class="marker-dot"></span><span class="marker-id">§ 01</span> Immersive learning · VR + AI tutor</div>
        <div class="sec-head" data-rise>
          <div class="sec-index">§ 01</div>
          <div class="sec-body">
            <div class="eyebrow">Demonstration one</div>
            <h2>VR + AI language learning</h2>
            <p class="lead">A learner walks through three rendered worlds with an AI tutor at their side. Café, airport, meeting room. Each scene sets a task, surfaces the vocabulary, and gives feedback in real time.</p>
          </div>
        </div>

        <div class="demo-stage demo-stage-vr" data-rise>
          <canvas id="vr-canvas" class="demo-canvas"></canvas>
          <div class="demo-hud" id="vr-hud" hidden>
            <div class="hud-topleft"><span class="hud-scene" id="vr-scene-name">Café</span>
              <span class="hud-dots" id="vr-dots"><i class="on"></i><i></i><i></i></span></div>
            <div class="hud-topright mono"><span>IMMERSION <b id="vr-immersion">98%</b></span><span>LATENCY <b>12ms</b></span></div>
            <div class="hud-caption" id="vr-caption"></div>
          </div>
          <button class="demo-start" id="vr-start" type="button">
            <span class="start-glyph">▶</span><span>Start Immersive Demo</span>
          </button>
        </div>

        <div class="tech-capsules" data-rise>
          <div class="capsule"><div class="cap-k">WebXR</div><p>Head-tracked scenes place the learner inside the language, not in front of it.</p></div>
          <div class="capsule"><div class="cap-k">3D Spatial Audio</div><p>Voices come from where the speaker stands, so listening trains direction and distance too.</p></div>
          <div class="capsule"><div class="cap-k">AI Tutor NLU</div><p>The tutor parses each utterance, scores pronunciation, and adapts the next prompt.</p></div>
        </div>
      </div>
    </section>

    <!-- § 02 DEMO TWO: MULTILINGUAL LIVE INTERPRETER -->
    <section id="demo-interpreter" class="section-lg">
      <div class="wrap">
        <div class="section-marker" data-rise><span class="marker-dot"></span><span class="marker-id">§ 02</span> Speech to speech · multilingual interpreter</div>
        <div class="sec-head" data-rise>
          <div class="sec-index">§ 02</div>
          <div class="sec-body">
            <div class="eyebrow">Demonstration two</div>
            <h2>Multilingual live interpreter</h2>
            <p class="lead">One device, many tongues. Speech enters on the left, runs through the recognition and translation pipeline, and leaves as a new voice on the right. Watch it relay across English, Chinese, and Japanese.</p>
          </div>
        </div>

        <div class="demo-stage demo-stage-interp" data-rise>
          <canvas id="interp-canvas" class="demo-canvas"></canvas>
          <div class="demo-hud" id="interp-hud" hidden>
            <div class="hud-langpair mono"><span id="interp-src-lang">EN</span><span class="hud-arrow">→</span><span id="interp-tgt-lang">中</span></div>
            <div class="hud-pipeline" id="interp-pipeline">
              <i data-stage="vad">VAD</i><i data-stage="asr">ASR</i><i data-stage="mt">MT</i><i data-stage="tts">TTS</i>
            </div>
            <div class="hud-latency mono">latency <b id="interp-latency">000</b>ms</div>
          </div>
          <button class="demo-start" id="interp-start" type="button">
            <span class="start-glyph">▶</span><span>Start Live Interpretation</span>
          </button>
        </div>

        <div class="pipeline-map" data-rise>
          <div class="pmap-node"><div class="pmap-k">Voice Activity Detection</div><p class="mono">segment speech from silence</p></div>
          <div class="pmap-arrow">→</div>
          <div class="pmap-node"><div class="pmap-k">Speech Recognition</div><p class="mono">ASR · acoustic + language model</p></div>
          <div class="pmap-arrow">→</div>
          <div class="pmap-node"><div class="pmap-k">Neural Machine Translation</div><p class="mono">encoder · decoder · attention</p></div>
          <div class="pmap-arrow">→</div>
          <div class="pmap-node"><div class="pmap-k">Speech Synthesis</div><p class="mono">TTS · neural vocoder</p></div>
        </div>
      </div>
    </section>

    <!-- § 03 TECH STACK SUMMARY -->
    <section id="tech-stack" class="section-sm">
      <div class="wrap">
        <div class="section-marker" data-rise><span class="marker-dot"></span><span class="marker-id">§ 03</span> Under the hood · rendering &amp; models</div>
        <div class="sec-head" data-rise>
          <div class="sec-index">§ 03</div>
          <div class="sec-body">
            <div class="eyebrow">Toolchain</div>
            <h2>Rendered in the open</h2>
            <p class="lead">Every frame on this page is computed live in the browser. Nothing here is a recording.</p>
          </div>
        </div>
        <div class="stack" data-rise>
          <span>WebGL · Three.js</span><span>Canvas 2D</span><span>Web Audio</span>
          <span>requestAnimationFrame</span><span>GLSL shaders</span><span>ASR</span>
          <span>Transformer</span><span>Seq2Seq attention</span><span>Neural TTS</span>
          <span>WebXR-ready</span><span>zero backend</span><span>zero recordings</span>
        </div>
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <div class="wrap foot-grid">
      <div>
        <h4>L-DAHS · Latent Manifold Lab</h4>
        <p>Department of Applied Foreign Languages<br>National Taiwan University of Science and Technology<br>T4-816, No. 43, Sec. 4, Keelung Rd., Taipei 10607</p>
      </div>
      <div>
        <h4>People</h4>
        <p><a href="team.html">Director &amp; PI</a><br><a href="team.html">Research assistants</a></p>
      </div>
      <div>
        <h4>Connect</h4>
        <p><a href="publications.html">Publications</a><br><a href="mailto:wenta.tseng@mail.ntust.edu.tw">wenta.tseng@mail.ntust.edu.tw</a></p>
      </div>
    </div>
    <div class="wrap fine"><span id="copyright-year">2026</span> · L-DAHS · Latent Manifold Lab · National Taiwan University of Science and Technology</div>
  </footer>

  <button class="scroll-top" aria-label="Scroll to top">↑</button>
  <script src="script.js"></script>
  <script defer src="technology.js"></script>
</body>
</html>
```

- [ ] **Step 2: 本機起伺服器並目視驗證骨架**

Run: `cd "/Users/justin/lab website" && python3 -m http.server 8000`（背景執行）
開 `http://localhost:8000/technology.html`。
Expected：
- navbar 顯示 8 個項目，`Technology` 有 active 高亮（深/亮對比，與其他頁一致）
- hero 標題、副標、兩顆 CTA、右側 chip 牆顯示正常
- 兩個 demo 區塊各有一顆置中的「▶ Start …」按鈕（此時點了沒反應，正常）
- §03 stack 標籤、footer 顯示正常
- 因 `.tech-chipwall / .demo-stage / .demo-hud / .tech-capsules / .pipeline-map / .demo-start / .demo-canvas` 等 class 尚無 CSS，版面會略亂，這是預期的（Task 2 處理）。
- F12 console 無 JS 錯誤（technology.js 還是空檔，下一步建立）。

- [ ] **Step 3: 建立空的 technology.js 佔位檔**

Create `technology.js`，內容先放一個空 IIFE，避免 404：

```javascript
/* ==============================================
   L-DAHS · Technology page — live demo engines
   VR (Three.js) + Multilingual interpreter (Canvas 2D)
   Self-contained IIFE. Does not touch script.js.
   ============================================== */
(() => {
  'use strict';
  // demo engines added in later tasks
})();
```

- [ ] **Step 4: Commit**

```bash
cd "/Users/justin/lab website"
git add technology.html technology.js
git commit -m "Add Technology page skeleton with two demo containers

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: 在全部 7 個既有頁面的 navbar 加入 Technology 連結

**Files:**
- Modify: `index.html`, `framework.html`, `research.html`, `teaching.html`, `visuals.html`, `team.html`, `publications.html`（各自的 `nav-menu`）

每個檔案的 nav-menu 都有完全相同的一行 `<li><a href="research.html">Research</a></li>`，在其後插入 Technology。

- [ ] **Step 1: 確認 7 個檔的 Research nav 行格式一致**

Run:
```bash
cd "/Users/justin/lab website" && grep -l '<li><a href="research.html">Research</a></li>' index.html framework.html research.html teaching.html visuals.html team.html publications.html
```
Expected：列出全部 7 個檔名。若某檔未列出，先用 `grep -n 'research.html' <該檔>` 查看實際格式，再對該檔單獨處理。

- [ ] **Step 2: 對 7 個檔同步插入 Technology 連結**

對每個檔，將：
```html
<li><a href="research.html">Research</a></li>
```
替換為：
```html
<li><a href="research.html">Research</a></li>
        <li><a href="technology.html">Technology</a></li>
```

（注意縮排：既有 nav-menu 的 `<li>` 為 8 個空白縮排。逐檔用 Edit 工具替換，確保縮排與該檔一致。research.html 中 nav `<li>` 縮排為 8 空白，其餘檔請以各檔實際縮排為準。）

- [ ] **Step 3: 驗證 7 個檔都已加入且只加一次**

Run:
```bash
cd "/Users/justin/lab website" && grep -c '<li><a href="technology.html">Technology</a></li>' index.html framework.html research.html teaching.html visuals.html team.html publications.html
```
Expected：每個檔都輸出 `1`（恰好一次，無重複）。

- [ ] **Step 4: 目視驗證跨頁導覽一致**

開 `http://localhost:8000/index.html` 與 `http://localhost:8000/research.html`，確認 navbar 都出現 Technology 且位置在 Research 之後、Teaching 之前。點 Technology 能進到 technology.html。在 technology.html 點其他 tab 也能正確返回。

- [ ] **Step 5: Commit**

```bash
cd "/Users/justin/lab website"
git add index.html framework.html research.html teaching.html visuals.html team.html publications.html
git commit -m "Add Technology link to navbar across all pages

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Technology 頁 CSS（hero chipwall、demo 舞台、HUD、膠囊、管線圖）

**Files:**
- Modify: `styles.css`（在檔案最末端追加新區段，不改既有規則）

- [ ] **Step 1: 在 styles.css 末端追加 Technology 區段**

在檔案最後一行之後追加以下完整 CSS（所有顏色用既有變數）：

```css

/* ============================================================
   === TECHNOLOGY PAGE ===
   Scoped to technology.html. Does not alter existing rules.
   ============================================================ */

/* hero chip wall (reuses .eq-card container) */
.tech-chipwall { display: flex; flex-wrap: wrap; gap: 8px; margin: 4px 0 14px; }
.tech-chipwall span {
  font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: .02em;
  color: var(--ink-soft); padding: 5px 10px; border: 1px solid var(--line);
  border-radius: 999px; background: rgba(124,140,255,0.05);
}

/* demo stage: the framed canvas area + centered start button + HUD overlay */
.demo-stage {
  position: relative; width: 100%; margin: 26px 0 30px;
  border: 1px solid var(--line); border-radius: 16px; overflow: hidden;
  background:
    radial-gradient(120% 90% at 50% 0%, rgba(124,140,255,0.10), transparent 60%),
    var(--bg-2);
  box-shadow: var(--glow);
}
.demo-stage-vr { aspect-ratio: 16 / 9; }
.demo-stage-interp { aspect-ratio: 21 / 9; }
@media (max-width: 720px) {
  .demo-stage-vr { aspect-ratio: 4 / 3; }
  .demo-stage-interp { aspect-ratio: 3 / 4; }
}
.demo-canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }

/* big start button, centered over the stage */
.demo-start {
  position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
  display: inline-flex; align-items: center; gap: 12px;
  font-family: 'Fraunces', serif; font-size: 18px; color: var(--ink);
  padding: 16px 28px; border-radius: 999px; cursor: pointer;
  border: 1px solid rgba(124,140,255,0.5);
  background: linear-gradient(180deg, rgba(124,140,255,0.22), rgba(124,140,255,0.08));
  backdrop-filter: blur(6px);
  box-shadow: 0 0 0 0 rgba(124,140,255,0.45);
  animation: demoPulse 2.4s ease-in-out infinite;
  transition: transform .2s ease, background .2s ease;
  z-index: 4;
}
.demo-start:hover { transform: translate(-50%, -50%) scale(1.04); background: linear-gradient(180deg, rgba(124,140,255,0.32), rgba(124,140,255,0.14)); }
.demo-start.is-hidden { opacity: 0; pointer-events: none; transform: translate(-50%, -50%) scale(0.7); transition: opacity .5s ease, transform .5s ease; }
.demo-start .start-glyph { color: var(--d1); font-size: 15px; }
@keyframes demoPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(124,140,255,0.45); }
  50% { box-shadow: 0 0 0 18px rgba(124,140,255,0); }
}

/* HUD overlay (HTML/CSS, sits above canvas) */
.demo-hud { position: absolute; inset: 0; pointer-events: none; z-index: 3; font-family: 'JetBrains Mono', monospace; color: var(--ink); }
.demo-hud[hidden] { display: none; }
.hud-topleft { position: absolute; left: 16px; top: 14px; display: flex; align-items: center; gap: 10px; }
.hud-scene { font-family: 'Fraunces', serif; font-size: 15px; color: var(--ink); }
.hud-dots { display: inline-flex; gap: 6px; }
.hud-dots i { width: 7px; height: 7px; border-radius: 50%; background: var(--ink-faint); opacity: .5; transition: all .3s; }
.hud-dots i.on { background: var(--d1); opacity: 1; box-shadow: 0 0 8px var(--d1); }
.hud-topright { position: absolute; right: 16px; top: 14px; display: flex; gap: 16px; font-size: 10px; color: var(--ink-faint); letter-spacing: .04em; }
.hud-topright b { color: var(--d1); }
.hud-caption {
  position: absolute; left: 50%; bottom: 22px; transform: translateX(-50%);
  max-width: 80%; text-align: center; font-family: 'Spectral', serif; font-size: 17px;
  color: var(--ink); text-shadow: 0 2px 18px rgba(0,0,0,0.9); line-height: 1.5;
}
.hud-caption .cap-typed { border-right: 2px solid var(--d1); padding-right: 2px; }

/* interpreter HUD specifics */
.hud-langpair { position: absolute; left: 50%; top: 14px; transform: translateX(-50%); display: flex; gap: 12px; align-items: center; font-size: 16px; }
.hud-langpair span { color: var(--ink); }
.hud-langpair .hud-arrow { color: var(--d1); }
.hud-pipeline { position: absolute; left: 50%; bottom: 16px; transform: translateX(-50%); display: flex; gap: 10px; }
.hud-pipeline i { font-style: normal; font-size: 10px; letter-spacing: .08em; padding: 4px 9px; border: 1px solid var(--line); border-radius: 6px; color: var(--ink-faint); transition: all .25s; }
.hud-pipeline i.lit { color: var(--bg); background: var(--d1); border-color: var(--d1); box-shadow: 0 0 12px var(--d1); }
.hud-latency { position: absolute; right: 16px; top: 14px; font-size: 10px; color: var(--ink-faint); }
.hud-latency b { color: var(--d2); }

/* tech capsules under VR demo */
.tech-capsules { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 8px; }
@media (max-width: 720px) { .tech-capsules { grid-template-columns: 1fr; } }
.capsule { border: 1px solid var(--line); border-radius: 12px; padding: 18px 18px 20px; background: var(--panel); }
.capsule .cap-k { font-family: 'JetBrains Mono', monospace; font-size: 12px; letter-spacing: .04em; color: var(--d1); margin-bottom: 8px; }
.capsule p { font-family: 'Spectral', serif; font-size: 14.5px; color: var(--ink-soft); line-height: 1.6; margin: 0; }

/* pipeline map under interpreter demo */
.pipeline-map { display: flex; align-items: stretch; gap: 10px; margin-top: 8px; flex-wrap: wrap; }
.pmap-node { flex: 1 1 180px; border: 1px solid var(--line); border-radius: 12px; padding: 16px; background: var(--panel); }
.pmap-k { font-family: 'Fraunces', serif; font-size: 15px; color: var(--ink); margin-bottom: 6px; }
.pmap-node p { font-size: 11px; color: var(--ink-faint); margin: 0; }
.pmap-arrow { align-self: center; color: var(--eig); font-size: 20px; }
@media (max-width: 720px) { .pmap-arrow { transform: rotate(90deg); align-self: center; } }
```

- [ ] **Step 2: 目視驗證版面**

重整 `http://localhost:8000/technology.html`。Expected：
- 兩個 demo 舞台是深色發光的圓角框，VR 為 16:9、口譯為 21:9，各有一顆會脈動（pulse 光環）的置中大按鈕。
- hero 右側 chip 牆是膠囊狀標籤。
- VR 下方 3 顆 capsule 並排（窄螢幕轉單欄）。
- 口譯下方管線圖 4 節點 + 箭頭一排（窄螢幕箭頭轉 90 度）。
- F12 切到窄寬度（<720px）確認 RWD：舞台變直式、capsule 單欄、管線轉直。

- [ ] **Step 3: Commit**

```bash
cd "/Users/justin/lab website"
git add styles.css
git commit -m "Add Technology page styles (demo stage, HUD, capsules, pipeline)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: technology.js 共用基礎設施（rng、reduced-motion、舞台啟動鉤子）

**Files:**
- Modify: `technology.js`

建立兩個 demo 共用的小工具，並把「按下 Start → 隱藏按鈕、顯示 HUD、呼叫對應啟動函式」的鉤子接好（啟動函式本任務先放 stub）。

- [ ] **Step 1: 將 technology.js 內容替換為基礎設施版本**

把 Task 1 建的空 IIFE 換成：

```javascript
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

  /* ── expose internals to later-task engines via a page namespace ── */
  window.LDAHS_TECH = { mulberry32, prefersReduced, TAU, lerp, clamp01, easeInOut, wireStart };

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
```

- [ ] **Step 2: 驗證 console 無錯、namespace 存在**

重整頁面，F12 console 執行：`window.LDAHS_TECH`
Expected：回傳一個含 `mulberry32, prefersReduced, TAU, lerp, clamp01, easeInOut, wireStart` 的物件，無錯誤。按鈕此時仍無反應（engines 尚未註冊，下一 Task）。

- [ ] **Step 3: Commit**

```bash
cd "/Users/justin/lab website"
git add technology.js
git commit -m "Add shared infrastructure for Technology demos

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: 口譯 demo 引擎（Canvas 2D，三段多語接力）

先做口譯 demo（純 Canvas 2D，無外部相依，較好獨立驗證），再做需要 Three.js 的 VR demo。

**Files:**
- Modify: `technology.js`（在 IIFE 內、`window.LDAHS_TECH = ...` 之前加入 interpreter 引擎，並在物件上掛 `initInterpreter`）

引擎職責：在 `#interp-canvas` 上即時渲染中央發光呼吸裝置、左右雙語波形、ASR 逐字浮現（含「先灰後白修正」）、管線燈號依序點亮、延遲計時器、三段語言接力。所有文字內容由一個 SCRIPT 陣列驅動。

- [ ] **Step 1: 加入 interpreter 引擎程式碼**

在 `technology.js` 的 `window.LDAHS_TECH = {...}` 那行**之前**，插入以下程式碼：

```javascript
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
```

並在同檔的 `window.LDAHS_TECH = {...}` 物件中加入 `initInterpreter`：把該行改為
```javascript
  window.LDAHS_TECH = { mulberry32, prefersReduced, TAU, lerp, clamp01, easeInOut, wireStart, initInterpreter };
```

- [ ] **Step 2: 目視驗證口譯 demo**

重整 `http://localhost:8000/technology.html`，捲到 §02，點「▶ Start Live Interpretation」。Expected：
- 按鈕縮小淡出，HUD 顯示（語言對 `EN → 中`、管線燈、latency 數字跳動）。
- 中央出現發光呼吸裝置（同心圓 + 脈動核心），主題色為青。
- 左側波形跳動 + 來源英文逐字浮現（偶有灰色字修正感）。
- 接著翻譯粒子流向右側、右側中文逐字浮現、右側波形跳動。
- 約 7 秒後切換到第二段 `中 → EN`（裝置轉橘色），再切到 `日 → 中`（轉粉色）。
- 全部結束顯示「↻ click to replay」，點畫面可重播。
- console 無錯誤。

- [ ] **Step 3: 驗證 reduced-motion 降級**

在 F12 → Rendering（或 DevTools 命令面板）啟用 `prefers-reduced-motion: reduce`，硬重整頁面再點 Start。Expected：直接顯示靜態終態（裝置 + 首段中英對照文字），不跑動畫，無錯誤。測完關閉該模擬。

- [ ] **Step 4: Commit**

```bash
cd "/Users/justin/lab website"
git add technology.js
git commit -m "Add multilingual interpreter demo engine (Canvas 2D)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: 載入 Three.js 並建立 VR demo 引擎骨架（單一場景 + 能量球導師 + 運鏡）

**Files:**
- Modify: `technology.html`（head 加 Three.js CDN）
- Modify: `technology.js`（加入 VR 引擎，掛 `initVR`）

本任務先讓 VR demo 能渲染「一個場景 + 會呼吸的能量球導師 + 相機推進 + HUD 字幕」，三幕內容在 Task 7 用參數化 scene 陣列補上。

- [ ] **Step 1: 在 technology.html head 末端（KaTeX 那段位置）加入 Three.js CDN**

在 `<link rel="stylesheet" href="styles.css">` 之後、`</head>` 之前加入：

```html
  <script defer src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r160/three.min.js"></script>
```

（用 r160 固定版本，`defer` 確保在 technology.js 之前載入完成；technology.js 也是 defer，且 boot 在 DOMContentLoaded，Three.js 此時已就緒。）

- [ ] **Step 2: 在 technology.js 加入 VR 引擎（單場景版）**

在 `initInterpreter` 函式**之後**、`window.LDAHS_TECH = {...}` 之前，加入：

```javascript
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

    function size() {
      const r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
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

      size();
    }

    // a single placeholder scene config; replaced by an array in Task 7
    const SCENES = [
      { name: 'Café', color: 0x34e3cf, caption: 'Order a coffee in English.' },
    ];
    function applyScene(s) {
      if (hud.scene) hud.scene.textContent = s.name;
      grid.material.color.setHex(s.color);
      tutor.userData.orbMat.color.setHex(s.color);
      tutor.userData.orbMat.emissive.setHex(s.color);
      tutor.userData.ringMat.color.setHex(s.color);
      typeCaption(s.caption);
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

      // breathing orb
      const b = 1 + 0.06 * Math.sin(t * 2.2);
      tutor.userData.orb.scale.setScalar(b);
      tutor.userData.ring.scale.setScalar(1 + 0.12 * Math.abs(Math.sin(t * 4)));
      tutor.rotation.y = t * 0.4;
      tutor.position.y = 1.5 + 0.05 * Math.sin(t * 1.5);

      // slow camera dolly-in
      camera.position.z = lerp(6, 4.2, easeInOut(clamp01(t / 6)));
      camera.lookAt(0, 1.5, 0);

      if (hud.immersion) hud.immersion.textContent = (90 + Math.floor(8 * Math.abs(Math.sin(t)))) + '%';

      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    }

    function start() {
      build();
      if (prefersReduced) { applyScene(SCENES[0]); renderer.render(scene, camera); return; }
      setDots(0, 3);
      applyScene(SCENES[0]);
      running = true; t0 = 0; raf = requestAnimationFrame(frame);
    }

    window.addEventListener('resize', () => { if (renderer) size(); });
    wireStart('vr-start', 'vr-hud', start);
  }
```

並把 `window.LDAHS_TECH = {...}` 那行更新為包含 `initVR`：
```javascript
  window.LDAHS_TECH = { mulberry32, prefersReduced, TAU, lerp, clamp01, easeInOut, wireStart, initInterpreter, initVR };
```

- [ ] **Step 3: 目視驗證 VR 單場景**

重整頁面，捲到 §01，點「▶ Start Immersive Demo」。Expected：
- 出現 3D 透視地板網格（青色）、中央一顆會呼吸/自轉/上下浮動的青色能量球（含一圈會脈動的環）。
- 相機在前 6 秒緩慢推進。
- HUD：左上 `Café` + 三點（第一點亮）、右上 IMMERSION 數字跳動、下方字幕打字機顯示 `Order a coffee in English.`
- console 無錯（若見 `[tech] THREE not loaded`，代表 CDN 未就緒，檢查 Step 1 的 script 標籤）。

- [ ] **Step 4: Commit**

```bash
cd "/Users/justin/lab website"
git add technology.html technology.js
git commit -m "Add VR demo engine skeleton with tutor orb and camera dolly

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: VR demo 三幕參數化場景 + 轉場 + 詞彙卡 + 結尾收束

**Files:**
- Modify: `technology.js`（擴充 `initVR`：SCENES 改三幕、加場景道具、加時間軸推進與光帶轉場、加漂浮詞彙卡、加結尾 manifold 收束）

把單場景升級為三幕之旅。場景做成參數化陣列，方便使用者日後替換內容。

- [ ] **Step 1: 將 initVR 內的 SCENES 陣列替換為三幕參數化版本**

把 Task 6 的 `const SCENES = [...]`（單元素）替換為：

```javascript
    // parameterized scenes — edit freely to change demo content later
    const SCENES = [
      { name: 'Café', color: 0x34e3cf, caption: 'Order a coffee in English.',
        props: 'tables', words: ['a flat white, please', 'for here or to go?'] },
      { name: 'Airport', color: 0x7c8cff, caption: 'Check in for your flight.',
        props: 'counter', words: ['window seat', 'boarding pass'] },
      { name: 'Meeting', color: 0xffb74d, caption: 'Introduce yourself professionally.',
        props: 'screen', words: ['pleased to meet you', "I lead the data team"] },
    ];
    const SCENE_SECS = 13;          // seconds per scene
    const TOTAL = SCENE_SECS * SCENES.length;
```

- [ ] **Step 2: 在 build() 內、`size();` 之前加入「場景道具群組」與「漂浮詞彙卡群組」**

在 `initVR` 的 `build()` 函式中，緊接在 `scene.add(tutor);` 之後加入：

```javascript
      // swappable props group (rebuilt per scene)
      const propsGroup = new THREE.Group(); scene.add(propsGroup);
      // floating vocabulary cards group
      const cardsGroup = new THREE.Group(); scene.add(cardsGroup);
      // transition light-beam plane
      const beamMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
      const beam = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), beamMat);
      beam.position.set(0, 1.5, 2.5);
      scene.add(beam);
      vr.propsGroup = propsGroup; vr.cardsGroup = cardsGroup; vr.beamMat = beamMat;
```

並在 `initVR` 函式頂部（`let renderer, scene, ...` 那一行附近）新增一個共享物件來掛這些引用。把該宣告行改為：

```javascript
    let renderer, scene, camera, tutor, grid, raf = 0, running = false, t0 = 0;
    let W = 0, H = 0;
    const vr = {}; // holds propsGroup / cardsGroup / beamMat / card sprites
```

- [ ] **Step 3: 加入建立場景道具與詞彙卡的函式**

在 `applyScene` 函式**之前**加入兩個 helper：

```javascript
    // build low-poly props for a scene into vr.propsGroup
    function buildProps(kind, colorHex) {
      const g = vr.propsGroup;
      while (g.children.length) g.remove(g.children[0]);
      const mat = new THREE.MeshStandardMaterial({ color: colorHex, emissive: colorHex,
        emissiveIntensity: 0.15, metalness: 0.2, roughness: 0.6, transparent: true, opacity: 0.9 });
      const line = new THREE.MeshBasicMaterial({ color: colorHex, wireframe: true, transparent: true, opacity: 0.35 });
      if (kind === 'tables') {
        for (let i = 0; i < 4; i++) {
          const t = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.08, 12), mat);
          t.position.set(-3 + i * 2, 0.7, -3 - (i % 2)); vr.propsGroup.add(t);
          const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.7, 0.08), mat);
          leg.position.set(t.position.x, 0.35, t.position.z); vr.propsGroup.add(leg);
        }
      } else if (kind === 'counter') {
        const c = new THREE.Mesh(new THREE.BoxGeometry(5, 1, 1), mat);
        c.position.set(0, 0.5, -3.5); vr.propsGroup.add(c);
        const board = new THREE.Mesh(new THREE.PlaneGeometry(4, 1.2), line);
        board.position.set(0, 3, -5); vr.propsGroup.add(board);
      } else if (kind === 'screen') {
        const table = new THREE.Mesh(new THREE.BoxGeometry(5, 0.15, 1.6), mat);
        table.position.set(0, 0.75, -2); vr.propsGroup.add(table);
        const screen = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.9), line);
        screen.position.set(0, 2.4, -5); vr.propsGroup.add(screen);
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
        vr.cardsGroup.add(spr);
      });
    }
```

- [ ] **Step 4: 更新 applyScene 以套用道具與詞彙卡**

把 Task 6 的 `applyScene` 函式整個替換為：

```javascript
    function applyScene(s) {
      if (hud.scene) hud.scene.textContent = s.name;
      grid.material.color.setHex(s.color);
      tutor.userData.orbMat.color.setHex(s.color);
      tutor.userData.orbMat.emissive.setHex(s.color);
      tutor.userData.ringMat.color.setHex(s.color);
      buildProps(s.props, s.color);
      buildCards(s.words, s.color);
      typeCaption(s.caption);
    }
```

- [ ] **Step 5: 將 frame() 升級為三幕時間軸 + 轉場 + 卡片浮動 + 結尾收束**

把 Task 6 的 `frame` 函式整個替換為：

```javascript
    let curScene = -1;
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

      // breathing orb (talks: ring pulses faster early in each scene)
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

      // camera: gentle dolly within a scene, plus a small orbit
      const dolly = lerp(6, 4.4, easeInOut(clamp01(localT / 5)));
      camera.position.x = Math.sin(t * 0.15) * 0.8;
      camera.position.z = dolly;
      camera.position.y = 1.4;
      camera.lookAt(0, 1.5, 0);

      if (hud.immersion) hud.immersion.textContent = (90 + Math.floor(8 * Math.abs(Math.sin(t)))) + '%';

      // ending: pull camera back, collapse scenes into the manifold caption
      if (done) {
        camera.position.z = lerp(camera.position.z, 9, 0.05);
        camera.lookAt(0, 1.5, 0);
        if (hud.scene) hud.scene.textContent = 'Manifold';
        if (hud.caption && hud.caption.textContent !== 'One manifold. Many worlds.')
          typeCaption('One manifold. Many worlds.');
        tutor.rotation.y = t * 0.4;
        tutor.userData.orb.scale.setScalar(1 + 0.06 * Math.sin(t * 2.2));
        renderer.render(scene, camera);
        // keep a slow idle render loop so the orb keeps breathing
        raf = requestAnimationFrame(frame);
        return;
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    }
```

注意：因為 `curScene` 改為 frame 外層的閉包變數，請移除 Task 6 `start()` 中的 `applyScene(SCENES[0]);` 呼叫（改由 frame 首次偵測 idx 變化時自動套用），並把 `setDots(0, 3);` 改為 `setDots(0, SCENES.length);`。更新後的 `start()` 為：

```javascript
    function start() {
      build();
      if (prefersReduced) { curScene = 0; applyScene(SCENES[0]); renderer.render(scene, camera); return; }
      curScene = -1;
      running = true; t0 = 0; raf = requestAnimationFrame(frame);
    }
```

（`let curScene = -1;` 宣告需移到 `initVR` 函式作用域頂部，與 `const vr = {}` 同層，避免 start 與 frame 各自宣告。請刪除 frame 上方那行 `let curScene = -1;`，並在頂部 `const vr = {};` 下一行加入 `let curScene = -1;`。）

- [ ] **Step 6: 目視驗證三幕之旅**

重整頁面，捲到 §01 點 Start。Expected：
- 幕 1 Café（青）：地板網格 + 4 張幾何圓桌 + 能量球導師 + 兩張漂浮詞彙卡（"a flat white, please" / "for here or to go?"）+ 字幕打字機。
- 約 13 秒後白色光帶閃一下，切到幕 2 Airport（靛藍）：值機長櫃 + 航班看板線框 + 新詞彙卡（"window seat" / "boarding pass"），左上場景名與進度點更新到第 2 點。
- 再 13 秒切到幕 3 Meeting（橘）：長桌 + 簡報螢幕線框 + 新卡片。
- 結尾相機拉遠，左上顯示 `Manifold`、字幕變 `One manifold. Many worlds.`，能量球持續呼吸。
- 全程 console 無錯，畫面順暢（桌機應達 ~60fps）。

- [ ] **Step 7: Commit**

```bash
cd "/Users/justin/lab website"
git add technology.js
git commit -m "Add three-act scene journey, transitions, vocab cards to VR demo

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: 整頁打磨與跨瀏覽器/RWD 驗證

**Files:**
- Modify: `technology.js` 或 `styles.css`（僅在驗證發現問題時做小修）

- [ ] **Step 1: 桌機完整走查**

開 `http://localhost:8000/technology.html`，依序：
- 從 hero 兩顆 CTA 點擊，確認錨點平滑捲到對應 demo。
- 跑完兩個 demo 各一次，確認都能播放、切換、結束、重播（口譯）/收束（VR）。
- scroll-top 按鈕、navbar Technology 高亮、KaTeX（本頁無公式，確認不報錯）皆正常。
- console 全程無 error/warning（除可忽略的第三方 CDN 提示）。

- [ ] **Step 2: 行動裝置寬度走查**

F12 切換到行動裝置（如 iPhone 寬度 390px）：
- 兩個 demo 舞台改為直式比例（VR 4:3、口譯 3:4），按鈕與 HUD 不溢出。
- capsule 單欄、管線圖箭頭轉直。
- demo 仍能啟動且 canvas 正確填滿（無模糊/錯位；DPR 已處理）。
- 漢堡選單能開合並顯示 Technology。

- [ ] **Step 3: 若發現問題，做最小修正並記錄**

只針對實際發現的問題（如某裝置 canvas 尺寸、文字溢出、色彩對比）做小幅 CSS/JS 調整。每個修正後重新驗證該點。若無問題則跳過。

- [ ] **Step 4: 關閉本機伺服器**

結束背景的 `python3 -m http.server`（找到該背景程序並停止）。

- [ ] **Step 5: Commit（若有打磨改動）**

```bash
cd "/Users/justin/lab website"
git add -A
git commit -m "Polish Technology page demos and responsive layout

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

（若 Step 3 無任何改動，略過本 commit。）

---

## 完成定義

- [ ] `technology.html` 在 8 個頁面的 navbar 都可達，Technology 正確高亮。
- [ ] VR demo：Three.js 三幕之旅（餐廳→機場→會議室）+ 能量球導師 + 詞彙卡 + 轉場 + manifold 收束，按鈕觸發、可重看。
- [ ] 口譯 demo：Canvas 2D 發光裝置 + 三段多語接力（英→中、中→英、日→中）+ 波形 + ASR 逐字 + 管線燈號 + 延遲計時。
- [ ] 全部程式即時渲染，無錄影、無後端、無 API、無麥克風權限。
- [ ] `prefers-reduced-motion` 有降級。RWD 在行動寬度正常。
- [ ] 全程沿用既有色彩/字體/版式語彙，與站點一致。
- [ ] 英文文案符合風格約束（無 em dash / 省略號 / rule-of-three / not X but Y）。
