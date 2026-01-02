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

// Map service names (productType) to advance payment categories
const getCategoryFromServiceName = (serviceName) => {
  if (!serviceName) return 'Others'

  const upperServiceName = String(serviceName).toUpperCase().trim()

  // IVF Package - Registration Fee, D1, Trigger, Middle, FET, UPT, Donor Booking
  if (
    upperServiceName.includes('REGISTRATION') ||
    upperServiceName.includes('DAY1') ||
    upperServiceName === 'D1' ||
    upperServiceName.includes('TRIGGER') ||
    upperServiceName.includes('PICKUP') ||
    upperServiceName.includes('PICK UP') ||
    upperServiceName.includes('PICK-UP') ||
    upperServiceName.includes('FET') ||
    (upperServiceName.includes('UPT') &&
      !upperServiceName.includes('UPTPOSITIVE')) ||
    upperServiceName.includes('DONOR_BOOKING') ||
    upperServiceName.includes('DONOR BOOKING') ||
    upperServiceName === 'DONOR_BOOKING_AMOUNT' ||
    upperServiceName === 'DAY1_AMOUNT' ||
    upperServiceName === 'REGISTRATION_FEE' ||
    upperServiceName === 'FET_AMOUNT' ||
    upperServiceName === 'PICKUP_AMOUNT' ||
    upperServiceName.includes('MIDDLE')
  ) {
    return 'IVF Package'
  }

  // Embryo Freezing - All freezing-related services
  if (
    upperServiceName.includes('FREEZING') ||
    upperServiceName.includes('EMBRYO FREEZING') ||
    upperServiceName.includes('DAY5FREEZING') ||
    upperServiceName.includes('DAY5 FREEZING') ||
    upperServiceName === 'DAY5FREEZING_AMOUNT' ||
    (upperServiceName.includes('EMBRYO') &&
      upperServiceName.includes('FREEZING'))
  ) {
    return 'Embryo Freezing'
  }

  // PGTA - Preimplantation Genetic Testing
  if (
    upperServiceName.includes('PGTA') ||
    upperServiceName.includes('PGT') ||
    upperServiceName.includes('EMBRYOS FOR PGTA') ||
    (upperServiceName.includes('EMBRYO') &&
      upperServiceName.includes('PGTA')) ||
    upperServiceName.includes('PGT-A')
  ) {
    return 'PGTA'
  }

  // ERA - Endometrial Receptivity Analysis
  if (upperServiceName.includes('ERA') || upperServiceName === 'ERA_AMOUNT') {
    return 'ERA'
  }

  // Procedures - LSCS, Hysteroscopy, Consultation, Scan, Observation, etc.
  if (
    upperServiceName.includes('LSCS') ||
    upperServiceName.includes('HYSTEROSCOPY') ||
    upperServiceName.includes('HYTEROSCOPY') ||
    upperServiceName.includes('LAPAROSCOPY') ||
    upperServiceName.includes('POLYPECTOMY') ||
    upperServiceName.includes('CERCLAGE') ||
    upperServiceName.includes('CONSULTATION') ||
    upperServiceName.includes('OBSERVATION') ||
    upperServiceName.includes('OP FEE') ||
    upperServiceName === 'SCAN' ||
    upperServiceName.includes('SONOGRAPHY') ||
    upperServiceName.includes('OVULATION SCAN') ||
    upperServiceName.includes('DISCHARGE')
  ) {
    return 'Procedures'
  }

  // Donor Sperm
  if (
    upperServiceName.includes('DONOR SPERM') ||
    upperServiceName.includes('DONOR_SPERM')
  ) {
    return 'Donor Sperm'
  }

  // Microfluidics
  if (
    upperServiceName.includes('MICROFLUIDICS') ||
    upperServiceName.includes('MICRO FLUIDS') ||
    upperServiceName.includes('MICROFLUIDS') ||
    upperServiceName === 'MICRO FLUIDS'
  ) {
    return 'Microfluidics'
  }

  // Default to Others (Pharmacy, Lab Test, Medication, etc.)
  return 'Others'
}

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
    // When branchId is "ALL", show all rows without filtering
    if (branchId === 'ALL') {
      return dataNormalizedSales || []
    }
    // Otherwise, filter by branchId
    return (dataNormalizedSales || []).filter(
      (row) =>
        row.branchId === branchId || String(row.branchId) === String(branchId),
    )
  }, [dataNormalizedSales, branchId])

  const rowsForActiveBranchReturns = useMemo(() => {
    // When branchId is "ALL", show all rows without filtering
    if (branchId === 'ALL') {
      return dataNormalizedReturns || []
    }
    // Otherwise, filter by branchId
    return (dataNormalizedReturns || []).filter(
      (row) =>
        row.branchId === branchId || String(row.branchId) === String(branchId),
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

    // Group by advance payment category instead of individual service names
    const totalsByCategory = visibleSalesRows.reduce((acc, row) => {
      const serviceName = String(row.productType || 'Unknown')
      const category = getCategoryFromServiceName(serviceName)

      if (!acc[category]) {
        acc[category] = 0
      }
      acc[category] += Number(row.amount) || 0
      return acc
    }, {})

    // Define category order and colors
    const categoryOrder = [
      'IVF Package',
      'Embryo Freezing',
      'PGTA',
      'ERA',
      'Procedures',
      'Donor Sperm',
      'Microfluidics',
      'Others',
    ]

    const categoryColors = {
      'IVF Package': '#27ae60',
      'Embryo Freezing': '#3498db',
      PGTA: '#9b59b6',
      ERA: '#f1c40f',
      Procedures: '#e67e22',
      'Donor Sperm': '#e74c3c',
      Microfluidics: '#2ecc71',
      Others: '#34495e',
    }

    // Sort labels by predefined order, then by amount (descending)
    const labels = Object.keys(totalsByCategory).sort((a, b) => {
      const indexA = categoryOrder.indexOf(a)
      const indexB = categoryOrder.indexOf(b)

      // If both are in the order list, sort by index
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB
      }
      // If only one is in the order list, prioritize it
      if (indexA !== -1) return -1
      if (indexB !== -1) return 1
      // If neither is in the order list, sort by amount (descending)
      return totalsByCategory[b] - totalsByCategory[a]
    })

    const amounts = labels.map((label) => totalsByCategory[label])

    const assignedColors = labels.map((label) => {
      if (categoryColors[label]) {
        return categoryColors[label]
      }
      // Fallback color for unknown categories
      return '#7f8c8d'
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
