# Figures 頁 NLP 互動圖 — 實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 Figures 頁（visuals.html）新增 `§ 05 — Text Mining / NLP` 區塊，放兩張互動圖：N-gram 力導向網路圖（D3.js，含搜尋）與情感分析散點分類圖（Plotly，含決策邊界）。

**Architecture:** visuals.html 加一個 `<section id="nlp">`，含兩個 `.viz` 大容器（規格同既有 § 03）。N-gram 圖用 D3.js v7（CDN，新增 `ensureD3()` loader + `setupNgramNetwork()`，在 init 呼叫）。情感散點用既有 Plotly（加進 `FIGURE_BUILDERS` 字典，由既有 `setupFigures()` 自動繪製）。資料全用既有 `mulberry32` 種子亂數生成，主題為語言學習。純前端、無後端。

**Tech Stack:** D3.js v7、Plotly（既有）、KaTeX（既有）、原生 JS（IIFE，script.js）。

**驗證方式：** 無測試框架。每 Task 用 `node -e "new Function(require('fs').readFileSync('script.js','utf8'))"` 語法檢查 + gstack headless browse（`~/.claude/skills/gstack/browse/dist/browse`）開 `http://localhost:8000/visuals.html` 截圖/JS 探針。本機 `python3 -m http.server 8000`。每 Task commit。

**色彩常數（沿用）：** 青 `#34e3cf`(--d1)、橘 `#ffb74d`(--d2)、粉 `#ff5d8f`(--d3)、靛 `#7c8cff`(--eig)；文字 `#e9e7dd`/`#a9b2cc`/`#6b7596`。

**文案風格：** 英文文案不用 em dash、省略號、rule-of-three、not X but Y。

---

## Task 1: visuals.html 加 § 05 區塊骨架 + D3 CDN

**Files:** Modify `visuals.html`

- [ ] **Step 1: head 加 D3.js CDN**

在 KaTeX script 之後、`</head>` 之前加入：
```html
  <script defer src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.9.0/d3.min.js"></script>
```
驗證可達：`curl -s -o /dev/null -w "%{http_code}\n" https://cdnjs.cloudflare.com/ajax/libs/d3/7.9.0/d3.min.js` 應為 200。若非 200 回報 BLOCKED。

- [ ] **Step 2: § 04 gallery 的 `</section>` 之後、`</main>` 之前插入 § 05**

