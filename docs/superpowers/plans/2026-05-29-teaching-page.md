# Teaching 頁實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增 `teaching.html`，把實驗室研發的推論統計教材提煉成 7 張深色主題卡片，點擊開啟含概念導讀、KaTeX 公式、新繪深色 SVG 圖、適用情境的 Modal。

**Architecture:** 純靜態頁面，沿用既有 `.foci/.focus` 卡片網格與 navbar/footer/`data-rise` 模式。卡片資料集中在 `script.js` 一個物件陣列；單一 Modal 容器由 JS 依資料注入並重複使用。公式用站內既有 KaTeX（auto-render 已支援 `$$`/`$`），SVG 為新繪內嵌深色向量圖。零新依賴。

**Tech Stack:** HTML5、原生 CSS（CSS 變數）、原生 JS（IIFE，無框架）、KaTeX（CDN，已在用）。

**驗證方式:** 本專案無測試框架，為靜態網站。每個任務以「在瀏覽器開啟頁面實際檢查」取代單元測試。可用 `browse` 技能（headless）或請使用者目視。每完成一個可獨立驗證的單位即 commit。

**參考事實（已查證）:**
- 卡片網格 class：`.foci`（12 欄 grid）內含 `.focus`（`--c` 主題色、hover 浮起、`.k`/`h3`/`p`/`.mini` 結構）。span class：`.span-3`(6欄)、`.span-4`(8欄)、`.span-6`(整列)。
- `script.js` 為 IIFE；`init()` 內呼叫 `setupNav/setupReveal/setupScrollTop/setupCopyright/renderMath/setupFigures`。
- `doRender()`（script.js:523）對 `document.body` 跑 `renderMathInElement`，分隔符已含 `$$`、`\[`、`\(`、`$`。
- `setupNav()`（script.js:447）依檔名自動加 `.active`，並掛 hamburger 行動選單。
- footer 年份由 `setupCopyright()` 用 `new Date().getFullYear()` 填入 `#copyright-year`。
- 既有頁面 head 載入 KaTeX 的三行（css + katex.min.js + auto-render，皆 `defer`）見 index.html:27-29。

---

## Task 1: 建立 teaching.html 骨架（navbar、區塊標頭、footer、空卡片網格）

**Files:**
- Create: `teaching.html`

- [ ] **Step 1: 建立 teaching.html，沿用既有頁面結構**

完整檔案內容（head 的 KaTeX 三行與 index.html 一致；nav 含 Teaching 並標 active；卡片網格先留空容器，由後續任務填入）：

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Teaching · L-DAHS</title>
  <meta name="description" content="Research-built teaching materials on inferential statistics from L-DAHS: sampling distributions, the t-distribution, two-sample tests, paired t, one-way and repeated-measures ANOVA.">
  <link rel="icon" type="image/svg+xml" href="favicon.svg">
  <link rel="stylesheet" href="styles.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400;1,9..144,500;1,9..144,600&family=Spectral:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css">
  <script defer src="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js"></script>
  <script defer src="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/contrib/auto-render.min.js"></script>
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
    <section id="teaching" class="section-lg section-page-top">
      <div class="wrap">
        <div class="section-marker" data-rise><span class="marker-dot"></span><span class="marker-id">§ 07</span> Teaching · inferential statistics, made visible</div>
        <div class="sec-head" data-rise>
          <div class="sec-index">§ 07</div>
          <div class="sec-body">
            <div class="eyebrow">Research-built teaching materials</div>
            <h2>Statistics you can <em style="background:linear-gradient(100deg,var(--d1),var(--eig) 45%,var(--d3));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;font-style:italic;font-weight:500">see</em>.</h2>
            <p class="lead">The same framework that drives the lab's research, turned outward to teach. Seven units carry inferential statistics from the sampling distribution to repeated-measures ANOVA. Open a card to read the core idea, the formulas that matter, and a figure that makes the geometry plain.</p>
          </div>
        </div>

        <div class="teach-grid" id="teach-grid" data-rise>
          <!-- cards injected by script.js -->
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
</body>
</html>
```

- [ ] **Step 2: 在瀏覽器開啟驗證骨架**

Run: 用 `browse` 開啟 `file:///Users/justin/lab website/teaching.html`（或請使用者開啟）
Expected: 深色頁面載入；navbar 出現且 Teaching 為 active（高亮）；§07 標頭與導語顯示；卡片區暫時空白；無 console 錯誤；footer 年份顯示 2026（JS 任務尚未掛資料前年份來自靜態值）。

- [ ] **Step 3: Commit**

