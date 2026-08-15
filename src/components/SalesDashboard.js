import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { Edit, Delete } from '@mui/icons-material'
import dayjs from 'dayjs'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import SalesChart from './charts/SalesChart'
import FilteredDataGrid from './FilteredDataGrid'
import { updateRevenueNewEntry, deleteRevenueNewEntry } from '@/constants/apis'
import { toastconfig } from '@/utils/toastconfig'
import {
  getRevenueBranchDisplayCode,
  getRevenueBranchFullName,
} from '@/utils/branchMapping'
import { roundCurrency } from '@/utils/currencyFormat'
import {
  buildCategoryDataset,
  getCategoryColor,
} from '@/utils/revenueCategories'

const sortRowsByPatientName = (rows = []) =>
  [...rows].sort((a, b) =>
    String(a?.patientName || '').localeCompare(
      String(b?.patientName || ''),
      undefined,
      { sensitivity: 'base' },
    ),
  )

const getReportBranchId = (row) => {
  if (!row) return null
  return (
    row.billingBranchId ??
    row.billedAtBranchId ??
    row.transactionBranchId ??
    row.paymentBranchId ??
    row.orderBranchId ??
    row.visitBranchId ??
    row.branchDetails?.id ??
    row.branch?.id ??
    row.branchId ??
    null
  )
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
  showRevenueRowActions = false,
  showBranchColumn = false,
  branchCatalog = [],
  dropdownBranches = [],
  accessToken,
  onRevenueMutationSuccess,
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
  const [editRow, setEditRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)
  const [editFormData, setEditFormData] = useState({
    totalOrderAmount: '',
    discountAmount: '',
    paidOrderAmount: '',
    paymentMode: '',
    productType: '',
    orderDate: '',
  })

  const resetEditForm = useCallback(() => {
    setEditFormData({
      totalOrderAmount: '',
      discountAmount: '',
      paidOrderAmount: '',
      paymentMode: '',
      productType: '',
      orderDate: '',
    })
  }, [])

  const updateRevenueMutation = useMutation({
    mutationFn: async ({ source, paymentMasterId, body }) => {
      return updateRevenueNewEntry(accessToken, source, paymentMasterId, body)
    },
    onSuccess: () => {
      toast.success('Entry updated successfully', toastconfig)
      setEditRow(null)
      resetEditForm()
      onRevenueMutationSuccess?.()
    },
    onError: (err) => {
      toast.error(err?.message || 'Failed to update entry', toastconfig)
    },
  })

  const deleteRevenueMutation = useMutation({
    mutationFn: async ({ source, paymentMasterId }) => {
      return deleteRevenueNewEntry(accessToken, source, paymentMasterId)
    },
    onSuccess: () => {
      toast.success('Entry deleted successfully', toastconfig)
      setDeleteRow(null)
      onRevenueMutationSuccess?.()
    },
    onError: (err) => {
      toast.error(err?.message || 'Failed to delete entry', toastconfig)
    },
  })

  const handleRevenueEditSubmit = useCallback(() => {
    if (!editRow?.paymentMasterId || !editRow?.revenueSource) return
    const body = {
      totalOrderAmount: parseFloat(editFormData.totalOrderAmount) || 0,
      discountAmount: parseFloat(editFormData.discountAmount) || 0,
      paidOrderAmount: parseFloat(editFormData.paidOrderAmount) || 0,
      paymentMode: editFormData.paymentMode,
      productType: editFormData.productType,
      orderDate: editFormData.orderDate
        ? dayjs(editFormData.orderDate).format('YYYY-MM-DD HH:mm:ss')
        : null,
    }
    if (editRow.revenueSource === 'OTHER_PAYMENT') {
      body.appointmentReason = editFormData.productType
    }
    updateRevenueMutation.mutate({
      source: editRow.revenueSource,
      paymentMasterId: editRow.paymentMasterId,
      body,
    })
  }, [editRow, editFormData, updateRevenueMutation])

  const handleRevenueDeleteConfirm = useCallback(() => {
    if (!deleteRow?.paymentMasterId || !deleteRow?.revenueSource) return
    deleteRevenueMutation.mutate({
      source: deleteRow.revenueSource,
      paymentMasterId: deleteRow.paymentMasterId,
    })
  }, [deleteRow, deleteRevenueMutation])

  const getRevenueRowId = useCallback((row) => {
    if (row?.paymentMasterId != null && row?.revenueSource) {
      const splitSuffix =
        row.splitPaymentLineIndex != null && row.splitPaymentLineIndex !== ''
          ? `-split-${row.splitPaymentLineIndex}`
          : ''
      return `${row.revenueSource}-${row.paymentMasterId}${splitSuffix}`
    }
    return `${row?.orderId}-${row?.productType || ''}`
  }, [])

  const computeRowsSignature = useCallback((rows) => {
    if (!rows || rows.length === 0) return '__EMPTY__'
    return rows
      .map(
        (row) => `${row.orderId}-${row.productType}-${Number(row.amount) || 0}`,
      )
      .join('|')
  }, [])

  // Normalize incoming rows to ensure consistent fields for display and export
  const normalizeRow = useCallback(
    (row) => {
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
        amount: roundCurrency(row.amount),
        discountAmount: roundCurrency(row.discountAmount),
        reportBranchId: getReportBranchId(row),
        branchDisplayCode: getRevenueBranchDisplayCode(
          row,
          branchCatalog,
          dropdownBranches,
        ),
        branchFullName: getRevenueBranchFullName(row, branchCatalog),
      }
    },
    [branchCatalog, dropdownBranches],
  )

  const dataNormalizedSales = (data?.salesData || []).map(normalizeRow)
  const dataNormalizedReturns = (data?.returnData || []).map(normalizeRow)

  const rowsForActiveBranch = useMemo(() => {
    let rows = dataNormalizedSales || []
    // When branchId is "ALL", show all rows without filtering
    if (branchId !== 'ALL') {
      rows = rows.filter(
        (row) =>
          row.reportBranchId === branchId ||
          String(row.reportBranchId) === String(branchId),
      )
    }
    return sortRowsByPatientName(rows)
  }, [dataNormalizedSales, branchId])

  const rowsForActiveBranchReturns = useMemo(() => {
    let rows = dataNormalizedReturns || []
    if (branchId !== 'ALL') {
      rows = rows.filter(
        (row) =>
          row.reportBranchId === branchId ||
          String(row.reportBranchId) === String(branchId),
      )
    }
    return sortRowsByPatientName(rows)
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

  const showRevenueActionsColumn = Boolean(
    showRevenueRowActions && accessToken && activeView === 'sales',
  )

  const columns = useMemo(() => {
    const branchColumn = showBranchColumn
      ? [
          {
            field: 'branchDisplayCode',
            headerName: 'Branch',
            flex: 0.6,
            minWidth: 72,
            align: 'left',
            headerAlign: 'left',
            valueGetter: (params) =>
              params?.row?.branchDisplayCode ||
              getRevenueBranchDisplayCode(
                params?.row,
                branchCatalog,
                dropdownBranches,
              ),
            renderCell: (params) => {
              const code =
                params?.row?.branchDisplayCode ||
                getRevenueBranchDisplayCode(
                  params?.row,
                  branchCatalog,
                  dropdownBranches,
                )
              const fullName =
                params?.row?.branchFullName ||
                getRevenueBranchFullName(params?.row, branchCatalog)
              return (
                <Tooltip title={fullName || code}>
                  <span className="truncate">{code}</span>
                </Tooltip>
              )
            },
          },
        ]
      : []

    const baseColumns = [
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
      ...branchColumn,
      {
        field: 'patientName',
        headerName: 'Patient Name',
        type: 'string',
        flex: 2,
        align: 'left',
        headerAlign: 'left',
        filterField: 'patientName',
        renderCell: (params) => <div>{params?.row?.patientName || ''}</div>,
        valueGetter: (params) => params?.row?.patientName || '',
        sortComparator: (v1, v2) =>
          String(v1 || '').localeCompare(String(v2 || ''), undefined, {
            sensitivity: 'base',
          }),
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
        renderCell: (params) => {
          const amount = roundCurrency(params?.row?.amount)
          return <div>{amount}</div>
        },
        valueFormatter: (params) => roundCurrency(params?.value),
        sortComparator: (v1, v2) => v1 - v2,
      },
      {
        field: 'discountAmount',
        headerName: 'Discount',
        type: 'number',
        flex: 1,
        align: 'left',
        headerAlign: 'left',
        renderCell: (params) => {
          const discount = roundCurrency(params?.row?.discountAmount)
          return <div>{discount}</div>
        },
        valueFormatter: (params) => roundCurrency(params?.value),
      },
    ]

    if (!showRevenueActionsColumn) {
      return baseColumns
    }

    return [
      ...baseColumns,
      {
        field: 'actions',
        headerName: 'Actions',
        sortable: false,
        filterable: false,
        flex: 0.85,
        minWidth: 108,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => {
          const row = params.row
          if (!row?.paymentMasterId || !row?.revenueSource) {
            return null
          }
          return (
            <Box sx={{ display: 'flex', gap: 0.25 }}>
              <IconButton
                size="small"
                aria-label="Edit revenue row"
                onClick={() => {
                  setEditRow(row)
                  setEditFormData({
                    totalOrderAmount: row.totalOrderAmount ?? '',
                    discountAmount: row.discountAmount ?? '',
                    paidOrderAmount: row.amount ?? row.paidOrderAmount ?? '',
                    paymentMode: String(
                      row.paymentMode || 'CASH',
                    ).toUpperCase(),
                    productType: row.productType || '',
                    orderDate: row.date
                      ? dayjs(row.date).format('YYYY-MM-DD')
                      : '',
                  })
                }}
              >
                <Edit fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                color="error"
                aria-label="Delete revenue row"
                onClick={() => setDeleteRow(row)}
              >
                <Delete fontSize="small" />
              </IconButton>
            </Box>
          )
        },
      },
    ]
  }, [
    showRevenueActionsColumn,
    showBranchColumn,
    branchCatalog,
    dropdownBranches,
  ])

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
    const named = buildCategoryDataset(visibleSalesRows)
    return {
      labels: named.labels,
      amounts: named.amounts,
      colors: named.labels.map((label) => getCategoryColor(label)),
    }
  }, [visibleSalesRows])

  const hasChartData =
    pieChartDataset.labels.length > 0 &&
    pieChartDataset.amounts.some((amount) => amount > 0)

  const gridSx = {
    border: '1px solid #cfe4ee',
    borderRadius: '16px',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    '& .MuiDataGrid-columnHeaders, & .MuiDataGrid-columnHeader': {
      backgroundColor: '#e7f7fc',
    },
    '& .MuiDataGrid-columnHeaderTitle': {
      color: '#123047',
      fontWeight: 800,
    },
    '& .MuiDataGrid-row:nth-of-type(even)': {
      backgroundColor: '#f8fcfe',
    },
    '& .MuiDataGrid-cell': {
      color: '#123047',
      fontWeight: 600,
    },
    '& .MuiDataGrid-footerContainer': {
      borderTop: '1px solid #cfe4ee',
    },
  }

  return (
    <>
      <div className="grid grid-cols-12 items-stretch gap-4">
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
              getRowId={getRevenueRowId}
              sx={gridSx}
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
              getRowId={getRevenueRowId}
              sx={gridSx}
            />
          </div>
        )}
        {activeView === 'sales' ? (
          <div className="col-span-12 h-full min-h-[420px] lg:col-span-4">
            <SalesChart
              dataset={pieChartDataset}
              isLoading={isChartLoading}
              hasData={hasChartData}
            />
          </div>
        ) : null}
      </div>

      {showRevenueActionsColumn && (
        <>
          <Dialog
            open={Boolean(editRow)}
            onClose={() => {
              setEditRow(null)
              resetEditForm()
            }}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Edit revenue entry</DialogTitle>
            <DialogContent>
              <Box
                sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}
              >
                <TextField
                  label="Order ID"
                  value={editRow?.orderId || ''}
                  disabled
                  fullWidth
                  size="small"
                />
                <TextField
                  label="Source type"
                  value={editRow?.type || ''}
                  disabled
                  fullWidth
                  size="small"
                />
                <TextField
                  label={
                    editRow?.revenueSource === 'OTHER_PAYMENT'
                      ? 'Service title'
                      : 'Product / service type'
                  }
                  value={editFormData.productType}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      productType: e.target.value,
                    }))
                  }
                  fullWidth
                  size="small"
                />
                <FormControl fullWidth size="small">
                  <InputLabel>Payment mode</InputLabel>
                  <Select
                    value={editFormData.paymentMode}
                    label="Payment mode"
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        paymentMode: e.target.value,
                      }))
                    }
                  >
                    <MenuItem value="CASH">CASH</MenuItem>
                    <MenuItem value="ONLINE">ONLINE</MenuItem>
                    <MenuItem value="CARD">CARD</MenuItem>
                    <MenuItem value="UPI">UPI</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  label="Date"
                  type="date"
                  value={editFormData.orderDate}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      orderDate: e.target.value,
                    }))
                  }
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="Total amount"
                  type="number"
                  value={editFormData.totalOrderAmount}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      totalOrderAmount: e.target.value,
                    }))
                  }
                  fullWidth
                  size="small"
                  inputProps={{ step: '0.01', min: 0 }}
                />
                <TextField
                  label="Discount"
                  type="number"
                  value={editFormData.discountAmount}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      discountAmount: e.target.value,
                    }))
                  }
                  fullWidth
                  size="small"
                  inputProps={{ step: '0.01', min: 0 }}
                />
                <TextField
                  label="Paid amount"
                  type="number"
                  value={editFormData.paidOrderAmount}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      paidOrderAmount: e.target.value,
                    }))
                  }
                  fullWidth
                  size="small"
                  inputProps={{ step: '0.01', min: 0 }}
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => {
                  setEditRow(null)
                  resetEditForm()
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleRevenueEditSubmit}
                disabled={updateRevenueMutation.isPending}
              >
                {updateRevenueMutation.isPending ? 'Saving…' : 'Save'}
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog
            open={Boolean(deleteRow)}
            onClose={() => setDeleteRow(null)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Delete revenue entry</DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary">
                This removes the payment line from the database. This cannot be
                undone.
              </Typography>
              {deleteRow && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Order ID:</strong> {deleteRow.orderId}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Service:</strong> {deleteRow.productType || '—'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Amount:</strong> ₹
                    {Math.round(Number(deleteRow.amount) || 0).toLocaleString(
                      'en-IN',
                    )}
                  </Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDeleteRow(null)}>Cancel</Button>
              <Button
                variant="contained"
                color="error"
                onClick={handleRevenueDeleteConfirm}
                disabled={deleteRevenueMutation.isPending}
              >
                {deleteRevenueMutation.isPending ? 'Deleting…' : 'Delete'}
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </>
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
  getRowId,
  sx,
}) => (
  <FilteredDataGrid
    key={`SalesTable-${branchId}-${data?.length}`}
    rows={data || []}
    getRowId={getRowId || ((row) => `${row.orderId}-${row.productType || ''}`)}
    columns={columns}
    className="h-[68vh]"
    customFilters={customFilters}
    filterData={filterData}
    getUniqueValues={getUniqueValues}
    reportName={reportName}
    reportType={reportType}
    branchName={branchName}
    filters={filters}
    onRowsChange={onRowsChange}
    sx={sx}
    initialState={{
      sorting: {
        sortModel: [{ field: 'patientName', sort: 'asc' }],
      },
    }}
  />
)

export default SalesDashboard
