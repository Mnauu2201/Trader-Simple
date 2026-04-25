# Active Context v21
## Trạng thái: Cập nhật lần 21 ✅
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
| **useOIHistory.js — infinite scroll backward, poll 5 phút** | **v16** |
| **OI History Chart — AreaSeries vàng, sync timescale main chart** | **v16** |
| **Toggle button OI (chỉ hiện khi Futures)** | **v16** |
| **Persist showOI trong chartStore** | **v16** |
| **OI chart fix: setTimeout(0) defer DOM mount** | **v16 (fix)** |
| **OI chart fix: sync TimeRange thay vì LogicalRange** | **v16 (fix)** |
| **OI chart fix: setVisibleRange từ main chart sau setData** | **v16 (fix)** |
| **useTakerVolume.js — infinite scroll backward, poll 1 phút** | **v17** |
| **Taker Buy/Sell Volume panel — dual HistogramSeries xanh/đỏ** | **v17** |
| **Toggle button TVol (chỉ hiện khi Futures)** | **v17** |
| **Persist showTakerVol trong chartStore** | **v17** |
| **Label B/S vol + % Buy realtime trên panel header** | **v17** |
| **Sell volume vẽ âm (−sellVol) để tách biệt trực quan** | **v17** |
| **binanceApi.js: getTakerBuySellVol — endpoint /futures/data/takerlongshortRatio** | **v17** |
| **Vite proxy /futures-data → fapi.binance.com (bypass CORS localhost)** | **v17** |
| **CVD — Cumulative Volume Delta panel (AreaSeries hồng)** | **v18** |
| **CVD tính từ kline takerBuyVol — không cần endpoint mới** | **v18** |
| **CVD O(1) incremental update per WS tick** | **v18** |
| **CVD recalc khi load nến cũ hơn (onKlinePrepend)** | **v18** |
| **Toggle button CVD (Spot + Futures)** | **v18** |
| **Persist showCVD trong chartStore** | **v18** |
| **binanceApi.js: getKlines expose takerBuyVol (index 9)** | **v18** |
| **useKlineData.js: WS expose takerBuyVol (field k.V)** | **v18** |
| **Zero line trong CVD chart** | **v18** |
| **useLiquidations.js — WS `!forceOrder@arr` Futures** | **v19** |
| **Liq markers tam giác trên chart (arrowUp/arrowDown)** | **v19** |
| **Lọc liq theo ngưỡng $10K USD — tránh noise** | **v19** |
| **BUY liq = đỏ arrowUp (short bị liq), SELL liq = xanh arrowDown (long bị liq)** | **v19** |
| **Liq ≥ $500K hiện marker to hơn (size 2)** | **v19** |
| **Text marker: `Liq $150K` / `Liq $1.2M`** | **v19** |
| **Reset markers khi đổi symbol/interval/market** | **v19** |
| **Tối đa 200 markers gần nhất (tránh memory)** | **v19** |
| **Toggle button Liq trong toolbar (chỉ Futures)** | **v19** |
| **Persist showLiq trong chartStore** | **v19** |
| **Auto-reconnect WS 5s (cancelledRef pattern)** | **v19** |
| **useFundingRateHistory.js — REST fetch 100 chu kỳ funding rate** | **v20** |
| **Funding Rate History panel — HistogramSeries xanh/đỏ theo sign** | **v20** |
| **Toggle button FR trong toolbar (chỉ Futures)** | **v20** |
| **Persist showFR trong chartStore** | **v20** |
| **Poll mỗi 8h (funding settle 3 lần/ngày)** | **v20** |
| **Header hiện rate% + nhãn "Long trả Short" / "Short trả Long"** | **v20** |
| **Sync TimeRange với main chart (pattern giống OI/TVol)** | **v20** |
| **3-URL fallback (fapi/fapi1/fapi2)** | **v20** |
| **frHistoryRef để init chart trước khi data về** | **v20** |
| **Multi-timeframe: nút 2TF trong toolbar ChartPanel** | **v21** |
| **SecondaryChartPanel.jsx — chart thứ 2 độc lập** | **v21** |
| **interval2 riêng cho chart thứ 2 (mặc định 1h)** | **v21** |
| **Interval picker riêng trong chart 2 (màu tím để phân biệt)** | **v21** |
| **MA20/MA50 + EMA9/EMA21 toggle riêng trong chart 2** | **v21** |
| **OHLCV tooltip trong chart 2** | **v21** |
| **Infinite scroll backward trong chart 2 (giống chart chính)** | **v21** |
| **Desktop: split 50/50 ngang khi bật 2TF** | **v21** |
| **Persist showDualChart + interval2 vào localStorage** | **v21** |
| **chartStore.js: +showDualChart, +interval2, +setShowDualChart, +setInterval2** | **v21** |

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
**Fix đúng (useKlineData.js):**
```js
// Buffer WS trong khi REST đang load
let wsBuffer = []
ws.onmessage → push to wsBuffer
// Sau khi REST setData xong:
dataReady = true
wsBuffer.forEach(c => applyCandle(c))
wsBuffer = []
```
**Rule:** Không apply WS update trước khi REST setData. Buffer → flush.

