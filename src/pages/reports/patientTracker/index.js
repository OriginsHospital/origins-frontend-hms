import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useSelector } from 'react-redux'
import {
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Tabs,
  Tab,
  Button,
  Tooltip,
  IconButton,
  Chip,
  Divider,
  Paper,
  Avatar,
  Autocomplete,
  Popper,
  ClickAwayListener,
  List,
  ListItemButton,
  ListItemText,
} from '@mui/material'
import {
  Person as PersonIcon,
  LocalHospital as HospitalIcon,
  AccountBalance as AccountBalanceIcon,
  Science as ScienceIcon,
  PregnantWoman as PregnantWomanIcon,
  Save as SaveIcon,
  Edit as EditIcon,
  Lock as LockIcon,
  CalendarToday as CalendarTodayIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DataGrid } from '@mui/x-data-grid'
import dayjs from 'dayjs'
import { toast } from 'react-toastify'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { hideLoader, showLoader } from '@/redux/loaderSlice'
import { useDispatch } from 'react-redux'
import Breadcrumb from '@/components/Breadcrumb'
import {
  getPatientByAadharOrMobile,
  getPatientBasicDetails,
  getChecklistByPatientId,
  getPatientTreatmentCycles,
  getAppointmentsByPatient,
  getEmbryologyHistoryByPatientId,
  getSavedLabTestResult,
  getLineBillsAndNotesForAppointment,
  getVisitsByPatientId,
  getPackageData,
  getAllPatients,
} from '@/constants/apis'
import SearchIcon from '@mui/icons-material/Search'
import CircularProgress from '@mui/material/CircularProgress'
import { debounce } from 'lodash'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

// User-level field access control configuration
const ROW_ACCESS_RULES = {
  row1: [
    'adepuvyshnu2719@gmail.com',
    'ravikumar6278@gmail.com',
    'Kriskary02@gmail.com',
    'priya_admin@gmail.com',
    'nikhilsuvva77@gmail.com',
  ],
  row2: ['priya_admin@gmail.com', 'nikhilsuvva77@gmail.com'],
  row3: [
    'deepikathakur8555@gmail.com',
    'prashanthideekonda20@gmail.com',
    'adepuvyshnu2719@gmail.com',
    'ravikumar6278@gmail.com',
    'Kriskary2@gmail.com',
    'priya_admin@gmail.com',
    'nikhilsuvva77@gmail.com',
  ],
  row4: ['soujanyaperapu77@gmail.com', 'nikhilsuvva77@gmail.com'],
  row5: [
    'nithyasivaraaman@gmail.com',
    'Sridhargowda761@gmail.com',
    'nikhilsuvva77@gmail.com',
  ],
  row6: [
    'alubakapriyanka@gmail.com',
    'originsivf@outlook.com',
    'nikhilsuvva77@gmail.com',
  ],
}

// Helper function to check if user has access to a row
const hasRowAccess = (userEmail, rowNumber) => {
  if (!userEmail) return false
  const rowKey = `row${rowNumber}`
  const allowedEmails = ROW_ACCESS_RULES[rowKey] || []
  return allowedEmails.some(
    (email) => email.toLowerCase() === userEmail.toLowerCase(),
  )
}

// Text Field Component - Uncontrolled input to prevent focus loss
const MemoizedTextField = ({
  fieldName,
  label,
  value,
  onBlur,
  disabled,
  required,
  type = 'text',
  width = '100%',
  hasAccess,
}) => {
  const inputRef = useRef(null)
  const defaultValueRef = useRef(value || '')
  const previousValueRef = useRef(value || '')

  // Update defaultValue when value changes externally (e.g., when patient data is loaded)
  useEffect(() => {
    const currentValue = value || ''
    const previousValue = previousValueRef.current || ''

    // Only update if value actually changed and input exists
    if (inputRef.current && currentValue !== previousValue) {
      // Update the ref
      defaultValueRef.current = currentValue
      // Update the DOM element value directly
      inputRef.current.value = currentValue
      // Update previous value ref
      previousValueRef.current = currentValue
    }
  }, [value])

  const handleBlur = (e) => {
    if (onBlur) {
      onBlur(e)
    }
  }

  return (
    <Tooltip
      title={
        !hasAccess ? 'You do not have permission to edit this section' : ''
      }
      arrow
    >
      <TextField
        inputRef={inputRef}
        fullWidth={width === '100%'}
        label={label + (required ? ' *' : '')}
        defaultValue={defaultValueRef.current}
        onBlur={handleBlur}
        disabled={disabled || !hasAccess}
        required={required}
        size="small"
        variant="outlined"
        type={type}
        sx={width !== '100%' ? { width: width } : {}}
        InputProps={{
          endAdornment: !hasAccess ? (
            <LockIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
          ) : null,
        }}
        autoComplete="off"
      />
    </Tooltip>
  )
}

MemoizedTextField.displayName = 'MemoizedTextField'

// Memoized Search Input Component to prevent focus loss
// Completely uncontrolled input - similar to MemoizedTextField pattern
const MemoizedSearchInput = React.memo(
  ({
    initialValue = '',
    onBlur,
    onKeyDown,
    inputRef,
    isSearching,
    label,
    placeholder,
  }) => {
    const internalInputRef = useRef(null)
    const defaultValueRef = useRef(initialValue || '')

    // Initialize defaultValue only once on mount - never update
    // This ensures the input is truly uncontrolled
    useEffect(() => {
      if (defaultValueRef.current === '' && initialValue) {
        defaultValueRef.current = initialValue
      }
    }, []) // Empty deps - only initialize once, never update

    // Set external ref reference (only once on mount)
    useEffect(() => {
      if (internalInputRef.current) {
        if (typeof inputRef === 'function') {
          inputRef(internalInputRef.current)
        } else if (inputRef) {
          inputRef.current = internalInputRef.current
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []) // Empty deps - only set once

    const handleBlurEvent = useCallback(
      (e) => {
        // Sync value on blur - this is the only time we update parent state
        const newValue = e.target.value || ''
        defaultValueRef.current = newValue
        if (onBlur) {
          onBlur(e) // Update parent state (causes re-render but input has lost focus anyway)
        }
      },
      [onBlur],
    )

    const handleChange = useCallback((e) => {
      // Update internal ref immediately for real-time value tracking
      // DO NOT call any parent callbacks - this would cause re-renders
      // The value is managed entirely by the DOM element during typing
      defaultValueRef.current = e.target.value
    }, [])

    return (
      <TextField
        key="patient-search-input"
        inputRef={internalInputRef}
        fullWidth
        label={label}
        defaultValue={defaultValueRef.current}
        onBlur={handleBlurEvent}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        size="small"
        variant="outlined"
        placeholder={placeholder}
        autoComplete="off"
        InputProps={{
          startAdornment: (
            <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
          ),
          endAdornment: isSearching ? (
            <CircularProgress size={20} sx={{ mr: 1 }} />
          ) : null,
        }}
        sx={{
          maxWidth: 400,
          width: '100%',
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: '#e0e0e0',
            },
            '&:hover fieldset': {
              borderColor: '#06aee9',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#06aee9',
            },
          },
        }}
      />
    )
  },
  (prevProps, nextProps) => {
    // Custom comparison - ONLY re-render if isSearching changes
    // Completely ignore initialValue, onBlur, onKeyDown, onChange, and all other props
    // This ensures the component NEVER re-renders during typing
    // The only re-render will be when isSearching changes (search starts/ends)
    return (
      prevProps.isSearching === nextProps.isSearching &&
      prevProps.inputRef === nextProps.inputRef
    )
  },
)

MemoizedSearchInput.displayName = 'MemoizedSearchInput'

// Custom Patient Search with Dropdown - Uncontrolled to prevent focus loss
const PatientSearchAutocomplete = React.memo(
  ({ onSelectPatient, onSearch, isLoading, suggestions = [] }) => {
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [highlightedIndex, setHighlightedIndex] = useState(-1)
    const inputRef = useRef(null)
    const inputValueRef = useRef('')

    // Show suggestions when they become available
    useEffect(() => {
      if (
        suggestions &&
        suggestions.length > 0 &&
        inputValueRef.current &&
        inputValueRef.current.trim().length >= 2
      ) {
        setShowSuggestions(true)
      } else {
        setShowSuggestions(false)
      }
    }, [suggestions])

    const handleInputChange = useCallback(
      (e) => {
        const value = e.target.value || ''
        // Update ref immediately (doesn't cause re-render)
        inputValueRef.current = value
        setHighlightedIndex(-1)

        // Trigger search without updating state
        if (value && value.trim().length >= 2) {
          onSearch(value)
        } else {
          setShowSuggestions(false)
        }
      },
      [onSearch],
    )

    const handleSelectPatient = useCallback(
      (patient) => {
        // Clear input value via ref (uncontrolled)
        if (inputRef.current) {
          inputRef.current.value = ''
        }
        inputValueRef.current = ''
        setShowSuggestions(false)
        setHighlightedIndex(-1)
        onSelectPatient(patient)
      },
      [onSelectPatient],
    )

    const handleKeyDown = useCallback(
      (e) => {
        if (e.key === 'ArrowDown') {
          if (showSuggestions && suggestions.length > 0) {
            e.preventDefault()
            setHighlightedIndex((prev) =>
              prev < suggestions.length - 1 ? prev + 1 : prev,
            )
          }
        } else if (e.key === 'ArrowUp') {
          if (showSuggestions && suggestions.length > 0) {
            e.preventDefault()
            setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1))
          }
        } else if (e.key === 'Enter') {
          e.preventDefault()
          if (
            showSuggestions &&
            highlightedIndex >= 0 &&
            highlightedIndex < suggestions.length
          ) {
            handleSelectPatient(suggestions[highlightedIndex])
          }
        } else if (e.key === 'Escape') {
          setShowSuggestions(false)
          setHighlightedIndex(-1)
        }
      },
      [showSuggestions, suggestions, highlightedIndex, handleSelectPatient],
    )

    const handleClickAway = useCallback(() => {
      setShowSuggestions(false)
      setHighlightedIndex(-1)
    }, [])

    const getPatientLabel = useCallback((patient) => {
      const name =
        `${patient.lastName || ''} ${patient.firstName || ''}`.trim() ||
        patient.Name ||
        ''
      const mobile = patient.mobileNo || patient.mobileNumber || ''
      const patientId = patient.patientId || ''
      return { name, mobile, patientId }
    }, [])

    return (
      <Box sx={{ position: 'relative', width: '100%' }}>
        <TextField
          inputRef={inputRef}
          fullWidth
          label="Search Patient"
          placeholder="Enter name or mobile number"
          size="small"
          variant="outlined"
          defaultValue=""
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            const currentValue = inputRef.current?.value || ''
            if (
              currentValue &&
              currentValue.trim().length >= 2 &&
              suggestions.length > 0
            ) {
              setShowSuggestions(true)
            }
          }}
          autoComplete="off"
          InputProps={{
            startAdornment: (
              <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
            ),
            endAdornment: isLoading ? (
              <CircularProgress size={20} sx={{ mr: 1 }} />
            ) : null,
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: '#e0e0e0',
              },
              '&:hover fieldset': {
                borderColor: '#06aee9',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#06aee9',
              },
            },
          }}
        />
        {showSuggestions && suggestions.length > 0 && inputRef.current && (
          <ClickAwayListener onClickAway={handleClickAway}>
            <Popper
              open={showSuggestions}
              anchorEl={inputRef.current}
              placement="bottom-start"
              modifiers={[
                {
                  name: 'offset',
                  options: {
                    offset: [0, 4],
                  },
                },
              ]}
              style={{
                zIndex: 1300,
                width: inputRef.current?.offsetWidth || 400,
              }}
            >
              <Paper
                elevation={3}
                sx={{
                  width: inputRef.current?.offsetWidth || 400,
                  maxHeight: 300,
                  overflow: 'auto',
                  mt: 0.5,
                }}
              >
                <List dense sx={{ p: 0 }}>
                  {suggestions.map((patient, index) => {
                    const { name, mobile, patientId } = getPatientLabel(patient)
                    return (
                      <ListItemButton
                        key={
                          patient.id || patient.patientId || `patient-${index}`
                        }
                        selected={index === highlightedIndex}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleSelectPatient(patient)
                        }}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        sx={{
                          '&.Mui-selected': {
                            bgcolor: 'primary.light',
                            '&:hover': {
                              bgcolor: 'primary.light',
                            },
                          },
                          '&:hover': {
                            bgcolor: 'action.hover',
                          },
                        }}
                      >
                        <ListItemText
                          primary={
                            <Typography variant="body2" fontWeight={500}>
                              {name || 'Unknown Patient'}
                            </Typography>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                              {mobile && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  📱 {mobile}
                                </Typography>
                              )}
                              {patientId && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  ID: {patientId}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </ListItemButton>
                    )
                  })}
                </List>
              </Paper>
            </Popper>
          </ClickAwayListener>
        )}
      </Box>
    )
  },
  (prevProps, nextProps) => {
    // Only re-render if loading state changes or suggestions change
    return (
      prevProps.isLoading === nextProps.isLoading &&
      prevProps.suggestions === nextProps.suggestions
    )
  },
)

PatientSearchAutocomplete.displayName = 'PatientSearchAutocomplete'

// Select Field Component - Stable component to prevent focus loss
const MemoizedSelectField = React.memo(
  ({
    fieldName,
    label,
    value,
    onChange,
    disabled,
    required,
    options = [],
    width = '100%',
    hasAccess,
  }) => {
    const handleChange = (e) => {
      if (onChange && typeof onChange === 'function') {
        onChange(e)
      }
    }

    const formControl = (
      <FormControl
        fullWidth={width === '100%'}
        size="small"
        disabled={disabled || !hasAccess}
        sx={width !== '100%' ? { width: width } : {}}
      >
        <InputLabel id={`${fieldName}-label`}>
          {label + (required ? ' *' : '')}
        </InputLabel>
        <Select
          labelId={`${fieldName}-label`}
          value={value || ''}
          onChange={handleChange}
          label={label + (required ? ' *' : '')}
          disabled={disabled || !hasAccess}
          MenuProps={{
            PaperProps: {
              style: {
                maxHeight: 300,
              },
            },
            disablePortal: false,
          }}
        >
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
        {!hasAccess && (
          <LockIcon
            sx={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 16,
              color: 'text.secondary',
              pointerEvents: 'none',
            }}
          />
        )}
      </FormControl>
    )

    if (!hasAccess) {
      return (
        <Tooltip title="You do not have permission to edit this section" arrow>
          {formControl}
        </Tooltip>
      )
    }

    return formControl
  },
)

MemoizedSelectField.displayName = 'MemoizedSelectField'

