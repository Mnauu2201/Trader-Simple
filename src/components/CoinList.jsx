// src/components/CoinList.jsx — v28: Screener Tab

import { useEffect, useState, useMemo, useRef, useCallback, forwardRef, useImperativeHandle } from 'react'
import { useMarketStore } from '../store/marketStore'
import { useChartStore } from '../store/chartStore'
import { useWatchlistStore } from '../store/watchlistStore'
import { useBinanceWS } from '../hooks/useBinanceWS'
import { getAllTickers24h } from '../services/binanceApi'

const FEATURED = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT',
  'DOGEUSDT', 'ADAUSDT', 'AVAXUSDT', 'DOTUSDT', 'MATICUSDT',
  'LINKUSDT', 'UNIUSDT', 'LTCUSDT', 'NEARUSDT', 'APTUSDT',
  'ARBUSDT', 'OPUSDT', 'AAVEUSDT', 'FILUSDT', 'MKRUSDT',
  'CRVUSDT', 'PEPEUSDT', 'SHIBUSDT', 'FLOKIUSDT', 'ETCUSDT',
  'SNXUSDT', 'INJUSDT', 'SUIUSDT', 'TIAUSDT', 'WLDUSDT',
]

function fmtPrice(p) {
  if (p == null || isNaN(p)) return '---'
  if (p >= 1000) return p.toLocaleString('en-US', { maximumFractionDigits: 1 })
  if (p >= 1) return p.toFixed(3)
  if (p >= 0.001) return p.toFixed(5)
  return p.toFixed(7)
}

function fmtVol(n) {
  if (!n || isNaN(n)) return ''
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return n.toFixed(0)
}

const SORT_OPTIONS = [
  { value: 'default', label: 'Mặc định' },
  { value: 'vol_desc', label: 'Volume ↓' },
  { value: 'change_desc', label: '% Tăng ↓' },
  { value: 'change_asc', label: '% Giảm ↑' },
  { value: 'price_desc', label: 'Giá ↓' },
]

const GAINERS_INTERVAL_MS = 3000
const SCREENER_POLL_MS = 60_000   // refresh RSI mỗi 60s
const SCREENER_COINS = 60         // scan top 60 coin theo volume
const RSI_PERIOD = 14

// ── Tính RSI(14) từ mảng close prices ────────────────────────────────────────
function calcRSI(closes) {
  if (closes.length < RSI_PERIOD + 1) return null
  let gainSum = 0, lossSum = 0
  for (let i = 1; i <= RSI_PERIOD; i++) {
    const diff = closes[i] - closes[i - 1]
    if (diff >= 0) gainSum += diff
    else lossSum -= diff
  }
  let avgGain = gainSum / RSI_PERIOD
  let avgLoss = lossSum / RSI_PERIOD
  for (let i = RSI_PERIOD + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1]
    const g = diff >= 0 ? diff : 0
    const l = diff < 0 ? -diff : 0
    avgGain = (avgGain * (RSI_PERIOD - 1) + g) / RSI_PERIOD
    avgLoss = (avgLoss * (RSI_PERIOD - 1) + l) / RSI_PERIOD
  }
  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return 100 - 100 / (1 + rs)
}

// ── Fetch kline data cho 1 symbol (đủ để tính RSI + StochRSI) ────────────────
// Trả về mảng close prices, đủ limit cho cả StochRSI(14,14,3,3)
// StochRSI cần: RSI_PERIOD(14) seed + stoch_period(14) + smooth_k(3) + smooth_d(3)
// → tối thiểu 14+14+3+3 = 34 candles, lấy 60 để dư
const STOCHRSI_PERIOD = 14
const STOCHRSI_K = 3
const KLINE_LIMIT = 60

async function fetchKlineCloses(symbol, market) {
  const base = market === 'futures'
    ? 'https://fapi.binance.com/fapi/v1/klines'
    : 'https://api.binance.com/api/v3/klines'
  const url = `${base}?symbol=${symbol}&interval=1h&limit=${KLINE_LIMIT}`
  const r = await fetch(url)
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  const data = await r.json()
  return data.map(c => parseFloat(c[4])) // close price
}