```html
    <!-- TEXT MINING / NLP -->
    <section id="nlp" class="section-lg">
      <div class="wrap">
        <div class="section-marker" data-rise><span class="marker-dot"></span><span class="marker-id">§ 05</span> Text mining · NLP · two interactive figures</div>
        <div class="sec-head" data-rise>
          <div class="sec-index">§ 05</div>
          <div class="sec-body">
            <div class="eyebrow">From the text mining course</div>
            <h2>Text mining &amp; <em style="background:linear-gradient(100deg,var(--d1),var(--eig) 45%,var(--d3));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;font-style:italic;font-weight:500">NLP</em></h2>
            <p class="lead">Two interactive figures from the lab's text mining work on learner language: a co-occurrence network you can pull apart and a sentiment map you can read point by point.</p>
          </div>
        </div>

        <!-- Figure I -->
        <div class="viz" data-rise>
          <div class="viz-head"><div><div class="fignum">Figure I</div><h3>N-gram co-occurrence network</h3></div></div>
          <p class="viz-desc">
            A bigram co-occurrence network built from a simulated corpus of English-learning text. Each node is a word sized by frequency, each link a pair that co-occurs, and the colours mark three themes the lab tracks: skills, affect, and instruction. Drag a node to pull the web apart, hover to light up its strongest collocates, or search for a word to find it.
          </p>
          <div class="ngram-controls">
            <input type="search" id="ngram-search" class="ngram-search" placeholder="Search a word…" autocomplete="off" aria-label="Search a word in the network">
          </div>
          <div id="fig-ngram" class="plot"></div>
          <div class="viz-eq">\[ \mathrm{PMI}(w_1,w_2)=\log\dfrac{P(w_1,w_2)}{P(w_1)\,P(w_2)} \]</div>
          <div class="viz-foot">
            <span class="chip"><span class="dot" style="background:var(--d1)"></span>Skills</span>
            <span class="chip"><span class="dot" style="background:var(--eig)"></span>Affect</span>
            <span class="chip"><span class="dot" style="background:var(--d2)"></span>Instruction</span>
            <span class="chip"><span class="dot" style="background:var(--ink-faint)"></span>link — co-occurrence</span>
          </div>
        </div>

        <!-- Figure J -->
        <div class="viz" data-rise>
          <div class="viz-head"><div><div class="fignum">Figure J</div><h3>Sentiment classification of learner feedback</h3></div></div>
          <p class="viz-desc">
            A simulated set of learner feedback comments, each placed by sentiment polarity and subjectivity, then classified positive, neutral, or negative. The shaded bands are the decision regions a classifier learns. Hover a point to read the comment and its score, or use the legend to isolate a class.
          </p>
          <div id="fig-sentiment" class="plot"></div>
          <div class="viz-eq">\[ P(\text{class}\mid\mathbf{x})=\operatorname{softmax}(\mathbf{W}\mathbf{x}+\mathbf{b}) \]</div>
          <div class="viz-foot">
            <span class="chip"><span class="dot" style="background:var(--d1)"></span>Positive</span>
            <span class="chip"><span class="dot" style="background:var(--eig)"></span>Neutral</span>
            <span class="chip"><span class="dot" style="background:var(--d3)"></span>Negative</span>
            <span class="chip"><span class="dot" style="background:var(--ink-faint)"></span>x — polarity · y — subjectivity</span>
          </div>
        </div>
      </div>
    </section>
```

- [ ] **Step 3: 目視驗證骨架** — 起 server，gstack browse 開 visuals.html 捲到底，確認 § 05 出現（標題、兩個 .viz、搜尋框、公式、chips），其他內容正常。

