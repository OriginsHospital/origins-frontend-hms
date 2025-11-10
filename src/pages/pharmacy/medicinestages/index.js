import React, { useEffect, useRef, useState, useCallback } from 'react'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import { hideLoader, showLoader } from '@/redux/loaderSlice'
import { openModal, closeModal } from '@/redux/modalSlice'
import Modal from '@/components/Modal'
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Button,
  TableHead,
  TableContainer,
  Avatar,
  Typography,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Autocomplete,
  Divider,
  IconButton,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import dayjs from 'dayjs'
import { useDispatch, useSelector } from 'react-redux'
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query'
import {
  Generate_Invoice,
  getCoupons,
  getOrderId,
  getPharmacyDetailsByDate,
  savePaymentBreakup,
  savePharmacyItems,
  sendTransactionId,
  getAvailableGrnInfoByItemId,
} from '@/constants/apis'
import { toast, Bounce } from 'react-toastify'
import {
  Close,
  Info,
  PrintRounded,
  Add,
  Delete,
  DeleteOutline,
  Edit,
} from '@mui/icons-material'
import { withPermission } from '@/components/withPermission'
import { ACCESS_TYPES } from '@/constants/constants'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import { useRouter } from 'next/router'
const columns = [
  { label: 'PRESCRIBED' },
  { label: 'PACKED' },
  { label: 'PAID' },
]
const toastconfig = {
  position: 'top-right',
  autoClose: 800,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: 'light',
  transition: Bounce,
}
function RenderAccordianDetails({
  itemDetails,
  column,
  type,
  hdrKey,
  header,
  selectedbranch,
}) {
  const user = useSelector(store => store.user)
  const [details, setDetails] = useState([])
  const [disabled, setDisabled] = useState(true)
  const queryClient = useQueryClient()
  const [saveEnabled, setSaveEnabled] = useState(false)
  const dispatch = useDispatch()
  const [grnRows, setGrnRows] = useState({})

  const addGrnRow = medicineId => {
    console.log(grnRows)
    setGrnRows(prev => ({
      ...prev,
      [medicineId]: [
        ...(prev[medicineId] || []),
        { grn: null, usedQuantity: 0 },
      ],
    }))
  }

  const handleGrnRowChange = (medicineId, index, field, value) => {
    setGrnRows(prev => ({
      ...prev,
      [medicineId]: prev[medicineId].map((row, i) =>
        i === index
          ? {
              ...row,
              [field]: value,
              // Calculate finalQuantity when usedQuantity or returnedQuantity changes
              // finalQuantity:
              //   field === 'usedQuantity' || field === 'returnedQuantity'
              //     ? Number(
              //       field === 'usedQuantity' ? value : row.usedQuantity,
              //     ) -
              //     Number(
              //       field === 'returnedQuantity'
              //         ? value
              //         : row.returnedQuantity || 0,
              //     )
              //     : row.finalQuantity,
            }
          : row,
      ),
    }))
  }

  const validateGrnSelections = (medicineId, prescribedQuantity) => {
    const grnInfo = grnRows[medicineId] || []
    const totalPackedQuantity = grnInfo.reduce(
      (sum, row) =>
        sum + Number(row.usedQuantity || 0) - Number(row.returnedQuantity || 0),
      0,
    )
    return totalPackedQuantity <= prescribedQuantity
  }
  const validateAndCallAPI = () => {
    const dbFormat = details.map(itemInfo => {
      if (grnRows[itemInfo.id]) {
        const itemGrnRows = grnRows[itemInfo.id]
        const itemPurchaseInformation = itemGrnRows
          .filter(row => row.grnId && row.usedQuantity > 0)
          .map(row => ({
            grnId: row.grnId.grnId,
            expiryDate: row.grnId.expiryDate,
            mrpPerTablet: row.grnId.mrpPerTablet,
            initialUsedQuantity: Number(row.usedQuantity || 0), // Set initial quantity when moving to packed
            usedQuantity: Number(row.usedQuantity || 0),
            returnedQuantity: 0, // Initialize return quantity as 0
            batchNo: row.grnId.batchNo,
          }))

        return {
          id: itemInfo.id,
          type: type,
          purchaseQuantity: itemGrnRows.reduce(
            (sum, row) => sum + Number(row.usedQuantity || 0),
            0,
          ),
          itemPurchaseInformation,
        }
      }
    })

    // Call API to move to packed
    mutate({
      movetopackedstage: dbFormat,
    })
  }

  const paymentBreakup = useMutation({
    mutationFn: async payload => {
      console.log('generateBreakUp', payload)
      const res = await savePaymentBreakup(user.accessToken, {
        generateBreakUp: payload.generateBreakUp,
      })
      return res.data
    },
    onSuccess: (res, variables) => {
      if (details?.length != 0) {
        let detailsCopy = details
        detailsCopy = detailsCopy.map(medicineDetails => {
          const itemResObject = res.find(
            item => item.itemName == medicineDetails.itemName,
          )
          if (itemResObject) {
            medicineDetails['refId'] = itemResObject?.refId
            medicineDetails['totalCost'] = itemResObject?.totalCost
            medicineDetails['type'] = itemResObject?.type
            medicineDetails['purchaseDetails'] = itemResObject?.purchaseDetails
            medicineDetails[
              'itemPurchaseInformation'
            ] = itemResObject?.purchaseDetails.map(detail => ({
              grnId: detail.grnId,
              expiryDate: detail.expiryDate,
              mrpPerTablet: detail.mrpPerTablet,
              usedQuantity: detail.usedQuantity,
              returnedQuantity: detail.returnedQuantity,
              batchNo: detail.batchNo,
              initialUsedQuantity:
                detail.initialUsedQuantity || detail.usedQuantity,
            }))
          }
          return medicineDetails
        })
        setDetails(detailsCopy)

        // Recalculate prices with the new data
        const newItemPrices = {}
        let newTotalAmount = 0

        detailsCopy.forEach(medicineInfo => {
          const itemPrice = medicineInfo.totalCost || 0
          newItemPrices[medicineInfo.id] = itemPrice
          newTotalAmount += itemPrice
        })

        setPriceDetails({
          itemPrices: newItemPrices,
          totalAmount: newTotalAmount,
        })
      }

      if (variables.clickedFromPacked) {
        setSaveEnabled(false)
        queryClient.invalidateQueries(['pharmacyModuleInfoByDate'])
        toast.success('Data updated successfully', toastconfig)
      }
    },
    onError: (error, variables) => {
      console.log(error)
      toast.error('Data updation failed', toastconfig)
    },
  })
  const validateAndPack = (
    prescribedQuantity,
    availableQuantity,
    medicineId,
  ) => {
    if (prescribedQuantity > availableQuantity) {
      toast.error('please check quantity', toastconfig)
    } else {
      dispatch(openModal(`pack-modal-${medicineId}`))
      // Get GRN info for this item
      getGrnInfo.mutate(medicineId)
    }
  }
  const handlePaymentClicked = modeOfPayment => {
    if (modeOfPayment === 'Online') {
      handlePaymentMethodOnline()
    } else if (modeOfPayment === 'UPI') {
      if (confirm('Are you sure you want to pay UPI?')) {
        handlePaymentMethodOffline('UPI')
      }
    } else {
      if (confirm('Are you sure you want to pay offline?')) {
        handlePaymentMethodOffline('CASH')
      }
    }
  }
  const getPrescribedValue = (appointmentID, stage) => {
    const searchedContent = details?.find(info => info?.id === appointmentID)
    return stage === 'PRESCRIBED'
      ? searchedContent?.prescribedQuantity
      : searchedContent?.purchaseQuantity
  }
  const setQuantity = (appointmentID, value, stage) => {
    const changedValues = details?.map(info => {
      if (info && info?.id == appointmentID) {
        if (stage === 'PRESCRIBED') {
          info.prescribedQuantity = value
        } else {
          setSaveEnabled(true)
          info.purchaseQuantity = value
        }
      }
      return info
    })
    setDetails(changedValues)
  }
  // const calculateAmount = () => {
  //   // console.log('paymentBreakup', details)
  //   let totalAmount = 0
  //   if (details?.length !== 0) {
  //     details.forEach(medicineInfo => {
  //       let itemPurchaseInformation = JSON.parse(medicineInfo?.itemPurchaseInformation)
  //       totalAmount += itemPurchaseInformation?.reduce((sum, row) => {
  //         return sum + ((row.usedQuantity - row.returnedQuantity) * row.mrpPerTablet)
  //       }, 0)
  //     })
  //   }
  //   return totalAmount
  // }
  const { mutate, isPending } = useMutation({
    mutationFn: async payload => {
      const res = await savePharmacyItems(user.accessToken, payload)
      if (res.status === 200) {
        toast.success('Packed successfully', toastconfig)
        console.log(res)
      } else {
        toast.error(res, toastconfig)
      }
      queryClient.invalidateQueries(['pharmacyModuleInfoByDate'])
    },
  })
  const [selectedCoupon, setSelectedCoupon] = useState(null)
  const [discountedAmount, setDiscountedAmount] = useState()

  // Add sample coupons (you can replace with API data)
  // const coupons = [
  //   { id: 1, code: 'PHARMACY50', discount: 50 },
  //   { id: 2, code: 'SAVE20', discount: 20 },
  //   { id: 3, code: 'SPECIAL30', discount: 30 },
  // ]
  const { data: coupons } = useQuery({
    queryKey: ['coupons'],
    queryFn: async () => {
      const res = await getCoupons(user.accessToken)
      return res.data
    },
  })
  // const coupons = useSelector(store => store.coupon)
  // console.log(coupons)
  const calculateDiscountedAmount = coupon => {
    if (!coupon) return calculateAmount()
    const discount = (calculateAmount() * coupon.discountPercentage) / 100
    return calculateAmount() - discount
  }

  // Update useEffect to recalculate discounted amount when coupon changes
  useEffect(() => {
    setDiscountedAmount(calculateDiscountedAmount(selectedCoupon))
  }, [selectedCoupon, details])
  const makePayment = useMutation({
    mutationFn: async payload => {
      const res = await getOrderId(user.accessToken, payload)
      // return res
    },
    onSuccess: response => {
      console.log(response)
    },
  })
  const handleButtonAction = isSaveEnabled => {
    let raiseToast = false
    details.map(medData => {
      if (medData.purchaseQuantity > medData.prescribedQuantity) {
        console.log(medData)

        raiseToast = true
      }
    })

    if (raiseToast) {
      toast.error(
        'Purchased quantity greater than prescribed quantity',
        toastconfig,
      )
    } else {
      if (isSaveEnabled) {
        let data = details
        const dbFormat = []

        data.forEach(itemInfo => {
          // Check if this item has modified GRN rows
          if (grnRows[itemInfo.id]) {
            // This item has been modified - use new GRN data
            const itemGrnRows = grnRows[itemInfo.id]

            // Calculate total quantities
            const totalUsedQuantity = itemGrnRows.reduce(
              (sum, row) =>
                sum + Number(row.initialUsedQuantity || row.usedQuantity || 0),
              0,
            )
            const totalReturnedQuantity = itemGrnRows.reduce(
              (sum, row) => sum + Number(row.returnedQuantity || 0),
              0,
            )
            console.log(
              'totalUsedQuantity & totalReturnedQuantity',
              totalUsedQuantity,
              totalReturnedQuantity,
            )
            const finalQuantity = totalUsedQuantity - totalReturnedQuantity

            // Format GRN information for modified items
            const itemPurchaseInformation = itemGrnRows
              .filter(
                row =>
                  row.grnId &&
                  (row.usedQuantity > 0 || row.returnedQuantity > 0),
              )
              .map(row => ({
                grnId: row.grnId.grnId,
                expiryDate: row.grnId.expiryDate,
                mrpPerTablet: row.grnId.mrpPerTablet,
                usedQuantity: Number(
                  row.initialUsedQuantity - row.returnedQuantity || 0,
                ),
                returnedQuantity: Number(row.returnedQuantity || 0),
                initialUsedQuantity:
                  Number(row.initialUsedQuantity) || Number(row.usedQuantity),
                batchNo: row.grnId.batchNo,
              }))

            dbFormat.push({
              id: itemInfo.id,
              type: type,
              purchaseQuantity: finalQuantity,
              itemPurchaseInformation: itemPurchaseInformation,
            })
          } else {
            // This item was not modified - use existing data
            dbFormat.push({
              id: itemInfo.id,
              type: type,
              purchaseQuantity: itemInfo.purchaseQuantity || 0,
              itemPurchaseInformation: itemInfo.itemPurchaseInformation
                ? typeof itemInfo.itemPurchaseInformation === 'string'
                  ? JSON.parse(itemInfo.itemPurchaseInformation)
                  : itemInfo.itemPurchaseInformation
                : [],
            })
          }
        })

        // Validate the data before sending
        const isValid = dbFormat.every(item => {
          if (!grnRows[item.id]) return true // Skip validation for unmodified items

          const totalPackedQuantity = item.itemPurchaseInformation.reduce(
            (sum, grn) =>
              sum +
              Number(grn.initialUsedQuantity || 0) -
              Number(grn.returnedQuantity || 0),
            0,
          )
          console.log(
            'totalPackedQuantity',
            totalPackedQuantity,
            item.purchaseQuantity,
          )
          return totalPackedQuantity === item.purchaseQuantity
        })

        if (!isValid) {
          toast.error('Please check quantities and return values', toastconfig)
          return
        }

        paymentBreakup.mutate({
          generateBreakUp: dbFormat,
          clickedFromPacked: true,
        })
      } else {
        console.log(hdrKey)
        dispatch(openModal(hdrKey + 'pay' + column.label))
      }
    }
  }
  useEffect(() => {
    if (isPending || paymentBreakup?.isLoading) {
      dispatch(showLoader())
    } else {
      dispatch(hideLoader())
    }
  }, [isPending, itemDetails, paymentBreakup?.isLoading])
  useEffect(() => {
    let data = itemDetails.map(itemInfo => {
      let items = JSON.parse(itemInfo.itemPurchaseInformation)
      console.log(items)
      return {
        ...itemInfo,
        itemPurchaseInformation: items,
        // itemPurchaseInformation: itemInfo.itemPurchaseInformation
        //   ? JSON.parse(itemInfo.itemPurchaseInformation)
        //   : [],
        pack: false,
        saveEnabled: false,
      }
    })

    const dbFormat = data.map(itemInfo => {
      return {
        id: itemInfo.id,
        type: type,
        purchaseQuantity: itemInfo?.purchaseQuantity || 0,
        itemPurchaseInformation: itemInfo.itemPurchaseInformation,
      }
    })

    if (column?.label === 'PACKED') {
      console.log(dbFormat)
      paymentBreakup.mutate({
        generateBreakUp: dbFormat,
        clickedFromPacked: false,
      })
    }

    console.log('data', data)
    setDetails(data)
  }, [])

  // const paymentBreakup = useMutation({
  //   mutationFn: async (payload) => {
  //     const res = await
  //     if (res.status === 200) {
  //       toast.success('Packed successfully', toastconfig)
  //       console.log(res)
  //     } else {
  //       toast.error(res, toastconfig)
  //     }
  //   },
  // })
  const handlePaymentMethodOffline = async (type = 'CASH') => {
    const detailsCopy = details
    //refid, type, itemName, purchaseDetails, totalCost
    let paymentDBFormat = []
    detailsCopy.map(medicineInfo => {
      paymentDBFormat.push({
        refId: medicineInfo.refId,
        type: medicineInfo.type,
        itemName: medicineInfo.itemName,
        purchaseDetails: medicineInfo.purchaseDetails,
        totalCost: medicineInfo.totalCost,
      })
    })
    const totalAmout = detailsCopy.reduce(function(acc, obj) {
      return acc + Number(obj.totalCost)
    }, 0)
    console.log(totalAmout)

    try {
      // const response = await axios.post('/api/payment', {
      //   amount: 1000 * 10000
      // })

      const data = await getOrderId(user.accessToken, {
        totalOrderAmount: totalAmout,
        paidOrderAmount: discountedAmount,
        discountAmount: totalAmout - discountedAmount,
        couponCode: selectedCoupon?.id,
        orderDetails: paymentDBFormat,
        paymentMode: type === 'UPI' ? 'UPI' : 'CASH', // ONLINE OR CASH
        productType: 'PHARMACY', //PHARMACY or LAB or SCAN
      })
      if (data.status == 200) {
        dispatch(closeModal())
        queryClient.invalidateQueries('pharmacyModuleInfoByDate')
      }
    } catch (error) {
      console.log('Error fetching Order ID:', error)
    }
    // setIsLoading(false)
  }
  const handlePaymentMethodOnline = async () => {
    const detailsCopy = details
    //refid, type, itemName, purchaseDetails, totalCost
    let paymentDBFormat = []
    detailsCopy.map(medicineInfo => {
      paymentDBFormat.push({
        refId: medicineInfo.refId,
        type: medicineInfo.type,
        itemName: medicineInfo.itemName,
        purchaseDetails: medicineInfo.purchaseDetails,
        totalCost: medicineInfo.totalCost,
      })
    })
    const totalAmout = detailsCopy.reduce(function(acc, obj) {
      return acc + Number(obj.totalCost)
    }, 0)
    // console.log(totalAmout)
    //check wheather payment is online or cash
    // const breakupResponse = await savePaymentBreakup(user.accessToken, {
    //   "generateBreakUp": [
    //     {
    //       "id": details[0].id,
    //       "type": type,
    //       "purchaseQuantity": details[0].purchaseQuantity
    //     }
    //   ]
    // })
    // console.log(breakupResponse)
    try {
      // const response = await axios.post('/api/payment', {
      //   amount: 1000 * 10000
      // })

      const data = await getOrderId(user.accessToken, {
        totalOrderAmount: Math.round(totalAmout),
        paidOrderAmount: Math.round(discountedAmount),
        discountAmount: Math.round(totalAmout) - Math.round(discountedAmount),
        couponCode: selectedCoupon?.id,
        orderDetails: paymentDBFormat,
        paymentMode: 'ONLINE', // ONLINE OR CASH
        productType: 'PHARMACY', //PHARMACY or LAB or SCAN
      })

      let options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_ID,
        amount: data.data.totalOrderAmount * 100, //{data.amount}
        currency: 'INR',
        name: 'Origins',

        image:
          'https://img.freepik.com/premium-vector/charity-abstract-logo-healthy-lifestyle_660762-34.jpg?size=626&ext=jpg',
        description: 'Test Transaction',
        order_id: data.data.orderId, //{ data.orderId}
        'theme.color': '#FF6C22',
        handler: async response => {
          console.log(response)
          const order_details = {
            orderId: response.razorpay_order_id,
            transactionId: response.razorpay_payment_id,
            // ,
            // transactionType: response.razorpay_signature,
          }
          // handle payment success
          // write a mutate and invalidate the getPharmacyDetails
          const p = await sendTransactionId(user.accessToken, order_details)
          console.log(p)
          if (order_details && order_details.transactionId) {
            dispatch(closeModal())
            queryClient.invalidateQueries('pharmacyModuleInfoByDate')
          }
        },
      }

      const paymentObject = new window.Razorpay(options)
      paymentObject.open()

      paymentObject.on('payment.failed', function(response) {
        console.log(response.error.code)
        console.log(response.error.description)
        console.log(response.error.source)
      })

      paymentObject.on('payment.success', function(response) {
        //queryClient.invalidateQueries(['pharmacyModuleInfoByDate'])
        console.log('on success ', response)
      })
    } catch (error) {
      console.log('Error fetching Order ID:', error)
    }
    // setIsLoading(false)
  }
  const reportRef = useRef(null)
  const generateReport = useMutation({
    mutationFn: async payload => {
      const res = await Generate_Invoice(user.accessToken, payload)
      console.log(res.data)
      reportRef.current.innerHTML = res?.data
      console.log(res.data)
    },
  })

  const handleInvoicePrint = async () => {
    await generateReport.mutate({
      appointmentId: header.appointmentId,
      productType: 'PHARMACY', // same values used in tranasction api
      type: header.type, // Consultation or Treatment
    })
    dispatch(openModal(header?.appointmentId + 'invoice'))
  }

  const Print = async () => {
    const { default: html2pdf } = await import('html2pdf.js')
    if (window && reportRef.current) {
      const element = reportRef.current
      const opt = {
        margin: 10,
        filename: 'report.pdf',
        image: { type: 'png', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      }

      html2pdf()
        .set(opt)
        .from(element)
        .toPdf()
        .get('pdf')
        .then(pdf => {
          pdf.autoPrint()
          window.open(pdf.output('bloburl'), '_blank')
        })
    }
  }
  const getInfo = med => {
    if (med?.prescriptionDetails?.startsWith('OTHER_')) {
      return `Dosage: ${med?.prescriptionDetails.split('_')[1]}, Days - ${
        med?.prescriptionDays
      }`
    }
    return `Quantity: ${med?.prescriptionDetails} , Days - ${med?.prescriptionDays}`
  }

  const getGrnInfo = useMutation({
    mutationFn: async itemId => {
      const res = await getAvailableGrnInfoByItemId(
        user.accessToken,
        itemId,
        type,
        selectedbranch,
      )
      return res
    },
    onSuccess: res => {
      console.log('data', res)
      if (res.status == 200) {
        setAvailableGrns(res.data.availableGrnInfo)
      } else {
        setAvailableGrns([])
        toast.error(res.message)
      }
    },
  })

  const [availableGrns, setAvailableGrns] = useState([])
  const validateQuantities = items => {
    // Check if items array exists and has elements
    if (!items || items.length === 0) return false

    // Check if all items have matching total GRN quantities and prescribed quantities
    const isValid = items.every(item => {
      // Get GRN rows for this specific medicine
      const medicineGrnRows = grnRows[item.id] || []

      // Calculate total quantity from selected GRNs for this medicine
      const totalGrnQuantity = medicineGrnRows?.reduce((sum, row) => {
        return sum + (Number(row.usedQuantity) || 0)
      }, 0)

      // Compare with prescribed quantity
      return totalGrnQuantity === parseFloat(item.prescribedQuantity)
    })

    // Set button disabled state based on validation
    setDisabled(!isValid)
  }
  const handleGrnSelection = medicineId => {
    // Update the details state to include the selected GRNs
    setDetails(prevDetails =>
      prevDetails.map(med => {
        if (med.id === medicineId) {
          return {
            ...med,
            itemPurchaseInformation: grnRows[medicineId]
              .filter(row => row.grnId && row.usedQuantity > 0)
              .map(row => ({
                expiryDate: row.grnId.expiryDate,
                mrpPerTablet: row.grnId.mrpPerTablet,
                grnId: row.grnId.grnId,
                returnedQuantity: 0,
                usedQuantity: Number(row.usedQuantity),
                batchNo: row.grnId.batchNo,
              })),
          }
        }
        return med
      }),
    )

    validateQuantities(details)
    dispatch(closeModal(`pack-modal-${medicineId}`))
  }

  // Function to validate quantities and control button state

  // console.log('grnRows-', grnRows)

  // Add new state for pricing
  const [priceDetails, setPriceDetails] = useState({
    itemPrices: {}, // Store individual item prices
    totalAmount: 0, // Store total amount
  })

  // Create a function to calculate prices
  const calculatePrices = useCallback(() => {
    console.log('details', priceDetails)
    if (!details?.length) {
      setPriceDetails({ itemPrices: {}, totalAmount: 0 })
      return
    }

    const newItemPrices = {}
    let newTotalAmount = 0

    details.forEach(medicineInfo => {
      // If totalCost exists from API response, use it
      if (medicineInfo.totalCost !== undefined) {
        newItemPrices[medicineInfo.id] = medicineInfo.totalCost
        newTotalAmount += medicineInfo.totalCost
      } else {
        // Otherwise calculate from itemPurchaseInformation
        let itemPurchaseInformation = medicineInfo?.itemPurchaseInformation
          ? typeof medicineInfo.itemPurchaseInformation === 'string'
            ? JSON.parse(medicineInfo.itemPurchaseInformation)
            : medicineInfo.itemPurchaseInformation
          : []

        const itemPrice = itemPurchaseInformation.reduce((sum, row) => {
          const mrpPerTablet = Number(row.mrpPerTablet) || 0
          const usedQuantity = Number(
            row.initialUsedQuantity || row.usedQuantity || 0,
          )
          const returnedQuantity = Number(row.returnedQuantity || 0)
          const finalQuantity = usedQuantity - returnedQuantity

          return sum + finalQuantity * mrpPerTablet
        }, 0)

        newItemPrices[medicineInfo.id] = itemPrice
        newTotalAmount += itemPrice
      }
    })

    setPriceDetails({
      itemPrices: newItemPrices,
      totalAmount: newTotalAmount,
    })
  }, [details])

  // Update prices when details change
  useEffect(() => {
    calculatePrices()
  }, [details, calculatePrices])

  // Replace calculateAmount with a simple getter
  const calculateAmount = () => priceDetails.totalAmount

  // Add a function to get individual item price
  const getItemPrice = itemId => priceDetails.itemPrices[itemId] || 0
  const handleEdit = (med, index) => {
    getGrnInfo.mutate(med?.id)
    dispatch(openModal(`pack-modal-${med?.id}`))

    // Parse existing GRN information
    const existingGrns =
      typeof med.itemPurchaseInformation === 'string'
        ? JSON.parse(med.itemPurchaseInformation)
        : med.itemPurchaseInformation
    console.log('existingGrns', existingGrns)
    // Set GRN rows with all three quantities
    setGrnRows(prev => ({
      ...prev,
      [med.id]: existingGrns.map(info => ({
        grnId: {
          grnId: info.grnId,
          expiryDate: info.expiryDate,
          mrpPerTablet: info.mrpPerTablet,
          totalQuantity: info.initialUsedQuantity, // Use initial quantity as total
          batchNo: info.batchNo,
        },
        initialUsedQuantity: info.initialUsedQuantity, // Original packed quantity
        usedQuantity: info.usedQuantity, // Current quantity after returns
        returnedQuantity: info.returnedQuantity || 0,
      })),
    }))
  }
  return (
    <div>
      <Modal
        // uniqueKey={'invoice'}
        key="invoice"
        uniqueKey={header?.appointmentId + 'invoice'}
        maxWidth={'md'}
        closeOnOutsideClick={false}
        onOutsideClick={() => {
          dispatch(closeModal(header?.appointmentId + 'invoice'))
        }}
      >
        <div className="relative flex justify-end">
          <Button
            onClick={() => Print()}
            className="gap-2 flex right-0 capitalize text-white"
            variant="contained"
          >
            <span>Print</span>
            <PrintRounded color="white" />
          </Button>
          <IconButton
            onClick={() =>
              dispatch(closeModal(header?.appointmentId + 'invoice'))
            }
          >
            <Close />
          </IconButton>
        </div>
        <div ref={reportRef} className="transition-all"></div>
      </Modal>
      <TableContainer className="flex-1">
        <Table>
          <TableHead>
            <TableRow className="bg-slate-200 rounder-lg">
              <TableCell
                align="center"
                className="font-bold border-0 rounder-lg"
              >
                Medicine
              </TableCell>
              {column.label === 'PAID' && (
                <>
                  {
                    <TableCell
                      align="center"
                      className="font-bold border-0 rounder-lg"
                    >
                      {'InTake Time'}
                    </TableCell>
                  }
                </>
              )}
              {column.label === 'PRESCRIBED' && (
                <>
                  <TableCell
                    align="center"
                    className="font-bold border-0 rounder-lg"
                  >
                    <Tooltip title={'Available Quantity'} placement="top">
                      Available
                    </Tooltip>
                  </TableCell>
                  <TableCell
                    align="center"
                    className="font-bold border-0 rounder-lg"
                  >
                    <Tooltip title={'Prescribed Quantity'} placement="top">
                      Prescribed
                    </Tooltip>
                  </TableCell>
                  <TableCell
                    align="center"
                    className="font-bold border-0 rounder-lg"
                  >
                    Action
                  </TableCell>
                </>
              )}
              {column.label === 'PACKED' && (
                <>
                  <TableCell
                    align="center"
                    className="font-bold border-0 rounder-lg"
                  >
                    Packed
                  </TableCell>
                  <TableCell
                    align="center"
                    className="font-bold border-0 rounder-lg"
                  >
                    <Tooltip title={'Edit GRNs'} placement="top">
                      GRNs
                    </Tooltip>
                  </TableCell>
                  <TableCell
                    align="center"
                    className="font-bold border-0 rounder-lg"
                  >
                    <Tooltip title={'MRP per unit'} placement="top">
                      Price
                    </Tooltip>
                  </TableCell>
                </>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {/* {console.log(details)} */}
            {details?.map((med, index) => (
              <TableRow key={med?.id + column.label + index + med?.itemName}>
                <TableCell align="center" className="border-0">
                  {med?.itemName}
                </TableCell>
                {column.label === 'PAID' && (
                  <>
                    {
                      <TableCell align="center" className="border-0">
                        {/* {getPrescriptionDetails(med?.prescriptionDetails)} */}
                        <span className="flex gap-2 flex-wrap">
                          {med?.prescriptionDetails
                            ?.split(',')
                            .map((each, index) => (
                              <Chip
                                key={
                                  index + 'chip' + each + med?.id + column.label
                                }
                                // label={each}
                                label={
                                  each.split('_')[0] == 'OTHER'
                                    ? each.split('_')[1]
                                    : each
                                }
                                color="success"
                              />
                            ))}
                        </span>
                      </TableCell>
                    }
                  </>
                )}
                {column.label === 'PRESCRIBED' && (
                  <>
                    <TableCell align="center" className="border-0">
                      {med?.availableQuantity}
                    </TableCell>
                    <TableCell
                      align="center"
                      className="border-0 flex items-center gap-2"
                    >
                      <TextField
                        id="standard-basic"
                        align="center"
                        size="small"
                        value={getPrescribedValue(med?.id, column?.label)}
                        type="number"
                        InputProps={{
                          // startAdornment: <span className="text-gray-500 mr-1">₹</span>,
                          inputProps: {
                            min: 0,
                            max: med?.prescribedQuantity,
                            step: '1',
                          },
                        }}
                        // InputProps={{ inputProps: { min: 1, max: med?.prescribedQuantity } }}
                        error={med?.prescribedQuantity > med?.availableQuantity}
                        onChange={e => {
                          setQuantity(med?.id, e.target.value, column.label)
                        }}
                        disabled={
                          med?.prescribedQuantity < med?.availableQuantity
                        }
                      />
                      {/* info icon */}
                      <Tooltip title={`${getInfo(med)}`} placement="top">
                        <Info className="w-4 h-4" />
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center" className="border-0">
                      <Button
                        variant={!med?.pack ? 'outlined' : 'contained'}
                        className={`h-10  w-24 capitalize`}
                        onClick={() =>
                          validateAndPack(
                            med?.prescribedQuantity,
                            med?.availableQuantity,
                            med?.id,
                            column.label,
                          )
                        }
                        color={
                          grnRows[med.id]?.reduce(
                            (sum, row) => sum + Number(row.usedQuantity || 0),
                            0,
                          ) === Number(med.prescribedQuantity)
                            ? 'success'
                            : 'primary'
                        }
                        size="small"
                      >
                        {grnRows[med.id]?.reduce(
                          (sum, row) => sum + Number(row.usedQuantity || 0),
                          0,
                        ) === Number(med.prescribedQuantity)
                          ? 'Selected'
                          : 'Select GRN'}
                      </Button>
                    </TableCell>
                  </>
                )}
                {column.label === 'PACKED' && (
                  <>
                    <TableCell align="center" className="border-0">
                      {/* {console.log(med)} */}
                      <Typography>
                        {med?.itemPurchaseInformation?.reduce(
                          (sum, detail) => sum + Number(detail.usedQuantity),
                          0,
                        )}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" className="border-0">
                      <IconButton onClick={() => handleEdit(med, index)}>
                        <Edit />
                      </IconButton>
                    </TableCell>
                    <TableCell align="center" className="border-0">
                      {getItemPrice(med?.id).toFixed(2)}
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}
            {column.label == 'PAID' && (
              <Button onClick={handleInvoicePrint}>Print Invoice</Button>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {column.label == 'PRESCRIBED' && (
        <div>
          <Button
            variant="contained"
            className=" float-right"
            onClick={() => {
              validateAndCallAPI()
            }}
            disabled={disabled}
          >
            Move to packed
          </Button>
        </div>
      )}
      {column.label == 'PACKED' && (
        <div className="flex justify-between items-center">
          <span className=" font-medium">Tot. Amount: {calculateAmount()}</span>
          {/* <Button variant="contained" className="self-end h-10 text-white"
            onClick={(e) => handlePayment(e)}
          >
            Pay */}
          <Button
            variant="contained"
            className="self-end h-10 text-white"
            onClick={() => handleButtonAction(saveEnabled)}
          >
            {saveEnabled ? 'Save' : 'Pay'}
          </Button>
        </div>
      )}
      {/* {payClicked && ( */}
      <Modal
        maxWidth={'sm'}
        uniqueKey={header?.appointmentId + 'pay' + column.label}
        closeOnOutsideClick={true}
      >
        <div className="flex justify-between items-center mb-4">
          <Typography variant="h6">Payment Details</Typography>
          <div className="flex gap-2">
            <IconButton
              onClick={() => {
                dispatch(
                  closeModal(header?.appointmentId + 'pay' + column.label),
                )
              }}
            >
              <Close />
            </IconButton>
          </div>
        </div>
        {/* {console.log(details)} */}
        <div className=" flex flex-col gap-3">
          <div className=" flex justify-between">
            <span className=" flex-1 font-medium">{`Item Name`}</span>
            <span className=" flex-1 font-medium">{`Purchase Qn.`}</span>
            <span className=" flex-1 font-medium">{`Total Cost`}</span>
            {/* <span className=" flex-1 font-medium">{`Status`}</span> */}
          </div>
          {details.map((itemInfo, index) => {
            return (
              <div
                className=" flex justify-between"
                key={itemInfo?.itemName + index}
              >
                <span className=" flex-1 font-normal">
                  {itemInfo?.itemName}
                </span>
                <span className=" flex-1 font-normal">
                  {itemInfo?.purchaseQuantity}
                </span>
                <span className=" flex-1 font-medium">
                  {getItemPrice(itemInfo.id).toFixed(2)}
                </span>
                {/* <span className=" flex-1 font-medium">
                  {itemInfo?.status}
                </span> */}
              </div>
            )
          })}
          <div className="mt-4">
            <Autocomplete
              options={coupons}
              getOptionLabel={option =>
                `${option.couponCode} (${option.discountPercentage}% off)`
              }
              value={selectedCoupon}
              onChange={(event, newValue) => {
                setSelectedCoupon(newValue)
              }}
              renderInput={params => (
                <TextField
                  {...params}
                  label="Apply Coupon"
                  variant="outlined"
                  fullWidth
                  size="small"
                />
              )}
            />

            {/* Show discount details when coupon is selected */}
            {selectedCoupon && (
              <div className="mt-4 space-y-2 bg-green-50 p-3 rounded-lg">
                <div className="flex justify-between text-green-600">
                  <span>Discount ({selectedCoupon.discountPercentage}%)</span>
                  <span>
                    -₹{(calculateAmount() - discountedAmount).toFixed(2)}
                  </span>
                </div>
                <Divider />
                <div className="flex justify-between font-bold text-green-700">
                  <span>Final Amount</span>
                  <span>₹{discountedAmount.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2 items-center justify-between pt-5">
            <span className=" font-bold">
              Tot. Amount: ₹{discountedAmount?.toFixed(2)}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outlined"
                className="self-end h-10"
                size="small"
                onClick={() => {
                  handlePaymentClicked('Online')
                }}
              >
                Online
              </Button>
              <Button
                variant="outlined"
                className="self-end h-10"
                size="small"
                onClick={() => {
                  handlePaymentClicked('UPI')
                }}
              >
                UPI
              </Button>
              <Button
                variant="outlined"
                className="self-end h-10"
                size="small"
                onClick={() => {
                  handlePaymentClicked('Cash')
                }}
              >
                Cash
              </Button>
            </div>
          </div>
        </div>
      </Modal>
      {/* )} */}
      {details?.map(med => (
        <Modal
          key={`pack-modal-${med.id}`}
          uniqueKey={`pack-modal-${med.id}`}
          maxWidth="lg"
          onOutsideClick={() => {
            dispatch(closeModal(`pack-modal-${med.id}`))
            // setGrnRows(prev => {
            //   const newState = { ...prev }
            //   delete newState[med.id]
            //   return newState
            // })
          }}
        >
          <div className="flex justify-between items-center mb-4">
            {column.label === 'PRESCRIBED' ? (
              <Typography variant="h6">Select GRNs</Typography>
            ) : (
              <Typography variant="h6">Packed Details</Typography>
            )}
            <IconButton
              onClick={() => {
                dispatch(closeModal(`pack-modal-${med.id}`))
                // setGrnRows(prev => {
                //   const newState = { ...prev }
                //   delete newState[med.id]
                //   return newState
                // })
              }}
            >
              <Close />
            </IconButton>
          </div>

          <div className="p-4">
            {/* Display prescribed and packing quantities */}
            <span className="text-lg font-bold">{med.itemName}</span>
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              {column.label === 'PACKED' ? (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Typography variant="subtitle2" color="textSecondary">
                      Initial Packed
                    </Typography>
                    <Typography variant="h6">
                      {grnRows[med.id]?.reduce(
                        (sum, row) =>
                          sum + Number(row.initialUsedQuantity || 0),
                        0,
                      ) || 0}
                    </Typography>
                  </div>
                  <div>
                    <Typography variant="subtitle2" color="textSecondary">
                      Current Packed
                    </Typography>
                    <Typography variant="h6">
                      {grnRows[med.id]?.reduce(
                        (sum, row) =>
                          sum +
                          Number(
                            row.initialUsedQuantity || row.usedQuantity || 0,
                          ) -
                          Number(row.returnedQuantity || 0),
                        0,
                      ) || 0}
                    </Typography>
                  </div>
                  <div>
                    <Typography variant="subtitle2" color="textSecondary">
                      Returned
                    </Typography>
                    <Typography variant="h6" className="text-orange-500">
                      {grnRows[med.id]?.reduce(
                        (sum, row) => sum + Number(row.returnedQuantity || 0),
                        0,
                      ) || 0}
                    </Typography>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Typography variant="subtitle2" color="textSecondary">
                      Prescribed Qty
                    </Typography>
                    <Typography variant="h6">
                      {med?.prescribedQuantity}
                    </Typography>
                  </div>
                  <div>
                    <Typography variant="subtitle2" color="textSecondary">
                      Remaining to Pack
                    </Typography>
                    <Typography variant="h6" className="text-red-500">
                      {Math.max(
                        0,
                        med?.prescribedQuantity -
                          (grnRows[med.id]?.reduce(
                            (sum, row) =>
                              sum +
                              Number(
                                row.initialUsedQuantity ||
                                  row.usedQuantity ||
                                  0,
                              ) -
                              Number(row.returnedQuantity || 0),
                            0,
                          ) || 0),
                      )}
                    </Typography>
                  </div>
                </div>
              )}
            </div>

            {/* GRN Selection Rows */}
            {(grnRows[med.id] || []).map((row, index) => (
              <div key={index + 'grn' + row.grnId} className="flex gap-4 mb-3">
                {column.label === 'PRESCRIBED' && (
                  <Autocomplete
                    className="flex-1"
                    options={
                      availableGrns
                      //   ?.filter(
                      //   grn =>
                      //     !grnRows[med.id].some(
                      //       (row, i) =>
                      //         i !== index && row.grnId?.grnId === grn.grnId,
                      //     ),
                      // )
                    }
                    value={row.grnId}
                    onChange={(_, newValue) =>
                      handleGrnRowChange(med.id, index, 'grnId', newValue)
                    }
                    getOptionLabel={option => {
                      console.log('option', option)
                      return `Expiry: ${dayjs(option.expiryDate).format(
                        'DD/MM/YYYY',
                      )} | MRP: ${option.mrpPerTablet} | Available: ${
                        option.totalQuantity
                      }| Batch No: ${option.batchNo}
                    `
                    }}
                    renderInput={params => (
                      <TextField {...params} label="Select GRN" size="small" />
                    )}
                  />
                )}
                {column.label === 'PACKED' && (
                  <div className="flex flex-col gap-2 w-full p-2.5 rounded-lg bg-primary/50 border border-primary-200 shadow-sm">
                    {row.grnId ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-secondary">
                        <div>
                          <span className="font-medium">Batch No:</span>{' '}
                          {row.grnId.batchNo}
                        </div>
                        <div>
                          <span className="font-medium">Expiry:</span>{' '}
                          {dayjs(row.grnId.expiryDate).format('DD/MM/YYYY')}
                        </div>
                        <div>
                          <span className="font-medium">MRP:</span> ₹
                          {row.grnId.mrpPerTablet}
                        </div>
                        <div>
                          <span className="font-medium">Available:</span>{' '}
                          {
                            availableGrns.find(
                              grn => grn.grnId === row.grnId.grnId,
                            )?.totalQuantity
                          }
                        </div>
                      </div>
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        Please select a GRN to view details.
                      </Typography>
                    )}
                  </div>
                )}
                <TextField
                  type="number"
                  label="Quantity"
                  size="small"
                  value={row.initialUsedQuantity || row.usedQuantity}
                  onChange={e =>
                    handleGrnRowChange(
                      med.id,
                      index,
                      'usedQuantity',
                      e.target.value,
                    )
                  }
                  disabled={column.label === 'PACKED'}
                  error={
                    row.grnId &&
                    Number(row.usedQuantity) > row.grnId.totalQuantity
                  }
                  helperText={
                    row.grnId &&
                    Number(row.usedQuantity) > row.grnId.totalQuantity
                      ? 'Exceeds available quantity'
                      : ''
                  }
                  sx={{ width: 120 }}
                  InputProps={{
                    inputProps: {
                      min: 0,
                      max: row.grnId ? row.grnId.totalQuantity : 0,
                    },
                  }}
                />

                {/* Show return quantity and final quantity fields only in PACKED stage */}
                {column.label === 'PACKED' && (
                  <>
                    <TextField
                      type="number"
                      label="Return Qty"
                      size="small"
                      value={row.returnedQuantity || 0}
                      onChange={e =>
                        handleGrnRowChange(
                          med.id,
                          index,
                          'returnedQuantity',
                          e.target.value,
                        )
                      }
                      error={
                        row.grnId &&
                        Number(row.returnedQuantity) >
                          Number(row.initialUsedQuantity || row.usedQuantity)
                      }
                      helperText={
                        row.grnId &&
                        Number(row.returnedQuantity) >
                          Number(row.initialUsedQuantity || row.usedQuantity)
                          ? 'Cannot exceed used quantity'
                          : ''
                      }
                      sx={{ width: 120 }}
                      InputProps={{
                        inputProps: {
                          min: 0,
                          max: row.initialUsedQuantity || 0,
                        },
                      }}
                    />
                    <TextField
                      type="number"
                      label="Final Qty"
                      size="small"
                      value={
                        (row.initialUsedQuantity || row.usedQuantity) -
                          (row.returnedQuantity || 0) || 0
                      }
                      disabled
                      sx={{ width: 120 }}
                    />
                  </>
                )}

                <IconButton
                  onClick={() => {
                    setGrnRows(prev => ({
                      ...prev,
                      [med.id]: prev[med.id].filter((_, i) => i !== index),
                    }))
                  }}
                >
                  <DeleteOutline color="error" />
                </IconButton>
              </div>
            ))}

            <div className="flex justify-end mt-4 gap-2">
              {column.label === 'PRESCRIBED' && (
                <>
                  <Button
                    variant="outlined"
                    onClick={() => addGrnRow(med.id)}
                    startIcon={<Add />}
                  >
                    Add GRN
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => {
                      if (
                        validateGrnSelections(med.id, med.prescribedQuantity)
                      ) {
                        handleGrnSelection(med.id)
                      } else {
                        toast.error(
                          'Total quantity exceeds prescribed quantity',
                          toastconfig,
                        )
                      }
                    }}
                    disabled={
                      !grnRows[med.id]?.length ||
                      !validateGrnSelections(med.id, med.prescribedQuantity)
                    }
                  >
                    Confirm
                  </Button>
                </>
              )}
              {column.label === 'PACKED' && (
                <Button
                  variant="contained"
                  className="text-white capitalize "
                  onClick={() => {
                    if (validateGrnSelections(med.id, med.prescribedQuantity)) {
                      handleButtonAction(true)
                    }
                  }}
                  disabled={
                    !grnRows[med.id]?.length ||
                    !validateGrnSelections(med.id, med.prescribedQuantity) ||
                    paymentBreakup.isPending
                  }
                >
                  {paymentBreakup.isPending ? 'Saving...' : 'Save'}
                </Button>
              )}
            </div>
          </div>
        </Modal>
      ))}
    </div>
  )
}
function RenderAccordianComponent({
  patientDetails,
  column,
  expandedId,
  setClickeId,
  selectedbranch,
}) {
  const [activeTab, setActiveTab] = useState('patient')

  const getFilteredItems = (details, isSpouse) => {
    return details
      .map(patient => {
        const key = Object.keys(patient)[0]
        const filteredItems = {
          ...patient,
          [key]: {
            ...patient[key],
            itemDetails: patient[key].itemDetails.filter(item =>
              isSpouse ? item.isSpouse === 1 : item.isSpouse === 0,
            ),
          },
        }
        return filteredItems[key].itemDetails.length > 0 ? filteredItems : null
      })
      .filter(Boolean)
  }

  const patientItems = getFilteredItems(patientDetails, false)
  const spouseItems = getFilteredItems(patientDetails, true)
  useEffect(() => {
    setClickeId(null)
  }, [activeTab])
  return (
    <div className="flex flex-col gap-2">
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <div className="flex gap-2">
          <Button
            // variant={activeTab === 'patient' ? 'contained' : 'outlined'}
            onClick={() => setActiveTab('patient')}
            size="small"
            className={`capitalize ${
              activeTab === 'patient' ? 'bg-white' : 'text-secondary'
            }`}
          >
            Patient ({patientItems.length})
          </Button>
          <Button
            // variant={activeTab === 'spouse' ? 'contained' : 'outlined'}
            onClick={() => setActiveTab('spouse')}
            size="small"
            className={`capitalize ${
              activeTab === 'spouse' ? 'bg-white' : 'text-secondary'
            }`}
          >
            Spouse ({spouseItems.length})
          </Button>
        </div>
      </Box>

      <div className="flex flex-col gap-2">
        {activeTab === 'patient' ? (
          patientItems.length > 0 ? (
            patientItems.map(patient => {
              const key = Object.keys(patient)[0]
              const appointmentID = patient[key].header?.appointmentId
              const photo = patient[key].header?.photoPath

              return (
                <Accordion
                  key={key + column?.label + 'Accordion'}
                  expanded={appointmentID + column?.label === expandedId}
                  onChange={(e, isExpanded) => {
                    setClickeId(
                      isExpanded ? appointmentID + column?.label : null,
                    )
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon className="text-gray-600" />}
                    aria-controls="panel1-content"
                    id="panel1-header"
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex flex-nowrap w-full items-center gap-4 py-2">
                      <div className="relative">
                        <Avatar
                          alt={patient[key].header?.patientName}
                          src={photo}
                          sx={{
                            width: 60,
                            height: 60,
                            border: '2px solid #fff',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          }}
                        />
                      </div>

                      <div className="flex-1 flex flex-col">
                        <div className="flex items-center gap-2">
                          <Typography
                            variant="subtitle1"
                            component="h6"
                            className="font-semibold text-gray-800"
                            sx={{
                              maxWidth: '200px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={patient[key].header?.patientName}
                          >
                            {patient[key].header?.patientName}
                          </Typography>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <PersonOutlineIcon className="w-4 h-4" />
                          <span>{patient[key].header?.doctorName}</span>
                        </div>
                      </div>
                    </div>
                  </AccordionSummary>
                  <AccordionDetails className="flex flex-col gap-3">
                    {patient &&
                      patient[key] &&
                      patient[key].itemDetails.length != 0 &&
                      appointmentID + column?.label === expandedId && (
                        <RenderAccordianDetails
                          type={patient[key].header?.type}
                          itemDetails={patient[key].itemDetails}
                          column={column}
                          hdrKey={patient[key].header?.appointmentId}
                          header={patient[key].header}
                          selectedbranch={selectedbranch}
                        />
                      )}
                  </AccordionDetails>
                </Accordion>
              )
            })
          ) : (
            <span className="text-center text-gray-500">
              No patient items found
            </span>
          )
        ) : spouseItems.length > 0 ? (
          spouseItems.map(patient => {
            const key = Object.keys(patient)[0]
            const appointmentID = patient[key].header?.appointmentId
            const photo = patient[key].header?.photoPath

            return (
              <Accordion
                key={key + column?.label + 'Accordion'}
                expanded={appointmentID + column?.label === expandedId}
                onChange={(e, isExpanded) => {
                  setClickeId(isExpanded ? appointmentID + column?.label : null)
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon className="text-gray-600" />}
                  aria-controls="panel1-content"
                  id="panel1-header"
                  className="hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-nowrap w-full items-center gap-4 py-2">
                    <div className="relative">
                      <Avatar
                        alt={patient[key].header?.patientName}
                        src={photo}
                        sx={{
                          width: 60,
                          height: 60,
                          border: '2px solid #fff',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        }}
                      />
                    </div>

                    <div className="flex-1 flex flex-col">
                      <div className="flex items-center gap-2">
                        <Typography
                          variant="subtitle1"
                          component="h6"
                          className="font-semibold text-gray-800"
                          sx={{
                            maxWidth: '200px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={patient[key].header?.spouseName}
                        >
                          {patient[key].header?.spouseName}
                        </Typography>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <PersonOutlineIcon className="w-4 h-4" />
                        <span>{patient[key].header?.doctorName}</span>
                      </div>
                    </div>
                  </div>
                </AccordionSummary>
                <AccordionDetails className="flex flex-col gap-3">
                  {patient &&
                    patient[key] &&
                    patient[key].itemDetails.length != 0 &&
                    appointmentID + column?.label === expandedId && (
                      <RenderAccordianDetails
                        type={patient[key].header?.type}
                        itemDetails={patient[key].itemDetails}
                        column={column}
                        hdrKey={patient[key].header?.appointmentId}
                        header={patient[key].header}
                        selectedbranch={selectedbranch}
                      />
                    )}
                </AccordionDetails>
              </Accordion>
            )
          })
        ) : (
          <span className="text-center text-gray-500">
            No spouse items found
          </span>
        )}
      </div>
    </div>
  )
}

function Index() {
  const user = useSelector(store => store.user)
  const dropDown = useSelector(store => store.dropdowns)
  const router = useRouter()
  const [date, setDate] = useState()
  const [expandedId, setExpandedId] = useState()
  // const [patientData, setPaientData] = useState([])
  let defaultBranch = user['branchDetails'][0]
  const [selectedbranch, setSelectedBranch] = useState(defaultBranch?.id)
  const dispatch = useDispatch()
  // let obj = []
  let branch = dropDown['branches']
  branch = branch.map(item => {
    return { ...item, label: item.name }
  })

  // Update URL when date or branch changes
  const updateURL = (newDate, newBranch) => {
    const dateString = newDate
      ? newDate.format('YYYY-MM-DD')
      : dayjs().format('YYYY-MM-DD')
    router.push(
      {
        pathname: router.pathname,
        query: {
          date: dateString,
          branch: newBranch,
        },
      },
      undefined,
      { shallow: true },
    )
  }

  function handleDateChange(value) {
    setDate(value)
    updateURL(value, selectedbranch)
    // setPaientData([])
  }

  function handleBranchChange(branchId) {
    setSelectedBranch(branchId)
    updateURL(date, branchId)
  }
  const { data: patientData, isLoading: isValuesLoading } = useQuery({
    queryKey: ['pharmacyModuleInfoByDate', date, selectedbranch],
    enabled: !!date,
    queryFn: async () => {
      const res = await getPharmacyDetailsByDate(
        user?.accessToken,
        `${date.$y}-${date.$M + 1}-${date.$D}`,
        selectedbranch,
      )

      if (res.status !== 200) {
        throw new Error(
          'Error occurred while fetching medicine details for pharmacy',
        )
      }

      const obj = {}
      const fetchedData = res.data

      fetchedData?.forEach(patientHeader => {
        patientHeader?.itemDetails?.forEach(itemDetails => {
          const stage = itemDetails?.itemStage
          const appointmentId = patientHeader?.appointmentId

          if (!obj[stage]) {
            obj[stage] = []
          }

          const existingPatientIndex = obj[stage].findIndex(
            item => item[appointmentId],
          )

          if (existingPatientIndex !== -1) {
            // Add to existing patient's items
            obj[stage][existingPatientIndex][appointmentId].itemDetails.push(
              itemDetails,
            )
          } else {
            // Create new patient entry
            const { itemDetails: _, ...headerInfo } = patientHeader
            obj[stage].push({
              [appointmentId]: {
                header: headerInfo,
                itemDetails: [itemDetails],
              },
            })
          }
        })
      })

      return obj
    },
  })
  //   useEffect(() => {
  //     /*
  //     Inside API call we are Structring object in this format
  //     Const data = {
  //         prescribed:{
  //             [
  //                 patientname1:
  //                 {
  //                    headerdata:{},
  //                    itemDetails:[]
  //                 },
  //                 patientname2:
  //                 {
  //                    headerdata:{},
  //                    itemDetails:[]
  //                 }
  //             ]
  //         }
  //         packed:{
  //             [
  //                 patientname:
  //                 {
  //                    headerdata:{},
  //                    itemDetails:[]
  //                 }
  //             }
  //         }
  //         payment:{
  //             [
  //                 patientname:
  //                 {
  //                    headerdata:{},
  //                    itemDetails:[]
  //                 }
  //             }
  //         }
  //     }
  // */
  //     if (isValuesLoading || patientData?.length != 0) {
  //       dispatch(showLoader())
  //     } else {
  //       dispatch(hideLoader())
  //       setPaientData(patientInformation)
  //     }
  //   }, [patientInformation, date, isValuesLoading, selectedbranch])
  useEffect(() => {
    setExpandedId()
  }, [date, selectedbranch])

  // Handle URL parameters and set initial values
  useEffect(() => {
    const { date: urlDate, branch: urlBranch } = router.query

    if (urlDate && urlBranch) {
      // URL has both parameters, use them
      setDate(dayjs(urlDate))
      setSelectedBranch(urlBranch)
    } else if (defaultBranch?.id) {
      // Set defaults and update URL only if we have branch data
      const today = dayjs(new Date())
      const firstBranch = defaultBranch.id

      setDate(today)
      setSelectedBranch(firstBranch)

      // Update URL with default values
      router.push(
        {
          pathname: router.pathname,
          query: {
            date: today.format('YYYY-MM-DD'),
            branch: firstBranch,
          },
        },
        undefined,
        { shallow: true },
      )
    }
  }, [router.query, defaultBranch?.id])

  // Set initial date if not set from URL
  useEffect(() => {
    if (!router.query.date && !date) {
      setDate(dayjs(new Date()))
    }
  }, [])
  return (
    <div>
      <div className="flex justify-between flex-row p-3">
        <DatePicker
          className="bg-white"
          value={date}
          format="DD/MM/YYYY"
          onChange={handleDateChange}
        />
        <FormControl sx={{ width: '200px' }}>
          <InputLabel id="demo-simple-select-label">Branch</InputLabel>
          <Select
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            value={selectedbranch}
            label="Branch"
            onChange={e => handleBranchChange(e.target.value)}
          >
            {branch.map(branchinfo => {
              return (
                <MenuItem value={branchinfo?.id} key={branchinfo.label}>
                  {branchinfo?.label}
                </MenuItem>
              )
            })}
          </Select>
        </FormControl>
      </div>
      <div className="bg-white rounded-lg border shadow">
        <Box className="flex gap-3 p-3">
          {columns?.map(column => (
            <Box
              className="flex flex-col h-[80vh] rounded transition-colors bg-primary p-2 w-full"
              key={column?.label + 'IndexBox'}
            >
              <Box className="flex items-center justify-center rounded p-3">
                <Typography variant="subtitle1" className="text-lg font-medium">
                  {column?.label.substring(0, 1).toLocaleUpperCase() +
                    column?.label.substring(1).toLocaleLowerCase()}
                </Typography>
              </Box>
              <Stack spacing={2} style={{ overflowY: 'auto', height: '100%' }}>
                {patientData && patientData[(column?.label)] ? (
                  <RenderAccordianComponent
                    key={column?.label + 'indexAccordion'}
                    patientDetails={patientData[(column?.label)]}
                    column={column}
                    expandedId={expandedId}
                    setClickeId={setExpandedId}
                    selectedbranch={selectedbranch}
                  />
                ) : (
                  <div className="w-full h-full flex justify-center items-center">
                    <span className="opacity-50">No details found</span>
                  </div>
                )}
              </Stack>
            </Box>
          ))}
        </Box>
      </div>
    </div>
  )
}

export default withPermission(Index, true, 'pharmacy', [
  ACCESS_TYPES.READ,
  ACCESS_TYPES.WRITE,
])
