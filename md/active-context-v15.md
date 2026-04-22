# Active Context v15
## Trạng thái: Cập nhật lần 15 ✅
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
**Rule:** RecentTrades PHẢI dùng Map (không phải array) để dedup. Panel PHẢI dùng `overflow-hidden`. Row PHẢI có height cố định.

---

### BUG #12 — Watchlist coin ngoài top 180 không có giá realtime (v14 design)
**Fix đúng (CoinList.jsx v14):**
```js
const watchSymbolsOutside = useMemo(() => {
  const top180Set = new Set(streamSymbols)
  return watchSymbols.filter(s => !top180Set.has(s))
}, [watchSymbols, streamSymbols])
useBinanceWS(watchSymbolsOutside, market)
```

---

### BUG #13 — L/S Ratio: Promise.allSettled thay vì Promise.all (v15 design)
**Vấn đề:** Binance đôi khi trả lỗi cho 1 trong 3 endpoints (topLongShort chỉ có cho BTC/ETH/BNB và một số coin lớn). Nếu dùng `Promise.all` → toàn bộ data fail dù 2 endpoint kia ok.

**Fix đúng (useLongShortRatio.js):**
```js
const [global, globalHist, topAcct, topAcctHist, topPos, topPosHist] =
  await Promise.allSettled([...])

// Kiểm tra status trước khi parse
const globalVal = globalCurrent.status === 'fulfilled'
  ? parseEntry(globalCurrent.value) : null
```
**Rule:** Mọi fetch song song nhiều endpoints PHẢI dùng `Promise.allSettled`. Không dùng `Promise.all` khi có endpoint có thể fail theo coin.

---

## 🏗️ Kiến trúc hiện tại (v15)

```
App
├── AlertEngine (background hook — useAlertChecker)
├── Sidebar (200px, flex-shrink-0)
│   ├── Logo bar
│   ├── CoinList
│   │   ├── Tab: Thị trường (search, sort, 60→all coin + ⭐ button mỗi row)
│   │   ├── Tab: ⭐ Watchlist (pinned coins, badge count, empty state)
│   │   ├── Tab: ▲ Tăng (top 20 gainers, snapshot 3s + ⭐ button)
│   │   └── Tab: ▼ Giảm (top 20 losers, snapshot 3s + ⭐ button)
│   └── Toggle buttons (bottom)
│       ├── ⚖ L/S Ratio     ← MỚI v15
│       ├── 📊 Order Book
│       ├── ⚡ Recent Trades
│       └── 🔔 Price Alerts (badge count)
└── Main area (flex-1)
    ├── PriceCard (flex-shrink-0, header bar)
    └── Content row (flex)
        ├── ChartPanel (flex-1)
        └── Right panel (exclusive toggle, 220-280px)
            ├── LongShortPanel — 3 loại ratio + sparkline ← MỚI v15
            ├── OrderBookPanel — depth5 + depth bar + spread
            ├── RecentTradesPanel — 30 aggTrades, fixed rows, no scroll
            └── AlertPanel — price alert + SoundSettings
```

---

## 📁 Cây file đầy đủ

