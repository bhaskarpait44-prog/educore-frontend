import StudentFeePage from '@/pages/fees/StudentFeePage'
import AccountantPageShell from './AccountantPageShell'

const AccountantStudentFeesPage = () => (
  <AccountantPageShell
    title="Student Fee Ledger"
    description="Open any student and inspect full invoice history, paid amounts, carry-forwards, and current balances."
  >
    <StudentFeePage />
  </AccountantPageShell>
)

export default AccountantStudentFeesPage
