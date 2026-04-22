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
        │ @ticker (giá sidebar)      │ @kline (chart)
        │ @depth5 (order book)       │ @aggTrade (recent trades)
        │ @markPrice (funding rate)
        ▼
   Frontend App (React 18 + Vite)
        │
   ┌────┼────────────────────────────┐
   │    │                            │
Sidebar  Chart                  Right Panel
(giá)  (nến + indicators)    (OrderBook / Trades / Alerts)
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

| Endpoint | Dùng cho |
|---|---|
| `GET /api/v3/klines` | Lịch sử nến Spot |
| `GET /fapi/v1/klines` | Lịch sử nến Futures |
| `GET /api/v3/ticker/24hr` | Thống kê 24h Spot |
| `GET /fapi/v1/ticker/24hr` | Thống kê 24h Futures |
| `GET /fapi/v1/premiumIndex` | Mark price + funding rate |
| `GET /fapi/v1/fundingRate` | Lịch sử funding rate |
| `GET /fapi/v1/openInterest` | Open Interest (poll 30s) |

**WebSocket API**
```
Spot WS:    wss://stream.binance.com:443/ws/
Futures WS: wss://fstream.binance.com/ws/
```

| Stream | Dùng cho | Update |
|---|---|---|
| `!miniTicker@arr` / `@ticker` | Giá sidebar (batch 40/conn) | ~1s |
| `@kline_<interval>` | Nến realtime cho chart | Per close |
| `@depth5@100ms` | Order Book top 5 bid/ask | 100ms |
| `@aggTrade` | Recent Trades (30 gần nhất) | Per trade |
| `@markPrice` | Funding rate + mark price | 3s |

**Lưu ý:** Binance REST API đôi khi bị block ở Việt Nam. Dự án dùng 3 URL fallback cho cả Spot và Futures, với retry tối đa 3 lần mỗi request quan trọng.

### Deployment

| Option | Mô tả |
|---|---|
| **Vercel** (khuyên dùng) | Free plan, deploy qua `git push`, tự động HTTPS |
| **GitHub Pages** | Miễn phí, build ra `dist/`, push lên `gh-pages` |
| **Tự host** | `npm run build` → copy `dist/` lên Nginx / Apache |

---

## 3. Cấu trúc file

```
binance-tracker/
│
├── public/
│   └── favicon.ico
│
├── src/
│   ├── components/
│   │   ├── App.jsx               — Root layout, AlertEngine, right panel toggle
│   │   ├── CoinList.jsx          — Sidebar: coin list + tab Thị trường/Tăng/Giảm
│   │   ├── ChartPanel.jsx        — Chart chính: nến + MA/EMA/BB/RSI/MACD/VOL
│   │   ├── PriceCard.jsx         — Header bar: giá + funding + OI + sparkline
│   │   ├── AlertPanel.jsx        — Price alert UI + SoundSettings
│   │   ├── OrderBookPanel.jsx    — Order book top 5 bid/ask + depth bar + spread
│   │   ├── RecentTradesPanel.jsx — Recent trades list (30 aggTrades)
│   │   └── IntervalSelector.jsx  — (deprecated, không dùng nữa)
│   │
│   ├── hooks/
│   │   ├── useBinanceWS.js       — WS ticker stream (batch 40 symbols/connection)
│   │   ├── useKlineData.js       — WS + REST kline (retry 3 lần + reconnect)
│   │   ├── useAlertChecker.js    — Background checker alert (soundRef pattern)
│   │   ├── useFundingRate.js     — WS markPrice + OI polling (auto-reconnect)
│   │   ├── useOrderBook.js       — WS @depth5 + RAF batch + auto-reconnect
│   │   └── useRecentTrades.js    — WS @aggTrade + buffer 30 + RAF batch
│   │
│   ├── store/
│   │   ├── marketStore.js        — Prices (_prices module-level + RAF batch)
│   │   ├── chartStore.js         — Symbol, interval, market, indicators, alertSound
│   │   └── alertStore.js         — Alerts list (persist localStorage)
│   │
│   ├── services/
│   │   └── binanceApi.js         — REST wrapper (Spot + Futures, fallback URLs)
│   │
│   ├── index.css                 — Tailwind directives + custom scrollbar
│   └── main.jsx                  — Entry point
│
├── index.html
├── vite.config.js
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

### Chart — nến realtime

```
Binance REST GET /klines (500 nến lịch sử)
  → getKlinesWithRetry (max 3 lần)
  → candleRef.current.setData(data)
  → callback onData() → tính MA/EMA/BB/RSI/MACD

