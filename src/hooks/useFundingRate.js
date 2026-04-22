// src/hooks/useFundingRate.js
// v11: thêm auto-reconnect WS (fix known issue) + Open Interest polling
//
// FIX: WS onclose trước đây chỉ cleanup, không reconnect
//   → Futures WS hay bị drop → funding rate frozen sau vài phút
// FIX: Thêm Open Interest từ REST (poll mỗi 30s vì không có WS stream)

import { useEffect, useRef, useState } from 'react'
import { getPremiumIndex, getOpenInterest } from '../services/binanceApi'

const FUTURES_WS = 'wss://fstream.binance.com/ws/'

export function useFundingRate(symbol, market) {
  const [data, setData] = useState(null)
  // data = { markPrice, indexPrice, fundingRate, nextFundingTime, interestRate, openInterest }

  const wsRef = useRef(null)
  const reconnTimRef = useRef(null)
  const oiTimRef = useRef(null)
  const cancelledRef = useRef(false)

  useEffect(() => {
    if (market !== 'futures' || !symbol) {
      setData(null)
      return
    }

    cancelledRef.current = false

    // ── Fetch REST snapshot ngay lập tức ───────────────────────────────
    getPremiumIndex(symbol)
      .then(d => {
        if (cancelledRef.current) return
        setData(prev => ({
          ...(prev ?? {}),
          markPrice: parseFloat(d.markPrice),
          indexPrice: parseFloat(d.indexPrice),
          fundingRate: parseFloat(d.lastFundingRate),
          nextFundingTime: d.nextFundingTime,
          interestRate: parseFloat(d.interestRate ?? 0),
        }))
      })
      .catch(e => console.warn('[FundingRate REST]', e))

    // ── Fetch Open Interest (REST only — không có WS stream) ───────────
    function fetchOI() {
      if (cancelledRef.current) return
      getOpenInterest(symbol)
        .then(d => {
          if (cancelledRef.current) return
          setData(prev => prev
            ? { ...prev, openInterest: parseFloat(d.openInterest) }
            : { openInterest: parseFloat(d.openInterest) }
          )
        })
        .catch(e => console.warn('[OpenInterest REST]', e))
    }

    fetchOI()
    // Poll mỗi 30s (OI thay đổi chậm, không cần realtime)
    oiTimRef.current = setInterval(fetchOI, 30_000)

    // ── WS markPrice stream với auto-reconnect ─────────────────────────
    function connectWS() {
      if (cancelledRef.current) return

      const streamUrl = `${FUTURES_WS}${symbol.toLowerCase()}@markPrice`
      const ws = new WebSocket(streamUrl)
      wsRef.current = ws

      ws.onmessage = (event) => {
        if (cancelledRef.current) return
        try {
          const d = JSON.parse(event.data)
          setData(prev => ({
            ...(prev ?? {}),
            markPrice: parseFloat(d.p),
            indexPrice: parseFloat(d.i),
            fundingRate: parseFloat(d.r),
            nextFundingTime: d.T,
            interestRate: parseFloat(d.q ?? 0),
          }))
        } catch (e) {
          console.error('[FundingRate WS parse]', e)
        }
      }

      ws.onerror = () => {
        if (!cancelledRef.current) console.warn('[FundingRate WS] Error')
      }

      ws.onclose = () => {
        if (cancelledRef.current) return
        // AUTO-RECONNECT sau 5s (fix v11 — trước đây chỉ cleanup)
        console.log('[FundingRate WS] Closed, reconnect in 5s')
        reconnTimRef.current = setTimeout(() => {
          if (!cancelledRef.current) connectWS()
        }, 5000)
      }
    }

    connectWS()

    return () => {
      cancelledRef.current = true
      clearTimeout(reconnTimRef.current)
      clearInterval(oiTimRef.current)
      const ws = wsRef.current
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        ws.close()
      }
      wsRef.current = null
    }
  }, [symbol, market])

  return data
}