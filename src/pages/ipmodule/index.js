import React, { useEffect, useState, useCallback } from 'react'
import debounce from 'lodash/debounce'
import { useDispatch, useSelector } from 'react-redux'
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Grid,
  Paper,
  IconButton,
  StepButton,
  TextField,
  Autocomplete,
  Tabs,
  Tab,
  CircularProgress,
  Avatar,
  FormHelperText,
} from '@mui/material'
import { DatePicker, TimePicker } from '@mui/x-date-pickers'
import {
  Business as BuildingIcon,
  Apartment as BranchIcon,
  Stairs as FloorIcon,
  DoorFront as RoomIcon,
  SingleBed as BedIcon,
  Close as CloseIcon,
} from '@mui/icons-material'
import {
  getBuildings,
  getFloors,
  getRooms,
  getBeds,
  getActiveIP,
  getClosedIP,
  getAllPatients,
  createIPRegistration,
} from '../../constants/apis'
import Modal from '@/components/Modal'
import { closeModal, openModal } from '@/redux/modalSlice'
import { useRouter } from 'next/router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import FilteredDataGrid from '@/components/FilteredDataGrid'

const steps = ['Patient Details', 'Building', 'Floor', 'Room', 'Bed']

function IPModule() {
  const dropdowns = useSelector((store) => store.dropdowns)
  const { branches, otProcedureList } = dropdowns
  const dispatch = useDispatch()
  const router = useRouter()
  const queryClient = useQueryClient()
  const user = useSelector((store) => store.user)

  const [activeStep, setActiveStep] = useState(0)
  const [activeTab, setActiveTab] = useState(0)

  // Form states
  const [selectedBranch, setSelectedBranch] = useState(branches[0]?.id || '')
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [selectedProcedure, setSelectedProcedure] = useState(null)
  const [dateOfAdmission, setDateOfAdmission] = useState(null)
  const [timeOfAdmission, setTimeOfAdmission] = useState(null)
  const [dateOfDischarge, setDateOfDischarge] = useState(null)
  const [packageAmount, setPackageAmount] = useState('')
  const [patients, setPatients] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [errors, setErrors] = useState({})

  const validateStep = (step) => {
    const newErrors = {}
    switch (step) {
      case 0:
        if (!selectedPatient) newErrors.patient = 'Patient is required'
        if (!selectedProcedure) newErrors.procedure = 'Procedure is required'
        if (!dateOfAdmission)
          newErrors.dateOfAdmission = 'Admission date is required'
        if (!timeOfAdmission)
          newErrors.timeOfAdmission = 'Admission time is required'
        break
      case 1:
        if (!selectedBuilding) newErrors.building = 'Building is required'
        break
      case 2:
        if (!selectedFloor) newErrors.floor = 'Floor is required'
        break
      case 3:
        if (!selectedRoom) newErrors.room = 'Room is required'
        break
      case 4:
        if (!selectedBed) newErrors.bed = 'Bed is required'
        break
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNextStep = () => {
    if (validateStep(activeStep)) {
      handleNext()
    }
  }

  const getPayload = () => {
    return {
      branchId: selectedBranch,
      patientId: selectedPatient,
      procedureId: selectedProcedure,
      dateOfAdmission: dateOfAdmission.format('YYYY-MM-DD'),
      timeOfAdmission: timeOfAdmission.format('HH:mm:00'),
      buildingId: selectedBuilding,
      floorId: selectedFloor,
      roomId: selectedRoom,
      bedId: selectedBed,
      ...(packageAmount && { packageAmount }),
      ...(dateOfDischarge && {
        dateOfDischarge: dateOfDischarge.format('YYYY-MM-DD'),
      }),
    }
  }

  const searchPatients = useCallback(
    debounce(async (searchValue) => {
      if (!searchValue) {
        setPatients([])
        setIsSearching(false)
        return
      }
      try {
        const response = await getAllPatients(user.accessToken, searchValue)
        console.log(response)
        if (response.status === 200) {
          setPatients(response.data)
        }
      } catch (error) {
        console.error('Error searching patients:', error)
      }
      setIsSearching(false)
    }, 500),
    [user.accessToken],
  )

  // Bed booking states
  const [selectedBuilding, setSelectedBuilding] = useState('')
  const [selectedFloor, setSelectedFloor] = useState('')
  const [selectedRoom, setSelectedRoom] = useState('')
  const [selectedBed, setSelectedBed] = useState('')
  const [buildings, setBuildings] = useState([])
  const [floors, setFloors] = useState([])
  const [rooms, setRooms] = useState([])
  const [beds, setBeds] = useState([])

  // Fetch data using react-query
  const { data: activeIPData } = useQuery({
    queryKey: ['activeIP', selectedBranch],
    queryFn: () => getActiveIP(user.accessToken, selectedBranch),
    enabled: !!selectedBranch,
  })

  const { data: closedIPData } = useQuery({
    queryKey: ['closedIP', selectedBranch],
    queryFn: () => getClosedIP(user.accessToken, selectedBranch),
    enabled: !!selectedBranch,
  })

  useEffect(() => {
    const branch = router.query.branch
    if (branch) {
      setSelectedBranch(branch)
    } else {
      setSelectedBranch(branches[0]?.id)
      router.push(`/ipmodule?branch=${branches[0]?.id}`)
    }
  }, [])

  useEffect(() => {
    if (selectedBranch && activeStep === 1) {
      getBuildings(user.accessToken, selectedBranch)
        .then((response) => {
          if (response.status === 200) {
            setBuildings(response.data)
          }
        })
        .catch((error) => {
          console.error('Error fetching buildings:', error)
        })
    }
  }, [selectedBranch, activeStep])

  const handleOpen = () => {
    dispatch(openModal('ipmodule'))
  }

  const handleClose = () => {
    dispatch(closeModal('ipmodule'))
    setActiveStep(0)
    resetSelections()
  }

  const resetSelections = () => {
    setSelectedBuilding('')
    setSelectedFloor('')
    setSelectedRoom('')
    setSelectedBed('')
    setBuildings([])
    setFloors([])
    setRooms([])
    setBeds([])
    setSelectedPatient('')
    setSelectedProcedure('')
    setDateOfAdmission(null)
    setTimeOfAdmission(null)
    setDateOfDischarge(null)
    setPackageAmount('')
    setPatients([])
    setIsSearching(false)
    setSearchQuery('')
    setErrors({})
  }

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1)
  }

  const handleStepClick = (step) => {
    if (step < activeStep) {
      // Clean up states after the selected step
      if (step < 4) setSelectedBed('')
      if (step < 3) {
        setSelectedRoom('')
        setBeds([])
      }
      if (step < 2) {
        setSelectedFloor('')
        setRooms([])
      }
      if (step < 1) {
        setSelectedBuilding('')
        setFloors([])
      }
      if (step < 0) {
        // setSelectedBranch('')
        setBuildings([])
      }
      setActiveStep(step)
    }
  }

  const handleBack = () => {
    handleStepClick(activeStep - 1)
  }

  const handleBuildingChange = async (event) => {
    const buildingId = event.target.value
    setSelectedBuilding(buildingId)
    try {
      const response = await getFloors(user.accessToken, buildingId)
      if (response.status === 200) {
        setFloors(response.data)
        // handleNext()
      }
    } catch (error) {
      console.error('Error fetching floors:', error)
    }
  }

  const handleFloorChange = async (event) => {
    const floorId = event.target.value
    setSelectedFloor(floorId)
    try {
      const response = await getRooms(user.accessToken, floorId)
      if (response.status === 200) {
        setRooms(response.data)
        // handleNext()
      }
    } catch (error) {
      console.error('Error fetching rooms:', error)
    }
  }

  const handleRoomChange = async (event) => {
    const roomId = event.target.value
    setSelectedRoom(roomId)
    try {
      const response = await getBeds(user.accessToken, roomId)
      if (response.status === 200) {
        setBeds(response.data)
        // handleNext()
      }
    } catch (error) {
      console.error('Error fetching beds:', error)
    }
  }

  const handleBedChange = (event) => {
    setSelectedBed(event.target.value)
  }
  const createIPMutation = useMutation({
    mutationFn: (payload) => createIPRegistration(user.accessToken, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeIP', selectedBranch] })
      queryClient.invalidateQueries({ queryKey: ['closedIP', selectedBranch] })
      handleClose()
    },
    onError: (error) => {
      console.error('Error creating IP registration:', error)
    },
  })
  const handleBookBed = async () => {
    if (validateStep(activeStep)) {
      const payload = getPayload()
      console.log('Booking bed with payload:', payload)
      const response = await createIPMutation.mutateAsync(payload)
      console.log('Response:', response)
      // handleClose()
    }
  }

  const handleBranchChange = (e) => {
    setSelectedBranch(e.target.value)
    router.push(`/ipmodule?branch=${e.target.value}`)
  }

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
  }

  const columns = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'patientId', headerName: 'Patient ID', width: 130 },
    { field: 'visitId', headerName: 'Visit ID', width: 130 },
    { field: 'roomCode', headerName: 'Room', width: 130 },
    {
      field: 'dateOfAdmission',
      headerName: 'Admission Date',
      width: 180,
      // valueFormatter: (params) => {
      //     return new Date(params.value).toLocaleDateString()
      // }
    },
    {
      field: 'timeOfAdmission',
      headerName: 'Admission Time',
      width: 180,
      // valueFormatter: (params) => {
      //     return new Date(`2000-01-01T${params.value}`).toLocaleTimeString()
      // }
    },
    {
      field: 'dateOfDischarge',
      headerName: 'Discharge Date',
      width: 180,
      // valueFormatter: (params) => {
      //     return params.value ? new Date(params.value).toLocaleDateString() : '-'
      // }
    },
    {
      field: 'packageAmount',
      headerName: 'Package Amount',
      width: 150,
      // valueFormatter: (params) => {
      //     return params.value ? `₹${params.value}` : '-'
      // }
    },
  ]

  const getStepContent = (step) => {
    const renderNextButton = (disabled = false) => (
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          onClick={handleNextStep}
          disabled={disabled}
        >
          Next
        </Button>
      </Box>
    )

    switch (step) {
      case 0:
        return (
          <>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  fullWidth
                  options={patients || []}
                  getOptionLabel={(option) =>
                    `${option.Name} (ID: ${option.patientId})`
                  }
                  onChange={(event, newValue) => {
                    setSelectedPatient(newValue?.id || null)
                    setErrors({ ...errors, patient: null })
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Search Patient"
                      error={!!errors.patient}
                      helperText={errors.patient}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        if (e.target.value.trim()) {
                          setIsSearching(true)
                          searchPatients(e.target.value)
                        }
                      }}
                    />
                  )}
                  renderOption={(props, option) => (
                    <li {...props} className="p-2">
                      <div className="flex items-center gap-3">
                        {option.photoPath ? (
                          <img
                            src={option.photoPath}
                            alt={option.Name}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <Avatar>{option.Name?.[0]}</Avatar>
                        )}
                        <div className="flex flex-col">
                          <span className="font-medium">{option.Name}</span>
                          <span className="text-sm text-gray-500">
                            ID: {option.patientId} | {option.mobileNo}
                          </span>
                        </div>
                      </div>
                    </li>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!errors.procedure}>
                  <InputLabel>Procedure</InputLabel>
                  <Select
                    value={selectedProcedure}
                    onChange={(e) => {
                      setSelectedProcedure(e.target.value)
                      setErrors({ ...errors, procedure: null })
                    }}
                    label="Procedure"
                    required
                  >
                    {otProcedureList?.map((procedure) => (
                      <MenuItem key={procedure.id} value={procedure.id}>
                        {procedure.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.procedure && (
                    <FormHelperText>{errors.procedure}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Date of Admission"
                  value={dateOfAdmission}
                  format="DD/MM/YYYY"
                  onChange={(newValue) => {
                    setDateOfAdmission(newValue)
                    setErrors({ ...errors, dateOfAdmission: null })
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      required
                      error={!!errors.dateOfAdmission}
                      helperText={errors.dateOfAdmission}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TimePicker
                  label="Time of Admission"
                  value={timeOfAdmission}
                  ampm={false}
                  onChange={(newValue) => {
                    setTimeOfAdmission(newValue)
                    setErrors({ ...errors, timeOfAdmission: null })
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      required
                      error={!!errors.timeOfAdmission}
                      helperText={errors.timeOfAdmission}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Date of Discharge"
                  value={dateOfDischarge}
                  format="DD/MM/YYYY"
                  onChange={(newValue) => setDateOfDischarge(newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Package Amount"
                  type="number"
                  value={packageAmount}
                  onChange={(e) => setPackageAmount(e.target.value)}
                  InputProps={{
                    startAdornment: <span>₹</span>,
                  }}
                />
              </Grid>
            </Grid>
            {renderNextButton()}
          </>
        )
      case 1:
        return (
          <>
            <Grid container spacing={2} justifyContent="center">
              {buildings.map((building) => (
                <Grid item key={building.id}>
                  <SelectionTile
                    icon={<BuildingIcon sx={{ fontSize: 40 }} />}
                    label={building.name}
                    selected={selectedBuilding === building.id}
                    onClick={() => {
                      handleBuildingChange({ target: { value: building.id } })
                      setErrors({ ...errors, building: null })
                    }}
                  />
                </Grid>
              ))}
            </Grid>
            {errors.building && (
              <Typography color="error" sx={{ mt: 2, textAlign: 'center' }}>
                {errors.building}
              </Typography>
            )}
            {renderNextButton(!selectedBuilding)}
          </>
        )
      case 2:
        return (
          <>
            <Grid container spacing={2} justifyContent="center">
              {floors.map((floor) => (
                <Grid item key={floor.id}>
                  <SelectionTile
                    icon={<FloorIcon sx={{ fontSize: 40 }} />}
                    label={floor.name}
                    selected={selectedFloor === floor.id}
                    onClick={() => {
                      handleFloorChange({ target: { value: floor.id } })
                      setErrors({ ...errors, floor: null })
                    }}
                  />
                </Grid>
              ))}
            </Grid>
            {errors.floor && (
              <Typography color="error" sx={{ mt: 2, textAlign: 'center' }}>
                {errors.floor}
              </Typography>
            )}
            {renderNextButton(!selectedFloor)}
          </>
        )
      case 3:
        return (
          <>
            <Grid container spacing={2} justifyContent="center">
              {rooms.map((room) => (
                <Grid item key={room.id}>
                  <SelectionTile
                    icon={<RoomIcon sx={{ fontSize: 40 }} />}
                    label={`${room.name} (${room.type})`}
                    selected={selectedRoom === room.id}
                    onClick={() => {
                      handleRoomChange({ target: { value: room.id } })
                      setErrors({ ...errors, room: null })
                    }}
                  />
                </Grid>
              ))}
            </Grid>
            {errors.room && (
              <Typography color="error" sx={{ mt: 2, textAlign: 'center' }}>
                {errors.room}
              </Typography>
            )}
            {renderNextButton(!selectedRoom)}
          </>
        )
      case 4:
        return (
          <>
            <Grid container spacing={2} justifyContent="center">
              {beds.map((bed) => (
                <Grid item key={bed.id}>
                  <SelectionTile
                    icon={<BedIcon sx={{ fontSize: 40 }} />}
                    label={`${bed.name} (₹${bed.charge})`}
                    selected={selectedBed === bed.id}
                    onClick={() => {
                      handleBedChange({ target: { value: bed.id } })
                      setErrors({ ...errors, bed: null })
                    }}
                    disabled={bed.isBooked}
                  />
                </Grid>
              ))}
            </Grid>
            {errors.bed && (
              <Typography color="error" sx={{ mt: 2, textAlign: 'center' }}>
                {errors.bed}
              </Typography>
            )}
          </>
        )
      default:
        return null
    }
  }

  const SelectionTile = ({ icon, label, selected, onClick, disabled }) => (
    <Paper
      elevation={selected ? 4 : 1}
      sx={{
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'pointer',
        bgcolor: selected ? 'primary.main' : 'background.paper',
        color: selected ? 'white' : 'text.primary',
        transition: 'all 0.3s ease',
        minWidth: '120px',
        minHeight: '120px',
        justifyContent: 'center',
        gap: 1,
        opacity: disabled ? 0.5 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
      }}
      onClick={onClick}
    >
      {icon}
      <Typography variant="subtitle1" align="center" sx={{}}>
        {label}
      </Typography>
      {disabled && (
        <Typography variant="subtitle2" align="center" sx={{ color: 'red' }}>
          Booked
        </Typography>
      )}
    </Paper>
  )

  return (
    <div style={{ padding: '20px' }}>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">IP Module</h1>
        <div className="flex items-center gap-4">
          <Button
            variant="contained"
            color="primary"
            onClick={() => router.push('/ipmodule/layouts')}
          >
            Layouts
          </Button>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Branch</InputLabel>
            <Select
              value={selectedBranch}
              onChange={handleBranchChange}
              label="Branch"
            >
              {branches?.map((branch) => (
                <MenuItem key={branch.id} value={branch.id}>
                  {branch.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleOpen}
            disabled={!selectedBranch}
          >
            Create IP
          </Button>
        </div>
      </div>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Active IP" />
          <Tab label="Closed IP" />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <FilteredDataGrid
          rows={activeIPData?.data || []}
          columns={columns}
          getRowId={(row) => row.id}
          className="h-[calc(100vh-250px)]"
        />
      )}

      {activeTab === 1 && (
        <FilteredDataGrid
          rows={closedIPData?.data || []}
          columns={columns}
          getRowId={(row) => row.id}
          className="h-[calc(100vh-250px)]"
        />
      )}

      <Modal uniqueKey="ipmodule" closeOnOutsideClick={false} maxWidth="md">
        <div className="flex justify-between">
          <Typography variant="h6" className="text-gray-800 mb-2">
            Book Bed
          </Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </div>
        <Box sx={{ width: '100%', mt: 2 }}>
          <Stepper
            activeStep={activeStep}
            nonLinear
            sx={{
              '& .MuiStepButton-root': {
                cursor: 'pointer',
              },
            }}
          >
            {steps.map((label, index) => {
              const stepProps = {}
              const labelProps = {}
              const completed = index < activeStep
              const selected = index === activeStep
              const clickable = index < activeStep

              return (
                <Step key={label} {...stepProps} completed={completed}>
                  <StepButton
                    onClick={() => clickable && handleStepClick(index)}
                    sx={{
                      cursor: clickable ? 'pointer' : 'default',
                    }}
                  >
                    <StepLabel {...labelProps}>
                      <Box>
                        <Typography
                          variant="body2"
                          color={selected ? 'primary.main' : 'text.primary'}
                        >
                          {label}
                        </Typography>
                      </Box>
                    </StepLabel>
                  </StepButton>
                </Step>
              )
            })}
          </Stepper>
          <Box sx={{ mt: 4, mb: 4, px: 2 }}>{getStepContent(activeStep)}</Box>
        </Box>

        <div className="flex justify-end">
          {/* {activeStep > 0 && (
                        <Button variant="outlined" color="error" onClick={handleBack}>
                            Back
                        </Button>
                    )} */}
          {activeStep === steps.length - 1 ? (
            <Button
              variant="outlined"
              color="primary"
              onClick={handleBookBed}
              disabled={!selectedBed}
            >
              Book Bed
            </Button>
          ) : null}
        </div>
      </Modal>
    </div>
  )
}

export default IPModule
