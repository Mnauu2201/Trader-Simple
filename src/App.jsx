// src/App.jsx — UI redesign + Mobile responsive

import { useState } from 'react'
import CoinList from './components/CoinList'
import ChartPanel from './components/ChartPanel'
import PriceCard from './components/PriceCard'
import AlertPanel from './components/AlertPanel'
import OrderBookPanel from './components/OrderBookPanel'
import RecentTradesPanel from './components/RecentTradesPanel'
import LongShortPanel from './components/LongShortPanel'
import { useAlertChecker } from './hooks/useAlertChecker'
import { useAlertStore } from './store/alertStore'
import { useChartStore } from './store/chartStore'
import { useMarketStore } from './store/marketStore'

function AlertEngine() {
  useAlertChecker()
  return null
}

const PANEL_MODES = ['longshort', 'orderbook', 'trades', 'alerts']

const PANEL_CONFIG = [
  {
    id: 'longshort',
    label: 'L/S Ratio',
    color: '#f0b90b',
    width: 'w-[240px]',
    Component: LongShortPanel,
    wrapClass: 'overflow-hidden',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="3" x2="12" y2="21" /><polyline points="17 8 12 3 7 8" /><polyline points="7 16 12 21 17 16" />
      </svg>
    ),
  },
  {
    id: 'orderbook',
    label: 'Order Book',
    color: '#4dabf7',
    width: 'w-[220px]',
    Component: OrderBookPanel,
    wrapClass: 'flex flex-col',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18" />
      </svg>
    ),
  },
  {
    id: 'trades',
    label: 'Trades',
    color: '#0ecb81',
    width: 'w-[260px]',
    Component: RecentTradesPanel,
    wrapClass: 'flex flex-col',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
      </svg>
    ),
  },
  {
    id: 'alerts',
    label: 'Alerts',
    color: '#f0b90b',
    width: 'w-[260px]',
    Component: AlertPanel,
    wrapClass: 'flex flex-col',
    isAlert: true,
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" />
      </svg>
    ),
  },
]

// ── Mobile Tab Config ───────────────────────────────────────────────────────
const MOBILE_TABS = [
  {
    id: 'chart',
    label: 'Chart',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
      </svg>
    ),
  },
  {
    id: 'market',
    label: 'Market',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
  },
  {
    id: 'orderbook',
    label: 'Book',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18" />
      </svg>
    ),
  },
  {
    id: 'trades',
    label: 'Trades',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3h18v18H3z" opacity="0" /><path d="M4 6h16M4 10h16M4 14h8M4 18h5" />
      </svg>
    ),
  },
  {
    id: 'alerts',
    label: 'Alerts',
    isAlert: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" />
      </svg>
    ),
  },
]

