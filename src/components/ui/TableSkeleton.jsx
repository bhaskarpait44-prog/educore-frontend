// src/components/ui/TableSkeleton.jsx
const TableSkeleton = ({ cols = 5, rows = 4 }) => (
  <div className="p-5 space-y-3 animate-pulse">
    {[...Array(rows)].map((_, i) => (
      <div key={i} className="flex gap-4 items-center">
        {[...Array(cols)].map((_, j) => (
          <div
            key={j}
            className="h-4 rounded flex-1"
            style={{ backgroundColor: 'var(--color-surface-raised)' }}
          />
        ))}
      </div>
    ))}
  </div>
)

export default TableSkeleton