Binance WebSocket @kline_<interval>
  onmessage → applyCandle()
  → candleRef.current.update(candle)
  → callback onUpdate() → update indicator incremental (O(1))
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

---

## 5. Mô tả từng file

### `src/services/binanceApi.js`
Wrapper cho Binance REST API. Mọi HTTP request đi qua đây. Không có state, không có side effects — chỉ là async functions. Hỗ trợ 3 URL fallback cho cả Spot và Futures.

### `src/hooks/useBinanceWS.js`
Mở WebSocket đến Binance ticker stream, chia symbols thành batch 40/connection (tránh URL quá dài), stagger kết nối 200ms/batch. Tự cleanup khi unmount.

### `src/hooks/useKlineData.js`
Kết hợp REST (lịch sử 500 nến) + WebSocket (realtime). Xử lý edge case: buffer WS trong khi REST đang load, flush sau khi REST xong. Auto-reconnect WS sau 3s.

### `src/hooks/useOrderBook.js`
WS `@depth5@100ms` (cập nhật 10 lần/giây). Dùng RAF batch để tránh setState 10 lần/giây. Parse bids (sort cao→thấp) và asks (sort thấp→cao). Auto-reconnect 5s.

### `src/hooks/useRecentTrades.js`
WS `@aggTrade`. Buffer tối đa 30 trades (prepend mới vào đầu). RAF batch tránh setState mỗi trade khi thị trường volatile (có thể 50+ trades/giây). Auto-reconnect 5s.

### `src/hooks/useAlertChecker.js`
Chạy nền ở root App. Dùng `soundRef` (useRef) để đọc alertVolume/alertTone mới nhất — tránh stale closure. Phát beep qua Web Audio API khi giá chạm target.

### `src/hooks/useFundingRate.js`
REST snapshot + WS `@markPrice` realtime + OI polling mỗi 30s. `cancelledRef` pattern để tránh update sau cleanup.

### `src/store/marketStore.js`
Core perf pattern: `_prices` object sống ngoài Zustand (mutate in-place, O(1)), Zustand chỉ giữ `_tick`. RAF batch tối đa 60 re-render/giây dù nhận bao nhiêu WS message.

### `src/store/chartStore.js`
Zustand + persist: symbol, interval, market, showMA, showEMA, showRSI, showVolume, showMACD, showBB, alertVolume, alertTone.

### `src/store/alertStore.js`
Zustand + persist: danh sách alerts với trạng thái triggered. `nextId` dùng timestamp để tránh trùng sau reload.

### `src/components/App.jsx`
Root layout. `rightPanel` state (null | 'orderbook' | 'trades' | 'alerts') kiểm soát exclusive toggle. `AlertEngine` component chạy `useAlertChecker` ở root để luôn active.

### `src/components/CoinList.jsx`
Sidebar trái. 3 tab: Thị trường (search + sort + 60→all), Tăng (top 20 gainers), Giảm (top 20 losers). Gainers/Losers dùng snapshot throttle 3s — không sort 300 coin mỗi WS tick.

### `src/components/ChartPanel.jsx`
Chart chính với lightweight-charts v5. Indicators: MA(20/50/200), EMA(9/21), BB(20,2), RSI(14), MACD(12,26,9), Volume. OHLCV tooltip khi hover. Sync timescale giữa main/RSI/MACD panels.

### `src/components/PriceCard.jsx`
Header bar giá. Futures: thêm Mark Price, Index Price, Funding Rate%, countdown đến lần funding tiếp theo, Open Interest, Funding Rate History Sparkline (10 chu kỳ).

### `src/components/OrderBookPanel.jsx`
Top 5 ask (đỏ) + spread row + top 5 bid (xanh). Depth bar = cumulative qty / maxCum → thấy "tường giá". Spread hiển thị cả giá trị tuyệt đối và %.

### `src/components/RecentTradesPanel.jsx`
30 aggTrades mới nhất. ▲ xanh = buyer taker (lực mua), ▼ đỏ = seller taker (lực bán). Hiển thị price, qty, timestamp HH:MM:SS.

### `src/components/AlertPanel.jsx`
Thêm/xóa price alert. SoundSettings: slider volume (0-100%) + chọn tone (Sine/Square/Sawtooth/Triangle) + nút preview. Persist qua chartStore.

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