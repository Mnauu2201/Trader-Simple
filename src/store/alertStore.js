// src/store/alertStore.js — v30: thêm alert theo % change
// Key: 'binance-tracker-alerts'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// nextId dùng timestamp để tránh trùng sau reload
let nextId = Date.now()

export const useAlertStore = create(
  persist(
    (set, get) => ({
      alerts: [],
      notifGranted: false,
      notifHistory: [],   // log các alert đã trigger

      addNotifHistory: (entry) =>
        set(s => ({
          // Giữ tối đa 100 bản ghi gần nhất, mới nhất trên đầu
          notifHistory: [entry, ...s.notifHistory].slice(0, 100),
        })),

      clearNotifHistory: () => set({ notifHistory: [] }),

      // type: 'price' | 'percent'
      // percentDir: 'above' (change24h >= X%) | 'below' (change24h <= -X%) | 'either' (|change24h| >= X%)
      addAlert: (symbol, targetPrice, direction, opts = {}) => {
        const alert = {
          id: nextId++,
          symbol,
          // ── price alert fields ──
          targetPrice: parseFloat(targetPrice),
          direction,
          // ── percent alert fields (v30) ──
          type: opts.type ?? 'price',          // 'price' | 'percent'
          percentValue: opts.percentValue ?? 0, // e.g. 5 = 5%
          percentDir: opts.percentDir ?? 'either', // 'above' | 'below' | 'either'
          triggered: false,
          createdAt: Date.now(),
        }
        set(s => ({ alerts: [alert, ...s.alerts] }))
        return alert
      },

      removeAlert: (id) =>
        set(s => ({ alerts: s.alerts.filter(a => a.id !== id) })),

      clearTriggered: () =>
        set(s => ({ alerts: s.alerts.filter(a => !a.triggered) })),

      markTriggered: (id) =>
        set(s => ({
          alerts: s.alerts.map(a => a.id === id ? { ...a, triggered: true } : a),
        })),

      setNotifGranted: (v) => set({ notifGranted: v }),

      getActiveAlerts: () => get().alerts.filter(a => !a.triggered),
      getTriggeredAlerts: () => get().alerts.filter(a => a.triggered),
    }),
    {
      name: 'binance-tracker-alerts',
      partialize: (state) => ({
        alerts: state.alerts,
        notifHistory: state.notifHistory,
        // notifGranted KHÔNG persist — browser tự nhớ permission
      }),
    }
  )
)