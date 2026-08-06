import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Select,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import VisibilityIcon from '@mui/icons-material/Visibility'
import EditIcon from '@mui/icons-material/Edit'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import RefreshIcon from '@mui/icons-material/Refresh'
import AddIcon from '@mui/icons-material/Add'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import TableViewIcon from '@mui/icons-material/TableView'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import SearchIcon from '@mui/icons-material/Search'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { DataGrid } from '@mui/x-data-grid'
import dayjs from 'dayjs'
import { debounce } from 'lodash'
import { toast } from 'react-toastify'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import Breadcrumb from '@/components/Breadcrumb'
import { withPermission } from '@/components/withPermission'
import { ACCESS_TYPES } from '@/constants/constants'
import {
  getAllPatients,
  getOTDropdowns,
  getUptResults,
  saveUptResult,
  editUptResult,
  deleteUptResult,
} from '@/constants/apis'
import { toastconfig } from '@/utils/toastconfig'
import { exportAsExcel, exportAsPDF } from '@/utils/reportExport'

const CYCLE_TYPE_OPTIONS = [
  { value: 'IVF', label: 'IVF' },
  { value: 'OI-TI', label: 'OI-TI' },
  { value: 'IUI', label: 'IUI' },
]

const UPT_RESULT_OPTIONS = [
  { value: 'Positive', label: 'Positive' },
  { value: 'Negative', label: 'Negative' },
]

const EXPORT_COLUMNS = [
  { field: 'resultDate', headerName: 'Date' },
  { field: 'branchCode', headerName: 'Branch' },
  { field: 'originsId', headerName: 'Patient ID' },
  { field: 'patientName', headerName: 'Patient Name' },
  { field: 'mobileNumber', headerName: 'Mobile' },
  { field: 'cycleType', headerName: 'Cycle Type' },
  { field: 'uptResult', headerName: 'UPT Result' },
  { field: 'createdByNurseName', headerName: 'Created By' },
]

const emptyForm = (defaultBranchId = '') => ({
  id: null,
  resultDate: dayjs(),
  branchId: defaultBranchId,
  patientId: '',
  patientName: '',
  selectedPatient: null,
  cycleType: '',
  uptResult: '',
  createdByNurseId: '',
})

const formatDateDisplay = (value) => {
  if (!value) return '—'
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('DD/MM/YYYY') : '—'
}

const getPatientDisplayName = (patient) => {
  if (!patient) return ''
  return (
    patient.Name ||
    patient.patientName ||
    `${patient.lastName || ''} ${patient.firstName || ''}`.trim() ||
    ''
  )
}

const getPatientLabel = (patient) => {
  if (!patient) return ''
  if (typeof patient === 'string') return patient
  const name = getPatientDisplayName(patient)
  const id = patient.patientId || patient.PatientId || ''
  const mobile = patient.mobileNo || patient.mobileNumber || ''
  return [id, name, mobile].filter(Boolean).join(' · ')
}

