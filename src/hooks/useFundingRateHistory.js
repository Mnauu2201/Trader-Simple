// src/hooks/useFundingRateHistory.js
// v20: Funding Rate History — REST GET /fapi/v1/fundingRate?limit=100
//
// Pattern: giống useOIHistory (setTimeout(0) + sync TimeRange)
// Poll: mỗi 8h vì funding chỉ settle 3 lần/ngày (00:00 / 08:00 / 16:00 UTC)
// Data format: [{ symbol, fundingRate, fundingTime }]

import { useEffect, useRef, useState } from 'react'

const FAPI_URLS = [
    'https://fapi.binance.com',
    'https://fapi1.binance.com',
    'https://fapi2.binance.com',
]

async function fetchFundingRateHistory(symbol, limit = 100) {
    let lastErr
    for (const base of FAPI_URLS) {
        try {
            const url = `${base}/fapi/v1/fundingRate?symbol=${symbol}&limit=${limit}`
            const res = await fetch(url)
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            const json = await res.json()
            // Trả về mảng đã sort tăng dần theo thời gian
            return json
                .map(d => ({
                    time: Math.floor(d.fundingTime / 1000),  // unix seconds (UTC)
                    value: parseFloat(d.fundingRate) * 100,  // convert sang % để dễ đọc
                    raw: parseFloat(d.fundingRate),
                }))
                .sort((a, b) => a.time - b.time)
        } catch (e) {
            lastErr = e
        }
    }
    throw lastErr
}

export function useFundingRateHistory(symbol, market) {
    const [frHistory, setFrHistory] = useState([])
    const cancelledRef = useRef(false)
    const pollTimRef = useRef(null)

    useEffect(() => {
        if (market !== 'futures' || !symbol) {
            setFrHistory([])
            return
        }

        cancelledRef.current = false

        async function load() {
            if (cancelledRef.current) return
            try {
                const data = await fetchFundingRateHistory(symbol)
                if (!cancelledRef.current) setFrHistory(data)
            } catch (e) {
                console.warn('[FundingRateHistory]', e)
            }
        }

        load()

        // Poll mỗi 8h — funding cycle 8h, data không thay đổi giữa các chu kỳ
        pollTimRef.current = setInterval(load, 8 * 60 * 60 * 1000)

        return () => {
            cancelledRef.current = true
            clearInterval(pollTimRef.current)
        }
    }, [symbol, market])

    return frHistory
}