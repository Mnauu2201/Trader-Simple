// src/store/marketStore.js
// PERF FIX v8:
//
// VẤN ĐỀ CŨ:
//   updatePrice: (symbol, data) => set(state => ({ prices: { ...state.prices, [symbol]: ... } }))
//   → spread 300+ keys mỗi WS tick (~180 ticks/giây)
//   → Zustand tạo object mới → notify tất cả subscriber → re-render toàn app
//
// GIẢI PHÁP:
//   1. pricesMap sống ngoài Zustand (module-level) — mutate trực tiếp, không trigger re-render
//   2. Zustand chỉ giữ _tick counter (số nhỏ)
//   3. updatePrice: mutate pricesMap + gom batch qua requestAnimationFrame
//      → flush tối đa 1 lần/frame (~60fps) dù nhận bao nhiêu WS message
//   4. Component dùng prices getter — vẫn tương thích code cũ

import { create } from 'zustand'

// Data thật — sống ngoài Zustand, mutate in-place
const _prices = {}
let _rafPending = false

export const useMarketStore = create((set, get) => ({
  // Chỉ dùng để trigger re-render theo batch, không lưu data thật
  _tick: 0,

  updatePrice: (symbol, data) => {
    const prev = _prices[symbol]

    // Skip hoàn toàn nếu giá + change không đổi
    if (
      prev &&
      prev.price === data.price &&
      prev.change24h === data.change24h
    ) return

    // Mutate trực tiếp — O(1), không copy toàn bộ object
    _prices[symbol] = prev ? { ...prev, ...data } : { ...data }

    // Gom nhiều update trong cùng 1 animation frame → flush 1 lần
    if (!_rafPending) {
      _rafPending = true
      requestAnimationFrame(() => {
        _rafPending = false
        set(s => ({ _tick: s._tick + 1 }))
      })
    }
  },

  setPrices: (pricesMap) => {
    // Bulk replace (lúc init từ REST) — copy vào _prices
    Object.keys(_prices).forEach(k => delete _prices[k])
    Object.assign(_prices, pricesMap)
    set(s => ({ _tick: s._tick + 1 }))
  },

  // Getter để component đọc — trả về reference thật
  // Dùng như cũ: const prices = useMarketStore(s => s.prices)
  get prices() { return _prices },
}))