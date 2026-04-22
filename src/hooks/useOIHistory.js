// src/hooks/useOIHistory.js
// Open Interest History — infinite scroll backward (giống pattern nến)
//
// Flow:
//   1. Mount → fetch 500 điểm mới nhất → hiện ngay
//   2. Khi user scroll OI chart gần về đầu → loadMoreOI() fetch batch cũ hơn, prepend
//   3. Poll 5 phút lấy điểm mới nhất (1 batch, silent merge)
//   4. Dừng load thêm khi: API trả < LIMIT điểm, hoặc vượt MAX_DAYS
//
// Return: { oiData, loading, hasMoreOI, loadMoreOI, error }
// ChartPanel gọi loadMoreOI() khi subscribeVisibleTimeRangeChange gần về đầu

import { useEffect, useRef, useState, useCallback } from 'react'
import { getOpenInterestHist } from '../services/binanceApi'

const POLL_INTERVAL = 5 * 60 * 1000  // 5 phút
const LIMIT = 500            // max per request (Binance max = 500)
const MAX_DAYS = 30             // Binance chỉ lưu ~30 ngày OI hist

// Map interval chart → period OI hợp lệ
const INTERVAL_TO_PERIOD = {
    '1m': '5m', '3m': '5m', '5m': '5m',
    '15m': '15m',
    '30m': '30m',
    '1h': '1h', '2h': '2h',
    '4h': '4h', '6h': '4h', '8h': '4h', '12h': '4h',
    '1d': '1d', '3d': '1d', '1w': '1d', '1M': '1d',
}

function parseRaw(raw) {
    return raw
        .map(d => ({
            time: Math.floor(d.timestamp / 1000),
            oi: parseFloat(d.sumOpenInterest),
            oiUSD: parseFloat(d.sumOpenInterestValue),
        }))
        .sort((a, b) => a.time - b.time)
}

export function useOIHistory(symbol, interval, market) {
    const [oiData, setOiData] = useState([])
    const [loading, setLoading] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const [error, setError] = useState(null)

    const cancelledRef = useRef(false)
    const loadingMoreRef = useRef(false)   // guard: tránh double-fetch
    const timerRef = useRef(null)
    const dataRef = useRef([])      // mirror state, dùng trong callbacks

    // ── Fetch ban đầu: 500 điểm mới nhất ─────────────────────────────────────
    const fetchInitial = useCallback(async () => {
        if (market !== 'futures') {
            setOiData([])
            dataRef.current = []
            setHasMore(false)
            return
        }

        const period = INTERVAL_TO_PERIOD[interval] || '5m'
        setLoading(true)
        setError(null)
        setHasMore(true)

        try {
            const raw = await getOpenInterestHist(symbol, period, LIMIT)
            if (cancelledRef.current) return

            const parsed = parseRaw(raw)
            dataRef.current = parsed
            setOiData(parsed)
            setHasMore(parsed.length >= LIMIT)
        } catch (err) {
            if (!cancelledRef.current) {
                setError(err.message)
                setOiData([])
                dataRef.current = []
            }
        } finally {
            if (!cancelledRef.current) setLoading(false)
        }
    }, [symbol, interval, market])

    // ── Load more: ChartPanel gọi khi user scroll gần về đầu OI chart ────────
    const loadMore = useCallback(async () => {
        if (market !== 'futures') return
        if (loadingMoreRef.current) return  // đang fetch rồi
        if (!hasMore) return  // hết data

        const current = dataRef.current
        if (!current.length) return

        const oldestTimeMs = current[0].time * 1000
        const cutoffMs = Date.now() - MAX_DAYS * 24 * 60 * 60 * 1000
        if (oldestTimeMs <= cutoffMs) { setHasMore(false); return }

        const period = INTERVAL_TO_PERIOD[interval] || '5m'
        loadingMoreRef.current = true

        try {
            const endTime = oldestTimeMs - 1  // -1ms để tránh overlap
            const raw = await getOpenInterestHist(symbol, period, LIMIT, endTime)
            if (cancelledRef.current) return

            const older = parseRaw(raw)
            if (!older.length) { setHasMore(false); return }

            // Merge: loại trùng time, loại quá MAX_DAYS
            const existingSet = new Set(current.map(d => d.time))
            const toAdd = older.filter(
                d => !existingSet.has(d.time) && d.time * 1000 >= cutoffMs
            )

            if (!toAdd.length) { setHasMore(false); return }

            const merged = [...toAdd, ...current].sort((a, b) => a.time - b.time)
            dataRef.current = merged
            setOiData([...merged])

            if (older.length < LIMIT || merged[0].time * 1000 <= cutoffMs) {
                setHasMore(false)
            }
        } catch {
            // silent — giữ data cũ, không crash
        } finally {
            loadingMoreRef.current = false
        }
    }, [symbol, interval, market, hasMore])

    // ── Poll: chỉ lấy điểm mới nhất, không reload toàn bộ ───────────────────
    const fetchLatest = useCallback(async () => {
        if (market !== 'futures' || cancelledRef.current) return
        const period = INTERVAL_TO_PERIOD[interval] || '5m'
        try {
            const raw = await getOpenInterestHist(symbol, period, LIMIT)
            if (cancelledRef.current) return

            const fresh = parseRaw(raw)
            const current = dataRef.current
            const existingSet = new Set(current.map(d => d.time))
            const newPoints = fresh.filter(d => !existingSet.has(d.time))
            if (!newPoints.length) return

            const merged = [...current, ...newPoints].sort((a, b) => a.time - b.time)
            dataRef.current = merged
            setOiData([...merged])
        } catch { /* silent */ }
    }, [symbol, interval, market])

    useEffect(() => {
        cancelledRef.current = false
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

    return { oiData, loading, hasMoreOI: hasMore, loadMoreOI: loadMore, error }
}