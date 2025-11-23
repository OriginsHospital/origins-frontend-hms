import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Card, CardContent } from '@mui/material'
import dayjs from 'dayjs'
import SalesChart from './charts/SalesChart'
import FilteredDataGrid from './FilteredDataGrid'

const SERVICE_COLORS = {
  'IVF PACKAGE': '#27ae60',
  PHARMACY: '#008080',
  'LAB TEST': '#f39c12',
  CONSULTATION: '#2980b9',
  SONOGRAPHY: '#9b59b6',
  PROCEDURE: '#16a085',
  MEDICATION: '#1abc9c',
  'OPD PACKAGE': '#d35400',
}

const FALLBACK_COLORS = [
  '#1abc9c',
  '#3498db',
  '#9b59b6',
  '#f1c40f',
  '#e67e22',
  '#e74c3c',
  '#2ecc71',
  '#34495e',
  '#7f8c8d',
]

const SalesDashboard = ({
  data,
  branchId,
  labels,
  activeView,
  reportName,
  reportType,
  branchName,
  filters: reportFilters,
}) => {
  const [filters, setFilters] = useState({
    patientName: '',
    productType: '',
    paymentMode: '',
    dateRange: {
      start: null,
      end: null,
    },
  })
  const [visibleSalesRows, setVisibleSalesRows] = useState([])
  const [isChartLoading, setIsChartLoading] = useState(false)
  const debounceRef = useRef(null)
  const prevRowsSignatureRef = useRef('')

  const computeRowsSignature = useCallback((rows) => {
    if (!rows || rows.length === 0) return '__EMPTY__'
    return rows
      .map(
        (row) => `${row.orderId}-${row.productType}-${Number(row.amount) || 0}`,
      )
      .join('|')
  }, [])

  // Normalize incoming rows to ensure consistent fields for display and export
  const normalizeRow = (row) => {
    if (!row) return row
    const lastNameFromDb = row.last_name ?? row.lastName ?? ''
    const firstNameFromDb = row.first_name ?? row.firstName ?? ''

    let lastName = lastNameFromDb
    let firstName = firstNameFromDb

    // If DB fields are missing, try to derive from existing patientName (fallback)
    if ((!lastName || !firstName) && row.patientName) {
      const parts = String(row.patientName).trim().split(/\s+/)
      if (parts.length > 0) {
        firstName = parts[0] // First part is the first name
        if (parts.length > 1) {
          // Rest of the parts combine to form the last name
          lastName = parts.slice(1).join(' ')
        }
      }
    }

    // Create the patient name in the format: last_name + ' ' + first_name (surname first)
    const combinedPatientName = [lastName, firstName]
      .filter(Boolean)
      .join(' ')
      .trim()

    return {
      ...row,
      lastName: lastName || '',
      firstName: firstName || '',
      patientName: combinedPatientName,
    }
  }

  const dataNormalizedSales = (data?.salesData || []).map(normalizeRow)
  const dataNormalizedReturns = (data?.returnData || []).map(normalizeRow)

  const rowsForActiveBranch = useMemo(() => {
    return (dataNormalizedSales || []).filter(
      (row) => row.branchId === branchId,
    )
  }, [dataNormalizedSales, branchId])

  const rowsForActiveBranchReturns = useMemo(() => {
    return (dataNormalizedReturns || []).filter(
      (row) => row.branchId === branchId,
    )
  }, [dataNormalizedReturns, branchId])

  const scheduleVisibleRowsUpdate = useCallback(
    (rows) => {
      const signature = computeRowsSignature(rows)
      if (signature === prevRowsSignatureRef.current) {
        return
      }

      prevRowsSignatureRef.current = signature

      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      setIsChartLoading(true)
      debounceRef.current = setTimeout(() => {
        setVisibleSalesRows(rows || [])
        setIsChartLoading(false)
        debounceRef.current = null
      }, 250)
    },
    [computeRowsSignature],
  )

  useEffect(() => {
    scheduleVisibleRowsUpdate(rowsForActiveBranch)
  }, [rowsForActiveBranch, scheduleVisibleRowsUpdate])

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  const columns = [
    {
      field: 'date',
      headerName: 'Date',
      flex: 1,
      align: 'left',
      headerAlign: 'left',
      renderCell: (params) => (
        <div>{dayjs(params?.row?.date).format('DD-MM-YYYY')}</div>
      ),
      filterField: 'date',
    },
    {
      field: 'patientName',
      headerName: 'Patient Name',
      type: 'string',
      flex: 2,
      align: 'left',
      headerAlign: 'left',
      filterField: 'patientName',
      renderCell: (params) => <div>{params?.row?.patientName || ''}</div>,
      // Support searching by both first and last name
      valueGetter: (params) => params?.row?.patientName || '',
      filterOperators: [
        {
          label: 'contains',
          value: 'contains',
          getApplyFilterFn: (filterItem) => {
            if (!filterItem.value) {
              return null
            }
            return (params) => {
              const searchValue = filterItem.value.toLowerCase()
              const patientName = (params.value || '').toLowerCase()
              return patientName.includes(searchValue)
            }
          },
        },
      ],
    },
    {
      field: 'productType',
      headerName: 'Service',
      flex: 1.2,
      align: 'left',
      headerAlign: 'left',
      renderCell: (params) => (
        <>
          {params?.row?.productType?.charAt(0).toUpperCase() +
            params?.row?.productType?.slice(1).toLowerCase()}
        </>
      ),
      filterField: 'productType',
    },
    {
      field: 'paymentMode',
      headerName: 'Payment Mode',
      flex: 1.2,
      align: 'left',
      headerAlign: 'left',
      renderCell: (params) => {
        if (params?.row?.paymentMode) {
          return (
            <>
              {params?.row?.paymentMode?.charAt(0).toUpperCase() +
                params?.row?.paymentMode?.slice(1).toLowerCase()}
            </>
          )
        } else return <>Cash</>
      },
      filterField: 'paymentMode',
    },
    {
      field: 'amount',
      headerName: 'Amount',
      type: 'number',
      flex: 1,
      align: 'left',
      headerAlign: 'left',
      // Round the displayed value
      renderCell: (params) => {
        const amount = params?.row?.amount
        return <div>{amount ? Math.round(amount) : 0}</div>
      },
      // Format value for exports and sorting
      valueFormatter: (params) => {
        const amount = params?.value
        return amount ? Math.round(amount) : 0
      },
      // Keep original value for sorting
      sortComparator: (v1, v2) => v1 - v2,
    },
    {
      field: 'discountAmount',
      headerName: 'Discount',
      type: 'number',
      flex: 1,
      align: 'left',
      headerAlign: 'left',
    },
  ]

  // Function to filter data based on current filters
  // const getFilteredData = rawData => {
  //   if (!rawData) return []

  //   return rawData.filter(row => {
  //     // Filter by patient name
  //     if (
  //       filters.patientName &&
  //       !row.patientName
  //         ?.toLowerCase()
  //         .includes(filters.patientName.toLowerCase())
  //     ) {
  //       return false
  //     }

  //     // Filter by product type
  //     if (filters.productType && row.productType !== filters.productType) {
  //       return false
  //     }

  //     // Filter by payment mode
  //     if (filters.paymentMode && row.paymentMode !== filters.paymentMode) {
  //       return false
  //     }

  //     // Filter by date range
  //     // const rowDate = dayjs(row.date)
  //     // if (filters.dateRange.start) {
  //     //   const startDate = dayjs(filters.dateRange.start).startOf('day')
  //     //   if (!rowDate.isValid() || rowDate.isBefore(startDate)) {
  //     //     return false
  //     //   }
  //     // }
  //     // if (filters.dateRange.end) {
  //     //   const endDate = dayjs(filters.dateRange.end).endOf('day')
  //     //   if (!rowDate.isValid() || rowDate.isAfter(endDate)) {
  //     //     return false
  //     //   }
  //     // }

  //     return true
  //   })
  // }

  // Get unique values for dropdowns
  const getUniqueValues = (field) => {
    // Use normalized sales data when available so fields like lastName/firstName work
    const source = dataNormalizedSales || data?.salesData || []
    const values = new Set(source.map((row) => row[field]) || [])
    return Array.from(values).filter(Boolean)
  }

  const customFilters = [
    {
      field: 'patientName',
      label: 'Patient Name',
      type: 'text',
    },
    {
      field: 'productType',
      label: 'Service Type',
      type: 'select',
      options: getUniqueValues('productType').map((value) => ({
        value,
        label: value.charAt(0).toUpperCase() + value.slice(1).toLowerCase(),
      })),
    },
    {
      field: 'paymentMode',
      label: 'Payment Mode',
      type: 'select',
      options: getUniqueValues('paymentMode').map((value) => ({
        value,
        label: value.charAt(0).toUpperCase() + value.slice(1).toLowerCase(),
      })),
    },
    {
      field: 'amount',
      label: 'Amount',
      type: 'number',
    },
  ]

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters)
  }

  const filterData = (data, filters) => {
    if (!data) return []
    return data.filter((row) => {
      return Object.entries(filters).every(([field, filter]) => {
        if (!filter || !filter.value) return true

        // Handle different field types
        switch (field) {
          case 'patientName':
            const patientName = row.patientName
            if (!patientName) return false

            if (filter.prefix === 'LIKE') {
              return patientName
                .toLowerCase()
                .includes(filter.value.toLowerCase())
            }
            return filter.prefix === 'NOT LIKE'
              ? !patientName.toLowerCase().includes(filter.value.toLowerCase())
              : true
          case 'productType':
            const serviceName = row.productType
            if (!serviceName) return false

            if (filter.prefix === 'IN') {
              return filter.value.includes(serviceName)
            }
            return filter.prefix === 'NOT IN'
              ? !filter.value.includes(serviceName)
              : true
          case 'paymentMode':
            const paymentMode = row.paymentMode
            if (!paymentMode) return false

            if (filter.prefix === 'IN') {
              return filter.value.includes(paymentMode)
            }
            return filter.prefix === 'NOT IN'
              ? !filter.value.includes(paymentMode)
              : true

          case 'amount':
            const amount = Number(row.amount)
            const filterValue = Number(filter.value)

            if (isNaN(amount) || isNaN(filterValue)) return true

            switch (filter.prefix) {
              case 'LESS_THAN':
                return amount < filterValue
              case 'GREATER_THAN':
                return amount > filterValue
              default:
                return true
            }

          default:
            return true
        }
      })
    })
  }

  // Transform data for the pie charts with null checks
  // Use normalized sales data for any aggregations
  const chartData = {
    totalSalesProductTypeWise: [],
    totalSales: data?.salesDashboard?.totalSales || 0,
    totalReturns: data?.salesDashboard?.totalReturns || 0,
  }

  const pieChartDataset = useMemo(() => {
    if (!visibleSalesRows || visibleSalesRows.length === 0) {
      return { labels: [], amounts: [], colors: [] }
    }

    const totalsByService = visibleSalesRows.reduce((acc, row) => {
      const key = String(row.productType || 'Unknown').toUpperCase()
      if (!acc[key]) {
        acc[key] = 0
      }
      acc[key] += Number(row.amount) || 0
      return acc
    }, {})

    const labels = Object.keys(totalsByService)
    const amounts = labels.map((label) => totalsByService[label])

    const assignedColors = labels.map((label, index) => {
      if (SERVICE_COLORS[label]) {
        return SERVICE_COLORS[label]
      }
      const fallbackIndex = index % FALLBACK_COLORS.length
      return FALLBACK_COLORS[fallbackIndex]
    })

    return { labels, amounts, colors: assignedColors }
  }, [visibleSalesRows])

  const hasChartData =
    pieChartDataset.labels.length > 0 &&
    pieChartDataset.amounts.some((amount) => amount > 0)

  return (
    <div className="grid grid-cols-12 gap-5">
      {/* Table Section with null check */}
      {activeView === 'sales' ? (
        <div className="col-span-12 lg:col-span-8">
          <SalesTable
            data={rowsForActiveBranch}
            title="Sales"
            columns={columns}
            branchId={branchId}
            customFilters={customFilters}
            filterData={filterData}
            getUniqueValues={getUniqueValues}
            reportName={reportName}
            reportType={reportType}
            branchName={branchName}
            filters={reportFilters}
            onRowsChange={scheduleVisibleRowsUpdate}
          />
        </div>
      ) : (
        <div className="col-span-12">
          <SalesTable
            data={rowsForActiveBranchReturns}
            title={labels?.returns || 'Refunds'}
            columns={columns}
            branchId={branchId}
            customFilters={customFilters}
            filterData={filterData}
            getUniqueValues={getUniqueValues}
            reportName={reportName}
            reportType={reportType}
            branchName={branchName}
            filters={reportFilters}
          />
        </div>
      )}
      {/* Chart Section with null check */}
      <div className="col-span-12 lg:col-span-4">
        {activeView === 'sales' ? (
          <SalesChart
            dataset={pieChartDataset}
            isLoading={isChartLoading}
            hasData={hasChartData}
          />
        ) : (
          <div className="text-center p-4 text-gray-500">
            No chart available for the selected view
          </div>
        )}
      </div>
    </div>
  )
}

const SalesTable = ({
  data,
  title,
  columns,
  branchId,
  customFilters,
  filterData,
  getUniqueValues,
  reportName,
  reportType,
  branchName,
  filters,
  onRowsChange,
}) => (
  <div className="p-5">
    {/* <Typography variant="h6" className="mb-4">
      {title}
    </Typography> */}
    <FilteredDataGrid
      key={`SalesTable-${branchId}-${data?.length}`}
      rows={data || []}
      getRowId={(row) => row.orderId + row.productType}
      columns={columns}
      className="h-[60vh]"
      customFilters={customFilters}
      filterData={filterData}
      getUniqueValues={getUniqueValues}
      reportName={reportName}
      reportType={reportType}
      branchName={branchName}
      filters={filters}
      onRowsChange={onRowsChange}
    />
  </div>
)

export default SalesDashboard
