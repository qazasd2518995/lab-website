# § 05 NLP 三張新圖（Topic / Time Series / Spectrogram）— 實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 Figures 頁 § 05 NLP 區塊（NRC 雷達之後）再加三張互動 Plotly 圖：Topic Model（LDA 熱力圖+佔比）、Time Series（學期週次多線趨勢）、Spectrogram（頻譜熱力圖+pitch 線）。

**Architecture:** 三個 `buildXxx()` 函式加進 `script.js`，註冊到既有 `FIGURE_BUILDERS` 字典，由 `setupFigures()` 自動載入 Plotly 並繪製。visuals.html 在 Figure J 後加三個 `.viz` 區塊。全用既有 Plotly（heatmap/scatter/bar）、`mulberry32` 種子、`LAYOUT2D`/`ax2`/`CONF` helper。純前端、無後端。

**Tech Stack:** Plotly（既有）、KaTeX（既有）、原生 JS（IIFE，script.js）。

**驗證方式：** 無測試框架。每 Task `node -e "new Function(require('fs').readFileSync('script.js','utf8'))"` 語法檢查 + gstack headless browse（`~/.claude/skills/gstack/browse/dist/browse`）開 `http://localhost:8000/visuals.html` 用 JS 探針驗證（screenshot 在本環境不穩，主要靠探針確認 traces/type/plotted）。本機 `python3 -m http.server 8000`。每 Task commit。

**色彩常數（沿用）：** 青 `#34e3cf`(--d1)、橘 `#ffb74d`(--d2)、粉 `#ff5d8f`(--d3)、靛 `#7c8cff`(--eig)；文字 `#e9e7dd`/`#a9b2cc`/`#6b7596`。
**文案風格：** prose 無 em dash/省略號/rule-of-three/not X but Y（viz-foot chip 的「x — time」是站內既有慣例，保留）。

---

## Task 1: visuals.html 加三個 .viz 區塊骨架

**Files:** Modify `visuals.html`

- [ ] **Step 1: 在 Figure J 的 .viz 結束之後插入三個 .viz**

先 Read visuals.html 找到 Figure J 的 `.viz` 區塊結束（後面接 wrap 的 `</div>` 然後 `</section>`）。在 Figure J 那個 `.viz` 的結束 `</div>` 之後插入：

```html
        <!-- Figure K -->
        <div class="viz" data-rise>
          <div class="viz-head"><div><div class="fignum">Figure K</div><h3>Topic model of the learner corpus</h3></div></div>
          <p class="viz-desc">
            A latent Dirichlet allocation over simulated learner writing. The left heatmap shows how strongly each word loads on each of five topics, and the right bars show how three sample documents split across those topics. Hover a cell to read its topic, word, and weight.
          </p>
          <div id="fig-topic" class="plot"></div>
          <div class="viz-eq">\[ \theta_d\sim\mathrm{Dir}(\alpha),\quad z_{dn}\sim\mathrm{Mult}(\theta_d),\quad w_{dn}\sim\mathrm{Mult}(\beta_{z_{dn}}) \]</div>
          <div class="viz-foot">
            <span class="chip"><span class="dot" style="background:var(--d1)"></span>topic-word weight β</span>
            <span class="chip"><span class="dot" style="background:var(--ink-faint)"></span>rows — topics · cols — words</span>
          </div>
        </div>

        <!-- Figure L -->
        <div class="viz" data-rise>
          <div class="viz-head"><div><div class="fignum">Figure L</div><h3>Affect and topics over a term</h3></div></div>
          <p class="viz-desc">
            Four indices tracked across a sixteen-week term: confidence and joy climbing, anxiety easing, and the speaking topic rising and falling around assessment. The dashed marker is the midterm week. Click a legend entry to toggle a line, or hover to read a week.
          </p>
          <div id="fig-timeseries" class="plot"></div>
          <div class="viz-eq">\[ \bar{x}_t=\frac{1}{k}\sum_{i=0}^{k-1}x_{t-i} \]</div>
          <div class="viz-foot">
            <span class="chip"><span class="dot" style="background:var(--d1)"></span>Confidence</span>
            <span class="chip"><span class="dot" style="background:var(--d2)"></span>Joy</span>
            <span class="chip"><span class="dot" style="background:var(--d3)"></span>Anxiety</span>
            <span class="chip"><span class="dot" style="background:var(--eig)"></span>Speaking topic</span>
          </div>
        </div>

        <!-- Figure M -->
        <div class="viz" data-rise>
          <div class="viz-head"><div><div class="fignum">Figure M</div><h3>Speech spectrogram with pitch contour</h3></div></div>
          <p class="viz-desc">
            A simulated spectrogram of a short spoken phrase: time runs left to right, frequency bottom to top, and colour is energy. The bright horizontal bands are vowel formants, the brief broadband flecks are consonants, and the white curve traces the pitch (F0) as intonation rises and falls. Hover to read frequency and energy.
          </p>
          <div id="fig-spectrogram" class="plot"></div>
          <div class="viz-eq">\[ X(t,f)=\Big|\sum_n x[n]\,w[n-t]\,e^{-j2\pi f n}\Big|^2 \]</div>
          <div class="viz-foot">
            <span class="chip"><span class="dot" style="background:var(--d2)"></span>energy (dB)</span>
            <span class="chip"><span class="dot" style="background:#ffffff"></span>pitch F0</span>
            <span class="chip"><span class="dot" style="background:var(--ink-faint)"></span>x — time · y — frequency</span>
          </div>
        </div>
```

