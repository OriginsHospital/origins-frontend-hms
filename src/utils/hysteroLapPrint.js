import dayjs from 'dayjs'

const formatDate = (value) => {
  if (!value) return '—'
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('DD-MM-YYYY') : '—'
}

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const fieldRow = (label, value) => `
  <div class="field">
    <span class="label">${escapeHtml(label)}</span>
    <span class="value">${escapeHtml(value || '—')}</span>
  </div>`

const mapReportToPrintFields = (report = {}) => {
  const legacyFinalDiagnosis =
    !report.finalDiagnosisAfterOperation &&
    report.consultantName &&
    !report.expertConsultant
      ? report.consultantName
      : ''

  return {
    formType: report.formType || 'Hystero/Lap',
    clinicalDiagnosis: report.clinicalDiagnosis || '',
    lmp: formatDate(report.lmp),
    dayOfCycle: report.dayOfCycle || '',
    admissionDate: formatDate(report.admissionDate),
    procedureDate: formatDate(report.procedureDate),
    dischargeDate: formatDate(report.dischargeDate),
    procedureType: report.procedureType || '',
    finalDiagnosisAfterOperation:
      report.finalDiagnosisAfterOperation || legacyFinalDiagnosis || '',
    hospitalBranch: report.hospitalBranch || '',
    gynecologist: report.gynecologist || '',
    assistant: report.assistant || '',
    anesthetist: report.anesthetist || '',
    otAssistant: report.otAssistant || '',
    diagnosis: report.diagnosis || '',
    operativeFindings: report.operativeFindings || '',
    procedure: report.anesthesiaType || report.procedure || '',
    entry: report.entry || '',
    uterus: report.uterus || '',
    endometrialThickness: report.endometrialThickness || '',
    abnormality: report.distensionMedia || report.abnormality || '',
    intraopComplications: report.intraopComplications || '',
    postopCourse: report.postopCourse || '',
    reviewOn: formatDate(report.reviewOn),
    dischargeMedications: report.dischargeMedications || '',
    expertConsultant: report.expertConsultant || report.consultantName || '',
  }
}

export const buildHysteroLapPrintBodyHtml = (report = {}) => {
  const fields = mapReportToPrintFields(report)
  const title = fields.formType
    ? `${fields.formType} Operation Notes`
    : 'Hystero/Lap Operation Notes'

  return `
    <h1>${escapeHtml(title)}</h1>
    ${fieldRow('Clinical Diagnosis', fields.clinicalDiagnosis)}
    ${fieldRow('LMP', fields.lmp)}
    ${fieldRow('Day of Cycle', fields.dayOfCycle)}
    ${fieldRow('Date of Admission', fields.admissionDate)}
    ${fieldRow('Date of Procedure', fields.procedureDate)}
    ${fieldRow('Date of Discharge', fields.dischargeDate)}
    ${fieldRow('Type of Procedures', fields.procedureType)}
    ${fieldRow('Final Diagnosis After Operation', fields.finalDiagnosisAfterOperation)}
    ${fieldRow('Hospital', fields.hospitalBranch)}
    ${fieldRow('Gynaecologist', fields.gynecologist)}
    ${fieldRow('Assistant', fields.assistant)}
    ${fieldRow('Anaesthetist', fields.anesthetist)}
    ${fieldRow('OT Assistant', fields.otAssistant)}
    ${fieldRow('Diagnosis', fields.diagnosis)}
    ${fieldRow('Operative Findings', fields.operativeFindings)}
    ${fieldRow('Procedure', fields.procedure)}
    ${fieldRow('Entry', fields.entry)}
    ${fieldRow('Uterus', fields.uterus)}
    ${fieldRow('Endometrial Thickness', fields.endometrialThickness)}
    ${fieldRow('Abnormality', fields.abnormality)}
    ${fieldRow('Intra Operation Complication', fields.intraopComplications)}
    ${fieldRow('Post Operation Course', fields.postopCourse)}
    ${fieldRow('Review On', fields.reviewOn)}
    ${fieldRow('Discharge Medication', fields.dischargeMedications)}
    ${fieldRow('Consultant Name', fields.expertConsultant)}
  `
}

export const buildHysteroLapPrintHtml = (report = {}) => {
  const body = buildHysteroLapPrintBodyHtml(report)
  const title = report?.formType || 'Hystero/Lap'

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>${escapeHtml(title)} Operation Notes</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
      h1 { font-size: 20px; margin-bottom: 16px; text-align: center; }
      .field { margin-bottom: 10px; }
      .label { font-weight: 600; display: block; margin-bottom: 2px; }
      .value { white-space: pre-wrap; }
    </style>
  </head>
  <body>${body}</body>
</html>`
}

export const openHysteroLapPrintWindow = (report = {}) => {
  const html = buildHysteroLapPrintHtml(report)
  const printWindow = window.open('', '_blank', 'width=900,height=700')
  if (!printWindow) return false

  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
  return true
}
