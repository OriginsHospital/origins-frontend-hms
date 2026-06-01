/**
 * Patient has started treatment when an active visit has a treatment cycle.
 * Matches backend patientBasicDetailsQuery treatmentExists logic.
 */
export function patientHasStartedTreatment(patientInfo) {
  if (!patientInfo) return false
  if (
    patientInfo.treatmentExists === 1 ||
    patientInfo.treatmentExists === true
  ) {
    return true
  }
  if (patientInfo.treatmentDetails) return true
  return false
}

export function canScheduleFutureCycle(patientInfo) {
  return !!patientInfo && !patientHasStartedTreatment(patientInfo)
}

/** Active visit treatments from patient register visitInfo payload */
export function activeVisitHasTreatments(visitInfoData) {
  return (visitInfoData?.Treatments?.length ?? 0) > 0
}
