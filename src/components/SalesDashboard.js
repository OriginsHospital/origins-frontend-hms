import React, { useState } from 'react'
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
} from '@mui/material'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { DatePicker } from '@mui/x-date-pickers'
import dayjs from 'dayjs'
import { DataGrid } from '@mui/x-data-grid'
import SalesChart from './charts/SalesChart'
import CustomToolbar from './CustomToolbar'
import FilteredDataGrid from './FilteredDataGrid'

const SalesDashboard = ({ data, branchId, labels, activeView, reportName, reportType, branchName, filters: reportFilters }) => {
  const [filters, setFilters] = useState({
    patientName: '',
    productType: '',
    paymentMode: '',
    dateRange: {
      start: null,
      end: null,
    },
  })

  const columns = [
    {
      field: 'date',
      headerName: 'Date',
      flex: 1,
      align: 'left',
      headerAlign: 'left',
      renderCell: params => (
        <div>{dayjs(params?.row?.date).format('DD-MM-YYYY')}</div>
      ),
      filterField: 'date',
    },
    {
      field: 'patientName',
      headerName: 'Patient Name',
      type: 'string',
      flex: 1.3,
      align: 'left',
      headerAlign: 'left',
      filterField: 'patientName',
    },
    {
      field: 'productType',
      headerName: 'Service',
      flex: 1.2,
      align: 'left',
      headerAlign: 'left',
      renderCell: params => (
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
      renderCell: params => {
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
  const getUniqueValues = field => {
    const values = new Set(data?.salesData?.map(row => row[field]) || [])
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
      options: getUniqueValues('productType').map(value => ({
        value,
        label: value.charAt(0).toUpperCase() + value.slice(1).toLowerCase(),
      })),
    },
    {
      field: 'paymentMode',
      label: 'Payment Mode',
      type: 'select',
      options: getUniqueValues('paymentMode').map(value => ({
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

  const handleApplyFilters = newFilters => {
    setFilters(newFilters)
  }

  const filterData = (data, filters) => {
    if (!data) return []
    return data.filter(row => {
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
  const chartData = {
    totalSalesProductTypeWise: data?.salesDashboard?.totalSalesProductTypeWise
      ? data.salesDashboard.totalSalesProductTypeWise.map(item => ({
          ...item,
          productType: item.productType,
        }))
      : [],
    // Add payment mode statistics
    totalSalesPaymentModeWise: data?.salesData
      ? Object.values(
          data.salesData.reduce((acc, item) => {
            const mode = item.paymentMode || 'CASH'
            if (!acc[mode]) {
              acc[mode] = { paymentMode: mode, amount: 0 }
            }
            acc[mode].amount += Number(item.amount) || 0
            return acc
          }, {}),
        )
      : [],
    totalSales: data?.salesDashboard?.totalSales || 0,
    totalReturns: data?.salesDashboard?.totalReturns || 0,
  }

  // Add null check for product type cards
  const hasProductTypeData =
    data?.salesDashboard?.totalSalesProductTypeWise &&
    data.salesDashboard.totalSalesProductTypeWise.length > 0

  return (
    <div className="grid grid-cols-12 gap-5">
      {/* Table Section with null check */}
      {activeView === 'sales' ? (
        <div className="col-span-8">
          <SalesTable
            data={data?.salesData || []}
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
          />
        </div>
      ) : (
        <div className="col-span-12">
          <SalesTable
            data={data?.returnData || []}
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
      <div className="col-span-4">
        {hasProductTypeData ? (
          <div className="col-span-8">
            {activeView === 'sales' && <SalesChart salesData={chartData} />}
          </div>
        ) : (
          <div className="text-center p-4 text-gray-500">
            No data available for the selected date range
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
}) => (
  <div className="p-5">
    {/* <Typography variant="h6" className="mb-4">
      {title}
    </Typography> */}
    <FilteredDataGrid
      key={`SalesTable-${branchId}-${data?.length}`}
      rows={data?.filter(e => e.branchId === branchId) || []}
      getRowId={row => row.orderId + row.productType}
      columns={columns}
      className="h-[60vh]"
      customFilters={customFilters}
      filterData={filterData}
      getUniqueValues={getUniqueValues}
      reportName={reportName}
      reportType={reportType}
      branchName={branchName}
      filters={filters}
    />
  </div>
)

export default SalesDashboard
