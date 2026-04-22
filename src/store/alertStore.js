// src/store/alertStore.js
// Thêm persist middleware (v7) — alerts được lưu localStorage khi thay đổi
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

      addAlert: (symbol, targetPrice, direction) => {
        const alert = {
          id: nextId++,
          symbol,
          targetPrice: parseFloat(targetPrice),
          direction,
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
        // notifGranted KHÔNG persist — browser tự nhớ permission
      }),
    }
  )
)