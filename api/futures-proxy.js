export default async function handler(req, res) {
    // req.url example: /api/futures-proxy/futures/data/takerbuysellevol?symbol=BTCUSDT&...
    // We need:         https://fapi.binance.com/futures/data/takerbuysellevol?symbol=BTCUSDT&...
    const withoutPrefix = req.url.replace(/^\/api\/futures-proxy/, '')
    const url = `https://fapi.binance.com${withoutPrefix}`

    console.log('[proxy]', url)

    try {
        const response = await fetch(url, {
            headers: {
                'Origin': 'https://www.binance.com',
                'Referer': 'https://www.binance.com/',
                'User-Agent': 'Mozilla/5.0',
            },
            signal: AbortSignal.timeout(10000),
        })

        const data = await response.json()
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Cache-Control', 's-maxage=10')
        res.status(response.status).json(data)
    } catch (err) {
        console.error('[proxy error]', err.message)
        res.status(500).json({ error: err.message })
    }
}