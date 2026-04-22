// IntervalSelector.jsx
// Tách riêng component chọn khung thời gian
// Có thể dùng trong ChartPanel hoặc bất kỳ đâu

import { useChartStore } from '../store/chartStore'

const INTERVALS = [
  { label: '1m', value: '1m' },
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
  { label: '1h', value: '1h' },
  { label: '4h', value: '4h' },
  { label: '1d', value: '1d' },
  { label: '1W', value: '1w' },
]

export default function IntervalSelector() {
  const { interval, setInterval } = useChartStore()

  return (
    <div className="flex gap-1">
      {INTERVALS.map(({ label, value }) => (
        <button
          key={value}
          onClick={() => setInterval(value)}
          className={`px-3 py-1 text-xs rounded transition-colors ${interval === value
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}