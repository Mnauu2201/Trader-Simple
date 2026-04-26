export default async function handler(req, res) {
    // Usage: /api/proxy?p=/futures/data/takerbuysellevol&symbol=BTCUSDT&period=5m&limit=500
    const { p, ...rest } = req.query
    if (!p) return res.status(400).json({ error: 'missing path param' })

    const qs = new URLSearchParams(rest).toString()
    const url = `https://fapi.binance.com${p}${qs ? '?' + qs : ''}`
    console.log('[proxy] →', url)

    try {
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'Origin': 'https://www.binance.com',
                'Referer': 'https://www.binance.com/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
            signal: AbortSignal.timeout(10000),
        })
        const text = await response.text()
        console.log('[proxy] status:', response.status)
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Content-Type', 'application/json')
        res.status(response.status).send(text)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}