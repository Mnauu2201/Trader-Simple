# Active Context v32
## Trạng thái: Cập nhật lần 32 ✅
> **Phiên làm việc tiếp theo:** Đọc mục "📦 Gửi file gì trong phiên tới" ở cuối file này trước khi bắt đầu.

---

## 📋 Tính năng đã hoàn thành (toàn bộ lịch sử)

| Tính năng | Version |
|---|---|
| Vite + React + Tailwind + lightweight-charts v5 | v1 |
| Spot / Futures toggle, giá realtime WS | v1 |
| Volume histogram, intervals, dropdown picker | v2 |
| Search coin, Sort, Load 300+ coin USDT | v2 |
| PriceCard, Auto-reconnect WS, Fallback API URLs | v3 |
| MA20/50/200 overlay + Toggle | v4 |
| RSI(14) panel + OB/OS PriceLine + OHLCV tooltip | v5/v8 |
| Price Alert + browser notification + âm thanh tùy chỉnh | v6/v12 |
| Persist localStorage toàn bộ settings | v7 |
| MACD + BB(20,2) overlay | v8 |
| Tab Gainers / Losers | v8 |
| Funding Rate, Mark/Index Price, Countdown | v9 |
| Fallback API, REST retry, WS auto-reconnect | v10 |
| Open Interest REST poll 30s | v11 |
| EMA(9/21) O(1) per tick | v12 |
| Order Book, Recent Trades, Right panel toggle | v13 |
| Watchlist cá nhân + WS stream riêng | v14 |
| Long/Short Ratio Panel + sparkline + gauge | v15 |
| OI History Chart + sync timescale | v16 |
| Taker Buy/Sell Volume dual Histogram | v17 |
| CVD panel O(1) per tick | v18 |
| Liquidation markers arrowUp/Down | v19 |
| Funding Rate History Histogram | v20 |
| Multi-timeframe 2TF + SecondaryChartPanel | v21 |
| Resizable divider + Notifications history | v22 |
| Fix TDZ CoinList + Deploy Vercel + Favicon | v23 |
| Cloudflare Worker proxy | v24 |
| Fix TVol từ kline data, console sạch | v25 |
| Keyboard shortcuts + Export CSV + Fullscreen + VWAP | v26 ✅ |
| Share URL / Deep Link + nút Copy Link | v27 ✅ |
| Screener Tab (RSI<30, RSI>70, Vol Spike, \|%\|>5%) | v28 ✅ |
| Stochastic RSI(14,14,3,3) panel + O(1) per tick | v29 ✅ |
| Alert theo % change 24h + 3 hướng + distance indicator | v30 ✅ |
| Heatmap Sidebar — ô vuông màu %change, size theo vol | v31 ✅ |
| Screener nâng cao: StochRSI K < 20 | v31 ✅ |
| Screener nâng cao: Near High 24h / Near Low 24h | v31 ✅ |
| Screener: badge thông minh, preset "Instant", sort thông minh | v31 ✅ |
| **Ichimoku Cloud** — Tenkan/Kijun/Senkou A&B/Chikou overlay trên main chart | v32 ✅ |

---

## 🗺️ ROADMAP

### 🔴 PRIORITY 1 — Làm tiếp (v33)

| # | Tính năng | File cần sửa | Độ phức tạp |
|---|---|---|---|
| 1 | **Drawing Tools nâng cao** — Fibonacci Retracement, Rectangle, xóa từng nét | `ChartPanel.jsx`, `DrawingToolbar.jsx` | Trung |
| 2 | **Correlation Chart** — so sánh 2 coin cùng chart, % normalized | `SecondaryChartPanel.jsx` hoặc component mới | Trung |

### 🟠 PRIORITY 2 — v34–v35

| # | Tính năng | Độ phức tạp |
|---|---|---|
| 3 | **Alert theo RSI** (trigger khi RSI < 30 / > 70) | Thấp-Trung |
| 4 | **Heatmap nâng cao** — group theo sector (DeFi, L1, Meme...) | Trung |
| 5 | **Screener thêm preset** — MACD cross, BB squeeze | Thấp |

### 🟡 PRIORITY 3 — v36+

| # | Tính năng | Độ phức tạp |
|---|---|---|
| 6 | **Pattern Recognition** (pin bar, engulfing auto-detect) | Cao |
| 7 | **Volume Profile** | Rất cao |

### 🟢 PRIORITY 4 — Polish

| # | Tính năng | Độ phức tạp |
|---|---|---|
| 8 | **PWA** (offline, install prompt) | Thấp |
| 9 | **Dark/Light theme** | Thấp |
| 10 | **Mobile Responsive polish** | Thấp-Trung |

---

## 🏗️ Infrastructure

| Layer | Service | URL |
|---|---|---|
| Frontend | Vercel Hobby | https://qachart.vercel.app |
| Futures data proxy | Cloudflare Workers | https://binance-proxy.anhtrinhciutb8.workers.dev |

---

## 📐 Ichimoku Cloud schema (v32)

