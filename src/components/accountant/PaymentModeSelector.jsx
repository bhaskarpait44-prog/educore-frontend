import { Landmark, Smartphone, Wallet, ScrollText, IndianRupee } from 'lucide-react'

const MODES = [
  { value: 'cash', label: 'Cash', icon: Wallet },
  { value: 'online', label: 'Online', icon: Landmark },
  { value: 'cheque', label: 'Cheque', icon: ScrollText },
  { value: 'dd', label: 'DD', icon: IndianRupee },
  { value: 'upi', label: 'UPI', icon: Smartphone },
]

const PaymentModeSelector = ({ value, onChange }) => (
  <div className="grid gap-3 sm:grid-cols-5">
    {MODES.map((mode) => {
      const Icon = mode.icon
      const active = value === mode.value
      return (
        <button
          key={mode.value}
          type="button"
          onClick={() => onChange(mode.value)}
          className="rounded-[20px] border px-3 py-4 text-center"
          style={{
            backgroundColor: active ? '#fff7ed' : 'var(--color-surface)',
            borderColor: active ? '#fb923c' : 'var(--color-border)',
            color: active ? '#c2410c' : 'var(--color-text-secondary)',
          }}
        >
          <div className="mb-2 flex justify-center">
            <Icon size={18} />
          </div>
          <div className="text-sm font-semibold">{mode.label}</div>
        </button>
      )
    })}
  </div>
)

export default PaymentModeSelector
