import Breadcrumb from '@/components/Breadcrumb'
import Modal from '@/components/Modal'
import { grnStockReport } from '@/constants/apis'
import { closeModal, openModal } from '@/redux/modalSlice'
import { Close } from '@mui/icons-material'
import {
  Autocomplete,
  Button,
  Chip,
  IconButton,
  TextField,
} from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import FilteredDataGrid from '@/components/FilteredDataGrid'
import { stockReportfilterData } from '@/constants/filters'

function StockReport({ breadcrumb = true }) {
  const userDetails = useSelector(store => store.user)
  const dropdowns = useSelector(store => store.dropdowns)
  const { branches } = dropdowns
  const dispatch = useDispatch()
  const [branchId, setBranchId] = useState(branches[0]?.id || null)
  const [grnDetails, setGrnDetails] = useState(null)
  const [itemId, setItemId] = useState(null)

  const { data: grnStockData } = useQuery({
    queryKey: ['GRN_STOCK_REPORT', userDetails.accessToken, branchId],
    queryFn: async () => {
      const res = await grnStockReport(userDetails.accessToken, branchId)
      if (res.status == 200) {
        return res.data
      }
    },
    enabled: !!branchId,
  })

  const handleViewGRNDetails = row => {
    setItemId(row.itemId)
    dispatch(openModal(`grnStockDetails-${row.itemId}`))
    setGrnDetails(row?.grnDetails || [])
  }

  // Define columns with filter fields
  const columns = [
    { field: 'itemId', headerName: 'Item ID', width: 100 },
    { field: 'itemName', headerName: 'Item Name', width: 350 },
    {
      field: 'totalQuantity',
      headerName: 'Available Quantity',
      width: 250,
      renderCell: row => {
        return (
          <Chip
            variant="contained"
            color={`${row.row.totalQuantity > 30 ? 'success' : 'error'}`}
            label={row.row.totalQuantity}
          />
        )
      },
    },
    {
      field: 'action',
      headerName: 'Action',
      width: 250,
      renderCell: row => {
        return (
          <Button
            variant="contained"
            color="primary"
            className="text-white"
            onClick={() => handleViewGRNDetails(row.row)}
          >
            View GRN Details
          </Button>
        )
      },
    },
  ]

  // Define custom filters
  const customFilters = [
    {
      field: 'itemName',
      label: 'Item Name',
      type: 'text',
    },
    {
      field: 'totalQuantity',
      label: 'Available Quantity',
      type: 'number',
    },
  ]

  // Get unique values for dropdowns
  const getUniqueValues = field => {
    if (!grnStockData) return []
    const values = new Set(grnStockData.map(row => row[field]))
    return Array.from(values).filter(Boolean)
  }

  return (
    <div className="m-5">
      <div
        className={`mb-5 flex items-center ${
          breadcrumb ? 'justify-between' : 'justify-end'
        }`}
      >
        {breadcrumb && <Breadcrumb />}
        <Autocomplete
          className="w-[120px]"
          options={branches || []}
          getOptionLabel={option => option?.branchCode || option?.name}
          value={branches?.find(branch => branch.id === branchId) || null}
          onChange={(_, value) => setBranchId(value?.id || null)}
          renderInput={params => <TextField {...params} fullWidth />}
          clearIcon={null}
        />
      </div>
      <div>
        <FilteredDataGrid
          key={branchId}
          rows={grnStockData || []}
          columns={columns}
          getRowId={row => row.itemId}
          // pageSizeOptions={[5, 8, 10, 25]}
          // initialState={{
          //   pagination: { paginationModel: { page: 1, pageSize: 8 } },
          // }}
          customFilters={customFilters}
          filterData={stockReportfilterData}
          getUniqueValues={getUniqueValues}
        />
      </div>
      <Modal
        uniqueKey={`grnStockDetails-${itemId}`}
        maxWidth="md"
        closeOnOutsideClick={false}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">GRN Details</h2>
          <IconButton onClick={() => dispatch(closeModal('grnStockDetails'))}>
            <Close />
          </IconButton>
        </div>
        <div className="flex flex-col gap-4 mt-3">
          {grnDetails?.length > 0 ? (
            grnDetails?.map(item => (
              <div key={item.grnId} className="border p-4 rounded-lg">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-sm text-gray-600">GRN ID</p>
                    <p className="font-medium">{item.grnId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Branch</p>
                    <p className="font-medium">{item.branchName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Supplier</p>
                    <p className="font-medium">{item.supplierName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Available Quantity</p>
                    <p className="font-medium">{item.availableQuantity}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Expriry Date</p>
                    <p className="font-medium">{item.expiryDate || '-'}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-600">No GRN Details Found</p>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default StockReport