```js
// Constants
ICHI_TENKAN   = 9    // Tenkan-sen (Conversion Line)
ICHI_KIJUN    = 26   // Kijun-sen (Base Line)
ICHI_SENKOU_B = 52   // Senkou Span B lookback
ICHI_DISPLACE = 26   // Senkou A/B shift forward; Chikou shift backward

// Formula
// Tenkan-sen:  (highest_high + lowest_low) / 2  over 9 periods
// Kijun-sen:   (highest_high + lowest_low) / 2  over 26 periods
// Senkou A:    (Tenkan + Kijun) / 2, shifted +26 candles FORWARD
// Senkou B:    (highest_high + lowest_low) / 2  over 52 periods, shifted +26 forward
// Chikou:      close, plotted at (current - 26) — shifted 26 back

// Rendering (on main chart)
// Tenkan:  LineSeries #2196f3 (xanh dương), lineWidth 1
// Kijun:   LineSeries #ff6b35 (cam), lineWidth 1
// Senkou A: LineSeries #0ecb8188 (xanh nhạt, alpha)
// Senkou B: LineSeries #f6465d88 (đỏ nhạt, alpha)
// Chikou:  LineSeries #a855f7 (tím)
// Cloud fill: KHÔNG dùng AreaSeries (lightweight-charts v5 không hỗ trợ fill giữa 2 series)
//   → User phân biệt bullish/bearish qua màu A (xanh) vs B (đỏ)

// Toggle: showIchimoku in chartStore — persisted localStorage
// Button label: "Ichimoku" (cam: #ff9800 khi active)
// Tooltip: T / K / SpA / SpB values khi crosshair hover
// Min data: ICHI_SENKOU_B (52) candles

// Update pattern:
// - onKlineData: calcIchimokuFull → setData tất cả 5 series
// - onKlineUpdate: recalc cuối mỗi series (O(periods) per tick) — không có state riêng
// - onKlinePrepend: calcIchimokuFull trên merged data
// - showIchimoku toggle effect: setData ngay nếu data đủ

// _ichiHL(data, from, period): helper tính (HH + LL) / 2 trong window
// Senkou A/B future time: dùng thời gian nến thật nếu có, estimate từ avg_interval nếu không
```

---

## 📐 Screener schema (v31)

```js
// SCREENER_PRESETS — mỗi preset có:
{
  id: string,
  label: string,
  desc: string,
  color: string,
  icon: string,
  needsFetch: boolean,   // false = hiện ngay từ prices (không chờ scan)
  test: (d, prices) => boolean
}

// screenData[symbol] (v31)
{ rsi: number|null, stochK: number|null, error: boolean }

// needsFetch=false presets (instant, dùng prices từ WS):
//   near_high: price >= high24h * 0.95
//   near_low:  price <= low24h  * 1.05
//   vol_spike: quoteVolume > avgVol7d * 2
//   big_move:  |change24h| > 5%

// needsFetch=true presets (cần scan kline):
//   rsi_os:      RSI(14) < 30
//   rsi_ob:      RSI(14) > 70
//   stochrsi_os: StochRSI_K(14,14,3) < 20
```

---

## 📐 Heatmap schema (v31)

```js
// HeatmapPanel — dùng store trực tiếp, không cần props
// Data source: useMarketStore(s => s.prices) — realtime từ WS sẵn có
// Size mode: 'equal' | 'vol' (flex dựa vào sqrt(volRatio))
// Click ô → tooltip → nút "Xem chart" → setSymbol
// Width trong App: w-[280px], accent color: #22d3ee (cyan)
```

---

## 📐 Indicator Calculations

| Indicator | Approach |
|---|---|
| MA (20/50/200) | Full recalc khi load, O(period) slice per tick |
| EMA (9/21) | Full + O(1) Wilder per tick |
| BB (20,2) | Full + calcBBIncr slice(-20) per tick |
| RSI (14) | Full seed, O(1) Wilder per tick |
| MACD (12,26,9) | Full EMA recalc khi load, O(1) per tick |
| CVD | calcCVDFull khi load, O(1) per tick |
| TVol | Từ kline[7]/kline[10] |
| VWAP | calcVWAPFull khi load, O(1) per tick |
| StochRSI (14,14,3,3) | calcStochRSIFull + updateStochRSIIncr O(1) |
| **Ichimoku (9,26,52,26)** | calcIchimokuFull khi load/prepend, O(periods) per tick (recalc cuối) |
| **Screener RSI** | calcRSI(closes) — Wilder smoothing |
| **Screener StochRSI K** | calcStochRSI_K(closes) — RSI dãy → stochRaw → SMA(3) |

---

## 🐛 Bug đã sửa — KHÔNG viết lại

| Bug | Fix |
|---|---|
| Chart lag crosshair | RAF batch + _rafPending |
| Chart 1 nến khi refresh nhanh | Buffer WS → flush sau REST |
| RSI OB/OS lines bị ẩn | createPriceLine thay vì series riêng |
| Sub-panel không init | setTimeout(0) defer createChart |
| Sub-chart sync lệch | OI/TV/FR dùng TimeRange(UTC); RSI/MACD/StochRSI dùng LogicalRange |
| TDZ ReferenceError CoinList | useImperativeHandle sau useMemo |
| Futures CORS production | Cloudflare Worker proxy |
| takerBuySellVol bị block | Tính từ kline[7] + kline[10] |