- [ ] **Step 2: 目視驗證骨架** — 起 server，browse 開 visuals.html 捲到底，確認 Figure K/L/M 三個 .viz 容器出現（圖暫空）。`grep -c 'fig-topic\|fig-timeseries\|fig-spectrogram' visuals.html` 應為 3。

- [ ] **Step 3: Commit**
```bash
cd "/Users/justin/lab website"
git add visuals.html
git commit -m "Add Figure K/L/M containers to NLP section

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

## Task 2: Figure K — Topic Model（LDA 熱力圖 + 文件佔比）

**Files:** Modify `script.js`

- [ ] **Step 1: 在 buildNRC 之後、`const FIGURE_BUILDERS` 之前加入 buildTopicModel**

```javascript
  /* Topic model (Plotly heatmap + doc-topic bars) — simulated LDA over learner writing */
  function buildTopicModel() {
    const rng = mulberry32(31607);
    const topics = ['Speaking & Fluency', 'Grammar & Accuracy', 'Motivation & Affect', 'Assessment & Feedback', 'Reading & Vocabulary'];
    const words = ['speaking','fluency','practice','grammar','accuracy','error','motivation','confidence','anxiety','feedback','exam','reading','vocabulary'];
    const peaks = {
      'Speaking & Fluency': ['speaking','fluency','practice'],
      'Grammar & Accuracy': ['grammar','accuracy','error'],
      'Motivation & Affect': ['motivation','confidence','anxiety'],
      'Assessment & Feedback': ['feedback','exam','error'],
      'Reading & Vocabulary': ['reading','vocabulary','practice'],
    };
    const z = topics.map(t => words.map(w => {
      const base = peaks[t].includes(w) ? 0.7 + 0.25 * rng() : 0.05 + 0.18 * rng();
      return Math.round(base * 100) / 100;
    }));
    const heat = {
      type: 'heatmap', z, x: words, y: topics, xgap: 2, ygap: 2,
      colorscale: [[0, 'rgba(11,17,36,0.2)'], [0.5, '#7c8cff'], [1, '#34e3cf']],
      colorbar: { title: { text: 'β', font: { color: '#a9b2cc', family: 'JetBrains Mono', size: 11 } },
        tickfont: { color: '#6b7596', family: 'JetBrains Mono', size: 9 }, thickness: 10, len: 0.9 },
      hovertemplate: 'topic %{y}<br>word %{x}<br>weight %{z}<extra></extra>',
      xaxis: 'x', yaxis: 'y',
    };
    const docs = ['Doc 1', 'Doc 2', 'Doc 3'];
    const theta = [
      [0.45, 0.10, 0.20, 0.15, 0.10],
      [0.10, 0.40, 0.10, 0.25, 0.15],
      [0.15, 0.15, 0.35, 0.10, 0.25],
    ];
    const tColors = ['#34e3cf', '#ffb74d', '#ff5d8f', '#7c8cff', '#9aa6d8'];
    const barTraces = topics.map((t, ti) => ({
      type: 'bar', orientation: 'h', name: t,
      y: docs, x: docs.map((_, di) => theta[di][ti]),
      marker: { color: tColors[ti] },
      xaxis: 'x2', yaxis: 'y2', showlegend: false,
      hovertemplate: t + '<br>%{y}: %{x:.0%}<extra></extra>',
    }));
    const lay = {
      paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
      font: { family: 'Spectral', color: '#e9e7dd' },
      margin: { l: 130, r: 20, t: 20, b: 80 },
      barmode: 'stack',
      grid: { rows: 1, columns: 2, pattern: 'independent', columnorder: [1, 2] },
      xaxis: { domain: [0, 0.66], tickfont: { family: 'JetBrains Mono', size: 9, color: '#6b7596' }, tickangle: -45 },
      yaxis: { domain: [0, 1], tickfont: { family: 'JetBrains Mono', size: 10, color: '#a9b2cc' }, automargin: true },
      xaxis2: { domain: [0.76, 1], range: [0, 1], tickformat: '.0%', tickfont: { family: 'JetBrains Mono', size: 9, color: '#6b7596' }, title: { text: 'doc-topic θ', font: { color: '#a9b2cc', family: 'JetBrains Mono', size: 10 } } },
      yaxis2: { domain: [0, 1], tickfont: { family: 'JetBrains Mono', size: 10, color: '#a9b2cc' } },
    };
    Plotly.newPlot('fig-topic', [heat, ...barTraces], lay, CONF);
  }
