import {
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tab,
  Tabs,
  Box,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Typography,
  ImageList,
  ImageListItem,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  // CreditCard,
  // Money,
  TextField,
  InputAdornment,
  TablePagination,
} from '@mui/material'

import React, { useEffect, useState, useMemo } from 'react'
import Modal from './Modal'
import {
  getConsultationsHistoryByVisitId,
  getEmbryologyHistoryByVisitId,
  getNotesHistoryByVisitId,
  getPatientVisits,
  getPaymentHistoryByVisitId,
  getTreatmentsHistoryByVisitId,
} from '@/constants/apis'
import { useDispatch, useSelector } from 'react-redux'
import { closeModal, openModal } from '@/redux/modalSlice'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import noImage from '@/assets/no-image.png'
import {
  ExpandMore,
  Download,
  CreditCard,
  Money,
  Search,
  FilterAltOff,
  BackHand,
  ExitToApp,
  ArrowBack,
  Close,
} from '@mui/icons-material'
import { Generate_Invoice } from '@/constants/apis'
import { useRouter } from 'next/router'
import AppointmentDetail from '@/components/AppointmentDetail'
import RichText from './RichText'
import { ACCESS_TYPES } from '@/constants/constants'
import { usePermissionCheck, withPermission } from '@/components/withPermission'

// EmbryologyDetails Component
const EmbryologyDetails = ({ details }) => {
  const handleOpenTemplate = template => {
    if (!template) return
    const newWindow = window.open()
    newWindow.document.write(template)
    newWindow.document.close()
  }

  return (
    <Card className="bg-gray-50">
      <CardContent>
        <Typography variant="h6" className="mb-4">
          {details.embryologyName}
        </Typography>

        <ImageList cols={3} gap={16}>
          {details.details.map((detail, detailIdx) => (
            <ImageListItem
              key={detailIdx}
              className="rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <img
                src={detail.imageLink || noImage.src}
                alt={detail.categoryType}
                loading="lazy"
                className="w-full h-48 object-cover bg-white border-b-2"
              />
              <div className="p-2 bg-white">
                <div className="flex justify-between items-center">
                  <Typography variant="subtitle2">
                    {detail.categoryType}
                  </Typography>
                  {detail.template && (
                    <Button
                      size="small"
                      startIcon={<Download />}
                      onClick={() => handleOpenTemplate(detail.template)}
                    >
                      View Report
                    </Button>
                  )}
                </div>
              </div>
            </ImageListItem>
          ))}
        </ImageList>
      </CardContent>
    </Card>
  )
}

