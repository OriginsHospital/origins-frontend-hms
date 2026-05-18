import React, { useState, useEffect, useRef } from 'react'
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Button,
  Grid,
  Select,
  InputLabel,
  FormControl,
  Autocomplete,
  Paper,
  IconButton,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import dayjs from 'dayjs'
import ImageIcon from '@mui/icons-material/Image'
import DeleteIcon from '@mui/icons-material/Delete'
import PrintIcon from '@mui/icons-material/Print'

const BRANCH_OPTIONS = ['Khammam', 'Hanmkonda', 'Hyderabad', 'Sathupalli']
const GYNAECOLOGIST_OPTIONS = [
  'Dr. K. Jhansi Rani',
  'Dr. P. Sravani',
  'Dr. S. Swetha',
  'Dr. Annapurna',
  'Dr. Sneha',
  'Dr. D. Teja',
]
const EXPERT_OPTIONS = [
  'Dr. K. Jhansi Rani',
  'Dr. P. Sravani',
  'Dr. S. Swetha',
  'Dr. Annapurna',
  'Dr. Sneha',
  'Dr. D. Teja',
]

const emptyForm = () => ({
  formType: '',
  clinicalDiagnosis: '',
  lmp: null,
  dayOfCycle: '',
  admissionDate: null,
  procedureDate: null,
  dischargeDate: null,
  procedureType: '',
  finalDiagnosisAfterOperation: '',
  hospitalBranch: '',
  gynecologist: '',
  assistant: '',
  anesthetist: '',
  otAssistant: '',
  diagnosis: '',
  procedure: '',
  entry: '',
  uterus: '',
  endometrialThickness: '',
  abnormality: '',
  operativeFindings: '',
  intraopComplications: '',
  postopCourse: '',
  reviewOn: null,
  dischargeMedications: '',
  expertConsultant: '',
})

