// src/hooks/useTakerVolume.js
// v24: Tính Taker Buy/Sell Volume từ kline data thay vì gọi /futures/data/takerBuySellVol
// Binance block endpoint đó từ Cloudflare IP → dùng kline[7] và kline[10] có sẵn
//
// kline[7]  = quoteVolume (tổng volume USD)
// kline[10] = takerBuyQuoteVol (buy volume USD)
// sellVol   = quoteVolume - takerBuyQuoteVol
//
// Return: { tvData, loading, hasMoreTV, loadMoreTV, error }
//   tvData[i] = { time, buyVol, sellVol }

import { useEffect, useRef, useState, useCallback } from 'react'

export function useTakerVolume(symbol, interval, market, klineData = []) {
    const [tvData, setTvData] = useState([])
    const [loading, setLoading] = useState(false)

    // Tính TVol từ klineData mỗi khi klineData thay đổi
    useEffect(() => {
        if (market !== 'futures') {
            setTvData([])
            return
        }
        if (!klineData || klineData.length === 0) {
            setTvData([])
            return
        }

        setLoading(true)
        const data = klineData
            .filter(d => d.quoteVolume != null && d.takerBuyQuoteVol != null)
            .map(d => ({
                time: d.time,
                buyVol: d.takerBuyQuoteVol,
                sellVol: d.quoteVolume - d.takerBuyQuoteVol,
            }))
        setTvData(data)
        setLoading(false)
    }, [klineData, market])

    // loadMoreTV không cần nữa vì dùng kline data (đã có sẵn infinite scroll)
    const loadMoreTV = useCallback(() => { }, [])

    return { tvData, loading, hasMoreTV: false, loadMoreTV, error: null }
}