- [ ] **Step 4: Commit**
```bash
cd "/Users/justin/lab website"
git add visuals.html
git commit -m "Add NLP figures section skeleton to Figures page

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

## Task 2: 情感分析散點分類圖（Plotly + 決策邊界）

**Files:** Modify `script.js`

- [ ] **Step 1: 在 gH 之後、`const FIGURE_BUILDERS` 之前加入 buildSentiment**

```javascript
  /* Sentiment classification scatter (Plotly) — simulated learner feedback */
  function buildSentiment() {
    const rng = mulberry32(50607);
    const POS = [
      'Speaking practice really boosted my confidence.',
      'The vocabulary games made learning fun.',
      'I finally understand the grammar rules.',
      'My listening improved a lot this term.',
      'The teacher feedback was clear and helpful.',
      'Group discussion made me more fluent.',
      'I enjoy reading short stories in English now.',
      'Pronunciation drills paid off.',
    ];
    const NEU = [
      'The class covered tenses and articles.',
      'We submitted a writing assignment weekly.',
      'The textbook has ten units.',
      'Lectures are on Monday and Wednesday.',
      'I used a dictionary app for new words.',
      'The exam had reading and listening parts.',
    ];
    const NEG = [
      'The pace was too fast for me.',
      'I felt anxious during oral tests.',
      'Too much homework this semester.',
      'The grammar explanations confused me.',
      'I struggle to follow native speakers.',
      'Speaking in front of class made me nervous.',
    ];
    const classes = [
      { name: 'Positive', color: '#34e3cf', center: 0.55, spread: 0.28, n: 56, texts: POS },
      { name: 'Neutral',  color: '#7c8cff', center: 0.0,  spread: 0.18, n: 40, texts: NEU },
      { name: 'Negative', color: '#ff5d8f', center: -0.55, spread: 0.28, n: 48, texts: NEG },
    ];
    const traces = classes.map(c => {
      const xs = [], ys = [], sizes = [], hover = [];
      for (let i = 0; i < c.n; i++) {
        let x = c.center + (rng() - 0.5) * 2 * c.spread + 0.5 * (rng() - 0.5) * c.spread;
        x = Math.max(-1, Math.min(1, x));
        const y = clamp01(0.45 + 0.4 * (rng() - 0.5) + 0.25 * Math.abs(x));
        const txt = c.texts[Math.floor(rng() * c.texts.length)];
        xs.push(x); ys.push(y);
        sizes.push(7 + Math.round(8 * (0.4 + 0.6 * rng())));
        hover.push(`"${txt}"<br>polarity ${x>=0?'+':''}${x.toFixed(2)} · subjectivity ${y.toFixed(2)}`);
      }
      return {
        x: xs, y: ys, mode: 'markers', type: 'scatter', name: c.name,
        marker: { size: sizes, color: c.color, line: { color: 'rgba(7,11,22,0.6)', width: 1 }, opacity: 0.85 },
        text: hover, hovertemplate: '%{text}<extra></extra>',
      };
    });
    const bands = [
      { x0: -1, x1: -0.2, color: 'rgba(255,93,143,0.07)' },
      { x0: -0.2, x1: 0.2, color: 'rgba(124,140,255,0.07)' },
      { x0: 0.2, x1: 1, color: 'rgba(52,227,207,0.07)' },
    ];
    const shapes = bands.map(b => ({
      type: 'rect', xref: 'x', yref: 'paper', x0: b.x0, x1: b.x1, y0: 0, y1: 1,
      fillcolor: b.color, line: { width: 0 }, layer: 'below',
    }));
    const lay = LAYOUT2D('Sentiment polarity', 'Subjectivity', {
      xaxis: Object.assign(ax2('Sentiment polarity'), { range: [-1.05, 1.05], zeroline: false }),
      yaxis: Object.assign(ax2('Subjectivity'), { range: [0, 1] }),
      shapes,
      showlegend: true,
      legend: { font: { family: 'JetBrains Mono', size: 10, color: '#a9b2cc' }, bgcolor: 'rgba(0,0,0,0)', orientation: 'h', y: 1.08 },
    });
    Plotly.newPlot('fig-sentiment', traces, lay, CONF);
  }
```
注意：`mulberry32`、`clamp01`、`LAYOUT2D`、`ax2`、`CONF` 都是 script.js 既有 IIFE 內函式/常數。

- [ ] **Step 2: 把 fig-sentiment 註冊進 FIGURE_BUILDERS**

把：
```javascript
  const FIGURE_BUILDERS = {
    fig1: buildFig1, fig2: buildFig2, fig3: buildFig3,
    gA, gB, gC, gD, gE, gF, gG, gH
  };
```
改為：
```javascript
  const FIGURE_BUILDERS = {
    fig1: buildFig1, fig2: buildFig2, fig3: buildFig3,
    gA, gB, gC, gD, gE, gF, gG, gH,
    'fig-sentiment': buildSentiment
  };
```

- [ ] **Step 3: 語法檢查 + 瀏覽器驗證** — `node -e "new Function(require('fs').readFileSync('script.js','utf8')); console.log('OK')"` 須 OK。重整 visuals.html 捲到 Figure J：三色散點分佈、背景三決策色帶（左粉/中靛/右青）、hover 顯示評論全文+分數、圖例可開關。console 無錯。

- [ ] **Step 4: Commit**
```bash
cd "/Users/justin/lab website"
git add script.js
git commit -m "Add sentiment classification scatter figure (Plotly)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

## Task 3: N-gram 圖 CSS + D3 loader 骨架

**Files:** Modify `styles.css`, `script.js`

