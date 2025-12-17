import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Autocomplete,
  Chip,
  Breadcrumbs,
  CircularProgress,
  Skeleton,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import { DataGrid } from '@mui/x-data-grid'
import { Pie, Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import dayjs from 'dayjs'
import Breadcrumb from '@/components/Breadcrumb'
import { getPatientReport } from '@/constants/apis'
import { exportAsExcel, exportAsPDF } from '@/utils/reportExport'
import { Search, FilterList, Refresh, GetApp } from '@mui/icons-material'

// Register Chart.js components
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
)

const STATUS_OPTIONS = ['Active', 'Completed', 'Dropped', 'On Hold']
const UPT_RESULT_OPTIONS = ['Positive', 'Negative', 'Pending']

function PatientReport() {
  const userDetails = useSelector((store) => store.user)
  const dropdowns = useSelector((store) => store.dropdowns)

  // Filter states
  const [fromDate, setFromDate] = useState(
    dayjs().subtract(1, 'year').format('YYYY-MM-DD'),
  )
  const [toDate, setToDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [selectedBranches, setSelectedBranches] = useState([])
  const [referralSource, setReferralSource] = useState(null)
  const [treatmentType, setTreatmentType] = useState(null)
  const [packageName, setPackageName] = useState(null)
  const [cycle, setCycle] = useState(null)
  const [status, setStatus] = useState(null)
  const [uptResult, setUptResult] = useState(null)
  const [paidAmountMin, setPaidAmountMin] = useState('')
  const [paidAmountMax, setPaidAmountMax] = useState('')
  const [pendingAmountMin, setPendingAmountMin] = useState('')
  const [pendingAmountMax, setPendingAmountMax] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)

  // Build query params
  const queryParams = useMemo(() => {
    const params = {
      fromDate,
      toDate,
      page,
      limit: pageSize,
    }
    if (selectedBranches.length > 0) {
      params.branchIds = selectedBranches.map((b) => b.id)
    }
    if (referralSource) params.referralSource = referralSource.id
    if (treatmentType) params.treatmentType = treatmentType.id
    if (packageName) params.packageName = packageName.id
    if (cycle) params.cycle = cycle
    if (status) params.status = status
    if (uptResult) params.uptResult = uptResult
    if (paidAmountMin) params.paidAmountMin = parseFloat(paidAmountMin)
    if (paidAmountMax) params.paidAmountMax = parseFloat(paidAmountMax)
    if (pendingAmountMin) params.pendingAmountMin = parseFloat(pendingAmountMin)
    if (pendingAmountMax) params.pendingAmountMax = parseFloat(pendingAmountMax)
    if (search.trim()) params.search = search.trim()
    return params
  }, [
    fromDate,
    toDate,
    selectedBranches,
    referralSource,
    treatmentType,
    packageName,
    cycle,
    status,
    uptResult,
    paidAmountMin,
    paidAmountMax,
    pendingAmountMin,
    pendingAmountMax,
    search,
    page,
    pageSize,
  ])

  // Fetch data
  const {
    data: reportData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['patientReport', queryParams],
    queryFn: () => getPatientReport(userDetails?.accessToken, queryParams),
    enabled: !!userDetails?.accessToken && !!fromDate && !!toDate,
  })

  const reportRows = reportData?.data?.data || []
  const charts = reportData?.data?.charts || {}
  const pagination = reportData?.data?.pagination || { total: 0, page: 1 }

  // Reset filters
  const handleResetFilters = () => {
    setFromDate(dayjs().subtract(1, 'year').format('YYYY-MM-DD'))
    setToDate(dayjs().format('YYYY-MM-DD'))
    setSelectedBranches([])
    setReferralSource(null)
    setTreatmentType(null)
    setPackageName(null)
    setCycle(null)
    setStatus(null)
    setUptResult(null)
    setPaidAmountMin('')
    setPaidAmountMax('')
    setPendingAmountMin('')
    setPendingAmountMax('')
    setSearch('')
    setPage(1)
  }

  // Apply filters
  const handleApplyFilters = () => {
    setPage(1)
    refetch()
  }

  // Export functions
  const handleExportExcel = () => {
    if (reportRows.length === 0) {
      alert('No data to export')
      return
    }
    exportAsExcel(reportRows, columns, {
      reportName: 'Patient_Report',
      branchName:
        selectedBranches.map((b) => b.name).join(', ') || 'All_Branches',
    })
  }

  const handleExportPDF = () => {
    if (reportRows.length === 0) {
      alert('No data to export')
      return
    }
    exportAsPDF(reportRows, columns, {
      reportName: 'Patient_Report',
      branchName:
        selectedBranches.map((b) => b.name).join(', ') || 'All_Branches',
    })
  }

  // Chart data preparation
  const statusChartData = useMemo(() => {
    const statusData = charts.statusDistribution || {}
    return {
      labels: Object.keys(statusData),
      datasets: [
        {
          data: Object.values(statusData),
          backgroundColor: ['#4CAF50', '#2196F3', '#F44336', '#FF9800'],
          borderWidth: 2,
        },
      ],
    }
  }, [charts.statusDistribution])

  const revenueChartData = useMemo(() => {
    const revenueData = charts.revenueByBranch || {}
    const branches = Object.keys(revenueData)
    return {
      labels: branches,
      datasets: [
        {
          label: 'Paid Amount',
          data: branches.map((b) => revenueData[b]?.paidAmount || 0),
          backgroundColor: '#4CAF50',
        },
        {
          label: 'Pending Amount',
          data: branches.map((b) => revenueData[b]?.pendingAmount || 0),
          backgroundColor: '#FF9800',
        },
      ],
    }
  }, [charts.revenueByBranch])

  const embryologyChartData = useMemo(() => {
    const embryoData = charts.embryologySummary || {}
    return {
      labels: ['Total', 'Used', 'Remaining', 'Discarded'],
      datasets: [
        {
          label: 'Embryos',
          data: [
            embryoData.totalEmbryos || 0,
            embryoData.used || 0,
            embryoData.remaining || 0,
            embryoData.discarded || 0,
          ],
          backgroundColor: ['#2196F3', '#4CAF50', '#FF9800', '#F44336'],
        },
      ],
    }
  }, [charts.embryologySummary])

  const uptChartData = useMemo(() => {
    const uptData = charts.uptResults || {}
    return {
      labels: Object.keys(uptData),
      datasets: [
        {
          data: Object.values(uptData),
          backgroundColor: ['#4CAF50', '#F44336', '#FF9800'],
          borderWidth: 2,
        },
      ],
    }
  }, [charts.uptResults])

  // Table columns
  const columns = [
    { field: 'date', headerName: 'Date', width: 120 },
    { field: 'branch', headerName: 'Branch', width: 120 },
    { field: 'patientName', headerName: 'Patient Name', width: 200 },
    { field: 'patientNumber', headerName: 'Patient Number', width: 150 },
    { field: 'referralSource', headerName: 'Referral Source', width: 180 },
    { field: 'plan', headerName: 'Plan', width: 120 },
    { field: 'treatmentType', headerName: 'Treatment Type', width: 180 },
    { field: 'package', headerName: 'Package', width: 120 },
    { field: 'cycle', headerName: 'Cycle', width: 80 },
    { field: 'status', headerName: 'Status', width: 120 },
    {
      field: 'paidAmount',
      headerName: 'Paid Amount',
      width: 130,
      type: 'number',
      valueFormatter: (params) => `₹${params.value?.toFixed(2) || '0.00'}`,
    },
    {
      field: 'pendingAmount',
      headerName: 'Pending Amount',
      width: 140,
      type: 'number',
      valueFormatter: (params) => `₹${params.value?.toFixed(2) || '0.00'}`,
    },
    {
      field: 'noOfEmbryos',
      headerName: 'No. of Embryos',
      width: 130,
      type: 'number',
    },
    {
      field: 'noOfEmbryosUsed',
      headerName: 'No. of Embryos Used',
      width: 160,
      type: 'number',
    },
    {
      field: 'noOfEmbryosRemaining',
      headerName: 'No. of Embryos Remaining',
      width: 180,
      type: 'number',
    },
    { field: 'lastRenewalDate', headerName: 'Last Renewal Date', width: 150 },
    {
      field: 'noOfEmbryosDiscarded',
      headerName: 'No. of Embryos Discarded',
      width: 180,
      type: 'number',
    },
    { field: 'uptResult', headerName: 'UPT Result', width: 120 },
  ]

  return (
    <Box sx={{ p: 3 }}>
      <Breadcrumb
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Reports', href: '/reports' },
          { label: 'Patient Report', href: '/reports/patient-report' },
        ]}
      />

      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        Patient Report
      </Typography>

      {/* Filters Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Filters
        </Typography>
        <Grid container spacing={2}>
          {/* Date Filters */}
          <Grid item xs={12} md={3}>
            <DatePicker
              label="From Date"
              value={dayjs(fromDate)}
              onChange={(newValue) =>
                setFromDate(newValue?.format('YYYY-MM-DD') || '')
              }
              slotProps={{ textField: { fullWidth: true, size: 'small' } }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <DatePicker
              label="To Date"
              value={dayjs(toDate)}
              onChange={(newValue) =>
                setToDate(newValue?.format('YYYY-MM-DD') || '')
              }
              slotProps={{ textField: { fullWidth: true, size: 'small' } }}
            />
          </Grid>

          {/* Branch Multi-select */}
          <Grid item xs={12} md={3}>
            <Autocomplete
              multiple
              options={dropdowns?.branches || []}
              getOptionLabel={(option) => option.name || ''}
              value={selectedBranches}
              onChange={(event, newValue) => setSelectedBranches(newValue)}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={option.name}
                    {...getTagProps({ index })}
                    key={option.id}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField {...params} label="Branch" size="small" />
              )}
            />
          </Grid>

          {/* Referral Source */}
          <Grid item xs={12} md={3}>
            <Autocomplete
              options={dropdowns?.referralTypes || []}
              getOptionLabel={(option) => option.name || ''}
              value={referralSource}
              onChange={(event, newValue) => setReferralSource(newValue)}
              renderInput={(params) => (
                <TextField {...params} label="Referral Source" size="small" />
              )}
            />
          </Grid>

          {/* Treatment Type */}
          <Grid item xs={12} md={3}>
            <Autocomplete
              options={dropdowns?.treatmentTypes || []}
              getOptionLabel={(option) => option.name || ''}
              value={treatmentType}
              onChange={(event, newValue) => setTreatmentType(newValue)}
              renderInput={(params) => (
                <TextField {...params} label="Treatment Type" size="small" />
              )}
            />
          </Grid>

          {/* Package */}
          <Grid item xs={12} md={3}>
            <Autocomplete
              options={dropdowns?.packages || []}
              getOptionLabel={(option) => option.name || ''}
              value={packageName}
              onChange={(event, newValue) => setPackageName(newValue)}
              renderInput={(params) => (
                <TextField {...params} label="Package" size="small" />
              )}
            />
          </Grid>

          {/* Cycle */}
          <Grid item xs={12} md={3}>
            <TextField
              label="Cycle"
              type="number"
              value={cycle || ''}
              onChange={(e) =>
                setCycle(e.target.value ? parseInt(e.target.value) : null)
              }
              size="small"
              fullWidth
            />
          </Grid>

          {/* Status */}
          <Grid item xs={12} md={3}>
            <Autocomplete
              options={STATUS_OPTIONS}
              value={status}
              onChange={(event, newValue) => setStatus(newValue)}
              renderInput={(params) => (
                <TextField {...params} label="Status" size="small" />
              )}
            />
          </Grid>

          {/* UPT Result */}
          <Grid item xs={12} md={3}>
            <Autocomplete
              options={UPT_RESULT_OPTIONS}
              value={uptResult}
              onChange={(event, newValue) => setUptResult(newValue)}
              renderInput={(params) => (
                <TextField {...params} label="UPT Result" size="small" />
              )}
            />
          </Grid>

          {/* Paid Amount Range */}
          <Grid item xs={12} md={3}>
            <TextField
              label="Paid Amount (Min)"
              type="number"
              value={paidAmountMin}
              onChange={(e) => setPaidAmountMin(e.target.value)}
              size="small"
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              label="Paid Amount (Max)"
              type="number"
              value={paidAmountMax}
              onChange={(e) => setPaidAmountMax(e.target.value)}
              size="small"
              fullWidth
            />
          </Grid>

          {/* Pending Amount Range */}
          <Grid item xs={12} md={3}>
            <TextField
              label="Pending Amount (Min)"
              type="number"
              value={pendingAmountMin}
              onChange={(e) => setPendingAmountMin(e.target.value)}
              size="small"
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              label="Pending Amount (Max)"
              type="number"
              value={pendingAmountMax}
              onChange={(e) => setPendingAmountMax(e.target.value)}
              size="small"
              fullWidth
            />
          </Grid>

          {/* Search */}
          <Grid item xs={12} md={6}>
            <TextField
              label="Search (Patient Name / Number)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              fullWidth
              InputProps={{
                startAdornment: (
                  <Search sx={{ mr: 1, color: 'text.secondary' }} />
                ),
              }}
            />
          </Grid>

          {/* Action Buttons */}
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<FilterList />}
                onClick={handleApplyFilters}
              >
                Apply Filters
              </Button>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={handleResetFilters}
              >
                Reset
              </Button>
              <Button
                variant="outlined"
                startIcon={<GetApp />}
                onClick={handleExportExcel}
                disabled={reportRows.length === 0}
              >
                Export Excel
              </Button>
              <Button
                variant="outlined"
                startIcon={<GetApp />}
                onClick={handleExportPDF}
                disabled={reportRows.length === 0}
              >
                Export PDF
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Charts Section */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* Chart 1: Status Distribution */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Patient Count by Status
              </Typography>
              <Box sx={{ height: 300 }}>
                <Doughnut
                  data={statusChartData}
                  options={{ responsive: true, maintainAspectRatio: false }}
                />
              </Box>
            </Paper>
          </Grid>

          {/* Chart 2: Revenue Overview */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Revenue Overview by Branch
              </Typography>
              <Box sx={{ height: 300 }}>
                <Bar
                  data={revenueChartData}
                  options={{ responsive: true, maintainAspectRatio: false }}
                />
              </Box>
            </Paper>
          </Grid>

          {/* Chart 3: Embryology Summary */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Embryology Summary
              </Typography>
              <Box sx={{ height: 300 }}>
                <Bar
                  data={embryologyChartData}
                  options={{ responsive: true, maintainAspectRatio: false }}
                />
              </Box>
            </Paper>
          </Grid>

          {/* Chart 4: UPT Results */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                UPT Results Distribution
              </Typography>
              <Box sx={{ height: 300 }}>
                <Pie
                  data={uptChartData}
                  options={{ responsive: true, maintainAspectRatio: false }}
                />
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Data Table */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Patient Data ({pagination.total} records)
        </Typography>
        {isLoading ? (
          <Box sx={{ p: 2 }}>
            <Skeleton variant="rectangular" height={400} />
          </Box>
        ) : (
          <DataGrid
            rows={reportRows}
            columns={columns}
            pageSize={pageSize}
            rowsPerPageOptions={[25, 50, 100]}
            onPageSizeChange={(newPageSize) => {
              setPageSize(newPageSize)
              setPage(1)
            }}
            pagination
            paginationMode="server"
            rowCount={pagination.total}
            page={page - 1}
            onPageChange={(newPage) => setPage(newPage + 1)}
            autoHeight
            disableSelectionOnClick
            sx={{ border: 'none' }}
          />
        )}
      </Paper>
    </Box>
  )
}

export default PatientReport
