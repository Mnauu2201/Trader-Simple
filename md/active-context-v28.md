# Active Context v28
## Trạng thái: Cập nhật lần 28 ✅
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
| Đầy đủ intervals + Dropdown picker interval | v2 |
| Search coin, Sort, Load 300+ coin USDT | v2 |
| PriceCard: Open/High/Low/Vol/Bid/Ask | v3 |
| Auto-reconnect WebSocket sidebar | v3 |
| MA20 / MA50 / MA200 overlay, Toggle | v4 |
| RSI(14) panel + overbought/oversold PriceLine | v5/v8 |
| OHLCV tooltip + MA values khi hover | v5 |
| Price Alert + browser notification + âm thanh | v6 |
| Alert panel slide-in, badge đếm, direction | v6 |
| Persist localStorage — symbol, interval, market, MA, RSI, alerts | v7 |
| MACD panel + Toggle + tooltip + sync timescale | v8 |
| Bollinger Bands BB(20,2) + Toggle + tooltip | v8 |
| Tab Gainers / Losers trong sidebar | v8 |
| Funding Rate realtime, Mark Price, Index Price, Countdown | v9 |
| Fallback API URLs, REST retry 3 lần, WS auto-reconnect | v10 |
| Open Interest trong PriceCard, REST poll 30s | v11 |
| EMA(9) + EMA(21) overlay, O(1) per tick, persist | v12 |
| Âm thanh alert tùy chỉnh: volume slider + tone selector | v12 |
| Funding Rate History Sparkline | v12 |
| Order Book mini — top 5 bid/ask, depth bar, spread | v13 |
| Recent Trades — WS aggTrade, 30 trades, RAF batch | v13 |
| Right panel toggle: OrderBook / Trades / Alerts | v13 |
| Watchlist cá nhân — pin/unpin, persist, WS stream riêng | v14 |
| Long/Short Ratio Panel — 3 loại, sparkline, gauge, signal | v15 |
| OI History Chart — AreaSeries, sync timescale | v16 |
| Taker Buy/Sell Volume panel — dual Histogram | v17 |
| CVD panel — AreaSeries, O(1) per tick | v18 |
| Liquidation markers trên chart — arrowUp/Down, lọc $10K | v19 |
| Funding Rate History panel — Histogram xanh/đỏ | v20 |
| Multi-timeframe: 2TF button, SecondaryChartPanel | v21 |
| Resizable divider giữa 2 chart | v22 |
| Notifications history tab trong AlertPanel | v22 |
| Fix TDZ ReferenceError CoinList | v23 |
| Deploy Vercel + Favicon candlestick | v23 |
| Cloudflare Worker proxy bypass Binance geo-block | v24 |
| Fix TVol từ kline[7]/kline[10], console sạch | v25 |
| Keyboard shortcuts: j/k, 1-9, f | v26 ✅ |
| Export CSV kline | v26 ✅ |
| Fullscreen mode | v26 ✅ |
| VWAP overlay — calcVWAPFull, O(1) per tick, persist | v26 ✅ |
| Share URL / Deep Link — ?symbol=&interval=&market= | v27 ✅ |
| Nút Copy Link trong sidebar | v27 ✅ |
| **Screener Tab** — RSI<30, RSI>70, Vol Spike, \|%\|>5% | v28 ✅ |
| **calcRSI(14) client-side** từ kline 1h | v28 ✅ |
| **useScreener hook** — parallel fetch, chunk 10, poll 60s | v28 ✅ |
| **Badge đếm** coin pass filter trên tab ⚡ | v28 ✅ |
| **Sort thông minh** — RSI oversold tăng dần, overbought giảm dần | v28 ✅ |
| **Spin refresh button** + scan time display | v28 ✅ |

---

## 🗺️ ROADMAP — Từ ưu tiên cao đến thấp

### 🔴 PRIORITY 1 — Làm tiếp (v29)

