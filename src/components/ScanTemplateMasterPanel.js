import React, { useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { Button, Chip, Typography } from '@mui/material'
import { Close, EditNote, Restore, Tune } from '@mui/icons-material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'
import FilteredDataGrid from './FilteredDataGrid'
import Modal from './Modal'
import {
  getAllScanTemplatesMaster,
  getScanTemplateMasterById,
  realignScanTemplate,
  restoreScanTemplate,
} from '@/constants/apis'
import { closeModal, openModal } from '@/redux/modalSlice'
import { toast } from 'react-toastify'
import { toastconfig } from '@/utils/toastconfig'
import dayjs from 'dayjs'

const JoditEditor = dynamic(() => import('jodit-react'), {
  ssr: false,
})

const SCAN_TEMPLATE_QUERY_KEY = 'scanTemplateMasterData'
const EDITOR_MODAL_KEY = 'scanTemplateEditorModal'

function ScanTemplateMasterPanel({ accessToken }) {
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const editorRef = useRef(null)
  const [selectedScan, setSelectedScan] = useState(null)
  const [editorContent, setEditorContent] = useState('')
  const [originalContent, setOriginalContent] = useState('')

  const { data: templatesResponse, isLoading } = useQuery({
    queryKey: [SCAN_TEMPLATE_QUERY_KEY],
    queryFn: () => getAllScanTemplatesMaster(accessToken),
    enabled: !!accessToken,
  })

  const rows = useMemo(() => {
    return (templatesResponse?.data || []).map((row) => ({
      ...row,
      id: row.scanId,
      templateStatus: !row.hasTemplate
        ? 'Missing'
        : row.isCustomized
          ? 'Customized'
          : 'Default',
    }))
  }, [templatesResponse])

  const closeEditor = () => {
    setSelectedScan(null)
    setEditorContent('')
    setOriginalContent('')
    dispatch(closeModal())
  }

  const { mutate: loadTemplate, isPending: isLoadingTemplate } = useMutation({
    mutationFn: async (row) => {
      const response = await getScanTemplateMasterById(accessToken, row.scanId)
      if (response.status !== 200) {
        throw new Error(response?.message || 'Failed to load scan template')
      }
      return { row, template: response.data }
    },
    onSuccess: ({ row, template }) => {
      setSelectedScan({
        ...row,
        ...template,
      })
      setEditorContent(template?.scanTemplate || '')
      setOriginalContent(template?.originalScanTemplate || '')
      dispatch(openModal(EDITOR_MODAL_KEY))
    },
    onError: (error) => {
      toast.error(
        error?.message || 'Error while loading scan template',
        toastconfig,
      )
    },
  })

  const { mutate: realignTemplate, isPending: isRealigning } = useMutation({
    mutationFn: async (payload) => {
      const response = await realignScanTemplate(accessToken, payload)
      if (response.status !== 200) {
        throw new Error(response?.message || 'Failed to realign template')
      }
      return response
    },
    onSuccess: () => {
      toast.success('Default scan template realigned successfully', toastconfig)
      queryClient.invalidateQueries({ queryKey: [SCAN_TEMPLATE_QUERY_KEY] })
      closeEditor()
    },
    onError: (error) => {
      toast.error(
        error?.message || 'Error while realigning template',
        toastconfig,
      )
    },
  })

  const { mutate: restoreTemplate, isPending: isRestoring } = useMutation({
    mutationFn: async (scanId) => {
      const response = await restoreScanTemplate(accessToken, { scanId })
      if (response.status !== 200) {
        throw new Error(response?.message || 'Failed to restore template')
      }
      return response
    },
    onSuccess: () => {
      toast.success('Scan template restored to original default', toastconfig)
      queryClient.invalidateQueries({ queryKey: [SCAN_TEMPLATE_QUERY_KEY] })
      closeEditor()
    },
    onError: (error) => {
      toast.error(
        error?.message || 'Error while restoring template',
        toastconfig,
      )
    },
  })

  const getEditorValue = () => {
    return editorRef.current?.value ?? editorContent
  }

  const handleRealign = () => {
    if (!selectedScan?.scanId) return
    realignTemplate({
      scanId: selectedScan.scanId,
      scanTemplate: getEditorValue(),
    })
  }

  const handleRestore = (row) => {
    const scanName = row?.scanName || selectedScan?.scanName || 'this scan'
    const confirmed = window.confirm(
      `Restore "${scanName}" to the original default template? Current edits will be replaced.`,
    )
    if (!confirmed) return
    restoreTemplate(row?.scanId || selectedScan?.scanId)
  }

  const columns = [
    {
      field: 'scanName',
      headerName: 'Scan Name',
      flex: 1,
      minWidth: 240,
    },
    {
      field: 'scanId',
      headerName: 'Scan ID',
      width: 100,
    },
    {
      field: 'templateStatus',
      headerName: 'Template Status',
      width: 160,
      renderCell: ({ row }) => {
        if (row.templateStatus === 'Missing') {
          return <Chip size="small" label="Missing" color="warning" />
        }
        if (row.templateStatus === 'Customized') {
          return <Chip size="small" label="Customized" color="info" />
        }
        return <Chip size="small" label="Default" color="success" />
      },
    },
    {
      field: 'updatedByName',
      headerName: 'Updated By',
      width: 150,
      renderCell: ({ row }) => row.updatedByName || '-',
    },
    {
      field: 'updatedAt',
      headerName: 'Updated At',
      width: 170,
      renderCell: ({ row }) =>
        row.updatedAt ? dayjs(row.updatedAt).format('DD-MM-YYYY HH:mm') : '-',
    },
    {
      field: 'actionField',
      headerName: 'Action',
      width: 250,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outlined"
            color="primary"
            size="small"
            startIcon={<EditNote />}
            onClick={() => loadTemplate(params.row)}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            color="warning"
            size="small"
            startIcon={<Restore />}
            disabled={!params.row.hasTemplate || !params.row.isCustomized}
            onClick={() => handleRestore(params.row)}
          >
            Restore
          </Button>
        </div>
      ),
    },
  ]

  const isBusy = isLoadingTemplate || isRealigning || isRestoring

  return (
    <div className="h-full max-w-[calc(100vw-550px)]">
      <div className="mb-3">
        <Typography variant="h6" className="text-secondary font-semibold">
          Scan Template
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Edit a default scan report template, realign it so new reports use the
          edited version, or restore it back to the original default format.
        </Typography>
      </div>

      <FilteredDataGrid
        columns={columns}
        rows={rows}
        loading={isLoading || isBusy}
        getRowId={(row) => row.scanId}
        customFilters={[
          { field: 'scanName', label: 'Scan Name', type: 'text' },
          {
            field: 'templateStatus',
            label: 'Template Status',
            type: 'select',
            options: [
              { value: 'Default', label: 'Default' },
              { value: 'Customized', label: 'Customized' },
              { value: 'Missing', label: 'Missing' },
            ],
          },
        ]}
        filterData={(data, filters) =>
          data.filter((row) =>
            Object.entries(filters).every(([field, filterConfig]) => {
              if (!filterConfig?.value) return true
              const cellValue = row[field]?.toString() ?? ''
              return cellValue
                .toLowerCase()
                .includes(filterConfig.value.toLowerCase())
            }),
          )
        }
        getUniqueValues={(field) => [
          ...new Set(
            rows?.map((row) => row[field]?.toString()).filter(Boolean),
          ),
        ]}
        pageSizeOptions={[25, 50, 100]}
        initialState={{
          pagination: { paginationModel: { page: 0, pageSize: 100 } },
        }}
        sx={{ '& .MuiDataGrid-main': { height: '60vh' } }}
      />

      <Modal
        uniqueKey={EDITOR_MODAL_KEY}
        closeOnOutsideClick={false}
        maxWidth="lg"
        onOutsideClick={closeEditor}
      >
        <div className="flex justify-between items-start mb-3">
          <div>
            <Typography variant="h6">
              {selectedScan?.scanName || 'Scan Template'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Keep placeholders like {'{headerInformation}'} and{' '}
              {'{hospitalLogoInformation}'} if they already exist in the
              template.
            </Typography>
          </div>
          <Button
            variant="text"
            color="inherit"
            startIcon={<Close />}
            onClick={closeEditor}
          >
            Close
          </Button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          <JoditEditor
            ref={editorRef}
            value={editorContent}
            tabIndex={1}
            onBlur={(newContent) => setEditorContent(newContent)}
            config={{
              readonly: isBusy,
              height: 420,
              askBeforePasteHTML: false,
              askBeforePasteFromWord: false,
            }}
          />
        </div>
        <div className="flex flex-wrap gap-2 justify-end pt-3">
          <Button
            variant="outlined"
            color="warning"
            startIcon={<Restore />}
            disabled={isBusy || !originalContent}
            onClick={() => handleRestore(selectedScan)}
          >
            Restore
          </Button>
          <Button
            variant="contained"
            className="text-white"
            startIcon={<Tune />}
            disabled={isBusy || !selectedScan?.scanId}
            onClick={handleRealign}
          >
            Realign Default
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default ScanTemplateMasterPanel
