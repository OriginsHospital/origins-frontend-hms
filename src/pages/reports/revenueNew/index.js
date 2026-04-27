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
import {
  hasRevenueNewAccess,
  hasRevenueNewRowActionsAccess,
} from '@/utils/revenueAccess'

const getReportBranchId = (item) => {
  if (!item) return null

  // Prefer actual transaction/billing branch over patient registration branch.
  return (
    item.billingBranchId ??
    item.billedAtBranchId ??
    item.transactionBranchId ??
    item.paymentBranchId ??
    item.orderBranchId ??
    item.visitBranchId ??
    item.branchDetails?.id ??
    item.branch?.id ??
    item.branchId ??
    null
  )
}

const normalizeBranchValue = (value) => {
  if (value === null || value === undefined) return ''
  return String(value).trim().toUpperCase()
}

const getRowBranchCandidates = (item) => {
  if (!item) return []
  return [
    item.billingBranchId,
    item.billedAtBranchId,
    item.transactionBranchId,
    item.paymentBranchId,
    item.orderBranchId,
    item.visitBranchId,
    item.billingBranchCode,
    item.transactionBranchCode,
    item.paymentBranchCode,
    item.orderBranchCode,
    item.visitBranchCode,
    item.billingBranchName,
    item.transactionBranchName,
    item.paymentBranchName,
    item.orderBranchName,
    item.visitBranchName,
    item.branchDetails?.id,
    item.branchDetails?.name,
    item.branch?.id,
    item.branch?.name,
    item.branchId,
    item.branchName,
    item.branchCode,
  ]
    .map(normalizeBranchValue)
    .filter(Boolean)
}

const getSelectedBranchCandidates = (selectedBranch) => {
  if (!selectedBranch) return []
  return [selectedBranch.id, selectedBranch.name, selectedBranch.code]
    .map(normalizeBranchValue)
    .filter(Boolean)
}

const rowBelongsToSelectedBranch = (item, selectedBranch) => {
  if (!item || !selectedBranch) return false
  const rowCandidates = getRowBranchCandidates(item)
  const branchCandidates = getSelectedBranchCandidates(selectedBranch)
  if (rowCandidates.length === 0 || branchCandidates.length === 0) return false

  const selectedIdNum = Number(selectedBranch.id)
  if (Number.isFinite(selectedIdNum)) {
    const idAligned = rowCandidates.some((rv) => {
      const n = Number(rv)
      return !Number.isNaN(n) && n === selectedIdNum
    })
    if (idAligned) return true
  }

  return rowCandidates.some((rowValue) => branchCandidates.includes(rowValue))
}

