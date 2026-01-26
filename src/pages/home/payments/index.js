import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getAllOrders,
  getAllDepartments,
  getAllVendors,
  getAllVendorsByDepartmentId,
  createNewOrder,
  getAllPayments,
  createPayment,
} from '@/constants/apis'
import { useSelector, useDispatch } from 'react-redux'
import { DataGrid } from '@mui/x-data-grid'
import ReportExportToolbar from '@/components/ReportExportToolbar'
import FilteredDataGrid from '@/components/FilteredDataGrid'
import {
  Button,
  CircularProgress,
  IconButton,
  Stack,
  TextField,
  Box,
  Card,
  CardContent,
  Tabs,
  Tab,
  Typography,
  MenuItem,
  Autocomplete,
  Chip,
  Grid,
  LinearProgress,
  Divider,
  Paper,
  Tooltip,
} from '@mui/material'
import dayjs from 'dayjs'
import { openModal, closeModal } from '@/redux/modalSlice'
import Modal from '@/components/Modal'
import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { DatePicker } from '@mui/x-date-pickers'
import { toastconfig } from '@/utils/toastconfig'
import { toast } from 'react-toastify'
import {
  Close,
  Visibility,
  Download,
  FileDownload,
  TrendingUp,
  TrendingDown,
  AttachMoney,
  Payment,
  AccountBalance,
  Business,
  Category,
  Assessment,
  CalendarToday,
  Store,
  ArrowUpward,
  ArrowDownward,
  Remove,
} from '@mui/icons-material'
import { Pie, Bar, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Filler,
} from 'chart.js'
import JSZip from 'jszip'

// Register Chart.js components
ChartJS.register(
  ArcElement,
  ChartTooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Filler,
)

// Tab Panel Component
const TabPanel = ({ children, value, index }) => (
  <div hidden={value !== index}>{value === index && <Box>{children}</Box>}</div>
)

