// src/hooks/useBinanceWS.js
// v2 fixes:
// - Chia symbols thành batch nhỏ (40/connection) thay vì 1 URL cực dài
// - URL quá dài → server trả lỗi hoặc timeout → lag toàn bộ sidebar
// - Binance giới hạn 200 streams/connection, nhưng URL dài cũng gây vấn đề

import { useEffect, useRef } from 'react'
import { useMarketStore } from '../store/marketStore'

const SPOT_WS = 'wss://stream.binance.com:443/stream?streams='
const FUTURES_WS = 'wss://fstream.binance.com/stream?streams='
const BATCH_SIZE = 40  // 40 symbols × 1 stream = 40 streams/connection, an toàn

export function useBinanceWS(symbols, market = 'futures') {
  const updatePrice = useMarketStore(s => s.updatePrice)
  const wsListRef = useRef([])
  const reconnectTimers = useRef([])

  useEffect(() => {
    if (!symbols || symbols.length === 0) return

    let cancelled = false

    // Cleanup helper
    function closeAll() {
      reconnectTimers.current.forEach(t => clearTimeout(t))
      reconnectTimers.current = []
      wsListRef.current.forEach(ws => {
        if (ws) {
          ws.onopen = ws.onmessage = ws.onerror = ws.onclose = null
          if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
            ws.close()
          }
        }
      })
      wsListRef.current = []
    }

    // Chia symbols thành batches
    const batches = []
    for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
      batches.push(symbols.slice(i, i + BATCH_SIZE))
    }

    const baseUrl = market === 'futures' ? FUTURES_WS : SPOT_WS

    function connectBatch(batchIndex) {
      if (cancelled) return
      const batch = batches[batchIndex]
      if (!batch) return

      const streams = batch.map(s => `${s.toLowerCase()}@ticker`).join('/')
      const ws = new WebSocket(baseUrl + streams)
      wsListRef.current[batchIndex] = ws

      ws.onopen = () => {
        if (cancelled) { ws.close(); return }
        // Stagger log để không spam console
        if (batchIndex === 0) console.log(`[${market.toUpperCase()} WS] Connected, ${batches.length} batches, ${symbols.length} symbols`)
      }

      ws.onmessage = (event) => {
        if (cancelled) return
        try {
          const msg = JSON.parse(event.data)
          const t = msg.data
          if (!t || !t.s) return
          updatePrice(t.s, {
            price: parseFloat(t.c),
            change24h: parseFloat(t.P),
            changePct: parseFloat(t.P),
            changeAbs: parseFloat(t.p),
            high24h: parseFloat(t.h),
            low24h: parseFloat(t.l),
            volume: parseFloat(t.v),
            quoteVolume: parseFloat(t.q),
            openPrice: parseFloat(t.o),
            prevClose: parseFloat(t.x),
            bestBid: parseFloat(t.b),
            bestAsk: parseFloat(t.a),
            market,
          })
        } catch (e) {
          console.error('[WS] Parse error:', e)
        }
      }

      ws.onerror = () => {
        if (!cancelled) console.warn(`[${market} WS] Batch ${batchIndex} error`)
      }

      ws.onclose = (e) => {
        if (cancelled) return
        // Stagger reconnect: batch 0 sau 3s, batch 1 sau 3.5s... tránh thundering herd
        const delay = 3000 + batchIndex * 500
        reconnectTimers.current[batchIndex] = setTimeout(() => connectBatch(batchIndex), delay)
      }
    }

    // Stagger kết nối các batches để tránh mở đồng thời quá nhiều connections
    batches.forEach((_, i) => {
      reconnectTimers.current[i] = setTimeout(() => connectBatch(i), i * 200)
    })

    return () => {
      cancelled = true
      closeAll()
    }
  }, [symbols.join(',').slice(0, 200), market])
  // slice(0,200) để tránh dependency string quá dài gây re-render không cần thiết
  // chỉ watch 200 ký tự đầu của danh sách — đủ để detect thay đổi symbol list

  return wsListRef
}