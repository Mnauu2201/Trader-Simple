// src/store/chartStore.js — v12: thêm showEMA + alertSound settings

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
        alertVolume: state.alertVolume,
        alertTone: state.alertTone,
      }),
    }
  )
)