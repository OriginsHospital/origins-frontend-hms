import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  Select,
  MenuItem,
  Grid,
  Switch,
  FormControlLabel,
  Typography,
  Box,
  IconButton,
} from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material'
import { DatePicker } from '@mui/x-date-pickers'
import dayjs from 'dayjs'

function AddTaskModal({
  open,
  onClose,
  onSuccess,
  task,
  staffList,
  createMutation,
  updateMutation,
}) {
  const [formData, setFormData] = useState({
    taskName: '',
    description: '',
    remarks: '',
    status: 'Pending',
    startDate: null,
    endDate: null,
    alertEnabled: false,
    alertDate: null,
    assignedTo: null,
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (task) {
      setFormData({
        taskName: task.taskName || task.task_name || '',
        description: task.description || '',
        remarks: task.remarks || '',
        status: task.status || 'Pending',
        startDate:
          task.startDate || task.start_date
            ? dayjs(task.startDate || task.start_date)
            : null,
        endDate:
          task.endDate || task.end_date
            ? dayjs(task.endDate || task.end_date)
            : null,
        alertEnabled: task.alertEnabled || task.alert_enabled || false,
        alertDate:
          task.alertDate || task.alert_date
            ? dayjs(task.alertDate || task.alert_date)
            : null,
        assignedTo: task.assignedTo || task.assigned_to || null,
      })
    } else {
      setFormData({
        taskName: '',
        description: '',
        remarks: '',
        status: 'Pending',
        startDate: null,
        endDate: null,
        alertEnabled: false,
        alertDate: null,
        assignedTo: null,
      })
    }
    setErrors({})
  }, [task, open])

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.taskName.trim()) {
      newErrors.taskName = 'Task name is required'
    }
    return newErrors
  }

  const handleSubmit = () => {
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    const payload = {
      taskName: formData.taskName,
      description: formData.description || null,
      remarks: formData.remarks || null,
      status: formData.status,
      startDate: formData.startDate
        ? formData.startDate.format('YYYY-MM-DD')
        : null,
      endDate: formData.endDate ? formData.endDate.format('YYYY-MM-DD') : null,
      alertEnabled: formData.alertEnabled,
      alertDate: formData.alertDate ? formData.alertDate.toISOString() : null,
      assignedTo: formData.assignedTo || null,
    }

    if (task) {
      payload.taskId = task.id
      updateMutation.mutate(payload, {
        onSuccess: () => {
          onSuccess()
          onClose()
        },
      })
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          onSuccess()
          onClose()
        },
      })
    }
  }

  // Common styles for consistent appearance
  const labelStyle = {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: 'text.primary',
    mb: 0.75,
    display: 'block',
  }

  const inputStyle = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '6px',
      fontSize: '0.875rem',
      '& fieldset': {
        borderColor: 'rgba(0, 0, 0, 0.23)',
      },
      '&:hover fieldset': {
        borderColor: 'rgba(0, 0, 0, 0.87)',
      },
      '&.Mui-focused fieldset': {
        borderColor: 'primary.main',
        borderWidth: '2px',
      },
    },
    '& .MuiInputBase-input::placeholder': {
      color: 'rgba(0, 0, 0, 0.4)',
      opacity: 1,
    },
  }

  const selectStyle = {
    ...inputStyle,
    '& .MuiSelect-select': {
      fontSize: '0.875rem',
    },
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle sx={{ pb: 2, pr: 1, pt: 2.5 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, fontSize: '1.25rem' }}
          >
            {task ? 'Update Task' : 'Create Task'}
          </Typography>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{ color: 'text.secondary' }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ pt: 2, pb: 2, px: 3 }}>
        <Grid container spacing={2.5}>
          {/* Task Name - Full Width */}
          <Grid item xs={12}>
            <Typography sx={labelStyle}>
              Task Name <span style={{ color: 'red' }}>*</span>
            </Typography>
            <TextField
              fullWidth
              placeholder="e.g., Design new dashboard"
              value={formData.taskName}
              onChange={(e) => handleChange('taskName', e.target.value)}
              error={!!errors.taskName}
              helperText={errors.taskName}
              size="small"
              sx={inputStyle}
            />
          </Grid>

          {/* Remarks - Full Width */}
          <Grid item xs={12}>
            <Typography sx={labelStyle}>Remarks</Typography>
            <TextField
              fullWidth
              placeholder="Add any relevant notes or comments..."
              value={formData.remarks}
              onChange={(e) => handleChange('remarks', e.target.value)}
              multiline
              rows={3}
              size="small"
              sx={inputStyle}
            />
          </Grid>

          {/* Start Date / End Date - 2 Column Grid */}
          <Grid item xs={12} sm={6}>
            <Typography sx={labelStyle}>Start Date</Typography>
            <DatePicker
              value={formData.startDate}
              onChange={(value) => handleChange('startDate', value)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: 'small',
                  placeholder: 'Select start date',
                  sx: inputStyle,
                },
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography sx={labelStyle}>End Date</Typography>
            <DatePicker
              value={formData.endDate}
              onChange={(value) => handleChange('endDate', value)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: 'small',
                  placeholder: 'Select end date',
                  sx: inputStyle,
                },
              }}
            />
          </Grid>

          {/* Status / Set Alert - 2 Column Grid */}
          <Grid item xs={12} sm={6}>
            <Typography sx={labelStyle}>Status</Typography>
            <FormControl fullWidth size="small">
              <Select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                displayEmpty
                sx={selectStyle}
              >
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="In Progress">In Progress</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
                <MenuItem value="Cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-end',
                height: '100%',
                pb: 0.5,
              }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.alertEnabled}
                    onChange={(e) =>
                      handleChange('alertEnabled', e.target.checked)
                    }
                    size="small"
                  />
                }
                label={
                  <Typography sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                    Set Alert
                  </Typography>
                }
                sx={{ m: 0 }}
              />
            </Box>
          </Grid>

          {/* Alert Date & Time and Assign To - Side by Side Layout */}
          {formData.alertEnabled && staffList.length > 0 ? (
            <>
              {/* Alert Date & Time - Left Column */}
              <Grid item xs={12} sm={6}>
                <Typography sx={labelStyle}>Alert Date & Time</Typography>
                <DatePicker
                  value={formData.alertDate}
                  onChange={(value) => handleChange('alertDate', value)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: 'small',
                      placeholder: 'Select alert date & time',
                      sx: inputStyle,
                    },
                  }}
                />
              </Grid>
              {/* Assign To - Right Column */}
              <Grid item xs={12} sm={6}>
                <Typography sx={labelStyle}>Assign To</Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={formData.assignedTo || ''}
                    onChange={(e) => handleChange('assignedTo', e.target.value)}
                    displayEmpty
                    sx={selectStyle}
                  >
                    <MenuItem value="">Unassigned</MenuItem>
                    {staffList.map((staff) => (
                      <MenuItem key={staff.id} value={staff.id}>
                        {staff.fullName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </>
          ) : formData.alertEnabled ? (
            /* Alert Date & Time Only - When staffList is empty */
            <Grid item xs={12}>
              <Typography sx={labelStyle}>Alert Date & Time</Typography>
              <Box sx={{ width: '40%' }}>
                <DatePicker
                  value={formData.alertDate}
                  onChange={(value) => handleChange('alertDate', value)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: 'small',
                      placeholder: 'Select alert date & time',
                      sx: inputStyle,
                    },
                  }}
                />
              </Box>
            </Grid>
          ) : staffList.length > 0 ? (
            /* Assign To Only - When alert is disabled */
            <Grid item xs={12}>
              <Typography sx={labelStyle}>Assign To</Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={formData.assignedTo || ''}
                  onChange={(e) => handleChange('assignedTo', e.target.value)}
                  displayEmpty
                  sx={selectStyle}
                >
                  <MenuItem value="">Unassigned</MenuItem>
                  {staffList.map((staff) => (
                    <MenuItem key={staff.id} value={staff.id}>
                      {staff.fullName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          ) : null}
        </Grid>
      </DialogContent>
      <DialogActions
        sx={{ p: 2.5, pt: 2, gap: 1.5, justifyContent: 'flex-end' }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          size="medium"
          sx={{
            minWidth: 100,
            textTransform: 'none',
            fontSize: '0.875rem',
            borderRadius: '6px',
            borderColor: 'rgba(0, 0, 0, 0.23)',
            '&:hover': {
              borderColor: 'rgba(0, 0, 0, 0.87)',
            },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          size="medium"
          sx={{
            bgcolor: '#06aee9',
            '&:hover': { bgcolor: '#0599d1' },
            minWidth: 120,
            textTransform: 'none',
            fontSize: '0.875rem',
            borderRadius: '6px',
            fontWeight: 500,
          }}
          disabled={createMutation.isPending || updateMutation.isPending}
        >
          {task ? 'Update Task' : 'Create Task'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddTaskModal
