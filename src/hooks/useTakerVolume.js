// src/hooks/useTakerVolume.js
// Taker Buy / Sell Volume — infinite scroll backward (giống useOIHistory)
//
// Flow:
//   1. Mount → fetch 500 điểm mới nhất → hiện ngay
//   2. loadMoreTV() → fetch batch cũ hơn khi scroll gần về đầu
//   3. Poll 1 phút lấy điểm mới nhất (silent merge)
//   4. Dừng khi API trả < LIMIT hoặc vượt MAX_DAYS
//
// API: GET /futures/data/takerbuysellevol?symbol=BTCUSDT&period=5m&limit=500&endTime=...
// Response: [{ buySellRatio, buyVol, sellVol, timestamp }]
// Chỉ hoạt động khi market === 'futures'
//
// Return: { tvData, loading, hasMoreTV, loadMoreTV, error }
//   tvData[i] = { time, buyVol, sellVol, ratio }

import { useEffect, useRef, useState, useCallback } from 'react'
import { getTakerBuySellVol } from '../services/binanceApi'

const POLL_INTERVAL = 60 * 1000   // 1 phút
const LIMIT         = 500
const MAX_DAYS      = 30

// Map interval chart → period hợp lệ cho taker vol API
const INTERVAL_TO_PERIOD = {
    '1m':  '5m',  '3m':  '5m',  '5m':  '5m',
    '15m': '15m',
    '30m': '30m',
    '1h':  '1h',  '2h':  '2h',
    '4h':  '4h',  '6h':  '4h',  '8h':  '4h',  '12h': '4h',
    '1d':  '1d',  '3d':  '1d',  '1w':  '1d',  '1M':  '1d',
}

function parseRaw(raw) {
    return raw
        .map(d => ({
            time:    Math.floor(d.timestamp / 1000),
            buyVol:  parseFloat(d.buyVol),
            sellVol: parseFloat(d.sellVol),
            ratio:   parseFloat(d.buySellRatio),
        }))
        .sort((a, b) => a.time - b.time)
}

export function useTakerVolume(symbol, interval, market) {
    const [tvData,  setTvData]  = useState([])
    const [loading, setLoading] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const [error,   setError]   = useState(null)

    const cancelledRef    = useRef(false)
    const loadingMoreRef  = useRef(false)
    const timerRef        = useRef(null)
    const dataRef         = useRef([])

    // ── Fetch ban đầu ─────────────────────────────────────────────────────────
    const fetchInitial = useCallback(async () => {
        if (market !== 'futures') {
            setTvData([])
            dataRef.current = []
            setHasMore(false)
            return
        }

        const period = INTERVAL_TO_PERIOD[interval] || '5m'
        setLoading(true)
        setError(null)
        setHasMore(true)

        try {
            const raw    = await getTakerBuySellVol(symbol, period, LIMIT)
            if (cancelledRef.current) return

            const parsed = parseRaw(raw)
            dataRef.current = parsed
            setTvData(parsed)
            setHasMore(parsed.length >= LIMIT)
        } catch (err) {
            if (!cancelledRef.current) {
                setError(err.message)
                setTvData([])
                dataRef.current = []
            }
        } finally {
            if (!cancelledRef.current) setLoading(false)
        }
    }, [symbol, interval, market])

    // ── Load more khi scroll về đầu chart ─────────────────────────────────────
    const loadMore = useCallback(async () => {
        if (market !== 'futures')   return
        if (loadingMoreRef.current) return
        if (!hasMore)               return

        const current = dataRef.current
        if (!current.length) return

        const oldestMs = current[0].time * 1000
        const cutoffMs = Date.now() - MAX_DAYS * 24 * 60 * 60 * 1000
        if (oldestMs <= cutoffMs) { setHasMore(false); return }

        const period = INTERVAL_TO_PERIOD[interval] || '5m'
        loadingMoreRef.current = true

        try {
            const endTime = oldestMs - 1
            const raw     = await getTakerBuySellVol(symbol, period, LIMIT, endTime)
            if (cancelledRef.current) return

            const older = parseRaw(raw)
            if (!older.length) { setHasMore(false); return }

            const existingSet = new Set(current.map(d => d.time))
            const toAdd = older.filter(
                d => !existingSet.has(d.time) && d.time * 1000 >= cutoffMs
            )
            if (!toAdd.length) { setHasMore(false); return }

            const merged = [...toAdd, ...current].sort((a, b) => a.time - b.time)
            dataRef.current = merged
            setTvData([...merged])

            if (older.length < LIMIT || merged[0].time * 1000 <= cutoffMs) {
                setHasMore(false)
            }
        } catch {
            // silent
        } finally {
            loadingMoreRef.current = false
        }
    }, [symbol, interval, market, hasMore])

    // ── Poll: lấy điểm mới nhất ───────────────────────────────────────────────
    const fetchLatest = useCallback(async () => {
        if (market !== 'futures' || cancelledRef.current) return
        const period = INTERVAL_TO_PERIOD[interval] || '5m'
        try {
            const raw         = await getTakerBuySellVol(symbol, period, LIMIT)
            if (cancelledRef.current) return

            const fresh       = parseRaw(raw)
            const current     = dataRef.current
            const existingSet = new Set(current.map(d => d.time))
            const newPoints   = fresh.filter(d => !existingSet.has(d.time))
            if (!newPoints.length) return

            const merged = [...current, ...newPoints].sort((a, b) => a.time - b.time)
            dataRef.current = merged
            setTvData([...merged])
        } catch { /* silent */ }
    }, [symbol, interval, market])

    useEffect(() => {
        cancelledRef.current   = false
        loadingMoreRef.current = false

        fetchInitial()

        timerRef.current = setInterval(() => {
            if (!cancelledRef.current) fetchLatest()
        }, POLL_INTERVAL)

        return () => {
            cancelledRef.current = true
            clearInterval(timerRef.current)
        }
    }, [fetchInitial, fetchLatest])

    return { tvData, loading, hasMoreTV: hasMore, loadMoreTV: loadMore, error }
}