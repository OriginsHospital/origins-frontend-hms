import {
  Autocomplete,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  TextField,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import React, { useEffect } from 'react'
import dayjs from 'dayjs'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
// import { getAllAppointmentsReasons } from '@/constants/apis'
import { useDispatch, useSelector } from 'react-redux'
import { closeModal } from '@/redux/modalSlice'
import {
  bookReviewCallConsultationAppointment,
  getAppointmentReasonsByPatientType,
  getAvailableConsultationSlots,
} from '@/constants/apis'
import { toast } from 'react-toastify'
import { toastconfig } from '@/utils/toastconfig'

function ReviewCallForm({
  appointmentId,
  type,
  patientInfo,
  reviewAppointmentForm,
  setReviewAppointmentForm,
  // selectedPatient,
  // setSelectedPatient,
}) {
  const userDetails = useSelector(state => state.user)
  const { branches } = useSelector(store => store.dropdowns)
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const { data: availableSlots, isLoading: isLoadingAvailableSlots } = useQuery(
    {
      queryKey: [
        'ReviewCallAvailableSlots',
        reviewAppointmentForm?.date,
        userDetails?.id,
      ],
      queryFn: () =>
        getAvailableConsultationSlots(userDetails?.accessToken, {
          date: reviewAppointmentForm?.date,
          doctorId: userDetails?.id,
        }),
      enabled: !!reviewAppointmentForm?.date && !!userDetails?.id,
    },
  )
  useEffect(() => {
    console.log(availableSlots)
  }, [availableSlots])

  const { data: appointmentReasons, isLoading: isLoadingReasons } = useQuery({
    queryKey: ['appointmentReasonsByPatientType', patientInfo?.patientTypeId],
    queryFn: async () => {
      const response = await getAppointmentReasonsByPatientType(
        userDetails?.accessToken,
        patientInfo?.patientTypeId,
      )
      return response.data
    },
    enabled: !!patientInfo?.patientTypeId && !!userDetails?.accessToken,
  })

  const bookingAppointment = useMutation({
    mutationFn: async payload => {
      const res = await bookReviewCallConsultationAppointment(
        userDetails.accessToken,
        payload,
      )
      if (res.status === 400) {
        toast.error(res.message, toastconfig)
      } else {
        toast.success(res.message, toastconfig)
        dispatch(closeModal('reviewCall'))
        queryClient.invalidateQueries('appointmentsForDoctor')
        // setSelectedPatient({ ...selectedPatient, isReviewCall: true })
      }
    },
  })
  const handleBookAppointment = () => {
    const payload = {
      currentAppointmentId: appointmentId,
      type: type,
      date: reviewAppointmentForm?.date,
      patientId: patientInfo?.id,
      doctorId: userDetails?.id,
      timeStart: reviewAppointmentForm?.timeslot?.split('-')[0].trim(),
      timeEnd: reviewAppointmentForm?.timeslot?.split('-')[1].trim(),
      appointmentReasonId: reviewAppointmentForm?.appointmentReasonId,
      branchId: reviewAppointmentForm?.branchId,
    }
    console.log(payload)
    bookingAppointment.mutate(payload)
  }
  return (
    <div className="flex flex-col gap-5">
      <FormControl className="min-w-[30%]">
        <Autocomplete
          options={branches || []}
          getOptionLabel={option => option.name}
          value={
            branches?.find(
              branch => branch.id === reviewAppointmentForm?.branchId,
            ) || null
          }
          onChange={(_, value) =>
            setReviewAppointmentForm({
              ...reviewAppointmentForm,
              branchId: value?.id || null,
            })
          }
          renderInput={params => (
            <TextField {...params} label="Branch" fullWidth />
          )}
        />
      </FormControl>
      <DatePicker
        label="Appointment Date"
        format="DD/MM/YYYY"
        // disabled={isEdit == 'noneditable'}
        className="bg-white rounded-lg"
        value={
          reviewAppointmentForm?.date
            ? dayjs(reviewAppointmentForm?.date)
            : null
        }
        name="date"
        onChange={newValue =>
          setReviewAppointmentForm({
            ...reviewAppointmentForm,
            date: dayjs(newValue).format('YYYY-MM-DD'),
            timeslot: '',
          })
        }
      />
      {reviewAppointmentForm?.date && (
        <FormControl fullWidth>
          <InputLabel id="demo-simple-select-label">Time Slot</InputLabel>
          <Select
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            className="bg-white rounded-lg"
            value={
              reviewAppointmentForm?.timeslot
                ? reviewAppointmentForm.timeslot
                : ''
            }
            name="timeslot"
            label="Time Slot"
            onChange={e =>
              setReviewAppointmentForm({
                ...reviewAppointmentForm,
                timeslot: e.target.value,
              })
            }
          >
            {' '}
            {isLoadingAvailableSlots ? (
              <Skeleton />
            ) : (
              availableSlots?.data?.map(each => (
                <MenuItem key={each} value={each}>
                  {each}
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>
      )}
      <Autocomplete
        options={appointmentReasons || []}
        getOptionLabel={option => option.name}
        loading={isLoadingReasons}
        onChange={(e, value) => {
          setReviewAppointmentForm({
            ...reviewAppointmentForm,
            appointmentReasonId: value?.id,
          })
        }}
        renderInput={params => (
          <TextField
            {...params}
            label="Appointment Reason"
            className="bg-white rounded-lg"
          />
        )}
      />
      <div className="flex justify-end">
        <Button onClick={handleBookAppointment} variant="outlined">
          Book Appointment
        </Button>
      </div>
    </div>
  )
}

export default ReviewCallForm