| # | Tính năng | File cần sửa | Độ phức tạp |
|---|---|---|---|
| 1 | **Stochastic RSI** panel dưới chart | `ChartPanel.jsx` | Trung |
| 2 | **Alert theo % change** (không chỉ giá tuyệt đối) | `AlertPanel.jsx` + `alertStore.js` + `useAlertChecker.js` | Thấp-Trung |
| 3 | **Screener nâng cao** — thêm preset: Near High/Low 24h, FR cao | `CoinList.jsx` | Thấp |

### 🟠 PRIORITY 2 — v30–v31

| # | Tính năng | Độ phức tạp |
|---|---|---|
| 4 | **Heatmap Sidebar** — ô vuông màu theo %change, size theo vol | Trung |
| 5 | **Ichimoku Cloud** | Trung-Cao |
| 6 | **Drawing Tools nâng cao** (Fibonacci, Rectangle, xóa) | Trung |
| 7 | **Correlation Chart** (so sánh 2 coin cùng chart) | Trung |

### 🟡 PRIORITY 3 — v32+

| # | Tính năng | Độ phức tạp |
|---|---|---|
| 8 | **Pattern Recognition** (pin bar, engulfing auto-detect) | Cao |
| 9 | **Volume Profile** | Rất cao |

### 🟢 PRIORITY 4 — Polish

| # | Tính năng | Độ phức tạp |
|---|---|---|
| 10 | **PWA** (offline, install prompt) | Thấp |
| 11 | **Dark/Light theme** | Thấp |
| 12 | **Mobile Responsive polish** | Thấp-Trung |

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
- `/futures/data/takerBuySellVol` ❌ BLOCKED → dùng kline data

### Share URL flow (v27)
```
Mount: URLSearchParams → validate → setSymbol/setInterval/setMarket
Change: useEffect([symbol,interval,market]) → history.replaceState
Copy: navigator.clipboard.writeText(window.location.href)
```

