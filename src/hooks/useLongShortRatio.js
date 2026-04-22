// src/hooks/useLongShortRatio.js
// v15: Long/Short Ratio cho Futures
//
// 3 loại dữ liệu từ Binance:
//   1. globalLongShortAccountRatio  — tất cả account trên toàn thị trường
//   2. topLongShortAccountRatio     — top traders (theo account size)
//   3. topLongShortPositionRatio    — top traders (theo position size)
//
// Pattern: REST poll mỗi 30s (không có WS stream cho L/S ratio)
// Kèm lịch sử 24 điểm (period=5m × 24 = 2 tiếng) để vẽ mini chart
//
// cancelledRef pattern — giống useFundingRate để tránh update sau cleanup

import { useEffect, useRef, useState } from 'react'
import {
    getLongShortRatio,
    getTopLongShortAccountRatio,
    getTopLongShortPositionRatio,
} from '../services/binanceApi'

const POLL_INTERVAL = 30_000  // 30 giây
const HISTORY_LIMIT = 24      // 24 điểm × 5m = 2h lịch sử

export function useLongShortRatio(symbol, market) {
    const [data, setData] = useState(null)
    // data = {
    //   global:   { longRatio, shortRatio, longShortRatio, history: [{time, longRatio, shortRatio}] }
    //   topAcct:  { longRatio, shortRatio, longShortRatio, history: [...] }
    //   topPos:   { longRatio, shortRatio, longShortRatio, history: [...] }
    //   timestamp: number
    // }

    const cancelledRef = useRef(false)
    const timerRef = useRef(null)

    useEffect(() => {
        // Chỉ có data cho Futures
        if (market !== 'futures' || !symbol) {
            setData(null)
            return
        }

        cancelledRef.current = false

        async function fetchAll() {
            if (cancelledRef.current) return

            try {
                // Fetch song song 3 loại ratio + history cho mỗi loại
                const [
                    globalCurrent,
                    globalHistory,
                    topAcctCurrent,
                    topAcctHistory,
                    topPosCurrent,
                    topPosHistory,
                ] = await Promise.allSettled([
                    getLongShortRatio(symbol, '5m', 1),
                    getLongShortRatio(symbol, '5m', HISTORY_LIMIT),
                    getTopLongShortAccountRatio(symbol, '5m', 1),
                    getTopLongShortAccountRatio(symbol, '5m', HISTORY_LIMIT),
                    getTopLongShortPositionRatio(symbol, '5m', 1),
                    getTopLongShortPositionRatio(symbol, '5m', HISTORY_LIMIT),
                ])

                if (cancelledRef.current) return

                // Helper parse một entry từ API
                function parseEntry(arr) {
                    if (!arr || !arr.length) return null
                    const d = arr[arr.length - 1]   // lấy mới nhất
                    return {
                        longRatio: parseFloat(d.longAccount ?? d.longPosition ?? 0),
                        shortRatio: parseFloat(d.shortAccount ?? d.shortPosition ?? 0),
                        longShortRatio: parseFloat(d.longShortRatio ?? 0),
                    }
                }

                // Helper parse history array
                function parseHistory(arr) {
                    if (!arr || !arr.length) return []
                    return arr.map(d => ({
                        time: d.timestamp,
                        longRatio: parseFloat(d.longAccount ?? d.longPosition ?? 0),
                        shortRatio: parseFloat(d.shortAccount ?? d.shortPosition ?? 0),
                        ls: parseFloat(d.longShortRatio ?? 0),
                    }))
                }

                const globalVal = globalCurrent.status === 'fulfilled' ? parseEntry(globalCurrent.value) : null
                const topAcctVal = topAcctCurrent.status === 'fulfilled' ? parseEntry(topAcctCurrent.value) : null
                const topPosVal = topPosCurrent.status === 'fulfilled' ? parseEntry(topPosCurrent.value) : null
                const globalHist = globalHistory.status === 'fulfilled' ? parseHistory(globalHistory.value) : []
                const topAcctHist = topAcctHistory.status === 'fulfilled' ? parseHistory(topAcctHistory.value) : []
                const topPosHist = topPosHistory.status === 'fulfilled' ? parseHistory(topPosHistory.value) : []

                setData({
                    global: globalVal ? { ...globalVal, history: globalHist } : null,
                    topAcct: topAcctVal ? { ...topAcctVal, history: topAcctHist } : null,
                    topPos: topPosVal ? { ...topPosVal, history: topPosHist } : null,
                    timestamp: Date.now(),
                })
            } catch (e) {
                // Không crash — L/S ratio không critical, chỉ log
                console.warn('[LongShortRatio] fetch error:', e)
            }

            // Schedule poll tiếp theo
            if (!cancelledRef.current) {
                timerRef.current = setTimeout(fetchAll, POLL_INTERVAL)
            }
        }

        fetchAll()

        return () => {
            cancelledRef.current = true
            clearTimeout(timerRef.current)
        }
    }, [symbol, market])

    return data
}