import React, { useMemo, useState, useEffect } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom'
import HotelIcon from '@mui/icons-material/Hotel'
import LocalHotelIcon from '@mui/icons-material/LocalHotel'
import EngineeringIcon from '@mui/icons-material/Engineering'
import BusinessIcon from '@mui/icons-material/Business'
import ApartmentIcon from '@mui/icons-material/Apartment'
import StairsIcon from '@mui/icons-material/Stairs'
import { styled } from '@mui/material/styles'
import { useSelector } from 'react-redux'
import { useRouter } from 'next/router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Breadcrumb from '@/components/Breadcrumb'
import {
  getStates,
  getCities,
  getBranches,
  getBuildings,
  getFloors,
  getRooms,
  getBeds,
  createState,
  createCity,
  createBranch,
  createBuilding,
  createFloor,
  createRoom,
  createBed,
  createBedsBulk,
  updateState,
  updateCity,
  updateBranch,
  updateBuilding,
  updateFloor,
  updateRoom,
  updateBed,
  deleteFloor,
  deleteRoom,
  deleteBed,
} from '../../constants/apis'

// Styled components
const BedBox = styled(Box)(({ theme, ownerState }) => {
  const statusColors = {
    Available: theme.palette.success.main,
    Occupied: theme.palette.error.main,
    Reserved: theme.palette.warning.main,
    Maintenance: theme.palette.info.main,
  }

  const { status } = ownerState
  const statusColor = statusColors[status] || theme.palette.divider

  return {
    borderRadius: theme.spacing(1),
    padding: theme.spacing(1),
    border: `2px solid ${statusColor}`,
    backgroundColor: `${statusColor}15`,
    color: '#212121', // Dark text color for maximum visibility
    textAlign: 'center',
    cursor: status === 'Maintenance' ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    minHeight: 70,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 0.5,
    position: 'relative',
    '& .bed-name': {
      fontWeight: 600,
      color: '#212121', // Dark color for bed name
      fontSize: '0.875rem',
      lineHeight: 1.2,
    },
    '& .bed-status': {
      color: statusColor, // Use the status color for the status text
      fontSize: '0.75rem',
      fontWeight: 600, // Bolder for better visibility
      textTransform: 'capitalize',
      lineHeight: 1.2,
    },
    '&:hover': {
      backgroundColor: `${statusColor}25`,
      transform: status === 'Maintenance' ? 'none' : 'translateY(-2px)',
      boxShadow: `0 4px 8px ${statusColor}40`,
    },
  }
})

