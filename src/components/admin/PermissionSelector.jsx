// src/components/admin/PermissionSelector.jsx
import { useState } from 'react'
import { ChevronDown, ChevronRight, CheckSquare, Square, Info } from 'lucide-react'
import { PERMISSION_CATEGORIES, PERMISSION_TEMPLATES } from '@/utils/permissions'

const PermissionSelector = ({ selected = [], onChange }) => {
  const [expanded, setExpanded] = useState(['fees']) // fees open by default
  const [hoveredPerm, setHoveredPerm] = useState(null)

  const toggle = (name) => {
    onChange(selected.includes(name)
      ? selected.filter(p => p !== name)
      : [...selected, name]
    )
  }

  const toggleCategory = (categoryPerms) => {
    const names  = categoryPerms.map(p => p.name)
    const allOn  = names.every(n => selected.includes(n))
    const others = selected.filter(n => !names.includes(n))
    onChange(allOn ? others : [...new Set([...others, ...names])])
  }

  const applyTemplate = (templateKey) => {
    const tmpl = PERMISSION_TEMPLATES[templateKey]
    if (tmpl) onChange(tmpl.permissions)
  }

  const selectedCount = selected.length
  const totalCount    = PERMISSION_CATEGORIES.reduce((s, c) => s + c.permissions.length, 0)

  return (
    <div className="space-y-4">
      {/* Template quick-fill */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color:'var(--color-text-muted)' }}>
          Quick Templates
        </p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(PERMISSION_TEMPLATES).map(([key, tmpl]) => (
            <button key={key} onClick={() => applyTemplate(key)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{ backgroundColor:'var(--color-surface-raised)', color:'var(--color-brand)', border:'1px solid var(--color-border)' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor='#eff6ff'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor='var(--color-surface-raised)'}>
              {tmpl.label}
            </button>
          ))}
          <button onClick={() => onChange([])}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{ backgroundColor:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca' }}>
            Clear All
          </button>
        </div>
      </div>

      {/* Count */}
      <div className="flex items-center justify-between text-xs" style={{ color:'var(--color-text-muted)' }}>
        <span>{selectedCount} of {totalCount} permissions selected</span>
        <div className="w-32 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor:'var(--color-surface-raised)' }}>
          <div className="h-full rounded-full" style={{ width:`${(selectedCount/totalCount)*100}%`, backgroundColor:'var(--color-brand)' }}/>
        </div>
      </div>

      {/* Accordion categories */}
      <div className="space-y-2">
        {PERMISSION_CATEGORIES.map(cat => {
          const isOpen      = expanded.includes(cat.key)
          const catNames    = cat.permissions.map(p => p.name)
          const allSelected = catNames.every(n => selected.includes(n))
          const someSelected= catNames.some(n => selected.includes(n))
          const catCount    = catNames.filter(n => selected.includes(n)).length

          return (
            <div key={cat.key} className="rounded-xl overflow-hidden"
              style={{ border:'1px solid var(--color-border)' }}>
              {/* Category header */}
              <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                style={{ backgroundColor: isOpen ? 'var(--color-surface-raised)' : 'var(--color-surface)' }}
                onClick={() => setExpanded(prev => isOpen ? prev.filter(k=>k!==cat.key) : [...prev,cat.key])}
              >
                {isOpen ? <ChevronDown size={15} style={{ color:'var(--color-text-muted)' }}/> : <ChevronRight size={15} style={{ color:'var(--color-text-muted)' }}/>}
                <button
                  onClick={e => { e.stopPropagation(); toggleCategory(cat.permissions) }}
                  className="shrink-0"
                >
                  {allSelected
                    ? <CheckSquare size={16} style={{ color:'var(--color-brand)' }}/>
                    : someSelected
                    ? <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor:'var(--color-brand)' }}><div className="w-2 h-0.5 bg-white rounded"/></div>
                    : <Square size={16} style={{ color:'var(--color-text-muted)' }}/>
                  }
                </button>
                <span className="flex-1 text-sm font-semibold" style={{ color:'var(--color-text-primary)' }}>{cat.label}</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    backgroundColor: catCount>0 ? '#eff6ff' : 'var(--color-surface-raised)',
                    color          : catCount>0 ? 'var(--color-brand)' : 'var(--color-text-muted)',
                  }}>
                  {catCount}/{cat.permissions.length}
                </span>
              </div>

              {/* Permissions list */}
              {isOpen && (
                <div className="divide-y" style={{ borderColor:'var(--color-border)' }}>
                  {cat.permissions.map(perm => {
                    const isOn = selected.includes(perm.name)
                    return (
                      <div key={perm.name}
                        className="flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors"
                        onClick={() => toggle(perm.name)}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor='var(--color-surface-raised)'; setHoveredPerm(perm.name) }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor='transparent'; setHoveredPerm(null) }}
                      >
                        <div className="mt-0.5 shrink-0">
                          {isOn
                            ? <CheckSquare size={15} style={{ color:'var(--color-brand)' }}/>
                            : <Square size={15} style={{ color:'var(--color-text-muted)' }}/>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium" style={{ color: isOn ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
                            {perm.label}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color:'var(--color-text-muted)' }}>
                            {perm.name}
                          </p>
                          {hoveredPerm === perm.name && perm.description && (
                            <p className="text-xs mt-1 italic" style={{ color:'var(--color-brand)' }}>
                              {perm.description}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default PermissionSelector