---

### BUG #3 — RSI overbought/oversold line bị ẩn (v8)
**Fix đúng:** Dùng `createPriceLine` thay vì series riêng:
```js
rsiLine.createPriceLine({ price: 70, color: '#f6465d88', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: 'OB' })
rsiLine.createPriceLine({ price: 30, color: '#0ecb8188', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: 'OS' })
```

---

### BUG #4 — OI / TVol / CVD / FR chart không init (v16)
**Fix đúng:** setTimeout(0) defer createChart cho sub-panels:
```js
useEffect(() => {
  if (!showOI || !oiContainerRef.current) return
  const timer = setTimeout(() => {
    // createChart ở đây
  }, 0)
  return () => clearTimeout(timer)
}, [showOI])
```

---

### BUG #5 — Sub-chart sync bị lệch (v16)
**Fix đúng:** Sync TimeRange (UTC), KHÔNG sync LogicalRange:
```js
mainChart.timeScale().subscribeVisibleTimeRangeChange((range) => {
  if (range) subChart.timeScale().setVisibleRange(range)
})
```
**Rule:** LogicalRange không tương đương giữa 2 chart có data length khác nhau.

---

## 🏗️ Kiến trúc & Performance Rules

| Rule | Lý do |
|---|---|
| `updatePrice` batch qua `requestAnimationFrame` | tối đa 60 notify/giây |
| Không tách `CoinRow` thành component riêng | 300 component instance mỗi re-render |
| Gainers/Losers dùng snapshot throttle 3s | không sort 300 coin mỗi frame |
| WS batch tối đa 40 symbols/connection | Binance limit |
| Component có `setInterval` phải có state local riêng | tránh re-render leak lên parent |
| Crosshair tooltip throttle 16ms | tránh setState 60fps |
| Open Interest poll mỗi 30s (PriceCard) | không có WS stream OI |
| OI History poll mỗi 5 phút | data thay đổi chậm, tránh rate limit |
| Taker Volume poll mỗi 1 phút | cập nhật nhanh hơn OI nhưng không có WS |
| Funding Rate History poll mỗi 8h | funding settle 3 lần/ngày |
| EMA state lưu qua `emaStateRef` | O(1) per tick |
| CVD state lưu qua `cvdStateRef` | O(1) per tick |
| alertVolume/alertTone đọc qua `soundRef` (useRef) | tránh stale closure |
| OrderBook/RecentTrades WS → RAF batch | @depth5 10msg/s, @aggTrade 50+msg/s |
| RecentTrades dùng Map keyed by aggId | dedup tự động |
| RecentTradesPanel overflow-hidden + height cố định | 30 row không scroll |
| Watchlist ngoài top 180 có WS stream riêng | giá realtime mọi pinned coin |
| StarButton tách component riêng | tránh toàn list re-render khi hover star |
| L/S Ratio dùng Promise.allSettled | topLongShort chỉ có cho coin lớn |
| L/S + OI History poll 30s/5m | không có WS stream, tránh rate limit |
| Sub-chart (OI/TVol/CVD/FR) dùng setTimeout(0) để init | đảm bảo DOM mount trước khi createChart |
| Sub-chart sync TimeRange (UTC), không sync LogicalRange | LogicalRange không tương đương giữa 2 chart có data length khác nhau |
| Sub-chart setData → setVisibleRange từ main chart | không fitContent() |
| CVD O(1): chỉ tính delta của nến hiện tại | không recalc toàn bộ mỗi WS tick |
| frHistoryRef giữ data mới nhất cho setTimeout callback | tránh stale closure trong init chart |
| SecondaryChartPanel MA/EMA toggle local state riêng | không dùng chung showMA/showEMA global — chart 2 cần độc lập |
| SecondaryChartPanel KHÔNG sync timescale với main | 2 timeframe khác nhau, sync không có nghĩa |
| interval2 persist vào chartStore | giữ TF2 interval qua reload |

