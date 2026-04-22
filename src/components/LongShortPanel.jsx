// src/components/LongShortPanel.jsx
// v15: Long/Short Ratio Panel
//
// Layout:
//   Header
//   3 section: Global / Top Traders (Account) / Top Traders (Position)
//   Mỗi section:
//     - Gauge bar (long xanh | short đỏ)
//     - % số liệu + ratio
//     - Mini sparkline 24 điểm (SVG inline)
//   Footer: timestamp cập nhật
//
// Không có WS → poll 30s → hiện "Cập nhật N giây trước"

import { useEffect, useState } from 'react'
import { useLongShortRatio } from '../hooks/useLongShortRatio'
import { useChartStore } from '../store/chartStore'

// ── Sparkline SVG mini ─────────────────────────────────────────────────────
// Vẽ longRatio theo thời gian — xanh khi > 0.5, đỏ khi < 0.5
function Sparkline({ history }) {
    if (!history || history.length < 2) {
        return (
            <div className="h-8 flex items-center justify-center">
                <span className="text-[9px] text-[#5e6673]">Chưa có lịch sử</span>
            </div>
        )
    }

    const W = 200
    const H = 28
    const n = history.length
    const stepX = W / (n - 1)

    // Tính tọa độ y từ longRatio (0→1), scale vào [2, H-2]
    const pts = history.map((d, i) => ({
        x: i * stepX,
        y: H - 2 - (d.longRatio - 0) * (H - 4) / 1,   // longRatio 0..1
        lr: d.longRatio,
    }))

    // Polyline points string
    const linePoints = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

    // Area path (fill phía dưới đường)
    const areaPath =
        `M${pts[0].x.toFixed(1)},${H} ` +
        pts.map(p => `L${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') +
        ` L${pts[n - 1].x.toFixed(1)},${H} Z`

    const lastLR = pts[pts.length - 1]?.lr ?? 0.5
    const isLongDom = lastLR >= 0.5

    return (
        <svg
            width="100%"
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            className="overflow-visible"
        >
            {/* 50% reference line */}
            <line
                x1={0} y1={H / 2} x2={W} y2={H / 2}
                stroke="#2b3139" strokeWidth={0.5} strokeDasharray="3 3"
            />

            {/* Area fill */}
            <path
                d={areaPath}
                fill={isLongDom ? '#0ecb8115' : '#f6465d15'}
            />

            {/* Line */}
            <polyline
                points={linePoints}
                fill="none"
                stroke={isLongDom ? '#0ecb81' : '#f6465d'}
                strokeWidth={1.2}
                strokeLinejoin="round"
                strokeLinecap="round"
            />

            {/* Last point dot */}
            <circle
                cx={pts[n - 1].x} cy={pts[n - 1].y} r={2.5}
                fill={isLongDom ? '#0ecb81' : '#f6465d'}
            />
        </svg>
    )
}

// ── Gauge bar ──────────────────────────────────────────────────────────────
function GaugeBar({ longRatio, shortRatio }) {
    const longPct = ((longRatio ?? 0) * 100).toFixed(1)
    const shortPct = ((shortRatio ?? 0) * 100).toFixed(1)

    return (
        <div className="flex flex-col gap-1">
            {/* Bar */}
            <div className="flex h-3 rounded-full overflow-hidden">
                <div
                    className="bg-[#0ecb81] transition-all duration-500"
                    style={{ width: `${longPct}%` }}
                />
                <div
                    className="bg-[#f6465d] transition-all duration-500 flex-1"
                />
            </div>
            {/* Labels */}
            <div className="flex justify-between text-[10px] font-mono font-medium">
                <span className="text-[#0ecb81]">L {longPct}%</span>
                <span className="text-[#f6465d]">S {shortPct}%</span>
            </div>
        </div>
    )
}

// ── Signal badge ───────────────────────────────────────────────────────────
// Đưa ra nhận xét ngắn dựa vào longRatio
function SignalBadge({ longRatio }) {
    if (longRatio == null) return null
    const lp = longRatio * 100

    let label, color
    if (lp >= 75) {
        label = 'Đám đông quá Long ⚠'
        color = 'text-[#f6465d] bg-[#f6465d12]'
    } else if (lp >= 60) {
        label = 'Nghiêng Long'
        color = 'text-[#f0b90b] bg-[#f0b90b12]'
    } else if (lp <= 25) {
        label = 'Đám đông quá Short ⚠'
        color = 'text-[#0ecb81] bg-[#0ecb8112]'
    } else if (lp <= 40) {
        label = 'Nghiêng Short'
        color = 'text-[#f0b90b] bg-[#f0b90b12]'
    } else {
        label = 'Cân bằng'
        color = 'text-[#848e9c] bg-[#848e9c12]'
    }

    return (
        <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${color}`}>
            {label}
        </span>
    )
}