```
src/
├── components/
│   ├── App.jsx               — root layout, AlertEngine, right panel toggle
│   ├── CoinList.jsx          — sidebar v14: 4 tabs + ⭐ pin button mọi row
│   ├── ChartPanel.jsx        — chart chính (candle+MA+EMA+BB+RSI+MACD)
│   ├── PriceCard.jsx         — header bar giá + funding + OI + sparkline
│   ├── AlertPanel.jsx        — price alert UI + SoundSettings
│   ├── LongShortPanel.jsx    — Long/Short Ratio panel ← MỚI v15
│   ├── OrderBookPanel.jsx    — Order book top 5 bid/ask + depth bar + spread
│   ├── RecentTradesPanel.jsx — 30 trades fixed height, no scroll (v13.1)
│   └── IntervalSelector.jsx  — (deprecated)
├── hooks/
│   ├── useBinanceWS.js       — WS ticker stream (batch 40/conn)
│   ├── useKlineData.js       — WS + REST kline (retry + reconnect)
│   ├── useAlertChecker.js    — background checker (soundRef pattern)
│   ├── useFundingRate.js     — WS markPrice + OI polling
│   ├── useLongShortRatio.js  — REST poll 30s, 3 loại ratio ← MỚI v15
│   ├── useOrderBook.js       — WS @depth5 + RAF batch + reconnect
│   └── useRecentTrades.js    — WS @aggTrade + Map dedup + RAF (v13.1)
├── store/
│   ├── marketStore.js        — prices (_prices module-level + RAF)
│   ├── chartStore.js         — symbol, interval, market, indicators, alertSound
│   ├── alertStore.js         — alerts list (persist)
│   └── watchlistStore.js     — pinned symbols (persist, max 50)
├── services/
│   └── binanceApi.js         — v15: +getLongShortRatio +getTopLongShortAccountRatio
│                                    +getTopLongShortPositionRatio +getOpenInterestHist
├── index.css                 — Tailwind + scrollbar custom
└── main.jsx                  — entry point
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
| Open Interest poll mỗi 30s | không có WS stream OI từ Binance |
| EMA state lưu qua `emaStateRef` | O(1) per tick |
| alertVolume/alertTone đọc qua `soundRef` (useRef) | tránh stale closure |
| OrderBook/RecentTrades WS → RAF batch | @depth5 10msg/s, @aggTrade 50+msg/s |
| RecentTrades dùng Map keyed by aggId | dedup tự động, tránh duplicate |
| RecentTradesPanel dùng overflow-hidden + height cố định | 30 row không scroll |
| Watchlist ngoài top 180 có WS stream riêng | đảm bảo giá realtime mọi pinned coin |
| StarButton tách component riêng | tránh toàn bộ list re-render khi hover 1 star |
| L/S Ratio dùng Promise.allSettled (không phải Promise.all) | topLongShort chỉ có cho coin lớn |
| L/S Ratio poll 30s thay vì liên tục | không có WS stream, REST rate limit |

---

## 📊 Indicator Calculations — Tham chiếu

| Indicator | File | Approach |
|---|---|---|
| MA (20/50/200) | ChartPanel.jsx | Full recalc khi load, O(period) slice per tick |
| EMA (9/21) | ChartPanel.jsx | `calcEMALine` full + O(1) per tick via `emaStateRef` |
| BB (20,2) | ChartPanel.jsx | `calcBB` full + `calcBBIncr` slice(-20) per tick |
| RSI (14) | ChartPanel.jsx | Full seed, O(1) Wilder smoothing per tick |
| MACD (12,26,9) | ChartPanel.jsx | Full EMA recalc khi load, O(1) per tick |

---

## 🗺️ Roadmap Futures Dashboard

### ✅ Đã hoàn thành
- v1–v12: Chart, indicators, alerts, persist, funding rate, OI, EMA, sound
- v13: Order Book + Recent Trades (right panel toggle)
- v13.1: Fix RecentTrades (dedup, sort, no-scroll)
- v14: Watchlist cá nhân (pin/unpin, persist, badge, WS riêng)
- v15: Long/Short Ratio (3 loại, sparkline, signal badge)

---

### 🔲 Futures Dashboard — Priority cao (v16+)

#### [PRIORITY 1] Open Interest History Chart
**Mục đích:** Vẽ OI theo thời gian như một chart panel riêng (dưới chart giá, sync timescale). OI tăng cùng giá = trend mạnh. OI giảm khi giá tăng = cảnh báo divergence.

**Files cần tạo/sửa:**
- `src/hooks/useOIHistory.js` — fetch `getOpenInterestHist()` (đã có trong binanceApi v15), poll 5 phút
- `ChartPanel.jsx` — thêm OI panel với lightweight-charts `AreaSeries`, sync timescale

**API:** `GET /futures/data/openInterestHist?symbol=BTCUSDT&period=5m&limit=48`

**Lưu ý khi code:**
- OI unit là số coin (không phải USDT) — cần fmtVol + symbol label
- Sync timescale với main chart theo pattern giống RSI/MACD panels
- Toggle `showOI` trong chartStore + persist

---

#### [PRIORITY 2] Taker Buy/Sell Volume
**Mục đích:** Tách volume nến thành "buy taker" (xanh) và "sell taker" (đỏ). Cho biết bên nào đang aggressive. Khác với volume bình thường (không phân biệt chiều).

**Files cần tạo/sửa:**
- `src/hooks/useTakerVolume.js` — fetch `/futures/data/takerbuysellevol`, poll 1 phút
- `ChartPanel.jsx` — thêm dual bar chart bên dưới volume histogram

**API:** `GET /futures/data/takerbuysellevol?symbol=BTCUSDT&period=5m&limit=48`

**Lưu ý khi code:**
- Response có `buySellRatio`, `buyVol`, `sellVol`
- Vẽ 2 bar series chồng nhau (grouped) hoặc stacked
- Thêm toggle `showTakerVol` trong chartStore

---

#### [PRIORITY 3] CVD — Cumulative Volume Delta
**Mục đích:** Tổng tích lũy (buy taker - sell taker) theo thời gian. Divergence CVD vs giá là tín hiệu mạnh nhất. Nếu giá tăng nhưng CVD giảm → lực mua đang suy yếu.

**Files cần tạo/sửa:**
- `ChartPanel.jsx` — tính CVD từ aggTrade WS data (đã có)
- Vẽ như AreaSeries trong panel riêng hoặc overlay trên volume

**Lưu ý khi code:**
- Không cần endpoint mới — tính từ `useRecentTrades` data
- `cvd += (isBuyerMaker ? -qty : +qty)` cho mỗi trade
- Cần accumulate state qua `cvdRef` (tương tự emaStateRef)

---

### 🔲 Futures Dashboard — Priority trung bình (v17+)

#### [PRIORITY 4] Liquidation Tracker
**Mục đích:** Hiển thị các lệnh bị forced-liquidate realtime. Volume liquidation lớn = vùng giá quan trọng.

**API Binance:** `GET /fapi/v1/allForceOrders` (REST snapshot, không có WS public stream cho liquidation từ Binance)
**Thay thế tốt hơn:** Coinglass Liquidation API (cần key) — nếu không muốn dùng key thì dùng Binance forceOrders poll 10s

**Files cần tạo:**
- `src/hooks/useLiquidations.js`
- `src/components/LiquidationPanel.jsx`

---

#### [PRIORITY 5] Funding Rate Full Chart (mở rộng từ Sparkline)
**Mục đích:** Chart đầy đủ 100 chu kỳ funding rate (thay vì 10 bars hiện tại). Thấy được trend funding: leo thang liên tục = nguy hiểm cho longs.

**Files cần sửa:**
- `PriceCard.jsx` — bỏ FundingSparkline mini
- `src/components/FundingRatePanel.jsx` — panel riêng với chart đầy đủ

**API:** `GET /fapi/v1/fundingRate?symbol=BTCUSDT&limit=100` (đã có trong binanceApi)

---

### 🔲 UX/Tiện ích — Priority thấp (v18+)

| Tính năng | Mô tả |
|---|---|
| Multi-timeframe view 2 chart | 1h trend + 5m entry cùng lúc |
| Price Level Annotations | Vẽ support/resistance, lưu localStorage |
| Export CSV kline data | Tải xuống dữ liệu nến đang xem |
| Keyboard shortcuts | j/k navigate coin list, 1-9 đổi interval |
| Notifications history | Log alerts đã trigger có thể xem lại |

---

## ⚠️ Known Issues còn tồn tại

| Issue | Mức độ | Ghi chú |
|---|---|---|
| Sync timescale chỉ main→RSI/MACD, không ngược lại | Rất thấp | Acceptable |
| MACD init O(n) recalc toàn bộ | Rất thấp | Acceptable với 500 candles |
| FundingSparkline chỉ fetch 1 lần khi mount | Rất thấp | Funding rate chỉ cập nhật 8h/lần |
| L/S topLongShort chỉ available cho BTC/ETH/BNB và ~20 coin lớn | Thấp | Handled bằng Promise.allSettled, section hiện "Không có dữ liệu" |

---

## 📦 Gửi file gì trong phiên làm việc tiếp theo

**Bắt buộc gửi:**
```
📄 active-context-v15.md     ← file này (bắt buộc, đọc trước tiên)
```

**Gửi nếu muốn sửa / thêm tính năng liên quan:**

| Muốn làm gì | File cần gửi thêm |
|---|---|
| Thêm OI History Chart | `ChartPanel.jsx` + `chartStore.js` + `binanceApi.js` |
| Thêm Taker Buy/Sell Volume | `ChartPanel.jsx` + `chartStore.js` |
| Thêm CVD | `ChartPanel.jsx` + `useRecentTrades.js` |
| Sửa L/S Ratio panel | `LongShortPanel.jsx` + `useLongShortRatio.js` |
| Thêm Liquidation Tracker | `binanceApi.js` + `App.jsx` |
| Sửa chart / thêm indicator khác | `ChartPanel.jsx` + `useKlineData.js` |
| Sửa sidebar / watchlist | `CoinList.jsx` + `watchlistStore.js` |
| Sửa price bar / funding | `PriceCard.jsx` + `useFundingRate.js` |
| Sửa alert / âm thanh | `AlertPanel.jsx` + `alertStore.js` + `useAlertChecker.js` |
| Sửa Order Book | `OrderBookPanel.jsx` + `useOrderBook.js` |
| Sửa API / network | `binanceApi.js` |
| Thêm tính năng mới toàn app | `App.jsx` + `chartStore.js` |

**Gợi ý câu prompt mở đầu phiên tới:**
```
Đây là active-context-v15.md theo dõi dự án Binance Tracker.
Đọc kỹ "Bug đã sửa" trước khi viết code.
Nhiệm vụ hôm nay: [mô tả]
```

**Không cần gửi:**
- `index.css`, `main.jsx`, `IntervalSelector.jsx`
- `project-docs.md` (chỉ đọc khi cần reference tổng quan)