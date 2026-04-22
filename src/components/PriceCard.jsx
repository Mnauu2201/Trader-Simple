import { useState, useEffect, useRef } from 'react'
import { useChartStore } from '../store/chartStore'
import { useMarketStore } from '../store/marketStore'
import { useFundingRate } from '../hooks/useFundingRate'
import { getFundingRateHistory } from '../services/binanceApi'

function fmtPrice(p) {
  if (p == null || !isFinite(p) || p === 0) return '---'
  if (p >= 10000) return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (p >= 1000) return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (p >= 100) return p.toFixed(3)
  if (p >= 10) return p.toFixed(4)
  if (p >= 1) return p.toFixed(4)
  if (p >= 0.1) return p.toFixed(5)
  if (p >= 0.01) return p.toFixed(6)
  if (p >= 0.001) return p.toFixed(7)
  if (p >= 0.0001) return p.toFixed(8)
  return p.toFixed(10)
}

function fmtVol(n) {
  if (!isFinite(n) || n <= 0) return '---'
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(2) + 'K'
  return n.toFixed(2)
}

// ── Funding Rate Sparkline — giữ nguyên logic gốc ────────────────────────────
function FundingSparkline({ symbol, market }) {
  const [history, setHistory] = useState([])
  const [hovered, setHovered] = useState(null)

  useEffect(() => {
    if (market !== 'futures' || !symbol) { setHistory([]); return }
    let cancelled = false
    getFundingRateHistory(symbol, 10)
      .then(data => {
        if (cancelled) return
        const parsed = data.map(d => ({
          rate: parseFloat(d.fundingRate),
          time: d.fundingTime,
        }))
        setHistory(parsed)
      })
      .catch(e => console.warn('[FundingSparkline]', e))
    return () => { cancelled = true }
  }, [symbol, market])

  if (!history.length) return null

  const rates = history.map(d => d.rate)
  const absMax = Math.max(...rates.map(Math.abs), 0.0001)
  const W = 72
  const H = 24
  const barW = Math.floor((W - history.length) / history.length)
  const barGap = 1

  return (
    <div className="flex flex-col gap-0.5 relative" onMouseLeave={() => setHovered(null)}>
      <span className="text-[9px] font-medium uppercase tracking-wider" style={{ color: '#566475' }}>Funding History</span>
      <svg width={W} height={H} className="cursor-crosshair overflow-visible">
        {history.map((d, i) => {
          const isPos = d.rate >= 0
          const barH = Math.max(Math.round((Math.abs(d.rate) / absMax) * (H / 2 - 2)), 1)
          const x = i * (barW + barGap)
          const y = isPos ? H / 2 - barH : H / 2
          const color = isPos ? '#0ecb81' : '#f6465d'
          const isHov = hovered === i
          return (
            <g key={i} onMouseEnter={() => setHovered(i)}>
              <rect x={x} y={y} width={barW} height={barH} fill={color} opacity={isHov ? 1 : 0.65} rx={1} />
              {isHov && (
                <foreignObject x={i < 5 ? x : x - 90} y={-28} width={96} height={26}>
                  <div className="rounded px-1.5 py-1 text-[9px] text-white whitespace-nowrap"
                    style={{ background: '#1a2030', border: '0.5px solid #2a3040' }}>
                    <span style={{ color: isPos ? '#0ecb81' : '#f6465d' }}>
                      {isPos ? '+' : ''}{(d.rate * 100).toFixed(4)}%
                    </span>
                    <span className="ml-1" style={{ color: '#566475' }}>
                      {new Date(d.time).toLocaleDateString('vi-VN', { month: 'numeric', day: 'numeric', hour: '2-digit' })}h
                    </span>
                  </div>
                </foreignObject>
              )}
            </g>
          )
        })}
        <line x1={0} y1={H / 2} x2={W} y2={H / 2} stroke="#2a3040" strokeWidth={0.5} />
      </svg>
    </div>
  )
}

// Divider vertical
function Divider() {
  return <div className="w-px self-stretch mx-1" style={{ background: '#1e2836' }} />
}

// Single stat block
function Stat({ label, value, color }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] font-medium uppercase tracking-wider" style={{ color: '#566475' }}>{label}</span>
      <span className="text-[11px] font-semibold" style={{ color: color ?? '#c9d1d9' }}>{value}</span>
    </div>
  )
}

