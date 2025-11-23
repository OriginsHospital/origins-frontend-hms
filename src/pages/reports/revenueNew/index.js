import Breadcrumb from '@/components/Breadcrumb'
import SalesDashboard from '@/components/SalesDashboard'
import { withPermission } from '@/components/withPermission'
import { SalesReportDashboard } from '@/constants/apis'
import { ACCESS_TYPES } from '@/constants/constants'
import {
  Card,
  CardContent,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  Button,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import React, { useContext, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useRouter } from 'next/router'
import { toast } from 'react-toastify'
import { toastconfig } from '@/utils/toastconfig'
import { hasRevenueAccess } from '@/utils/revenueAccess'

function SalesNew() {
  const router = useRouter()
  const userDetails = useSelector((store) => store.user)
  const dropdowns = useSelector((store) => store.dropdowns)
  // Initialize with current date for fromDate and 30 days ago for toDate
  const [fromDate, setFromDate] = useState(
    dayjs().subtract(30, 'days').toDate(),
  )
  const [toDate, setToDate] = useState(dayjs().toDate())
  const [branchId, setBranchId] = useState('')
  const [paymentMode, setPaymentMode] = useState('ALL')
  const [activeView, setActiveView] = useState('sales') // 'sales' or 'refunds'
  const [filteredData, setFilteredData] = useState(null)

  // Applied filters (used to trigger API)
  const [appliedFromDate, setAppliedFromDate] = useState(
    dayjs().subtract(30, 'days').toDate(),
  )
  const [appliedToDate, setAppliedToDate] = useState(dayjs().toDate())
  const [appliedBranchId, setAppliedBranchId] = useState('')
  const [appliedPaymentMode, setAppliedPaymentMode] = useState('ALL')

  // Access control: Check if user has revenue access
  useEffect(() => {
    if (userDetails?.email && !hasRevenueAccess(userDetails.email)) {
      toast.error(
        'You do not have permission to access Revenue Reports.',
        toastconfig,
      )
      router.replace('/home')
      return
    }
  }, [userDetails?.email, router])

  // Set initial branch and handle branch data loading
  useEffect(() => {
    if (dropdowns?.branches?.length > 0) {
      const defaultBranch = dropdowns.branches[0].id
      setBranchId(defaultBranch)
      setAppliedBranchId(defaultBranch) // Set applied branch ID immediately
      setAppliedPaymentMode('ALL')
      console.log('Setting default branch:', defaultBranch)
    }
  }, [dropdowns])

  // Validate and update applied filters
  useEffect(() => {
    // Validate dates
    const isValidDateRange = dayjs(fromDate).isBefore(dayjs(toDate))
    if (!isValidDateRange) {
      console.error('Invalid date range:', { fromDate, toDate })
      return
    }

    // Update applied filters if all values are valid
    if (branchId && fromDate && toDate) {
      console.log('Updating applied filters:', {
        branchId,
        fromDate: dayjs(fromDate).format('YYYY-MM-DD'),
        toDate: dayjs(toDate).format('YYYY-MM-DD'),
      })

      setAppliedBranchId(branchId)
      setAppliedFromDate(fromDate)
      setAppliedToDate(toDate)
      // Ensure applied payment mode is set (default ALL)
      setAppliedPaymentMode(paymentMode || 'ALL')
    }
  }, [branchId, fromDate, toDate])

  const {
    data: salesDashboardData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      'salesDashboardDataNew',
      userDetails.accessToken,
      appliedFromDate,
      appliedToDate,
      appliedBranchId,
      appliedPaymentMode,
    ],
    queryFn: async () => {
      try {
        // Validate all required parameters
        if (!userDetails?.accessToken)
          throw new Error('Authentication token is missing')
        if (!appliedFromDate || !appliedToDate)
          throw new Error('Date range is required')
        if (!appliedBranchId) throw new Error('Branch ID is required')

        // Log API call parameters
        console.log('Revenue New API Call:', {
          token: 'Present',
          fromDate: dayjs(appliedFromDate).format('YYYY-MM-DD'),
          toDate: dayjs(appliedToDate).format('YYYY-MM-DD'),
          branchId: appliedBranchId,
        })

        // Make API call
        const response = await SalesReportDashboard(
          userDetails.accessToken,
          dayjs(appliedFromDate).format('YYYY-MM-DD'),
          dayjs(appliedToDate).format('YYYY-MM-DD'),
          appliedBranchId,
          appliedPaymentMode && appliedPaymentMode !== 'ALL'
            ? appliedPaymentMode
            : undefined,
        )

        // Validate API response
        if (!response || !response.data) {
          throw new Error('Invalid API response format')
        }

        console.log('Revenue New API Response:', response)
        return response.data
      } catch (error) {
        console.error('Revenue API Error:', error)
        // Handle 403 Forbidden (unauthorized access)
        if (
          error?.message?.includes('Access restricted') ||
          error?.response?.status === 403
        ) {
          toast.error(
            'You do not have permission to access Revenue Reports.',
            toastconfig,
          )
          router.replace('/home')
        }
        throw error
      }
    },
    enabled: Boolean(
      userDetails?.accessToken &&
        appliedBranchId &&
        appliedFromDate &&
        appliedToDate,
    ),
    retry: 1,
    staleTime: 30000, // Consider data stale after 30 seconds
    onError: (error) => {
      console.error('Query Error:', error)
    },
  })

  useEffect(() => {
    try {
      if (!salesDashboardData) return

      console.log('Processing sales dashboard data:', salesDashboardData)
      let filtered = { ...salesDashboardData }

      // Apply payment mode filter only when a specific mode is selected (not 'ALL')
      if (paymentMode && paymentMode !== 'ALL') {
        console.log('Applying payment mode filter:', paymentMode)

        // Safely filter sales data
        const filteredSalesData = (salesDashboardData.salesData || []).filter(
          (item) => item && item.paymentMode === paymentMode,
        )

        // Safely filter return data
        const filteredReturnData = (salesDashboardData.returnData || []).filter(
          (item) => item && item.paymentMode === paymentMode,
        )

        // Safely calculate totals
        const totalSales = filteredSalesData.reduce(
          (sum, item) => sum + (Number(item?.amount) || 0),
          0,
        )

        const totalReturns = filteredReturnData.reduce(
          (sum, item) => sum + (Math.abs(Number(item?.amount)) || 0),
          0,
        )

        console.log('Filtered data stats:', {
          salesCount: filteredSalesData.length,
          returnsCount: filteredReturnData.length,
          totalSales,
          totalReturns,
        })

        filtered = {
          ...salesDashboardData,
          salesData: filteredSalesData,
          returnData: filteredReturnData,
          salesDashboard: {
            ...salesDashboardData.salesDashboard,
            totalSales: totalSales,
            totalReturns: totalReturns,
          },
        }
      }

      setFilteredData(filtered)
    } catch (error) {
      console.error('Error processing sales dashboard data:', error)
    }
  }, [salesDashboardData, paymentMode])

  const handleApplyFilters = () => {
    setAppliedFromDate(fromDate)
    setAppliedToDate(toDate)
    setAppliedBranchId(branchId)
    setAppliedPaymentMode(paymentMode || 'ALL')
  }

  const handleResetFilters = () => {
    const defaultFrom = dayjs().subtract(30, 'day').toDate()
    const defaultTo = new Date()
    const defaultBranch = dropdowns?.branches?.[0]?.id || ''
    setFromDate(defaultFrom)
    setToDate(defaultTo)
    setBranchId(defaultBranch)
    setPaymentMode('ALL')
    setFilteredData(null)
    setAppliedFromDate(defaultFrom)
    setAppliedToDate(defaultTo)
    setAppliedBranchId(defaultBranch)
    setAppliedPaymentMode('ALL')
  }

  // Don't render if user doesn't have access
  if (userDetails?.email && !hasRevenueAccess(userDetails.email)) {
    return null
  }

  return (
    <div>
      <div className="m-5">
        <Breadcrumb />
      </div>
      <div className="flex flex-wrap gap-5 p-5 ">
        {/* Summary Cards in a row */}
        <div className="flex gap-4">
          <div
            onClick={() => setActiveView('sales')}
            style={{ cursor: 'pointer' }}
          >
            <SummaryCard
              title="Total Sales"
              value={`₹${(
                filteredData?.salesDashboard?.totalSales ||
                salesDashboardData?.salesDashboard?.totalSales ||
                0
              ).toLocaleString('en-IN')}`}
              isActive={activeView === 'sales'}
              minWidth="125px"
            />
          </div>
          <div
            onClick={() => setActiveView('refunds')}
            style={{ cursor: 'pointer' }}
          >
            <SummaryCard
              title={'Total Refunds'}
              value={`₹${(
                filteredData?.salesDashboard?.totalReturns ||
                salesDashboardData?.salesDashboard?.totalReturns ||
                0
              ).toLocaleString('en-IN')}`}
              isActive={activeView === 'refunds'}
              minWidth="125px"
            />
          </div>
        </div>
        {/* NIKKI PAYMENT MODE FILTER 28/10/25 */}
        <Grid item xs={12} sm={3}>
          <FormControl
            variant="outlined"
            className="bg-white"
            sx={{
              width: '125px',
              '& .MuiInputBase-root': {
                height: '56px', // Same height as Branch
              },
            }}
          >
            <InputLabel>Payment Mode</InputLabel>
            <Select
              label="Payment Mode"
              name="paymentMode"
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              className="flex h-full"
            >
              <MenuItem value="ALL">All</MenuItem>
              <MenuItem value="CASH">Cash</MenuItem>
              <MenuItem value="UPI">Upi</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        {/* END NIKKI PAYMENT MODE FILTER */}
        <DatePicker
          label="From Date"
          // disabled={isEdit == 'noneditable'}
          sx={{ width: '150px' }}
          value={fromDate ? dayjs(fromDate) : null}
          name="fromDate"
          format="DD/MM/YYYY"
          onChange={(newValue) => setFromDate(newValue)}
        />
        <DatePicker
          label="To Date"
          // disabled={isEdit == 'noneditable'}
          format="DD/MM/YYYY"
          className="bg-white rounded-lg"
          sx={{ width: '150px' }}
          value={toDate ? dayjs(toDate) : null}
          name="fromDate"
          onChange={(newValue) => setToDate(newValue)}
        />
        <Grid item xs={12} sm={3}>
          <FormControl
            variant="outlined"
            className="bg-white"
            sx={{
              width: '125px',
              '& .MuiInputBase-root': {
                height: '56px', // Standard MUI form control height
              },
            }}
          >
            <InputLabel>Branch</InputLabel>
            <Select
              label="Branch"
              name="branchId"
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="flex h-full"
              placeholder="branch"
            >
              {dropdowns?.branches?.map((branch, idx) => (
                <MenuItem key={branch.id} value={branch.id}>
                  {branch.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <div className="flex items-center gap-3 h-[56px]">
          <Button
            variant="contained"
            onClick={handleApplyFilters}
            disabled={!branchId}
            sx={{
              height: '40px',
              textTransform: 'none',
              borderRadius: '8px',
              fontSize: '0.875rem',
              padding: '8px 22px',
              display: 'flex',
              alignItems: 'center',
              minWidth: '80px',
              '&:hover': {
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              },
            }}
          >
            Apply
          </Button>
          <Button
            variant="outlined"
            onClick={handleResetFilters}
            sx={{
              height: '40px',
              textTransform: 'none',
              borderRadius: '8px',
              fontSize: '0.875rem',
              padding: '8px 22px',
              display: 'flex',
              alignItems: 'center',
              minWidth: '80px',
              '&:hover': {
                backgroundColor: 'rgba(0,0,0,0.04)',
              },
            }}
          >
            Reset
          </Button>
        </div>
      </div>
      {isLoading && (
        <div className="px-5 text-sm text-gray-500">
          Loading revenue data...
        </div>
      )}
      {isError && (
        <div className="px-5 text-sm text-red-500">
          Failed to load revenue data
          {error?.message ? `: ${error.message}` : ''}
        </div>
      )}
      <SalesDashboard
        data={filteredData || salesDashboardData}
        branchId={appliedBranchId}
        reportName="Revenue_New_Report"
        reportType="revenue"
        branchName={
          dropdowns?.branches?.find((branch) => branch.id === appliedBranchId)
            ?.name
        }
        filters={{
          fromDate: appliedFromDate
            ? dayjs(appliedFromDate).format('YYYY-MM-DD')
            : '',
          toDate: appliedToDate
            ? dayjs(appliedToDate).format('YYYY-MM-DD')
            : '',
          branchId: appliedBranchId,
        }}
        activeView={activeView}
      />
    </div>
  )
}
// Move SummaryCard component above the main component
const SummaryCard = ({ title, value, isActive, minWidth = '125px' }) => (
  <Card
    className="row-span-1"
    style={{
      minWidth: minWidth,
      height: '56px',
      backgroundColor: isActive ? '#b0e9fa' : 'white',
      // border: isActive ? '1px solid #0ea5e9' : '1px solid #e5e7eb',
    }}
  >
    <CardContent className="p-2 flex flex-col justify-between h-full">
      <span className="text-xs font-medium text-secondary">{title}</span>
      <span className="text-lg font-bold ">{value}</span>
    </CardContent>
  </Card>
)

// Export the main component
export default SalesNew
