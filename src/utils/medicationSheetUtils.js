export function buildMedicationFormData(medicationRows, medicationSheet) {
  const safeRows = Array.isArray(medicationRows) ? medicationRows : []
  const sheet =
    medicationSheet &&
    typeof medicationSheet === 'object' &&
    !Array.isArray(medicationSheet)
      ? medicationSheet
      : {}
  const sheetRows = Array.isArray(sheet.rows) ? sheet.rows : []

  return {
    ...sheet,
    rows: safeRows.length > 0 ? safeRows : sheetRows,
  }
}

export function mergePrescribedMedicationRows(existingRows, prescribedOptions) {
  const safeRows = Array.isArray(existingRows) ? [...existingRows] : []
  const prescribed = Array.isArray(prescribedOptions) ? prescribedOptions : []

  prescribed.forEach((med) => {
    const name = med?.itemName?.trim()
    if (!name) return

    const exists = safeRows.some(
      (row) => row?.label === name || row?.value === name,
    )
    if (!exists) {
      safeRows.push({ label: name, value: name })
    }
  })

  return safeRows
}
