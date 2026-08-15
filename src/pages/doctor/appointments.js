import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import { TabContext } from '@mui/lab'
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Tab,
  Box,
  TableContainer,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Card,
  Avatar,
  Alert,
  AlertTitle,
  TextField,
  Autocomplete,
  IconButton,
  Tooltip,
  Chip,
  Divider,
} from '@mui/material'
import {
  getAppointmentsForDoctor,
  getPatientInformationForDoctor,
  getAppointmentsHistory,
  getLineBillsAndNotesForAppointment,
  getChecklistByPatientId,
  getSavedLabTestResult,
  getAppointmentsByPatient,
  getAllPatients,
  closeVisit,
  closeVisitInConsultation,
  applyMarkAsSeenForDoctorAppointment,
  downloadOPDSheet,
  downloadPDF,
} from '@/constants/apis'
import dayjs from 'dayjs'
import Image from 'next/image'
import {
  ExpandMore,
  DetailsSharp,
  SearchOutlined,
  Close,
  Phone,
  CheckCircle,
  Visibility,
  ArrowBack,
  Download,
} from '@mui/icons-material'
import dummyProfile from '../../../public/dummyProfile.jpg'
import Modal from '@/components/Modal'
import { openModal, closeModal } from '@/redux/modalSlice'
import OPDSheet from '@/components/OPDSheet'
import { DateCalendar } from '@mui/x-date-pickers'
import dynamic from 'next/dynamic'
import DischargeSummarSheet from '@/components/DischargeSummarSheet'
import DischargeCard from '@/components/DischargeCard'
import PickupSheet from '@/components/PickupSheet'
import { hideLoader, showLoader } from '@/redux/loaderSlice'
import { useRouter } from 'next/router'
import RichText from '@/components/RichText'
import EmbryologyHistory from '@/components/EmbryologyHistory'
import PatientHistory from '@/components/PatientHistory'
import VitalsInformation from '@/components/VitalsInformation'
import AntenatalLmpEddForm from '@/components/AntenatalLmpEddForm'
import Prescription from '@/components/Prescription'
import TreatmentCycleHistoryView from '@/components/TreatmentCycleHistoryView'
import { isIuiTreatment } from '@/utils/treatmentTypeUtils'
import PatientDetailsSkeleton from '@/fallbacks/PatientDetailsSkeleton'
import { openFutureCycleForDoctorPatient } from '@/components/FutureCycleModal'
import { canScheduleFutureCycle } from '@/utils/patientTreatmentUtils'
import OpdSummaryDisplay from '@/components/OpdSummaryDisplay'
import { toast } from 'react-toastify'
import s from 'aws-s3'
import styles from './appointments.module.css'

const actionButtonSx = {
  minHeight: 44,
  px: 2.25,
  fontWeight: 700,
  textTransform: 'none',
  borderWidth: 2,
  '&:hover': { borderWidth: 2 },
}

const accordionSx = {
  border: '1px solid #b7e8e4',
  borderRadius: '12px !important',
  boxShadow: 'none',
  overflow: 'hidden',
  '&:before': { display: 'none' },
  mb: 1.25,
}