// ── Mobile Header ───────────────────────────────────────────────────────────
function MobileHeader({ onMarketTabPress }) {
  const { symbol, market, setMarket } = useChartStore()
  const prices = useMarketStore(s => s.prices)
  const d = prices[symbol] || {}
  const isUp = (d.change24h ?? 0) >= 0
  const base = symbol.replace('USDT', '')

  function fmtPrice(p) {
    if (p == null || !isFinite(p) || p === 0) return '---'
    if (p >= 10000) return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    if (p >= 1000) return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    if (p >= 100) return p.toFixed(3)
    if (p >= 10) return p.toFixed(4)
    return p.toFixed(4)
  }

  return (
    <div className="flex items-center justify-between px-3 py-2 flex-shrink-0 border-b"
      style={{ background: '#0d1117', borderColor: '#161b22', minHeight: 48 }}>
      {/* Logo + Symbol */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ background: '#f0b90b' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M2 12L12 2l10 10-10 10L2 12z" fill="#000" opacity="0.85" />
            <path d="M7 12l5-5 5 5-5 5-5-5z" fill="#000" opacity="0.4" />
          </svg>
        </div>
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-1">
            <span className="text-[13px] font-bold" style={{ color: '#e6edf3' }}>{base}</span>
            <span className="text-[10px]" style={{ color: '#566475' }}>/USDT</span>
            <span className="text-[8px] font-bold px-1 py-0.5 rounded"
              style={{
                background: market === 'futures' ? '#f0b90b22' : '#0ecb8122',
                color: market === 'futures' ? '#f0b90b' : '#0ecb81',
              }}>
              {market === 'futures' ? 'PERP' : 'SPOT'}
            </span>
          </div>
        </div>
      </div>

      {/* Price + change */}
      <div className="flex flex-col items-end">
        <span className="text-[15px] font-bold tabular-nums leading-tight"
          style={{ color: isUp ? '#0ecb81' : '#f6465d' }}>
          {d.price ? fmtPrice(d.price) : '---'}
        </span>
        <span className="text-[10px] font-medium tabular-nums"
          style={{ color: isUp ? '#0ecb81' : '#f6465d' }}>
          {isFinite(d.change24h) ? (isUp ? '+' : '') + d.change24h.toFixed(2) + '%' : '---'}
        </span>
      </div>

      {/* Spot / Futures toggle */}
      <div className="flex rounded overflow-hidden" style={{ border: '0.5px solid #2a3040' }}>
        {['spot', 'futures'].map(m => (
          <button key={m} onClick={() => setMarket(m)}
            className="px-2 py-1 text-[10px] font-medium transition-colors"
            style={{
              background: market === m ? '#f0b90b' : 'transparent',
              color: market === m ? '#000' : '#566475',
            }}>
            {m === 'futures' ? 'Futures' : 'Spot'}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Mobile Stats Bar ────────────────────────────────────────────────────────
// Hiện 4 stats quan trọng nhất thay vì full PriceCard
function MobileStatsBar() {
  const { symbol, market } = useChartStore()
  const prices = useMarketStore(s => s.prices)
  const d = prices[symbol] || {}

  function fmtPrice(p) {
    if (p == null || !isFinite(p) || p === 0) return '---'
    if (p >= 10000) return p.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
    if (p >= 1000) return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    if (p >= 100) return p.toFixed(2)
    return p.toFixed(3)
  }

  function fmtVol(n) {
    if (!isFinite(n) || n <= 0) return '---'
    if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B'
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
    return n.toFixed(0)
  }

  const stats = [
    { label: 'High', value: fmtPrice(d.high24h), color: '#0ecb81' },
    { label: 'Low', value: fmtPrice(d.low24h), color: '#f6465d' },
    { label: 'Vol', value: fmtVol(d.quoteVolume), color: '#c9d1d9' },
    { label: 'Open', value: fmtPrice(d.openPrice), color: '#848e9c' },
  ]

  return (
    <div className="flex items-center justify-between px-3 py-1.5 flex-shrink-0 border-b"
      style={{ background: '#0d1117', borderColor: '#161b22' }}>
      {stats.map(({ label, value, color }) => (
        <div key={label} className="flex flex-col items-center gap-0">
          <span className="text-[8px] font-medium uppercase" style={{ color: '#566475' }}>{label}</span>
          <span className="text-[10px] font-semibold tabular-nums" style={{ color }}>{value}</span>
        </div>
      ))}
    </div>
  )
}

// ── Mobile Bottom Nav ───────────────────────────────────────────────────────
function MobileBottomNav({ activeTab, onTabChange, alertCount }) {
  return (
    <nav className="flex flex-shrink-0 border-t"
      style={{
        background: '#0d1117',
        borderColor: '#161b22',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}>
      {MOBILE_TABS.map(({ id, label, icon, isAlert }) => {
        const isActive = activeTab === id
        return (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 relative transition-colors"
            style={{ color: isActive ? '#f0b90b' : '#566475' }}
          >
            {icon}
            <span className="text-[9px] font-medium">{label}</span>
            {/* Alert badge */}
            {isAlert && alertCount > 0 && (
              <span className="absolute top-1 right-1/4 text-[8px] font-bold w-3.5 h-3.5 flex items-center justify-center rounded-full"
                style={{ background: '#f0b90b', color: '#000' }}>
                {alertCount > 9 ? '9+' : alertCount}
              </span>
            )}
            {/* Active indicator */}
            {isActive && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-b"
                style={{ background: '#f0b90b' }} />
            )}
          </button>
        )
      })}
    </nav>
  )
}

// ── Main App ────────────────────────────────────────────────────────────────
export default function App() {
  const [rightPanel, setRightPanel] = useState(null)
  const [mobileTab, setMobileTab] = useState('chart')
  const activeCount = useAlertStore(s => s.alerts.filter(a => !a.triggered).length)

  function togglePanel(mode) {
    setRightPanel(prev => prev === mode ? null : mode)
  }

  const activePanelConfig = PANEL_CONFIG.find(p => p.id === rightPanel)

  return (
    <div className="flex h-screen bg-[#0b0e11] text-white overflow-hidden" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <AlertEngine />

      {/* ══════════════════════════════════════════════
          MOBILE LAYOUT — hiển thị khi < md (768px)
          ══════════════════════════════════════════════ */}
      <div className="flex flex-col w-full h-full md:hidden">

        {/* Mobile header — luôn hiện */}
        <MobileHeader />

        {/* Tab content */}
        <div className="flex-1 min-h-0 overflow-hidden">

          {/* TAB: Chart */}
          {mobileTab === 'chart' && (
            <div className="flex flex-col h-full">
              {/* Stats bar nhỏ gọn */}
              <MobileStatsBar />
              {/* Chart full height */}
              <div className="flex-1 min-h-0 overflow-hidden">
                <ChartPanel />
              </div>
            </div>
          )}

          {/* TAB: Market — CoinList full screen */}
          {mobileTab === 'market' && (
            <div className="h-full overflow-hidden">
              <CoinList />
            </div>
          )}

          {/* TAB: Order Book */}
          {mobileTab === 'orderbook' && (
            <div className="flex flex-col h-full overflow-hidden">
              <div className="flex-1 min-h-0 overflow-hidden">
                <OrderBookPanel />
              </div>
              <div className="flex-shrink-0 border-t" style={{ height: 180, borderColor: '#161b22' }}>
                <LongShortPanel />
              </div>
            </div>
          )}

          {/* TAB: Recent Trades */}
          {mobileTab === 'trades' && (
            <div className="h-full overflow-hidden">
              <RecentTradesPanel />
            </div>
          )}

          {/* TAB: Alerts */}
          {mobileTab === 'alerts' && (
            <div className="h-full overflow-hidden">
              <AlertPanel onClose={() => {}} />
            </div>
          )}

        </div>

        {/* Bottom nav */}
        <MobileBottomNav
          activeTab={mobileTab}
          onTabChange={setMobileTab}
          alertCount={activeCount}
        />
      </div>

      {/* ══════════════════════════════════════════════
          DESKTOP LAYOUT — hiển thị khi ≥ md (768px)
          100% giữ nguyên layout gốc
          ══════════════════════════════════════════════ */}
      <div className="hidden md:flex w-full h-full">

        {/* ── Sidebar ── */}
        <div className="w-[192px] border-r border-[#161b22] flex-shrink-0 flex flex-col" style={{ background: '#0d1117' }}>

          {/* Logo */}
          <div className="px-3.5 py-3 border-b border-[#161b22] flex items-center gap-2.5 flex-shrink-0">
            <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
              style={{ background: '#f0b90b' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M2 12L12 2l10 10-10 10L2 12z" fill="#000" opacity="0.85" />
                <path d="M7 12l5-5 5 5-5 5-5-5z" fill="#000" opacity="0.4" />
              </svg>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[12px] font-bold tracking-wide" style={{ color: '#e6edf3' }}>Trader</span>
              <span className="text-[9px] font-semibold tracking-widest uppercase" style={{ color: '#f0b90b' }}>Simple</span>
            </div>
          </div>

          {/* Coin list */}
          <div className="flex-1 overflow-hidden">
            <CoinList />
          </div>

          {/* Panel toggle buttons */}
          <div className="flex-shrink-0 border-t border-[#161b22] pb-1 pt-0.5">
            {PANEL_CONFIG.map(({ id, label, color, icon, isAlert }) => {
              const isActive = rightPanel === id
              return (
                <button
                  key={id}
                  onClick={() => togglePanel(id)}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[11px] font-medium transition-all duration-150 relative"
                  style={{
                    color: isActive ? color : '#566475',
                    background: isActive ? `${color}12` : 'transparent',
                    borderLeft: isActive ? `2px solid ${color}` : '2px solid transparent',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = '#8b98a5' }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = '#566475' }}
                >
                  {icon}
                  <span>{label}</span>
                  {isAlert && activeCount > 0 && (
                    <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none"
                      style={{ background: '#f0b90b', color: '#000' }}>
                      {activeCount}
                    </span>
                  )}
                  {isActive && !(isAlert && activeCount > 0) && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Main area ── */}
        <div className="flex-1 flex flex-col min-w-0">
          <PriceCard />

          <div className="flex-1 flex min-h-0">
            <div className="flex-1 min-w-0">
              <ChartPanel />
            </div>

            {/* Right panel */}
            {activePanelConfig && (() => {
              const { width, wrapClass, Component, id } = activePanelConfig
              return (
                <div className={`${width} flex-shrink-0 border-l border-[#161b22] ${wrapClass}`}>
                  {id === 'alerts'
                    ? <Component onClose={() => setRightPanel(null)} />
                    : <Component />
                  }
                </div>
              )
            })()}
          </div>
        </div>

      </div>
    </div>
  )
}