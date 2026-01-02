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
  Snackbar,
  Alert,
} from '@mui/material'
import { DatePicker, TimePicker } from '@mui/x-date-pickers'
import {
  Business as BuildingIcon,
  Apartment as BranchIcon,
  Stairs as FloorIcon,
  DoorFront as RoomIcon,
  SingleBed as BedIcon,
  Close as CloseIcon,
  Build as MaintenanceIcon,
  Person as PersonIcon,
} from '@mui/icons-material'
import {
  getStates,
  getCities,
  getBranches,
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

const steps = ['Location', 'Bed', 'Patient', 'Confirm']

function IPModule() {
  const dropdowns = useSelector((store) => store.dropdowns)
  const { branches, otProcedureList } = dropdowns
  const dispatch = useDispatch()
  const router = useRouter()
  const queryClient = useQueryClient()
  const user = useSelector((store) => store.user)

  const [activeStep, setActiveStep] = useState(0)
  const [activeTab, setActiveTab] = useState(0)

  // Form states - Hierarchy
  const [selectedStateId, setSelectedStateId] = useState('')
  const [selectedCityId, setSelectedCityId] = useState('')
  const [selectedBranch, setSelectedBranch] = useState('')
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
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  })

  // Hierarchy data
  const [states, setStates] = useState([])
  const [cities, setCities] = useState([])
  const [branchesList, setBranchesList] = useState([])

  const validateStep = (step) => {
    const newErrors = {}
    switch (step) {
      case 0:
        if (!selectedStateId) newErrors.state = 'State is required'
        if (!selectedCityId) newErrors.city = 'City is required'
        if (!selectedBranch) newErrors.branch = 'Branch is required'
        if (!selectedBuilding) newErrors.building = 'Building is required'
        if (!selectedFloor) newErrors.floor = 'Floor is required'
        if (!selectedRoom) newErrors.room = 'Room is required'
        break
      case 1:
        if (!selectedBed) newErrors.bed = 'Bed is required'
        break
      case 2:
        if (!selectedPatient) newErrors.patient = 'Patient is required'
        if (!selectedProcedure) newErrors.procedure = 'Procedure is required'
        if (!dateOfAdmission)
          newErrors.dateOfAdmission = 'Admission date is required'
        if (!timeOfAdmission)
          newErrors.timeOfAdmission = 'Admission time is required'
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

  // Visual bed selection states - stores all floors with their rooms and beds
  const [floorsWithRoomsAndBeds, setFloorsWithRoomsAndBeds] = useState([])
  const [loadingFloorsData, setLoadingFloorsData] = useState(false)

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

  // Fetch states on mount
  useEffect(() => {
    if (user.accessToken) {
      getStates(user.accessToken)
        .then((response) => {
          const statesData = response?.data || response
          if (Array.isArray(statesData)) {
            setStates(statesData)
          }
        })
        .catch((error) => {
          console.error('Error fetching states:', error)
        })
    }
  }, [user.accessToken])

  // Fetch cities when state is selected
  useEffect(() => {
    if (user.accessToken && selectedStateId) {
      getCities(user.accessToken, selectedStateId)
        .then((response) => {
          const citiesData = response?.data || response
          if (Array.isArray(citiesData)) {
            setCities(citiesData)
          }
        })
        .catch((error) => {
          console.error('Error fetching cities:', error)
        })
    } else {
      setCities([])
      setSelectedCityId('')
    }
  }, [user.accessToken, selectedStateId])

  // Fetch branches when city is selected
  useEffect(() => {
    if (user.accessToken && selectedCityId) {
      getBranches(user.accessToken, selectedCityId)
        .then((response) => {
          const branchesData = response?.data || response
          if (Array.isArray(branchesData)) {
            setBranchesList(branchesData)
          }
        })
        .catch((error) => {
          console.error('Error fetching branches:', error)
        })
    } else {
      setBranchesList([])
      setSelectedBranch('')
    }
  }, [user.accessToken, selectedCityId])

  // Load buildings when branch is selected and user is on Location step
  useEffect(() => {
    if (selectedBranch && activeStep === 0 && user.accessToken) {
      getBuildings(user.accessToken, selectedBranch)
        .then((response) => {
          const buildingsData = response?.data || response
          if (Array.isArray(buildingsData)) {
            setBuildings(buildingsData)
          }
        })
        .catch((error) => {
          console.error('Error fetching buildings:', error)
        })
    }
  }, [selectedBranch, activeStep, user.accessToken])

  const handleOpen = () => {
    dispatch(openModal('ipmodule'))
  }

  const handleClose = () => {
    dispatch(closeModal('ipmodule'))
    setActiveStep(0)
    resetSelections()
  }

  const resetSelections = () => {
    setSelectedStateId('')
    setSelectedCityId('')
    setSelectedBranch('')
    setSelectedBuilding('')
    setSelectedFloor('')
    setSelectedRoom('')
    setSelectedBed('')
    setStates([])
    setCities([])
    setBranchesList([])
    setBuildings([])
    setFloors([])
    setRooms([])
    setBeds([])
    setFloorsWithRoomsAndBeds([])
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
        setSelectedStateId('')
        setSelectedCityId('')
        setSelectedBranch('')
        setBuildings([])
      }
      setActiveStep(step)
    }
  }

  const handleBack = () => {
    handleStepClick(activeStep - 1)
  }

  // Fetch all floors with rooms and beds for visual interface
  const fetchFloorsWithRoomsAndBeds = async (buildingId) => {
    if (!buildingId || !user.accessToken) return

    setLoadingFloorsData(true)
    try {
      // Fetch all floors
      const floorsResponse = await getFloors(user.accessToken, buildingId)
      const floorsData = floorsResponse?.data || floorsResponse

      if (!Array.isArray(floorsData)) {
        setFloorsWithRoomsAndBeds([])
        setLoadingFloorsData(false)
        return
      }

      // For each floor, fetch all rooms
      const floorsWithRooms = await Promise.all(
        floorsData.map(async (floor) => {
          try {
            const roomsResponse = await getRooms(user.accessToken, floor.id)
            const roomsData = roomsResponse?.data || roomsResponse

            if (!Array.isArray(roomsData)) {
              return { ...floor, rooms: [] }
            }

            // For each room, fetch all beds
            const roomsWithBeds = await Promise.all(
              roomsData.map(async (room) => {
                try {
                  const bedsResponse = await getBeds(user.accessToken, room.id)
                  const bedsData = bedsResponse?.data || bedsResponse
                  return {
                    ...room,
                    beds: Array.isArray(bedsData) ? bedsData : [],
                  }
                } catch (error) {
                  console.error(
                    `Error fetching beds for room ${room.id}:`,
                    error,
                  )
                  return { ...room, beds: [] }
                }
              }),
            )

            return { ...floor, rooms: roomsWithBeds }
          } catch (error) {
            console.error(`Error fetching rooms for floor ${floor.id}:`, error)
            return { ...floor, rooms: [] }
          }
        }),
      )

      setFloorsWithRoomsAndBeds(floorsWithRooms)
    } catch (error) {
      console.error('Error fetching floors with rooms and beds:', error)
      setFloorsWithRoomsAndBeds([])
    } finally {
      setLoadingFloorsData(false)
    }
  }

  const handleBuildingChange = async (event) => {
    const buildingId = event.target.value
    setSelectedBuilding(buildingId)
    setSelectedFloor('')
    setSelectedRoom('')
    setSelectedBed('')
    setFloors([])
    setRooms([])
    setBeds([])
    setFloorsWithRoomsAndBeds([])
    try {
      const response = await getFloors(user.accessToken, buildingId)
      const floorsData = response?.data || response
      if (Array.isArray(floorsData)) {
        setFloors(floorsData)
      }
      // Also fetch all data for visual interface
      await fetchFloorsWithRoomsAndBeds(buildingId)
    } catch (error) {
      console.error('Error fetching floors:', error)
    }
  }

  const handleFloorChange = async (event) => {
    const floorId = event.target.value
    setSelectedFloor(floorId)
    setSelectedRoom('')
    setSelectedBed('')
    setRooms([])
    setBeds([])
    try {
      const response = await getRooms(user.accessToken, floorId)
      const roomsData = response?.data || response
      if (Array.isArray(roomsData)) {
        setRooms(roomsData)
      }
    } catch (error) {
      console.error('Error fetching rooms:', error)
    }
  }

  const handleRoomChange = async (event) => {
    const roomId = event.target.value
    setSelectedRoom(roomId)
    setSelectedBed('')
    setBeds([])
    try {
      const response = await getBeds(user.accessToken, roomId)
      const bedsData = response?.data || response
      if (Array.isArray(bedsData)) {
        // Filter only available beds
        const availableBeds = bedsData.filter(
          (bed) => bed.status === 'Available' && bed.isActive !== false,
        )
        setBeds(availableBeds)
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
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['activeIP', selectedBranch] })
      queryClient.invalidateQueries({ queryKey: ['closedIP', selectedBranch] })
      setSnackbar({
        open: true,
        message: response?.message || 'IP admission created successfully',
        severity: 'success',
      })
      handleClose()
    },
    onError: (error) => {
      console.error('Error creating IP registration:', error)
      setSnackbar({
        open: true,
        message:
          error?.message ||
          error?.response?.data?.message ||
          'Failed to create IP admission',
        severity: 'error',
      })
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

  const handleStateChange = (e) => {
    const stateId = e.target.value
    setSelectedStateId(stateId)
    setSelectedCityId('')
    setSelectedBranch('')
    setSelectedBuilding('')
    setSelectedFloor('')
    setSelectedRoom('')
    setSelectedBed('')
    setBuildings([])
    setFloors([])
    setRooms([])
    setBeds([])
    setErrors({ ...errors, state: null })
  }

  const handleCityChange = (e) => {
    const cityId = e.target.value
    setSelectedCityId(cityId)
    setSelectedBranch('')
    setSelectedBuilding('')
    setSelectedFloor('')
    setSelectedRoom('')
    setSelectedBed('')
    setBuildings([])
    setFloors([])
    setRooms([])
    setBeds([])
    setErrors({ ...errors, city: null })
  }

  const handleBranchChange = (e) => {
    const branchId = e.target.value
    setSelectedBranch(branchId)
    setSelectedBuilding('')
    setSelectedFloor('')
    setSelectedRoom('')
    setSelectedBed('')
    setBuildings([])
    setFloors([])
    setRooms([])
    setBeds([])
    router.push(`/ipmodule?branch=${branchId}`)
    setErrors({ ...errors, branch: null })
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
      // Step 0: Location (Building, Floor, Room) - Visual Bed Selection
      case 0:
        const getBedStatusColor = (bed) => {
          if (selectedBed === bed.id) return '#2196F3' // Blue - Selected
          if (bed.status === 'Available' && bed.isActive) return '#4CAF50' // Green - Available
          if (bed.status === 'Occupied' || bed.isBooked) return '#9E9E9E' // Grey - Occupied
          if (bed.status === 'Maintenance') return '#FF9800' // Orange - Maintenance
          return '#E0E0E0' // Default grey
        }

        const getBedStatusTextColor = (bed) => {
          if (selectedBed === bed.id) return '#FFFFFF' // White text for selected
          if (bed.status === 'Available' && bed.isActive) return '#FFFFFF' // White text for available
          return '#000000' // Black text for others
        }

        const handleBedClick = (bed, room, floor) => {
          if (bed.status === 'Available' && bed.isActive && !bed.isBooked) {
            setSelectedBed(bed.id)
            setSelectedRoom(room.id)
            setSelectedFloor(floor.id)
            setSelectedBuilding(selectedBuilding) // Keep current building
            setErrors({ ...errors, bed: null, room: null, floor: null })
          }
        }

        return (
          <>
            <Grid container spacing={3}>
              {/* State, City, Branch Selection */}
              <Grid item xs={12} md={4}>
                <FormControl fullWidth error={!!errors.state}>
                  <InputLabel>State *</InputLabel>
                  <Select
                    value={selectedStateId}
                    onChange={handleStateChange}
                    label="State *"
                  >
                    {states.map((state) => (
                      <MenuItem key={state.id} value={state.id}>
                        {state.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.state && (
                    <FormHelperText>{errors.state}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl
                  fullWidth
                  error={!!errors.city}
                  disabled={!selectedStateId}
                >
                  <InputLabel>City *</InputLabel>
                  <Select
                    value={selectedCityId}
                    onChange={handleCityChange}
                    label="City *"
                  >
                    {cities.map((city) => (
                      <MenuItem key={city.id} value={city.id}>
                        {city.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.city && (
                    <FormHelperText>{errors.city}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl
                  fullWidth
                  error={!!errors.branch}
                  disabled={!selectedCityId}
                >
                  <InputLabel>Branch *</InputLabel>
                  <Select
                    value={selectedBranch}
                    onChange={handleBranchChange}
                    label="Branch *"
                  >
                    {branchesList
                      .filter(
                        (branch) =>
                          branch.name !== 'OBH' &&
                          branch.name !== '02' &&
                          branch.name !== 'kmm03' &&
                          branch.name !== 'HYD-KKT',
                      )
                      .map((branch) => (
                        <MenuItem key={branch.id} value={branch.id}>
                          {branch.name}{' '}
                          {branch.branchCode && `(${branch.branchCode})`}
                        </MenuItem>
                      ))}
                  </Select>
                  {errors.branch && (
                    <FormHelperText>{errors.branch}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              {/* Building Selection */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  Select Building *
                </Typography>
                <Grid container spacing={2} justifyContent="flex-start">
                  {buildings.map((building) => (
                    <Grid item key={building.id}>
                      <SelectionTile
                        icon={<BuildingIcon sx={{ fontSize: 40 }} />}
                        label={building.name}
                        selected={selectedBuilding === building.id}
                        onClick={() => {
                          handleBuildingChange({
                            target: { value: building.id },
                          })
                          setErrors({ ...errors, building: null })
                        }}
                        disabled={!selectedBranch}
                      />
                    </Grid>
                  ))}
                </Grid>
                {errors.building && (
                  <Typography color="error" sx={{ mt: 1 }}>
                    {errors.building}
                  </Typography>
                )}
              </Grid>

              {/* Visual Bed Selection Interface */}
              {selectedBuilding && (
                <Grid item xs={12}>
                  {(() => {
                    const currentBranch = branchesList.find(
                      (b) => b.id === selectedBranch,
                    )
                    const currentCity = cities.find(
                      (c) => c.id === selectedCityId,
                    )
                    return (
                      currentBranch && (
                        <Typography
                          variant="h6"
                          sx={{
                            mb: 2,
                            fontWeight: 600,
                            color: 'text.primary',
                          }}
                        >
                          {currentCity?.name && `${currentCity.name} - `}
                          {currentBranch.name}
                        </Typography>
                      )
                    )
                  })()}
                  {loadingFloorsData ? (
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minHeight: '200px',
                      }}
                    >
                      <CircularProgress />
                    </Box>
                  ) : (
                    <Box sx={{ mt: 2 }}>
                      {floorsWithRoomsAndBeds.length === 0 ? (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ textAlign: 'center', py: 4 }}
                        >
                          No floors found. Please select a building.
                        </Typography>
                      ) : (
                        floorsWithRoomsAndBeds.map((floor) => (
                          <Box key={floor.id} sx={{ mb: 4 }}>
                            <Typography
                              variant="h6"
                              sx={{
                                mb: 2,
                                fontWeight: 600,
                                color: 'text.primary',
                                borderBottom: '2px solid',
                                borderColor: 'primary.main',
                                pb: 1,
                              }}
                            >
                              {floor.name}
                            </Typography>
                            <Grid container spacing={2}>
                              {floor.rooms && floor.rooms.length > 0 ? (
                                floor.rooms.map((room) => (
                                  <Grid
                                    item
                                    xs={12}
                                    sm={6}
                                    md={4}
                                    lg={3}
                                    key={room.id}
                                  >
                                    <Paper
                                      elevation={2}
                                      sx={{
                                        p: 2,
                                        bgcolor: 'background.paper',
                                        borderRadius: 2,
                                        border:
                                          selectedRoom === room.id
                                            ? '2px solid #2196F3'
                                            : '1px solid #E0E0E0',
                                      }}
                                    >
                                      <Typography
                                        variant="subtitle1"
                                        sx={{ fontWeight: 600, mb: 1 }}
                                      >
                                        Room {room.name || room.roomNumber}
                                      </Typography>
                                      <Box sx={{ mb: 1 }}>
                                        <Typography
                                          variant="caption"
                                          sx={{
                                            display: 'inline-block',
                                            bgcolor:
                                              room.type === 'AC'
                                                ? '#E3F2FD'
                                                : '#FFF3E0',
                                            color:
                                              room.type === 'AC'
                                                ? '#1976D2'
                                                : '#F57C00',
                                            px: 1,
                                            py: 0.5,
                                            borderRadius: 1,
                                            mr: 1,
                                            fontWeight: 600,
                                          }}
                                        >
                                          {room.type}
                                        </Typography>
                                        {room.roomCategory && (
                                          <Typography
                                            variant="caption"
                                            sx={{
                                              display: 'inline-block',
                                              bgcolor: '#F3E5F5',
                                              color: '#7B1FA2',
                                              px: 1,
                                              py: 0.5,
                                              borderRadius: 1,
                                              fontWeight: 600,
                                            }}
                                          >
                                            {room.roomCategory}
                                          </Typography>
                                        )}
                                      </Box>
                                      <Box
                                        sx={{
                                          mb: 1,
                                          display: 'flex',
                                          flexWrap: 'wrap',
                                          gap: 1,
                                        }}
                                      >
                                        {room.charges > 0 && (
                                          <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: 0.5,
                                            }}
                                          >
                                            {room.type === 'Non-AC' && (
                                              <>Non-AC ₹{room.charges}</>
                                            )}
                                            {room.type === 'AC' && (
                                              <>
                                                ₹{room.charges}
                                                <PersonIcon
                                                  sx={{ fontSize: 14 }}
                                                />
                                              </>
                                            )}
                                            {!room.type && `₹${room.charges}`}
                                          </Typography>
                                        )}
                                        {room.beds &&
                                          room.beds.length > 0 &&
                                          room.beds.some(
                                            (bed) => bed.charge > 0,
                                          ) && (
                                            <Typography
                                              variant="body2"
                                              color="text.secondary"
                                              sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                              }}
                                            >
                                              ₹
                                              {Math.max(
                                                ...room.beds
                                                  .filter(
                                                    (bed) => bed.charge > 0,
                                                  )
                                                  .map((bed) => bed.charge),
                                              )}
                                            </Typography>
                                          )}
                                      </Box>
                                      <Box
                                        sx={{
                                          display: 'flex',
                                          flexWrap: 'wrap',
                                          gap: 1,
                                          mt: 2,
                                        }}
                                      >
                                        {room.beds && room.beds.length > 0 ? (
                                          room.beds.map((bed) => (
                                            <Box
                                              key={bed.id}
                                              onClick={() =>
                                                handleBedClick(bed, room, floor)
                                              }
                                              sx={{
                                                minWidth: '50px',
                                                height: '40px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                borderRadius: 1,
                                                cursor:
                                                  bed.status === 'Available' &&
                                                  bed.isActive &&
                                                  !bed.isBooked
                                                    ? 'pointer'
                                                    : 'not-allowed',
                                                bgcolor: getBedStatusColor(bed),
                                                color:
                                                  getBedStatusTextColor(bed),
                                                border:
                                                  selectedBed === bed.id
                                                    ? '2px solid #1976D2'
                                                    : '1px solid transparent',
                                                transition: 'all 0.2s',
                                                opacity:
                                                  bed.status === 'Available' &&
                                                  bed.isActive &&
                                                  !bed.isBooked
                                                    ? 1
                                                    : 0.7,
                                                '&:hover': {
                                                  transform:
                                                    bed.status ===
                                                      'Available' &&
                                                    bed.isActive &&
                                                    !bed.isBooked
                                                      ? 'scale(1.05)'
                                                      : 'none',
                                                  boxShadow:
                                                    bed.status ===
                                                      'Available' &&
                                                    bed.isActive &&
                                                    !bed.isBooked
                                                      ? 2
                                                      : 0,
                                                },
                                                position: 'relative',
                                              }}
                                            >
                                              {bed.status === 'Maintenance' && (
                                                <MaintenanceIcon
                                                  sx={{
                                                    position: 'absolute',
                                                    top: 2,
                                                    right: 2,
                                                    fontSize: 14,
                                                  }}
                                                />
                                              )}
                                              <Typography
                                                variant="caption"
                                                sx={{
                                                  fontWeight: 600,
                                                  fontSize: '0.75rem',
                                                }}
                                              >
                                                {bed.bedNumber || bed.name}
                                              </Typography>
                                            </Box>
                                          ))
                                        ) : (
                                          <Typography
                                            variant="caption"
                                            color="text.secondary"
                                          >
                                            No beds available
                                          </Typography>
                                        )}
                                      </Box>
                                    </Paper>
                                  </Grid>
                                ))
                              ) : (
                                <Grid item xs={12}>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ textAlign: 'center', py: 2 }}
                                  >
                                    No rooms found on this floor
                                  </Typography>
                                </Grid>
                              )}
                            </Grid>
                          </Box>
                        ))
                      )}
                    </Box>
                  )}

                  {/* Legend */}
                  <Box
                    sx={{
                      mt: 4,
                      pt: 2,
                      borderTop: '1px solid #E0E0E0',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 3,
                      justifyContent: 'center',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          bgcolor: '#4CAF50',
                          borderRadius: 1,
                          border: '1px solid #388E3C',
                        }}
                      />
                      <Typography variant="caption">Available</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          bgcolor: '#2196F3',
                          borderRadius: 1,
                          border: '1px solid #1976D2',
                        }}
                      />
                      <Typography variant="caption">Selected</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          bgcolor: '#9E9E9E',
                          borderRadius: 1,
                          border: '1px solid #616161',
                        }}
                      />
                      <Typography variant="caption">Occupied</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          bgcolor: '#FF9800',
                          borderRadius: 1,
                          border: '1px solid #F57C00',
                          position: 'relative',
                        }}
                      >
                        <MaintenanceIcon
                          sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            fontSize: 14,
                            color: '#FFFFFF',
                          }}
                        />
                      </Box>
                      <Typography variant="caption">Maintenance</Typography>
                    </Box>
                  </Box>
                </Grid>
              )}
            </Grid>
            {renderNextButton(
              !selectedStateId ||
                !selectedCityId ||
                !selectedBranch ||
                !selectedBuilding ||
                !selectedRoom ||
                !selectedBed,
            )}
          </>
        )

      // Step 1: Bed selection
      case 1:
        return (
          <>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  Select Bed *
                </Typography>
                <Grid container spacing={2} justifyContent="flex-start">
                  {beds.map((bed) => (
                    <Grid item key={bed.id}>
                      <SelectionTile
                        icon={<BedIcon sx={{ fontSize: 40 }} />}
                        label={`${bed.bedNumber || bed.name}${bed.charge ? ` - ₹${bed.charge}` : ''}`}
                        selected={selectedBed === bed.id}
                        onClick={() => {
                          handleBedChange({ target: { value: bed.id } })
                          setErrors({ ...errors, bed: null })
                        }}
                        disabled={!selectedRoom || bed.status !== 'Available'}
                      />
                    </Grid>
                  ))}
                </Grid>
                {beds.length === 0 && selectedRoom && (
                  <Typography
                    color="text.secondary"
                    sx={{ mt: 2, textAlign: 'center' }}
                  >
                    No available beds in this room
                  </Typography>
                )}
                {errors.bed && (
                  <Typography color="error" sx={{ mt: 1 }}>
                    {errors.bed}
                  </Typography>
                )}
              </Grid>
            </Grid>
            {renderNextButton(!selectedBed)}
          </>
        )

      // Step 2: Patient & admission details
      case 2:
        return (
          <>
            <Grid container spacing={2} justifyContent="center">
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
                      disabled={!selectedBed}
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
                  disabled={!selectedBed}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl
                  fullWidth
                  error={!!errors.procedure}
                  disabled={!selectedBed}
                >
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
                      disabled={!selectedBed}
                    />
                  )}
                  disabled={!selectedBed}
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
                      disabled={!selectedBed}
                    />
                  )}
                  disabled={!selectedBed}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Date of Discharge"
                  value={dateOfDischarge}
                  format="DD/MM/YYYY"
                  onChange={(newValue) => setDateOfDischarge(newValue)}
                  renderInput={(params) => (
                    <TextField {...params} fullWidth disabled={!selectedBed} />
                  )}
                  disabled={!selectedBed}
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
                  disabled={!selectedBed}
                />
              </Grid>
            </Grid>
            {renderNextButton()}
          </>
        )

      // Step 3: Confirm summary
      case 3: {
        const currentState = states.find(
          (state) => state.id === selectedStateId,
        )
        const currentCity = cities.find((city) => city.id === selectedCityId)
        const currentBranch = branchesList.find(
          (branch) => branch.id === selectedBranch,
        )
        const currentBuilding = buildings.find(
          (building) => building.id === selectedBuilding,
        )
        const currentFloor = floors.find((floor) => floor.id === selectedFloor)
        const currentRoom = rooms.find((room) => room.id === selectedRoom)
        const currentBed = beds.find((bed) => bed.id === selectedBed)

        return (
          <>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Confirm IP Admission Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Location & Bed
                  </Typography>
                  <Typography variant="body2">
                    <strong>State:</strong> {currentState?.name || '-'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>City:</strong> {currentCity?.name || '-'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Branch:</strong> {currentBranch?.name || '-'}{' '}
                    {currentBranch?.branchCode &&
                      `(${currentBranch.branchCode})`}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Building:</strong> {currentBuilding?.name || '-'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Floor:</strong> {currentFloor?.name || '-'}{' '}
                    {currentFloor?.floorType && `(${currentFloor.floorType})`}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Room:</strong>{' '}
                    {currentRoom
                      ? `${currentRoom.name || currentRoom.roomNumber} (${currentRoom.type})`
                      : '-'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Room Category:</strong>{' '}
                    {currentRoom?.roomCategory || '-'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Bed:</strong>{' '}
                    {currentBed?.bedNumber || currentBed?.name || '-'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Bed Type:</strong> {currentBed?.bedType || '-'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Charges / day:</strong>{' '}
                    {currentBed?.charge
                      ? `₹${currentBed.charge}`
                      : currentRoom?.charges
                        ? `₹${currentRoom.charges}`
                        : '-'}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Patient & Admission
                  </Typography>
                  <Typography variant="body2">
                    <strong>Patient ID:</strong> {selectedPatient || '-'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Procedure:</strong>{' '}
                    {
                      otProcedureList?.find((p) => p.id === selectedProcedure)
                        ?.name
                    }
                  </Typography>
                  <Typography variant="body2">
                    <strong>Admission:</strong>{' '}
                    {dateOfAdmission
                      ? dateOfAdmission.format('DD/MM/YYYY')
                      : '-'}
                    {timeOfAdmission
                      ? ` ${timeOfAdmission.format('HH:mm')}`
                      : ''}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Package Amount:</strong>{' '}
                    {packageAmount ? `₹${packageAmount}` : '-'}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </>
        )
      }
      default:
        return null
    }
  }

  const SelectionTile = ({
    icon,
    label,
    selected,
    onClick,
    disabled,
    status,
  }) => {
    let bgColor = 'background.paper'
    let borderColor = 'divider'

    if (selected) {
      // Selected state (blue-ish)
      bgColor = 'info.main'
      borderColor = 'info.dark'
    } else if (status === 'available') {
      // Available bed (green-ish)
      bgColor = 'success.light'
      borderColor = 'success.main'
    } else if (status === 'occupied') {
      // Occupied bed (red-ish)
      bgColor = 'error.light'
      borderColor = 'error.main'
    }

    return (
      <Paper
        elevation={selected ? 4 : 1}
        sx={{
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          bgcolor: bgColor,
          color: selected ? 'white' : 'text.primary',
          border: `1px solid`,
          borderColor,
          transition: 'all 0.3s ease',
          minWidth: '120px',
          minHeight: '120px',
          justifyContent: 'center',
          gap: 1,
          opacity: disabled ? 0.7 : 1,
          pointerEvents: disabled ? 'none' : 'auto',
          '&:hover': {
            transform: disabled ? 'none' : 'scale(1.03)',
            boxShadow: disabled ? 1 : 4,
          },
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
  }

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
              {branches
                ?.filter(
                  (branch) =>
                    branch.name !== 'OBH' &&
                    branch.name !== '02' &&
                    branch.name !== 'kmm03' &&
                    branch.name !== 'HYD-KKT',
                )
                .map((branch) => (
                  <MenuItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          <Button variant="contained" color="primary" onClick={handleOpen}>
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
            Create IP Admission
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
              Confirm IP Admission
            </Button>
          ) : null}
        </div>
      </Modal>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  )
}

export default IPModule