---

## 🗺️ Pattern quan trọng

| Pattern | Áp dụng ở đâu |
|---|---|
| cancelledRef tránh setState sau unmount | mọi WS hook + useScreener |
| RAF batch WS fast-changing | useOrderBook, useRecentTrades |
| setTimeout(0) defer createChart | mọi sub-panel |
| Sub-chart OI/TV/FR sync TimeRange(UTC) | khác độ phân giải với main chart |
| RSI/MACD/StochRSI sync LogicalRange | cùng kline data |
| CVD O(1) per tick | không recalc toàn bộ |
| useShareURL replaceState (không pushState) | không spam history |
| useScreener chỉ fetch khi isActive=true | tránh fetch ngầm |
| Screener chunk 10 + delay 200ms | tránh rate limit Binance |
| useTakerVolume nhận klineData prop | tránh endpoint bị block |
| notifHistory tối đa 100 bản ghi | tránh localStorage phình |
| Alert backward compat: type ?? 'price' | alert cũ không có type field |
| Percent alert check data.change24h | không dùng data.price để check |
| needsFetch=false preset hiện ngay | Near High/Low/Vol/BigMove không cần chờ scan |
| HeatmapPanel đọc store trực tiếp | không cần props, realtime từ WS |
| Screener sort thông minh theo preset | near_high sort pctFromHigh, near_low sort pctFromLow |
| **Ichimoku overlay trên main chart** | không tạo sub-panel riêng — 5 LineSeries trên mainChart |
| **Ichimoku Senkou time estimation** | dùng avgInterval khi futureIdx >= data.length |
| **Ichimoku toggle: setData ngay** | showIchimoku effect tự setData nếu data đủ 52 nến |

---

## 🗺️ Cấu trúc file (v32)

```
src/
├── components/
│   ├── App.jsx                  — v31: +HeatmapPanel import + PANEL_CONFIG
│   ├── ChartPanel.jsx           — v32: +Ichimoku Cloud (5 series, calc, toggle, tooltip)
│   ├── SecondaryChartPanel.jsx
│   ├── CoinList.jsx             — v31: +StochRSI screener, Near High/Low, needsFetch
│   ├── HeatmapPanel.jsx         — v31: MỚI — heatmap sidebar
│   ├── PriceCard.jsx
│   ├── AlertPanel.jsx           — v30: +Alert % change
│   ├── OrderBookPanel.jsx
│   ├── RecentTradesPanel.jsx
│   ├── DrawingToolbar.jsx
│   └── LongShortPanel.jsx
├── hooks/
│   ├── useAlertChecker.js       — v30: +percent alert check
│   └── ... (các hook khác không đổi)
├── store/
│   ├── alertStore.js            — v30: +type, percentValue, percentDir
│   ├── chartStore.js            — v32: +showIchimoku, +setShowIchimoku
│   └── ...
└── services/
    └── binanceApi.js
```

---

## ⚠️ Known Issues

| Issue | Mức độ | Ghi chú |
|---|---|---|
| Screener StochRSI cần 60 candles thay vì 16 | Thấp | Fetch lâu hơn ~2s, OK |
| Near High/Low dùng high24h/low24h từ REST | Thấp | Update mỗi lần đổi market |
| Heatmap size=vol: coin nhỏ ô rất nhỏ (min 36px) | Thấp | UX chấp nhận được |
| Cloudflare Worker free 100k req/ngày | Thấp | Đủ cho cá nhân |
| **Ichimoku: không có cloud fill (shading)** | Thấp | lightweight-charts v5 không hỗ trợ fill giữa 2 LineSeries. User phân biệt qua màu SpA (xanh) vs SpB (đỏ). Workaround: dùng AreaSeries riêng nhưng phức tạp. |
| **Ichimoku: Senkou spans ở cuối chart bị estimated time** | Rất thấp | Khi futureIdx >= data.length, time được estimate từ avgInterval. Khi load thêm nến cũ (prepend), sẽ tự fix. |

---

## 📦 Gửi file gì trong phiên làm việc tiếp theo

**Bắt buộc:**
```
📄 active-context-v32.md    ← file này
```

**Làm v33 — Drawing Tools nâng cao (Fibonacci, Rectangle):**
```
📄 ChartPanel.jsx
📄 DrawingToolbar.jsx
```

**Làm v33 — Correlation Chart:**
```
📄 SecondaryChartPanel.jsx
📄 chartStore.js
```

**Làm v33 — Alert theo RSI:**
```
📄 useAlertChecker.js
📄 alertStore.js
📄 AlertPanel.jsx
```

**Prompt mở đầu v33:**
```
Đây là active-context-v32.md theo dõi dự án Binance Tracker (qachart.vercel.app).
Đọc kỹ "Bug đã sửa" và "Pattern quan trọng" trước khi viết code.
Nhiệm vụ v33: [chọn tính năng]
File gửi kèm: [file tương ứng]
```