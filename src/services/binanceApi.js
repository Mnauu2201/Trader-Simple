// binanceApi.js — hỗ trợ cả Spot và Futures (USD-M)
// v15: thêm getLongShortRatio + getTopLongShortAccountRatio + getTopLongShortPositionRatio

const SPOT_URLS = [
  'https://api.binance.com',
  'https://api1.binance.com',
  'https://api2.binance.com',
]

const FUTURES_URLS = [
  'https://fapi.binance.com',
  'https://fapi1.binance.com',
  'https://fapi2.binance.com',
]

let spotIndex = 0
let futuresIndex = 0

async function fetchSpot(path) {
  for (let i = 0; i < SPOT_URLS.length; i++) {
    const idx = (spotIndex + i) % SPOT_URLS.length
    try {
      const res = await fetch(SPOT_URLS[idx] + path, {
        signal: AbortSignal.timeout(8000),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      spotIndex = idx
      return res.json()
    } catch (e) {
      console.warn(`[Spot API] ${SPOT_URLS[idx]} failed:`, e.message)
    }
  }
  throw new Error('All Spot endpoints failed')
}

async function fetchFutures(path) {
  for (let i = 0; i < FUTURES_URLS.length; i++) {
    const idx = (futuresIndex + i) % FUTURES_URLS.length
    try {
      const res = await fetch(FUTURES_URLS[idx] + path, {
        signal: AbortSignal.timeout(8000),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      futuresIndex = idx
      return res.json()
    } catch (e) {
      console.warn(`[Futures API] ${FUTURES_URLS[idx]} failed:`, e.message)
    }
  }
  throw new Error('All Futures endpoints failed')
}

// Lấy nến lịch sử
export async function getKlines(symbol, interval, limit = 500, market = 'spot', endTime = null) {
  const endParam = endTime ? `&endTime=${endTime}` : ''
  const path = `/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}${endParam}`
  const futuresPath = `/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}${endParam}`
  const data = market === 'futures'
    ? await fetchFutures(futuresPath)
    : await fetchSpot(path)
  return data.map(c => ({
    time: Math.floor(c[0] / 1000),
    open: parseFloat(c[1]),
    high: parseFloat(c[2]),
    low: parseFloat(c[3]),
    close: parseFloat(c[4]),
    volume: parseFloat(c[5]),
  }))
}

// Lấy thống kê 24h (có % change) — dùng khi init
export async function getTicker24h(symbol, market = 'spot') {
  if (market === 'futures') {
    return fetchFutures(`/fapi/v1/ticker/24hr?symbol=${symbol}`)
  }
  return fetchSpot(`/api/v3/ticker/24hr?symbol=${symbol}`)
}

// Lấy tất cả tickers 24h
export async function getAllTickers24h(market = 'spot') {
  if (market === 'futures') {
    return fetchFutures('/fapi/v1/ticker/24hr')
  }
  return fetchSpot('/api/v3/ticker/24hr')
}

// ── Futures only ─────────────────────────────────────────────────────────────

// Mark price + funding rate hiện tại
export async function getPremiumIndex(symbol) {
  return fetchFutures(`/fapi/v1/premiumIndex?symbol=${symbol}`)
}

// Lịch sử funding rate
export async function getFundingRateHistory(symbol, limit = 10) {
  return fetchFutures(`/fapi/v1/fundingRate?symbol=${symbol}&limit=${limit}`)
}

// Open Interest — snapshot hiện tại
export async function getOpenInterest(symbol) {
  return fetchFutures(`/fapi/v1/openInterest?symbol=${symbol}`)
}

// Open Interest History — dùng cho OI Chart (v15+)
// period: '5m' | '15m' | '30m' | '1h' | '2h' | '4h' | '6h' | '12h' | '1d'
export async function getOpenInterestHist(symbol, period = '5m', limit = 48) {
  return fetchFutures(
    `/futures/data/openInterestHist?symbol=${symbol}&period=${period}&limit=${limit}`
  )
}

// ── Long/Short Ratio — v15 ────────────────────────────────────────────────────
//
// 3 endpoints khác nhau, cùng period/limit params:
//   period: '5m' | '15m' | '30m' | '1h' | '2h' | '4h' | '6h' | '12h' | '1d'
//   limit: 1–500 (default 30)
//
// Response mỗi item: { symbol, longShortRatio, longAccount/longPosition, shortAccount/shortPosition, timestamp }

// Global — tỷ lệ long/short của tất cả account trên thị trường
// Endpoint: /futures/data/globalLongShortAccountRatio
export async function getLongShortRatio(symbol, period = '5m', limit = 24) {
  return fetchFutures(
    `/futures/data/globalLongShortAccountRatio?symbol=${symbol}&period=${period}&limit=${limit}`
  )
}

// Top Traders — tỷ lệ theo số lượng account (top traders by account size)
// Endpoint: /futures/data/topLongShortAccountRatio
export async function getTopLongShortAccountRatio(symbol, period = '5m', limit = 24) {
  return fetchFutures(
    `/futures/data/topLongShortAccountRatio?symbol=${symbol}&period=${period}&limit=${limit}`
  )
}

// Top Traders — tỷ lệ theo position size (đáng tin nhất — vốn lớn)
// Endpoint: /futures/data/topLongShortPositionRatio
export async function getTopLongShortPositionRatio(symbol, period = '5m', limit = 24) {
  return fetchFutures(
    `/futures/data/topLongShortPositionRatio?symbol=${symbol}&period=${period}&limit=${limit}`
  )
}

// Taker Buy/Sell Volume — v17
export async function getTakerBuySellVol(symbol, period, limit = 500, endTime = null) {
  const isDev = import.meta.env.DEV
  // Endpoint đúng: /futures/data/takerlongshortRatio (Binance docs)
  let url = isDev
    ? `/futures-data/futures/data/takerlongshortRatio?symbol=${symbol}&period=${period}&limit=${limit}`
    : `https://fapi.binance.com/futures/data/takerlongshortRatio?symbol=${symbol}&period=${period}&limit=${limit}`
  if (endTime) url += `&endTime=${endTime}`
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}