import {
  addOtherPayment,
  getAllAppointmentsReasons,
  getAppointmentReasonsByPatientType,
  getOtherPaymentsStatus,
  getCoupons,
  getOtherPaymentsOrderId,
  sendOtherPaymentsTransactionId,
  downloadOtherPaymentsInvoice,
  downloadPDF,
} from '@/constants/apis'
import React, { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'
import Button from '@mui/material/Button'
import Modal from './Modal'
import { closeModal, openModal } from '@/redux/modalSlice'
// import TextJoedit from './TextJoedit'
import {
  IconButton,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Chip,
  Autocomplete,
} from '@mui/material'
import {
  Close,
  ExpandMore,
  Payment,
  Receipt,
  Discount,
  ReceiptLong,
  DocumentScanner,
  PaymentSharp,
  CreditCard,
  Money,
  Download,
} from '@mui/icons-material'
import dayjs from 'dayjs'
import { toast } from 'react-toastify'
import { toastconfig } from '@/utils/toastconfig'
import dynamic from 'next/dynamic'

const JoditEditor = dynamic(() => import('jodit-react'), {
  ssr: false,
})
function AdvancePayments({ formData }) {
  const userDetails = useSelector(store => store.user)
  const dispatch = useDispatch()
  const [appointmentReason, setAppointmentReason] = useState('')
  const [amount, setAmount] = useState('')
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [editablePayableAmount, setEditablePayableAmount] = useState(0)
  const [invoiceHtml, setInvoiceHtml] = useState('')
  const [showInvoicePreview, setShowInvoicePreview] = useState(false)

  // Check if user is admin (role ID 1 or 7)
  const isAdmin =
    userDetails.roleDetails?.id === 1 || userDetails.roleDetails?.id === 7

  const { data: otherPaymentsStatus, isLoading, error } = useQuery({
    queryKey: ['otherPaymentsStatus', formData.id],
    queryFn: async () => {
      return await getOtherPaymentsStatus(userDetails.accessToken, formData.id)
    },
    enabled: !!formData?.id,
  })

  // Get coupons for discount
  const { data: coupons } = useQuery({
    queryKey: ['coupons'],
    queryFn: async () => {
      const res = await getCoupons(userDetails.accessToken)
      return res.data
    },
  })
  const queryClient = useQueryClient()
  const {
    mutate: addOtherPaymentMutation,
    isPending: addOtherPaymentLoading,
  } = useMutation({
    mutationFn: async payload => {
      return await addOtherPayment(userDetails.accessToken, payload)
    },
    onSuccess: () => {
      dispatch(closeModal('advance-payment-modal'))
      queryClient.invalidateQueries({
        queryKey: ['otherPaymentsStatus', formData.id],
      })
    },
  })
  const handleAddOtherPayment = () => {
    if (!appointmentReason || !amount) {
      toast.error('Please fill in all required fields', toastconfig)
      return
    }
    addOtherPaymentMutation({
      patientId: formData.id,
      appointmentReason: appointmentReason,
      amount: amount,
    })
  }

  // Payment handling functions
  const handlePayment = async (paymentMode, paymentData) => {
    const payload = {
      refId: paymentData.refId,
      totalOrderAmount: paymentData.totalAmount,
      payableAmount: paymentData.payableAmount || paymentData.totalAmount,
      couponCode: paymentData.couponCode || null,
      discountAmount: paymentData.discountAmount || 0,
      payableAfterDiscountAmount: paymentData.discountedAmount,
      pendingOrderAmount: 0,
      paymentMode: paymentMode,
    }

    if (paymentMode === 'ONLINE') {
      try {
        const order = await getOtherPaymentsOrderId(
          userDetails.accessToken,
          payload,
        )
        if (order.status === 200) {
          const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_ID,
            amount: order.data.totalOrderAmount * 100,
            currency: 'INR',
            name: 'Origins',
            image:
              'https://img.freepik.com/premium-vector/charity-abstract-logo-healthy-lifestyle_660762-34.jpg?size=626&ext=jpg',
            description: 'Advance Payment',
            order_id: order.data.orderId,
            'theme.color': '#FF6C22',
            handler: async response => {
              const order_details = {
                orderId: response.razorpay_order_id,
                transactionId: response.razorpay_payment_id,
              }
              const result = await sendOtherPaymentsTransactionId(
                userDetails.accessToken,
                order_details,
              )
              if (result.status === 200) {
                toast.success('Payment successful through online', toastconfig)
                dispatch(closeModal('payment-modal'))
                queryClient.invalidateQueries({
                  queryKey: ['otherPaymentsStatus', formData.id],
                })
              }
            },
          }
          const paymentObject = new window.Razorpay(options)
          paymentObject.open()
          paymentObject.on('payment.failed', function(response) {
            toast.error('Payment failed', toastconfig)
          })
          paymentObject.on('payment.success', function(response) {
            toast.success('Payment successful through online', toastconfig)
            dispatch(closeModal('payment-modal'))
            queryClient.invalidateQueries({
              queryKey: ['otherPaymentsStatus', formData.id],
            })
          })
        }
      } catch (error) {
        toast.error('Error processing online payment', toastconfig)
      }
    } else if (paymentMode === 'CASH') {
      if (window.confirm('Are you sure you want to pay offline?')) {
        try {
          const order = await getOtherPaymentsOrderId(
            userDetails.accessToken,
            payload,
          )
          if (order.status === 200) {
            toast.success('Payment successful through cash', toastconfig)
            dispatch(closeModal('payment-modal'))
            queryClient.invalidateQueries({
              queryKey: ['otherPaymentsStatus', formData.id],
            })
          }
        } catch (error) {
          toast.error('Error processing cash payment', toastconfig)
        }
      }
    } else if (paymentMode === 'UPI') {
      if (window.confirm('Are you sure you want to pay UPI?')) {
        try {
          const order = await getOtherPaymentsOrderId(
            userDetails.accessToken,
            payload,
          )
          if (order.status === 200) {
            toast.success('Payment successful through UPI', toastconfig)
            dispatch(closeModal('payment-modal'))
            queryClient.invalidateQueries({
              queryKey: ['otherPaymentsStatus', formData.id],
            })
          }
        } catch (error) {
          toast.error('Error processing UPI payment', toastconfig)
        }
      }
    }
  }

  // Handle payable amount change for admin
  const handlePayableAmountChange = (value, maxAmount) => {
    const numValue = Number(value) || 0
    // Ensure entered amount doesn't exceed max amount
    const validatedAmount = Math.min(numValue, maxAmount)
    setEditablePayableAmount(validatedAmount)
  }

  // Handle download invoice
  const handleDownloadInvoice = async payment => {
    try {
      const response = await downloadOtherPaymentsInvoice(
        userDetails.accessToken,
        {
          refId: payment.refId,
          patientId: formData.id,
        },
      )

      // Check if response has data (HTML content)
      console.log('response.data', response.data)
      if (response.data) {
        setInvoiceHtml(response.data)
        setShowInvoicePreview(true)
        dispatch(openModal('invoice-preview-modal'))
      } else {
        // Fallback to PDF download if no HTML data
        // downloadPDF(response)
        // toast.success('Invoice downloaded successfully', toastconfig)
        toast.error('Invoice not found', toastconfig)
      }
    } catch (error) {
      console.error('Error downloading invoice:', error)
      toast.error('Failed to download invoice', toastconfig)
    }
  }

  if (isLoading) {
    return <div className="p-4">Loading payment data...</div>
  }

  if (error) {
    return (
      <div className="p-4 text-red-600">
        Error loading payment data: {error.message}
      </div>
    )
  }

  const payments = otherPaymentsStatus?.data || []

  return (
    <div className="p-4">
      {/* <h1 className="text-2xl font-bold mb-4">Advance Payments</h1> */}
      <div className="flex justify-end pb-4">
        <Button
          variant="outlined"
          color="primary"
          className="capitalize"
          onClick={() => {
            setAppointmentReason('')
            setAmount('')
            dispatch(openModal('advance-payment-modal'))
          }}
        >
          Add Advance Payment
        </Button>
      </div>
      {payments.length === 0 ? (
        <div className="text-center py-8">
          <Receipt
            className="text-gray-400 mx-auto mb-4"
            style={{ fontSize: '3rem' }}
          />
          <Typography variant="h6" color="textSecondary">
            No advance payments found
          </Typography>
          <Typography variant="body2" color="textSecondary" className="mt-2">
            Add your first advance payment using the button above
          </Typography>
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map((payment, index) => (
            <Accordion key={index} className="shadow-sm border border-gray-200">
              <AccordionSummary
                expandIcon={<ExpandMore />}
                className="bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center space-x-3">
                    <PaymentSharp className="text-secondary" />
                    <div>
                      <Typography
                        variant="h6"
                        color="primary"
                        className="font-medium"
                      >
                        {payment.paymentReason}
                      </Typography>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Typography
                      variant="subtitle2"
                      className={`px-2 py-1 rounded-full text-sm ${
                        parseFloat(payment.totalAmount) - payment.paidAmount ===
                        0
                          ? 'bg-green-100 text-green-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {parseFloat(payment.totalAmount) - payment.paidAmount ===
                      0
                        ? 'Paid'
                        : 'Pending'}
                    </Typography>
                  </div>
                </div>
              </AccordionSummary>

              <AccordionDetails className="bg-white">
                <div className="w-full space-y-6">
                  {/* Payment Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 bg-blue-50 rounded-lg">
                    <div className="text-center">
                      <Typography
                        variant="h6"
                        color="primary"
                        className="font-bold"
                      >
                        ₹{parseFloat(payment.totalAmount).toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Total Amount
                      </Typography>
                    </div>
                    <div className="text-center">
                      <Typography
                        variant="h6"
                        color="success.main"
                        className="font-bold"
                      >
                        ₹
                        {(
                          parseFloat(payment?.paidAmount) -
                          (payment.paymentHistory
                            ? payment?.paymentHistory?.reduce(
                                (acc, curr) =>
                                  acc + parseFloat(curr.discountAmount),
                                0,
                              )
                            : 0)
                        ).toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Paid Amount
                      </Typography>
                    </div>
                    {/* Discount Amount */}
                    <div className="text-center">
                      <Typography
                        variant="h6"
                        color="warning.main"
                        className="font-bold"
                      >
                        ₹
                        {payment.paymentHistory
                          ? payment.paymentHistory
                              ?.reduce(
                                (acc, curr) =>
                                  acc + parseFloat(curr.discountAmount),
                                0,
                              )
                              .toLocaleString()
                          : 0}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Discount Amount
                      </Typography>
                    </div>
                    <div className="text-center">
                      <Typography
                        variant="h6"
                        color="error.main"
                        className="font-bold"
                      >
                        ₹
                        {(
                          parseFloat(payment.totalAmount) - payment.paidAmount
                        ).toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Remaining
                      </Typography>
                    </div>
                    {parseFloat(payment.totalAmount) - payment.paidAmount >
                      0 && (
                      <div className="flex justify-end mt-2">
                        <Button
                          variant="contained"
                          color="success"
                          className="text-white h-10"
                          onClick={() => {
                            // console.log('payment', payment)
                            setSelectedPayment(payment)
                            setEditablePayableAmount(
                              parseFloat(payment.totalAmount) -
                                payment.paidAmount,
                            )
                            dispatch(openModal('payment-modal'))
                          }}
                        >
                          Pay Now
                        </Button>
                      </div>
                    )}
                    <div className="flex justify-end mt-2">
                      <Button
                        variant="outlined"
                        color="primary"
                        className="h-10"
                        startIcon={<Receipt />}
                        onClick={() => handleDownloadInvoice(payment)}
                      >
                        Invoice
                      </Button>
                    </div>
                  </div>

                  {/* Payment History */}
                  {payment.paymentHistory && payment.paymentHistory.length > 0 && (
                    <div>
                      <Typography
                        variant="h6"
                        className="font-semibold mb-4 flex items-center"
                      >
                        <Receipt className="mr-2 text-gray-600" />
                        Payment History
                      </Typography>
                      <div className="space-y-3">
                        {payment.paymentHistory.map((history, historyIndex) => (
                          <Accordion
                            key={historyIndex}
                            className="border border-gray-200"
                          >
                            <AccordionSummary
                              expandIcon={<ExpandMore />}
                              className="bg-gray-50"
                            >
                              <div className="flex items-center justify-between w-full pr-4">
                                <div className="flex items-center space-x-3">
                                  <div
                                    className={`w-3 h-3 rounded-full ${
                                      history.paymentMode === 'CASH' ||
                                      history.paymentMode === 'UPI'
                                        ? 'bg-green-500'
                                        : history.paymentMode === 'ONLINE'
                                        ? 'bg-blue-500'
                                        : 'bg-gray-500'
                                    }`}
                                  />
                                  <div>
                                    <Typography
                                      variant="subtitle1"
                                      className="font-medium"
                                    >
                                      {history.paymentMode}
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      color="textSecondary"
                                    >
                                      {dayjs(history.paymentDate).format(
                                        'DD/MM/YYYY',
                                      )}
                                    </Typography>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Chip
                                    label={`₹${parseFloat(
                                      history.paidOrderAmount,
                                    ).toLocaleString()}`}
                                    color="success"
                                    size="small"
                                  />
                                  {parseFloat(history.discountAmount) > 0 && (
                                    <Chip
                                      icon={<Discount />}
                                      label={`₹${parseFloat(
                                        history.discountAmount,
                                      ).toLocaleString()}`}
                                      color="warning"
                                      size="small"
                                    />
                                  )}
                                </div>
                              </div>
                            </AccordionSummary>

                            <AccordionDetails>
                              <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Typography
                                      variant="body2"
                                      color="textSecondary"
                                    >
                                      Payment Date
                                    </Typography>
                                    <Typography
                                      variant="body1"
                                      className="font-medium"
                                    >
                                      {dayjs(history.paymentDate).format(
                                        'DD/MM/YYYY',
                                      )}
                                    </Typography>
                                  </div>
                                  <div>
                                    <Typography
                                      variant="body2"
                                      color="textSecondary"
                                    >
                                      Payment Mode
                                    </Typography>
                                    <Typography
                                      variant="body1"
                                      className="font-medium"
                                    >
                                      {history.paymentMode}
                                    </Typography>
                                  </div>
                                  <div>
                                    <Typography
                                      variant="body2"
                                      color="textSecondary"
                                    >
                                      Amount Paid
                                    </Typography>
                                    <Typography
                                      variant="body1"
                                      className="font-medium text-green-600"
                                    >
                                      ₹
                                      {parseFloat(
                                        history.paidOrderAmount,
                                      ).toLocaleString()}
                                    </Typography>
                                  </div>
                                  <div>
                                    <Typography
                                      variant="body2"
                                      color="textSecondary"
                                    >
                                      Discount Applied
                                    </Typography>
                                    <Typography
                                      variant="body1"
                                      className="font-medium text-blue-600"
                                    >
                                      ₹
                                      {parseFloat(
                                        history.discountAmount,
                                      ).toLocaleString()}
                                    </Typography>
                                  </div>
                                </div>

                                {history.couponCode && (
                                  <div className="pt-2 border-t border-gray-200">
                                    <Typography
                                      variant="body2"
                                      color="textSecondary"
                                      className="mb-1"
                                    >
                                      Coupon Code
                                    </Typography>
                                    <Chip
                                      label={history.couponCode}
                                      color="primary"
                                      variant="outlined"
                                      className="font-mono"
                                    />
                                  </div>
                                )}
                              </div>
                            </AccordionDetails>
                          </Accordion>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </AccordionDetails>
            </Accordion>
          ))}
        </div>
      )}

      <Modal
        uniqueKey="advance-payment-modal"
        maxWidth={'xs'}
        onClose={() => dispatch(closeModal('advance-payment-modal'))}
      >
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Advance Payment</h1>
          <IconButton
            onClick={() => dispatch(closeModal('advance-payment-modal'))}
          >
            <Close />
          </IconButton>
        </div>

        <div className="flex flex-col gap-4 mt-4">
          <TextField
            label="Appointment Reason"
            value={appointmentReason}
            onChange={e => setAppointmentReason(e.target.value)}
            fullWidth
            required
            placeholder="Enter appointment reason"
          />

          <TextField
            label="Amount"
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            fullWidth
            required
            placeholder="Enter amount"
            InputProps={{
              startAdornment: <span className="text-gray-500 mr-1">₹</span>,
              inputProps: {
                min: 0,
                step: '0.01',
              },
            }}
          />

          <div className="flex justify-end">
            <Button
              variant="outlined"
              color="primary"
              className="capitalize"
              onClick={() => handleAddOtherPayment()}
              disabled={addOtherPaymentLoading}
            >
              {addOtherPaymentLoading ? 'Adding...' : 'Add'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Payment Modal */}
      <PaymentModal
        payment={selectedPayment}
        coupons={coupons}
        onPayment={handlePayment}
        onClose={() => {
          dispatch(closeModal('payment-modal'))
          setEditablePayableAmount(0)
          setSelectedPayment(null)
        }}
        isAdmin={isAdmin}
        editablePayableAmount={editablePayableAmount}
        onPayableAmountChange={handlePayableAmountChange}
      />

      {/* Invoice Preview Modal */}
      <Modal
        uniqueKey="invoice-preview-modal"
        maxWidth={'lg'}
        onClose={() => {
          dispatch(closeModal('invoice-preview-modal'))
          setShowInvoicePreview(false)
          setInvoiceHtml('')
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Invoice Preview</h1>
          <IconButton
            onClick={() => {
              dispatch(closeModal('invoice-preview-modal'))
              setShowInvoicePreview(false)
              setInvoiceHtml('')
            }}
          >
            <Close />
          </IconButton>
        </div>

        {showInvoicePreview && (
          <div className="max-h-[70vh] overflow-y-auto">
            <InvoicePreview content={invoiceHtml} />
          </div>
        )}
      </Modal>
    </div>
  )
}

// Payment Modal Component
const PaymentModal = ({
  payment,
  coupons,
  onPayment,
  onClose,
  isAdmin,
  editablePayableAmount,
  onPayableAmountChange,
}) => {
  const [selectedCoupon, setSelectedCoupon] = useState(null)
  const [discountedAmount, setDiscountedAmount] = useState(0)

  // Calculate discounted amount when coupon changes
  useEffect(() => {
    if (!payment) return

    const totalAmount = parseFloat(payment.totalAmount)
    const remainingAmount = totalAmount - payment.paidAmount
    const payableAmount = isAdmin ? editablePayableAmount : remainingAmount

    if (!selectedCoupon) {
      setDiscountedAmount(payableAmount)
      return
    }

    const discount = (payableAmount * selectedCoupon.discountPercentage) / 100
    setDiscountedAmount(payableAmount - discount)
  }, [selectedCoupon, payment, isAdmin, editablePayableAmount])

  if (!payment) return null

  const totalAmount = parseFloat(payment.totalAmount)
  const remainingAmount = totalAmount - payment.paidAmount
  const payableAmount = isAdmin ? editablePayableAmount : remainingAmount

  return (
    <Modal uniqueKey="payment-modal" maxWidth={'sm'} onClose={onClose}>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Payment Details</h1>
        <IconButton onClick={onClose}>
          <Close />
        </IconButton>
      </div>

      <div className="space-y-4">
        {/* Payment Summary */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Typography variant="body2" color="textSecondary">
                Total Amount
              </Typography>
              <Typography variant="h6" className="font-bold">
                ₹{totalAmount.toLocaleString()}
              </Typography>
            </div>
            <div>
              <Typography variant="body2" color="textSecondary">
                Paid Amount
              </Typography>
              <Typography variant="h6" className="font-bold text-green-600">
                ₹{payment.paidAmount.toLocaleString()}
              </Typography>
            </div>
            <div>
              <Typography variant="body2" color="textSecondary">
                Remaining Amount
              </Typography>
              <Typography variant="h6" className="font-bold text-orange-600">
                ₹{remainingAmount.toLocaleString()}
              </Typography>
            </div>
            <div>
              <Typography variant="body2" color="textSecondary">
                Payment Reason
              </Typography>
              <Typography variant="body1" className="font-medium">
                {payment.paymentReason}
              </Typography>
            </div>
          </div>
        </div>

        {/* Admin Payable Amount Field */}
        {isAdmin && (
          <div>
            <Typography variant="h6" className="mb-2">
              Payable Amount (Admin)
            </Typography>
            <TextField
              type="number"
              label="Payable Amount"
              value={editablePayableAmount || ''}
              onChange={e =>
                onPayableAmountChange(e.target.value, remainingAmount)
              }
              fullWidth
              InputProps={{
                startAdornment: <span className="text-gray-500 mr-1">₹</span>,
                inputProps: {
                  min: 0,
                  max: remainingAmount,
                  step: '0.01',
                },
              }}
              helperText={`Max: ₹${remainingAmount.toLocaleString()}`}
            />
          </div>
        )}

        {/* Coupon Section */}
        <div>
          <Typography variant="h6" className="mb-2">
            Apply Coupon
          </Typography>
          <Autocomplete
            options={coupons || []}
            getOptionLabel={option =>
              `${option.couponCode} (${option.discountPercentage}% off)`
            }
            value={selectedCoupon}
            onChange={(event, newValue) => setSelectedCoupon(newValue)}
            renderInput={params => (
              <TextField
                {...params}
                label="Select Coupon"
                variant="outlined"
                fullWidth
              />
            )}
          />
        </div>

        {/* Discount Summary */}
        {selectedCoupon && (
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="space-y-2">
              <div className="flex justify-between text-green-600">
                <span>Discount ({selectedCoupon.discountPercentage}%)</span>
                <span>-₹{(payableAmount - discountedAmount).toFixed(2)}</span>
              </div>
              <div className="border-t border-green-200 pt-2">
                <div className="flex justify-between font-bold text-green-700">
                  <span>Final Amount</span>
                  <span>₹{discountedAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Buttons */}
        <div className="grid grid-cols-3 gap-4">
          <Button
            variant="contained"
            color="primary"
            className="capitalize py-3"
            onClick={() =>
              onPayment('ONLINE', {
                refId: payment.refId,
                totalAmount: payableAmount,
                payableAmount: payableAmount,
                discountedAmount: discountedAmount,
                discountAmount: payableAmount - discountedAmount,
                couponCode: selectedCoupon?.id,
              })
            }
            startIcon={<CreditCard />}
            disabled={true}
          >
            Pay Online
          </Button>
          <Button
            variant="outlined"
            color="primary"
            className="capitalize py-3"
            onClick={() =>
              onPayment('UPI', {
                refId: payment.refId,
                totalAmount: payableAmount,
                payableAmount: payableAmount,
                discountedAmount: discountedAmount,
                discountAmount: payableAmount - discountedAmount,
                couponCode: selectedCoupon?.id,
              })
            }
            startIcon={<Money />}
          >
            Pay UPI
          </Button>
          <Button
            variant="outlined"
            color="primary"
            className="capitalize py-3"
            onClick={() =>
              onPayment('CASH', {
                refId: payment.refId,
                totalAmount: payableAmount,
                payableAmount: payableAmount,
                discountedAmount: discountedAmount,
                discountAmount: payableAmount - discountedAmount,
                couponCode: selectedCoupon?.id,
              })
            }
            startIcon={<Money />}
          >
            Pay Cash
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// Invoice Preview Component
const InvoicePreview = ({ content }) => {
  console.log('content', content)
  return (
    <div className="w-full">
      {/* <TextJoedit
        placeholder="Invoice content will appear here..."
        content={content}
        readonly={true}
      /> */}
      <JoditEditor value={content} config={{ readonly: true }} />
    </div>
  )
}

export default AdvancePayments