```bash
git add teaching.html
git commit -m "Add Teaching page skeleton with nav, header, and empty card grid

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: 加入卡片網格與 Modal 的 CSS

**Files:**
- Modify: `styles.css`（在檔案末尾新增 teaching 區塊）

- [ ] **Step 1: 在 styles.css 末尾新增 teaching 卡片 + modal 樣式**

附加到 `styles.css` 結尾（卡片沿用 `.focus` 的視覺語彙但用獨立 class 以免互相干擾；含 `prefers-reduced-motion` 與手機版）：

```css

/* ==============================================
   Teaching page · cards + modal
   ============================================== */
.teach-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 20px;
  grid-auto-rows: minmax(200px, auto);
}
.teach-card {
  grid-column: span 4;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 26px 24px 22px;
  position: relative;
  overflow: hidden;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  text-align: left;
  font: inherit;
  color: inherit;
  transition: transform 0.22s, box-shadow 0.22s, border-color 0.22s;
}
.teach-card::before {
  content: "";
  position: absolute;
  left: 0; top: 0;
  height: 100%; width: 3px;
  background: var(--c, var(--eig));
}
.teach-card:hover,
.teach-card:focus-visible {
  transform: translateY(-4px);
  box-shadow: var(--glow);
  border-color: var(--c);
  outline: none;
}
.teach-card .tc-num {
  font-family: "JetBrains Mono", monospace;
  font-size: 0.66rem;
  letter-spacing: 0.2em;
  color: var(--c);
}
.teach-card h3 {
  font-size: 1.18rem;
  margin: 0.45rem 0 0.5rem;
}
.teach-card .tc-sub {
  font-size: 0.92rem;
  color: var(--ink-soft);
  margin: 0 0 14px;
  line-height: 1.6;
}
.teach-card .tc-preview {
  margin-top: auto;
  font-size: 0.9rem;
  color: var(--ink);
  background: var(--bg-2);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 8px 12px;
  overflow-x: auto;
}
.teach-card .tc-kind {
  margin-top: 12px;
  font-family: "JetBrains Mono", monospace;
  font-size: 0.62rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ink-faint);
}

/* Modal */
.tm-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 5vh 20px;
  background: rgba(4, 7, 16, 0.78);
  backdrop-filter: blur(4px);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.25s;
}
.tm-overlay.open {
  opacity: 1;
  pointer-events: auto;
}
.tm-dialog {
  position: relative;
  width: min(760px, 100%);
  max-height: 90vh;
  overflow-y: auto;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-top: 3px solid var(--c, var(--eig));
  border-radius: 16px;
  padding: 30px 34px 38px;
  box-shadow: 0 40px 100px -30px rgba(0, 0, 0, 0.9);
  transform: translateY(14px);
  transition: transform 0.25s;
}
.tm-overlay.open .tm-dialog { transform: translateY(0); }
.tm-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}
.tm-tag {
  font-family: "JetBrains Mono", monospace;
  font-size: 0.66rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--c, var(--eig));
}
.tm-close {
  background: none;
  border: 1px solid var(--line);
  color: var(--ink-soft);
  border-radius: 8px;
  width: 34px; height: 34px;
  font-size: 1.1rem;
  cursor: pointer;
  line-height: 1;
  transition: border-color 0.2s, color 0.2s;
}
.tm-close:hover { color: var(--ink); border-color: var(--c, var(--eig)); }
.tm-dialog h3 {
  font-family: "Fraunces", serif;
  font-size: 1.7rem;
  line-height: 1.15;
  margin: 0 0 0.3rem;
}
.tm-dialog h3 em { font-style: italic; color: var(--c, var(--eig)); }
.tm-subtitle {
  color: var(--ink-soft);
  font-size: 0.98rem;
  margin: 0 0 1.4rem;
}
.tm-label {
  font-family: "JetBrains Mono", monospace;
  font-size: 0.66rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ink-faint);
  margin: 1.6rem 0 0.7rem;
}
.tm-overview { color: var(--ink-soft); line-height: 1.7; }
.tm-formulas {
  background: var(--bg-2);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 14px 18px;
  overflow-x: auto;
}
.tm-formulas .tm-eq { margin: 0.5rem 0; text-align: center; }
.tm-figure {
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 18px;
  text-align: center;
}
.tm-figure svg { width: 100%; height: auto; max-width: 520px; display: block; margin: 0 auto; }
.tm-figcap {
  font-size: 0.82rem;
  color: var(--ink-faint);
  margin-top: 10px;
}
.tm-when { margin: 0.4rem 0 0; padding-left: 1.1rem; color: var(--ink-soft); }
.tm-when li { margin: 0.35rem 0; line-height: 1.6; }

body.tm-lock { overflow: hidden; }