// ── Tính StochRSI K line từ mảng closes ──────────────────────────────────────
// Dùng cùng Wilder smoothing như ChartPanel để nhất quán
// Trả về giá trị K cuối cùng (0–100), hoặc null nếu không đủ data
function calcStochRSI_K(closes) {
  const minLen = RSI_PERIOD + STOCHRSI_PERIOD + STOCHRSI_K - 1
  if (closes.length < minLen) return null

  // 1) Tính toàn bộ dãy RSI
  const rsiValues = []
  let avgGain = 0, avgLoss = 0
  for (let i = 1; i <= RSI_PERIOD; i++) {
    const diff = closes[i] - closes[i - 1]
    if (diff >= 0) avgGain += diff
    else avgLoss -= diff
  }
  avgGain /= RSI_PERIOD
  avgLoss /= RSI_PERIOD
  const rs0 = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)
  rsiValues.push(rs0)

  for (let i = RSI_PERIOD + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1]
    const g = diff >= 0 ? diff : 0
    const l = diff < 0 ? -diff : 0
    avgGain = (avgGain * (RSI_PERIOD - 1) + g) / RSI_PERIOD
    avgLoss = (avgLoss * (RSI_PERIOD - 1) + l) / RSI_PERIOD
    const rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)
    rsiValues.push(rsi)
  }

  // 2) Tính StochRSI raw = (RSI - minRSI[period]) / (maxRSI[period] - minRSI[period])
  const stochRaw = []
  for (let i = STOCHRSI_PERIOD - 1; i < rsiValues.length; i++) {
    const window = rsiValues.slice(i - STOCHRSI_PERIOD + 1, i + 1)
    const minR = Math.min(...window)
    const maxR = Math.max(...window)
    stochRaw.push(maxR === minR ? 0 : ((rsiValues[i] - minR) / (maxR - minR)) * 100)
  }

  if (stochRaw.length < STOCHRSI_K) return null

  // 3) Smooth K = SMA(stochRaw, K_period=3)
  const kValues = []
  for (let i = STOCHRSI_K - 1; i < stochRaw.length; i++) {
    const sum = stochRaw.slice(i - STOCHRSI_K + 1, i + 1).reduce((a, b) => a + b, 0)
    kValues.push(sum / STOCHRSI_K)
  }

  return kValues.length > 0 ? kValues[kValues.length - 1] : null
}

// ── Screener filter presets ───────────────────────────────────────────────────
const SCREENER_PRESETS = [
  {
    id: 'rsi_os',
    label: 'RSI < 30',
    desc: 'RSI(14) oversold — có thể hồi phục',
    color: '#0ecb81',
    icon: '↙',
    needsFetch: true,
    test: (d) => d.rsi != null && d.rsi < 30,
  },
  {
    id: 'rsi_ob',
    label: 'RSI > 70',
    desc: 'RSI(14) overbought — có thể điều chỉnh',
    color: '#f6465d',
    icon: '↗',
    needsFetch: true,
    test: (d) => d.rsi != null && d.rsi > 70,
  },
  {
    id: 'stochrsi_os',
    label: 'StochRSI < 20',
    desc: 'StochRSI K(14,14,3) < 20 — oversold mạnh',
    color: '#22d3ee',
    icon: '🌊',
    needsFetch: true,
    test: (d) => d.stochK != null && d.stochK < 20,
  },
  {
    id: 'near_high',
    label: 'Near High',
    desc: 'Giá ≥ 95% của High 24h — gần đỉnh',
    color: '#f0b90b',
    icon: '🔝',
    needsFetch: false,
    test: (d, prices) => {
      const p = prices[d.symbol]
      if (!p?.price || !p?.high24h || p.high24h === 0) return false
      return p.price >= p.high24h * 0.95
    },
  },
  {
    id: 'near_low',
    label: 'Near Low',
    desc: 'Giá ≤ 105% của Low 24h — gần đáy',
    color: '#a855f7',
    icon: '📉',
    needsFetch: false,
    test: (d, prices) => {
      const p = prices[d.symbol]
      if (!p?.price || !p?.low24h || p.low24h === 0) return false
      return p.price <= p.low24h * 1.05
    },
  },
  {
    id: 'vol_spike',
    label: 'Vol Spike',
    desc: 'Volume > 2× trung bình 7 ngày',
    color: '#a855f7',
    icon: '⚡',
    needsFetch: false,
    test: (d, prices) => {
      const qv = prices[d.symbol]?.quoteVolume
      const avg = d.avgVol7d
      if (!qv || !avg || avg === 0) return false
      return qv > avg * 2
    },
  },
  {
    id: 'big_move',
    label: '|%| > 5%',
    desc: 'Biến động mạnh trong 24h',
    color: '#f0b90b',
    icon: '🔥',
    needsFetch: false,
    test: (d, prices) => {
      const ch = prices[d.symbol]?.change24h
      return ch != null && Math.abs(ch) > 5
    },
  },
]

// ── Hook: useScreener — tính RSI + StochRSI + Vol cho top coins ──────────────
function useScreener(allSymbols, market, prices, isActive) {
  const [screenData, setScreenData] = useState({})   // { symbol: { rsi, stochK, error } }
  const [scanTime, setScanTime] = useState(null)
  const [scanning, setScanning] = useState(false)
  const cancelRef = useRef(false)

  const scan = useCallback(async () => {
    if (scanning) return
    const symbols = allSymbols.slice(0, SCREENER_COINS)
    if (symbols.length === 0) return

    cancelRef.current = false
    setScanning(true)

    const CHUNK = 10
    const results = {}

    for (let i = 0; i < symbols.length; i += CHUNK) {
      if (cancelRef.current) break
      const chunk = symbols.slice(i, i + CHUNK)
      const settled = await Promise.allSettled(
        chunk.map(async (sym) => {
          const closes = await fetchKlineCloses(sym, market)
          const rsi = calcRSI(closes)
          const stochK = calcStochRSI_K(closes)
          return { symbol: sym, rsi, stochK }
        })
      )
      settled.forEach((res, idx) => {
        const sym = chunk[idx]
        if (res.status === 'fulfilled') {
          results[sym] = { rsi: res.value.rsi, stochK: res.value.stochK, error: false }
        } else {
          results[sym] = { rsi: null, stochK: null, error: true }
        }
      })
      if (i + CHUNK < symbols.length) await new Promise(r => setTimeout(r, 200))
    }

    if (!cancelRef.current) {
      setScreenData(results)
      setScanTime(new Date())
      setScanning(false)
    }
  }, [allSymbols, market, scanning])

  // Chạy scan khi tab screener active lần đầu, rồi poll mỗi 60s
  useEffect(() => {
    if (!isActive) return
    scan()
    const timer = setInterval(scan, SCREENER_POLL_MS)
    return () => {
      cancelRef.current = true
      clearInterval(timer)
    }
  }, [isActive, market]) // re-scan khi đổi market

  return { screenData, scanTime, scanning, scan }
}

