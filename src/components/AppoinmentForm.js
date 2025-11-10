import {
  Autocomplete,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import React from 'react'
import dayjs from 'dayjs'
import { useQuery } from '@tanstack/react-query'
import { getAllAppointmentsReasons } from '@/constants/apis'
import { useSelector } from 'react-redux'

export default function AppoinmentForm({
  appointmentForm,
  handleChangeForm,
  doctorsList,
  setAppointmentForm,
  availableSlots,
  handleBookAppointment,
  appointmentId,
}) {
  const user = useSelector(store => store.user)
  const dropdowns = useSelector(store => store.dropdowns)
  const { branches } = dropdowns
  //getAllAppointmentsReasons using useQuery
  const { data: appointmentReasons } = useQuery({
    queryKey: ['getAllAppointmentsReasons'],
    queryFn: async () => {
      const response = await getAllAppointmentsReasons(
        user?.accessToken,
        appointmentForm.consultationId,
        appointmentId,
      )
      console.log(response)
      return response.data
    },
  })

  return (
    <div className="flex flex-col gap-5">
      <DatePicker
        label="Appointment Date"
        format="DD/MM/YYYY"
        // disabled={isEdit == 'noneditable'}
        className="bg-white rounded-lg"
        value={appointmentForm?.date ? dayjs(appointmentForm?.date) : null}
        name="date"
        onChange={newValue =>
          setAppointmentForm({
            ...appointmentForm,
            date: dayjs(newValue).format('YYYY-MM-DD'),
          })
        }
      />

      <FormControl fullWidth>
        <Autocomplete
          options={branches || []}
          getOptionLabel={option => option.name}
          value={
            branches?.find(branch => branch.id === appointmentForm.branchId) ||
            null
          }
          onChange={(_, value) =>
            setAppointmentForm({
              ...appointmentForm,
              branchId: value?.id || null,
            })
          }
          renderInput={params => (
            <TextField {...params} label="Branch" fullWidth />
          )}
        />
      </FormControl>

      <FormControl fullWidth>
        <InputLabel id="demo-simple-select-label">Doctor</InputLabel>
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          className="bg-white rounded-lg"
          value={appointmentForm?.doctorId ? appointmentForm.doctorId : ''}
          name="doctorId"
          label="Doctor"
          onChange={handleChangeForm}
        >
          {doctorsList?.map(each => (
            <MenuItem key={each.doctorId} value={each.doctorId}>
              {each.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl fullWidth>
        <InputLabel id="demo-simple-select-label">Time Slot</InputLabel>
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          className="bg-white rounded-lg"
          value={appointmentForm?.timeslot ? appointmentForm.timeslot : ''}
          name="timeslot"
          label="Time Slot"
          onChange={handleChangeForm}
        >
          {availableSlots?.data?.map(each => (
            <MenuItem key={each} value={each}>
              {each}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Autocomplete
        options={appointmentReasons}
        getOptionLabel={option =>
          option.name +
          ' ( Rs.' +
          option.appointmentCharges +
          ' )' +
          (option.isSpouse === 1 ? ' - Male' : '')
        }
        onChange={(e, v) => {
          // console.log('on change', v.id, appointmentForm)
          setAppointmentForm({
            ...appointmentForm,
            appointmentReasonId: v?.id,
          })
        }}
        name="appointmentReasonId"
        renderInput={params => (
          <TextField
            {...params}
            label="Appointment Reason"
            className="min-w-56"
          />
        )}
      />
      <Button onClick={handleBookAppointment} variant="outlined">
        Book Appointment
      </Button>
    </div>
  )
}
