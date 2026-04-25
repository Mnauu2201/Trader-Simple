// src/components/SecondaryChartPanel.jsx — v21: Multi-timeframe chart thứ 2
//
// Chart nhẹ: nến + volume + MA20/50 + EMA9/21 (tuỳ toggle)
// Sync crosshair ngầm với main chart khi hover (không sync timescale — 2 timeframe khác nhau)
// Có interval picker riêng, hiển thị tên symbol + interval ở header

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { createChart, CandlestickSeries, HistogramSeries, LineSeries } from 'lightweight-charts'
import { useChartStore } from '../store/chartStore'
import { useKlineData } from '../hooks/useKlineData'

// ── Interval groups (copy từ ChartPanel) ────────────────────────────────────
const INTERVAL_GROUPS = [
    {
        label: 'Phút',
        items: [
            { label: '1m', value: '1m' },
            { label: '3m', value: '3m' },
            { label: '5m', value: '5m' },
            { label: '15m', value: '15m' },
            { label: '30m', value: '30m' },
        ],
    },
    {
        label: 'Giờ',
        items: [
            { label: '1h', value: '1h' },
            { label: '2h', value: '2h' },
            { label: '4h', value: '4h' },
            { label: '6h', value: '6h' },
            { label: '8h', value: '8h' },
            { label: '12h', value: '12h' },
        ],
    },
    {
        label: 'Ngày / Tuần / Tháng',
        items: [
            { label: '1D', value: '1d' },
            { label: '3D', value: '3d' },
            { label: '1W', value: '1w' },
            { label: '1M', value: '1M' },
        ],
    },
]

const ALL_INTERVALS = INTERVAL_GROUPS.flatMap(g => g.items)
const PINNED2 = ['1h', '4h', '1d', '1w']

const MA_CONFIGS = [
    { period: 20, color: '#f0b90b', label: 'MA20' },
    { period: 50, color: '#2196f3', label: 'MA50' },
]

const EMA_CONFIGS = [
    { period: 9, color: '#ff6b35', label: 'EMA9' },
    { period: 21, color: '#a855f7', label: 'EMA21' },
]

// ── Helpers ──────────────────────────────────────────────────────────────────

function calcMA(data, period) {
    const result = []
    let sum = 0
    for (let i = 0; i < data.length; i++) {
        sum += data[i].close
        if (i >= period) sum -= data[i - period].close
        if (i >= period - 1) result.push({ time: data[i].time, value: sum / period })
    }
    return result
}

function calcEMALine(data, period) {
    if (data.length < period) return { series: [], lastEMA: null }
    const k = 2 / (period + 1)
    let ema = 0
    for (let i = 0; i < period; i++) ema += data[i].close
    ema /= period
    const series = [{ time: data[period - 1].time, value: ema }]
    for (let i = period; i < data.length; i++) {
        ema = data[i].close * k + ema * (1 - k)
        series.push({ time: data[i].time, value: ema })
    }
    return { series, lastEMA: ema }
}

