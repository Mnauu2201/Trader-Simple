import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy cho /futures/data/* (takerbuysellevol, openInterestHist, longShortRatio, v.v.)
      // Các endpoint này nằm trên fapi.binance.com nhưng path bắt đầu bằng /futures/data/
      '/futures-data': {
        target: 'https://fapi.binance.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/futures-data/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            // Binance yêu cầu header hợp lệ
            proxyReq.setHeader('Origin', 'https://www.binance.com')
            proxyReq.setHeader('Referer', 'https://www.binance.com/')
          })
        },
      },

      // Proxy cho Futures API thông thường (/fapi/*)
      '/fapi': {
        target: 'https://fapi.binance.com',
        changeOrigin: true,
        secure: true,
      },

      // Proxy cho Spot API (/api/*)
      '/api': {
        target: 'https://api.binance.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})