const LayoutsPage = () => {
  const user = useSelector((store) => store.user)
  const router = useRouter()
  const queryClient = useQueryClient()

  // Selection states
  const [selectedStateId, setSelectedStateId] = useState('')
  const [selectedCityId, setSelectedCityId] = useState('')
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const [selectedBuildingId, setSelectedBuildingId] = useState('')
  const [selectedFloorId, setSelectedFloorId] = useState('')
  const [selectedRoomId, setSelectedRoomId] = useState('')

  // View state: 'landing' | 'buildings' | 'floors' | 'rooms' | 'beds'
  const [currentView, setCurrentView] = useState('landing')

  // Modal states
  const [addStateModal, setAddStateModal] = useState(false)
  const [addCityModal, setAddCityModal] = useState(false)
  const [addBranchModal, setAddBranchModal] = useState(false)
  const [manageBuildingsModal, setManageBuildingsModal] = useState(false)
  const [addBuildingModal, setAddBuildingModal] = useState(false)
  const [addFloorModal, setAddFloorModal] = useState(false)
  const [addRoomModal, setAddRoomModal] = useState(false)
  const [addBedModal, setAddBedModal] = useState(false)
  const [addBedsBulkModal, setAddBedsBulkModal] = useState(false)

  // Edit and delete states
  const [editingBuilding, setEditingBuilding] = useState(null)
  const [editingFloor, setEditingFloor] = useState(null)
  const [editingRoom, setEditingRoom] = useState(null)
  const [editingBed, setEditingBed] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    type: '', // 'building', 'floor', 'room', 'bed'
    id: null,
    name: '',
  })

  // Form states
  const [stateForm, setStateForm] = useState({ name: '', isActive: true })
  const [cityForm, setCityForm] = useState({
    name: '',
    stateId: '',
    isActive: true,
  })
  const [branchForm, setBranchForm] = useState({
    name: '',
    cityId: '',
    branchCode: '',
    address: '',
    isActive: true,
  })
  const [buildingForm, setBuildingForm] = useState({
    name: '',
    branchId: '',
    buildingCode: '',
    totalFloors: '',
    isActive: true,
  })
  const [floorForm, setFloorForm] = useState({
    name: '',
    buildingId: '',
    floorNumber: '',
    floorType: 'IP',
    isActive: true,
  })
  const [roomForm, setRoomForm] = useState({
    name: '',
    floorId: '',
    roomNumber: '',
    type: 'AC',
    roomCategory: 'General',
    genderRestriction: 'Any',
    totalBeds: 0,
    charges: 0,
    isActive: true,
  })
  const [bedForm, setBedForm] = useState({
    name: '',
    roomId: '',
    bedNumber: '',
    bedType: 'Normal',
    hasOxygen: false,
    hasVentilator: false,
    charge: 0,
    status: 'Available',
    isActive: true,
  })
  const [bedsBulkForm, setBedsBulkForm] = useState({
    roomId: '',
    bedCount: 1,
    bedPrefix: 'Bed',
    startNumber: 1,
    bedType: 'Normal',
    charge: 0,
  })

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  })

  const [activeTab, setActiveTab] = useState(0)

  // Fetch data
  const { data: statesData } = useQuery({
    queryKey: ['states'],
    queryFn: () => getStates(user.accessToken),
    enabled: !!user.accessToken,
  })

  const { data: citiesData } = useQuery({
    queryKey: ['cities', selectedStateId],
    queryFn: () => getCities(user.accessToken, selectedStateId),
    enabled: !!user.accessToken && !!selectedStateId,
  })

  const { data: branchesData, refetch: refetchBranches } = useQuery({
    queryKey: ['branches', selectedCityId],
    queryFn: () => getBranches(user.accessToken, selectedCityId),
    enabled: !!user.accessToken && !!selectedCityId,
  })

  const { data: buildingsData } = useQuery({
    queryKey: ['buildings', selectedBranchId],
    queryFn: () => getBuildings(user.accessToken, selectedBranchId),
    enabled:
      !!user.accessToken &&
      !!selectedBranchId &&
      (currentView === 'buildings' ||
        currentView === 'floors' ||
        currentView === 'rooms' ||
        currentView === 'beds'),
  })

  const { data: floorsData } = useQuery({
    queryKey: ['floors', selectedBuildingId],
    queryFn: () => getFloors(user.accessToken, selectedBuildingId),
    enabled:
      !!user.accessToken &&
      !!selectedBuildingId &&
      (currentView === 'floors' ||
        currentView === 'rooms' ||
        currentView === 'beds'),
  })

  const { data: roomsData } = useQuery({
    queryKey: ['rooms', selectedFloorId],
    queryFn: () => getRooms(user.accessToken, selectedFloorId),
    enabled:
      !!user.accessToken &&
      !!selectedFloorId &&
      (currentView === 'rooms' || currentView === 'beds'),
  })

  const { data: bedsData } = useQuery({
    queryKey: ['beds', selectedRoomId],
    queryFn: () => getBeds(user.accessToken, selectedRoomId),
    enabled: !!user.accessToken && !!selectedRoomId && currentView === 'beds',
  })

  const states = (statesData?.data || []).filter(
    (state) => state.name?.toLowerCase() !== 'telagana',
  )
  const cities = citiesData?.data || []
  const branches = branchesData?.data || []
  const buildings = buildingsData?.data || []
  const floors = floorsData?.data || []
  const rooms = roomsData?.data || []
  const beds = bedsData?.data || []

  // Mutations
  const createStateMutation = useMutation({
    mutationFn: async (data) => {
      const response = await createState(user.accessToken, data)
      return response
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['states'] })
      setSnackbar({
        open: true,
        message: response.message || 'State created successfully',
        severity: 'success',
      })
      setAddStateModal(false)
      setStateForm({ name: '', isActive: true })
    },
    onError: (error) => {
      console.error('Error creating state:', error)
      setSnackbar({
        open: true,
        message:
          error.message ||
          error.response?.data?.message ||
          'Failed to create state',
        severity: 'error',
      })
    },
  })

  const createCityMutation = useMutation({
    mutationFn: async (data) => {
      const response = await createCity(user.accessToken, data)
      return response
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['cities'] })
      setSnackbar({
        open: true,
        message: response.message || 'City created successfully',
        severity: 'success',
      })
      setAddCityModal(false)
      setCityForm({ name: '', stateId: '', isActive: true })
    },
    onError: (error) => {
      console.error('Error creating city:', error)
      setSnackbar({
        open: true,
        message:
          error.message ||
          error.response?.data?.message ||
          'Failed to create city',
        severity: 'error',
      })
    },
  })

  const createBranchMutation = useMutation({
    mutationFn: async (data) => {
      const response = await createBranch(user.accessToken, data)
      return response
    },
    onSuccess: (response, variables) => {
      // Invalidate and refetch queries for the specific cityId that was used
      queryClient.invalidateQueries({
        queryKey: ['branches', variables.cityId],
      })
      // Also invalidate all branches queries to be safe
      queryClient.invalidateQueries({ queryKey: ['branches'] })
      // Force refetch if cityId matches selectedCityId
      if (variables.cityId === selectedCityId) {
        refetchBranches()
      }
      setSnackbar({
        open: true,
        message: response.message || 'Branch created successfully',
        severity: 'success',
      })
      setAddBranchModal(false)
      setBranchForm({
        name: '',
        cityId: '',
        branchCode: '',
        address: '',
        isActive: true,
      })
    },
    onError: (error) => {
      console.error('Error creating branch:', error)
      setSnackbar({
        open: true,
        message:
          error.message ||
          error.response?.data?.message ||
          'Failed to create branch',
        severity: 'error',
      })
    },
  })

  const createBuildingMutation = useMutation({
    mutationFn: async (data) => {
      const response = await createBuilding(user.accessToken, data)
      return response
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['buildings'] })
      setSnackbar({
        open: true,
        message: response.message || 'Building created successfully',
        severity: 'success',
      })
      setAddBuildingModal(false)
      setBuildingForm({
        name: '',
        branchId: '',
        buildingCode: '',
        totalFloors: '',
        isActive: true,
      })
    },
    onError: (error) => {
      console.error('Error creating building:', error)
      setSnackbar({
        open: true,
        message:
          error.message ||
          error.response?.data?.message ||
          'Failed to create building',
        severity: 'error',
      })
    },
  })

  const createFloorMutation = useMutation({
    mutationFn: async (data) => {
      // Generate floor name automatically from floor number
      const floorName = data.floorNumber ? `Floor ${data.floorNumber}` : 'Floor'
      const payload = {
        ...data,
        name: floorName,
      }
      const response = await createFloor(user.accessToken, payload)
      return response
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['floors'] })
      setSnackbar({
        open: true,
        message: response.message || 'Floor created successfully',
        severity: 'success',
      })
      setAddFloorModal(false)
      setFloorForm({
        name: '',
        buildingId: '',
        floorNumber: '',
        floorType: 'IP',
        isActive: true,
      })
    },
    onError: (error) => {
      console.error('Error creating floor:', error)
      setSnackbar({
        open: true,
        message:
          error.message ||
          error.response?.data?.message ||
          'Failed to create floor',
        severity: 'error',
      })
    },
  })

  const createRoomMutation = useMutation({
    mutationFn: async (data) => {
      // Generate room name automatically from room number
      const roomName = data.roomNumber ? `Room ${data.roomNumber}` : 'Room'
      const payload = {
        ...data,
        name: roomName,
      }
      const response = await createRoom(user.accessToken, payload)

      // Auto-create beds if totalBeds > 0
      const roomData = response?.data || response
      if (roomData?.id && data.totalBeds > 0) {
        try {
          const bedsBulkData = {
            roomId: roomData.id,
            bedCount: data.totalBeds,
            bedPrefix: 'Bed',
            startNumber: 1,
            bedType: 'Normal',
            charge: data.charges || 0,
          }
          await createBedsBulk(user.accessToken, bedsBulkData)
        } catch (bedError) {
          console.error('Error auto-creating beds:', bedError)
          // Don't fail the room creation if bed creation fails
        }
      }

      return response
    },
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      queryClient.invalidateQueries({ queryKey: ['beds'] })
      const bedMessage =
        variables.totalBeds > 0
          ? `Room created successfully with ${variables.totalBeds} bed(s)`
          : 'Room created successfully'
      setSnackbar({
        open: true,
        message: response.message || bedMessage,
        severity: 'success',
      })
      setAddRoomModal(false)
      setRoomForm({
        name: '',
        floorId: '',
        roomNumber: '',
        type: 'AC',
        roomCategory: 'General',
        genderRestriction: 'Any',
        totalBeds: 0,
        charges: 0,
        isActive: true,
      })
    },
    onError: (error) => {
      console.error('Error creating room:', error)
      setSnackbar({
        open: true,
        message:
          error.message ||
          error.response?.data?.message ||
          'Failed to create room',
        severity: 'error',
      })
    },
  })

  const createBedMutation = useMutation({
    mutationFn: async (data) => {
      const response = await createBed(user.accessToken, data)
      return response
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['beds'] })
      setSnackbar({
        open: true,
        message: response.message || 'Bed created successfully',
        severity: 'success',
      })
      setAddBedModal(false)
      setBedForm({
        name: '',
        roomId: '',
        bedNumber: '',
        bedType: 'Normal',
        hasOxygen: false,
        hasVentilator: false,
        charge: 0,
        status: 'Available',
        isActive: true,
      })
    },
    onError: (error) => {
      console.error('Error creating bed:', error)
      setSnackbar({
        open: true,
        message:
          error.message ||
          error.response?.data?.message ||
          'Failed to create bed',
        severity: 'error',
      })
    },
  })

  const createBedsBulkMutation = useMutation({
    mutationFn: async (data) => {
      const response = await createBedsBulk(user.accessToken, data)
      return response
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['beds'] })
      setSnackbar({
        open: true,
        message: response.message || 'Beds created successfully',
        severity: 'success',
      })
      setAddBedsBulkModal(false)
      setBedsBulkForm({
        roomId: '',
        bedCount: 1,
        bedPrefix: 'Bed',
        startNumber: 1,
        bedType: 'Normal',
        charge: 0,
      })
    },
    onError: (error) => {
      console.error('Error creating beds:', error)
      setSnackbar({
        open: true,
        message:
          error.message ||
          error.response?.data?.message ||
          'Failed to create beds',
        severity: 'error',
      })
    },
  })

  // Update Mutations
  const updateBuildingMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await updateBuilding(user.accessToken, id, data)
      return response
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['buildings'] })
      setSnackbar({
        open: true,
        message: response.message || 'Building updated successfully',
        severity: 'success',
      })
      setAddBuildingModal(false)
      setEditingBuilding(null)
      setBuildingForm({
        name: '',
        branchId: '',
        buildingCode: '',
        totalFloors: '',
        isActive: true,
      })
    },
    onError: (error) => {
      console.error('Error updating building:', error)
      setSnackbar({
        open: true,
        message:
          error.message ||
          error.response?.data?.message ||
          'Failed to update building',
        severity: 'error',
      })
    },
  })

  const updateFloorMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await updateFloor(user.accessToken, id, data)
      return response
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['floors'] })
      setSnackbar({
        open: true,
        message: response.message || 'Floor updated successfully',
        severity: 'success',
      })
      setAddFloorModal(false)
      setEditingFloor(null)
      setFloorForm({
        name: '',
        buildingId: '',
        floorNumber: '',
        floorType: 'IP',
        isActive: true,
      })
    },
    onError: (error) => {
      console.error('Error updating floor:', error)
      setSnackbar({
        open: true,
        message:
          error.message ||
          error.response?.data?.message ||
          'Failed to update floor',
        severity: 'error',
      })
    },
  })

  const updateRoomMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await updateRoom(user.accessToken, id, data)
      return response
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      setSnackbar({
        open: true,
        message: response.message || 'Room updated successfully',
        severity: 'success',
      })
      setAddRoomModal(false)
      setEditingRoom(null)
      setRoomForm({
        name: '',
        floorId: '',
        roomNumber: '',
        type: 'AC',
        roomCategory: 'General',
        genderRestriction: 'Any',
        totalBeds: 0,
        charges: 0,
        isActive: true,
      })
    },
    onError: (error) => {
      console.error('Error updating room:', error)
      setSnackbar({
        open: true,
        message:
          error.message ||
          error.response?.data?.message ||
          'Failed to update room',
        severity: 'error',
      })
    },
  })

  const updateBedMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await updateBed(user.accessToken, id, data)
      return response
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['beds'] })
      setSnackbar({
        open: true,
        message: response.message || 'Bed updated successfully',
        severity: 'success',
      })
      setAddBedModal(false)
      setEditingBed(null)
      setBedForm({
        name: '',
        roomId: '',
        bedNumber: '',
        bedType: 'Normal',
        hasOxygen: false,
        hasVentilator: false,
        charge: 0,
        status: 'Available',
        isActive: true,
      })
    },
    onError: (error) => {
      console.error('Error updating bed:', error)
      setSnackbar({
        open: true,
        message:
          error.message ||
          error.response?.data?.message ||
          'Failed to update bed',
        severity: 'error',
      })
    },
  })

  // Delete Mutations
  const deleteFloorMutation = useMutation({
    mutationFn: async (id) => {
      const response = await deleteFloor(user.accessToken, id)
      return response
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['floors'] })
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      queryClient.invalidateQueries({ queryKey: ['beds'] })
      setSnackbar({
        open: true,
        message: response.message || 'Floor deleted successfully',
        severity: 'success',
      })
      setDeleteConfirm({ open: false, type: '', id: null, name: '' })
    },
    onError: (error) => {
      console.error('Error deleting floor:', error)
      setSnackbar({
        open: true,
        message:
          error.message ||
          error.response?.data?.message ||
          'Failed to delete floor',
        severity: 'error',
      })
    },
  })

  const deleteRoomMutation = useMutation({
    mutationFn: async (id) => {
      const response = await deleteRoom(user.accessToken, id)
      return response
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      queryClient.invalidateQueries({ queryKey: ['beds'] })
      setSnackbar({
        open: true,
        message: response.message || 'Room deleted successfully',
        severity: 'success',
      })
      setDeleteConfirm({ open: false, type: '', id: null, name: '' })
    },
    onError: (error) => {
      console.error('Error deleting room:', error)
      setSnackbar({
        open: true,
        message:
          error.message ||
          error.response?.data?.message ||
          'Failed to delete room',
        severity: 'error',
      })
    },
  })

  const deleteBedMutation = useMutation({
    mutationFn: async (id) => {
      const response = await deleteBed(user.accessToken, id)
      return response
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['beds'] })
      setSnackbar({
        open: true,
        message: response.message || 'Bed deleted successfully',
        severity: 'success',
      })
      setDeleteConfirm({ open: false, type: '', id: null, name: '' })
    },
    onError: (error) => {
      console.error('Error deleting bed:', error)
      setSnackbar({
        open: true,
        message:
          error.message ||
          error.response?.data?.message ||
          'Failed to delete bed',
        severity: 'error',
      })
    },
  })

  // Handlers
  const handleStateChange = (event) => {
    const value = event.target.value
    setSelectedStateId(value)
    setSelectedCityId('')
    setSelectedBranchId('')
    setSelectedBuildingId('')
    setSelectedFloorId('')
    setSelectedRoomId('')
  }

  const handleCityChange = (event) => {
    const value = event.target.value
    setSelectedCityId(value)
    setSelectedBranchId('')
    setSelectedBuildingId('')
    setSelectedFloorId('')
    setSelectedRoomId('')
  }

  const handleBranchChange = (event) => {
    const value = event.target.value
    setSelectedBranchId(value)
    setSelectedBuildingId('')
    setSelectedFloorId('')
    setSelectedRoomId('')
  }

  const handleBuildingChange = (event) => {
    const value = event.target.value
    setSelectedBuildingId(value)
    setSelectedFloorId('')
    setSelectedRoomId('')
  }

  const handleFloorChange = (event) => {
    const value = event.target.value
    setSelectedFloorId(value)
    setSelectedRoomId('')
  }

  const handleRoomChange = (event) => {
    const value = event.target.value
    setSelectedRoomId(value)
  }

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity })
  }

  const closeSnackbar = (_, reason) => {
    if (reason === 'clickaway') return
    setSnackbar((prev) => ({ ...prev, open: false }))
  }

  // Render functions
  const renderFilters = () => (
    <Card elevation={2} sx={{ borderRadius: 3, mb: 3 }}>
      <CardContent>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="medium">
              <InputLabel>State</InputLabel>
              <Select
                label="State"
                value={selectedStateId}
                onChange={handleStateChange}
                displayEmpty={!selectedStateId}
                endAdornment={
                  <IconButton
                    size="small"
                    onClick={() => setAddStateModal(true)}
                    sx={{ mr: 1 }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                }
              >
                {states.map((state) => (
                  <MenuItem key={state.id} value={state.id}>
                    {state.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="medium" disabled={!selectedStateId}>
              <InputLabel>City</InputLabel>
              <Select
                label="City"
                value={selectedCityId}
                onChange={handleCityChange}
                displayEmpty={!selectedCityId}
                endAdornment={
                  <IconButton
                    size="small"
                    onClick={() => {
                      setCityForm({ ...cityForm, stateId: selectedStateId })
                      setAddCityModal(true)
                    }}
                    disabled={!selectedStateId}
                    sx={{ mr: 1 }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                }
              >
                {cities.map((city) => (
                  <MenuItem key={city.id} value={city.id}>
                    {city.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="medium" disabled={!selectedCityId}>
              <InputLabel>Branch</InputLabel>
              <Select
                label="Branch"
                value={selectedBranchId}
                onChange={handleBranchChange}
                displayEmpty={!selectedBranchId}
                endAdornment={
                  <IconButton
                    size="small"
                    onClick={() => {
                      setBranchForm({ ...branchForm, cityId: selectedCityId })
                      setAddBranchModal(true)
                    }}
                    disabled={!selectedCityId}
                    sx={{ mr: 1 }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                }
              >
                {branches.map((branch) => (
                  <MenuItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="medium" disabled={!selectedBranchId}>
              <InputLabel>Building</InputLabel>
              <Select
                label="Building"
                value={selectedBuildingId}
                onChange={handleBuildingChange}
                displayEmpty={!selectedBuildingId}
              >
                {buildings.map((building) => (
                  <MenuItem key={building.id} value={building.id}>
                    {building.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <Button
              variant="contained"
              startIcon={<BusinessIcon />}
              onClick={() => {
                setBuildingForm({ ...buildingForm, branchId: selectedBranchId })
                setManageBuildingsModal(true)
              }}
              disabled={!selectedBranchId}
              fullWidth
            >
              Manage Buildings
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )

  const renderLayoutVisualization = () => {
    if (!selectedBuildingId || !selectedFloorId) {
      return (
        <Card
          elevation={0}
          sx={{
            border: (theme) => `1px dashed ${theme.palette.divider}`,
            py: 6,
          }}
        >
          <CardContent>
            <Stack spacing={2} alignItems="center">
              <MeetingRoomIcon color="disabled" sx={{ fontSize: 48 }} />
              <Typography variant="h6" color="text.secondary" align="center">
                Select a building and floor to view the layout.
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      )
    }

    const selectedFloor = floors.find((f) => f.id === selectedFloorId)
    const selectedRooms = rooms.filter((r) => r.floorId === selectedFloorId)

    return (
      <Stack spacing={3}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Box>
            <Typography variant="h5">
              {selectedFloor?.name || 'Floor Layout'}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              Interactive layout with real-time bed status
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<StairsIcon />}
              onClick={() => {
                setFloorForm({ ...floorForm, buildingId: selectedBuildingId })
                setAddFloorModal(true)
              }}
            >
              Add Floor
            </Button>
            <Button
              variant="outlined"
              startIcon={<MeetingRoomIcon />}
              onClick={() => {
                setRoomForm({ ...roomForm, floorId: selectedFloorId })
                setAddRoomModal(true)
              }}
              disabled={!selectedFloorId}
            >
              Add Room
            </Button>
          </Stack>
        </Stack>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
            {floors.map((floor, index) => (
              <Tab
                key={floor.id}
                label={floor.name}
                onClick={() => setSelectedFloorId(floor.id)}
              />
            ))}
          </Tabs>
        </Box>

        <Grid container spacing={3}>
          {selectedRooms.map((room) => {
            const roomBeds = beds.filter((b) => b.roomId === room.id)
            return (
              <Grid item xs={12} md={6} lg={4} key={room.id}>
                <Card
                  elevation={selectedRoomId === room.id ? 6 : 2}
                  sx={{
                    borderRadius: 3,
                    border: (theme) =>
                      selectedRoomId === room.id
                        ? `2px solid ${theme.palette.primary.main}`
                        : `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <CardContent>
                    <Stack spacing={2}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Box>
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 600 }}
                          >
                            {room.name}
                          </Typography>
                          <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                            <Chip label={room.type} size="small" />
                            <Chip
                              label={room.roomCategory}
                              size="small"
                              color="primary"
                            />
                          </Stack>
                        </Box>
                        <Button
                          size="small"
                          onClick={() => {
                            setBedForm({ ...bedForm, roomId: room.id })
                            setAddBedModal(true)
                          }}
                        >
                          Add Bed
                        </Button>
                      </Stack>

                      <Divider />

                      <Box
                        sx={{
                          display: 'grid',
                          gap: 1.5,
                          gridTemplateColumns:
                            'repeat(auto-fill, minmax(96px, 1fr))',
                        }}
                      >
                        {roomBeds.map((bed) => (
                          <Box
                            key={bed.id}
                            sx={{
                              position: 'relative',
                              '&:hover .bed-actions': {
                                opacity: 1,
                                visibility: 'visible',
                              },
                            }}
                          >
                            <Tooltip title={`Status: ${bed.status}`} arrow>
                              <BedBox ownerState={{ status: bed.status }}>
                                <Typography
                                  variant="body2"
                                  className="bed-name"
                                  sx={{
                                    fontWeight: 600,
                                    color: '#212121',
                                    pr: 3, // Add padding to prevent text overlap
                                  }}
                                >
                                  {bed.name}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  className="bed-status"
                                  sx={{
                                    textTransform: 'capitalize',
                                    fontWeight: 600,
                                  }}
                                >
                                  {bed.status}
                                </Typography>
                              </BedBox>
                            </Tooltip>
                            <Stack
                              className="bed-actions"
                              direction="row"
                              spacing={0.5}
                              sx={{
                                position: 'absolute',
                                top: 2,
                                right: 2,
                                opacity: 0,
                                visibility: 'hidden',
                                transition:
                                  'opacity 0.2s ease, visibility 0.2s ease',
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                borderRadius: 1,
                                padding: '2px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                              }}
                            >
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setBedForm({
                                    name: bed.name || '',
                                    roomId: bed.roomId || room.id,
                                    bedNumber: bed.bedNumber || '',
                                    bedType: bed.bedType || 'Normal',
                                    hasOxygen: bed.hasOxygen || false,
                                    hasVentilator: bed.hasVentilator || false,
                                    charge: bed.charge || 0,
                                    status: bed.status || 'Available',
                                    isActive: bed.isActive !== false,
                                  })
                                  setEditingBed(bed.id)
                                  setAddBedModal(true)
                                }}
                                color="primary"
                                sx={{
                                  padding: '4px',
                                  '&:hover': {
                                    backgroundColor: 'rgba(25, 118, 210, 0.1)',
                                  },
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setDeleteConfirm({
                                    open: true,
                                    type: 'bed',
                                    id: bed.id,
                                    name: bed.name || bed.bedNumber || 'Bed',
                                  })
                                }}
                                color="error"
                                sx={{
                                  padding: '4px',
                                  '&:hover': {
                                    backgroundColor: 'rgba(211, 47, 47, 0.1)',
                                  },
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Stack>
                          </Box>
                        ))}
                      </Box>

                      {roomBeds.length === 0 && (
                        <Button
                          fullWidth
                          variant="outlined"
                          onClick={() => {
                            // Calculate next bed number from existing beds
                            const existingRoomBeds = beds.filter(
                              (b) => b.roomId === room.id,
                            )
                            let nextBedNumber = 1

                            if (existingRoomBeds.length > 0) {
                              // Extract numbers from bedNumber or name fields
                              const bedNumbers = existingRoomBeds
                                .map((bed) => {
                                  const bedNum = bed.bedNumber || bed.name || ''
                                  // Extract numeric part from strings like "Bed 1", "1", "Bed-1", etc.
                                  const match = bedNum.toString().match(/\d+/)
                                  return match ? parseInt(match[0]) : 0
                                })
                                .filter((num) => num > 0)

                              if (bedNumbers.length > 0) {
                                nextBedNumber = Math.max(...bedNumbers) + 1
                              }
                            }

                            setBedsBulkForm({
                              ...bedsBulkForm,
                              roomId: room.id,
                              startNumber: nextBedNumber,
                            })
                            setAddBedsBulkModal(true)
                          }}
                        >
                          Add Beds (Bulk)
                        </Button>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            )
          })}
        </Grid>
      </Stack>
    )
  }

  // Modal components would go here - Add State, Add City, Add Branch, etc.
  // Due to length constraints, I'll create a separate file for modals or continue in next part

  // Render Landing Page (State/City/Branch Selection)
  const renderLandingPage = () => {
    const selectedBranch = branches.find((b) => b.id === selectedBranchId)

    return (
      <Card elevation={2} sx={{ borderRadius: 3, p: 4 }}>
        <Stack spacing={4}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="medium">
                <InputLabel>State</InputLabel>
                <Select
                  label="State"
                  value={selectedStateId}
                  onChange={handleStateChange}
                  displayEmpty={!selectedStateId}
                  endAdornment={
                    <IconButton
                      size="small"
                      onClick={() => setAddStateModal(true)}
                      sx={{ mr: 1 }}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  {states.map((state) => (
                    <MenuItem key={state.id} value={state.id}>
                      {state.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="medium" disabled={!selectedStateId}>
                <InputLabel>City</InputLabel>
                <Select
                  label="City"
                  value={selectedCityId}
                  onChange={handleCityChange}
                  displayEmpty={!selectedCityId}
                  endAdornment={
                    <IconButton
                      size="small"
                      onClick={() => {
                        setCityForm({ ...cityForm, stateId: selectedStateId })
                        setAddCityModal(true)
                      }}
                      disabled={!selectedStateId}
                      sx={{ mr: 1 }}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  {cities.map((city) => (
                    <MenuItem key={city.id} value={city.id}>
                      {city.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="medium" disabled={!selectedCityId}>
                <InputLabel>Branch</InputLabel>
                <Select
                  label="Branch"
                  value={selectedBranchId}
                  onChange={handleBranchChange}
                  displayEmpty={!selectedBranchId}
                  endAdornment={
                    <IconButton
                      size="small"
                      onClick={() => {
                        setBranchForm({ ...branchForm, cityId: selectedCityId })
                        setAddBranchModal(true)
                      }}
                      disabled={!selectedCityId}
                      sx={{ mr: 1 }}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  {branches.map((branch) => (
                    <MenuItem key={branch.id} value={branch.id}>
                      {branch.name}{' '}
                      {branch.branchCode && `(${branch.branchCode})`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {selectedBranch && (
            <Box>
              <Button
                variant="contained"
                size="large"
                startIcon={<BusinessIcon />}
                onClick={() => setCurrentView('buildings')}
                disabled={!selectedBranchId}
                sx={{ minWidth: 200 }}
              >
                Manage Layout
              </Button>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Branch: <strong>{selectedBranch.name}</strong>
                {selectedBranch.branchCode && ` (${selectedBranch.branchCode})`}
              </Typography>
            </Box>
          )}
        </Stack>
      </Card>
    )
  }

  // Render Building Management View
  const renderBuildingManagement = () => {
    return (
      <Stack spacing={3}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Box>
            <Button
              variant="text"
              onClick={() => setCurrentView('landing')}
              sx={{ mb: 1 }}
            >
              ← Back to Branch Selection
            </Button>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Building Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {branches.find((b) => b.id === selectedBranchId)?.name ||
                'Branch'}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              const selectedBranch = branches.find(
                (b) => b.id === selectedBranchId,
              )
              setBuildingForm({
                ...buildingForm,
                branchId: selectedBranchId,
                name: selectedBranch?.name || '',
              })
              setAddBuildingModal(true)
            }}
            disabled={!selectedBranchId}
          >
            + Add Building
          </Button>
        </Stack>

        <Grid container spacing={2}>
          {buildings.map((building) => (
            <Grid item xs={12} md={6} lg={4} key={building.id}>
              <Card elevation={2} sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Stack spacing={2}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {building.name}
                        </Typography>
                        {building.buildingCode && (
                          <Typography variant="body2" color="text.secondary">
                            Code: {building.buildingCode}
                          </Typography>
                        )}
                      </Box>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          label={building.isActive ? 'Active' : 'Inactive'}
                          color={building.isActive ? 'success' : 'default'}
                          size="small"
                        />
                        <IconButton
                          size="small"
                          onClick={() => {
                            setBuildingForm({
                              name: building.name,
                              branchId: building.branchId || selectedBranchId,
                              buildingCode: building.buildingCode || '',
                              totalFloors: building.totalFloors || '',
                              isActive: building.isActive !== false,
                            })
                            setEditingBuilding(building.id)
                            setAddBuildingModal(true)
                          }}
                          color="primary"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Stack>
                    {building.totalFloors && (
                      <Typography variant="body2" color="text.secondary">
                        Total Floors: {building.totalFloors}
                      </Typography>
                    )}
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => {
                        setSelectedBuildingId(building.id)
                        setCurrentView('floors')
                      }}
                    >
                      Manage Floors
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
          {buildings.length === 0 && (
            <Grid item xs={12}>
              <Card
                elevation={0}
                sx={{
                  border: (theme) => `1px dashed ${theme.palette.divider}`,
                  py: 4,
                }}
              >
                <CardContent>
                  <Stack spacing={2} alignItems="center">
                    <BusinessIcon color="disabled" sx={{ fontSize: 48 }} />
                    <Typography variant="h6" color="text.secondary">
                      No buildings found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Click "Add Building" to create your first building
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </Stack>
    )
  }

  // Render Floor Management View
  const renderFloorManagement = () => {
    const selectedBuilding = buildings.find((b) => b.id === selectedBuildingId)

    return (
      <Stack spacing={3}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Box>
            <Button
              variant="text"
              onClick={() => {
                setSelectedBuildingId('')
                setCurrentView('buildings')
              }}
              sx={{ mb: 1 }}
            >
              ← Back to Buildings
            </Button>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Floor Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedBuilding?.name || 'Building'}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setFloorForm({ ...floorForm, buildingId: selectedBuildingId })
              setAddFloorModal(true)
            }}
            disabled={!selectedBuildingId}
          >
            + Add Floor
          </Button>
        </Stack>

        <Grid container spacing={2}>
          {floors.map((floor) => (
            <Grid item xs={12} md={6} lg={4} key={floor.id}>
              <Card elevation={2} sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Stack spacing={2}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {floor.name}
                        </Typography>
                        {floor.floorNumber && (
                          <Typography variant="body2" color="text.secondary">
                            Floor #{floor.floorNumber}
                          </Typography>
                        )}
                      </Box>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          label={floor.floorType || 'IP'}
                          color="primary"
                          size="small"
                        />
                        <IconButton
                          size="small"
                          onClick={() => {
                            setFloorForm({
                              name: floor.name || '',
                              buildingId:
                                floor.buildingId || selectedBuildingId,
                              floorNumber: floor.floorNumber || '',
                              floorType: floor.floorType || 'IP',
                              isActive: floor.isActive !== false,
                            })
                            setEditingFloor(floor.id)
                            setAddFloorModal(true)
                          }}
                          color="primary"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setDeleteConfirm({
                              open: true,
                              type: 'floor',
                              id: floor.id,
                              name:
                                floor.name ||
                                `Floor ${floor.floorNumber || ''}`,
                            })
                          }}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Stack>
                    <Chip
                      label={floor.isActive ? 'Active' : 'Inactive'}
                      color={floor.isActive ? 'success' : 'default'}
                      size="small"
                      sx={{ width: 'fit-content' }}
                    />
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => {
                        setSelectedFloorId(floor.id)
                        setCurrentView('rooms')
                      }}
                    >
                      Manage Rooms
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
          {floors.length === 0 && (
            <Grid item xs={12}>
              <Card
                elevation={0}
                sx={{
                  border: (theme) => `1px dashed ${theme.palette.divider}`,
                  py: 4,
                }}
              >
                <CardContent>
                  <Stack spacing={2} alignItems="center">
                    <StairsIcon color="disabled" sx={{ fontSize: 48 }} />
                    <Typography variant="h6" color="text.secondary">
                      No floors found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Click "Add Floor" to create your first floor
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </Stack>
    )
  }

  // Render Room Management View
  const renderRoomManagement = () => {
    const selectedFloor = floors.find((f) => f.id === selectedFloorId)
    const selectedRooms = rooms.filter((r) => r.floorId === selectedFloorId)

    return (
      <Stack spacing={3}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Box>
            <Button
              variant="text"
              onClick={() => {
                setSelectedFloorId('')
                setCurrentView('floors')
              }}
              sx={{ mb: 1 }}
            >
              ← Back to Floors
            </Button>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Room Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedFloor?.name || 'Floor'}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setRoomForm({ ...roomForm, floorId: selectedFloorId })
              setAddRoomModal(true)
            }}
            disabled={!selectedFloorId}
          >
            + Add Room
          </Button>
        </Stack>

        <Grid container spacing={2}>
          {selectedRooms.map((room) => {
            const roomBeds = beds.filter((b) => b.roomId === room.id)
            return (
              <Grid item xs={12} md={6} lg={4} key={room.id}>
                <Card elevation={2} sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Stack spacing={2}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="flex-start"
                      >
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {room.name || room.roomNumber}
                          </Typography>
                          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                            <Chip label={room.type} size="small" />
                            <Chip
                              label={room.roomCategory}
                              size="small"
                              color="primary"
                            />
                          </Stack>
                        </Box>
                        <Stack
                          direction="row"
                          spacing={0.5}
                          alignItems="center"
                        >
                          <Chip
                            label={room.isActive ? 'Active' : 'Inactive'}
                            color={room.isActive ? 'success' : 'default'}
                            size="small"
                          />
                          <IconButton
                            size="small"
                            onClick={() => {
                              setRoomForm({
                                name: room.name || '',
                                floorId: room.floorId || selectedFloorId,
                                roomNumber: room.roomNumber || '',
                                type: room.type || 'AC',
                                roomCategory: room.roomCategory || 'General',
                                genderRestriction:
                                  room.genderRestriction || 'Any',
                                totalBeds: room.totalBeds || 0,
                                charges: room.charges || 0,
                                isActive: room.isActive !== false,
                              })
                              setEditingRoom(room.id)
                              setAddRoomModal(true)
                            }}
                            color="primary"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setDeleteConfirm({
                                open: true,
                                type: 'room',
                                id: room.id,
                                name: room.name || room.roomNumber || 'Room',
                              })
                            }}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </Stack>

                      <Divider />

                      <Stack spacing={1}>
                        <Typography variant="body2" color="text.secondary">
                          Total Beds: {roomBeds.length} / {room.totalBeds || 0}
                        </Typography>
                        {room.charges > 0 && (
                          <Typography variant="body2" color="text.secondary">
                            Charges: ₹{room.charges}
                          </Typography>
                        )}
                      </Stack>

                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => {
                          setSelectedRoomId(room.id)
                          setCurrentView('beds')
                        }}
                      >
                        Manage Beds
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            )
          })}
          {selectedRooms.length === 0 && (
            <Grid item xs={12}>
              <Card
                elevation={0}
                sx={{
                  border: (theme) => `1px dashed ${theme.palette.divider}`,
                  py: 4,
                }}
              >
                <CardContent>
                  <Stack spacing={2} alignItems="center">
                    <MeetingRoomIcon color="disabled" sx={{ fontSize: 48 }} />
                    <Typography variant="h6" color="text.secondary">
                      No rooms found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Click "Add Room" to create your first room
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </Stack>
    )
  }

  // Render Bed Management View
  const renderBedManagement = () => {
    const selectedRoom = rooms.find((r) => r.id === selectedRoomId)
    const roomBeds = beds.filter((b) => b.roomId === selectedRoomId)

    return (
      <Stack spacing={3}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Box>
            <Button
              variant="text"
              onClick={() => {
                setSelectedRoomId('')
                setCurrentView('rooms')
              }}
              sx={{ mb: 1 }}
            >
              ← Back to Rooms
            </Button>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Bed Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedRoom?.name || selectedRoom?.roomNumber || 'Room'}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              // Calculate next bed number from existing beds
              const roomBeds = beds.filter((b) => b.roomId === selectedRoomId)
              let nextBedNumber = 1

              if (roomBeds.length > 0) {
                // Extract numbers from bedNumber or name fields
                const bedNumbers = roomBeds
                  .map((bed) => {
                    const bedNum = bed.bedNumber || bed.name || ''
                    // Extract numeric part from strings like "Bed 1", "1", "Bed-1", etc.
                    const match = bedNum.toString().match(/\d+/)
                    return match ? parseInt(match[0]) : 0
                  })
                  .filter((num) => num > 0)

                if (bedNumbers.length > 0) {
                  nextBedNumber = Math.max(...bedNumbers) + 1
                }
              }

              setBedsBulkForm({
                ...bedsBulkForm,
                roomId: selectedRoomId,
                startNumber: nextBedNumber,
              })
              setAddBedsBulkModal(true)
            }}
            disabled={!selectedRoomId}
          >
            + Add Beds (Bulk)
          </Button>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
          }}
        >
          {roomBeds.map((bed) => (
            <Box
              key={bed.id}
              sx={{
                position: 'relative',
                '&:hover .bed-actions': {
                  opacity: 1,
                  visibility: 'visible',
                },
              }}
            >
              <Tooltip
                title={`Status: ${bed.status} | Type: ${bed.bedType}`}
                arrow
              >
                <BedBox ownerState={{ status: bed.status }}>
                  <Typography
                    variant="body2"
                    className="bed-name"
                    sx={{
                      fontWeight: 600,
                      color: '#212121',
                      pr: 3, // Add padding to prevent text overlap
                    }}
                  >
                    {bed.bedNumber || bed.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    className="bed-status"
                    sx={{
                      textTransform: 'capitalize',
                      fontWeight: 600,
                    }}
                  >
                    {bed.status}
                  </Typography>
                </BedBox>
              </Tooltip>
              <Stack
                className="bed-actions"
                direction="row"
                spacing={0.5}
                sx={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  opacity: 0,
                  visibility: 'hidden',
                  transition: 'opacity 0.2s ease, visibility 0.2s ease',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: 1,
                  padding: '2px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
              >
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation()
                    setBedForm({
                      name: bed.name || '',
                      roomId: bed.roomId || selectedRoomId,
                      bedNumber: bed.bedNumber || '',
                      bedType: bed.bedType || 'Normal',
                      hasOxygen: bed.hasOxygen || false,
                      hasVentilator: bed.hasVentilator || false,
                      charge: bed.charge || 0,
                      status: bed.status || 'Available',
                      isActive: bed.isActive !== false,
                    })
                    setEditingBed(bed.id)
                    setAddBedModal(true)
                  }}
                  color="primary"
                  sx={{
                    padding: '4px',
                    '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.1)' },
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation()
                    setDeleteConfirm({
                      open: true,
                      type: 'bed',
                      id: bed.id,
                      name: bed.name || bed.bedNumber || 'Bed',
                    })
                  }}
                  color="error"
                  sx={{
                    padding: '4px',
                    '&:hover': { backgroundColor: 'rgba(211, 47, 47, 0.1)' },
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Box>
          ))}
        </Box>

        {roomBeds.length === 0 && (
          <Card
            elevation={0}
            sx={{
              border: (theme) => `1px dashed ${theme.palette.divider}`,
              py: 4,
            }}
          >
            <CardContent>
              <Stack spacing={2} alignItems="center">
                <HotelIcon color="disabled" sx={{ fontSize: 48 }} />
                <Typography variant="h6" color="text.secondary">
                  No beds found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Click "Add Beds (Bulk)" to create beds for this room
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        )}
      </Stack>
    )
  }

  return (
    <Box className="p-5 space-y-5">
      <Breadcrumb />
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <div>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            IP Layout Management
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Create and manage in-patient layouts across all branches.
          </Typography>
        </div>
        <Button variant="outlined" onClick={() => router.push('/ipmodule')}>
          Back to IP Module
        </Button>
      </Stack>

      {currentView === 'landing' && (
        <Card elevation={2} sx={{ borderRadius: 3, p: 4 }}>
          <Stack spacing={4}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="medium">
                  <InputLabel>State</InputLabel>
                  <Select
                    label="State"
                    value={selectedStateId}
                    onChange={handleStateChange}
                    displayEmpty={!selectedStateId}
                    endAdornment={
                      <IconButton
                        size="small"
                        onClick={() => setAddStateModal(true)}
                        sx={{ mr: 1 }}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    }
                  >
                    {states.map((state) => (
                      <MenuItem key={state.id} value={state.id}>
                        {state.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl
                  fullWidth
                  size="medium"
                  disabled={!selectedStateId}
                >
                  <InputLabel>City</InputLabel>
                  <Select
                    label="City"
                    value={selectedCityId}
                    onChange={handleCityChange}
                    displayEmpty={!selectedCityId}
                    endAdornment={
                      <IconButton
                        size="small"
                        onClick={() => {
                          setCityForm({ ...cityForm, stateId: selectedStateId })
                          setAddCityModal(true)
                        }}
                        disabled={!selectedStateId}
                        sx={{ mr: 1 }}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    }
                  >
                    {cities.map((city) => (
                      <MenuItem key={city.id} value={city.id}>
                        {city.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="medium" disabled={!selectedCityId}>
                  <InputLabel>Branch</InputLabel>
                  <Select
                    label="Branch"
                    value={selectedBranchId}
                    onChange={handleBranchChange}
                    displayEmpty={!selectedBranchId}
                    endAdornment={
                      <IconButton
                        size="small"
                        onClick={() => {
                          setBranchForm({
                            ...branchForm,
                            cityId: selectedCityId,
                          })
                          setAddBranchModal(true)
                        }}
                        disabled={!selectedCityId}
                        sx={{ mr: 1 }}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    }
                  >
                    {branches.map((branch) => (
                      <MenuItem key={branch.id} value={branch.id}>
                        {branch.name}{' '}
                        {branch.branchCode && `(${branch.branchCode})`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {selectedBranchId && (
              <Box>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<BusinessIcon />}
                  onClick={() => setCurrentView('buildings')}
                  disabled={!selectedBranchId}
                  sx={{ minWidth: 200 }}
                >
                  Manage Layout
                </Button>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  Branch:{' '}
                  <strong>
                    {branches.find((b) => b.id === selectedBranchId)?.name}
                  </strong>
                  {branches.find((b) => b.id === selectedBranchId)
                    ?.branchCode &&
                    ` (${branches.find((b) => b.id === selectedBranchId).branchCode})`}
                </Typography>
              </Box>
            )}
          </Stack>
        </Card>
      )}
      {currentView === 'buildings' && renderBuildingManagement()}
      {currentView === 'floors' && renderFloorManagement()}
      {currentView === 'rooms' && renderRoomManagement()}
      {currentView === 'beds' && renderBedManagement()}

      {/* Modals will be added in continuation */}
      {/* Add State Modal */}
      <Dialog
        open={addStateModal}
        onClose={() => setAddStateModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">Add New State</Typography>
            <IconButton onClick={() => setAddStateModal(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="State Name"
              fullWidth
              required
              value={stateForm.name}
              onChange={(e) =>
                setStateForm({ ...stateForm, name: e.target.value })
              }
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={stateForm.isActive}
                  onChange={(e) =>
                    setStateForm({ ...stateForm, isActive: e.target.checked })
                  }
                />
              }
              label="Active"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddStateModal(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => createStateMutation.mutate(stateForm)}
            disabled={!stateForm.name.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add City Modal */}
      <Dialog
        open={addCityModal}
        onClose={() => setAddCityModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">Add New City</Typography>
            <IconButton onClick={() => setAddCityModal(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>State</InputLabel>
              <Select
                label="State"
                value={cityForm.stateId}
                onChange={(e) =>
                  setCityForm({ ...cityForm, stateId: e.target.value })
                }
              >
                {states.map((state) => (
                  <MenuItem key={state.id} value={state.id}>
                    {state.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="City Name"
              fullWidth
              required
              value={cityForm.name}
              onChange={(e) =>
                setCityForm({ ...cityForm, name: e.target.value })
              }
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={cityForm.isActive}
                  onChange={(e) =>
                    setCityForm({ ...cityForm, isActive: e.target.checked })
                  }
                />
              }
              label="Active"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddCityModal(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => createCityMutation.mutate(cityForm)}
            disabled={!cityForm.name.trim() || !cityForm.stateId}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Branch Modal */}
      <Dialog
        open={addBranchModal}
        onClose={() => setAddBranchModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">Add New Branch</Typography>
            <IconButton onClick={() => setAddBranchModal(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>City</InputLabel>
              <Select
                label="City"
                value={branchForm.cityId}
                onChange={(e) =>
                  setBranchForm({ ...branchForm, cityId: e.target.value })
                }
              >
                {cities.map((city) => (
                  <MenuItem key={city.id} value={city.id}>
                    {city.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Branch Name"
              fullWidth
              required
              value={branchForm.name}
              onChange={(e) =>
                setBranchForm({ ...branchForm, name: e.target.value })
              }
            />
            <TextField
              label="Branch Code"
              fullWidth
              value={branchForm.branchCode}
              onChange={(e) =>
                setBranchForm({ ...branchForm, branchCode: e.target.value })
              }
            />
            <TextField
              label="Address"
              fullWidth
              multiline
              rows={3}
              value={branchForm.address}
              onChange={(e) =>
                setBranchForm({ ...branchForm, address: e.target.value })
              }
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={branchForm.isActive}
                  onChange={(e) =>
                    setBranchForm({ ...branchForm, isActive: e.target.checked })
                  }
                />
              }
              label="Active"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddBranchModal(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => createBranchMutation.mutate(branchForm)}
            disabled={!branchForm.name.trim() || !branchForm.cityId}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manage Buildings Modal */}
      <Dialog
        open={manageBuildingsModal}
        onClose={() => setManageBuildingsModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">Manage Buildings</Typography>
            <IconButton onClick={() => setManageBuildingsModal(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                const selectedBranch = branches.find(
                  (b) => b.id === selectedBranchId,
                )
                setBuildingForm({
                  ...buildingForm,
                  branchId: selectedBranchId,
                  name: selectedBranch?.name || '',
                })
                setAddBuildingModal(true)
              }}
            >
              Add New Building
            </Button>
            <Grid container spacing={2}>
              {buildings.map((building) => (
                <Grid item xs={12} md={6} key={building.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle1">
                        {building.name}
                      </Typography>
                      {building.buildingCode && (
                        <Typography variant="body2" color="text.secondary">
                          Code: {building.buildingCode}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setManageBuildingsModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Building Modal */}
      <Dialog
        open={addBuildingModal}
        onClose={() => {
          setAddBuildingModal(false)
          setEditingBuilding(null)
          setBuildingForm({
            name: '',
            branchId: '',
            buildingCode: '',
            totalFloors: '',
            isActive: true,
          })
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">
              {editingBuilding ? 'Edit Building' : 'Add New Building'}
            </Typography>
            <IconButton
              onClick={() => {
                setAddBuildingModal(false)
                setEditingBuilding(null)
                setBuildingForm({
                  name: '',
                  branchId: '',
                  buildingCode: '',
                  totalFloors: '',
                  isActive: true,
                })
              }}
            >
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Building Name"
              fullWidth
              required
              value={buildingForm.name}
              onChange={(e) =>
                setBuildingForm({ ...buildingForm, name: e.target.value })
              }
            />
            <TextField
              label="Building Code"
              fullWidth
              value={buildingForm.buildingCode}
              onChange={(e) =>
                setBuildingForm({
                  ...buildingForm,
                  buildingCode: e.target.value,
                })
              }
            />
            <TextField
              label="Total Floors"
              type="number"
              fullWidth
              value={buildingForm.totalFloors}
              onChange={(e) =>
                setBuildingForm({
                  ...buildingForm,
                  totalFloors: parseInt(e.target.value) || '',
                })
              }
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={buildingForm.isActive}
                  onChange={(e) =>
                    setBuildingForm({
                      ...buildingForm,
                      isActive: e.target.checked,
                    })
                  }
                />
              }
              label="Active"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setAddBuildingModal(false)
              setEditingBuilding(null)
              setBuildingForm({
                name: '',
                branchId: '',
                buildingCode: '',
                totalFloors: '',
                isActive: true,
              })
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              if (editingBuilding) {
                updateBuildingMutation.mutate({
                  id: editingBuilding,
                  data: buildingForm,
                })
              } else {
                createBuildingMutation.mutate(buildingForm)
              }
            }}
            disabled={!buildingForm.name.trim() || !buildingForm.branchId}
          >
            {editingBuilding ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Floor Modal */}
      <Dialog
        open={addFloorModal}
        onClose={() => {
          setAddFloorModal(false)
          setEditingFloor(null)
          setFloorForm({
            name: '',
            buildingId: '',
            floorNumber: '',
            floorType: 'IP',
            isActive: true,
          })
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">
              {editingFloor ? 'Edit Floor' : 'Add New Floor'}
            </Typography>
            <IconButton
              onClick={() => {
                setAddFloorModal(false)
                setEditingFloor(null)
                setFloorForm({
                  name: '',
                  buildingId: '',
                  floorNumber: '',
                  floorType: 'IP',
                  isActive: true,
                })
              }}
            >
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Floor Number"
              type="number"
              fullWidth
              value={floorForm.floorNumber}
              onChange={(e) =>
                setFloorForm({
                  ...floorForm,
                  floorNumber: parseInt(e.target.value) || '',
                })
              }
            />
            <FormControl fullWidth>
              <InputLabel>Floor Type</InputLabel>
              <Select
                label="Floor Type"
                value={floorForm.floorType}
                onChange={(e) =>
                  setFloorForm({ ...floorForm, floorType: e.target.value })
                }
              >
                <MenuItem value="IP">IP</MenuItem>
                <MenuItem value="ICU">ICU</MenuItem>
                <MenuItem value="Mixed">Mixed</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Checkbox
                  checked={floorForm.isActive}
                  onChange={(e) =>
                    setFloorForm({ ...floorForm, isActive: e.target.checked })
                  }
                />
              }
              label="Active"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setAddFloorModal(false)
              setEditingFloor(null)
              setFloorForm({
                name: '',
                buildingId: '',
                floorNumber: '',
                floorType: 'IP',
                isActive: true,
              })
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              if (editingFloor) {
                updateFloorMutation.mutate({
                  id: editingFloor,
                  data: floorForm,
                })
              } else {
                createFloorMutation.mutate(floorForm)
              }
            }}
            disabled={!floorForm.buildingId}
          >
            {editingFloor ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Room Modal */}
      <Dialog
        open={addRoomModal}
        onClose={() => {
          setAddRoomModal(false)
          setEditingRoom(null)
          setRoomForm({
            name: '',
            floorId: '',
            roomNumber: '',
            type: 'AC',
            roomCategory: 'General',
            genderRestriction: 'Any',
            totalBeds: 0,
            charges: 0,
            isActive: true,
          })
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">
              {editingRoom ? 'Edit Room' : 'Add New Room'}
            </Typography>
            <IconButton
              onClick={() => {
                setAddRoomModal(false)
                setEditingRoom(null)
                setRoomForm({
                  name: '',
                  floorId: '',
                  roomNumber: '',
                  type: 'AC',
                  roomCategory: 'General',
                  genderRestriction: 'Any',
                  totalBeds: 0,
                  charges: 0,
                  isActive: true,
                })
              }}
            >
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Room Number"
              fullWidth
              value={roomForm.roomNumber}
              onChange={(e) =>
                setRoomForm({ ...roomForm, roomNumber: e.target.value })
              }
            />
            <FormControl fullWidth>
              <InputLabel>Room Type</InputLabel>
              <Select
                label="Room Type"
                value={roomForm.type}
                onChange={(e) =>
                  setRoomForm({ ...roomForm, type: e.target.value })
                }
              >
                <MenuItem value="AC">AC</MenuItem>
                <MenuItem value="Non-AC">Non-AC</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Room Category</InputLabel>
              <Select
                label="Room Category"
                value={roomForm.roomCategory}
                onChange={(e) =>
                  setRoomForm({ ...roomForm, roomCategory: e.target.value })
                }
              >
                <MenuItem value="General">General</MenuItem>
                <MenuItem value="Semi-Private">Semi-Private</MenuItem>
                <MenuItem value="Private">Private</MenuItem>
                <MenuItem value="VIP">VIP</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Gender Restriction</InputLabel>
              <Select
                label="Gender Restriction"
                value={roomForm.genderRestriction}
                onChange={(e) =>
                  setRoomForm({
                    ...roomForm,
                    genderRestriction: e.target.value,
                  })
                }
              >
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
                <MenuItem value="Any">Any</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Total Beds"
              type="number"
              fullWidth
              value={roomForm.totalBeds}
              onChange={(e) =>
                setRoomForm({
                  ...roomForm,
                  totalBeds: parseInt(e.target.value) || 0,
                })
              }
            />
            <TextField
              label="Charges"
              type="number"
              fullWidth
              value={roomForm.charges}
              onChange={(e) =>
                setRoomForm({
                  ...roomForm,
                  charges: parseFloat(e.target.value) || 0,
                })
              }
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={roomForm.isActive}
                  onChange={(e) =>
                    setRoomForm({ ...roomForm, isActive: e.target.checked })
                  }
                />
              }
              label="Active"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setAddRoomModal(false)
              setEditingRoom(null)
              setRoomForm({
                name: '',
                floorId: '',
                roomNumber: '',
                type: 'AC',
                roomCategory: 'General',
                genderRestriction: 'Any',
                totalBeds: 0,
                charges: 0,
                isActive: true,
              })
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              if (editingRoom) {
                updateRoomMutation.mutate({ id: editingRoom, data: roomForm })
              } else {
                createRoomMutation.mutate(roomForm)
              }
            }}
            disabled={!roomForm.floorId}
          >
            {editingRoom ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Bed Modal */}
      <Dialog
        open={addBedModal}
        onClose={() => {
          setAddBedModal(false)
          setEditingBed(null)
          setBedForm({
            name: '',
            roomId: '',
            bedNumber: '',
            bedType: 'Normal',
            hasOxygen: false,
            hasVentilator: false,
            charge: 0,
            status: 'Available',
            isActive: true,
          })
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">
              {editingBed ? 'Edit Bed' : 'Add New Bed'}
            </Typography>
            <IconButton
              onClick={() => {
                setAddBedModal(false)
                setEditingBed(null)
                setBedForm({
                  name: '',
                  roomId: '',
                  bedNumber: '',
                  bedType: 'Normal',
                  hasOxygen: false,
                  hasVentilator: false,
                  charge: 0,
                  status: 'Available',
                  isActive: true,
                })
              }}
            >
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Bed Name"
              fullWidth
              required
              value={bedForm.name}
              onChange={(e) => setBedForm({ ...bedForm, name: e.target.value })}
            />
            <TextField
              label="Bed Number"
              fullWidth
              value={bedForm.bedNumber}
              onChange={(e) =>
                setBedForm({ ...bedForm, bedNumber: e.target.value })
              }
            />
            <FormControl fullWidth>
              <InputLabel>Bed Type</InputLabel>
              <Select
                label="Bed Type"
                value={bedForm.bedType}
                onChange={(e) =>
                  setBedForm({ ...bedForm, bedType: e.target.value })
                }
              >
                <MenuItem value="Normal">Normal</MenuItem>
                <MenuItem value="ICU">ICU</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                label="Status"
                value={bedForm.status}
                onChange={(e) =>
                  setBedForm({ ...bedForm, status: e.target.value })
                }
              >
                <MenuItem value="Available">Available</MenuItem>
                <MenuItem value="Occupied">Occupied</MenuItem>
                <MenuItem value="Reserved">Reserved</MenuItem>
                <MenuItem value="Maintenance">Maintenance</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Bed Charges"
              type="number"
              fullWidth
              value={bedForm.charge}
              onChange={(e) =>
                setBedForm({
                  ...bedForm,
                  charge: parseFloat(e.target.value) || 0,
                })
              }
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={bedForm.hasOxygen}
                  onChange={(e) =>
                    setBedForm({ ...bedForm, hasOxygen: e.target.checked })
                  }
                />
              }
              label="Has Oxygen"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={bedForm.hasVentilator}
                  onChange={(e) =>
                    setBedForm({ ...bedForm, hasVentilator: e.target.checked })
                  }
                />
              }
              label="Has Ventilator"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={bedForm.isActive}
                  onChange={(e) =>
                    setBedForm({ ...bedForm, isActive: e.target.checked })
                  }
                />
              }
              label="Active"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setAddBedModal(false)
              setEditingBed(null)
              setBedForm({
                name: '',
                roomId: '',
                bedNumber: '',
                bedType: 'Normal',
                hasOxygen: false,
                hasVentilator: false,
                charge: 0,
                status: 'Available',
                isActive: true,
              })
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              if (editingBed) {
                updateBedMutation.mutate({ id: editingBed, data: bedForm })
              } else {
                createBedMutation.mutate(bedForm)
              }
            }}
            disabled={!bedForm.roomId}
          >
            {editingBed ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Beds Bulk Modal */}
      <Dialog
        open={addBedsBulkModal}
        onClose={() => setAddBedsBulkModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">Add Beds (Bulk)</Typography>
            <IconButton onClick={() => setAddBedsBulkModal(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Number of Beds"
              type="number"
              fullWidth
              required
              value={bedsBulkForm.bedCount}
              onChange={(e) =>
                setBedsBulkForm({
                  ...bedsBulkForm,
                  bedCount: parseInt(e.target.value) || 1,
                })
              }
            />
            <TextField
              label="Bed Prefix"
              fullWidth
              value={bedsBulkForm.bedPrefix}
              onChange={(e) =>
                setBedsBulkForm({ ...bedsBulkForm, bedPrefix: e.target.value })
              }
            />
            <FormControl fullWidth>
              <InputLabel>Bed Type</InputLabel>
              <Select
                label="Bed Type"
                value={bedsBulkForm.bedType}
                onChange={(e) =>
                  setBedsBulkForm({ ...bedsBulkForm, bedType: e.target.value })
                }
              >
                <MenuItem value="Normal">Normal</MenuItem>
                <MenuItem value="ICU">ICU</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Bed Charges"
              type="number"
              fullWidth
              value={bedsBulkForm.charge}
              onChange={(e) =>
                setBedsBulkForm({
                  ...bedsBulkForm,
                  charge: parseFloat(e.target.value) || 0,
                })
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddBedsBulkModal(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => createBedsBulkMutation.mutate(bedsBulkForm)}
            disabled={!bedsBulkForm.roomId || bedsBulkForm.bedCount < 1}
          >
            Create Beds
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirm.open}
        onClose={() =>
          setDeleteConfirm({ open: false, type: '', id: null, name: '' })
        }
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">Confirm Delete</Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Typography>
            Are you sure you want to delete{' '}
            <strong>{deleteConfirm.name}</strong>?
            {deleteConfirm.type === 'floor' &&
              ' This will also delete all rooms and beds in this floor.'}
            {deleteConfirm.type === 'room' &&
              ' This will also delete all beds in this room.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setDeleteConfirm({ open: false, type: '', id: null, name: '' })
            }
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              if (deleteConfirm.type === 'floor') {
                deleteFloorMutation.mutate(deleteConfirm.id)
              } else if (deleteConfirm.type === 'room') {
                deleteRoomMutation.mutate(deleteConfirm.id)
              } else if (deleteConfirm.type === 'bed') {
                deleteBedMutation.mutate(deleteConfirm.id)
              }
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={closeSnackbar}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default LayoutsPage
