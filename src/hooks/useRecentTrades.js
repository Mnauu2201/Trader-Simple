// src/hooks/useRecentTrades.js
// v13.1 fix:
//   - Dedup theo aggId → tránh trade trùng khi WS reconnect
//   - Sort theo aggId descending khi flush → mới nhất (id lớn) luôn trên đầu
//   - Slice MAX_TRADES=30 sau dedup+sort → buffer không bao giờ vượt 30
//
// PERF pattern: buffer sống ngoài state, flush qua RAF tối đa 60fps

import { useEffect, useRef, useState } from 'react'

const SPOT_WS = 'wss://stream.binance.com:443/ws/'
const FUTURES_WS = 'wss://fstream.binance.com/ws/'

const MAX_TRADES = 30

export function useRecentTrades(symbol, market) {
  const [trades, setTrades] = useState([])
  // trades[0] = mới nhất (aggId lớn nhất)
  // trades[29] = cũ nhất (aggId nhỏ nhất)

  const wsRef = useRef(null)
  const reconnTimRef = useRef(null)
  const cancelledRef = useRef(false)

  // Map<aggId, trade> để dedup — tránh duplicate khi WS reconnect gửi lại
  const bufferMapRef = useRef(new Map())
  const rafRef = useRef(null)

  useEffect(() => {
    if (!symbol) return

    cancelledRef.current = false
    bufferMapRef.current.clear()
    setTrades([])

    function flush() {
      if (cancelledRef.current) return
      // Map → array → sort desc theo id → slice 30
      const sorted = [...bufferMapRef.current.values()]
        .sort((a, b) => b.id - a.id)
        .slice(0, MAX_TRADES)

      // Trim map nếu quá lớn (giữ đúng MAX_TRADES entry)
      if (bufferMapRef.current.size > MAX_TRADES) {
        const keep = new Set(sorted.map(t => t.id))
        for (const k of bufferMapRef.current.keys()) {
          if (!keep.has(k)) bufferMapRef.current.delete(k)
        }
      }

      setTrades(sorted)
    }

    function connectWS() {
      if (cancelledRef.current) return

      const base = market === 'futures' ? FUTURES_WS : SPOT_WS
      const stream = `${symbol.toLowerCase()}@aggTrade`
      const ws = new WebSocket(base + stream)
      wsRef.current = ws

      ws.onopen = () => {
        if (cancelledRef.current) { ws.close(); return }
        console.log(`[Trades WS] ${market.toUpperCase()} ${symbol} connected`)
      }

      ws.onmessage = (event) => {
        if (cancelledRef.current) return
        try {
          const d = JSON.parse(event.data)

          // aggTrade fields: a=aggId, p=price, q=qty, m=isBuyerMaker, T=time
          const trade = {
            id: d.a,            // aggId — tăng dần monotonically từ Binance
            price: parseFloat(d.p),
            qty: parseFloat(d.q),
            isBuyerMaker: d.m,            // true=seller taker (đỏ), false=buyer taker (xanh)
            time: d.T,
          }

          // Upsert vào Map — dedup tự động theo aggId
          bufferMapRef.current.set(trade.id, trade)

          // Gom update qua RAF → flush tối đa 60 lần/giây
          if (!rafRef.current) {
            rafRef.current = requestAnimationFrame(() => {
              rafRef.current = null
              flush()
            })
          }
        } catch (e) {
          console.error('[Trades WS parse]', e)
        }
      }

      ws.onerror = () => {
        if (!cancelledRef.current) console.warn(`[Trades WS] ${market} error`)
      }

      ws.onclose = () => {
        if (cancelledRef.current) return
        console.log(`[Trades WS] ${market} closed, reconnect in 5s`)
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
      bufferMapRef.current.clear()
    }
  }, [symbol, market])

  return trades
}