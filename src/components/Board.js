import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import { FiClock, FiPlus, FiTrash } from 'react-icons/fi'
import { FcLeave } from 'react-icons/fc'
import { motion } from 'framer-motion'
import { FaFire } from 'react-icons/fa'
import Image from 'next/image'
import { CgEye, CgProfile, CgSearch } from 'react-icons/cg'
import FlyoutLink from './FlyoutLink'
import {
  CheckCircleSharp,
  Close,
  Download,
  Edit,
  FullscreenRounded,
  InfoOutlined,
  MenuOpen,
  OpenInFull,
  OpenInNewOff,
  OpenInNewRounded,
  OpenWithOutlined,
  PaymentOutlined,
  PaymentsOutlined,
  PendingActions,
  PersonOffOutlined,
  Preview,
  PreviewOutlined,
  PrintOutlined,
  PrintRounded,
  Undo,
} from '@mui/icons-material'
const JoditEditor = dynamic(() => import('jodit-react'), {
  ssr: false,
})

import { useDispatch, useSelector } from 'react-redux'
import dummyProfile from '../../public/dummyProfile.jpg'
import { closeModal, openModal } from '@/redux/modalSlice'
import Modal from './Modal'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  applyNoShow,
  applyOptOut,
  createVitalsDetails,
  deleteAppointment,
  downloadOPDSheet,
  downloadPDF,
  editAppointment,
  editVitalsDetails,
  Generate_Invoice,
  getAvailableConsultationSlots,
  getCoupons,
  getDoctorsForAvailabilityConsultation,
  getLineBills,
  getOrderId,
  getOrderIdTreatment,
  getPendingInformation,
  getVitalsDetails,
  printPrescription,
  sendTransactionDetailsTreatment,
  sendTransactionId,
} from '@/constants/apis'
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  TextField,
  Typography,
  Box,
  Tab,
  TableContainer,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Divider,
  Alert,
  Tooltip,
  Checkbox,
  IconButton,
  Popper,
  Fade,
  Paper,
  Chip,
  Tabs,
} from '@mui/material'
import { TabContext } from '@mui/lab'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import { getLineBillsAndNotesForAppointment } from '@/constants/apis'
import { openSideDrawer } from '@/redux/sideDrawerSlice'
import { SideDrawer } from './SideDrawer'
import { FaUserDoctor } from 'react-icons/fa6'
import { FaClock } from 'react-icons/fa'
import BlinkingDot from './BlinkingDot'
import WaveDots from './WaveDots'
import { toastconfig } from '@/utils/toastconfig'
import { toast } from 'react-toastify'
import Vitals from './Vitals'
import { Autocomplete } from '@mui/material'
import { CreditCard, Money, Print } from '@mui/icons-material'
import { hideLoader, showLoader } from '@/redux/loaderSlice'
import { useRouter } from 'next/router'
import RichText from './RichText'
import dayjs from 'dayjs'
import BillDataFallBack from '@/fallbacks/BillDataFallBack'
import { withPermission } from './withPermission'
import { ACCESS_TYPES } from '@/constants/constants'
import { PrintPreview } from './PrintPreview'
import { TbInvoice } from 'react-icons/tb'
import PendingAmount from './PendingAmount'
import { CalendarIcon, DatePicker } from '@mui/x-date-pickers'

import dynamic from 'next/dynamic'
import { ArrowBack } from '@mui/icons-material'
// import { useReactToPrint } from 'react-to-print'
// export const CustomKanban = () => {
//   return (
//     <div className="h-screen w-full bg-neutral-900 text-neutral-50">
//       <Board />
//     </div>
//   );
// };

const PermissionedPayButton = withPermission(
  ({ onClick, children, ...props }) => (
    <Button onClick={onClick} {...props}>
      {children}
    </Button>
  ),
  false,
  'appointment',
  [ACCESS_TYPES.WRITE],
)

const PermissionedDeleteButton = withPermission(
  ({ onClick, ...props }) => (
    <IconButton color="error" size="small" onClick={onClick} {...props}>
      <FiTrash />
    </IconButton>
  ),
  false,
  'appointment',
  [ACCESS_TYPES.WRITE],
)

const PermissionedNoShowButton = withPermission(
  ({ onClick, ...props }) => (
    <IconButton color="error" size="small" onClick={onClick} {...props}>
      <PersonOffOutlined />
    </IconButton>
  ),
  false,
  'appointment',
  [ACCESS_TYPES.WRITE],
)

const PermissionedVitalsButton = withPermission(
  ({ onClick, hasVitals, ...props }) => (
    <Button
      color={hasVitals ? 'success' : 'primary'}
      variant={hasVitals ? 'outlined' : 'contained'}
      size="small"
      className="flex-1 capitalize"
      onClick={onClick}
      startIcon={hasVitals ? <CheckCircleSharp /> : <PendingActions />}
      {...props}
    >
      {hasVitals ? 'View Vitals' : 'Record Vitals'}
    </Button>
  ),
  false,
  'appointment',
  [ACCESS_TYPES.WRITE],
)

export const Board = ({ allAppointmentsData, updateStage }) => {
  const [cards, setCards] = useState(allAppointmentsData?.data)
  const [activeSearchColumn, setActiveSearchColumn] = useState(null) // Add this state

  useEffect(() => {
    setCards(allAppointmentsData?.data)
  }, [allAppointmentsData?.data])

  return (
    <div className="flex h-full w-full gap-3 overflow-scroll py-6 px-3">
      {/* 'Booked','Arrived','Scan','Doctor','Seen','Done' */}
      <Column
        title="Booked"
        stage="Booked"
        headingColor="text-secondary border-2 border-secondary rounded-md w-full p-3"
        cards={cards}
        setCards={setCards}
        updateStage={updateStage}
        activeSearchColumn={activeSearchColumn}
        setActiveSearchColumn={setActiveSearchColumn}
      />
      <Column
        title="Check-In / Vitals"
        stage="Scan"
        headingColor="text-secondary border-2 border-secondary rounded-md w-full p-3"
        cards={cards}
        setCards={setCards}
        updateStage={updateStage}
        activeSearchColumn={activeSearchColumn}
        setActiveSearchColumn={setActiveSearchColumn}
      />
      <Column
        title="Doctor"
        stage="Doctor"
        headingColor="text-secondary border-2 border-secondary rounded-md w-full p-3"
        cards={cards}
        setCards={setCards}
        updateStage={updateStage}
        activeSearchColumn={activeSearchColumn}
        setActiveSearchColumn={setActiveSearchColumn}
      />
      <Column
        title="Seen / Billing"
        stage="Seen"
        headingColor="text-secondary border-2 border-secondary rounded-md w-full p-3"
        cards={cards}
        setCards={setCards}
        updateStage={updateStage}
        activeSearchColumn={activeSearchColumn}
        setActiveSearchColumn={setActiveSearchColumn}
      />
      <Column
        title="Completed"
        stage="Done"
        headingColor="text-secondary border-2 border-secondary rounded-md w-full p-3"
        cards={cards}
        setCards={setCards}
        updateStage={updateStage}
        activeSearchColumn={activeSearchColumn}
        setActiveSearchColumn={setActiveSearchColumn}
      />
    </div>
  )
}

const Column = ({
  title,
  headingColor,
  cards,
  stage,
  setCards,
  updateStage,
  activeSearchColumn,
  setActiveSearchColumn,
}) => {
  const [active, setActive] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchAnchorEl, setSearchAnchorEl] = useState(null)
  const searchOpen = Boolean(searchAnchorEl) && activeSearchColumn === stage

  // Handle search icon click
  const handleSearchClick = event => {
    if (activeSearchColumn === stage) {
      setActiveSearchColumn(null)
      setSearchAnchorEl(null)
    } else {
      setActiveSearchColumn(stage)
      setSearchAnchorEl(event.currentTarget)
    }
  }

  // Handle search close
  const handleSearchClose = () => {
    setActiveSearchColumn(null)
    setSearchAnchorEl(null)
  }

  // Clear search when column changes
  useEffect(() => {
    if (activeSearchColumn !== stage) {
      setSearchQuery('')
    }
  }, [activeSearchColumn, stage])

  const handleDragStart = (e, patientDetails) => {
    // console.log(patientDetails)
    e.dataTransfer.setData('cardId', patientDetails.appointmentId)
  }

  const handleDragEnd = e => {
    const cardId = e.dataTransfer.getData('cardId')
    setActive(false)
    clearHighlights()

    const indicators = getIndicators()
    const { element } = getNearestIndicator(e, indicators)

    const before = element.dataset.before || -1
    console.log(before, cardId, stage)
    if (before !== cardId) {
      let copy = [...cards]
      // console.log(copy)
      let cardToTransfer = copy.find(c => c.appointmentId == cardId)
      // console.log(cardToTransfer)
      if (!cardToTransfer) return
      cardToTransfer = { ...cardToTransfer, stage }
      // console.log(cardToTransfer)
      const payload = {
        appointmentId: cardToTransfer.appointmentId,
        type: cardToTransfer.type,
        stage: cardToTransfer.stage,
        patientId: cardToTransfer.patientId,
        appointmentDate: cardToTransfer.appointmentDate,
        visitId: cardToTransfer.visitId,
        isPackageExists: cardToTransfer.isPackageExists,
      }
      updateStage.mutate(payload)
      copy = copy.filter(c => c.appointmentId != cardId)

      // const moveToBack = before == -1
      // console.log(moveToBack, copy, cardId, stage)
      // if (moveToBack) {
      //   copy.push(cardToTransfer)
      // } else {
      //   const insertAtIndex = copy.findIndex(el => el.appointmentId == before)
      //   if (insertAtIndex == undefined) return

      //   copy.splice(insertAtIndex, 0, cardToTransfer)
      // }

      // setCards(copy)
    }
  }

  const handleDragOver = e => {
    e.preventDefault()
    highlightIndicator(e)

    setActive(true)
  }

  const clearHighlights = els => {
    const indicators = els || getIndicators()

    indicators.forEach(i => {
      i.style.opacity = '0'
    })
  }

  const highlightIndicator = e => {
    const indicators = getIndicators()

    clearHighlights(indicators)

    const el = getNearestIndicator(e, indicators)

    el.element.style.opacity = '1'
  }

  const getNearestIndicator = (e, indicators) => {
    const DISTANCE_OFFSET = 50

    const el = indicators.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect()

        const offset = e.clientY - (box.top + DISTANCE_OFFSET)

        if (offset < 0 && offset > closest.offset) {
          return { offset: offset, element: child }
        } else {
          return closest
        }
      },
      {
        offset: Number.NEGATIVE_INFINITY,
        element: indicators[indicators.length - 1],
      },
    )

    return el
  }

  const getIndicators = () => {
    return Array.from(document.querySelectorAll(`[data-stage="${stage}"]`))
  }

  const handleDragLeave = () => {
    clearHighlights()
    setActive(false)
  }

  // Filter cards by stage and search query
  const filteredCards = cards?.filter(c => {
    const matchesStage = c.stage === stage
    const matchesSearch = c.patientName
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase())
    return matchesStage && (searchQuery === '' || matchesSearch)
  })

  return (
    <div className="min-w-48 lg:min-w-[15.7%] shrink-0 grow" key={stage}>
      <div className="mb-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className={`font-medium ${headingColor}`}>
            {title} ({filteredCards?.length})
          </h3>
          <IconButton
            size="small"
            onClick={handleSearchClick}
            className="hover:bg-secondary/10"
          >
            <CgSearch className="text-secondary w-4 h-4" />
          </IconButton>
        </div>

        {/* Search Popper */}
        <Popper
          open={searchOpen}
          anchorEl={searchAnchorEl}
          placement="top-end"
          transition
          className="z-50"
        >
          {({ TransitionProps }) => (
            <Fade {...TransitionProps} timeout={350}>
              <Paper className="p-2 shadow-lg" sx={{ minWidth: '200px' }}>
                <div className="flex items-center gap-2">
                  <TextField
                    size="small"
                    placeholder="Search patient..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="flex-1"
                    autoFocus
                    InputProps={{
                      startAdornment: (
                        <CgSearch className="text-gray-400 mr-2" />
                      ),
                    }}
                  />
                  <IconButton size="small" onClick={handleSearchClose}>
                    <Close className="w-4 h-4" />
                  </IconButton>
                </div>
                {searchQuery && (
                  <Typography variant="caption" className="mt-1 text-gray-500">
                    Found {filteredCards?.length} results
                  </Typography>
                )}
              </Paper>
            </Fade>
          )}
        </Popper>
      </div>

      <div
        onDrop={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`h-[90%] overflow-scroll w-full p-2 flex flex-col gap-2 rounded transition-colors ${
          active ? 'bg-secondary' : 'bg-primary'
        }`}
      >
        {filteredCards?.map(c => {
          return (
            <Card
              key={c.appointmentId}
              patientDetails={c}
              handleDragStart={handleDragStart}
              stage={stage}
            />
          )
        })}
        <DropIndicator beforeId={null} stage={stage} />
      </div>
    </div>
  )
}

