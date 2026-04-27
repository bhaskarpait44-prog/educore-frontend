// src/pages/accountant/FeeCollection.jsx
import usePageTitle from '@/hooks/usePageTitle'
import FeeCollectionForm from './FeeCollectionForm'

const FeeCollection = () => {
  usePageTitle('Fee Collection')
  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color:'var(--color-text-primary)' }}>Fee Collection</h1>
        <p className="text-sm mt-0.5" style={{ color:'var(--color-text-secondary)' }}>Fast 5-step counter workflow with receipt generation and keyboard shortcuts</p>
      </div>
      <div className="rounded-[1.8rem] p-6" style={{ backgroundColor:'var(--color-surface)', border:'1px solid var(--color-border)' }}>
        <FeeCollectionForm/>
      </div>
    </div>
  )
}

export default FeeCollection