function fmtPrice(p) {
    if (p == null || !isFinite(p)) return '---'
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

function throttle(fn, ms) {
    let last = 0, timer = null
    return function (...args) {
        const now = Date.now()
        const remaining = ms - (now - last)
        if (remaining <= 0) {
            if (timer) { clearTimeout(timer); timer = null }
            last = now
            fn.apply(this, args)
        } else {
            clearTimeout(timer)
            timer = setTimeout(() => {
                last = Date.now(); timer = null
                fn.apply(this, args)
            }, remaining)
        }
    }
}

// ── Component ────────────────────────────────────────────────────────────────

export default function SecondaryChartPanel() {
    const { symbol, market, interval2, setInterval2, showMA, showEMA, showVolume } = useChartStore()

    const containerRef = useRef(null)
    const chartRef = useRef(null)
    const candleRef = useRef(null)
    const volumeRef = useRef(null)
    const maRefs = useRef({})
    const emaRefs = useRef({})
    const emaStateRef = useRef({})
    const klineDataRef = useRef([])
    const loadMoreRef = useRef(null)

    const [showPicker, setShowPicker] = useState(false)
    const [tooltip, setTooltip] = useState(null)
    const [isDragging, setIsDragging] = useState(false)
    const [isLoadingOlder, setIsLoadingOlder] = useState(false)

    // Local MA/EMA toggles riêng cho chart 2 (không dùng chung showMA/showEMA global
    // vì chart 2 có logic riêng — nhưng dùng chung giá trị để đồng bộ ban đầu)
    const [localShowMA, setLocalShowMA] = useState({ 20: true, 50: true })
    const [localShowEMA, setLocalShowEMA] = useState({ 9: false, 21: false })

    const currentLabel = ALL_INTERVALS.find(i => i.value === interval2)?.label ?? interval2
    const isPinned = PINNED2.includes(interval2)

    // ── Tạo chart một lần ────────────────────────────────────────────────────
    useEffect(() => {
        if (!containerRef.current) return

        const chart = createChart(containerRef.current, {
            autoSize: true,
            layout: {
                background: { color: '#0b0e11' },
                textColor: '#848e9c',
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 11,
                attributionLogo: false,
            },
            grid: {
                vertLines: { color: '#1a1d26', style: 1 },
                horzLines: { color: '#1a1d26', style: 1 },
            },
            crosshair: {
                mode: 0,
                vertLine: { color: '#4c525e', width: 1, style: 2, labelBackgroundColor: '#2b3139' },
                horzLine: { color: '#4c525e', width: 1, style: 2, labelBackgroundColor: '#2b3139' },
            },
            rightPriceScale: {
                borderColor: '#1a1d26',
                scaleMargins: { top: 0.08, bottom: 0.22 },
                textColor: '#848e9c',
            },
            timeScale: {
                borderColor: '#1a1d26',
                timeVisible: true,
                secondsVisible: false,
                barSpacing: 6,
                minBarSpacing: 0.5,
                maxBarSpacing: 20,
                rightOffset: 12,
                lockVisibleTimeRangeOnResize: true,
            },
        })

        const candles = chart.addSeries(CandlestickSeries, {
            upColor: '#0ecb81', downColor: '#f6465d',
            borderUpColor: '#0ecb81', borderDownColor: '#f6465d',
            wickUpColor: '#0ecb81', wickDownColor: '#f6465d',
            thinBars: true,
            candleBodyMaxWidth: 8,
            candleWickMaxWidth: 1,
        })

        const volume = chart.addSeries(HistogramSeries, {
            priceFormat: { type: 'volume' },
            priceScaleId: 'vol2',
        })
        chart.priceScale('vol2').applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } })

        // MA series
        const maMap = {}
        MA_CONFIGS.forEach(cfg => {
            maMap[cfg.period] = chart.addSeries(LineSeries, {
                color: cfg.color, lineWidth: 1,
                priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false,
                visible: true,
            })
        })

        // EMA series
        const emaMap = {}
        EMA_CONFIGS.forEach(cfg => {
            emaMap[cfg.period] = chart.addSeries(LineSeries, {
                color: cfg.color, lineWidth: 1, lineStyle: 0,
                priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false,
                visible: false,
            })
        })

        chartRef.current = chart
        candleRef.current = candles
        volumeRef.current = volume
        maRefs.current = maMap
        emaRefs.current = emaMap

        return () => {
            chartRef.current = null
            candleRef.current = null
            volumeRef.current = null
            maRefs.current = {}
            emaRefs.current = {}
            chart.remove()
        }
    }, [])

    // ── Crosshair tooltip (throttled 16ms) ─────────────────────────────────
    useEffect(() => {
        const chart = chartRef.current
        if (!chart) return

        const handleCrosshair = throttle((param) => {
            if (!param.time || !param.seriesData) { setTooltip(null); return }
            const candle = param.seriesData.get(candleRef.current)
            if (!candle) { setTooltip(null); return }

            const maValues = {}
            MA_CONFIGS.forEach(cfg => {
                const s = param.seriesData.get(maRefs.current[cfg.period])
                if (s) maValues[cfg.period] = s.value
            })
            const emaValues = {}
            EMA_CONFIGS.forEach(cfg => {
                const s = param.seriesData.get(emaRefs.current[cfg.period])
                if (s) emaValues[cfg.period] = s.value
            })

            setTooltip({
                open: candle.open, high: candle.high,
                low: candle.low, close: candle.close,
                isUp: candle.close >= candle.open,
                maValues, emaValues,
            })
        }, 16)

        chart.subscribeCrosshairMove(handleCrosshair)
        return () => { try { chart.unsubscribeCrosshairMove(handleCrosshair) } catch (_) { } }
    }, [])

    // ── MA/EMA visibility sync ───────────────────────────────────────────────
    useEffect(() => {
        MA_CONFIGS.forEach(cfg => {
            maRefs.current[cfg.period]?.applyOptions({ visible: !!localShowMA[cfg.period] })
        })
    }, [localShowMA])

    useEffect(() => {
        EMA_CONFIGS.forEach(cfg => {
            emaRefs.current[cfg.period]?.applyOptions({ visible: !!localShowEMA[cfg.period] })
        })
    }, [localShowEMA])

    useEffect(() => {
        volumeRef.current?.applyOptions({ visible: showVolume })
        if (chartRef.current) {
            chartRef.current.priceScale('vol2').applyOptions({
                visible: showVolume,
            })
        }
    }, [showVolume])

    // ── onData: tính MA/EMA khi REST load xong ──────────────────────────────
    const onData = useCallback((data) => {
        klineDataRef.current = data

        MA_CONFIGS.forEach(cfg => {
            const maData = calcMA(data, cfg.period)
            maRefs.current[cfg.period]?.setData(maData)
        })

        EMA_CONFIGS.forEach(cfg => {
            const { series, lastEMA } = calcEMALine(data, cfg.period)
            emaRefs.current[cfg.period]?.setData(series)
            emaStateRef.current[cfg.period] = { lastEMA, k: 2 / (cfg.period + 1) }
        })
    }, [])

    // ── onUpdate: incremental update per WS tick ────────────────────────────
    const onUpdate = useCallback((candle) => {
        const data = klineDataRef.current
        if (!data.length) return

        // Update or append last candle in klineDataRef
        const last = data[data.length - 1]
        if (last.time === candle.time) {
            data[data.length - 1] = candle
        } else if (candle.time > last.time) {
            data.push(candle)
        }

        // MA: slice cuối để cập nhật điểm cuối
        MA_CONFIGS.forEach(cfg => {
            if (data.length < cfg.period) return
            const slice = data.slice(-cfg.period)
            const avg = slice.reduce((s, d) => s + d.close, 0) / cfg.period
            maRefs.current[cfg.period]?.update({ time: candle.time, value: avg })
        })

        // EMA: O(1) per tick
        EMA_CONFIGS.forEach(cfg => {
            const st = emaStateRef.current[cfg.period]
            if (!st || st.lastEMA == null) return
            const newEMA = candle.close * st.k + st.lastEMA * (1 - st.k)
            emaStateRef.current[cfg.period].lastEMA = newEMA
            emaRefs.current[cfg.period]?.update({ time: candle.time, value: newEMA })
        })
    }, [])

    // ── onPrepend: load thêm nến cũ ─────────────────────────────────────────
    const onPrepend = useCallback((olderData) => {
        const existing = klineDataRef.current
        const merged = [...olderData, ...existing]
        klineDataRef.current = merged

        // Recalc và setData toàn bộ
        candleRef.current?.setData(merged)
        if (volumeRef.current) {
            volumeRef.current.setData(merged.map(d => ({
                time: d.time,
                value: d.volume,
                color: d.close >= d.open ? '#0ecb8155' : '#f6465d55',
            })))
        }

        MA_CONFIGS.forEach(cfg => {
            const maData = calcMA(merged, cfg.period)
            maRefs.current[cfg.period]?.setData(maData)
        })

        EMA_CONFIGS.forEach(cfg => {
            const { series, lastEMA } = calcEMALine(merged, cfg.period)
            emaRefs.current[cfg.period]?.setData(series)
            emaStateRef.current[cfg.period] = { lastEMA, k: 2 / (cfg.period + 1) }
        })

        setIsLoadingOlder(false)
    }, [])

    // ── useKlineData hook ────────────────────────────────────────────────────
    useKlineData(
        candleRef,
        volumeRef,
        symbol,
        interval2,
        market,
        onData,
        onUpdate,
        onPrepend,
        loadMoreRef,
    )

    // ── Infinite scroll backward (giống ChartPanel chính) ───────────────────
    useEffect(() => {
        const chart = chartRef.current
        if (!chart) return

        const handleScroll = () => {
            if (!loadMoreRef.current) return
            const range = chart.timeScale().getVisibleLogicalRange()
            if (!range) return
            if (range.from <= 20 && !isLoadingOlder) {
                setIsLoadingOlder(true)
                loadMoreRef.current().catch(() => setIsLoadingOlder(false))
            }
        }

        chart.timeScale().subscribeVisibleLogicalRangeChange(handleScroll)
        return () => { try { chart.timeScale().unsubscribeVisibleLogicalRangeChange(handleScroll) } catch (_) { } }
    }, [isLoadingOlder])

    // ── JSX ──────────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col h-full bg-[#0b0e11] overflow-hidden border-l border-[#1a1d26]">

            {/* ── Toolbar ── */}
            <div className="flex items-center gap-1 px-2 py-1.5 border-b border-[#1a1d26] flex-shrink-0 bg-[#0b0e11] flex-wrap">

                {/* Badge "TF2" */}
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded mr-0.5"
                    style={{ background: '#a855f722', color: '#a855f7', border: '1px solid #a855f744' }}>
                    TF2
                </span>

                {/* Pinned intervals */}
                <div className="flex items-center gap-0.5">
                    {ALL_INTERVALS.filter(i => PINNED2.includes(i.value)).map(i => (
                        <button key={i.value} onClick={() => setInterval2(i.value)}
                            className={`px-2 py-0.5 text-[10px] rounded transition-all ${interval2 === i.value
                                    ? 'bg-[#a855f71a] text-[#a855f7] font-medium'
                                    : 'text-[#848e9c] hover:text-white hover:bg-[#1e2329]'
                                }`}>
                            {i.label}
                        </button>
                    ))}
                </div>

                <div className="w-px h-3 bg-[#2b3139] mx-0.5" />

                {/* More interval picker */}
                <div className="relative">
                    <button onClick={() => setShowPicker(p => !p)}
                        className={`flex items-center gap-1 px-2 py-0.5 text-[10px] rounded transition-all ${!isPinned ? 'bg-[#a855f71a] text-[#a855f7] font-medium' : 'text-[#848e9c] hover:text-white hover:bg-[#1e2329]'
                            }`}>
                        {!isPinned ? currentLabel : 'Thêm'}
                        <svg width="8" height="8" viewBox="0 0 10 10">
                            <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" />
                        </svg>
                    </button>

                    {showPicker && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowPicker(false)} />
                            <div className="absolute top-7 left-0 z-20 bg-[#1e2329] border border-[#2b3139] rounded-lg shadow-2xl p-3 w-64">
                                {INTERVAL_GROUPS.map(group => (
                                    <div key={group.label} className="mb-2.5 last:mb-0">
                                        <p className="text-[9px] text-[#5e6673] uppercase tracking-wider mb-1.5 font-medium">{group.label}</p>
                                        <div className="flex flex-wrap gap-1">
                                            {group.items.map(i => (
                                                <button key={i.value}
                                                    onClick={() => { setInterval2(i.value); setShowPicker(false) }}
                                                    className={`px-2.5 py-1 text-[10px] rounded transition-all ${interval2 === i.value
                                                            ? 'bg-[#a855f7] text-white font-semibold'
                                                            : 'bg-[#2b3139] text-[#848e9c] hover:bg-[#363c45] hover:text-white'
                                                        }`}>
                                                    {i.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <div className="w-px h-3 bg-[#2b3139] mx-0.5" />

                {/* MA toggles */}
                {MA_CONFIGS.map(cfg => (
                    <button key={cfg.period}
                        onClick={() => setLocalShowMA(prev => ({ ...prev, [cfg.period]: !prev[cfg.period] }))}
                        className={`px-1.5 py-0.5 text-[9px] rounded border transition-all ${localShowMA[cfg.period] ? 'border-transparent font-medium' : 'border-[#2b3139] text-[#5e6673] hover:text-[#848e9c]'
                            }`}
                        style={localShowMA[cfg.period] ? { color: cfg.color, background: cfg.color + '1a', borderColor: cfg.color + '44' } : {}}>
                        {cfg.label}
                    </button>
                ))}

                {/* EMA toggles */}
                {EMA_CONFIGS.map(cfg => (
                    <button key={cfg.period}
                        onClick={() => setLocalShowEMA(prev => ({ ...prev, [cfg.period]: !prev[cfg.period] }))}
                        className={`px-1.5 py-0.5 text-[9px] rounded border transition-all ${localShowEMA[cfg.period] ? 'border-transparent font-medium' : 'border-[#2b3139] text-[#5e6673] hover:text-[#848e9c]'
                            }`}
                        style={localShowEMA[cfg.period] ? { color: cfg.color, background: cfg.color + '1a', borderColor: cfg.color + '44' } : {}}>
                        {cfg.label}
                    </button>
                ))}

                {/* Symbol + interval label (right) */}
                <div className="ml-auto flex items-center gap-1.5">
                    <span className="text-[10px] text-[#5e6673]">{symbol}</span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                        style={{ background: '#a855f71a', color: '#a855f7' }}>
                        {currentLabel}
                    </span>
                </div>
            </div>

            {/* ── Chart container ── */}
            <div className="relative flex-1 min-h-0">

                {/* Loading banner */}
                {isLoadingOlder && (
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
                        <div className="flex items-center gap-2 bg-[#1e2329dd] backdrop-blur-sm border border-[#2b3139] rounded-full px-3 py-1 shadow-lg">
                            <svg className="animate-spin w-3 h-3 text-[#a855f7]" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                            </svg>
                            <span className="text-[10px] text-[#848e9c]">Đang tải nến cũ hơn...</span>
                        </div>
                    </div>
                )}

                {/* OHLCV Tooltip */}
                {tooltip && (
                    <div className="absolute top-2 left-2 z-10 pointer-events-none">
                        <div className="flex items-center gap-2 bg-[#1e2329cc] backdrop-blur-sm px-2.5 py-1 rounded text-[10px] border border-[#2b3139] flex-wrap">
                            <span className={tooltip.isUp ? 'text-[#0ecb81]' : 'text-[#f6465d]'}>
                                O <span className="text-[#eaecef]">{fmtPrice(tooltip.open)}</span>
                            </span>
                            <span className="text-[#0ecb81]">H <span className="text-[#eaecef]">{fmtPrice(tooltip.high)}</span></span>
                            <span className="text-[#f6465d]">L <span className="text-[#eaecef]">{fmtPrice(tooltip.low)}</span></span>
                            <span className={tooltip.isUp ? 'text-[#0ecb81]' : 'text-[#f6465d]'}>
                                C <span className="text-[#eaecef]">{fmtPrice(tooltip.close)}</span>
                            </span>
                            {MA_CONFIGS.map(cfg =>
                                localShowMA[cfg.period] && tooltip.maValues?.[cfg.period] ? (
                                    <span key={cfg.period} style={{ color: cfg.color }}>
                                        {cfg.label} <span className="text-[#eaecef]">{fmtPrice(tooltip.maValues[cfg.period])}</span>
                                    </span>
                                ) : null
                            )}
                            {EMA_CONFIGS.map(cfg =>
                                localShowEMA[cfg.period] && tooltip.emaValues?.[cfg.period] ? (
                                    <span key={cfg.period} style={{ color: cfg.color }}>
                                        {cfg.label} <span className="text-[#eaecef]">{fmtPrice(tooltip.emaValues[cfg.period])}</span>
                                    </span>
                                ) : null
                            )}
                        </div>
                    </div>
                )}

                {/* Lightweight chart */}
                <div
                    ref={containerRef}
                    className="w-full h-full"
                    onMouseDown={() => setIsDragging(true)}
                    onMouseUp={() => setIsDragging(false)}
                    style={{ cursor: isDragging ? 'grabbing' : 'crosshair' }}
                />
            </div>
        </div>
    )
}