---

## 📊 Indicator Calculations — Tham chiếu

| Indicator | File | Approach |
|---|---|---|
| MA (20/50/200) | ChartPanel.jsx | Full recalc khi load, O(period) slice per tick |
| EMA (9/21) | ChartPanel.jsx | `calcEMALine` full + O(1) per tick via `emaStateRef` |
| BB (20,2) | ChartPanel.jsx | `calcBB` full + `calcBBIncr` slice(-20) per tick |
| RSI (14) | ChartPanel.jsx | Full seed, O(1) Wilder smoothing per tick |
| MACD (12,26,9) | ChartPanel.jsx | Full EMA recalc khi load, O(1) per tick |
| CVD | ChartPanel.jsx | `calcCVDFull` khi load/prepend, O(1) per tick via `cvdStateRef` |
| OI History | useOIHistory.js | REST fetch, infinite scroll backward, poll 5m |
| Taker Volume | useTakerVolume.js | REST fetch, infinite scroll backward, poll 1m |
| Funding Rate History | useFundingRateHistory.js | REST fetch 100 points, poll 8h |
| MA20/50 + EMA9/21 (TF2) | SecondaryChartPanel.jsx | Full recalc khi load, O(1) per tick via local emaStateRef |

---

## 🗺️ Cấu trúc file hiện tại

```
src/
├── components/
│   ├── App.jsx               — v21: +SecondaryChartPanel import, dual chart layout
│   ├── CoinList.jsx
│   ├── ChartPanel.jsx        — v21: +nút 2TF toolbar, +showDualChart/setShowDualChart
│   ├── SecondaryChartPanel.jsx  — v21: MỚI — chart TF2 độc lập (nến+MA+EMA+tooltip+scroll)
│   ├── PriceCard.jsx
│   ├── AlertPanel.jsx
│   ├── OrderBookPanel.jsx
│   ├── RecentTradesPanel.jsx
│   ├── DrawingToolbar.jsx
│   └── LongShortPanel.jsx
├── hooks/
│   ├── useBinanceWS.js
│   ├── useKlineData.js       — v18: +takerBuyVol field trong WS candle (k.V)
│   ├── useAlertChecker.js
│   ├── useFundingRate.js
│   ├── useFundingRateHistory.js  — v20: REST 100 chu kỳ, poll 8h, cancelledRef pattern
│   ├── useOrderBook.js
│   ├── useRecentTrades.js
│   ├── useLongShortRatio.js
│   ├── useOIHistory.js
│   ├── useTakerVolume.js
│   ├── useDrawingTools.js
│   └── useLiquidations.js    — v19: WS !forceOrder@arr, lọc $10K, auto-reconnect
├── store/
│   ├── marketStore.js
│   ├── chartStore.js         — v21: +showDualChart, +interval2, +setters tương ứng
│   ├── alertStore.js
│   └── watchlistStore.js
├── services/
│   └── binanceApi.js         — v18: getKlines expose takerBuyVol (index 9), +getTakerBuySellVol
├── index.css
└── main.jsx
```

---

## 🗺️ Roadmap

### ✅ Đã hoàn thành
- v1–v12: Chart, indicators, alerts, persist, funding rate, OI, EMA, sound
- v13: Order Book + Recent Trades (right panel toggle)
- v13.1: Fix RecentTrades (dedup, sort, no-scroll)
- v14: Watchlist cá nhân (pin/unpin, persist, badge, WS riêng)
- v15: Long/Short Ratio (3 loại, sparkline, gauge, signal badge)
- v16: OI History Chart (AreaSeries, sync timescale, infinite scroll)
- v17: Taker Buy/Sell Volume Panel (dual histogram, sync, infinite scroll)
- v18: CVD — Cumulative Volume Delta (AreaSeries, O(1) update, sync timescale)
- v19: Liquidation Tracker (WS markers tam giác, lọc $10K, toggle Liq button)
- v20: Funding Rate History Chart (HistogramSeries xanh/đỏ, 100 chu kỳ, sync timescale)
- v21: Multi-timeframe 2 chart (split 50/50, interval riêng, MA/EMA toggle, tooltip, scroll)