- [ ] **Step 1: styles.css 末端加 N-gram 樣式**
```css

/* ============================================================
   === FIGURES — N-gram network (D3) ===
   ============================================================ */
.ngram-controls { margin: 0 0 10px; }
.ngram-search {
  width: min(280px, 100%); font-family: 'JetBrains Mono', monospace; font-size: 13px;
  color: var(--ink); background: rgba(11,17,36,0.7); border: 1px solid var(--line);
  border-radius: 999px; padding: 9px 16px; outline: none; transition: border-color .15s;
}
.ngram-search:focus { border-color: rgba(124,140,255,0.6); }
.ngram-search::placeholder { color: var(--ink-faint); }
#fig-ngram svg { width: 100%; height: 100%; display: block; cursor: grab; }
#fig-ngram .ng-link { stroke: rgba(150,170,220,0.22); transition: stroke .2s, stroke-opacity .2s; }
#fig-ngram .ng-link.hot { stroke: var(--d1); stroke-opacity: 0.9; }
#fig-ngram .ng-node circle { stroke: rgba(7,11,22,0.7); stroke-width: 1.5; cursor: pointer; transition: opacity .2s; }
#fig-ngram .ng-node text { font-family: 'JetBrains Mono', monospace; fill: var(--ink-soft); pointer-events: none; transition: fill .2s, opacity .2s; }
#fig-ngram .dim { opacity: 0.12; }
.ng-tooltip {
  position: absolute; pointer-events: none; z-index: 5; padding: 7px 11px; border-radius: 8px;
  background: rgba(11,17,36,0.95); border: 1px solid var(--line); color: var(--ink);
  font-family: 'JetBrains Mono', monospace; font-size: 11px; line-height: 1.5; opacity: 0; transition: opacity .15s;
}
```

- [ ] **Step 2: script.js 在 ensurePlotly 之後加 ensureD3()**
```javascript
  async function ensureD3() {
    if (window.d3) return true;
    try { await loadScript('https://cdnjs.cloudflare.com/ajax/libs/d3/7.9.0/d3.min.js'); } catch (e) { /* may already be loading via the defer tag */ }
    for (let i = 0; i < 20 && !window.d3; i++) { await new Promise(r => setTimeout(r, 50)); }
    return !!window.d3;
  }
```

- [ ] **Step 3: 在 setupFigures 之後加 setupNgramNetwork 骨架**
```javascript
  async function setupNgramNetwork() {
    const el = document.getElementById('fig-ngram');
    if (!el) return;
    const ok = await ensureD3();
    if (!ok) {
      el.innerHTML = `<div style="height:100%;display:flex;align-items:center;justify-content:center;font-family:'JetBrains Mono',monospace;font-size:.82rem;color:#6b7596;text-align:center;padding:24px">Network figure needs an internet connection to load D3.<br>Reconnect and refresh.</div>`;
      return;
    }
    el.innerHTML = '';
    drawNgramNetwork(el);
  }
  function drawNgramNetwork(el) {
    el.innerHTML = '<div style="height:100%;display:flex;align-items:center;justify-content:center;color:#6b7596;font-family:monospace">d3 ready</div>';
  }
```

- [ ] **Step 4: init() 的 `setupFigures();` 之後加** `setupNgramNetwork();`

- [ ] **Step 5: 語法檢查 + CSS 平衡 + 驗證** — `node -e "new Function(require('fs').readFileSync('script.js','utf8')); console.log('OK')"`；CSS 平衡檢查；重整頁面 Figure I 顯示「d3 ready」；console 無錯。