// EmbryologyTab Component
const EmbryologyTab = ({
  data,
  expandedAccordion,
  setExpandedAccordion,
  selectedType,
  setSelectedType,
}) => {
  return (
    <div className="space-y-4">
      {data.map((item, index) => (
        <Accordion
          key={index}
          className="mb-4 shadow-md"
          expanded={expandedAccordion === `panel${index}`}
          onChange={(event, isExpanded) => {
            setExpandedAccordion(isExpanded ? `panel${index}` : false)
            setSelectedType(0)
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMore />}
            className="bg-gray-50 hover:bg-gray-100"
          >
            <div className="flex w-full items-center gap-4">
              <Typography className="font-medium">
                {dayjs(item.appointmentDate).format('DD/MM/YYYY')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {item.doctorName}
              </Typography>
              <Chip
                label={item.type}
                className={'bg-secondary text-white'}
                size="small"
              />
            </div>
          </AccordionSummary>

          <AccordionDetails className="p-4">
            {item.embryologyDetails?.length > 0 ? (
              <div>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                  <Tabs
                    value={selectedType}
                    onChange={(e, v) => setSelectedType(v)}
                    variant="scrollable"
                    scrollButtons="auto"
                  >
                    {item.embryologyDetails.map((type, idx) => (
                      <Tab
                        key={idx}
                        label={type.embryologyName}
                        className="capitalize"
                      />
                    ))}
                  </Tabs>
                </Box>

                {item.embryologyDetails.map((type, typeIdx) => (
                  <div
                    key={typeIdx}
                    role="tabpanel"
                    hidden={selectedType !== typeIdx}
                  >
                    {selectedType === typeIdx && (
                      <EmbryologyDetails details={type} />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <Typography color="text.secondary" className="text-center py-4">
                No Embryology details available
              </Typography>
            )}
          </AccordionDetails>
        </Accordion>
      ))}
    </div>
  )
}

// PaymentHistoryTab Component
const PaymentHistoryTab = ({ data }) => {
  const user = useSelector(store => store.user)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(5)
  const [filters, setFilters] = useState({
    type: 'all',
    paymentMode: 'all',
    dateRange: {
      start: '',
      end: '',
    },
    search: '',
  })

  const generateReport = useMutation({
    mutationFn: async payload => {
      const result = await Generate_Invoice(user.accessToken, payload)
      if (result.status === 200) {
        const newWindow = window.open()
        newWindow.document.write(result.data)
        newWindow.document.close()
      }
      return result
    },
  })

  // Filter data based on current filters
  const filteredData = useMemo(() => {
    return data?.filter(payment => {
      const matchesType =
        filters.type === 'all' || payment.type === filters.type
      const matchesPaymentMode =
        filters.paymentMode === 'all' ||
        payment.paymentMode === filters.paymentMode
      const matchesSearch =
        payment.orderId.toLowerCase().includes(filters.search.toLowerCase()) ||
        payment.productType
          ?.toLowerCase()
          .includes(filters.search.toLowerCase())

      // Date filtering
      const paymentDate = dayjs(payment.orderDate)
      const startDate = filters.dateRange.start
        ? dayjs(filters.dateRange.start)
        : null
      const endDate = filters.dateRange.end
        ? dayjs(filters.dateRange.end)
        : null

      const matchesDateRange =
        (!startDate ||
          paymentDate.isAfter(startDate) ||
          paymentDate.isSame(startDate, 'day')) &&
        (!endDate ||
          paymentDate.isBefore(endDate) ||
          paymentDate.isSame(endDate, 'day'))

      return (
        matchesType && matchesPaymentMode && matchesSearch && matchesDateRange
      )
    })
  }, [data, filters])

  // Get unique types and payment modes for filters
  const uniqueTypes = useMemo(
    () => [...new Set(data?.map(payment => payment.type))],
    [data],
  )
  const uniquePaymentModes = useMemo(
    () => [...new Set(data?.map(payment => payment.paymentMode))],
    [data],
  )

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  // Handle rows per page change
  const handleChangeRowsPerPage = event => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  // Reset Filters
  const handleResetFilters = () => {
    setFilters({
      type: 'all',
      paymentMode: 'all',
      dateRange: {
        start: '',
        end: '',
      },
      search: '',
    })
    setPage(0)
  }

  // Calculate paginated data
  const paginatedData = filteredData?.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  )

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Filters Section */}
      <div className="p-4 border-b space-y-4">
        <div className="flex justify-between items-center mb-4">
          <Typography variant="h6">Filters</Typography>
          <Button
            size="small"
            startIcon={<FilterAltOff />}
            onClick={handleResetFilters}
          >
            Reset Filters
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Search Filter */}
          <TextField
            size="small"
            label="Search"
            variant="outlined"
            value={filters.search}
            onChange={e =>
              setFilters(prev => ({
                ...prev,
                search: e.target.value,
              }))
            }
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />

          {/* Type Filter */}
          <FormControl size="small">
            <InputLabel>Type</InputLabel>
            <Select
              value={filters.type}
              label="Type"
              onChange={e =>
                setFilters(prev => ({
                  ...prev,
                  type: e.target.value,
                }))
              }
            >
              <MenuItem value="all">All Types</MenuItem>
              {uniqueTypes.map(type => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Payment Mode Filter */}
          <FormControl size="small">
            <InputLabel>Payment Mode</InputLabel>
            <Select
              value={filters.paymentMode}
              label="Payment Mode"
              onChange={e =>
                setFilters(prev => ({
                  ...prev,
                  paymentMode: e.target.value,
                }))
              }
            >
              <MenuItem value="all">All Modes</MenuItem>
              {uniquePaymentModes.map(mode => (
                <MenuItem key={mode} value={mode}>
                  {mode}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Start Date Filter */}
          <TextField
            size="small"
            label="Start Date"
            type="date"
            value={filters.dateRange.start}
            onChange={e =>
              setFilters(prev => ({
                ...prev,
                dateRange: {
                  ...prev.dateRange,
                  start: e.target.value,
                },
              }))
            }
            InputLabelProps={{
              shrink: true,
            }}
          />

          {/* End Date Filter */}
          <TextField
            size="small"
            label="End Date"
            type="date"
            value={filters.dateRange.end}
            onChange={e =>
              setFilters(prev => ({
                ...prev,
                dateRange: {
                  ...prev.dateRange,
                  end: e.target.value,
                },
              }))
            }
            InputLabelProps={{
              shrink: true,
            }}
          />

          {/* Active Filters Display */}
          <div className="flex flex-wrap gap-2 items-center">
            {filters.type !== 'all' && (
              <Chip
                size="small"
                label={`Type: ${filters.type}`}
                onDelete={() => setFilters(prev => ({ ...prev, type: 'all' }))}
              />
            )}
            {filters.paymentMode !== 'all' && (
              <Chip
                size="small"
                label={`Mode: ${filters.paymentMode}`}
                onDelete={() =>
                  setFilters(prev => ({ ...prev, paymentMode: 'all' }))
                }
              />
            )}
          </div>
        </div>
      </div>

      {/* Table Section */}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow className="bg-gray-50">
              <TableCell className="font-semibold">Date</TableCell>
              <TableCell className="font-semibold">Order ID</TableCell>
              <TableCell className="font-semibold">Type</TableCell>
              <TableCell className="font-semibold">Product</TableCell>
              <TableCell className="font-semibold">Payment Mode</TableCell>
              <TableCell className="font-semibold text-right">Amount</TableCell>
              <TableCell className="font-semibold text-right">
                Discount
              </TableCell>
              <TableCell className="font-semibold text-right">
                Paid Amount
              </TableCell>
              <TableCell className="font-semibold text-center">
                Invoice
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData?.map((payment, index) => (
              <TableRow
                key={index}
                className="hover:bg-gray-50 transition-colors duration-150"
              >
                {/* Date */}
                <TableCell>
                  <Typography variant="body2">
                    {dayjs(payment.orderDate).format('DD MMM, YYYY')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {dayjs(payment.orderDate).format('hh:mm A')}
                  </Typography>
                </TableCell>

                {/* Order ID */}
                <TableCell>
                  <Typography variant="body2">{payment.orderId}</Typography>
                </TableCell>

                {/* Type */}
                <TableCell>
                  <Chip
                    label={payment.type}
                    size="small"
                    className="bg-secondary text-white"
                  />
                </TableCell>

                {/* Product Type */}
                <TableCell>
                  <Typography variant="body2">
                    {payment.productType || 'CONSULTATION FEE'}
                  </Typography>
                </TableCell>

                {/* Payment Mode */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    {payment.paymentMode === 'ONLINE' ? (
                      <CreditCard className="text-blue-500 w-4 h-4" />
                    ) : (
                      <Money className="text-green-500 w-4 h-4" />
                    )}
                    <Typography variant="body2">
                      {payment.paymentMode}
                    </Typography>
                  </div>
                </TableCell>

                {/* Total Amount */}
                <TableCell align="right">
                  <Typography variant="body2">
                    ₹
                    {parseFloat(payment.totalOrderAmount).toLocaleString(
                      'en-IN',
                    )}
                  </Typography>
                </TableCell>

                {/* Discount */}
                <TableCell align="right">
                  <div className="flex flex-col items-end">
                    {payment.discountAmount !== '0' &&
                    payment.discountAmount !== '0.00' ? (
                      <>
                        <Typography variant="body2" className="text-red-600">
                          ₹
                          {parseFloat(payment.discountAmount).toLocaleString(
                            'en-IN',
                          )}
                        </Typography>
                        {/* {payment.couponCode && (
                          <Tooltip title="Coupon Applied">
                            <Chip
                              label={payment.couponCode}
                              size="small"
                              className="bg-yellow-100 text-yellow-800 text-xs"
                            />
                          </Tooltip>
                        )} */}
                      </>
                    ) : (
                      <Typography variant="body2">-</Typography>
                    )}
                  </div>
                </TableCell>

                {/* Paid Amount */}
                <TableCell align="right">
                  <Typography
                    variant="body2"
                    className="text-green-600 font-medium"
                  >
                    ₹
                    {parseFloat(payment.paidOrderAmount).toLocaleString(
                      'en-IN',
                    )}
                  </Typography>
                </TableCell>

                {/* Actions */}
                <TableCell align="center">
                  <Tooltip title="Download Invoice">
                    <IconButton
                      size="small"
                      onClick={() => {
                        generateReport.mutate({
                          appointmentId: payment.appointmentId,
                          id: payment.id,
                          productType:
                            payment.productType || 'CONSULTATION FEE',
                          type: payment.type,
                        })
                      }}
                    >
                      <Download className="text-secondary hover:text-secondary/80 w-5 h-5" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        component="div"
        count={filteredData?.length || 0}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
        className="border-t"
      />

      {/* Empty State */}
      {(!filteredData || filteredData.length === 0) && (
        <div className="flex flex-col items-center justify-center py-8 text-gray-500">
          <svg
            className="w-16 h-16 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <Typography variant="body1">
            {data?.length
              ? 'No matching records found'
              : 'No payment history available'}
          </Typography>
        </div>
      )}
    </div>
  )
}

function PatientHistory({ patient, onClose }) {
  const dispatch = useDispatch()
  const router = useRouter()
  const user = useSelector(store => store.user)
  const [activeTab, setActiveTab] = useState(0)
  const [selectedVisit, setSelectedVisit] = useState()
  // patient?.activeVisitId
  const [expandedAccordion, setExpandedAccordion] = useState(false)
  const [selectedType, setSelectedType] = useState(0)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [showAppointmentDetail, setShowAppointmentDetail] = useState(false)

  const hasReadAccess = usePermissionCheck('manageUsers', [
    ACCESS_TYPES.READ,
    ACCESS_TYPES.WRITE,
  ])
  const hasWriteAccess = usePermissionCheck('manageUsers', [ACCESS_TYPES.WRITE])

  const {
    data: visits,
    isLoading: visitsLoading,
    error: visitsError,
    refetch,
  } = useQuery({
    queryKey: ['patientVisits', patient?.patientId],
    queryFn: () => getPatientVisits(user.accessToken, patient?.patientId),
    enabled: !!patient?.patientId,
  })

  const {
    data: embryologyData,
    isLoading: embryologyLoading,
    error: embryologyError,
  } = useQuery({
    queryKey: ['embryologyHistory', selectedVisit],
    queryFn: () =>
      getEmbryologyHistoryByVisitId(user.accessToken, selectedVisit),
    enabled: !!selectedVisit && activeTab === 0,
  })

  const {
    data: consultationsData,
    isLoading: consultationsLoading,
    error: consultationsError,
  } = useQuery({
    queryKey: ['consultationsHistory', selectedVisit],
    queryFn: () =>
      getConsultationsHistoryByVisitId(user.accessToken, selectedVisit),
    enabled: !!selectedVisit && activeTab === 1,
  })

  const {
    data: treatmentsData,
    isLoading: treatmentsLoading,
    error: treatmentsError,
  } = useQuery({
    queryKey: ['treatmentsHistory', selectedVisit],
    queryFn: () =>
      getTreatmentsHistoryByVisitId(user.accessToken, selectedVisit),
    enabled: !!selectedVisit && activeTab === 2,
  })

  const {
    data: notesHistory,
    isLoading: notesHistoryLoading,
    error: notesHistoryError,
  } = useQuery({
    queryKey: ['notesHistory', selectedVisit],
    queryFn: () => getNotesHistoryByVisitId(user.accessToken, selectedVisit),
    enabled: !!selectedVisit && activeTab === 3,
  })

  const {
    data: paymentHistory,
    isLoading: paymentHistoryLoading,
    error: paymentHistoryError,
  } = useQuery({
    queryKey: ['paymentHistory', selectedVisit],
    queryFn: () => getPaymentHistoryByVisitId(user.accessToken, selectedVisit),
    enabled: !!selectedVisit && activeTab === 4,
  })

  // Handle opening the modal with route
  const handleOpenModal = () => {
    refetch()
    dispatch(openModal(patient.patientId + 'History'))
    // Update URL with patient history params
    router.push(
      {
        pathname: router.pathname,
        query: {
          ...router.query,
          patientHistoryId: patient.patientId,
          activeVisitId: patient.activeVisitId,
          activeTab: activeTab,
        },
      },
      undefined,
      { shallow: true },
    )
  }

  // Handle closing the modal
  const handleCloseModal = () => {
    dispatch(closeModal())
    // Remove patient history params from URL
    const {
      patientHistoryId,
      activeVisitId,
      activeTab: tabFromQuery,
      ...restQuery
    } = router.query
    router.push(
      {
        pathname: router.pathname,
        query: restQuery,
      },
      undefined,
      { shallow: true },
    )
    onClose?.()
  }

  // Effect to handle URL params and modal state
  useEffect(() => {
    const {
      patientHistoryId,
      activeVisitId,
      activeTab: tabFromQuery,
    } = router.query

    // Only open modal if URL has matching patient history params
    if (patientHistoryId && patientHistoryId === patient?.patientId) {
      dispatch(openModal(patient.patientId + 'History'))
      if (activeVisitId) {
        setSelectedVisit(activeVisitId)
      }
      if (tabFromQuery) {
        setActiveTab(parseInt(tabFromQuery))
      }
    }
  }, [router.query, patient?.patientId])

  const LoadingState = () => (
    <div className="flex justify-center items-center min-h-[200px]">
      <CircularProgress />
    </div>
  )

  const ErrorState = ({ message }) => (
    <Alert severity="error" className="my-4">
      {message || 'An error occurred while fetching data'}
    </Alert>
  )

  const EmptyState = ({ message }) => (
    <div className="flex flex-col items-center justify-center min-h-[200px] text-gray-500">
      <svg
        className="w-16 h-16 mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
        />
      </svg>
      <p>{message || 'No data available'}</p>
    </div>
  )

  const renderEmbryologyTab = () => {
    if (embryologyLoading) return <LoadingState />
    if (embryologyError) return <ErrorState message={embryologyError.message} />
    if (!embryologyData?.data?.length)
      return <EmptyState message="No embryology records found" />

    return (
      <EmbryologyTab
        data={embryologyData.data}
        expandedAccordion={expandedAccordion}
        setExpandedAccordion={setExpandedAccordion}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
      />
    )
  }

  const renderConsultationsTab = () => {
    if (consultationsLoading) return <LoadingState />
    if (consultationsError)
      return <ErrorState message={consultationsError.message} />
    if (!consultationsData?.data?.length)
      return <EmptyState message="No consultation records found" />

    return (
      <div className="space-y-4">
        {consultationsData?.data?.map((consultation, index) => (
          <div key={index} className="border rounded-lg p-4 shadow">
            <div className="flex justify-between mb-4">
              <span className="font-semibold">
                {consultation.consultationType}
              </span>
              <span>
                {dayjs(consultation.consultationDate).format('DD-MM-YYYY')}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {consultation.appointmentDetails?.map((apt, idx) => (
                <div
                  key={idx}
                  className="border rounded-lg shadow-sm hover:shadow-md transition-all bg-white overflow-hidden"
                >
                  <div className="flex items-center justify-between border-b p-3 bg-gray-50">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {apt.consultationDoctor}
                      </span>
                    </div>
                    <Chip
                      label={apt.currentStage}
                      size="small"
                      className="bg-blue-100 text-blue-800"
                    />
                  </div>

                  <div className="p-3">
                    <div className="mb-3">
                      <Typography
                        variant="body2"
                        className="mt-1 p-2 bg-gray-50 rounded-md border border-gray-100 line-clamp-2"
                      >
                        {apt.appointmentReason || 'No reason specified'}
                      </Typography>
                    </div>

                    <div className="flex justify-between items-center mt-4">
                      <div className="flex flex-col">
                        <Typography variant="caption" className="text-gray-500">
                          Date
                        </Typography>
                        <div className="flex items-center gap-1 mt-1">
                          <div className="w-2 h-2 rounded-full bg-primary"></div>
                          <Typography variant="body2" className="font-medium">
                            {dayjs(apt.appointmentDate).format('DD MMM, YYYY')}
                          </Typography>
                        </div>
                      </div>

                      <div className="flex flex-col">
                        <Typography variant="caption" className="text-gray-500">
                          Time
                        </Typography>
                        <div className="flex items-center gap-1 mt-1">
                          <div className="w-2 h-2 rounded-full bg-secondary"></div>
                          <Typography variant="body2" className="font-medium">
                            {apt.appointmentSlot
                              ?.split(' - ')[0]
                              .substring(0, 5)}
                          </Typography>
                        </div>
                      </div>

                      <Button
                        variant="outlined"
                        size="small"
                        // className="bg-primary hover:bg-primary/90 shadow-sm"
                        // endIcon={<ExitToApp />}
                        onClick={() =>
                          handleAppointmentClick({
                            ...apt,
                            type: 'Consultation',
                          })
                        }
                      >
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderTreatmentsTab = () => {
    if (treatmentsLoading) return <LoadingState />
    if (treatmentsError) return <ErrorState message={treatmentsError.message} />
    if (!treatmentsData?.data?.length)
      return <EmptyState message="No treatment records found" />

    return (
      <div className="space-y-4">
        {treatmentsData?.data?.map((treatment, index) => (
          <div key={index} className="border rounded-lg p-4 shadow">
            <div className="flex justify-between mb-4">
              <span className="font-semibold">
                {treatment.treatmentType || 'Unknown Treatment'}
              </span>
              <span>{dayjs(treatment.treatmentDate).format('DD-MM-YYYY')}</span>
            </div>
            {treatment.appointmentDetails && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {treatment.appointmentDetails.map((apt, idx) => (
                  <div key={idx} className="border rounded p-3 bg-gray-50">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">
                        {apt.consultationDoctor}
                      </span>
                      <span className="text-xs bg-blue-100 px-2 py-1 rounded">
                        {apt.currentStage}
                      </span>
                    </div>
                    <div className="text-sm">
                      <p>{dayjs(apt.appointmentDate).format('DD-MM-YYYY')}</p>
                      <p>{apt.appointmentSlot}</p>
                      <p className="text-gray-600">{apt.appointmentReason}</p>
                    </div>
                    <Button
                      variant="outlined"
                      color="primary"
                      size="small"
                      className="mt-2"
                      onClick={() =>
                        handleAppointmentClick({ ...apt, type: 'Treatment' })
                      }
                    >
                      View
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  const renderNotesHistoryTab = () => {
    if (notesHistoryLoading) return <LoadingState />
    if (notesHistoryError)
      return <ErrorState message={notesHistoryError.message} />
    if (!notesHistory?.data?.length)
      return <EmptyState message="No Notes history found" />

    return (
      <div className="space-y-4">
        {notesHistory?.data?.map((note, index) => (
          <Card key={index} className="shadow-lg border">
            <CardContent className="flex p-2 m-0">
              <div className="w-[12%] pr-1 border-r border-gray-200 flex flex-col items-center justify-center gap-1">
                <Typography variant="subtitle2" className="font-semibold">
                  {dayjs(note?.appointmentDate).format('DD-MM-YYYY')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <Chip
                    label={note?.type}
                    size="small"
                    className={
                      note?.type.toLowerCase() === 'consultation'
                        ? 'bg-orange-500 text-white'
                        : 'bg-green-500 text-white'
                    }
                  />
                </Typography>
              </div>
              <div className="w-[88%] pl-4">
                <Typography variant="body2" className="text-gray-700">
                  {/* {note?.notes} */}
                  <RichText
                    value={note?.notes || 'No Notes Provided'}
                    readOnly={true}
                  />
                </Typography>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const renderPaymentHistoryTab = () => {
    if (paymentHistoryLoading) return <LoadingState />
    if (paymentHistoryError)
      return <ErrorState message={paymentHistoryError.message} />
    if (!paymentHistory?.data?.length)
      return <EmptyState message="No payment history found" />

    return <PaymentHistoryTab data={paymentHistory.data} />
  }

  const handleAppointmentClick = appointment => {
    setSelectedAppointment(appointment)
    setShowAppointmentDetail(true)
  }

  const handleBackToHistory = () => {
    setShowAppointmentDetail(false)
    setSelectedAppointment(null)
  }

  return (
    <div key={patient?.patientId}>
      {/* <Button
        variant="outlined"
        className="capitalize"
        onClick={handleOpenModal}
      >
        Patient History
      </Button> */}
      <Modal
        uniqueKey={patient?.patientId + 'History'}
        closeOnOutsideClick={false}
        maxWidth="lg"
        onClose={handleCloseModal}
      >
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xl font-bold">
              {showAppointmentDetail
                ? 'Appointment Details'
                : 'Patient History'}
            </span>

            {showAppointmentDetail ? (
              <div>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleBackToHistory}
                  className="mr-2"
                >
                  Back
                </Button>
                {/* <Button variant="outlined" color="error" onClick={handleCloseModal}>
                  Close
                </Button> */}
              </div>
            ) : (
              <IconButton onClick={handleCloseModal}>
                <Close />
              </IconButton>
            )}
          </div>

          {/* Slide transition between patient history and appointment details */}
          <div className="relative overflow-hidden h-[70vh]">
            <div
              className={`transition-all duration-300 ${
                showAppointmentDetail
                  ? 'translate-x-[-100%] absolute w-full'
                  : 'translate-x-0'
              }`}
            >
              {/* Patient History Content */}
              {visitsLoading ? (
                <LoadingState />
              ) : visitsError ? (
                <ErrorState message={visitsError.message} />
              ) : (
                <>
                  <FormControl className="m-4 min-w-[230px]">
                    <InputLabel id="visit-select-label">Visit</InputLabel>
                    <Select
                      value={selectedVisit || ''}
                      onChange={e => setSelectedVisit(e.target.value)}
                      label="Visit"
                      labelId="visit-select-label"
                    >
                      {visits?.data?.visitDetails?.map(visit => (
                        <MenuItem
                          key={visit.visitId}
                          value={visit.visitId}
                          sx={{
                            display: 'flex',
                            gap: 1,
                            justifyContent: 'space-between',
                          }}
                        >
                          <span className="font-medium mr-3">
                            {visit?.visitType}
                          </span>
                          <span className="text-gray-600 text-xs mr-3 ">
                            {dayjs(visit.visitDate).format('DD-MM-YYYY')}
                          </span>
                          {visit?.isActive && (
                            <span className="text-green-600 text-xs ">
                              active{' '}
                            </span>
                          )}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                    <Tabs
                      value={activeTab}
                      onChange={(e, v) => {
                        setActiveTab(v)
                      }}
                    >
                      <Tab label="Embryology" />
                      <Tab label="Consultations" />
                      <Tab label="Treatments" />
                      <Tab label="Notes History" />
                      {hasReadAccess && <Tab label="Payment History" />}
                    </Tabs>
                  </Box>

                  <div className="mt-4 h-[330px] overflow-y-auto">
                    {activeTab === 0 && renderEmbryologyTab()}
                    {activeTab === 1 && renderConsultationsTab()}
                    {activeTab === 2 && renderTreatmentsTab()}
                    {activeTab === 3 && renderNotesHistoryTab()}
                    {activeTab === 4 &&
                      hasReadAccess &&
                      renderPaymentHistoryTab()}
                  </div>
                </>
              )}
            </div>

            {/* Appointment Detail Slide */}
            <div
              className={`transition-all duration-300 ${
                showAppointmentDetail
                  ? 'translate-x-0'
                  : 'translate-x-[100%] absolute w-full'
              }`}
            >
              {selectedAppointment && (
                <AppointmentDetail
                  appointmentId={selectedAppointment.appointmentId}
                  type={selectedAppointment.type}
                  onClose={handleBackToHistory}
                />
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default PatientHistory
