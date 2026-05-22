/** IUI Self (2) and IUI Donor (3) — discharge summary does not apply. */
export const IUI_TREATMENT_TYPE_IDS = [2, 3]

export function isIuiTreatment({
  treatmentTypeId,
  treatmentType,
  treatementType,
} = {}) {
  if (
    treatmentTypeId != null &&
    IUI_TREATMENT_TYPE_IDS.includes(Number(treatmentTypeId))
  ) {
    return true
  }
  const name = String(treatmentType || treatementType || '').toUpperCase()
  return name.includes('IUI')
}
