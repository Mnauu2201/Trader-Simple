// src/hooks/useOrderBook.js
// v13: Order book realtime từ WS @depth5
//
// Pattern: giống useFundingRate — cancelledRef + auto-reconnect 5s
// Data: { bids: [[price, qty], ...], asks: [[price, qty], ...] } — top 5 mỗi bên
// KHÔNG dùng useState lưu raw WS data — dùng useRef + RAF để batch update
// tránh re-render 60fps khi orderbook cập nhật liên tục

import { useEffect, useRef, useState } from 'react'

const SPOT_WS = 'wss://stream.binance.com:443/ws/'
const FUTURES_WS = 'wss://fstream.binance.com/ws/'

export function useOrderBook(symbol, market) {
  const [book, setBook] = useState(null)
  // book = { bids: [[price, qty], ...x5], asks: [[price, qty], ...x5], lastUpdate: ts }

  const wsRef = useRef(null)
  const reconnTimRef = useRef(null)
  const cancelledRef = useRef(false)
  const rafRef = useRef(null)
  const pendingRef = useRef(null) // pending data chờ RAF flush

  useEffect(() => {
    if (!symbol) return

    cancelledRef.current = false

    function connectWS() {
      if (cancelledRef.current) return

      const base = market === 'futures' ? FUTURES_WS : SPOT_WS
      const stream = `${symbol.toLowerCase()}@depth5@100ms`
      const ws = new WebSocket(base + stream)
      wsRef.current = ws

      ws.onopen = () => {
        if (cancelledRef.current) { ws.close(); return }
        console.log(`[OrderBook WS] ${market.toUpperCase()} ${symbol} connected`)
      }

      ws.onmessage = (event) => {
        if (cancelledRef.current) return
        try {
          const d = JSON.parse(event.data)

          // Spot: { bids, asks } / Futures: { b, a }
          const rawBids = d.bids || d.b || []
          const rawAsks = d.asks || d.a || []

          // Parse thành [price, qty] numbers, sort đúng chiều
          const bids = rawBids
            .slice(0, 5)
            .map(([p, q]) => [parseFloat(p), parseFloat(q)])
            .sort((a, b) => b[0] - a[0])  // bid: cao → thấp

          const asks = rawAsks
            .slice(0, 5)
            .map(([p, q]) => [parseFloat(p), parseFloat(q)])
            .sort((a, b) => a[0] - b[0])  // ask: thấp → cao

          // Gom update qua RAF — tránh setState 100ms liên tục
          pendingRef.current = { bids, asks, lastUpdate: Date.now() }

          if (!rafRef.current) {
            rafRef.current = requestAnimationFrame(() => {
              rafRef.current = null
              if (!cancelledRef.current && pendingRef.current) {
                setBook(pendingRef.current)
                pendingRef.current = null
              }
            })
          }
        } catch (e) {
          console.error('[OrderBook WS parse]', e)
        }
      }

      ws.onerror = () => {
        if (!cancelledRef.current) console.warn(`[OrderBook WS] ${market} error`)
      }

      ws.onclose = () => {
        if (cancelledRef.current) return
        console.log(`[OrderBook WS] ${market} closed, reconnect in 5s`)
        reconnTimRef.current = setTimeout(() => {
          if (!cancelledRef.current) connectWS()
        }, 5000)
      }
    }

    connectWS()

    return () => {
      cancelledRef.current = true
      clearTimeout(reconnTimRef.current)
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
      const ws = wsRef.current
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        ws.close()
      }
      wsRef.current = null
      setBook(null)
    }
  }, [symbol, market])

  return book
}