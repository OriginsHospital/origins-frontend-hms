import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useSelector, useDispatch } from 'react-redux'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import dynamic from 'next/dynamic'
import {
  Autocomplete,
  TextField,
  IconButton,
  Tooltip,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { DataGrid } from '@mui/x-data-grid'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined'
import Close from '@mui/icons-material/Close'
import { getPrescriptionsByDate, printPrescription } from '@/constants/apis'
import { withPermission } from '@/components/withPermission'
import { ACCESS_TYPES } from '@/constants/constants'
import { toastconfig } from '@/utils/toastconfig'
import { toast } from 'react-toastify'
import { showLoader, hideLoader } from '@/redux/loaderSlice'

const JoditEditor = dynamic(() => import('jodit-react'), {
  ssr: false,
})

function ScanPrescriptionPage() {
  const router = useRouter()
  const dispatch = useDispatch()
  const user = useSelector((store) => store.user)
  const branches = user?.branchDetails

  const [date, setDate] = useState()
  const [branchId, setBranchId] = useState()
  const [viewHtml, setViewHtml] = useState(null)

  useEffect(() => {
    const { date: routeDate, branchId: routeBranchId } = router.query
    if (routeDate !== undefined && routeBranchId !== undefined) {
      setDate(dayjs(routeDate))
      setBranchId(
        routeBranchId === '' || routeBranchId === 'null' ? null : routeBranchId,
      )
    } else if (branches?.length) {
      const d = dayjs()
      setDate(d)
      const bid = branches[0]?.id ?? null
      setBranchId(bid)
      router.replace(
        {
          pathname: '/scan/prescription',
          query: {
            date: d.format('YYYY-MM-DD'),
            branchId: bid ?? '',
          },
        },
        undefined,
        { shallow: true },
      )
    }
  }, [router.query, branches, router])

  const handleDateChange = (value) => {
    setDate(value)
    router.push(
      {
        pathname: '/scan/prescription',
        query: {
          date: dayjs(value).format('YYYY-MM-DD'),
          branchId: branchId ?? '',
        },
      },
      undefined,
      { shallow: true },
    )
  }

  const onBranchChange = (value) => {
    const id = value?.id ?? null
    setBranchId(id)
    router.push(
      {
        pathname: '/scan/prescription',
        query: {
          date: dayjs(date).format('YYYY-MM-DD'),
          branchId: id ?? '',
        },
      },
      undefined,
      { shallow: true },
    )
  }

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['scanPrescriptionsByDate', date, branchId],
    enabled: !!date,
    queryFn: async () => {
      const response = await getPrescriptionsByDate(
        user.accessToken,
        `${date.$y}-${date.$M + 1}-${date.$D}`,
        branchId,
      )
      if (response.status === 200) {
        return response.data || []
      }
      throw new Error(
        response?.message || 'Could not load prescriptions for this date',
      )
    },
  })

  const openPrescriptionHtml = useCallback(
    async (row, mode) => {
      dispatch(showLoader())
      try {
        const response = await printPrescription(user.accessToken, {
          type: row.appointmentType,
          appointmentId: row.appointmentId,
          isSpouse: row.isSpouse,
        })
        if (response.status !== 200 || response.data == null) {
          toast.error(
            response?.message || 'Failed to load prescription',
            toastconfig,
          )
          return
        }
        const html = response.data
        if (mode === 'view') {
          setViewHtml(html)
          return
        }
        const w = window.open('', '_blank')
        if (!w) {
          toast.error('Pop-up blocked. Allow pop-ups to print.', toastconfig)
          return
        }
        w.document.write(html)
        w.document.close()
        setTimeout(() => {
          w.focus()
          w.print()
        }, 300)
      } catch (e) {
        console.error(e)
        toast.error(
          'An error occurred while loading the prescription',
          toastconfig,
        )
      } finally {
        dispatch(hideLoader())
      }
    },
    [dispatch, user.accessToken],
  )

  const columns = [
    {
      field: 'patientName',
      headerName: 'Patient',
      flex: 1.2,
      minWidth: 180,
    },
    {
      field: 'subjectLabel',
      headerName: 'Prescription for',
      flex: 0.9,
      minWidth: 140,
      renderCell: (params) => {
        const { subjectLabel, spouseName } = params.row
        if (subjectLabel === 'Spouse' && spouseName) {
          return `Spouse (${spouseName})`
        }
        return subjectLabel || ''
      },
    },
    {
      field: 'appointmentType',
      headerName: 'Type',
      flex: 0.7,
      minWidth: 120,
    },
    {
      field: 'appointmentReason',
      headerName: 'Reason',
      flex: 1,
      minWidth: 140,
    },
    {
      field: 'doctorName',
      headerName: 'Doctor',
      flex: 0.9,
      minWidth: 130,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      sortable: false,
      filterable: false,
      minWidth: 120,
      flex: 0.6,
      renderCell: (params) => (
        <div className="flex items-center gap-1 h-full">
          <Tooltip title="View">
            <IconButton
              size="small"
              color="primary"
              onClick={() => openPrescriptionHtml(params.row, 'view')}
              aria-label="View prescription"
            >
              <VisibilityOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Print">
            <IconButton
              size="small"
              color="primary"
              onClick={() => openPrescriptionHtml(params.row, 'print')}
              aria-label="Print prescription"
            >
              <PrintOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </div>
      ),
    },
  ]

  return (
    <div className="w-full h-full p-5 flex gap-5">
      <div className="min-w-80 p-3 h-full flex flex-col gap-3 shadow rounded bg-white overflow-y-auto">
        <Typography
          variant="subtitle2"
          className="text-secondary font-semibold"
        >
          Filters
        </Typography>
        <Autocomplete
          className="w-full text-center"
          options={branches || []}
          getOptionLabel={(option) => option?.branchCode || option?.name}
          value={branches?.find((branch) => branch.id == branchId) || null}
          onChange={(_, value) => onBranchChange(value)}
          renderInput={(params) => (
            <TextField {...params} label="Branch" fullWidth />
          )}
          clearIcon={null}
        />
        <DatePicker
          className="bg-white"
          label="Date"
          value={date}
          format="DD/MM/YYYY"
          onChange={handleDateChange}
        />
      </div>

      <div className="grow h-full shadow rounded bg-white overflow-hidden flex flex-col p-3">
        <Typography variant="h6" className="mb-2 text-secondary font-semibold">
          Prescriptions (patient and spouse)
        </Typography>
        <div
          style={{ height: 'calc(100vh - 220px)', width: '100%' }}
          className="min-h-[400px]"
        >
          <DataGrid
            rows={rows}
            columns={columns}
            loading={isLoading}
            getRowId={(row) =>
              `${row.appointmentId}-${row.appointmentType}-${row.isSpouse}`
            }
            disableRowSelectionOnClick
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { pageSize: 25, page: 0 } },
            }}
            slots={{
              noRowsOverlay: () => (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No prescriptions found for this branch and date
                </div>
              ),
            }}
          />
        </div>
      </div>

      <Dialog
        open={Boolean(viewHtml)}
        onClose={() => setViewHtml(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle className="flex justify-between items-center">
          <span>Prescription</span>
          <IconButton onClick={() => setViewHtml(null)} aria-label="Close">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers className="max-h-[80vh] overflow-auto">
          {viewHtml ? (
            <div className="border rounded-lg p-2 bg-white">
              <JoditEditor
                value={viewHtml}
                config={{
                  readonly: true,
                  toolbar: true,
                  statusbar: false,
                }}
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default withPermission(ScanPrescriptionPage, true, 'scanModule', [
  ACCESS_TYPES.READ,
  ACCESS_TYPES.WRITE,
])
