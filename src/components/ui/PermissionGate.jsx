// src/components/ui/PermissionGate.jsx
import usePermissions from '@/hooks/usePermissions'

/**
 * PermissionGate
 *
 * Renders children only if the current user has the required permission.
 * Renders fallback (or nothing) if permission is missing.
 *
 * Props:
 *   requires   {string}    - Single permission e.g. "fees.waive"
 *   requiresAny {string[]} - At least one of these permissions
 *   requiresAll {string[]} - Must have ALL of these permissions
 *   fallback   {ReactNode} - What to render if permission missing (default: null)
 *   children   {ReactNode} - What to render if permission granted
 *
 * Usage:
 *   <PermissionGate requires="fees.waive">
 *     <WaiveButton />
 *   </PermissionGate>
 *
 *   <PermissionGate requires="fees.edit" fallback={<DisabledButton />}>
 *     <EditButton />
 *   </PermissionGate>
 */
const PermissionGate = ({
  requires,
  requiresAny,
  requiresAll,
  fallback = null,
  children,
}) => {
  const { can, canAny, canAll } = usePermissions()

  let allowed = true

  if (requires)    allowed = can(requires)
  if (requiresAny) allowed = canAny(requiresAny)
  if (requiresAll) allowed = canAll(requiresAll)

  return allowed ? children : fallback
}

export default PermissionGate