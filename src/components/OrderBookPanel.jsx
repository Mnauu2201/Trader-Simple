// src/components/OrderBookPanel.jsx
// v13: Order Book mini — top 5 bid/ask realtime từ WS @depth5
//
// Layout:
//   Header (Ask/Bid/Size labels)
//   5 Ask rows (đỏ, giá cao→thấp, depth bar bên phải)
//   Spread row (giữa)
//   5 Bid rows (xanh, giá cao→thấp, depth bar bên trái)
//
// Depth bar: visualize tổng qty tích lũy để thấy "tường" giá

import { useOrderBook } from '../hooks/useOrderBook'
import { useChartStore } from '../store/chartStore'

function fmtPrice(p) {
  if (!isFinite(p) || p <= 0) return '---'
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

function fmtQty(q) {
  if (!isFinite(q) || q <= 0) return '---'
  if (q >= 1e6) return (q / 1e6).toFixed(2) + 'M'
  if (q >= 1e3) return (q / 1e3).toFixed(2) + 'K'
  if (q >= 1) return q.toFixed(3)
  return q.toFixed(5)
}

// Tính cumulative depth để vẽ bar
function calcDepth(levels) {
  let cumSum = 0
  return levels.map(([price, qty]) => {
    cumSum += qty
    return { price, qty, cum: cumSum }
  })
}

export default function OrderBookPanel() {
  const { symbol, market } = useChartStore()
  const book = useOrderBook(symbol, market)

  // Asks hiển thị: đảo ngược để giá thấp nhất gần spread
  const rawAsks = book?.asks ?? []   // sorted thấp→cao từ hook
  const rawBids = book?.bids ?? []   // sorted cao→thấp từ hook

  // Depth bars: cumulative từ spread ra ngoài
  const asksWithDepth = calcDepth([...rawAsks].reverse())  // tính cum từ thấp→cao
  const bidsWithDepth = calcDepth(rawBids)                  // tính cum từ cao→thấp

  const maxAskCum = asksWithDepth[asksWithDepth.length - 1]?.cum ?? 1
  const maxBidCum = bidsWithDepth[bidsWithDepth.length - 1]?.cum ?? 1
  const maxCum = Math.max(maxAskCum, maxBidCum, 0.001)

  // Asks hiển thị: giá cao nhất ở trên, thấp nhất gần spread (đảo ngược)
  const asksDisplay = [...asksWithDepth].reverse()

  // Spread
  const bestAsk = rawAsks[0]?.[0]
  const bestBid = rawBids[0]?.[0]
  const spread = bestAsk != null && bestBid != null ? bestAsk - bestBid : null
  const spreadPct = spread != null && bestBid > 0 ? (spread / bestBid * 100) : null

  return (
    <div className="flex flex-col h-full bg-[#0b0e11] text-[11px] select-none">

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#1a1d26] flex-shrink-0">
        <span className="text-[11px] font-semibold text-[#eaecef]">Order Book</span>
        <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${market === 'futures' ? 'bg-[#f0b90b22] text-[#f0b90b]' : 'bg-[#0ecb8122] text-[#0ecb81]'
          }`}>
          {market === 'futures' ? 'PERP' : 'SPOT'} · depth5
        </span>
      </div>

      {/* Column headers */}
      <div className="flex items-center justify-between px-3 py-1 text-[9px] text-[#5e6673] border-b border-[#1a1d26] flex-shrink-0 font-medium">
        <span>Price (USDT)</span>
        <span>Qty</span>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-between min-h-0">

        {/* === ASKS (đỏ) === */}
        <div className="flex flex-col justify-end flex-1">
          {!book ? (
            <div className="flex items-center justify-center h-full">
              <span className="text-[#5e6673] text-[10px]">Đang kết nối...</span>
            </div>
          ) : (
            asksDisplay.map(({ price, qty, cum }, i) => {
              const barPct = (cum / maxCum * 100).toFixed(1)
              return (
                <div key={i} className="relative flex items-center justify-between px-3 py-[3px] hover:bg-[#f6465d08] transition-colors">
                  {/* Depth bar — absolute background bên phải */}
                  <div
                    className="absolute top-0 right-0 bottom-0 bg-[#f6465d0d] transition-all duration-150"
                    style={{ width: `${barPct}%` }}
                  />
                  <span className="relative z-10 font-mono text-[#f6465d] font-medium">
                    {fmtPrice(price)}
                  </span>
                  <span className="relative z-10 text-[#eaecef] font-mono">
                    {fmtQty(qty)}
                  </span>
                </div>
              )
            })
          )}
        </div>

        {/* === SPREAD ROW === */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-[#1a1d26] border-y border-[#2b3139] flex-shrink-0">
          <span className="text-[#5e6673] text-[9px]">Spread</span>
          <div className="flex items-center gap-2">
            {spread != null ? (
              <>
                <span className="text-[#848e9c] font-mono text-[9px]">{fmtPrice(spread)}</span>
                <span className="text-[#5e6673] text-[9px]">
                  ({spreadPct != null ? spreadPct.toFixed(3) + '%' : '---'})
                </span>
              </>
            ) : (
              <span className="text-[#5e6673] text-[9px]">---</span>
            )}
          </div>
        </div>

        {/* === BIDS (xanh) === */}
        <div className="flex flex-col flex-1">
          {!book ? null : (
            bidsWithDepth.map(({ price, qty, cum }, i) => {
              const barPct = (cum / maxCum * 100).toFixed(1)
              return (
                <div key={i} className="relative flex items-center justify-between px-3 py-[3px] hover:bg-[#0ecb8108] transition-colors">
                  {/* Depth bar — absolute background bên phải */}
                  <div
                    className="absolute top-0 right-0 bottom-0 bg-[#0ecb810d] transition-all duration-150"
                    style={{ width: `${barPct}%` }}
                  />
                  <span className="relative z-10 font-mono text-[#0ecb81] font-medium">
                    {fmtPrice(price)}
                  </span>
                  <span className="relative z-10 text-[#eaecef] font-mono">
                    {fmtQty(qty)}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}