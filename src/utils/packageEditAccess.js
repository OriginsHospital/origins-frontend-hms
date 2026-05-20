const PACKAGE_EDIT_ALLOWED_EMAIL = 'nikhilsuvva77@gmail.com'

export function hasPackageEditAccess(userEmail) {
  if (!userEmail) {
    return false
  }
  return userEmail.trim().toLowerCase() === PACKAGE_EDIT_ALLOWED_EMAIL
}
