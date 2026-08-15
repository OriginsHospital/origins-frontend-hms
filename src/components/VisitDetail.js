import { createVisit } from '@/constants/apis'
import {
  Button,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Table,
} from '@mui/material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import Modal from './Modal'
import CreateVisit from './CreateVisit'
import { toast } from 'react-toastify'
import { closeModal, openModal } from '@/redux/modalSlice'
import { Close } from '@mui/icons-material'

export default function VisitDetail({
  formData,
  visits,
  selectedVisit,
  handleChangeVisit,
  setSelectedVisit,
  fullWidth = false,
}) {
  const userDetails = useSelector((store) => store.user)
  const QueryClient = useQueryClient()
  const dispatch = useDispatch()
  const dropdowns = useSelector((store) => store.dropdowns)
  // const modal = useSelector((store) => store.modal)

  function getPackageNameById(id) {
    const chosenPackage = dropdowns.packagesChosen.filter(
      (pkg) => pkg.id === id,
    )
    return chosenPackage ? chosenPackage[0].name : null
  }
  function getVisitById(id) {
    const visit = dropdowns.visitTypes.filter((vst) => vst.id === id)
    // console.log('getVisitById', id, visit);
    return visit ? visit[0].name : null
  }
  // const [open, setOpen] = useState(false)

  const [visitForm, setVisitForm] = useState()
  useEffect(() => {
    setVisitForm({
      patientId: formData?.id,
      type: '',
      visitDate: '',
    })
  }, [formData])
  const handleFormChange = (event) => {
    setVisitForm({ ...visitForm, [event.target.name]: event.target.value })
  }
  const handleClose = () => {
    console.log('close called')
    setVisitForm({
      patientId: formData?.id,
      type: '',
      visitDate: '',
      packageChosen: '',
    })
    // setOpen(false);
    dispatch(closeModal())
  }
  const validateMutate = useMutation({
    mutationFn: async (payload) => {
      const res = await createVisit(userDetails.accessToken, payload)
      console.log('under mutation fn', res)
      if (res.status === 400) {
        toast.error(res.message)
      } else if (res.status === 200) {
        //set newly created visit to selectedVisit
        setSelectedVisit(res.data)
      }
      handleClose()
      // setIsValidUsers(1)
    },
    onSuccess: () => {
      QueryClient.invalidateQueries(
        'visits',
        // {
        //     queryKey: ['visits']
        // }
      )
    },
  })

  const handleSubmit = () => {
    console.log(visitForm)
    const mut = validateMutate.mutate(visitForm)

    console.log(mut)
  }

  return (
    <div className={fullWidth ? 'w-full' : 'flex justify-end mb-5'}>
      <FormControl
        fullWidth={fullWidth}
        size={fullWidth ? 'small' : 'medium'}
        className={fullWidth ? 'w-full' : ''}
      >
        {!fullWidth && (
          <InputLabel id="visit-label">
            {selectedVisit ? '' : 'New Visit'}
          </InputLabel>
        )}
        <Select
          value={
            visits?.data?.length === 0
              ? 'No Visits Available'
              : selectedVisit
                ? selectedVisit.id
                : ''
          }
          labelId={fullWidth ? undefined : 'visit-label'}
          label={fullWidth ? undefined : selectedVisit ? '' : 'New Visit'}
          name="visit"
          displayEmpty={fullWidth}
          className={`bg-white rounded-lg ${fullWidth ? 'w-full' : 'min-w-48'} outline-none border-none`}
          sx={
            fullWidth
              ? {
                  minHeight: 40,
                  '& .MuiOutlinedInput-notchedOutline': {
                    legend: { display: 'none' },
                  },
                  '& .MuiSelect-select': {
                    display: 'flex',
                    alignItems: 'center',
                    py: '8px !important',
                  },
                }
              : { height: 48 }
          }
          renderValue={
            fullWidth
              ? (value) => {
                  if (!visits?.data?.length) return 'No Visits Available'
                  const index = visits.data.findIndex(
                    (visit) => visit.id === value,
                  )
                  const visit = visits.data[index]
                  if (!visit) return ''
                  return (
                    <span className="flex items-center justify-between gap-3 w-full min-w-0">
                      <span className="truncate text-sm text-[#123047]">
                        {index + 1}. {getVisitById(visit.type)}
                      </span>
                      {visit.isActive === 1 ? (
                        <span className="shrink-0 bg-[#dcfce7] rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#16a34a]">
                          active
                        </span>
                      ) : null}
                    </span>
                  )
                }
              : undefined
          }
          onChange={handleChangeVisit}
        >
          {visits?.data?.length === 0 ? (
            <MenuItem value="No Visits Available" selected>
              No Visits Available
            </MenuItem>
          ) : (
            visits?.data?.map((each, index) => (
              <MenuItem key={each.id} value={each.id} dense>
                <span className="flex items-center justify-between gap-3 w-full min-w-0">
                  <span className="truncate text-sm text-[#123047]">
                    {index + 1}. {getVisitById(each.type)}
                  </span>
                  {each.isActive === 1 ? (
                    <span className="shrink-0 bg-[#dcfce7] rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#16a34a]">
                      active
                    </span>
                  ) : null}
                </span>
              </MenuItem>
            ))
          )}
          <MenuItem
            className="text-secondary px-3 py-2 cursor-pointer"
            value="createVisit"
            dense
          >
            Create new Visit
          </MenuItem>
        </Select>
      </FormControl>

      <Modal
        // open={true}
        // title={'Create new visit'}
        uniqueKey="createVisit"
        closeOnOutsideClick={true}
        maxWidth={'xs'}
        // handleClose={handleClose}
        // handleSubmit={handleSubmit}
      >
        <div className="flex justify-between">
          <span className="text-xl font-semibold text-secondary flex items-center py-5 gap-4">
            Create New Visit
          </span>
          <IconButton onClick={() => dispatch(closeModal())}>
            <Close />
          </IconButton>
        </div>
        <CreateVisit
          handleClose={handleClose}
          setVisitForm={setVisitForm}
          visitForm={visitForm}
          handleFormChange={handleFormChange}
          handleSubmit={handleSubmit}
        />
      </Modal>
    </div>
  )
}