- [ ] **Step 6: Commit**
```bash
cd "/Users/justin/lab website"
git add script.js styles.css
git commit -m "Add D3 loader and n-gram network scaffold plus styles

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

## Task 4: N-gram 完整 D3 繪製 + 拖曳 + hover + 搜尋

**Files:** Modify `script.js`（替換 `drawNgramNetwork`）

- [ ] **Step 1: 把 drawNgramNetwork 換成完整實作**
```javascript
  function drawNgramNetwork(el) {
    const rng = mulberry32(81321);
    const GROUPS = { skills: '#34e3cf', affect: '#7c8cff', instr: '#ffb74d' };
    const WORDS = [
      ['speaking','skills'],['listening','skills'],['reading','skills'],['writing','skills'],
      ['vocabulary','skills'],['grammar','skills'],['pronunciation','skills'],['fluency','skills'],
      ['practice','skills'],['language','skills'],['English','skills'],['learning','skills'],
      ['motivation','affect'],['confidence','affect'],['anxiety','affect'],['interest','affect'],
      ['enjoyment','affect'],['effort','affect'],['attitude','affect'],
      ['teacher','instr'],['feedback','instr'],['classroom','instr'],['student','instr'],
      ['lesson','instr'],['homework','instr'],['exam','instr'],['textbook','instr'],['course','instr'],
    ];
    const nodes = WORDS.map(([id, group]) => ({ id, group, color: GROUPS[group], freq: 6 + Math.floor(rng() * 18) }));
    const byId = Object.fromEntries(nodes.map(n => [n.id, n]));
    const PAIRS = [
      ['language','learning',9],['English','learning',8],['speaking','practice',7],
      ['listening','practice',6],['vocabulary','grammar',6],['reading','writing',5],
      ['speaking','fluency',6],['pronunciation','speaking',5],['language','English',7],
      ['motivation','effort',6],['confidence','speaking',6],['anxiety','speaking',5],
      ['motivation','interest',6],['enjoyment','motivation',5],['attitude','motivation',5],
      ['teacher','feedback',7],['feedback','student',6],['classroom','teacher',6],
      ['homework','course',5],['exam','course',5],['lesson','classroom',5],['textbook','course',4],
      ['practice','confidence',5],['feedback','learning',5],['grammar','exam',4],
      ['vocabulary','reading',5],['fluency','confidence',4],['student','motivation',4],
    ];
    const links = PAIRS.filter(([a,b]) => byId[a] && byId[b]).map(([a,b,w]) => ({ source: a, target: b, w }));

    const rect = el.getBoundingClientRect();
    const W = Math.max(320, rect.width), H = Math.max(360, rect.height || 460);
    const d3 = window.d3;

    const svg = d3.select(el).append('svg')
      .attr('viewBox', `0 0 ${W} ${H}`).attr('preserveAspectRatio', 'xMidYMid meet');
    const tip = d3.select(el).append('div').attr('class', 'ng-tooltip');

    const link = svg.append('g').selectAll('line').data(links).join('line')
      .attr('class', 'ng-link').attr('stroke-width', d => Math.sqrt(d.w));

    const node = svg.append('g').selectAll('g').data(nodes).join('g').attr('class', 'ng-node');
    node.append('circle').attr('r', d => 5 + d.freq * 0.6).attr('fill', d => d.color);
    node.append('text').text(d => d.id).attr('x', d => 8 + d.freq * 0.6).attr('y', 4)
      .attr('font-size', d => 10 + d.freq * 0.15);

    const sim = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(70).strength(0.5))
      .force('charge', d3.forceManyBody().strength(-220))
      .force('center', d3.forceCenter(W / 2, H / 2))
      .force('collide', d3.forceCollide().radius(d => 14 + d.freq * 0.6));

    sim.on('tick', () => {
      link.attr('x1', d => d.source.x).attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    node.call(d3.drag()
      .on('start', (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
      .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y; })
      .on('end', (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; }));

    const nbr = {};
    nodes.forEach(n => nbr[n.id] = new Set([n.id]));
    links.forEach(l => {
      const s = l.source.id || l.source, t = l.target.id || l.target;
      nbr[s].add(t); nbr[t].add(s);
    });

    function highlight(id) {
      if (!id) { node.classed('dim', false); link.classed('hot', false).classed('dim', false); return; }
      node.classed('dim', d => !nbr[id].has(d.id));
      link.classed('hot', l => (l.source.id === id || l.target.id === id))
          .classed('dim', l => !(l.source.id === id || l.target.id === id));
    }

    node.on('mouseenter', (e, d) => {
      highlight(d.id);
      const best = links.filter(l => l.source.id === d.id || l.target.id === d.id).sort((a, b) => b.w - a.w)[0];
      const mate = best ? (best.source.id === d.id ? best.target.id : best.source.id) : '—';
      tip.style('opacity', 1).html(`<b style="color:${d.color}">${d.id}</b><br>top collocate: ${mate}`);
    }).on('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      tip.style('left', (e.clientX - r.left + 12) + 'px').style('top', (e.clientY - r.top + 12) + 'px');
    }).on('mouseleave', () => { highlight(null); tip.style('opacity', 0); });

    const search = document.getElementById('ngram-search');
    if (search) search.addEventListener('input', () => {
      const q = search.value.trim().toLowerCase();
      if (!q) { highlight(null); return; }
      const hit = nodes.find(n => n.id.toLowerCase().includes(q));
      if (hit) {
        highlight(hit.id);
        hit.fx = W / 2; hit.fy = H / 2; sim.alphaTarget(0.3).restart();
        setTimeout(() => { hit.fx = null; hit.fy = null; sim.alphaTarget(0); }, 1200);
      } else { node.classed('dim', true); link.classed('dim', true); }
    });

    sim.alpha(1).restart();
  }