// ── Section ────────────────────────────────────────────────────────────────
function RatioSection({ title, tooltip, data }) {
    const [open, setOpen] = useState(true)

    if (!data) return (
        <div className="px-3 py-2 border-b border-[#1a1d26]">
            <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] font-semibold text-[#5e6673]">{title}</span>
            </div>
            <span className="text-[9px] text-[#5e6673]">Không có dữ liệu</span>
        </div>
    )

    const ratio = data.longShortRatio?.toFixed(3) ?? '---'

    return (
        <div className="border-b border-[#1a1d26]">
            {/* Section header — click để collapse */}
            <button
                onClick={() => setOpen(v => !v)}
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-[#1e232908] transition-colors"
            >
                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-[#eaecef]">{title}</span>
                    <SignalBadge longRatio={data.longRatio} />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[9px] text-[#5e6673] font-mono">L/S={ratio}</span>
                    <span className={`text-[9px] text-[#5e6673] transition-transform ${open ? '' : 'rotate-180'}`}>▾</span>
                </div>
            </button>

            {open && (
                <div className="px-3 pb-3 space-y-2">
                    <GaugeBar longRatio={data.longRatio} shortRatio={data.shortRatio} />
                    {data.history?.length > 1 && (
                        <div>
                            <span className="text-[9px] text-[#5e6673]">2h gần nhất (5m/điểm)</span>
                            <div className="mt-1">
                                <Sparkline history={data.history} />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// ── Timestamp counter ──────────────────────────────────────────────────────
function UpdatedAgo({ timestamp }) {
    const [text, setText] = useState('')

    useEffect(() => {
        function tick() {
            if (!timestamp) { setText(''); return }
            const sec = Math.floor((Date.now() - timestamp) / 1000)
            if (sec < 60) setText(`Cập nhật ${sec}s trước`)
            else setText(`Cập nhật ${Math.floor(sec / 60)}m trước`)
        }
        tick()
        const id = setInterval(tick, 5000)
        return () => clearInterval(id)
    }, [timestamp])

    return <span className="text-[9px] text-[#5e6673]">{text}</span>
}

// ── Main component ─────────────────────────────────────────────────────────
export default function LongShortPanel() {
    const { symbol, market } = useChartStore()
    const data = useLongShortRatio(symbol, market)

    const base = symbol.replace('USDT', '')

    return (
        <div className="flex flex-col h-full bg-[#0b0e11] text-[11px] select-none overflow-y-auto">

            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-[#1a1d26] flex-shrink-0">
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-[#eaecef]">Long/Short Ratio</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-[#f0b90b22] text-[#f0b90b]">
                        PERP · 5m
                    </span>
                </div>
                {data && <UpdatedAgo timestamp={data.timestamp} />}
            </div>

            {/* Spot message */}
            {market !== 'futures' && (
                <div className="flex-1 flex items-center justify-center px-4">
                    <div className="text-center">
                        <div className="text-[#5e6673] text-[10px] leading-relaxed">
                            Long/Short Ratio chỉ có ở<br />
                            <span className="text-[#f0b90b]">Futures</span> — chuyển sang Futures để xem
                        </div>
                    </div>
                </div>
            )}

            {/* Loading */}
            {market === 'futures' && !data && (
                <div className="flex-1 flex items-center justify-center">
                    <span className="text-[#5e6673] text-[10px]">Đang tải...</span>
                </div>
            )}

            {/* Content */}
            {market === 'futures' && data && (
                <>
                    {/* Symbol label */}
                    <div className="px-3 py-1.5 bg-[#1a1d26] border-b border-[#2b3139]">
                        <span className="text-[9px] text-[#5e6673]">
                            {base}/USDT · cập nhật mỗi 30 giây
                        </span>
                    </div>

                    {/* 3 sections */}
                    <RatioSection
                        title="Toàn thị trường"
                        data={data.global}
                    />
                    <RatioSection
                        title="Top Traders (Account)"
                        data={data.topAcct}
                    />
                    <RatioSection
                        title="Top Traders (Position)"
                        data={data.topPos}
                    />

                    {/* Explanation */}
                    <div className="px-3 py-3 space-y-1.5">
                        <p className="text-[9px] text-[#5e6673] leading-relaxed">
                            <span className="text-[#eaecef]">Đám đông quá Long (≥75%)</span> thường báo hiệu đảo chiều xuống — short squeeze khó xảy ra.
                        </p>
                        <p className="text-[9px] text-[#5e6673] leading-relaxed">
                            <span className="text-[#eaecef]">Top Traders (Position)</span> là đáng tin nhất — họ có vốn lớn và thường đúng hơn đám đông.
                        </p>
                    </div>
                </>
            )}
        </div>
    )
}