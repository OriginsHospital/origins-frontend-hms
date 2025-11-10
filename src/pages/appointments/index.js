import React, { useState, useCallback, useEffect } from 'react'

import { Board } from '@/components/Board'
import FlyoutLink from '@/components/FlyoutLink'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'
import {
  changeAppointmentStatus,
  getAllAppointmentsByDate,
} from '@/constants/apis'
import { toast } from 'react-toastify'
import { hideLoader, showLoader } from '@/redux/loaderSlice'
import dayjs from 'dayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { withPermission } from '@/components/withPermission'
import { ACCESS_TYPES } from '@/constants/constants'
import { useRouter } from 'next/router'
import { Autocomplete, TextField } from '@mui/material'

const Appointments = () => {
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  const [date, setDate] = useState()
  const userDetails = useSelector(store => store.user)
  const router = useRouter()
  const dropdowns = useSelector(store => store.dropdowns)
  const branches = userDetails?.branchDetails
  const [branchId, setBranchId] = useState(null)

  useEffect(() => {
    const date = router.query.date
    const branchId = router.query.branchId
    if (date) {
      // If date is provided in the query, set it
      setDate(dayjs(date))
    } else {
      setDate(dayjs(new Date()))
      router.push({ query: { date: dayjs(new Date()).format('YYYY-MM-DD') } })
    }
    if (branchId) {
      // If branchId is provided in the query, set it
      setBranchId(parseInt(branchId))
    } else if (branches.length > 0) {
      setBranchId(branches[0]?.id || null)
    }
  }, [router.query.date, router.query.branchId])
  const { data: allAppointmentsData } = useQuery({
    queryKey: ['allAppointments', userDetails?.accessToken, date, branchId],
    queryFn: async () => {
      dispatch(showLoader())
      const res = await getAllAppointmentsByDate(
        userDetails?.accessToken,
        dayjs(date).format('YYYY-MM-DD'),
        branchId,
      )
      dispatch(hideLoader())
      return res
    },
  })

  function handleDateChange(value) {
    setDate(value)
    router.push({ query: { date: dayjs(value).format('YYYY-MM-DD') } })
  }
  const handleBranchChange = (_, value) => {
    setBranchId(value?.id || null)
    router.push({
      query: {
        date: dayjs(date).format('YYYY-MM-DD'),
        branchId: value?.id || null,
      },
    })
  }
  const updateStage = useMutation({
    mutationFn: async payload => {
      dispatch(showLoader())
      const res = await changeAppointmentStatus(
        userDetails.accessToken,
        payload,
      )
      if (res.status === 200) {
        toast.success(res.message)
      } else {
        toast.error(res.message)
      }
      queryClient.invalidateQueries(['allAppointments'])
      dispatch(hideLoader())
    },
  })

  return (
    <div className="">
      <div className="flex justify-end p-3 gap-4">
        <div>
          <Autocomplete
            className="w-[120px]"
            options={branches || []}
            getOptionLabel={option => option?.branchCode || option?.name}
            value={branches?.find(branch => branch.id === branchId) || null}
            onChange={handleBranchChange}
            renderInput={params => <TextField {...params} fullWidth />}
            clearIcon={null}
          />
        </div>
        <DatePicker
          className="bg-white"
          value={date}
          format="DD/MM/YYYY"
          onChange={handleDateChange}
        />
      </div>
      <div className="bg-white rounded-lg m-2 border shadow h-[75vh]">
        <Board
          allAppointmentsData={allAppointmentsData}
          updateStage={updateStage}
        />
      </div>
    </div>
  )
}

export default withPermission(Appointments, true, 'appointment', [
  ACCESS_TYPES.READ,
  ACCESS_TYPES.WRITE,
])
