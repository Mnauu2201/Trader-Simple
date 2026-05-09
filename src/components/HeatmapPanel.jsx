// src/components/HeatmapPanel.jsx — v31: Heatmap Sidebar
// Hiển thị top coins dưới dạng ô vuông màu theo %change24h, size theo volume
// Pattern: cancelledRef tránh setState sau unmount (không dùng ở đây vì chỉ đọc store)
// Pattern: dùng useMarketStore + useChartStore trực tiếp — không cần props

import { useMemo, useState } from 'react'
import { useMarketStore } from '../store/marketStore'
import { useChartStore } from '../store/chartStore'

// ── Số coin hiển thị ─────────────────────────────────────────────────────────
const TOP_N = 50

// ── Màu theo %change24h ───────────────────────────────────────────────────────
// Dải: <= -5% đỏ đậm, 0% xám, >= +5% xanh đậm
function changeToColor(pct) {
    if (pct == null || isNaN(pct)) return { bg: '#1a2030', text: '#566475' }

    const clamped = Math.max(-8, Math.min(8, pct))

    if (clamped >= 0) {
        // 0 → +8%: từ #1a2f23 → #0ecb81
        const t = clamped / 8
        const r = Math.round(26 + (14 - 26) * t)
        const g = Math.round(47 + (203 - 47) * t)
        const b = Math.round(35 + (129 - 35) * t)
        const alpha = 0.15 + t * 0.75
        return {
            bg: `rgba(${r},${g},${b},${alpha})`,
            border: `rgba(${r},${g},${b},${Math.min(1, alpha + 0.2)})`,
            text: t > 0.3 ? '#0ecb81' : '#5a8a6a',
        }
    } else {
        // 0 → -8%: từ #2f1a1e → #f6465d
        const t = (-clamped) / 8
        const r = Math.round(47 + (246 - 47) * t)
        const g = Math.round(26 + (70 - 26) * t)
        const b = Math.round(30 + (93 - 30) * t)
        const alpha = 0.15 + t * 0.75
        return {
            bg: `rgba(${r},${g},${b},${alpha})`,
            border: `rgba(${r},${g},${b},${Math.min(1, alpha + 0.2)})`,
            text: t > 0.3 ? '#f6465d' : '#8a5a60',
        }
    }
}

