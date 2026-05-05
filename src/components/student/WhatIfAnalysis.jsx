// src/components/student/WhatIfAnalysis.jsx
import { useState, useMemo } from 'react'
import { Calculator, RotateCcw, TrendingUp } from 'lucide-react'
import Button from '@/components/ui/Button'

const WhatIfAnalysis = ({ subjects = [], initialPercentage, initialGrade, onCalculate }) => {
  const [modifiedSubjects, setModifiedSubjects] = useState(
    subjects.map(s => ({ ...s, modifiedMarks: parseFloat(s.marks_obtained || 0) }))
  )
  const [show, setShow] = useState(false)

  const stats = useMemo(() => {
    let totalMax = 0
    let totalObtained = 0
    
    modifiedSubjects.forEach(s => {
      totalMax += parseFloat(s.total_marks || 0)
      totalObtained += parseFloat(s.modifiedMarks || 0)
    })

    const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0
    
    // Simple grading logic for UI simulation
    let grade = 'F'
    if (percentage >= 90) grade = 'A+'
    else if (percentage >= 80) grade = 'A'
    else if (percentage >= 70) grade = 'B'
    else if (percentage >= 60) grade = 'C'
    else if (percentage >= 50) grade = 'D'

    return { percentage: percentage.toFixed(2), grade }
  }, [modifiedSubjects])

  const handleUpdate = (id, val) => {
    setModifiedSubjects(prev => prev.map(s => 
      s.id === id ? { ...s, modifiedMarks: Math.min(parseFloat(val || 0), parseFloat(s.total_marks)) } : s
    ))
  }

  const reset = () => {
    setModifiedSubjects(subjects.map(s => ({ ...s, modifiedMarks: parseFloat(s.marks_obtained || 0) })))
  }

  if (!show) {
    return (
      <div className="p-4 rounded-2xl border border-dashed border-brand-200 bg-brand-50/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center">
            <Calculator size={20} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">What-If Analysis</p>
            <p className="text-xs text-gray-500">See how different marks would affect your final grade.</p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShow(true)}>Open Calculator</Button>
      </div>
    )
  }

  return (
    <div className="p-6 rounded-[28px] border-2 border-brand-500 bg-white shadow-xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-brand-600">
          <Calculator size={20} />
          <h3 className="font-bold">What-If Calculator</h3>
        </div>
        <div className="flex gap-2">
          <Button size="xs" variant="ghost" icon={RotateCcw} onClick={reset}>Reset</Button>
          <Button size="xs" variant="secondary" onClick={() => setShow(false)}>Close</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Simulated %</p>
          <p className="text-2xl font-black text-brand-600">{stats.percentage}%</p>
          <p className="text-[10px] text-gray-400 mt-1">Current: {initialPercentage}%</p>
        </div>
        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Simulated Grade</p>
          <p className="text-2xl font-black text-brand-600">{stats.grade}</p>
          <p className="text-[10px] text-gray-400 mt-1">Current: {initialGrade}</p>
        </div>
      </div>

      <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
        {modifiedSubjects.map(s => (
          <div key={s.id} className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">{s.subject}</p>
              <p className="text-[10px] text-gray-500">Max: {s.total_marks}</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max={s.total_marks}
                step="1"
                value={s.modifiedMarks}
                onChange={e => handleUpdate(s.id, e.target.value)}
                className="w-24 accent-brand-500"
              />
              <input
                type="number"
                value={s.modifiedMarks}
                onChange={e => handleUpdate(s.id, e.target.value)}
                className="w-12 text-center text-xs font-bold p-1 rounded-lg border border-gray-200"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="pt-2 border-t border-dashed border-gray-100">
        <div className="flex items-center gap-2 text-green-600">
          <TrendingUp size={14} />
          <p className="text-[11px] font-medium">
            {parseFloat(stats.percentage) > parseFloat(initialPercentage) 
              ? `You can improve your score by ${(stats.percentage - initialPercentage).toFixed(2)}%!` 
              : 'Adjust the sliders to see target marks.'}
          </p>
        </div>
      </div>
    </div>
  )
}

export default WhatIfAnalysis
