// src/store/chartStore.js — v29: thêm showStochRSI

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useChartStore = create(
  persist(
    (set) => ({
      symbol: 'BTCUSDT',
      interval: '1m',
      market: 'futures',

      showMA: { 20: true, 50: true, 200: false },
      showEMA: { 9: false, 21: false },
      showRSI: true,
      showVolume: true,
      showMACD: false,
      showBB: false,
      showOI: false,
      showTakerVol: false,
      showCVD: false,
      showLiq: false,
      showFR: false,

      // ── v21: Multi-timeframe ─────────────────────────────────────────────
      showDualChart: false,
      interval2: '1h',

      // ── v26: VWAP ────────────────────────────────────────────────────────
      showVWAP: false,

      // ── v29: Stochastic RSI ──────────────────────────────────────────────
      showStochRSI: false,    // StochRSI(14,14,3,3) panel bên dưới chart

      // Alert sound settings
      alertVolume: 0.4,
      alertTone: 'sine',

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
      setShowLiq: (v) => set({ showLiq: v }),
      setShowFR:  (v) => set({ showFR: v }),
      setShowDualChart: (v) => set({ showDualChart: v }),
      setInterval2: (v) => set({ interval2: v }),
      setShowVWAP: (v) => set({ showVWAP: v }),
      setShowStochRSI: (v) => set({ showStochRSI: v }),   // ← v29
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
        showLiq: state.showLiq,
        showFR: state.showFR,
        showDualChart: state.showDualChart,
        interval2: state.interval2,
        showVWAP: state.showVWAP,
        showStochRSI: state.showStochRSI,   // ← v29
        alertVolume: state.alertVolume,
        alertTone: state.alertTone,
      }),
    }
  )
)