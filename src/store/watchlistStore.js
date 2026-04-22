// src/store/watchlistStore.js
// v14: Watchlist cá nhân — pin coin yêu thích, persist localStorage
//
// Key localStorage: 'binance-tracker-watchlist'
// Tối đa 50 coin trong watchlist (tránh WS connection quá nhiều)

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const MAX_WATCHLIST = 50

export const useWatchlistStore = create(
  persist(
    (set, get) => ({
      // Dùng array để giữ thứ tự pin (coin pin sau nằm trên)
      symbols: [],   // ['BTCUSDT', 'ETHUSDT', ...]

      // Pin coin — prepend (mới pin = đầu danh sách)
      pin: (symbol) => {
        const current = get().symbols
        if (current.includes(symbol)) return          // đã pin rồi, bỏ qua
        if (current.length >= MAX_WATCHLIST) return   // đã đầy
        set({ symbols: [symbol, ...current] })
      },

      // Unpin coin
      unpin: (symbol) => {
        set(s => ({ symbols: s.symbols.filter(sym => sym !== symbol) }))
      },

      // Toggle pin/unpin
      toggle: (symbol) => {
        const current = get().symbols
        if (current.includes(symbol)) {
          set({ symbols: current.filter(s => s !== symbol) })
        } else {
          if (current.length >= MAX_WATCHLIST) return
          set({ symbols: [symbol, ...current] })
        }
      },

      // Check xem symbol có đang được pin không
      isPinned: (symbol) => get().symbols.includes(symbol),

      // Reorder — kéo thả trong tương lai
      reorder: (from, to) => {
        const syms = [...get().symbols]
        const [moved] = syms.splice(from, 1)
        syms.splice(to, 0, moved)
        set({ symbols: syms })
      },

      // Xoá toàn bộ watchlist
      clear: () => set({ symbols: [] }),
    }),
    {
      name: 'binance-tracker-watchlist',
      // Persist toàn bộ symbols array
    }
  )
)