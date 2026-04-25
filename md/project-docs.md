# Binance Tracker — Project Documentation

> Tài liệu tổng hợp: mục tiêu dự án, kiến trúc file, tech stack, và luồng dữ liệu.

---

## 1. Mục tiêu dự án

Xây dựng một **web dashboard cá nhân** để theo dõi giá coin realtime từ Binance, thay thế hoàn toàn các subscription trả phí bằng công cụ tự xây dựng miễn phí.

| Vấn đề | Giải pháp |
|---|---|
| Phải trả tiền TradingView Pro để xem chart | Dùng `lightweight-charts` (miễn phí, chính hãng TradingView) |
| Không tùy chỉnh được layout theo ý muốn | Tự build frontend theo nhu cầu |
| Data bị trễ trên các platform free | Kết nối thẳng Binance WebSocket (realtime, 0 phí) |
| Phụ thuộc vào bên thứ 3 | Tự host, toàn quyền kiểm soát |

**Điểm khác biệt so với TradingView / CoinMarketCap:**
- Không quảng cáo — giao diện sạch hoàn toàn
- Tùy chỉnh tuyệt đối — muốn hiển thị gì thì code cái đó
- 0 phí — Binance API public + lightweight-charts đều miễn phí
- Học được kỹ năng — WebSocket, realtime data, charting, order flow

---

## 2. Tech Stack

### Tổng quan kiến trúc

```
Binance WebSocket API  ──────────────────────────────────────────────────
        │ @ticker (giá sidebar)      │ @kline (chart + chart TF2)
        │ @depth5 (order book)       │ @aggTrade (recent trades)
        │ @markPrice (funding rate)  │ !forceOrder@arr (liquidations)
        ▼
   Frontend App (React 18 + Vite)
        │
   ┌────┼────────────────────────────────────────────┐
   │    │                                            │
Sidebar  Chart (main TF)  Chart (TF2 — v21)    Right Panel
(giá)  (nến + indicators)  (nến + MA/EMA)    (OrderBook/Trades/Alerts)
```

Đây là **pure frontend app** — không cần backend, không cần database, không cần server riêng.

---

### Framework & Build

| Công nghệ | Version | Lý do chọn |
|---|---|---|
| **React** | 18.x | Component-based, hooks, ecosystem lớn |
| **Vite** | 5.x | Build nhanh, HMR tức thì, bundle nhỏ |
| **Tailwind CSS** | 3.x | Utility-first, không cần CSS file riêng |
| **TypeScript** | — | Không dùng (tốc độ dev nhanh hơn với plain JS) |

### Charting

| Công nghệ | Version | Lý do chọn |
|---|---|---|
| **lightweight-charts** | 5.x | Chính hãng TradingView, miễn phí Apache License, 45KB, Canvas render cực nhanh |

### State Management

| Công nghệ | Version | Lý do chọn |
|---|---|---|
| **Zustand** | 4.x | Nhẹ hơn Redux, không boilerplate, dễ persist localStorage |

**Pattern đặc biệt của dự án (perf-critical):**
- `marketStore` dùng `_prices` object sống **ngoài** Zustand, mutate trực tiếp
- Zustand chỉ giữ `_tick` counter để trigger re-render
- Mọi WS update gom batch qua `requestAnimationFrame` → tối đa 60 notify/giây

### Data Sources — Binance API (miễn phí, không cần API key)

**REST API**
```
Spot Base:    https://api.binance.com    (fallback: api1, api2)
Futures Base: https://fapi.binance.com   (fallback: fapi1, fapi2)
```

**WebSocket**
```
Spot:    wss://stream.binance.com:443/ws/
Futures: wss://fstream.binance.com/ws/
```

---

## 3. Cấu trúc file