```
注意：`mulberry32` 是既有函式；`ngram-search` 是 Task 1 的搜尋框 id。

- [ ] **Step 2: 語法檢查 + 瀏覽器驗證** — `node -e "..."` 須 OK。重整 visuals.html 捲到 Figure I：約 28 節點（青/靛/橘三群）自動散開、拖曳重排、hover 高亮鄰居+tooltip、搜尋 "speaking" 聚焦。console 無錯。JS 探針 `document.querySelectorAll('#fig-ngram .ng-node').length` 約 28。

- [ ] **Step 3: Commit**
```bash
cd "/Users/justin/lab website"
git add script.js
git commit -m "Implement n-gram force-directed network with drag, hover, search

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

## Task 5: 打磨與 RWD 驗證

**Files:** Modify `script.js` / `styles.css`（僅發現問題時小修）

- [ ] **Step 1: 桌機走查** — § 05 兩圖都正常精美、與站點一致；§ 03/§ 04 未受影響；console 無 error。
- [ ] **Step 2: 行動裝置走查（720px 以下，iframe 700px）** — 兩 .viz 自適應、無水平溢出；N-gram svg viewBox 縮放、搜尋框不溢出；散點 Plotly responsive；`document.body.scrollWidth <= clientWidth`。
- [ ] **Step 3: 若發現問題做最小修正** — 只針對實際問題小修，每修重驗；無則跳過。
- [ ] **Step 4: 關閉本機伺服器**
- [ ] **Step 5: Commit（若有打磨改動）**
```bash
cd "/Users/justin/lab website"
git add -A
git commit -m "Polish NLP figures and verify responsive layout

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## 完成定義

- [ ] visuals.html 有 § 05 Text Mining / NLP 區塊，兩張大互動圖。
- [ ] Figure I：D3 力導向網路（節點=詞、連線=bigram、主題上色），拖曳/hover 高亮鄰居/自動散開/搜尋詞聚焦。
- [ ] Figure J：Plotly 散點（polarity×subjectivity、三類顏色），hover 顯示模擬評論全文/圖例篩選/決策邊界色帶。
- [ ] 資料全程式生成（語言學習主題、mulberry32 種子）、純前端、無後端。
- [ ] 引入 D3.js（網路圖），情感圖用既有 Plotly。
- [ ] 沿用既有色彩/字體/.viz 樣式；RWD 正常；console 無錯；英文文案符合風格約束。
