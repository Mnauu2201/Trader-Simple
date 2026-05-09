# Active Context v33
## Trạng thái: Cập nhật lần 33 ✅
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
| Screener nâng cao: StochRSI K < 20 / Near High/Low | v31 ✅ |
| Ichimoku Cloud — Tenkan/Kijun/Senkou A&B/Chikou overlay | v32 ✅ |
| **Drawing Tools nâng cao** — Select / Move / Delete từng nét | v33 ✅ |

---

## 🗺️ ROADMAP

### 🔴 PRIORITY 1 — Làm tiếp (v34)

| # | Tính năng | File cần sửa | Độ phức tạp |
|---|---|---|---|
| 1 | **Alert theo RSI** — trigger khi RSI < 30 / > 70 | `useAlertChecker.js`, `alertStore.js`, `AlertPanel.jsx` | Thấp-Trung |
| 2 | **Correlation Chart** — so sánh 2 coin cùng chart, % normalized | `SecondaryChartPanel.jsx`, `chartStore.js` | Trung |

### 🟠 PRIORITY 2 — v35–v36

| # | Tính năng | Độ phức tạp |
|---|---|---|
| 3 | **Heatmap nâng cao** — group theo sector (DeFi, L1, Meme...) | Trung |
| 4 | **Screener thêm preset** — MACD cross, BB squeeze | Thấp |

### 🟡 PRIORITY 3 — v37+

| # | Tính năng | Độ phức tạp |
|---|---|---|
| 5 | **Pattern Recognition** (pin bar, engulfing auto-detect) | Cao |
| 6 | **Volume Profile** | Rất cao |

### 🟢 PRIORITY 4 — Polish

| # | Tính năng | Độ phức tạp |
|---|---|---|
| 7 | **PWA** (offline, install prompt) | Thấp |
| 8 | **Dark/Light theme** | Thấp |
| 9 | **Mobile Responsive polish** | Thấp-Trung |

---

## 🏗️ Infrastructure

| Layer | Service | URL |
|---|---|---|
| Frontend | Vercel Hobby | https://qachart.vercel.app |
| Futures data proxy | Cloudflare Workers | https://binance-proxy.anhtrinhciutb8.workers.dev |

---

## 📐 Drawing Tools schema (v33)

```js
// File: src/hooks/useDrawingTools.js (v3 → v33: thêm select/move/delete)

// Drawing object: { id, type, points: [{x, y, price}], color, lineWidth, lineStyle, locked?, hidden? }

// ── v33: SELECT / MOVE / DELETE PER-DRAWING ──────────────────────────────
// State:
//   selectedId — ID của drawing đang được chọn
//   dragRef — {drawingId, mode:'move'|'point', ptIdx, startX, startY, origPoints}
//   ctxMenu — {x, y, drawingId}

// hitTestDrawing(d, px, py) — check từng loại tool (rect/fib_ret/hline/ray...)
// hitTestHandle(d, px, py) — return point index hoặc -1
// drawSelectionOverlay(ctx, d) — vẽ handle dots (5px, white fill + color border)

// Interactions:
//   Click drawing → selectedId → hiện handle dots
//   Drag handle → resize point
//   Drag body → move toàn bộ
//   Right-click → context menu: Duplicate / Lock / Hide / Delete
//   Delete/Backspace → xóa selectedId
//   Escape → deselect

// Context menu actions: ctxDelete, ctxDuplicate, ctxLock, ctxHide

// Return từ useDrawingTools (v33):
{
  drawings, drawingCount, hiddenAll, lockedAll,
  handleAction, scheduleRedraw, handleCursorMove, handleCursorLeave,
  selectedId, ctxMenu, setCtxMenu,           // ← v33
  ctxDelete, ctxDuplicate, ctxLock, ctxHide, // ← v33
  canvasProps
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
| VWAP | calcVWAPFull khi load, O(1) per tick |
| StochRSI (14,14,3,3) | calcStochRSIFull + updateStochRSIIncr O(1) |
| Ichimoku (9,26,52,26) | calcIchimokuFull khi load/prepend, O(periods) per tick |

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
| CVD O(1) per tick | không recalc toàn bộ |
| **Drawing select: hitTest per tool type** | rect → bbox, fib_ret → check levels, default → segment distance |
| **Drawing drag: mutate points directly** | dragRef active → translate points trong drawingsRef, commit vào setState lúc mouseUp |

---

## 📦 Gửi file gì trong phiên làm việc tiếp theo

**Bắt buộc:**
```
📄 active-context-v33.md    ← file này
```

**Làm v34 — Alert theo RSI:**
```
📄 useAlertChecker.js
📄 alertStore.js
📄 AlertPanel.jsx
📄 ChartPanel.jsx  (để lấy RSI state)
```

**Prompt mở đầu v34:**
```
Đây là active-context-v33.md theo dõi dự án Binance Tracker (qachart.vercel.app).
Đọc kỹ "Bug đã sửa" và "Pattern quan trọng" trước khi viết code.
Nhiệm vụ v34: Alert theo RSI
File gửi kèm: useAlertChecker.js, alertStore.js, AlertPanel.jsx, ChartPanel.jsx
```