const Card = ({ patientDetails, stage, handleDragStart }) => {
  const dispatch = useDispatch()
  const router = useRouter()
  const user = useSelector(store => store.user)
  const modalState = useSelector(store => store.modal)
  const queryClient = useQueryClient()
  const [previewContent, setPreviewContent] = useState(null)
  const [anchorEl, setAnchorEl] = useState(null)
  const open = Boolean(anchorEl)
  const [treatmentPendings, setTreatmentPendings] = useState(null)
  const handleStatusClick = event => {
    setAnchorEl(event.currentTarget) // Just set the anchor element
  }

  const handleEditAppointments = event => {
    dispatch(openModal('editAppointment' + patientDetails?.appointmentId))
  }

  const handleClose = () => {
    setAnchorEl(null) // Clear the anchor element to close
  }

  // Effect to handle URL params for modal
  useEffect(() => {
    const { appointmentId, patientId, type, stage: routeStage } = router.query
    // Check if URL contains data matching this card's patient
    if (
      appointmentId == patientDetails?.appointmentId &&
      // patientId === patientDetails?.patientId &&
      type === patientDetails?.type &&
      routeStage === stage
    ) {
      // Auto-open modal if URL matches this card's data
      dispatch(openModal(patientDetails?.appointmentId))

      // Fetch any necessary data
      queryClient.prefetchQuery({
        queryKey: ['getLineBills', patientDetails?.appointmentId],
        queryFn: async () => {
          const responsejson = await getLineBillsAndNotesForAppointment(
            user.accessToken,
            patientDetails?.type,
            patientDetails?.appointmentId,
          )
          if (responsejson.status == 200) {
            return responsejson.data
          } else {
            throw new Error(
              'Error occurred while fetching patient information for doctor',
            )
          }
        },
      })
    }
  }, [router.query, patientDetails, stage])

  // handle treatment pendings
  useEffect(() => {
    // if (modalState?.key == `pendingAmount${patientDetails?.appointmentId}${patientDetails?.type}`) {
    let totalPendings = patientDetails?.pendingAmountDetails?.filter(
      item =>
        // item.mileStoneStartedDate !== 'NA' &&
        item.pending_amount > 0,
    )
    setTreatmentPendings(totalPendings)
    // }
  }, [patientDetails])
  // Query for line bills and notes
  const {
    data: lineBillsAndNotesData,
    isLoading: islineBillsAndNotesDataLoading,
  } = useQuery({
    queryKey: ['getLineBills', patientDetails?.appointmentId],
    enabled: modalState?.key == patientDetails?.appointmentId,
    queryFn: async () => {
      const responsejson = await getLineBillsAndNotesForAppointment(
        user.accessToken,
        patientDetails?.type,
        patientDetails?.appointmentId,
      )
      if (responsejson.status == 200) {
        return responsejson.data
      } else {
        throw new Error(
          'Error occurred while fetching patient information for doctor',
        )
      }
    },
  })

  const handlePatientModal = () => {
    // First dispatch the openModal action
    dispatch(openModal(patientDetails?.appointmentId))

    // Then update URL with patient details
    router.push(
      {
        pathname: router.pathname,
        query: {
          ...router.query,
          appointmentId: patientDetails?.appointmentId,
          patientId: patientDetails?.patientId,
          type: patientDetails?.type,
          stage: stage,
        },
      },
      undefined,
      { shallow: true },
    )
  }

  const handleModalClose = () => {
    dispatch(closeModal())
    const { appointmentId, patientId, type, stage, ...restQuery } = router.query
    router.push(
      {
        pathname: router.pathname,
        query: restQuery,
      },
      undefined,
      { shallow: true },
    )
  }

  const handleAddLineBills = () => {
    dispatch(openSideDrawer())
  }
  const generateReport = useMutation({
    mutationFn: async payload => {
      dispatch(showLoader())
      const res = await Generate_Invoice(user.accessToken, payload)
      try {
        if (res.status == 200) {
          setPreviewContent(res.data)
          dispatch(openModal('print-preview' + patientDetails?.appointmentId))
        } else {
          toast.error('Error generating invoice', toastconfig)
        }
      } catch (error) {
        toast.error('Error generating invoice', toastconfig)
      } finally {
        dispatch(hideLoader())
      }
      // reportRef.current.innerHTML = res?.data
      //print invoice from res?.data
      // if (res.status == 200) {
      //   console.log(res.data)
      //   const { default: html2pdf } = await import('html2pdf.js')
      //   const element = document.createElement('div')
      //   element.innerHTML = res.data

      //   const opt = {
      //     margin: 10,
      //     filename: 'invoice.pdf',
      //     image: { type: 'jpeg', quality: 0.98 },
      //     html2canvas: { scale: 2 },
      //     jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      //   }

      //   html2pdf()
      //     .set(opt)
      //     .from(element)
      //     .save()
      //     .then(() => {
      //       console.log('PDF generated successfully')
      //     })
      //     .catch(error => {
      //       console.error('Error generating PDF:', error)
      //     })
      //     .finally(() => {
      //       dispatch(hideLoader())
      //     })
      // } else {
      //   toast.error(res.message, toastconfig)
      // }
      // console.log(res.data)
    },
  })

  const handleInvoicePrint = () => {
    generateReport.mutate({
      appointmentId: patientDetails?.appointmentId,
      productType: 'CONSULTATION FEE', // same values used in tranasction api
      type: patientDetails?.type, // Consultation or Treatment
    })
  }

  const [vitalsData, setVitalsData] = useState(null)

  const vitalsQuery = useQuery({
    queryKey: ['vitals', patientDetails?.appointmentId],
    queryFn: async () => {
      let res = await getVitalsDetails(
        user.accessToken,
        patientDetails?.appointmentId,
        patientDetails?.type,
      )
      if (res.status === 200) {
        const { createdBy, updatedAt, createdAt, ...data } = res.data
        setVitalsData(data)
        return data
      }
    },
    enabled: stage === 'Scan',
  })
  const createVitalsMutation = useMutation({
    mutationFn: async payload => {
      const result = await createVitalsDetails(user.accessToken, payload)
      if (result.status === 200) {
        queryClient.invalidateQueries(['allAppointments'])
        toast.success('Vitals created successfully')
      }
      return result
    },
  })

  const editVitalsMutation = useMutation({
    mutationFn: async payload => {
      const result = await editVitalsDetails(user.accessToken, payload)
      if (result.status === 200) {
        queryClient.invalidateQueries(['allAppointments'])
        toast.success('Vitals updated successfully')
      }
      return result
    },
  })
  const handleOpenVitalsModal = () => {
    dispatch(openModal(patientDetails?.appointmentId + 'vitals'))
  }

  const handleDeleteAppointments = async () => {
    if (confirm('Are you sure you want to delete this appointment?')) {
      const bodypayload = {
        appointmentId: patientDetails?.appointmentId,
        type: patientDetails?.type,
      }
      const rs = await deleteAppointment(user.accessToken, bodypayload)
      if (rs.status === 200) {
        toast.success('Appointment Deleted Successfully', toastconfig)
        queryClient.invalidateQueries('allAppointments')
      }
    }
  }

  const getBgClass = visitType => {
    if (visitType.startsWith('Fe')) return 'bg-blue-100 text-blue-700'
    if (visitType.startsWith('An')) return 'bg-purple-100 text-purple-700'
    if (visitType.startsWith('Gy')) return 'bg-emerald-100 text-emerald-700'
    return 'bg-gray-400' // Default color
  }

  const handlePrintInvoice = async (e, bill) => {
    try {
      dispatch(showLoader())
      const res = await Generate_Invoice(user?.accessToken, {
        appointmentId: bill.appointmentId,
        productType: e.target.name.toUpperCase(),
        type: bill.type,
      })

      if (res.status === 200) {
        setPreviewContent(res.data)
        dispatch(openModal('print-preview' + bill.appointmentId))
      } else {
        toast.error('Failed to generate invoice', toastconfig)
      }
    } catch (error) {
      console.error('Error generating invoice:', error)
      toast.error('Error generating invoice', toastconfig)
    } finally {
      dispatch(hideLoader())
    }
  }
  const {
    data: pendingInformation,
    isLoading: pendingInformationLoading,
  } = useQuery({
    queryKey: ['pendingInformation', patientDetails?.appointmentId],
    queryFn: async () => {
      const res = await getPendingInformation(
        user.accessToken,
        patientDetails?.appointmentId,
        patientDetails?.type,
      )
      return res.data
    },
    enabled: open, // Only fetch when popper is open
  })

  return (
    <>
      <DropIndicator beforeId={patientDetails?.appointmentId} stage={stage} />
      <motion.div
        layoutId={patientDetails?.appointmentId}
        draggable="true"
        onDragStart={e => handleDragStart(e, patientDetails)}
        className={`cursor-grab rounded-lg bg-white p-2 shadow-md hover:shadow-lg transition-all duration-200 relative ${
          stage === 'Doctor' && patientDetails?.isPrescribed === 1
            ? 'border-t-4 border-t-green-500'
            : ''
        }`}
      >
        {/* Add prescription indicator */}
        {(stage === 'Doctor' || stage === 'Seen' || stage === 'Done') &&
          patientDetails?.noShow !== 1 &&
          patientDetails?.isPrescribed === 1 && (
            <div className="absolute -top-3 right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full shadow-md">
              Prescribed
            </div>
          )}

        {stage === 'Done' && patientDetails?.noShow === 1 && (
          <div className="absolute -top-3 right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full shadow-md">
            No Show
          </div>
        )}

        {/* Delayed Warning Alert */}
        {stage != 'Booked' && patientDetails?.isDelayed == 'Yes' && (
          <div className="mb-2 flex items-center gap-2">
            <Alert
              severity="error"
              className="items-center text-xs rounded-md flex-1"
              icon={<FaClock className="text-red-500" />}
            >
              Patient Delayed
            </Alert>
            <Tooltip title="View Status">
              <IconButton
                size="small"
                className="bg-secondary/10 hover:bg-secondary/20"
                onClick={handleStatusClick}
                aria-describedby={`status-popper-${patientDetails?.appointmentId}`}
              >
                <InfoOutlined className="text-secondary w-4 h-4" />
              </IconButton>
            </Tooltip>
          </div>
        )}

        {/* Status Popper */}
        <Popper
          id={`status-popper-${patientDetails?.appointmentId}`}
          open={open}
          anchorEl={anchorEl}
          placement="top-start"
          transition
          className="z-50"
        >
          {({ TransitionProps }) => (
            <Fade {...TransitionProps} timeout={350}>
              <Paper
                className="p-4 shadow-lg max-w-md"
                sx={{
                  backgroundColor: 'background.paper',
                  borderRadius: 1,
                  boxShadow: 3,
                  width: '350px', // Fixed width
                  height: '300px', // Fixed height
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div className="flex justify-between items-center mb-4">
                  <Typography variant="h6" className="text-secondary">
                    Status
                  </Typography>
                  <IconButton size="small" onClick={handleClose}>
                    <Close />
                  </IconButton>
                </div>

                {pendingInformationLoading ? (
                  <div className="flex-1 flex justify-center items-center">
                    <WaveDots />
                  </div>
                ) : pendingInformation?.length > 0 ? (
                  <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                    {pendingInformation.map((info, index) => (
                      <div
                        key={index}
                        className="border rounded-lg overflow-hidden"
                      >
                        <div className="bg-secondary/10 p-2 border-b">
                          <Typography
                            variant="subtitle1"
                            className="font-medium text-secondary"
                          >
                            {info.billType}
                          </Typography>
                        </div>
                        <div className="p-3">
                          <div className="space-y-2">
                            {info.statusInformation.map((status, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-2 bg-gray-50 rounded"
                              >
                                <div className="flex flex-col">
                                  <Typography
                                    variant="body2"
                                    className="font-medium"
                                  >
                                    {status.billTypeValue}
                                  </Typography>
                                  <div className="flex items-center gap-2 mt-1">
                                    {status.resultStatus != '-' && (
                                      <Chip
                                        label={status.resultStatus}
                                        size="small"
                                        color={
                                          status.resultStatus === 'Completed'
                                            ? 'success'
                                            : 'warning'
                                        }
                                        variant="outlined"
                                      />
                                    )}
                                    <Chip
                                      label={status.paymentStatus}
                                      size="small"
                                      color={
                                        status.paymentStatus === 'PAID'
                                          ? 'success'
                                          : 'error'
                                      }
                                      variant="outlined"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex justify-center items-center text-gray-500">
                    No pending items
                  </div>
                )}
              </Paper>
            </Fade>
          )}
        </Popper>

        {/* Patient Info Section */}
        <div className="flex items-start space-x-3 relative">
          {/* <div
            className={`absolute -right-1 -top-1 z-20 rounded-md px-2 text-white ${getBgClass(
              patientDetails?.visitType || '',
            )}`}
          >
            {patientDetails?.visitType.slice(0, 2)}
          </div> */}
          <div className="relative w-12 h-12">
            {patientDetails?.photoPath != null &&
            patientDetails?.photoPath != 'null' ? (
              <img
                src={patientDetails.photoPath}
                alt="profilePic"
                width={50}
                height={50}
                className="rounded-full ring-2 ring-secondary/20 w-full h-full object-cover"
              />
            ) : (
              <div className="w-[50px] h-[50px] rounded-full bg-secondary/10 flex items-center justify-center">
                <span className="text-2xl font-semibold text-secondary">
                  {patientDetails?.patientName?.charAt(0)?.toUpperCase()}
                </span>
              </div>
            )}

            {(stage == 'Doctor' || stage == 'Seen' || stage == 'Done') && (
              <div
                className="absolute -right-1 -top-1 cursor-pointer bg-white rounded-full p-1 shadow-md hover:bg-gray-50"
                onClick={handlePatientModal}
              >
                <FullscreenRounded className="text-secondary w-4 h-4" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <Tooltip title={patientDetails?.patientName}>
              <h3 className="font-semibold text-lg  truncate max-w-[200px]">
                <Button
                  variant="text"
                  className="text-secondary capitalize"
                  onClick={() => {
                    router.push(
                      `/patient/register?search=${patientDetails?.patientAadhaar}`,
                    )
                  }}
                >
                  {patientDetails?.patientName?.toLowerCase()}
                </Button>
              </h3>
            </Tooltip>
            <div className="flex flex-col items-start gap-2 text-xs text-gray-500 pl-1.5">
              <Tooltip title={patientDetails?.appointmentReason}>
                <span className="text-xs text-gray-500 truncate max-w-[180px]">
                  {patientDetails?.appointmentReason}
                </span>
              </Tooltip>
              {/* <span>•</span> */}
            </div>
          </div>
          {stage === 'Booked' && (
            <Tooltip title="Edit Appointment">
              <IconButton
                size="small"
                className="bg-secondary/10 hover:bg-secondary/20"
                onClick={handleEditAppointments}
                aria-describedby={`status-popper-${patientDetails?.appointmentId}`}
              >
                <Edit className="text-secondary w-4 h-4" color="primary" />
              </IconButton>
            </Tooltip>
          )}
          {patientDetails?.isDelayed != 'Yes' && (
            <Tooltip title="View Status">
              <IconButton
                size="small"
                className="bg-secondary/10 hover:bg-secondary/20"
                onClick={handleStatusClick}
                aria-describedby={`status-popper-${patientDetails?.appointmentId}`}
              >
                <InfoOutlined className="text-secondary w-4 h-4" />
              </IconButton>
            </Tooltip>
          )}
        </div>

        <div className="flex items-center gap-2 my-2">
          <div className="h-[1px] flex-1 bg-gray-200"></div>
          <div className="flex items-center gap-2">
            <span
              className={`${getBgClass(
                patientDetails?.visitType,
              )} px-2 py-1 rounded-md text-xs font-medium`}
            >
              {patientDetails?.visitType}
            </span>
            <span className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded-md font-medium">
              {patientDetails?.type}
            </span>
          </div>
          <div className="h-[1px] flex-1 bg-gray-200"></div>
        </div>

        {/* Doctor & Time Info */}
        <div className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-1">
            <div className="p-1 bg-secondary/10 rounded-full">
              <FaUserDoctor size={16} className="text-secondary" />
            </div>
            <Tooltip title={patientDetails?.doctorName}>
              <span className="text-sm font-medium truncate max-w-[120px]">
                {patientDetails?.doctorName}
              </span>
            </Tooltip>
          </div>

          <div className="flex items-center gap-1">
            <div className="p-1 bg-secondary/10 rounded-full">
              <FaClock size={16} className="text-secondary" />
            </div>
            <span className="text-sm">{patientDetails?.timeStart}</span>
          </div>
        </div>

        {/* Action Buttons Section */}
        <Divider className="my-2" />
        <div className="mt-2 space-y-2">
          {/* Consultation Fee Section */}
          {stage == 'Booked' ? (
            // patientDetails?.type?.toLowerCase() == 'consultation' &&
            patientDetails?.lastConsultationDetails == null ||
            patientDetails?.lastConsultationDetails?.paymentSince >=
              patientDetails?.lastConsultationDetails?.validityPeriod ? (
              <div className="flex items-center gap-2">
                {patientDetails?.type?.toLowerCase() == 'consultation' && (
                  <div>
                    <PermissionedPayButton
                      color="success"
                      variant="outlined"
                      size="small"
                      className="flex-1 capitalize"
                      startIcon={<PaymentsOutlined />}
                      onClick={() =>
                        dispatch(
                          openModal(
                            'consultationFee' + patientDetails?.appointmentId,
                          ),
                        )
                      }
                    >
                      Pay
                    </PermissionedPayButton>
                    {patientDetails?.lastConsultationDetails && (
                      <Tooltip
                        title={`Last paid on ${dayjs(
                          patientDetails?.lastConsultationDetails?.orderDate,
                        ).format('DD-MM-YYYY')}`}
                      >
                        <IconButton
                          size="small"
                          onClick={handleInvoicePrint}
                          className="text-secondary hover:bg-secondary/10"
                        >
                          <TbInvoice />
                        </IconButton>
                      </Tooltip>
                    )}
                  </div>
                )}

                {(user.roleDetails?.id === 1 || user.roleDetails?.id === 7) && (
                  <PermissionedDeleteButton
                    onClick={handleDeleteAppointments}
                  />
                )}

                {patientDetails?.noShow === 0 && (
                  <PermissionedNoShowButton
                    onClick={() =>
                      dispatch(
                        openModal('noShow' + patientDetails?.appointmentId),
                      )
                    }
                  />
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                <CheckCircleSharp className="text-green-500" />
                <span className="flex-1">
                  Paid on{' '}
                  {dayjs(
                    patientDetails?.lastConsultationDetails?.orderDate,
                  ).format('DD-MM-YYYY')}
                </span>
                <Tooltip title="Invoice">
                  <IconButton
                    size="small"
                    onClick={() => {
                      generateReport.mutate({
                        appointmentId:
                          patientDetails?.lastConsultationDetails
                            ?.appointmentId,
                        productType: 'CONSULTATION FEE',
                        type: patientDetails?.lastConsultationDetails?.type,
                      })
                    }}
                    className="text-secondary hover:bg-secondary/10"
                  >
                    <TbInvoice />
                  </IconButton>
                </Tooltip>
                {patientDetails?.noShow === 0 && (
                  <PermissionedNoShowButton
                    onClick={() =>
                      dispatch(
                        openModal('noShow' + patientDetails?.appointmentId),
                      )
                    }
                  />
                )}
                {(user.roleDetails?.id === 1 || user.roleDetails?.id === 7) && (
                  <PermissionedDeleteButton
                    onClick={handleDeleteAppointments}
                  />
                )}
              </div>
            )
          ) : null}

          {/* Vitals Section */}
          {stage == 'Scan' && (
            <div className="flex items-center gap-2">
              <PermissionedVitalsButton
                hasVitals={vitalsData?.id}
                onClick={handleOpenVitalsModal}
              />
              <Vitals
                patientDetails={patientDetails}
                vitalsData={vitalsData}
                setVitalsData={setVitalsData}
                createVitalsMutation={createVitalsMutation}
                editVitalsMutation={editVitalsMutation}
              />
            </div>
          )}

          {/* Pending Amount Section */}
          {stage == 'Scan' && !!patientDetails?.isPackageExists && (
            <span className="text-xs text-gray-600 bg-gray-50 p-2 rounded flex items-center gap-2">
              Pending ₹
              {treatmentPendings?.reduce(
                (acc, curr) => acc + curr.pending_amount,
                0,
              )}
              <Button
                variant="outlined"
                color="success"
                size="small"
                className="flex-1 capitalize"
                startIcon={<PaymentsOutlined />}
                onClick={() =>
                  dispatch(
                    openModal(
                      'pendingAmount' +
                        patientDetails?.appointmentId +
                        patientDetails?.type,
                    ),
                  )
                }
              >
                Pay
              </Button>
            </span>
          )}
        </div>
      </motion.div>

      {/* {modalState?.key === patientDetails?.appointmentId && ( */}
      <Modal
        maxWidth={'md'}
        key="patientdetail"
        uniqueKey={patientDetails?.appointmentId}
        // closeOnOutsideClick={true}
        onClose={handleModalClose}
      >
        <div className="flex justify-end">
          <IconButton onClick={handleModalClose}>
            <Close />
          </IconButton>
        </div>
        <PatientFullDetail
          patientDetails={patientDetails}
          lineBillsAndNotesData={lineBillsAndNotesData}
          islineBillsAndNotesDataLoading={islineBillsAndNotesDataLoading}
          previewContent={previewContent}
          setPreviewContent={setPreviewContent}
        />
      </Modal>
      {/* )} */}

      <PrintPreview
        htmlContent={previewContent}
        onClose={() =>
          dispatch(closeModal('print-preview' + patientDetails?.appointmentId))
        }
        uniqueKey={patientDetails?.appointmentId}
      />

      <Modal
        maxWidth={'sm'}
        key="consultationFee"
        uniqueKey={'consultationFee' + patientDetails?.appointmentId}
        closeOnOutsideClick={true}
      >
        <ConsultationFee patientDetails={patientDetails} />
      </Modal>
      <Modal
        maxWidth={'sm'}
        key="pendingAmount"
        uniqueKey={
          'pendingAmount' + patientDetails?.appointmentId + patientDetails?.type
        }
        closeOnOutsideClick={true}
      >
        <PendingAmount
          patientDetails={patientDetails}
          treatmentPendings={treatmentPendings}
          allPaymentDetails={patientDetails?.pendingAmountDetails}
        />
      </Modal>
      <Modal
        maxWidth={'sm'}
        key="noShow"
        uniqueKey={'noShow' + patientDetails?.appointmentId}
        closeOnOutsideClick={true}
      >
        <NoShow patientDetails={patientDetails} />
      </Modal>

      <Modal
        maxWidth={'sm'}
        key="editAppointment"
        uniqueKey={'editAppointment' + patientDetails?.appointmentId}
        closeOnOutsideClick={true}
      >
        <EditAppointment patientDetails={patientDetails} />
      </Modal>
    </>
  )
}

const DropIndicator = ({ beforeId, stage }) => {
  return (
    <div
      data-before={beforeId || -1}
      data-stage={stage}
      className="my-0.5 h-0.5 w-full opacity-0"
    />
  )
}
const ConsultationFee = ({ patientDetails }) => {
  const user = useSelector(store => store.user)
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  const [selectedCoupon, setSelectedCoupon] = useState(null)
  const [discountedAmount, setDiscountedAmount] = useState(
    patientDetails?.amountToBePaid,
  )
  // const coupons = [
  //   { id: 1, code: 'FIRST50', discount: 50 },
  //   { id: 2, code: 'SAVE20', discount: 20 },
  //   { id: 3, code: 'SPECIAL30', discount: 30 },
  // ]
  const { data: coupons } = useQuery({
    queryKey: ['coupons'],
    queryFn: async () => {
      const res = await getCoupons(user.accessToken)
      return res.data
    },
  })
  const calculateDiscountedAmount = coupon => {
    if (!coupon) return patientDetails?.amountToBePaid
    const discount =
      (patientDetails?.amountToBePaid * coupon.discountPercentage) / 100
    return patientDetails?.amountToBePaid - discount
  }
  useEffect(() => {
    setDiscountedAmount(calculateDiscountedAmount(selectedCoupon))
  }, [selectedCoupon])
  const handlePayment = async (type, patientDetails) => {
    console.log(type, patientDetails)

    let payload = {
      totalOrderAmount: patientDetails?.amountToBePaid,
      paidOrderAmount: patientDetails?.paidOrderAmount,
      discountAmount:
        patientDetails?.amountToBePaid - patientDetails?.paidOrderAmount,

      couponCode: selectedCoupon?.id,
      orderDetails: [
        {
          appointmentId: patientDetails?.appointmentId,
          type: patientDetails?.type,
          totalCost: patientDetails?.amountToBePaid,
        },
      ],
      paymentMode: type, // ONLINE OR CASH
      productType: 'CONSULTATION FEE', //PHARMACY or LAB or SCAN or CONSULTATION FEE
    }
    if (type == 'ONLINE') {
      const order = await getOrderId(user?.accessToken, payload)
      console.log(order)
      if (order.status == 200) {
        let options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_ID,
          amount: order.data.totalOrderAmount * 100, //{data.amount}
          currency: 'INR',
          name: 'Origins',

          image:
            'https://img.freepik.com/premium-vector/charity-abstract-logo-healthy-lifestyle_660762-34.jpg?size=626&ext=jpg',
          description: 'Test Transaction',
          order_id: order.data.orderId, //{ data.orderId}
          'theme.color': '#FF6C22',
          handler: async response => {
            console.log(response)
            const order_details = {
              orderId: response.razorpay_order_id,
              transactionId: response.razorpay_payment_id,
            }
            const p = await sendTransactionId(user.accessToken, order_details)
            console.log(p)
            if (order_details && order_details.transactionId) {
              dispatch(
                closeModal('consultationFee' + patientDetails?.appointmentId),
              )
              toast.success('Payment successful thorugh online', toastconfig)
              // setPayClicked(null)
              queryClient.invalidateQueries('allAppointments')
            }
          },
        }
        const paymentObject = new window.Razorpay(options)
        paymentObject.open()
        paymentObject.on('payment.failed', function(response) {
          console.log(response.error.code)
          console.log(response.error.description)
          console.log(response.error.source)
        })

        paymentObject.on('payment.success', function(response) {
          //queryClient.invalidateQueries(['pharmacyModuleInfoByDate'])
          console.log('on success ', response)
        })
      }
    } else if (type == 'CASH') {
      if (window.confirm('Are you sure you want to pay offline?')) {
        const order = await getOrderId(user?.accessToken, payload)
        console.log(order)
        if (order.status == 200) {
          toast.success('Payment successful thorugh cash', toastconfig)
          queryClient.invalidateQueries('allAppointments')
          dispatch(
            closeModal('consultationFee' + patientDetails?.appointmentId),
          )
        }
      }
    } else if (type == 'UPI') {
      if (window.confirm('Are you sure you want to pay UPI?')) {
        const order = await getOrderId(user?.accessToken, payload)
        console.log(order)
        if (order.status == 200) {
          toast.success('Payment successful thorugh UPI', toastconfig)
          queryClient.invalidateQueries('allAppointments')
          dispatch(
            closeModal('consultationFee' + patientDetails?.appointmentId),
          )
        }
      }
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Collect Consultation Fee
        </h2>
        <Divider />
      </div>

      {/* Bill Details Card */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center mb-3">
          <span className="text-gray-600">Doctor Name</span>
          <span className="font-medium">{patientDetails?.doctorName}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Base Amount</span>
          <span className="font-medium">
            ₹{patientDetails?.amountToBePaid}/-
          </span>
        </div>
      </div>

      {/* Coupon Section */}
      <div className="mb-6">
        <Autocomplete
          options={coupons}
          getOptionLabel={option =>
            `${option.couponCode} (${option.discountPercentage}% off)`
          }
          value={selectedCoupon}
          onChange={(event, newValue) => {
            console.log('newValue', newValue)
            setSelectedCoupon(newValue)
          }}
          renderInput={params => (
            <TextField
              {...params}
              label="Apply Coupon"
              variant="outlined"
              fullWidth
              size="medium"
            />
          )}
        />

        {/* Discount Details */}
        {selectedCoupon && (
          <div className="mt-4 space-y-2 bg-green-50 p-3 rounded-lg">
            <div className="flex justify-between text-green-600">
              <span>Discount ({selectedCoupon.discountPercentage}%)</span>
              <span>
                -₹
                {(patientDetails?.amountToBePaid - discountedAmount).toFixed(2)}
              </span>
            </div>
            <Divider />
            <div className="flex justify-between font-bold text-green-700">
              <span>Final Amount</span>
              <span>₹{Number(discountedAmount)?.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Payment Buttons */}
      <div className="grid grid-cols-3 gap-4">
        <Button
          color="success"
          variant="contained"
          className="capitalize py-3"
          onClick={() =>
            handlePayment('ONLINE', {
              ...patientDetails,
              totalOrderAmount: patientDetails?.amountToBePaid,
              paidOrderAmount: discountedAmount,
              couponCode: selectedCoupon?.id,
            })
          }
          startIcon={<CreditCard />}
          disabled={true}
        >
          Pay Online
        </Button>
        <Button
          color="success"
          variant="outlined"
          className="capitalize py-3"
          onClick={() =>
            handlePayment('UPI', {
              ...patientDetails,
              totalOrderAmount: patientDetails?.amountToBePaid,
              paidOrderAmount: discountedAmount,
              couponCode: selectedCoupon?.id,
            })
          }
          startIcon={<Money />}
        >
          Pay UPI
        </Button>
        <Button
          color="success"
          variant="outlined"
          className="capitalize py-3"
          onClick={() =>
            handlePayment('CASH', {
              ...patientDetails,
              totalOrderAmount: patientDetails?.amountToBePaid,
              paidOrderAmount: discountedAmount,
              couponCode: selectedCoupon?.id,
            })
          }
          startIcon={<Money />}
        >
          Pay Cash
        </Button>
      </div>
    </div>
  )
}
// const PendingAmount = ({ patientDetails, treatmentPendings }) => {
//   const user = useSelector(store => store.user)
//   const queryClient = useQueryClient()
//   const dispatch = useDispatch()

//   const [selectedMilestones, setSelectedMilestones] = useState([])
//   const [selectedCoupon, setSelectedCoupon] = useState(null)
//   const [discountedAmount, setDiscountedAmount] = useState(0)
//   const [discountedMilestones, setDiscountedMilestones] = useState([])
//   const [payableAmounts, setPayableAmounts] = useState({})
//   const [dueDates, setDueDates] = useState({})
//   const [comments, setComments] = useState({})
//   const isAdmin = user.roleDetails?.id === 1 || user.roleDetails?.id === 7

//   // Get coupons from API
//   const { data: coupons } = useQuery({
//     queryKey: ['coupons'],
//     queryFn: async () => {
//       const res = await getCoupons(user.accessToken)
//       return res.data
//     },
//   })

//   // Initialize payable amounts when milestones change
//   useEffect(() => {
//     const initialPayableAmounts = {}
//     treatmentPendings?.forEach(milestone => {
//       initialPayableAmounts[milestone.productTypeEnum] = milestone.pending_amount
//     })
//     setPayableAmounts(initialPayableAmounts)
//   }, [treatmentPendings])

//   // Calculate total payable amount based on selected milestones and payable amounts
//   const totalPayableAmount = useMemo(() => {
//     return selectedMilestones.reduce((sum, milestone) => {
//       return sum + Number(payableAmounts[milestone.productTypeEnum] || 0)
//     }, 0)
//   }, [selectedMilestones, payableAmounts])

//   // Handle payable amount change with validation
//   const handlePayableAmountChange = (productTypeEnum, value, pendingAmount) => {
//     const numValue = Number(value) || 0
//     // Ensure entered amount doesn't exceed pending amount
//     const validatedAmount = Math.min(numValue, pendingAmount)

//     setPayableAmounts(prev => ({
//       ...prev,
//       [productTypeEnum]: validatedAmount
//     }))
//   }

//   // Currency formatter
//   const formatCurrency = (amount) => {
//     return new Intl.NumberFormat('en-IN', {
//       style: 'currency',
//       currency: 'INR',
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2
//     }).format(amount)
//   }

//   // Calculate discounted milestones when coupon changes
//   useEffect(() => {
//     if (!selectedCoupon || selectedMilestones.length === 0) {
//       setDiscountedMilestones(selectedMilestones.map(milestone => ({
//         ...milestone,
//         originalAmount: payableAmounts[milestone.productTypeEnum],
//         discountedAmount: payableAmounts[milestone.productTypeEnum],
//         appliedDiscount: 0
//       })))
//       setDiscountedAmount(totalPayableAmount)
//       return
//     }

//     const discountPercentage = Number(selectedCoupon.discountPercentage)
//     const totalDiscount = (totalPayableAmount * discountPercentage) / 100

//     // Use original order from treatmentPendings for selected milestones
//     const orderedMilestones = treatmentPendings
//       .filter(pending => selectedMilestones.some(m => m.productTypeEnum === pending.productTypeEnum))

//     let remainingDiscount = totalDiscount
//     const updatedMilestones = orderedMilestones.map(milestone => {
//       const payableAmount = payableAmounts[milestone.productTypeEnum]
//       const maxDiscountForMilestone = payableAmount
//       const appliedDiscount = Math.min(remainingDiscount, maxDiscountForMilestone)
//       remainingDiscount -= appliedDiscount

//       return {
//         ...milestone,
//         originalAmount: payableAmount,
//         discountedAmount: payableAmount - appliedDiscount,
//         appliedDiscount
//       }
//     })

//     setDiscountedMilestones(updatedMilestones)
//     setDiscountedAmount(totalPayableAmount - totalDiscount)
//   }, [selectedCoupon, selectedMilestones, payableAmounts, totalPayableAmount, treatmentPendings])

//   // Handle milestone selection
//   const handleMilestoneSelect = (milestone) => {
//     setSelectedMilestones(prev => {
//       const isSelected = prev.some(m => m.productTypeEnum === milestone.productTypeEnum)
//       if (isSelected) {
//         return prev.filter(m => m.productTypeEnum !== milestone.productTypeEnum)
//       } else {
//         return [...prev, milestone]
//       }
//     })
//   }
//   const generatePaymentPayload = (paymentMode) => {
//     return {
//       packageDetails: null,
//       isPackageExists: patientDetails.isPackageExists,
//       visitId: patientDetails.visitId,
//       paymentMode: paymentMode,
//       orderDetails: selectedMilestones.map(milestone => {
//         const originalAmount = payableAmounts[milestone.productTypeEnum] || 0
//         const isDeferred = milestone.pending_amount > originalAmount
//         const remainingPending = milestone.pending_amount - originalAmount
//         const discountedItem = discountedMilestones.find(m => m.productTypeEnum === milestone.productTypeEnum)

//         return {
//           totalOrderAmount: String(milestone.pending_amount), // total to be paid
//           payableAmount: String(originalAmount), // paying amount for now
//           couponCode: selectedCoupon?.id || null, // optional
//           discountAmount: String(discountedItem?.appliedDiscount || 0), // discount amount
//           payableAfterDiscountAmount: String(originalAmount - (discountedItem?.appliedDiscount || 0)), // amount after discount
//           pendingOrderAmount: String(remainingPending),
//           productType: milestone.productTypeEnum,
//           appointmentId: patientDetails.appointmentId,
//           dateColumn: milestone.dateColumn || "NA",
//           mileStoneStartedDate: milestone.mileStoneStartedDate || "NA",
//           comments: isDeferred ? comments[milestone.productTypeEnum] || "" : "",
//           dueDate: isDeferred ? dueDates[milestone.productTypeEnum] || "" : ""
//         }
//       })
//     }
//   }
//   const handlePayment = async (paymentMode) => {
//     const payload = generatePaymentPayload(paymentMode)
//     console.log(payload)
//     if (paymentMode === 'CASH') {
//       if (window.confirm('Are you sure you want to pay offline?')) {
//         const order = await getOrderIdTreatment(user?.accessToken, payload)
//         if (order.status === 200) {
//           toast.success('Payment successful through cash', toastconfig)
//           queryClient.invalidateQueries('allAppointments')
//           setSelectedMilestones([])
//           setDueDates({})
//           setComments({})
//           setSelectedCoupon(null)
//           setPayableAmounts({})
//           setDiscountedMilestones([])
//           setDiscountedAmount(0)
//         }
//       }
//     }
//     else if (paymentMode === 'ONLINE') {
//       const order = await getOrderIdTreatment(user?.accessToken, payload)
//       if (order.status === 200) {
//         let options = {
//           key: `process.env.NEXT_PUBLIC_RAZORPAY_KEY`,
//           amount: order.data.totalOrderAmount * 100,
//           currency: 'INR',
//           name: 'Origins',
//           image: 'https://img.freepik.com/premium-vector/charity-abstract-logo-healthy-lifestyle_660762-34.jpg?size=626&ext=jpg',
//           description: 'Test Transaction',
//           order_id: order.data.orderId,
//           'theme.color': '#FF6C22',
//           handler: async response => {
//             const order_details = {
//               visitId: order.data.visitId,
//               appointmentId: patientDetails.appointmentId,
//               orderId: response.razorpay_order_id,
//               transactionId: response.razorpay_payment_id,
//               packageDetails: order.data.packageDetails,
//               isPackageExists: order.data.isPackageExists,
//               dateColumns: order.data.dateColumns
//             }
//             const p = await sendTransactionDetailsTreatment(user.accessToken, order_details)
//             if (p.status === 200) {
//               toast.success('Payment successful through online', toastconfig)
//               queryClient.invalidateQueries('allAppointments')
//               setSelectedMilestones([])
//               setDueDates({})
//               setComments({})
//               setSelectedCoupon(null)
//               setPayableAmounts({})
//               setDiscountedMilestones([])
//               setDiscountedAmount(0)
//             }
//           },
//         }

//         const paymentObject = new window.Razorpay(options)
//         paymentObject.open()

//         paymentObject.on('payment.failed', function (response) {
//           console.log(response.error.code)
//           console.log(response.error.description)
//           console.log(response.error.source)
//         })

//         paymentObject.on('payment.success', function (response) {
//           console.log('on success ', response)
//         })
//       }
//     }
//   }

//   return (
//     <>
//       <div className="flex justify-between items-center">
//         <h2 className="text-xl font-semibold text-secondary">
//           Collect Pending Amount
//         </h2>
//         <IconButton onClick={() => dispatch(closeModal())}>
//           <Close />
//         </IconButton>
//       </div>

//       {treatmentPendings && (
//         <div className="mt-6">
//           {/* Milestone List */}
//           <div className="space-y-2">
//             {treatmentPendings.map((item, index) => {
//               const isSelected = selectedMilestones.some(m => m.productTypeEnum === item.productTypeEnum)
//               const isDeferred = item.pending_amount > payableAmounts[item.productTypeEnum]

//               const discountedItem = discountedMilestones.find(
//                 m => m.productTypeEnum === item.productTypeEnum
//               )
//               const remainingPending = item.pending_amount - (payableAmounts[item.productTypeEnum] || 0)
//               // const discountPosition = getMilestoneDiscountPosition(item)

//               return (
//                 <div
//                   key={index}
//                   className={`flex flex-col justify-between p-3 rounded-lg border
//                     ${selectedMilestones.some(m => m.productTypeEnum === item.productTypeEnum)
//                       ? 'bg-primary/20' : ' bg-white'}
//                     `}
//                 >
//                   <div className="flex items-center justify-between gap-3">
//                     <div className={`flex items-center gap-3 `}>
//                       <Checkbox
//                         checked={selectedMilestones.some(m => m.productTypeEnum === item.productTypeEnum)}
//                         onChange={() => handleMilestoneSelect(item)}
//                         disabled={item.mileStoneStartedDate === 'NA' || item.pending_amount === 0}
//                       />
//                       <div>
//                         <Typography variant="subtitle1">{item.displayName}</Typography>
//                         {item.mileStoneStartedDate !== 'NA' && (
//                           <Typography variant="caption" className="text-gray-500">
//                             Milestone Started on {dayjs(item.mileStoneStartedDate).format('DD MMM YYYY')}
//                           </Typography>
//                         )}
//                         <div className="flex flex-col mt-1">
//                           <Typography variant="caption" className="text-blue-600">
//                             Total Pending: {formatCurrency(item.pending_amount)}
//                           </Typography>
//                           {remainingPending > 0 && payableAmounts[item.productTypeEnum] > 0 && (
//                             <Typography variant="caption" className="text-orange-600">
//                               Will Remain: {formatCurrency(remainingPending)}
//                             </Typography>
//                           )}
//                         </div>
//                       </div>

//                     </div>
//                     <div className="text-right flex flex-col gap-2">
//                       {isAdmin && item.mileStoneStartedDate !== 'NA' ? (
//                         <TextField
//                           type="number"
//                           size="small"
//                           label="Payable Amount"
//                           value={payableAmounts[item.productTypeEnum] || ''}
//                           onChange={(e) => handlePayableAmountChange(
//                             item.productTypeEnum,
//                             e.target.value,
//                             item.pending_amount
//                           )}
//                           disabled={!selectedMilestones.some(m => m.productTypeEnum === item.productTypeEnum)}
//                           InputProps={{
//                             startAdornment: <span className="text-gray-500 mr-1">₹</span>,
//                             inputProps: {
//                               min: 0,
//                               max: item.pending_amount,
//                               step: "0.01"
//                             }
//                           }}
//                         // helperText={`Max: ${formatCurrency(item.pending_amount)}`}
//                         />
//                       ) : (
//                         <Typography variant="subtitle1" className="font-medium">
//                           {formatCurrency(payableAmounts[item.productTypeEnum] || 0)}
//                         </Typography>
//                       )}

//                       {/* discount information */}
//                       {discountedItem && discountedItem.appliedDiscount > 0 && (
//                         <div className="space-y-1">
//                           <Typography variant="caption" className="text-green-600">
//                             After discount: {formatCurrency(discountedItem.discountedAmount)}
//                           </Typography>
//                           {/* <Typography variant="caption" className="text-gray-500">
//                           Discount priority: {discountPosition}
//                         </Typography> */}
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                   {remainingPending > 0 && (
//                     <div className="grid grid-cols-2 gap-4 mt-2">
//                       <DatePicker
//                         label="Due Date"
//                         value={dueDates[item.productTypeEnum] ? dayjs(dueDates[item.productTypeEnum]) : null}
//                         onChange={(newDate) => {
//                           if (newDate) {
//                             setDueDates(prev => ({
//                               ...prev,
//                               [item.productTypeEnum]: dayjs(newDate).format('YYYY-MM-DD')
//                             }))
//                           } else {
//                             // Handle null/cleared date
//                             setDueDates(prev => {
//                               const updated = { ...prev }
//                               delete updated[item.productTypeEnum]
//                               return updated
//                             })
//                           }
//                         }}
//                         format='DD/MM/YYYY'
//                         minDate={dayjs().add(1, 'day')}
//                         slotProps={{
//                           textField: {
//                             size: "small",
//                             error: false
//                           }
//                         }}
//                       />
//                       <TextField
//                         label="Comments"
//                         size="small"
//                         value={comments[item.productTypeEnum] || ''}
//                         onChange={(e) => setComments(prev => ({
//                           ...prev,
//                           [item.productTypeEnum]: e.target.value
//                         }))}
//                         placeholder="Enter payment comments"
//                       />
//                     </div>
//                   )}
//                 </div>
//               )
//             })}
//           </div>

//           {/* Coupon Section */}
//           {selectedMilestones.length > 0 && (
//             <div className="mt-4">
//               <Autocomplete
//                 options={coupons || []}
//                 getOptionLabel={option => `${option.couponCode} (${option.discountPercentage}% off)`}
//                 value={selectedCoupon}
//                 onChange={(event, newValue) => setSelectedCoupon(newValue)}
//                 renderInput={params => (
//                   <TextField
//                     {...params}
//                     label="Apply Coupon"
//                     variant="outlined"
//                     size="medium"
//                   />
//                 )}
//               />
//               {/* {selectedCoupon && (
//                 <Typography variant="caption" className="mt-2 text-gray-600 block">
//                   Discount will be applied sequentially in milestone order
//                 </Typography>
//               )} */}
//             </div>
//           )}

//           {/* Payment Summary */}
//           {selectedMilestones.length > 0 && (
//             <div className="mt-6 p-4 bg-gray-50 rounded-lg">
//               <Typography variant="h6" className="mb-3">Payment Summary</Typography>
//               <div className="space-y-2">
//                 <div className="flex justify-between">
//                   <span>Total Selected Amount</span>
//                   <span>{formatCurrency(totalPayableAmount)}</span>
//                 </div>
//                 {selectedCoupon && (
//                   <div className="flex justify-between text-green-600">
//                     <span>Discount ({selectedCoupon.discountPercentage}%)</span>
//                     <span>-{formatCurrency(totalPayableAmount - discountedAmount)}</span>
//                   </div>
//                 )}
//                 <Divider />
//                 <div className="flex justify-between font-bold">
//                   <span>Final Amount</span>
//                   <span>{formatCurrency(discountedAmount)}</span>
//                 </div>
//               </div>

//               {/* Payment Buttons */}
//               <div className="grid grid-cols-2 gap-4 mt-4">
//                 <Button
//                   color="success"
//                   variant="contained"
//                   className="capitalize py-3"
//                   onClick={() => handlePayment('ONLINE')}
//                   startIcon={<CreditCard />}
//                 >
//                   Pay Online
//                 </Button>
//                 <Button
//                   color="success"
//                   variant="outlined"
//                   className="capitalize py-3"
//                   onClick={() => handlePayment('CASH')}
//                   startIcon={<Money />}
//                 >
//                   Pay Cash
//                 </Button>
//               </div>
//             </div>
//           )}
//         </div>
//       )}
//     </>
//   )
// }

const EditAppointment = ({ patientDetails }) => {
  const userDetails = useSelector(store => store.user)
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  const [editAppointmentForm, setEditAppointmentForm] = useState({})

  const { data: doctorsList } = useQuery({
    queryKey: ['doctors', editAppointmentForm?.date],
    queryFn: () =>
      getDoctorsForAvailabilityConsultation(
        userDetails?.accessToken,
        editAppointmentForm?.appointmentDate,
      ),
    enabled: !!editAppointmentForm?.appointmentDate,
  })

  const { data: availableSlots } = useQuery({
    queryKey: [
      'availableSlots',
      editAppointmentForm?.date,
      editAppointmentForm?.doctorId,
    ],
    queryFn: () =>
      getAvailableConsultationSlots(userDetails?.accessToken, {
        date: editAppointmentForm?.appointmentDate,
        doctorId: editAppointmentForm?.doctorId,
      }),
    enabled:
      !!editAppointmentForm?.appointmentDate && !!editAppointmentForm?.doctorId,
  })

  const handleEditChangeForm = event => {
    setEditAppointmentForm({
      ...editAppointmentForm,
      [event.target.name]: event.target.value,
    })
  }

  const editAppointmentClick = async () => {
    const sendEditPayload = {
      id: patientDetails?.appointmentId,
      appointmentDate: editAppointmentForm?.appointmentDate,
      consultationDoctorId: editAppointmentForm?.doctorId,
      timeStart: editAppointmentForm?.timeslot?.split('-')[0].trim(),
      timeEnd: editAppointmentForm?.timeslot?.split('-')[1].trim(),
      type: patientDetails?.type,
    }

    const editResp = await editAppointment(
      userDetails?.accessToken,
      sendEditPayload,
    )
    dispatch(closeModal())

    if (editResp?.status === 200) {
      queryClient.invalidateQueries(['consultationAppointments'])
      toast.success('Appointment Edited Successfully')
    } else {
      toast.error(editResp?.message)
    }
  }
  return (
    <div className="flex flex-col items-center justify-center py-2 space-y-4">
      <p className="text-2xl mb-2 font-semibold text-secondary flex items-center gap-4">
        <CalendarIcon className="" />
        Edit Appointment for {patientDetails?.patientName}
      </p>
      <div className="flex flex-col mt-2 gap-5">
        <DatePicker
          label="Appointment Date"
          format="DD/MM/YYYY"
          className="bg-white rounded-lg"
          value={
            editAppointmentForm?.appointmentDate
              ? dayjs(editAppointmentForm?.appointmentDate)
              : null
          }
          name="appointmentDate"
          onChange={newValue =>
            setEditAppointmentForm({
              ...editAppointmentForm,
              appointmentDate: dayjs(newValue).format('YYYY-MM-DD'),
            })
          }
        />

        <FormControl fullWidth>
          <InputLabel id="demo-simple-select-label">Doctor</InputLabel>
          <Select
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            className="bg-white rounded-lg"
            value={
              editAppointmentForm?.doctorId ? editAppointmentForm.doctorId : ''
            }
            name="doctorId"
            label="Doctor"
            onChange={handleEditChangeForm}
          >
            {doctorsList?.data?.map(each => (
              <MenuItem key={each.doctorId} value={each.doctorId}>
                {each.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth>
          <InputLabel id="demo-simple-select-label">Time Slot</InputLabel>
          <Select
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            className="bg-white rounded-lg"
            value={
              editAppointmentForm?.timeslot ? editAppointmentForm.timeslot : ''
            }
            name="timeslot"
            label="Time Slot"
            onChange={handleEditChangeForm}
          >
            {availableSlots?.data?.map(each => (
              <MenuItem key={each} value={each}>
                {each}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button onClick={editAppointmentClick} variant="outlined">
          Edit Appointment
        </Button>
      </div>
    </div>
  )
}

const NoShow = ({ patientDetails }) => {
  const user = useSelector(store => store.user)
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  const [noShowReason, setNoShowReason] = useState(null)

  const handleNoShow = async () => {
    const noShowPayload = {
      appointmentId: patientDetails?.appointmentId,
      type: patientDetails?.type,
      noShowReason: noShowReason,
    }
    const noShowResponse = await applyNoShow(user?.accessToken, noShowPayload)
    if (noShowResponse.status === 200) {
      toast.success('No-Show Applied Successfully', toastconfig)
      queryClient.invalidateQueries('allAppointments')
    } else {
      toast.error('Something went wrong', toastconfig)
    }
    dispatch(closeModal('noShow' + patientDetails?.appointmentId))
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 space-y-4">
      <h5 className="text-xl font-semibold">
        No Show for {patientDetails?.patientName}
      </h5>
      <p>Please enter the reason and proceed further</p>
      <TextField
        label="No Show Reason"
        variant="outlined"
        fullWidth
        value={noShowReason}
        onChange={e => setNoShowReason(e.target.value)}
      />
      <Button
        variant="contained"
        color="error"
        onClick={handleNoShow}
        className="capitalize"
        disabled={!noShowReason}
      >
        Apply No Show
      </Button>
    </div>
  )
}

export function PatientFullDetail({
  patientDetails,
  lineBillsAndNotesData,
  islineBillsAndNotesDataLoading,
  previewContent,
  setPreviewContent,
}) {
  const [horizontalTabInModal, setHorizontalTabInModal] = useState()
  const dispatch = useDispatch()
  const user = useSelector(store => store.user)
  // console.log(lineBillsAndNotesData)
  const queryClient = useQueryClient()
  const router = useRouter()
  const [printTemplate, setPrintTemplate] = useState(null)
  const editor = useRef(null)
  const [showPrescriptionPreview, setShowPrescriptionPreview] = useState(false)

  function handleHorizontalTabChangeInModal(e, newTab) {
    setHorizontalTabInModal(newTab)
  }
  useEffect(() => {
    if (
      lineBillsAndNotesData?.lineBillsData?.length > 0 &&
      !horizontalTabInModal
    ) {
      setHorizontalTabInModal(
        lineBillsAndNotesData.lineBillsData[0].billType.name,
      )
    }
  }, [lineBillsAndNotesData])

  const handlePaymentMethodOffline = async (e, bill, type = 'CASH') => {
    //confirm yes or no similar to alert()
    if (window.confirm('Are you sure you want to pay offline / UPI?')) {
      console.log(bill, e.target.name)
      const detailsCopy = bill.billTypeValues
      //refid, type, itemName, purchaseDetails, totalCost
      let paymentDBFormat = []
      detailsCopy.map(eachInfo => {
        paymentDBFormat.push({
          refId: eachInfo.refId,
          itemName: eachInfo.name,
          prescribed: eachInfo.prescribedQuantity,
          // prescriptionDetails: eachInfo.prescriptionDetails,
          totalCost: eachInfo.amount,
          type: bill.type,
        })
      })
      // const totalAmout = detailsCopy.reduce(function (acc, obj) {
      //   return acc + Number(obj.amount)
      // }, 0)
      // console.log(totalAmout)

      try {
        const data = await getOrderId(user?.accessToken, {
          totalOrderAmount: bill.totalAmount,
          paidOrderAmount: bill.discountedAmount,
          discountAmount: bill.totalAmount - bill.discountedAmount,
          couponCode: bill.couponCode,
          orderDetails: paymentDBFormat,
          paymentMode: type === 'UPI' ? 'UPI' : 'CASH', // ONLINE OR CASH
          productType: e.target.name.toUpperCase(), //PHARMACY or LAB or SCAN
        })

        if (data.status == 200) {
          queryClient.invalidateQueries({
            queryKey: ['getLineBills', patientDetails?.appointmentId],
          })
        }
      } catch (error) {
        console.log('Error fetching Order ID:', error)
      }
    }

    // setIsLoading(false)
  }

  const handlePaymentMethodOnline = async (e, bill) => {
    console.log(bill, e.target.name)
    const detailsCopy = bill.billTypeValues
    //refid, type, itemName, purchaseDetails, totalCost
    let paymentDBFormat = []
    detailsCopy.map(eachInfo => {
      paymentDBFormat.push({
        refId: eachInfo.refId,
        itemName: eachInfo.name,
        prescribed: eachInfo.prescribedQuantity,
        // prescriptionDetails: eachInfo.prescriptionDetails,
        totalCost: eachInfo.amount,
        type: bill.type,
      })
    })
    // const totalAmout = detailsCopy.reduce(function (acc, obj) {
    //   return acc + Number(obj.amount)
    // }, 0)
    // console.log(totalAmout)

    try {
      const data = await getOrderId(user?.accessToken, {
        totalOrderAmount: bill.totalAmount,
        paidOrderAmount: bill.discountedAmount,
        discountAmount: bill.totalAmount - bill.discountedAmount,
        couponCode: bill.couponCode,
        orderDetails: paymentDBFormat,
        paymentMode: 'ONLINE', // ONLINE OR CASH
        productType: e.target.name.toUpperCase(), //PHARMACY or LAB or SCAN
      })

      let options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_ID,
        amount: data.data.totalOrderAmount * 100, //{data.amount}
        currency: 'INR',
        name: 'Origins',

        image:
          'https://img.freepik.com/premium-vector/charity-abstract-logo-healthy-lifestyle_660762-34.jpg?size=626&ext=jpg',
        description: 'Test Transaction',
        order_id: data.data.orderId, //{ data.orderId}
        'theme.color': '#FF6C22',
        handler: async response => {
          console.log(response)
          const order_details = {
            orderId: response.razorpay_order_id,
            transactionId: response.razorpay_payment_id,
            // ,
            // transactionType: response.razorpay_signature,
          }
          // handle payment success
          // write a mutate and invalidate the getPharmacyDetails
          const p = await sendTransactionId(user.accessToken, order_details)
          console.log(p)
          if (p.status == 200) {
            // dispatch(closeModal())
            // setPayClicked(null)
            queryClient.invalidateQueries({
              queryKey: ['getLineBills', patientDetails?.appointmentId],
            })
          }
        },
      }

      const paymentObject = new window.Razorpay(options)
      paymentObject.open()

      paymentObject.on('payment.failed', function(response) {
        console.log(response.error.code)
        console.log(response.error.description)
        console.log(response.error.source)
      })

      paymentObject.on('payment.success', function(response) {
        //queryClient.invalidateQueries(['pharmacyModuleInfoByDate'])
        console.log('on success ', response)
      })
    } catch (error) {
      console.log('Error fetching Order ID:', error)
    }
    // setIsLoading(false)
  }

  const handlePrintInvoice = async (e, bill) => {
    try {
      dispatch(showLoader())
      const res = await Generate_Invoice(user?.accessToken, {
        appointmentId: bill.appointmentId,
        productType: e.target.name.toUpperCase(),
        type: bill.type,
      })

      if (res.status === 200) {
        setPreviewContent(res.data)
        dispatch(openModal('print-preview' + bill.appointmentId))
      } else {
        toast.error('Failed to generate invoice', toastconfig)
      }
    } catch (error) {
      console.error('Error generating invoice:', error)
      toast.error('Error generating invoice' + error, toastconfig)
    } finally {
      dispatch(hideLoader())
    }
  }

  const [selectedCoupons, setSelectedCoupons] = useState({})
  const [discountedAmounts, setDiscountedAmounts] = useState({})

  // Sample coupon data (replace with your API call)
  // const coupons = [
  //   {
  //     id: 1,
  //     couponCode: 'CONSULTATION_50',
  //     discountPercentage: '25.00',
  //     isActive: 1,
  //     createdAt: '2024-11-17',
  //     createdBy: 'Dr Aadesh',
  //   },
  //   {
  //     id: 2,
  //     couponCode: 'Free Campaign',
  //     discountPercentage: '20.00',
  //     isActive: 1,
  //     createdAt: '2024-11-17',
  //     createdBy: 'Aadesh Admin',
  //   },
  //   {
  //     id: 3,
  //     couponCode: 'Bread2',
  //     discountPercentage: '50.00',
  //     isActive: 1,
  //     createdAt: '2024-11-17',
  //     createdBy: 'Aadesh Admin',
  //   },
  //   {
  //     id: 4,
  //     couponCode: 'Bread',
  //     discountPercentage: '55.00',
  //     isActive: 1,
  //     createdAt: '2024-11-17',
  //     createdBy: 'Aadesh Admin',
  //   },
  //   {
  //     id: 5,
  //     couponCode: 'Coupon50',
  //     discountPercentage: '50.00',
  //     isActive: 1,
  //     createdAt: '2024-11-17',
  //     createdBy: 'Aadesh Admin',
  //   },
  // ]
  const { data: coupons } = useQuery({
    queryKey: ['coupons'],
    queryFn: async () => {
      const res = await getCoupons(user.accessToken)
      return res.data
    },
  })

  const calculateBillTotal = billTypeValues => {
    return billTypeValues?.reduce(
      (sum, value) => sum + Number(value.amount || 0),
      0,
    )
  }

  const calculateDiscountedAmount = (total, coupon) => {
    if (!coupon) return total
    const discount = (total * Number(coupon.discountPercentage)) / 100
    return total - discount
  }

  const handlePrintPrescription = async () => {
    try {
      dispatch(showLoader())
      const response = await printPrescription(user.accessToken, {
        type: patientDetails?.type,
        appointmentId: patientDetails?.appointmentId,
        isSpouse: 0,
      })

      if (response.status === 200) {
        setPrintTemplate(response?.data)
        setShowPrescriptionPreview(true)
      } else {
        toast.error('Failed to fetch print template', toastconfig)
      }
    } catch (error) {
      console.error(error)
      toast.error(
        'An error occurred while fetching print template',
        toastconfig,
      )
    } finally {
      dispatch(hideLoader())
    }
  }

  const { mutate: downloadOpdSheet } = useMutation({
    mutationFn: async () => {
      if (!patientDetails?.patientId) {
        throw new Error('Patient information not available')
      }
      dispatch(showLoader())
      const response = await downloadOPDSheet(
        user.accessToken,
        patientDetails.patientAutoId,
      )
      if (response.status === 200) {
        downloadPDF(response)
        toast.success('OPD Sheet downloaded successfully')
      } else if (response.status === 400) {
        toast.error(response.data?.message || 'Data not found')
      } else {
        toast.error(response.data?.message || 'Error downloading OPD sheet')
      }
      dispatch(hideLoader())
      return response
    },
  })
  // const handlePrint = useReactToPrint({
  //   content: () => editor.current,
  //   onAfterPrint: () => {
  //     toast.success('Prescription printed successfully', toastconfig)
  //   },
  //   onPrintError: () => {
  //     toast.error('Failed to print prescription', toastconfig)
  //   },
  // })

  // Extract BillTypePanel as a separate component

  // Update the TabPanel rendering in the main return
  return (
    <div className="bg-white flex flex-col gap-3 min-w-96">
      {!showPrescriptionPreview ? (
        // Regular patient details view
        <>
          <div className="flex flex-row gap-8 p-4">
            {patientDetails?.photoPath != null &&
            patientDetails?.photoPath != 'null' ? (
              <img
                src={patientDetails.photoPath}
                alt="profilePic"
                width={100}
                height={100}
                className="rounded-full aspect-square object-cover"
              />
            ) : (
              <div className="w-[100px] h-[100px] rounded-full bg-secondary/10 flex items-center justify-center">
                <span className="text-4xl font-semibold text-secondary">
                  {patientDetails?.patientName?.charAt(0)?.toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex flex-col gap-1 justify-center">
              <div className="flex">
                <span className="font-semibold text-3xl tracking-wide">
                  {patientDetails?.patientName}
                </span>
              </div>
              <div className="flex flex-row gap-3">
                <span className="text-base">
                  {patientDetails?.doctorName} |
                </span>
                <span className="text-base">{patientDetails?.type} |</span>
                <span className="text-base flex items-center gap-1">
                  <FiClock />
                  {patientDetails?.timeStart}
                </span>
              </div>
              <div className="flex flex-row gap-3">
                <Button
                  variant="text"
                  className="text-xs capitalize"
                  onClick={() => {
                    router.push(
                      {
                        pathname: '/patient',
                        query: {
                          patientHistoryId: patientDetails?.patientId,
                          activeVisitId: patientDetails?.visitId,
                          returnPath: router.asPath, // Store current path to return after viewing history
                        },
                      },
                      undefined,
                      { shallow: true },
                    )
                  }}
                >
                  View Patient History
                </Button>
                <Divider orientation="vertical" flexItem />
                <Button
                  className="capitalize"
                  // variant="outlined"
                  onClick={handlePrintPrescription}
                >
                  Print
                </Button>
                <Divider orientation="vertical" flexItem />
                <Button
                  className="capitalize"
                  // variant="outlined"
                  onClick={() => downloadOpdSheet()}
                >
                  Print OPD
                </Button>
              </div>
            </div>
          </div>

          {/* <hr className="my-2 text-secondary" /> */}
          {/* <Divider /> */}
          {islineBillsAndNotesDataLoading ? (
            <BillDataFallBack />
          ) : (
            <>
              <RichText
                value={
                  lineBillsAndNotesData.notesData.notes || 'No Notes Provided'
                }
                readOnly={true}
              />
              <div className="flex flex-col shadow  px-2 my-2 w-full overflow-auto">
                {lineBillsAndNotesData?.lineBillsData?.length > 0 ? (
                  <TabContext value={horizontalTabInModal}>
                    <Box
                      className="w-max h-full"
                      sx={{
                        paddingTop: '12px',
                        paddingLeft: '12px',
                        borderBottom: 1,
                        borderColor: 'divider',
                      }}
                    >
                      <TabList
                        onChange={handleHorizontalTabChangeInModal}
                        aria-label="line bills and notes"
                      >
                        {lineBillsAndNotesData?.lineBillsData?.map(bill => (
                          <Tab
                            key={bill.billType.id}
                            label={bill.billType.name}
                            value={bill.billType.name}
                            // className="capitalize font-semibold"
                          />
                        ))}
                      </TabList>
                    </Box>
                    {lineBillsAndNotesData?.lineBillsData?.map(bill => (
                      <TabPanel
                        className="p-3 h-auto min-w-full"
                        key={
                          bill.billType.id +
                          '-' +
                          bill.billType.name +
                          '-' +
                          bill.appointmentId
                        }
                        value={bill.billType.name}
                      >
                        {bill?.billTypeValues?.length > 0 ? (
                          <BillTypePanel
                            bill={bill}
                            coupons={coupons}
                            handlePaymentMethodOnline={
                              handlePaymentMethodOnline
                            }
                            handlePaymentMethodOffline={
                              handlePaymentMethodOffline
                            }
                            handlePrintInvoice={handlePrintInvoice}
                            appointmentId={bill.appointmentId}
                          />
                        ) : (
                          <div className="h-full flex justify-center items-center">
                            <span className="opacity-50">No Data</span>
                          </div>
                        )}
                      </TabPanel>
                    ))}
                  </TabContext>
                ) : (
                  <div className="grow flex justify-center items-center">
                    <span className="opacity-50">{'No Line Bills Data'}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      ) : (
        // Prescription Preview
        <div className="flex flex-col gap-4 p-4">
          <div className="flex justify-between items-center">
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={() => setShowPrescriptionPreview(false)}
            >
              Back
            </Button>
            {/* <Button
              variant="contained"
              startIcon={<Print />}
            // onClick={handlePrint}
            >
              Print
            </Button> */}
          </div>

          <div className="border rounded-lg p-4 bg-white">
            <div ref={editor}>
              <JoditEditor
                value={printTemplate}
                config={{
                  readonly: true,
                  toolbar: true,
                  statusbar: false,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const BillTypePanel = React.memo(
  ({
    bill,
    coupons,
    handlePaymentMethodOnline,
    handlePaymentMethodOffline,
    handlePrintInvoice,
    appointmentId,
  }) => {
    const [selectedCoupon, setSelectedCoupon] = useState(null)
    const [dueItems, setDueItems] = useState([])
    const [paidItems, setPaidItems] = useState([])
    const [optOutItems, setOptOutItems] = useState([])
    const [selectedItems, setSelectedItems] = useState([])
    const [activeTab, setActiveTab] = useState('patient') // New state for patient/spouse tabs
    const user = useSelector(store => store.user)
    const queryClient = useQueryClient()

    // Initialize items on component mount or when bill changes
    useEffect(() => {
      const due =
        bill.billTypeValues?.filter(item => item.status === 'DUE') || []
      const paid =
        bill.billTypeValues?.filter(item => item.status === 'PAID') || []
      const optOut =
        bill.billTypeValues?.filter(item => item.status === 'OPT_OUT') || []
      setDueItems(due)
      setPaidItems(paid)
      setOptOutItems(optOut)
      // Only select items for the active tab (patient/spouse)
      setSelectedItems(
        due
          .filter(item =>
            activeTab === 'patient' ? item.isSpouse === 0 : item.isSpouse === 1,
          )
          .map(item => item.id + '-' + item.name + '-' + item.isSpouse),
      )
    }, [bill.billTypeValues, activeTab])

    // Filter items based on active tab
    const filteredDueItems = dueItems.filter(item =>
      activeTab === 'patient' ? item.isSpouse === 0 : item.isSpouse === 1,
    )
    const filteredPaidItems = paidItems.filter(item =>
      activeTab === 'patient' ? item.isSpouse === 0 : item.isSpouse === 1,
    )
    const filteredOptOutItems = optOutItems.filter(item =>
      activeTab === 'patient' ? item.isSpouse === 0 : item.isSpouse === 1,
    )

    // Handle opt-out mutation
    const optOutMutation = useMutation({
      mutationFn: async ({ ids, isOptOut }) => {
        const response = await applyOptOut(user.accessToken, {
          id: ids,
          type: bill.type,
          isOptOut: isOptOut,
        })
        if (response.status !== 200)
          throw new Error('Failed to update opt-out status')
        return response.data
      },
      onSuccess: () => {
        queryClient.invalidateQueries(['getLineBills', bill.appointmentId])
        toast.success('Successfully updated opt-out status', toastconfig)
      },
      onError: error => {
        toast.error(
          'Failed to update opt-out status: ' + error.message,
          toastconfig,
        )
      },
    })

    const handleOptOut = async () => {
      const selectedRefIds = filteredDueItems
        .filter(item =>
          selectedItems.includes(
            item.id + '-' + item.name + '-' + item.isSpouse,
          ),
        )
        .map(item => item.refId)

      if (selectedRefIds.length === 0) return

      if (
        window.confirm(
          'Are you sure you want to mark these items as opted out?',
        )
      ) {
        optOutMutation.mutate({ ids: selectedRefIds, isOptOut: 1 })
      }
    }

    const handleUndoOptOut = async refId => {
      if (window.confirm('Are you sure you want to undo the opt-out status?')) {
        optOutMutation.mutate({ ids: [refId], isOptOut: 0 })
      }
    }

    // Calculate totals ONLY for selected due items
    const dueBillTotal = filteredDueItems
      .filter(item =>
        selectedItems.includes(item.id + '-' + item.name + '-' + item.isSpouse),
      )
      .reduce((sum, item) => sum + Number(item.amount || 0), 0)

    const discountedAmount = useMemo(() => {
      if (!selectedCoupon) return dueBillTotal
      const discount =
        (dueBillTotal * Number(selectedCoupon.discountPercentage)) / 100
      return dueBillTotal - discount
    }, [dueBillTotal, selectedCoupon])

    // Handle checkbox changes
    const handleCheckboxChange = itemId => {
      setSelectedItems(prev =>
        prev.includes(itemId)
          ? prev.filter(id => id !== itemId)
          : [...prev, itemId],
      )
    }

    // Handle master checkbox for filtered items
    const handleMasterCheckboxChange = () => {
      if (selectedItems.length === filteredDueItems.length) {
        setSelectedItems([])
      } else {
        setSelectedItems(
          filteredDueItems.map(
            item => item.id + '-' + item.name + '-' + item.isSpouse,
          ),
        )
      }
    }

    return (
      <div className="space-y-6">
        {/* Tabs for Patient/Spouse */}
        <div className="bg-red-50 p-3  flex gap-4 rounded-lg">
          <Typography variant="h6" className="text-red-700">
            Pending Payments
          </Typography>
          <div className="flex gap-4 border-b pb-2">
            <Button
              variant={activeTab === 'patient' ? 'contained' : 'outlined'}
              onClick={() => setActiveTab('patient')}
              className={`capitalize border-none ${
                activeTab === 'patient'
                  ? 'bg-red-500 text-white'
                  : 'bg-white text-red-700'
              }`}
              size="small"
            >
              Patient
            </Button>
            <Button
              variant={activeTab === 'spouse' ? 'contained' : 'outlined'}
              onClick={() => setActiveTab('spouse')}
              className={`capitalize border-none ${
                activeTab === 'spouse'
                  ? 'bg-red-500 text-white'
                  : 'bg-white text-red-700'
              }`}
              size="small"
            >
              Spouse
            </Button>
          </div>
        </div>

        {filteredDueItems.length > 0 ? (
          <div className="border rounded-lg overflow-hidden">
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    {bill.billType?.id !== 3 && (
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={
                            selectedItems.length === filteredDueItems.length &&
                            filteredDueItems.length > 0
                          }
                          indeterminate={
                            selectedItems.length > 0 &&
                            selectedItems.length < filteredDueItems.length
                          }
                          onChange={handleMasterCheckboxChange}
                        />
                      </TableCell>
                    )}
                    <TableCell className="font-semibold">Medication</TableCell>
                    {bill.billType?.id == 3 ? (
                      <TableCell className="font-semibold">Quantity</TableCell>
                    ) : (
                      <TableCell className="font-semibold">Amount</TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredDueItems.map(value => (
                    <TableRow key={value.id}>
                      {bill.billType?.id !== 3 && (
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedItems.includes(
                              value.id +
                                '-' +
                                value.name +
                                '-' +
                                value.isSpouse,
                            )}
                            onChange={() =>
                              handleCheckboxChange(
                                value.id +
                                  '-' +
                                  value.name +
                                  '-' +
                                  value.isSpouse,
                              )
                            }
                          />
                        </TableCell>
                      )}
                      <TableCell>{value.name}</TableCell>
                      {bill.billType?.id == 3 ? (
                        <TableCell>{value?.prescribedQuantity}</TableCell>
                      ) : (
                        <TableCell>₹{value.amount}</TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {bill.billType?.id != 3 && (
              <div className="p-4 bg-gray-50">
                {/* Bill Summary Section */}
                <div className="flex justify-between mb-3">
                  <Typography variant="h6">Bill Summary</Typography>
                  <Typography>Total: ₹{dueBillTotal?.toFixed(2)}</Typography>
                </div>

                <Autocomplete
                  options={coupons}
                  getOptionLabel={option =>
                    `${option.couponCode} (${option.discountPercentage}% off)`
                  }
                  value={selectedCoupon}
                  onChange={(event, newValue) => {
                    setSelectedCoupon(newValue)
                  }}
                  renderInput={params => (
                    <TextField
                      {...params}
                      label="Apply Coupon"
                      variant="outlined"
                      size="small"
                    />
                  )}
                />

                {selectedCoupon && (
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between text-green-600">
                      <span>
                        Discount ({selectedCoupon.discountPercentage}%):
                      </span>
                      <span>
                        -₹{(dueBillTotal - discountedAmount).toFixed(2)}
                      </span>
                    </div>
                    <Divider />
                    <div className="flex justify-between font-bold">
                      <span>Final Amount:</span>
                      <span>₹{Number(discountedAmount)?.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {/* Payment Buttons */}
                <div className="flex justify-end gap-3 mt-4">
                  {bill.billType?.id !== 3 && (
                    <>
                      <Button
                        variant="outlined"
                        name={bill?.billType?.name}
                        className="capitalize"
                        disabled={selectedItems.length === 0}
                        onClick={e =>
                          handlePaymentMethodOnline(e, {
                            ...bill,
                            billTypeValues: filteredDueItems.filter(item =>
                              selectedItems.includes(
                                item.id + '-' + item.name + '-' + item.isSpouse,
                              ),
                            ),
                            totalAmount: dueBillTotal,
                            discountedAmount: discountedAmount,
                            couponCode: selectedCoupon?.id,
                          })
                        }
                        startIcon={<CreditCard />}
                      >
                        Online (₹{discountedAmount.toFixed(2)})
                      </Button>
                      <Button
                        variant="outlined"
                        className="capitalize"
                        name={bill?.billType?.name}
                        disabled={selectedItems.length === 0}
                        onClick={e =>
                          handlePaymentMethodOffline(
                            e,
                            {
                              ...bill,
                              billTypeValues: filteredDueItems.filter(item =>
                                selectedItems.includes(
                                  item.id +
                                    '-' +
                                    item.name +
                                    '-' +
                                    item.isSpouse,
                                ),
                              ),
                              totalAmount: dueBillTotal,
                              discountedAmount: discountedAmount,
                              couponCode: selectedCoupon?.id,
                            },
                            'UPI',
                          )
                        }
                        startIcon={<Money />}
                      >
                        UPI (₹{discountedAmount.toFixed(2)})
                      </Button>
                      <Button
                        variant="outlined"
                        className="capitalize"
                        name={bill?.billType?.name}
                        disabled={selectedItems.length === 0}
                        onClick={e =>
                          handlePaymentMethodOffline(
                            e,
                            {
                              ...bill,
                              billTypeValues: filteredDueItems.filter(item =>
                                selectedItems.includes(
                                  item.id +
                                    '-' +
                                    item.name +
                                    '-' +
                                    item.isSpouse,
                                ),
                              ),
                              totalAmount: dueBillTotal,
                              discountedAmount: discountedAmount,
                              couponCode: selectedCoupon?.id,
                            },
                            'CASH',
                          )
                        }
                        startIcon={<Money />}
                      >
                        Cash (₹{discountedAmount.toFixed(2)})
                      </Button>
                    </>
                  )}
                  {/* Only show opt-out for labs and scans */}
                  {(bill.billType?.id === 1 || bill.billType?.id === 2) && (
                    <Button
                      variant="outlined"
                      color="warning"
                      className="capitalize"
                      disabled={selectedItems.length === 0}
                      onClick={handleOptOut}
                      startIcon={<FcLeave />}
                    >
                      Opt Out
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <p className="text-center">No Items to show</p>
          </div>
        )}

        <div className="flex justify-between items-center p-3 bg-green-50">
          <div className="flex gap-4">
            <Typography variant="h6" className="text-green-700">
              Paid Items
            </Typography>
            <div className="flex gap-4 border-b pb-2">
              <Button
                variant={activeTab === 'patient' ? 'contained' : 'outlined'}
                onClick={() => setActiveTab('patient')}
                className={`capitalize ${
                  activeTab === 'patient'
                    ? 'bg-green-700 text-white'
                    : 'bg-white text-green-700'
                }`}
                size="small"
              >
                Patient
              </Button>
              <Button
                variant={activeTab === 'spouse' ? 'contained' : 'outlined'}
                onClick={() => setActiveTab('spouse')}
                className={`capitalize ${
                  activeTab === 'spouse'
                    ? 'bg-green-700 text-white'
                    : 'bg-white text-green-700'
                }`}
                size="small"
              >
                Spouse
              </Button>
            </div>
          </div>
          {bill?.billType?.name != 'Pharmacy' && (
            <Button
              size="small"
              name={bill?.billType?.name}
              onClick={e =>
                handlePrintInvoice(e, {
                  ...bill,
                  billTypeValues: filteredPaidItems,
                })
              }
              startIcon={<PrintOutlined />}
            >
              Print Invoice
            </Button>
          )}
        </div>

        {/* Paid Items Section - Now filtered by active tab */}
        {filteredPaidItems.length > 0 ? (
          <div className="border rounded-lg overflow-hidden">
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell className="font-semibold">Medication</TableCell>
                    {bill.billType?.id == 3 ? (
                      <TableCell className="font-semibold">Quantity</TableCell>
                    ) : (
                      <TableCell className="font-semibold">Amount</TableCell>
                    )}
                    <TableCell className="font-semibold">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredPaidItems.map(value => (
                    <TableRow key={value.id}>
                      <TableCell>{value.name}</TableCell>
                      {bill.billType?.id == 3 ? (
                        <TableCell>{value?.prescribedQuantity}</TableCell>
                      ) : (
                        <TableCell>₹{value.amount}</TableCell>
                      )}
                      <TableCell>
                        <Alert severity="success" className="py-0">
                          {value.status}
                        </Alert>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <p className="text-center">No Items to show</p>
          </div>
        )}

        {/* Opt-Out Items Section - Now filtered by active tab */}
        {filteredOptOutItems.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-orange-50 p-3 border-b">
              <Typography variant="h6" className="text-orange-700">
                Opted Out Items -{' '}
                {activeTab === 'patient' ? 'Patient' : 'Spouse'}
              </Typography>
            </div>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell className="font-semibold">Item</TableCell>
                    <TableCell className="font-semibold">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredOptOutItems.map(value => (
                    <TableRow key={value.id}>
                      <TableCell>{value.name}</TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          className="capitalize"
                          onClick={() => handleUndoOptOut(value.refId)}
                          startIcon={<Undo />}
                        >
                          Undo
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
        )}
      </div>
    )
  },
)

// Add display name
BillTypePanel.displayName = 'BillTypePanel'
