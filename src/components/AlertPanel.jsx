// src/components/AlertPanel.jsx
// v12: thêm SoundSettings — slider volume + chọn tone

import { useState, useCallback } from 'react'
import { useAlertStore } from '../store/alertStore'
import { useChartStore } from '../store/chartStore'
import { useMarketStore } from '../store/marketStore'

// ── Preview beep dùng Web Audio API ──────────────────────────────────────────
function previewBeep(tone, volume) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = tone
    osc.frequency.value = 660
    const now = ctx.currentTime
    gain.gain.setValueAtTime(Math.min(Math.max(volume, 0.01), 1.0), now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5)
    osc.start(now)
    osc.stop(now + 0.5)
    osc.onended = () => ctx.close().catch(() => { })
  } catch (e) {
    console.warn('[SoundSettings] previewBeep error:', e)
  }
}

const TONE_OPTIONS = [
  { value: 'sine', label: 'Sine', desc: 'Mềm mại' },
  { value: 'square', label: 'Square', desc: 'Sắc nét' },
  { value: 'sawtooth', label: 'Sawtooth', desc: 'Mạnh mẽ' },
  { value: 'triangle', label: 'Triangle', desc: 'Nhẹ nhàng' },
]

// ── SoundSettings sub-component ──────────────────────────────────────────────
function SoundSettings() {
  const { alertVolume, setAlertVolume, alertTone, setAlertTone } = useChartStore()
  const [open, setOpen] = useState(false)

  const handleTone = useCallback((tone) => {
    setAlertTone(tone)
    previewBeep(tone, alertVolume)
  }, [alertVolume, setAlertTone])

  const handleVolume = useCallback((v) => {
    setAlertVolume(v)
  }, [setAlertVolume])

  return (
    <div className="border-b border-[#1a1d26]">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 text-[10px] text-[#848e9c] hover:text-white transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <span>🔊</span>
          <span className="font-medium">Âm thanh cảnh báo</span>
          <span className="text-[#5e6673]">— {TONE_OPTIONS.find(t => t.value === alertTone)?.label} · {Math.round(alertVolume * 100)}%</span>
        </span>
        <svg width="10" height="10" viewBox="0 0 10 10" className={`transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-3">
          {/* Volume slider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-[#5e6673]">Âm lượng</span>
              <span className="text-[10px] text-[#eaecef] font-medium">{Math.round(alertVolume * 100)}%</span>
            </div>
            <input
              type="range" min="0" max="1" step="0.05"
              value={alertVolume}
              onChange={e => handleVolume(parseFloat(e.target.value))}
              onMouseUp={e => previewBeep(alertTone, parseFloat(e.target.value))}
              onTouchEnd={e => previewBeep(alertTone, parseFloat(e.target.value))}
              className="w-full h-1 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #f0b90b ${alertVolume * 100}%, #2b3139 ${alertVolume * 100}%)`
              }}
            />
          </div>

          {/* Tone picker */}
          <div>
            <span className="text-[10px] text-[#5e6673] block mb-1.5">Loại âm</span>
            <div className="grid grid-cols-2 gap-1">
              {TONE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleTone(opt.value)}
                  className={`flex flex-col items-start px-2 py-1.5 rounded border text-left transition-all ${alertTone === opt.value
                      ? 'border-[#f0b90b44] bg-[#f0b90b0f] text-[#f0b90b]'
                      : 'border-[#2b3139] text-[#5e6673] hover:text-white hover:border-[#4c525e]'
                    }`}
                >
                  <span className="text-[10px] font-medium">{opt.label}</span>
                  <span className="text-[9px] opacity-60">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Preview button */}
          <button
            onClick={() => previewBeep(alertTone, alertVolume)}
            className="w-full text-[10px] py-1.5 rounded border border-[#2b3139] text-[#848e9c] hover:text-white hover:border-[#4c525e] transition-colors"
          >
            ▶ Thử âm thanh
          </button>
        </div>
      )}
    </div>
  )
}