@media (max-width: 900px) {
  .teach-card { grid-column: span 6; }
}
@media (max-width: 600px) {
  .teach-card { grid-column: 1 / -1; }
  .tm-dialog { padding: 24px 20px 30px; }
  .tm-dialog h3 { font-size: 1.4rem; }
}
@media (prefers-reduced-motion: reduce) {
  .teach-card, .tm-overlay, .tm-dialog { transition: none; }
  .teach-card:hover, .teach-card:focus-visible { transform: none; }
}
```

- [ ] **Step 2: Commit**

```bash
git add styles.css
git commit -m "Add CSS for Teaching cards and modal

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: 卡片資料陣列（7 張卡的內容 + 新繪深色 SVG）

**Files:**
- Modify: `script.js`（在 IIFE 內、`init()` 之前新增 `TEACH_CARDS` 資料與 SVG）

每張卡資料欄位：`id, num, kind, color, title, subtitle, preview(卡面inline公式), overview(HTML), formulas[](顯示公式字串,用 $$), svg(字串), figcap, whenToUse[]`。

- [ ] **Step 1: 在 script.js 的 IIFE 內、`/* ───────── init ───────── */` 註解上方，貼入卡片資料**

公式沿用教材原文（已查證），SVG 為新繪深色向量圖。色值用 hex：teal `#34e3cf`、amber `#ffb74d`、pink `#ff5d8f`、indigo `#7c8cff`、ink `#e9e7dd`、ink-soft `#a9b2cc`、ink-faint `#6b7596`。

```javascript
  /* ───────── teaching cards ───────── */
  const TEACH_CARDS = [
    {
      id: 'sampling',
      num: '01',
      kind: 'Lecture · Quiz',
      color: 'var(--d1)',
      title: 'Sampling distribution & standard error',
      subtitle: '抽樣分配與標準誤 · the two properties that make inference possible',
      preview: '\\( \\mathrm{SE} = \\sigma/\\sqrt{n} \\)',
      overview: 'Enumerate every possible sample of a tiny population and the sample mean reveals two exact properties. It is <strong>unbiased</strong>: averaged over all samples it equals the population mean. And its spread shrinks with sample size as <strong>variance reduction</strong>. Together they underwrite every confidence interval and every test statistic.',
      formulas: [
        'E(\\bar{X}) = \\mu',
        '\\mathrm{Var}(\\bar{X}) = \\dfrac{\\sigma^2}{n}',
        '\\mathrm{SE}(\\bar{X}) = \\dfrac{\\sigma}{\\sqrt{n}}'
      ],
      svg: `<svg viewBox="0 0 520 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Sampling distribution narrowing as n grows">
  <line x1="40" y1="180" x2="500" y2="180" stroke="#6b7596" stroke-width="1"/>
  <path d="M40,180 C150,178 200,120 270,120 C340,120 390,178 500,180" fill="none" stroke="#a9b2cc" stroke-width="1.5" opacity="0.6"/>
  <path d="M150,180 C220,176 250,60 270,60 C290,60 320,176 390,180 Z" fill="#34e3cf" opacity="0.18"/>
  <path d="M150,180 C220,176 250,60 270,60 C290,60 320,176 390,180" fill="none" stroke="#34e3cf" stroke-width="2"/>
  <line x1="270" y1="46" x2="270" y2="180" stroke="#ff5d8f" stroke-width="1.4" stroke-dasharray="4,3"/>
  <text x="270" y="38" text-anchor="middle" font-family="Fraunces, serif" font-style="italic" font-size="14" fill="#ff5d8f">μ</text>
  <text x="430" y="150" font-family="JetBrains Mono, monospace" font-size="11" fill="#a9b2cc">n = 1</text>
  <text x="300" y="96" font-family="JetBrains Mono, monospace" font-size="11" fill="#34e3cf">large n</text>
  <text x="270" y="200" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="#6b7596">X̄</text>
