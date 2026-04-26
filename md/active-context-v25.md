# Active Context v25
## Trạng thái: Cập nhật lần 25 ✅
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
| RecentTrades fix: Map dedup theo aggId | v13.1 (fix) |
| RecentTrades fix: sort desc aggId — mới nhất trên đầu | v13.1 (fix) |
| RecentTrades fix: overflow-hidden, 30 row cố định | v13.1 (fix) |
| Watchlist cá nhân — tab ⭐ trong sidebar | v14 |
| Pin / Unpin coin bằng nút ⭐ trên mọi tab | v14 |
| Persist watchlist vào localStorage | v14 |
| Badge đếm số coin đã pin trên tab ⭐ | v14 |
| WS stream riêng cho watchlist (ngoài top 180) | v14 |
| Long/Short Ratio Panel — 3 loại: Global / Top Acct / Top Pos | v15 |
| useLongShortRatio hook — REST poll 30s, lịch sử 24 điểm | v15 |
| Sparkline 24 điểm longRatio theo thời gian | v15 |
| GaugeBar long/short trực quan | v15 |
| SignalBadge tự động: Đám đông quá Long/Short / Cân bằng | v15 |
| useOIHistory.js — infinite scroll backward, poll 5 phút | v16 |
| OI History Chart — AreaSeries vàng, sync timescale main chart | v16 |
| Toggle button OI (chỉ hiện khi Futures) | v16 |
| useTakerVolume.js — infinite scroll backward, poll 1 phút | v17 |
| Taker Buy/Sell Volume panel — dual HistogramSeries xanh/đỏ | v17 |
| Toggle button TVol (chỉ hiện khi Futures) | v17 |
| Label B/S vol + % Buy realtime trên panel header | v17 |
| CVD — Cumulative Volume Delta panel (AreaSeries hồng) | v18 |
| CVD tính từ kline takerBuyVol — không cần endpoint mới | v18 |
| CVD O(1) incremental update per WS tick | v18 |
| useLiquidations.js — WS `!forceOrder@arr` Futures | v19 |
| Liq markers tam giác trên chart (arrowUp/arrowDown) | v19 |
| Lọc liq theo ngưỡng $10K USD — tránh noise | v19 |
| useFundingRateHistory.js — REST fetch 100 chu kỳ funding rate | v20 |
| Funding Rate History panel — HistogramSeries xanh/đỏ theo sign | v20 |
| Multi-timeframe: nút 2TF trong toolbar ChartPanel | v21 |
| SecondaryChartPanel.jsx — chart thứ 2 độc lập | v21 |
| Resizable divider giữa 2 chart (kéo chuột) | v22 |
| Notifications history — tab History trong AlertPanel | v22 |
| **Fix TDZ ReferenceError CoinList** — useImperativeHandle sau filtered | v23 (fix) |
| **Deploy lên Vercel** — qachart.vercel.app | v23 |
| **Favicon candlestick** — favicon.svg + favicon.ico | v23 |
| **Cloudflare Worker proxy** — bypass Binance geo-block cho /futures/data/* | v24 |
| **Fix TVol** — bỏ endpoint bị block, tính từ kline[7]/kline[10] | v25 (fix) |
| **useKlineData** — thêm `quoteVolume` + `takerBuyQuoteVol` từ kline | v25 (fix) |
| **ChartPanel** — `klineDataState` state để truyền vào useTakerVolume | v25 (fix) |
| **Console sạch** — 0 lỗi thật, chỉ còn browser extension noise | v25 ✅ |

---

## 🗺️ ROADMAP — Từ ưu tiên cao đến thấp

### 🔴 PRIORITY 1 — Làm ngay (v25 → v26)

| # | Tính năng | File cần sửa | Độ phức tạp |
|---|---|---|---|
| 1 | **Keyboard shortcuts** | `App.jsx` + `CoinList.jsx` + `ChartPanel.jsx` | Thấp |
| 2 | **Export CSV kline** | `ChartPanel.jsx` | Thấp |
| 3 | **Fullscreen mode** | `App.jsx` + `ChartPanel.jsx` | Thấp |
| 4 | **VWAP overlay** | `ChartPanel.jsx` | Thấp-Trung |

### 🟠 PRIORITY 2 — v27–v28

| # | Tính năng | Độ phức tạp |
|---|---|---|
| 5 | **Stochastic RSI** | Trung |
| 6 | **Drawing Tools nâng cao** | Trung |
| 7 | **Share URL / Deep Link** | Trung |
| 8 | **Heatmap Sidebar** | Trung |
| 9 | **Mobile Responsive** | Trung |

### 🟡 PRIORITY 3 — v29+

| # | Tính năng | Độ phức tạp |
|---|---|---|
| 10 | **Ichimoku Cloud** | Trung-Cao |
| 11 | **Screener Tab** | Cao |
| 12 | **Pattern Recognition** | Cao |
| 13 | **Correlation Chart** | Trung |

### 🟢 PRIORITY 4 — Polish

| # | Tính năng | Độ phức tạp |
|---|---|---|
| 14 | **PWA** | Thấp |
| 15 | **Dark/Light theme** | Thấp |
| 16 | **Volume Profile** | Rất cao |

---

## 🏗️ Infrastructure — Production (v23+)

| Layer | Service | URL |
|---|---|---|
| Frontend | Vercel Hobby | https://qachart.vercel.app |
| Futures data proxy | Cloudflare Workers | https://binance-proxy.anhtrinhciutb8.workers.dev |

### Endpoints qua Cloudflare Worker
- `/futures/data/openInterestHist` ✅
- `/futures/data/globalLongShortAccountRatio` ✅
- `/futures/data/topLongShortAccountRatio` ✅
- `/futures/data/topLongShortPositionRatio` ✅
- `/futures/data/takerBuySellVol` ❌ **BLOCKED** → dùng kline data thay thế

### TVol flow (v25)
```
kline[7]  = quoteVolume (tổng USD)
kline[10] = takerBuyQuoteVol (buy USD)
sellVol   = quoteVolume - takerBuyQuoteVol

ChartPanel: klineDataState state → useTakerVolume(symbol, interval, market, klineDataState)
useTakerVolume: tính buyVol/sellVol từ klineData prop, không gọi API
```

---

## 🐛 Bug đã sửa — KHÔNG được viết lại các pattern này

### BUG #1 — Chart lag / crosshair giật (v8)
```js
const _prices = {}
let _rafPending = false
updatePrice: (symbol, data) => {
  _prices[symbol] = { ...(_prices[symbol] || {}), ...data }
  if (!_rafPending) {
    _rafPending = true
    requestAnimationFrame(() => { _rafPending = false; set(s => ({ _tick: s._tick + 1 })) })
  }
}
```

### BUG #2 — Chart chỉ hiện 1 nến khi refresh nhanh (v8)
Buffer WS trong khi REST đang load → flush sau khi REST setData xong.

### BUG #3 — RSI overbought/oversold line bị ẩn (v8)
Dùng `createPriceLine` thay vì series riêng.

### BUG #4 — Sub-panel chart không init (v16)
`setTimeout(0)` defer createChart cho sub-panels.

### BUG #5 — Sub-chart sync bị lệch (v16)
Sync TimeRange (UTC), KHÔNG sync LogicalRange.

### BUG #6 — TDZ ReferenceError CoinList (v23)
`useImperativeHandle` phải đặt SAU `const filtered = useMemo(...)`.

### BUG #7 — Futures data CORS production (v24)
Vercel IP bị Binance geo-block → Cloudflare Worker proxy.

### BUG #8 — takerBuySellVol bị Binance block từ Cloudflare (v25)
Endpoint `/futures/data/takerBuySellVol` bị block ngay cả từ Cloudflare IP.
Fix: tính TVol từ kline data (`kline[7]`, `kline[10]`) — không cần API riêng.
```js
// useKlineData.js — WS kline field k.Q = takerBuyQuoteVol
takerBuyQuoteVol: parseFloat(k.Q ?? 0)

// binanceApi.js — REST kline field c[10]
takerBuyQuoteVol: parseFloat(c[10] ?? 0)
quoteVolume: parseFloat(c[7] ?? 0)

// useTakerVolume.js — tính từ klineData prop
buyVol  = d.takerBuyQuoteVol
sellVol = d.quoteVolume - d.takerBuyQuoteVol
```

---

## 🗺️ Pattern quan trọng — KHÔNG được vi phạm

| Pattern | Áp dụng ở đâu |
|---|---|
| cancelledRef để tránh setState sau unmount | mọi WS hook |
| RAF batch cho WS data fast-changing | useOrderBook, useRecentTrades |
| setTimeout(0) defer createChart | mọi sub-panel dùng createChart |
| Buffer WS → flush sau REST setData | useKlineData |
| useRef wrap cho mọi callback dùng trong effect | soundRef, markTriggeredRef, addNotifHistoryRef |
| RecentTrades dùng Map keyed by aggId | dedup tự động |
| Watchlist ngoài top 180 có WS stream riêng | giá realtime mọi pinned coin |
| L/S Ratio dùng Promise.allSettled | topLongShort chỉ có cho coin lớn |
| Sub-chart sync TimeRange (UTC), không sync LogicalRange | LogicalRange không tương đương |
| CVD O(1): chỉ tính delta nến hiện tại | không recalc toàn bộ mỗi WS tick |
| SecondaryChartPanel MA/EMA toggle local state riêng | không dùng chung showMA/showEMA global |
| ResizableDualChart dùng isDraggingRef (không dùng state) | tránh re-render khi drag |
| notifHistory tối đa 100 bản ghi (.slice(0, 100)) | tránh localStorage phình to |
| fetchFuturesData: isDev → /futures-data, !isDev → CF_WORKER_URL | không gọi thẳng fapi.binance.com khi prod |
| **useTakerVolume nhận klineData prop** — không gọi API riêng | tránh endpoint bị block |
| **klineDataState** trong ChartPanel update ở onData + onPrepend | để TVol re-render đúng |

---

## 📊 Indicator Calculations

| Indicator | Approach |
|---|---|
| MA (20/50/200) | Full recalc khi load, O(period) slice per tick |
| EMA (9/21) | Full + O(1) per tick via `emaStateRef` |
| BB (20,2) | Full + `calcBBIncr` slice(-20) per tick |
| RSI (14) | Full seed, O(1) Wilder smoothing per tick |
| MACD (12,26,9) | Full EMA recalc khi load, O(1) per tick |
| CVD | `calcCVDFull` khi load/prepend, O(1) per tick |
| TVol | Từ klineData: buyVol=kline[10], sellVol=kline[7]-kline[10] |
| VWAP | *(v26 — todo)* |

---

## 🗺️ Cấu trúc file (v25)

```
BINANCE-TRACKER/
├── api/
│   └── proxy.js                     — deprecated, có thể xóa
├── public/
│   ├── favicon.svg                  — candlestick icon
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── App.jsx                  — v26 todo: keyboard shortcuts + fullscreen
│   │   ├── ChartPanel.jsx           — v25: klineDataState + setKlineDataState
│   │   ├── SecondaryChartPanel.jsx
│   │   ├── CoinList.jsx             — v26 todo: keyboard j/k navigate
│   │   ├── PriceCard.jsx
│   │   ├── AlertPanel.jsx
│   │   ├── OrderBookPanel.jsx
│   │   ├── RecentTradesPanel.jsx
│   │   ├── DrawingToolbar.jsx
│   │   └── LongShortPanel.jsx
│   ├── hooks/
│   │   ├── useBinanceWS.js
│   │   ├── useKlineData.js          — v25: +quoteVolume +takerBuyQuoteVol
│   │   ├── useAlertChecker.js
│   │   ├── useFundingRate.js
│   │   ├── useFundingRateHistory.js
│   │   ├── useOrderBook.js
│   │   ├── useRecentTrades.js
│   │   ├── useLongShortRatio.js
│   │   ├── useOIHistory.js
│   │   ├── useTakerVolume.js        — v25: rewrite, dùng klineData prop
│   │   ├── useDrawingTools.js
│   │   └── useLiquidations.js
│   ├── store/
│   │   ├── marketStore.js
│   │   ├── chartStore.js
│   │   ├── alertStore.js
│   │   └── watchlistStore.js
│   └── services/
│       └── binanceApi.js            — v25: +quoteVolume +takerBuyQuoteVol
├── vercel.json                      — {"framework":"vite"}
└── vite.config.js
```

**Cloudflare Worker:**
- URL: `https://binance-proxy.anhtrinhciutb8.workers.dev`
- Edit: workers.cloudflare.com → binance-proxy → Edit code

---

## ⚠️ Known Issues

| Issue | Mức độ | Ghi chú |
|---|---|---|
| L/S topLongShort chỉ available cho ~20 coin lớn | Thấp | Handled bằng Promise.allSettled |
| TVol không có infinite scroll riêng | Thấp | Dùng kline data sẵn có — đủ dùng |
| Cloudflare Worker free: 100k req/ngày | Thấp | Đủ cho cá nhân dùng |
| WebSocket fstream.binance.com failed | Không phải lỗi | Browser extension (SES) can thiệp |
| Cannot access 'c' before initialization | Không phải lỗi | Browser extension (content.bundle.js) |

---

## 📦 Gửi file gì trong phiên làm việc tiếp theo

**Bắt buộc:**
```
📄 active-context-v25.md
```

**Làm v26 — Keyboard shortcuts + Export CSV + Fullscreen + VWAP:**
```
📄 App.jsx
📄 ChartPanel.jsx
📄 CoinList.jsx
📄 chartStore.js
```

**Prompt mở đầu v26:**
```
Đây là active-context-v25.md theo dõi dự án Binance Tracker (qachart.vercel.app).
Đọc kỹ "Bug đã sửa" và "Pattern quan trọng" trước khi viết code.
Nhiệm vụ v26: Keyboard shortcuts + Export CSV kline + Fullscreen mode + VWAP overlay.
File gửi kèm: App.jsx, ChartPanel.jsx, CoinList.jsx, chartStore.js
```