```
注意：`mulberry32`、`CONF` 是既有。用 Plotly subplot（grid + xaxis/xaxis2）把熱力圖與堆疊條並排。

- [ ] **Step 2: 註冊進 FIGURE_BUILDERS**

找到：
```javascript
    gA, gB, gC, gD, gE, gF, gG, gH,
    'fig-sentiment': buildNRC
  };
```
改為：
```javascript
    gA, gB, gC, gD, gE, gF, gG, gH,
    'fig-sentiment': buildNRC,
    'fig-topic': buildTopicModel
  };
```

- [ ] **Step 3: 語法檢查 + 瀏覽器驗證**

`node -e "new Function(require('fs').readFileSync('script.js','utf8')); console.log('OK')"` 須 OK。
browse 探針：`(()=>{const el=document.getElementById('fig-topic'); return JSON.stringify({plotted:el.dataset.plotted, traces:(el.data||[]).length, type0:(el.data||[])[0]?el.data[0].type:null})})()` 應 plotted=1、traces=6、type0='heatmap'。console 無錯。

- [ ] **Step 4: Commit**
```bash
cd "/Users/justin/lab website"
git add script.js
git commit -m "Add topic model figure (LDA heatmap + doc-topic bars)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

## Task 3: Figure L — Time Series（學期週次多線趨勢）

**Files:** Modify `script.js`

- [ ] **Step 1: 在 buildTopicModel 之後、`const FIGURE_BUILDERS` 之前加入 buildTimeSeries**

```javascript
  /* Affect and topic time series (Plotly lines) — sixteen-week term */
  function buildTimeSeries() {
    const rng = mulberry32(42607);
    const weeks = Array.from({ length: 16 }, (_, i) => i + 1);
    const noise = (a) => (rng() - 0.5) * 2 * a;
    const confidence = weeks.map(w => clamp01(0.35 + 0.035 * w + noise(0.04)));
    const joy = weeks.map(w => clamp01(0.45 + 0.025 * w + noise(0.05)));
    const anxiety = weeks.map(w => clamp01(0.7 - 0.03 * w + (w === 8 ? 0.12 : 0) + noise(0.04)));
    const speaking = weeks.map(w => clamp01(0.4 + 0.18 * Math.sin(w / 2.2) + 0.012 * w + noise(0.03)));
    const series = [
      { name: 'Confidence', color: '#34e3cf', y: confidence },
      { name: 'Joy', color: '#ffb74d', y: joy },
      { name: 'Anxiety', color: '#ff5d8f', y: anxiety },
      { name: 'Speaking topic', color: '#7c8cff', y: speaking },
    ];
    const traces = series.map(s => ({
      type: 'scatter', mode: 'lines+markers', name: s.name,
      x: weeks, y: s.y,
      line: { color: s.color, width: 2.5, shape: 'spline' },
      marker: { color: s.color, size: 5 },
      hovertemplate: s.name + '<br>week %{x}: %{y:.2f}<extra></extra>',
    }));
    const lay = LAYOUT2D('Week of term', 'Index (0 to 1)', {
      xaxis: Object.assign(ax2('Week of term'), { range: [0.5, 16.5], dtick: 2 }),
      yaxis: Object.assign(ax2('Index (0 to 1)'), { range: [0, 1] }),
      showlegend: true,
      legend: { font: { family: 'JetBrains Mono', size: 10, color: '#a9b2cc' }, bgcolor: 'rgba(0,0,0,0)', orientation: 'h', y: 1.1 },
      shapes: [{ type: 'line', x0: 8, x1: 8, yref: 'paper', y0: 0, y1: 1, line: { color: 'rgba(233,231,221,0.4)', width: 1, dash: 'dash' } }],
      annotations: [{ x: 8, y: 1.02, yref: 'paper', text: 'midterm', showarrow: false, font: { family: 'JetBrains Mono', size: 10, color: '#a9b2cc' } }],
    });
    Plotly.newPlot('fig-timeseries', traces, lay, CONF);
  }
```
注意：`mulberry32`、`clamp01`、`LAYOUT2D`、`ax2`、`CONF` 都是既有。