```
BINANCE-TRACKER/
├── src/
│   ├── components/
│   │   ├── App.jsx                      — Root layout, AlertEngine, right panel toggle, dual chart layout ← v21
│   │   ├── ChartPanel.jsx               — Chart chính: nến + tất cả indicators + sub-panels ← v21 (+2TF button)
│   │   ├── SecondaryChartPanel.jsx      — Chart TF2: nến + MA20/50 + EMA9/21 + tooltip + scroll ← v21 MỚI
│   │   ├── CoinList.jsx                 — Sidebar: search, sort, tabs Market/Gainers/Losers/Watchlist
│   │   ├── PriceCard.jsx                — Header bar giá: OHLV, Mark/Index Price, Funding, OI
│   │   ├── AlertPanel.jsx               — Price alerts: thêm/xóa, sound settings, persist
│   │   ├── OrderBookPanel.jsx           — Order Book: top 5 bid/ask, depth bar, spread
│   │   ├── RecentTradesPanel.jsx        — Recent Trades: 30 aggTrades, direction indicator
│   │   ├── DrawingToolbar.jsx           — Drawing tools toolbar (dọc bên trái chart)
│   │   └── LongShortPanel.jsx           — Long/Short Ratio: 3 loại, sparkline, gauge, signal
│   │
│   ├── hooks/
│   │   ├── useBinanceWS.js              — WS ticker stream (batch 40 symbols/conn, stagger 200ms)
│   │   ├── useKlineData.js              — WS + REST kline (retry, reconnect, infinite scroll, takerBuyVol)
│   │   ├── useAlertChecker.js           — Nền: kiểm tra giá vs alerts, phát beep, soundRef pattern
│   │   ├── useFundingRate.js            — WS @markPrice + OI polling 30s (auto-reconnect)
│   │   ├── useFundingRateHistory.js     — REST 100 chu kỳ funding rate, poll 8h ← v20
│   │   ├── useOrderBook.js              — WS @depth5 + RAF batch + auto-reconnect
│   │   ├── useRecentTrades.js           — WS @aggTrade + buffer 30 + RAF batch
│   │   ├── useLongShortRatio.js         — REST poll 30s, lịch sử 24 điểm Long/Short
│   │   ├── useOIHistory.js              — REST fetch OI history, infinite scroll, poll 5m
│   │   ├── useTakerVolume.js            — REST fetch Taker Buy/Sell Vol, infinite scroll, poll 1m
│   │   ├── useDrawingTools.js           — Drawing tools state + canvas mouse events
│   │   └── useLiquidations.js           — WS !forceOrder@arr, lọc $10K, auto-reconnect ← v19
│   │
│   ├── store/
│   │   ├── alertStore.js                — Alerts list (persist localStorage)
│   │   ├── chartStore.js                — Symbol, interval, market, indicators, showDualChart, interval2 ← v21
│   │   ├── marketStore.js               — Prices (_prices module-level + RAF batch)
│   │   └── watchlistStore.js            — Watchlist cá nhân (persist localStorage, max 50 coin)
│   │
│   ├── services/
│   │   └── binanceApi.js                — REST wrapper (Spot + Futures, fallback URLs, takerBuyVol)
│   │
│   ├── App.css
│   ├── index.css                        — Tailwind directives + custom scrollbar
│   └── main.jsx                         — Entry point
│
├── index.html
├── vite.config.js                       — Vite proxy /futures-data → fapi.binance.com
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

---

## 4. Luồng dữ liệu

### Sidebar — giá coin realtime

```
Binance REST (init)
  GET /ticker/24hr → 300+ symbols → setPrices() → marketStore._prices
        │
        ▼
Binance WebSocket @ticker (batch 40 symbols/connection)
  onmessage → updatePrice() → mutate _prices trực tiếp
            → requestAnimationFrame → set({ _tick++ })
                                           │
                                           ▼
                                      CoinList re-render (tối đa 60fps)
```

### Chart chính — nến realtime

```
Binance REST GET /klines (500 nến lịch sử)
  → getKlinesWithRetry (max 3 lần)
  → candleRef.current.setData(data)
  → callback onData() → tính MA/EMA/BB/RSI/MACD/CVD

Binance WebSocket @kline_<interval>
  onmessage → applyCandle()
  → candleRef.current.update(candle)
  → callback onUpdate() → update indicator incremental (O(1))
```

### Chart TF2 (SecondaryChartPanel) — v21

```
Cùng symbol + market với chart chính, interval2 riêng (mặc định 1h)

Binance REST GET /klines (500 nến, interval2)
  → candleRef.current.setData(data)
  → callback onData() → tính MA20/MA50 + EMA9/EMA21

Binance WebSocket @kline_<interval2>
  onmessage → update candle + MA/EMA incremental O(1)

Infinite scroll backward: giống chart chính (loadMoreRef pattern)
KHÔNG sync timescale với main chart (2 timeframe khác nhau)
```

### Order Book

```
Binance WebSocket @depth5@100ms
  onmessage → parse bids/asks → pendingRef
            → requestAnimationFrame → setBook()
                                          │
                                          ▼
                                  OrderBookPanel render
                                  (depth bar = cum qty / maxCum)
