/**
 * Utility functions for mapping branch data in reports
 */

/**
 * Gets branch name from various possible data structures
 * @param {Object} row - Row data from the report
 * @param {Array} branches - Available branches from dropdowns
 * @returns {string} - Branch name or fallback
 */
export const getBranchName = (row, branches = []) => {
  if (!row) return 'N/A'

  // Try different possible branch field structures
  if (row.branch?.name) {
    return row.branch.name
  }

  if (row.branch?.branchName) {
    return row.branch.branchName
  }

  if (row.branchName) {
    return row.branchName
  }

  if (typeof row.branch === 'string') {
    return row.branch
  }

  if (row.branchId) {
    // Try to find branch name from dropdowns
    const branch = branches.find((b) => b.id === row.branchId)
    if (branch?.name) {
      return branch.name
    }
    return `Branch ID: ${row.branchId}`
  }

  // If no branch data found, return N/A
  return 'N/A'
}

/**
 * Gets branch name with debug information
 * @param {Object} row - Row data from the report
 * @param {Array} branches - Available branches from dropdowns
 * @returns {Object} - Object with branchName and debug info
 */
export const getBranchNameWithDebug = (row, branches = []) => {
  const branchName = getBranchName(row, branches)

  return {
    branchName,
    debug: {
      hasBranch: !!row.branch,
      hasBranchId: !!row.branchId,
      hasBranchName: !!row.branchName,
      branchType: typeof row.branch,
      availableBranches: branches.length,
      rowKeys: Object.keys(row || {}),
    },
  }
}

/**
 * Maps branch data for a list of rows
 * @param {Array} rows - Array of row data
 * @param {Array} branches - Available branches from dropdowns
 * @returns {Array} - Array with mapped branch names
 */
export const mapBranchData = (rows, branches = []) => {
  return rows.map((row) => ({
    ...row,
    branchName: getBranchName(row, branches),
  }))
}

export default {
  getBranchName,
  getBranchNameWithDebug,
  mapBranchData,
}
