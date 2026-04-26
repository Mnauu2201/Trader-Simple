import React, { useEffect, useRef, useState, useCallback } from 'react'
import { createChart, CandlestickSeries, HistogramSeries, LineSeries, AreaSeries } from 'lightweight-charts'
import { useChartStore } from '../store/chartStore'
import { useKlineData } from '../hooks/useKlineData'
import DrawingToolbar from './DrawingToolbar'
import { useDrawingTools } from '../hooks/useDrawingTools'
import { useOIHistory } from '../hooks/useOIHistory'
import { useTakerVolume } from '../hooks/useTakerVolume'
import { useLiquidations } from '../hooks/useLiquidations'
import { useFundingRateHistory } from '../hooks/useFundingRateHistory'

// ── Interval groups ──────────────────────────────────────────────────────────
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
const PINNED = ['15m', '1h', '4h', '1d', '1w']

const MA_CONFIGS = [
  { period: 20, color: '#f0b90b', label: 'MA20' },
  { period: 50, color: '#2196f3', label: 'MA50' },
  { period: 200, color: '#e91e63', label: 'MA200' },
]

const EMA_CONFIGS = [
  { period: 9, color: '#ff6b35', label: 'EMA9' },
  { period: 21, color: '#a855f7', label: 'EMA21' },
]

const RSI_PERIOD = 14
const MACD_FAST = 12
const MACD_SLOW = 26
const MACD_SIGNAL = 9
const BB_PERIOD = 20
const BB_MULT = 2

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

function calcBB(data, period = BB_PERIOD, mult = BB_MULT) {
  const upper = [], middle = [], lower = []
  let sum = 0
  const win = []
  for (let i = 0; i < data.length; i++) {
    const c = data[i].close
    win.push(c); sum += c
    if (win.length > period) sum -= win.shift()
    if (win.length === period) {
      const avg = sum / period
      let sq = 0
      for (let j = 0; j < win.length; j++) sq += (win[j] - avg) ** 2
      const sd = Math.sqrt(sq / period)
      middle.push({ time: data[i].time, value: avg })
      upper.push({ time: data[i].time, value: avg + mult * sd })
      lower.push({ time: data[i].time, value: avg - mult * sd })
    }
  }
  return { upper, middle, lower }
}

function calcBBIncr(data, period = BB_PERIOD, mult = BB_MULT) {
  if (data.length < period) return null
  const win = data.slice(-period)
  const avg = win.reduce((s, d) => s + d.close, 0) / period
  let sq = 0
  for (let i = 0; i < win.length; i++) sq += (win[i].close - avg) ** 2
  const sd = Math.sqrt(sq / period)
  return { time: data[data.length - 1].time, avg, upper: avg + mult * sd, lower: avg - mult * sd }
}

function calcRSIFull(data, period = 14) {
  if (data.length < period + 1) return { values: [], state: null }
  const values = []
  let avgGain = 0, avgLoss = 0
  for (let i = 1; i <= period; i++) {
    const d = data[i].close - data[i - 1].close
    if (d > 0) avgGain += d; else avgLoss += Math.abs(d)
  }
  avgGain /= period; avgLoss /= period
  values.push({ time: data[period].time, value: avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss) })
  for (let i = period + 1; i < data.length; i++) {
    const d = data[i].close - data[i - 1].close
    avgGain = (avgGain * (period - 1) + Math.max(d, 0)) / period
    avgLoss = (avgLoss * (period - 1) + Math.max(-d, 0)) / period
    values.push({ time: data[i].time, value: avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss) })
  }
  return { values, state: { avgGain, avgLoss } }
}

function calcEMAFull(closes, period) {
  if (closes.length < period) return { values: [], lastEMA: null }
  const k = 2 / (period + 1)
  let ema = closes.slice(0, period).reduce((s, v) => s + v, 0) / period
  const values = [ema]
  for (let i = period; i < closes.length; i++) {
    ema = closes[i] * k + ema * (1 - k)
    values.push(ema)
  }
  return { values, lastEMA: ema }
}

