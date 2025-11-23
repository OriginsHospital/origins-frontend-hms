/**
 * List of allowed emails for Revenue and Revenue New reports
 * Only these email IDs are authorized to access Revenue pages
 */
const ALLOWED_REVENUE_EMAILS = [
  'karun@gmail.com',
  'originsivf@gmail.com',
  'jhansi@gmail.com',
  'nikhilsuvva77@gmail.com',
]

/**
 * Checks if a user email has access to Revenue reports
 * @param {string} userEmail - The user's email address
 * @returns {boolean} - True if the user has access, false otherwise
 */
export function hasRevenueAccess(userEmail) {
  if (!userEmail) {
    return false
  }
  return ALLOWED_REVENUE_EMAILS.includes(userEmail.toLowerCase().trim())
}

/**
 * Gets the list of allowed emails (for reference/debugging)
 * @returns {string[]} - Array of allowed email addresses
 */
export function getAllowedRevenueEmails() {
  return [...ALLOWED_REVENUE_EMAILS]
}
