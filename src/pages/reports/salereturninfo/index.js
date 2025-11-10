import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import {
  ReturnItems,
  SaleReturnInfo,
  getPurchaseReturnInfo,
  returnPurchasedItems,
} from '@/constants/apis'
import { toast } from 'react-toastify'
import {
  Button,
  TextField,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  Box,
} from '@mui/material'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'
import { showLoader, hideLoader } from '@/redux/loaderSlice'
import { Bounce } from 'react-toastify'
import Breadcrumb from '@/components/Breadcrumb'
import { toastconfig } from '@/utils/toastconfig'
import dayjs from 'dayjs'

function SaleReturnPage() {
  const router = useRouter()
  const { tab = '0', orderId: urlOrderId = '' } = router.query

  const [activeTab, setActiveTab] = useState(parseInt(tab))
  const [orderId, setOrderId] = useState(urlOrderId)
  const [id, setId] = useState(urlOrderId)
  const [saleDetails, setSaleDetails] = useState(null)
  const [flattenedPurchaseDetails, setFlattenedPurchaseDetails] = useState([])
  const [nonPharmacyDetails, setNonPharmacyDetails] = useState(null)
  const user = useSelector(store => store.user)
  const dispatch = useDispatch()
  const queryClient = useQueryClient()

  // Update URL when tab changes
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
    router.push(
      {
        pathname: router.pathname,
        query: {
          ...router.query,
          tab: newValue,
          orderId: '', // Clear orderId when switching tabs
        },
      },
      undefined,
      { shallow: true },
    )
    // Reset states when switching tabs
    setOrderId('')
    setId('')
    setSaleDetails(null)
    setFlattenedPurchaseDetails([])
    setNonPharmacyDetails(null)
  }

  // Effect to sync with URL parameters on initial load and URL changes
  useEffect(() => {
    if (router.isReady) {
      const tabValue = parseInt(router.query.tab || '0')
      const orderIdValue = router.query.orderId || ''

      setActiveTab(tabValue)
      if (orderIdValue) {
        setOrderId(orderIdValue)
        setId(orderIdValue)
      }
    }
    // Cleanup function
    return () => {
      setOrderId('')
      setId('')
      setSaleDetails(null)
      setFlattenedPurchaseDetails([])
      setNonPharmacyDetails(null)
    }
  }, [router.isReady, router.query])

  const getSaleReturnInfo = async () => {
    if (!orderId) {
      toast.error('Please enter order id', toastconfig)
    } else {
      // Update URL with new orderId while preserving tab
      router.push(
        {
          pathname: router.pathname,
          query: {
            ...router.query,
            orderId: orderId,
          },
        },
        undefined,
        { shallow: true },
      )
      queryClient.invalidateQueries({
        queryKey: ['fetchSalesReturnInfoData', orderId, activeTab],
      })
      setId(orderId)
    }
  }

  const {
    data: salesData,
    isLoading: isSalesFetchLoading,
    error: salesError,
  } = useQuery({
    queryKey: ['fetchSalesReturnInfoData', id, activeTab],
    enabled: !!id && activeTab === 0,
    queryFn: async () => {
      const responsejson = await SaleReturnInfo(user?.accessToken, id)
      if (responsejson.status == 200) {
        if (!responsejson.data?.orderInformation) {
          setSaleDetails(null)
          setFlattenedPurchaseDetails([])
          throw new Error('No data found for this order ID')
        }
        console.log(responsejson.data)
        setSaleDetails(responsejson.data.orderInformation)

        // Flatten the nested structure for the original PurchaseDetails component
        const flattened = []
        responsejson.data.orderInformation.purchasedItems.forEach(item => {
          item.purchaseDetails.forEach(detail => {
            flattened.push({
              itemName: item.itemName,
              refId: item.refId,
              itemId: item.refId, // Using refId as itemId for now, adjust if needed
              grnId: detail.grnId,
              grnNo: detail.grnId, // For compatibility with original component
              purchaseQuantity: item.purchaseQuantity,
              mrpPerTablet: detail.mrpPerTablet,
              returnQuantity: item.returnQuantity,
              batchNo: detail.batchNo,
              expiryDate: detail.expiryDate,
              usedQuantity: detail.usedQuantity,
              totalCost: item.totalCost,
            })
          })
        })
        setFlattenedPurchaseDetails(flattened)

        return responsejson.data
      } else {
        setSaleDetails(null)
        setFlattenedPurchaseDetails([])
        throw new Error(
          'Error occurred while fetching medicine details for pharmacy',
        )
      }
    },
    onError: err => {
      toast.error(
        'Failed to fetch sale return data: ' + err.message,
        toastconfig,
      )
    },
  })

  const {
    data: nonPharmacyData,
    isLoading: isNonPharmacyFetchLoading,
    error: nonPharmacyError,
  } = useQuery({
    queryKey: ['fetchPurchaseReturnInfoData', id, activeTab],
    enabled: !!id && activeTab === 1,
    queryFn: async () => {
      const responsejson = await getPurchaseReturnInfo(user?.accessToken, id)
      if (responsejson.status == 200) {
        if (!responsejson.data?.orderInformation?.length) {
          setNonPharmacyDetails(null)
          throw new Error('No data found for this order ID')
        }
        const orderInfo = responsejson.data.orderInformation[0]
        if (!orderInfo.purchasedItems?.length) {
          setNonPharmacyDetails(null)
          throw new Error('No items found for this order')
        }
        setNonPharmacyDetails({
          patientDetails: orderInfo.patientDetails,
          purchaseDetails: orderInfo.purchasedItems.map(item => ({
            ...item,
            quantity: 1, // Since quantity is not provided in the response
            price: item.totalCost,
          })),
        })
        return responsejson.data
      } else {
        setNonPharmacyDetails(null)
        throw new Error(
          'Error occurred while fetching non-pharmacy item details',
        )
      }
    },
    onError: err => {
      toast.error(
        'Failed to fetch non-pharmacy return data: ' + err.message,
        toastconfig,
      )
    },
  })

  useEffect(() => {
    if (isSalesFetchLoading || isNonPharmacyFetchLoading) {
      dispatch(showLoader())
    } else {
      dispatch(hideLoader())
    }
    return () => {
      dispatch(hideLoader())
    }
  }, [isSalesFetchLoading, isNonPharmacyFetchLoading])

  return (
    <div className="flex flex-col px-5 w-full mx-auto">
      <span className="m-5">
        <Breadcrumb />
      </span>

      <Card className="mb-5">
        <CardContent className="flex flex-col justify-center items-center w-full">
          <Box
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              width: '100%',
              mb: 3,
            }}
          >
            <Tabs value={activeTab} onChange={handleTabChange} centered>
              <Tab label="Pharmacy Items" />
              <Tab label="Non-Pharmacy Items" />
            </Tabs>
          </Box>
          <div className="flex gap-3 items-center justify-between w-2/4">
            <TextField
              name="orderID"
              label="Enter Order Id"
              fullWidth
              value={orderId}
              onChange={e => setOrderId(e.target.value)}
            />
            <Button
              onClick={getSaleReturnInfo}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  getSaleReturnInfo()
                }
              }}
              variant="contained"
              color="primary"
              className="text-white capitalize"
              // size="small"
            >
              Fetch
            </Button>
          </div>
        </CardContent>
      </Card>

      {activeTab === 0 && (
        <>
          {saleDetails ? (
            <>
              <PatientDetails details={saleDetails.patientDetails} />
              <PurchaseDetails
                details={flattenedPurchaseDetails}
                headerDetails={saleDetails.patientDetails}
                type={saleDetails.type}
                orderId={orderId}
              />
            </>
          ) : (
            id &&
            !isSalesFetchLoading && (
              <Card className="mt-4">
                <CardContent>
                  <Typography
                    variant="body1"
                    color="error"
                    className="text-center"
                  >
                    No pharmacy items found for this order ID
                  </Typography>
                </CardContent>
              </Card>
            )
          )}
        </>
      )}

      {activeTab === 1 && (
        <>
          {nonPharmacyDetails ? (
            <>
              <PatientDetails details={nonPharmacyDetails.patientDetails} />
              <NonPharmacyPurchaseDetails
                details={nonPharmacyDetails.purchaseDetails}
                headerDetails={nonPharmacyDetails.patientDetails}
                orderId={orderId}
              />
            </>
          ) : (
            id &&
            !isNonPharmacyFetchLoading && (
              <Card className="mt-4">
                <CardContent>
                  <Typography variant="body1" className="text-center">
                    No non-pharmacy items found for this order ID
                  </Typography>
                </CardContent>
              </Card>
            )
          )}
        </>
      )}
    </div>
  )
}

