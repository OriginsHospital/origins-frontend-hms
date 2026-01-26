import React, { useState, useMemo, useCallback } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Tooltip,
  Stack,
  Avatar,
  Menu,
} from '@mui/material'
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import debounce from 'lodash/debounce'
import {
  getTasks,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  getActiveStaff,
} from '@/constants/apis'
import dayjs from 'dayjs'
import { DatePicker } from '@mui/x-date-pickers'
import AddTaskModal from './AddTaskModal'
import TaskDetailsModal from './TaskDetailsModal'

// CSV Export Utility Function
const exportToCSV = (data, filename, headers, getRowData) => {
  // Create CSV content
  const csvHeaders = headers.join(',')
  const csvRows = data.map((item) => {
    const row = getRowData(item)
    return row
      .map((cell) => {
        // Escape commas and quotes in cell values
        if (cell === null || cell === undefined) return ''
        const cellStr = String(cell)
        if (
          cellStr.includes(',') ||
          cellStr.includes('"') ||
          cellStr.includes('\n')
        ) {
          return `"${cellStr.replace(/"/g, '""')}"`
        }
        return cellStr
      })
      .join(',')
  })

  const csvContent = [csvHeaders, ...csvRows].join('\n')

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Tab Panel Component
const TabPanel = ({ children, value, index }) => (
  <div hidden={value !== index}>{value === index && <Box>{children}</Box>}</div>
)

function TaskTracker() {
  const user = useSelector((store) => store.user)
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState({ status: '', search: '' })
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editTask, setEditTask] = useState(null)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState(null)
  const [anchorEl, setAnchorEl] = useState(null)
  const [selectedTask, setSelectedTask] = useState(null)
  const [exportDateModalOpen, setExportDateModalOpen] = useState(false)
  const [exportFromDate, setExportFromDate] = useState(null)
  const [exportToDate, setExportToDate] = useState(null)
  const limit = 50

  // Debounced search
  const debouncedSearch = useMemo(
    () =>
      debounce((value) => {
        setFilters((prev) => ({ ...prev, search: value }))
        setPage(1)
      }, 500),
    [],
  )

  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearchTerm(value)
    debouncedSearch(value)
  }

  // Fetch tasks
  const { data, isLoading, error } = useQuery({
    queryKey: ['tasks', user?.accessToken, filters, page],
    queryFn: async () => {
      try {
        const response = await getTasks(user?.accessToken, {
          ...filters,
          page,
          limit,
        })
        console.log('Tasks API Response:', response)
        if (response.status !== 200) {
          throw new Error(response.message || 'Failed to fetch tasks')
        }
        return response
      } catch (err) {
        console.error('Error fetching tasks:', err)
        throw err
      }
    },
    enabled: !!user?.accessToken,
    retry: 1,
  })

  // Handle different response structures
  const tasks = data?.data?.tasks || data?.tasks || []
  const pagination = data?.data?.pagination ||
    data?.pagination || { total: 0, totalPages: 1 }

  // Debug logging
  if (data) {
    console.log('Full response data:', data)
    console.log('Tasks array:', tasks)
    console.log('Tasks count:', tasks.length)
    console.log('Pagination:', pagination)
  }

  if (error) {
    console.error('Tasks query error:', error)
  }

  // Fetch active staff for assignment
  const { data: staffData } = useQuery({
    queryKey: ['activeStaff'],
    queryFn: async () => {
      const response = await getActiveStaff(user?.accessToken)
      return response
    },
    enabled: !!user?.accessToken,
  })

  const staffList = staffData?.data || []

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await createTask(user?.accessToken, payload)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      setCreateModalOpen(false)
      toast.success('Task created successfully')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to create task')
    },
  })

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await updateTask(user?.accessToken, payload)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      setEditTask(null)
      toast.success('Task updated successfully')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to update task')
    },
  })

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }) => {
      const response = await updateTaskStatus(user?.accessToken, taskId, status)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      setAnchorEl(null)
      toast.success('Task status updated successfully')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to update status')
    },
  })

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId) => {
      const response = await deleteTask(user?.accessToken, taskId)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      setAnchorEl(null)
      toast.success('Task deleted successfully')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to delete task')
    },
  })

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({ ...prev, [filterName]: value }))
    setPage(1)
  }

  const clearFilters = () => {
    setFilters({ status: '', search: '' })
    setSearchTerm('')
    setPage(1)
  }

  // Open export date modal
  const handleOpenExportModal = () => {
    setExportFromDate(null)
    setExportToDate(null)
    setExportDateModalOpen(true)
  }

  // Export tasks to CSV with date range
  const handleExportTasks = async () => {
    try {
      // Close modal
      setExportDateModalOpen(false)

      // Use currently loaded tasks first
      let allTasks = tasks || []

      // Build export filters with date range
      const exportFilters = { ...filters }
      if (exportFromDate) {
        exportFilters.fromDate = dayjs(exportFromDate).format('YYYY-MM-DD')
      }
      if (exportToDate) {
        exportFilters.toDate = dayjs(exportToDate).format('YYYY-MM-DD')
      }

      // If we have tasks, try to fetch all with same filters for complete export
      if (
        pagination?.total > allTasks.length ||
        exportFromDate ||
        exportToDate
      ) {
        toast.info('Fetching tasks for export...')
        try {
          const exportData = await getTasks(user?.accessToken, {
            ...exportFilters,
            page: 1,
            limit: 10000, // High limit to get all records
          })

          // Try different response structures
          const fetchedTasks =
            exportData?.data?.tasks ||
            exportData?.tasks ||
            exportData?.data ||
            []

          if (fetchedTasks.length > 0) {
            allTasks = fetchedTasks
          }
        } catch (apiError) {
          console.warn(
            'Could not fetch all tasks, using current page:',
            apiError,
          )
          // Continue with currently loaded tasks
        }
      }

      // Filter by date range if dates are selected and we have tasks
      if ((exportFromDate || exportToDate) && allTasks.length > 0) {
        allTasks = allTasks.filter((task) => {
          const taskDate = task.createdAt || task.created_at
          if (!taskDate) return false

          const createdDate = dayjs(taskDate)
          const fromDate = exportFromDate
            ? dayjs(exportFromDate).startOf('day')
            : null
          const toDate = exportToDate ? dayjs(exportToDate).endOf('day') : null

          if (fromDate && createdDate.isBefore(fromDate)) return false
          if (toDate && createdDate.isAfter(toDate)) return false
          return true
        })
      }

      if (allTasks.length === 0) {
        toast.warning('No tasks found for the selected date range')
        return
      }

      toast.info('Preparing export...')

      const headers = [
        'Task Name',
        'Description',
        'Remarks',
        'Status',
        'Start Date',
        'End Date',
        'Assigned To',
        'Assigned To Email',
        'Created By',
        'Created By Email',
        'Created At',
        'Updated At',
        'Alert Enabled',
        'Alert Date',
      ]

      const getRowData = (task) => {
        const assignedTo = task.assignedToDetails
          ? typeof task.assignedToDetails === 'string'
            ? JSON.parse(task.assignedToDetails)
            : task.assignedToDetails
          : {}
        const createdBy = task.createdByDetails
          ? typeof task.createdByDetails === 'string'
            ? JSON.parse(task.createdByDetails)
            : task.createdByDetails
          : {}

        return [
          task.taskName || task.task_name || '',
          task.description || '',
          task.remarks || '',
          task.status || '',
          task.startDate || task.start_date
            ? dayjs(task.startDate || task.start_date).format('YYYY-MM-DD')
            : '',
          task.endDate || task.end_date
            ? dayjs(task.endDate || task.end_date).format('YYYY-MM-DD')
            : '',
          assignedTo.fullName || 'Unassigned',
          assignedTo.email || '',
          createdBy.fullName || 'Unknown',
          createdBy.email || '',
          task.createdAt || task.created_at
            ? dayjs(task.createdAt || task.created_at).format(
                'YYYY-MM-DD HH:mm:ss',
              )
            : '',
          task.updatedAt || task.updated_at
            ? dayjs(task.updatedAt || task.updated_at).format(
                'YYYY-MM-DD HH:mm:ss',
              )
            : '',
          task.alertEnabled || task.alert_enabled ? 'Yes' : 'No',
          task.alertDate || task.alert_date
            ? dayjs(task.alertDate || task.alert_date).format(
                'YYYY-MM-DD HH:mm:ss',
              )
            : '',
        ]
      }

      const timestamp = dayjs().format('YYYY-MM-DD_HH-mm-ss')
      exportToCSV(
        allTasks,
        `tasks_report_${timestamp}.csv`,
        headers,
        getRowData,
      )
      toast.success(`Exported ${allTasks.length} tasks successfully!`)
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export tasks. Please try again.')
    }
  }

  const handleMenuOpen = (event, task) => {
    setAnchorEl(event.currentTarget)
    setSelectedTask(task)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedTask(null)
  }

  const handleEdit = () => {
    setEditTask(selectedTask)
    setCreateModalOpen(true)
    handleMenuClose()
  }

  const handleStatusChange = (status) => {
    if (selectedTask) {
      updateStatusMutation.mutate({ taskId: selectedTask.id, status })
    }
  }

  const handleDelete = () => {
    if (selectedTask) {
      if (window.confirm('Are you sure you want to delete this task?')) {
        deleteTaskMutation.mutate(selectedTask.id)
      }
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return { bg: '#fff3e0', text: '#e65100', border: '#ff9800' }
      case 'In Progress':
        return { bg: '#e3f2fd', text: '#1565c0', border: '#2196f3' }
      case 'Completed':
        return { bg: '#e8f5e9', text: '#2e7d32', border: '#4caf50' }
      case 'Cancelled':
        return { bg: '#ffebee', text: '#c62828', border: '#f44336' }
      default:
        return { bg: '#f5f5f5', text: '#757575', border: '#9e9e9e' }
    }
  }

  const isAdmin = user?.roleDetails?.name?.toLowerCase() === 'admin'

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f7fa', minHeight: '100vh' }}>
      {/* Filters and Search */}
      <Card
        sx={{ mb: 3, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
      >
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search tasks or assignees..."
                value={searchTerm}
                InputProps={{
                  startAdornment: (
                    <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  ),
                }}
                onChange={handleSearchChange}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>All Statuses</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  label="All Statuses"
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="In Progress">In Progress</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                  <MenuItem value="Cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setEditTask(null)
                  setCreateModalOpen(true)
                }}
                sx={{
                  bgcolor: '#06aee9',
                  '&:hover': { bgcolor: '#0599d1' },
                }}
              >
                Add Task
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tasks Table */}
      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography variant="h6" fontWeight={600}>
              All Tasks
            </Typography>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleOpenExportModal}
              disabled={isLoading}
              size="small"
              sx={{
                textTransform: 'none',
                fontSize: '0.875rem',
              }}
            >
              Download Report
            </Button>
          </Box>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="error" variant="h6" gutterBottom>
                Failed to load tasks
              </Typography>
              <Typography color="error" variant="body2">
                {error?.message ||
                  'Please try again or check the console for details.'}
              </Typography>
              {error && (
                <Button
                  variant="outlined"
                  onClick={() =>
                    queryClient.invalidateQueries({ queryKey: ['tasks'] })
                  }
                  sx={{ mt: 2 }}
                >
                  Retry
                </Button>
              )}
            </Box>
          ) : tasks.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary" mb={2}>
                No tasks found
              </Typography>
              <Button
                variant="contained"
                onClick={() => {
                  setEditTask(null)
                  setCreateModalOpen(true)
                }}
              >
                Create Your First Task
              </Button>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f9fafb' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Task Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Start Date</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>End Date</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tasks.map((task) => {
                    const statusColor = getStatusColor(task.status)
                    const assignedTo = task.assignedToDetails
                      ? typeof task.assignedToDetails === 'string'
                        ? JSON.parse(task.assignedToDetails)
                        : task.assignedToDetails
                      : {}
                    const createdBy = task.createdByDetails
                      ? typeof task.createdByDetails === 'string'
                        ? JSON.parse(task.createdByDetails)
                        : task.createdByDetails
                      : {}

                    return (
                      <TableRow
                        key={task.id}
                        hover
                        sx={{
                          '&:hover': { bgcolor: '#f9fafb' },
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {task.taskName || task.task_name}
                          </Typography>
                          {task.description && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                display: 'block',
                                mt: 0.5,
                                maxWidth: 400,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {task.description}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={task.status}
                            size="small"
                            sx={{
                              bgcolor: statusColor.bg,
                              color: statusColor.text,
                              border: `1px solid ${statusColor.border}`,
                              fontWeight: 500,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {task.startDate || task.start_date
                              ? dayjs(task.startDate || task.start_date).format(
                                  'MMM D, YYYY',
                                )
                              : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {task.endDate || task.end_date
                              ? dayjs(task.endDate || task.end_date).format(
                                  'MMM D, YYYY',
                                )
                              : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => {
                                  setSelectedTaskId(task.id)
                                  setViewModalOpen(true)
                                }}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuOpen(e, task)}
                            >
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mt: 3,
                pt: 2,
                borderTop: '1px solid #e5e7eb',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Showing {(page - 1) * limit + 1} to{' '}
                {Math.min(page * limit, pagination.total)} of {pagination.total}{' '}
                tasks
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  size="small"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 1, fontSize: 18 }} />
          Edit
        </MenuItem>
        {isAdmin && (
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            <DeleteIcon sx={{ mr: 1, fontSize: 18 }} />
            Delete
          </MenuItem>
        )}
      </Menu>

      {/* Add/Edit Task Modal */}
      <AddTaskModal
        open={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false)
          setEditTask(null)
        }}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['tasks'] })
        }}
        task={editTask}
        staffList={staffList}
        createMutation={createTaskMutation}
        updateMutation={updateTaskMutation}
      />

      {/* Task Details Modal */}
      <TaskDetailsModal
        open={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false)
          setSelectedTaskId(null)
        }}
        taskId={selectedTaskId}
        onEdit={(task) => {
          setEditTask(task)
          setCreateModalOpen(true)
        }}
        onStatusChange={(taskId, newStatus) => {
          updateStatusMutation.mutate({ taskId, status: newStatus })
        }}
      />

      {/* Export Date Range Modal */}
      <Dialog
        open={exportDateModalOpen}
        onClose={() => setExportDateModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant="h6" fontWeight={600}>
              Export Tasks Report
            </Typography>
            <IconButton
              onClick={() => setExportDateModalOpen(false)}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <Typography
                variant="caption"
                color="text.secondary"
                fontSize="0.7rem"
                sx={{ mb: 0.5, display: 'block' }}
              >
                From Date
              </Typography>
              <DatePicker
                value={exportFromDate}
                onChange={(newValue) => setExportFromDate(newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small',
                    placeholder: 'Select from date',
                    sx: {
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                      },
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <Typography
                variant="caption"
                color="text.secondary"
                fontSize="0.7rem"
                sx={{ mb: 0.5, display: 'block' }}
              >
                To Date
              </Typography>
              <DatePicker
                value={exportToDate}
                onChange={(newValue) => setExportToDate(newValue)}
                minDate={exportFromDate}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small',
                    placeholder: 'Select to date',
                    sx: {
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                      },
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography
                variant="caption"
                color="text.secondary"
                fontSize="0.75rem"
              >
                Leave dates empty to export all tasks. Select date range to
                filter by creation date.
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setExportDateModalOpen(false)}
            variant="outlined"
            size="small"
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExportTasks}
            variant="contained"
            size="small"
            sx={{
              bgcolor: '#06aee9',
              '&:hover': { bgcolor: '#0599d1' },
              textTransform: 'none',
            }}
          >
            Export
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default TaskTracker