// Star button — giữ nguyên logic gốc
function StarButton({ symbol, isPinned, onToggle }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={e => { e.stopPropagation(); onToggle(symbol) }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded transition-colors"
      style={{ background: hovered && !isPinned ? '#f0b90b12' : 'transparent' }}
      title={isPinned ? 'Bỏ khỏi Watchlist' : 'Thêm vào Watchlist'}
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          fill={isPinned ? '#f0b90b' : hovered ? '#f0b90b66' : 'none'}
          stroke={isPinned ? '#f0b90b' : hovered ? '#f0b90b66' : '#3a4555'}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}

const CoinList = forwardRef(function CoinList(props, ref) {
  const prices = useMarketStore(s => s.prices)
  const setPrices = useMarketStore(s => s.setPrices)
  const { symbol, setSymbol, market } = useChartStore()

  const watchSymbols = useWatchlistStore(s => s.symbols)
  const toggleWatchlist = useWatchlistStore(s => s.toggle)
  const isPinnedFn = useWatchlistStore(s => s.isPinned)

  const [allSymbols, setAllSymbols] = useState(FEATURED)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('vol_desc')
  const [showAll, setShowAll] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('market')

  const [glSnapshot, setGlSnapshot] = useState({ gainers: [], losers: [] })
  const glTimerRef = useRef(null)
  const allSymbolsRef = useRef(allSymbols)
  useEffect(() => { allSymbolsRef.current = allSymbols }, [allSymbols])

  // ── Screener state ─────────────────────────────────────────────────────────
  const [screenerPreset, setScreenerPreset] = useState('rsi_os')
  const isScreenerActive = activeTab === 'screener'
  const { screenData, scanTime, scanning, scan } = useScreener(allSymbols, market, prices, isScreenerActive)

  // ── Keyboard navigation ────────────────────────────────────────────────────
  const [kbIndex, setKbIndex] = useState(-1)   // -1 = không có focus keyboard
  const listScrollRef = useRef(null)             // ref cho div scroll chứa rows
  const kbIndexRef = useRef(-1)
  useEffect(() => { kbIndexRef.current = kbIndex }, [kbIndex])

  // Load tickers — giữ nguyên logic gốc
  useEffect(() => {
    setLoading(true)
    let retryCount = 0
    const MAX_RETRY = 3

    async function fetchWithRetry() {
      while (retryCount < MAX_RETRY) {
        try {
          const tickers = await getAllTickers24h(market)
          const usdtTickers = tickers
            .filter(t => t.symbol.endsWith('USDT'))
            .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))

          const syms = usdtTickers.map(t => t.symbol)
          setAllSymbols(syms)

          const map = {}
          usdtTickers.forEach(t => {
            map[t.symbol] = {
              price: parseFloat(t.lastPrice),
              change24h: parseFloat(t.priceChangePercent),
              changeAbs: parseFloat(t.priceChange),
              high24h: parseFloat(t.highPrice),
              low24h: parseFloat(t.lowPrice),
              volume: parseFloat(t.volume),
              quoteVolume: parseFloat(t.quoteVolume),
              openPrice: parseFloat(t.openPrice),
              market,
            }
          })
          setPrices(map)
          setLoading(false)
          return
        } catch (e) {
          retryCount++
          console.warn(`[Init tickers] attempt ${retryCount} failed:`, e.message)
          if (retryCount < MAX_RETRY) await new Promise(r => setTimeout(r, 1500))
        }
      }
      console.error('[Init tickers] All retries failed')
      setLoading(false)
    }

    fetchWithRetry()
  }, [market])

  // WebSocket streams — giữ nguyên logic gốc
  const streamSymbols = useMemo(() =>
    allSymbols.slice(0, 180), [allSymbols.join(',').slice(0, 50)]
  )
  useBinanceWS(streamSymbols.length > 0 ? streamSymbols : FEATURED, market)

  const watchSymbolsOutside = useMemo(() => {
    const top180Set = new Set(streamSymbols)
    return watchSymbols.filter(s => !top180Set.has(s))
  }, [watchSymbols, streamSymbols])
  useBinanceWS(watchSymbolsOutside, market)

  // Gainers/Losers snapshot — giữ nguyên logic gốc
  useEffect(() => {
    function buildSnapshot() {
      const syms = allSymbolsRef.current
      const validSyms = syms.filter(s => {
        const d = prices[s]
        return d?.price != null && !isNaN(d.price) && isFinite(d.change24h)
      })
      const sorted = [...validSyms].sort((a, b) =>
        (prices[b]?.change24h ?? 0) - (prices[a]?.change24h ?? 0)
      )
      setGlSnapshot({
        gainers: sorted.slice(0, 20),
        losers: sorted.slice(-20).reverse(),
      })
    }

    if ((activeTab === 'gainers' || activeTab === 'losers') && !loading) buildSnapshot()

    glTimerRef.current = setInterval(() => {
      if ((activeTab === 'gainers' || activeTab === 'losers') && !loading) buildSnapshot()
    }, GAINERS_INTERVAL_MS)

    return () => clearInterval(glTimerRef.current)
  }, [activeTab, loading, prices])

  // Filter + sort — giữ nguyên logic gốc
  const filtered = useMemo(() => {
    let list = allSymbols
    if (search.trim()) {
      const q = search.trim().toUpperCase()
      list = list.filter(s => s.includes(q) || s.replace('USDT', '').includes(q))
    }
    if (!search && !showAll) list = list.slice(0, 60)
    return [...list].sort((a, b) => {
      const pa = prices[a] || {}
      const pb = prices[b] || {}
      switch (sort) {
        case 'vol_desc': return (pb.quoteVolume || 0) - (pa.quoteVolume || 0)
        case 'change_desc': return (pb.change24h || 0) - (pa.change24h || 0)
        case 'change_asc': return (pa.change24h || 0) - (pb.change24h || 0)
        case 'price_desc': return (pb.price || 0) - (pa.price || 0)
        default: return 0
      }
    })
  }, [allSymbols, search, sort, showAll, prices])

  // Expose navigateCoin(delta) lên parent (App) qua ref
  // ⚠️ Phải đặt SAU khai báo `filtered` để tránh TDZ ReferenceError
  useImperativeHandle(ref, () => ({
    navigateCoin(delta) {
      // Lấy list đang hiển thị theo tab hiện tại
      const list = (() => {
        if (activeTab === 'gainers') return glSnapshot.gainers
        if (activeTab === 'losers') return glSnapshot.losers
        if (activeTab === 'watchlist') return watchSymbols
        return filtered
      })()
      if (!list.length) return

      const cur = kbIndexRef.current
      const next = cur === -1
        ? (delta > 0 ? 0 : list.length - 1)
        : Math.max(0, Math.min(list.length - 1, cur + delta))

      setKbIndex(next)
      setSymbol(list[next])

      // Scroll row vào view
      if (listScrollRef.current) {
        const rows = listScrollRef.current.querySelectorAll('[data-coinrow]')
        if (rows[next]) rows[next].scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
  }), [activeTab, filtered, glSnapshot, watchSymbols])

  // ── Row render ─────────────────────────────────────────────────────────────
  function renderRow(s, idx, showRank = false) {
    const d = prices[s] || {}
    const isUp = (d.change24h ?? 0) >= 0
    const isSelected = symbol === s
    const isKbFocused = kbIndex === idx
    const hasData = d.price != null && !isNaN(d.price)
    const baseName = s.replace('USDT', '')
    const pinned = isPinnedFn(s)
    const changeColor = isUp ? '#0ecb81' : '#f6465d'

    return (
      <div
        key={s}
        data-coinrow
        onClick={() => { setSymbol(s); setKbIndex(idx) }}
        className="flex items-center gap-1.5 px-2 py-1.5 cursor-pointer transition-all"
        style={{
          background: isSelected ? '#f0b90b0a' : isKbFocused ? '#ffffff08' : 'transparent',
          borderLeft: isSelected ? '2px solid #f0b90b' : isKbFocused ? '2px solid #ffffff22' : '2px solid transparent',
          borderBottom: '0.5px solid #161b22',
        }}
        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#161b2280' }}
        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isKbFocused ? '#ffffff08' : 'transparent' }}
      >
        <StarButton symbol={s} isPinned={pinned} onToggle={toggleWatchlist} />

        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          <div className="flex items-center gap-1">
            {showRank && (
              <span className="text-[9px] font-bold w-4 flex-shrink-0" style={{
                color: idx === 0 ? '#f0b90b' : idx === 1 ? '#8b98a5' : idx === 2 ? '#cd7f32' : '#3a4555'
              }}>{idx + 1}</span>
            )}
            <span className="text-[11px] font-semibold truncate" style={{ color: '#c9d1d9' }}>{baseName}</span>
            <span className="text-[9px] flex-shrink-0" style={{ color: '#3a4555' }}>/USDT</span>
          </div>
          <span className="text-[9px]" style={{ color: '#3a4555', marginLeft: showRank ? 16 : 0 }}>
            {fmtVol(d.quoteVolume)}
          </span>
        </div>

        <div className="text-right flex flex-col gap-0.5 flex-shrink-0">
          <span className="text-[11px] font-semibold tabular-nums" style={{ color: hasData ? '#c9d1d9' : '#3a4555' }}>
            {fmtPrice(d.price)}
          </span>
          <span className="text-[9px] font-semibold tabular-nums px-1 rounded-sm"
            style={{
              color: changeColor,
              background: isUp ? '#0ecb8114' : '#f6465d14',
            }}>
            {d.change24h != null && !isNaN(d.change24h)
              ? `${isUp ? '+' : ''}${d.change24h.toFixed(2)}%` : '---'}
          </span>
        </div>
      </div>
    )
  }

  // ── Tabs ───────────────────────────────────────────────────────────────────
  const TABS = [
    { id: 'market', label: 'Market' },
    { id: 'watchlist', label: '★' },
    { id: 'gainers', label: '▲' },
    { id: 'losers', label: '▼' },
    { id: 'screener', label: '⚡' },
  ]

  const tabColor = (id) => {
    if (id === 'gainers') return '#0ecb81'
    if (id === 'losers') return '#f6465d'
    if (id === 'screener') return '#a855f7'
    return '#f0b90b'
  }

  // Đếm số coin pass preset hiện tại (để hiện badge)
  const screenerCount = useMemo(() => {
    const preset = SCREENER_PRESETS.find(p => p.id === screenerPreset)
    if (!preset) return 0
    return allSymbols.slice(0, SCREENER_COINS).filter(sym => {
      const d = { ...screenData[sym], symbol: sym }
      return preset.test(d, prices)
    }).length
  }, [screenerPreset, screenData, allSymbols, prices])

  return (
    <div className="flex flex-col h-full" style={{ background: '#0d1117' }}>

      {/* Tabs */}
      <div className="flex flex-shrink-0" style={{ borderBottom: '0.5px solid #161b22' }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id
          const color = tabColor(tab.id)
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearch('') }}
              className="flex-1 py-2 text-[10px] font-semibold transition-all relative"
              style={{
                color: isActive ? color : '#3a4555',
                borderBottom: isActive ? `2px solid ${color}` : '2px solid transparent',
                background: isActive ? `${color}0c` : 'transparent',
                marginBottom: -1,
              }}
            >
              {tab.label}
              {tab.id === 'watchlist' && watchSymbols.length > 0 && (
                <span className="absolute top-1 right-1 text-[7px] font-bold leading-none px-1 py-0.5 rounded-full"
                  style={{
                    background: isActive ? '#f0b90b' : '#2a3040',
                    color: isActive ? '#000' : '#566475',
                  }}>
                  {watchSymbols.length}
                </span>
              )}
              {tab.id === 'screener' && screenerCount > 0 && (
                <span className="absolute top-1 right-0.5 text-[7px] font-bold leading-none px-1 py-0.5 rounded-full"
                  style={{
                    background: isActive ? '#a855f7' : '#2a3040',
                    color: isActive ? '#fff' : '#566475',
                  }}>
                  {screenerCount}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ══ TAB: MARKET ══ */}
      {activeTab === 'market' && (
        <>
          {/* Search */}
          <div className="px-2 pt-2 pb-1.5 flex-shrink-0" style={{ borderBottom: '0.5px solid #161b22' }}>
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2" width="11" height="11" viewBox="0 0 16 16" fill="none" style={{ color: '#3a4555' }}>
                <path d="M6.5 12a5.5 5.5 0 100-11 5.5 5.5 0 000 11zM13 13l-2.5-2.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                placeholder="Tìm coin..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full text-xs pl-7 pr-3 py-1.5 rounded-md transition-all"
                style={{
                  background: '#161b22',
                  color: '#c9d1d9',
                  border: '0.5px solid #2a3040',
                  outline: 'none',
                }}
                onFocus={e => e.target.style.borderColor = '#f0b90b66'}
                onBlur={e => e.target.style.borderColor = '#2a3040'}
              />
              {search && (
                <button onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px]"
                  style={{ color: '#3a4555' }}>✕</button>
              )}
            </div>
          </div>

          {/* Sort bar */}
          <div className="flex items-center gap-1 px-2 py-1 flex-shrink-0" style={{ borderBottom: '0.5px solid #161b22' }}>
            <select value={sort} onChange={e => setSort(e.target.value)}
              className="text-[9px] px-1.5 py-0.5 rounded cursor-pointer flex-1"
              style={{
                background: '#161b22',
                color: '#566475',
                border: '0.5px solid #2a3040',
                outline: 'none',
              }}>
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {!search && (
              <span className="text-[9px] ml-1 flex-shrink-0" style={{ color: '#3a4555' }}>
                {loading ? '...' : `${allSymbols.length}`}
              </span>
            )}
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-3 py-1 flex-shrink-0"
            style={{ borderBottom: '0.5px solid #161b22' }}>
            <span className="text-[9px] font-semibold uppercase tracking-wider ml-5" style={{ color: '#3a4555' }}>Coin</span>
            <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: '#3a4555' }}>Giá / 24h</span>
          </div>

          {/* Rows */}
          <div ref={listScrollRef} className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#2a3040 transparent' }}>
            {loading && (
              <div className="flex items-center justify-center h-20 text-xs" style={{ color: '#3a4555' }}>
                <span>Đang tải...</span>
              </div>
            )}
            {!loading && filtered.map((s, i) => renderRow(s, i, false))}
            {!search && !showAll && allSymbols.length > 60 && (
              <button onClick={() => setShowAll(true)}
                className="w-full py-2.5 text-xs transition-colors"
                style={{ color: '#f0b90b', borderTop: '0.5px solid #161b22' }}>
                Xem thêm {allSymbols.length - 60} ↓
              </button>
            )}
            {!search && showAll && (
              <button onClick={() => setShowAll(false)}
                className="w-full py-2.5 text-xs transition-colors"
                style={{ color: '#566475', borderTop: '0.5px solid #161b22' }}>
                Thu gọn ↑
              </button>
            )}
            {!loading && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center h-20 gap-1">
                <span className="text-xs" style={{ color: '#3a4555' }}>Không tìm thấy "{search}"</span>
              </div>
            )}
          </div>
        </>
      )}

      {/* ══ TAB: WATCHLIST ══ */}
      {activeTab === 'watchlist' && (
        <>
          <div className="flex items-center justify-between px-3 py-1.5 flex-shrink-0"
            style={{ borderBottom: '0.5px solid #161b22' }}>
            <span className="text-[9px]" style={{ color: '#3a4555' }}>
              {watchSymbols.length === 0 ? 'Chưa có coin' : `${watchSymbols.length} coin`}
            </span>
            {watchSymbols.length > 0 && (
              <button
                onClick={() => useWatchlistStore.getState().clear()}
                className="text-[9px] px-1.5 py-0.5 rounded transition-colors"
                style={{ color: '#3a4555' }}
                onMouseEnter={e => { e.target.style.color = '#f6465d' }}
                onMouseLeave={e => { e.target.style.color = '#3a4555' }}
              >
                Xoá tất cả
              </button>
            )}
          </div>

          {watchSymbols.length > 0 && (
            <div className="flex items-center justify-between px-3 py-1 flex-shrink-0"
              style={{ borderBottom: '0.5px solid #161b22' }}>
              <span className="text-[9px] font-semibold uppercase tracking-wider ml-5" style={{ color: '#3a4555' }}>Coin</span>
              <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: '#3a4555' }}>Giá / 24h</span>
            </div>
          )}

          <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#2a3040 transparent' }}>
            {watchSymbols.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 px-4 text-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.2 }}>
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                    stroke="#f0b90b" strokeWidth="1.5" strokeLinejoin="round" />
                </svg>
                <div>
                  <p className="text-[11px] font-medium mb-1" style={{ color: '#566475' }}>Watchlist trống</p>
                  <p className="text-[10px] leading-relaxed" style={{ color: '#3a4555' }}>
                    Bấm ★ để thêm coin vào đây
                  </p>
                </div>
              </div>
            ) : (
              watchSymbols.map((s, i) => renderRow(s, i, false))
            )}
          </div>
        </>
      )}

      {/* ══ TAB: GAINERS ══ */}
      {activeTab === 'gainers' && (
        <>
          <div className="flex items-center justify-between px-3 py-1.5 flex-shrink-0"
            style={{ borderBottom: '0.5px solid #161b22' }}>
            <span className="text-[9px]" style={{ color: '#3a4555' }}>Top 20 tăng mạnh nhất 24h</span>
            <span className="text-[9px] font-semibold" style={{ color: '#0ecb81' }}>Live 3s</span>
          </div>
          <div className="flex items-center justify-between px-3 py-1 flex-shrink-0"
            style={{ borderBottom: '0.5px solid #161b22' }}>
            <span className="text-[9px] font-semibold uppercase tracking-wider ml-5" style={{ color: '#3a4555' }}>Coin</span>
            <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: '#3a4555' }}>Giá / 24h</span>
          </div>
          <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#2a3040 transparent' }}>
            {loading || glSnapshot.gainers.length === 0 ? (
              <div className="flex items-center justify-center h-20 text-xs" style={{ color: '#3a4555' }}>Đang tải...</div>
            ) : (
              glSnapshot.gainers.map((s, idx) => renderRow(s, idx, true))
            )}
          </div>
        </>
      )}

      {/* ══ TAB: LOSERS ══ */}
      {activeTab === 'losers' && (
        <>
          <div className="flex items-center justify-between px-3 py-1.5 flex-shrink-0"
            style={{ borderBottom: '0.5px solid #161b22' }}>
            <span className="text-[9px]" style={{ color: '#3a4555' }}>Top 20 giảm mạnh nhất 24h</span>
            <span className="text-[9px] font-semibold" style={{ color: '#f6465d' }}>Live 3s</span>
          </div>
          <div className="flex items-center justify-between px-3 py-1 flex-shrink-0"
            style={{ borderBottom: '0.5px solid #161b22' }}>
            <span className="text-[9px] font-semibold uppercase tracking-wider ml-5" style={{ color: '#3a4555' }}>Coin</span>
            <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: '#3a4555' }}>Giá / 24h</span>
          </div>
          <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#2a3040 transparent' }}>
            {loading || glSnapshot.losers.length === 0 ? (
              <div className="flex items-center justify-center h-20 text-xs" style={{ color: '#3a4555' }}>Đang tải...</div>
            ) : (
              glSnapshot.losers.map((s, idx) => renderRow(s, idx, true))
            )}
          </div>
        </>
      )}

      {/* ══ TAB: SCREENER ══ */}
      {activeTab === 'screener' && (() => {
        const preset = SCREENER_PRESETS.find(p => p.id === screenerPreset)
        const scanSymbols = allSymbols.slice(0, SCREENER_COINS)

        // Preset không cần fetch (near_high, near_low, vol_spike, big_move)
        // → có thể hiển thị ngay mà không cần chờ scan
        const needsFetch = preset?.needsFetch !== false

        const results = scanSymbols
          .filter(sym => {
            const d = { ...screenData[sym], symbol: sym }
            return preset && preset.test(d, prices)
          })
          .map(sym => ({
            sym,
            rsi: screenData[sym]?.rsi,
            stochK: screenData[sym]?.stochK,
          }))
          .sort((a, b) => {
            if (screenerPreset === 'rsi_os') return (a.rsi ?? 99) - (b.rsi ?? 99)
            if (screenerPreset === 'rsi_ob') return (b.rsi ?? 0) - (a.rsi ?? 0)
            if (screenerPreset === 'stochrsi_os') return (a.stochK ?? 99) - (b.stochK ?? 99)
            // near_high → sort theo % cách high (gần nhất lên đầu)
            if (screenerPreset === 'near_high') {
              const pa = prices[a.sym]; const pb = prices[b.sym]
              const ra = pa?.high24h ? pa.price / pa.high24h : 0
              const rb = pb?.high24h ? pb.price / pb.high24h : 0
              return rb - ra
            }
            // near_low → sort theo % cách low (gần nhất lên đầu)
            if (screenerPreset === 'near_low') {
              const pa = prices[a.sym]; const pb = prices[b.sym]
              const ra = pa?.low24h ? pa.price / pa.low24h : 999
              const rb = pb?.low24h ? pb.price / pb.low24h : 999
              return ra - rb
            }
            return (prices[b.sym]?.quoteVolume ?? 0) - (prices[a.sym]?.quoteVolume ?? 0)
          })

        // Preset không cần fetch: hiện kết quả ngay (không chờ screenData)
        const isReady = !needsFetch || Object.keys(screenData).length > 0

        return (
          <>
            {/* Header + refresh */}
            <div className="flex items-center justify-between px-2 py-1.5 flex-shrink-0"
              style={{ borderBottom: '0.5px solid #161b22' }}>
              <span className="text-[9px] font-semibold" style={{ color: '#a855f7' }}>
                Screener · Top {SCREENER_COINS}
              </span>
              <div className="flex items-center gap-1.5">
                {/* Badge: preset không cần fetch → "Instant" */}
                {!needsFetch && (
                  <span className="text-[8px] px-1 py-0.5 rounded"
                    style={{ background: '#0ecb8122', color: '#0ecb81' }}>
                    Instant
                  </span>
                )}
                {scanTime && !scanning && needsFetch && (
                  <span className="text-[8px]" style={{ color: '#3a4555' }}>
                    {scanTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
                <button
                  onClick={scan}
                  disabled={scanning}
                  title="Quét lại"
                  className="flex items-center justify-center w-5 h-5 rounded transition-colors"
                  style={{ color: scanning ? '#3a4555' : '#566475' }}
                  onMouseEnter={e => { if (!scanning) e.currentTarget.style.color = '#a855f7' }}
                  onMouseLeave={e => { if (!scanning) e.currentTarget.style.color = '#566475' }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round"
                    style={{ animation: scanning ? 'spin 1s linear infinite' : 'none' }}>
                    <polyline points="23 4 23 10 17 10" />
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Preset selector — 2 hàng gọn hơn */}
            <div className="flex flex-shrink-0 px-1.5 py-1.5 gap-1 flex-wrap"
              style={{ borderBottom: '0.5px solid #161b22' }}>
              {SCREENER_PRESETS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setScreenerPreset(p.id)}
                  title={p.desc}
                  className="flex items-center gap-1 px-1.5 py-1 rounded text-[9px] font-semibold transition-all"
                  style={{
                    background: screenerPreset === p.id ? `${p.color}22` : '#161b22',
                    color: screenerPreset === p.id ? p.color : '#566475',
                    border: `0.5px solid ${screenerPreset === p.id ? p.color + '66' : '#2a3040'}`,
                  }}
                >
                  <span>{p.icon}</span>
                  <span>{p.label}</span>
                </button>
              ))}
            </div>

            {/* Desc */}
            <div className="px-2 py-1 flex-shrink-0" style={{ borderBottom: '0.5px solid #161b22' }}>
              <span className="text-[9px]" style={{ color: '#566475' }}>{preset?.desc}</span>
            </div>

            {/* Scanning skeleton — chỉ hiện với preset cần fetch */}
            {needsFetch && scanning && Object.keys(screenData).length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2"
                  strokeLinecap="round" style={{ animation: 'spin 1s linear infinite' }}>
                  <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
                <span className="text-[10px]" style={{ color: '#566475' }}>Đang quét {SCREENER_COINS} coin...</span>
                <span className="text-[9px]" style={{ color: '#3a4555' }}>khoảng 15–20 giây</span>
              </div>
            )}

            {/* No result */}
            {isReady && !scanning && results.length === 0 && (
              <div className="flex flex-col items-center justify-center h-24 gap-2 px-4 text-center">
                <span className="text-[20px]" style={{ opacity: 0.4 }}>{preset?.icon}</span>
                <span className="text-[10px]" style={{ color: '#566475' }}>
                  Không có coin nào thỏa điều kiện
                </span>
              </div>
            )}

            {/* Results list */}
            {isReady ? (
              <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#2a3040 transparent' }}>
                {results.map(({ sym, rsi, stochK }, idx) => {
                  const d = prices[sym] || {}
                  const isUp = (d.change24h ?? 0) >= 0
                  const isSelected = symbol === sym
                  const baseName = sym.replace('USDT', '')
                  const pinned = isPinnedFn(sym)
                  const changeColor = isUp ? '#0ecb81' : '#f6465d'

                  // % cách high/low 24h
                  const pctFromHigh = d.high24h ? ((d.price - d.high24h) / d.high24h) * 100 : null
                  const pctFromLow = d.low24h ? ((d.price - d.low24h) / d.low24h) * 100 : null

                  // Badge chính tuỳ preset
                  const badge = (() => {
                    if (screenerPreset === 'rsi_os' || screenerPreset === 'rsi_ob') {
                      if (rsi == null) return null
                      const c = rsi < 30 ? '#0ecb81' : rsi > 70 ? '#f6465d' : '#566475'
                      return { label: `RSI ${rsi.toFixed(1)}`, color: c }
                    }
                    if (screenerPreset === 'stochrsi_os') {
                      if (stochK == null) return null
                      return { label: `StochK ${stochK.toFixed(1)}`, color: '#22d3ee' }
                    }
                    if (screenerPreset === 'near_high' && pctFromHigh != null) {
                      return { label: `${pctFromHigh.toFixed(2)}% từ High`, color: '#f0b90b' }
                    }
                    if (screenerPreset === 'near_low' && pctFromLow != null) {
                      return { label: `+${pctFromLow.toFixed(2)}% từ Low`, color: '#a855f7' }
                    }
                    return null
                  })()

                  return (
                    <div
                      key={sym}
                      onClick={() => setSymbol(sym)}
                      className="flex items-center gap-1.5 px-2 py-1.5 cursor-pointer transition-all"
                      style={{
                        background: isSelected ? '#a855f714' : 'transparent',
                        borderLeft: isSelected ? `2px solid ${preset?.color ?? '#a855f7'}` : '2px solid transparent',
                        borderBottom: '0.5px solid #161b22',
                      }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#161b2280' }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                    >
                      <StarButton symbol={sym} isPinned={pinned} onToggle={toggleWatchlist} />

                      {/* Rank */}
                      <span className="text-[9px] font-bold w-4 flex-shrink-0 text-center" style={{
                        color: idx === 0 ? '#f0b90b' : idx === 1 ? '#8b98a5' : '#3a4555'
                      }}>{idx + 1}</span>

                      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                        <span className="text-[11px] font-semibold truncate" style={{ color: '#c9d1d9' }}>{baseName}</span>
                        <div className="flex items-center gap-1.5">
                          {/* Badge chính */}
                          {badge && (
                            <span className="text-[8px] font-bold px-1 py-0.5 rounded-sm tabular-nums"
                              style={{ background: `${badge.color}22`, color: badge.color }}>
                              {badge.label}
                            </span>
                          )}
                          {screenData[sym]?.error && (
                            <span className="text-[8px]" style={{ color: '#3a4555' }}>err</span>
                          )}
                          <span className="text-[9px]" style={{ color: '#3a4555' }}>{fmtVol(d.quoteVolume)}</span>
                        </div>
                      </div>

                      <div className="text-right flex flex-col gap-0.5 flex-shrink-0">
                        <span className="text-[11px] font-semibold tabular-nums" style={{ color: '#c9d1d9' }}>
                          {fmtPrice(d.price)}
                        </span>
                        <span className="text-[9px] font-semibold tabular-nums px-1 rounded-sm"
                          style={{ color: changeColor, background: isUp ? '#0ecb8114' : '#f6465d14' }}>
                          {d.change24h != null ? `${isUp ? '+' : ''}${d.change24h.toFixed(2)}%` : '---'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : null}

            {/* Scan progress khi đang refresh */}
            {scanning && Object.keys(screenData).length > 0 && (
              <div className="flex-shrink-0 py-1 text-center" style={{ borderTop: '0.5px solid #161b22' }}>
                <span className="text-[9px]" style={{ color: '#566475' }}>⟳ Đang cập nhật...</span>
              </div>
            )}

            {/* CSS animation cho spinner */}
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </>
        )
      })()}

    </div>
  )
})

export default CoinList