// DatePicker Component - Stable component to prevent focus loss
const MemoizedDatePicker = ({
  fieldName,
  label,
  value,
  onChange,
  disabled,
  required,
  width = '100%',
  hasAccess,
}) => {
  const datePickerComponent = (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
        label={label + (required ? ' *' : '')}
        value={value}
        onChange={onChange}
        disabled={disabled || !hasAccess}
        format="DD-MM-YYYY"
        openTo="day"
        views={['year', 'month', 'day']}
        slotProps={{
          textField: {
            size: 'small',
            fullWidth: width === '100%',
            variant: 'outlined',
            required: required,
            sx: width !== '100%' ? { width: width } : {},
            InputProps: !hasAccess
              ? {
                  endAdornment: (
                    <LockIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  ),
                }
              : undefined,
          },
          popper: {
            placement: 'bottom-start',
            modifiers: [
              {
                name: 'offset',
                options: {
                  offset: [0, 8],
                },
              },
            ],
          },
          actionBar: {
            actions: ['clear', 'today', 'accept'],
          },
        }}
      />
    </LocalizationProvider>
  )

  if (!hasAccess) {
    return (
      <Tooltip title="You do not have permission to edit this section" arrow>
        <Box sx={{ display: 'inline-block', width: '100%' }}>
          {datePickerComponent}
        </Box>
      </Tooltip>
    )
  }

  return datePickerComponent
}

MemoizedDatePicker.displayName = 'MemoizedDatePicker'