```

### Recent Trades

```
Binance WebSocket @aggTrade
  onmessage → prepend to bufferRef (max 30)
            → requestAnimationFrame → setTrades([...bufferRef])
                                              │
                                              ▼
                                   RecentTradesPanel render
                                   (▲ xanh = buyer taker, ▼ đỏ = seller taker)
```

### Funding Rate (Futures only)

```
Binance REST GET /premiumIndex → snapshot ngay khi mount
Binance REST GET /openInterest → poll mỗi 30s
Binance WebSocket @markPrice   → update markPrice/indexPrice/fundingRate realtime
  (auto-reconnect 5s nếu bị drop)
```

### Funding Rate History (Futures only) — v20

```
Binance REST GET /fapi/v1/fundingRate?limit=100
  → fetch ngay khi mount (symbol + market = futures)
  → poll mỗi 8h (funding settle 3 lần/ngày: 00:00 / 08:00 / 16:00 UTC)
  → convert sang % (raw × 100)
  → HistogramSeries: xanh nếu ≥ 0, đỏ nếu < 0
  → sync TimeRange với main chart
```

### Liquidations (Futures only) — v19

```
Binance WebSocket !forceOrder@arr (Futures global stream)
  onmessage → lọc usdValue ≥ $10K
            → snap time về nến gần nhất (klineDataRef)
            → setMarkers() trên candleSeries
  Max 200 markers, BUY liq = arrowUp đỏ, SELL liq = arrowDown xanh