function calcMACDFull(data, fast = 12, slow = 26, signal = 9) {
  if (data.length < slow + signal) {
    return { macdLine: [], signalLine: [], histogram: [], state: null }
  }
  const closes = data.map(d => d.close)
  const kFast = 2 / (fast + 1)
  const kSlow = 2 / (slow + 1)
  const kSig = 2 / (signal + 1)
  const { values: emaFastAll, lastEMA: lastFast } = calcEMAFull(closes, fast)
  const { values: emaSlowAll, lastEMA: lastSlow } = calcEMAFull(closes, slow)
  const offset = slow - fast
  const macdRaw = emaSlowAll.map((sv, i) => sv != null ? emaFastAll[i + offset] - sv : null).filter(v => v != null)
  if (macdRaw.length < signal) {
    return { macdLine: [], signalLine: [], histogram: [], state: null }
  }
  const { values: signalAll, lastEMA: lastSignalEMA } = calcEMAFull(macdRaw, signal)
  const macdLine = [], signalLine = [], histogram = []
  signalAll.forEach((sv, i) => {
    const dataIdx = slow - 1 + i + (signal - 1)
    if (dataIdx >= data.length) return
    const mv = macdRaw[i + signal - 1]
    if (mv == null) return
    const hv = mv - sv
    macdLine.push({ time: data[dataIdx].time, value: mv })
    signalLine.push({ time: data[dataIdx].time, value: sv })
    histogram.push({ time: data[dataIdx].time, value: hv, color: hv >= 0 ? '#0ecb8188' : '#f6465d88' })
  })
  const lastMacd = macdLine.length ? macdLine[macdLine.length - 1].value : 0
  return {
    macdLine, signalLine, histogram,
    state: {
      lastEmaFast: lastFast,
      lastEmaSlow: lastSlow,
      lastSignal: lastSignalEMA ?? lastMacd,
      kFast, kSlow, kSig,
    },
  }
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

function fmtMacd(v) {
  if (v == null || !isFinite(v)) return '---'
  const a = Math.abs(v)
  return a >= 0.0001 ? v.toFixed(4) : v.toExponential(2)
}

function fmtVol(n) {
  if (!isFinite(n) || n <= 0) return '---'
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(2) + 'K'
  return n.toFixed(2)
}

function fmtOI(val) {
  if (val == null || !isFinite(val) || val <= 0) return '---'
  if (val >= 1_000_000) return (val / 1_000_000).toFixed(2) + 'M'
  if (val >= 1_000) return (val / 1_000).toFixed(1) + 'K'
  return val.toFixed(0)
}

// ── CVD: Cumulative Volume Delta ─────────────────────────────────────────────
// cvd[i] = cvd[i-1] + takerBuyVol[i] - (totalVol[i] - takerBuyVol[i])
//         = cvd[i-1] + 2*takerBuyVol[i] - totalVol[i]
function calcCVDFull(data) {
  let cvd = 0
  return data.map(d => {
    const buyVol = d.takerBuyVol ?? 0
    const sellVol = (d.volume ?? 0) - buyVol
    cvd += buyVol - sellVol
    return { time: d.time, value: cvd }
  })
}

function getPriceFormat(price) {
  if (!price || !isFinite(price) || price <= 0) {
    return { type: 'price', precision: 8, minMove: 0.00000001 }
  }
  if (price >= 10000) return { type: 'price', precision: 2, minMove: 0.01 }
  if (price >= 1000) return { type: 'price', precision: 2, minMove: 0.01 }
  if (price >= 100) return { type: 'price', precision: 3, minMove: 0.001 }
  if (price >= 10) return { type: 'price', precision: 4, minMove: 0.0001 }
  if (price >= 1) return { type: 'price', precision: 4, minMove: 0.0001 }
  if (price >= 0.1) return { type: 'price', precision: 5, minMove: 0.00001 }
  if (price >= 0.01) return { type: 'price', precision: 6, minMove: 0.000001 }
  if (price >= 0.001) return { type: 'price', precision: 7, minMove: 0.0000001 }
  if (price >= 0.0001) return { type: 'price', precision: 8, minMove: 0.00000001 }
  return { type: 'price', precision: 10, minMove: 0.0000000001 }
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

// ── GoToDate modal — giống TradingView "Go to" ───────────────────────────────
function GoToDateModal({ onClose, onGoto }) {
  const today = new Date()
  const [viewYear, setViewYear] = React.useState(today.getFullYear())
  const [viewMonth, setViewMonth] = React.useState(today.getMonth()) // 0-based
  const [selDate, setSelDate] = React.useState(null)
  const [timeStr, setTimeStr] = React.useState('00:00')

  const MONTHS_VI = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12']

  function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate() }
  function firstDayOfMonth(y, m) {
    // 0=Sun → shift to Mon=0
    const d = new Date(y, m, 1).getDay()
    return d === 0 ? 6 : d - 1
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  function handleGoto() {
    if (!selDate) return
    const [h, min] = timeStr.split(':').map(Number)
    const dt = new Date(selDate.y, selDate.m, selDate.d, h || 0, min || 0, 0)
    onGoto(Math.floor(dt.getTime() / 1000))
    onClose()
  }

  const days = daysInMonth(viewYear, viewMonth)
  const firstDay = firstDayOfMonth(viewYear, viewMonth)
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= days; d++) cells.push(d)

  const isFuture = (d) => {
    const dt = new Date(viewYear, viewMonth, d)
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    return dt > t
  }
  const isToday = (d) =>
    d === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear()
  const isSel = (d) =>
    selDate && d === selDate.d && viewMonth === selDate.m && viewYear === selDate.y

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-[#1e2329] border border-[#2b3139] rounded-xl shadow-2xl w-80 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2b3139]">
          <span className="text-[13px] font-semibold text-[#eaecef]">Go to</span>
          <button onClick={onClose} className="text-[#5e6673] hover:text-white transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Date + Time input row */}
        <div className="flex gap-2 px-4 pt-3 pb-2">
          <div className="flex-1 bg-[#0b0e11] border border-[#2b3139] rounded-lg px-3 py-2 flex items-center gap-2 focus-within:border-[#f0b90b]">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-[#5e6673] flex-shrink-0">
              <rect x="1" y="2" width="10" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M4 1v2M8 1v2M1 5h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <span className="text-[11px] text-[#eaecef] font-mono">
              {selDate
                ? `${selDate.y}-${String(selDate.m + 1).padStart(2, '0')}-${String(selDate.d).padStart(2, '0')}`
                : <span className="text-[#5e6673]">YYYY-MM-DD</span>
              }
            </span>
          </div>
          <div className="bg-[#0b0e11] border border-[#2b3139] rounded-lg px-3 py-2 flex items-center gap-2 w-28 focus-within:border-[#f0b90b]">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-[#5e6673] flex-shrink-0">
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M6 3.5V6l1.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <input
              type="text" value={timeStr} maxLength={5}
              onChange={e => {
                const v = e.target.value.replace(/[^0-9:]/g, '')
                setTimeStr(v)
              }}
              className="bg-transparent text-[11px] text-[#eaecef] font-mono w-full outline-none"
              placeholder="00:00"
            />
          </div>
        </div>

        {/* Month nav */}
        <div className="flex items-center justify-between px-4 py-2">
          <button onClick={prevMonth} className="text-[#848e9c] hover:text-white p-1 rounded transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span className="text-[12px] font-semibold text-[#eaecef]">
            {MONTHS_VI[viewMonth]} {viewYear}
          </span>
          <button onClick={nextMonth} className="text-[#848e9c] hover:text-white p-1 rounded transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 px-3 mb-1">
          {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
            <div key={d} className="text-center text-[9px] text-[#5e6673] font-medium py-1">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 px-3 pb-3 gap-y-0.5">
          {cells.map((d, i) => (
            <div key={i} className="flex items-center justify-center">
              {d ? (
                <button
                  onClick={() => !isFuture(d) && setSelDate({ y: viewYear, m: viewMonth, d })}
                  className={`w-8 h-8 text-[11px] rounded-full transition-all font-medium
                    ${isFuture(d) ? 'text-[#2b3139] cursor-not-allowed' :
                      isSel(d) ? 'bg-[#f0b90b] text-black' :
                        isToday(d) ? 'border border-[#f0b90b] text-[#f0b90b]' :
                          'text-[#eaecef] hover:bg-[#2b3139]'
                    }`}>
                  {d}
                </button>
              ) : null}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-4 pb-4">
          <button onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-[#2b3139] text-[11px] text-[#848e9c] hover:text-white hover:border-[#4c525e] transition-all">
            Huỷ
          </button>
          <button onClick={handleGoto} disabled={!selDate}
            className={`flex-1 py-2 rounded-lg text-[11px] font-semibold transition-all ${selDate ? 'bg-[#f0b90b] text-black hover:bg-[#f0b90bdd]' : 'bg-[#2b3139] text-[#5e6673] cursor-not-allowed'
              }`}>
            Go to
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ChartPanel() {
  const mainContainerRef = useRef(null)
  const rsiContainerRef = useRef(null)
  const macdContainerRef = useRef(null)

  // ── Canvas overlay ref cho drawing tools ──
  const canvasOverlayRef = useRef(null)

  const mainChartRef = useRef(null)
  const rsiChartRef = useRef(null)
  const macdChartRef = useRef(null)
  const candleRef = useRef(null)
  const volumeRef = useRef(null)
  const maRefs = useRef({})
  const emaRefs = useRef({})
  const emaStateRef = useRef({})
  const rsiLineRef = useRef(null)
  const macdLineRef = useRef(null)
  const macdSignalRef = useRef(null)
  const macdHistRef = useRef(null)
  const bbUpperRef = useRef(null)
  const bbMiddleRef = useRef(null)
  const bbLowerRef = useRef(null)

  // ── OI History refs ───────────────────────────────────────────────────────
  const oiContainerRef = useRef(null)
  const oiChartRef = useRef(null)
  const oiSeriesRef = useRef(null)
  const loadMoreOIRef = useRef(null)   // fn được gán sau khi hook mount
  const isLoadingOIMoreRef = useRef(false)  // guard spinner

  // ── Taker Buy/Sell Volume refs ──────────────────────────────────────────────
  const tvContainerRef = useRef(null)
  const tvChartRef = useRef(null)
  const tvBuySeriesRef = useRef(null)
  const tvSellSeriesRef = useRef(null)
  const loadMoreTVRef = useRef(null)
  const isLoadingTVMoreRef = useRef(false)
  const tvDataRef = useRef([])

  // ── CVD refs ───────────────────────────────────────────────────────────────
  const cvdContainerRef = useRef(null)
  const cvdChartRef = useRef(null)
  const cvdSeriesRef = useRef(null)
  const cvdStateRef = useRef(null)  // { lastCVD } — O(1) per tick

  // ── Liquidation markers ref ────────────────────────────────────────────────
  // Lưu danh sách markers để setMarkers lên candleSeries
  const liqMarkersRef = useRef([])   // [{ time, position, color, shape, text }]

  // ── Funding Rate History refs ───────────────────────────────────────────────
  const frContainerRef = useRef(null)
  const frChartRef = useRef(null)
  const frSeriesRef = useRef(null)

  const klineDataRef = useRef([])
  const [klineDataState, setKlineDataState] = useState([])
  const rsiStateRef = useRef(null)
  const macdStateRef = useRef(null)
  const loadMoreRef = useRef(null)   // fn được useKlineData gán — gọi để load nến cũ hơn
  const isLoadingBanner = useRef(false)  // tránh hiện banner loading nhiều lần

  const [showPicker, setShowPicker] = useState(false)
  const [showGoTo, setShowGoTo] = useState(false)
  const [tooltip, setTooltip] = useState(null)
  const [macdTooltip, setMacdTooltip] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isLoadingOlder, setIsLoadingOlder] = useState(false)  // hiện spinner khi load nến cũ

  // ── Drawing tool state ────────────────────────────────────────────────────
  const [activeTool, setActiveTool] = useState('cursor')
  const [drawingColor, setDrawingColor] = useState('#2962ff')
  const [lineWidth, setLineWidth] = useState(1)
  const [lineStyle, setLineStyle] = useState('solid')
  const [keepDrawing, setKeepDrawing] = useState(false)
  const [magnetMode, setMagnetMode] = useState('none')  // 'none' | 'weak' | 'strong'

  // pixelToPrice: chuyển canvas Y coordinate → giá
  const pixelToPriceRef = useRef(null)
  const pixelToPrice = useCallback((y) => pixelToPriceRef.current?.(y) ?? null, [])

  // pixelToTime: chuyển canvas X coordinate → Date (cho crosshair label trục X)
  const pixelToTimeRef2 = useRef(null)
  const pixelToTime = useCallback((x) => pixelToTimeRef2.current?.(x) ?? null, [])

  const {
    symbol, interval, market, setInterval,
    showMA, setShowMA,
    showEMA, setShowEMA,
    showRSI, setShowRSI,
    showVolume, setShowVolume,
    showMACD, setShowMACD,
    showBB, setShowBB,
    showOI, setShowOI,
    showTakerVol, setShowTakerVol,
    showCVD, setShowCVD,
    showLiq, setShowLiq,
    showFR, setShowFR,
    showDualChart, setShowDualChart,
  } = useChartStore()

  // ── OI History data ───────────────────────────────────────────────────────
  const { oiData, loadMoreOI, hasMoreOI } = useOIHistory(symbol, interval, market)
  const { tvData, loadMoreTV, hasMoreTV } = useTakerVolume(symbol, interval, market, klineDataState)

  // ── Funding Rate History ──────────────────────────────────────────────────
  const frHistory = useFundingRateHistory(symbol, market)

  // ── Drawing tools hook ────────────────────────────────────────────────────
  const {
    drawingCount,
    hiddenAll,
    lockedAll,
    handleAction,
    canvasProps,
    handleCursorMove,
    handleCursorLeave,
  } = useDrawingTools({
    canvasRef: canvasOverlayRef,
    activeTool,
    drawingColor,
    lineWidth,
    lineStyle,
    onToolChange: setActiveTool,
    keepDrawing,
    magnetMode,
    pixelToPrice,
    pixelToTime,
  })

  const currentLabel = ALL_INTERVALS.find(i => i.value === interval)?.label ?? interval
  const isPinned = PINNED.includes(interval)

  // Khi đang ở drawing mode → canvas overlay nhận events để vẽ
  // cursor / cross / dot_cursor / demo_cursor → KHÔNG phải drawing mode
  const isDrawingMode = activeTool !== 'cursor' && activeTool !== 'cross'
    && activeTool !== 'dot_cursor' && activeTool !== 'demo_cursor'

  // ── Tạo tất cả charts một lần ────────────────────────────────────────────
  useEffect(() => {
    if (!mainContainerRef.current || !rsiContainerRef.current || !macdContainerRef.current) return

    const baseLayout = {
      background: { color: '#0b0e11' },
      textColor: '#848e9c',
      fontFamily: 'Inter, system-ui, sans-serif',
      attributionLogo: false,
    }
    const baseGrid = {
      vertLines: { color: '#1a1d26', style: 1 },
      horzLines: { color: '#1a1d26', style: 1 },
    }
    const subCrosshair = {
      mode: 1,
      vertLine: { color: '#4c525e', width: 1, style: 2, labelBackgroundColor: '#2b3139' },
      horzLine: { color: '#4c525e', width: 1, style: 2, labelBackgroundColor: '#2b3139', labelVisible: true },
    }

    const mainChart = createChart(mainContainerRef.current, {
      autoSize: true,
      layout: { ...baseLayout, fontSize: 11 },
      grid: baseGrid,
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

    const candles = mainChart.addSeries(CandlestickSeries, {
      upColor: '#0ecb81', downColor: '#f6465d',
      borderUpColor: '#0ecb81', borderDownColor: '#f6465d',
      wickUpColor: '#0ecb81', wickDownColor: '#f6465d',
      thinBars: true,
      candleBodyMaxWidth: 8,
      candleWickMaxWidth: 1,
    })

    const volume = mainChart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'vol',
    })
    mainChart.priceScale('vol').applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } })

    const maSeriesMap = {}
    MA_CONFIGS.forEach(cfg => {
      maSeriesMap[cfg.period] = mainChart.addSeries(LineSeries, {
        color: cfg.color, lineWidth: 1,
        priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false,
        visible: cfg.period !== 200,
      })
    })

    const emaSeriesMap = {}
    EMA_CONFIGS.forEach(cfg => {
      emaSeriesMap[cfg.period] = mainChart.addSeries(LineSeries, {
        color: cfg.color, lineWidth: 1, lineStyle: 0,
        priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false,
        visible: false,
      })
    })

    const bbUpper = mainChart.addSeries(LineSeries, {
      color: '#26a69a', lineWidth: 1, lineStyle: 2,
      priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false,
      visible: false,
    })
    const bbMiddle = mainChart.addSeries(LineSeries, {
      color: '#26a69a66', lineWidth: 1, lineStyle: 2,
      priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false,
      visible: false,
    })
    const bbLower = mainChart.addSeries(LineSeries, {
      color: '#26a69a', lineWidth: 1, lineStyle: 2,
      priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false,
      visible: false,
    })

    const rsiChart = createChart(rsiContainerRef.current, {
      autoSize: true,
      layout: { ...baseLayout, fontSize: 10 },
      grid: baseGrid,
      crosshair: subCrosshair,
      rightPriceScale: { borderColor: '#1a1d26', textColor: '#848e9c', scaleMargins: { top: 0.1, bottom: 0.1 } },
      timeScale: { visible: false },
      handleScroll: false, handleScale: false,
    })

    const rsiLine = rsiChart.addSeries(LineSeries, {
      color: '#9c27b0', lineWidth: 1.5,
      priceLineVisible: false, lastValueVisible: true,
    })
    rsiLine.createPriceLine({ price: 70, color: '#f6465d88', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: 'OB' })
    rsiLine.createPriceLine({ price: 30, color: '#0ecb8188', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: 'OS' })

    const macdChart = createChart(macdContainerRef.current, {
      autoSize: true,
      layout: { ...baseLayout, fontSize: 10 },
      grid: baseGrid,
      crosshair: subCrosshair,
      rightPriceScale: { borderColor: '#1a1d26', textColor: '#848e9c', scaleMargins: { top: 0.1, bottom: 0.1 } },
      timeScale: { visible: false },
      handleScroll: false, handleScale: false,
    })

    const macdHist = macdChart.addSeries(HistogramSeries, {
      priceFormat: { type: 'price', precision: 6, minMove: 0.000001 },
      lastValueVisible: false,
    })
    const macdLine = macdChart.addSeries(LineSeries, {
      color: '#2196f3', lineWidth: 1.5,
      priceLineVisible: false, lastValueVisible: true, crosshairMarkerVisible: true,
    })
    const macdSignal = macdChart.addSeries(LineSeries, {
      color: '#ff9800', lineWidth: 1,
      priceLineVisible: false, lastValueVisible: true, crosshairMarkerVisible: true,
    })
    macdLine.createPriceLine({ price: 0, color: '#4c525e', lineWidth: 1, lineStyle: 1, axisLabelVisible: false })

    // throttle sync sub-charts để tránh lag khi scroll nhanh
    let syncRaf = null
    mainChart.timeScale().subscribeVisibleLogicalRangeChange(range => {
      if (!range) return
      if (syncRaf) cancelAnimationFrame(syncRaf)
      syncRaf = requestAnimationFrame(() => {
        rsiChart.timeScale().setVisibleLogicalRange(range)
        macdChart.timeScale().setVisibleLogicalRange(range)
        syncRaf = null
      })

      // ── Infinite scroll backward: khi scroll đến gần đầu chart (from < 10 nến) ──
      if (range.from < 10 && loadMoreRef.current && !isLoadingBanner.current) {
        isLoadingBanner.current = true
        setIsLoadingOlder(true)
        loadMoreRef.current().finally(() => {
          isLoadingBanner.current = false
          setIsLoadingOlder(false)
        })
      }
    })

    const onMain = throttle((param) => {
      if (!param.time || !param.point) { setTooltip(null); return }
      const bar = param.seriesData?.get(candles)
      const vol = param.seriesData?.get(volume)
      if (!bar) { setTooltip(null); return }
      const maValues = {}
      MA_CONFIGS.forEach(cfg => {
        const v = param.seriesData?.get(maSeriesMap[cfg.period])
        if (v) maValues[cfg.period] = v.value
      })
      const emaValues = {}
      EMA_CONFIGS.forEach(cfg => {
        const v = param.seriesData?.get(emaSeriesMap[cfg.period])
        if (v) emaValues[cfg.period] = v.value
      })
      const bbU = param.seriesData?.get(bbUpper)
      const bbM = param.seriesData?.get(bbMiddle)
      const bbL = param.seriesData?.get(bbLower)
      const bbValues = (bbU && bbM && bbL) ? { upper: bbU.value, middle: bbM.value, lower: bbL.value } : null
      setTooltip({ open: bar.open, high: bar.high, low: bar.low, close: bar.close, volume: vol?.value ?? 0, isUp: bar.close >= bar.open, maValues, emaValues, bbValues })
    }, 16)

    const onMacd = throttle((param) => {
      if (!param.time || !param.point) { setMacdTooltip(null); return }
      const m = param.seriesData?.get(macdLine)
      const s = param.seriesData?.get(macdSignal)
      const h = param.seriesData?.get(macdHist)
      if (!m) { setMacdTooltip(null); return }
      setMacdTooltip({ macd: m?.value, signal: s?.value, hist: h?.value })
    }, 16)

    mainChart.subscribeCrosshairMove(onMain)
    macdChart.subscribeCrosshairMove(onMacd)

    mainChartRef.current = mainChart
    rsiChartRef.current = rsiChart
    macdChartRef.current = macdChart
    candleRef.current = candles
    volumeRef.current = volume
    maRefs.current = maSeriesMap
    emaRefs.current = emaSeriesMap
    rsiLineRef.current = rsiLine
    macdLineRef.current = macdLine
    macdSignalRef.current = macdSignal
    macdHistRef.current = macdHist
    bbUpperRef.current = bbUpper
    bbMiddleRef.current = bbMiddle
    bbLowerRef.current = bbLower

    // ── Wire pixelToPrice từ priceScale của mainChart ──
    // Canvas overlay absolute top:0 left:0 trên container cha.
    // lightweight-charts vẽ chart pane bên trong container — cùng origin nên Y giống nhau.
    // Tuy nhiên mainChart.priceScale('right').coordinateToPrice(y) nhận y tính từ
    // phần trên của chart pane (không bao gồm topbar của lw-charts).
    // Dùng getBoundingClientRect để tính offset chính xác.
    pixelToPriceRef.current = (canvasY) => {
      try {
        const canvas = canvasOverlayRef.current
        const chartDiv = mainContainerRef.current
        if (!canvas || !chartDiv) return null
        // Tìm phần tử <canvas> bên trong lightweight-charts (chart pane thực sự)
        const lwCanvas = chartDiv.querySelector('canvas')
        if (lwCanvas) {
          const lwRect = lwCanvas.getBoundingClientRect()
          const canvasRect = canvas.getBoundingClientRect()
          // y tương đối so với lw-chart canvas
          const yInChart = canvasY - (lwRect.top - canvasRect.top)
          return mainChart.priceScale('right').coordinateToPrice(yInChart)
        }
        return mainChart.priceScale('right').coordinateToPrice(canvasY)
      } catch {
        return null
      }
    }

    // ── Wire pixelToTime từ timeScale của mainChart ──
    // coordinateToTime trả về Unix timestamp (số giây) — lightweight-charts dùng UTC.
    pixelToTimeRef2.current = (canvasX) => {
      try {
        const canvas = canvasOverlayRef.current
        const chartDiv = mainContainerRef.current
        if (!canvas || !chartDiv) return null
        const lwCanvas = chartDiv.querySelector('canvas')
        let xInChart = canvasX
        if (lwCanvas) {
          const lwRect = lwCanvas.getBoundingClientRect()
          const canvasRect = canvas.getBoundingClientRect()
          xInChart = canvasX - (lwRect.left - canvasRect.left)
        }
        const ts = mainChart.timeScale().coordinateToTime(xInChart)
        if (ts == null) return null
        // lightweight-charts trả về seconds epoch (UTC) hoặc 'yyyy-mm-dd' string
        if (typeof ts === 'number') return new Date(ts * 1000)  // ms UTC
        if (typeof ts === 'string') return new Date(ts)          // parse ISO date
        return null
      } catch {
        return null
      }
    }

    return () => {
      mainChart.remove(); rsiChart.remove(); macdChart.remove()
      mainChartRef.current = rsiChartRef.current = macdChartRef.current = null
      candleRef.current = volumeRef.current = null
      maRefs.current = {}
      emaRefs.current = {}
      emaStateRef.current = {}
      rsiLineRef.current = macdLineRef.current = macdSignalRef.current = macdHistRef.current = null
      bbUpperRef.current = bbMiddleRef.current = bbLowerRef.current = null
      pixelToPriceRef.current = null
      pixelToTimeRef2.current = null
      if (frChartRef.current) { frChartRef.current.remove(); frChartRef.current = null }
      frSeriesRef.current = null
    }
  }, [])

  // ── OI History Chart — khởi tạo/huỷ khi showOI hoặc market thay đổi ────
  // FIX: setTimeout(0) để defer sau 1 tick — đảm bảo oiContainerRef đã mount
  useEffect(() => {
    if (!showOI || market !== 'futures') {
      if (oiChartRef.current) {
        oiChartRef.current.remove()
        oiChartRef.current = null
        oiSeriesRef.current = null
      }
      return
    }

    let cancelled = false
    const timerId = setTimeout(() => {
      if (cancelled || !oiContainerRef.current || oiChartRef.current) return

      const chart = createChart(oiContainerRef.current, {
        autoSize: true,
        layout: {
          background: { color: '#0b0e11' },
          textColor: '#848e9c',
          fontFamily: 'Inter, system-ui, sans-serif',
          attributionLogo: false,
          fontSize: 10,
        },
        grid: {
          vertLines: { color: '#1a1d26', style: 1 },
          horzLines: { color: '#1a1d26', style: 1 },
        },
        crosshair: {
          mode: 1,
          vertLine: { color: '#4c525e', width: 1, style: 2, labelBackgroundColor: '#2b3139' },
          horzLine: { color: '#4c525e', width: 1, style: 2, labelBackgroundColor: '#2b3139', labelVisible: true },
        },
        rightPriceScale: {
          borderColor: '#1a1d26',
          textColor: '#848e9c',
          scaleMargins: { top: 0.1, bottom: 0.1 },
        },
        timeScale: { visible: false },
        handleScroll: false,
        handleScale: false,
      })

      const series = chart.addSeries(AreaSeries, {
        lineColor: '#f0b90b',
        topColor: 'rgba(240,185,11,0.25)',
        bottomColor: 'rgba(240,185,11,0.02)',
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: true,
        crosshairMarkerVisible: true,
        priceFormat: {
          type: 'custom',
          formatter: (val) => fmtOI(val),
          minMove: 1,
        },
      })

      oiChartRef.current = chart
      oiSeriesRef.current = series

      // Set data ngay nếu oiData đã có sẵn (fetch về trước khi chart init xong)
      if (oiDataRef.current && oiDataRef.current.length > 0) {
        const sorted = [...oiDataRef.current].sort((a, b) => a.time - b.time)
        series.setData(sorted.map(d => ({ time: d.time, value: d.oi })))
        // Sync ngay với vùng thời gian main chart đang hiện — không fitContent
        try {
          const mainRange = mainChartRef.current?.timeScale().getVisibleRange()
          if (mainRange) chart.timeScale().setVisibleRange(mainRange)
        } catch (_) { }
      }

      // Sync timescale với main chart dùng TIME range (không dùng logical index
      // vì main chart có 500+ nến còn OI có thể ít hơn rất nhiều)
      if (mainChartRef.current) {
        let oiSyncRaf = null
        mainChartRef.current.timeScale().subscribeVisibleTimeRangeChange(range => {
          if (!range || !oiChartRef.current) return
          if (oiSyncRaf) cancelAnimationFrame(oiSyncRaf)
          oiSyncRaf = requestAnimationFrame(() => {
            try { oiChartRef.current?.timeScale().setVisibleRange(range) } catch (_) { }
            oiSyncRaf = null
          })
        })

        // ── Infinite scroll: khi main chart scroll gần về đầu OI data ──
        mainChartRef.current.timeScale().subscribeVisibleLogicalRangeChange(range => {
          if (!range || !oiChartRef.current) return
          // Tính logical range tương đương trên OI chart
          try {
            const oiRange = oiChartRef.current.timeScale().getVisibleLogicalRange()
            if (!oiRange) return
            // Nếu điểm đầu của OI chart đang hiện (from < 10) → load thêm
            if (oiRange.from < 10 && !isLoadingOIMoreRef.current) {
              isLoadingOIMoreRef.current = true
              loadMoreOIRef.current?.().finally(() => {
                isLoadingOIMoreRef.current = false
              })
            }
          } catch (_) { }
        })
      }
    }, 0)

    return () => {
      cancelled = true
      clearTimeout(timerId)
      if (oiChartRef.current) {
        oiChartRef.current.remove()
        oiChartRef.current = null
        oiSeriesRef.current = null
      }
    }
  }, [showOI, market])

  // ── Giữ oiData + loadMoreOI trong ref để callbacks luôn dùng bản mới nhất ─
  const oiDataRef = useRef([])
  useEffect(() => { oiDataRef.current = oiData }, [oiData])
  useEffect(() => { loadMoreOIRef.current = loadMoreOI }, [loadMoreOI])

  // ── Sync TV refs ──────────────────────────────────────────────────────────
  useEffect(() => { tvDataRef.current = tvData }, [tvData])
  useEffect(() => { loadMoreTVRef.current = loadMoreTV }, [loadMoreTV])

  // ── Set OI data khi oiData thay đổi ──────────────────────────────────────
  // FIX: Nếu series chưa ready (chart init chưa xong), retry sau 200ms
  useEffect(() => {
    if (!oiData.length) return
    const apply = () => {
      if (!oiSeriesRef.current || !oiChartRef.current) return false
      const sorted = [...oiData].sort((a, b) => a.time - b.time)
      oiSeriesRef.current.setData(sorted.map(d => ({ time: d.time, value: d.oi })))
      // Sync với vùng thời gian main chart đang hiện (không fitContent)
      try {
        const mainRange = mainChartRef.current?.timeScale().getVisibleRange()
        if (mainRange) oiChartRef.current.timeScale().setVisibleRange(mainRange)
      } catch (_) { }
      return true
    }
    if (!apply()) {
      const t = setTimeout(apply, 200)
      return () => clearTimeout(t)
    }
  }, [oiData])

  // ── Taker Volume Chart — init/destroy khi showTakerVol / market thay đổi ──
  useEffect(() => {
    if (!showTakerVol || market !== 'futures') {
      if (tvChartRef.current) {
        tvChartRef.current.remove()
        tvChartRef.current = null
        tvBuySeriesRef.current = null
        tvSellSeriesRef.current = null
      }
      return
    }

    let cancelled = false
    const timerId = setTimeout(() => {
      if (cancelled || !tvContainerRef.current || tvChartRef.current) return

      const chart = createChart(tvContainerRef.current, {
        autoSize: true,
        layout: {
          background: { color: '#0b0e11' },
          textColor: '#848e9c',
          fontFamily: 'Inter, system-ui, sans-serif',
          attributionLogo: false,
          fontSize: 10,
        },
        grid: {
          vertLines: { color: '#1a1d26', style: 1 },
          horzLines: { color: '#1a1d26', style: 1 },
        },
        crosshair: {
          mode: 1,
          vertLine: { color: '#4c525e', width: 1, style: 2, labelBackgroundColor: '#2b3139' },
          horzLine: { color: '#4c525e', width: 1, style: 2, labelBackgroundColor: '#2b3139', labelVisible: true },
        },
        rightPriceScale: {
          borderColor: '#1a1d26',
          textColor: '#848e9c',
          scaleMargins: { top: 0.05, bottom: 0.05 },
        },
        timeScale: { visible: false },
        handleScroll: false,
        handleScale: false,
      })

      // Buy taker = xanh, Sell taker = đỏ — dùng HistogramSeries riêng nhau
      const buySeries = chart.addSeries(HistogramSeries, {
        color: '#0ecb8188',
        priceFormat: { type: 'volume' },
        priceScaleId: 'tv',
        lastValueVisible: false,
      })
      const sellSeries = chart.addSeries(HistogramSeries, {
        color: '#f6465d88',
        priceFormat: { type: 'volume' },
        priceScaleId: 'tv',
        lastValueVisible: false,
      })
      chart.priceScale('tv').applyOptions({ scaleMargins: { top: 0.05, bottom: 0.05 } })

      tvChartRef.current = chart
      tvBuySeriesRef.current = buySeries
      tvSellSeriesRef.current = sellSeries

      // Set data ngay nếu đã có sẵn
      if (tvDataRef.current && tvDataRef.current.length > 0) {
        const sorted = [...tvDataRef.current].sort((a, b) => a.time - b.time)
        buySeries.setData(sorted.map(d => ({ time: d.time, value: d.buyVol, color: '#0ecb8188' })))
        sellSeries.setData(sorted.map(d => ({ time: d.time, value: -d.sellVol, color: '#f6465d88' })))
        try {
          const mainRange = mainChartRef.current?.timeScale().getVisibleRange()
          if (mainRange) chart.timeScale().setVisibleRange(mainRange)
        } catch (_) { }
      }

      // Sync timescale + infinite scroll
      if (mainChartRef.current) {
        let tvSyncRaf = null
        mainChartRef.current.timeScale().subscribeVisibleTimeRangeChange(range => {
          if (!range || !tvChartRef.current) return
          if (tvSyncRaf) cancelAnimationFrame(tvSyncRaf)
          tvSyncRaf = requestAnimationFrame(() => {
            try { tvChartRef.current?.timeScale().setVisibleRange(range) } catch (_) { }
            tvSyncRaf = null
          })
        })

        mainChartRef.current.timeScale().subscribeVisibleLogicalRangeChange(range => {
          if (!range || !tvChartRef.current) return
          try {
            const tvRange = tvChartRef.current.timeScale().getVisibleLogicalRange()
            if (!tvRange) return
            if (tvRange.from < 10 && !isLoadingTVMoreRef.current) {
              isLoadingTVMoreRef.current = true
              loadMoreTVRef.current?.().finally(() => {
                isLoadingTVMoreRef.current = false
              })
            }
          } catch (_) { }
        })
      }
    }, 0)

    return () => {
      cancelled = true
      clearTimeout(timerId)
      if (tvChartRef.current) {
        tvChartRef.current.remove()
        tvChartRef.current = null
        tvBuySeriesRef.current = null
        tvSellSeriesRef.current = null
      }
    }
  }, [showTakerVol, market])

  // ── Set TV data khi tvData thay đổi ──────────────────────────────────────
  useEffect(() => {
    if (!tvData.length) return
    const applyTV = () => {
      if (!tvBuySeriesRef.current || !tvSellSeriesRef.current || !tvChartRef.current) return false
      const sorted = [...tvData].sort((a, b) => a.time - b.time)
      tvBuySeriesRef.current.setData(sorted.map(d => ({ time: d.time, value: d.buyVol, color: '#0ecb8188' })))
      tvSellSeriesRef.current.setData(sorted.map(d => ({ time: d.time, value: -d.sellVol, color: '#f6465d88' })))
      try {
        const mainRange = mainChartRef.current?.timeScale().getVisibleRange()
        if (mainRange) tvChartRef.current.timeScale().setVisibleRange(mainRange)
      } catch (_) { }
      return true
    }
    if (!applyTV()) {
      const t = setTimeout(applyTV, 200)
      return () => clearTimeout(t)
    }
  }, [tvData])

  // ── CVD Chart — init/destroy khi showCVD thay đổi ─────────────────────────
  useEffect(() => {
    if (!showCVD) {
      if (cvdChartRef.current) {
        cvdChartRef.current.remove()
        cvdChartRef.current = null
        cvdSeriesRef.current = null
      }
      return
    }

    let cancelled = false
    const timerId = setTimeout(() => {
      if (cancelled || !cvdContainerRef.current || cvdChartRef.current) return

      const chart = createChart(cvdContainerRef.current, {
        autoSize: true,
        layout: {
          background: { color: '#0b0e11' },
          textColor: '#848e9c',
          fontFamily: 'Inter, system-ui, sans-serif',
          attributionLogo: false,
          fontSize: 10,
        },
        grid: {
          vertLines: { color: '#1a1d26', style: 1 },
          horzLines: { color: '#1a1d26', style: 1 },
        },
        crosshair: {
          mode: 1,
          vertLine: { color: '#4c525e', width: 1, style: 2, labelBackgroundColor: '#2b3139' },
          horzLine: { color: '#4c525e', width: 1, style: 2, labelBackgroundColor: '#2b3139', labelVisible: true },
        },
        rightPriceScale: {
          borderColor: '#1a1d26',
          textColor: '#848e9c',
          scaleMargins: { top: 0.1, bottom: 0.1 },
        },
        timeScale: { visible: false },
        handleScroll: false,
        handleScale: false,
      })

      const series = chart.addSeries(AreaSeries, {
        lineColor: '#e91e63',
        topColor: 'rgba(233,30,99,0.2)',
        bottomColor: 'rgba(233,30,99,0.02)',
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: true,
        crosshairMarkerVisible: true,
        priceFormat: {
          type: 'custom',
          formatter: (v) => (v >= 0 ? '+' : '') + fmtVol(v),
          minMove: 0.01,
        },
      })

      // Zero line
      series.createPriceLine({ price: 0, color: '#4c525e55', lineWidth: 1, lineStyle: 1, axisLabelVisible: false })

      cvdChartRef.current = chart
      cvdSeriesRef.current = series

      // Set data ngay nếu kline data đã có
      if (klineDataRef.current.length > 0) {
        const cvdData = calcCVDFull(klineDataRef.current)
        series.setData(cvdData)
        cvdStateRef.current = { lastCVD: cvdData[cvdData.length - 1]?.value ?? 0 }
        try {
          const mainRange = mainChartRef.current?.timeScale().getVisibleRange()
          if (mainRange) chart.timeScale().setVisibleRange(mainRange)
        } catch (_) { }
      }

      // Sync timescale với main chart
      if (mainChartRef.current) {
        let cvdSyncRaf = null
        mainChartRef.current.timeScale().subscribeVisibleTimeRangeChange(range => {
          if (!range || !cvdChartRef.current) return
          if (cvdSyncRaf) cancelAnimationFrame(cvdSyncRaf)
          cvdSyncRaf = requestAnimationFrame(() => {
            try { cvdChartRef.current?.timeScale().setVisibleRange(range) } catch (_) { }
            cvdSyncRaf = null
          })
        })
      }
    }, 0)

    return () => {
      cancelled = true
      clearTimeout(timerId)
      if (cvdChartRef.current) {
        cvdChartRef.current.remove()
        cvdChartRef.current = null
        cvdSeriesRef.current = null
      }
    }
  }, [showCVD])

  // ── Toggle MA ──────────────────────────────────────────────────────────────
  useEffect(() => {
    MA_CONFIGS.forEach(cfg => maRefs.current[cfg.period]?.applyOptions({ visible: showMA[cfg.period] }))
  }, [showMA])

  // ── Toggle EMA ─────────────────────────────────────────────────────────────
  useEffect(() => {
    EMA_CONFIGS.forEach(cfg => {
      emaRefs.current[cfg.period]?.applyOptions({ visible: showEMA[cfg.period] })
    })
    EMA_CONFIGS.forEach(cfg => {
      if (showEMA[cfg.period] && klineDataRef.current.length >= cfg.period) {
        const { series } = calcEMALine(klineDataRef.current, cfg.period)
        emaRefs.current[cfg.period]?.setData(series)
      }
    })
  }, [showEMA])

  // ── Toggle Volume ──────────────────────────────────────────────────────────
  useEffect(() => {
    volumeRef.current?.applyOptions({ visible: showVolume })
  }, [showVolume])

  // ── Toggle BB ─────────────────────────────────────────────────────────────
  useEffect(() => {
    bbUpperRef.current?.applyOptions({ visible: showBB })
    bbMiddleRef.current?.applyOptions({ visible: showBB })
    bbLowerRef.current?.applyOptions({ visible: showBB })
    if (showBB && klineDataRef.current.length >= BB_PERIOD) {
      const { upper, middle, lower } = calcBB(klineDataRef.current)
      bbUpperRef.current?.setData(upper)
      bbMiddleRef.current?.setData(middle)
      bbLowerRef.current?.setData(lower)
    }
  }, [showBB])

  // ── Override cursor của lightweight-charts và ẩn crosshair khi cần ────────
  // LW inject cursor:crosshair vào canvas nội bộ — dùng style tag để force override
  useEffect(() => {
    const container = mainContainerRef.current
    const chart = mainChartRef.current
    if (!chart) return

    // Ẩn crosshair cho dot_cursor mode
    if (activeTool === 'dot_cursor') {
      chart.applyOptions({ crosshair: { mode: 3 } }) // Hidden
    } else {
      chart.applyOptions({
        crosshair: {
          mode: 0,
          vertLine: { color: '#4c525e', width: 1, style: 2, labelBackgroundColor: '#2b3139' },
          horzLine: { color: '#4c525e', width: 1, style: 2, labelBackgroundColor: '#2b3139' },
        },
      })
    }

    // Override cursor CSS — inject vào <head> với !important để đè LW inline style
    if (!container) return
    container.setAttribute('data-lw-cursor-host', '1')
    let styleEl = document.getElementById('lw-cursor-override-style')
    if (!styleEl) {
      styleEl = document.createElement('style')
      styleEl.id = 'lw-cursor-override-style'
      document.head.appendChild(styleEl)
    }
    const cursorValue =
      isDragging ? 'grabbing'
        : activeTool === 'dot_cursor' ? 'none'
          : activeTool === 'cursor' ? 'default'
            : activeTool === 'demo_cursor' ? 'default'
              : null  // cross + drawing modes: để LW tự xử lý (crosshair)
    if (cursorValue) {
      styleEl.textContent = `[data-lw-cursor-host] canvas { cursor: ${cursorValue} !important; }`
    } else {
      styleEl.textContent = ''
    }
  }, [activeTool, isDragging])

  // ── Resize main chart khi panels thay đổi ─────────────────────────────────
  useEffect(() => {
    const bottom = (showRSI ? 0.18 : 0) + (showMACD ? 0.18 : 0)
    mainChartRef.current?.applyOptions({
      rightPriceScale: { scaleMargins: { top: 0.08, bottom: Math.max(bottom, 0.08) } },
    })
    setTimeout(() => mainChartRef.current?.timeScale().fitContent(), 50)
  }, [showRSI, showMACD])

  // ── Auto scroll to realtime khi WS tick mới nhất là nến MỚI (không phải update) ──
  // Chỉ auto-scroll khi user đang ở cuối chart (rightOffset < 20 nến)
  const lastCandleTimeRef = useRef(null)

  // ── onData: full calc sau khi REST load ───────────────────────────────────
  const onKlineData = useCallback((data) => {
    klineDataRef.current = [...data]
    setKlineDataState([...data])

    if (data.length > 0) {
      const samplePrice = data[data.length - 1].close
      const fmt = getPriceFormat(samplePrice)
      candleRef.current?.applyOptions({ priceFormat: fmt })
      MA_CONFIGS.forEach(cfg => maRefs.current[cfg.period]?.applyOptions({ priceFormat: fmt }))
      EMA_CONFIGS.forEach(cfg => emaRefs.current[cfg.period]?.applyOptions({ priceFormat: fmt }))
      bbUpperRef.current?.applyOptions({ priceFormat: fmt })
      bbMiddleRef.current?.applyOptions({ priceFormat: fmt })
      bbLowerRef.current?.applyOptions({ priceFormat: fmt })
    }

    MA_CONFIGS.forEach(cfg => maRefs.current[cfg.period]?.setData(calcMA(data, cfg.period)))

    EMA_CONFIGS.forEach(cfg => {
      if (data.length < cfg.period) return
      const { series, lastEMA } = calcEMALine(data, cfg.period)
      emaRefs.current[cfg.period]?.setData(series)
      emaStateRef.current[cfg.period] = lastEMA
    })

    if (bbUpperRef.current && data.length >= BB_PERIOD) {
      const { upper, middle, lower } = calcBB(data)
      bbUpperRef.current.setData(upper)
      bbMiddleRef.current.setData(middle)
      bbLowerRef.current.setData(lower)
    }

    const { values: rsiVals, state: rsiState } = calcRSIFull(data, RSI_PERIOD)
    if (rsiVals.length > 0) {
      rsiLineRef.current?.setData(rsiVals)
      rsiStateRef.current = rsiState
    }

    const { macdLine, signalLine, histogram, state: macdState } = calcMACDFull(data, MACD_FAST, MACD_SLOW, MACD_SIGNAL)
    if (macdLine.length > 0) {
      macdLineRef.current?.setData(macdLine)
      macdSignalRef.current?.setData(signalLine)
      macdHistRef.current?.setData(histogram)
      macdStateRef.current = macdState
    }

    // CVD — tính từ kline data (takerBuyVol)
    if (cvdSeriesRef.current) {
      const cvdData = calcCVDFull(data)
      cvdSeriesRef.current.setData(cvdData)
      cvdStateRef.current = { lastCVD: cvdData[cvdData.length - 1]?.value ?? 0 }
    }
  }, [])

  // ── onUpdate: O(1) per tick ───────────────────────────────────────────────
  const onKlineUpdate = useCallback((candle) => {
    const data = klineDataRef.current
    if (!data.length) return

    const last = data[data.length - 1]
    const isNew = last.time !== candle.time
    if (isNew) data.push({ ...candle })
    else data[data.length - 1] = { ...last, ...candle }

    MA_CONFIGS.forEach(cfg => {
      const s = maRefs.current[cfg.period]
      if (!s || data.length < cfg.period) return
      const sum = data.slice(-cfg.period).reduce((a, x) => a + x.close, 0)
      s.update({ time: candle.time, value: sum / cfg.period })
    })

    EMA_CONFIGS.forEach(cfg => {
      const s = emaRefs.current[cfg.period]
      if (!s) return
      const lastEMA = emaStateRef.current[cfg.period]
      if (lastEMA == null) return
      const k = 2 / (cfg.period + 1)
      const newEMA = candle.close * k + lastEMA * (1 - k)
      s.update({ time: candle.time, value: newEMA })
      if (isNew) emaStateRef.current[cfg.period] = newEMA
    })

    if (data.length >= BB_PERIOD) {
      const bb = calcBBIncr(data)
      if (bb) {
        bbUpperRef.current?.update({ time: bb.time, value: bb.upper })
        bbMiddleRef.current?.update({ time: bb.time, value: bb.avg })
        bbLowerRef.current?.update({ time: bb.time, value: bb.lower })
      }
    }

    if (rsiStateRef.current && data.length >= 2) {
      const prev = data[data.length - 2]
      const diff = candle.close - prev.close
      let { avgGain: g, avgLoss: l } = rsiStateRef.current
      const newG = (g * (RSI_PERIOD - 1) + Math.max(diff, 0)) / RSI_PERIOD
      const newL = (l * (RSI_PERIOD - 1) + Math.max(-diff, 0)) / RSI_PERIOD
      const val = newL === 0 ? 100 : 100 - 100 / (1 + newG / newL)
      rsiLineRef.current?.update({ time: candle.time, value: val })
      if (isNew) rsiStateRef.current = { avgGain: newG, avgLoss: newL }
    }

    const ms = macdStateRef.current
    if (ms && ms.lastEmaFast != null) {
      const newFast = candle.close * ms.kFast + ms.lastEmaFast * (1 - ms.kFast)
      const newSlow = candle.close * ms.kSlow + ms.lastEmaSlow * (1 - ms.kSlow)
      const newMacd = newFast - newSlow
      const newSignal = newMacd * ms.kSig + ms.lastSignal * (1 - ms.kSig)
      const newHist = newMacd - newSignal

      macdLineRef.current?.update({ time: candle.time, value: newMacd })
      macdSignalRef.current?.update({ time: candle.time, value: newSignal })
      macdHistRef.current?.update({ time: candle.time, value: newHist, color: newHist >= 0 ? '#0ecb8188' : '#f6465d88' })

      if (isNew) {
        macdStateRef.current = { ...ms, lastEmaFast: newFast, lastEmaSlow: newSlow, lastSignal: newSignal }
      }
    }

    // CVD — O(1) per tick
    if (cvdSeriesRef.current && cvdStateRef.current) {
      const buyVol = candle.takerBuyVol ?? 0
      const sellVol = (candle.volume ?? 0) - buyVol
      const delta = buyVol - sellVol
      const newCVD = cvdStateRef.current.lastCVD + delta
      cvdSeriesRef.current.update({ time: candle.time, value: newCVD })
      if (isNew) cvdStateRef.current = { lastCVD: newCVD }
    }

    // Auto scroll to latest khi nến MỚI xuất hiện (không phải cập nhật nến hiện tại)
    if (isNew && mainChartRef.current) {
      try {
        const ts = mainChartRef.current.timeScale()
        const range = ts.getVisibleLogicalRange()
        const total = klineDataRef.current.length
        // Chỉ auto-scroll nếu user đang xem gần cuối (trong vòng 30 nến cuối)
        if (range && range.to >= total - 30) {
          ts.scrollToRealTime()
        }
      } catch { }
    }
  }, [])

  // ── onPrepend: nhận nến cũ hơn từ useKlineData, merge vào klineDataRef + setData ──
  const onKlinePrepend = useCallback((olderData) => {
    if (!olderData || olderData.length === 0) return

    const existing = klineDataRef.current
    // Merge: older trước, existing sau, loại trùng time
    const merged = [...olderData]
    const oldestExisting = existing.length > 0 ? existing[0].time : Infinity
    for (const d of existing) {
      if (d.time > olderData[olderData.length - 1].time) merged.push(d)
    }
    // Sắp xếp lại theo time tăng dần (Binance thường đã sorted)
    merged.sort((a, b) => a.time - b.time)
    klineDataRef.current = merged
    setKlineDataState([...merged])

    // setData toàn bộ lên chart (lightweight-charts hỗ trợ prepend qua setData)
    candleRef.current?.setData(merged)
    if (volumeRef.current) {
      volumeRef.current.setData(merged.map(d => ({
        time: d.time,
        value: d.volume,
        color: d.close >= d.open ? '#0ecb8155' : '#f6465d55',
      })))
    }

    // Recalc toàn bộ indicators trên data mới
    MA_CONFIGS.forEach(cfg => maRefs.current[cfg.period]?.setData(calcMA(merged, cfg.period)))
    EMA_CONFIGS.forEach(cfg => {
      if (merged.length < cfg.period) return
      const { series, lastEMA } = calcEMALine(merged, cfg.period)
      emaRefs.current[cfg.period]?.setData(series)
      emaStateRef.current[cfg.period] = lastEMA
    })
    if (merged.length >= BB_PERIOD) {
      const { upper, middle, lower } = calcBB(merged)
      bbUpperRef.current?.setData(upper)
      bbMiddleRef.current?.setData(middle)
      bbLowerRef.current?.setData(lower)
    }
    const { values: rsiVals, state: rsiState } = calcRSIFull(merged, RSI_PERIOD)
    if (rsiVals.length > 0) { rsiLineRef.current?.setData(rsiVals); rsiStateRef.current = rsiState }
    const { macdLine, signalLine, histogram, state: macdState } = calcMACDFull(merged, MACD_FAST, MACD_SLOW, MACD_SIGNAL)
    if (macdLine.length > 0) {
      macdLineRef.current?.setData(macdLine)
      macdSignalRef.current?.setData(signalLine)
      macdHistRef.current?.setData(histogram)
      macdStateRef.current = macdState
    }

    // CVD recalc sau khi prepend
    if (cvdSeriesRef.current) {
      const cvdData = calcCVDFull(merged)
      cvdSeriesRef.current.setData(cvdData)
      cvdStateRef.current = { lastCVD: cvdData[cvdData.length - 1]?.value ?? 0 }
    }
  }, [])

  useKlineData(candleRef, volumeRef, symbol, interval, market, onKlineData, onKlineUpdate, onKlinePrepend, loadMoreRef)

  // ── Funding Rate History Chart — init/destroy khi showFR / market thay đổi ─
  useEffect(() => {
    if (!showFR || market !== 'futures') {
      if (frChartRef.current) {
        frChartRef.current.remove()
        frChartRef.current = null
        frSeriesRef.current = null
      }
      return
    }

    let cancelled = false
    const timerId = setTimeout(() => {
      if (cancelled || !frContainerRef.current || frChartRef.current) return

      const chart = createChart(frContainerRef.current, {
        autoSize: true,
        layout: {
          background: { color: '#0b0e11' },
          textColor: '#848e9c',
          fontFamily: 'Inter, system-ui, sans-serif',
          attributionLogo: false,
          fontSize: 10,
        },
        grid: {
          vertLines: { color: '#1a1d26', style: 1 },
          horzLines: { color: '#1a1d26', style: 1 },
        },
        crosshair: {
          mode: 1,
          vertLine: { color: '#4c525e', width: 1, style: 2, labelBackgroundColor: '#2b3139' },
          horzLine: { color: '#4c525e', width: 1, style: 2, labelBackgroundColor: '#2b3139', labelVisible: true },
        },
        rightPriceScale: {
          borderColor: '#1a1d26',
          textColor: '#848e9c',
          scaleMargins: { top: 0.1, bottom: 0.1 },
        },
        timeScale: { visible: false },
        handleScroll: false,
        handleScale: false,
      })

      const series = chart.addSeries(HistogramSeries, {
        priceFormat: {
          type: 'custom',
          formatter: (v) => (v >= 0 ? '+' : '') + v.toFixed(4) + '%',
          minMove: 0.0001,
        },
        priceScaleId: 'right',
        lastValueVisible: true,
        crosshairMarkerVisible: false,
      })

      // Zero baseline
      series.createPriceLine({ price: 0, color: '#4c525e88', lineWidth: 1, lineStyle: 2, axisLabelVisible: false })

      frChartRef.current = chart
      frSeriesRef.current = series

      // Set data ngay nếu frHistory đã có
      if (frHistoryRef.current && frHistoryRef.current.length > 0) {
        series.setData(frHistoryRef.current.map(d => ({
          time: d.time,
          value: d.value,
          color: d.raw >= 0 ? '#0ecb8199' : '#f6465d99',
        })))
        try {
          const mainRange = mainChartRef.current?.timeScale().getVisibleRange()
          if (mainRange) chart.timeScale().setVisibleRange(mainRange)
        } catch (_) { }
      }

      // Sync timescale với main chart (TimeRange, không dùng LogicalRange)
      if (mainChartRef.current) {
        let frSyncRaf = null
        mainChartRef.current.timeScale().subscribeVisibleTimeRangeChange(range => {
          if (!range || !frChartRef.current) return
          if (frSyncRaf) cancelAnimationFrame(frSyncRaf)
          frSyncRaf = requestAnimationFrame(() => {
            try { frChartRef.current?.timeScale().setVisibleRange(range) } catch (_) { }
            frSyncRaf = null
          })
        })
      }
    }, 0)

    return () => {
      cancelled = true
      clearTimeout(timerId)
      if (frChartRef.current) {
        frChartRef.current.remove()
        frChartRef.current = null
        frSeriesRef.current = null
      }
    }
  }, [showFR, market])

  // ── Giữ frHistory trong ref để callback trong setTimeout luôn dùng bản mới nhất ─
  const frHistoryRef = useRef([])
  useEffect(() => { frHistoryRef.current = frHistory }, [frHistory])

  // ── Set FR data khi frHistory thay đổi ───────────────────────────────────
  useEffect(() => {
    if (!frHistory.length) return
    const apply = () => {
      if (!frSeriesRef.current || !frChartRef.current) return false
      frSeriesRef.current.setData(frHistory.map(d => ({
        time: d.time,
        value: d.value,
        color: d.raw >= 0 ? '#0ecb8199' : '#f6465d99',
      })))
      try {
        const mainRange = mainChartRef.current?.timeScale().getVisibleRange()
        if (mainRange) frChartRef.current.timeScale().setVisibleRange(mainRange)
      } catch (_) { }
      return true
    }
    if (!apply()) {
      const t = setTimeout(apply, 200)
      return () => clearTimeout(t)
    }
  }, [frHistory])

  // ── Liquidation markers ───────────────────────────────────────────────────
  // Reset markers khi đổi symbol/interval/market
  useEffect(() => {
    liqMarkersRef.current = []
    if (candleRef.current) {
      try { candleRef.current.setMarkers([]) } catch (_) { }
    }
  }, [symbol, interval, market])

  const handleLiquidation = useCallback(({ price, qty, side, time, usdValue }) => {
    if (!showLiq) return
    const candles = candleRef.current
    if (!candles) return

    // Nến hiện tại gần nhất
    const data = klineDataRef.current
    if (!data.length) return

    // Snap time về nến gần nhất
    const timeSec = Math.floor(time / 1000)
    let nearestCandle = data[data.length - 1]
    for (let i = data.length - 1; i >= 0; i--) {
      if (data[i].time <= timeSec) { nearestCandle = data[i]; break }
    }

    const isBuyLiq = side === 'BUY'   // BUY liq = ai đó short bị liq (sell pressure)
    const usdK = usdValue >= 1_000_000
      ? (usdValue / 1_000_000).toFixed(1) + 'M'
      : (usdValue / 1_000).toFixed(0) + 'K'

    const marker = {
      time: nearestCandle.time,
      position: isBuyLiq ? 'belowBar' : 'aboveBar',
      color: isBuyLiq ? '#f6465d' : '#0ecb81',
      shape: isBuyLiq ? 'arrowUp' : 'arrowDown',
      text: `Liq $${usdK}`,
      size: usdValue >= 500_000 ? 2 : 1,
    }

    // Append + sort theo time (lightweight-charts yêu cầu sorted)
    liqMarkersRef.current = [...liqMarkersRef.current, marker]
      .sort((a, b) => a.time - b.time)
      .slice(-200)   // giữ tối đa 200 markers gần nhất

    try { candles.setMarkers(liqMarkersRef.current) } catch (_) { }
  }, [showLiq])

  useLiquidations(symbol, market, handleLiquidation)

  // Khi tắt showLiq → xoá markers khỏi chart
  useEffect(() => {
    if (!showLiq) {
      liqMarkersRef.current = []
      try { candleRef.current?.setMarkers([]) } catch (_) { }
    }
  }, [showLiq])

  const activePanels = (showRSI ? 1 : 0) + (showMACD ? 1 : 0)
  const panelHeightPct = activePanels === 1 ? 22 : 18

  // ─────────────────────────────────────────────────────────────────────────
  // JSX: thêm DrawingToolbar bên trái + canvas overlay trên chart chính
  // ─────────────────────────────────────────────────────────────────────────
  return (
    // Outer: flex ngang — DrawingToolbar | chart area
    <div className={`flex h-full bg-[#0b0e11] overflow-hidden ${isDragging ? 'chart-grabbing' : ''}`}>

      {/* ── Drawing Toolbar (dọc bên trái) ── */}
      <DrawingToolbar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        onAction={handleAction}
        drawingColor={drawingColor}
        onColorChange={setDrawingColor}
        lineWidth={lineWidth}
        onLineWidthChange={setLineWidth}
        lineStyle={lineStyle}
        onLineStyleChange={setLineStyle}
        hiddenAll={hiddenAll}
        lockedAll={lockedAll}
        drawingCount={drawingCount}
        keepDrawing={keepDrawing}
        onKeepDrawingChange={setKeepDrawing}
        magnetMode={magnetMode}
        onMagnetModeChange={setMagnetMode}
      />

      {/* ── Chart area (flex-col như cũ) ── */}
      <div className="flex flex-col flex-1 min-w-0 h-full relative">

        {/* ── Toolbar row ── */}
        <div className="flex items-center gap-1 px-3 py-1.5 border-b border-[#1a1d26] flex-shrink-0 bg-[#0b0e11] flex-wrap">

          <div className="flex items-center gap-0.5">
            {ALL_INTERVALS.filter(i => PINNED.includes(i.value)).map(i => (
              <button key={i.value} onClick={() => setInterval(i.value)}
                className={`px-2.5 py-1 text-xs rounded transition-all ${interval === i.value ? 'bg-[#f0b90b1a] text-[#f0b90b] font-medium' : 'text-[#848e9c] hover:text-white hover:bg-[#1e2329]'
                  }`}>
                {i.label}
              </button>
            ))}
          </div>

          <div className="w-px h-4 bg-[#2b3139] mx-1" />

          <button onClick={() => setShowPicker(p => !p)}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded transition-all ${!isPinned ? 'bg-[#f0b90b1a] text-[#f0b90b] font-medium' : 'text-[#848e9c] hover:text-white hover:bg-[#1e2329]'
              }`}>
            {!isPinned ? currentLabel : 'Thêm'}
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            </svg>
          </button>

          <div className="w-px h-4 bg-[#2b3139] mx-1" />

          <div className="flex items-center gap-1 flex-wrap">
            {MA_CONFIGS.map(cfg => (
              <button key={cfg.period}
                onClick={() => setShowMA({ ...showMA, [cfg.period]: !showMA[cfg.period] })}
                className={`px-2 py-0.5 text-[10px] rounded border transition-all ${showMA[cfg.period] ? 'border-transparent font-medium' : 'border-[#2b3139] text-[#5e6673] hover:text-[#848e9c]'}`}
                style={showMA[cfg.period] ? { color: cfg.color, background: cfg.color + '1a', borderColor: cfg.color + '44' } : {}}>
                {cfg.label}
              </button>
            ))}

            {EMA_CONFIGS.map(cfg => (
              <button key={cfg.period}
                onClick={() => setShowEMA({ ...showEMA, [cfg.period]: !showEMA[cfg.period] })}
                className={`px-2 py-0.5 text-[10px] rounded border transition-all ${showEMA[cfg.period] ? 'border-transparent font-medium' : 'border-[#2b3139] text-[#5e6673] hover:text-[#848e9c]'}`}
                style={showEMA[cfg.period] ? { color: cfg.color, background: cfg.color + '1a', borderColor: cfg.color + '44' } : {}}>
                {cfg.label}
              </button>
            ))}

            <button onClick={() => setShowBB(!showBB)}
              className={`px-2 py-0.5 text-[10px] rounded border transition-all ${showBB ? 'bg-[#26a69a1a] text-[#26a69a] border-[#26a69a44] font-medium' : 'border-[#2b3139] text-[#5e6673] hover:text-[#848e9c]'
                }`}>
              BB(20,2)
            </button>

            <button onClick={() => setShowRSI(!showRSI)}
              className={`px-2 py-0.5 text-[10px] rounded border transition-all ${showRSI ? 'bg-[#9c27b01a] text-[#ce93d8] border-[#9c27b044] font-medium' : 'border-[#2b3139] text-[#5e6673] hover:text-[#848e9c]'
                }`}>
              RSI{RSI_PERIOD}
            </button>

            <button onClick={() => setShowMACD(!showMACD)}
              className={`px-2 py-0.5 text-[10px] rounded border transition-all ${showMACD ? 'bg-[#2196f31a] text-[#64b5f6] border-[#2196f344] font-medium' : 'border-[#2b3139] text-[#5e6673] hover:text-[#848e9c]'
                }`}>
              MACD
            </button>

            <button onClick={() => setShowVolume(!showVolume)}
              className={`px-2 py-0.5 text-[10px] rounded border transition-all ${showVolume ? 'bg-[#4c525e1a] text-[#848e9c] border-[#4c525e44]' : 'border-[#2b3139] text-[#5e6673] hover:text-[#848e9c]'
                }`}>
              VOL
            </button>

            {market === 'futures' && (
              <button onClick={() => setShowOI(!showOI)}
                className={`px-2 py-0.5 text-[10px] rounded border transition-all ${showOI ? 'bg-[#f0b90b1a] text-[#f0b90b] border-[#f0b90b44] font-medium' : 'border-[#2b3139] text-[#5e6673] hover:text-[#848e9c]'
                  }`}>
                OI
              </button>
            )}
            {market === 'futures' && (
              <button onClick={() => setShowTakerVol(!showTakerVol)}
                className={`px-2 py-0.5 text-[10px] rounded border transition-all ${showTakerVol ? 'bg-[#26a69a1a] text-[#26a69a] border-[#26a69a44] font-medium' : 'border-[#2b3139] text-[#5e6673] hover:text-[#848e9c]'
                  }`}>
                TVol
              </button>
            )}

            <button onClick={() => setShowCVD(!showCVD)}
              className={`px-2 py-0.5 text-[10px] rounded border transition-all ${showCVD ? 'bg-[#e91e631a] text-[#e91e63] border-[#e91e6344] font-medium' : 'border-[#2b3139] text-[#5e6673] hover:text-[#848e9c]'
                }`}>
              CVD
            </button>

            {market === 'futures' && (
              <button onClick={() => setShowLiq(!showLiq)}
                className={`px-2 py-0.5 text-[10px] rounded border transition-all ${showLiq ? 'bg-[#ff6b351a] text-[#ff6b35] border-[#ff6b3544] font-medium' : 'border-[#2b3139] text-[#5e6673] hover:text-[#848e9c]'
                  }`}
                title="Hiện liquidation markers trên chart (chỉ Futures)">
                Liq
              </button>
            )}

            {market === 'futures' && (
              <button onClick={() => setShowFR(!showFR)}
                className={`px-2 py-0.5 text-[10px] rounded border transition-all ${showFR ? 'bg-[#f0b90b1a] text-[#f0b90b] border-[#f0b90b44] font-medium' : 'border-[#2b3139] text-[#5e6673] hover:text-[#848e9c]'
                  }`}
                title="Funding Rate History — 100 chu kỳ gần nhất (chỉ Futures)">
                FR
              </button>
            )}

            {/* ── v21: Multi-timeframe toggle ── */}
            <button onClick={() => setShowDualChart(!showDualChart)}
              className={`px-2 py-0.5 text-[10px] rounded border transition-all ${showDualChart
                ? 'bg-[#a855f71a] text-[#a855f7] border-[#a855f744] font-medium'
                : 'border-[#2b3139] text-[#5e6673] hover:text-[#848e9c]'
                }`}
              title="Multi-timeframe: hiển thị 2 chart song song">
              2TF
            </button>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* ── v23: Export CSV ── */}
            <button
              onClick={() => {
                const data = klineDataRef.current
                if (!data.length) return
                const rows = [
                  ['time', 'open', 'high', 'low', 'close', 'volume'].join(','),
                  ...data.map(c => [
                    new Date(c.time * 1000).toISOString(),
                    c.open, c.high, c.low, c.close,
                    c.volume ?? '',
                  ].join(','))
                ]
                const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `${symbol}_${interval}_${new Date().toISOString().slice(0, 10)}.csv`
                a.click()
                URL.revokeObjectURL(url)
              }}
              className="flex items-center gap-1 px-2 py-0.5 text-[10px] rounded border border-[#2b3139] text-[#5e6673] hover:text-[#0ecb81] hover:border-[#0ecb8144] transition-all"
              title={`Tải xuống ${klineDataRef.current?.length ?? 0} nến dưới dạng CSV`}
            >
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 2v8M5 7l3 3 3-3M3 12h10" />
              </svg>
              CSV
            </button>

            <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${market === 'futures' ? 'bg-[#f0b90b1a] text-[#f0b90b]' : 'bg-[#0ecb811a] text-[#0ecb81]'
              }`}>
              {market === 'futures' ? 'FUTURES' : 'SPOT'}
            </span>
          </div>
        </div>

        {/* ── Interval picker dropdown ── */}
        {showPicker && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowPicker(false)} />
            <div className="absolute top-10 left-3 z-20 bg-[#1e2329] border border-[#2b3139] rounded-lg shadow-2xl p-4 w-72">
              {INTERVAL_GROUPS.map(group => (
                <div key={group.label} className="mb-3 last:mb-0">
                  <p className="text-[10px] text-[#5e6673] uppercase tracking-wider mb-2 font-medium">{group.label}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {group.items.map(i => (
                      <button key={i.value}
                        onClick={() => { setInterval(i.value); setShowPicker(false) }}
                        className={`px-3 py-1.5 text-xs rounded transition-all ${interval === i.value ? 'bg-[#f0b90b] text-black font-semibold' : 'bg-[#2b3139] text-[#848e9c] hover:bg-[#363c45] hover:text-white'
                          }`}>
                        {i.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* ── Go to date button ── */}
              <div className="mt-3 pt-3 border-t border-[#2b3139]">
                <button
                  onClick={() => { setShowPicker(false); setShowGoTo(true) }}
                  title="Go to date"
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-[11px] text-[#848e9c] hover:text-white hover:bg-[#2b3139] rounded-lg transition-all border border-[#2b3139] hover:border-[#363c45]"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <rect x="1" y="2" width="10" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M4 1v2M8 1v2M1 5h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                  Go to date
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── OHLCV Tooltip ── */}
        {tooltip && (
          <div className="absolute top-10 left-3 z-10 pointer-events-none">
            <div className="flex items-center gap-3 bg-[#1e2329cc] backdrop-blur-sm px-3 py-1.5 rounded text-[11px] border border-[#2b3139] flex-wrap">
              <span className={tooltip.isUp ? 'text-[#0ecb81]' : 'text-[#f6465d]'}>O <span className="text-[#eaecef]">{fmtPrice(tooltip.open)}</span></span>
              <span className="text-[#0ecb81]">H <span className="text-[#eaecef]">{fmtPrice(tooltip.high)}</span></span>
              <span className="text-[#f6465d]">L <span className="text-[#eaecef]">{fmtPrice(tooltip.low)}</span></span>
              <span className={tooltip.isUp ? 'text-[#0ecb81]' : 'text-[#f6465d]'}>C <span className="text-[#eaecef]">{fmtPrice(tooltip.close)}</span></span>
              <span className="text-[#5e6673]">V <span className="text-[#848e9c]">{fmtVol(tooltip.volume)}</span></span>
              {MA_CONFIGS.map(cfg =>
                showMA[cfg.period] && tooltip.maValues?.[cfg.period] ? (
                  <span key={cfg.period} style={{ color: cfg.color }}>
                    {cfg.label} <span className="text-[#eaecef]">{fmtPrice(tooltip.maValues[cfg.period])}</span>
                  </span>
                ) : null
              )}
              {EMA_CONFIGS.map(cfg =>
                showEMA[cfg.period] && tooltip.emaValues?.[cfg.period] ? (
                  <span key={cfg.period} style={{ color: cfg.color }}>
                    {cfg.label} <span className="text-[#eaecef]">{fmtPrice(tooltip.emaValues[cfg.period])}</span>
                  </span>
                ) : null
              )}
              {showBB && tooltip.bbValues && (
                <>
                  <span className="text-[#26a69a]">BB↑ <span className="text-[#eaecef]">{fmtPrice(tooltip.bbValues.upper)}</span></span>
                  <span className="text-[#26a69a66]">BB— <span className="text-[#eaecef]">{fmtPrice(tooltip.bbValues.middle)}</span></span>
                  <span className="text-[#26a69a]">BB↓ <span className="text-[#eaecef]">{fmtPrice(tooltip.bbValues.lower)}</span></span>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Main chart + Canvas overlay ─────────────────────────────────── */}
        {/*
          Container này cần position: relative để canvas absolute hoạt động.
          Canvas overlay nằm trên chart, nhận pointer-events khi đang vẽ.
        */}
        <div
          className="relative w-full"
          style={{ flex: '1 1 0', minHeight: 0 }}
        >
          {/* ── Loading older candles banner ── */}
          {isLoadingOlder && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
              <div className="flex items-center gap-2 bg-[#1e2329dd] backdrop-blur-sm border border-[#2b3139] rounded-full px-3 py-1.5 shadow-lg">
                <svg className="animate-spin w-3 h-3 text-[#f0b90b]" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                <span className="text-[10px] text-[#848e9c]">Đang tải nến cũ hơn...</span>
              </div>
            </div>
          )}

          {/* Canvas overlay cho drawing tools */}
          <canvas
            ref={canvasOverlayRef}
            {...canvasProps}
          />

          {/* Main lightweight-chart */}
          <div
            ref={mainContainerRef}
            className="w-full h-full"
            onMouseMove={!isDrawingMode ? handleCursorMove : undefined}
            onMouseLeave={!isDrawingMode ? handleCursorLeave : undefined}
            onMouseDown={() => { if (!isDrawingMode) setIsDragging(true) }}
            onMouseUp={() => setIsDragging(false)}
          />
        </div>

        {/* ── RSI panel ── */}
        <div
          className="flex-shrink-0 border-t border-[#1a1d26] overflow-hidden transition-all duration-200"
          style={{ height: showRSI ? `${panelHeightPct}%` : '0', minHeight: showRSI ? 70 : 0 }}
        >
          <div className="flex items-center gap-2 px-3 py-0.5 bg-[#0b0e11]">
            <span className="text-[9px] text-[#9c27b0] font-medium">RSI({RSI_PERIOD})</span>
            <span className="text-[9px] text-[#f6465d66]">— OB 70</span>
            <span className="text-[9px] text-[#0ecb8166]">— OS 30</span>
          </div>
          <div
            ref={rsiContainerRef}
            className="w-full"
            style={{
              height: 'calc(100% - 20px)',
              cursor: isDragging ? 'grabbing' : 'crosshair',
            }}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
          />
        </div>

        {/* ── MACD panel ── */}
        <div
          className="flex-shrink-0 border-t border-[#1a1d26] overflow-hidden transition-all duration-200"
          style={{ height: showMACD ? `${panelHeightPct}%` : '0', minHeight: showMACD ? 70 : 0 }}
        >
          <div className="flex items-center gap-3 px-3 py-0.5 bg-[#0b0e11]">
            <span className="text-[9px] text-[#64b5f6] font-medium">MACD({MACD_FAST},{MACD_SLOW},{MACD_SIGNAL})</span>
            <span className="text-[9px] text-[#2196f3]">— MACD</span>
            <span className="text-[9px] text-[#ff9800]">— Signal</span>
            <span className="text-[9px] text-[#848e9c]">█ Hist</span>
            {macdTooltip && (
              <span className="ml-1 flex items-center gap-2">
                <span className="text-[9px] text-[#2196f3]">M <span className="text-[#eaecef]">{fmtMacd(macdTooltip.macd)}</span></span>
                <span className="text-[9px] text-[#ff9800]">S <span className="text-[#eaecef]">{fmtMacd(macdTooltip.signal)}</span></span>
                <span className={`text-[9px] ${(macdTooltip.hist ?? 0) >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                  H <span className="text-[#eaecef]">{fmtMacd(macdTooltip.hist)}</span>
                </span>
              </span>
            )}
          </div>
          <div
            ref={macdContainerRef}
            className="w-full"
            style={{
              height: 'calc(100% - 20px)',
              cursor: isDragging ? 'grabbing' : 'crosshair',
            }}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
          />
        </div>

        {/* ── OI History panel (Futures only) ── */}
        {showOI && market === 'futures' && (
          <div className="flex-shrink-0 border-t border-[#1a1d26] overflow-hidden transition-all duration-200"
            style={{ height: 90, minHeight: 90 }}>
            <div className="flex items-center gap-2 px-3 py-0.5 bg-[#0b0e11]">
              <span className="text-[9px] text-[#f0b90b] font-medium">Open Interest</span>
              {oiData.length > 0 && (
                <span className="text-[9px] text-[#eaecef]">
                  {fmtOI(oiData[oiData.length - 1]?.oi ?? 0)}
                </span>
              )}
              {oiData.length > 1 && (() => {
                const cur = oiData[oiData.length - 1]?.oi ?? 0
                const prev = oiData[oiData.length - 2]?.oi ?? 0
                const pct = prev > 0 ? ((cur - prev) / prev * 100) : 0
                return (
                  <span className={`text-[9px] ${pct >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                    {pct >= 0 ? '+' : ''}{pct.toFixed(2)}%
                  </span>
                )
              })()}
              {oiData.length > 0 && (
                <span className="text-[9px] text-[#5e6673]">
                  {oiData.length} điểm{hasMoreOI ? ' · cuộn trái để xem thêm' : ' · đã hết'}
                </span>
              )}
            </div>
            <div
              ref={oiContainerRef}
              className="w-full"
              style={{ height: 'calc(100% - 20px)', cursor: isDragging ? 'grabbing' : 'crosshair' }}
              onMouseDown={() => setIsDragging(true)}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
            />
          </div>
        )}

        {/* ── Taker Buy/Sell Volume panel (Futures only) ── */}
        {showTakerVol && market === 'futures' && (
          <div className="flex-shrink-0 border-t border-[#1a1d26] overflow-hidden transition-all duration-200"
            style={{ height: 100, minHeight: 100 }}>
            <div className="flex items-center gap-2 px-3 py-0.5 bg-[#0b0e11]">
              <span className="text-[9px] text-[#26a69a] font-medium">Taker Volume</span>
              {tvData.length > 0 && (() => {
                const last = tvData[tvData.length - 1]
                const total = last.buyVol + last.sellVol
                const buyPct = total > 0 ? (last.buyVol / total * 100) : 50
                return (
                  <>
                    <span className="text-[9px] text-[#0ecb81]">B {fmtVol(last.buyVol)}</span>
                    <span className="text-[9px] text-[#f6465d]">S {fmtVol(last.sellVol)}</span>
                    <span className={`text-[9px] font-medium ${buyPct >= 50 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                      {buyPct.toFixed(1)}% Buy
                    </span>
                  </>
                )
              })()}
              {tvData.length > 0 && (
                <span className="text-[9px] text-[#5e6673]">
                  {tvData.length} điểm{hasMoreTV ? ' · cuộn trái để xem thêm' : ' · đã hết'}
                </span>
              )}
            </div>
            <div
              ref={tvContainerRef}
              className="w-full"
              style={{ height: 'calc(100% - 20px)', cursor: isDragging ? 'grabbing' : 'crosshair' }}
              onMouseDown={() => setIsDragging(true)}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
            />
          </div>
        )}

        {/* ── Funding Rate History panel (Futures only) ── */}
        {showFR && market === 'futures' && (
          <div className="flex-shrink-0 border-t border-[#1a1d26] overflow-hidden transition-all duration-200"
            style={{ height: 100, minHeight: 100 }}>
            <div className="flex items-center gap-2 px-3 py-0.5 bg-[#0b0e11]">
              <span className="text-[9px] text-[#f0b90b] font-medium">Funding Rate</span>
              {frHistory.length > 0 && (() => {
                const last = frHistory[frHistory.length - 1]
                const pct = last.raw * 100
                return (
                  <>
                    <span className={`text-[9px] font-medium tabular-nums ${pct >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                      {pct >= 0 ? '+' : ''}{pct.toFixed(4)}%
                    </span>
                    <span className="text-[9px] text-[#5e6673]">
                      {pct >= 0 ? '· Long trả Short' : '· Short trả Long'}
                    </span>
                  </>
                )
              })()}
              {frHistory.length > 0 && (
                <span className="text-[9px] text-[#5e6673] ml-auto">
                  {frHistory.length} chu kỳ
                </span>
              )}
            </div>
            <div
              ref={frContainerRef}
              className="w-full"
              style={{ height: 'calc(100% - 20px)', cursor: isDragging ? 'grabbing' : 'crosshair' }}
              onMouseDown={() => setIsDragging(true)}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
            />
          </div>
        )}

        {/* ── CVD — Cumulative Volume Delta panel ── */}
        {showCVD && (
          <div className="flex-shrink-0 border-t border-[#1a1d26] overflow-hidden transition-all duration-200"
            style={{ height: 90, minHeight: 90 }}>
            <div className="flex items-center gap-2 px-3 py-0.5 bg-[#0b0e11]">
              <span className="text-[9px] text-[#e91e63] font-medium">CVD</span>
              {cvdStateRef.current != null && (
                <span className={`text-[9px] font-medium ${cvdStateRef.current.lastCVD >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                  {cvdStateRef.current.lastCVD >= 0 ? '+' : ''}{fmtVol(cvdStateRef.current.lastCVD)}
                </span>
              )}
              <span className="text-[9px] text-[#5e6673]">Buy−Sell taker tích lũy</span>
            </div>
            <div
              ref={cvdContainerRef}
              className="w-full"
              style={{ height: 'calc(100% - 20px)', cursor: isDragging ? 'grabbing' : 'crosshair' }}
              onMouseDown={() => setIsDragging(true)}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
            />
          </div>
        )}

      </div>

      {/* ── Go to Date modal ── */}
      {showGoTo && (
        <GoToDateModal
          onClose={() => setShowGoTo(false)}
          onGoto={(targetUnixSec) => {
            const chart = mainChartRef.current
            if (!chart) return
            // lightweight-charts: scrollToPosition / scrollToRealTime / setVisibleRange
            // Dùng setVisibleRange để nhảy đến mốc thời gian, giữ 100 nến visible
            try {
              chart.timeScale().scrollToPosition(0, false)
              // getVisibleLogicalRange để tính số nến đang hiện
              const range = chart.timeScale().getVisibleLogicalRange()
              const width = range ? (range.to - range.from) : 100
              // Tìm index của nến gần nhất với targetUnixSec
              const data = klineDataRef.current
              if (data.length === 0) return
              let idx = data.findIndex(d => d.time >= targetUnixSec)
              if (idx < 0) idx = data.length - 1
              // Set logical range: center tại idx
              chart.timeScale().setVisibleLogicalRange({
                from: idx - width / 2,
                to: idx + width / 2,
              })
            } catch (e) {
              console.warn('[GoTo]', e)
            }
          }}
        />
      )}
    </div>
  )
}