</svg>`,
      figcap: 'Larger samples concentrate the sample mean tightly around μ. The √n law.',
      whenToUse: [
        'Reasoning about why a larger n gives a more precise estimate.',
        'Setting up confidence intervals: width is driven by σ/√n.',
        'Understanding the denominator of every z- and t-statistic.'
      ]
    },
    {
      id: 'tdist',
      num: '02',
      kind: 'Reference · Quiz',
      color: 'var(--d2)',
      title: 'The t-distribution & critical values',
      subtitle: 't 分配與臨界值表 · when σ is estimated, the ruler changes',
      preview: '\\( t_{df,\\,\\alpha} \\)',
      overview: 'When the population standard deviation is unknown and must be estimated from the sample, the standardised statistic no longer follows the normal curve but <strong>Student’s t</strong>: heavier in the tails, more forgiving of extreme values. As the degrees of freedom grow, t approaches z. The critical value table converts a chosen α and df into the cut-off a test statistic must clear.',
      formulas: [
        't = \\dfrac{\\bar{X} - \\mu}{S/\\sqrt{n}}, \\quad df = n - 1',
        't_{df} \\to N(0,1) \\ \\text{as } df \\to \\infty'
      ],
      svg: `<svg viewBox="0 0 520 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="t distribution with right-tail rejection region">
  <path d="M30,165 C160,165 200,40 260,40 C320,40 360,165 490,165" fill="#7c8cff" opacity="0.12"/>
  <path d="M390,165 C420,150 445,120 470,118 C480,140 488,160 490,165 Z" fill="#ffb74d" opacity="0.3"/>
  <path d="M30,165 C160,165 200,40 260,40 C320,40 360,165 490,165" fill="none" stroke="#e9e7dd" stroke-width="1.8"/>
  <line x1="30" y1="165" x2="490" y2="165" stroke="#6b7596" stroke-width="0.8"/>
  <line x1="390" y1="165" x2="390" y2="80" stroke="#ffb74d" stroke-width="1.4" stroke-dasharray="4,3"/>
  <text x="390" y="72" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" fill="#ffb74d" font-weight="600">+t_α</text>
  <text x="440" y="156" font-family="Fraunces, serif" font-style="italic" font-size="14" fill="#ffb74d">α</text>
  <text x="260" y="186" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="#6b7596">0</text>
</svg>`,
      figcap: 'The right-tail rejection region: area α beyond the critical value +t_α.',
      whenToUse: [
        'Any test of means where the population variance is unknown.',
        'Choosing a critical value from α (one- or two-tailed) and df.',
        'Small samples, where the t-correction matters most.'
      ]
    },
    {
      id: 'twomeans',
      num: '03',
      kind: 'Decision tree · 12 problems',
      color: 'var(--d3)',
      title: 'Two means, six tests',
      subtitle: '兩平均數差 μ₁ − μ₂ · choosing the right denominator',
      preview: '\\( t = \\text{signal}/\\text{noise} \\)',
      overview: 'Every two-sample test of \\( \\mu_1 - \\mu_2 \\) is one idea in different clothes. Three questions (is σ known? are the samples large? are the groups independent or paired?) pick one of six tests. The numerator is always the observed difference minus its null value; only the <strong>standard error in the denominator</strong> changes.',
      formulas: [
        '\\text{statistic} = \\dfrac{(\\bar{X}_1 - \\bar{X}_2) - (\\mu_1 - \\mu_2)}{\\widehat{\\mathrm{SE}}(\\bar{X}_1 - \\bar{X}_2)}',
        'S_p^2 = \\dfrac{(n_1-1)S_1^2 + (n_2-1)S_2^2}{n_1 + n_2 - 2}'
      ],
      svg: `<svg viewBox="0 0 520 250" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Decision tree from a root question to six tests">
  <rect x="14" y="110" width="92" height="34" rx="4" fill="#e9e7dd"/>
  <text x="60" y="132" text-anchor="middle" font-family="Fraunces, serif" font-size="13" fill="#0b1124">μ₁ − μ₂</text>
  <g stroke="#a9b2cc" stroke-width="1.2" fill="none">
    <path d="M106,127 H150 V60 H190"/>
    <path d="M106,127 H150 V190 H190"/>
    <path d="M286,190 H320 V150 H360"/>
    <path d="M286,190 H320 V230 H360"/>
  </g>
  <g font-family="JetBrains Mono, monospace" font-size="10" fill="#6b7596">
    <text x="120" y="52">σ known</text>
    <text x="120" y="205">σ unknown</text>
  </g>
  <g font-family="JetBrains Mono, monospace" font-size="11" font-weight="600">
    <rect x="190" y="44" width="96" height="30" rx="4" fill="none" stroke="#34e3cf" stroke-width="1.4"/>
    <text x="238" y="63" text-anchor="middle" fill="#34e3cf">z-test</text>
    <rect x="190" y="174" width="96" height="30" rx="4" fill="none" stroke="#a9b2cc" stroke-width="1"/>
    <text x="238" y="193" text-anchor="middle" fill="#a9b2cc">n, design?</text>
    <rect x="360" y="135" width="120" height="30" rx="4" fill="none" stroke="#ff5d8f" stroke-width="1.4"/>
    <text x="420" y="154" text-anchor="middle" fill="#ff5d8f">pooled / Welch t</text>
    <rect x="360" y="215" width="120" height="30" rx="4" fill="none" stroke="#ffb74d" stroke-width="1.4"/>
    <text x="420" y="234" text-anchor="middle" fill="#ffb74d">paired t</text>
  </g>
