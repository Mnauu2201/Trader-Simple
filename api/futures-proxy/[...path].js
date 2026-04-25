export default async function handler(req, res) {
    // req.query.path = ['futures', 'data', 'takerbuysellevol']
    const pathArr = req.query.path || []
    const pathStr = Array.isArray(pathArr) ? pathArr.join('/') : pathArr

    // Rebuild query string (exclude 'path' param added by Vercel)
    const query = { ...req.query }
    delete query.path
    const qs = new URLSearchParams(query).toString()

    const url = `https://fapi.binance.com/${pathStr}${qs ? '?' + qs : ''}`
    console.log('[proxy]', url)

    try {
        const response = await fetch(url, {
            headers: {
                'Origin': 'https://www.binance.com',
                'Referer': 'https://www.binance.com/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
            signal: AbortSignal.timeout(10000),
        })

        const data = await response.json()
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate')
        res.status(response.status).json(data)
    } catch (err) {
        console.error('[proxy error]', err.message)
        res.status(500).json({ error: err.message })
    }
}