const dedupeRevenueRows = (rows = []) => {
  const seen = new Set()
  return rows.filter((row) => {
    const key = [
      row?.revenueSource || '',
      row?.paymentMasterId || '',
      row?.orderId || '',
      row?.date || '',
      row?.amount || '',
      row?.productType || '',
    ].join('|')
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function SalesNew() {
  const router = useRouter()
  const userDetails = useSelector((store) => store.user)
  const dropdowns = useSelector((store) => store.dropdowns)
  // Initialize with current date for both fromDate and toDate
  const today = dayjs().toDate()
  const [fromDate, setFromDate] = useState(today)
  const [toDate, setToDate] = useState(today)
  const [branchId, setBranchId] = useState('ALL')
  const [paymentMode, setPaymentMode] = useState('ALL')
  const [service, setService] = useState('ALL')
  const [activeView, setActiveView] = useState('sales') // 'sales' or 'refunds'
  const [filteredData, setFilteredData] = useState(null)

  // Applied filters (used to trigger API)
  const [appliedFromDate, setAppliedFromDate] = useState(today)
  const [appliedToDate, setAppliedToDate] = useState(today)
  const [appliedBranchId, setAppliedBranchId] = useState('ALL')
  const [appliedPaymentMode, setAppliedPaymentMode] = useState('ALL')

  // Access control: Check if user has Revenue New access
  useEffect(() => {
    if (userDetails?.email && !hasRevenueNewAccess(userDetails.email)) {
      toast.error(
        'You do not have permission to access Revenue New Reports.',
        toastconfig,
      )
      router.replace('/home')
      return
    }
  }, [userDetails?.email, router])

  // Set initial branch to ALL
  useEffect(() => {
    if (dropdowns?.branches?.length > 0) {
      // Default to ALL for branch selection
      setBranchId('ALL')
      setAppliedBranchId('ALL') // Set applied branch ID immediately
      setAppliedPaymentMode('ALL')
    }
  }, [dropdowns])

  // Validate and update applied filters
  useEffect(() => {
    // Validate dates (allow equal dates - fromDate can be same as toDate)
    const isValidDateRange =
      dayjs(fromDate).isBefore(dayjs(toDate)) ||
      dayjs(fromDate).isSame(dayjs(toDate), 'day')
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

      // When "ALL" is selected, we'll fetch data for all branches
      // For now, set appliedBranchId to "ALL" to trigger multi-branch fetch
      if (branchId === 'ALL') {
        setAppliedBranchId('ALL')
      } else {
        setAppliedBranchId(branchId)
      }
      setAppliedFromDate(fromDate)
      setAppliedToDate(toDate)
      // Ensure applied payment mode is set (default ALL)
      setAppliedPaymentMode(paymentMode || 'ALL')
    }
  }, [branchId, fromDate, toDate, dropdowns, paymentMode])

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
      dropdowns?.branches?.length, // Include branches length to refetch when branches change
    ],
    queryFn: async () => {
      try {
        // Validate all required parameters
        if (!userDetails?.accessToken)
          throw new Error('Authentication token is missing')
        if (!appliedFromDate || !appliedToDate)
          throw new Error('Date range is required')
        if (!appliedBranchId) throw new Error('Branch ID is required')

        const fromDateStr = dayjs(appliedFromDate).format('YYYY-MM-DD')
        const toDateStr = dayjs(appliedToDate).format('YYYY-MM-DD')
        const paymentModeParam =
          appliedPaymentMode && appliedPaymentMode !== 'ALL'
            ? appliedPaymentMode
            : undefined

        // Always fetch all report branches, then apply robust billing-branch
        // filtering on client-side. This avoids API-side branch attribution drift.
        if (!dropdowns?.branches || dropdowns.branches.length === 0) {
          throw new Error('No branches available')
        }

        // Filter out excluded branches (OBH, 02, kmm03, HYD-KKT)
        const filteredBranches = dropdowns.branches.filter(
          (branch) =>
            branch.name !== 'OBH' &&
            branch.name !== '02' &&
            branch.name !== 'kmm03' &&
            branch.name !== 'HYD-KKT',
        )

        const branchNames = filteredBranches.map((b) => b.name).join(', ')
        console.log(`Revenue New fetching branches: ${branchNames}`)

        const branchPromises = filteredBranches.map((branch) =>
          SalesReportDashboard(
            userDetails.accessToken,
            fromDateStr,
            toDateStr,
            branch.id,
            paymentModeParam,
          )
            .then((response) => {
              if (!response || !response.data) {
                return {
                  branchId: branch.id,
                  branchName: branch.name,
                  data: null,
                  success: false,
                }
              }
              return {
                branchId: branch.id,
                branchName: branch.name,
                data: response.data,
                success: true,
              }
            })
            .catch((error) => ({
              branchId: branch.id,
              branchName: branch.name,
              data: null,
              success: false,
              error: error.message,
            })),
        )

        const branchResults = await Promise.all(branchPromises)

        const combinedSalesData = []
        const combinedReturnData = []
        let totalSales = 0
        let totalReturns = 0

        branchResults.forEach((result) => {
          if (!result.success || !result.data) return

          if (Array.isArray(result.data.salesData)) {
            combinedSalesData.push(...result.data.salesData)
          }
          if (Array.isArray(result.data.returnData)) {
            combinedReturnData.push(...result.data.returnData)
          }
          totalSales += Number(result.data.salesDashboard?.totalSales) || 0
          totalReturns += Number(result.data.salesDashboard?.totalReturns) || 0
        })

        return {
          salesData: dedupeRevenueRows(combinedSalesData),
          returnData: dedupeRevenueRows(combinedReturnData),
          salesDashboard: {
            totalSales,
            totalReturns,
          },
        }
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
        appliedToDate &&
        dropdowns?.branches?.length > 0, // Ensure branches are loaded
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

      console.log('Processing sales dashboard data:', {
        hasData: !!salesDashboardData,
        salesDataCount: salesDashboardData?.salesData?.length || 0,
        returnDataCount: salesDashboardData?.returnData?.length || 0,
        branchId,
        branchIdType: typeof branchId,
      })
      let filtered = { ...salesDashboardData }

      // Start with the original data
      let filteredSalesData = salesDashboardData.salesData || []
      let filteredReturnData = salesDashboardData.returnData || []

      // Apply payment mode filter only when a specific mode is selected (not 'ALL')
      if (paymentMode && paymentMode !== 'ALL') {
        console.log('Applying payment mode filter:', paymentMode)

        // Safely filter sales data
        filteredSalesData = filteredSalesData.filter(
          (item) => item && item.paymentMode === paymentMode,
        )

        // Safely filter return data
        filteredReturnData = filteredReturnData.filter(
          (item) => item && item.paymentMode === paymentMode,
        )
      }

      // Apply branch filter only when a specific branch is selected (not 'ALL')
      // When branchId === 'ALL': Show all branches (HNK + HYD + KMM + SPL) - NO filtering
      if (branchId && branchId !== 'ALL') {
        console.log('Applying branch filter for specific branch:', branchId)
        const selectedBranch = dropdowns?.branches?.find(
          (item) => String(item.id) === String(branchId),
        )

        const beforeSalesCount = filteredSalesData.length
        const beforeReturnsCount = filteredReturnData.length

        filteredSalesData = filteredSalesData.filter((item) => {
          if (!item) return false
          return rowBelongsToSelectedBranch(item, selectedBranch)
        })

        filteredReturnData = filteredReturnData.filter((item) => {
          if (!item) return false
          return rowBelongsToSelectedBranch(item, selectedBranch)
        })

        console.log('Branch filter results:', {
          branchId,
          selectedBranchName: selectedBranch?.name,
          beforeSalesCount,
          afterSalesCount: filteredSalesData.length,
          beforeReturnsCount,
          afterReturnsCount: filteredReturnData.length,
        })
      } else if (branchId === 'ALL') {
        // When "ALL" is selected, show all data from all branches (HNK + HYD + KMM + SPL)
        console.log(
          'Branch = ALL: Showing data from all branches (no branch filtering applied)',
        )
      }

      // Apply service filter only when a specific service is selected (not 'ALL')
      if (service && service !== 'ALL') {
        console.log('Applying service filter:', service)

        // Debug: Log sample data to understand structure (only log first time)
        if (filteredSalesData.length > 0 && filteredSalesData[0]) {
          const sampleItem = filteredSalesData[0]
          console.log('Sample sales item structure:', {
            hasService: !!sampleItem.service,
            serviceValue: sampleItem.service,
            hasProductType: !!sampleItem.productType,
            productTypeValue: sampleItem.productType,
            filterValue: service,
          })
        }

        const beforeFilterCount = filteredSalesData.length

        if (service === 'Pharmacy') {
          // Filter to show only Pharmacy items
          const filterValue = 'PHARMACY'
          filteredSalesData = filteredSalesData.filter((item) => {
            if (!item) return false
            // Check both service and productType fields with case-insensitive comparison
            const itemService = String(item.service || item.productType || '')
              .trim()
              .toUpperCase()
            const matches = itemService === filterValue
            return matches
          })

          filteredReturnData = filteredReturnData.filter((item) => {
            if (!item) return false
            // Check both service and productType fields with case-insensitive comparison
            const itemService = String(item.service || item.productType || '')
              .trim()
              .toUpperCase()
            const matches = itemService === filterValue
            return matches
          })
        } else if (service === 'Front Desk') {
          // Filter to show all items EXCEPT Pharmacy
          filteredSalesData = filteredSalesData.filter((item) => {
            if (!item) return false
            // Check both service and productType fields with case-insensitive comparison
            const itemService = String(item.service || item.productType || '')
              .trim()
              .toUpperCase()
            // Exclude Pharmacy items
            return itemService !== 'PHARMACY'
          })

          filteredReturnData = filteredReturnData.filter((item) => {
            if (!item) return false
            // Check both service and productType fields with case-insensitive comparison
            const itemService = String(item.service || item.productType || '')
              .trim()
              .toUpperCase()
            // Exclude Pharmacy items
            return itemService !== 'PHARMACY'
          })
        }

        console.log('Service filter results:', {
          beforeFilterCount,
          afterFilterCount: filteredSalesData.length,
          filterValue: service,
          originalSalesCount: (salesDashboardData.salesData || []).length,
          filteredSalesCount: filteredSalesData.length,
          originalReturnsCount: (salesDashboardData.returnData || []).length,
          filteredReturnsCount: filteredReturnData.length,
        })
      }

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

      setFilteredData(filtered)

      console.log('Final filtered data summary:', {
        salesCount: filteredSalesData.length,
        returnsCount: filteredReturnData.length,
        totalSales: filtered.salesDashboard?.totalSales,
        totalReturns: filtered.salesDashboard?.totalReturns,
        branchId,
        branchIdIsAll: branchId === 'ALL',
      })
    } catch (error) {
      console.error('Error processing sales dashboard data:', error)
    }
  }, [salesDashboardData, paymentMode, service, branchId, dropdowns?.branches])

  const handleApplyFilters = () => {
    setAppliedFromDate(fromDate)
    setAppliedToDate(toDate)
    // When "ALL" is selected, set appliedBranchId to "ALL" to trigger multi-branch fetch
    if (branchId === 'ALL') {
      setAppliedBranchId('ALL')
    } else {
      setAppliedBranchId(branchId)
    }
    setAppliedPaymentMode(paymentMode || 'ALL')
  }

  const handleResetFilters = () => {
    const defaultTo = new Date()
    const defaultFrom = defaultTo // From Date = To Date on reset
    // Set default branch to HNK
    const hnkBranch = dropdowns?.branches?.find(
      (branch) => branch.name === 'HNK' || branch.name === 'hnk',
    )
    const defaultBranch = hnkBranch?.id || dropdowns?.branches?.[0]?.id || ''
    setFromDate(defaultFrom)
    setToDate(defaultTo)
    setBranchId(defaultBranch)
    setPaymentMode('ALL')
    setService('ALL')
    setFilteredData(null)
    setAppliedFromDate(defaultFrom)
    setAppliedToDate(defaultTo)
    setAppliedBranchId(defaultBranch)
    setAppliedPaymentMode('ALL')
  }

  // Don't render if user doesn't have access
  if (userDetails?.email && !hasRevenueNewAccess(userDetails.email)) {
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
                filteredData?.salesDashboard?.totalSales ??
                salesDashboardData?.salesDashboard?.totalSales ??
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
                filteredData?.salesDashboard?.totalReturns ??
                salesDashboardData?.salesDashboard?.totalReturns ??
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
        {/* SERVICE FILTER */}
        <Grid item xs={12} sm={3}>
          <FormControl
            variant="outlined"
            className="bg-white"
            sx={{
              width: '125px',
              '& .MuiInputBase-root': {
                height: '56px', // Same height as other filters
              },
            }}
          >
            <InputLabel>Service</InputLabel>
            <Select
              label="Service"
              name="service"
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="flex h-full"
            >
              <MenuItem value="ALL">All</MenuItem>
              <MenuItem value="Pharmacy">Pharmacy</MenuItem>
              <MenuItem value="Front Desk">Front Desk</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        {/* END SERVICE FILTER */}
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
              <MenuItem value="ALL">ALL</MenuItem>
              {dropdowns?.branches
                ?.filter(
                  (branch) =>
                    branch.name !== 'OBH' &&
                    branch.name !== '02' &&
                    branch.name !== 'kmm03' &&
                    branch.name !== 'HYD-KKT',
                )
                ?.map((branch, idx) => (
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
        branchId="ALL"
        reportName="Revenue_New_Report"
        reportType="revenue"
        branchName={
          branchId === 'ALL'
            ? 'ALL'
            : dropdowns?.branches?.find(
                (branch) => branch.id === appliedBranchId,
              )?.name
        }
        filters={{
          fromDate: appliedFromDate
            ? dayjs(appliedFromDate).format('YYYY-MM-DD')
            : '',
          toDate: appliedToDate
            ? dayjs(appliedToDate).format('YYYY-MM-DD')
            : '',
          branchId: branchId === 'ALL' ? 'ALL' : appliedBranchId,
        }}
        activeView={activeView}
        showRevenueRowActions={hasRevenueNewRowActionsAccess(
          userDetails?.email,
        )}
        accessToken={userDetails?.accessToken}
        onRevenueMutationSuccess={() => refetch()}
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
