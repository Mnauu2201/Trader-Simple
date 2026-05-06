// src/hooks/useAlertChecker.js — v30: thêm alert theo % change

import { useEffect, useRef } from 'react'
import { useMarketStore } from '../store/marketStore'
import { useAlertStore } from '../store/alertStore'
import { useChartStore } from '../store/chartStore'

function fmtPrice(p) {
  if (p == null || !isFinite(p)) return '---'
  if (p >= 1000) return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (p >= 1) return p.toFixed(4)
  if (p >= 0.001) return p.toFixed(6)
  return p.toFixed(8)
}

// Phát âm thanh báo hiệu — tone và volume đến từ chartStore
function playBeep(direction, tone = 'sine', volume = 0.4) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return

    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.type = tone
    osc.frequency.value = direction === 'above' ? 880 : 440
    const vol = Math.min(Math.max(volume, 0.01), 1.0)

    const now = ctx.currentTime
    gain.gain.setValueAtTime(vol, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6)

    osc.start(now)
    osc.stop(now + 0.6)

    osc.onended = () => { ctx.close().catch(() => { }) }
  } catch (err) {
    console.warn('[Alert] playBeep error:', err)
  }
}

export function useAlertChecker() {
  const prices = useMarketStore(s => s.prices)
  const alerts = useAlertStore(s => s.alerts)
  const markTriggered = useAlertStore(s => s.markTriggered)
  const setNotifGranted = useAlertStore(s => s.setNotifGranted)
  const addNotifHistory = useAlertStore(s => s.addNotifHistory)
  const alertVolume = useChartStore(s => s.alertVolume)
  const alertTone = useChartStore(s => s.alertTone)

  // Xin quyền notification khi mount
  useEffect(() => {
    if (!('Notification' in window)) return
    if (Notification.permission === 'granted') {
      setNotifGranted(true)
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(perm => {
        setNotifGranted(perm === 'granted')
      })
    }
  }, [])

  // Refs để tránh stale closure trong effect
  const alertsRef = useRef(alerts)
  useEffect(() => { alertsRef.current = alerts }, [alerts])

  const markTriggeredRef = useRef(markTriggered)
  useEffect(() => { markTriggeredRef.current = markTriggered }, [markTriggered])

  const addNotifHistoryRef = useRef(addNotifHistory)
  useEffect(() => { addNotifHistoryRef.current = addNotifHistory }, [addNotifHistory])

  const soundRef = useRef({ volume: alertVolume, tone: alertTone })
  useEffect(() => { soundRef.current = { volume: alertVolume, tone: alertTone } }, [alertVolume, alertTone])

  // Mỗi khi prices thay đổi → check alerts
  useEffect(() => {
    const activeAlerts = alertsRef.current.filter(a => !a.triggered)
    if (!activeAlerts.length) return

    activeAlerts.forEach(alert => {
      const data = prices[alert.symbol]
      if (!data?.price || !isFinite(data.price)) return

      const currentPrice = data.price
      let hit = false
      let notifBody = ''

      if (alert.type === 'percent') {
        // ── % change alert ───────────────────────────────────────────────────
        const change = data.change24h   // số thực, e.g. 5.23 hoặc -3.1
        if (change == null || !isFinite(change)) return

        const pv = alert.percentValue ?? 0
        if (alert.percentDir === 'above') {
          hit = change >= pv
        } else if (alert.percentDir === 'below') {
          hit = change <= -pv
        } else {
          // 'either' — |change| >= pv
          hit = Math.abs(change) >= pv
        }

        if (!hit) return

        const dirLabel = alert.percentDir === 'above'
          ? `▲ +${pv}%`
          : alert.percentDir === 'below'
            ? `▼ -${pv}%`
            : `⚡ |${pv}%|`
        const baseName = alert.symbol.replace('USDT', '')
        const sign = change >= 0 ? '+' : ''
        notifBody = `${dirLabel} triggered\n24h change: ${sign}${change.toFixed(2)}%\nGiá: ${fmtPrice(currentPrice)}`

      } else {
        // ── price alert (logic gốc) ──────────────────────────────────────────
        hit = alert.direction === 'above'
          ? currentPrice >= alert.targetPrice
          : currentPrice <= alert.targetPrice

        if (!hit) return

        const dirText = alert.direction === 'above' ? '▲ Vượt qua' : '▼ Giảm xuống'
        notifBody = `${dirText} ${fmtPrice(alert.targetPrice)}\nGiá hiện tại: ${fmtPrice(currentPrice)}`
      }

      markTriggeredRef.current(alert.id)

      // Ghi vào notification history
      addNotifHistoryRef.current({
        id: alert.id,
        symbol: alert.symbol,
        type: alert.type ?? 'price',
        targetPrice: alert.targetPrice,
        percentValue: alert.percentValue,
        percentDir: alert.percentDir,
        triggeredPrice: currentPrice,
        triggeredChange: data.change24h,
        direction: alert.direction,
        triggeredAt: Date.now(),
      })

      // Phát âm
      const beepDir = (alert.type === 'percent')
        ? (data.change24h >= 0 ? 'above' : 'below')
        : alert.direction
      playBeep(beepDir, soundRef.current.tone, soundRef.current.volume)

      // Browser notification
      const baseName = alert.symbol.replace('USDT', '')
      const title = `🔔 Alert: ${baseName}/USDT`

      if (Notification.permission === 'granted') {
        try {
          const notif = new Notification(title, {
            body: notifBody,
            icon: '/favicon.ico',
            tag: `alert-${alert.id}`,
            requireInteraction: false,
          })
          setTimeout(() => notif.close(), 8000)
        } catch (e) {
          console.warn('[Alert] Notification error:', e)
        }
      }

      console.log(`[Alert] TRIGGERED: ${alert.symbol} type=${alert.type ?? 'price'}`, alert)
    })
  }, [prices])
}