function fmtPrice(p) {
  if (p == null || !isFinite(p)) return '---'
  if (p >= 1000) return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (p >= 1) return p.toFixed(4)
  if (p >= 0.001) return p.toFixed(6)
  return p.toFixed(8)
}

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

// ── Sub-component: Form thêm alert mới ────────────────────────────────────
function AddAlertForm({ onAdded }) {
  const { symbol } = useChartStore()
  const prices = useMarketStore(s => s.prices)
  const addAlert = useAlertStore(s => s.addAlert)
  const notifGranted = useAlertStore(s => s.notifGranted)

  const currentPrice = prices[symbol]?.price ?? 0
  const [targetInput, setTargetInput] = useState('')
  const [direction, setDirection] = useState('above')
  const [error, setError] = useState('')

  const baseName = symbol.replace('USDT', '')

  function handleAdd() {
    const val = parseFloat(targetInput)
    if (!val || val <= 0) {
      setError('Nhập giá hợp lệ')
      return
    }
    if (direction === 'above' && val <= currentPrice) {
      setError(`Giá "vượt qua" phải > ${fmtPrice(currentPrice)}`)
      return
    }
    if (direction === 'below' && val >= currentPrice) {
      setError(`Giá "giảm xuống" phải < ${fmtPrice(currentPrice)}`)
      return
    }
    addAlert(symbol, val, direction)
    setTargetInput('')
    setError('')
    onAdded?.()
  }

  return (
    <div className="p-3 border-b border-[#1a1d26]">
      <p className="text-[11px] text-[#848e9c] mb-2 font-medium">
        Thêm alert — <span className="text-white">{baseName}/USDT</span>
        <span className="ml-2 text-[#5e6673]">@ {fmtPrice(currentPrice)}</span>
      </p>

      {/* Direction toggle */}
      <div className="flex rounded overflow-hidden border border-[#2b3139] text-[11px] mb-2 w-full">
        {[
          { value: 'above', label: '▲ Vượt qua', activeClass: 'bg-[#0ecb81] text-black' },
          { value: 'below', label: '▼ Giảm xuống', activeClass: 'bg-[#f6465d] text-white' },
        ].map(opt => (
          <button key={opt.value} onClick={() => { setDirection(opt.value); setError('') }}
            className={`flex-1 py-1.5 font-medium transition-colors ${direction === opt.value
                ? opt.activeClass
                : 'text-[#848e9c] hover:text-white hover:bg-[#1e2329]'
              }`}>
            {opt.label}
          </button>
        ))}
      </div>

      {/* Price input + button */}
      <div className="flex gap-2">
        <input
          type="number"
          placeholder={`Giá mục tiêu...`}
          value={targetInput}
          onChange={e => { setTargetInput(e.target.value); setError('') }}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          className="flex-1 bg-[#1e2329] text-white text-xs px-2.5 py-1.5 rounded border border-[#2b3139] focus:border-[#f0b90b] focus:outline-none placeholder-[#5e6673]"
        />
        <button onClick={handleAdd}
          className="px-3 py-1.5 bg-[#f0b90b] text-black text-xs font-bold rounded hover:bg-[#f0b90bcc] transition-colors">
          Thêm
        </button>
      </div>

      {error && <p className="text-[#f6465d] text-[10px] mt-1">{error}</p>}

      {/* Notification warning */}
      {!notifGranted && (
        <div className="mt-2 text-[10px] text-[#f0b90b] bg-[#f0b90b11] border border-[#f0b90b33] rounded px-2 py-1.5">
          ⚠️ Chưa cấp quyền notification — âm thanh sẽ vẫn báo, nhưng không hiện popup
        </div>
      )}
    </div>
  )
}

