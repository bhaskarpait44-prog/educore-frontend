// src/pages/exams/ExamsPage.jsx
import { useState } from 'react'
import { ClipboardList, PenLine, BarChart3 } from 'lucide-react'
import usePageTitle from '@/hooks/usePageTitle'
import { cn } from '@/utils/helpers'
import ExamsListPage   from './ExamsListPage'
import EnterMarksPage  from './EnterMarksPage'
import ResultsPage     from './ResultsPage'

const TABS = [
  { key: 'exams',   label: 'Exams',        icon: ClipboardList },
  { key: 'marks',   label: 'Enter Marks',  icon: PenLine       },
  { key: 'results', label: 'Results',      icon: BarChart3     },
]

const ExamsPage = () => {
  usePageTitle('Exams & Results')
  const [tab, setTab] = useState('exams')

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Exams & Results
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            Manage examinations, marks entry and final results
          </p>
        </div>
        <div
          className="flex p-1 rounded-2xl gap-1 w-fit"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150"
              style={{
                backgroundColor: tab === t.key ? 'var(--color-brand)' : 'transparent',
                color          : tab === t.key ? '#fff' : 'var(--color-text-secondary)',
              }}
            >
              <t.icon size={15} />
              <span className="hidden sm:block">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {tab === 'exams'   && <ExamsListPage   onNavigate={setTab} />}
      {tab === 'marks'   && <EnterMarksPage  />}
      {tab === 'results' && <ResultsPage     />}
    </div>
  )
}

export default ExamsPage