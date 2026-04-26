// src/store/chartStore.js — v26: thêm showVWAP

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useChartStore = create(
  persist(
    (set) => ({
      symbol: 'BTCUSDT',
      interval: '1m',
      market: 'futures',

      showMA: { 20: true, 50: true, 200: false },
      showEMA: { 9: false, 21: false },   // EMA overlay — mặc định tắt
      showRSI: true,
      showVolume: true,
      showMACD: false,
      showBB: false,
      showOI: false,
      showTakerVol: false,
      showCVD: false,
      showLiq: false,   // Liquidation markers trên chart (Futures only)
      showFR: false,    // Funding Rate History chart (Futures only)

      // ── v21: Multi-timeframe ─────────────────────────────────────────────
      showDualChart: false,   // bật/tắt chart thứ 2 song song
      interval2: '1h',        // interval của chart thứ 2 (mặc định 1h trend)

      // ── v26: VWAP ────────────────────────────────────────────────────────
      showVWAP: false,        // VWAP overlay trên chart chính

      // Alert sound settings
      alertVolume: 0.4,          // 0.0 – 1.0
      alertTone: 'sine',       // 'sine' | 'square' | 'sawtooth' | 'triangle'

      setSymbol: (symbol) => set({ symbol }),
      setInterval: (interval) => set({ interval }),
      setMarket: (market) => set({ market }),
      setShowMA: (showMA) => set({ showMA }),
      setShowEMA: (showEMA) => set({ showEMA }),
      setShowRSI: (v) => set({ showRSI: v }),
      setShowVolume: (v) => set({ showVolume: v }),
      setShowMACD: (v) => set({ showMACD: v }),
      setShowBB: (v) => set({ showBB: v }),
      setShowOI:  (v) => set({ showOI: v }),
      setShowTakerVol: (v) => set({ showTakerVol: v }),
      setShowCVD: (v) => set({ showCVD: v }),
      setShowLiq: (v) => set({ showLiq: v }),   // ← v19
      setShowFR:  (v) => set({ showFR: v }),    // ← v20
      setShowDualChart: (v) => set({ showDualChart: v }),  // ← v21
      setInterval2: (v) => set({ interval2: v }),          // ← v21
      setShowVWAP: (v) => set({ showVWAP: v }),             // ← v26
      setAlertVolume: (v) => set({ alertVolume: v }),
      setAlertTone: (v) => set({ alertTone: v }),
    }),
    {
      name: 'binance-tracker-chart',
      partialize: (state) => ({
        symbol: state.symbol,
        interval: state.interval,
        market: state.market,
        showMA: state.showMA,
        showEMA: state.showEMA,
        showRSI: state.showRSI,
        showVolume: state.showVolume,
        showMACD: state.showMACD,
        showBB: state.showBB,
        showOI: state.showOI,
        showTakerVol: state.showTakerVol,
        showCVD: state.showCVD,
        showLiq: state.showLiq,   // ← v19
        showFR: state.showFR,     // ← v20
        showDualChart: state.showDualChart,  // ← v21
        interval2: state.interval2,          // ← v21
        showVWAP: state.showVWAP,            // ← v26
        alertVolume: state.alertVolume,
        alertTone: state.alertTone,
      }),
    }
  )
)