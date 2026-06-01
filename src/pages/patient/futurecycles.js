import { withPermission } from '@/components/withPermission'
import { getFutureCycles } from '@/constants/apis'
import { ACCESS_TYPES } from '@/constants/constants'
import {
  Avatar,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'

const MONTHS = [
  { value: '', label: 'All Months' },
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
]

const getMonthLabel = (month) =>
  MONTHS.find((m) => m.value === month)?.label || month

function FutureCyclesPage() {
  const userDetails = useSelector((store) => store.user)
  const dropdowns = useSelector((store) => store.dropdowns)
  const { branches } = dropdowns || {}

  const currentYear = new Date().getFullYear()
  const [branchId, setBranchId] = useState('')
  const [cycleMonth, setCycleMonth] = useState('')
  const [cycleYear, setCycleYear] = useState('')

  const yearOptions = useMemo(() => {
    const years = [{ value: '', label: 'All Years' }]
    for (let y = currentYear; y <= currentYear + 5; y++) {
      years.push({ value: y, label: String(y) })
    }
    return years
  }, [currentYear])

  const activeBranches = useMemo(
    () => branches?.filter((b) => b.isActive !== false) || [],
    [branches],
  )

  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ['futureCycles', branchId, cycleMonth, cycleYear],
    queryFn: () =>
      getFutureCycles(userDetails?.accessToken, {
        branchId: branchId || undefined,
        cycleMonth: cycleMonth || undefined,
        cycleYear: cycleYear || undefined,
      }),
    enabled: !!userDetails?.accessToken,
  })

  const rows = useMemo(() => {
    const list = data?.data || []
    return list.map((row, index) => ({
      ...row,
      id: row.id || `${row.patientId}-${index}`,
      cityName: row.city?.name || '-',
      monthLabel: getMonthLabel(row.cycleMonth),
      branchDisplay: row.branch || row.branchName || '-',
    }))
  }, [data])

  const columns = [
    {
      field: 'patientName',
      headerName: 'Patient Name',
      flex: 1,
      minWidth: 200,
      renderCell: ({ row }) => (
        <div className="flex items-center gap-2 h-full">
          <Avatar
            src={row.photoPath}
            alt={row.patientName}
            sx={{ width: 40, height: 40 }}
          />
          <span>
            {row.patientName
              ? row.patientName.charAt(0).toUpperCase() +
                row.patientName.slice(1).toLowerCase()
              : '-'}
          </span>
        </div>
      ),
    },
    {
      field: 'monthLabel',
      headerName: 'Month',
      flex: 0.5,
      minWidth: 110,
    },
    {
      field: 'cycleYear',
      headerName: 'Year',
      flex: 0.4,
      minWidth: 80,
    },
    {
      field: 'mobileNo',
      headerName: 'Phone Number',
      flex: 0.6,
      minWidth: 130,
    },
    {
      field: 'cityName',
      headerName: 'City',
      flex: 0.5,
      minWidth: 120,
    },
    {
      field: 'branchDisplay',
      headerName: 'Branch',
      flex: 0.4,
      minWidth: 100,
    },
    {
      field: 'patientId',
      headerName: 'Patient ID',
      flex: 0.5,
      minWidth: 120,
    },
  ]

  return (
    <div className="w-full h-full p-5">
      <div className="flex flex-col gap-4 h-full">
        <h1 className="text-2xl font-semibold text-secondary m-0">
          Future Cycles
        </h1>

        <div className="flex flex-wrap gap-3 items-end">
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel id="fc-branch-filter">Branch</InputLabel>
            <Select
              labelId="fc-branch-filter"
              label="Branch"
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
            >
              <MenuItem value="">All Branches</MenuItem>
              {activeBranches.map((b) => (
                <MenuItem key={b.id} value={b.id}>
                  {b.branchCode || b.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel id="fc-year-filter">Year</InputLabel>
            <Select
              labelId="fc-year-filter"
              label="Year"
              value={cycleYear}
              onChange={(e) => setCycleYear(e.target.value)}
            >
              {yearOptions.map((y) => (
                <MenuItem key={y.label} value={y.value}>
                  {y.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel id="fc-month-filter">Month</InputLabel>
            <Select
              labelId="fc-month-filter"
              label="Month"
              value={cycleMonth}
              onChange={(e) => setCycleMonth(e.target.value)}
            >
              {MONTHS.map((m) => (
                <MenuItem key={m.label} value={m.value}>
                  {m.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>

        <div className="grow bg-white shadow rounded p-2">
          {isLoading || isFetching ? (
            <div className="flex justify-center items-center h-64">
              <CircularProgress />
            </div>
          ) : isError ? (
            <div className="flex justify-center items-center h-64 text-red-600">
              Failed to load future cycles
            </div>
          ) : (
            <DataGrid
              rows={rows}
              columns={columns}
              disableRowSelectionOnClick
              pageSizeOptions={[10, 25, 50]}
              initialState={{
                pagination: { paginationModel: { pageSize: 25 } },
              }}
              sx={{
                '& .MuiDataGrid-columnHeaders': { fontWeight: 'bold' },
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default withPermission(FutureCyclesPage, true, 'Patients', [
  ACCESS_TYPES.READ,
  ACCESS_TYPES.WRITE,
])
