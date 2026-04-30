import usePageTitle from '@/hooks/usePageTitle'
import FeeStructurePage from '@/pages/fees/FeeStructurePage'

const FeeStructureView = () => {
  usePageTitle('Fee Structure')
  return <FeeStructurePage apiMode="accountant" />
}

export default FeeStructureView
