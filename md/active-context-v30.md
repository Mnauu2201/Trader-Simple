# Active Context v30
## Trạng thái: Cập nhật lần 30 ✅
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
| **Alert theo % change 24h** | v30 ✅ |
| **Toggle $ Giá / % Change trong form alert** | v30 ✅ |
| **3 hướng: ▲ Tăng ≥X% / ▼ Giảm ≥X% / ⚡ \|±X%\|** | v30 ✅ |
| **Badge ▲% / ▼% / ⚡% trong AlertRow** | v30 ✅ |
| **Distance indicator: "còn X% nữa"** | v30 ✅ |
| **HistoryRow hiển thị triggeredChange 24h%** | v30 ✅ |
| **Backward compat: alert cũ (type=price) vẫn hoạt động** | v30 ✅ |

---

## 🗺️ ROADMAP

### 🔴 PRIORITY 1 — Làm tiếp (v31)

| # | Tính năng | File cần sửa | Độ phức tạp |
|---|---|---|---|
| 1 | **Heatmap Sidebar** — ô vuông màu theo %change, size theo vol | `App.jsx` + component mới | Trung |
| 2 | **Screener nâng cao** — thêm preset: Near High/Low 24h, StochRSI oversold | `CoinList.jsx` | Thấp |
| 3 | **Ichimoku Cloud** | `ChartPanel.jsx` | Trung-Cao |

### 🟠 PRIORITY 2 — v32–v33

| # | Tính năng | Độ phức tạp |
|---|---|---|
| 4 | **Drawing Tools nâng cao** (Fibonacci, Rectangle, xóa từng nét) | Trung |
| 5 | **Correlation Chart** (so sánh 2 coin cùng chart) | Trung |
| 6 | **Alert theo RSI** (trigger khi RSI < 30 / > 70) | Thấp-Trung |

### 🟡 PRIORITY 3 — v34+

| # | Tính năng | Độ phức tạp |
|---|---|---|
| 7 | **Pattern Recognition** (pin bar, engulfing auto-detect) | Cao |
| 8 | **Volume Profile** | Rất cao |

### 🟢 PRIORITY 4 — Polish

| # | Tính năng | Độ phức tạp |
|---|---|---|
| 9 | **PWA** (offline, install prompt) | Thấp |
| 10 | **Dark/Light theme** | Thấp |
| 11 | **Mobile Responsive polish** | Thấp-Trung |

---

## 🏗️ Infrastructure

| Layer | Service | URL |
|---|---|---|
| Frontend | Vercel Hobby | https://qachart.vercel.app |
| Futures data proxy | Cloudflare Workers | https://binance-proxy.anhtrinhciutb8.workers.dev |

---

## 📐 Alert % change schema (v30)

```js
// alertStore.addAlert(symbol, targetPrice, direction, opts)
// opts = { type, percentValue, percentDir }

// Price alert (legacy)
{ type: 'price', targetPrice: 81000, direction: 'above' }

// Percent alert (v30)
{ type: 'percent', percentValue: 5, percentDir: 'above' }   // change24h >= +5%
{ type: 'percent', percentValue: 5, percentDir: 'below' }   // change24h <= -5%
{ type: 'percent', percentValue: 5, percentDir: 'either' }  // |change24h| >= 5%

// percentDir values: 'above' | 'below' | 'either'
// Backward compat: alert không có type → treated as 'price'

// notifHistory entry (v30)
{
  id, symbol, type, targetPrice, percentValue, percentDir,
  triggeredPrice, triggeredChange,  // ← change24h lúc trigger
  direction, triggeredAt
}
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
| **Alert backward compat: type ?? 'price'** | alert cũ không có type field |
| **Percent alert check data.change24h** | không dùng data.price để check |

---

## 🗺️ Cấu trúc file (v30)

```
src/
├── components/
│   ├── App.jsx                  — v27: useShareURL + CopyLinkButton
│   ├── ChartPanel.jsx           — v29: +StochRSI
│   ├── SecondaryChartPanel.jsx
│   ├── CoinList.jsx             — v28: Screener Tab
│   ├── PriceCard.jsx
│   ├── AlertPanel.jsx           — v30: +Alert % change, toggle $ / %
│   ├── OrderBookPanel.jsx
│   ├── RecentTradesPanel.jsx
│   ├── DrawingToolbar.jsx
│   └── LongShortPanel.jsx
├── hooks/
│   ├── useAlertChecker.js       — v30: +percent alert check, change24h
│   └── ... (các hook khác không đổi)
├── store/
│   ├── alertStore.js            — v30: +type, percentValue, percentDir trong addAlert
│   ├── chartStore.js            — v29: +showStochRSI
│   └── ...
└── services/
    └── binanceApi.js
```

---

## ⚠️ Known Issues

| Issue | Mức độ | Ghi chú |
|---|---|---|
| Percent alert check mỗi lần prices update | Thấp | change24h update theo WS — OK |
| Alert cũ từ localStorage không có `type` field | Không vấn đề | code dùng `alert.type ?? 'price'` |
| Cloudflare Worker free 100k req/ngày | Thấp | Đủ cho cá nhân |
| WS noise từ browser extension | Không phải lỗi | SES, content.bundle.js |

---

## 📦 Gửi file gì trong phiên làm việc tiếp theo

**Bắt buộc:**
```
📄 active-context-v30.md    ← file này
```

**Làm v31 — Heatmap Sidebar:**
```
📄 App.jsx
📄 CoinList.jsx
```

**Làm v31 — Screener nâng cao (thêm Near High/Low, StochRSI):**
```
📄 CoinList.jsx
```

**Làm v31 — Ichimoku Cloud:**
```
📄 ChartPanel.jsx
📄 chartStore.js
```

**Prompt mở đầu v31:**
```
Đây là active-context-v30.md theo dõi dự án Binance Tracker (qachart.vercel.app).
Đọc kỹ "Bug đã sửa" và "Pattern quan trọng" trước khi viết code.
Nhiệm vụ v31: [chọn tính năng]
File gửi kèm: [file tương ứng]
```