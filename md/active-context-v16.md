# Active Context v16
## Trạng thái: Cập nhật lần 16 ✅
> **Phiên làm việc tiếp theo:** Đọc mục "📦 Gửi file gì trong phiên tới" ở cuối file này trước khi bắt đầu.

---

## 📋 Tính năng đã hoàn thành (toàn bộ lịch sử)

| Tính năng | Version |
|---|---|
| Vite + React + Tailwind + lightweight-charts v5 | v1 |
| Spot / Futures toggle | v1 |
| Giá realtime từ Binance WebSocket `@ticker` | v1 |
| % change 24h chính xác | v1 |
| Volume histogram dưới chart | v1 |
| Đầy đủ intervals: 1m 3m 5m 15m 30m 1h 2h 4h 6h 8h 12h 1D 3D 1W 1M | v2 |
| Dropdown picker interval như Binance | v2 |
| Search coin realtime | v2 |
| Sort: Volume / %Tăng / %Giảm / Giá | v2 |
| Load toàn bộ coin USDT từ Binance (300+ coin) | v2 |
| Nút "Xem thêm" để load thêm coin | v2 |
| PriceCard: Open/High/Low/Vol/Bid/Ask | v3 |
| Auto-reconnect WebSocket sidebar | v3 |
| Fallback Spot API URLs (api / api1 / api2) | v3 |
| Màu sắc giống Binance (#0b0e11, #f0b90b) | v1 |
| MA20 / MA50 / MA200 overlay trên chart | v4 |
| Toggle bật/tắt từng MA line | v4 |
| RSI(14) panel riêng bên dưới chart | v5 |
| RSI overbought (70) / oversold (30) — dùng PriceLine | v8 (fix) |
| Sync crosshair + timescale giữa main chart và RSI | v5 |
| OHLCV tooltip khi hover nến | v5 |
| MA values hiển thị trong tooltip khi hover | v5 |
| Toggle RSI panel, Volume | v5 |
| Price Alert — browser notification + âm thanh beep | v6 |
| Alert panel slide-in bên phải chart | v6 |
| Badge đếm alert đang active trên nút 🔔 | v6 |
| Direction: Vượt qua (▲) / Giảm xuống (▼) | v6 |
| Validate giá hợp lệ theo direction | v6 |
| Web Audio API beep (không cần file âm thanh) | v6 |
| Auto-mark triggered, hiển thị lịch sử | v6 |
| Icon ℹ️ tooltip hướng dẫn + ví dụ trong Alert panel | v6 |
| Persist localStorage — symbol, interval, market | v7 |
| Persist localStorage — showMA, showRSI, showVolume | v7 |
| Persist localStorage — danh sách alerts | v7 |
| MACD panel (MACD line + Signal + Histogram) | v8 |
| Toggle MACD panel | v8 |
| MACD tooltip khi hover | v8 |
| Persist showMACD | v8 |
| Sync timescale MACD với main chart | v8 |
| Bollinger Bands BB(20,2) overlay trên chart | v8 |
| Toggle BB, BB values trong OHLCV tooltip | v8 |
| Persist showBB | v8 |
| Tab Gainers / Losers trong sidebar | v8 |
| Funding Rate realtime cho Futures | v9 |
| Mark Price + Index Price trong PriceCard | v9 |
| Countdown đến lần funding tiếp theo | v9 |
| useFundingRate hook — WS `@markPrice` stream | v9 |
| Fallback Futures API URLs (fapi / fapi1 / fapi2) | v10 (fix) |
| REST retry tối đa 3 lần — Kline + CoinList init | v10 (fix) |
| Kline WS auto-reconnect khi bị drop | v10 (fix) |
| CoinList init không clear data cũ khi switch market | v10 (fix) |
| Open Interest hiển thị trong PriceCard (Futures) | v11 |
| useFundingRate WS auto-reconnect (fix known issue) | v11 (fix) |
| getOpenInterest REST polling mỗi 30s | v11 |
| EMA(9) + EMA(21) overlay trên chart | v12 |
| Toggle EMA9 / EMA21 riêng, persist localStorage | v12 |
| EMA values hiển thị trong OHLCV tooltip khi hover | v12 |
| EMA O(1) incremental update per tick | v12 |
| Âm thanh alert tùy chỉnh — slider volume (0–100%) | v12 |
| Âm thanh alert tùy chỉnh — chọn tone: Sine/Square/Sawtooth/Triangle | v12 |
| Nút "Thử âm thanh" trong AlertPanel | v12 |
| Persist alertVolume + alertTone | v12 |
| Funding Rate History Sparkline — mini bar chart 10 chu kỳ | v12 |
| Sparkline tooltip khi hover từng bar | v12 |
| Order Book mini — top 5 bid/ask WS `@depth5@100ms` | v13 |
| Depth bar visual cho từng mức giá (cumulative qty) | v13 |
| Spread indicator (giá trị + % spread) | v13 |
| Recent Trades — WS `@aggTrade`, 30 trades mới nhất | v13 |
| Trade direction indicator (▲/▼ + màu xanh/đỏ) | v13 |
| RAF batch update cho cả OrderBook và RecentTrades | v13 |
| Right panel toggle: OrderBook / Trades / Alerts | v13 |
| Auto-reconnect WS cho useOrderBook + useRecentTrades | v13 |
| **RecentTrades fix: Map dedup theo aggId** | **v13.1 (fix)** |
| **RecentTrades fix: sort desc aggId — mới nhất trên đầu** | **v13.1 (fix)** |
| **RecentTrades fix: overflow-hidden, 30 row cố định, không scroll** | **v13.1 (fix)** |
| **Watchlist cá nhân — tab ⭐ trong sidebar** | **v14** |
| **Pin / Unpin coin bằng nút ⭐ trên mọi tab** | **v14** |
| **Persist watchlist vào localStorage** | **v14** |
| **Badge đếm số coin đã pin trên tab ⭐** | **v14** |
| **Empty state đẹp khi watchlist trống** | **v14** |
| **WS stream riêng cho watchlist (ngoài top 180)** | **v14** |
| **watchlistStore.js — Zustand + persist, max 50 coin** | **v14** |
| **Long/Short Ratio Panel — 3 loại: Global / Top Acct / Top Pos** | **v15** |
| **useLongShortRatio hook — REST poll 30s, lịch sử 24 điểm** | **v15** |
| **Sparkline 24 điểm longRatio theo thời gian** | **v15** |
| **GaugeBar long/short trực quan** | **v15** |
| **SignalBadge tự động: Đám đông quá Long/Short / Cân bằng** | **v15** |
| **Collapse section riêng từng loại ratio** | **v15** |
| **binanceApi.js +3 hàm L/S ratio, +1 hàm OI history** | **v15** |
| **useOIHistory.js — fetch + poll 5 phút, map interval→period** | **v16** |
| **OI History Chart — AreaSeries vàng, sync timescale main chart** | **v16** |
| **Toggle button OI (chỉ hiện khi Futures)** | **v16** |
| **Persist showOI trong chartStore** | **v16** |
| **fmtOI helper (K/M format)** | **v16** |

---

## 🐛 Bug đã sửa — QUAN TRỌNG: KHÔNG ĐƯỢC VIẾT LẠI CÁC PATTERN NÀY

### BUG #1 — Chart lag / crosshair giật (v8)
**Fix đúng (marketStore.js):**
```js
const _prices = {}  // sống NGOÀI Zustand
let _rafPending = false
updatePrice: (symbol, data) => {
  _prices[symbol] = { ...(_prices[symbol] || {}), ...data }
  if (!_rafPending) {
    _rafPending = true
    requestAnimationFrame(() => { _rafPending = false; set(s => ({ _tick: s._tick + 1 })) })
  }
}
get prices() { return _prices }
```
**Rule:** `marketStore` chỉ giữ `_tick` counter. Data thật nằm trong `_prices` module-level.

---

### BUG #2 — Chart chỉ hiện 1 nến khi refresh nhanh (v8)
**Fix đúng:** `await waitForRef(candleRef)` ở đầu `start()`.

---

### BUG #3 — Gainers/Losers lag toàn sidebar (v8)
**Fix đúng:** Snapshot riêng `glSnapshot`, re-sort mỗi 3s qua `setInterval`.
**Rule:** KHÔNG sort/filter 300+ coin bên trong component subscribe `prices` store.

---

### BUG #4 — Futures chart trắng + PriceCard hiện `---` (v10)
**Fix đúng:** fetchFutures 3 URL fallback + getKlinesWithRetry 3 lần + WS kline reconnect.
**Rule:** Mọi REST call quan trọng PHẢI có retry ≥ 3 lần.

---

### BUG #5 — RSI overbought/oversold lines biến mất (v8)
**Fix đúng:** Tạo PriceLine SAU khi `setData()` xong trên RSI series.

---

### BUG #6 — Sidebar WS mở 300 connections (v3/v8)
**Fix đúng:** Max 40 symbols/connection, stagger 200ms/batch.

---

### BUG #7 — FundingCountdown gây re-render PriceCard mỗi giây (v9)
**Fix đúng:** Tách FundingCountdown thành component riêng với state local.
**Rule:** Component có `setInterval` PHẢI là component riêng với state local.

---

### BUG #8 — useFundingRate WS không reconnect (v11 fix)
**Fix đúng:**
```js
const cancelledRef = useRef(false)
ws.onclose = () => {
  if (cancelledRef.current) return
  reconnTimRef.current = setTimeout(() => { if (!cancelledRef.current) connectWS() }, 5000)
}
```

---

### BUG #9 — alertVolume/alertTone hardcode không đổi được (v12 fix)
**Fix đúng:**
```js
const soundRef = useRef({ volume: alertVolume, tone: alertTone })
useEffect(() => { soundRef.current = { volume: alertVolume, tone: alertTone } }, [alertVolume, alertTone])
playBeep(alert.direction, soundRef.current.tone, soundRef.current.volume)
```

---

### BUG #10 — OrderBook / RecentTrades setState 60-100fps gây lag (v13 design)
**Fix đúng:** RAF batch với `pendingRef` / `bufferMapRef`. KHÔNG setState trực tiếp trong `ws.onmessage`.

---

### BUG #11 — RecentTrades thứ tự lộn, duplicate, scroll không giới hạn (v13.1 fix)
**Fix đúng (useRecentTrades.js):**
```js
const bufferMapRef = useRef(new Map())
ws.onmessage = (event) => {
  const trade = { id: d.a, price, qty, isBuyerMaker, time }
  bufferMapRef.current.set(trade.id, trade)
  rafRef.current = requestAnimationFrame(() => {
    const sorted = [...bufferMapRef.current.values()]
      .sort((a, b) => b.id - a.id)
      .slice(0, MAX_TRADES)
    setTrades(sorted)
  })
}
```

---

### BUG #12 — OI chart không sync timescale khi main chart chưa init (v16 potential)
**Fix đúng:** Subscribe timescale TRONG useEffect khởi tạo OI chart, sau khi `mainChartRef.current` đã tồn tại.
**Rule:** Luôn kiểm tra `mainChartRef.current` trước khi subscribe. Nếu null → dùng `waitForRef(mainChartRef)` pattern.

---

## 🗂️ Cấu trúc file hiện tại (v16)

```
src/
├── components/
│   ├── App.jsx               — Root layout, AlertEngine, right panel toggle
│   ├── CoinList.jsx          — Sidebar: Thị trường/Tăng/Giảm/⭐ Watchlist
│   ├── ChartPanel.jsx        — v16: +OI panel (AreaSeries, sync, toggle)
│   ├── PriceCard.jsx         — Giá + Funding + OI + Sparkline
│   ├── AlertPanel.jsx        — Price alert + SoundSettings
│   ├── OrderBookPanel.jsx    — Top 5 bid/ask + depth bar
│   ├── RecentTradesPanel.jsx — 30 aggTrades (dedup, sort, no-scroll)
│   ├── LongShortPanel.jsx    — 3 loại L/S ratio + sparkline + gauge
│   └── IntervalSelector.jsx  — (deprecated)
├── hooks/
│   ├── useBinanceWS.js       — WS ticker (batch 40/conn, stagger 200ms)
│   ├── useKlineData.js       — WS + REST kline (retry 3 + reconnect)
│   ├── useAlertChecker.js    — Background alert (soundRef pattern)
│   ├── useFundingRate.js     — WS markPrice + OI poll 30s (cancelledRef)
│   ├── useOrderBook.js       — WS @depth5 + RAF batch + reconnect
│   ├── useRecentTrades.js    — WS @aggTrade + Map dedup + RAF
│   ├── useLongShortRatio.js  — REST poll 30s, Promise.allSettled
│   └── useOIHistory.js       — v16: REST poll 5m, map interval→period
├── store/
│   ├── marketStore.js        — _prices module-level + RAF (_tick)
│   ├── chartStore.js         — v16: +showOI, +setShowOI (persist)
│   ├── alertStore.js         — alerts list (persist)
│   └── watchlistStore.js     — pinned symbols (persist, max 50)
├── services/
│   └── binanceApi.js         — v15: REST wrapper Spot+Futures+L/S+OIHist
├── index.css
└── main.jsx
```

---

## ⚡ Performance Rules — KHÔNG ĐƯỢC VI PHẠM

| Rule | Lý do |
|---|---|
| `marketStore` dùng `_prices` module-level, Zustand chỉ giữ `_tick` | spread 300 keys × 60fps = lag |
| `updatePrice` batch qua `requestAnimationFrame` | tối đa 60 notify/giây |
| Không tách `CoinRow` thành component riêng | 300 component instance mỗi re-render |
| Gainers/Losers dùng snapshot throttle 3s | không sort 300 coin mỗi frame |
| WS batch tối đa 40 symbols/connection | Binance limit |
| Component có `setInterval` phải có state local riêng | tránh re-render leak lên parent |
| Crosshair tooltip throttle 16ms | tránh setState 60fps |
| Open Interest poll mỗi 30s (PriceCard) | không có WS stream OI |
| OI History poll mỗi 5 phút | data thay đổi chậm, tránh rate limit |
| EMA state lưu qua `emaStateRef` | O(1) per tick |
| alertVolume/alertTone đọc qua `soundRef` (useRef) | tránh stale closure |
| OrderBook/RecentTrades WS → RAF batch | @depth5 10msg/s, @aggTrade 50+msg/s |
| RecentTrades dùng Map keyed by aggId | dedup tự động |
| RecentTradesPanel overflow-hidden + height cố định | 30 row không scroll |
| Watchlist ngoài top 180 có WS stream riêng | giá realtime mọi pinned coin |
| StarButton tách component riêng | tránh toàn list re-render khi hover star |
| L/S Ratio dùng Promise.allSettled | topLongShort chỉ có cho coin lớn |
| L/S + OI History poll 30s/5m | không có WS stream, tránh rate limit |
| OI chart useEffect deps: [showOI, market] | re-init khi toggle hoặc đổi market |

---

## 📊 Indicator Calculations — Tham chiếu

| Indicator | File | Approach |
|---|---|---|
| MA (20/50/200) | ChartPanel.jsx | Full recalc khi load, O(period) slice per tick |
| EMA (9/21) | ChartPanel.jsx | `calcEMALine` full + O(1) per tick via `emaStateRef` |
| BB (20,2) | ChartPanel.jsx | `calcBB` full + `calcBBIncr` slice(-20) per tick |
| RSI (14) | ChartPanel.jsx | Full seed, O(1) Wilder smoothing per tick |
| MACD (12,26,9) | ChartPanel.jsx | Full EMA recalc khi load, O(1) per tick |
| OI History | useOIHistory.js | REST fetch, không incremental (data poll) |

---

## 🗺️ Roadmap

### ✅ Đã hoàn thành
- v1–v12: Chart, indicators, alerts, persist, funding rate, OI, EMA, sound
- v13: Order Book + Recent Trades (right panel toggle)
- v13.1: Fix RecentTrades (dedup, sort, no-scroll)
- v14: Watchlist cá nhân (pin/unpin, persist, badge, WS riêng)
- v15: Long/Short Ratio (3 loại, sparkline, gauge, signal badge)
- v16: OI History Chart (AreaSeries, sync timescale, toggle, poll 5m)

---

### 🔲 Tiếp theo — Priority cao (v17)

#### [PRIORITY 1] Taker Buy/Sell Volume Panel
**Mục đích:** Tách volume thành buy taker (xanh) vs sell taker (đỏ). Biết được bên nào đang aggressive. Khác hoàn toàn volume histogram thông thường.

**Files cần tạo/sửa:**
- `src/hooks/useTakerVolume.js` — fetch `/futures/data/takerbuysellevol`, poll 1 phút
- `ChartPanel.jsx` — dual bar chart dưới volume histogram

**API:** `GET /futures/data/takerbuysellevol?symbol=BTCUSDT&period=5m&limit=48`

**Response fields:** `buySellRatio`, `buyVol`, `sellVol`, `timestamp`

**Notes:**
- Vẽ 2 HistogramSeries chồng nhau hoặc grouped
- Thêm `showTakerVol` vào chartStore + persist
- Chỉ hiện khi Futures (giống OI)

---

#### [PRIORITY 2] CVD — Cumulative Volume Delta
**Mục đích:** Tổng tích lũy (buy taker − sell taker). Divergence CVD vs giá = tín hiệu mạnh nhất. Giá tăng nhưng CVD giảm → lực mua suy yếu.

**Files cần sửa:**
- `ChartPanel.jsx` — tính từ aggTrade WS (đã có qua useRecentTrades)
- Vẽ AreaSeries riêng hoặc overlay trên volume

**Notes:**
- `cvd += isBuyerMaker ? -qty : +qty` mỗi trade
- Lưu state qua `cvdRef` (pattern giống emaStateRef)
- Không cần endpoint mới

---

### 🔲 Priority trung bình (v18+)

| Tính năng | Mô tả | API |
|---|---|---|
| Liquidation Tracker | Forced liquidation realtime | Binance `allForceOrders` poll 10s |
| Funding Rate Full Chart | 100 chu kỳ funding history | `fundingRate?limit=100` |
| Multi-timeframe 2 chart | 1h trend + 5m entry song song | Thêm ChartPanel thứ 2 |

---

### 🔲 UX/Tiện ích (v19+)

| Tính năng | Mô tả |
|---|---|
| Price Level Annotations | Vẽ support/resistance, lưu localStorage |
| Export CSV kline | Tải xuống dữ liệu nến đang xem |
| Keyboard shortcuts | j/k navigate coin, 1-9 đổi interval |
| Notifications history | Log alerts đã trigger, xem lại được |

---

## ⚠️ Known Issues còn tồn tại

| Issue | Mức độ | Ghi chú |
|---|---|---|
| Sync timescale chỉ main→sub, không ngược lại | Rất thấp | Acceptable |
| MACD init O(n) recalc | Rất thấp | Acceptable với 500 candles |
| FundingSparkline chỉ fetch 1 lần khi mount | Rất thấp | Funding chỉ update 8h/lần |
| L/S topLongShort chỉ available cho ~20 coin lớn | Thấp | Handled bằng Promise.allSettled |
| OI History period không khớp 100% với interval chart | Thấp | INTERVAL_TO_PERIOD map xấp xỉ tốt nhất |

---

## 📦 Gửi file gì trong phiên làm việc tiếp theo

**Bắt buộc gửi:**
```
📄 active-context-v16.md     ← file này (bắt buộc, đọc trước tiên)
```

**Gửi nếu muốn sửa / thêm tính năng liên quan:**

| Muốn làm gì | File cần gửi thêm |
|---|---|
| Hoàn thiện OI Chart (nếu có bug) | `ChartPanel.jsx` + `chartStore.js` + `useOIHistory.js` |
| Thêm Taker Buy/Sell Volume | `ChartPanel.jsx` + `chartStore.js` |
| Thêm CVD | `ChartPanel.jsx` + `useRecentTrades.js` |
| Sửa L/S Ratio panel | `LongShortPanel.jsx` + `useLongShortRatio.js` |
| Thêm Liquidation Tracker | `binanceApi.js` + `App.jsx` |
| Sửa chart / thêm indicator | `ChartPanel.jsx` + `useKlineData.js` |
| Sửa sidebar / watchlist | `CoinList.jsx` + `watchlistStore.js` |
| Sửa price bar / funding | `PriceCard.jsx` + `useFundingRate.js` |
| Sửa alert / âm thanh | `AlertPanel.jsx` + `alertStore.js` + `useAlertChecker.js` |
| Sửa Order Book | `OrderBookPanel.jsx` + `useOrderBook.js` |
| Sửa API / network | `binanceApi.js` |
| Thêm tính năng mới toàn app | `App.jsx` + `chartStore.js` |

**Gợi ý câu prompt mở đầu phiên tới:**
```
Đây là active-context-v16.md theo dõi dự án Binance Tracker.
Đọc kỹ "Bug đã sửa" trước khi viết code.
Nhiệm vụ hôm nay: [mô tả]
```

**Không cần gửi:**
- `index.css`, `main.jsx`, `IntervalSelector.jsx`
- `project-docs.md` (chỉ đọc khi cần reference tổng quan)