</svg>`,
      figcap: 'Three questions, six destinations. The tree decides only the standard error.',
      whenToUse: [
        'Comparing two group means and unsure which test applies.',
        'Deciding between pooled and Welch t under unequal variances.',
        'Recognising paired designs: positive correlation buys precision.'
      ]
    },
    {
      id: 'paired',
      num: '04',
      kind: 'Lecture · 15-item activity',
      color: 'var(--eig)',
      title: 'The paired-samples t-test',
      subtitle: '成對樣本 t 檢定 · pre/post, repeated measures, matched pairs',
      overview: 'When the same subjects are measured twice, the two samples are correlated by design. Reduce the problem to a <strong>one-sample test on the differences</strong> \\( D_i = X_{1i} - X_{2i} \\). The within-pair correlation is absorbed automatically. Written with covariance, the term \\( -2rS_1S_2 \\) shrinks the standard error: positive correlation buys precision.',
      preview: '\\( t = \\bar{D}\\,/\\,(S_D/\\sqrt{n}) \\)',
      formulas: [
        't = \\dfrac{\\bar{D} - \\mu_D}{S_D/\\sqrt{n}}, \\quad df = n - 1',
        '\\widehat{\\mathrm{SE}} = \\sqrt{\\dfrac{S_1^2 + S_2^2 - 2\\,r\\,S_1 S_2}{n}}'
      ],
      svg: `<svg viewBox="0 0 520 210" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Pre to post paired observations connected by lines">
  <line x1="120" y1="20" x2="120" y2="180" stroke="#6b7596" stroke-width="0.8"/>
  <line x1="400" y1="20" x2="400" y2="180" stroke="#6b7596" stroke-width="0.8"/>
  <text x="120" y="200" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" fill="#a9b2cc">pre</text>
  <text x="400" y="200" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" fill="#a9b2cc">post</text>
  <g stroke="#7c8cff" stroke-width="1.4" opacity="0.8">
    <line x1="120" y1="150" x2="400" y2="110"/>
    <line x1="120" y1="120" x2="400" y2="70"/>
    <line x1="120" y1="95" x2="400" y2="60"/>
    <line x1="120" y1="60" x2="400" y2="40"/>
  </g>
  <g fill="#ff5d8f"><circle cx="120" cy="150" r="4"/><circle cx="120" cy="120" r="4"/><circle cx="120" cy="95" r="4"/><circle cx="120" cy="60" r="4"/></g>
  <g fill="#34e3cf"><circle cx="400" cy="110" r="4"/><circle cx="400" cy="70" r="4"/><circle cx="400" cy="60" r="4"/><circle cx="400" cy="40" r="4"/></g>
</svg>`,
      figcap: 'Each line is one subject; the paired test models the within-subject change.',
      whenToUse: [
        'Pre/post designs measuring the same people twice.',
        'Matched-pairs or repeated single-factor comparisons.',
        'Whenever ignoring the pairing would waste the design’s power.'
      ]
    },
    {
      id: 'anova',
      num: '05',
      kind: 'Lecture · Walkthrough · 10 examples',
      color: 'var(--d1)',
      title: 'One-way ANOVA',
      subtitle: '單因子變異數分析 · partitioning variance into signal and noise',
      preview: '\\( F = MS_b / MS_w \\)',
      overview: 'With three or more groups, ANOVA splits the <strong>total variance</strong> into a between-groups part (differences among group means) and a within-groups part (noise inside each group). Their ratio of mean squares is the F-statistic. A large F says the between-group signal dwarfs the within-group noise.',
      formulas: [
        'SS_{\\text{total}} = SS_{\\text{between}} + SS_{\\text{within}}',
        'F = \\dfrac{MS_{\\text{between}}}{MS_{\\text{within}}}',
        '\\eta^2 = \\dfrac{SS_{\\text{between}}}{SS_{\\text{total}}}'
      ],
      svg: `<svg viewBox="0 0 520 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Total variance bar split into between and within parts">
  <text x="20" y="40" font-family="JetBrains Mono, monospace" font-size="10" fill="#a9b2cc">SS total</text>
  <rect x="20" y="50" width="480" height="34" rx="4" fill="#a9b2cc" opacity="0.25"/>
  <text x="20" y="120" font-family="JetBrains Mono, monospace" font-size="10" fill="#34e3cf">SS between (signal)</text>
  <rect x="20" y="130" width="300" height="34" rx="4" fill="#34e3cf" opacity="0.85"/>
  <text x="330" y="120" font-family="JetBrains Mono, monospace" font-size="10" fill="#ff5d8f">SS within (noise)</text>
  <rect x="328" y="130" width="172" height="34" rx="4" fill="#ff5d8f" opacity="0.7"/>
  <line x1="320" y1="46" x2="320" y2="172" stroke="#6b7596" stroke-width="1" stroke-dasharray="3,3"/>
