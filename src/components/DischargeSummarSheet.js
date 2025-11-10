import React, { useState, useEffect } from 'react'
import {
  Typography,
  Paper,
  Grid,
  Divider,
  Box,
  TableContainer,
  Table,
  TableHead,
  TableCell,
  TableRow,
  TableBody,
  Button,
} from '@mui/material'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'
import dynamic from 'next/dynamic'
import dayjs from 'dayjs'
import {
  getDischargeSummaryTemplate,
  getOpdSheetTemplate,
  updateDischargeSummaryTemplate,
  updateOpdSheetTemplate,
} from '@/constants/apis'
import { toastconfig } from '@/utils/toastconfig'
import { closeModal } from '@/redux/modalSlice'
import { toast } from 'react-toastify'

const JoditEditor = dynamic(() => import('jodit-react'), {
  ssr: false,
})

function DischargeSummarSheet({ TreatmentCycleId }) {
  const user = useSelector(store => store.user)
  const [template, setTemplate] = useState('')
  const dispatch = useDispatch()

  const { data: dischargeSummaryTemplate, isLoading, error } = useQuery({
    queryKey: ['dischargeSummaryTemplate', TreatmentCycleId],
    queryFn: () =>
      getDischargeSummaryTemplate(user.accessToken, TreatmentCycleId),
    enabled: !!TreatmentCycleId && !!user.accessToken,
  })

  useEffect(() => {
    if (dischargeSummaryTemplate?.data) {
      setTemplate(dischargeSummaryTemplate.data.template)
    }
  }, [dischargeSummaryTemplate])
  const handleTemplateChange = value => {
    setTemplate(value)
  }
  const handleUpdate = useMutation({
    mutationFn: async () => {
      const res = await updateDischargeSummaryTemplate(
        user.accessToken,
        TreatmentCycleId,
        template,
      )
      if (res.status === 200) {
        toast.success('Discharge summary updated successfully', toastconfig)
      }
      return res
    },
  })
  if (isLoading) {
    return <Typography>Loading discharge summary...</Typography>
  }

  if (error) {
    return (
      <Typography color="error">
        Error loading discharge summary: {error.message}
      </Typography>
    )
  }

  return (
    <div className="p-4">
      <Typography variant="h6" gutterBottom>
        Discharge Summary Sheet
      </Typography>
      <div className="flex justify-end gap-3">
        <Button
          color="primary"
          variant="outlined"
          onClick={handleUpdate.mutate}
        >
          Update Sheet
        </Button>
        <Button
          color="error"
          variant="outlined"
          onClick={() => dispatch(closeModal())}
        >
          Close
        </Button>
      </div>

      <Paper className="m-4 p-4">
        <JoditEditor value={template} onBlur={handleTemplateChange} />
      </Paper>
    </div>
  )
}

export default DischargeSummarSheet