```

---

## 5. Mô tả từng file

### `src/services/binanceApi.js`
Wrapper cho Binance REST API. Mọi HTTP request đi qua đây. Không có state, không có side effects — chỉ là async functions. Hỗ trợ 3 URL fallback cho cả Spot và Futures.

### `src/hooks/useBinanceWS.js`
Mở WebSocket đến Binance ticker stream, chia symbols thành batch 40/connection (tránh URL quá dài), stagger kết nối 200ms/batch. Tự cleanup khi unmount.

### `src/hooks/useKlineData.js`
Kết hợp REST (lịch sử 500 nến) + WebSocket (realtime). Xử lý edge case: buffer WS trong khi REST đang load, flush sau khi REST xong. Auto-reconnect WS sau 3s. Dùng bởi cả ChartPanel (main) và SecondaryChartPanel (TF2).

### `src/hooks/useOrderBook.js`
WS `@depth5@100ms` (cập nhật 10 lần/giây). Dùng RAF batch để tránh setState 10 lần/giây. Parse bids (sort cao→thấp) và asks (sort thấp→cao). Auto-reconnect 5s.

### `src/hooks/useRecentTrades.js`
WS `@aggTrade`. Buffer tối đa 30 trades (prepend mới vào đầu). RAF batch tránh setState mỗi trade khi thị trường volatile (có thể 50+ trades/giây). Auto-reconnect 5s.

### `src/hooks/useAlertChecker.js`
Chạy nền ở root App. Dùng `soundRef` (useRef) để đọc alertVolume/alertTone mới nhất — tránh stale closure. Phát beep qua Web Audio API khi giá chạm target.

### `src/hooks/useFundingRate.js`
REST snapshot + WS `@markPrice` realtime + OI polling mỗi 30s. `cancelledRef` pattern để tránh update sau cleanup.

### `src/hooks/useFundingRateHistory.js` ← v20
REST `GET /fapi/v1/fundingRate?limit=100` với 3-URL fallback. Convert fundingRate sang % (×100). Poll mỗi 8h (funding settle 3 lần/ngày). `cancelledRef` pattern.

### `src/hooks/useLiquidations.js` — v19
WS `!forceOrder@arr` (Futures global liquidation stream). Lọc events có giá trị USD ≥ $10K (tránh noise). Auto-reconnect 5s với `cancelledRef` pattern.

### `src/hooks/useOIHistory.js`
REST fetch Open Interest history, infinite scroll backward (load thêm dữ liệu cũ khi kéo chart sang trái), poll mỗi 5 phút. Sync TimeRange với main chart.

### `src/hooks/useTakerVolume.js`
REST fetch Taker Buy/Sell Volume từ endpoint `/futures/data/takerlongshortRatio`, infinite scroll backward, poll mỗi 1 phút. Sell volume vẽ âm (−sellVol) để tách biệt trực quan.

### `src/store/marketStore.js`
Core perf pattern: `_prices` object sống ngoài Zustand (mutate in-place, O(1)), Zustand chỉ giữ `_tick`. RAF batch tối đa 60 re-render/giây dù nhận bao nhiêu WS message.

### `src/store/chartStore.js` ← v21
Zustand + persist: symbol, interval, market, showMA, showEMA, showRSI, showVolume, showMACD, showBB, showOI, showTakerVol, showCVD, showLiq, showFR, **showDualChart, interval2**, alertVolume, alertTone.

### `src/store/alertStore.js`
Zustand + persist: danh sách alerts với trạng thái triggered. `nextId` dùng timestamp để tránh trùng sau reload.

### `src/components/App.jsx` ← v21
Root layout. `rightPanel` state (null | 'orderbook' | 'trades' | 'alerts') kiểm soát exclusive toggle. `AlertEngine` component chạy `useAlertChecker` ở root để luôn active. **Dual chart layout: khi `showDualChart=true`, chia 50/50 ngang giữa ChartPanel và SecondaryChartPanel.**

### `src/components/ChartPanel.jsx` ← v21
Chart chính với lightweight-charts v5. Indicators: MA(20/50/200), EMA(9/21), BB(20,2), RSI(14), MACD(12,26,9), Volume. Sub-panels: OI History, Taker Volume, CVD, Funding Rate History (v20). Liquidation markers trên chart (v19). OHLCV tooltip khi hover. Sync timescale giữa main/RSI/MACD/OI/TVol/CVD/FR panels. **v21: thêm nút 2TF vào toolbar để toggle dual chart.**

### `src/components/SecondaryChartPanel.jsx` ← v21 MỚI
Chart TF2 độc lập. Cùng symbol + market với chart chính, **interval riêng** (mặc định 1h, có picker đầy đủ, màu tím để phân biệt TF1). Tính năng: nến + volume + MA20/MA50 + EMA9/EMA21 (toggle local riêng) + OHLCV tooltip + infinite scroll backward. KHÔNG sync timescale với main chart (2 timeframe khác nhau).

### `src/components/PriceCard.jsx`
Header bar giá. Futures: thêm Mark Price, Index Price, Funding Rate%, countdown đến lần funding tiếp theo, Open Interest, Funding Rate History Sparkline (10 chu kỳ).

### `src/components/OrderBookPanel.jsx`
Top 5 ask (đỏ) + spread row + top 5 bid (xanh). Depth bar = cumulative qty / maxCum → thấy "tường giá". Spread hiển thị cả giá trị tuyệt đối và %.

### `src/components/RecentTradesPanel.jsx`
30 aggTrades mới nhất. ▲ xanh = buyer taker (lực mua), ▼ đỏ = seller taker (lực bán). Hiển thị price, qty, timestamp HH:MM:SS.

### `src/components/AlertPanel.jsx`
Thêm/xóa price alert. SoundSettings: slider volume (0-100%) + chọn tone (Sine/Square/Sawtooth/Triangle) + nút preview. Persist qua chartStore.

### `src/components/DrawingToolbar.jsx`
Toolbar vẽ tay trên chart. Các công cụ: TrendLine, HorizontalLine, FibRetracement. Hiển thị dọc bên trái chart, toggle active tool. Dùng kết hợp với `useDrawingTools.js`.

### `src/components/LongShortPanel.jsx`
Panel Long/Short Ratio với 3 loại: Global Accounts, Top Trader Accounts, Top Trader Positions. Mỗi loại có GaugeBar trực quan, sparkline 24 điểm, và SignalBadge tự động (Đám đông quá Long/Short/Cân bằng). Collapse riêng từng section.

### `src/hooks/useDrawingTools.js`
Quản lý state drawing tools (active tool, danh sách shapes đã vẽ). Xử lý mouse events trên canvas overlay để vẽ TrendLine, HLine, Fibonacci Retracement.

### `src/hooks/useLongShortRatio.js`
REST poll 30s, lấy lịch sử 24 điểm Long/Short Ratio từ 3 endpoint Binance Futures. Dùng `Promise.allSettled` để xử lý endpoint `topLongShort` chỉ available cho ~20 coin lớn.

### `src/store/watchlistStore.js`
Zustand + persist localStorage: danh sách coin đã pin (tối đa 50). Cung cấp `togglePin`, `isPinned`. WS stream riêng cho watchlist ngoài top 180.

---

## 6. Dependencies

```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "lightweight-charts": "^5.x",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}
```

## 7. Disclaimer
Công cụ này được xây dựng phục vụ mục đích theo dõi và phân tích thị trường cá nhân.
Mọi thông tin hiển thị chỉ mang tính tham khảo — không phải lời khuyên đầu tư.
Trader chịu hoàn toàn trách nhiệm với các quyết định giao dịch của mình.
Dữ liệu lấy từ Binance Public API và có thể có độ trễ.