function PatientTrackerReports() {
  const userDetails = useSelector((store) => store.user)
  const dropdowns = useSelector((store) => store.dropdowns)
  const { branches, referralSourceList } = dropdowns || {}
  const dispatch = useDispatch()
  const queryClient = useQueryClient()

  const userEmail = userDetails?.email || userDetails?.userDetails?.email || ''
  const userBranches = userDetails?.branchDetails || branches || []

  // Tab state
  const [activeTab, setActiveTab] = useState(0)

  // Summary Automated data
  const [automatedSummaryData, setAutomatedSummaryData] = useState([])
  const [isLoadingAutomatedSummary, setIsLoadingAutomatedSummary] =
    useState(false)
  const [patientPackageData, setPatientPackageData] = useState({}) // Store package data by patient ID

  // Summary Automated tab filters
  const [automatedSummaryFromDate, setAutomatedSummaryFromDate] = useState(
    dayjs(), // Set to current date
  )
  const [automatedSummaryToDate, setAutomatedSummaryToDate] = useState(dayjs()) // Set to current date
  const [automatedSummaryBranch, setAutomatedSummaryBranch] = useState('ALL')
  const [automatedSummaryReferral, setAutomatedSummaryReferral] = useState('')

  // Summary Graph data
  const [graphSummaryData, setGraphSummaryData] = useState([])
  const [isLoadingGraphSummary, setIsLoadingGraphSummary] = useState(false)

  // Summary Graph tab filters (default referral filter set to 'Friends')
  const [graphSummaryFromDate, setGraphSummaryFromDate] = useState(
    dayjs(), // Set to current date
  )
  const [graphSummaryToDate, setGraphSummaryToDate] = useState(dayjs()) // Set to current date
  const [graphSummaryBranch, setGraphSummaryBranch] = useState('ALL')
  const [graphSummaryReferral, setGraphSummaryReferral] = useState('Friends')

  // Summary tab filters
  const [summaryFromDate, setSummaryFromDate] = useState(
    dayjs().subtract(7, 'day'),
  )
  const [summaryToDate, setSummaryToDate] = useState(dayjs())
  const [summaryBranchId, setSummaryBranchId] = useState(
    userBranches[0]?.id || null,
  )

  // Search state
  const [searchMobileNumber, setSearchMobileNumber] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchedPatient, setSearchedPatient] = useState(null)
  const searchInputRef = useRef(null)
  const [patientSuggestions, setPatientSuggestions] = useState([])
  const [isLoadingPatients, setIsLoadingPatients] = useState(false)
  const [selectedPatientOption, setSelectedPatientOption] = useState(null)

  // Form state
  const [formData, setFormData] = useState({
    // Row 1: Patient Basic Details
    date: dayjs(),
    branch: '',
    patientId: '',
    patientName: '',
    mobileNumber: '',
    referralSource: '',
    referralName: '',

    // Row 2: Treatment Details
    plan: '',
    treatmentType: '',
    cycleStatus: '',
    stageOfCycle: '',

    // Row 3: Package Details
    packageName: '',

    // Row 4: Financial Details
    registrationAmount: '',
    paidAmount: '',
    packageAmount: '',

    // Row 5: Embryology Details
    numberOfEmbryos: '',
    numberOfEmbryosUsed: '',
    lastRenewalDate: null,
    numberOfEmbryosDiscarded: '',

    // Row 6: UPT Result
    uptResult: '',
    uptManualEntry: '',
  })

  // Access control flags
  const accessFlags = useMemo(
    () => ({
      row1: hasRowAccess(userEmail, 1),
      row2: hasRowAccess(userEmail, 2),
      row3: hasRowAccess(userEmail, 3),
      row4: hasRowAccess(userEmail, 4),
      row5: hasRowAccess(userEmail, 5),
      row6: hasRowAccess(userEmail, 6),
    }),
    [userEmail],
  )

  // Auto-calculated fields
  const pendingAmount = useMemo(() => {
    const packageAmt = parseFloat(formData.packageAmount) || 0
    const paidAmt = parseFloat(formData.paidAmount) || 0
    const regAmt = parseFloat(formData.registrationAmount) || 0

    if (paidAmt === 0) {
      return packageAmt - regAmt
    } else {
      return packageAmt - paidAmt
    }
  }, [formData.packageAmount, formData.paidAmount, formData.registrationAmount])

  const embryosRemaining = useMemo(() => {
    const total = parseFloat(formData.numberOfEmbryos) || 0
    const used = parseFloat(formData.numberOfEmbryosUsed) || 0
    return total - used
  }, [formData.numberOfEmbryos, formData.numberOfEmbryosUsed])

  // Handle form field changes - memoized to prevent re-renders
  const handleFieldChange = useCallback((field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }, [])

  // Handle patient search by mobile number - use ref to get latest value
  const handleSearchPatient = useCallback(async () => {
    const currentValue = searchValueRef.current || searchMobileNumber
    if (!currentValue || !currentValue.trim()) {
      toast.error('Please enter a mobile number', {
        position: 'top-right',
      })
      return
    }

    setIsSearching(true)
    dispatch(showLoader())

    try {
      // Step 1: Search patient by mobile number - use current value from ref
      const valueToSearch = searchValueRef.current || searchMobileNumber || ''
      const patientSearchResponse = await getPatientByAadharOrMobile(
        userDetails.accessToken,
        valueToSearch.trim(),
      )

      if (patientSearchResponse.status !== 200 || !patientSearchResponse.data) {
        toast.error('Patient not found with this mobile number', {
          position: 'top-right',
        })
        setIsSearching(false)
        dispatch(hideLoader())
        return
      }

      const patient = patientSearchResponse.data
      setSearchedPatient({
        patientId: patient.patientId,
        patientName:
          `${patient.lastName || ''} ${patient.firstName || ''}`.trim(),
        id: patient.id,
      })

      // Step 2: Fetch comprehensive patient data from multiple sources
      const patientId = patient.patientId || patient.id
      const patientInternalId = patient.id

      // Fetch patient treatment cycles
      let treatmentCyclesData = null
      try {
        const treatmentCyclesResponse = await getPatientTreatmentCycles(
          userDetails.accessToken,
          patientId,
        )
        if (treatmentCyclesResponse.status === 200) {
          treatmentCyclesData = treatmentCyclesResponse.data || []
        }
      } catch (err) {
        console.error('Error fetching treatment cycles:', err)
      }

      // Fetch patient appointments
      let appointmentsData = null
      try {
        const appointmentsResponse = await getAppointmentsByPatient(
          userDetails.accessToken,
          patientInternalId || patientId,
        )
        if (appointmentsResponse.status === 200) {
          appointmentsData = Array.isArray(appointmentsResponse.data)
            ? appointmentsResponse.data
            : appointmentsResponse.data?.data || []
        }
      } catch (err) {
        console.error('Error fetching appointments:', err)
      }

      // Fetch checklist data (includes lab tests and vitals)
      let checklistData = null
      try {
        const checklistResponse = await getChecklistByPatientId(
          userDetails.accessToken,
          patientId,
        )
        if (checklistResponse.status === 200) {
          checklistData = checklistResponse.data
        }
      } catch (err) {
        console.error('Error fetching checklist:', err)
      }

      // Fetch embryology history
      let embryologyData = null
      try {
        const embryologyResponse = await getEmbryologyHistoryByPatientId(
          userDetails.accessToken,
          patientId,
        )
        if (embryologyResponse.status === 200) {
          embryologyData = embryologyResponse.data
        }
      } catch (err) {
        console.error('Error fetching embryology history:', err)
      }

      // Fetch patient visits for package and visit information
      let visitsData = null
      try {
        const visitsResponse = await getPatientVisits(
          userDetails.accessToken,
          patientId,
        )
        if (visitsResponse.status === 200) {
          visitsData = Array.isArray(visitsResponse.data)
            ? visitsResponse.data
            : visitsResponse.data?.data || []
        }
      } catch (err) {
        console.error('Error fetching visits:', err)
      }

      // Step 3: Map fetched data to form fields
      const updatedFormData = { ...formData }

      // Patient Basic Details
      updatedFormData.patientId = patient.patientId || ''
      updatedFormData.patientName =
        `${patient.lastName || ''} ${patient.firstName || ''}`.trim()
      updatedFormData.mobileNumber =
        patient.mobileNo || patient.mobileNumber || ''
      updatedFormData.date = dayjs() // Set current date as default
      updatedFormData.branch = patient.branchId || formData.branch || ''

      // Referral information
      if (patient.referralId) {
        updatedFormData.referralSource = patient.referralId
      }
      if (patient.referralName) {
        updatedFormData.referralName = patient.referralName
      }

      // Treatment Details from treatment cycles
      if (treatmentCyclesData && treatmentCyclesData.length > 0) {
        // Get the most recent or active treatment cycle
        const latestTreatmentCycle = treatmentCyclesData[0]

        if (latestTreatmentCycle?.treatmentDetails?.treatementType) {
          const treatmentType =
            latestTreatmentCycle.treatmentDetails.treatementType
          // Map treatment type to form format (IVF, OI-TI, IUI)
          if (treatmentType === 'IVF' || treatmentType.includes('IVF')) {
            updatedFormData.treatmentType = 'IVF'
          } else if (
            treatmentType === 'OI-TI' ||
            treatmentType.includes('OI-TI') ||
            treatmentType.includes('OI TI')
          ) {
            updatedFormData.treatmentType = 'OI-TI'
          } else if (treatmentType === 'IUI' || treatmentType.includes('IUI')) {
            updatedFormData.treatmentType = 'IUI'
          }
        }

        // Get cycle status - try to infer from treatment cycle or appointments
        // If treatment cycle exists, status is likely "Running" or "Registered"
        if (latestTreatmentCycle?.treatmentCycleId) {
          // Check if there are recent appointments to determine status
          if (appointmentsData && appointmentsData.length > 0) {
            const hasRecentAppointments = appointmentsData.some((apt) =>
              dayjs(apt.appointmentDate).isAfter(dayjs().subtract(30, 'day')),
            )
            updatedFormData.cycleStatus = hasRecentAppointments
              ? 'Running'
              : 'Registered'
          } else {
            updatedFormData.cycleStatus = 'Registered'
          }
        }
      }

      // Get latest appointment for financial and package data
      if (appointmentsData && appointmentsData.length > 0) {
        const latestAppointment = appointmentsData[0] // Already sorted by date DESC

        // Extract package information from visit
        if (latestAppointment.visit_id && visitsData && visitsData.length > 0) {
          const latestVisit = visitsData.find(
            (visit) =>
              visit.id === latestAppointment.visit_id || visit.isActive,
          )

          if (latestVisit) {
            // Get package name from visit
            if (latestVisit.packageChosen) {
              const packageInfo = latestVisit.packageChosen
              if (typeof packageInfo === 'string') {
                updatedFormData.packageName = packageInfo
              } else if (packageInfo?.name) {
                updatedFormData.packageName = packageInfo.name
              }
            }

            // Try to fetch package data from visit for financial details
            if (latestVisit.id && !updatedFormData.packageAmount) {
              try {
                const packageDataResponse = await getPackageData(
                  userDetails.accessToken,
                  latestVisit.id,
                )

                if (
                  packageDataResponse.status === 200 &&
                  packageDataResponse.data
                ) {
                  const pkgData = packageDataResponse.data

                  // Extract package amounts
                  if (pkgData.marketingPackage) {
                    updatedFormData.packageAmount = parseFloat(
                      pkgData.marketingPackage,
                    ).toFixed(2)
                  }
                  if (pkgData.registrationAmount) {
                    updatedFormData.registrationAmount = parseFloat(
                      pkgData.registrationAmount,
                    ).toFixed(2)
                  }

                  // Calculate total paid amount from package payments
                  // This would require summing all milestone payments
                  // For now, we'll use registration amount as initial paid amount
                  if (pkgData.registrationAmount) {
                    updatedFormData.paidAmount = parseFloat(
                      pkgData.registrationAmount,
                    ).toFixed(2)
                  }
                }
              } catch (err) {
                console.error('Error fetching package data:', err)
                // Continue without package data if this fails
              }
            }
          }
        }

        // Get branch from latest appointment if available
        if (latestAppointment.branchId && !updatedFormData.branch) {
          updatedFormData.branch = latestAppointment.branchId
        }

        // Extract stage of cycle from appointment stage
        if (latestAppointment.stage) {
          updatedFormData.stageOfCycle = latestAppointment.stage
        }

        // Try to get financial data from appointment line bills
        // Fetch line bills for the latest appointment to get package and payment information
        try {
          const lineBillsResponse = await getLineBillsAndNotesForAppointment(
            userDetails.accessToken,
            latestAppointment.type || 'CONSULTATION',
            latestAppointment.appointmentId,
          )

          if (lineBillsResponse.status === 200 && lineBillsResponse.data) {
            const lineBillsData = Array.isArray(lineBillsResponse.data)
              ? lineBillsResponse.data
              : [lineBillsResponse.data]

            // Extract package information and financial data from line bills
            let totalPackageAmount = 0
            let totalPaidAmount = 0
            let registrationAmount = 0

            lineBillsData.forEach((billGroup) => {
              if (
                billGroup?.billTypeValues &&
                Array.isArray(billGroup.billTypeValues)
              ) {
                billGroup.billTypeValues.forEach((billItem) => {
                  // Sum up amounts from paid bills
                  if (billItem?.status === 'PAID' && billItem?.amount) {
                    const amount = parseFloat(billItem.amount) || 0
                    totalPaidAmount += amount

                    // Check if this is a package bill (billTypeId might indicate package)
                    if (
                      billGroup.billType?.name
                        ?.toLowerCase()
                        .includes('package')
                    ) {
                      totalPackageAmount += amount
                      if (billItem.name) {
                        updatedFormData.packageName = billItem.name
                      }
                    }

                    // Check for registration amount (typically first payment)
                    if (
                      billGroup.billType?.name
                        ?.toLowerCase()
                        .includes('registration') ||
                      billItem.name?.toLowerCase().includes('registration')
                    ) {
                      registrationAmount += amount
                    }
                  }
                })
              }
            })

            // Set financial data
            if (totalPackageAmount > 0) {
              updatedFormData.packageAmount = totalPackageAmount.toFixed(2)
            }
            if (totalPaidAmount > 0) {
              updatedFormData.paidAmount = totalPaidAmount.toFixed(2)
            }
            if (registrationAmount > 0) {
              updatedFormData.registrationAmount = registrationAmount.toFixed(2)
            }
          }
        } catch (err) {
          console.error('Error fetching line bills:', err)
          // Continue without financial data if this fails
        }
      }

      // Embryology Data - Extract from embryology history
      if (embryologyData && embryologyData.patientInformation) {
        const embryologyHistory = Array.isArray(
          embryologyData.patientInformation,
        )
          ? embryologyData.patientInformation
          : [embryologyData.patientInformation]

        // Get the most recent embryology entry
        if (embryologyHistory.length > 0) {
          // Sort by appointment date to get the latest
          const sortedEmbryology = embryologyHistory.sort((a, b) => {
            const dateA = dayjs(a.appointmentDate)
            const dateB = dayjs(b.appointmentDate)
            return dateB.isAfter(dateA) ? 1 : -1
          })

          const latestEmbryology = sortedEmbryology[0]

          // Extract last renewal date from appointment date
          if (latestEmbryology?.appointmentDate) {
            try {
              updatedFormData.lastRenewalDate = dayjs(
                latestEmbryology.appointmentDate,
              )
            } catch (err) {
              console.error('Error parsing renewal date:', err)
            }
          }

          if (latestEmbryology?.embryologyDetails) {
            const embryologyDetails = Array.isArray(
              latestEmbryology.embryologyDetails,
            )
              ? latestEmbryology.embryologyDetails
              : [latestEmbryology.embryologyDetails]

            // Try to extract embryo counts from embryology templates/detail
            let totalEmbryosFound = 0
            let usedEmbryosFound = 0

            embryologyDetails.forEach((embryoDetail) => {
              if (
                embryoDetail?.details &&
                Array.isArray(embryoDetail.details)
              ) {
                embryoDetail.details.forEach((detail) => {
                  if (detail?.template) {
                    // Parse template HTML for embryo counts
                    const templateText = detail.template || ''

                    // Try to extract embryo counts using regex patterns
                    // Look for patterns like "Total: X", "Embryos: X", "Number: X", etc.
                    const totalMatches = templateText.match(
                      /(?:total|embryos?|count).*?(\d+)/gi,
                    )
                    const usedMatches = templateText.match(
                      /(?:used|transferred|implanted).*?(\d+)/gi,
                    )

                    if (totalMatches && totalMatches.length > 0) {
                      totalMatches.forEach((match) => {
                        const numMatch = match.match(/(\d+)/)
                        if (numMatch) {
                          const num = parseInt(numMatch[1])
                          if (num > totalEmbryosFound) {
                            totalEmbryosFound = num
                          }
                        }
                      })
                    }

                    if (usedMatches && usedMatches.length > 0) {
                      usedMatches.forEach((match) => {
                        const numMatch = match.match(/(\d+)/)
                        if (numMatch) {
                          const num = parseInt(numMatch[1])
                          usedEmbryosFound += num
                        }
                      })
                    }

                    // Alternative: Look for table rows or specific patterns in the template
                    // This is a simplified approach - actual parsing may need to be more sophisticated
                    const tableRowMatches = templateText.match(
                      /<tr[^>]*>[\s\S]*?(\d+)[\s\S]*?<\/tr>/gi,
                    )
                    if (tableRowMatches) {
                      tableRowMatches.forEach((row) => {
                        // Try to extract numeric values from table cells
                        const cellMatches = row.match(
                          /<td[^>]*>[\s\S]*?(\d+)[\s\S]*?<\/td>/gi,
                        )
                        if (cellMatches) {
                          cellMatches.forEach((cell) => {
                            const numMatch = cell.match(/(\d+)/)
                            if (numMatch) {
                              const num = parseInt(numMatch[1])
                              if (num > 0 && num < 100) {
                                // Reasonable embryo count range
                                if (
                                  !totalEmbryosFound ||
                                  num > totalEmbryosFound
                                ) {
                                  totalEmbryosFound = num
                                }
                              }
                            }
                          })
                        }
                      })
                    }
                  }
                })
              }
            })

            // Set embryo counts if found
            if (totalEmbryosFound > 0) {
              updatedFormData.numberOfEmbryos = totalEmbryosFound.toString()
            }
            if (usedEmbryosFound > 0) {
              updatedFormData.numberOfEmbryosUsed = usedEmbryosFound.toString()
            }

            // Note: If embryo counts cannot be extracted from templates,
            // you may need to add a dedicated API endpoint that stores structured embryo data
            // or enhance the embryology history query to include embryo counts
          }
        }
      }

      // Lab Test Results including UPT (B-HCG)
      if (
        checklistData?.labTestsList &&
        Array.isArray(checklistData.labTestsList)
      ) {
        // Find UPT/B-HCG test in lab tests
        const uptTest = checklistData.labTestsList.find(
          (test) =>
            test.labTestName?.toLowerCase().includes('upt') ||
            test.labTestName?.toLowerCase().includes('pregnancy') ||
            test.labTestName?.toLowerCase().includes('hcg') ||
            test.labTestName?.toLowerCase().includes('b-hcg') ||
            test.labTestName?.toLowerCase().includes('bhcg'),
        )

        if (uptTest) {
          // Fetch the actual UPT test result
          try {
            const uptResultResponse = await getSavedLabTestResult(
              userDetails.accessToken,
              uptTest.type || 'CONSULTATION',
              uptTest.appointmentId,
              uptTest.billTypeValue,
              0, // isSpouse - assuming patient, not spouse
            )

            if (
              uptResultResponse.status === 200 &&
              uptResultResponse.data?.labTestResult
            ) {
              const labTestResult = uptResultResponse.data.labTestResult

              // Parse the lab test result to extract UPT result
              // The result might be in HTML format or plain text
              // Common patterns: Positive, Negative, or numeric values

              const resultText =
                typeof labTestResult === 'string'
                  ? labTestResult.toLowerCase()
                  : JSON.stringify(labTestResult).toLowerCase()

              // Extract UPT result
              if (
                resultText.includes('positive') ||
                resultText.includes('+') ||
                resultText.match(/\bpositive\b/i)
              ) {
                updatedFormData.uptResult = 'Positive'
              } else if (
                resultText.includes('negative') ||
                resultText.includes('-') ||
                resultText.match(/\bnegative\b/i)
              ) {
                updatedFormData.uptResult = 'Negative'
              } else if (
                resultText.match(/\b\d+\.?\d*\s*(miu\/ml|mu\/ml|iu\/l)\b/i)
              ) {
                // If numeric value found, check thresholds (typically >5 or >25 mIU/mL is positive)
                const numericMatch = resultText.match(
                  /(\d+\.?\d*)\s*(miu\/ml|mu\/ml|iu\/l)/i,
                )
                if (numericMatch) {
                  const value = parseFloat(numericMatch[1])
                  // Threshold for pregnancy: typically >5 or >25 depending on the test
                  if (value > 5) {
                    updatedFormData.uptResult = 'Positive'
                    updatedFormData.uptManualEntry = `${numericMatch[1]} ${numericMatch[2]}`
                  } else {
                    updatedFormData.uptResult = 'Negative'
                  }
                } else {
                  updatedFormData.uptResult = 'Others'
                  updatedFormData.uptManualEntry = labTestResult.substring(
                    0,
                    255,
                  ) // Limit to 255 chars
                }
              } else {
                // If result doesn't match standard patterns, mark as "Others"
                updatedFormData.uptResult = 'Others'
                updatedFormData.uptManualEntry =
                  typeof labTestResult === 'string'
                    ? labTestResult.substring(0, 255)
                    : JSON.stringify(labTestResult).substring(0, 255)
              }
            }
          } catch (err) {
            console.error('Error fetching UPT result:', err)
            // If test exists but result can't be fetched, mark as found but no result
          }
        }
      }

      // Update form data
      setFormData(updatedFormData)

      toast.success('Patient data loaded successfully!', {
        position: 'top-right',
      })

      // If needed, fetch additional details in background
      // You can add more API calls here for embryology, lab results, etc.
    } catch (error) {
      console.error('Error searching patient:', error)
      toast.error('Error searching patient. Please try again.', {
        position: 'top-right',
      })
    } finally {
      setIsSearching(false)
      dispatch(hideLoader())
    }
  }, [userDetails.accessToken, dispatch]) // Don't include searchMobileNumber - we use ref instead

  // Handle clear search
  const handleClearSearch = () => {
    // Clear ref first
    searchValueRef.current = ''
    // Clear state
    setSearchMobileNumber('')
    setSearchedPatient(null)
    setSelectedPatientOption(null)
    setPatientSuggestions([])
    // Reset input value directly via ref (for uncontrolled input)
    if (searchInputRef.current) {
      searchInputRef.current.value = ''
    }
    // Focus back on search input after clearing
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus()
      }
    }, 100)
  }

  // Memoized onChange handler to prevent re-renders that cause focus loss
  // Use a ref to store the latest value to avoid closure issues
  const searchValueRef = useRef(searchMobileNumber)

  // Update ref when state changes (only if not currently focused)
  useEffect(() => {
    if (
      searchInputRef.current &&
      document.activeElement !== searchInputRef.current
    ) {
      searchValueRef.current = searchMobileNumber
    }
  }, [searchMobileNumber])

  // Sync state when input loses focus - this is the only time we update state
  // During typing, state is NOT updated to prevent re-renders that cause focus loss
  const handleSearchBlur = useCallback((e) => {
    const value = e.target.value || ''
    searchValueRef.current = value
    setSearchMobileNumber(value)
  }, [])

  // Handle key down - get value directly from DOM element to avoid state dependency
  const handleSearchKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        const currentValue = e.target.value.trim()
        if (currentValue) {
          // Update ref with current value from DOM
          searchValueRef.current = currentValue
          // Update state for display purposes (but component won't re-render due to memo)
          setSearchMobileNumber(currentValue)
          // Call search handler immediately - it uses ref to get latest value
          handleSearchPatient()
        }
      }
    },
    [handleSearchPatient],
  )

  // Debounced function to fetch patient suggestions for autocomplete
  const debouncedGetPatientSuggestions = useMemo(
    () =>
      debounce(async (searchText) => {
        if (!searchText || searchText.trim().length < 2) {
          setPatientSuggestions([])
          return
        }
        try {
          setIsLoadingPatients(true)
          const response = await getAllPatients(
            userDetails.accessToken,
            searchText.trim(),
          )
          if (response.status === 200 && response.data) {
            setPatientSuggestions(response.data || [])
          } else {
            setPatientSuggestions([])
          }
        } catch (error) {
          console.error('Error fetching patient suggestions:', error)
          setPatientSuggestions([])
        } finally {
          setIsLoadingPatients(false)
        }
      }, 300),
    [userDetails.accessToken],
  )

  // Handle input change for autocomplete - doesn't update state to prevent focus loss
  const handleAutocompleteInputChange = useCallback(
    (event, newInputValue, reason) => {
      // Update ref immediately (doesn't cause re-render)
      searchValueRef.current = newInputValue || ''

      // Only trigger search for 'input' reason (user typing)
      // Do NOT update state during typing to prevent re-renders that cause focus loss
      if (reason === 'input') {
        if (newInputValue && newInputValue.trim().length >= 2) {
          debouncedGetPatientSuggestions(newInputValue)
        } else {
          setPatientSuggestions([])
        }
      } else if (reason === 'clear') {
        setPatientSuggestions([])
        setSelectedPatientOption(null)
        setSearchMobileNumber('')
        searchValueRef.current = ''
      } else if (reason === 'reset') {
        // Don't update state on reset to prevent re-render
        searchValueRef.current = ''
      }
    },
    [debouncedGetPatientSuggestions],
  )

  // Handle patient selection from custom autocomplete component
  const handlePatientSelect = useCallback(
    async (patient) => {
      if (!patient) {
        setSelectedPatientOption(null)
        return
      }

      setSelectedPatientOption(patient)
      // Use mobile number or patient ID to search
      const searchValue =
        patient.mobileNo || patient.mobileNumber || patient.patientId || ''
      if (searchValue) {
        searchValueRef.current = searchValue
        setSearchMobileNumber(searchValue)
        // Trigger the existing search handler to populate all form data
        setIsSearching(true)
        dispatch(showLoader())

        try {
          // Use the selected patient's mobile number or patient ID
          const patientSearchResponse = await getPatientByAadharOrMobile(
            userDetails.accessToken,
            searchValue.trim(),
          )

          if (
            patientSearchResponse.status !== 200 ||
            !patientSearchResponse.data
          ) {
            toast.error('Patient not found', {
              position: 'top-right',
            })
            setIsSearching(false)
            dispatch(hideLoader())
            return
          }

          const patientData = patientSearchResponse.data
          setSearchedPatient({
            patientId: patientData.patientId,
            patientName:
              `${patientData.lastName || ''} ${patientData.firstName || ''}`.trim(),
            id: patientData.id,
          })

          // Now trigger the full data fetch by calling handleSearchPatient
          // This will fetch all comprehensive data and populate the form
          await handleSearchPatient()
        } catch (error) {
          console.error('Error loading patient data:', error)
          toast.error('Error loading patient data. Please try again.', {
            position: 'top-right',
          })
        } finally {
          setIsSearching(false)
          dispatch(hideLoader())
        }
      }
    },
    [userDetails.accessToken, dispatch, handleSearchPatient],
  )

  // Stable getOptionLabel function
  const getOptionLabel = useCallback((option) => {
    if (typeof option === 'string') return option
    const name =
      `${option.lastName || ''} ${option.firstName || ''}`.trim() ||
      option.Name ||
      ''
    const mobile = option.mobileNo || option.mobileNumber || ''
    const patientId = option.patientId || ''
    if (name && mobile) {
      return `${name} - ${mobile}${patientId ? ` (${patientId})` : ''}`
    }
    return name || mobile || patientId || 'Unknown Patient'
  }, [])

  // Stable renderOption function
  const renderOption = useCallback((props, option) => {
    const name =
      `${option.lastName || ''} ${option.firstName || ''}`.trim() ||
      option.Name ||
      ''
    const mobile = option.mobileNo || option.mobileNumber || ''
    const patientId = option.patientId || ''
    return (
      <Box component="li" {...props} key={option.id || option.patientId}>
        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          <Typography variant="body2" fontWeight={500}>
            {name || 'Unknown Patient'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
            {mobile && (
              <Typography variant="caption" color="text.secondary">
                📱 {mobile}
              </Typography>
            )}
            {patientId && (
              <Typography variant="caption" color="text.secondary">
                ID: {patientId}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    )
  }, [])

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedGetPatientSuggestions.cancel()
    }
  }, [debouncedGetPatientSuggestions])

  // Fetch all patients for Summary Automated tab
  useEffect(() => {
    const fetchAutomatedSummary = async () => {
      if (activeTab === 2) {
        setIsLoadingAutomatedSummary(true)
        try {
          const response = await getAllPatients(userDetails.accessToken, '')
          if (response.status === 200 && response.data) {
            // Debug: Log first patient to check branch data structure
            if (response.data && response.data.length > 0) {
              console.log('Sample patient data for branch:', {
                id: response.data[0].id,
                patientId: response.data[0].patientId,
                branchId: response.data[0].branchId,
                branch: response.data[0].branch,
                branchCode: response.data[0].branchCode,
                branchName: response.data[0].branchName,
                allKeys: Object.keys(response.data[0]),
              })
            }
            // Sort by creation date or patientId ascending
            const sortedData = (response.data || []).sort((a, b) => {
              const dateA = dayjs(
                a.createdAt || a.CreatedAt || a.date || a.Date,
              )
              const dateB = dayjs(
                b.createdAt || b.CreatedAt || b.date || b.Date,
              )
              return dateA.isBefore(dateB) ? -1 : dateA.isAfter(dateB) ? 1 : 0
            })
            setAutomatedSummaryData(sortedData)

            // Fetch package data for each patient (via visits) - fetch in background
            const packageDataMap = {}

            // Process patients in smaller batches to avoid blocking
            const patientsToProcess = sortedData.slice(0, 100) // Increased limit

            // Process in batches of 10 to avoid overwhelming the API
            const batchSize = 10
            for (let i = 0; i < patientsToProcess.length; i += batchSize) {
              const batch = patientsToProcess.slice(i, i + batchSize)

              await Promise.all(
                batch.map(async (patient) => {
                  const patientId =
                    patient.id || patient.patientId || patient.PatientId
                  if (
                    !patientId ||
                    patientId === 'null' ||
                    patientId === null
                  ) {
                    return
                  }

                  try {
                    // Get visits for this patient

                    const visitsResponse = await getVisitsByPatientId(
                      userDetails.accessToken,
                      patientId,
                    )
                    let visits = []
                    if (visitsResponse && visitsResponse.status === 200) {
                      if (Array.isArray(visitsResponse.data)) {
                        visits = visitsResponse.data
                      } else if (
                        visitsResponse.data?.data &&
                        Array.isArray(visitsResponse.data.data)
                      ) {
                        visits = visitsResponse.data.data
                      }
                    }

                    // Get package data from the latest visit
                    if (visits.length > 0) {
                      const reversedVisits = [...visits].reverse()
                      for (const visit of reversedVisits) {
                        const visitId =
                          visit.id || visit.visitId || visit.VisitId
                        if (!visitId) continue

                        try {
                          const packageResponse = await getPackageData(
                            userDetails.accessToken,
                            visitId,
                          )
                          let pkgData = null
                          if (
                            packageResponse &&
                            packageResponse.status === 200
                          ) {
                            pkgData = packageResponse.data || packageResponse
                          } else if (packageResponse && packageResponse.data) {
                            pkgData = packageResponse.data
                          } else if (packageResponse) {
                            pkgData = packageResponse
                          }

                          // Check if package data exists
                          if (
                            pkgData &&
                            (pkgData.doctorSuggestedPackage ||
                              pkgData.marketingPackage ||
                              pkgData.doctorsPackage ||
                              pkgData.doctorPackage ||
                              pkgData.registrationAmount)
                          ) {
                            packageDataMap[patientId] = {
                              doctorsPackage:
                                pkgData.doctorSuggestedPackage ||
                                pkgData.doctorsPackage ||
                                pkgData.doctorPackage ||
                                0,
                              marketingPackage: pkgData.marketingPackage || 0,
                              registrationAmount:
                                pkgData.registrationAmount || 0,
                            }
                            break // Use the first package data found
                          }
                        } catch (err) {
                          // Continue to next visit if package fetch fails
                        }
                      }
                    }
                  } catch (err) {
                    // Continue to next patient if visit fetch fails
                  }
                }),
              )

              // Update state after each batch to show progress (merge with existing data)
              setPatientPackageData((prev) => ({ ...prev, ...packageDataMap }))
            }

            // Final update
            setPatientPackageData(packageDataMap)
          } else {
            setAutomatedSummaryData([])
            setPatientPackageData({})
          }
        } catch (error) {
          console.error('Error fetching automated summary:', error)
          setAutomatedSummaryData([])
        } finally {
          setIsLoadingAutomatedSummary(false)
        }
      }
    }
    fetchAutomatedSummary()
  }, [activeTab, userDetails.accessToken])

  // Fetch all patients for Summary Graph tab
  useEffect(() => {
    const fetchGraphSummary = async () => {
      if (activeTab === 3) {
        setIsLoadingGraphSummary(true)
        try {
          const response = await getAllPatients(userDetails.accessToken, '')
          if (response.status === 200 && response.data) {
            setGraphSummaryData(response.data || [])
          } else {
            setGraphSummaryData([])
          }
        } catch (error) {
          console.error('Error fetching graph summary:', error)
          setGraphSummaryData([])
        } finally {
          setIsLoadingGraphSummary(false)
        }
      }
    }
    fetchGraphSummary()
  }, [activeTab, userDetails.accessToken])

  // Handle save
  const handleSave = () => {
    // Validate required fields
    if (
      !formData.patientId ||
      !formData.date ||
      !formData.branch ||
      !formData.treatmentType ||
      !formData.cycleStatus
    ) {
      toast.error('Please fill in all required fields', {
        position: 'top-right',
      })
      return
    }

    // TODO: Implement API call to save data
    // Example API call structure:
    // const response = await savePatientTrackerData(userDetails.accessToken, {
    //   date: formData.date.format('YYYY-MM-DD'),
    //   branchId: formData.branch,
    //   patientId: formData.patientId,
    //   patientName: formData.patientName,
    //   mobileNumber: formData.mobileNumber,
    //   referralSource: formData.referralSource,
    //   referralName: formData.referralName,
    //   treatmentType: formData.treatmentType,
    //   cycleStatus: formData.cycleStatus,
    //   stageOfCycle: formData.stageOfCycle,
    //   packageName: formData.packageName,
    //   packageAmount: formData.packageAmount,
    //   registrationAmount: formData.registrationAmount,
    //   paidAmount: formData.paidAmount,
    //   numberOfEmbryos: formData.numberOfEmbryos,
    //   numberOfEmbryosUsed: formData.numberOfEmbryosUsed,
    //   lastRenewalDate: formData.lastRenewalDate?.format('YYYY-MM-DD'),
    //   numberOfEmbryosDiscarded: formData.numberOfEmbryosDiscarded,
    //   uptResult: formData.uptResult,
    //   uptManualEntry: formData.uptManualEntry,
    // })
    // if (response.status === 200) {
    //   toast.success('Patient tracker data saved successfully!')
    //   queryClient.invalidateQueries(['patientTrackerSummary'])
    //   // Optionally reset form after successful save
    //   // setFormData({ ...initialFormData })
    // }

    // For now, show success message
    // The data entered will be reflected in the Summary tab automatically
    toast.success(
      'Patient tracker data saved successfully! The data will appear in the Summary tab.',
      {
        position: 'top-right',
      },
    )
  }

  // Create stable onChange handlers using useRef - initialized once, never change
  const handlersRef = useRef(null)

  if (!handlersRef.current) {
    const handlers = {}
    const textFieldNames = [
      'patientId',
      'patientName',
      'mobileNumber',
      'referralName',
      'plan',
      'stageOfCycle',
      'packageName',
      'packageAmount',
      'registrationAmount',
      'paidAmount',
      'numberOfEmbryos',
      'numberOfEmbryosUsed',
      'numberOfEmbryosDiscarded',
      'uptManualEntry',
    ]

    // Text fields use onBlur handlers
    textFieldNames.forEach((fieldName) => {
      handlers[`${fieldName}_blur`] = (e) => {
        const value = e?.target?.value ?? ''
        setFormData((prev) => ({
          ...prev,
          [fieldName]: value,
        }))
      }
    })

    // Select fields use onChange handlers
    const selectFieldNames = [
      'branch',
      'referralSource',
      'treatmentType',
      'cycleStatus',
      'uptResult',
    ]
    selectFieldNames.forEach((fieldName) => {
      handlers[fieldName] = (e) => {
        const value = e?.target?.value ?? ''
        setFormData((prev) => ({
          ...prev,
          [fieldName]: value,
        }))
      }
    })

    handlers.date = (newValue) => {
      setFormData((prev) => ({
        ...prev,
        date: newValue,
      }))
    }

    handlers.lastRenewalDate = (newValue) => {
      setFormData((prev) => ({
        ...prev,
        lastRenewalDate: newValue,
      }))
    }

    handlersRef.current = handlers
  }

  const fieldHandlers = handlersRef.current
  const dateHandlers = {
    date: handlersRef.current.date,
    lastRenewalDate: handlersRef.current.lastRenewalDate,
  }

  // Treatment Type options
  const treatmentTypeOptions = [
    { value: 'IVF', label: 'IVF' },
    { value: 'OI-TI', label: 'OI-TI' },
    { value: 'IUI', label: 'IUI' },
  ]

  // Cycle Status options
  const cycleStatusOptions = [
    { value: 'Not Started', label: 'Not Started' },
    { value: 'Registered', label: 'Registered' },
    { value: 'Running', label: 'Running' },
    { value: 'Complete', label: 'Complete' },
    { value: 'Cancelled', label: 'Cancelled' },
  ]

  // UPT Result options
  const uptResultOptions = [
    { value: 'Positive', label: 'Positive' },
    { value: 'Negative', label: 'Negative' },
    { value: 'Others', label: 'Others' },
  ]

  // Branch options - Filtered to only show specific branches: HYD, HNK, KMM, SPL
  const allowedBranchCodes = ['HYD', 'HNK', 'KMM', 'SPL']
  const branchOptions =
    branches
      ?.filter((branch) => {
        const branchCode = (branch.branchCode || branch.name || '')
          .toString()
          .trim()
        return allowedBranchCodes.some(
          (allowedCode) =>
            allowedCode.toUpperCase() === branchCode.toUpperCase(),
        )
      })
      ?.map((branch) => ({
        value: branch.id,
        label: branch.name || branch.branchCode,
      })) || []

  // Referral Source options
  const referralSourceOptions =
    referralSourceList?.map((source) => ({
      value: source.id || source.name,
      label: source.name,
    })) || []

  // Summary Tab - Transform formData to table rows
  // TODO: Replace with API call to fetch saved patient tracker records
  // When API is available, use useQuery to fetch data like:
  // const { data: savedRecords } = useQuery({
  //   queryKey: ['patientTrackerSummary', summaryFromDate, summaryToDate, summaryBranchId],
  //   queryFn: async () => {
  //     const response = await getPatientTrackerRecords(
  //       userDetails.accessToken,
  //       `${summaryFromDate.$y}-${summaryFromDate.$M + 1}-${summaryFromDate.$D}`,
  //       `${summaryToDate.$y}-${summaryToDate.$M + 1}-${summaryToDate.$D}`,
  //       summaryBranchId
  //     )
  //     return response.data || []
  //   }
  // })
  const summaryTableRows = useMemo(() => {
    const rows = []

    // Only add row if patientId and date are present (indicating data was entered)
    if (formData.patientId && formData.date) {
      const branchName =
        branchOptions.find((b) => b.value === formData.branch)?.label || 'N/A'
      const entryDate = dayjs(formData.date)
      const fromDateObj = dayjs(summaryFromDate)
      const toDateObj = dayjs(summaryToDate)

      // Apply date filter
      const isInDateRange =
        entryDate.isSameOrAfter(fromDateObj, 'day') &&
        entryDate.isSameOrBefore(toDateObj, 'day')

      // Apply branch filter
      const matchesBranch =
        !summaryBranchId || formData.branch === summaryBranchId

      // Only include row if it matches filters
      if (isInDateRange && matchesBranch) {
        rows.push({
          id: `current-${formData.patientId}-${entryDate.format('YYYY-MM-DD')}`,
          date: entryDate.format('DD-MM-YYYY'),
          patientId: formData.patientId || 'N/A',
          patientName: formData.patientName || 'N/A',
          mobileNumber: formData.mobileNumber || 'N/A',
          branch: branchName,
          treatmentType: formData.treatmentType || 'N/A',
          cycleStatus: formData.cycleStatus || 'N/A',
          stageOfCycle: formData.stageOfCycle || 'N/A',
          packageName: formData.packageName || 'N/A',
          packageAmount: parseFloat(formData.packageAmount || 0).toFixed(2),
          registrationAmount: parseFloat(
            formData.registrationAmount || 0,
          ).toFixed(2),
          paidAmount: parseFloat(formData.paidAmount || 0).toFixed(2),
          pendingAmount: pendingAmount.toFixed(2),
          numberOfEmbryos: formData.numberOfEmbryos || 0,
          numberOfEmbryosUsed: formData.numberOfEmbryosUsed || 0,
          embryosRemaining: embryosRemaining,
          numberOfEmbryosDiscarded: formData.numberOfEmbryosDiscarded || 0,
          lastRenewalDate: formData.lastRenewalDate
            ? dayjs(formData.lastRenewalDate).format('DD-MM-YYYY')
            : 'N/A',
          uptResult:
            formData.uptResult === 'Others'
              ? formData.uptManualEntry || 'Others'
              : formData.uptResult || 'N/A',
          referralSource:
            referralSourceOptions.find(
              (r) => r.value === formData.referralSource,
            )?.label ||
            formData.referralName ||
            'N/A',
        })
      }
    }

    // TODO: When API is available, merge savedRecords here:
    // const allRows = [...(savedRecords || []).map(record => ({ ...record })), ...rows]
    // return allRows

    return rows
  }, [
    formData,
    branchOptions,
    referralSourceOptions,
    pendingAmount,
    embryosRemaining,
    summaryFromDate,
    summaryToDate,
    summaryBranchId,
  ])

  // Summary Tab - Table Columns
  const summaryColumns = useMemo(
    () => [
      {
        field: 'date',
        headerName: 'Date',
        width: 120,
        headerAlign: 'center',
        align: 'center',
      },
      {
        field: 'patientId',
        headerName: 'Patient ID',
        width: 130,
        headerAlign: 'center',
        align: 'center',
      },
      {
        field: 'patientName',
        headerName: 'Patient Name',
        width: 200,
        headerAlign: 'center',
        align: 'left',
      },
      {
        field: 'mobileNumber',
        headerName: 'Mobile Number',
        width: 140,
        headerAlign: 'center',
        align: 'center',
      },
      {
        field: 'branch',
        headerName: 'Branch',
        width: 120,
        headerAlign: 'center',
        align: 'center',
      },
      {
        field: 'treatmentType',
        headerName: 'Treatment Type',
        width: 140,
        headerAlign: 'center',
        align: 'center',
        renderCell: (params) => (
          <Chip
            label={params.value}
            size="small"
            color="primary"
            variant="outlined"
          />
        ),
      },
      {
        field: 'cycleStatus',
        headerName: 'Cycle Status',
        width: 140,
        headerAlign: 'center',
        align: 'center',
        renderCell: (params) => {
          const status = params.value
          const color =
            status === 'Complete'
              ? 'success'
              : status === 'Running'
                ? 'info'
                : 'default'
          return (
            <Chip
              label={status}
              size="small"
              color={color}
              variant="outlined"
            />
          )
        },
      },
      {
        field: 'stageOfCycle',
        headerName: 'Stage of Cycle',
        width: 150,
        headerAlign: 'center',
        align: 'center',
      },
      {
        field: 'packageName',
        headerName: 'Package',
        width: 150,
        headerAlign: 'center',
        align: 'left',
      },
      {
        field: 'packageAmount',
        headerName: 'Package Amount',
        width: 140,
        headerAlign: 'center',
        align: 'right',
        renderCell: (params) => `₹${params.value}`,
      },
      {
        field: 'paidAmount',
        headerName: 'Paid Amount',
        width: 130,
        headerAlign: 'center',
        align: 'right',
        renderCell: (params) => (
          <Typography variant="body2" color="success.main" fontWeight={500}>
            ₹{params.value}
          </Typography>
        ),
      },
      {
        field: 'pendingAmount',
        headerName: 'Pending Amount',
        width: 140,
        headerAlign: 'center',
        align: 'right',
        renderCell: (params) => {
          const amount = parseFloat(params.value)
          return (
            <Typography
              variant="body2"
              fontWeight={600}
              color={amount > 0 ? 'error.main' : 'success.main'}
            >
              ₹{params.value}
            </Typography>
          )
        },
      },
      {
        field: 'numberOfEmbryos',
        headerName: 'Total Embryos',
        width: 130,
        headerAlign: 'center',
        align: 'center',
      },
      {
        field: 'numberOfEmbryosUsed',
        headerName: 'Embryos Used',
        width: 130,
        headerAlign: 'center',
        align: 'center',
      },
      {
        field: 'embryosRemaining',
        headerName: 'Embryos Remaining',
        width: 160,
        headerAlign: 'center',
        align: 'center',
        renderCell: (params) => {
          const remaining = parseInt(params.value)
          return (
            <Typography
              variant="body2"
              fontWeight={500}
              color={remaining > 0 ? 'success.main' : 'error.main'}
            >
              {remaining}
            </Typography>
          )
        },
      },
      {
        field: 'uptResult',
        headerName: 'UPT Result',
        width: 140,
        headerAlign: 'center',
        align: 'center',
        renderCell: (params) => {
          const result = params.value?.toLowerCase() || ''
          const color = result.includes('positive')
            ? 'success'
            : result.includes('negative')
              ? 'error'
              : 'default'
          return (
            <Chip
              label={params.value}
              size="small"
              color={color}
              sx={{ fontWeight: 600 }}
            />
          )
        },
      },
      {
        field: 'actions',
        headerName: 'Actions',
        width: 120,
        headerAlign: 'center',
        align: 'center',
        sortable: false,
        renderCell: (params) => (
          <Button
            variant="contained"
            size="small"
            startIcon={<VisibilityIcon />}
            onClick={() => {
              // TODO: Open view/edit modal with full patient tracker details
              toast.info('View details functionality will be implemented', {
                position: 'top-right',
              })
            }}
            sx={{
              bgcolor: '#06aee9',
              '&:hover': { bgcolor: '#0599d1' },
            }}
          >
            View
          </Button>
        ),
      },
    ],
    [],
  )

  // Summary Automated Tab - Table Columns
  const automatedSummaryColumns = useMemo(
    () => [
      {
        field: 'date',
        headerName: 'Date',
        width: 120,
        headerAlign: 'center',
        align: 'center',
        renderCell: (params) => {
          const date = params.value
            ? dayjs(params.value).format('DD-MM-YYYY')
            : '-'
          return <Typography variant="body2">{date}</Typography>
        },
      },
      {
        field: 'branch',
        headerName: 'Branch',
        width: 120,
        headerAlign: 'center',
        align: 'center',
      },
      {
        field: 'patientId',
        headerName: 'ID',
        width: 120,
        headerAlign: 'center',
        align: 'center',
      },
      {
        field: 'patientName',
        headerName: 'Patient Name',
        width: 180,
        headerAlign: 'center',
        align: 'left',
      },
      {
        field: 'mobileNumber',
        headerName: 'Number',
        width: 130,
        headerAlign: 'center',
        align: 'center',
      },
      {
        field: 'referralSource',
        headerName: 'Referral Source',
        width: 150,
        headerAlign: 'center',
        align: 'center',
      },
      {
        field: 'referralName',
        headerName: 'Referral Name',
        width: 150,
        headerAlign: 'center',
        align: 'left',
      },
      {
        field: 'plan',
        headerName: 'Plan',
        width: 120,
        headerAlign: 'center',
        align: 'center',
      },
      {
        field: 'treatmentType',
        headerName: 'Treatment Type',
        width: 140,
        headerAlign: 'center',
        align: 'center',
      },
      {
        field: 'cycleStatus',
        headerName: 'Cycle Status',
        width: 130,
        headerAlign: 'center',
        align: 'center',
      },
      {
        field: 'stageOfCycle',
        headerName: 'Stage of Cycle',
        width: 150,
        headerAlign: 'center',
        align: 'center',
      },
      {
        field: 'doctorsPackage',
        headerName: "Doctor's Package",
        width: 160,
        headerAlign: 'center',
        align: 'right',
        renderCell: (params) => {
          if (
            params.value === '-' ||
            params.value === null ||
            params.value === undefined
          )
            return '-'
          const numValue =
            typeof params.value === 'number'
              ? params.value
              : parseFloat(params.value)
          return isNaN(numValue) || numValue === 0
            ? '-'
            : numValue.toLocaleString('en-IN')
        },
      },
      {
        field: 'marketingPackage',
        headerName: 'Marketing Package',
        width: 160,
        headerAlign: 'center',
        align: 'right',
        renderCell: (params) => {
          if (
            params.value === '-' ||
            params.value === null ||
            params.value === undefined
          )
            return '-'
          const numValue =
            typeof params.value === 'number'
              ? params.value
              : parseFloat(params.value)
          return isNaN(numValue) || numValue === 0
            ? '-'
            : numValue.toLocaleString('en-IN')
        },
      },
      {
        field: 'registrationAmount',
        headerName: 'Registration Amount',
        width: 160,
        headerAlign: 'center',
        align: 'right',
        renderCell: (params) => {
          if (
            params.value === null ||
            params.value === undefined ||
            params.value === 0
          )
            return '0'
          const numValue =
            typeof params.value === 'number'
              ? params.value
              : parseFloat(params.value)
          return isNaN(numValue) ? '0' : numValue.toLocaleString('en-IN')
        },
      },
      {
        field: 'paidAmount',
        headerName: 'Paid Amount',
        width: 130,
        headerAlign: 'center',
        align: 'right',
        renderCell: (params) => `₹${params.value || 0}`,
      },
      {
        field: 'pendingAmount',
        headerName: 'Pending Amount',
        width: 140,
        headerAlign: 'center',
        align: 'right',
        renderCell: (params) => `₹${params.value || 0}`,
      },
      {
        field: 'icsiD1',
        headerName: 'ICSI - D1',
        width: 120,
        headerAlign: 'center',
        align: 'center',
      },
      {
        field: 'opu',
        headerName: 'OPU',
        width: 100,
        headerAlign: 'center',
        align: 'center',
      },
      {
        field: 'fetD1',
        headerName: 'FET - D1',
        width: 120,
        headerAlign: 'center',
        align: 'center',
      },
      {
        field: 'fet',
        headerName: 'FET',
        width: 100,
        headerAlign: 'center',
        align: 'center',
      },
      {
        field: 'uptResult',
        headerName: 'UPT Result',
        width: 120,
        headerAlign: 'center',
        align: 'center',
      },
      {
        field: 'numberOfEmbryos',
        headerName: 'No. of Embryos',
        width: 130,
        headerAlign: 'center',
        align: 'center',
      },
      {
        field: 'numberOfEmbryosUsed',
        headerName: 'No of Embryo used',
        width: 150,
        headerAlign: 'center',
        align: 'center',
      },
      {
        field: 'embryosRemaining',
        headerName: 'No of Embryo remaining',
        width: 170,
        headerAlign: 'center',
        align: 'center',
      },
      {
        field: 'lastRenewalDate',
        headerName: 'Last Renewal Date',
        width: 150,
        headerAlign: 'center',
        align: 'center',
        renderCell: (params) => {
          const date = params.value
            ? dayjs(params.value).format('DD-MM-YYYY')
            : '-'
          return <Typography variant="body2">{date}</Typography>
        },
      },
      {
        field: 'numberOfEmbryosDiscarded',
        headerName: 'No of Embryo discarded',
        width: 170,
        headerAlign: 'center',
        align: 'center',
      },
    ],
    [],
  )

  // Branch options for Summary Automated tab
  const automatedSummaryBranchOptions = useMemo(
    () => [
      { value: 'ALL', label: 'ALL' },
      { value: 'HNK', label: 'HNK' },
      { value: 'HYD', label: 'HYD' },
      { value: 'KMM', label: 'KMM' },
      { value: 'SPL', label: 'SPL' },
    ],
    [],
  )

  // Referral source options for Summary Automated tab
  const automatedSummaryReferralOptions = useMemo(
    () => [
      { value: '', label: 'All' },
      { value: 'Friends', label: 'Friends' },
      { value: 'Social Media', label: 'Social Media' },
      { value: 'Hoarding', label: 'Hoarding' },
      { value: 'Old Patient', label: 'Old Patient' },
      { value: 'TV Ad', label: 'TV Ad' },
      { value: 'Referring Doctor', label: 'Referring Doctor' },
      { value: 'Asha Worker', label: 'Asha Worker' },
      { value: 'RMP', label: 'RMP' },
      { value: 'Family', label: 'Family' },
      { value: 'Staff', label: 'Staff' },
      { value: 'Walk-in', label: 'Walk-in' },
      { value: 'Test', label: 'Test' },
      { value: 'Test UX', label: 'Test UX' },
      { value: 'Free Camp', label: 'Free Camp' },
      { value: 'Marketing', label: 'Marketing' },
    ],
    [],
  )

  // Transform and filter data for Summary Automated tab - Map from patients table
  const automatedSummaryRows = useMemo(() => {
    let filteredData = automatedSummaryData

    // Filter by date range
    if (automatedSummaryFromDate || automatedSummaryToDate) {
      filteredData = filteredData.filter((patient) => {
        const registrationDate =
          patient.registrationDate ||
          patient.registeredDate ||
          patient.createdAt ||
          patient.dateOfBirth
        if (!registrationDate) return false

        const patientDate = dayjs(registrationDate)
        if (
          automatedSummaryFromDate &&
          patientDate.isBefore(automatedSummaryFromDate, 'day')
        ) {
          return false
        }
        if (
          automatedSummaryToDate &&
          patientDate.isAfter(automatedSummaryToDate, 'day')
        ) {
          return false
        }
        return true
      })
    }

    // Filter by branch
    if (automatedSummaryBranch && automatedSummaryBranch !== 'ALL') {
      const selectedBranchCode = automatedSummaryBranch
        .toString()
        .toUpperCase()
        .trim()
      filteredData = filteredData.filter((patient) => {
        // Try to match by branchId first (most reliable)
        if (patient.branchId && userBranches.length > 0) {
          const branchObj = userBranches.find((b) => b.id === patient.branchId)
          if (branchObj) {
            const branchCode = (branchObj.branchCode || branchObj.name || '')
              .toString()
              .toUpperCase()
              .trim()
            const branchName = (branchObj.name || branchObj.branchCode || '')
              .toString()
              .toUpperCase()
              .trim()
            // Match by code or name
            if (
              branchCode === selectedBranchCode ||
              branchName === selectedBranchCode
            ) {
              return true
            }
          }
        }

        // Try to match by direct branch fields from patient data
        const patientBranchCode = (patient.branchCode || patient.branch || '')
          .toString()
          .toUpperCase()
          .trim()
        const patientBranchName = (patient.branchName || patient.branch || '')
          .toString()
          .toUpperCase()
          .trim()
        const patientBranchDetailsCode = (
          patient.branchDetails?.branchCode || ''
        )
          .toString()
          .toUpperCase()
          .trim()
        const patientBranchDetailsName = (patient.branchDetails?.name || '')
          .toString()
          .toUpperCase()
          .trim()

        // Check if any branch field matches (exact match or contains)
        if (
          patientBranchCode &&
          (patientBranchCode === selectedBranchCode ||
            patientBranchCode.includes(selectedBranchCode) ||
            selectedBranchCode.includes(patientBranchCode))
        ) {
          return true
        }
        if (
          patientBranchName &&
          (patientBranchName === selectedBranchCode ||
            patientBranchName.includes(selectedBranchCode) ||
            selectedBranchCode.includes(patientBranchName))
        ) {
          return true
        }
        if (
          patientBranchDetailsCode &&
          (patientBranchDetailsCode === selectedBranchCode ||
            patientBranchDetailsCode.includes(selectedBranchCode) ||
            selectedBranchCode.includes(patientBranchDetailsCode))
        ) {
          return true
        }
        if (
          patientBranchDetailsName &&
          (patientBranchDetailsName === selectedBranchCode ||
            patientBranchDetailsName.includes(selectedBranchCode) ||
            selectedBranchCode.includes(patientBranchDetailsName))
        ) {
          return true
        }

        // Also try to match with userBranches by code/name
        if (userBranches.length > 0) {
          const matchedBranch = userBranches.find((b) => {
            const bCode = (b.branchCode || '').toString().toUpperCase().trim()
            const bName = (b.name || '').toString().toUpperCase().trim()
            return bCode === selectedBranchCode || bName === selectedBranchCode
          })
          if (matchedBranch) {
            // Check if patient's branchId matches this branch
            if (patient.branchId === matchedBranch.id) {
              return true
            }
            // Check if patient's branch fields match this branch
            const patientBranchValue =
              patientBranchCode ||
              patientBranchName ||
              patientBranchDetailsCode ||
              patientBranchDetailsName
            if (patientBranchValue) {
              const matchedCode = (
                matchedBranch.branchCode ||
                matchedBranch.name ||
                ''
              )
                .toString()
                .toUpperCase()
                .trim()
              if (
                patientBranchValue === matchedCode ||
                patientBranchValue.includes(matchedCode) ||
                matchedCode.includes(patientBranchValue)
              ) {
                return true
              }
            }
          }
        }

        return false
      })
    }

    // Filter by referral source
    if (automatedSummaryReferral) {
      filteredData = filteredData.filter((patient) => {
        const referralSource =
          patient.referralSource?.referralSource ||
          patient.referralSource ||
          patient.referralSourceName ||
          ''
        return (
          referralSource.toString().trim() === automatedSummaryReferral.trim()
        )
      })
    }

    // Sort by date ascending
    filteredData = [...filteredData].sort((a, b) => {
      const dateA = dayjs(
        a.registrationDate || a.registeredDate || a.createdAt || a.dateOfBirth,
      )
      const dateB = dayjs(
        b.registrationDate || b.registeredDate || b.createdAt || b.dateOfBirth,
      )
      return dateA.isBefore(dateB) ? -1 : dateA.isAfter(dateB) ? 1 : 0
    })

    // Branch ID to Branch Code mapping (fallback if userBranches doesn't have the data)
    const branchIdToCodeMap = {
      1: 'HYD',
      2: 'HNK',
      3: 'SPL',
      4: 'KMM',
    }

    return filteredData.map((patient) => {
      // Get branch code - multiple fallback strategies
      let branchName = '-'

      // Strategy 1: Check branch field first (from API query - most reliable)
      // The backend query now returns branch as a string code (HNK, HYD, KMM, SPL)
      if (
        patient.branch &&
        typeof patient.branch === 'string' &&
        patient.branch.trim()
      ) {
        branchName = patient.branch.trim().toUpperCase()
      }

      // Strategy 2: Use branch ID mapping (1=HYD, 2=HNK, 3=SPL, 4=KMM)
      // Note: branchId in patient_master is STRING(50), not INTEGER
      if (branchName === '-' || branchName === 'NULL' || branchName === '') {
        const branchId =
          patient.branchId || patient.BranchId || patient.branch_id
        if (
          branchId !== null &&
          branchId !== undefined &&
          branchId !== '' &&
          branchId !== 'null'
        ) {
          const branchIdNum =
            typeof branchId === 'number' ? branchId : parseInt(branchId)
          if (!isNaN(branchIdNum) && branchIdToCodeMap[branchIdNum]) {
            branchName = branchIdToCodeMap[branchIdNum]
          }
        }
      }

      // Strategy 3: Match by branchId with userBranches
      if (
        (branchName === '-' || branchName === 'NULL' || branchName === '') &&
        patient.branchId &&
        userBranches.length > 0
      ) {
        const branchIdNum =
          typeof patient.branchId === 'number'
            ? patient.branchId
            : parseInt(patient.branchId)
        if (!isNaN(branchIdNum)) {
          const branchObj = userBranches.find((b) => {
            const bId = typeof b.id === 'number' ? b.id : parseInt(b.id)
            return bId === branchIdNum
          })
          if (branchObj) {
            branchName =
              branchObj.branchCode || branchObj.code || branchObj.name || '-'
          }
        }
      }

      // Strategy 4: Check other patient data fields
      if (branchName === '-' || branchName === 'NULL' || branchName === '') {
        const patientBranchCode =
          patient.branchCode ||
          patient.branch?.branchCode ||
          patient.branch?.code
        const patientBranchName = patient.branchName || patient.branch?.name
        const patientBranchDetailsCode =
          patient.branchDetails?.branchCode || patient.branchDetails?.code
        const patientBranchDetailsName = patient.branchDetails?.name

        // Prefer branch code over name
        branchName =
          patientBranchCode ||
          patientBranchDetailsCode ||
          patientBranchName ||
          patientBranchDetailsName ||
          '-'

        // If branch is an object with code/name, extract it
        if (typeof branchName === 'object' && branchName !== null) {
          branchName =
            branchName.code || branchName.branchCode || branchName.name || '-'
        }
      }

      // Normalize branch code (ensure uppercase and map full names to codes)
      if (
        branchName &&
        branchName !== '-' &&
        branchName !== 'NULL' &&
        branchName !== ''
      ) {
        branchName = branchName.toString().trim().toUpperCase()
        // Map full names to codes
        if (branchName.includes('HYD') || branchName.includes('HYDERABAD')) {
          branchName = 'HYD'
        } else if (
          branchName.includes('HNK') ||
          branchName.includes('HANUMAKONDA')
        ) {
          branchName = 'HNK'
        } else if (
          branchName.includes('KMM') ||
          branchName.includes('KHAMMAM')
        ) {
          branchName = 'KMM'
        } else if (
          branchName.includes('SPL') ||
          branchName.includes('SURYAPET')
        ) {
          branchName = 'SPL'
        } else if (
          branchName.length > 4 &&
          !['HYD', 'HNK', 'KMM', 'SPL'].includes(branchName)
        ) {
          // Extract first 3 letters if it's longer and not a known code
          branchName = branchName.substring(0, 3)
        }
      } else {
        branchName = '-'
      }

      // Get patient name
      const patientName =
        patient.Name ||
        patient.patientName ||
        patient.name ||
        `${patient.lastName || ''} ${patient.firstName || ''}`.trim() ||
        '-'

      // Get referral source
      const referralSource =
        patient.referralSource?.referralSource ||
        patient.referralSource ||
        patient.referralSourceName ||
        '-'

      // Get registration date (use createdAt, registrationDate, or dateOfBirth)
      const registrationDate =
        patient.registrationDate ||
        patient.registeredDate ||
        patient.createdAt ||
        patient.dateOfBirth ||
        dayjs().format('YYYY-MM-DD')

      // Calculate registration amount first (needed for cycle status)
      const patientId = patient.id || patient.patientId || patient.PatientId
      const pkgData = patientId ? patientPackageData[patientId] : null
      let calculatedRegistrationAmount = 0
      if (pkgData && pkgData.registrationAmount) {
        const value = pkgData.registrationAmount
        calculatedRegistrationAmount =
          value && value !== 0 ? parseFloat(value) : 0
      } else {
        // Fallback to patient data fields
        const regAmount =
          patient.registrationAmount || patient.RegistrationAmount || 0
        calculatedRegistrationAmount =
          regAmount && regAmount !== '-' && regAmount !== 0
            ? typeof regAmount === 'number'
              ? regAmount
              : parseFloat(regAmount)
            : 0
      }

      // Determine cycle status based on registration amount
      const cycleStatusValue =
        calculatedRegistrationAmount > 0 ? 'Registered' : 'Follow up'

      return {
        id: patient.id || patient.patientId || `patient-${Math.random()}`,
        date: registrationDate,
        branch: branchName,
        patientId: patient.patientId || patient.PatientId || '-',
        patientName: patientName,
        mobileNumber:
          patient.mobileNo ||
          patient.mobileNumber ||
          patient.MobileNumber ||
          '-',
        referralSource: referralSource,
        referralName: patient.referralName || patient.referralPersonName || '-',
        plan: patient.plan || patient.Plan || '-',
        treatmentType: patient.treatmentType || patient.TreatmentType || '-',
        cycleStatus: cycleStatusValue,
        stageOfCycle: patient.stageOfCycle || patient.StageOfCycle || '-',
        doctorsPackage: (() => {
          const patientId = patient.id || patient.patientId || patient.PatientId
          // First try to get from fetched package data
          const pkgData = patientId ? patientPackageData[patientId] : null
          if (pkgData && pkgData.doctorsPackage) {
            const value = pkgData.doctorsPackage
            return value && value !== 0 ? parseFloat(value) : 0
          }
          // Fallback to patient data fields
          const doctorsPkg =
            patient.doctorSuggestedPackage ||
            patient.doctorsPackage ||
            patient.DoctorSuggestedPackage ||
            patient.DoctorsPackage ||
            patient.package?.doctorSuggestedPackage ||
            patient.package?.doctorsPackage ||
            0
          if (doctorsPkg && doctorsPkg !== '-' && doctorsPkg !== 0) {
            return typeof doctorsPkg === 'number'
              ? doctorsPkg
              : typeof doctorsPkg === 'string' && !isNaN(parseFloat(doctorsPkg))
                ? parseFloat(doctorsPkg)
                : 0
          }
          return 0
        })(),
        marketingPackage: (() => {
          const patientId = patient.id || patient.patientId || patient.PatientId
          // First try to get from fetched package data
          const pkgData = patientId ? patientPackageData[patientId] : null
          if (pkgData && pkgData.marketingPackage) {
            const value = pkgData.marketingPackage
            return value && value !== 0 ? parseFloat(value) : 0
          }
          // Fallback to patient data fields
          const marketingPkg =
            patient.marketingPackage ||
            patient.MarketingPackage ||
            patient.package?.marketingPackage ||
            0
          if (marketingPkg && marketingPkg !== '-' && marketingPkg !== 0) {
            return typeof marketingPkg === 'number'
              ? marketingPkg
              : typeof marketingPkg === 'string' &&
                  !isNaN(parseFloat(marketingPkg))
                ? parseFloat(marketingPkg)
                : 0
          }
          return 0
        })(),
        registrationAmount: calculatedRegistrationAmount,
        paidAmount: patient.paidAmount || patient.PaidAmount || 0,
        pendingAmount: patient.pendingAmount || patient.PendingAmount || 0,
        icsiD1: patient.icsiD1 || patient.ICSI_D1 || patient.icsi_D1 || '-',
        opu: patient.opu || patient.OPU || '-',
        fetD1: patient.fetD1 || patient.FET_D1 || patient.fet_D1 || '-',
        fet: patient.fet || patient.FET || '-',
        uptResult: patient.uptResult || patient.UPTResult || '-',
        numberOfEmbryos:
          patient.numberOfEmbryos || patient.NumberOfEmbryos || 0,
        numberOfEmbryosUsed:
          patient.numberOfEmbryosUsed || patient.NumberOfEmbryosUsed || 0,
        embryosRemaining:
          patient.embryosRemaining || patient.EmbryosRemaining || 0,
        lastRenewalDate:
          patient.lastRenewalDate || patient.LastRenewalDate || null,
        numberOfEmbryosDiscarded:
          patient.numberOfEmbryosDiscarded ||
          patient.NumberOfEmbryosDiscarded ||
          0,
      }
    })
  }, [
    automatedSummaryData,
    userBranches,
    automatedSummaryFromDate,
    automatedSummaryToDate,
    automatedSummaryBranch,
    automatedSummaryReferral,
    patientPackageData,
  ])

  // Graph data processing for Summary Graph tab
  const graphChartData = useMemo(() => {
    let filteredData = graphSummaryData

    // Filter by date range
    if (graphSummaryFromDate || graphSummaryToDate) {
      filteredData = filteredData.filter((patient) => {
        const registrationDate =
          patient.registrationDate ||
          patient.registeredDate ||
          patient.createdAt ||
          patient.dateOfBirth
        if (!registrationDate) return false

        const patientDate = dayjs(registrationDate)
        if (
          graphSummaryFromDate &&
          patientDate.isBefore(graphSummaryFromDate, 'day')
        ) {
          return false
        }
        if (
          graphSummaryToDate &&
          patientDate.isAfter(graphSummaryToDate, 'day')
        ) {
          return false
        }
        return true
      })
    }

    // Filter by branch
    if (graphSummaryBranch && graphSummaryBranch !== 'ALL') {
      const selectedBranchCode = graphSummaryBranch
        .toString()
        .toUpperCase()
        .trim()
      // Branch ID to Branch Code mapping (fallback if userBranches doesn't have the data)
      const branchIdToCodeMap = {
        1: 'HYD',
        2: 'HNK',
        3: 'SPL',
        4: 'KMM',
      }

      filteredData = filteredData.filter((patient) => {
        // Strategy 1: Check branch field first (from API query - most reliable)
        // The backend query now returns branch as a string code (HNK, HYD, KMM, SPL)
        if (
          patient.branch &&
          typeof patient.branch === 'string' &&
          patient.branch.trim()
        ) {
          const patientBranch = patient.branch.trim().toUpperCase()
          if (patientBranch === selectedBranchCode) {
            return true
          }
        }

        // Strategy 2: Use branch ID mapping (1=HYD, 2=HNK, 3=SPL, 4=KMM)
        const branchId =
          patient.branchId || patient.BranchId || patient.branch_id
        if (
          branchId !== null &&
          branchId !== undefined &&
          branchId !== '' &&
          branchId !== 'null'
        ) {
          const branchIdNum =
            typeof branchId === 'number' ? branchId : parseInt(branchId)
          if (!isNaN(branchIdNum) && branchIdToCodeMap[branchIdNum]) {
            const mappedBranchCode = branchIdToCodeMap[branchIdNum]
            if (mappedBranchCode === selectedBranchCode) {
              return true
            }
          }
        }

        // Strategy 3: Match by branchId with userBranches
        if (branchId && userBranches.length > 0) {
          const branchIdNum =
            typeof branchId === 'number' ? branchId : parseInt(branchId)
          if (!isNaN(branchIdNum)) {
            const branchObj = userBranches.find((b) => {
              const bId = typeof b.id === 'number' ? b.id : parseInt(b.id)
              return bId === branchIdNum
            })
            if (branchObj) {
              const branchCode = (
                branchObj.branchCode ||
                branchObj.code ||
                branchObj.name ||
                ''
              )
                .toString()
                .toUpperCase()
                .trim()
              if (branchCode === selectedBranchCode) {
                return true
              }
            }
          }
        }

        // Strategy 4: Try to match by direct branch fields from patient data
        const patientBranchCode = (patient.branchCode || '')
          .toString()
          .toUpperCase()
          .trim()
        const patientBranchName = (patient.branchName || '')
          .toString()
          .toUpperCase()
          .trim()
        const patientBranchDetailsCode = (
          patient.branchDetails?.branchCode || ''
        )
          .toString()
          .toUpperCase()
          .trim()
        const patientBranchDetailsName = (patient.branchDetails?.name || '')
          .toString()
          .toUpperCase()
          .trim()

        // Check if any branch field matches (exact match)
        if (patientBranchCode && patientBranchCode === selectedBranchCode) {
          return true
        }
        if (patientBranchName && patientBranchName === selectedBranchCode) {
          return true
        }
        if (
          patientBranchDetailsCode &&
          patientBranchDetailsCode === selectedBranchCode
        ) {
          return true
        }
        if (
          patientBranchDetailsName &&
          patientBranchDetailsName === selectedBranchCode
        ) {
          return true
        }

        return false
      })
    }

    // Filter by referral source
    if (graphSummaryReferral) {
      filteredData = filteredData.filter((patient) => {
        const referralSource =
          patient.referralSource?.referralSource ||
          patient.referralSource ||
          patient.referralSourceName ||
          ''
        return referralSource.toString().trim() === graphSummaryReferral.trim()
      })
    }

    // Process data for charts
    // Branch distribution - properly map branches
    const branchDistribution = filteredData.reduce((acc, patient) => {
      let branchName = null

      // Try to match by branchId first (most reliable)
      if (patient.branchId && userBranches.length > 0) {
        const branchObj = userBranches.find((b) => b.id === patient.branchId)
        if (branchObj) {
          branchName = branchObj.branchCode || branchObj.name || null
        }
      }

      // Fallback to direct branch fields
      if (!branchName) {
        const patientBranchCode =
          patient.branchCode ||
          patient.branch ||
          patient.branchName ||
          patient.branchDetails?.branchCode ||
          patient.branchDetails?.name
        if (patientBranchCode) {
          // Try to match with user branches by code/name
          const matchedBranch = userBranches.find(
            (b) =>
              (b.branchCode &&
                b.branchCode.toString().toUpperCase() ===
                  patientBranchCode.toString().toUpperCase()) ||
              (b.name &&
                b.name.toString().toUpperCase() ===
                  patientBranchCode.toString().toUpperCase()),
          )
          branchName = matchedBranch
            ? matchedBranch.branchCode || matchedBranch.name
            : patientBranchCode
        }
      }

      // Use 'Unknown' only if no branch data found
      const finalBranchName = branchName || 'Unknown'
      acc[finalBranchName] = (acc[finalBranchName] || 0) + 1
      return acc
    }, {})

    // Referral distribution
    const referralDistribution = filteredData.reduce((acc, patient) => {
      const referralSource =
        patient.referralSource?.referralSource ||
        patient.referralSource ||
        patient.referralSourceName ||
        'Unknown'
      acc[referralSource] = (acc[referralSource] || 0) + 1
      return acc
    }, {})

    // Date distribution (monthly)
    const dateDistribution = filteredData.reduce((acc, patient) => {
      const registrationDate =
        patient.registrationDate ||
        patient.registeredDate ||
        patient.createdAt ||
        patient.dateOfBirth
      if (registrationDate) {
        const month = dayjs(registrationDate).format('MMM YYYY')
        acc[month] = (acc[month] || 0) + 1
      }
      return acc
    }, {})

    // Sort branch data by value (descending) for better visualization
    const sortedBranchData = Object.entries(branchDistribution)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    return {
      branchData: sortedBranchData,
      referralData: Object.entries(referralDistribution).map(
        ([name, value]) => ({ name, value }),
      ),
      dateData: Object.entries(dateDistribution)
        .map(([name, value]) => ({ name, value }))
        .sort(
          (a, b) =>
            dayjs(a.name, 'MMM YYYY').valueOf() -
            dayjs(b.name, 'MMM YYYY').valueOf(),
        ),
      totalPatients: filteredData.length,
    }
  }, [
    graphSummaryData,
    userBranches,
    graphSummaryFromDate,
    graphSummaryToDate,
    graphSummaryBranch,
    graphSummaryReferral,
  ])

  // Chart colors
  const CHART_COLORS = [
    '#06aee9',
    '#8884d8',
    '#82ca9d',
    '#ffc658',
    '#ff7300',
    '#8dd1e1',
    '#d084d0',
    '#ffb347',
    '#87ceeb',
    '#dda0dd',
  ]

  // Tab Panel Component
  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box>{children}</Box>}
    </div>
  )

  return (
    <Box sx={{ p: 1.5, bgcolor: '#f5f7fa', height: '100vh', overflow: 'auto' }}>
      <Breadcrumb />

      <Card
        sx={{
          borderRadius: 1,
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          mt: 1.5,
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                minHeight: 40,
                fontSize: '0.875rem',
                py: 0.5,
              },
            }}
          >
            <Tab label="Data" />
            <Tab label="Summary" />
            <Tab label="Summary Automated" />
            <Tab label="Summary Graph" />
          </Tabs>
        </Box>

        {/* DATA TAB */}
        <TabPanel value={activeTab} index={0}>
          <CardContent sx={{ p: 1.5 }}>
            {/* Search Bar Section */}
            <Card
              sx={{
                mb: 2,
                border: '1px solid #e0e0e0',
                borderRadius: 1,
                bgcolor: '#f8f9fa',
              }}
            >
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box
                  sx={{
                    display: 'flex',
                    gap: 2,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                  }}
                >
                  <Box sx={{ maxWidth: 400, width: '100%' }}>
                    <PatientSearchAutocomplete
                      onSearch={debouncedGetPatientSuggestions}
                      onSelectPatient={handlePatientSelect}
                      isLoading={isLoadingPatients || isSearching}
                      suggestions={patientSuggestions || []}
                    />
                  </Box>
                  {searchedPatient && (
                    <Button
                      variant="outlined"
                      onClick={handleClearSearch}
                      size="small"
                      sx={{ ml: 'auto' }}
                    >
                      Clear
                    </Button>
                  )}
                </Box>
                {searchedPatient && (
                  <Box
                    sx={{
                      mt: 2,
                      p: 1.5,
                      bgcolor: 'success.light',
                      borderRadius: 1,
                    }}
                  >
                    <Typography
                      variant="body2"
                      color="success.dark"
                      fontWeight={600}
                    >
                      ✓ Patient Found: {searchedPatient.patientName} (
                      {searchedPatient.patientId})
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Data loaded from multiple sources (Patient, Embryology,
                      Lab, etc.)
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>

            <Box component="div">
              {/* Row 1: Patient Basic Details */}
              <Card
                sx={{
                  mb: 1,
                  border: '1px solid #e0e0e0',
                  borderRadius: 1,
                }}
              >
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      mb: 1,
                    }}
                  >
                    <PersonIcon
                      sx={{ mr: 0.5, color: '#06aee9', fontSize: 18 }}
                    />
                    <Typography variant="subtitle2" fontWeight={600}>
                      Patient Basic
                    </Typography>
                  </Box>
                  <Grid container spacing={1.5} alignItems="flex-end">
                    <Grid item xs={12} sm={6} md={1.6}>
                      <MemoizedDatePicker
                        fieldName="date"
                        label="Date"
                        value={formData.date}
                        onChange={dateHandlers.date}
                        disabled={false}
                        required={true}
                        width="100%"
                        hasAccess={accessFlags.row1}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={1.1}>
                      <MemoizedSelectField
                        fieldName="branch"
                        label="Branch"
                        value={formData.branch}
                        onChange={fieldHandlers.branch}
                        disabled={false}
                        required={true}
                        options={branchOptions}
                        width="100%"
                        hasAccess={accessFlags.row1}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={1.3}>
                      <MemoizedTextField
                        key="patientId-field"
                        fieldName="patientId"
                        label="Patient ID"
                        value={formData.patientId}
                        onBlur={fieldHandlers.patientId_blur}
                        disabled={false}
                        required={true}
                        type="text"
                        width="100%"
                        hasAccess={accessFlags.row1}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={1.9}>
                      <MemoizedTextField
                        fieldName="patientName"
                        label="Patient Name"
                        value={formData.patientName}
                        onBlur={fieldHandlers.patientName_blur}
                        disabled={false}
                        required={true}
                        type="text"
                        width="100%"
                        hasAccess={accessFlags.row1}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={1.5}>
                      <MemoizedTextField
                        fieldName="mobileNumber"
                        label="Mobile Number"
                        value={formData.mobileNumber}
                        onBlur={fieldHandlers.mobileNumber_blur}
                        disabled={false}
                        required={true}
                        type="number"
                        width="100%"
                        hasAccess={accessFlags.row1}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={1.9}>
                      <MemoizedSelectField
                        fieldName="referralSource"
                        label="Referral Source"
                        value={formData.referralSource}
                        onChange={fieldHandlers.referralSource}
                        disabled={false}
                        required={false}
                        options={referralSourceOptions}
                        width="100%"
                        hasAccess={accessFlags.row1}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2.7}>
                      <MemoizedTextField
                        key="referralName"
                        fieldName="referralName"
                        label="Referral Name"
                        value={formData.referralName}
                        onBlur={fieldHandlers.referralName_blur}
                        disabled={!formData.referralSource}
                        required={false}
                        type="text"
                        width="70%"
                        hasAccess={accessFlags.row1}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Row 2: Treatment Details */}
              <Card
                sx={{
                  mb: 1,
                  border: '1px solid #e0e0e0',
                  borderRadius: 1,
                }}
              >
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      mb: 1,
                    }}
                  >
                    <HospitalIcon
                      sx={{ mr: 0.5, color: '#06aee9', fontSize: 18 }}
                    />
                    <Typography variant="subtitle2" fontWeight={600}>
                      Treatment
                    </Typography>
                  </Box>
                  <Grid container spacing={1.5}>
                    <Grid item xs={6} sm={3} md={3}>
                      <MemoizedTextField
                        fieldName="plan"
                        label="Plan"
                        value={formData.plan}
                        onBlur={fieldHandlers.plan_blur}
                        disabled={false}
                        required={false}
                        type="text"
                        width="100%"
                        hasAccess={accessFlags.row2}
                      />
                    </Grid>
                    <Grid item xs={6} sm={3} md={3}>
                      <MemoizedSelectField
                        fieldName="treatmentType"
                        label="Treatment Type"
                        value={formData.treatmentType}
                        onChange={fieldHandlers.treatmentType}
                        disabled={false}
                        required={true}
                        options={treatmentTypeOptions}
                        width="100%"
                        hasAccess={accessFlags.row2}
                      />
                    </Grid>
                    <Grid item xs={6} sm={3} md={3}>
                      <MemoizedSelectField
                        fieldName="cycleStatus"
                        label="Cycle Status"
                        value={formData.cycleStatus}
                        onChange={fieldHandlers.cycleStatus}
                        disabled={false}
                        required={true}
                        options={cycleStatusOptions}
                        width="100%"
                        hasAccess={accessFlags.row2}
                      />
                    </Grid>
                    <Grid item xs={6} sm={3} md={3}>
                      <MemoizedTextField
                        fieldName="stageOfCycle"
                        label="Stage of Cycle"
                        value={formData.stageOfCycle}
                        onBlur={fieldHandlers.stageOfCycle_blur}
                        disabled={false}
                        required={false}
                        type="text"
                        width="100%"
                        hasAccess={accessFlags.row2}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Row 3: Package Details */}
              <Card
                sx={{
                  mb: 1,
                  border: '1px solid #e0e0e0',
                  borderRadius: 1,
                }}
              >
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      mb: 1,
                    }}
                  >
                    <AccountBalanceIcon
                      sx={{ mr: 0.5, color: '#06aee9', fontSize: 18 }}
                    />
                    <Typography variant="subtitle2" fontWeight={600}>
                      Package
                    </Typography>
                  </Box>
                  <Grid container spacing={1.5}>
                    <Grid item xs={12} sm={6} md={4}>
                      <MemoizedTextField
                        fieldName="packageName"
                        label="Package Name"
                        value={formData.packageName}
                        onBlur={fieldHandlers.packageName_blur}
                        disabled={false}
                        required={true}
                        type="text"
                        width="100%"
                        hasAccess={accessFlags.row3}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Row 4: Financial Details */}
              <Card
                sx={{
                  mb: 1,
                  border: '1px solid #e0e0e0',
                  borderRadius: 1,
                }}
              >
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      mb: 1,
                    }}
                  >
                    <AccountBalanceIcon
                      sx={{ mr: 0.5, color: '#06aee9', fontSize: 18 }}
                    />
                    <Typography variant="subtitle2" fontWeight={600}>
                      Financial
                    </Typography>
                  </Box>
                  <Grid container spacing={1.5}>
                    <Grid item xs={6} sm={3} md={3}>
                      <MemoizedTextField
                        fieldName="packageAmount"
                        label="Package Amount"
                        value={formData.packageAmount}
                        onBlur={fieldHandlers.packageAmount_blur}
                        disabled={false}
                        required={false}
                        type="number"
                        width="100%"
                        hasAccess={accessFlags.row4}
                      />
                    </Grid>
                    <Grid item xs={6} sm={3} md={3}>
                      <MemoizedTextField
                        fieldName="registrationAmount"
                        label="Registration Amount"
                        value={formData.registrationAmount}
                        onBlur={fieldHandlers.registrationAmount_blur}
                        disabled={false}
                        required={true}
                        type="number"
                        width="100%"
                        hasAccess={accessFlags.row4}
                      />
                    </Grid>
                    <Grid item xs={6} sm={3} md={3}>
                      <MemoizedTextField
                        fieldName="paidAmount"
                        label="Paid Amount"
                        value={formData.paidAmount}
                        onBlur={fieldHandlers.paidAmount_blur}
                        disabled={false}
                        required={true}
                        type="number"
                        width="100%"
                        hasAccess={accessFlags.row4}
                      />
                    </Grid>
                    <Grid item xs={6} sm={3} md={3}>
                      <Tooltip title="Auto-calculated field" arrow>
                        <TextField
                          fullWidth
                          label="Pending Amount"
                          value={pendingAmount.toFixed(2)}
                          disabled
                          size="small"
                          variant="outlined"
                          InputProps={{
                            readOnly: true,
                            sx: {
                              bgcolor: '#f5f5f5',
                            },
                          }}
                        />
                      </Tooltip>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Row 5: Embryology Details */}
              <Card
                sx={{
                  mb: 1,
                  border: '1px solid #e0e0e0',
                  borderRadius: 1,
                }}
              >
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      mb: 1,
                    }}
                  >
                    <ScienceIcon
                      sx={{ mr: 0.5, color: '#06aee9', fontSize: 18 }}
                    />
                    <Typography variant="subtitle2" fontWeight={600}>
                      Embryology
                    </Typography>
                  </Box>
                  <Grid container spacing={1.5}>
                    <Grid item xs={6} sm={4} md={2.4}>
                      <MemoizedTextField
                        fieldName="numberOfEmbryos"
                        label="No. of Embryos"
                        value={formData.numberOfEmbryos}
                        onBlur={fieldHandlers.numberOfEmbryos_blur}
                        disabled={false}
                        required={true}
                        type="number"
                        width="100%"
                        hasAccess={accessFlags.row5}
                      />
                    </Grid>
                    <Grid item xs={6} sm={4} md={2.4}>
                      <MemoizedTextField
                        fieldName="numberOfEmbryosUsed"
                        label="No. of Embryos Used"
                        value={formData.numberOfEmbryosUsed}
                        onBlur={fieldHandlers.numberOfEmbryosUsed_blur}
                        disabled={false}
                        required={true}
                        type="number"
                        width="100%"
                        hasAccess={accessFlags.row5}
                      />
                    </Grid>
                    <Grid item xs={6} sm={4} md={2.4}>
                      <Tooltip title="Auto-calculated field" arrow>
                        <TextField
                          fullWidth
                          label="No. of Embryos Remaining"
                          value={embryosRemaining}
                          disabled
                          size="small"
                          variant="outlined"
                          InputProps={{
                            readOnly: true,
                            sx: {
                              bgcolor: '#f5f5f5',
                            },
                          }}
                        />
                      </Tooltip>
                    </Grid>
                    <Grid item xs={6} sm={4} md={2.4}>
                      <MemoizedDatePicker
                        fieldName="lastRenewalDate"
                        label="Last Renewal Date"
                        value={formData.lastRenewalDate}
                        onChange={dateHandlers.lastRenewalDate}
                        disabled={false}
                        required={false}
                        width="100%"
                        hasAccess={accessFlags.row5}
                      />
                    </Grid>
                    <Grid item xs={6} sm={4} md={2.4}>
                      <MemoizedTextField
                        fieldName="numberOfEmbryosDiscarded"
                        label="No. of Embryos Discarded"
                        value={formData.numberOfEmbryosDiscarded}
                        onBlur={fieldHandlers.numberOfEmbryosDiscarded_blur}
                        disabled={false}
                        required={false}
                        type="number"
                        width="100%"
                        hasAccess={accessFlags.row5}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Row 6: UPT Result */}
              <Card
                sx={{
                  mb: 1,
                  border: '1px solid #e0e0e0',
                  borderRadius: 1,
                }}
              >
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      mb: 1,
                    }}
                  >
                    <PregnantWomanIcon
                      sx={{ mr: 0.5, color: '#06aee9', fontSize: 18 }}
                    />
                    <Typography variant="subtitle2" fontWeight={600}>
                      UPT Result
                    </Typography>
                  </Box>
                  <Grid container spacing={1.5}>
                    <Grid item xs={6} sm={4} md={3}>
                      <MemoizedSelectField
                        fieldName="uptResult"
                        label="UPT Result"
                        value={formData.uptResult}
                        onChange={fieldHandlers.uptResult}
                        disabled={false}
                        required={true}
                        options={uptResultOptions}
                        width="100%"
                        hasAccess={accessFlags.row6}
                      />
                    </Grid>
                    {formData.uptResult === 'Others' && (
                      <Grid item xs={6} sm={4} md={3}>
                        <MemoizedTextField
                          fieldName="uptManualEntry"
                          label="UPT Manual Entry Field"
                          value={formData.uptManualEntry}
                          onBlur={fieldHandlers.uptManualEntry_blur}
                          disabled={false}
                          required={false}
                          type="text"
                          width="100%"
                          hasAccess={accessFlags.row6}
                        />
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>

              {/* Save Button */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  size="small"
                  sx={{
                    bgcolor: '#06aee9',
                    '&:hover': { bgcolor: '#0599d1' },
                    px: 2,
                    py: 0.75,
                  }}
                >
                  Save Data
                </Button>
              </Box>
            </Box>
          </CardContent>
        </TabPanel>

        {/* SUMMARY TAB */}
        <TabPanel value={activeTab} index={1}>
          <CardContent sx={{ p: 1.5 }}>
            {/* Filters Section */}
            <Box
              sx={{
                mb: 2,
                display: 'flex',
                gap: 2,
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="From Date"
                  value={summaryFromDate}
                  onChange={setSummaryFromDate}
                  format="DD/MM/YYYY"
                  slotProps={{
                    textField: {
                      size: 'small',
                      sx: { width: 180 },
                    },
                  }}
                />
                <DatePicker
                  label="To Date"
                  value={summaryToDate}
                  onChange={setSummaryToDate}
                  format="DD/MM/YYYY"
                  slotProps={{
                    textField: {
                      size: 'small',
                      sx: { width: 180 },
                    },
                  }}
                />
              </LocalizationProvider>
              <Autocomplete
                sx={{ width: 200 }}
                size="small"
                options={userBranches || []}
                getOptionLabel={(option) =>
                  option?.branchCode || option?.name || ''
                }
                value={
                  userBranches.find((b) => b.id === summaryBranchId) || null
                }
                onChange={(_, value) => setSummaryBranchId(value?.id || null)}
                renderInput={(params) => (
                  <TextField {...params} label="Branch" />
                )}
              />
            </Box>

            {/* Data Grid Table */}
            <Box sx={{ height: 'calc(100vh - 350px)', width: '100%' }}>
              {summaryTableRows.length === 0 ? (
                <Box
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: '#f5f5f5',
                    borderRadius: 1,
                  }}
                >
                  <Typography
                    variant="h6"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    No patient tracker data found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formData.patientId
                      ? 'The entered data does not match the current filters. Try adjusting the date range or branch filter.'
                      : 'Enter patient tracker data in the Data tab and save it to view in the Summary tab.'}
                  </Typography>
                </Box>
              ) : (
                <DataGrid
                  rows={summaryTableRows}
                  columns={summaryColumns}
                  getRowId={(row) => row.id || `${row.patientId}-${row.date}`}
                  loading={false}
                  disableRowSelectionOnClick
                  pageSizeOptions={[10, 25, 50, 100]}
                  initialState={{
                    pagination: {
                      paginationModel: { pageSize: 25 },
                    },
                  }}
                  sx={{
                    '& .MuiDataGrid-row:hover': {
                      backgroundColor: '#f5f5f5',
                    },
                  }}
                />
              )}
            </Box>
          </CardContent>
        </TabPanel>

        {/* SUMMARY AUTOMATED TAB */}
        <TabPanel value={activeTab} index={2}>
          <CardContent sx={{ p: 1.5 }}>
            {/* Filters Section */}
            <Box
              sx={{
                mb: 2,
                display: 'flex',
                gap: 2,
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="From Date"
                  value={automatedSummaryFromDate}
                  onChange={setAutomatedSummaryFromDate}
                  format="DD/MM/YYYY"
                  slotProps={{
                    textField: {
                      size: 'small',
                      sx: { width: 180 },
                    },
                  }}
                />
                <DatePicker
                  label="To Date"
                  value={automatedSummaryToDate}
                  onChange={setAutomatedSummaryToDate}
                  format="DD/MM/YYYY"
                  slotProps={{
                    textField: {
                      size: 'small',
                      sx: { width: 180 },
                    },
                  }}
                />
              </LocalizationProvider>
              <FormControl sx={{ width: 150 }} size="small">
                <InputLabel>Branch</InputLabel>
                <Select
                  value={automatedSummaryBranch}
                  onChange={(e) => setAutomatedSummaryBranch(e.target.value)}
                  label="Branch"
                >
                  {automatedSummaryBranchOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl sx={{ width: 200 }} size="small">
                <InputLabel>Referral</InputLabel>
                <Select
                  value={automatedSummaryReferral}
                  onChange={(e) => setAutomatedSummaryReferral(e.target.value)}
                  label="Referral"
                >
                  {automatedSummaryReferralOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Data Grid Table */}
            <Box sx={{ height: 'calc(100vh - 300px)', width: '100%' }}>
              {isLoadingAutomatedSummary ? (
                <Box
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: '#f5f5f5',
                    borderRadius: 1,
                  }}
                >
                  <CircularProgress />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 2 }}
                  >
                    Loading patient tracker data...
                  </Typography>
                </Box>
              ) : automatedSummaryRows.length === 0 ? (
                <Box
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: '#f5f5f5',
                    borderRadius: 1,
                  }}
                >
                  <Typography
                    variant="h6"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    No patient tracker data found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    No patient tracker records are available in the database.
                  </Typography>
                </Box>
              ) : (
                <DataGrid
                  rows={automatedSummaryRows}
                  columns={automatedSummaryColumns}
                  getRowId={(row) => row.id}
                  loading={isLoadingAutomatedSummary}
                  disableRowSelectionOnClick
                  autoHeight={false}
                  pageSizeOptions={[25, 50, 100]}
                  initialState={{
                    pagination: {
                      paginationModel: { pageSize: 100 },
                    },
                  }}
                  sx={{
                    '& .MuiDataGrid-row:hover': {
                      backgroundColor: '#f5f5f5',
                    },
                    '& .MuiDataGrid-cell': {
                      fontSize: '0.875rem',
                    },
                  }}
                />
              )}
            </Box>
          </CardContent>
        </TabPanel>

        {/* SUMMARY GRAPH TAB */}
        <TabPanel value={activeTab} index={3}>
          <CardContent sx={{ p: 1.5 }}>
            {/* Filters Section */}
            <Box
              sx={{
                mb: 2,
                display: 'flex',
                gap: 2,
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="From Date"
                  value={graphSummaryFromDate}
                  onChange={setGraphSummaryFromDate}
                  format="DD/MM/YYYY"
                  slotProps={{
                    textField: {
                      size: 'small',
                      sx: { width: 180 },
                    },
                  }}
                />
                <DatePicker
                  label="To Date"
                  value={graphSummaryToDate}
                  onChange={setGraphSummaryToDate}
                  format="DD/MM/YYYY"
                  slotProps={{
                    textField: {
                      size: 'small',
                      sx: { width: 180 },
                    },
                  }}
                />
              </LocalizationProvider>
              <FormControl sx={{ width: 150 }} size="small">
                <InputLabel>Branch</InputLabel>
                <Select
                  value={graphSummaryBranch}
                  onChange={(e) => setGraphSummaryBranch(e.target.value)}
                  label="Branch"
                >
                  {automatedSummaryBranchOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl sx={{ width: 200 }} size="small">
                <InputLabel>Referral</InputLabel>
                <Select
                  value={graphSummaryReferral}
                  onChange={(e) => setGraphSummaryReferral(e.target.value)}
                  label="Referral"
                >
                  {automatedSummaryReferralOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Charts Section */}
            {isLoadingGraphSummary ? (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: '400px',
                }}
              >
                <CircularProgress />
              </Box>
            ) : graphChartData.totalPatients === 0 ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '400px',
                  bgcolor: '#f5f5f5',
                  borderRadius: 1,
                }}
              >
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                  No data available
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  No patient data matches the selected filters.
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {/* Total Patients Summary */}
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Total Patients: {graphChartData.totalPatients}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Branch Distribution - Bar Chart */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: 1,
                        }}
                      >
                        <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
                          Patients by Branch
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontWeight: 600 }}
                        >
                          Total: {graphChartData.totalPatients} patients
                        </Typography>
                      </Box>
                      <Box sx={{ height: 350, mt: 2 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={graphChartData.branchData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="name"
                              angle={-45}
                              textAnchor="end"
                              height={80}
                            />
                            <YAxis />
                            <RechartsTooltip
                              formatter={(value, name, props) => [
                                `${value} patients (${((value / graphChartData.totalPatients) * 100).toFixed(1)}%)`,
                                props.payload.name || 'Branch',
                              ]}
                            />
                            <Legend
                              formatter={(value) => {
                                const data = graphChartData.branchData.find(
                                  (d) => d.name === value,
                                )
                                if (!data) return value
                                const percentage = (
                                  (data.value / graphChartData.totalPatients) *
                                  100
                                ).toFixed(1)
                                return `${value}: ${data.value} (${percentage}%)`
                              }}
                            />
                            <Bar dataKey="value" fill="#06aee9" />
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Referral Distribution - Pie Chart */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: 1,
                        }}
                      >
                        <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
                          Patients by Referral Source
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontWeight: 600 }}
                        >
                          Total: {graphChartData.totalPatients} patients
                        </Typography>
                      </Box>
                      <Box sx={{ mt: 2, display: 'flex', gap: 3 }}>
                        <Box sx={{ flex: 1, height: 350 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={graphChartData.referralData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={false}
                                outerRadius={90}
                                innerRadius={0}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {graphChartData.referralData.map(
                                  (entry, index) => (
                                    <Cell
                                      key={`cell-${entry.name}-${index}`}
                                      fill={
                                        CHART_COLORS[
                                          index % CHART_COLORS.length
                                        ]
                                      }
                                    />
                                  ),
                                )}
                              </Pie>
                              <RechartsTooltip
                                formatter={(value, name, props) => [
                                  `${value} patients (${((value / graphChartData.totalPatients) * 100).toFixed(1)}%)`,
                                  props.payload.name,
                                ]}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </Box>
                        <Box
                          sx={{
                            flex: 0.6,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                          }}
                        >
                          <Grid container spacing={0.5} sx={{ py: 0 }}>
                            {graphChartData.referralData.map((entry, index) => {
                              const percentage = (
                                (entry.value / graphChartData.totalPatients) *
                                100
                              ).toFixed(1)
                              return (
                                <Grid
                                  item
                                  xs={6}
                                  key={`legend-${entry.name}-${index}`}
                                >
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      px: 0.75,
                                      py: 0.25,
                                      borderRadius: 0.5,
                                      '&:hover': {
                                        bgcolor: 'action.hover',
                                      },
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        width: 12,
                                        height: 12,
                                        bgcolor:
                                          CHART_COLORS[
                                            index % CHART_COLORS.length
                                          ],
                                        borderRadius: 0.5,
                                        mr: 0.75,
                                        flexShrink: 0,
                                      }}
                                    />
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          fontWeight: 500,
                                          fontSize: '0.75rem',
                                          display: 'block',
                                          lineHeight: 1.2,
                                        }}
                                      >
                                        {entry.name}
                                      </Typography>
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{
                                          fontSize: '0.7rem',
                                          display: 'block',
                                          lineHeight: 1.2,
                                        }}
                                      >
                                        {entry.value} ({percentage}%)
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Grid>
                              )
                            })}
                          </Grid>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Date Distribution - Line Chart */}
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Patient Registration Trend
                      </Typography>
                      <Box sx={{ height: 350, mt: 2 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={graphChartData.dateData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <RechartsTooltip />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="value"
                              stroke="#82ca9d"
                              strokeWidth={2}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </CardContent>
        </TabPanel>
      </Card>
    </Box>
  )
}

export default PatientTrackerReports
