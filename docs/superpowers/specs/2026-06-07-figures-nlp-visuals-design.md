# Figures 頁新增 Text Mining / NLP 兩張互動圖 — 設計規格

**日期**：2026-06-07
**狀態**：已確認方向，待實作
**頁面**：`visuals.html`（Figures 頁）新增區塊 + `script.js` 新增繪製函式

## 目標

在 Figures 頁新增一個獨立區塊 `§ 05 — Text Mining / NLP`，放兩張大尺寸、互動式、酷炫精美的圖，呼應 text mining 課程：

1. **Figure I — N-gram 力導向網路圖**（D3.js force-directed graph）
2. **Figure J — 情感分析散點分類圖**（Plotly 互動散點 + 決策邊界）

資料全部是程式生成的擬真示範資料，主題圍繞「應用外語 / 語言學習」，跟全站其他圖（皆 simulated data）做法一致。純前端、無後端、無 API。

## 技術與整合

- **位置**：在 `visuals.html` 的 `§ 04` gallery `</section>` 之後、`</main>` 之前，新增 `<section id="nlp">`，內含 section-marker（§ 05）+ sec-head（標題 Text Mining / NLP）+ 兩個 `.viz` 大容器（規格同 § 03 的 Figure 1-3：viz-head 含 fignum + h3、viz-desc 描述、互動圖 div、viz-eq 公式、viz-foot chips 圖例）。
- **Figure I 用 D3.js v7**（CDN，`defer` 載入，與既有 Plotly/KaTeX 載入方式一致）。容器 `<div id="fig-ngram" class="plot">`。
- **Figure J 用既有 Plotly**（不需新函式庫）。容器 `<div id="fig-sentiment" class="plot">`。
- **繪製整合於 `script.js`**：
  - 新增 `setupNgramNetwork()`（D3 載入後繪製；加一個 `ensureD3()` loader，仿 `ensurePlotly()`）。
  - 新增 `setupSentimentScatter()`（走既有 `ensurePlotly()`）。
  - 兩者由既有 `setupFigures()` 流程觸發（偵測元素存在才畫）。
- **資料**：用既有 `mulberry32` 種子亂數，確保每次載入長一樣（與站內既有圖一致）。
- **色彩 / 字體**：沿用既有變數（青 `#34e3cf`、橘 `#ffb74d`、粉 `#ff5d8f`、靛 `#7c8cff`；文字 `#e9e7dd`/`#a9b2cc`/`#6b7596`；Fraunces/Spectral/JetBrains Mono）與既有 `.viz` 樣式、KaTeX。
- **RWD**：兩圖容器在窄螢幕自適應（沿用 `.plot` 既有響應式 + D3 svg viewBox / Plotly responsive）。
- **CSS**：N-gram 圖需要的額外樣式（搜尋框、節點/連線、tooltip）加在 `styles.css` 末端新區段，不動既有規則。

## Figure I — N-gram 力導向網路圖

**主題**：英語學習語料的 n-gram（bigram）共現網路。

**資料（程式生成）**：
- 節點 = 約 30-40 個語言學習常見詞（如 learning, language, English, practice, vocabulary, grammar, speaking, listening, motivation, fluency, feedback, confidence, teacher, student…），節點大小 = 詞頻。
- 連線 = bigram 共現（如 language↔learning、speaking↔practice），連線粗細 = 共現頻率。
- 顏色分群 = 幾個主題社群：技能類（speaking/listening/reading/writing）、情意類（motivation/confidence/anxiety/fluency）、教學類（teacher/feedback/classroom/student），用 accent 色區分。

**互動**：
- 拖曳節點（D3 force simulation，整網彈力重排）。
- hover 高亮：滑到某詞 → 該詞與鄰居連線高亮、其餘淡化，小提示顯示該詞 + 最強搭配詞。
- 自動散開（載入時力模擬到平衡，alpha 衰減後保留輕微浮動）。
- **搜尋詞功能**：搜尋框輸入詞 → 該節點高亮聚焦、其餘淡化、視覺拉近到它。

**配套**：標題「N-gram co-occurrence network」、viz-desc（解釋學習者語料的詞共現結構）、KaTeX 公式 PMI：`\mathrm{PMI}(w_1,w_2)=\log\frac{P(w_1,w_2)}{P(w_1)P(w_2)}`、viz-foot chips 標各主題社群顏色。

## Figure J — 情感分析散點分類圖

**主題**：模擬學習者評論 / 回饋的情感分析分類結果。

**資料（程式生成）**：
- 點 = 約 120-150 則模擬學習者評論。
- x 軸 = 情感極性 polarity（−1 負面 → +1 正面）；y 軸 = 主觀性 subjectivity / 信心（0 → 1）。
- 三類顏色：正面（青 #34e3cf）、中性（靛 #7c8cff）、負面（粉 #ff5d8f），依 polarity 自然分群。
- 點大小 = 文本長度或信心（增加層次）。

**互動**：
- hover 顯示文本：tooltip 顯示該則模擬評論全文 + 情感分數（如 "Speaking practice really boosted my confidence." / polarity +0.8）。
- 點圖例篩選三類別（Plotly 內建）。
- **決策邊界視覺**：背景用色帶 / 分隔暗示三類分類區域（依 polarity 切分的垂直色帶，低透明度）。

**配套**：標題「Sentiment classification of learner feedback」、viz-desc、KaTeX 公式（logistic：`P(\text{pos})=\sigma(\mathbf{w}^\top\mathbf{x}+b)`）、viz-foot chips 標三類顏色。

## 不做（YAGNI）

- 不接真實 NLP API / 後端。
- 不做真實即時 n-gram 統計 / 情感計算（用預製擬真資料）。
- 不引入除 D3.js 外的新重型函式庫（情感圖用既有 Plotly）。
- 不改動既有 § 03 / § 04 的圖。

## 寫作風格約束

- 英文文案不用 em dash、省略號、rule-of-three、not X but Y。
- 沿用既有事實設定。
