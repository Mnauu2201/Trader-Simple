// binanceApi.js — v24: Cloudflare Worker proxy cho /futures/data/*

const isDev = import.meta.env.DEV
const CF_WORKER_URL = 'https://binance-proxy.anhtrinhciutb8.workers.dev'

const SPOT_BASE    = isDev ? '' : 'https://api.binance.com'
const FUTURES_BASE = isDev ? '' : 'https://fapi.binance.com'

async function fetchSpot(path) {
  const res = await fetch(SPOT_BASE + path, { signal: AbortSignal.timeout(8000) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

async function fetchFutures(path) {
  const res = await fetch(FUTURES_BASE + path, { signal: AbortSignal.timeout(8000) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

async function fetchFuturesData(path) {
  let url
  if (isDev) {
    url = '/futures-data' + path
  } else {
    // path = '/futures/data/takerbuysellevol?symbol=BTCUSDT&period=5m&limit=500'
    const qIdx = path.indexOf('?')
    const pathname = qIdx >= 0 ? path.slice(0, qIdx) : path
    const qs      = qIdx >= 0 ? path.slice(qIdx + 1) : ''
    // Gửi pathname qua ?p=, query string giữ nguyên không encode lại
    url = `${CF_WORKER_URL}?p=${encodeURIComponent(pathname)}&${qs}`
  }
  console.log('[Futures Data API]', url)
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function getKlines(symbol, interval, limit = 500, market = 'spot', endTime = null) {
  const endParam = endTime ? `&endTime=${endTime}` : ''
  const path = `/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}${endParam}`
  const fPath = `/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}${endParam}`
  const data = market === 'futures' ? await fetchFutures(fPath) : await fetchSpot(path)
  return data.map(c => ({
    time: Math.floor(c[0] / 1000),
    open: parseFloat(c[1]),
    high: parseFloat(c[2]),
    low: parseFloat(c[3]),
    close: parseFloat(c[4]),
    volume: parseFloat(c[5]),
    takerBuyVol: parseFloat(c[9] ?? 0),
  }))
}

export async function getTicker24h(symbol, market = 'spot') {
  if (market === 'futures') return fetchFutures(`/fapi/v1/ticker/24hr?symbol=${symbol}`)
  return fetchSpot(`/api/v3/ticker/24hr?symbol=${symbol}`)
}

export async function getAllTickers24h(market = 'spot') {
  if (market === 'futures') return fetchFutures('/fapi/v1/ticker/24hr')
  return fetchSpot('/api/v3/ticker/24hr')
}

export async function getPremiumIndex(symbol) {
  return fetchFutures(`/fapi/v1/premiumIndex?symbol=${symbol}`)
}

export async function getFundingRateHistory(symbol, limit = 10) {
  return fetchFutures(`/fapi/v1/fundingRate?symbol=${symbol}&limit=${limit}`)
}

export async function getOpenInterest(symbol) {
  return fetchFutures(`/fapi/v1/openInterest?symbol=${symbol}`)
}

export async function getOpenInterestHist(symbol, period = '5m', limit = 48, endTime = null) {
  let path = `/futures/data/openInterestHist?symbol=${symbol}&period=${period}&limit=${limit}`
  if (endTime) path += `&endTime=${endTime}`
  return fetchFuturesData(path)
}

export async function getLongShortRatio(symbol, period = '5m', limit = 24) {
  return fetchFuturesData(
    `/futures/data/globalLongShortAccountRatio?symbol=${symbol}&period=${period}&limit=${limit}`
  )
}

export async function getTopLongShortAccountRatio(symbol, period = '5m', limit = 24) {
  return fetchFuturesData(
    `/futures/data/topLongShortAccountRatio?symbol=${symbol}&period=${period}&limit=${limit}`
  )
}

export async function getTopLongShortPositionRatio(symbol, period = '5m', limit = 24) {
  return fetchFuturesData(
    `/futures/data/topLongShortPositionRatio?symbol=${symbol}&period=${period}&limit=${limit}`
  )
}

export async function getTakerBuySellVol(symbol, period, limit = 500, endTime = null) {
  let path = `/futures/data/takerbuysellevol?symbol=${symbol}&period=${period}&limit=${limit}`
  if (endTime) path += `&endTime=${endTime}`
  return fetchFuturesData(path)
}