const JoditEditor = dynamic(() => import('jodit-react'), {
  ssr: false,
})
function TextJoedit({ placeholder, contents, onBlur }) {
  const editor = useRef(null)

  return (
    <JoditEditor
      ref={editor}
      value={contents}
      tabIndex={1} // tabIndex of textarea
      // onBlur={onBlur} // preferred to use only this option to update the content for performance reasons
      config={{
        readonly: true,
        removeButtons: [
          'video',
          'table',
          'code',
          'link',
          'speechRecognize',
          'speech',
          'image',
          'file',
          // 'print',
          'copy',
          'cut',
          'paste',
          'undo',
          'redo',
          'bold',
          'italic',
          'underline',
          'strikethrough',
          'superscript',
          'subscript',
          'align',
          'lineHeight',
          'letterSpacing',
          'text',
          'color',
          'backgroundColor',
          'font',
          'fontsize',
          'paragraph',
          'blockquote',
          'hr',
          'list',
          'indent',
          'outdent',
          'align',
          'fullScreen',
          'preview',
          'left',
          'center',
          'right',
          'justify',
          'clean',
          'symbols',
          'ai-commands',
          'about',
          'eraser',
          'ul',
          'ol',
          'spellcheck',
          'ai-assistant',
          'brush',
          'dots',
          'copyformat',
          'selectall',
          'classSpan',
          'source',
          'find',
        ],
      }}
    />
  )
}
export function PatientDetails({
  patientInfo,
  selectedPatient,
  // setSelectedPatient,
  user,
  searchTab,
}) {
  const {
    photoPath,
    firstName,
    lastName,
    dateOfBirth,
    gender,
    maritalStatus,
    mobileNo,
    aadhaarNo,
    cityName,
    referralType,
    bloodGroup,
    spouseBloodGroup,
  } = patientInfo
  const dispatch = useDispatch()
  const queryClient = useQueryClient()

  const handleMarkAsSeen = async () => {
    if (selectedPatient?.isCompleted) {
      toast.error('Already marked as seen')
      return
    }
    const isConfirmed = window.confirm(
      'Are you sure you want to apply mark as seen for this appointment?',
    )
    if (isConfirmed) {
      const { appointmentId, type } = selectedPatient
      try {
        const response = await applyMarkAsSeenForDoctorAppointment(
          user.accessToken,
          { type: type, appointmentId: appointmentId },
        )
        if (response.status === 200) {
          toast.success('Marked as seen successfully')
          // setSelectedPatient({
          //   patientId: '',
          //   branchId: '',
          //   appointmentId: '',
          //   type: '',
          //   treatmentCycleId: '',
          //   consultationId: '',
          //   appointmentReason: '',

          //   isCompleted: 0,
          //   isReviewCall: null,
          //   reviewCallInfo: null,
          // })
        } else if (response?.status === 400) {
          toast.error(response?.message)
        } else {
          toast.error('Failed to mark as seen')
        }
        queryClient.invalidateQueries('appointmentsForDoctor')
      } catch (error) {
        console.log(error)
        toast.error('An error occurred while marking as seen')
      }
    }
  }

  const initials = `${(lastName || '').charAt(0)}${(firstName || '').charAt(0)}`
    .toUpperCase()
    .trim()
  const ageYears = dateOfBirth
    ? `${dayjs().diff(dayjs(dateOfBirth), 'year')} years`
    : 'N/A'

  return (
    <div className={styles.profileCard}>
      <div className={styles.profileBanner}>
        {photoPath && photoPath != 'null' ? (
          <div onClick={() => dispatch(openModal('profileFullScreen'))}>
            <Image
              src={photoPath}
              alt={'Patient Photo'}
              className={styles.avatar}
              width={72}
              height={72}
            />
          </div>
        ) : (
          <Avatar
            className={styles.avatar}
            sx={{
              width: 72,
              height: 72,
              bgcolor: '#d7f6f4',
              color: '#0a7370',
              fontWeight: 800,
              fontSize: 22,
            }}
            onClick={() => dispatch(openModal('profileFullScreen'))}
          >
            {initials || 'P'}
          </Avatar>
        )}
        <div className={styles.profileIdentity}>
          <h2 className={styles.profileName}>{`${lastName} ${firstName}`}</h2>
          <div className={styles.profileMeta}>
            <span className={styles.phoneChip}>
              <Phone sx={{ fontSize: 16 }} />
              {mobileNo || 'N/A'}
            </span>
            {selectedPatient?.type && (
              <span className={styles.typeChip}>{selectedPatient.type}</span>
            )}
            {selectedPatient?.timeStart && (
              <span className={styles.typeChip}>
                {selectedPatient.timeStart}
              </span>
            )}
          </div>
        </div>
        {searchTab === 'date' && (
          <div>
            {selectedPatient?.isCompleted === 1 ? (
              <Chip
                label="Seen"
                sx={{
                  height: 34,
                  fontWeight: 800,
                  bgcolor: '#e8f8f2',
                  color: '#0b7a56',
                }}
              />
            ) : (
              <Tooltip title="Mark as seen">
                <Button
                  onClick={handleMarkAsSeen}
                  startIcon={<AssignmentTurnedInIcon />}
                  sx={{
                    minHeight: 36,
                    px: 1.75,
                    fontWeight: 800,
                    textTransform: 'none',
                    bgcolor: '#fff',
                    color: '#0a7370',
                    boxShadow: 'none',
                    '&:hover': { bgcolor: '#e6faf8', boxShadow: 'none' },
                  }}
                >
                  Mark seen
                </Button>
              </Tooltip>
            )}
          </div>
        )}
      </div>

      <div className={styles.demoGrid}>
        {[
          ['Age', ageYears],
          ['Marital Status', maritalStatus || 'N/A'],
          ['City', cityName || 'N/A'],
          ['Referral Type', referralType || 'N/A'],
          ['Blood Group', bloodGroup || 'N/A'],
          ['Spouse Blood Group', spouseBloodGroup || 'N/A'],
        ].map(([label, value]) => (
          <div className={styles.statTile} key={label}>
            <span className={styles.statLabel}>{label}</span>
            <span className={styles.statValue} title={value}>
              {value}
            </span>
          </div>
        ))}
      </div>
      <Modal
        uniqueKey={'profileFullScreen'}
        onClose={() => dispatch(closeModal())}
        maxWidth={'lg'}
      >
        <div className="flex flex-col">
          <div className="flex justify-end">
            <IconButton onClick={() => dispatch(closeModal())}>
              <Close />
            </IconButton>
          </div>
          <div className="flex justify-center items-center h-[80vh]">
            <img
              src={photoPath || dummyProfile}
              alt="Profile"
              className="max-h-full max-w-full object-contain"
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}

const getOutcomeFromText = (text = '') => {
  const value = String(text).toLowerCase()
  if (value.includes('positive')) return 'Positive'
  if (value.includes('negative')) return 'Negative'
  return null
}

const getTreatmentCloseReason = (treatment) => {
  const visitCloseReason = treatment?.visitClosedReason?.trim()
  const treatmentEndReason = treatment?.closeCancelReason?.trim()
  return visitCloseReason || treatmentEndReason || null
}

function ConsultationsAndTreatments({
  consultations,
  treatments,
  date,
  patientInfo,
  checklistData,
  isChecklistDataLoading,
  onActiveTreatmentCycleChange,
}) {
  const user = useSelector((store) => store.user)
  const { billTypes } = useSelector((store) => store.dropdowns)
  const dispatch = useDispatch()

  const [horizontalTabInModal, setHorizontalTabInModal] = useState('')
  const [clickedConsultationOrTreatment, setClickedConsultationOrTreatment] =
    useState({
      type: '', // Consultation | Treatment
      id: '', // consultationId | treatmentId
    })

  const [clickedAppointment, setclickedAppointment] = useState({
    type: '', // Consultation | Treatment
    appointmentId: '',
  })

  const { data: appointmentHistory, isLoading: isAppointmentHistoryLoading } =
    useQuery({
      queryKey: ['appointmentHistory', clickedConsultationOrTreatment],
      enabled: !!(
        clickedConsultationOrTreatment.id && clickedConsultationOrTreatment.type
      ),
      queryFn: async () => {
        const responsejson = await getAppointmentsHistory(
          user.accessToken,
          clickedConsultationOrTreatment.type,
          clickedConsultationOrTreatment.id,
          date.format('YYYY-MM-DD'),
        )
        console.log(date)
        if (responsejson.status == 200) {
          return responsejson.data
        } else {
          throw new Error(
            'Error occurred while fetching patient information for doctor',
          )
        }
      },
    })

  const {
    data: lineBillsAndNotesData,
    isLoading: islineBillsAndNotesDataLoading,
  } = useQuery({
    queryKey: ['lineBillsAndNotes', clickedAppointment],
    enabled: !!(clickedAppointment.appointmentId && clickedAppointment.type),
    queryFn: async () => {
      dispatch(showLoader())
      const responsejson = await getLineBillsAndNotesForAppointment(
        user.accessToken,
        clickedAppointment.type,
        clickedAppointment.appointmentId,
      )
      dispatch(hideLoader())
      if (responsejson.status == 200) {
        return responsejson.data
      } else {
        throw new Error(
          'Error occurred while fetching patient information for doctor',
        )
      }
    },
  })
  const [selectedTest, setSelectedTest] = useState(null)

  const { data: reportData, isLoading: isReportDataLoading } = useQuery({
    queryKey: ['report', selectedTest],
    enabled: !!selectedTest,
    queryFn: async () => {
      const responsejson = await getSavedLabTestResult(
        user.accessToken,
        selectedTest?.type,
        selectedTest?.appointmentId,
        selectedTest?.billTypeValue,
        selectedTest?.isSpouse,
      )
      if (responsejson.status == 200) {
        const { labTestResult } = responsejson.data
        return labTestResult
      }
      throw new Error('Error while fetching saved lab result')
    },
  })

  function onAccordionClick(type, id, isExpanded) {
    if (isExpanded) {
      setClickedConsultationOrTreatment({
        type: type,
        id: id,
      })
      if (type === 'Treatment') {
        onActiveTreatmentCycleChange?.(id)
      }
    } else {
      setClickedConsultationOrTreatment({
        type: '',
        id: '',
      })
      if (type === 'Treatment') {
        onActiveTreatmentCycleChange?.(null)
      }
    }
  }

  function showPrescriptionHandler(type, appointmentId) {
    // console.log('type', type)
    // console.log('appointmentId', appointmentId)
    setclickedAppointment({
      type,
      appointmentId,
    })
    dispatch(openModal('appointmentLineBillsAndNotes'))
  }

  function renderRespectiveAppointments(
    clickedConsultationOrTreatmentType,
    iteratedType,
    clickedConsultationOrTreatmentId,
    iteratedId,
  ) {
    // const [PreviewReport, setPreviewReport] = useState(false)
    if (
      clickedConsultationOrTreatmentType == iteratedType &&
      clickedConsultationOrTreatmentId == iteratedId
    ) {
      return (
        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
          {appointmentHistory?.map((eachAppointment, i) => (
            <div
              className={styles.historyCard}
              key={
                eachAppointment.appointmentId +
                clickedConsultationOrTreatmentType
              }
            >
              <div className="flex flex-col justify-between gap-2">
                <span className="text-sm font-medium">
                  {eachAppointment.doctorName}
                </span>
                <span className="text-xs text-gray-500">
                  {dayjs(eachAppointment.appointmentDate).format('DD-MM-YYYY')}
                </span>
              </div>
              <IconButton
                onClick={() =>
                  showPrescriptionHandler(
                    clickedConsultationOrTreatmentType,
                    eachAppointment.appointmentId,
                  )
                }
              >
                <Visibility />
              </IconButton>
            </div>
          ))}
          {lineBillsAndNotesData && (
            <Modal
              maxWidth={'md'}
              uniqueKey="appointmentLineBillsAndNotes"
              closeOnOutsideClick={true}
            >
              <div className={styles.modalHeader}>
                <span className={styles.modalTitle}>Prescription</span>
                <IconButton onClick={() => dispatch(closeModal())}>
                  <Close />
                </IconButton>
              </div>
              <div>
                {isReportDataLoading && (
                  <div className="h-full flex justify-center items-center">
                    <span className="opacity-50">{'Loading...'}</span>
                  </div>
                )}
              </div>
              {!selectedTest ? (
                <div className="h-[30rem] flex flex-col">
                  {/* <Typography className="p-3 border rounded" variant="body2">
                  {lineBillsAndNotesData?.notesData?.notes
                    ? lineBillsAndNotesData.notesData.notes
                    : 'No notes provided'}
                </Typography> */}
                  <RichText
                    value={
                      lineBillsAndNotesData?.notesData?.notes ||
                      'No notes provided'
                    }
                    readOnly={true}
                  />
                  {lineBillsAndNotesData?.lineBillsData?.length > 0 ? (
                    <TabContext value={horizontalTabInModal}>
                      <Box
                        sx={{
                          paddingTop: '12px',
                          paddingLeft: '12px',
                          borderBottom: 1,
                          borderColor: 'divider',
                        }}
                      >
                        <TabList
                          onChange={(e, newTab) => {
                            setHorizontalTabInModal(newTab)
                          }}
                          aria-label="line bills and notes"
                        >
                          {lineBillsAndNotesData?.lineBillsData?.map((bill) => (
                            <Tab
                              key={bill.billType.id}
                              label={bill.billType.name}
                              value={bill.billType.name}
                            />
                          ))}
                        </TabList>
                      </Box>
                      {lineBillsAndNotesData?.lineBillsData?.map((bill) => (
                        <TabPanel
                          className="p-3"
                          key={bill.billType.id}
                          value={bill.billType.name}
                        >
                          {bill.billTypeValues.length > 0 ? (
                            <TableContainer>
                              <Table>
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Name</TableCell>
                                    {bill.billType?.id == 3 && (
                                      <TableCell>Quantity</TableCell>
                                    )}
                                    {bill.billType?.id != 3 && (
                                      <TableCell>Report</TableCell>
                                    )}
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {bill.billTypeValues?.map((value) => (
                                    <TableRow key={value.id}>
                                      <TableCell>{value.name}</TableCell>
                                      {bill.billType?.id == 3 && (
                                        <TableCell>
                                          {value.prescribedQuantity}
                                        </TableCell>
                                      )}
                                      {bill.billType?.id != 3 && (
                                        <TableCell>
                                          <IconButton
                                            onClick={() => {
                                              setSelectedTest({
                                                type: bill.type,
                                                appointmentId:
                                                  bill.appointmentId,
                                                billTypeValue: value.id,
                                                isSpouse: 0,
                                              })
                                              // setPreviewReport(true)
                                            }}
                                          >
                                            <Visibility />
                                          </IconButton>
                                        </TableCell>
                                      )}
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          ) : (
                            <div className="h-full flex justify-center items-center">
                              <span className="opacity-50">{'No Data'}</span>
                            </div>
                          )}
                        </TabPanel>
                      ))}
                    </TabContext>
                  ) : (
                    <div className="grow flex justify-center items-center">
                      <span className="opacity-50">{'No Line Bills Data'}</span>
                    </div>
                  )}
                </div>
              ) : !!reportData ? (
                <div>
                  <div className="flex justify-between">
                    <IconButton onClick={() => setSelectedTest(null)}>
                      <ArrowBack />
                    </IconButton>
                  </div>
                  <div className="h-[70vh] overflow-y-auto w-full ">
                    {reportData?.includes('.pdf') ? (
                      <iframe
                        src={reportData}
                        alt="Report"
                        className="w-full h-full"
                      />
                    ) : (
                      <TextJoedit contents={reportData} readOnly={true} />
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-full flex justify-center items-center">
                  <span className="opacity-50">{'No Report Data'}</span>
                </div>
              )}
            </Modal>
          )}
        </div>
      )
    } else return <span className="opacity-50"> No Appointments History</span>
  }

  useEffect(() => {
    if (
      lineBillsAndNotesData?.lineBillsData?.length > 0 &&
      !horizontalTabInModal
    ) {
      setHorizontalTabInModal(
        lineBillsAndNotesData.lineBillsData[0].billType.name,
      )
    }
  }, [lineBillsAndNotesData])

  return (
    <div className="flex flex-col gap-3 p-3">
      <OpdSummaryDisplay patientId={patientInfo?.id} />
      {/* Check List Accordion */}
      <Accordion defaultExpanded sx={accordionSx}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-800">Check List</span>
            {checklistData && checklistData?.length > 0 && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {checklistData[0]?.labTestsList?.length || 0} tests
              </span>
            )}
          </div>
        </AccordionSummary>
        <AccordionDetails>
          {isChecklistDataLoading ? (
            <span className="opacity-50">{'Loading...'}</span>
          ) : checklistData && checklistData?.length == 0 ? (
            <span className="opacity-50">{'No Check List'}</span>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 ">
              {checklistData &&
                checklistData[0]?.labTestsList?.map((test, index) => (
                  <Box
                    key={index}
                    className="flex flex-col justify-between gap-2 rounded-xl border border-[#b7e8e4] bg-[#f0fbfa] p-3"
                  >
                    <div className="flex justify-between w-full">
                      <span className="text-xs text-gray-500">
                        {billTypes.find(
                          (billType) => billType.id == test.billTypeId,
                        )?.name || ''}
                      </span>
                      <span className="text-xs text-gray-500">
                        {dayjs(test.appointmentDate).format('DD-MM-YYYY')}
                      </span>
                    </div>
                    <div className="flex gap-2 justify-between w-full">
                      <span className="text-md capitalize font-medium">
                        {test.labTestName}
                      </span>
                      <IconButton
                        onClick={() => {
                          setSelectedTest(test)
                          dispatch(openModal('viewReport'))
                        }}
                        className="hover:text-secondary"
                      >
                        <Visibility />
                      </IconButton>
                    </div>
                  </Box>
                ))}
            </div>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Consultations Accordion */}
      <Accordion sx={accordionSx}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-800">Consultations</span>
            {consultations && consultations?.length > 0 && (
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                {consultations.length} consultations
              </span>
            )}
          </div>
        </AccordionSummary>
        <AccordionDetails>
          {consultations?.length > 0 ? (
            <div className="flex flex-col">
              {consultations.map((eachConsultation, i) => (
                <Accordion
                  key={'consultation' + eachConsultation.consultationId}
                  sx={accordionSx}
                  expanded={
                    clickedConsultationOrTreatment.type == 'Consultation' &&
                    eachConsultation.consultationId ==
                      clickedConsultationOrTreatment.id
                  }
                  onChange={(e, isExpanded) => {
                    onAccordionClick(
                      'Consultation',
                      eachConsultation.consultationId,
                      isExpanded,
                    )
                  }}
                >
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <div className="flex justify-start gap-5 items-center">
                      <span className="font-semibold text-secondary">
                        {eachConsultation.consultationType}
                      </span>
                      <span className="text-xs">
                        {dayjs(eachConsultation.consultationDate).format(
                          'DD-MM-YYYY',
                        )}
                      </span>
                    </div>
                  </AccordionSummary>
                  <AccordionDetails>
                    {clickedConsultationOrTreatment.type == 'Consultation' &&
                      eachConsultation.consultationId ==
                        clickedConsultationOrTreatment.id &&
                      renderRespectiveAppointments(
                        clickedConsultationOrTreatment.type,
                        'Consultation',
                        clickedConsultationOrTreatment.id,
                        eachConsultation.consultationId,
                      )}
                  </AccordionDetails>
                </Accordion>
              ))}
            </div>
          ) : (
            <div className="h-full">
              <span className="opacity-50">{'No Consultations'}</span>
            </div>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Treatments Accordion */}
      <Accordion sx={accordionSx}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-800">Treatments</span>
            {treatments && treatments?.length > 0 && (
              <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                {treatments.length} treatments
              </span>
            )}
          </div>
        </AccordionSummary>
        <AccordionDetails>
          {treatments?.length > 0 ? (
            <div className="flex flex-col">
              {treatments.map((eachTreatment, i) => {
                const closeReason = getTreatmentCloseReason(eachTreatment)
                const outcome =
                  getOutcomeFromText(eachTreatment.visitClosedReason) ||
                  getOutcomeFromText(eachTreatment.closeCancelReason)
                return (
                  <Accordion
                    key={'treatmentCycle' + eachTreatment.treatmentCycleId}
                    sx={accordionSx}
                    expanded={
                      clickedConsultationOrTreatment.type == 'Treatment' &&
                      eachTreatment.treatmentCycleId ==
                        clickedConsultationOrTreatment.id
                    }
                    onChange={(e, isExpanded) => {
                      onAccordionClick(
                        'Treatment',
                        eachTreatment.treatmentCycleId,
                        isExpanded,
                      )
                    }}
                  >
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <div className="flex flex-wrap gap-3 items-center w-full pr-2">
                        <span>
                          {dayjs(eachTreatment.treatmentDate).format(
                            'DD-MM-YYYY',
                          )}
                        </span>
                        <span className="font-medium">
                          {eachTreatment.treatmentType}
                        </span>
                        {closeReason && (
                          <span
                            className="text-xs text-gray-600 max-w-xs truncate"
                            title={closeReason}
                          >
                            Close: {closeReason}
                          </span>
                        )}
                        {outcome && (
                          <Chip
                            label={outcome}
                            size="small"
                            color={outcome === 'Positive' ? 'success' : 'error'}
                          />
                        )}
                      </div>
                    </AccordionSummary>
                    <AccordionDetails>
                      {clickedConsultationOrTreatment.type == 'Treatment' &&
                        eachTreatment.treatmentCycleId ==
                          clickedConsultationOrTreatment.id && (
                          <div className="flex flex-col gap-3">
                            {renderRespectiveAppointments(
                              clickedConsultationOrTreatment.type,
                              'Treatment',
                              clickedConsultationOrTreatment.id,
                              eachTreatment.treatmentCycleId,
                            )}
                            <Divider className="my-2" />
                            <TreatmentCycleHistoryView
                              treatmentCycleId={eachTreatment.treatmentCycleId}
                              treatmentType={eachTreatment.treatmentType}
                            />
                          </div>
                        )}
                    </AccordionDetails>
                  </Accordion>
                )
              })}
            </div>
          ) : (
            <div className="h-full">
              <span className="opacity-50">{'No Treatments'}</span>
            </div>
          )}
        </AccordionDetails>
      </Accordion>

      <Modal uniqueKey="viewReport" closeOnOutsideClick={true} maxWidth="lg">
        <div className="flex justify-between gap-4">
          <span className="text-xl font-semibold text-secondary">Report</span>
          <IconButton onClick={() => dispatch(closeModal())}>
            <Close />
          </IconButton>
        </div>
        <div>
          {reportData ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-[70vh] overflow-y-auto">
              <div className="col-span-1">
                <div className="flex flex-col gap-2 border p-4 rounded-lg">
                  <span className="">
                    Latest Vitals of{' '}
                    <i className="font-medium text-secondary">
                      {checklistData[0]?.latestVitals?.patientName}
                    </i>
                  </span>
                  <Divider className="my-2" />
                  {
                    // <VitalsInformation
                    //   vitals={checklistData[0]?.latestVitals}
                    // />
                    // .map((vitals, index) => (
                    //   <div key={index}>
                    //     <span>{vitals.vitalsName}</span>
                    //     <span>{vitals.vitalsValue}</span>
                    //   </div>
                    // ))
                    checklistData[0]?.latestVitals ? (
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          'bp',
                          'bmi',
                          'height',
                          'weight',
                          'initials',
                          'vitalsTakenTime',
                          'notes',
                        ].map((key, index) => (
                          <div key={index} className="flex flex-col">
                            <span className="text-sm font-medium capitalize">
                              {key}
                            </span>
                            {(() => {
                              switch (key) {
                                case 'bp':
                                  return (
                                    <span className="text-sm opacity-75">
                                      {checklistData[0].latestVitals[key]} mmHg
                                    </span>
                                  )
                                case 'bmi':
                                  return (
                                    <span className="text-sm opacity-75">
                                      {checklistData[0].latestVitals[key]} kg/m2
                                    </span>
                                  )
                                case 'height':
                                  return (
                                    <span className="text-sm opacity-75">
                                      {checklistData[0].latestVitals[key]}
                                    </span>
                                  )
                                case 'weight':
                                  return (
                                    <span className="text-sm opacity-75">
                                      {checklistData[0].latestVitals[key]} kg
                                    </span>
                                  )
                                case 'vitalsTakenTime':
                                  return (
                                    <span className="text-sm opacity-75">
                                      {dayjs(
                                        checklistData[0].latestVitals[key],
                                      ).format('DD-MM-YYYY')}
                                    </span>
                                  )
                                case 'notes':
                                  return (
                                    <span className="text-sm col-span-2 opacity-75">
                                      {checklistData[0].latestVitals[key]}
                                    </span>
                                  )
                                default:
                                  return (
                                    <span className="text-sm opacity-75">
                                      {checklistData[0].latestVitals[key]}
                                    </span>
                                  )
                              }
                            })()}
                          </div>
                        ))}
                      </div>
                    ) : null
                  }
                </div>
              </div>
              <div className="col-span-3">
                {/* <span>{reportData}</span> */}

                {reportData?.startsWith('http') ? (
                  <iframe src={reportData} className="w-full h-full" />
                ) : (
                  <TextJoedit contents={reportData} />
                )}
              </div>
            </div>
          ) : (
            <span className="opacity-50">No Report Data</span>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default function Appointments() {
  const dispatch = useDispatch()
  const router = useRouter()
  const user = useSelector((store) => store.user)
  const queryClient = useQueryClient()
  const [date, setDate] = useState(dayjs())
  const [activeHistoryTreatmentCycleId, setActiveHistoryTreatmentCycleId] =
    useState(null)
  const [selectedPatient, setSelectedPatient] = useState({
    patientId: '',
    branchId: '',
    appointmentId: '',
    type: '',
    treatmentCycleId: '',
    consultationId: '',
    appointmentReason: '',
    isSpouse: 0,
    isCompleted: 0,
    isReviewCall: null,
    reviewCallInfo: null,
  })
  const selectedPatientRef = useRef(selectedPatient)

  useEffect(() => {
    selectedPatientRef.current = selectedPatient
  }, [selectedPatient])

  useEffect(() => {
    setActiveHistoryTreatmentCycleId(null)
  }, [selectedPatient?.patientId, selectedPatient?.appointmentId])

  const resolveSelectedAppointment = (appointments, query = {}) => {
    if (!appointments?.length) return null

    const { appointmentId, type, patientId } = query
    const currentSelection = selectedPatientRef.current

    if (appointmentId && type) {
      const matchedByQuery = appointments.find(
        (each) =>
          String(each.appointmentId) === String(appointmentId) &&
          each.type === type,
      )
      if (matchedByQuery) return matchedByQuery
    }

    if (currentSelection?.appointmentId) {
      const matchedByCurrentAppointment = appointments.find(
        (each) =>
          String(each.appointmentId) === String(currentSelection.appointmentId),
      )
      if (matchedByCurrentAppointment) return matchedByCurrentAppointment
    }

    const patientKey = patientId || currentSelection?.patientId
    if (patientKey) {
      const patientAppointments = appointments.filter(
        (each) => each.patientId === patientKey,
      )
      if (patientAppointments.length === 1) {
        return patientAppointments[0]
      }
      if (currentSelection?.type) {
        const matchedByType = patientAppointments.find(
          (each) => each.type === currentSelection.type,
        )
        if (matchedByType) return matchedByType
      }
      if (patientAppointments.length > 0) {
        return patientAppointments[0]
      }
    }

    return appointments[0]
  }

  const { data: appointmentsData, isLoading: isAppointmentsLoading } = useQuery(
    {
      queryKey: ['appointmentsForDoctor', date],
      enabled: !!date,
      queryFn: async () => {
        dispatch(showLoader())
        const responsejson = await getAppointmentsForDoctor(
          user.accessToken,
          date.format('YYYY-MM-DD'),
        )
        dispatch(hideLoader())
        if (responsejson.status == 200) {
          if (responsejson?.data?.length == 0) {
            setSelectedPatient(null)
          } else {
            const nextSelectedPatient = resolveSelectedAppointment(
              responsejson.data,
              router.query,
            )
            if (nextSelectedPatient) {
              setSelectedPatient(nextSelectedPatient)
            }
          }
          return responsejson.data
        } else {
          throw new Error(
            'Error occurred while fetching appointments for doctor',
          )
        }
      },
    },
  )

  const { data: patientDetails, isLoading: isPatientDetailsLoading } = useQuery(
    {
      queryKey: ['patientInfoForDoctor', selectedPatient],
      enabled: !!selectedPatient?.patientId,
      queryFn: async () => {
        const responsejson = await getPatientInformationForDoctor(
          user.accessToken,
          selectedPatient?.patientId,
          selectedPatient?.appointmentId,
          selectedPatient?.type,
        )
        if (responsejson.status == 200) {
          return responsejson.data
        } else {
          throw new Error(
            'Error occurred while fetching patient information for doctor',
          )
        }
      },
    },
  )
  const { data: checklistData, isLoading: isChecklistDataLoading } = useQuery({
    queryKey: ['checklist', selectedPatient],
    enabled: !!selectedPatient?.patientId,
    queryFn: async () => {
      const responsejson = await getChecklistByPatientId(
        user.accessToken,
        selectedPatient?.patientId,
      )
      return responsejson.data
    },
  })

  const isCurrentTreatmentIui = useMemo(() => {
    const activeCycle = patientDetails?.treatments?.find(
      (t) => t.treatmentCycleId === selectedPatient?.treatmentCycleId,
    )
    return isIuiTreatment({
      treatmentTypeId:
        patientDetails?.patientInfo?.treatmentDetails?.treatmentTypeId,
      treatementType:
        patientDetails?.patientInfo?.treatmentDetails?.treatementType,
      treatmentType: activeCycle?.treatmentType,
    })
  }, [
    patientDetails?.patientInfo?.treatmentDetails,
    patientDetails?.treatments,
    selectedPatient?.treatmentCycleId,
  ])

  const sheetTreatmentCycleId =
    activeHistoryTreatmentCycleId || selectedPatient?.treatmentCycleId

  const [searchTab, setSearchTab] = useState('date') // 'date' or 'patient'
  const [selectedSearchPatient, setSelectedSearchPatient] = useState(null)
  const [patientSearchQuery, setPatientSearchQuery] = useState('')
  const [shouldFetchPatients, setShouldFetchPatients] = useState(false)

  const { data: patientAppointments } = useQuery({
    queryKey: ['patientAppointments', selectedSearchPatient],
    enabled: !!selectedSearchPatient,
    queryFn: async () => {
      dispatch(showLoader())
      const responsejson = await getAppointmentsByPatient(
        user.accessToken,
        selectedSearchPatient,
      )
      dispatch(hideLoader())
      if (responsejson.status == 200) {
        return responsejson.data
      } else {
        throw new Error('Error occurred while fetching patient appointments')
      }
    },
  })

  const { data: patientsList } = useQuery({
    queryKey: ['patientsList', patientSearchQuery],
    enabled: searchTab === 'patient' && shouldFetchPatients,
    queryFn: async () => {
      dispatch(showLoader())
      const response = await getAllPatients(
        user.accessToken,
        patientSearchQuery,
      )
      dispatch(hideLoader())
      if (response.status === 200) {
        setShouldFetchPatients(false) // Reset after fetch
        return response.data
      }
      throw new Error('Failed to fetch patients')
    },
  })

  function handleDateChange(value) {
    // const d = new Date()
    // d.setFullYear(value.$y, value.$M, value.$D)
    // const dateString = d.toLocaleDateString()
    //value.$y, value.$M, value.$D

    setDate(value)
    router.push(
      {
        pathname: router.pathname + '/',
        query: {
          date: dayjs(value).format('YYYY-MM-DD'),
          searchBy: 'date',
        },
      },
      undefined,
      { shallow: true },
    )
  }

  function onAppointmentClick(appointment) {
    setSelectedPatient(appointment)
    router.push(
      {
        pathname: router.pathname + '/',
        query: {
          ...router.query,
          patientId: appointment.patientId,
          appointmentId: appointment.appointmentId,
          type: appointment.type,
          consultationId: appointment.consultationId,
          date: dayjs(date).format('YYYY-MM-DD'),
        },
      },
      undefined,
      { shallow: true },
    )
  }
  const handleCloseVisit = async (appointmentId) => {
    try {
      dispatch(showLoader())
      // find the appointment object to determine its type (Consultation or Treatment)
      const appointment =
        appointmentsData?.find((a) => a.appointmentId == appointmentId) ||
        patientAppointments?.find((a) => a.appointmentId == appointmentId)

      // If appointment is a consultation, use the consultation-specific API
      if (appointment && appointment.type === 'Consultation') {
        // confirmation popup
        if (!confirm('Are you sure you want to close this visit?')) {
          dispatch(hideLoader())
          return
        }

        // Check if patientDetails is loaded (required for getting the numeric patient ID)
        if (!patientDetails || !patientDetails.patientInfo) {
          toast.error(
            'Patient information is still loading. Please wait a moment and try again.',
          )
          dispatch(hideLoader())
          return
        }

        // Get the visitId from patientDetails (activeVisitId) or from appointment data
        const visitId =
          patientDetails?.patientInfo?.activeVisitId ||
          appointment?.visitId ||
          appointment?.visit_id

        if (!visitId) {
          toast.error(
            'Visit ID not found. Please refresh the page and try again.',
          )
          dispatch(hideLoader())
          return
        }

        // Get patientId - backend expects the auto-increment ID (pm.id), not the patientId string
        // patientDetails.patientInfo.id is the auto-increment ID from patient_master
        const patientIdNum = Number(patientDetails.patientInfo.id)

        if (!patientIdNum || isNaN(patientIdNum) || patientIdNum === 0) {
          console.error('Patient ID validation failed:', {
            patientDetails: patientDetails?.patientInfo,
            selectedPatient,
            appointment,
            calculatedId: patientIdNum,
          })
          toast.error(
            'Invalid patient ID. Please refresh the page and try again.',
          )
          dispatch(hideLoader())
          return
        }

        // Ensure consultationId and appointmentId are numbers
        const consultationIdNum = Number(appointment.consultationId)
        const appointmentIdNum = Number(appointment.appointmentId)

        if (isNaN(consultationIdNum) || isNaN(appointmentIdNum)) {
          toast.error(
            'Invalid consultation or appointment ID. Please refresh the page and try again.',
          )
          dispatch(hideLoader())
          return
        }

        const payload = {
          patientId: patientIdNum,
          type: 'Consultation',
          appointmentId: appointmentIdNum,
          consultationId: consultationIdNum,
          visitClosedStatus: 'Completed',
          visitClosedReason: 'Closed from Appointments',
        }

        const res = await closeVisitInConsultation(
          user.accessToken,
          payload,
          visitId,
        )

        if (res && (res.status === 200 || res.status === 'success')) {
          toast.success(res.message || 'Visit closed successfully')
          queryClient.invalidateQueries(['appointmentsForDoctor', date])
          queryClient.invalidateQueries([
            'patientInfoForDoctor',
            selectedPatient,
          ])
        } else {
          toast.error(res.message || 'Failed to close visit')
        }
      } else {
        // fallback / existing treatment close
        const result = await closeVisit(user.accessToken, appointmentId)
        if (result && (result.status === 'success' || result.status === 200)) {
          toast.success(result.message || 'Visit closed successfully')
          queryClient.invalidateQueries(['appointmentsForDoctor', date])
          queryClient.invalidateQueries([
            'patientInfoForDoctor',
            selectedPatient,
          ])
        } else {
          toast.error(result.message || 'Failed to close visit')
        }
      }
    } catch (error) {
      console.error('Error closing visit:', error)
      toast.error('Error closing visit: ' + (error.message || 'Unknown error'))
    } finally {
      dispatch(hideLoader())
    }
  }

  useEffect(() => {
    const { date, searchBy } = router.query

    // console.log(date)
    if (searchBy == 'date' && date) {
      setDate(dayjs(date))
      setSearchTab('date')
    } else if (searchBy == 'patient') {
      // setDate(dayjs(new Date()))
      setSearchTab('patient')
      // router.push(
      //   {
      //     pathname: router.pathname + '/',
      //     query: {
      //       ...router.query,
      //       // date: dayjs(new Date()).format('YYYY-MM-DD'),
      //       searchBy: 'patient',
      //     },
      //   },
      //   undefined,
      //   { shallow: true },
      // )
    } else {
      setSearchTab('date')
      setDate(dayjs(new Date()))
    }
  }, [])

  // useEffect(() => {
  //   if (searchTab == 'date') {
  //     const {
  //       patientId,
  //       appointmentId,
  //       type,
  //       treatmentCycleId,
  //       vitalInfo,
  //       consultationId,
  //       appointmentReason,
  //     } = router.query
  //     // console.log(checklistData)
  //     if (patientId) {
  //       setSelectedPatient({
  //         patientId,
  //         appointmentId,
  //         type,
  //         treatmentCycleId,
  //         vitalInfo,
  //         consultationId,
  //         appointmentReason,
  //       })
  //     } else if (appointmentsData?.length > 0) {
  //       const firstAppointment = appointmentsData?.[0]
  //       setSelectedPatient({
  //         patientId: firstAppointment?.patientId,
  //         appointmentId: firstAppointment?.appointmentId,
  //         type: firstAppointment?.type,
  //         treatmentCycleId: firstAppointment?.treatmentCycleId,
  //         vitalInfo: firstAppointment?.vitalInfo,
  //         consultationId: firstAppointment?.consultationId,
  //         appointmentReason: firstAppointment?.appointmentReason,
  //       })
  //       router.push(
  //         {
  //           pathname: router.pathname + '/',
  //           query: {
  //             patientId: firstAppointment.patientId,
  //             appointmentId: firstAppointment.appointmentId,
  //             type: firstAppointment.type,
  //             treatmentCycleId: firstAppointment.treatmentCycleId,
  //             vitalInfo: firstAppointment.vitalInfo,
  //             consultationId: firstAppointment.consultationId,
  //             date: dayjs(date).format('YYYY-MM-DD'),
  //             appointmentReason: firstAppointment.appointmentReason,
  //           },
  //         },
  //         undefined,
  //         { shallow: true },
  //       )
  //     }
  //   }
  // }, [router.query])

  // Update the PatientHistory button click handler
  const handlePatientHistoryClick = (patientInfo) => {
    router.push(
      {
        pathname: router.pathname,
        query: {
          ...router.query,
          patientHistoryId: patientInfo.patientId,
          activeVisitId: patientInfo.activeVisitId,
          date: dayjs(date).format('YYYY-MM-DD'),
        },
      },
      undefined,
      { shallow: true },
    )
  }

  // Add effect to handle URL params for patient history
  useEffect(() => {
    const { patientHistoryId, activeVisitId } = router.query
    if (patientHistoryId && patientDetails?.patientInfo) {
      dispatch(openModal(patientHistoryId + 'History'))
    }
  }, [router.query, patientDetails])

  const { mutate: downloadOpdSheet } = useMutation({
    mutationFn: async () => {
      if (!patientDetails?.patientInfo?.id) {
        throw new Error('Patient information not available')
      }
      const response = await downloadOPDSheet(
        user.accessToken,
        patientDetails.patientInfo.id,
      )
      if (response.status === 200) {
        downloadPDF(response)
        toast.success('OPD Sheet downloaded successfully')
      } else if (response.status === 400) {
        toast.error(response.data?.message || 'Data not found')
      } else {
        toast.error(response.data?.message || 'Error downloading OPD sheet')
      }

      return response
    },
  })

  return (
    <div className={styles.page}>
      <div className={styles.sidebar}>
        <TabContext value={searchTab}>
          <Box
            className={styles.sidebarCard}
            sx={{ borderBottom: 0, px: 1, pt: 0.5 }}
          >
            <TabList
              onChange={(e, newValue) => {
                setSearchTab(newValue)
                router.push(
                  {
                    pathname: router.pathname,
                    query: {
                      searchBy: newValue,
                    },
                  },
                  undefined,
                  { shallow: true },
                )
              }}
              variant="fullWidth"
            >
              <Tab label="Search by Date" value="date" />
              <Tab label="Search by Patient" value="patient" />
            </TabList>
          </Box>

          <TabPanel value="date" className="p-0">
            <div className={`${styles.sidebarCard} ${styles.calendarWrap}`}>
              <DateCalendar
                value={date}
                format="DD/MM/YYYY"
                onChange={handleDateChange}
              />
            </div>
          </TabPanel>

          <TabPanel value="patient" className="p-0">
            <div className={`${styles.sidebarCard} p-4`}>
              <Autocomplete
                fullWidth
                options={patientsList || []}
                getOptionLabel={(option) =>
                  `${option.Name} (ID: ${option.patientId})`
                }
                onChange={(event, newValue) => {
                  setSelectedSearchPatient(newValue?.id || null)
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search Patient"
                    onChange={(e) => {
                      setPatientSearchQuery(e.target.value)
                      if (e.target.value.trim()) {
                        setShouldFetchPatients(true)
                      }
                    }}
                    // InputProps={{
                    //   ...params.InputProps,
                    //   endAdornment: (
                    //     <>
                    //       {params.InputProps.endAdornment}
                    //       <SearchOutlined className="text-gray-400 cursor-pointer" />
                    //     </>
                    //   ),
                    // }}
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} className="p-2">
                    <div className="flex items-center gap-3">
                      {option.photoPath ? (
                        <img
                          src={option.photoPath}
                          alt={option.Name}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <Avatar>{option.Name?.[0]}</Avatar>
                      )}
                      <div className="flex flex-col">
                        <span className="font-medium">{option.Name}</span>
                        <span className="text-sm text-gray-500">
                          ID: {option.patientId} | {option.mobileNo}
                        </span>
                      </div>
                    </div>
                  </li>
                )}
              />
            </div>
          </TabPanel>
        </TabContext>

        <div className={`${styles.sidebarCard} ${styles.listPanel}`}>
          {searchTab === 'date'
            ? // Show date-based appointments
              appointmentsData?.map((eachAppointment, i) => (
                <button
                  className={`${styles.apptItem} ${
                    selectedPatient?.appointmentId ==
                    eachAppointment.appointmentId
                      ? styles.apptItemSelected
                      : ''
                  }`}
                  key={eachAppointment.appointmentId}
                  onClick={() => {
                    onAppointmentClick(eachAppointment)
                  }}
                >
                  {eachAppointment?.photoPath &&
                  eachAppointment?.photoPath != 'null' ? (
                    <img
                      src={eachAppointment?.photoPath}
                      className="h-11 w-11 rounded-full object-cover"
                      alt=""
                    />
                  ) : (
                    <Avatar sx={{ width: 44, height: 44 }} />
                  )}
                  <div className={styles.apptMeta}>
                    <span
                      title={eachAppointment.patientName}
                      className={styles.apptName}
                    >
                      {eachAppointment.firstName}
                    </span>
                    <span className={styles.apptType}>
                      {eachAppointment.type}
                    </span>
                  </div>
                  {(eachAppointment.appointmentReason === 'Gynec' ||
                    eachAppointment.appointmentReason === 'Antenatal' ||
                    eachAppointment.appointmentReason === 'ANC/ZYN') && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCloseVisit(eachAppointment.appointmentId)
                      }}
                      disabled={eachAppointment.status === 'CLOSED'}
                      size="small"
                      variant={
                        eachAppointment.status === 'CLOSED'
                          ? 'outlined'
                          : 'contained'
                      }
                      color="error"
                      sx={{
                        minHeight: 34,
                        px: 1.5,
                        fontWeight: 700,
                        textTransform: 'none',
                        fontSize: '0.72rem',
                      }}
                    >
                      {eachAppointment.status === 'CLOSED' ? 'Closed' : 'Close'}
                    </Button>
                  )}
                  <div
                    className={`${styles.timeBadge} ${
                      eachAppointment.isCompleted ? styles.timeBadgeDone : ''
                    }`}
                  >
                    {eachAppointment.isCompleted ? (
                      <CheckCircle fontSize="small" />
                    ) : (
                      <span>{eachAppointment.timeStart}</span>
                    )}
                  </div>
                </button>
              ))
            : // Show patient-based appointments
              patientAppointments?.map((eachAppointment, i) => (
                <button
                  className={`${styles.apptItem} ${
                    selectedPatient?.appointmentId ===
                    eachAppointment.appointmentId
                      ? styles.apptItemSelected
                      : ''
                  }`}
                  key={eachAppointment.appointmentId}
                  onClick={() => {
                    onAppointmentClick(eachAppointment)
                  }}
                >
                  <div className={styles.apptMeta}>
                    <span className={styles.apptName}>
                      {dayjs(eachAppointment.appointmentDate).format(
                        'DD-MM-YYYY',
                      )}
                    </span>
                    <span className={styles.apptType}>
                      {eachAppointment.type}
                    </span>
                  </div>
                  <div className={styles.timeBadge}>
                    {eachAppointment.timeStart}
                  </div>
                </button>
              ))}

          {((searchTab === 'date' && appointmentsData?.length === 0) ||
            (searchTab === 'patient' && patientAppointments?.length === 0)) && (
            <div className={styles.emptyState}>
              {searchTab === 'date'
                ? 'No appointments for this day'
                : 'No appointments found for this patient'}
            </div>
          )}
        </div>
      </div>
      <div className={styles.main}>
        {isPatientDetailsLoading ? (
          <div className="h-full flex justify-center items-center">
            <PatientDetailsSkeleton />
          </div>
        ) : patientDetails ? (
          <>
            <div className="grid grid-cols-1 gap-5 p-4 lg:grid-cols-2">
              <div className="flex flex-col gap-5">
                <PatientDetails
                  patientInfo={patientDetails?.patientInfo}
                  selectedPatient={selectedPatient}
                  // setSelectedPatient={setSelectedPatient}
                  user={user}
                  searchTab={searchTab}
                />
              </div>
              <div className="flex flex-col gap-5">
                {/* <span className="text-lg font-semibold">Vitals Information</span> */}
                <div className={styles.toolbar}>
                  <Button
                    variant="outlined"
                    sx={actionButtonSx}
                    onClick={() => dispatch(openModal('EmbryologyHistory'))}
                  >
                    Embryology
                  </Button>
                  {canScheduleFutureCycle({
                    patientInfo: patientDetails?.patientInfo,
                  }) && (
                    <Button
                      type="button"
                      variant="outlined"
                      sx={actionButtonSx}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        openFutureCycleForDoctorPatient(
                          dispatch,
                          patientDetails?.patientInfo,
                        )
                      }}
                    >
                      Future Cycle
                    </Button>
                  )}
                  <div className={styles.opdSplit}>
                    <Button
                      variant="outlined"
                      sx={{
                        ...actionButtonSx,
                        borderTopRightRadius: 0,
                        borderBottomRightRadius: 0,
                      }}
                      onClick={() => dispatch(openModal('OPDSheet'))}
                    >
                      OPD sheet
                    </Button>
                    <Tooltip title="Download OPD sheet">
                      <span
                        className="flex h-11 w-11 cursor-pointer items-center justify-center bg-red-600 text-white"
                        onClick={() => downloadOpdSheet()}
                      >
                        <Download />
                      </span>
                    </Tooltip>
                  </div>
                  <PatientHistory
                    patient={patientDetails?.patientInfo}
                    onClose={() => {
                      const { patientHistoryId, activeVisitId, ...restQuery } =
                        router.query
                      router.push(
                        {
                          pathname: router.pathname,
                          query: restQuery,
                        },
                        undefined,
                        { shallow: true },
                      )
                    }}
                  />
                </div>
                {checklistData && (
                  <VitalsInformation vitals={selectedPatient?.vitalInfo} />
                )}
                <AntenatalLmpEddForm
                  patientInfo={patientDetails?.patientInfo}
                  selectedPatient={selectedPatient}
                  accessToken={user.accessToken}
                  onSaved={({ lmp, edd }) => {
                    setSelectedPatient((prev) => ({
                      ...prev,
                      lmp,
                      edd,
                    }))
                    queryClient.invalidateQueries({
                      queryKey: ['patientInfoForDoctor'],
                    })
                    queryClient.invalidateQueries({
                      queryKey: ['appointmentsForDoctor'],
                    })
                    queryClient.invalidateQueries({
                      queryKey: ['patientAppointments'],
                    })
                  }}
                />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {selectedPatient?.appointmentReason && (
                    <Alert
                      severity="info"
                      className={`${
                        !patientDetails?.patientInfo?.treatmentDetails
                          ? 'col-span-2'
                          : ''
                      }`}
                    >
                      <AlertTitle className="text-xs">
                        Appointment Reason
                      </AlertTitle>
                      <Tooltip
                        title={
                          <div>
                            <strong>
                              {selectedPatient?.appointmentReason}
                            </strong>
                          </div>
                        }
                      >
                        <div className="line-clamp-2">
                          <strong>
                            {selectedPatient?.appointmentReason}
                          </strong>{' '}
                        </div>
                      </Tooltip>
                    </Alert>
                  )}
                  {patientDetails?.patientInfo?.treatmentDetails && (
                    <Alert severity="success">
                      <AlertTitle className="text-xs">
                        Active Treatment
                      </AlertTitle>
                      <Tooltip
                        title={
                          <div>
                            <strong>
                              {
                                patientDetails?.patientInfo?.treatmentDetails
                                  ?.treatementType
                              }
                            </strong>
                          </div>
                        }
                      >
                        <div className="line-clamp-2">
                          <strong>
                            {
                              patientDetails?.patientInfo?.treatmentDetails
                                ?.treatementType
                            }
                          </strong>
                        </div>
                      </Tooltip>
                    </Alert>
                  )}
                </div>
                {selectedPatient?.type === 'Treatment' && (
                  <div className={styles.actionsRow}>
                    <Button
                      variant="outlined"
                      sx={actionButtonSx}
                      onClick={() => dispatch(openModal('PickupSheet'))}
                    >
                      View OPU sheet
                    </Button>
                    {!isCurrentTreatmentIui && (
                      <Button
                        variant="outlined"
                        sx={actionButtonSx}
                        onClick={() =>
                          dispatch(openModal('DischargeSummarySheet'))
                        }
                      >
                        Discharge Summary
                      </Button>
                    )}
                    <Button
                      variant="contained"
                      sx={actionButtonSx}
                      onClick={() => dispatch(openModal('DischargeCard'))}
                    >
                      Discharge Card
                    </Button>
                    {patientDetails?.patientInfo?.activeVisitId && (
                      <Button
                        variant="contained"
                        color="error"
                        sx={actionButtonSx}
                        onClick={() =>
                          dispatch(openModal('endTreatment-Visit'))
                        }
                        name="Review Call"
                        startIcon={<Close />}
                      >
                        Close Visit
                      </Button>
                    )}
                  </div>
                )}
                {selectedPatient?.type === 'Consultation' && (
                  <div className={styles.actionsRow}>
                    <Button
                      variant="contained"
                      sx={actionButtonSx}
                      onClick={() => dispatch(openModal('DischargeCard'))}
                    >
                      Discharge Card
                    </Button>
                    {patientDetails?.patientInfo?.activeVisitId && (
                      <Button
                        variant="contained"
                        color="error"
                        sx={actionButtonSx}
                        onClick={() =>
                          handleCloseVisit(selectedPatient?.appointmentId)
                        }
                        name="Close Visit"
                        startIcon={<Close />}
                        disabled={selectedPatient?.status === 'CLOSED'}
                      >
                        {selectedPatient?.status === 'CLOSED'
                          ? 'Visit Closed'
                          : 'Close Visit'}
                      </Button>
                    )}
                  </div>
                )}
                <Modal
                  uniqueKey="OPDSheet"
                  maxWidth="xl"
                  closeOnOutsideClick={true}
                >
                  <OPDSheet
                    patientInfo={patientDetails.patientInfo}
                    vitalInfo={selectedPatient?.vitalInfo}
                  />
                </Modal>
                {!isCurrentTreatmentIui && (
                  <Modal
                    uniqueKey="DischargeSummarySheet"
                    maxWidth="xl"
                    closeOnOutsideClick={true}
                  >
                    <DischargeSummarSheet
                      TreatmentCycleId={sheetTreatmentCycleId}
                    />
                  </Modal>
                )}
                <Modal
                  uniqueKey="DischargeCard"
                  maxWidth="md"
                  closeOnOutsideClick={true}
                >
                  <DischargeCard
                    patientInfo={patientDetails?.patientInfo}
                    treatmentCycleId={sheetTreatmentCycleId}
                  />
                </Modal>
                <Modal
                  uniqueKey="PickupSheet"
                  maxWidth="xl"
                  closeOnOutsideClick={true}
                >
                  <PickupSheet TreatmentCycleId={sheetTreatmentCycleId} />
                </Modal>
                <Modal
                  uniqueKey="EmbryologyHistory"
                  maxWidth="xl"
                  closeOnOutsideClick={true}
                >
                  <EmbryologyHistory patientId={selectedPatient?.patientId} />
                </Modal>
              </div>
            </div>
            {/* {console.log(selectedPatient)} */}
            <Prescription
              appointmentId={selectedPatient?.appointmentId}
              type={selectedPatient?.type}
              treatmentCycleId={selectedPatient?.treatmentCycleId}
              patientInfo={{
                ...patientDetails?.patientInfo,
                consultationId: selectedPatient?.consultationId,
              }}
              selectedPatient={selectedPatient}
              setSelectedPatient={setSelectedPatient}
              onTreatmentStarted={(updatedPatient) => {
                selectedPatientRef.current = updatedPatient
                router.push(
                  {
                    pathname: router.pathname + '/',
                    query: {
                      ...router.query,
                      patientId: updatedPatient.patientId,
                      appointmentId: updatedPatient.appointmentId,
                      type: updatedPatient.type,
                      date: dayjs(date).format('YYYY-MM-DD'),
                    },
                  },
                  undefined,
                  { shallow: true },
                )
              }}
            />
            {/* {console.log(patientDetails)} */}
            <ConsultationsAndTreatments
              consultations={patientDetails.consultations}
              treatments={patientDetails.treatments}
              date={date}
              patientInfo={patientDetails?.patientInfo}
              checklistData={checklistData}
              isChecklistDataLoading={isChecklistDataLoading}
              onActiveTreatmentCycleChange={setActiveHistoryTreatmentCycleId}
            />
          </>
        ) : (
          <div className={styles.emptyState} style={{ minHeight: 280 }}>
            No details to show. Select a patient from the list.
          </div>
        )}
      </div>
    </div>
  )
}

// Add this component
