// src/hooks/useKlineData.js
// v5: Infinite scroll backward — tự động fetch thêm nến cũ khi scroll đến đầu chart
//
// Thay đổi so với v4:
// - Export thêm loadMoreRef để ChartPanel gọi khi cần load thêm
// - Thêm hàm loadOlderCandles(endTime) fetch 500 nến cũ hơn rồi prepend vào chart
// - Giữ nguyên toàn bộ WS reconnect / REST retry logic

import { useEffect, useRef, useCallback } from 'react'
import { getKlines } from '../services/binanceApi'

const SPOT_WS = 'wss://stream.binance.com:443/ws/'
const FUTURES_WS = 'wss://fstream.binance.com/ws/'
const LOAD_LIMIT = 500   // số nến mỗi lần fetch

function waitForRef(ref, intervalMs = 16, timeoutMs = 3000) {
  return new Promise((resolve, reject) => {
    if (ref.current) { resolve(ref.current); return }
    const start = Date.now()
    const id = setInterval(() => {
      if (ref.current) {
        clearInterval(id)
        resolve(ref.current)
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(id)
        reject(new Error('waitForRef timeout'))
      }
    }, intervalMs)
  })
}

async function getKlinesWithRetry(symbol, interval, limit, market, endTime = null, maxRetry = 3) {
  for (let i = 0; i < maxRetry; i++) {
    try {
      const data = await getKlines(symbol, interval, limit, market, endTime)
      if (data && data.length > 0) return data
      throw new Error('Empty data')
    } catch (e) {
      console.warn(`[Kline REST] attempt ${i + 1} failed: ${e.message}`)
      if (i < maxRetry - 1) await new Promise(r => setTimeout(r, 1000 * (i + 1)))
    }
  }
  throw new Error(`[Kline REST] all ${maxRetry} retries failed`)
}

