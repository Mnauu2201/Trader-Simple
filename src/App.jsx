// src/App.jsx — UI redesign

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

export default function App() {
  const [rightPanel, setRightPanel] = useState(null)
  const activeCount = useAlertStore(s => s.alerts.filter(a => !a.triggered).length)

  function togglePanel(mode) {
    setRightPanel(prev => prev === mode ? null : mode)
  }

  const activePanelConfig = PANEL_CONFIG.find(p => p.id === rightPanel)

  return (
    <div className="flex h-screen bg-[#0b0e11] text-white overflow-hidden" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <AlertEngine />

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
  )
}