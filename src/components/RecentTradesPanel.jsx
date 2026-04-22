// src/components/RecentTradesPanel.jsx
// v13.1 fix:
//   - Bỏ overflow-y-auto → không scroll, cố định 30 row trong panel
//   - overflow-hidden trên container → row thứ 31+ bị clip, không hiện
//   - Mỗi row height cố định (flex-shrink-0) → 30 row lấp đầy panel đều nhau

import { useRecentTrades } from '../hooks/useRecentTrades'
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
  if (q >= 1e6) return (q / 1e6).toFixed(3) + 'M'
  if (q >= 1e3) return (q / 1e3).toFixed(3) + 'K'
  if (q >= 1) return q.toFixed(4)
  return q.toFixed(6)
}

function fmtTime(ts) {
  if (!ts) return '--:--:--'
  const d = new Date(ts)
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  const s = String(d.getSeconds()).padStart(2, '0')
  return `${h}:${m}:${s}`
}

const MAX_DISPLAY = 30

export default function RecentTradesPanel() {
  const { symbol, market } = useChartStore()
  const trades = useRecentTrades(symbol, market)

  // Chỉ lấy đúng 30 trade đầu (đã sort desc từ hook)
  const display = trades.slice(0, MAX_DISPLAY)

  return (
    <div className="flex flex-col h-full bg-[#0b0e11] text-[11px] select-none">

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#1a1d26] flex-shrink-0">
        <span className="text-[11px] font-semibold text-[#eaecef]">Recent Trades</span>
        <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${market === 'futures' ? 'bg-[#f0b90b22] text-[#f0b90b]' : 'bg-[#0ecb8122] text-[#0ecb81]'
          }`}>
          {display.length > 0 ? `${display.length} trades` : 'Đang kết nối...'}
        </span>
      </div>

      {/* Column headers */}
      <div className="flex items-center px-3 py-1 text-[9px] text-[#5e6673] border-b border-[#1a1d26] flex-shrink-0 font-medium">
        <span className="flex-1">Price (USDT)</span>
        <span className="w-16 text-right">Qty</span>
        <span className="w-14 text-right">Time</span>
      </div>

      {/* Trades list — overflow-hidden, không scroll, 30 row cố định */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {display.length === 0 && (
          <div className="flex items-center justify-center flex-1">
            <span className="text-[#5e6673] text-[10px]">Đang nhận dữ liệu...</span>
          </div>
        )}

        {display.map((trade, i) => {
          const isUp = !trade.isBuyerMaker
          const isNew = i === 0

          return (
            <div
              key={trade.id}
              className={`flex-shrink-0 flex items-center px-3 border-b border-[#1a1d2630] ${isNew ? 'bg-[#1e232918]' : ''
                }`}
              style={{ height: '22px' }}
            >
              {/* Price */}
              <span className={`flex-1 font-mono font-medium text-[10.5px] ${isUp ? 'text-[#0ecb81]' : 'text-[#f6465d]'
                }`}>
                {isUp ? '▲' : '▼'} {fmtPrice(trade.price)}
              </span>

              {/* Qty */}
              <span className="w-16 text-right text-[#848e9c] font-mono text-[10px]">
                {fmtQty(trade.qty)}
              </span>

              {/* Time */}
              <span className="w-14 text-right text-[#5e6673] font-mono text-[10px]">
                {fmtTime(trade.time)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}