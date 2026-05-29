# Teaching 頁設計 — 推論統計教材整合

日期：2026-05-29
專案：L-DAHS · Latent Manifold Lab 網站
狀態：已通過 brainstorming，待寫實作計畫

## 目標

把實驗室研發的兩套推論統計教材（`Inferential_Statistics_II`、`Inferrential_Statistics_III`，共 18 份雙語互動 HTML）提煉成網站上的一個新分頁 `teaching.html`。內容以 7 張主題卡片呈現；點卡片彈出深色 Modal，內含精華摘要（概念導讀、關鍵公式、重新上色的 SVG 圖、適用情境要點）。全站沿用既有深色 L-DAHS 風格，乾淨不混亂。

教材原檔頁尾標示 `EVERC · NTUST · Applied Foreign Languages`，與實驗室同屬一系所；內容對應首頁「linear algebra → matrix calculus → differential equations」框架，Teaching 頁等於把框架落地成可學的單元。

## 範圍

### 做

- 新增 `teaching.html`（沿用既有頁面結構：navbar、`section-marker`、`sec-head`、`eyebrow`、`data-rise`、footer、scroll-top）。
- 7 張主題卡的文字卡網格 + 點擊開啟的深色 Modal。
- Modal 內容：概念導讀、關鍵公式（KaTeX）、重新上色 SVG 圖、適用情境要點。
- 把選定的原始 SVG 圖重新上色為深色主題（米色系 → 深藍面板 + 強調色）。
- 在 6 個現有 HTML 的 navbar 加入 `Teaching` 連結；footer 視情況加連結。
- Modal 互動邏輯與卡片資料加入既有 `script.js`；卡片/Modal 樣式加入既有 `styles.css`。

### 不做（YAGNI）

- 不嵌入原始米色教材頁（不用 iframe）。
- 不上傳或連結原始 HTML / PDF。
- 不做搜尋或篩選（7 張卡不需要）。
- 不修改任何現有頁面的內容，只在 nav/footer 加連結。
- 卡片正面不放縮圖 SVG（圖只在 Modal 內，保持頁面輕快）。

## 導覽與頁面結構

### Navbar

在 6 個分頁的 nav 選單加入 `Teaching`，位置在 **Research 之後、Figures 之前**：

```
Home | Framework | Research | Teaching | Figures | Team | Publications
```

需改的檔案：`index.html`、`framework.html`、`research.html`、`visuals.html`、`team.html`、`publications.html`。每檔在 `<ul class="nav-menu">` 插入一個 `<li><a href="teaching.html">Teaching</a></li>`。

### teaching.html 區塊

章節編號 `§ 07`（接在 Publications §06 之後）。沿用 research.html 的版面語彙：

```
section-marker:  § 07  Teaching · inferential statistics, made visible
sec-head:
  sec-index:  § 07
  eyebrow:    Research-built teaching materials
  h2:         Statistics you can see.
  lead:       一句雙語導語，呼應框架頁（把推論統計從公式變成可讀的幾何）。
↓
卡片網格（沿用 .foci 的 6 欄 grid 排法；7 張卡標號 01–07）
```

## 七張主題卡