const TabPanel = ({ children, value, index }) => (
  <div hidden={value !== index} role="tabpanel">
    {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
  </div>
)

function UptResultsPage() {
  const user = useSelector((store) => store.user)
  const accessToken = user?.accessToken
  const branches = user?.branchDetails || []
  const queryClient = useQueryClient()

  const defaultBranchId = branches[0]?.id ?? ''

  const [pageTab, setPageTab] = useState(0)
  const [form, setForm] = useState(() => emptyForm(defaultBranchId))
  const [patientSuggestions, setPatientSuggestions] = useState([])
  const [isSearchingPatients, setIsSearchingPatients] = useState(false)
  const [saving, setSaving] = useState(false)
  const [viewRecord, setViewRecord] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const [fromDate, setFromDate] = useState(dayjs().subtract(30, 'day'))
  const [toDate, setToDate] = useState(dayjs())
  const [filterBranchId, setFilterBranchId] = useState('')
  const [filterCycleType, setFilterCycleType] = useState('')
  const [filterUptResult, setFilterUptResult] = useState('')
  const [filterNurseId, setFilterNurseId] = useState('')
  const [listSearch, setListSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null)

  useEffect(() => {
    if (defaultBranchId && !form.branchId) {
      setForm((prev) => ({ ...prev, branchId: defaultBranchId }))
    }
  }, [defaultBranchId, form.branchId])

  const setField = useCallback((key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }, [])

  const debouncedPatientSearch = useMemo(
    () =>
      debounce(async (searchText) => {
        if (!accessToken || !searchText || searchText.trim().length < 2) {
          setPatientSuggestions([])
          return
        }
        setIsSearchingPatients(true)
        try {
          const response = await getAllPatients(accessToken, searchText.trim())
          if (response?.status === 200 && Array.isArray(response.data)) {
            setPatientSuggestions(response.data)
          } else {
            setPatientSuggestions([])
          }
        } catch (err) {
          console.error(err)
          setPatientSuggestions([])
        } finally {
          setIsSearchingPatients(false)
        }
      }, 300),
    [accessToken],
  )

  useEffect(() => {
    return () => debouncedPatientSearch.cancel()
  }, [debouncedPatientSearch])

  const { data: otDropdowns } = useQuery({
    queryKey: ['otDropdownsData'],
    queryFn: () => getOTDropdowns(accessToken),
    enabled: !!accessToken,
  })

  const staffNurses = useMemo(() => {
    // Prefer mappingId 5 (injection sheet nurse), also include 6 if present
    const by5 = otDropdowns?.data?.find((item) => item.mappingId === 5)
    const by6 = otDropdowns?.data?.find((item) => item.mappingId === 6)
    const list = [...(by5?.personList || []), ...(by6?.personList || [])]
    const seen = new Set()
    return list.filter((person) => {
      if (!person?.id || seen.has(person.id)) return false
      seen.add(person.id)
      return true
    })
  }, [otDropdowns])

  const listQueryParams = useMemo(
    () => ({
      fromDate: fromDate ? dayjs(fromDate).format('YYYY-MM-DD') : '',
      toDate: toDate ? dayjs(toDate).format('YYYY-MM-DD') : '',
      branchId: filterBranchId || '',
      cycleType: filterCycleType || '',
      uptResult: filterUptResult || '',
      createdByNurseId: filterNurseId || '',
      search: appliedSearch || '',
    }),
    [
      fromDate,
      toDate,
      filterBranchId,
      filterCycleType,
      filterUptResult,
      filterNurseId,
      appliedSearch,
    ],
  )

  const {
    data: listRows = [],
    isLoading: isLoadingList,
    isFetching: isFetchingList,
    refetch: refetchList,
  } = useQuery({
    queryKey: ['uptResults', listQueryParams],
    enabled: !!accessToken && !!fromDate,
    queryFn: async () => {
      const response = await getUptResults(accessToken, listQueryParams)
      if (response?.status === 200) {
        return (response.data || []).map((row) => ({
          ...row,
          id: row.id,
        }))
      }
      throw new Error(response?.message || 'Failed to load UPT results')
    },
  })

  const handleClearForm = () => {
    setForm(emptyForm(defaultBranchId))
    setPatientSuggestions([])
  }

  const handleSelectPatient = (patient) => {
    setForm((prev) => ({
      ...prev,
      selectedPatient: patient,
      patientId: patient?.id || '',
      patientName: getPatientDisplayName(patient),
    }))
  }

  const validateForm = () => {
    if (!form.resultDate || !dayjs(form.resultDate).isValid()) {
      toast.error('Please select a valid date', toastconfig)
      return false
    }
    if (!form.branchId) {
      toast.error('Please select a branch', toastconfig)
      return false
    }
    if (!form.patientId) {
      toast.error('Please select a patient', toastconfig)
      return false
    }
    if (!form.cycleType) {
      toast.error('Please select a cycle type', toastconfig)
      return false
    }
    if (!form.uptResult) {
      toast.error('Please select a UPT result', toastconfig)
      return false
    }
    if (!form.createdByNurseId) {
      toast.error('Please select Created By (staff nurse)', toastconfig)
      return false
    }
    return true
  }

  const handleSave = async () => {
    if (!validateForm()) return
    setSaving(true)
    try {
      const payload = {
        resultDate: dayjs(form.resultDate).format('YYYY-MM-DD'),
        branchId: Number(form.branchId),
        patientId: Number(form.patientId),
        cycleType: form.cycleType,
        uptResult: form.uptResult,
        createdByNurseId: Number(form.createdByNurseId),
      }

      let response
      if (form.id) {
        response = await editUptResult(accessToken, { id: form.id, ...payload })
      } else {
        response = await saveUptResult(accessToken, payload)
      }

      if (response?.status === 200) {
        toast.success(
          form.id
            ? 'UPT result updated successfully'
            : 'UPT result saved successfully',
          toastconfig,
        )
        handleClearForm()
        queryClient.invalidateQueries({ queryKey: ['uptResults'] })
        setPageTab(1)
      } else {
        toast.error(
          response?.message || 'Failed to save UPT result',
          toastconfig,
        )
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to save UPT result', toastconfig)
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (row) => {
    const patient = {
      id: row.patientId,
      patientId: row.originsId,
      Name: row.patientName,
      patientName: row.patientName,
      mobileNo: row.mobileNumber,
    }
    setForm({
      id: row.id,
      resultDate: dayjs(row.resultDate),
      branchId: row.branchId,
      patientId: row.patientId,
      patientName: row.patientName,
      selectedPatient: patient,
      cycleType: row.cycleType,
      uptResult: row.uptResult,
      createdByNurseId: row.createdByNurseId,
    })
    setPatientSuggestions([patient])
    setPageTab(0)
  }

  const handleDelete = async () => {
    if (!deleteTarget?.id) return
    setDeleting(true)
    try {
      const response = await deleteUptResult(accessToken, deleteTarget.id)
      if (response?.status === 200) {
        toast.success('UPT result deleted', toastconfig)
        setDeleteTarget(null)
        queryClient.invalidateQueries({ queryKey: ['uptResults'] })
      } else {
        toast.error(response?.message || 'Failed to delete', toastconfig)
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete UPT result', toastconfig)
    } finally {
      setDeleting(false)
    }
  }

  const clearFilters = () => {
    setFromDate(dayjs().subtract(30, 'day'))
    setToDate(dayjs())
    setFilterBranchId('')
    setFilterCycleType('')
    setFilterUptResult('')
    setFilterNurseId('')
    setListSearch('')
    setAppliedSearch('')
  }

  const applySearch = () => {
    setAppliedSearch(listSearch.trim())
  }

  const getExportRows = useCallback(() => {
    return (listRows || []).map((row) => ({
      resultDate: formatDateDisplay(row.resultDate),
      branchCode: row.branchCode || row.branchName || '',
      originsId: row.originsId || '',
      patientName: row.patientName || '',
      mobileNumber: row.mobileNumber || '',
      cycleType: row.cycleType || '',
      uptResult: row.uptResult || '',
      createdByNurseName: row.createdByNurseName || '',
    }))
  }, [listRows])

  const getExportBranchLabel = useCallback(() => {
    if (!filterBranchId) return null
    const branch = branches.find((b) => String(b.id) === String(filterBranchId))
    return branch?.branchCode || branch?.name || null
  }, [branches, filterBranchId])

  const handleExport = useCallback(
    (format) => {
      if (!listRows?.length) {
        toast.error(
          'No records to export for the selected filters',
          toastconfig,
        )
        return
      }

      const options = {
        reportName: 'UPT_Results',
        branchName: getExportBranchLabel() || undefined,
      }

      try {
        if (format === 'pdf') {
          exportAsPDF(getExportRows(), EXPORT_COLUMNS, options)
          toast.success('PDF downloaded', toastconfig)
        } else {
          exportAsExcel(getExportRows(), EXPORT_COLUMNS, options)
          toast.success('Excel file downloaded', toastconfig)
        }
      } catch (err) {
        console.error(err)
        toast.error(
          err?.message || `Failed to export ${format.toUpperCase()}`,
          toastconfig,
        )
      }
    },
    [getExportBranchLabel, getExportRows, listRows],
  )

  const columns = useMemo(
    () => [
      {
        field: 'resultDate',
        headerName: 'Date',
        width: 120,
        valueGetter: (_v, row) => formatDateDisplay(row.resultDate),
      },
      {
        field: 'branchCode',
        headerName: 'Branch',
        width: 100,
        valueGetter: (_v, row) => row.branchCode || row.branchName || '—',
      },
      {
        field: 'originsId',
        headerName: 'Patient ID',
        width: 120,
      },
      {
        field: 'patientName',
        headerName: 'Patient Name',
        flex: 1.2,
        minWidth: 160,
      },
      {
        field: 'cycleType',
        headerName: 'Cycle Type',
        width: 110,
      },
      {
        field: 'uptResult',
        headerName: 'UPT Result',
        width: 120,
        renderCell: (params) => {
          const positive = params.value === 'Positive'
          return (
            <Chip
              size="small"
              label={params.value || '—'}
              color={
                positive
                  ? 'success'
                  : params.value === 'Negative'
                    ? 'default'
                    : 'default'
              }
              variant={positive ? 'filled' : 'outlined'}
              sx={{
                fontWeight: 600,
                ...(params.value === 'Negative'
                  ? { borderColor: 'grey.400', color: 'text.secondary' }
                  : null),
              }}
            />
          )
        },
      },
      {
        field: 'createdByNurseName',
        headerName: 'Created By',
        flex: 1,
        minWidth: 140,
        valueGetter: (_v, row) => row.createdByNurseName || '—',
      },
      {
        field: 'actions',
        headerName: 'Actions',
        width: 140,
        sortable: false,
        filterable: false,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => (
          <Box
            sx={{
              display: 'flex',
              gap: 0.25,
              alignItems: 'center',
              height: '100%',
            }}
          >
            <Tooltip title="View">
              <IconButton
                size="small"
                color="primary"
                onClick={(e) => {
                  e.stopPropagation()
                  setViewRecord(params.row)
                }}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit">
              <IconButton
                size="small"
                color="secondary"
                onClick={(e) => {
                  e.stopPropagation()
                  openEdit(params.row)
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton
                size="small"
                color="error"
                onClick={(e) => {
                  e.stopPropagation()
                  setDeleteTarget(params.row)
                }}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      },
    ],
    [],
  )

  const isEditMode = Boolean(form.id)

  return (
    <div className="p-4 md:p-6 h-full overflow-y-auto">
      <Breadcrumb />

      <Tabs
        value={pageTab}
        onChange={(_e, next) => setPageTab(next)}
        sx={{ borderBottom: 1, borderColor: 'divider', mt: 1 }}
      >
        <Tab label={isEditMode ? 'Edit Entry' : 'Data Entry'} />
        <Tab label="Results List" />
      </Tabs>

      <TabPanel value={pageTab} index={0}>
        <Box
          className="bg-white shadow rounded"
          sx={{ maxWidth: 880, p: { xs: 2, md: 3 } }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
              flexWrap: 'wrap',
              gap: 1,
            }}
          >
            <Typography variant="subtitle1" fontWeight={600}>
              {isEditMode ? 'Update UPT Result' : 'New UPT Result'}
            </Typography>
            {isEditMode && (
              <Chip
                size="small"
                color="info"
                variant="outlined"
                label={`Editing #${form.id}`}
                onDelete={handleClearForm}
              />
            )}
          </Box>

          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Date"
                value={form.resultDate}
                onChange={(v) => setField('resultDate', v)}
                format="DD/MM/YYYY"
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                    required: true,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Autocomplete
                options={branches}
                getOptionLabel={(option) =>
                  option?.branchCode || option?.name || ''
                }
                value={
                  branches.find(
                    (b) => String(b.id) === String(form.branchId),
                  ) || null
                }
                onChange={(_e, value) => setField('branchId', value?.id ?? '')}
                renderInput={(params) => (
                  <TextField {...params} label="Branch" size="small" required />
                )}
                clearIcon={null}
              />
            </Grid>

            <Grid item xs={12}>
              <Autocomplete
                options={patientSuggestions}
                loading={isSearchingPatients}
                value={form.selectedPatient}
                onChange={(_e, value) => handleSelectPatient(value)}
                onInputChange={(_e, value, reason) => {
                  if (reason === 'input') {
                    debouncedPatientSearch(value)
                  }
                }}
                getOptionLabel={getPatientLabel}
                isOptionEqualToValue={(option, value) =>
                  String(option?.id || option?.patientId) ===
                  String(value?.id || value?.patientId)
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Patient Name"
                    placeholder="Search by name, ID, or mobile"
                    size="small"
                    required
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {isSearchingPatients ? (
                            <CircularProgress color="inherit" size={18} />
                          ) : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
              {form.selectedPatient && (
                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 1,
                    alignItems: 'center',
                    mt: 1,
                  }}
                >
                  <Chip
                    label={
                      form.selectedPatient.patientId ||
                      form.selectedPatient.PatientId ||
                      '—'
                    }
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                  <Typography variant="body2" fontWeight={600}>
                    {getPatientDisplayName(form.selectedPatient)}
                  </Typography>
                  {(form.selectedPatient.mobileNo ||
                    form.selectedPatient.mobileNumber) && (
                    <Typography variant="body2" color="text.secondary">
                      {form.selectedPatient.mobileNo ||
                        form.selectedPatient.mobileNumber}
                    </Typography>
                  )}
                </Box>
              )}
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small" required>
                <InputLabel>Cycle Type</InputLabel>
                <Select
                  label="Cycle Type"
                  value={form.cycleType}
                  onChange={(e) => setField('cycleType', e.target.value)}
                >
                  {CYCLE_TYPE_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small" required>
                <InputLabel>UPT Result</InputLabel>
                <Select
                  label="UPT Result"
                  value={form.uptResult}
                  onChange={(e) => setField('uptResult', e.target.value)}
                >
                  {UPT_RESULT_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small" required>
                <InputLabel>Created By</InputLabel>
                <Select
                  label="Created By"
                  value={form.createdByNurseId}
                  onChange={(e) => setField('createdByNurseId', e.target.value)}
                >
                  {staffNurses.map((nurse) => (
                    <MenuItem key={nurse.id} value={nurse.id}>
                      {nurse.personName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 0.5 }} />
              <Box
                sx={{
                  display: 'flex',
                  gap: 1,
                  justifyContent: 'flex-end',
                  flexWrap: 'wrap',
                  mt: 1.5,
                }}
              >
                <Button
                  variant="outlined"
                  startIcon={<RestartAltIcon />}
                  onClick={handleClearForm}
                  disabled={saving}
                >
                  Clear
                </Button>
                <Button
                  variant="contained"
                  startIcon={isEditMode ? <SaveIcon /> : <AddIcon />}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving
                    ? 'Saving…'
                    : isEditMode
                      ? 'Update Result'
                      : 'Save Result'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </TabPanel>

      <TabPanel value={pageTab} index={1}>
        <Box
          className="bg-white shadow rounded"
          sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}
        >
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1.25,
              alignItems: 'center',
            }}
          >
            <DatePicker
              label="From"
              value={fromDate}
              onChange={setFromDate}
              format="DD/MM/YYYY"
              slotProps={{
                textField: {
                  size: 'small',
                  sx: { width: { xs: '100%', sm: 150 } },
                },
              }}
            />
            <DatePicker
              label="To"
              value={toDate}
              onChange={setToDate}
              format="DD/MM/YYYY"
              slotProps={{
                textField: {
                  size: 'small',
                  sx: { width: { xs: '100%', sm: 150 } },
                },
              }}
            />
            <Autocomplete
              size="small"
              options={branches}
              getOptionLabel={(option) =>
                option?.branchCode || option?.name || ''
              }
              value={
                branches.find((b) => String(b.id) === String(filterBranchId)) ||
                null
              }
              onChange={(_e, value) => setFilterBranchId(value?.id ?? '')}
              sx={{ width: { xs: '100%', sm: 140 } }}
              renderInput={(params) => <TextField {...params} label="Branch" />}
            />
            <FormControl
              size="small"
              sx={{ minWidth: { xs: '100%', sm: 120 } }}
            >
              <InputLabel>Cycle</InputLabel>
              <Select
                label="Cycle"
                value={filterCycleType}
                onChange={(e) => setFilterCycleType(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {CYCLE_TYPE_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl
              size="small"
              sx={{ minWidth: { xs: '100%', sm: 120 } }}
            >
              <InputLabel>Result</InputLabel>
              <Select
                label="Result"
                value={filterUptResult}
                onChange={(e) => setFilterUptResult(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {UPT_RESULT_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl
              size="small"
              sx={{ minWidth: { xs: '100%', sm: 150 } }}
            >
              <InputLabel>Created By</InputLabel>
              <Select
                label="Created By"
                value={filterNurseId}
                onChange={(e) => setFilterNurseId(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {staffNurses.map((nurse) => (
                  <MenuItem key={nurse.id} value={nurse.id}>
                    {nurse.personName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              size="small"
              placeholder="Search patient…"
              value={listSearch}
              onChange={(e) => setListSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applySearch()
              }}
              sx={{ width: { xs: '100%', sm: 180 } }}
              InputProps={{
                endAdornment: (
                  <IconButton
                    size="small"
                    onClick={applySearch}
                    edge="end"
                    aria-label="Search"
                  >
                    <SearchIcon fontSize="small" />
                  </IconButton>
                ),
              }}
            />
            <Button
              variant="text"
              size="small"
              onClick={clearFilters}
              sx={{ textTransform: 'none', whiteSpace: 'nowrap' }}
            >
              Reset
            </Button>
          </Box>

          <Divider />

          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              alignItems: 'center',
            }}
          >
            <Typography variant="subtitle1" fontWeight={600}>
              UPT Results
            </Typography>
            <Chip
              size="small"
              label={`${listRows.length} record${listRows.length === 1 ? '' : 's'}`}
              variant="outlined"
            />
            <Box
              sx={{
                ml: 'auto',
                display: 'flex',
                gap: 0.75,
                alignItems: 'center',
              }}
            >
              <Tooltip title="Refresh">
                <span>
                  <IconButton
                    size="small"
                    onClick={() => refetchList()}
                    disabled={isFetchingList}
                    aria-label="Refresh"
                  >
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Export">
                <span>
                  <IconButton
                    size="small"
                    onClick={(e) => setExportMenuAnchor(e.currentTarget)}
                    disabled={!listRows.length || isLoadingList}
                    aria-label="Export options"
                    aria-haspopup="true"
                    aria-expanded={Boolean(exportMenuAnchor)}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => {
                  handleClearForm()
                  setPageTab(0)
                }}
              >
                New Entry
              </Button>
            </Box>
          </Box>

          <Menu
            anchorEl={exportMenuAnchor}
            open={Boolean(exportMenuAnchor)}
            onClose={() => setExportMenuAnchor(null)}
            keepMounted={false}
            disableScrollLock
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{ elevation: 3, sx: { minWidth: 180, mt: 0.5 } }}
          >
            <MenuItem
              onClick={() => {
                setExportMenuAnchor(null)
                handleExport('excel')
              }}
            >
              <ListItemIcon>
                <TableViewIcon fontSize="small" color="success" />
              </ListItemIcon>
              <ListItemText primary="Export Excel" />
            </MenuItem>
            <MenuItem
              onClick={() => {
                setExportMenuAnchor(null)
                handleExport('pdf')
              }}
            >
              <ListItemIcon>
                <PictureAsPdfIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText primary="Export PDF" />
            </MenuItem>
          </Menu>

          <Box
            sx={{
              height: 'calc(100vh - 300px)',
              minHeight: 400,
              width: '100%',
            }}
          >
            <DataGrid
              rows={listRows}
              columns={columns}
              loading={isLoadingList || isFetchingList}
              disableRowSelectionOnClick
              pageSizeOptions={[10, 25, 50]}
              initialState={{
                pagination: { paginationModel: { pageSize: 25, page: 0 } },
              }}
              slots={{
                noRowsOverlay: () => (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    No UPT results found for the selected filters
                  </div>
                ),
              }}
            />
          </Box>
        </Box>
      </TabPanel>

      <Dialog
        open={Boolean(viewRecord)}
        onClose={() => setViewRecord(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>UPT Result Details</DialogTitle>
        <DialogContent dividers>
          {viewRecord && (
            <Grid container spacing={1.5}>
              {[
                ['Date', formatDateDisplay(viewRecord.resultDate)],
                [
                  'Branch',
                  viewRecord.branchCode || viewRecord.branchName || '—',
                ],
                ['Patient ID', viewRecord.originsId || '—'],
                ['Patient Name', viewRecord.patientName || '—'],
                ['Mobile', viewRecord.mobileNumber || '—'],
                ['Cycle Type', viewRecord.cycleType || '—'],
                ['UPT Result', viewRecord.uptResult || '—'],
                ['Created By', viewRecord.createdByNurseName || '—'],
              ].map(([label, value]) => (
                <Grid item xs={12} sm={6} key={label}>
                  <Typography variant="caption" color="text.secondary">
                    {label}
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {value}
                  </Typography>
                </Grid>
              ))}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewRecord(null)}>Close</Button>
          <Button
            variant="contained"
            onClick={() => {
              openEdit(viewRecord)
              setViewRecord(null)
            }}
          >
            Edit
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => !deleting && setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete UPT Result?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            This will permanently remove the UPT result for{' '}
            <strong>{deleteTarget?.patientName}</strong> dated{' '}
            <strong>{formatDateDisplay(deleteTarget?.resultDate)}</strong>.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default withPermission(UptResultsPage, true, 'scanModule', [
  ACCESS_TYPES.READ,
  ACCESS_TYPES.WRITE,
])
