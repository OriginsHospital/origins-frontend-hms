import { getReportsByDate, getStockExpiryReport } from '@/constants/apis'
import { useQuery } from '@tanstack/react-query'
import React, { useEffect, useState } from 'react'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { useSelector, useDispatch } from 'react-redux'
import { showLoader, hideLoader } from '@/redux/loaderSlice'
import { DataGrid } from '@mui/x-data-grid'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Tooltip from '@mui/material/Tooltip'
import { withPermission } from '@/components/withPermission'
import { ACCESS_TYPES } from '@/constants/constants'
import CustomToolbar from '@/components/CustomToolbar'

const Index = () => {
  const user = useSelector(store => store.user)
  const [columns, setColumns] = useState([])
  const dispatch = useDispatch()

  const handleDateChange = value => {
    setDate(value)
  }
  const { data: reportsData, isLoading: isReportFetchLoading } = useQuery({
    queryKey: ['fetchReportData'],
    enabled: true,
    queryFn: async () => {
      const responsejson = await getStockExpiryReport(user?.accessToken)
      if (responsejson.status == 200) {
        const objectKeys = Object.keys(responsejson?.data?.[0])
        setColumns(objectKeys)
        return responsejson.data
      } else {
        throw new Error(
          'Error occurred while fetching medicine details for pharmcy',
        )
      }
    },
  })
  useEffect(() => {
    if (isReportFetchLoading) {
      dispatch(showLoader())
    } else {
      dispatch(hideLoader())
    }
  }, [isReportFetchLoading])

  const columnHeader = [
    {
      field: 'itemName',
      headerName: 'Item',
      width: 200,
    },
    {
      field: 'batchNo',
      headerName: 'Batch No.',
    },
    {
      field: 'rate',
      headerName: 'Rate',
    },
    {
      field: 'ratePerTablet',
      headerName: 'Rate Per Tablet',
    },
    {
      field: 'expiryDate',
      headerName: 'Expiry Date',
    },
    {
      field: 'totalStockLeft',
      headerName: 'Total Stock Left',
    },
    {
      field: 'daysToExpire',
      headerName: 'Expiry',
      width: 150,
      renderCell: params => {
        const daysToExpire = params.value === 'NA' ? 0 : parseInt(params.value)
        console.log(typeof daysToExpire, daysToExpire <= 30)
        let color = 'green'
        let title = 'Safe'

        if (daysToExpire === 0) {
          color = 'red'
          title = 'Expired'
        } else if (daysToExpire > 0 && daysToExpire <= 30) {
          color = 'yellow'
          title = 'Expiring in 30 days'
        }

        return (
          // <Tooltip title={title} placement="top">
          //   <div className={`rounded-full border bg-${color}-500 w-4 h-4`} />
          // </Tooltip>
          <span
            className={`rounded-md border text-${color}-500 bg-${color}-100 w-4 h-4 p-1`}
          >
            {title}
          </span>
        )
      },
    },
    {
      field: 'grnNo',
      headerName: 'GRN No.',
    },

    {
      field: 'daysSinceExpire',
      headerName: 'Days Since Expire',
    },
    // {
    //   field: "showRedFlag",
    //   headerName: "Show Red Flag"
    // }
  ]

  return (
    <div className="flex flex-col justify-center">
      <span className="font-medium p-4 text-secondary">
        Stock Expiry Report
      </span>
      <div className="p-2">
        <div style={{ height: 400, width: '100%' }}>
          <DataGrid
            rows={reportsData || []}
            columns={columnHeader}
            pageSizeOptions={[5, 7, 10, 25]}
            initialState={{
              pagination: { paginationModel: { page: 1, pageSize: 7 } },
            }}
            slots={{
              toolbar: CustomToolbar,
            }}
            autoHeight
            sx={{
              '& .MuiDataGrid-main': { height: '65vh' },
              // '& .MuiDataGrid-cell': { width: '1000px' },
            }}
            getRowId={row => row.itemName + row.grnNo}
          />
        </div>
      </div>
    </div>
  )
}

export default withPermission(Index, true, 'grnStockExpiryDate', [
  ACCESS_TYPES.READ,
  ACCESS_TYPES.WRITE,
])