- [ ] **Step 2: 註冊進 FIGURE_BUILDERS**

```javascript
    'fig-sentiment': buildNRC,
    'fig-topic': buildTopicModel,
    'fig-timeseries': buildTimeSeries
  };
```

- [ ] **Step 3: 語法檢查 + 瀏覽器驗證** — `node -e "..."` 須 OK。探針 fig-timeseries 應 plotted=1、traces=4、type0='scatter'。console 無錯。

- [ ] **Step 4: Commit**
```bash
cd "/Users/justin/lab website"
git add script.js
git commit -m "Add affect-and-topics time series figure (Plotly lines)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

## Task 4: Figure M — Spectrogram（頻譜熱力圖 + pitch 線）

**Files:** Modify `script.js`

- [ ] **Step 1: 在 buildTimeSeries 之後、`const FIGURE_BUILDERS` 之前加入 buildSpectrogram**

```javascript
  /* Speech spectrogram (Plotly heatmap) + pitch contour (scatter) — simulated phrase */
  function buildSpectrogram() {
    const rng = mulberry32(53607);
    const nT = 90, nF = 64;
    const tMax = 2.0, fMax = 8000;
    const times = Array.from({ length: nT }, (_, i) => +(i / (nT - 1) * tMax).toFixed(3));
    const freqs = Array.from({ length: nF }, (_, i) => Math.round(i / (nF - 1) * fMax));
    const segs = [
      { t0: 0.05, t1: 0.40, f: [600, 1000, 2400] },
      { t0: 0.45, t1: 0.75, f: [400, 1800, 2600] },
      { t0: 0.80, t1: 1.10, f: [700, 1200, 2300] },
      { t0: 1.15, t1: 1.50, f: [500, 1600, 2700] },
      { t0: 1.55, t1: 1.95, f: [650, 1100, 2500] },
    ];
    const z = freqs.map(() => new Array(nT).fill(0));
    for (let ti = 0; ti < nT; ti++) {
      const t = times[ti];
      const seg = segs.find(s => t >= s.t0 && t <= s.t1);
      for (let fi = 0; fi < nF; fi++) {
        const f = freqs[fi];
        let e = 0.04 + 0.05 * rng();
        if (seg) {
          const glide = (t - seg.t0) / (seg.t1 - seg.t0);
          seg.f.forEach((f0, k) => {
            const fc = f0 + glide * 120 * (k + 1) - 60 * (k + 1);
            const bw = 220 + 60 * k;
            e += (0.85 - 0.18 * k) * Math.exp(-((f - fc) ** 2) / (2 * bw * bw));
          });
          e += 0.3 * Math.exp(-(f ** 2) / (2 * 400 * 400));
        } else {
          if (rng() > 0.6 && f > 3000) e += 0.4 * rng();
        }
        z[fi][ti] = Math.min(1, e);
      }
    }
    const heat = {
      type: 'heatmap', z, x: times, y: freqs, zsmooth: 'best',
      colorscale: [[0, 'rgba(7,11,22,1)'], [0.3, '#27314f'], [0.6, '#7c8cff'], [0.85, '#ffb74d'], [1, '#ffe1a8']],
      colorbar: { title: { text: 'energy', font: { color: '#a9b2cc', family: 'JetBrains Mono', size: 10 } },
        tickfont: { color: '#6b7596', family: 'JetBrains Mono', size: 9 }, thickness: 10, len: 0.9 },
      hovertemplate: 'time %{x}s<br>freq %{y} Hz<br>energy %{z:.2f}<extra></extra>',
    };
    const pitch = times.map(t => {
      const seg = segs.find(s => t >= s.t0 && t <= s.t1);
      const base = 180 + 60 * Math.sin(t * 3.0) + 30 * Math.sin(t * 7.0);
      return seg ? Math.round(base) : null;
    });
    const pitchTrace = {
      type: 'scatter', mode: 'lines', name: 'pitch F0', x: times, y: pitch.map(p => p == null ? null : p * 6),
      connectgaps: false, line: { color: '#ffffff', width: 2 },
      hovertemplate: 'pitch %{customdata} Hz<extra></extra>',
      customdata: pitch,
    };
    const lay = LAYOUT2D('Time (s)', 'Frequency (Hz)', {
      xaxis: Object.assign(ax2('Time (s)'), { range: [0, tMax] }),
      yaxis: Object.assign(ax2('Frequency (Hz)'), { range: [0, fMax] }),
      showlegend: false,
    });
    Plotly.newPlot('fig-spectrogram', [heat, pitchTrace], lay, CONF);
  }
