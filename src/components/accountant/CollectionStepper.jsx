const CollectionStepper = ({ step }) => {
  const steps = ['Student', 'Invoices', 'Payment', 'Review', 'Receipt']

  return (
    <div className="flex flex-wrap gap-2">
      {steps.map((label, index) => {
        const active = index === step
        const done = index < step
        return (
          <div
            key={label}
            className="flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold"
            style={{
              backgroundColor: done ? '#fed7aa' : active ? '#ffedd5' : 'var(--color-surface)',
              color: done || active ? '#9a3412' : 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)',
            }}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px]">
              {done ? 'OK' : index + 1}
            </span>
            {label}
          </div>
        )
      })}
    </div>
  )
}

export default CollectionStepper
