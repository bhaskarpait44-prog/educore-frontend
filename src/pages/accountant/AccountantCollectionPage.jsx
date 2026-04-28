import StudentFeePage from '@/pages/fees/StudentFeePage'
import AccountantPageShell from './AccountantPageShell'

const AccountantCollectionPage = () => (
  <AccountantPageShell
    title="Fee Collection"
    description="Search a student, review pending invoices, collect payment, and carry balances forward when needed."
  >
    <StudentFeePage />
  </AccountantPageShell>
)

export default AccountantCollectionPage
