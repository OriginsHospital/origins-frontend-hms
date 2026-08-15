import React, { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'
import {
  Box,
  CircularProgress,
  Drawer,
  IconButton,
  Typography,
} from '@mui/material'
import { Close, EventAvailable } from '@mui/icons-material'
import {
  getPatientByAadharOrMobile,
  getVisitInfoById,
  getVisitsByPatientId,
} from '@/constants/apis'
import { openModal } from '@/redux/modalSlice'
import VisitDetail from './VisitDetail'
import Appointments from './Appointments'

export default function BookAppointmentDrawer({ patient, onClose }) {
  const dispatch = useDispatch()
  const userDetails = useSelector((store) => store.user)
  const [selectedVisit, setSelectedVisit] = useState({ id: '' })
  const open = Boolean(patient)

  const searchKey = patient?.patientId || patient?.id || ''

  const { data: patientRecord, isLoading: isPatientLoading } = useQuery({
    queryKey: ['bookAppointmentPatient', searchKey],
    queryFn: () =>
      getPatientByAadharOrMobile(userDetails?.accessToken, searchKey),
    enabled: open && !!userDetails?.accessToken && !!searchKey,
  })

  const formData = patientRecord?.data || null
  const patientNumericId = formData?.id

  const { data: visits, isLoading: isVisitsLoading } = useQuery({
    queryKey: ['visits', patientNumericId],
    queryFn: () =>
      getVisitsByPatientId(userDetails?.accessToken, patientNumericId),
    enabled: open && !!patientNumericId,
  })

  const { data: visitInfo } = useQuery({
    queryKey: ['visitInfo', selectedVisit?.id],
    queryFn: () =>
      getVisitInfoById(userDetails?.accessToken, selectedVisit?.id),
    enabled: open && !!selectedVisit?.id,
  })

  useEffect(() => {
    if (!open) {
      setSelectedVisit({ id: '' })
      return
    }
    if (visits?.data?.length > 0) {
      const activeVisit = visits.data.find((visit) => visit.isActive === 1)
      setSelectedVisit(activeVisit || visits.data[0])
      return
    }
    setSelectedVisit({ id: '' })
  }, [open, visits, searchKey])

  const handleChangeVisit = (event) => {
    if (event.target.value === 'createVisit') {
      dispatch(openModal('createVisit'))
      return
    }
    const nextVisit = visits?.data?.find(
      (visit) => visit.id === event.target.value,
    )
    if (nextVisit) setSelectedVisit(nextVisit)
  }

  const displayName =
    [formData?.firstName, formData?.lastName].filter(Boolean).join(' ') ||
    formData?.Name ||
    patient?.Name ||
    searchKey

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 620, md: 720 },
          maxWidth: '100%',
          background: '#f7fbfd',
        },
      }}
    >
      <div className="h-full flex flex-col min-h-0">
        <div className="flex items-start justify-between gap-3 px-5 py-4 bg-white border-b border-[#cfe4ee]">
          <div>
            <div className="flex items-center gap-2 text-[#0284b8]">
              <EventAvailable fontSize="small" />
              <Typography
                sx={{ fontWeight: 800, fontSize: 18, color: '#123047' }}
              >
                Book appointment
              </Typography>
            </div>
            <Typography sx={{ mt: 0.5, color: '#5a7384', fontSize: 13 }}>
              {displayName}
              {formData?.patientId ? ` · ${formData.patientId}` : ''}
            </Typography>
          </div>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isPatientLoading || isVisitsLoading ? (
            <Box className="flex justify-center items-center py-16">
              <CircularProgress size={28} />
            </Box>
          ) : !formData?.id ? (
            <div className="bg-white rounded-xl border border-[#cfe4ee] p-6 text-center text-[#5a7384]">
              Could not load this patient. Try View, then book from the visit
              tab.
            </div>
          ) : (
            <>
              <div className="bg-white rounded-xl border border-[#cfe4ee] p-3 mb-3">
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: 13,
                    mb: 1,
                    color: '#123047',
                  }}
                >
                  Select visit
                </Typography>
                <VisitDetail
                  formData={formData}
                  visits={visits}
                  selectedVisit={selectedVisit}
                  handleChangeVisit={handleChangeVisit}
                  setSelectedVisit={setSelectedVisit}
                  fullWidth
                />
              </div>
              {selectedVisit?.id ? (
                <>
                  {selectedVisit?.isActive !== 1 && (
                    <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                      This visit is closed. Select an active visit or create a
                      new one to book.
                    </div>
                  )}
                  <Appointments
                    Treatments={visitInfo?.data?.Treatments}
                    Consultations={visitInfo?.data?.Consultations}
                    selectedVisit={selectedVisit}
                    variant="panel"
                  />
                </>
              ) : (
                <div className="bg-white rounded-xl border border-dashed border-[#cfe4ee] p-6 text-center text-[#5a7384] text-sm">
                  Select or create a visit to book an appointment.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Drawer>
  )
}