// ── Sub-component: Một dòng alert ─────────────────────────────────────────
function AlertRow({ alert }) {
  const removeAlert = useAlertStore(s => s.removeAlert)
  const prices = useMarketStore(s => s.prices)
  const currentPrice = prices[alert.symbol]?.price ?? 0
  const baseName = alert.symbol.replace('USDT', '')

  const dist = alert.direction === 'above'
    ? ((alert.targetPrice - currentPrice) / currentPrice * 100)
    : ((currentPrice - alert.targetPrice) / currentPrice * 100)

  const distText = isFinite(dist) ? `${Math.abs(dist).toFixed(2)}% away` : ''

  return (
    <div className={`flex items-center justify-between px-3 py-2.5 border-b border-[#1a1d26]/60 ${alert.triggered ? 'opacity-50' : ''
      }`}>
      <div className="flex flex-col gap-0.5 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`text-[9px] font-bold px-1 rounded ${alert.direction === 'above'
              ? 'bg-[#0ecb8122] text-[#0ecb81]'
              : 'bg-[#f6465d22] text-[#f6465d]'
            }`}>
            {alert.direction === 'above' ? '▲' : '▼'}
          </span>
          <span className="text-white text-[11px] font-medium">{baseName}/USDT</span>
          {alert.triggered && (
            <span className="text-[9px] bg-[#f0b90b22] text-[#f0b90b] px-1 rounded">✓ Đã kích hoạt</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#eaecef] text-[11px]">{fmtPrice(alert.targetPrice)}</span>
          {!alert.triggered && distText && (
            <span className="text-[9px] text-[#5e6673]">{distText}</span>
          )}
        </div>
        <span className="text-[9px] text-[#5e6673]">{timeAgo(alert.createdAt)}</span>
      </div>

      <button onClick={() => removeAlert(alert.id)}
        className="text-[#5e6673] hover:text-[#f6465d] transition-colors p-1 rounded hover:bg-[#f6465d11] ml-2 flex-shrink-0">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}

function fmtDateTime(ts) {
  const d = new Date(ts)
  const pad = n => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

// ── History Row ───────────────────────────────────────────────────────────
function HistoryRow({ entry }) {
  const baseName = entry.symbol.replace('USDT', '')
  const isAbove = entry.direction === 'above'
  const diff = entry.triggeredPrice - entry.targetPrice
  const diffPct = (Math.abs(diff) / entry.targetPrice * 100).toFixed(3)

  return (
    <div className="px-3 py-2.5 border-b border-[#1a1d26]/60 hover:bg-[#0d1117] transition-colors">
      {/* Row 1: coin + direction + time */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span className={`text-[9px] font-bold px-1 rounded ${isAbove ? 'bg-[#0ecb8122] text-[#0ecb81]' : 'bg-[#f6465d22] text-[#f6465d]'}`}>
            {isAbove ? '▲' : '▼'}
          </span>
          <span className="text-[11px] font-semibold text-white">{baseName}/USDT</span>
        </div>
        <span className="text-[9px] text-[#5e6673]">{fmtDateTime(entry.triggeredAt)}</span>
      </div>

      {/* Row 2: target → triggered price */}
      <div className="flex items-center gap-1.5 text-[10px]">
        <span className="text-[#5e6673]">Mục tiêu</span>
        <span className="text-[#eaecef] font-medium">{fmtPrice(entry.targetPrice)}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" className="text-[#5e6673] flex-shrink-0">
          <path d="M2 5h6M6 3l2 2-2 2" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-[#5e6673]">Giá kích hoạt</span>
        <span className={`font-semibold ${isAbove ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
          {fmtPrice(entry.triggeredPrice)}
        </span>
        <span className="text-[#5e6673] ml-auto text-[9px]">±{diffPct}%</span>
      </div>
    </div>
  )
}

