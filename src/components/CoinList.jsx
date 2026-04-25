// src/components/CoinList.jsx
// UI redesign — logic 100% giữ nguyên từ v14

import { useEffect, useState, useMemo, useRef, forwardRef, useImperativeHandle } from 'react'
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
  ]

  const tabColor = (id) => {
    if (id === 'gainers') return '#0ecb81'
    if (id === 'losers') return '#f6465d'
    return '#f0b90b'
  }

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

    </div>
  )
})

export default CoinList