// ── Countdown — giữ nguyên logic gốc ─────────────────────────────────────────
function FundingCountdown({ nextFundingTime }) {
  const [text, setText] = useState('')

  useEffect(() => {
    function tick() {
      const diff = nextFundingTime - Date.now()
      if (diff <= 0) { setText('00:00:00'); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setText(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [nextFundingTime])

  return <span>{text}</span>
}

export default function PriceCard() {
  const { symbol, market, setMarket } = useChartStore()
  const prices = useMarketStore(s => s.prices)
  const d = prices[symbol] || {}
  const funding = useFundingRate(symbol, market)

  const isUp = (d.change24h ?? 0) >= 0
  const hasData = d.price != null && isFinite(d.price)
  const base = symbol.replace('USDT', '')

  // Dynamic tab title — giữ nguyên logic gốc
  useEffect(() => {
    if (!hasData) { document.title = `${base}/USDT | Trader Simple`; return }
    const displayPrice = (market === 'futures' && funding?.markPrice) ? funding.markPrice : d.price
    const priceStr = fmtPrice(displayPrice)
    const changeStr = isFinite(d.change24h) ? ` ${isUp ? '+' : ''}${d.change24h.toFixed(2)}%` : ''
    document.title = `${priceStr}${changeStr} | ${base}USDT | Trader Simple`
  }, [d.price, funding?.markPrice, symbol, market, isUp])

  const volText = fmtVol(d.quoteVolume) === '---' ? '---' : fmtVol(d.quoteVolume) + ' USDT'
  const changeColor = isUp ? '#0ecb81' : '#f6465d'

  return (
    <div className="flex items-center gap-0 px-0 border-b flex-shrink-0 flex-wrap"
      style={{ background: '#0d1117', borderColor: '#161b22', minHeight: 48 }}>

      {/* Symbol + market switcher */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-r flex-shrink-0" style={{ borderColor: '#161b22' }}>
        <div className="flex flex-col leading-tight">
          <div className="flex items-baseline gap-1">
            <span className="text-[14px] font-bold tracking-tight" style={{ color: '#e6edf3' }}>{base}</span>
            <span className="text-[11px]" style={{ color: '#566475' }}>/USDT</span>
            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded ml-1"
              style={{
                background: market === 'futures' ? '#f0b90b22' : '#0ecb8122',
                color: market === 'futures' ? '#f0b90b' : '#0ecb81',
              }}>
              {market === 'futures' ? 'PERP' : 'SPOT'}
            </span>
          </div>
        </div>

        {/* Market toggle */}
        <div className="flex rounded overflow-hidden ml-2" style={{ border: '0.5px solid #2a3040' }}>
          {['spot', 'futures'].map(m => (
            <button key={m} onClick={() => setMarket(m)}
              className="px-2.5 py-1 text-[10px] font-medium transition-colors"
              style={{
                background: market === m ? '#f0b90b' : 'transparent',
                color: market === m ? '#000' : '#566475',
              }}>
              {m === 'futures' ? 'Futures' : 'Spot'}
            </button>
          ))}
        </div>
      </div>

      {/* Price + change */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-r flex-shrink-0" style={{ borderColor: '#161b22' }}>
        <span className="text-[20px] font-bold tabular-nums leading-none" style={{ color: changeColor }}>
          {hasData ? fmtPrice(d.price) : '---'}
        </span>
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] font-semibold tabular-nums" style={{ color: changeColor }}>
            {isFinite(d.change24h) ? (isUp ? '+' : '') + d.change24h.toFixed(2) + '%' : '---'}
          </span>
          <span className="text-[10px] tabular-nums" style={{ color: changeColor + 'aa' }}>
            {isFinite(d.changeAbs) ? (isUp ? '+' : '') + fmtPrice(d.changeAbs) : ''}
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 px-4 py-2.5 flex-wrap" style={{ rowGap: 6 }}>
        <Stat label="Open 24h" value={fmtPrice(d.openPrice)} />
        <Stat label="High 24h" value={fmtPrice(d.high24h)} color="#0ecb81" />
        <Stat label="Low 24h" value={fmtPrice(d.low24h)} color="#f6465d" />
        <Divider />
        <Stat label="Volume 24h" value={volText} />
        {isFinite(d.bestBid) && d.bestBid > 0 && <Stat label="Best Bid" value={fmtPrice(d.bestBid)} color="#0ecb81" />}
        {isFinite(d.bestAsk) && d.bestAsk > 0 && <Stat label="Best Ask" value={fmtPrice(d.bestAsk)} color="#f6465d" />}

        {/* Futures data — giữ nguyên điều kiện gốc */}
        {market === 'futures' && funding && (
          <>
            <Divider />
            <Stat label="Mark Price" value={fmtPrice(funding.markPrice)} />
            <Stat label="Index Price" value={fmtPrice(funding.indexPrice)} />

            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-medium uppercase tracking-wider" style={{ color: '#566475' }}>Funding Rate</span>
              <span className="text-[11px] font-semibold tabular-nums"
                style={{ color: funding.fundingRate >= 0 ? '#0ecb81' : '#f6465d' }}>
                {isFinite(funding.fundingRate)
                  ? `${funding.fundingRate >= 0 ? '+' : ''}${(funding.fundingRate * 100).toFixed(4)}%`
                  : '---'}
              </span>
            </div>

            {funding.nextFundingTime && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-medium uppercase tracking-wider" style={{ color: '#566475' }}>Next Funding</span>
                <span className="text-[11px] font-semibold font-mono" style={{ color: '#c9d1d9' }}>
                  <FundingCountdown nextFundingTime={funding.nextFundingTime} />
                </span>
              </div>
            )}

            {isFinite(funding.openInterest) && funding.openInterest > 0 && (
              <Stat label="Open Interest" value={fmtVol(funding.openInterest) + ' ' + symbol.replace('USDT', '')} />
            )}
            <Divider />
            <FundingSparkline symbol={symbol} market={market} />
          </>
        )}
      </div>
    </div>
  )
}