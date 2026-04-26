export default async function handler(req, res) {
    // req.url = '/api/futures-proxy/futures/data/takerbuysellevol?symbol=BTCUSDT&period=5m&limit=500'
    // Strip the /api/futures-proxy prefix to get the real Binance path
    const stripped = req.url.replace(/^\/api\/futures-proxy/, '')
    const url = `https://fapi.binance.com${stripped}`

    console.log('[fapi-proxy] →', url)

    try {
        const response = await fetch(url, {
            method: req.method || 'GET',
            headers: {
                'Accept': 'application/json',
                'Origin': 'https://www.binance.com',
                'Referer': 'https://www.binance.com/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
        })

        const text = await response.text()
        console.log('[fapi-proxy] status:', response.status, '| body:', text.slice(0, 200))

        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Cache-Control', 's-maxage=15')
        res.status(response.status).send(text)
    } catch (err) {
        console.error('[fapi-proxy] error:', err.message)
        res.status(500).json({ error: err.message })
    }
}