const PatientDetails = ({ details }) => {
  if (!details) return null

  return (
    <Card className="mb-5">
      <CardContent>
        {/* <Typography variant="h6" className="mb-3">
          Patient Details
        </Typography> */}
        <div className="grid grid-cols-4 gap-4">
          {/* {Object.entries(details).map(([key, value]) => (
            <div key={key}>
              <Typography variant="subtitle2" color="textSecondary">
                {key.charAt(0).toUpperCase() +
                  key.slice(1).replace(/([A-Z])/g, ' $1')}
              </Typography>
              <Typography variant="body1">{value}</Typography>
            </div>
          ))} */}
          <div>
            <Typography variant="subtitle2" color="textSecondary">
              Patient
            </Typography>
            <Typography variant="body1">{details.patientName}</Typography>
          </div>
          <div>
            <Typography variant="subtitle2" color="textSecondary">
              Purchase Type
            </Typography>
            <Typography variant="body1">{details.purchaseType}</Typography>
          </div>
          <div>
            <Typography variant="subtitle2" color="textSecondary">
              Appointment Date
            </Typography>
            <Typography variant="body1">
              {dayjs(details.appointmentDate).format('DD-MM-YYYY')}
            </Typography>
          </div>
          <div>
            <Typography variant="subtitle2" color="textSecondary">
              Doctor
            </Typography>
            <Typography variant="body1">{details.doctorName}</Typography>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const PurchaseDetails = ({ details, headerDetails, type, orderId }) => {
  const [returnValue, setReturnValue] = useState({
    patientId: headerDetails?.patientId,
    type: type,
    returnDetails: [],
    orderId: orderId,
    totalAmount: 0,
  })

  // State to track return quantities by refId and grnId
  const [returnQuantities, setReturnQuantities] = useState({})
  const dispatch = useDispatch()
  const user = useSelector(store => store.user)
  const getReturnValue = (refId, grnId) => {
    const key = `${refId}-${grnId}`
    return returnQuantities[key] || ''
  }

  const handleReturnValues = (value, refId, grnId) => {
    const key = `${refId}-${grnId}`
    setReturnQuantities(prev => ({
      ...prev,
      [key]: value,
    }))
  }
  const { mutate, isPending } = useMutation({
    mutationFn: async payload => {
      console.log(payload)
      const res = await ReturnItems(user.accessToken, payload)
      if (res.status === 200) {
        toast.success('Returned successfully', toastconfig)
      } else {
        toast.error(res, toastconfig)
      }
    },
    onMutate: payload => {
      toast.info('Processing return...', toastconfig)
    },
    onError: error => {
      toast.error('Error: ' + error.message, toastconfig)
    },
    onSettled: () => {
      dispatch(hideLoader())
    },
  })
  useEffect(() => {
    if (isPending) {
      dispatch(showLoader())
    } else {
      dispatch(hideLoader())
    }
  }, [isPending])
  const clickSaveAndCallApi = () => {
    let error = 0
    let totAmount = 0
    let atleastOneObjFound = false

    // Group return quantities by refId
    const returnDetailsByRefId = {}

    details.forEach(item => {
      const refId = item.refId
      const grnId = item.grnId
      const key = `${refId}-${grnId}`
      const returnQty = parseInt(returnQuantities[key] || 0)

      if (returnQty > 0) {
        if (returnQty < 0) {
          error = 3
        } else if (returnQty > item.purchaseQuantity) {
          error = 1
        } else {
          totAmount = totAmount + item.mrpPerTablet * returnQty
          atleastOneObjFound = true

          if (!returnDetailsByRefId[refId]) {
            returnDetailsByRefId[refId] = {
              refId: refId,
              itemId: item.itemId || 0, // You might need to add itemId to your data
              returnInfo: [],
            }
          }

          returnDetailsByRefId[refId].returnInfo.push({
            grnId: grnId,
            returnQuantity: returnQty,
          })
        }
      }
    })

    if (error == 1) {
      toast.error('Please check return quantity', toastconfig)
    } else if (error == 3) {
      toast.error(
        'Return quantity must be a valid non-negative number',
        toastconfig,
      )
    } else if (!atleastOneObjFound) {
      toast.error('Please add atleast one return quantity', toastconfig)
    } else {
      const payload = {
        orderId: returnValue?.orderId,
        patientId: returnValue?.patientId,
        totalAmount: totAmount,
        type: returnValue?.type || 'Consultation',
        returnDetails: Object.values(returnDetailsByRefId),
      }

      console.log('Return payload:', payload)
      mutate(payload)
    }
  }
  useEffect(() => {
    if (details) {
      // Reset return quantities when details change
      setReturnQuantities({})
    }
  }, [details])
  if (!details || details.length === 0) return null
  return (
    <Card className="min-h-52">
      <CardContent>
        <Typography variant="h6" className="mb-3">
          Purchase Details
        </Typography>
        <div>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Item Name</TableCell>
                  <TableCell>GRN No</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>MRP per tablet</TableCell>
                  <TableCell>Return Quantity</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {details?.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.itemName}</TableCell>
                    <TableCell>{item.grnNo}</TableCell>
                    <TableCell>{item.purchaseQuantity}</TableCell>
                    <TableCell>{item.mrpPerTablet}</TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        value={getReturnValue(item.refId, item.grnId)}
                        onChange={e => {
                          handleReturnValues(
                            e.target.value,
                            item.refId,
                            item.grnId,
                          )
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex justify-end">
              <Button
                variant="outlined"
                onClick={clickSaveAndCallApi}
                className="capitalize"
              >
                Save
              </Button>
            </div>
          </TableContainer>
        </div>
      </CardContent>
    </Card>
  )
}

const NonPharmacyPurchaseDetails = ({ details, headerDetails, orderId }) => {
  const [selectedItems, setSelectedItems] = useState({})
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const user = useSelector(store => store.user)

  const handleItemSelect = itemId => {
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId],
    }))
  }

  // Split items into available and returned
  const availableItems = details?.filter(item => !item.isReturned) || []
  const returnedItems = details?.filter(item => item.isReturned) || []

  const hasSelectedItems = Object.values(selectedItems).some(
    selected => selected,
  )

  const {
    mutate: returnItemsMutation,
    isPending: isReturnItemsPending,
  } = useMutation({
    mutationFn: async payload => {
      const res = await returnPurchasedItems(user.accessToken, payload)
      if (res.status === 200) {
        toast.success('Items returned successfully', toastconfig)
        queryClient.invalidateQueries({
          queryKey: ['fetchPurchaseReturnInfoData', orderId, 1],
        })
      } else {
        toast.error(res, toastconfig)
      }
    },
    onMutate: payload => {
      toast.info('Processing return...', toastconfig)
    },
    onError: error => {
      toast.error('Error: ' + error.message, toastconfig)
    },
    onSettled: () => {
      dispatch(hideLoader())
    },
  })

  useEffect(() => {
    if (isReturnItemsPending) {
      dispatch(showLoader())
    } else {
      dispatch(hideLoader())
    }
  }, [isReturnItemsPending])

  const handleReturn = () => {
    if (!hasSelectedItems) {
      toast.error('Please select at least one item to return', toastconfig)
      return
    }
    if (!confirm('Are you sure you want to return the selected items?')) {
      return
    }

    let totAmount = 0
    const returnDetails = []

    availableItems.forEach(item => {
      if (selectedItems[item.itemId]) {
        totAmount += item.totalCost
        returnDetails.push({
          refId: item.refId,
          itemId: item.itemId,
          itemName: item.itemName,
          itemType: item.productType,
          itemCost: item.totalCost,
        })
      }
    })

    if (returnDetails.length === 0) {
      toast.error('Please select at least one item to return', toastconfig)
    } else {
      const payload = {
        orderId: orderId,
        patientId: headerDetails?.patientId,
        totalAmount: totAmount,
        type: headerDetails?.purchaseType || 'Consultation',
        returnDetails: returnDetails,
      }

      console.log('Return payload:', payload)

      returnItemsMutation(payload)
    }
  }

  useEffect(() => {
    if (details) {
      setSelectedItems({})
    }
  }, [details])

  if (!details || details.length === 0) return null

  return (
    <div className="space-y-4">
      {/* Available Items */}
      <Card>
        <CardContent>
          <Typography variant="h6" className="mb-3">
            Available Items
          </Typography>
          <div>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Select</TableCell>
                    <TableCell>Item Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Price</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {availableItems.length > 0 ? (
                    availableItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedItems[item.itemId] || false}
                            onChange={() => handleItemSelect(item.itemId)}
                            className="w-4 h-4"
                          />
                        </TableCell>
                        <TableCell>{item.itemName}</TableCell>
                        <TableCell>{item.productType}</TableCell>
                        <TableCell>{item.totalCost}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">
                        No items available for return
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {hasSelectedItems && (
                <div className="flex justify-end p-4">
                  <Button
                    variant="outlined"
                    onClick={handleReturn}
                    disabled={isReturnItemsPending}
                    className="capitalize"
                  >
                    Return Selected Items
                  </Button>
                </div>
              )}
            </TableContainer>
          </div>
        </CardContent>
      </Card>

      {/* Returned Items */}
      <Card>
        <CardContent>
          <Typography variant="h6" className="mb-3">
            Returned Items
          </Typography>
          <div>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Item Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Price</TableCell>
                    {/* <TableCell>Returned Date</TableCell> */}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {returnedItems.length > 0 ? (
                    returnedItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.itemName}</TableCell>
                        <TableCell>{item.productType}</TableCell>
                        <TableCell>{item.totalCost}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4">
                        No returned items
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SaleReturnPage