export function useKlineData(
  candleRef,
  volumeRef,
  symbol,
  interval,
  market = 'futures',
  onData = null,
  onUpdate = null,
  onPrepend = null,   // callback(olderData) khi load thêm nến cũ
  loadMoreRef = null,   // ref được gán hàm loadOlderCandles — ChartPanel gọi khi scroll đến đầu
) {
  const onUpdateRef = useRef(onUpdate)
  const onDataRef = useRef(onData)
  const onPrependRef = useRef(onPrepend)
  useEffect(() => { onUpdateRef.current = onUpdate }, [onUpdate])
  useEffect(() => { onDataRef.current = onData }, [onData])
  useEffect(() => { onPrependRef.current = onPrepend }, [onPrepend])

  // earliestTimeRef: Unix seconds của nến cũ nhất đang có — dùng làm endTime khi load thêm
  const earliestTimeRef = useRef(null)
  const isLoadingMore = useRef(false)
  const hasMoreData = useRef(true)  // false khi API trả về ít hơn LOAD_LIMIT nến

  useEffect(() => {
    let cancelled = false
    let dataReady = false
    let wsBuffer = []
    let ws = null
    let reconnectTimer = null

    // Reset
    earliestTimeRef.current = null
    isLoadingMore.current = false
    hasMoreData.current = true

    async function start() {
      try {
        await waitForRef(candleRef)
      } catch (e) {
        console.warn('[Kline] candleRef timeout — chart chưa init')
        return
      }
      if (cancelled) return
      connectWS()
      loadREST()
    }

    function connectWS() {
      if (cancelled) return
      const base = market === 'futures' ? FUTURES_WS : SPOT_WS
      ws = new WebSocket(`${base}${symbol.toLowerCase()}@kline_${interval}`)

      ws.onopen = () => {
        if (cancelled) { ws.close(); return }
        console.log(`[Kline WS] ${market.toUpperCase()} ${symbol} ${interval} connected`)
      }

      ws.onmessage = (event) => {
        if (cancelled) return
        try {
          const { k } = JSON.parse(event.data)
          const candle = {
            time: Math.floor(k.t / 1000),
            open: parseFloat(k.o),
            high: parseFloat(k.h),
            low: parseFloat(k.l),
            close: parseFloat(k.c),
            volume: parseFloat(k.v),
            takerBuyVol: parseFloat(k.V ?? 0),
            takerBuyQuoteVol: parseFloat(k.Q ?? 0),
          }
          if (!dataReady) {
            wsBuffer.push(candle)
            return
          }
          applyCandle(candle)
        } catch (e) {
          console.error('[Kline WS parse]', e)
        }
      }

      ws.onerror = () => { if (!cancelled) console.warn(`[Kline WS] ${market} error`) }

      ws.onclose = (e) => {
        if (cancelled) return
        console.log(`[Kline WS] ${market} closed (${e.code}), reconnect in 3s`)
        reconnectTimer = setTimeout(() => { if (!cancelled) connectWS() }, 3000)
      }
    }

    async function loadREST() {
      try {
        const data = await getKlinesWithRetry(symbol, interval, LOAD_LIMIT, market)
        if (cancelled || !candleRef.current) return

        candleRef.current.setData(data)

        if (volumeRef.current) {
          volumeRef.current.setData(data.map(d => ({
            time: d.time,
            value: d.volume,
            color: d.close >= d.open ? '#0ecb8155' : '#f6465d55',
          })))
        }

        // Ghi nhớ nến cũ nhất
        if (data.length > 0) earliestTimeRef.current = data[0].time

        // Nếu trả về ít hơn limit → đã hết data
        if (data.length < LOAD_LIMIT) hasMoreData.current = false

        if (onDataRef.current) onDataRef.current(data)

        dataReady = true

        if (wsBuffer.length > 0) {
          const deduped = new Map()
          wsBuffer.forEach(c => deduped.set(c.time, c))
          deduped.forEach(candle => applyCandle(candle))
          wsBuffer = []
        }
      } catch (e) {
        if (!cancelled) console.error('[Kline REST] all retries failed:', e.message)
      }
    }

    function applyCandle(candle) {
      if (cancelled || !candleRef.current) return
      candleRef.current.update(candle)
      if (volumeRef.current) {
        volumeRef.current.update({
          time: candle.time,
          value: candle.volume,
          color: candle.close >= candle.open ? '#0ecb8155' : '#f6465d55',
        })
      }
      if (onUpdateRef.current) onUpdateRef.current(candle)
    }

    // ── loadOlderCandles: fetch 500 nến cũ hơn, prepend vào chart ──────────
    async function loadOlderCandles() {
      if (isLoadingMore.current || !hasMoreData.current) return
      if (!earliestTimeRef.current) return
      if (cancelled || !candleRef.current) return

      isLoadingMore.current = true

      try {
        // endTime = (nến cũ nhất - 1) * 1000 ms → lấy nến TRƯỚC đó
        const endTimeMs = (earliestTimeRef.current - 1) * 1000
        const older = await getKlinesWithRetry(symbol, interval, LOAD_LIMIT, market, endTimeMs)
        if (cancelled || !candleRef.current) return

        if (!older || older.length === 0) {
          hasMoreData.current = false
          return
        }

        if (older.length < LOAD_LIMIT) hasMoreData.current = false

        // Cập nhật earliestTime
        earliestTimeRef.current = older[0].time

        // Notify ChartPanel để prepend data vào klineDataRef + tính lại indicators
        if (onPrependRef.current) onPrependRef.current(older)

        // Prepend vào chart series
        // lightweight-charts v4+: dùng setData với toàn bộ data (prepend)
        // Lấy data hiện tại từ candleRef không khả thi trực tiếp,
        // nên ChartPanel sẽ tự gọi setData sau khi merge trong onPrepend callback
      } catch (e) {
        console.warn('[Kline loadOlder] failed:', e.message)
      } finally {
        isLoadingMore.current = false
      }
    }

    // Gán hàm ra ngoài để ChartPanel subscribe
    if (loadMoreRef) loadMoreRef.current = loadOlderCandles

    start()

    return () => {
      cancelled = true
      dataReady = false
      wsBuffer = []
      if (loadMoreRef) loadMoreRef.current = null
      clearTimeout(reconnectTimer)
      if (ws) {
        ws.onopen = ws.onmessage = ws.onerror = ws.onclose = null
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) ws.close()
        ws = null
      }
    }
  }, [symbol, interval, market])
}