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
  Paper,
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
  Divider,
  Autocomplete,
} from '@mui/material'
import {
  Close as CloseIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Comment as CommentIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import debounce from 'lodash/debounce'
import {
  getTickets,
  createTicket,
  updateTicketStatus,
  deleteTicket,
  getActiveStaff,
  getTicketDetails,
  createTicketComment,
} from '@/constants/apis'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

// Priority badge colors
const getPriorityColor = (priority) => {
  switch (priority) {
    case 'HIGH':
      return { bg: '#fee2e2', text: '#dc2626', border: '#fecaca' }
    case 'MEDIUM':
      return { bg: '#dbeafe', text: '#2563eb', border: '#bfdbfe' }
    case 'LOW':
      return { bg: '#f3f4f6', text: '#6b7280', border: '#e5e7eb' }
    default:
      return { bg: '#f3f4f6', text: '#6b7280', border: '#e5e7eb' }
  }
}

// Status badge colors
const getStatusColor = (status) => {
  switch (status) {
    case 'OPEN':
      return { bg: '#ffffff', text: '#374151', border: '#d1d5db' }
    case 'IN_PROGRESS':
      return { bg: '#dbeafe', text: '#2563eb', border: '#bfdbfe' }
    case 'COMPLETED':
      return { bg: '#d1fae5', text: '#059669', border: '#a7f3d0' }
    default:
      return { bg: '#f3f4f6', text: '#6b7280', border: '#e5e7eb' }
  }
}

// Create Ticket Modal Component
function CreateTicketModal({ open, onClose, onSuccess }) {
  const user = useSelector((store) => store.user)
  const [formData, setFormData] = useState({
    taskDescription: '',
    assignedTo: '',
    priority: 'MEDIUM',
    category: '',
    tags: [],
  })
  const [tagInput, setTagInput] = useState('')
  const [errors, setErrors] = useState({})

  // Predefined categories
  const categories = [
    'Maintenance',
    'Equipment',
    'Supplies',
    'Follow-up',
    'Cleaning',
    'Security',
    'IT Support',
    'Other',
  ]

  // Fetch active staff
  const { data: staffData, isLoading: staffLoading } = useQuery({
    queryKey: ['activeStaff', user?.accessToken],
    queryFn: () => getActiveStaff(user?.accessToken),
    enabled: open && !!user?.accessToken,
  })

  const staff = staffData?.data || []

  // Create ticket mutation
  const createMutation = useMutation({
    mutationFn: (data) => createTicket(user?.accessToken, data),
    onSuccess: (response) => {
      if (response.status === 201) {
        toast.success('Ticket created successfully!')
        onSuccess()
        handleClose()
      } else {
        toast.error(response.message || 'Failed to create ticket')
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create ticket')
    },
  })

  const handleClose = () => {
    setFormData({
      taskDescription: '',
      assignedTo: '',
      priority: 'MEDIUM',
      category: '',
      tags: [],
    })
    setTagInput('')
    setErrors({})
    onClose()
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      if (formData.tags.length < 10) {
        setFormData({
          ...formData,
          tags: [...formData.tags, tagInput.trim()],
        })
        setTagInput('')
      }
    }
  }

  const handleRemoveTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag) => tag !== tagToRemove),
    })
  }

  const handleTagInputKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const validate = () => {
    const newErrors = {}
    if (
      !formData.taskDescription ||
      formData.taskDescription.trim().length < 10
    ) {
      newErrors.taskDescription =
        'Task description must be at least 10 characters'
    }
    if (!formData.assignedTo) {
      newErrors.assignedTo = 'Please assign the ticket to a staff member'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validate()) {
      createMutation.mutate(formData)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1,
        }}
      >
        <Typography variant="h6" fontWeight={600}>
          Create New Ticket
        </Typography>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 3 }}>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Fill in the details below to create a new task for the hospital floor.
        </Typography>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Task"
                multiline
                rows={4}
                placeholder="Describe the task..."
                value={formData.taskDescription}
                onChange={(e) =>
                  setFormData({ ...formData, taskDescription: e.target.value })
                }
                error={!!errors.taskDescription}
                helperText={errors.taskDescription}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.assignedTo}>
                <InputLabel>Assign To</InputLabel>
                <Select
                  value={formData.assignedTo}
                  onChange={(e) =>
                    setFormData({ ...formData, assignedTo: e.target.value })
                  }
                  label="Assign To"
                  disabled={staffLoading}
                >
                  <MenuItem value="">
                    <em>Select a staff member</em>
                  </MenuItem>
                  {staff.map((member) => (
                    <MenuItem key={member.id} value={member.id}>
                      {member.fullName} ({member.roleDetails?.name || 'Staff'})
                    </MenuItem>
                  ))}
                </Select>
                {errors.assignedTo && (
                  <Typography
                    variant="caption"
                    color="error"
                    sx={{ mt: 0.5, ml: 1.75 }}
                  >
                    {errors.assignedTo}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value })
                  }
                  label="Priority"
                >
                  <MenuItem value="LOW">Low</MenuItem>
                  <MenuItem value="MEDIUM">Medium</MenuItem>
                  <MenuItem value="HIGH">High</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <Autocomplete
                freeSolo
                options={categories}
                value={formData.category}
                onChange={(e, newValue) =>
                  setFormData({ ...formData, category: newValue || '' })
                }
                onInputChange={(e, newInputValue) =>
                  setFormData({ ...formData, category: newInputValue })
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Category"
                    placeholder="Select or enter category"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box>
                <TextField
                  fullWidth
                  label="Tags"
                  placeholder="Type and press Enter to add tag"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleTagInputKeyPress}
                  helperText={`${formData.tags.length}/10 tags`}
                  InputProps={{
                    endAdornment: (
                      <Button
                        size="small"
                        onClick={handleAddTag}
                        disabled={
                          !tagInput.trim() || formData.tags.length >= 10
                        }
                        sx={{ minWidth: 'auto', mr: 1 }}
                      >
                        Add
                      </Button>
                    ),
                  }}
                />
                {formData.tags.length > 0 && (
                  <Box
                    sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}
                  >
                    {formData.tags.map((tag, index) => (
                      <Chip
                        key={index}
                        label={tag}
                        onDelete={() => handleRemoveTag(tag)}
                        size="small"
                        sx={{
                          bgcolor: '#e3f2fd',
                          color: '#1976d2',
                        }}
                      />
                    ))}
                  </Box>
                )}
              </Box>
            </Grid>
          </Grid>
        </form>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={createMutation.isPending}
          startIcon={
            createMutation.isPending ? <CircularProgress size={16} /> : null
          }
        >
          Create Ticket
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// Main Ticketing Component
function Ticketing() {
  const user = useSelector((store) => store.user)
  const queryClient = useQueryClient()
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: '',
  })
  const [page, setPage] = useState(1)
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

  // Fetch tickets
  const { data, isLoading, error } = useQuery({
    queryKey: ['tickets', user?.accessToken, filters, page],
    queryFn: () =>
      getTickets(user?.accessToken, {
        ...filters,
        page,
        limit,
      }),
    enabled: !!user?.accessToken,
  })

  const tickets = data?.data?.tickets || []
  const pagination = data?.data?.pagination || { total: 0, totalPages: 0 }

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ ticketId, status }) =>
      updateTicketStatus(user?.accessToken, ticketId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      toast.success('Ticket status updated successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update ticket status')
    },
  })

  // Delete ticket mutation
  const deleteMutation = useMutation({
    mutationFn: (ticketId) => deleteTicket(user?.accessToken, ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      toast.success('Ticket deleted successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete ticket')
    },
  })

  const handleStatusChange = (ticketId, newStatus) => {
    updateStatusMutation.mutate({ ticketId, status: newStatus })
  }

  const handleDelete = (ticketId) => {
    if (window.confirm('Are you sure you want to delete this ticket?')) {
      deleteMutation.mutate(ticketId)
    }
  }

  const handleSearchChange = (e) => {
    debouncedSearch(e.target.value)
  }

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({ ...prev, [filterName]: value }))
    setPage(1)
  }

  const clearFilters = () => {
    setFilters({ status: '', priority: '', search: '' })
    setPage(1)
  }

  const isAdmin = user?.roleDetails?.name?.toLowerCase() === 'admin'

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f7fa', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Ticketing
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={3}>
          Manage day-to-day hospital floor activities and tasks.
        </Typography>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Button
            variant="contained"
            onClick={() => setCreateModalOpen(true)}
            sx={{
              bgcolor: '#06aee9',
              '&:hover': { bgcolor: '#0599d1' },
            }}
          >
            Create Ticket
          </Button>
        </Box>
      </Box>

      {/* Filters and Search */}
      <Card
        sx={{ mb: 3, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
      >
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search by task or ticket code..."
                InputProps={{
                  startAdornment: (
                    <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  ),
                }}
                onChange={handleSearchChange}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  label="Status"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="OPEN">Open</MenuItem>
                  <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                  <MenuItem value="COMPLETED">Completed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Priority</InputLabel>
                <Select
                  value={filters.priority}
                  onChange={(e) =>
                    handleFilterChange('priority', e.target.value)
                  }
                  label="Priority"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="HIGH">High</MenuItem>
                  <MenuItem value="MEDIUM">Medium</MenuItem>
                  <MenuItem value="LOW">Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterListIcon />}
                onClick={clearFilters}
                size="small"
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tickets Table */}
      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} mb={2}>
            All Tickets
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            A list of all operational tickets.
          </Typography>

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="error">
                Failed to load tickets. Please try again.
              </Typography>
            </Box>
          ) : tickets.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary" mb={2}>
                No tickets found
              </Typography>
              <Button
                variant="contained"
                onClick={() => setCreateModalOpen(true)}
              >
                Create Your First Ticket
              </Button>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f9fafb' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Task</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Assigned To</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Tags</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Priority</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
                    {isAdmin && (
                      <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tickets.map((ticket) => {
                    const assignedTo = ticket.assignedToDetails
                      ? JSON.parse(ticket.assignedToDetails)
                      : {}
                    const priorityColor = getPriorityColor(ticket.priority)
                    const statusColor = getStatusColor(ticket.status)
                    const tags = ticket.tags
                      ? typeof ticket.tags === 'string'
                        ? JSON.parse(ticket.tags)
                        : ticket.tags
                      : []

                    return (
                      <TableRow
                        key={ticket.id}
                        hover
                        sx={{
                          '&:hover': { bgcolor: '#f9fafb' },
                          cursor: 'pointer',
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {ticket.taskDescription?.substring(0, 60)}
                            {ticket.taskDescription?.length > 60 ? '...' : ''}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {ticket.ticketCode}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <Avatar
                              sx={{ width: 32, height: 32, bgcolor: '#06aee9' }}
                            >
                              {assignedTo.fullName?.charAt(0)?.toUpperCase() ||
                                'U'}
                            </Avatar>
                            <Typography variant="body2">
                              {assignedTo.fullName || 'Unassigned'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {ticket.category ? (
                            <Chip
                              label={ticket.category}
                              size="small"
                              sx={{
                                bgcolor: '#f3e5f5',
                                color: '#7b1fa2',
                                fontWeight: 500,
                              }}
                            />
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              -
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {tags && tags.length > 0 ? (
                            <Box
                              sx={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 0.5,
                              }}
                            >
                              {tags.slice(0, 3).map((tag, idx) => (
                                <Chip
                                  key={idx}
                                  label={tag}
                                  size="small"
                                  sx={{
                                    bgcolor: '#e3f2fd',
                                    color: '#1976d2',
                                    fontSize: '0.7rem',
                                  }}
                                />
                              ))}
                              {tags.length > 3 && (
                                <Chip
                                  label={`+${tags.length - 3}`}
                                  size="small"
                                  sx={{
                                    bgcolor: '#f5f5f5',
                                    color: '#757575',
                                    fontSize: '0.7rem',
                                  }}
                                />
                              )}
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              -
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={ticket.status?.replace('_', ' ') || 'Open'}
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
                          <Chip
                            label={ticket.priority || 'Medium'}
                            size="small"
                            sx={{
                              bgcolor: priorityColor.bg,
                              color: priorityColor.text,
                              border: `1px solid ${priorityColor.border}`,
                              fontWeight: 500,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {ticket.createdAt
                              ? dayjs(ticket.createdAt).fromNow()
                              : 'N/A'}
                          </Typography>
                        </TableCell>
                        {isAdmin && (
                          <TableCell>
                            <Stack direction="row" spacing={1}>
                              {ticket.status !== 'COMPLETED' && (
                                <Tooltip title="Change Status">
                                  <Select
                                    value={ticket.status}
                                    onChange={(e) =>
                                      handleStatusChange(
                                        ticket.id,
                                        e.target.value,
                                      )
                                    }
                                    size="small"
                                    sx={{ minWidth: 120 }}
                                  >
                                    <MenuItem value="OPEN">Open</MenuItem>
                                    <MenuItem value="IN_PROGRESS">
                                      In Progress
                                    </MenuItem>
                                    <MenuItem value="COMPLETED">
                                      Completed
                                    </MenuItem>
                                  </Select>
                                </Tooltip>
                              )}
                              <Tooltip title="Delete">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDelete(ticket.id)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        )}
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
                tickets
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

      {/* Create Ticket Modal */}
      <CreateTicketModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['tickets'] })
        }}
      />
    </Box>
  )
}

export default Ticketing