</svg>`,
      figcap: 'F is large when the between-groups bar dominates the within-groups bar.',
      whenToUse: [
        'Comparing means across three or more independent groups.',
        'Quantifying effect size with η² after a significant F.',
        'Following up with post-hoc tests (e.g. Tukey HSD).'
      ]
    },
    {
      id: 'rmanova',
      num: '06',
      kind: 'Walkthrough · 10 studies',
      color: 'var(--d2)',
      title: 'Repeated-measures ANOVA',
      subtitle: '重複量數變異數分析 · removing individual differences',
      preview: '\\( F = MS_{\\text{cond}} / MS_{\\text{error}} \\)',
      overview: 'When every subject experiences every condition, the within-subjects variance splits again into a <strong>conditions</strong> part and an <strong>error</strong> part, after the stable between-subjects differences are removed. Pulling out individual differences sharpens the test, which is why repeated-measures designs are so powerful.',
      formulas: [
        'SS_{\\text{within-subj}} = SS_{\\text{conditions}} + SS_{\\text{error}}',
        'F = \\dfrac{MS_{\\text{conditions}}}{MS_{\\text{error}}}',
        '\\eta^2_{\\text{partial}} = \\dfrac{SS_{\\text{conditions}}}{SS_{\\text{conditions}} + SS_{\\text{error}}}'
      ],
      svg: `<svg viewBox="0 0 520 210" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Total variance split first by subjects then conditions and error">
  <text x="20" y="34" font-family="JetBrains Mono, monospace" font-size="10" fill="#a9b2cc">SS total</text>
  <rect x="20" y="42" width="480" height="28" rx="4" fill="#a9b2cc" opacity="0.22"/>
  <rect x="20" y="92" width="150" height="28" rx="4" fill="#6b7596" opacity="0.6"/>
  <text x="24" y="86" font-family="JetBrains Mono, monospace" font-size="9.5" fill="#6b7596">between subjects (removed)</text>
  <rect x="172" y="92" width="328" height="28" rx="4" fill="none" stroke="#a9b2cc" stroke-width="1" stroke-dasharray="3,3"/>
  <text x="176" y="150" font-family="JetBrains Mono, monospace" font-size="9.5" fill="#ffb74d">conditions</text>
  <rect x="172" y="158" width="210" height="28" rx="4" fill="#ffb74d" opacity="0.85"/>
  <text x="392" y="150" font-family="JetBrains Mono, monospace" font-size="9.5" fill="#ff5d8f">error</text>
  <rect x="390" y="158" width="110" height="28" rx="4" fill="#ff5d8f" opacity="0.6"/>
</svg>`,
      figcap: 'Individual differences are removed first; F compares conditions against error.',
      whenToUse: [
        'The same subjects measured under several conditions or times.',
        'Longitudinal or within-subject experimental designs.',
        'When between-subject noise would otherwise mask the effect.'
      ]
    },
    {
      id: 'ttof',
      num: '07',
      kind: 'Worked example · F table',
      color: 'var(--eig)',
      title: 'From t to F · one view',
      subtitle: '從 t 到 F · the same signal-over-noise idea',
      preview: '\\( t^2 = F \\)',
      overview: 'The t-test and ANOVA are not rival procedures. With exactly two groups, the F-statistic equals the square of the t-statistic: \\( t^2 = F \\). Both are a signal divided by an estimate of noise; ANOVA generalises the comparison to many groups at once. This is the lab’s framework in miniature: structure first, then a ratio.',
      formulas: [
        't^2 = F \\quad (\\text{for } k = 2 \\text{ groups})',
        'F = \\dfrac{MS_{\\text{between}}}{MS_{\\text{within}}}'
      ],
      svg: `<svg viewBox="0 0 520 180" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="t squared maps to F">
  <text x="120" y="100" text-anchor="middle" font-family="Fraunces, serif" font-style="italic" font-size="46" fill="#34e3cf">t²</text>
  <line x1="190" y1="88" x2="330" y2="88" stroke="#a9b2cc" stroke-width="1.6"/>
  <path d="M330,88 l-12,-6 v12 z" fill="#a9b2cc"/>
  <text x="260" y="74" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="12" fill="#6b7596">k = 2</text>
  <text x="400" y="100" text-anchor="middle" font-family="Fraunces, serif" font-style="italic" font-size="46" fill="#ff5d8f">F</text>
</svg>`,
      figcap: 'For two groups the two tests coincide: t² = F.',
      whenToUse: [
        'Seeing why a two-group ANOVA and a t-test agree.',
        'Connecting the t-table and the F-table through df.',
        'Framing all mean comparisons as signal over noise.'
      ]
    }
  ];
```