---

### 🔲 Tiếp theo — Priority cao (v22)

| Tính năng | Mô tả | Độ phức tạp |
|---|---|---|
| Keyboard shortcuts | j/k navigate coin, 1-9 đổi interval | Thấp |
| Export CSV kline | Tải xuống dữ liệu nến đang xem | Thấp |
| Notifications history | Log alerts đã trigger, xem lại được | Trung bình |
| Resizable split (kéo divider) | Kéo thanh chia để điều chỉnh tỷ lệ 2 chart | Trung bình |

---

## ⚠️ Known Issues còn tồn tại

| Issue | Mức độ | Ghi chú |
|---|---|---|
| Sync timescale chỉ main→sub, không ngược lại | Rất thấp | Acceptable |
| MACD init O(n) recalc | Rất thấp | Acceptable với 500 candles |
| FundingSparkline chỉ fetch 1 lần khi mount | Rất thấp | Funding chỉ update 8h/lần |
| L/S topLongShort chỉ available cho ~20 coin lớn | Thấp | Handled bằng Promise.allSettled |
| OI/TVol period không khớp 100% với interval chart | Thấp | INTERVAL_TO_PERIOD map xấp xỉ tốt nhất |
| TVol sellVol vẽ âm — axis label hiện số âm | Thấp | Có thể dùng 2 priceScale riêng nếu muốn đẹp hơn |
| CVD reset về 0 mỗi lần load chart mới | Thấp | CVD là relative indicator, acceptable |
| Liq markers snap về nến gần nhất (không snap chính xác giá) | Thấp | lightweight-charts markers không có price field, chỉ time |
| FR History không sync ngược từ sub→main khi scroll FR chart | Thấp | handleScroll: false trên FR chart, acceptable |
| SecondaryChartPanel split width cố định 50/50 | Thấp | Chưa có resizable divider — v22 roadmap |

---

## 📦 Gửi file gì trong phiên làm việc tiếp theo

**Bắt buộc gửi:**
```
📄 active-context-v21.md     ← file này (bắt buộc, đọc trước tiên)
```

**Gửi nếu muốn sửa / thêm tính năng liên quan:**

| Muốn làm gì | File cần gửi thêm |
|---|---|
| Sửa / cải thiện chart TF2 | `SecondaryChartPanel.jsx` |
| Thêm resizable divider cho dual chart | `App.jsx` + `SecondaryChartPanel.jsx` |
| Sửa Funding Rate History Chart | `ChartPanel.jsx` + `useFundingRateHistory.js` |
| Sửa Liquidation Tracker | `ChartPanel.jsx` + `useLiquidations.js` |
| Sửa CVD | `ChartPanel.jsx` + `useKlineData.js` |
| Sửa OI Chart | `ChartPanel.jsx` + `useOIHistory.js` |
| Sửa TVol | `ChartPanel.jsx` + `useTakerVolume.js` + `binanceApi.js` |
| Sửa L/S Ratio panel | `LongShortPanel.jsx` + `useLongShortRatio.js` |
| Sửa chart / thêm indicator | `ChartPanel.jsx` + `useKlineData.js` |
| Sửa sidebar / watchlist | `CoinList.jsx` + `watchlistStore.js` |
| Sửa price bar / funding | `PriceCard.jsx` + `useFundingRate.js` |
| Sửa alert / âm thanh | `AlertPanel.jsx` + `alertStore.js` + `useAlertChecker.js` |
| Sửa Order Book | `OrderBookPanel.jsx` + `useOrderBook.js` |
| Sửa API / network | `binanceApi.js` |
| Thêm tính năng mới toàn app | `App.jsx` + `chartStore.js` |

**Gợi ý câu prompt mở đầu phiên tới:**
```
Đây là active-context-v21.md theo dõi dự án Binance Tracker.
Đọc kỹ "Bug đã sửa" trước khi viết code.
Nhiệm vụ hôm nay: [mô tả]
```

**Không cần gửi:**
- `index.css`, `main.jsx`, `IntervalSelector.jsx`
- `project-docs.md` (chỉ đọc khi cần reference tổng quan)