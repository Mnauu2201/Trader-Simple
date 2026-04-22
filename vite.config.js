import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
// })

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/futures-data': {
        target: 'https://fapi.binance.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/futures-data/, ''),
      },
    },
  },
})