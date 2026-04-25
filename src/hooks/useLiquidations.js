// src/hooks/useLiquidations.js
// WS stream: wss://fstream.binance.com/ws/!forceOrder@arr
// Chỉ hoạt động khi market === 'futures'
// Callback onLiquidation({ symbol, price, qty, side, time, usdValue }) — chỉ liq > threshold

import { useEffect, useRef } from 'react'

// Chỉ hiện liquidation có giá trị USD > MIN_USD để tránh noise
const MIN_USD = 10_000   // $10K — tune tuỳ ý

const WS_URL = 'wss://fstream.binance.com/ws/!forceOrder@arr'
const RECONNECT_DELAY = 5000

/**
 * useLiquidations(symbol, market, onLiquidation)
 *
 * @param {string}   symbol          — ví dụ 'BTCUSDT' (chỉ gọi callback cho symbol này)
 * @param {string}   market          — 'futures' | 'spot' (chỉ active khi futures)
 * @param {Function} onLiquidation   — callback({ price, qty, side, time, usdValue })
 * @param {number}   [minUsd]        — lọc theo ngưỡng USD (default 10_000)
 */
export function useLiquidations(symbol, market, onLiquidation, minUsd = MIN_USD) {
    const wsRef = useRef(null)
    const cancelledRef = useRef(false)
    const reconnectRef = useRef(null)
    const cbRef = useRef(onLiquidation)

    // Giữ callback mới nhất không gây reconnect
    useEffect(() => { cbRef.current = onLiquidation }, [onLiquidation])

    useEffect(() => {
        if (market !== 'futures') return

        cancelledRef.current = false

        function connect() {
            if (cancelledRef.current) return

            const ws = new WebSocket(WS_URL)
            wsRef.current = ws

            ws.onmessage = (e) => {
                try {
                    const msg = JSON.parse(e.data)
                    // !forceOrder@arr trả về { e: 'forceOrder', E: ..., o: { ... } }
                    const order = msg?.o
                    if (!order) return

                    const sym = order.s  // symbol
                    if (sym !== symbol) return

                    const side = order.S   // 'BUY' | 'SELL'
                    const price = parseFloat(order.p)   // order price
                    const qty = parseFloat(order.q)   // quantity
                    const time = order.T               // Unix ms
                    const usdValue = price * qty

                    if (usdValue < minUsd) return

                    cbRef.current?.({ price, qty, side, time, usdValue })
                } catch (_) { }
            }

            ws.onerror = () => ws.close()

            ws.onclose = () => {
                wsRef.current = null
                if (!cancelledRef.current) {
                    reconnectRef.current = setTimeout(connect, RECONNECT_DELAY)
                }
            }
        }

        connect()

        return () => {
            cancelledRef.current = true
            clearTimeout(reconnectRef.current)
            if (wsRef.current) {
                wsRef.current.onclose = null
                wsRef.current.close()
                wsRef.current = null
            }
        }
    }, [symbol, market, minUsd])
}