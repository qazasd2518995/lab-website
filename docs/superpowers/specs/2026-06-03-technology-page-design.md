# Technology 頁設計規格

**日期**：2026-06-03
**狀態**：已確認，待實作
**頁面**：`technology.html`（L-DAHS Latent Manifold Lab 官網新增 tab）

## 目標

在實驗室官網新增一個 `Technology` tab，放兩個**純展示型（scripted / cinematic）**、**完全用程式即時渲染**（不錄影、不用預錄素材、不接後端/API）的炫酷 demo：

1. **VR + AI 外語學習** — Three.js 真 3D 場景之旅
2. **多語即時口譯機器人（含 ASR）** — Canvas 2D 機器人裝置擬真風

兩個 demo 都是「一鍵觸發 + 自動演出」：使用者按一顆大按鈕，程式即時渲染一整段設計好的劇情。沒有真實語音辨識、沒有真實 AI 串接、沒有麥克風權限、沒有金鑰，永不出錯，視覺衝擊力最大，載入快。

## 技術棧與架構

純靜態網站，無建置流程，沿用現有做法（HTML / 原生 JS / CSS、CDN 載入函式庫、部署於 Vercel）。

**新增檔案**
- `technology.html` — 結構與風格沿用現有頁面：同一套 navbar、footer、`styles.css` 變數、Fraunces / Spectral / JetBrains Mono 字體、KaTeX、`data-rise` 進場動畫、`§ NN` 學術編號美學。
- `technology.js` — 本頁專屬 demo 引擎，含兩個 demo 的渲染邏輯。
- `styles.css` 末端追加 `/* === TECHNOLOGY PAGE === */` 區段，不修改既有規則（避免影響其他頁）。

**導覽列改動**
- 在**全部 8 個 HTML 檔**（index、framework、research、teaching、visuals、team、publications，以及新建的 technology）的 `nav-menu` 內，加入 `<li><a href="technology.html">Technology</a></li>`。
- 位置：`Research` 之後（Research → **Technology** → Teaching）。8 個檔同步，避免導覽列不一致。

**新引入函式庫（皆走 CDN，與現有做法一致）**
- **Three.js**（`three.min.js`，`defer` 載入）— 給 VR demo 的真 3D 場景。**只在按下該 demo 的 Start 按鈕時才初始化**，不拖慢首屏。
- 口譯 demo 的波形 / 頻譜 / 裝置全部用**原生 Canvas 2D**，不額外引入函式庫。
- 無後端、無 API key、無麥克風權限。

**效能策略**
- 雙重把關：IntersectionObserver（不在畫面內不跑）+ 「按下 Start 才啟動」。未啟動 / 不可見的 demo 完全不跑 `requestAnimationFrame`。
- `prefers-reduced-motion`：偵測到就直接顯示劇情終態靜圖，不跑動畫。
- 無外部 3D 模型檔，全部程式生成幾何（低多邊形 + 自訂發光 shader），檔案最小。

## 頁面佈局（單頁、上下兩大區塊、捲動瀏覽）

```
navbar（含新的 Technology，active 高亮）

§ 00  HERO
  eyebrow: § 00 — Applied Language Technology · Live Demonstrations
  h1:      Where the latent manifold <em>meets the user</em>.
  副標:    實驗室量化方法如何落地成兩套即時語言技術
  CTA:     ↓ VR Language Learning  /  ↓ Live Interpreter（錨點捲動）
  右側:    小型 eq-card / mono 技術標籤牆（呼應 index 風格）

§ 01  DEMO 一 — VR + AI LANGUAGE LEARNING
  section-marker + sec-head（標題、lead）
  3D 舞台（Three.js canvas，16:9）+ 中央大按鈕「▶ Start Immersive Demo」+ HUD 疊層
  下方: 3 顆技術說明膠囊（WebXR / 3D Spatial Audio / AI Tutor NLU）

§ 02  DEMO 二 — MULTILINGUAL LIVE INTERPRETER
  section-marker + sec-head
  口譯舞台（Canvas，中央發光呼吸裝置）+ 中央大按鈕「▶ Start Live Interpretation」
  兩側: 來源波形/ASR 文字 ↔ 翻譯文字/目標波形
  下方: 技術管線圖（VAD → ASR → MT → TTS 燈號流）

§ 03  技術堆疊小結（保留）
  一排 mono 標籤: WebGL · Three.js · Web Audio · Transformer · Seq2Seq …
  呼應 index.html 的 Methods stack 區塊

footer（沿用）
```

## DEMO 一：VR + AI 外語學習（Three.js）

**舞台**：16:9 WebGL canvas，背景 `#070b16`，霓虹點綴用既有 accent 色（青 `#34e3cf`、橘 `#ffb74d`、粉 `#ff5d8f`）。按下「▶ Start Immersive Demo」後，程式即時渲染約 **40–50 秒、三幕連續運鏡**的旅程，全 scripted。