- [ ] **Step 2: 語法檢查（node 解析）**

Run: `node --check script.js`
Expected: 無輸出（語法正確）。若報未定義變數錯誤，注意此步只檢查語法不檢查執行。

- [ ] **Step 3: Commit**

```bash
git add script.js
git commit -m "Add teaching card data with recoloured dark-theme SVGs

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: 渲染卡片 + Modal 邏輯 + 接上 init

**Files:**
- Modify: `script.js`（擴充 `doRender` 接受元素；新增 `setupTeaching()`；在 `init()` 呼叫）

- [ ] **Step 1: 把 `doRender()` 改為可接受目標元素**

找到 `script.js` 中的 `function doRender() {`（約第 523 行），把 `renderMathInElement(document.body, {` 改為接受參數，預設 body：

將
```javascript
  function doRender() {
    try {
      renderMathInElement(document.body, {
```
改為
```javascript
  function doRender(root) {
    try {
      renderMathInElement(root || document.body, {
```

- [ ] **Step 2: 在 `/* ───────── init ───────── */` 之前新增 teaching 渲染與 Modal 邏輯**

```javascript
  /* ───────── teaching: cards + modal ───────── */
  function setupTeaching() {
    const grid = document.getElementById('teach-grid');
    if (!grid) return;

    // Build cards
    TEACH_CARDS.forEach(card => {
      const el = document.createElement('button');
      el.className = 'teach-card';
      el.type = 'button';
      el.style.setProperty('--c', card.color);
      el.setAttribute('aria-haspopup', 'dialog');
      el.setAttribute('aria-label', `Open: ${card.title}`);
      el.dataset.id = card.id;
      el.innerHTML =
        `<div class="tc-num">${card.num}</div>` +
        `<h3>${card.title}</h3>` +
        `<p class="tc-sub">${card.subtitle}</p>` +
        (card.preview ? `<div class="tc-preview">${card.preview}</div>` : '') +
        `<div class="tc-kind">${card.kind}</div>`;
      el.addEventListener('click', () => openModal(card, el));
      grid.appendChild(el);
    });

    // Render preview formulas inside the cards
    doRender(grid);

    // One reusable modal container
    const overlay = document.createElement('div');
    overlay.className = 'tm-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML = '<div class="tm-dialog" tabindex="-1"></div>';
    document.body.appendChild(overlay);
    const dialog = overlay.querySelector('.tm-dialog');

    let lastFocused = null;
    let rendered = {};

    function openModal(card, trigger) {
      lastFocused = trigger || null;
      overlay.style.setProperty('--c', card.color);
      dialog.setAttribute('aria-label', card.title);
      dialog.innerHTML = buildModalHTML(card);
      dialog.scrollTop = 0;
      overlay.classList.add('open');
      document.body.classList.add('tm-lock');
      if (!rendered[card.id]) {
        doRender(dialog);
        rendered[card.id] = true;
      }
      dialog.querySelector('.tm-close').addEventListener('click', closeModal);
      dialog.focus();
    }

    function closeModal() {
      overlay.classList.remove('open');
      document.body.classList.remove('tm-lock');
      if (lastFocused) lastFocused.focus();
    }

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (!overlay.classList.contains('open')) return;
      if (e.key === 'Escape') { closeModal(); return; }
      if (e.key === 'Tab') trapFocus(e);
    });

    function trapFocus(e) {
      const focusables = dialog.querySelectorAll('button, a[href], [tabindex]:not([tabindex="-1"])');
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    }
  }

  function buildModalHTML(card) {
    const formulas = card.formulas.map(f => `<div class="tm-eq">$$${f}$$</div>`).join('');
    const when = card.whenToUse.map(w => `<li>${w}</li>`).join('');
    const figure = card.svg
      ? `<div class="tm-label">Figure</div><div class="tm-figure">${card.svg}` +
        (card.figcap ? `<div class="tm-figcap">${card.figcap}</div>` : '') + `</div>`
      : '';
    return (
      `<div class="tm-top">` +
        `<span class="tm-tag">§ 07 · ${card.num}　${card.kind}</span>` +
        `<button class="tm-close" type="button" aria-label="Close">✕</button>` +
      `</div>` +
      `<h3>${card.title}</h3>` +
      `<p class="tm-subtitle">${card.subtitle}</p>` +
      `<div class="tm-label">Overview</div>` +
      `<div class="tm-overview">${card.overview}</div>` +
      `<div class="tm-label">Key formulas</div>` +
      `<div class="tm-formulas">${formulas}</div>` +
      figure +
      `<div class="tm-label">When to use</div>` +
      `<ul class="tm-when">${when}</ul>`
    );
  }
```

- [ ] **Step 3: 在 `init()` 內加上 `setupTeaching()`**

找到 `function init() {` 區塊，在 `setupFigures();` 後新增一行：

```javascript
  function init() {
    setupNav();
    setupReveal();
    setupScrollTop();
    setupCopyright();
    renderMath();
    setupFigures();
    setupTeaching();
  }
```

- [ ] **Step 4: 語法檢查**

Run: `node --check script.js`
Expected: 無輸出。

- [ ] **Step 5: 在瀏覽器驗證完整流程**

Run: 用 `browse` 開啟 `file:///Users/justin/lab website/teaching.html`
Expected:
- 7 張卡渲染，主題色左條輪替（teal/amber/pink/indigo…），卡面 inline 公式（如 SE = σ/√n）正確渲染為 KaTeX。
- 點任一卡 → Modal 彈出、深色面板、頂部主題色邊；標題、導讀、公式（置中、KaTeX）、SVG 圖（深色配色）、When to use 條列都正確。
- 點 ✕ / 點背景 / 按 Esc 都能關閉；關閉後焦點回到原卡片。
- 開 Modal 時背景不可捲動；Modal 內可捲動。
- 縮到手機寬度（≤600px）卡片單欄、Modal 不溢出、公式不橫向爆版。
- console 無錯誤。

- [ ] **Step 6: Commit**

```bash
git add script.js
git commit -m "Render teaching cards and wire up accessible modal

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: 在其餘 5 個現有頁面的 navbar 加入 Teaching 連結

**Files:**
- Modify: `index.html`, `framework.html`, `research.html`, `visuals.html`, `team.html`, `publications.html`

注意：每個檔案的 `<ul class="nav-menu" id="nav-menu">` 區塊都相同。在 `<li><a href="research.html">Research</a></li>` 與 `<li><a href="visuals.html">Figures</a></li>` 之間插入 Teaching。

- [ ] **Step 1: 對 6 個檔案做相同插入**

每個檔案把
```html
        <li><a href="research.html">Research</a></li>
        <li><a href="visuals.html">Figures</a></li>
```
改為
```html
        <li><a href="research.html">Research</a></li>
        <li><a href="teaching.html">Teaching</a></li>
        <li><a href="visuals.html">Figures</a></li>
```

逐檔處理：`index.html`、`framework.html`、`research.html`、`visuals.html`、`team.html`、`publications.html`。（teaching.html 本身在 Task 1 已含此項。）

- [ ] **Step 2: 驗證每頁導覽**

Run: 逐一在瀏覽器開啟 6 個頁面，或 grep 確認：
`grep -L 'teaching.html' index.html framework.html research.html visuals.html team.html publications.html`
Expected: 無輸出（代表 6 個檔案全都含 teaching.html 連結）。再目視一頁確認 nav 順序為 Home/Framework/Research/Teaching/Figures/Team/Publications，且當前頁高亮正常。

- [ ] **Step 3: Commit**

```bash
git add index.html framework.html research.html visuals.html team.html publications.html
git commit -m "Add Teaching link to navigation on all existing pages

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: 整體巡檢與收尾

**Files:** 無新增，僅驗證

- [ ] **Step 1: 跨頁巡檢**

Run: 用 `browse` 依序開啟所有頁面，逐項確認：
- 從首頁 nav 點 Teaching 能到達；Teaching 頁 nav 高亮在 Teaching。
- 7 張卡全部可開、可關；7 個 Modal 的公式與 SVG 都正確。
- Figures 頁（visuals.html）的 Plotly 圖仍正常（確認改動 `doRender`/`init` 未影響既有功能）。
- 首頁與其他頁的 KaTeX 公式仍正常渲染（doRender 改參數後預設 body 行為不變）。

Expected: 全部通過，無 console 錯誤。

- [ ] **Step 2: 文案巡檢（符合既有偏好）**

檢查 teaching.html 與卡片資料文案：無破折號 em dash（用一般連字號或重寫）、無刪節號、無刻意 rule-of-three、無「not X but Y」句式。

Run: `grep -n '—\|…\|not .* but ' script.js teaching.html`
Expected: 審視每個命中處；破折號（—, U+2014）一律改寫。注意 SVG/公式內的減號是 `-` 不受影響。

- [ ] **Step 3: 最終 commit（如有文案修正）**

```bash
git add -A
git commit -m "Polish Teaching copy to match house style

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## 完成定義

- `teaching.html` 上線，7 張主題卡可點開深色 Modal，內含導讀、KaTeX 公式、深色 SVG 圖、適用情境。
- 6 個既有頁面 nav 都有 Teaching 連結且順序正確。
- 既有頁面（Figures 的 Plotly、各頁 KaTeX）功能未受影響。
- 手機版不溢出、公式不爆版。
- 文案符合 house style。