// ── Tooltip hướng dẫn sử dụng ─────────────────────────────────────────────
function HelpTooltip() {
  const [show, setShow] = useState(false)

  return (
    <div className="relative">
      {/* Icon i */}
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(v => !v)}
        className="w-4 h-4 rounded-full border border-[#4c525e] text-[#5e6673] hover:border-[#f0b90b] hover:text-[#f0b90b] transition-colors flex items-center justify-center flex-shrink-0"
        aria-label="Hướng dẫn sử dụng"
      >
        <span className="text-[9px] font-bold leading-none">i</span>
      </button>

      {/* Tooltip box */}
      {show && (
        <div className="absolute top-6 right-0 z-50 w-64 bg-[#1e2329] border border-[#2b3139] rounded-lg shadow-2xl p-3 text-[11px] text-[#848e9c] leading-relaxed">

          {/* Tiêu đề */}
          <p className="text-white font-semibold mb-2 text-[12px]">📖 Cách sử dụng</p>

          {/* Bước 1 */}
          <div className="mb-2">
            <p className="text-[#f0b90b] font-medium mb-0.5">① Chọn coin</p>
            <p>Click vào coin muốn theo dõi ở sidebar trái. Giá hiện tại sẽ hiển thị ở trên form.</p>
          </div>

          {/* Bước 2 */}
          <div className="mb-2">
            <p className="text-[#f0b90b] font-medium mb-0.5">② Chọn hướng</p>
            <p>
              <span className="text-[#0ecb81] font-medium">▲ Vượt qua</span>
              {' '}— báo khi giá tăng lên chạm ngưỡng
            </p>
            <p>
              <span className="text-[#f6465d] font-medium">▼ Giảm xuống</span>
              {' '}— báo khi giá giảm xuống chạm ngưỡng
            </p>
          </div>

          {/* Bước 3 */}
          <div className="mb-3">
            <p className="text-[#f0b90b] font-medium mb-0.5">③ Nhập giá & bấm Thêm</p>
            <p>Nhập giá mục tiêu, có thể dùng Enter để xác nhận nhanh.</p>
          </div>

          {/* Divider */}
          <div className="border-t border-[#2b3139] my-2" />

          {/* Ví dụ */}
          <p className="text-white font-semibold mb-1.5">💡 Ví dụ</p>
          <div className="bg-[#0b0e11] rounded p-2 space-y-1.5">
            <div className="flex items-start gap-1.5">
              <span className="text-[#0ecb81] text-[10px] mt-0.5">▲</span>
              <p>BTC đang <span className="text-white">76,000</span> — muốn biết khi phá <span className="text-white">77,000</span>: chọn <span className="text-[#0ecb81]">Vượt qua</span> → nhập <span className="text-white">77000</span></p>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-[#f6465d] text-[10px] mt-0.5">▼</span>
              <p>ETH đang <span className="text-white">2,300</span> — muốn biết khi rớt <span className="text-white">2,200</span>: chọn <span className="text-[#f6465d]">Giảm xuống</span> → nhập <span className="text-white">2200</span></p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-[#2b3139] my-2" />

          {/* Khi kích hoạt */}
          <p className="text-white font-semibold mb-1">🔔 Khi giá chạm ngưỡng</p>
          <p>App sẽ phát <span className="text-white">âm thanh beep</span> và hiện <span className="text-white">browser notification</span> (cần cấp quyền).</p>
          <p className="mt-1 text-[#5e6673]">Alert đã kích hoạt sẽ chuyển sang mờ — bấm ✕ để xóa.</p>
        </div>
      )}
    </div>
  )
}

// ── Main AlertPanel component ──────────────────────────────────────────────
export default function AlertPanel({ onClose }) {
  const alerts = useAlertStore(s => s.alerts)
  const clearTriggered = useAlertStore(s => s.clearTriggered)
  const notifHistory = useAlertStore(s => s.notifHistory)
  const clearNotifHistory = useAlertStore(s => s.clearNotifHistory)

  const [tab, setTab] = useState('alerts')  // 'alerts' | 'history'

  const active = alerts.filter(a => !a.triggered)
  const triggered = alerts.filter(a => a.triggered)

  return (
    <div className="flex flex-col h-full bg-[#0b0e11]">

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#1a1d26] flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-semibold text-white">🔔 Price Alerts</span>
          {active.length > 0 && (
            <span className="bg-[#f0b90b] text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full">
              {active.length}
            </span>
          )}
          <HelpTooltip />
        </div>
        <button onClick={onClose}
          className="text-[#5e6673] hover:text-white transition-colors text-sm">✕</button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#1a1d26] flex-shrink-0">
        {[
          { id: 'alerts', label: 'Alerts' },
          { id: 'history', label: 'History', badge: notifHistory.length > 0 ? notifHistory.length : null },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium transition-colors relative"
            style={{
              color: tab === t.id ? '#f0b90b' : '#566475',
              borderBottom: tab === t.id ? '2px solid #f0b90b' : '2px solid transparent',
            }}
          >
            {t.label}
            {t.badge && (
              <span className="text-[8px] font-bold px-1 py-0.5 rounded-full"
                style={{ background: '#f0b90b22', color: '#f0b90b' }}>
                {t.badge > 99 ? '99+' : t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── TAB: Alerts ── */}
      {tab === 'alerts' && (
        <>
          {/* Add form */}
          <AddAlertForm />

          {/* Sound settings */}
          <SoundSettings />

          {/* Alert list */}
          <div className="flex-1 overflow-y-auto scrollbar-thin">

            {/* Active alerts */}
            {active.length > 0 && (
              <>
                <div className="px-3 py-1.5 text-[9px] text-[#5e6673] uppercase tracking-wider font-medium">
                  Đang chờ ({active.length})
                </div>
                {active.map(a => <AlertRow key={a.id} alert={a} />)}
              </>
            )}

            {/* Triggered alerts */}
            {triggered.length > 0 && (
              <>
                <div className="flex items-center justify-between px-3 py-1.5">
                  <span className="text-[9px] text-[#5e6673] uppercase tracking-wider font-medium">
                    Đã kích hoạt ({triggered.length})
                  </span>
                  <button onClick={clearTriggered}
                    className="text-[9px] text-[#f6465d] hover:text-[#f6465dcc] transition-colors">
                    Xóa tất cả
                  </button>
                </div>
                {triggered.map(a => <AlertRow key={a.id} alert={a} />)}
              </>
            )}

            {/* Empty state */}
            {alerts.length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 gap-2">
                <span className="text-2xl">🔕</span>
                <span className="text-[#5e6673] text-xs text-center px-4">
                  Chưa có alert nào<br />Thêm alert để nhận thông báo khi giá chạm ngưỡng
                </span>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── TAB: History ── */}
      {tab === 'history' && (
        <div className="flex flex-col flex-1 min-h-0">
          {/* History header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-[#1a1d26] flex-shrink-0">
            <span className="text-[10px] text-[#5e6673]">
              {notifHistory.length > 0 ? `${notifHistory.length} lần kích hoạt (tối đa 100)` : 'Chưa có lịch sử'}
            </span>
            {notifHistory.length > 0 && (
              <button
                onClick={clearNotifHistory}
                className="text-[9px] text-[#f6465d] hover:text-[#f6465dcc] transition-colors"
              >
                Xóa tất cả
              </button>
            )}
          </div>

          {/* History list */}
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {notifHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-2">
                <span className="text-2xl">📋</span>
                <span className="text-[#5e6673] text-xs text-center px-4">
                  Chưa có lịch sử<br />Lịch sử sẽ lưu khi alert được kích hoạt
                </span>
              </div>
            ) : (
              notifHistory.map((entry, idx) => (
                <HistoryRow key={`${entry.id}-${entry.triggeredAt}-${idx}`} entry={entry} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}