卡片分組（從 18 份教材歸納，對應一條學習路徑）。主題色用既有 `--d1`(#34e3cf)、`--d2`(#ffb74d)、`--d3`(#ff5d8f)、`--eig`(#7c8cff) 輪替。

| # | 主題（英 / 中） | 來源教材 | 卡面預覽公式 | Modal 關鍵公式 | Modal SVG 圖 |
|---|---|---|---|---|---|
| 01 | Sampling distribution & standard error / 抽樣分配與標準誤 | sampling_distribution(+quiz) | `SE = σ/√n` | `E(X̄)=μ`；`Var(X̄)=σ²/n`；`SE(X̄)=σ/√n` | 9 樣本格（抽樣分配全枚舉） |
| 02 | The t-distribution & critical values / t 分配與臨界值表 | t_table, t_table_II(+quiz) | `t_{df,α}` | t vs z 尾部、`df = n−1` 概念 | t 分配臨界區 SVG |
| 03 | Two means, six tests / 兩平均數差：決策樹 | mu1_mu2_decision_tree(+problems) | `t = signal / noise` | 通用骨架 `statistic=(X̄₁−X̄₂−(μ₁−μ₂))/ŜE`；pooled t、Welch t′、paired t | 六選一決策樹 SVG |
| 04 | The paired-samples t-test / 成對樣本 t 檢定 | paired_samples_t_test, t_test_activity | `t = D̄ / (S_D/√n)` | `t=(D̄−μ_D)/(Ŝ_D/√n), df=n−1`；含 `−2rS₁S₂` 的相關買精度式 | pre/post 配對示意 SVG |
| 05 | One-way ANOVA / 單因子 ANOVA | anova_lecture, Anova_walkthrough, oneway_anova_10_* | `F = MS_b / MS_w` | `SS_total=SS_between+SS_within`；`F=MS_b/MS_w`；`η²=SS_b/SS_total` | 變異拆解條狀圖（between vs within） |
| 06 | Repeated-measures ANOVA / 重複量數 ANOVA | Repeated_anova_walkthrough, ten_rm_anova_studies | `F = MS_cond / MS_error` | `SS_ws=SS_cond+SS_error`；`F=MS_cond/MS_error`；partial η² | 受試者內變異拆解 SVG |
| 07 | From t to F — one view / 從 t 到 F 的統一視角 | Connect_T_to_F, F_table, anova_examples | `t² = F` | `t²=F`（k=2 時 ANOVA 等同 t 檢定）；signal/noise 統一觀 | t→F 對應示意 SVG |

每張卡的精確公式與 SVG 在實作計畫階段，從來源教材逐一提取確認。卡面標籤示例：`Lecture · Quiz`、`Walkthrough`、`Decision tree`，必要時加 `2-D`。

## 卡片（正面）

文字卡，乾淨、只給「鉤子」，不放完整公式或圖：

- 主題色左邊條（`--c` 變數，沿用 research.html 的 `style="--c:var(--d1)"` 模式）。
- 編號 01–07（小字、等寬字）。
- 標題（h3，Fraunces）。
- 一句副標 + 一條 inline KaTeX 預覽公式（如 `SE = σ/√n`）。
- 底部小標籤（teaching kind，如 `Lecture · Quiz`）。
- hover 微浮起，`cursor:pointer`，提示可點。

可及性：卡片為可聚焦元素（`tabindex="0"`、`role="button"`、`aria-label`），支援 `Enter`/`Space` 開啟。

## Modal

深色面板，沿用 `--panel`/`--panel-2` 底色、`--line` 邊框、強調色。

### 版面

```
┌──────────────────────────────────────────────┐
│  § 07 · 03   [主題色標籤]               [✕]   │  頂列：編號 + kind 標籤 + 關閉
├──────────────────────────────────────────────┤
│  Two means, six tests                         │  標題（Fraunces；em 上色）
│  一句雙語副標                                   │
│                                                │
│  [Overview]  2–3 句概念導讀（提煉自原文）         │
│                                                │
│  [Key formulas]  2–4 條置中 KaTeX 公式          │
│                                                │
│  [Figure]  1–2 張重新上色 SVG（深底、強調色）      │
│                                                │
│  [When to use]  • 3–4 點適用情境條列             │
└──────────────────────────────────────────────┘
```

每個小節有等寬字小標（沿用 viz / focus 區塊的標籤風格）。Modal 可內部捲動，最大高度受視窗限制（如 `max-height: 90vh; overflow-y:auto`）。手機版單欄、留白縮小。

### 互動行為（原生 JS，零新依賴）

- 開啟：卡片 `click` 或 `Enter`/`Space`。
- 關閉：`Esc`、點背景遮罩、點 ✕。
- 開啟時鎖 `body` 捲動；focus 移入 Modal；關閉後 focus 還給觸發的卡片。
- focus trap：Tab 在 Modal 內循環。
- 開啟後對 Modal 內容呼叫 `renderMathInElement()` 渲染 KaTeX（首次開啟才渲染，之後可快取）。
- `prefers-reduced-motion` 時停用開闔動畫。
- 卡片資料集中為一個 JS 物件陣列（id、編號、kind、color、title、subtitle、previewFormula、overview、formulas[]、svg、whenToUse[]）；Modal DOM 由 JS 依資料注入，單一 Modal 容器重複使用。

## SVG（方案 A：新繪深色主題向量圖）

每張卡的圖採「新繪一張乾淨的深色主題 SVG」，內容忠於來源教材的統計概念，而非逐一移植風格參差的原始 SVG。理由：教材原圖配色/字型/變數依賴各異，部分（如 9 樣本格、決策樹）本是複雜 HTML 表格或手刻座標，硬移植成本高且易壞；新繪可完全套用站內 `--panel`/`--d1..--eig`/字型，與 Figures 頁的程式化圖風格一致。少數本就乾淨的 SVG（如 t 表臨界區）可沿用骨架並換色。

統一上色規則：

- 底/面板：`transparent`（卡在 Modal 深色面板上）。
- 線/文字主色：`--ink` / `--ink-soft` / `--ink-faint`。
- 強調：`--d1`(#34e3cf) / `--d2`(#ffb74d) / `--d3`(#ff5d8f) / `--eig`(#7c8cff)，依該卡主題色為主。
- 字型：Fraunces（標籤）、JetBrains Mono（數值/座標）。
- `viewBox` 等比縮放、`width:100%; height:auto`，不設 `min-width` 以免手機溢出。

SVG 直接內嵌於 teaching.html 卡片資料的 `svg` 欄位（字串），不引用外部檔。顏色用實際色值（hex），不用 CSS 變數，避免 SVG 內 `var()` 在某些情境失效。

## 公式渲染

teaching.html 載入與 index.html 一致的 KaTeX（CDN：katex.min.css + katex.min.js + auto-render contrib）。既有 `doRender()` 的 auto-render 已設定四種分隔符（`$$`、`\[`、`\(`、`$`），因此教材原檔 MathJax 的 `$...$`/`$$...$$` 公式可直接沿用，不必改寫。`doRender()` 需擴充為可接受目標元素參數，以便 Modal 開啟後只渲染 Modal 內的公式。

## 檔案改動清單

- 新增：`teaching.html`
- 新增：本 spec 與後續實作計畫文件
- 修改：`styles.css`（末尾加 teaching 卡片 + modal 樣式區塊）
- 修改：`script.js`（加 modal 邏輯與卡片資料）
- 修改：`index.html`、`framework.html`、`research.html`、`visuals.html`、`team.html`、`publications.html`（nav 加 `Teaching`，footer 視情況）

## 驗證

- 七張卡正確渲染、主題色輪替、hover 與聚焦樣式正常。
- 點每張卡開啟對應 Modal，公式（KaTeX）與 SVG 正確顯示且為深色主題配色。
- 鍵盤可開關（Enter/Space/Esc）、focus trap 與還原正常、`body` 捲動鎖定正常。
- 手機版（≤720px）版面不溢出、公式不橫向爆版（呼應近期 commit「stop math overflowing on mobile」）。
- 6 個現有頁面 nav 出現 Teaching 且連結正確；現有內容未被更動。
- 文案符合既有偏好：無破折號 em dash、無刪節號、無 rule-of-three、無「not X but Y」句式。

## 未決 / 實作時確認

- 每張卡最終選用的 1–2 張 SVG 與 2–4 條公式，於實作計畫逐卡定稿。
- footer 是否新增 Teaching 連結（預設：navbar 已足夠，footer 可選）。