function HysteroLapOperationNotesForm({
  formType,
  visitId,
  patientId,
  initialData = null,
  onSave,
  onCancel,
  onImageUpload,
}) {
  const printRef = useRef(null)
  const [form, setForm] = useState(emptyForm())
  const [errors, setErrors] = useState({})
  const [uploadedImages, setUploadedImages] = useState([])
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    if (initialData) {
      const legacyFinalDiagnosis =
        !initialData.finalDiagnosisAfterOperation &&
        initialData.consultantName &&
        !initialData.expertConsultant
          ? initialData.consultantName
          : ''

      setForm({
        formType: initialData.formType || formType || '',
        clinicalDiagnosis: initialData.clinicalDiagnosis || '',
        lmp: initialData.lmp ? dayjs(initialData.lmp) : null,
        dayOfCycle: initialData.dayOfCycle || '',
        admissionDate: initialData.admissionDate
          ? dayjs(initialData.admissionDate)
          : null,
        procedureDate: initialData.procedureDate
          ? dayjs(initialData.procedureDate)
          : null,
        dischargeDate: initialData.dischargeDate
          ? dayjs(initialData.dischargeDate)
          : null,
        procedureType: initialData.procedureType || '',
        finalDiagnosisAfterOperation:
          initialData.finalDiagnosisAfterOperation ||
          legacyFinalDiagnosis ||
          '',
        hospitalBranch: initialData.hospitalBranch || '',
        gynecologist: initialData.gynecologist || '',
        assistant: initialData.assistant || '',
        anesthetist: initialData.anesthetist || '',
        otAssistant: initialData.otAssistant || '',
        diagnosis: initialData.diagnosis || '',
        procedure: initialData.anesthesiaType || initialData.procedure || '',
        entry: initialData.entry || '',
        uterus: initialData.uterus || '',
        endometrialThickness: initialData.endometrialThickness || '',
        abnormality:
          initialData.distensionMedia || initialData.abnormality || '',
        operativeFindings: initialData.operativeFindings || '',
        intraopComplications: initialData.intraopComplications || '',
        postopCourse: initialData.postopCourse || '',
        reviewOn: initialData.reviewOn ? dayjs(initialData.reviewOn) : null,
        dischargeMedications: initialData.dischargeMedications || '',
        expertConsultant: initialData.consultantName || '',
      })
      setUploadedImages(
        Array.isArray(initialData.referenceImages)
          ? initialData.referenceImages
              .map((image) => image?.imageUrl)
              .filter(Boolean)
          : [],
      )
    } else if (formType) {
      setForm((prev) => ({ ...prev, formType }))
    }
  }, [initialData, formType])

  const handleChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  const validate = () => {
    const nextErrors = {}
    if (!form.procedureType?.trim()) nextErrors.procedureType = 'Required'
    if (!form.hospitalBranch) nextErrors.hospitalBranch = 'Required'
    if (!form.gynecologist) nextErrors.gynecologist = 'Required'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const buildPayload = () => ({
    patientId,
    visitId,
    formType: form.formType || formType,
    clinicalDiagnosis: form.clinicalDiagnosis,
    lmp: form.lmp ? form.lmp.format('YYYY-MM-DD') : null,
    dayOfCycle: form.dayOfCycle,
    admissionDate: form.admissionDate
      ? form.admissionDate.format('YYYY-MM-DD')
      : null,
    procedureDate: form.procedureDate
      ? form.procedureDate.format('YYYY-MM-DD')
      : null,
    dischargeDate: form.dischargeDate
      ? form.dischargeDate.format('YYYY-MM-DD')
      : null,
    procedureType: form.procedureType,
    finalDiagnosisAfterOperation: form.finalDiagnosisAfterOperation,
    hospitalBranch: form.hospitalBranch,
    gynecologist: form.gynecologist,
    assistant: form.assistant,
    anesthetist: form.anesthetist,
    otAssistant: form.otAssistant,
    diagnosis: form.diagnosis,
    anesthesiaType: form.procedure,
    entry: form.entry,
    uterus: form.uterus,
    endometrialThickness: form.endometrialThickness,
    distensionMedia: form.abnormality,
    operativeFindings: form.operativeFindings,
    intraopComplications: form.intraopComplications,
    postopCourse: form.postopCourse,
    reviewOn: form.reviewOn ? form.reviewOn.format('YYYY-MM-DD') : null,
    dischargeMedications: form.dischargeMedications,
    consultantName: form.expertConsultant,
    expertConsultant: form.expertConsultant,
  })

  const handleSave = () => {
    if (!validate()) return
    onSave?.(buildPayload())
  }

  const handlePrint = () => {
    const printContent = printRef.current
    if (!printContent) return

    const printWindow = window.open('', '_blank', 'width=900,height=700')
    if (!printWindow) return

    printWindow.document.write(`
      <html>
        <head>
          <title>${form.formType || formType || 'Hystero/Lap'} Operation Notes</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
            h1 { font-size: 20px; margin-bottom: 16px; }
            .field { margin-bottom: 10px; }
            .label { font-weight: 600; display: block; margin-bottom: 2px; }
            .value { white-space: pre-wrap; }
          </style>
        </head>
        <body>${printContent.innerHTML}</body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
    printWindow.close()
  }

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length || !onImageUpload) return

    setIsUploading(true)
    try {
      const uploadedUrls = []
      for (const file of files) {
        const url = await onImageUpload(file, visitId)
        if (url) uploadedUrls.push(url)
      }
      if (uploadedUrls.length) {
        setUploadedImages((prev) => [...prev, ...uploadedUrls])
      }
    } catch (error) {
      console.error('Error uploading images:', error)
    } finally {
      setIsUploading(false)
      e.target.value = ''
    }
  }

  const handleRemoveImage = (index) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index))
  }

  const formatDate = (value) =>
    value && dayjs(value).isValid() ? dayjs(value).format('DD-MM-YYYY') : '—'

  const title =
    form.formType || formType
      ? `${form.formType || formType} Operation Notes`
      : 'Hystero/Lap Operation Notes'

  return (
    <Box p={2}>
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        {title}
      </Typography>

      <Box ref={printRef} sx={{ display: 'none' }}>
        <h1>{title}</h1>
        <div className="field">
          <span className="label">Clinical Diagnosis</span>
          <span className="value">{form.clinicalDiagnosis || '—'}</span>
        </div>
        <div className="field">
          <span className="label">LMP</span>
          <span className="value">{formatDate(form.lmp)}</span>
        </div>
        <div className="field">
          <span className="label">Day of Cycle</span>
          <span className="value">{form.dayOfCycle || '—'}</span>
        </div>
        <div className="field">
          <span className="label">Date of Admission</span>
          <span className="value">{formatDate(form.admissionDate)}</span>
        </div>
        <div className="field">
          <span className="label">Date of Procedure</span>
          <span className="value">{formatDate(form.procedureDate)}</span>
        </div>
        <div className="field">
          <span className="label">Date of Discharge</span>
          <span className="value">{formatDate(form.dischargeDate)}</span>
        </div>
        <div className="field">
          <span className="label">Type of Procedures</span>
          <span className="value">{form.procedureType || '—'}</span>
        </div>
        <div className="field">
          <span className="label">Final Diagnosis After Operation</span>
          <span className="value">
            {form.finalDiagnosisAfterOperation || '—'}
          </span>
        </div>
        <div className="field">
          <span className="label">Hospital</span>
          <span className="value">{form.hospitalBranch || '—'}</span>
        </div>
        <div className="field">
          <span className="label">Gynaecologist</span>
          <span className="value">{form.gynecologist || '—'}</span>
        </div>
        <div className="field">
          <span className="label">Assistant</span>
          <span className="value">{form.assistant || '—'}</span>
        </div>
        <div className="field">
          <span className="label">Anaesthetist</span>
          <span className="value">{form.anesthetist || '—'}</span>
        </div>
        <div className="field">
          <span className="label">OT Assistant</span>
          <span className="value">{form.otAssistant || '—'}</span>
        </div>
        <div className="field">
          <span className="label">Diagnosis</span>
          <span className="value">{form.diagnosis || '—'}</span>
        </div>
        <div className="field">
          <span className="label">Operative Findings</span>
          <span className="value">{form.operativeFindings || '—'}</span>
        </div>
        <div className="field">
          <span className="label">Procedure</span>
          <span className="value">{form.procedure || '—'}</span>
        </div>
        <div className="field">
          <span className="label">Entry</span>
          <span className="value">{form.entry || '—'}</span>
        </div>
        <div className="field">
          <span className="label">Uterus</span>
          <span className="value">{form.uterus || '—'}</span>
        </div>
        <div className="field">
          <span className="label">Endometrial Thickness</span>
          <span className="value">{form.endometrialThickness || '—'}</span>
        </div>
        <div className="field">
          <span className="label">Abnormality</span>
          <span className="value">{form.abnormality || '—'}</span>
        </div>
        <div className="field">
          <span className="label">Intra Operation Complication</span>
          <span className="value">{form.intraopComplications || '—'}</span>
        </div>
        <div className="field">
          <span className="label">Post Operation Course</span>
          <span className="value">{form.postopCourse || '—'}</span>
        </div>
        <div className="field">
          <span className="label">Review On</span>
          <span className="value">{formatDate(form.reviewOn)}</span>
        </div>
        <div className="field">
          <span className="label">Discharge Medication</span>
          <span className="value">{form.dischargeMedications || '—'}</span>
        </div>
        <div className="field">
          <span className="label">Consultant Name</span>
          <span className="value">{form.expertConsultant || '—'}</span>
        </div>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Clinical Diagnosis"
            value={form.clinicalDiagnosis}
            onChange={(e) => handleChange('clinicalDiagnosis', e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <DatePicker
            label="LMP"
            value={form.lmp}
            onChange={(val) => handleChange('lmp', val)}
            slotProps={{ textField: { fullWidth: true } }}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            label="Day of Cycle"
            value={form.dayOfCycle}
            onChange={(e) => handleChange('dayOfCycle', e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <DatePicker
            label="Date of Admission"
            value={form.admissionDate}
            onChange={(val) => handleChange('admissionDate', val)}
            slotProps={{ textField: { fullWidth: true } }}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <DatePicker
            label="Date of Procedure"
            value={form.procedureDate}
            onChange={(val) => handleChange('procedureDate', val)}
            slotProps={{ textField: { fullWidth: true } }}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <DatePicker
            label="Date of Discharge"
            value={form.dischargeDate}
            onChange={(val) => handleChange('dischargeDate', val)}
            slotProps={{ textField: { fullWidth: true } }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="Type of Procedures"
            value={form.procedureType}
            onChange={(e) => handleChange('procedureType', e.target.value)}
            fullWidth
            required
            error={!!errors.procedureType}
            helperText={errors.procedureType}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Final Diagnosis After Operation"
            value={form.finalDiagnosisAfterOperation}
            onChange={(e) =>
              handleChange('finalDiagnosisAfterOperation', e.target.value)
            }
            fullWidth
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <FormControl fullWidth required error={!!errors.hospitalBranch}>
            <InputLabel>Hospital</InputLabel>
            <Select
              value={form.hospitalBranch}
              label="Hospital"
              onChange={(e) => handleChange('hospitalBranch', e.target.value)}
            >
              {BRANCH_OPTIONS.map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Autocomplete
            options={GYNAECOLOGIST_OPTIONS}
            value={form.gynecologist}
            onChange={(_, val) => handleChange('gynecologist', val || '')}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Gynaecologist"
                required
                error={!!errors.gynecologist}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            label="Assistant"
            value={form.assistant}
            onChange={(e) => handleChange('assistant', e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Anaesthetist"
            value={form.anesthetist}
            onChange={(e) => handleChange('anesthetist', e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="OT Assistant"
            value={form.otAssistant}
            onChange={(e) => handleChange('otAssistant', e.target.value)}
            fullWidth
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            label="Diagnosis"
            value={form.diagnosis}
            onChange={(e) => handleChange('diagnosis', e.target.value)}
            fullWidth
            multiline
            minRows={2}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="Operative Findings"
            value={form.operativeFindings}
            onChange={(e) => handleChange('operativeFindings', e.target.value)}
            fullWidth
            multiline
            minRows={2}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Procedure"
            value={form.procedure}
            onChange={(e) => handleChange('procedure', e.target.value)}
            fullWidth
            multiline
            minRows={2}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            label="Entry"
            value={form.entry}
            onChange={(e) => handleChange('entry', e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            label="Uterus"
            value={form.uterus}
            onChange={(e) => handleChange('uterus', e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            label="Endometrial Thickness"
            value={form.endometrialThickness}
            onChange={(e) =>
              handleChange('endometrialThickness', e.target.value)
            }
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Abnormality"
            value={form.abnormality}
            onChange={(e) => handleChange('abnormality', e.target.value)}
            fullWidth
            multiline
            minRows={2}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Intra Operation Complication"
            value={form.intraopComplications}
            onChange={(e) =>
              handleChange('intraopComplications', e.target.value)
            }
            fullWidth
            multiline
            minRows={2}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Post Operation Course"
            value={form.postopCourse}
            onChange={(e) => handleChange('postopCourse', e.target.value)}
            fullWidth
            multiline
            minRows={2}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <DatePicker
            label="Review On"
            value={form.reviewOn}
            onChange={(val) => handleChange('reviewOn', val)}
            slotProps={{ textField: { fullWidth: true } }}
          />
        </Grid>
        <Grid item xs={12} sm={8}>
          <TextField
            label="Discharge Medication"
            value={form.dischargeMedications}
            onChange={(e) =>
              handleChange('dischargeMedications', e.target.value)
            }
            fullWidth
            multiline
            minRows={2}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Autocomplete
            freeSolo
            options={EXPERT_OPTIONS}
            value={form.expertConsultant}
            inputValue={form.expertConsultant}
            onChange={(_, val) => handleChange('expertConsultant', val || '')}
            onInputChange={(_, val) => handleChange('expertConsultant', val)}
            renderInput={(params) => (
              <TextField {...params} label="Consultant Name" fullWidth />
            )}
          />
        </Grid>
      </Grid>

      <Box mt={3}>
        <Typography variant="subtitle2" gutterBottom>
          Reference Images
        </Typography>
        <Button
          variant="outlined"
          component="label"
          startIcon={<ImageIcon />}
          disabled={!onImageUpload || isUploading}
          fullWidth
        >
          {isUploading ? 'Uploading...' : 'Upload Images'}
          <input
            type="file"
            hidden
            multiple
            accept="image/*"
            onChange={handleFileUpload}
          />
        </Button>
        {uploadedImages.length > 0 && (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {uploadedImages.map((url, index) => (
              <Grid item xs={12} sm={6} md={4} key={`${url}-${index}`}>
                <Paper elevation={2} sx={{ position: 'relative', p: 1 }}>
                  <Box
                    component="img"
                    src={url}
                    alt={`Reference ${index + 1}`}
                    sx={{
                      width: '100%',
                      height: 160,
                      objectFit: 'cover',
                      borderRadius: 1,
                    }}
                  />
                  <IconButton
                    size="small"
                    color="error"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      bgcolor: 'white',
                    }}
                    onClick={() => handleRemoveImage(index)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      <Box
        mt={3}
        display="flex"
        gap={2}
        justifyContent="flex-end"
        flexWrap="wrap"
      >
        <Button variant="outlined" color="error" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
        >
          Print
        </Button>
        <Button variant="contained" color="primary" onClick={handleSave}>
          Save
        </Button>
      </Box>
    </Box>
  )
}

export default HysteroLapOperationNotesForm
