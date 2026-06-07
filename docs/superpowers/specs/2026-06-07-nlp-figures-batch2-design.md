# § 05 NLP 區塊再加三張互動圖 — 設計規格

**日期**：2026-06-07
**狀態**：已確認方向，待實作
**頁面**：`visuals.html`（Figures 頁 § 05）+ `script.js`

## 目標

在 Figures 頁的 § 05 Text Mining / NLP 區塊（現有 N-gram 網路 + NRC 雷達兩張），再加三張互動圖，讓 NLP 區塊更厲害、更完整：

1. **Figure K — Topic Model（LDA 主題模型）**：主題×詞彙熱力圖 + 文件-主題佔比
2. **Figure L — Time Series（情感/主題隨時間）**：學期週次的多線趨勢圖
3. **Figure M — Spectrogram（語音頻譜）**：頻譜熱力圖 + 疊 pitch/F0 曲線

§ 05 變成 5 張大圖的連貫 NLP 主題區。資料全程式生成（語言學習主題）、純前端、無後端。

## 技術與整合

- **位置**：三張接在 Figure J（NRC 雷達）之後，依序 Figure K / L / M，都在 § 05 內。
- **技術**：全部用既有 Plotly（不引入新函式庫）。
  - Figure K：Plotly `heatmap`（主題×詞）+ `bar`（文件-主題堆疊）。
  - Figure L：Plotly `scatter` lines（多條時間序列）。
  - Figure M：Plotly `heatmap`（時間×頻率×能量）+ `scatter`（pitch 線，第二 y 軸）。
- **整合**：三個 `buildXxx()` 函式加進 `script.js`，註冊到 `FIGURE_BUILDERS`（容器 id：`fig-topic`、`fig-timeseries`、`fig-spectrogram`），由既有 `setupFigures()` 自動繪製。
- **資料**：用既有 `mulberry32` 種子亂數生成，語言學習主題。
- **沿用**：既有 `.viz` 容器規格、色彩變數（青 #34e3cf / 橘 #ffb74d / 粉 #ff5d8f / 靛 #7c8cff）、`LAYOUT2D`/`ax2`/`CONF` helper、KaTeX、touch UX。
- **HTML**：visuals.html 在 Figure J 之後加 3 個 `.viz` 區塊（標題 + viz-desc + 圖容器 + viz-eq + viz-foot chips）。

## Figure K — Topic Model（LDA）

- **左：主題×詞彙熱力圖** — 行 = 5 個主題（Speaking & Fluency、Grammar & Accuracy、Motivation & Affect、Assessment & Feedback、Reading & Vocabulary），列 = 約 12 個高權重詞，色深 = 詞在主題的權重 β。
- **右或下：文件-主題佔比** — 幾份範例文件的主題佔比 θ，堆疊長條（或第二個 heatmap）。
- **互動**：hover 熱力格看「主題-詞-權重」、hover 佔比條看文件主題分佈。
- **公式**：`\theta_d\sim\mathrm{Dir}(\alpha),\ z_{dn}\sim\mathrm{Mult}(\theta_d),\ w_{dn}\sim\mathrm{Mult}(\beta_{z_{dn}})`
- **chips**：標主題色 + 「colour — topic-word weight β」。

## Figure L — Time Series（情感/主題隨時間）

- **多條線（3-4 條）** = 指標隨**學期 16 週**變化：Confidence/Joy 上升、Anxiety 下降、某主題（如 Speaking 主題熱度）起伏。accent 色區分。
- **互動**：點圖例開關各線、hover 看某週的值。一條虛線標「期中考週」事件。
- **公式**：移動平均 `\bar{x}_t=\frac{1}{k}\sum_{i=0}^{k-1}x_{t-i}`
- **chips**：標各線色 + 「x — week · y — index」。

## Figure M — Spectrogram（語音頻譜）

- **底層：頻譜熱力圖** — x = 時間（約 2 秒語音）、y = 頻率（0–8 kHz）、色 = 能量（dB）。程式生成擬真共振峰結構（像念一個英文句子，有母音的 formant 帶 + 子音的高頻噪訊）。
- **疊層：pitch/F0 曲線** — 一條音高輪廓線顯示語調起伏（用第二 y 軸或映射到頻率軸）。
- **互動**：hover 看某時間點的頻率/能量、pitch 值。
- **公式**：短時傅立葉 `X(t,f)=\Big|\sum_n x[n]\,w[n-t]\,e^{-j2\pi f n}\Big|^2`
- **chips**：標 spectrogram 色階 + pitch 線色 + 「x — time · y — frequency」。

## 不做（YAGNI）

- 不接真實 NLP / 語音 API、不做真實 LDA / FFT 計算（用預製擬真資料）。
- 不引入除既有 Plotly 外的新函式庫。
- 不改動既有 § 03 / § 04 / § 05 既有兩張圖（N-gram、NRC）。

## 寫作風格約束

- 英文 prose 不用 em dash、省略號、rule-of-three、not X but Y（viz-foot chip 的「x — time」是站內既有 chip 慣例，不算違規）。