```
注意：`mulberry32`、`LAYOUT2D`、`ax2`、`CONF` 都是既有。pitch 乘 6 是把約 180Hz 的 F0 映到頻率軸可見高度（純視覺，hover 用 customdata 顯示真實 Hz）。

- [ ] **Step 2: 註冊進 FIGURE_BUILDERS**

```javascript
    'fig-sentiment': buildNRC,
    'fig-topic': buildTopicModel,
    'fig-timeseries': buildTimeSeries,
    'fig-spectrogram': buildSpectrogram
  };
```

- [ ] **Step 3: 語法檢查 + 瀏覽器驗證** — `node -e "..."` 須 OK。探針 fig-spectrogram 應 plotted=1、traces=2、type0='heatmap'、z.length=64。console 無錯。

- [ ] **Step 4: Commit**
```bash
cd "/Users/justin/lab website"
git add script.js
git commit -m "Add speech spectrogram figure with pitch contour (Plotly)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

## Task 5: 打磨與 RWD 驗證

**Files:** Modify `script.js` / `styles.css`（僅發現問題時小修）

- [ ] **Step 1: 桌機走查** — 開 visuals.html § 05，確認 5 張圖都正常精美、與站點一致；既有 § 03/§ 04 與 N-gram/NRC 未受影響；console 無 error。探針一次確認三張新圖 plotted=1。
- [ ] **Step 2: 行動裝置走查（700px iframe）** — 三張新圖容器自適應、無水平溢出（`document.body.scrollWidth <= clientWidth`）。Plotly responsive 縮放。
- [ ] **Step 3: 若發現問題小修** — topic subplot 窄屏重疊、spectrogram colorbar 溢出、legend 換行等，每修重驗。無則跳過。
- [ ] **Step 4: 關閉本機伺服器**
- [ ] **Step 5: Commit（若有打磨改動）**
```bash
cd "/Users/justin/lab website"
git add -A
git commit -m "Polish new NLP figures and verify responsive layout

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## 完成定義

- [ ] § 05 在 NRC 之後多三張圖：Figure K（Topic Model）、L（Time Series）、M（Spectrogram）。
- [ ] Topic：Plotly heatmap（主題×詞 β）+ 文件-主題堆疊條，hover 顯示權重。
- [ ] Time Series：4 條線（信心/喜悅/焦慮/口說主題）×16 週，圖例開關、hover、期中考虛線。
- [ ] Spectrogram：頻譜 heatmap（時間×頻率×能量）+ 白色 pitch F0 線，hover 顯示頻率/能量/pitch。
- [ ] 三圖都用既有 Plotly + FIGURE_BUILDERS、mulberry32 種子、語言學習主題、純前端。
- [ ] 不影響既有圖；RWD 正常；console 無錯；prose 文案符合風格約束。