**重要**：三幕場景做成**參數化、可替換**的結構 —— 每一幕是一個獨立的 scene 設定物件（幾何、色調、燈光、任務字幕、詞彙卡內容、相機關鍵影格皆為設定）。場景細節由使用者後續再調整。

**幕 1 — Café（餐廳點餐）**
- 低多邊形 3D 咖啡廳（地板透視網格、幾何桌椅、暖色吊燈光暈），相機緩緩推入。
- 發光 **AI 虛擬導師**：一顆會呼吸、有口型律動環的「能量球 / 幾何頭像」（非寫實人臉，零恐怖谷，純程式生成）。
- 任務字幕：`Order a coffee in English`。3D 詞彙卡（"a flat white, please" / "for here or to go?"）漂浮旋轉。
- 發音回饋環（綠=準 / 黃=再試）+ 翻譯泡泡 `內用還是外帶？` 淡入。

**幕 2 — Airport（機場報到）**（光帶轉場）
- 值機櫃台，冷藍色調、跑馬燈航班看板。任務：`Check in for your flight`。
- 詞彙卡 "window seat" / "boarding pass"；文法視覺化（把 "I'd like to..." 高亮的句構光帶）。

**幕 3 — Business Meeting（商務會議）**（再次轉場）
- 會議室（長桌、發光簡報螢幕）。任務：`Introduce yourself professionally`。
- 結尾鏡頭拉遠，三場景縮成三顆漂浮節點/星球，連回 latent manifold 美學，浮出 `One manifold. Many worlds.`，提供「↻ Replay」。

**HUD（疊在 3D 上的 HTML/CSS 2D 層）**
- 左上：場景名 + 進度三點（● ○ ○）
- 下方置中：當前字幕 / 任務（打字機效果）
- 右上：裝飾性科技數據（`IMMERSION 98%`、`LATENCY 12ms` 等，純裝飾增加複雜感）

**技術實現**
- 低多邊形 + 程式生成幾何（BoxGeometry、自訂發光 shader），無外部模型檔。
- 相機運鏡用預設關鍵影格曲線，`requestAnimationFrame` 驅動時間軸。
- 轉場用 fog + 光帶 + 透明度漸變，無後製。

## DEMO 二：多語即時口譯（Canvas 2D）

**舞台**：寬幅 Canvas，中央是程式渲染的**口譯裝置** —— 會發光呼吸的幾何體（同心圓光環 + 中央脈動核心，與 VR 能量球**共用同一套發光幾何視覺語言**，一致且好維護）。按下「▶ Start Live Interpretation」後，演約 **35–45 秒、三段多語接力**的 scripted 口譯。

**佈局**
```
   來源 (Source)              [口譯裝置]            目標 (Target)
   即時聲波 ～～    ──波形流向→  ◉ 呼吸光環 ◉  ←波形流向──   目標語聲波 ～～
   ASR 逐字浮現                VAD●ASR●MT●TTS●          翻譯逐字流出
```

**三段接力（語言方向連續切換，上方語言標籤翻牌切換，裝置換主題色）**
1. **EN → 中**：`"Could you tell me where the nearest station is?"` → `請問最近的車站在哪裡？`
2. **中 → EN**：`「這道菜會不會太辣？」` → `Is this dish too spicy?`
3. **日 → 中**：`「写真を撮ってもいいですか？」` → `可以幫我拍張照嗎？`

**即時感細節**
- 來源波形：Canvas 即時跳動聲波（程式生成 amplitude，配合「說話」節奏起伏）。
- ASR 文字：逐字打字機浮現；偶爾一字先顯示灰色再「修正」成白色（模擬重新解碼）。
- 管線燈號：`VAD → ASR → MT → TTS` 四盞依序點亮 + `latency 240ms` 計時器跳動。
- 翻譯文字：波浪式逐字從裝置流向目標側。
- 目標波形：翻譯出來時目標側波形跳動（代表 TTS 發聲）。

**下方技術管線圖（§ 02 收尾）**
`Voice Activity Detection → Speech Recognition (ASR) → Neural Machine Translation → Speech Synthesis (TTS)` 流程帶，每節點配 mono 技術註解，呼應數據美學。

## 寫作風格約束

- 頁面英文文案：避免 em dash、避免省略號、避免 rule-of-three、避免「not X but Y」句式，用平白句子。
- 沿用 `Est. 2025` 等既有事實設定。

## 不做（YAGNI）

- 不接真實 ASR / AI / 翻譯 API。
- 不要求麥克風權限。
- 不新增後端或 serverless function。
- 不引入除 Three.js 外的重型函式庫（口譯 demo 純 Canvas 2D）。
- 不做使用者可選情境 / 多劇本分支（已定為單一 scripted 演出）。
