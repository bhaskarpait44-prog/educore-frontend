import usePageTitle from '@/hooks/usePageTitle'
import FeeStructurePage from '@/pages/fees/FeeStructurePage'

const FeeStructureManage = () => {
  usePageTitle('Manage Fee Structure')
  return <FeeStructurePage />
}

export default FeeStructureManage
