export function isStudentPortalSetupError(error) {
  const message = String(error?.message || '').toLowerCase()
  return (
    message.includes('no active academic enrollment found') ||
    message.includes('student account not found or inactive')
  )
}
