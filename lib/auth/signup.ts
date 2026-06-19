export function getCompanySignupNextStep(hasSession: boolean) {
  return hasSession ? 'dashboard' : 'verify-email';
}

export function getCompanyProvisioningMode(existingRole: unknown) {
  if (existingRole == null) return 'create';
  return existingRole === 'COMPANY' ? 'repair' : 'reject';
}
