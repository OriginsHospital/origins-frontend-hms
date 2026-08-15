import {
  bookConsultationAppointment,
  bookTreatmentAppointment,
  createConsultationOrTreatment,
  createOtherAppointmentReason,
  getAppointmentsByVisitId,
  getAvailableTreatmentSlots,
  getDoctorsForAvailabilityTreatment,
} from '@/constants/apis'
import { Button, Card } from '@mui/material'
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query'
import React, { useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import AppoinmentForm from './AppoinmentForm'
import { CalendarIcon } from '@mui/x-date-pickers'
import { SideDrawer } from './SideDrawer'
import { FaPlusCircle } from 'react-icons/fa'
import { closeSideDrawer, openSideDrawer } from '@/redux/sideDrawerSlice'
import dayjs from 'dayjs'
import { toast } from 'react-toastify'
import { toastconfig } from '@/utils/toastconfig'

const INITIAL_CONSULTATION = 'Initial Consultation'
const FOLLOWUP_CONSULTATION = 'FollowUp Consultation'

function hasInitialConsultationAppointment(appointments = []) {
  return appointments.some(
    (appointment) =>
      appointment.appointmentSource === 'Consultation' &&
      appointment.consultationType === INITIAL_CONSULTATION,
  )
}

function getConsultationIdForReasons(consultations = [], appointments = []) {
  const initial = consultations.find(
    (consultation) => consultation.type === INITIAL_CONSULTATION,
  )
  if (!initial) return null
  if (!hasInitialConsultationAppointment(appointments)) {
    return initial.id
  }
  const followUps = consultations.filter(
    (consultation) => consultation.type === FOLLOWUP_CONSULTATION,
  )
  return followUps.length ? followUps[followUps.length - 1].id : null
}

async function ensureConsultationId({
  token,
  visitId,
  consultations = [],
  appointments = [],
}) {
  const initial = consultations.find(
    (consultation) => consultation.type === INITIAL_CONSULTATION,
  )

  if (!initial) {
    const response = await createConsultationOrTreatment(token, {
      createType: 'Consultation',
      visitId,
      type: INITIAL_CONSULTATION,
    })
    if (response?.status !== 200 || !response?.data?.id) {
      throw new Error(response?.message || 'Could not create consultation')
    }
    return response.data.id
  }

  if (!hasInitialConsultationAppointment(appointments)) {
    return initial.id
  }

  const followUps = consultations.filter(
    (consultation) => consultation.type === FOLLOWUP_CONSULTATION,
  )
  if (followUps.length) {
    return followUps[followUps.length - 1].id
  }

  const response = await createConsultationOrTreatment(token, {
    createType: 'Consultation',
    visitId,
    type: FOLLOWUP_CONSULTATION,
  })
  if (response?.status !== 200 || !response?.data?.id) {
    throw new Error(
      response?.message || 'Could not create follow-up consultation',
    )
  }
  return response.data.id
}

export default function Appointments({
  Treatments,
  Consultations,
  selectedVisit,
  variant = 'grid',
}) {
  const QueryClient = useQueryClient()
  const dispatch = useDispatch()
  const [appointmentForm, setAppointmentForm] = React.useState({})
  const userDetails = useSelector((state) => state.user)

  const activeTreatment = Treatments?.length > 0 ? Treatments[0] : null
  const isTreatmentMode = Boolean(activeTreatment?.id)
  const consultations = Consultations || []

  const { data: visitAppointments } = useQuery({
    queryKey: ['visitAppointments', selectedVisit?.id],
    queryFn: () =>
      getAppointmentsByVisitId(userDetails?.accessToken, selectedVisit?.id),
    enabled: !!selectedVisit?.id,
  })

  const appointments = visitAppointments?.data || []

  const reasonCycleId = useMemo(() => {
    if (isTreatmentMode) return activeTreatment.id
    return getConsultationIdForReasons(consultations, appointments)
  }, [isTreatmentMode, activeTreatment?.id, consultations, appointments])

  const defaultBookBranchId = useMemo(() => {
    if (appointments.length) {
      const latest = [...appointments].sort(
        (a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate),
      )[0]
      if (latest?.branchId != null) return latest.branchId
    }
    return userDetails?.branchDetails?.[0]?.id
  }, [appointments, userDetails?.branchDetails])

  const { data: doctorsList } = useQuery({
    queryKey: ['doctors', appointmentForm?.date, appointmentForm?.branchId],
    queryFn: () =>
      getDoctorsForAvailabilityTreatment(
        userDetails?.accessToken,
        appointmentForm?.date,
        appointmentForm?.branchId,
      ),
    enabled: !!appointmentForm?.date && appointmentForm?.branchId != null,
  })

  const { data: availableSlots } = useQuery({
    queryKey: [
      'availableSlots',
      appointmentForm?.date,
      appointmentForm?.doctorId,
    ],
    queryFn: () =>
      getAvailableTreatmentSlots(userDetails?.accessToken, {
        date: appointmentForm?.date,
        doctorId: appointmentForm?.doctorId,
      }),
    enabled: !!appointmentForm?.date && !!appointmentForm?.doctorId,
  })

  const handleChangeForm = (event) => {
    setAppointmentForm({
      ...appointmentForm,
      [event.target.name]: event.target.value,
    })
  }

  const invalidateAppointmentQueries = () => {
    QueryClient.invalidateQueries(['visitAppointments'])
    QueryClient.invalidateQueries(['visitInfo'])
  }

  const bookingAppointment = useMutation({
    mutationFn: async (payload) => {
      const bookFn = isTreatmentMode
        ? bookTreatmentAppointment
        : bookConsultationAppointment
      const res = await bookFn(userDetails.accessToken, payload)
      if (res.status === 400) {
        toast.error(res.message || 'Could not book appointment', toastconfig)
        return res
      }
      dispatch(closeSideDrawer())
      invalidateAppointmentQueries()
      toast.success(
        res.message || 'Appointment booked successfully',
        toastconfig,
      )
      return res
    },
  })

  const resolveAppointmentReasonId = async () => {
    let appointmentReasonId = appointmentForm?.appointmentReasonId
    if (!appointmentForm?.appointmentReasonIsOther) {
      return appointmentReasonId
    }

    const customReason = appointmentForm?.appointmentReasonComment?.trim()
    if (!customReason) {
      toast.error('Please describe the reason for Others', toastconfig)
      return null
    }

    const patientId =
      selectedVisit?.patientId ||
      selectedVisit?.patientID ||
      selectedVisit?.patient?.id
    if (!patientId) {
      toast.error(
        'Patient details are missing for this appointment',
        toastconfig,
      )
      return null
    }

    try {
      const response = await createOtherAppointmentReason(
        userDetails?.accessToken,
        {
          appointmentReasonName: customReason,
          patientId,
          isSpouse: 0,
        },
      )
      if (response?.status !== 200 || !response?.data?.appointmentReasonId) {
        toast.error(
          response?.message || 'Could not save the custom appointment reason',
          toastconfig,
        )
        return null
      }
      return response.data.appointmentReasonId
    } catch (error) {
      toast.error('Could not save the custom appointment reason', toastconfig)
      return null
    }
  }

  const handleBookAppointment = async () => {
    const appointmentReasonId = await resolveAppointmentReasonId()
    if (
      appointmentReasonId == null &&
      appointmentForm?.appointmentReasonIsOther
    ) {
      return
    }

    const timeStart = appointmentForm?.timeslot?.split('-')[0]?.trim()
    const timeEnd = appointmentForm?.timeslot?.split('-')[1]?.trim()
    if (
      !appointmentForm?.date ||
      !appointmentForm?.doctorId ||
      !timeStart ||
      !timeEnd ||
      !appointmentReasonId
    ) {
      toast.error('Please fill in all appointment details', toastconfig)
      return
    }

    const commonPayload = {
      date: appointmentForm.date,
      doctorId: appointmentForm.doctorId,
      timeStart,
      timeEnd,
      appointmentReasonId,
      branchId: appointmentForm.branchId,
    }

    if (isTreatmentMode) {
      bookingAppointment.mutate({
        ...commonPayload,
        treatmentCycleId: activeTreatment.id,
      })
      return
    }

    try {
      const consultationId = await ensureConsultationId({
        token: userDetails.accessToken,
        visitId: selectedVisit.id,
        consultations,
        appointments,
      })
      bookingAppointment.mutate({
        ...commonPayload,
        consultationId,
      })
    } catch (error) {
      toast.error(
        error.message || 'Could not prepare consultation for booking',
        toastconfig,
      )
    }
  }

  const canBookNew = selectedVisit?.isActive == 1
  const bookingContextLabel = isTreatmentMode
    ? activeTreatment.type
    : 'Consultation'

  const openBookingDrawer = () => {
    dispatch(openSideDrawer('new_appoitments_drawer'))
    setAppointmentForm({
      consultationId: isTreatmentMode ? 'Treatment' : 'Consultation',
      branchId: defaultBookBranchId,
    })
  }

  const isPanel = variant === 'panel'

  return (
    <div
      className={
        isPanel
          ? 'bg-white rounded-xl border border-[#cfe4ee] overflow-hidden'
          : 'bg-white px-5 py-3 rounded shadow'
      }
    >
      <Card
        variant="outlined"
        className={isPanel ? 'border-0 shadow-none' : 'm-3 border mt-5'}
      >
        <div
          className={
            isPanel
              ? 'px-3 py-2 border-b border-[#e6f1f6] flex items-center justify-between gap-2'
              : 'p-4 border-b'
          }
        >
          <h3
            className={
              isPanel
                ? 'text-sm font-semibold text-secondary'
                : 'text-lg font-semibold text-secondary'
            }
          >
            {bookingContextLabel}
          </h3>
          {isPanel && canBookNew ? (
            <Button
              size="small"
              className="flex gap-1.5 items-center capitalize text-xs"
              onClick={openBookingDrawer}
              variant="outlined"
              sx={{ minHeight: 30, py: 0.25, px: 1.25 }}
            >
              <FaPlusCircle size={13} />
              <span>New</span>
            </Button>
          ) : null}
        </div>

        <div className={isPanel ? '' : 'p-4'}>
          <div
            className={
              isPanel
                ? 'flex flex-col'
                : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
            }
          >
            {appointments.length === 0 && isPanel ? (
              <div className="px-3 py-4 text-sm text-[#5a7384]">
                No appointments yet for this visit.
              </div>
            ) : null}
            {appointments.map((eachAppointment) => (
              <div
                className={
                  isPanel
                    ? 'px-3 py-2 border-b border-[#eef5f8] last:border-b-0 flex items-center justify-between gap-3'
                    : 'p-3 flex flex-col rounded-lg shadow shadow-secondary min-w-0'
                }
                key={`${eachAppointment.appointmentSource}-${eachAppointment.appointmentId}`}
              >
                <div className="min-w-0 flex-1">
                  <div
                    className={
                      isPanel
                        ? 'flex items-center gap-2 min-w-0'
                        : 'flex flex-col'
                    }
                  >
                    {eachAppointment.consultationType ? (
                      <span className="text-[11px] font-semibold text-[#0284b8] shrink-0">
                        {eachAppointment.consultationType}
                      </span>
                    ) : null}
                    {isPanel && eachAppointment.consultationType ? (
                      <span className="text-[#c5d6df] shrink-0">·</span>
                    ) : null}
                    <span
                      title={eachAppointment.doctorName}
                      className={
                        isPanel
                          ? 'font-semibold text-sm text-[#123047] truncate'
                          : 'font-bold text-[#123047] break-words'
                      }
                    >
                      {eachAppointment.doctorName}
                    </span>
                  </div>
                  {eachAppointment.appointmentReason ? (
                    <div
                      className={
                        isPanel
                          ? 'mt-0.5 text-xs text-[#5a7384] truncate'
                          : 'mt-1 text-sm text-[#123047] break-words'
                      }
                    >
                      {eachAppointment.appointmentReason}
                    </div>
                  ) : null}
                </div>
                <div
                  className={
                    isPanel
                      ? 'shrink-0 text-right leading-tight'
                      : 'mt-1 flex justify-between gap-2 font-medium text-sm text-[#5a7384]'
                  }
                >
                  <span
                    className={
                      isPanel
                        ? 'block text-sm font-medium text-[#123047]'
                        : undefined
                    }
                  >
                    {eachAppointment.timeStart}
                  </span>
                  <span
                    className={
                      isPanel ? 'block text-xs text-[#5a7384]' : undefined
                    }
                  >
                    {dayjs(eachAppointment.appointmentDate).format(
                      'DD-MM-YYYY',
                    )}
                  </span>
                </div>
              </div>
            ))}
            {canBookNew && !isPanel && (
              <Button
                className="flex gap-2 items-center capitalize text-sm"
                onClick={openBookingDrawer}
                variant="outlined"
              >
                <FaPlusCircle size={20} />
                <span>New Appointment</span>
              </Button>
            )}
          </div>
        </div>

        <SideDrawer
          closeOnOutsideClick={true}
          uniqueKey="new_appoitments_drawer"
        >
          <div>
            <p className="text-2xl font-semibold text-secondary flex items-center py-5 gap-4">
              <CalendarIcon />
              Schedule Appointment ({bookingContextLabel})
            </p>
            <AppoinmentForm
              appointmentForm={appointmentForm}
              handleChangeForm={handleChangeForm}
              doctorsList={doctorsList?.data}
              setAppointmentForm={setAppointmentForm}
              availableSlots={availableSlots}
              handleBookAppointment={handleBookAppointment}
              appointmentId={reasonCycleId}
              visitTypeId={selectedVisit?.type}
            />
          </div>
        </SideDrawer>
      </Card>
    </div>
  )
}