function PaymentsPage() {
  const userDetails = useSelector((store) => store.user)
  const dropdowns = useSelector((store) => store.dropdowns)
  const modal = useSelector((store) => store.modal)
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState(0)
  const [invoiceUrl, setInvoiceUrl] = useState(null)
  const [receiptUrl, setReceiptUrl] = useState(null)
  const [selectedPaymentId, setSelectedPaymentId] = useState(null)
  const [currentFilters, setCurrentFilters] = useState({})
  const [filteredPayments, setFilteredPayments] = useState([])
  const [isDownloadingInvoices, setIsDownloadingInvoices] = useState(false)
  const [isDownloadingReceipts, setIsDownloadingReceipts] = useState(false)
  const modalOpeningRef = useRef(false)
  const modalJustOpenedRef = useRef(false)
  const modalStateRef = useRef(modal?.key)

  // Update ref when modal state changes
  useEffect(() => {
    modalStateRef.current = modal?.key
  }, [modal?.key])

  // Debug: Log modal state changes
  useEffect(() => {
    console.log('Modal state changed:', modal?.key)
    console.log('Invoice URL:', invoiceUrl)
    console.log('Receipt URL:', receiptUrl)
    console.log('Modal opening ref:', modalOpeningRef.current)
  }, [modal?.key, invoiceUrl, receiptUrl])

  // IMMEDIATE FIX: Run cleanup as soon as component mounts - before anything else
  useEffect(() => {
    // Don't close modals on mount - only cleanup stuck backdrops
    // Remove all backdrops immediately - AGGRESSIVE CLEANUP
    const removeAllBackdrops = () => {
      // Get current modal state
      const currentModal = modal?.key

      // Don't cleanup if invoice or receipt modals are open, or if a modal is currently opening
      if (
        modalOpeningRef.current ||
        currentModal === 'viewInvoiceModal' ||
        currentModal === 'viewReceiptModal'
      ) {
        return // Don't interfere with invoice/receipt modals
      }

      // Remove ALL backdrops if no modal is open
      if (!currentModal) {
        const backdrops = document.querySelectorAll(
          '[class*="MuiBackdrop-root"], [class*="MuiModal-backdrop"], [class*="backdrop"], [class*="MuiBackdrop"]',
        )
        backdrops.forEach((el) => {
          el.style.display = 'none'
          el.style.pointerEvents = 'none'
          el.remove()
        })
      } else {
        // If modal is open, only remove backdrops without dialogs
        const backdrops = document.querySelectorAll(
          '[class*="MuiBackdrop-root"]',
        )
        backdrops.forEach((el) => {
          const dialog = el.parentElement?.querySelector('[role="dialog"]')
          const isOpen =
            dialog && window.getComputedStyle(dialog).display !== 'none'
          if (!isOpen) {
            el.remove()
          }
        })
      }

      // Remove modal root containers without open dialogs
      const modalRoots = document.querySelectorAll('[class*="MuiModal-root"]')
      modalRoots.forEach((el) => {
        const dialog = el.querySelector('[role="dialog"]')
        const isOpen =
          dialog &&
          window.getComputedStyle(dialog).display !== 'none' &&
          window.getComputedStyle(dialog).visibility !== 'hidden'
        if (!isOpen || !currentModal) {
          el.remove()
        }
      })

      // Unlock body if no modals (but not if invoice/receipt modals are open)
      if (
        !currentModal ||
        (currentModal !== 'viewInvoiceModal' &&
          currentModal !== 'viewReceiptModal')
      ) {
        if (!currentModal) {
          document.body.style.overflow = ''
          document.body.style.paddingRight = ''
          document.body.classList.remove('MuiModal-open')
          document.body.removeAttribute('aria-hidden')
          // Remove inline styles if they're only for modal
          const bodyStyle = document.body.getAttribute('style')
          if (
            bodyStyle &&
            (bodyStyle.includes('overflow') ||
              bodyStyle.includes('padding-right'))
          ) {
            const newStyle = bodyStyle
              .replace(/overflow[^;]*;?/g, '')
              .replace(/padding-right[^;]*;?/g, '')
              .trim()
            if (newStyle) {
              document.body.setAttribute('style', newStyle)
            } else {
              document.body.removeAttribute('style')
            }
          }
        }
      }
    }

    // Run immediately multiple times
    removeAllBackdrops()
    setTimeout(() => removeAllBackdrops(), 10)
    setTimeout(() => removeAllBackdrops(), 50)
    setTimeout(() => removeAllBackdrops(), 100)
    setTimeout(() => removeAllBackdrops(), 200)

    // Also inject global style to ensure sidebar is always clickable
    const styleId = 'payments-page-fix'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = `
        /* CRITICAL: Ensure sidebar is always on top and clickable */
        nav, [class*="sidebar"], [class*="SideNav"], [class*="side-nav"] {
          z-index: 99999 !important;
          pointer-events: auto !important;
          position: relative !important;
        }
        /* Hide ALL backdrops by default - only show if modal is actually open */
        [class*="MuiBackdrop-root"] {
          pointer-events: none !important;
        }
        [class*="MuiBackdrop-root"]:not(:has(+ [role="dialog"][aria-modal="true"]:not([style*="display: none"]))) {
          display: none !important;
          visibility: hidden !important;
        }
        /* Unlock body when no real modals */
        body.MuiModal-open:not(:has([role="dialog"][aria-modal="true"]:not([style*="display: none"]))) {
          overflow: auto !important;
          padding-right: 0 !important;
        }
        /* Ensure all navigation links are ALWAYS clickable */
        nav a, nav [href], [class*="sidebar"] a, [class*="SideNav"] a,
        nav button, [class*="sidebar"] button, [class*="SideNav"] button {
          pointer-events: auto !important;
          z-index: 100000 !important;
          position: relative !important;
          cursor: pointer !important;
        }
        /* Force remove any overlays blocking navigation */
        [class*="MuiBackdrop-root"][style*="position: fixed"] {
          display: none !important;
        }
      `
      document.head.appendChild(style)
    }

    // Also add a global click handler to force navigation - AGGRESSIVE
    const handleGlobalClick = (e) => {
      const target = e.target

      // Don't interfere if clicking on modal or modal-related elements
      const isModalClick =
        target.closest('[role="dialog"]') ||
        target.closest('[class*="MuiDialog"]') ||
        target.closest('[class*="MuiModal"]') ||
        modalOpeningRef.current ||
        modal?.key === 'viewInvoiceModal' ||
        modal?.key === 'viewReceiptModal'

      if (isModalClick) {
        return // Don't interfere with modals
      }

      const isNavClick =
        target.closest('nav') ||
        target.closest('[class*="sidebar"]') ||
        (target.closest('a[href]') && !target.closest('[role="dialog"]')) ||
        (target.tagName === 'A' && !target.closest('[role="dialog"]')) ||
        target.closest('button[class*="nav"]')

      if (isNavClick) {
        // IMMEDIATELY close modals and cleanup
        e.stopPropagation() // Prevent any modal handlers
        dispatch(closeModal())
        setInvoiceUrl(null)
        setReceiptUrl(null)
        removeAllBackdrops()

        // Force remove any remaining backdrops immediately
        requestAnimationFrame(() => {
          const allBackdrops = document.querySelectorAll(
            '[class*="MuiBackdrop-root"]',
          )
          allBackdrops.forEach((b) => {
            b.style.display = 'none'
            b.remove()
          })
          document.body.style.overflow = ''
          document.body.style.paddingRight = ''
          document.body.classList.remove('MuiModal-open')
        })
      }
    }

    // Use capture phase with high priority to catch clicks early
    document.addEventListener('click', handleGlobalClick, {
      capture: true,
      passive: false,
    })
    document.addEventListener('mousedown', handleGlobalClick, {
      capture: true,
      passive: false,
    })

    // Periodic cleanup to catch any stuck backdrops
    const cleanupInterval = setInterval(() => {
      const currentModal = modal?.key
      // Don't cleanup if invoice or receipt modals are open, or if a modal is opening
      if (
        !modalOpeningRef.current &&
        (!currentModal ||
          (currentModal !== 'viewInvoiceModal' &&
            currentModal !== 'viewReceiptModal'))
      ) {
        removeAllBackdrops()
      }
    }, 150)

    return () => {
      // Cleanup on unmount
      clearInterval(cleanupInterval)
      removeAllBackdrops()
      document.removeEventListener('click', handleGlobalClick, {
        capture: true,
      })
      document.removeEventListener('mousedown', handleGlobalClick, {
        capture: true,
      })
      const styleEl = document.getElementById(styleId)
      if (styleEl) {
        styleEl.remove()
      }
    }
  }, [dispatch, modal?.key])

  // Global cleanup function to remove stuck modal backdrops
  const cleanupStuckBackdrops = () => {
    // Don't cleanup if invoice or receipt modals are open, or if a modal is currently opening
    const currentModal = modal?.key
    if (
      modalOpeningRef.current ||
      currentModal === 'viewInvoiceModal' ||
      currentModal === 'viewReceiptModal'
    ) {
      return // Don't interfere with invoice/receipt modals
    }

    // Remove ALL MUI Dialog backdrops that are blocking navigation
    const backdrops = document.querySelectorAll('[class*="MuiBackdrop-root"]')
    backdrops.forEach((backdrop) => {
      // Check if there's an associated open dialog
      const dialog = backdrop.parentElement?.querySelector('[role="dialog"]')
      const isOpen =
        dialog && window.getComputedStyle(dialog).display !== 'none'

      // If no open dialog, remove the backdrop
      if (!isOpen) {
        backdrop.remove()
        // Also remove any related overlay elements
        const overlay = backdrop.parentElement?.querySelector(
          '[class*="MuiModal-root"]',
        )
        if (overlay && !overlay.querySelector('[role="dialog"]')) {
          overlay.remove()
        }
      }
    })

    // Remove body scroll lock if no modals are open
    const openDialogs = document.querySelectorAll(
      '[role="dialog"][aria-modal="true"]:not([style*="display: none"])',
    )
    if (openDialogs.length === 0) {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
      // Also remove any data attributes MUI might add
      document.body.removeAttribute('style')
      // But preserve other styles if any
      const currentStyle = document.body.getAttribute('style')
      if (currentStyle && !currentStyle.includes('overflow')) {
        document.body.style.cssText = currentStyle
      }
    }

    // Force remove any elements with high z-index that might be blocking
    const highZIndexElements = document.querySelectorAll('*')
    highZIndexElements.forEach((el) => {
      const zIndex = window.getComputedStyle(el).zIndex
      if (
        zIndex &&
        parseInt(zIndex) > 1000 &&
        el.classList.contains('MuiBackdrop-root')
      ) {
        const dialog = el.parentElement?.querySelector('[role="dialog"]')
        if (!dialog || window.getComputedStyle(dialog).display === 'none') {
          el.remove()
        }
      }
    })
  }

  // Run cleanup on mount and periodically - more aggressive
  useEffect(() => {
    // Immediate cleanup - run multiple times to ensure it works
    cleanupStuckBackdrops()
    setTimeout(cleanupStuckBackdrops, 50)
    setTimeout(cleanupStuckBackdrops, 100)
    setTimeout(cleanupStuckBackdrops, 200)

    // More frequent cleanup every 200ms to catch stuck backdrops quickly
    const interval = setInterval(() => {
      const currentModal = modal?.key
      // Don't cleanup if invoice or receipt modals are open, or if a modal is opening
      if (
        !modalOpeningRef.current &&
        (!currentModal ||
          (currentModal !== 'viewInvoiceModal' &&
            currentModal !== 'viewReceiptModal'))
      ) {
        cleanupStuckBackdrops()
      }
    }, 200)

    // Also cleanup on any click - especially navigation clicks
    const handleDocumentClick = (e) => {
      const target = e.target

      // Don't interfere if clicking on modal or modal-related elements
      const isModalClick =
        target.closest('[role="dialog"]') ||
        target.closest('[class*="MuiDialog"]') ||
        target.closest('[class*="MuiModal"]') ||
        modalOpeningRef.current ||
        modal?.key === 'viewInvoiceModal' ||
        modal?.key === 'viewReceiptModal'

      if (isModalClick) {
        return // Don't interfere with modals
      }

      // If clicking on sidebar, navigation links, or any link
      const isNavigationClick =
        target.closest('nav') ||
        target.closest('[class*="sidebar"]') ||
        (target.closest('a[href]') && !target.closest('[role="dialog"]')) ||
        (target.tagName === 'A' && !target.closest('[role="dialog"]')) ||
        target.closest('button[class*="nav"]') ||
        (target.onclick && target.closest('[role="navigation"]'))

      if (isNavigationClick) {
        // Force cleanup immediately
        cleanupStuckBackdrops()
        // Force close any modals
        dispatch(closeModal())
        setInvoiceUrl(null)
        setReceiptUrl(null)

        // Remove any remaining backdrops
        const allBackdrops = document.querySelectorAll(
          '[class*="MuiBackdrop-root"], [class*="MuiModal-backdrop"]',
        )
        allBackdrops.forEach((backdrop) => backdrop.remove())

        // Ensure body is not locked
        document.body.style.overflow = ''
        document.body.style.paddingRight = ''
        document.body.classList.remove('MuiModal-open')
      }
    }

    // Use capture phase to catch clicks early
    document.addEventListener('click', handleDocumentClick, true)
    document.addEventListener('mousedown', handleDocumentClick, true)

    // Also listen for route changes
    const handleRouteChange = () => {
      cleanupStuckBackdrops()
      dispatch(closeModal())
    }

    // Check if router is available
    if (typeof window !== 'undefined' && window.next?.router) {
      window.next.router.events?.on('routeChangeStart', handleRouteChange)
    }

    return () => {
      clearInterval(interval)
      document.removeEventListener('click', handleDocumentClick, true)
      document.removeEventListener('mousedown', handleDocumentClick, true)
      if (typeof window !== 'undefined' && window.next?.router) {
        window.next.router.events?.off('routeChangeStart', handleRouteChange)
      }
      cleanupStuckBackdrops()
    }
  }, [dispatch, modal?.key])

  // Fetch payments data
  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey: ['allPayments'],
    queryFn: () => getAllPayments(userDetails?.accessToken),
  })

  // Fetch departments
  const { data: departmentsData } = useQuery({
    queryKey: ['allDepartments'],
    queryFn: () => getAllDepartments(userDetails?.accessToken),
  })

  // Fetch vendors
  const { data: vendorsData } = useQuery({
    queryKey: ['allVendors'],
    queryFn: () => getAllVendors(userDetails?.accessToken),
  })

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    branchId: 1,
    departmentId: '',
    vendorId: '',
    amount: '',
    paymentDate: dayjs().format('YYYY-MM-DD'),
    invoiceFile: null,
    receiptFile: null,
  })

  // Get vendors by department
  const { data: getVendorsByDepartment } = useQuery({
    queryKey: ['getVendorsByDepartment', paymentForm?.departmentId],
    queryFn: () =>
      getAllVendorsByDepartmentId(
        userDetails?.accessToken,
        paymentForm?.departmentId,
      ),
    enabled: !!paymentForm?.departmentId,
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setPaymentForm((prev) => ({ ...prev, [name]: value }))
    if (name === 'departmentId') {
      setPaymentForm((prev) => ({ ...prev, vendorId: '' }))
    }
  }

  const handleFileChange = (field, event) => {
    setPaymentForm((prev) => ({
      ...prev,
      [field]: event.target.files[0],
    }))
  }

  const viewInvoice = useCallback(
    (url) => {
      if (!url) {
        toast.error('Invoice URL not available', toastconfig)
        return
      }
      console.log('Opening invoice modal with URL:', url)
      try {
        // Mark that we're opening a modal
        modalOpeningRef.current = true
        modalJustOpenedRef.current = true
        // Set URL first
        setInvoiceUrl(url)
        // Open modal immediately
        dispatch(openModal('viewInvoiceModal'))
        // Prevent closing for 500ms after opening
        setTimeout(() => {
          modalJustOpenedRef.current = false
        }, 500)
        // Reset flag after modal should be open
        setTimeout(() => {
          modalOpeningRef.current = false
        }, 1000)
      } catch (error) {
        console.error('Error opening invoice modal:', error)
        toast.error('Failed to open invoice. Please try again.', toastconfig)
        modalOpeningRef.current = false
        modalJustOpenedRef.current = false
      }
    },
    [dispatch],
  )

  const viewReceipt = useCallback(
    (url) => {
      if (!url) {
        toast.error('Receipt URL not available', toastconfig)
        return
      }
      console.log('Opening receipt modal with URL:', url)
      try {
        // Mark that we're opening a modal
        modalOpeningRef.current = true
        modalJustOpenedRef.current = true
        // Set URL first
        setReceiptUrl(url)
        // Open modal immediately
        dispatch(openModal('viewReceiptModal'))
        // Prevent closing for 500ms after opening
        setTimeout(() => {
          modalJustOpenedRef.current = false
        }, 500)
        // Reset flag after modal should be open
        setTimeout(() => {
          modalOpeningRef.current = false
        }, 1000)
      } catch (error) {
        console.error('Error opening receipt modal:', error)
        toast.error('Failed to open receipt. Please try again.', toastconfig)
        modalOpeningRef.current = false
        modalJustOpenedRef.current = false
      }
    },
    [dispatch],
  )

  const downloadInvoice = (invoiceUrl, fileName) => {
    if (invoiceUrl) {
      const link = document.createElement('a')
      link.href = invoiceUrl
      link.download = fileName || 'invoice.pdf'
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const downloadReceipt = (receiptUrl, fileName) => {
    if (receiptUrl) {
      const link = document.createElement('a')
      link.href = receiptUrl
      link.download = fileName || 'receipt.pdf'
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  // Get filtered payments data based on current filters
  const getFilteredPayments = () => {
    // Use filteredPayments if available (from onRowsChange), which represents the current filtered view
    // If no filters are applied, filteredPayments will be the same as paymentsData
    if (filteredPayments.length > 0) {
      return filteredPayments
    }
    // Fallback: if filters exist but filteredPayments is empty, apply filters manually
    if (currentFilters && Object.keys(currentFilters).length > 0) {
      return filterData(paymentsData || [], currentFilters)
    }
    // No filters applied, return all data
    return paymentsData || []
  }

  // Handle filter changes from FilteredDataGrid
  const handleFilterChange = (filters) => {
    setCurrentFilters(filters)
  }

  // Handle rows change from FilteredDataGrid (gets filtered rows)
  const handleRowsChange = (rows) => {
    setFilteredPayments(rows)
  }

  // Download all invoices as ZIP
  const downloadAllInvoices = async () => {
    const filteredPayments = getFilteredPayments()
    const paymentsWithInvoices = filteredPayments.filter(
      (payment) => payment.invoiceUrl,
    )

    if (paymentsWithInvoices.length === 0) {
      toast.error('No invoices found to download', toastconfig)
      return
    }

    setIsDownloadingInvoices(true)
    try {
      const zip = new JSZip()
      const downloadPromises = paymentsWithInvoices.map(
        async (payment, index) => {
          try {
            const response = await fetch(payment.invoiceUrl)
            if (!response.ok)
              throw new Error(`Failed to fetch invoice ${index + 1}`)
            const blob = await response.blob()
            const fileName = `invoice_${payment.paymentId || payment.id || index}.pdf`
            zip.file(fileName, blob)
          } catch (error) {
            console.error(`Error downloading invoice ${index + 1}:`, error)
          }
        },
      )

      await Promise.all(downloadPromises)

      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const url = window.URL.createObjectURL(zipBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `all_invoices_${dayjs().format('DD-MM-YYYY')}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success(
        `Downloaded ${paymentsWithInvoices.length} invoice(s)`,
        toastconfig,
      )
    } catch (error) {
      console.error('Error creating ZIP:', error)
      toast.error('Failed to download invoices', toastconfig)
    } finally {
      setIsDownloadingInvoices(false)
    }
  }

  // Download all receipts as ZIP
  const downloadAllReceipts = async () => {
    const filteredPayments = getFilteredPayments()
    const paymentsWithReceipts = filteredPayments.filter(
      (payment) => payment.receiptUrl,
    )

    if (paymentsWithReceipts.length === 0) {
      toast.error('No receipts found to download', toastconfig)
      return
    }

    setIsDownloadingReceipts(true)
    try {
      const zip = new JSZip()
      const downloadPromises = paymentsWithReceipts.map(
        async (payment, index) => {
          try {
            const response = await fetch(payment.receiptUrl)
            if (!response.ok)
              throw new Error(`Failed to fetch receipt ${index + 1}`)
            const blob = await response.blob()
            const fileName = `receipt_${payment.paymentId || payment.id || index}.pdf`
            zip.file(fileName, blob)
          } catch (error) {
            console.error(`Error downloading receipt ${index + 1}:`, error)
          }
        },
      )

      await Promise.all(downloadPromises)

      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const url = window.URL.createObjectURL(zipBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `all_receipts_${dayjs().format('DD-MM-YYYY')}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success(
        `Downloaded ${paymentsWithReceipts.length} receipt(s)`,
        toastconfig,
      )
    } catch (error) {
      console.error('Error creating ZIP:', error)
      toast.error('Failed to download receipts', toastconfig)
    } finally {
      setIsDownloadingReceipts(false)
    }
  }

  // Transform payments data for display
  const paymentsData =
    data?.data?.map((payment) => ({
      id: payment.id,
      paymentId: payment.id,
      branch: payment.branch || '',
      department: payment.department || '',
      vendor: payment.vendor || '',
      amount: payment.amount || 0,
      paymentDate: payment.paymentDate,
      invoiceUrl: payment.invoiceUrl,
      receiptUrl: payment.receiptUrl,
    })) || []

  // Initialize filteredPayments when paymentsData is available
  useEffect(() => {
    if (paymentsData && paymentsData.length > 0) {
      // Only set if filteredPayments is empty (initial load)
      setFilteredPayments((prev) => (prev.length === 0 ? paymentsData : prev))
    }
  }, [paymentsData])

  const columns = [
    { field: 'branch', headerName: 'Branch', width: 100 },
    {
      field: 'paymentDate',
      headerName: 'Payment Date',
      width: 130,
      renderCell: ({ row }) =>
        row.paymentDate ? dayjs(row.paymentDate).format('DD-MM-YYYY') : '',
    },
    {
      field: 'department',
      headerName: 'Department',
      width: 150,
    },
    {
      field: 'vendor',
      headerName: 'Vendor',
      width: 200,
    },
    {
      field: 'amount',
      headerName: 'Amount',
      width: 120,
      renderCell: ({ row }) =>
        `₹${parseFloat(row.amount || 0).toLocaleString('en-IN')}`,
    },
    {
      field: 'invoiceReceipt',
      headerName: 'Upload',
      width: 200,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Visibility />}
            onClick={(e) => {
              e.stopPropagation()
              console.log('Invoice button clicked, URL:', row.invoiceUrl)
              viewInvoice(row.invoiceUrl)
            }}
            disabled={!row.invoiceUrl}
            sx={{ textTransform: 'none' }}
          >
            INVOICE
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Visibility />}
            onClick={(e) => {
              e.stopPropagation()
              console.log('Receipt button clicked, URL:', row.receiptUrl)
              viewReceipt(row.receiptUrl)
            }}
            disabled={!row.receiptUrl}
            sx={{ textTransform: 'none' }}
          >
            RECEIPT
          </Button>
        </Stack>
      ),
    },
    {
      field: 'actions',
      headerName: 'Download',
      width: 200,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<FileDownload />}
            onClick={() =>
              downloadInvoice(row.invoiceUrl, `invoice_${row.paymentId}.pdf`)
            }
            disabled={!row.invoiceUrl}
            sx={{ textTransform: 'none' }}
          >
            INVOICE
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<FileDownload />}
            onClick={() =>
              downloadReceipt(row.receiptUrl, `receipt_${row.paymentId}.pdf`)
            }
            disabled={!row.receiptUrl}
            sx={{ textTransform: 'none' }}
          >
            RECEIPT
          </Button>
        </Stack>
      ),
    },
  ]

  const customFilters = [
    {
      field: 'branch',
      label: 'Branch',
      type: 'select',
      options: paymentsData
        ? [...new Set(paymentsData.map((row) => row.branch))]
        : [],
    },
    {
      field: 'department',
      label: 'Department',
      type: 'select',
      options: paymentsData
        ? [...new Set(paymentsData.map((row) => row.department))]
        : [],
    },
  ]

  const getUniqueValues = (field) => {
    if (!paymentsData) return []

    if (field === 'branch') {
      return [...new Set(paymentsData.map((row) => row.branch))]
    }

    if (field === 'department') {
      return [...new Set(paymentsData.map((row) => row.department))]
    }

    return []
  }

  const filterData = (data, filters) => {
    if (!data) return []

    return data.filter((row) => {
      return Object.entries(filters).every(([field, filterValue]) => {
        if (!filterValue || filterValue === null) return true

        const { prefix, value } = filterValue

        if (!value || (Array.isArray(value) && value.length === 0)) return true

        const selectedValues = Array.isArray(value) ? value : [value]

        switch (field) {
          case 'branch': {
            if (prefix === 'IN') {
              return selectedValues.includes(row.branch)
            } else if (prefix === 'NOT IN') {
              return !selectedValues.includes(row.branch)
            }
            return true
          }
          case 'department': {
            if (prefix === 'IN') {
              return selectedValues.includes(row.department)
            } else if (prefix === 'NOT IN') {
              return !selectedValues.includes(row.department)
            }
            return true
          }
          default:
            return true
        }
      })
    })
  }

  // Advanced Summary calculations with useMemo for performance
  const summaryData = useMemo(() => {
    if (!paymentsData || paymentsData.length === 0) {
      return {
        totalPayments: 0,
        totalAmount: 0,
        averageAmount: 0,
        byDepartment: {},
        byBranch: {},
        byVendor: {},
        monthlyTrend: {},
        weeklyTrend: {},
        recentPayments: [],
        topVendors: [],
        departmentPercentages: {},
        branchPercentages: {},
        thisMonthTotal: 0,
        lastMonthTotal: 0,
        monthOverMonthChange: 0,
        thisWeekTotal: 0,
        lastWeekTotal: 0,
        weekOverWeekChange: 0,
      }
    }

    const totalAmount = paymentsData.reduce(
      (sum, payment) => sum + (parseFloat(payment.amount) || 0),
      0,
    )
    const totalPayments = paymentsData.length
    const averageAmount = totalPayments > 0 ? totalAmount / totalPayments : 0

    // By Department
    const byDepartment = paymentsData.reduce((acc, payment) => {
      const dept = payment.department || 'Unknown'
      acc[dept] = (acc[dept] || 0) + (parseFloat(payment.amount) || 0)
      return acc
    }, {})

    // By Branch
    const byBranch = paymentsData.reduce((acc, payment) => {
      const branch = payment.branch || 'Unknown'
      acc[branch] = (acc[branch] || 0) + (parseFloat(payment.amount) || 0)
      return acc
    }, {})

    // By Vendor
    const byVendor = paymentsData.reduce((acc, payment) => {
      const vendor = payment.vendor || 'Unknown'
      acc[vendor] = (acc[vendor] || 0) + (parseFloat(payment.amount) || 0)
      return acc
    }, {})

    // Monthly Trend
    const monthlyTrend = paymentsData.reduce((acc, payment) => {
      if (payment.paymentDate) {
        const month = dayjs(payment.paymentDate).format('MMM YYYY')
        acc[month] = (acc[month] || 0) + (parseFloat(payment.amount) || 0)
      }
      return acc
    }, {})

    // Weekly Trend
    const weeklyTrend = paymentsData.reduce((acc, payment) => {
      if (payment.paymentDate) {
        const week = `Week ${dayjs(payment.paymentDate).week()} - ${dayjs(payment.paymentDate).format('MMM YYYY')}`
        acc[week] = (acc[week] || 0) + (parseFloat(payment.amount) || 0)
      }
      return acc
    }, {})

    // Recent Payments (last 5)
    const recentPayments = [...paymentsData]
      .sort(
        (a, b) =>
          dayjs(b.paymentDate).valueOf() - dayjs(a.paymentDate).valueOf(),
      )
      .slice(0, 5)

    // Top Vendors
    const topVendors = Object.entries(byVendor)
      .map(([vendor, amount]) => ({ vendor, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)

    // Department Percentages
    const departmentPercentages = Object.entries(byDepartment).reduce(
      (acc, [dept, amount]) => {
        acc[dept] = totalAmount > 0 ? (amount / totalAmount) * 100 : 0
        return acc
      },
      {},
    )

    // Branch Percentages
    const branchPercentages = Object.entries(byBranch).reduce(
      (acc, [branch, amount]) => {
        acc[branch] = totalAmount > 0 ? (amount / totalAmount) * 100 : 0
        return acc
      },
      {},
    )

    // This Month vs Last Month
    const now = dayjs()
    const thisMonthStart = now.startOf('month')
    const lastMonthStart = now.subtract(1, 'month').startOf('month')
    const lastMonthEnd = now.subtract(1, 'month').endOf('month')

    const thisMonthTotal = paymentsData
      .filter(
        (p) =>
          p.paymentDate &&
          dayjs(p.paymentDate).isAfter(thisMonthStart.subtract(1, 'day')),
      )
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)

    const lastMonthTotal = paymentsData
      .filter(
        (p) =>
          p.paymentDate &&
          dayjs(p.paymentDate).isBetween(
            lastMonthStart,
            lastMonthEnd,
            null,
            '[]',
          ),
      )
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)

    const monthOverMonthChange =
      lastMonthTotal > 0
        ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
        : 0

    // This Week vs Last Week
    const thisWeekStart = now.startOf('week')
    const lastWeekStart = now.subtract(1, 'week').startOf('week')
    const lastWeekEnd = now.subtract(1, 'week').endOf('week')

    const thisWeekTotal = paymentsData
      .filter(
        (p) =>
          p.paymentDate &&
          dayjs(p.paymentDate).isAfter(thisWeekStart.subtract(1, 'day')),
      )
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)

    const lastWeekTotal = paymentsData
      .filter(
        (p) =>
          p.paymentDate &&
          dayjs(p.paymentDate).isBetween(
            lastWeekStart,
            lastWeekEnd,
            null,
            '[]',
          ),
      )
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)

    const weekOverWeekChange =
      lastWeekTotal > 0
        ? ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100
        : 0

    return {
      totalPayments,
      totalAmount,
      averageAmount,
      byDepartment,
      byBranch,
      byVendor,
      monthlyTrend,
      weeklyTrend,
      recentPayments,
      topVendors,
      departmentPercentages,
      branchPercentages,
      thisMonthTotal,
      lastMonthTotal,
      monthOverMonthChange,
      thisWeekTotal,
      lastWeekTotal,
      weekOverWeekChange,
    }
  }, [paymentsData])

  // Cleanup modals on unmount and ensure no modals are blocking navigation
  useEffect(() => {
    // Don't close invoice/receipt modals - they should stay open when clicked
    // Only cleanup stuck backdrops that aren't associated with open modals

    // Remove any stuck MUI Dialog backdrops
    const removeStuckBackdrops = () => {
      const currentModal = modal?.key
      // Don't cleanup if invoice or receipt modals are open
      if (
        currentModal === 'viewInvoiceModal' ||
        currentModal === 'viewReceiptModal'
      ) {
        return // Don't interfere with invoice/receipt modals
      }

      const backdrops = document.querySelectorAll('[class*="MuiBackdrop-root"]')
      backdrops.forEach((backdrop) => {
        if (!backdrop.closest('[role="dialog"]')) {
          backdrop.remove()
        }
      })
      // Also remove body overflow lock only if no modals are open
      if (!currentModal) {
        document.body.style.overflow = ''
        document.body.style.paddingRight = ''
      }
    }

    // Run cleanup immediately and on interval
    removeStuckBackdrops()
    const interval = setInterval(removeStuckBackdrops, 1000)

    return () => {
      clearInterval(interval)
      // Only close modals on unmount if they're not invoice/receipt modals
      const currentModal = modal?.key
      if (
        currentModal !== 'viewInvoiceModal' &&
        currentModal !== 'viewReceiptModal'
      ) {
        dispatch(closeModal())
        setInvoiceUrl(null)
        setReceiptUrl(null)
      }
      // Final cleanup
      removeStuckBackdrops()
    }
  }, [dispatch]) // Removed modal?.key from dependencies to prevent closing on modal open

  // Additional safety: Close modals if they're blocking navigation clicks
  useEffect(() => {
    const handleNavigationClick = (e) => {
      const target = e.target

      // Don't interfere if clicking on modal or modal-related elements
      const isModalClick =
        target.closest('[role="dialog"]') ||
        target.closest('[class*="MuiDialog"]') ||
        target.closest('[class*="MuiModal"]') ||
        modalOpeningRef.current ||
        modal?.key === 'viewInvoiceModal' ||
        modal?.key === 'viewReceiptModal'

      if (isModalClick) {
        return // Don't interfere with modals
      }

      // If clicking on sidebar or navigation elements, force close modals
      const isNavigationClick =
        target.closest('[class*="sidebar"]') ||
        target.closest('[class*="nav"]') ||
        target.closest('nav') ||
        (target.closest('a[href]') && !target.closest('[role="dialog"]')) ||
        (target.tagName === 'A' && !target.closest('[role="dialog"]'))

      // Only close modals on navigation clicks, but allow invoice/receipt modals to work
      if (
        isNavigationClick &&
        modal?.key &&
        modal?.key !== 'viewInvoiceModal' &&
        modal?.key !== 'viewReceiptModal'
      ) {
        dispatch(closeModal())
        setInvoiceUrl(null)
        setReceiptUrl(null)
        // Remove any stuck backdrops
        const backdrops = document.querySelectorAll(
          '[class*="MuiBackdrop-root"]',
        )
        backdrops.forEach((backdrop) => backdrop.remove())
        document.body.style.overflow = ''
        document.body.style.paddingRight = ''
      }
    }

    document.addEventListener('click', handleNavigationClick, true)
    return () => {
      document.removeEventListener('click', handleNavigationClick, true)
    }
  }, [modal?.key, dispatch])

  // Critical fix: Ensure no elements block navigation - run on every render
  useEffect(() => {
    const removeBlockingElements = () => {
      // Get current modal state from Redux store directly (not from closure)
      const currentModalKey = modal?.key

      // Don't cleanup if invoice or receipt modals are open, or if a modal is currently opening
      if (
        modalOpeningRef.current ||
        currentModalKey === 'viewInvoiceModal' ||
        currentModalKey === 'viewReceiptModal'
      ) {
        // Ensure sidebar is still clickable even with modals open
        const sidebar = document.querySelector(
          'nav, [class*="sidebar"], [class*="SideNav"]',
        )
        if (sidebar) {
          sidebar.style.zIndex = '9999'
          sidebar.style.pointerEvents = 'auto'
          sidebar.style.position = 'relative'
        }
        return // Don't interfere with invoice/receipt modals
      }

      // Remove all MUI backdrops that don't have an open dialog
      const backdrops = document.querySelectorAll(
        '[class*="MuiBackdrop-root"], [class*="MuiModal-backdrop"]',
      )
      backdrops.forEach((backdrop) => {
        const parent = backdrop.parentElement
        const dialog = parent?.querySelector('[role="dialog"]')
        const isDialogOpen =
          dialog &&
          window.getComputedStyle(dialog).display !== 'none' &&
          window.getComputedStyle(dialog).visibility !== 'hidden' &&
          dialog.getAttribute('aria-modal') === 'true'

        // If no open dialog or modal key is null, remove backdrop
        if (!isDialogOpen || !currentModalKey) {
          backdrop.style.display = 'none'
          backdrop.remove()
        }
      })

      // Remove any MUI Modal root containers without open dialogs
      const modalRoots = document.querySelectorAll('[class*="MuiModal-root"]')
      modalRoots.forEach((modalRoot) => {
        const dialog = modalRoot.querySelector('[role="dialog"]')
        const isOpen =
          dialog && window.getComputedStyle(dialog).display !== 'none'
        if (!isOpen && !currentModalKey) {
          modalRoot.remove()
        }
      })

      // Ensure sidebar is always clickable - force z-index
      const sidebar = document.querySelector(
        'nav, [class*="sidebar"], [class*="SideNav"]',
      )
      if (sidebar) {
        sidebar.style.zIndex = '9999'
        sidebar.style.pointerEvents = 'auto'
        sidebar.style.position = 'relative'
      }

      // Ensure body is not locked when no modals are open
      if (!currentModalKey) {
        document.body.style.overflow = ''
        document.body.style.paddingRight = ''
        document.body.classList.remove('MuiModal-open')
        // Remove any data attributes
        document.body.removeAttribute('aria-hidden')
      }
    }

    // Run immediately multiple times to catch everything
    removeBlockingElements()
    const timeout1 = setTimeout(removeBlockingElements, 50)
    const timeout2 = setTimeout(removeBlockingElements, 100)
    const timeout3 = setTimeout(removeBlockingElements, 200)

    // More frequent cleanup - but check modal state each time
    const interval = setInterval(() => {
      // Re-check modal state on each interval
      const currentModal = modal?.key
      if (
        !modalOpeningRef.current &&
        currentModal !== 'viewInvoiceModal' &&
        currentModal !== 'viewReceiptModal'
      ) {
        removeBlockingElements()
      }
    }, 150)

    return () => {
      clearTimeout(timeout1)
      clearTimeout(timeout2)
      clearTimeout(timeout3)
      clearInterval(interval)
      // Don't run cleanup on unmount if invoice/receipt modals are open
      const currentModal = modal?.key
      if (
        currentModal !== 'viewInvoiceModal' &&
        currentModal !== 'viewReceiptModal'
      ) {
        removeBlockingElements()
      }
    }
  }, []) // Removed modal?.key dependency - function will access current state via closure

  return (
    <Box
      sx={{
        p: 3,
        bgcolor: '#f5f7fa',
        minHeight: '100vh',
        position: 'relative',
        zIndex: 0, // Ensure it's below sidebar (z-20)
        pointerEvents: 'auto', // Ensure clicks work
        isolation: 'isolate', // Create new stacking context
      }}
    >
      <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                minHeight: 48,
                fontSize: '0.9375rem',
              },
            }}
          >
            <Tab label="Data" />
            <Tab label="Summary" />
          </Tabs>
        </Box>

        {/* DATA TAB */}
        <TabPanel value={activeTab} index={0}>
          <CardContent sx={{ p: 3 }}>
            {/* Payment Entry Form */}
            <Card
              sx={{
                mb: 3,
                p: 2,
                bgcolor: '#f8f9fa',
                border: '1px solid #e0e0e0',
              }}
            >
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Create Payment
              </Typography>
              <CreatePaymentForm
                paymentForm={paymentForm}
                setPaymentForm={setPaymentForm}
                handleInputChange={handleInputChange}
                handleFileChange={handleFileChange}
                getVendorsByDepartment={getVendorsByDepartment}
                dropdowns={dropdowns}
              />
            </Card>

            {isError && (
              <div className="text-red-500 mb-4">{error.message}</div>
            )}

            {/* Download All Buttons */}
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                mb: 2,
                justifyContent: 'flex-end',
              }}
            >
              <Button
                variant="outlined"
                startIcon={<FileDownload />}
                onClick={downloadAllInvoices}
                disabled={isDownloadingInvoices || isDownloadingReceipts}
                sx={{ textTransform: 'none' }}
              >
                {isDownloadingInvoices ? (
                  <>
                    <CircularProgress size={16} sx={{ mr: 1 }} />
                    Downloading...
                  </>
                ) : (
                  'Download All Invoices'
                )}
              </Button>
              <Button
                variant="outlined"
                startIcon={<FileDownload />}
                onClick={downloadAllReceipts}
                disabled={isDownloadingInvoices || isDownloadingReceipts}
                sx={{ textTransform: 'none' }}
              >
                {isDownloadingReceipts ? (
                  <>
                    <CircularProgress size={16} sx={{ mr: 1 }} />
                    Downloading...
                  </>
                ) : (
                  'Download All Receipts'
                )}
              </Button>
            </Box>

            <div style={{ height: '70vh', width: '100%' }}>
              <FilteredDataGrid
                rows={paymentsData}
                getRowId={(row) => row.id}
                columns={columns}
                className="my-5 mx-2 py-3 bg-white"
                loading={isLoading}
                customFilters={customFilters}
                filterData={filterData}
                getUniqueValues={getUniqueValues}
                reportName="Payments_Report"
                reportType="payments"
                branchName="All_Branches"
                filters={currentFilters}
                onRowsChange={handleRowsChange}
                disableRowSelectionOnClick
                slots={{
                  toolbar: ReportExportToolbar,
                }}
                slotProps={{
                  toolbar: {
                    data: paymentsData,
                    columns,
                    reportName: 'Payments_Report',
                    reportType: 'payments',
                    branchName: 'All_Branches',
                    filters: currentFilters,
                  },
                }}
              />
            </div>
          </CardContent>
        </TabPanel>

        {/* SUMMARY TAB - Enhanced */}
        <TabPanel value={activeTab} index={1}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography
              variant="h5"
              fontWeight={700}
              sx={{ mb: 2.5, color: '#1976d2' }}
            >
              Payment Summary & Analytics
            </Typography>

            {/* KPI Cards Row */}
            <Grid container spacing={2} sx={{ mb: 2.5 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card
                  sx={{
                    p: 2,
                    background:
                      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    height: '100%',
                    boxShadow: 3,
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: -50,
                      right: -50,
                      width: 150,
                      height: 150,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.1)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{ opacity: 0.9, mb: 0.5 }}
                      >
                        Total Payments
                      </Typography>
                      <Typography variant="h4" fontWeight={700}>
                        {summaryData.totalPayments}
                      </Typography>
                    </Box>
                    <Payment sx={{ fontSize: 40, opacity: 0.8 }} />
                  </Box>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card
                  sx={{
                    p: 2,
                    background:
                      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    color: 'white',
                    height: '100%',
                    boxShadow: 3,
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: -50,
                      right: -50,
                      width: 150,
                      height: 150,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.1)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{ opacity: 0.9, mb: 0.5 }}
                      >
                        Total Amount
                      </Typography>
                      <Typography variant="h4" fontWeight={700}>
                        ₹{summaryData.totalAmount.toLocaleString('en-IN')}
                      </Typography>
                    </Box>
                    <AttachMoney sx={{ fontSize: 40, opacity: 0.8 }} />
                  </Box>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card
                  sx={{
                    p: 2,
                    background:
                      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    color: 'white',
                    height: '100%',
                    boxShadow: 3,
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: -50,
                      right: -50,
                      width: 150,
                      height: 150,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.1)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{ opacity: 0.9, mb: 0.5 }}
                      >
                        Average Payment
                      </Typography>
                      <Typography variant="h4" fontWeight={700}>
                        ₹
                        {summaryData.averageAmount.toLocaleString('en-IN', {
                          maximumFractionDigits: 0,
                        })}
                      </Typography>
                    </Box>
                    <Assessment sx={{ fontSize: 40, opacity: 0.8 }} />
                  </Box>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card
                  sx={{
                    p: 2,
                    background:
                      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                    color: 'white',
                    height: '100%',
                    boxShadow: 3,
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: -50,
                      right: -50,
                      width: 150,
                      height: 150,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.1)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{ opacity: 0.9, mb: 0.5 }}
                      >
                        This Month
                      </Typography>
                      <Typography variant="h4" fontWeight={700}>
                        ₹{summaryData.thisMonthTotal.toLocaleString('en-IN')}
                      </Typography>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}
                      >
                        {summaryData.monthOverMonthChange > 0 ? (
                          <TrendingUp sx={{ fontSize: 16, mr: 0.5 }} />
                        ) : summaryData.monthOverMonthChange < 0 ? (
                          <TrendingDown sx={{ fontSize: 16, mr: 0.5 }} />
                        ) : (
                          <Remove sx={{ fontSize: 16, mr: 0.5 }} />
                        )}
                        <Typography variant="caption" sx={{ opacity: 0.9 }}>
                          {Math.abs(summaryData.monthOverMonthChange).toFixed(
                            1,
                          )}
                          %
                        </Typography>
                      </Box>
                    </Box>
                    <CalendarToday sx={{ fontSize: 40, opacity: 0.8 }} />
                  </Box>
                </Card>
              </Grid>
            </Grid>

            {/* Charts Row */}
            <Grid container spacing={2} sx={{ mb: 2.5 }}>
              {/* Department Distribution Pie Chart */}
              <Grid item xs={12} md={6}>
                <Card sx={{ p: 2, height: '100%', boxShadow: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Category sx={{ mr: 1, color: '#667eea' }} />
                    <Typography variant="h6" fontWeight={600}>
                      Distribution by Department
                    </Typography>
                  </Box>
                  {Object.keys(summaryData.byDepartment).length > 0 ? (
                    <Box sx={{ height: 300 }}>
                      <Pie
                        data={{
                          labels: Object.keys(summaryData.byDepartment),
                          datasets: [
                            {
                              data: Object.values(summaryData.byDepartment),
                              backgroundColor: [
                                '#667eea',
                                '#f093fb',
                                '#4facfe',
                                '#43e97b',
                                '#fa709a',
                                '#fee140',
                                '#30cfd0',
                                '#a8edea',
                                '#fed6e3',
                                '#ffecd2',
                              ],
                              borderWidth: 2,
                              borderColor: '#fff',
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom',
                              labels: {
                                padding: 15,
                                usePointStyle: true,
                              },
                            },
                            tooltip: {
                              callbacks: {
                                label: (context) => {
                                  const label = context.label || ''
                                  const value = context.parsed || 0
                                  const total = context.dataset.data.reduce(
                                    (a, b) => a + b,
                                    0,
                                  )
                                  const percentage = (
                                    (value / total) *
                                    100
                                  ).toFixed(1)
                                  return `${label}: ₹${value.toLocaleString('en-IN')} (${percentage}%)`
                                },
                              },
                            },
                          },
                        }}
                      />
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        height: 300,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography color="text.secondary">
                        No department data available
                      </Typography>
                    </Box>
                  )}
                </Card>
              </Grid>

              {/* Branch Distribution Pie Chart */}
              <Grid item xs={12} md={6}>
                <Card sx={{ p: 2, height: '100%', boxShadow: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Store sx={{ mr: 1, color: '#f5576c' }} />
                    <Typography variant="h6" fontWeight={600}>
                      Distribution by Branch
                    </Typography>
                  </Box>
                  {Object.keys(summaryData.byBranch).length > 0 ? (
                    <Box sx={{ height: 300 }}>
                      <Pie
                        data={{
                          labels: Object.keys(summaryData.byBranch),
                          datasets: [
                            {
                              data: Object.values(summaryData.byBranch),
                              backgroundColor: [
                                '#f5576c',
                                '#4facfe',
                                '#43e97b',
                                '#fa709a',
                                '#fee140',
                                '#30cfd0',
                                '#667eea',
                                '#f093fb',
                              ],
                              borderWidth: 2,
                              borderColor: '#fff',
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom',
                              labels: {
                                padding: 15,
                                usePointStyle: true,
                              },
                            },
                            tooltip: {
                              callbacks: {
                                label: (context) => {
                                  const label = context.label || ''
                                  const value = context.parsed || 0
                                  const total = context.dataset.data.reduce(
                                    (a, b) => a + b,
                                    0,
                                  )
                                  const percentage = (
                                    (value / total) *
                                    100
                                  ).toFixed(1)
                                  return `${label}: ₹${value.toLocaleString('en-IN')} (${percentage}%)`
                                },
                              },
                            },
                          },
                        }}
                      />
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        height: 300,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography color="text.secondary">
                        No branch data available
                      </Typography>
                    </Box>
                  )}
                </Card>
              </Grid>
            </Grid>

            {/* Monthly Trend and Top Vendors */}
            <Grid container spacing={2} sx={{ mb: 2.5 }}>
              {/* Monthly Trend Chart */}
              <Grid item xs={12} md={8}>
                <Card sx={{ p: 2, height: '100%', boxShadow: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TrendingUp sx={{ mr: 1, color: '#4facfe' }} />
                    <Typography variant="h6" fontWeight={600}>
                      Monthly Payment Trend
                    </Typography>
                  </Box>
                  {Object.keys(summaryData.monthlyTrend).length > 0 ? (
                    <Box sx={{ height: 300 }}>
                      <Bar
                        data={{
                          labels: Object.keys(summaryData.monthlyTrend).sort(
                            (a, b) =>
                              dayjs(a, 'MMM YYYY').valueOf() -
                              dayjs(b, 'MMM YYYY').valueOf(),
                          ),
                          datasets: [
                            {
                              label: 'Payment Amount (₹)',
                              data: Object.keys(summaryData.monthlyTrend)
                                .sort(
                                  (a, b) =>
                                    dayjs(a, 'MMM YYYY').valueOf() -
                                    dayjs(b, 'MMM YYYY').valueOf(),
                                )
                                .map((key) => summaryData.monthlyTrend[key]),
                              backgroundColor: 'rgba(79, 172, 254, 0.8)',
                              borderColor: 'rgba(79, 172, 254, 1)',
                              borderWidth: 2,
                              borderRadius: 8,
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              display: false,
                            },
                            tooltip: {
                              callbacks: {
                                label: (context) =>
                                  `₹${context.parsed.y.toLocaleString('en-IN')}`,
                              },
                            },
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              ticks: {
                                callback: (value) =>
                                  `₹${value.toLocaleString('en-IN')}`,
                              },
                            },
                          },
                        }}
                      />
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        height: 300,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography color="text.secondary">
                        No trend data available
                      </Typography>
                    </Box>
                  )}
                </Card>
              </Grid>

              {/* Top Vendors */}
              <Grid item xs={12} md={4}>
                <Card sx={{ p: 2, height: '100%', boxShadow: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Business sx={{ mr: 1, color: '#43e97b' }} />
                    <Typography variant="h6" fontWeight={600}>
                      Top Vendors
                    </Typography>
                  </Box>
                  {summaryData.topVendors.length > 0 ? (
                    <Stack spacing={1.5}>
                      {summaryData.topVendors.map((item, index) => (
                        <Box key={item.vendor}>
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              mb: 0.5,
                            }}
                          >
                            <Typography
                              variant="body2"
                              fontWeight={500}
                              sx={{
                                flex: 1,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {index + 1}. {item.vendor}
                            </Typography>
                            <Chip
                              label={`₹${item.amount.toLocaleString('en-IN')}`}
                              size="small"
                              sx={{
                                bgcolor:
                                  index === 0
                                    ? '#43e97b'
                                    : index === 1
                                      ? '#4facfe'
                                      : index === 2
                                        ? '#f5576c'
                                        : '#667eea',
                                color: 'white',
                                fontWeight: 600,
                              }}
                            />
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={
                              (item.amount / summaryData.topVendors[0].amount) *
                              100
                            }
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              bgcolor: 'grey.200',
                              '& .MuiLinearProgress-bar': {
                                bgcolor:
                                  index === 0
                                    ? '#43e97b'
                                    : index === 1
                                      ? '#4facfe'
                                      : index === 2
                                        ? '#f5576c'
                                        : '#667eea',
                              },
                            }}
                          />
                        </Box>
                      ))}
                    </Stack>
                  ) : (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: 200,
                      }}
                    >
                      <Typography color="text.secondary">
                        No vendor data available
                      </Typography>
                    </Box>
                  )}
                </Card>
              </Grid>
            </Grid>

            {/* Department & Branch Breakdown with Progress Bars */}
            <Grid container spacing={2} sx={{ mb: 2.5 }}>
              {/* Department Breakdown */}
              <Grid item xs={12} md={6}>
                <Card sx={{ p: 2, height: '100%', boxShadow: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Category sx={{ mr: 1, color: '#667eea' }} />
                    <Typography variant="h6" fontWeight={600}>
                      Department Breakdown
                    </Typography>
                  </Box>
                  {Object.keys(summaryData.byDepartment).length > 0 ? (
                    <Stack spacing={2}>
                      {Object.entries(summaryData.byDepartment)
                        .sort(([, a], [, b]) => b - a)
                        .map(([dept, amount]) => (
                          <Box key={dept}>
                            <Box
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mb: 0.5,
                              }}
                            >
                              <Typography variant="body2" fontWeight={500}>
                                {dept}
                              </Typography>
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  fontWeight={600}
                                  color="primary"
                                >
                                  ₹{amount.toLocaleString('en-IN')}
                                </Typography>
                                <Chip
                                  label={`${summaryData.departmentPercentages[dept]?.toFixed(1) || 0}%`}
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                />
                              </Box>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={
                                summaryData.departmentPercentages[dept] || 0
                              }
                              sx={{
                                height: 8,
                                borderRadius: 4,
                                bgcolor: 'grey.200',
                              }}
                            />
                          </Box>
                        ))}
                    </Stack>
                  ) : (
                    <Typography
                      color="text.secondary"
                      sx={{ textAlign: 'center', py: 4 }}
                    >
                      No department data available
                    </Typography>
                  )}
                </Card>
              </Grid>

              {/* Branch Breakdown */}
              <Grid item xs={12} md={6}>
                <Card sx={{ p: 2, height: '100%', boxShadow: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Store sx={{ mr: 1, color: '#f5576c' }} />
                    <Typography variant="h6" fontWeight={600}>
                      Branch Breakdown
                    </Typography>
                  </Box>
                  {Object.keys(summaryData.byBranch).length > 0 ? (
                    <Stack spacing={2}>
                      {Object.entries(summaryData.byBranch)
                        .sort(([, a], [, b]) => b - a)
                        .map(([branch, amount]) => (
                          <Box key={branch}>
                            <Box
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mb: 0.5,
                              }}
                            >
                              <Typography variant="body2" fontWeight={500}>
                                {branch}
                              </Typography>
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  fontWeight={600}
                                  color="secondary"
                                >
                                  ₹{amount.toLocaleString('en-IN')}
                                </Typography>
                                <Chip
                                  label={`${summaryData.branchPercentages[branch]?.toFixed(1) || 0}%`}
                                  size="small"
                                  color="secondary"
                                  variant="outlined"
                                />
                              </Box>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={summaryData.branchPercentages[branch] || 0}
                              sx={{
                                height: 8,
                                borderRadius: 4,
                                bgcolor: 'grey.200',
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: 'secondary.main',
                                },
                              }}
                            />
                          </Box>
                        ))}
                    </Stack>
                  ) : (
                    <Typography
                      color="text.secondary"
                      sx={{ textAlign: 'center', py: 4 }}
                    >
                      No branch data available
                    </Typography>
                  )}
                </Card>
              </Grid>
            </Grid>

            {/* Recent Payments */}
            {summaryData.recentPayments.length > 0 && (
              <Card sx={{ p: 2, boxShadow: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Payment sx={{ mr: 1, color: '#667eea' }} />
                  <Typography variant="h6" fontWeight={600}>
                    Recent Payments
                  </Typography>
                </Box>
                <Box sx={{ overflowX: 'auto' }}>
                  <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                    <Box
                      component="table"
                      sx={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        '& th': {
                          padding: '12px',
                          textAlign: 'left',
                          fontWeight: 600,
                          color: '#666',
                          borderBottom: '2px solid #e0e0e0',
                          bgcolor: '#f8f9fa',
                        },
                        '& td': {
                          padding: '12px',
                          borderBottom: '1px solid #f0f0f0',
                        },
                        '& tr:hover': {
                          bgcolor: '#f5f5f5',
                        },
                      }}
                    >
                      <Box component="thead">
                        <Box component="tr">
                          <Box component="th">Date</Box>
                          <Box component="th">Department</Box>
                          <Box component="th">Vendor</Box>
                          <Box component="th">Branch</Box>
                          <Box component="th" sx={{ textAlign: 'right' }}>
                            Amount
                          </Box>
                        </Box>
                      </Box>
                      <Box component="tbody">
                        {summaryData.recentPayments.map((payment, index) => (
                          <Box
                            component="tr"
                            key={payment.id || index}
                            sx={{
                              '&:hover': {
                                bgcolor: '#f5f5f5',
                              },
                            }}
                          >
                            <Box component="td">
                              {payment.paymentDate
                                ? dayjs(payment.paymentDate).format(
                                    'DD MMM YYYY',
                                  )
                                : '-'}
                            </Box>
                            <Box component="td">
                              {payment.department || '-'}
                            </Box>
                            <Box component="td">{payment.vendor || '-'}</Box>
                            <Box component="td">
                              <Chip
                                label={payment.branch || '-'}
                                size="small"
                                variant="outlined"
                              />
                            </Box>
                            <Box
                              component="td"
                              sx={{
                                textAlign: 'right',
                                fontWeight: 600,
                                color: '#1976d2',
                              }}
                            >
                              ₹
                              {parseFloat(payment.amount || 0).toLocaleString(
                                'en-IN',
                              )}
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  </Paper>
                </Box>
              </Card>
            )}
          </CardContent>
        </TabPanel>
      </Card>

      {/* View Invoice Modal */}
      <Modal
        maxWidth="lg"
        uniqueKey="viewInvoiceModal"
        closeOnOutsideClick={true}
        onOutsideClick={() => {
          // Don't close if modal just opened
          if (modalJustOpenedRef.current) {
            return
          }
          setInvoiceUrl(null)
          dispatch(closeModal())
        }}
      >
        <Box
          sx={{
            width: '100%',
            height: '85vh',
            display: 'flex',
            flexDirection: 'column',
            p: 0,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 2,
              borderBottom: '1px solid #e0e0e0',
            }}
          >
            <Typography variant="h6">Invoice Preview</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  if (invoiceUrl) {
                    window.open(invoiceUrl, '_blank')
                  }
                }}
              >
                Open in New Tab
              </Button>
              <IconButton
                onClick={() => {
                  setInvoiceUrl(null)
                  dispatch(closeModal())
                }}
              >
                <Close />
              </IconButton>
            </Box>
          </Box>
          <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            {invoiceUrl ? (
              <iframe
                src={invoiceUrl}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                }}
                title="Invoice Preview"
              />
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%',
                }}
              >
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Loading invoice...</Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Modal>

      {/* View Receipt Modal */}
      <Modal
        maxWidth="lg"
        uniqueKey="viewReceiptModal"
        closeOnOutsideClick={true}
        onOutsideClick={() => {
          // Don't close if modal just opened
          if (modalJustOpenedRef.current) {
            return
          }
          setReceiptUrl(null)
          dispatch(closeModal())
        }}
      >
        <Box
          sx={{
            width: '100%',
            height: '85vh',
            display: 'flex',
            flexDirection: 'column',
            p: 0,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 2,
              borderBottom: '1px solid #e0e0e0',
            }}
          >
            <Typography variant="h6">Receipt Preview</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  if (receiptUrl) {
                    window.open(receiptUrl, '_blank')
                  }
                }}
              >
                Open in New Tab
              </Button>
              <IconButton
                onClick={() => {
                  setReceiptUrl(null)
                  dispatch(closeModal())
                }}
              >
                <Close />
              </IconButton>
            </Box>
          </Box>
          <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            {receiptUrl ? (
              <iframe
                src={receiptUrl}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                }}
                title="Receipt Preview"
              />
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%',
                }}
              >
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Loading receipt...</Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Modal>

      {/* Create Order Modal - Reuse from orders page */}
      <CreateOrderModalWrapper />
    </Box>
  )
}