### Screener flow (v28)
```
useScreener(allSymbols, market, prices, isActive):
  - Chỉ chạy khi tab 'screener' active
  - Fetch kline 1h, limit=16 (14+2) cho top 60 coin
  - Chunk 10 song song, 200ms delay giữa chunk → tránh rate limit
  - calcRSI(14) Wilder smoothing client-side
  - Poll lại mỗi SCREENER_POLL_MS = 60_000ms
  - cancelRef để abort khi unmount/tab đổi

SCREENER_PRESETS:
  rsi_os   → rsi < 30 (xanh) — sort RSI tăng dần
  rsi_ob   → rsi > 70 (đỏ)  — sort RSI giảm dần
  vol_spike → quoteVol > avgVol7d*2 (tím) — sort vol giảm dần
  big_move  → |change24h| > 5% (vàng) — sort vol giảm dần
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

### BUG #8 — takerBuySellVol bị block (v25)
Tính từ kline[7] và kline[10] thay vì gọi API riêng.

---

## 🗺️ Pattern quan trọng — KHÔNG được vi phạm

| Pattern | Áp dụng ở đâu |
|---|---|
| cancelledRef để tránh setState sau unmount | mọi WS hook + useScreener |
| RAF batch cho WS data fast-changing | useOrderBook, useRecentTrades |
| setTimeout(0) defer createChart | mọi sub-panel dùng createChart |
| Buffer WS → flush sau REST setData | useKlineData |
| useRef wrap cho mọi callback dùng trong effect | soundRef, markTriggeredRef |
| RecentTrades dùng Map keyed by aggId | dedup tự động |
| Watchlist ngoài top 180 có WS stream riêng | giá realtime pinned coin |
| L/S Ratio dùng Promise.allSettled | topLongShort chỉ có cho coin lớn |
| Sub-chart sync TimeRange, không sync LogicalRange | BUG #5 |
| CVD O(1) per tick | không recalc toàn bộ |
| SecondaryChartPanel MA/EMA local state riêng | không dùng global store |
| ResizableDualChart dùng isDraggingRef | tránh re-render khi drag |
| notifHistory tối đa 100 bản ghi | tránh localStorage phình to |
| fetchFuturesData: isDev→proxy local, prod→CF Worker | BUG #7 |
| useTakerVolume nhận klineData prop | tránh endpoint bị block |
| useShareURL: replaceState, không pushState | không spam history |
| **useScreener chỉ fetch khi isActive=true** | tránh fetch ngầm khi không xem tab |
| **Screener chunk 10 + delay 200ms** | tránh rate limit Binance |

---

## 📊 Indicator Calculations

| Indicator | Approach |
|---|---|
| MA (20/50/200) | Full recalc khi load, O(period) slice per tick |
| EMA (9/21) | Full + O(1) per tick via emaStateRef |
| BB (20,2) | Full + calcBBIncr slice(-20) per tick |
| RSI (14) | Full seed, O(1) Wilder smoothing per tick |
| MACD (12,26,9) | Full EMA recalc khi load, O(1) per tick |
| CVD | calcCVDFull khi load, O(1) per tick |
| TVol | Từ klineData: buyVol=kline[10], sellVol=kline[7]-kline[10] |
| VWAP | calcVWAPFull khi load, O(1) per tick via vwapStateRef |
| RSI Screener | calcRSI(closes) Wilder smoothing, kline 1h limit 16 |

---

## 🗺️ Cấu trúc file (v28)

```
BINANCE-TRACKER/
├── public/
│   ├── favicon.svg
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── App.jsx                  — v27: useShareURL + CopyLinkButton
│   │   ├── ChartPanel.jsx           — v26: VWAP + Export CSV
│   │   ├── SecondaryChartPanel.jsx
│   │   ├── CoinList.jsx             — v28: Screener Tab + useScreener + calcRSI
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
│   │   ├── useTakerVolume.js
│   │   ├── useDrawingTools.js
│   │   └── useLiquidations.js
│   ├── store/
│   │   ├── marketStore.js
│   │   ├── chartStore.js            — v26: +showVWAP
│   │   ├── alertStore.js
│   │   └── watchlistStore.js
│   └── services/
│       └── binanceApi.js
├── vercel.json
└── vite.config.js
```

---

## ⚠️ Known Issues

| Issue | Mức độ | Ghi chú |
|---|---|---|
| L/S topLongShort chỉ available cho ~20 coin lớn | Thấp | Promise.allSettled |
| Cloudflare Worker free: 100k req/ngày | Thấp | Đủ cho cá nhân |
| WebSocket fstream failed / Cannot access 'c' | Không phải lỗi | Browser extension noise |
| Screener avgVol7d dùng quoteVolume 24h thay vì 7d avg thật | Thấp | Đủ chính xác cho vol spike detection |
| Screener Vol Spike preset: avgVol7d chưa có data thật | Thấp | Hiện dùng quoteVolume*1 làm proxy — cần fetch kline 7d nếu muốn chính xác hơn |

---

## 📦 Gửi file gì trong phiên làm việc tiếp theo

**Bắt buộc:**
```
📄 active-context-v28.md    ← file này
```

**Làm v29 — Stochastic RSI:**
```
📄 ChartPanel.jsx
```

**Làm v29 — Alert theo % change:**
```
📄 AlertPanel.jsx
📄 alertStore.js
📄 useAlertChecker.js
```

**Làm v29 — Screener nâng cao (thêm preset Near High/Low 24h, FR cao):**
```
📄 CoinList.jsx
```

**Prompt mở đầu v29:**
```
Đây là active-context-v28.md theo dõi dự án Binance Tracker (qachart.vercel.app).
Đọc kỹ "Bug đã sửa" và "Pattern quan trọng" trước khi viết code.
Nhiệm vụ v29: [chọn tính năng]
File gửi kèm: [file tương ứng]
```