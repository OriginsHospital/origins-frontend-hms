import {
  createOtherAppointmentReason,
  getAppointmentsByVisitId,
  getDoctorsForAvailabilityTreatment,
  bookTreatmentAppointment,
  getAvailableTreatmentSlots,
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

export default function Appointments({ Treatments, selectedVisit }) {
  const QueryClient = useQueryClient()
  const dispatch = useDispatch()
  const [appointmentForm, setAppointmentForm] = React.useState({})
  const userDetails = useSelector((state) => state.user)

  const activeTreatment = Treatments?.length > 0 ? Treatments[0] : null

  const { data: visitAppointments } = useQuery({
    queryKey: ['visitAppointments', selectedVisit?.id],
    queryFn: () =>
      getAppointmentsByVisitId(userDetails?.accessToken, selectedVisit?.id),
    enabled: !!selectedVisit?.id,
  })

  const defaultBookBranchId = useMemo(() => {
    const appts = visitAppointments?.data
    if (appts?.length) {
      const latest = [...appts].sort(
        (a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate),
      )[0]
      if (latest?.branchId != null) return latest.branchId
    }
    return userDetails?.branchDetails?.[0]?.id
  }, [visitAppointments?.data, userDetails?.branchDetails])

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

  const bookingAppointment = useMutation({
    mutationFn: async (payload) => {
      const res = await bookTreatmentAppointment(
        userDetails.accessToken,
        payload,
      )
      if (res.status !== 400) {
        dispatch(closeSideDrawer())
        QueryClient.invalidateQueries(['visitAppointments'])
      }
    },
  })

  const handleBookAppointment = async () => {
    if (!activeTreatment?.id) {
      toast.error(
        'A treatment must be started before booking appointments',
        toastconfig,
      )
      return
    }

    let appointmentReasonId = appointmentForm?.appointmentReasonId
    if (appointmentForm?.appointmentReasonIsOther) {
      const customReason = appointmentForm?.appointmentReasonComment?.trim()
      if (!customReason) {
        toast.error('Please describe the reason for Others', toastconfig)
        return
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
        return
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
          return
        }
        appointmentReasonId = response.data.appointmentReasonId
      } catch (error) {
        toast.error('Could not save the custom appointment reason', toastconfig)
        return
      }
    }
    const payload = {
      date: appointmentForm?.date,
      doctorId: appointmentForm?.doctorId,
      treatmentCycleId: activeTreatment.id,
      timeStart: appointmentForm?.timeslot?.split('-')[0].trim(),
      timeEnd: appointmentForm?.timeslot?.split('-')[1].trim(),
      appointmentReasonId,
      branchId: appointmentForm?.branchId,
    }
    bookingAppointment.mutate(payload)
  }

  const appointments = visitAppointments?.data || []
  const canBookNew = selectedVisit?.isActive == 1

  return (
    <div className="bg-white px-5 py-3 rounded shadow">
      <Card variant="outlined" className="m-3 border mt-5">
        {activeTreatment ? (
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-secondary">
              {activeTreatment.type}
            </h3>
          </div>
        ) : null}

        <div className="p-4">
          <div className="grid md:grid-cols-4 lg:grid-cols-5 gap-4">
            {appointments.map((eachAppointment) => (
              <div
                className="p-2 flex flex-col rounded-lg shadow shadow-secondary"
                key={`${eachAppointment.appointmentSource}-${eachAppointment.appointmentId}`}
              >
                {eachAppointment.consultationType && (
                  <span className="text-xs text-gray-500 mb-1">
                    {eachAppointment.consultationType}
                  </span>
                )}
                <span
                  title={eachAppointment.doctorName}
                  className="max-w-48 text-nowrap text-ellipsis overflow-hidden font-semibold"
                >
                  {eachAppointment.doctorName}
                </span>
                <div className="flex justify-between font-thin">
                  <span>{eachAppointment.timeStart}</span>
                  <span>
                    {dayjs(eachAppointment.appointmentDate).format(
                      'DD-MM-YYYY',
                    )}
                  </span>
                </div>
              </div>
            ))}
            {canBookNew && (
              <Button
                className="flex gap-2 items-center capitalize text-sm"
                onClick={() => {
                  dispatch(openSideDrawer('new_appoitments_drawer'))
                  setAppointmentForm({
                    consultationId: 'Treatment',
                    branchId: defaultBookBranchId,
                  })
                }}
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
              Schedule Appointment
              {activeTreatment ? ` (${activeTreatment.type})` : ''}
            </p>
            <AppoinmentForm
              appointmentForm={appointmentForm}
              handleChangeForm={handleChangeForm}
              doctorsList={doctorsList?.data}
              setAppointmentForm={setAppointmentForm}
              availableSlots={availableSlots}
              handleBookAppointment={handleBookAppointment}
              appointmentId={activeTreatment?.id}
              visitTypeId={selectedVisit?.type}
            />
          </div>
        </SideDrawer>
      </Card>
    </div>
  )
}