// Create Order Modal Wrapper Component
const CreateOrderModalWrapper = () => {
  const dispatch = useDispatch()
  const modal = useSelector((store) => store.modal)
  const userDetails = useSelector((store) => store.user)
  const dropdowns = useSelector((store) => store.dropdowns)
  const queryClient = useQueryClient()

  const [orderForm, setOrderForm] = useState({
    branchId: 1,
    orderDate: dayjs().format('YYYY-MM-DD'),
    departmentId: '',
    vendorId: '',
  })

  const { data: getVendorsByDepartment } = useQuery({
    queryKey: ['getVendorsByDepartment', orderForm?.departmentId],
    queryFn: () =>
      getAllVendorsByDepartmentId(
        userDetails?.accessToken,
        orderForm?.departmentId,
      ),
    enabled: !!orderForm?.departmentId,
  })

  const createOrderMutation = useMutation({
    mutationFn: async (newOrder) => {
      const res = await createNewOrder(userDetails?.accessToken, newOrder)
      return res
    },
    onSuccess: (res) => {
      if (res?.status === 200) {
        toast.success(res?.message || 'Order created successfully', toastconfig)
        setOrderForm({
          branchId: 1,
          orderDate: dayjs().format('YYYY-MM-DD'),
          departmentId: '',
          vendorId: '',
        })
        dispatch(closeModal())
        queryClient.invalidateQueries(['allOrders'])
      } else {
        toast.error(res?.message || 'Failed to create order', toastconfig)
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create order', toastconfig)
    },
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setOrderForm((prev) => ({ ...prev, [name]: value }))
    if (name === 'departmentId') {
      setOrderForm((prev) => ({ ...prev, vendorId: '' }))
    }
  }

  const handleCreateOrder = () => {
    createOrderMutation.mutate(orderForm)
  }

  if (modal.key !== 'createNewOrder') return null

  return (
    <Modal
      uniqueKey="createNewOrder"
      maxWidth={'sm'}
      closeOnOutsideClick={true}
    >
      <div className="p-5 space-y-4 w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Create New Order</h2>
          <IconButton onClick={() => dispatch(closeModal())}>
            <Close />
          </IconButton>
        </div>

        <TextField
          select
          fullWidth
          label="Branch"
          name="branchId"
          value={orderForm.branchId}
          onChange={handleInputChange}
        >
          {dropdowns?.branches?.map((branch) => (
            <MenuItem key={branch.id} value={branch.id}>
              {branch.name}
            </MenuItem>
          ))}
        </TextField>

        <DatePicker
          className="w-full"
          label="Order Date"
          value={dayjs(orderForm.orderDate)}
          onChange={(newDate) =>
            setOrderForm((prev) => ({
              ...prev,
              orderDate: dayjs(newDate).format('YYYY-MM-DD'),
            }))
          }
          format="DD-MM-YYYY"
          renderInput={(params) => <TextField {...params} fullWidth />}
        />

        <Autocomplete
          fullWidth
          options={(dropdowns?.departmentList || [])
            .slice()
            .sort((a, b) => a.name?.localeCompare(b.name))}
          getOptionLabel={(option) => option.name || ''}
          value={
            (dropdowns?.departmentList || []).find(
              (dept) => dept.id === orderForm.departmentId,
            ) || null
          }
          onChange={(event, newValue) => {
            setOrderForm((prev) => ({
              ...prev,
              departmentId: newValue?.id || '',
              vendorId: '',
            }))
          }}
          renderInput={(params) => (
            <TextField {...params} label="Department" variant="outlined" />
          )}
        />

        <Autocomplete
          fullWidth
          options={(
            (getVendorsByDepartment ? getVendorsByDepartment?.data : []) || []
          )
            .slice()
            .sort((a, b) => a.name?.localeCompare(b.name))}
          getOptionLabel={(option) => option.name || ''}
          value={
            (
              (getVendorsByDepartment ? getVendorsByDepartment?.data : []) || []
            ).find((vendor) => vendor.id === orderForm.vendorId) || null
          }
          onChange={(event, newValue) => {
            setOrderForm((prev) => ({
              ...prev,
              vendorId: newValue?.id || '',
            }))
          }}
          renderInput={(params) => (
            <TextField {...params} label="Vendor" variant="outlined" />
          )}
          disabled={!orderForm.departmentId}
        />

        <div className="flex justify-end space-x-2 mt-4">
          <Button
            onClick={() => dispatch(closeModal())}
            variant="contained"
            color="error"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            className="capitalize text-white"
            color="primary"
            onClick={handleCreateOrder}
            disabled={createOrderMutation.isLoading}
          >
            {createOrderMutation.isLoading ? (
              <CircularProgress size={24} />
            ) : (
              'Create Order'
            )}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// Create Payment Form Component
const CreatePaymentForm = ({
  paymentForm,
  setPaymentForm,
  handleInputChange,
  handleFileChange,
  getVendorsByDepartment,
  dropdowns,
}) => {
  const userDetails = useSelector((store) => store.user)
  const queryClient = useQueryClient()

  const createPaymentMutation = useMutation({
    mutationFn: async (newPayment) => {
      const formData = new FormData()
      formData.append('branchId', newPayment.branchId)
      formData.append('paymentDate', newPayment.paymentDate)
      formData.append('departmentId', newPayment.departmentId)
      formData.append('vendorId', newPayment.vendorId)
      formData.append('amount', newPayment.amount)

      if (newPayment.invoiceFile) {
        formData.append('invoiceFile', newPayment.invoiceFile)
      }
      if (newPayment.receiptFile) {
        formData.append('receiptFile', newPayment.receiptFile)
      }

      return await createPayment(userDetails?.accessToken, formData)
    },
    onSuccess: (res) => {
      if (res?.status === 201) {
        toast.success(
          res?.message || 'Payment created successfully',
          toastconfig,
        )
        setPaymentForm({
          branchId: 1,
          departmentId: '',
          vendorId: '',
          amount: '',
          paymentDate: dayjs().format('YYYY-MM-DD'),
          invoiceFile: null,
          receiptFile: null,
        })
        queryClient.invalidateQueries(['allPayments'])
      } else {
        toast.error(res?.message || 'Failed to create payment', toastconfig)
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create payment', toastconfig)
    },
  })

  const handleSubmit = () => {
    if (
      !paymentForm.departmentId ||
      !paymentForm.vendorId ||
      !paymentForm.amount
    ) {
      toast.error('Please fill all required fields', toastconfig)
      return
    }

    createPaymentMutation.mutate(paymentForm)
  }

  return (
    <Box>
      {/* Row 1 - All fields in single line */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          mb: 2,
          alignItems: 'flex-start',
          flexWrap: { xs: 'wrap', md: 'nowrap' },
        }}
      >
        <TextField
          select
          label="Branch"
          name="branchId"
          value={paymentForm.branchId}
          onChange={handleInputChange}
          size="small"
          sx={{ flex: '0 0 7.5%', minWidth: '100px' }}
        >
          {dropdowns?.branches?.map((branch) => (
            <MenuItem key={branch.id} value={branch.id}>
              {branch.name}
            </MenuItem>
          ))}
        </TextField>

        <DatePicker
          label="Payment Date"
          value={dayjs(paymentForm.paymentDate)}
          onChange={(newDate) =>
            setPaymentForm((prev) => ({
              ...prev,
              paymentDate: dayjs(newDate).format('YYYY-MM-DD'),
            }))
          }
          format="DD-MM-YYYY"
          slotProps={{
            textField: {
              size: 'small',
            },
          }}
          sx={{ flex: '0 0 15%', minWidth: '150px' }}
        />

        <Autocomplete
          size="small"
          options={(dropdowns?.departmentList || [])
            .slice()
            .sort((a, b) => a.name?.localeCompare(b.name))}
          getOptionLabel={(option) => option.name || ''}
          value={
            (dropdowns?.departmentList || []).find(
              (dept) => dept.id === paymentForm.departmentId,
            ) || null
          }
          onChange={(event, newValue) => {
            setPaymentForm((prev) => ({
              ...prev,
              departmentId: newValue?.id || '',
              vendorId: '',
            }))
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Department"
              variant="outlined"
              size="small"
            />
          )}
          sx={{ flex: '0 0 20%', minWidth: '120px' }}
        />

        <Autocomplete
          size="small"
          options={(
            (getVendorsByDepartment ? getVendorsByDepartment?.data : []) || []
          )
            .slice()
            .sort((a, b) => a.name?.localeCompare(b.name))}
          getOptionLabel={(option) => option.name || ''}
          value={
            (
              (getVendorsByDepartment ? getVendorsByDepartment?.data : []) || []
            ).find((vendor) => vendor.id === paymentForm.vendorId) || null
          }
          onChange={(event, newValue) => {
            setPaymentForm((prev) => ({
              ...prev,
              vendorId: newValue?.id || '',
            }))
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Vendor"
              variant="outlined"
              size="small"
            />
          )}
          disabled={!paymentForm.departmentId}
          sx={{ flex: '0 0 25%', minWidth: '120px' }}
        />

        <TextField
          type="number"
          label="Amount"
          name="amount"
          value={paymentForm.amount}
          onChange={handleInputChange}
          required
          size="small"
          sx={{ flex: '0 0 15%', minWidth: '120px' }}
        />
      </Box>

      {/* Row 2 */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' },
          gap: 2,
          mb: 2,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
            justifyContent: 'flex-start',
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
            Upload Invoice
          </Typography>
          <input
            type="file"
            id="invoiceFile"
            onChange={(e) => handleFileChange('invoiceFile', e)}
            accept="application/pdf,image/*"
            style={{
              padding: '6px 8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px',
              width: '100%',
              boxSizing: 'border-box',
            }}
          />
          {paymentForm.invoiceFile && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 0.5 }}
            >
              Selected: {paymentForm.invoiceFile.name}
            </Typography>
          )}
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
            justifyContent: 'flex-start',
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
            Upload Payment Receipt
          </Typography>
          <input
            type="file"
            id="receiptFile"
            onChange={(e) => handleFileChange('receiptFile', e)}
            accept="application/pdf,image/*"
            style={{
              padding: '6px 8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px',
              width: '100%',
              boxSizing: 'border-box',
            }}
          />
          {paymentForm.receiptFile && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 0.5 }}
            >
              Selected: {paymentForm.receiptFile.name}
            </Typography>
          )}
        </Box>

        {/* Empty space to maintain grid alignment */}
        <Box />
      </Box>

      {/* Create Button Row */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <Button
          variant="contained"
          className="capitalize text-white"
          color="primary"
          onClick={handleSubmit}
          disabled={createPaymentMutation.isLoading}
          sx={{ minWidth: '150px' }}
        >
          {createPaymentMutation.isLoading ? (
            <CircularProgress size={24} />
          ) : (
            'Submit'
          )}
        </Button>
      </Box>
    </Box>
  )
}

export default PaymentsPage