// ── Format helpers ────────────────────────────────────────────────────────────
function fmtChange(pct) {
    if (pct == null || isNaN(pct)) return '---'
    return (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%'
}

function fmtVol(n) {
    if (!n || isNaN(n)) return ''
    if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B'
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
    return n.toFixed(0)
}

function fmtPrice(p) {
    if (p == null || isNaN(p)) return '---'
    if (p >= 10000) return p.toLocaleString('en-US', { maximumFractionDigits: 0 })
    if (p >= 1000) return p.toLocaleString('en-US', { maximumFractionDigits: 1 })
    if (p >= 1) return p.toFixed(3)
    if (p >= 0.001) return p.toFixed(5)
    return p.toFixed(7)
}

// ── SIZE MODES ────────────────────────────────────────────────────────────────
const SIZE_MODES = [
    { id: 'equal', label: 'Đều' },
    { id: 'vol', label: 'Vol' },
]

// ── Tooltip nổi ───────────────────────────────────────────────────────────────
function Tooltip({ coin, prices, onClose, onSelect }) {
    if (!coin) return null
    const d = prices[coin] || {}
    const { bg, text } = changeToColor(d.change24h)
    const baseName = coin.replace('USDT', '')

    return (
        <div
            className="absolute inset-x-2 bottom-2 z-50 rounded-lg p-3 flex flex-col gap-1.5"
            style={{
                background: '#0d1117',
                border: `1px solid ${text}44`,
                boxShadow: `0 4px 20px rgba(0,0,0,0.6), 0 0 0 1px ${text}22`,
            }}
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold" style={{ color: '#e6edf3' }}>{baseName}</span>
                    <span className="text-[9px]" style={{ color: '#566475' }}>/USDT</span>
                </div>
                <button
                    onClick={onClose}
                    className="w-5 h-5 flex items-center justify-center rounded text-[10px]"
                    style={{ color: '#566475', background: '#161b22' }}
                >✕</button>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-1.5">
                <div className="flex flex-col">
                    <span className="text-[8px] uppercase font-semibold" style={{ color: '#3a4555' }}>Giá</span>
                    <span className="text-[11px] font-bold tabular-nums" style={{ color: '#c9d1d9' }}>{fmtPrice(d.price)}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[8px] uppercase font-semibold" style={{ color: '#3a4555' }}>24h</span>
                    <span className="text-[11px] font-bold tabular-nums" style={{ color: text }}>{fmtChange(d.change24h)}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[8px] uppercase font-semibold" style={{ color: '#3a4555' }}>Vol 24h</span>
                    <span className="text-[10px] font-semibold tabular-nums" style={{ color: '#848e9c' }}>{fmtVol(d.quoteVolume)}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[8px] uppercase font-semibold" style={{ color: '#3a4555' }}>High/Low</span>
                    <span className="text-[9px] font-semibold tabular-nums" style={{ color: '#566475' }}>
                        {fmtPrice(d.high24h)} / {fmtPrice(d.low24h)}
                    </span>
                </div>
            </div>

            {/* Action button */}
            <button
                onClick={() => { onSelect(coin); onClose() }}
                className="w-full py-1.5 rounded text-[10px] font-bold transition-all mt-0.5"
                style={{
                    background: `${text}22`,
                    color: text,
                    border: `0.5px solid ${text}44`,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = `${text}33` }}
                onMouseLeave={e => { e.currentTarget.style.background = `${text}22` }}
            >
                Xem chart →
            </button>
        </div>
    )
}

// ── HeatmapCell ───────────────────────────────────────────────────────────────
function HeatmapCell({ symbol, data, isSelected, sizeMode, maxVol, flex, onClick, onHover, isHovered }) {
    const baseName = symbol.replace('USDT', '')
    const pct = data?.change24h
    const { bg, border, text } = changeToColor(pct)
    const volRatio = maxVol > 0 ? (data?.quoteVolume ?? 0) / maxVol : 0

    // Với size=vol: flex dựa vào sqrt(volRatio) để tránh coin lớn chiếm quá nhiều
    const flexVal = sizeMode === 'vol'
        ? Math.max(0.4, Math.sqrt(volRatio) * 3)
        : 1

    return (
        <div
            onClick={onClick}
            onMouseEnter={onHover}
            className="relative flex flex-col items-center justify-center cursor-pointer rounded transition-all duration-150 overflow-hidden select-none"
            style={{
                flex: flexVal,
                minWidth: 36,
                minHeight: 36,
                background: isHovered ? `${bg.replace('rgba', 'rgba').replace(/[\d.]+\)$/, v => String(Math.min(1, parseFloat(v) + 0.15)) + ')')}` : bg,
                border: isSelected
                    ? '1.5px solid #f0b90b'
                    : isHovered
                        ? `1px solid ${border ?? text}88`
                        : `0.5px solid ${border ?? text}33`,
                boxShadow: isSelected ? '0 0 0 1px #f0b90b44' : isHovered ? `0 2px 8px rgba(0,0,0,0.4)` : 'none',
                transform: isHovered ? 'scale(1.03)' : 'scale(1)',
                zIndex: isHovered ? 2 : 1,
            }}
        >
            {/* Coin name */}
            <span
                className="font-bold leading-tight text-center px-0.5 truncate w-full text-center"
                style={{
                    fontSize: flexVal > 1.5 ? 11 : flexVal > 0.8 ? 9 : 8,
                    color: '#e6edf3',
                    textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                }}
            >
                {baseName}
            </span>

            {/* % change */}
            <span
                className="font-semibold tabular-nums leading-tight text-center"
                style={{
                    fontSize: flexVal > 1.5 ? 10 : flexVal > 0.8 ? 8 : 7,
                    color: text,
                    textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                }}
            >
                {fmtChange(pct)}
            </span>

            {/* Selected indicator */}
            {isSelected && (
                <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full" style={{ background: '#f0b90b' }} />
            )}
        </div>
    )
}

// ── Main HeatmapPanel ─────────────────────────────────────────────────────────
export default function HeatmapPanel() {
    const prices = useMarketStore(s => s.prices)
    const { symbol: selectedSymbol, setSymbol } = useChartStore()

    const [sizeMode, setSizeMode] = useState('vol')
    const [topN, setTopN] = useState(TOP_N)
    const [hoveredSymbol, setHoveredSymbol] = useState(null)
    const [tooltipSymbol, setTooltipSymbol] = useState(null)

    // Lấy top N coin theo volume, đã có data
    const coins = useMemo(() => {
        return Object.entries(prices)
            .filter(([sym, d]) => sym.endsWith('USDT') && d?.price != null && isFinite(d.change24h))
            .sort(([, a], [, b]) => (b.quoteVolume ?? 0) - (a.quoteVolume ?? 0))
            .slice(0, topN)
    }, [prices, topN])

    const maxVol = useMemo(() =>
        Math.max(...coins.map(([, d]) => d.quoteVolume ?? 0), 1),
        [coins]
    )

    // Stats tổng quan
    const stats = useMemo(() => {
        if (!coins.length) return null
        const changes = coins.map(([, d]) => d.change24h).filter(isFinite)
        const gainers = changes.filter(c => c > 0).length
        const losers = changes.filter(c => c < 0).length
        const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length
        return { gainers, losers, avgChange, total: changes.length }
    }, [coins])

    return (
        <div className="flex flex-col h-full" style={{ background: '#0b0e11' }}>

            {/* ── Header ── */}
            <div className="flex items-center justify-between px-3 py-2 flex-shrink-0"
                style={{ borderBottom: '0.5px solid #161b22', background: '#0d1117' }}>
                <div className="flex items-center gap-1.5">
                    {/* Heatmap icon */}
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                        <rect x="2" y="2" width="9" height="9" rx="1" fill="#0ecb81" opacity="0.7" />
                        <rect x="13" y="2" width="9" height="9" rx="1" fill="#f6465d" opacity="0.5" />
                        <rect x="2" y="13" width="4" height="9" rx="1" fill="#f0b90b" opacity="0.6" />
                        <rect x="8" y="13" width="14" height="9" rx="1" fill="#0ecb81" opacity="0.3" />
                    </svg>
                    <span className="text-[11px] font-bold" style={{ color: '#e6edf3' }}>Heatmap</span>
                </div>

                {/* Top N selector */}
                <select
                    value={topN}
                    onChange={e => setTopN(Number(e.target.value))}
                    className="text-[9px] px-1.5 py-0.5 rounded"
                    style={{
                        background: '#161b22',
                        color: '#566475',
                        border: '0.5px solid #2a3040',
                        outline: 'none',
                    }}
                >
                    {[20, 30, 50, 80, 100].map(n => (
                        <option key={n} value={n}>Top {n}</option>
                    ))}
                </select>
            </div>

            {/* ── Market summary bar ── */}
            {stats && (
                <div className="flex items-center gap-0 flex-shrink-0 px-3 py-1.5"
                    style={{ borderBottom: '0.5px solid #161b22', background: '#0d1117' }}>
                    <div className="flex items-center gap-1 flex-1">
                        <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: '#0ecb81', opacity: 0.8 }} />
                        <span className="text-[9px] font-semibold" style={{ color: '#0ecb81' }}>{stats.gainers}</span>
                        <span className="text-[8px]" style={{ color: '#3a4555' }}>tăng</span>
                    </div>
                    <div className="flex items-center gap-1 flex-1 justify-center">
                        <span className="text-[8px] font-semibold tabular-nums"
                            style={{ color: stats.avgChange >= 0 ? '#0ecb81' : '#f6465d' }}>
                            avg {fmtChange(stats.avgChange)}
                        </span>
                    </div>
                    <div className="flex items-center gap-1 flex-1 justify-end">
                        <span className="text-[9px] font-semibold" style={{ color: '#f6465d' }}>{stats.losers}</span>
                        <span className="text-[8px]" style={{ color: '#3a4555' }}>giảm</span>
                        <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: '#f6465d', opacity: 0.8 }} />
                    </div>
                </div>
            )}

            {/* ── Size mode toggle ── */}
            <div className="flex flex-shrink-0 px-3 py-1.5 items-center gap-2"
                style={{ borderBottom: '0.5px solid #161b22' }}>
                <span className="text-[8px] uppercase font-semibold" style={{ color: '#3a4555' }}>Kích thước:</span>
                <div className="flex rounded overflow-hidden" style={{ border: '0.5px solid #2a3040' }}>
                    {SIZE_MODES.map(m => (
                        <button
                            key={m.id}
                            onClick={() => setSizeMode(m.id)}
                            className="px-2 py-0.5 text-[9px] font-semibold transition-colors"
                            style={{
                                background: sizeMode === m.id ? '#f0b90b22' : 'transparent',
                                color: sizeMode === m.id ? '#f0b90b' : '#566475',
                            }}
                        >
                            {m.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Gradient legend ── */}
            <div className="flex items-center gap-1.5 px-3 py-1 flex-shrink-0"
                style={{ borderBottom: '0.5px solid #161b22' }}>
                <span className="text-[8px] tabular-nums" style={{ color: '#f6465d' }}>-5%</span>
                <div className="flex-1 h-1.5 rounded-full" style={{
                    background: 'linear-gradient(to right, #f6465d88, #2a303888, #0ecb8188)'
                }} />
                <span className="text-[8px] tabular-nums" style={{ color: '#0ecb81' }}>+5%</span>
            </div>

            {/* ── Heatmap grid ── */}
            <div
                className="flex-1 overflow-y-auto p-1.5 relative"
                style={{ scrollbarWidth: 'thin', scrollbarColor: '#2a3040 transparent' }}
                onMouseLeave={() => setHoveredSymbol(null)}
            >
                {coins.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <span className="text-[11px]" style={{ color: '#3a4555' }}>Đang tải dữ liệu...</span>
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-1" style={{ alignContent: 'flex-start' }}>
                        {coins.map(([sym, d]) => (
                            <HeatmapCell
                                key={sym}
                                symbol={sym}
                                data={d}
                                isSelected={selectedSymbol === sym}
                                isHovered={hoveredSymbol === sym}
                                sizeMode={sizeMode}
                                maxVol={maxVol}
                                onClick={() => {
                                    if (tooltipSymbol === sym) {
                                        setTooltipSymbol(null)
                                    } else {
                                        setTooltipSymbol(sym)
                                    }
                                }}
                                onHover={() => setHoveredSymbol(sym)}
                            />
                        ))}
                    </div>
                )}

                {/* Tooltip nổi */}
                {tooltipSymbol && (
                    <Tooltip
                        coin={tooltipSymbol}
                        prices={prices}
                        onClose={() => setTooltipSymbol(null)}
                        onSelect={(sym) => { setSymbol(sym); setTooltipSymbol(null) }}
                    />
                )}
            </div>

            {/* ── Footer hint ── */}
            <div className="flex-shrink-0 px-3 py-1.5 flex items-center justify-center gap-1"
                style={{ borderTop: '0.5px solid #161b22' }}>
                <span className="text-[8px]" style={{ color: '#3a4555' }}>Click ô → xem chi tiết • Click "Xem chart" → mở chart</span>
            </div>
        </div>
    )
}