import React, { useState, useEffect, useMemo, useRef } from 'react'
import Select from 'react-select'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import { toastconfig } from '@/utils/toastconfig'
import TextField from '@mui/material/TextField'
import {
  Button,
  Typography,
  FormControlLabel,
  RadioGroup,
  Checkbox,
  IconButton,
  Tooltip,
  ButtonGroup,
} from '@mui/material'
import {
  getTreatmentStatus,
  updateTreatmentSheetByTreatmentCycleId,
  getTreatmentSheetByTreatmentCycleId,
  updateTreatmentStatus,
  createConsultationOrTreatment,
  reviewIcsiConsents,
  reviewFETConsents,
  updateTreatmentFETSheetByTreatmentCycleId,
  getTreatmentFETSheetByTreatmentCycleId,
  getTreatmentTypes,
  getBillTypeValuesByBillTypeId,
  getPrescriptionDetailsByTreatmentCycleId,
  updateHysteroscopySheetByVisitId,
  getHysteroscopySheetByVisitId,
  closeVisitInConsultation,
  closeVisitInTreatment,
  getAllActiveVisitAppointments,
  getTreatmentERASheetByTreatmentCycleId,
  updateTreatmentERASheetByTreatmentCycleId,
  reviewEraConsents,
} from '@/constants/apis'
import dayjs from 'dayjs'
import { Close, InfoOutlined, Schedule } from '@mui/icons-material'
import Modal from '@/components/Modal'
import { openModal, closeModal } from '@/redux/modalSlice'
import FolicularSheet from '@/components/FolicularSheet'
import MedicationSheet from '@/components/MedicationSheet'
import ScanSheet from '@/components/ScanSheet'
import { DateTimePicker, renderTimeViewClock } from '@mui/x-date-pickers'
import { FaPrescriptionBottleMedical } from 'react-icons/fa6'
import ReviewCallForm from '@/components/ReviewCallForm'
import ConsentsCheck from '@/components/ConsentsCheck'
import FETSheet from '@/components/FETSheet'
import ReviewTreatmentCall from '@/components/ReviewTreatmentCall'
import { Autocomplete } from '@mui/material'
import PatientPrescription from './PatientPrescription'
import SpousePrescription from './SpousePrescription'
import HysteroscopySheet from './HysteroscopySheet'
import ERASheet from './ERASheet'
import HysteroscopySheetNew from './HysteroscopySheetNew'

function Prescription({
  appointmentId,
  type,
  treatmentCycleId,
  patientInfo,
  selectedPatient,
  // setSelectedPatient,
}) {
  const user = useSelector(store => store.user)
  const dispatch = useDispatch()
  const { billTypes } = useSelector(store => store.dropdowns)
  const modal = useSelector(store => store.modal)

  const queryClient = useQueryClient()
  // const [treatmentStartDate, setTreatmentStartDate] = useState(
  //   dayjs().format('YYYY-MM-DD'),
  // )
  const { data: treatmentTypes } = useQuery({
    queryKey: ['treatmentTypes'],
    queryFn: async () => {
      const res = await getTreatmentTypes(user.accessToken)
      // console.log('fetching treatment types', res.data)
      return res.data
    },
    // enabled: !!user.accessToken,
  })
  const [treatmentForm, setTreatmentForm] = useState({
    createType: 'Treatment', //Consultation or  Treatment
    // visitId: activeVisitId,
    type: '',
    packageAmount: '',
  })

  const { mutate: updateTreatmentStatusMutation } = useMutation({
    mutationFn: async payload => {
      const res = await updateTreatmentStatus(user.accessToken, payload)
      if (res.status === 200) {
        queryClient.invalidateQueries('treatmentStatus')
        toast.success(res?.data, toastconfig)
      } else {
        toast.error(res.message, toastconfig)
      }
    },
  })
  const {
    data: allBillTypeValues,
    isLoading: isBillTypeValuesLoading,
    error,
  } = useQuery({
    queryKey: ['allBillTypeValues', selectedPatient?.branchId],
    queryFn: async () => {
      const promisesArray = []

      for (let i = 0; i < billTypes.length; i++) {
        const responseJsonPromise = getBillTypeValuesByBillTypeId(
          user.accessToken,
          billTypes[i].id,
          selectedPatient?.branchId,
        ).then(response => {
          if (!response.ok)
            throw new Error(
              'error while fetching bill types for ' + billTypes[i].name,
            )
          return response.json()
        })
        promisesArray.push(responseJsonPromise)
      }

      return Promise.all(promisesArray).then(responsesArray => {
        const allBillTypeValuesObject = {}
        for (let i = 0; i < billTypes.length; i++) {
          allBillTypeValuesObject[billTypes[i].name] = responsesArray[i].data
        }
        return allBillTypeValuesObject
      })
    },
    enabled: !!selectedPatient?.branchId,
  })

  // getTreatmentStatus

  const [folicularFormData, setFolicularFormData] = useState({})
  const [follicularTemplate, setFolicularTemplate] = useState(null)
  const [medicationFormData, setMedicationFormData] = useState({})
  const [scanFormData, setScanFormData] = useState({})
  const [scanFetFormData, setScanFetFormData] = useState({})
  const [scanEraFormData, setScanEraFormData] = useState({})
  const [fetFormData, setFETFormData] = useState({})
  const [fetTemplate, setFETTemplate] = useState(null)
  const [eraFormData, setERAFormData] = useState({})
  const [eraTemplate, setERATemplate] = useState({})
  const [triggerTime, setTriggerTime] = useState(null)
  const [hysteroscopyTime, setHysteroscopyTime] = useState(null)
  const [hysteroscopyTemplate, setHysteroscopyTemplate] = useState(null)

  const {
    data: treatmentStatus,
    isLoading: isTreatmentStatusLoading,
  } = useQuery({
    queryKey: [
      'treatmentStatus',
      patientInfo?.activeVisitId,
      patientInfo?.treatmentDetails?.treatmentTypeId,
    ],
    queryFn: async () => {
      // console.log(patientInfo)
      const responsejson = await getTreatmentStatus(
        user.accessToken,
        patientInfo?.activeVisitId,
        patientInfo?.treatmentDetails?.treatmentTypeId,
      )
      if (responsejson.status == 200) {
        return responsejson.data
      } else {
        throw new Error('Error occurred while fetching treatment status')
      }
    },
    enabled: !!patientInfo?.treatmentDetails,
  })
  // const [folicularSheet, setFolicularSheet] = useState('')
  // const { data: defaultTreatmentTemplate } = useQuery({
  //   queryKey: ['defaultTemplate', treatmentStartDate],
  //   queryFn: async () => {
  //     const responsejson = await getTreatmentTemplate(
  //       user.accessToken,
  //       dayjs(treatmentStartDate).format('YYYY-MM-DD'),
  //     )
  //     if (responsejson.status == 200) {
  //       // setFolicularSheet(responsejson.data)
  //       console.log(responsejson.data)
  //       console.log(treatmentStatus)
  //       return responsejson.data
  //     } else {
  //       throw new Error('Error occurred while fetching treatment template')
  //     }
  //   },
  //   // enabled: !!treatmentStartDate && treatmentStatus[0]?.treatmentStatus?.START_ICSI == 0,
  // })
  // console.log('treatmentCycleId', treatmentCycleId)
  const { data: medicationOptionsFollicular } = useQuery({
    queryKey: ['medicationOptionsFollicular'],
    queryFn: async () => {
      const res = await getPrescriptionDetailsByTreatmentCycleId(
        user.accessToken,
        treatmentCycleId,
      )
      return res.data
    },
    enabled: !!treatmentCycleId,
  })
  const updateTreatmentSheetMutation = useMutation({
    mutationFn: async payload => {
      const res = await updateTreatmentSheetByTreatmentCycleId(
        user.accessToken,
        payload,
      )
      if (res.status !== 200) {
        throw new Error(res.message || 'Failed to update treatment sheet')
      }
      return res.data
    },
    onSuccess: () => {
      toast.success('Updated Successfully', toastconfig)
      queryClient.invalidateQueries('treatmentSheet')
    },
    onError: error => {
      toast.error(error.message, toastconfig)
    },
  })

  const handleUpdateTreatmentSheet = temp => {
    // if (!treatmentCycleId || !folicularFormData || treatmentStatus?.START_ICSI !== 1) {
    //   return
    // }
    console.log(
      'under review consents calling handleUpdateTreatmentSheet',
      temp,
    )
    if (temp !== 'update') {
      updateTreatmentSheetMutation.mutate({
        id: treatmentCycleId,
        template: JSON.stringify(temp),
      })
    } else {
      updateTreatmentSheetMutation.mutate({
        id: treatmentCycleId,
        template: JSON.stringify({
          follicularSheet: folicularFormData,
          columns: follicularTemplate?.columns,
          rows: follicularTemplate?.rows,
          medicationRows: medicationFormData?.rows,
          medicationSheet: medicationFormData,
          scanRows: scanFormData?.rows,
          scanSheet: scanFormData,
        }),
      })
    }
  }

  const { data: treatmentSheet } = useQuery({
    queryKey: ['treatmentSheet', treatmentCycleId, patientInfo?.activeVisitId],
    queryFn: async () => {
      const responsejson = await getTreatmentSheetByTreatmentCycleId(
        user.accessToken,
        treatmentCycleId,
      )
      if (responsejson.status == 200) {
        // console.log(JSON.parse(responsejson.data.template))
        if (responsejson?.data?.template) {
          let res = JSON.parse(responsejson.data.template)
          setFolicularFormData(res?.follicularSheet)
          setMedicationFormData({
            rows: res?.medicationRows,
            ...res?.medicationSheet,
          })
          setScanFormData({
            rows: res?.scanRows,
            ...res?.scanSheet,
          })
          setFolicularTemplate({
            columns: res?.columns,
            rows: res?.rows,
          })
        } else {
          setFolicularFormData({})
          setMedicationFormData({})
          setScanFormData({})
          setFolicularTemplate({})
        }
        return responsejson.data
      } else {
        throw new Error('Error occurred while fetching treatment sheet')
      }
    },
    enabled:
      !!treatmentCycleId &&
      (treatmentStatus?.START_ICSI == 1 ||
        treatmentStatus?.START_IUI == 1 ||
        treatmentStatus?.START_OITI == 1),
  })

  const { data: treatmentFETSheet } = useQuery({
    queryKey: [
      'treatmentFETSheet',
      treatmentCycleId,
      patientInfo?.activeVisitId,
    ],
    queryFn: async () => {
      const responsejson = await getTreatmentFETSheetByTreatmentCycleId(
        user.accessToken,
        treatmentCycleId,
      )
      if (responsejson.status == 200) {
        if (responsejson?.data?.template) {
          const res = JSON.parse(responsejson?.data?.template)
          console.log(res)
          setFETFormData({
            rows: res?.medicationRows,
            ...res?.medicationSheet,
          })
          setFETTemplate({
            columns: res?.columns,
            rows: res?.medicationRows,
          })
          setScanFetFormData({
            rows: res?.scanRows,
            ...res?.scanSheet,
          })
        } else {
          setFETFormData({})
          setFETTemplate({})
        }
      } else {
        throw new Error('Error occurred while fetching treatment sheet')
      }
      return responsejson.data
    },
    enabled: !!treatmentCycleId && treatmentStatus?.FET_START == 1,
  })
  const { data: treatmentERASheet } = useQuery({
    queryKey: [
      'treatmentERASheet',
      treatmentCycleId,
      patientInfo?.activeVisitId,
    ],
    queryFn: async () => {
      const responsejson = await getTreatmentERASheetByTreatmentCycleId(
        user.accessToken,
        treatmentCycleId,
      )
      if (responsejson.status == 200) {
        if (responsejson?.data?.template) {
          const res = JSON.parse(responsejson?.data?.template)
          setERAFormData({
            rows: res?.medicationRows,
            ...res?.medicationSheet,
          })
          setERATemplate({
            columns: res?.columns,
            rows: res?.medicationRows,
          })
          setScanEraFormData({
            rows: res?.scanRows,
            ...res?.scanSheet,
          })
        } else {
          setERAFormData({})
          setERATemplate({})
        }
      } else {
        throw new Error('Error occurred while fetching treatment sheet')
      }
      return responsejson.data
    },
    enabled: !!treatmentCycleId && treatmentStatus?.START_ERA == 1,
  })

  const createTreatment = useMutation({
    mutationFn: async payload => {
      const res = await createConsultationOrTreatment(user.accessToken, payload)
      console.log('under mutation fn', res)
      if (res.status === 400) {
        toast.error(res.message)
      } else if (res.status === 200) {
        toast.success(res.message)
        dispatch(closeModal())
        queryClient.invalidateQueries('patientInfoForDoctor')
        queryClient.invalidateQueries('treatmentStatus')
      }
      // setViewForm(false)
      // setIsValidUsers(1)
    },
    onSuccess: () => {
      // queryClient.invalidateQueries(
      //   // 'visitInfo',
      // )
    },
  })

  const [reviewAppointmentForm, setReviewAppointmentForm] = useState(null)
  const reviewConsentsICSI = useMutation({
    mutationFn: async visitId => {
      const res = await reviewIcsiConsents(user.accessToken, visitId, {
        visitId,
        stage: 'START_ICSI',
        treatmentType: patientInfo?.treatmentDetails?.treatmentTypeId,
      })
      if (res.status == 200) {
        toast.success('Consents reviewed successfully')
        if (
          patientInfo?.treatmentDetails?.treatmentTypeId != 6 &&
          patientInfo?.treatmentDetails?.treatmentTypeId != 7
        ) {
          const defaultTreatmentTemplate = res.data
          if (defaultTreatmentTemplate) {
            setFolicularTemplate({
              columns: defaultTreatmentTemplate?.date,
              rows: defaultTreatmentTemplate?.follicularSheet,
            })
            setMedicationFormData({
              // columns: defaultTreatmentTemplate?.date,
              rows: defaultTreatmentTemplate?.medicationSheet,
            })
            setScanFormData({
              // columns: defaultTreatmentTemplate?.date,
              rows: defaultTreatmentTemplate?.scanSheet,
            })
            // console.log('under review consents calling handleUpdateTreatmentSheet')
            // queryClient.invalidateQueries('treatmentStatus')
            let temp = {
              follicularSheet: folicularFormData,
              columns: defaultTreatmentTemplate?.date,
              rows: defaultTreatmentTemplate?.follicularSheet,
              medicationRows: defaultTreatmentTemplate?.medicationSheet,
              medicationSheet: [],
              scanRows: defaultTreatmentTemplate?.scanSheet,
              scanSheet: [],
            }
            handleUpdateTreatmentSheet(temp)
          }
        } else {
          dispatch(closeModal())
          queryClient.invalidateQueries('treatmentStatus')
        }
      } else {
        toast.error(res.message)
      }
    },
  })

  const startIUIMutation = useMutation({
    mutationFn: async visitId => {
      const res = await updateTreatmentStatus(user.accessToken, {
        visitId,
        stage: 'START_IUI',
        treatmentType: patientInfo?.treatmentDetails?.treatmentTypeId,
      })
      if (res.status == 200) {
        toast.success('Consents reviewed successfully')
        const defaultTreatmentTemplate = res.data
        if (defaultTreatmentTemplate) {
          setFolicularTemplate({
            columns: defaultTreatmentTemplate?.date,
            rows: defaultTreatmentTemplate?.follicularSheet,
          })
          setMedicationFormData({
            // columns: defaultTreatmentTemplate?.date,
            rows: defaultTreatmentTemplate?.medicationSheet,
          })
          setScanFormData({
            // columns: defaultTreatmentTemplate?.date,
            rows: defaultTreatmentTemplate?.scanSheet,
          })
          // console.log('under review consents calling handleUpdateTreatmentSheet')
          // queryClient.invalidateQueries('treatmentStatus')
          let temp = {
            follicularSheet: folicularFormData,
            columns: defaultTreatmentTemplate?.date,
            rows: defaultTreatmentTemplate?.follicularSheet,
            medicationRows: defaultTreatmentTemplate?.medicationSheet,
            medicationSheet: [],
            scanRows: defaultTreatmentTemplate?.scanSheet,
            scanSheet: [],
          }
          handleUpdateTreatmentSheet(temp)
        }
      } else {
        toast.error(res.message)
      }
    },
  })
  const startOITIMutation = useMutation({
    mutationFn: async visitId => {
      const res = await updateTreatmentStatus(user.accessToken, {
        visitId,
        stage: 'START_OITI',
        treatmentType: patientInfo?.treatmentDetails?.treatmentTypeId,
      })
      if (res.status == 200) {
        toast.success('Consents reviewed successfully')
        const defaultTreatmentTemplate = res.data
        if (defaultTreatmentTemplate) {
          setFolicularTemplate({
            columns: defaultTreatmentTemplate?.date,
            rows: defaultTreatmentTemplate?.follicularSheet,
          })
          setMedicationFormData({
            // columns: defaultTreatmentTemplate?.date,
            rows: defaultTreatmentTemplate?.medicationSheet,
          })
          setScanFormData({
            // columns: defaultTreatmentTemplate?.date,
            rows: defaultTreatmentTemplate?.scanSheet,
          })
          // console.log('under review consents calling handleUpdateTreatmentSheet')
          // queryClient.invalidateQueries('treatmentStatus')
          let temp = {
            follicularSheet: folicularFormData,
            columns: defaultTreatmentTemplate?.date,
            rows: defaultTreatmentTemplate?.follicularSheet,
            medicationRows: defaultTreatmentTemplate?.medicationSheet,
            medicationSheet: [],
            scanRows: defaultTreatmentTemplate?.scanSheet,
            scanSheet: [],
          }
          handleUpdateTreatmentSheet(temp)
        }
      } else {
        toast.error(res.message)
      }
    },
  })
  const startHysteroscopyMutation = useMutation({
    mutationFn: async visitId => {
      const res = await updateTreatmentStatus(user.accessToken, {
        visitId,
        stage: 'START_HYSTEROSCOPY',
        hysteroscopyTime,
        treatmentType: patientInfo?.treatmentDetails?.treatmentTypeId,
      })
      if (res.status == 200) {
        toast.success('Hysteroscopy started successfully')
        queryClient.invalidateQueries('treatmentStatus')
        let defaultTreatmentTemplate = res.data
        if (defaultTreatmentTemplate) {
          setHysteroscopyTemplate(defaultTreatmentTemplate)
        }
      } else {
        toast.error(res.message)
      }
    },
  })
  const updateTreatmentFETSheetMutation = useMutation({
    mutationFn: async payload => {
      const res = await updateTreatmentFETSheetByTreatmentCycleId(
        user.accessToken,
        payload,
      )
      if (res.status !== 200) {
        throw new Error(res.message || 'Failed to update treatment sheet')
      }
      return res.data
    },
    onSuccess: () => {
      toast.success('Updated Successfully', toastconfig)
      queryClient.invalidateQueries('treatmentFETSheet')
    },
  })
  const updateHysteroscopySheetMutation = useMutation({
    mutationFn: async visitId => {
      const res = await updateHysteroscopySheetByVisitId(user.accessToken, {
        visitId,
        hysteroscopyTemplate: JSON.stringify(hysteroscopyTemplate),
      })
      if (res.status == 200) {
        toast.success('Updated Successfully', toastconfig)
        queryClient.invalidateQueries('hysteroscopySheet')
      } else {
        toast.error(res.message, toastconfig)
      }

      return res.data
    },
    onSuccess: () => {
      toast.success('Updated Successfully', toastconfig)
      queryClient.invalidateQueries('hysteroscopySheet')
    },
  })
  const { data: hysteroscopySheet } = useQuery({
    queryKey: ['hysteroscopySheet', patientInfo?.activeVisitId],
    queryFn: async () => {
      const res = await getHysteroscopySheetByVisitId(
        user.accessToken,
        patientInfo?.activeVisitId,
      )
      if (res.status == 200) {
        setHysteroscopyTemplate(res.data.hysteroscopySheet)
        return res.data.hysteroscopySheet
      } else {
        throw new Error(res.message || 'Failed to get treatment sheet')
      }
    },
    enabled: !!patientInfo?.activeVisitId,
  })
  const handleUpdateTreatmentFETSheet = temp => {
    console.log(temp, fetFormData)
    if (temp !== 'update') {
      updateTreatmentFETSheetMutation.mutate({
        id: treatmentCycleId,
        template: JSON.stringify(temp),
      })
    } else {
      updateTreatmentFETSheetMutation.mutate({
        id: treatmentCycleId,
        template: JSON.stringify({
          columns: fetTemplate?.columns,
          medicationRows: fetFormData?.rows,
          medicationSheet: fetFormData,
          scanRows: scanFetFormData?.rows,
          scanSheet: scanFetFormData,
        }),
      })
    }
  }
  const reviewConsentsFET = useMutation({
    mutationFn: async visitId => {
      const res = await reviewFETConsents(user.accessToken, visitId, {
        visitId,
        stage: 'START_FET',
        treatmentType: patientInfo?.treatmentDetails?.treatmentTypeId,
      })
      if (res.status == 200) {
        const defaultTreatmentTemplate = res.data
        toast.success('Consents reviewed successfully')
        if (defaultTreatmentTemplate) {
          setFETFormData({
            rows: defaultTreatmentTemplate?.medicationSheet,
          })
          setFETTemplate({
            columns: defaultTreatmentTemplate?.date,
            rows: defaultTreatmentTemplate?.medicationSheet,
          })
          setScanFetFormData({
            rows: defaultTreatmentTemplate?.scanSheet,
          })
          let temp = {
            columns: defaultTreatmentTemplate?.date,
            medicationRows: defaultTreatmentTemplate?.medicationSheet,
            medicationSheet: [],
            scanRows: defaultTreatmentTemplate?.scanSheet,
            scanSheet: [],
          }
          handleUpdateTreatmentFETSheet(temp)
        }
      } else {
        toast.error(res.message)
      }
    },
  })
  const reviewConsentsERA = useMutation({
    mutationFn: async visitId => {
      const res = await reviewEraConsents(user.accessToken, visitId, {
        visitId,
        stage: 'START_ERA',
        treatmentType: patientInfo?.treatmentDetails?.treatmentTypeId,
      })
      if (res.status == 200) {
        const defaultTreatmentTemplate = res.data
        toast.success('Consents reviewed successfully')
        if (defaultTreatmentTemplate) {
          setERAFormData({
            rows: defaultTreatmentTemplate?.medicationSheet,
          })
          setERATemplate({
            columns: defaultTreatmentTemplate?.date,
            rows: defaultTreatmentTemplate?.medicationSheet,
          })
          let temp = {
            columns: defaultTreatmentTemplate?.date,
            medicationRows: defaultTreatmentTemplate?.medicationSheet,
            medicationSheet: [],
            scanRows: defaultTreatmentTemplate?.scanSheet,
            scanSheet: [],
          }
          handleUpdateTreatmentERASheet(temp)
        }
      } else {
        toast.error(res.message)
      }
    },
  })
  function EndTreatmentModal({ type, visitId, onClose }) {
    const [selectedReason, setSelectedReason] = useState(null)
    const [selectedSubReason, setSelectedSubReason] = useState(null)
    const [customReason, setCustomReason] = useState('')
    const queryClient = useQueryClient()

    // Define end options for each treatment type
    const END_OPTIONS = {
      ICSI: [
        { value: 'FREEZE', label: 'Freeze All' },
        // { value: 'FAILED', label: 'Treatment Failed' },
        { value: 'CANCEL', label: 'Other Reason' },
      ],
      FET: [
        { value: 'UPT_POSITIVE', label: 'UPT POSITIVE' },
        { value: 'UPT_NEGATIVE', label: 'UPT NEGATIVE' },
        { value: 'CANCEL', label: 'Other Reason' },
      ],
      IUI: [
        { value: 'UPT_POSITIVE', label: 'UPT POSITIVE' },
        { value: 'UPT_NEGATIVE', label: 'UPT NEGATIVE' },
        { value: 'CANCEL', label: 'Other Reason' },
      ],
      OITI: [
        { value: 'UPT_POSITIVE', label: 'UPT POSITIVE' },
        { value: 'UPT_NEGATIVE', label: 'UPT NEGATIVE' },
        { value: 'CANCEL', label: 'Other Reason' },
      ],
      // HYSTEROSCOPY: [
      //   { value: 'CANCEL', label: 'Other Reason' },
      // ],
    }

    const { mutate: updateTreatmentStatusMutation } = useMutation({
      mutationFn: async payload => {
        const res = await updateTreatmentStatus(user.accessToken, payload)
        if (res.status === 200) {
          queryClient.invalidateQueries('treatmentStatus')
          toast.success('Treatment ended successfully')
          onClose()
        } else {
          toast.error(res.message, toastconfig)
        }
      },
    })

    const handleEndTreatment = () => {
      if (!selectedReason) {
        toast.error('Please select a reason')
        return
      }

      const stageMap = {
        ICSI: 'END_ICSI',
        FET: 'END_FET',
        IUI: 'END_IUI',
        OITI: 'END_OITI',
      }
      const endReasonMap = {
        FET: 'fetEndedReason',
        ICSI: 'endedReason',
        IUI: 'endedReason',
        OITI: 'endedReason',
      }
      const payload = {
        visitId,
        stage: stageMap[type],
        treatmentType: patientInfo?.treatmentDetails?.treatmentTypeId,
        [endReasonMap[type]]:
          selectedReason.value === 'CANCEL'
            ? customReason
            : selectedReason.label,
      }

      updateTreatmentStatusMutation(payload)
    }

    return (
      <div className="p-6 flex flex-col gap-6">
        <div className="flex justify-between">
          <Typography variant="h6" className="text-gray-800 mb-2">
            End {type} Treatment
          </Typography>
          <IconButton onClick={() => dispatch(closeModal())}>
            <Close />
          </IconButton>
        </div>
        <div className="text-center">
          <Typography variant="body2" className="text-gray-600">
            Are you sure you want to end this {type} treatment? This action
            cannot be undone.
          </Typography>
        </div>

        <Autocomplete
          options={END_OPTIONS[type]}
          value={selectedReason}
          onChange={(_, newValue) => {
            setSelectedReason(newValue)
            if (newValue?.value !== 'CANCEL') {
              setCustomReason('')
            }
          }}
          renderInput={params => (
            <TextField
              {...params}
              label="Select Reason"
              required
              className="bg-white"
            />
          )}
        />

        {selectedReason?.value === 'CANCEL' && (
          <TextField
            label="Enter Reason"
            required
            multiline
            rows={3}
            value={customReason}
            onChange={e => setCustomReason(e.target.value)}
            className="bg-white"
          />
        )}

        <div className="flex justify-end gap-3">
          <Button
            variant="contained"
            color="error"
            onClick={handleEndTreatment}
            className="capitalize"
            disabled={selectedReason?.value === 'CANCEL' && !customReason}
          >
            End {type}
          </Button>
        </div>
      </div>
    )
  }
  function CloseVisitModal({ type, visitId, onClose, consultationId }) {
    const [selectedReason, setSelectedReason] = useState(null)
    const [selectedSubReason, setSelectedSubReason] = useState(null)
    const [customReason, setCustomReason] = useState('')
    const queryClient = useQueryClient()

    const END_OPTIONS = [
      { value: 'Completed', label: 'Completed' },
      { value: 'Cancelled', label: 'Cancelled' },
    ]

    const UPT_OPTIONS = [
      { value: 'UPT_POSITIVE', label: 'UPT Positive' },
      { value: 'UPT_NEGATIVE', label: 'UPT Negative' },
    ]

    const handleReasonChange = (_, newValue) => {
      setSelectedReason(newValue)
      setSelectedSubReason(null)
      setCustomReason('')
    }

    const { mutate: updateVisitStatusMutation } = useMutation({
      mutationFn: async payload => {
        let res
        if (type == 'Treatment') {
          console.log(payload, type)
          res = await closeVisitInTreatment(user.accessToken, payload, visitId)
        } else {
          res = await closeVisitInConsultation(
            user.accessToken,
            payload,
            visitId,
          )
        }
        if (res.status === 200) {
          queryClient.invalidateQueries('treatmentStatus')
          toast.success('Visit closed successfully')
          onClose()
        } else {
          toast.error(res.message, toastconfig)
        }
      },
    })

    const handleCloseVisit = () => {
      if (!selectedReason) {
        toast.error('Please select a reason')
        return
      }

      if (selectedReason.value === 'Completed' && !selectedSubReason) {
        toast.error('Please select UPT status')
        return
      }

      if (selectedReason.value === 'Cancelled' && !customReason) {
        toast.error('Please enter cancellation reason')
        return
      }
      let payload
      if (type == 'Treatment') {
        payload = {
          patientId: patientInfo?.id,
          type: type,
          appointmentId: appointmentId,
          treatmentCycleId: treatmentCycleId,
          visitClosedStatus: selectedReason.value,
          visitClosedReason:
            selectedReason.value === 'Completed'
              ? selectedSubReason.label
              : customReason,
        }
      } else {
        payload = {
          patientId: patientInfo?.id,
          type: type,
          appointmentId: appointmentId,
          consultationId: consultationId,
          visitClosedStatus: selectedReason.value,
          visitClosedReason:
            selectedReason.value === 'Completed'
              ? selectedSubReason.label
              : customReason,
        }
      }
      console.log(payload)
      updateVisitStatusMutation(payload)
    }

    return (
      <div className="flex flex-col gap-6">
        <div className="flex justify-between">
          <Typography variant="h6" className="text-gray-800 mb-2">
            Close Visit
          </Typography>
          <IconButton onClick={() => dispatch(closeModal())}>
            <Close />
          </IconButton>
        </div>
        <div className="text-center">
          <Typography variant="body2" className="text-gray-600">
            Are you sure you want to close this visit? This action cannot be
            undone. This will close the visit and all the treatments associated
            with it.
          </Typography>
        </div>

        <Autocomplete
          options={END_OPTIONS}
          value={selectedReason}
          onChange={handleReasonChange}
          renderInput={params => (
            <TextField
              {...params}
              label="Select Reason"
              required
              className="bg-white"
            />
          )}
        />

        {selectedReason?.value === 'Completed' && (
          <Autocomplete
            options={UPT_OPTIONS}
            value={selectedSubReason}
            onChange={(_, newValue) => setSelectedSubReason(newValue)}
            renderInput={params => (
              <TextField
                {...params}
                label="Select UPT Status"
                required
                className="bg-white"
              />
            )}
          />
        )}

        {selectedReason?.value === 'Cancelled' && (
          <TextField
            label="Enter Cancellation Reason"
            required
            multiline
            rows={3}
            value={customReason}
            onChange={e => setCustomReason(e.target.value)}
            className="bg-white"
          />
        )}

        <div className="flex justify-end gap-3">
          <Button
            variant="contained"
            color="error"
            onClick={handleCloseVisit}
            className="capitalize"
            disabled={
              !selectedReason ||
              (selectedReason.value === 'Completed' && !selectedSubReason) ||
              (selectedReason.value === 'Cancelled' && !customReason)
            }
          >
            Proceed to Close Visit
          </Button>
        </div>
      </div>
    )
  }

  const startDispatchTriggerModal = () => {
    dispatch(openModal('triggerDate'))
  }

  const handleActionOnStartTrigger = () => {
    if (confirm('Are you sure you want to start trigger?') && triggerTime) {
      updateTreatmentStatusMutation({
        visitId: patientInfo?.activeVisitId,
        stage: 'TRIGGER_START',
        triggerTime: triggerTime,
        treatmentType: patientInfo?.treatmentDetails?.treatmentTypeId,
      })
      dispatch(closeModal('triggerDate'))
    }
  }
  const { data: activeVisitAppointments } = useQuery({
    queryKey: ['activeVisitAppointments', patientInfo?.activeVisitId],
    queryFn: async () => {
      const res = await getAllActiveVisitAppointments(
        user.accessToken,
        patientInfo?.activeVisitId,
      )
      return res.data
    },
    enabled: !!patientInfo?.activeVisitId,
  })
  // console.log(activeVisitAppointments, patientInfo)

  const updateTreatmentERASheetMutation = useMutation({
    mutationFn: async payload => {
      const res = await updateTreatmentERASheetByTreatmentCycleId(
        user.accessToken,
        payload,
      )
      if (res.status !== 200) {
        throw new Error(res.message || 'Failed to update treatment sheet')
      }
      return res.data
    },
    onSuccess: () => {
      toast.success('Updated Successfully', toastconfig)
      queryClient.invalidateQueries('treatmentERASheet')
    },
  })

  const handleUpdateTreatmentERASheet = temp => {
    if (temp !== 'update') {
      updateTreatmentERASheetMutation.mutate({
        id: treatmentCycleId,
        template: JSON.stringify(temp),
      })
    } else {
      updateTreatmentERASheetMutation.mutate({
        id: treatmentCycleId,
        template: JSON.stringify({
          columns: eraTemplate?.columns,
          medicationRows: eraFormData?.rows,
          medicationSheet: eraFormData,
          scanSheet: scanEraFormData,
          scanSheetRows: scanEraFormData?.rows,
        }),
      })
    }
  }

  return (
    <div className="pr-3 flex flex-wrap justify-end gap-3">
      <PatientPrescription
        allBillTypeValues={allBillTypeValues}
        type={type}
        appointmentId={appointmentId}
        activeVisitAppointments={activeVisitAppointments}
      />

      <SpousePrescription
        allBillTypeValues={allBillTypeValues}
        type={type}
        appointmentId={appointmentId}
        activeVisitAppointments={activeVisitAppointments}
      />

      {type == 'Treatment' && (
        <>
          {treatmentStatus?.START_ICSI >= 0 && (
            <ButtonGroup variant="outlined" className="border overflow-hidden">
              <span className="px-4 py-2 bg-gray-100 font-medium border-r flex items-center">
                ICSI
              </span>
              <Button
                variant="contained"
                className="text-white capitalize px-6"
                onClick={() =>
                  dispatch(openModal('ICSI' + patientInfo?.activeVisitId))
                }
                sx={{
                  borderRadius: 0,
                }}
              >
                {treatmentStatus?.START_ICSI == 1
                  ? treatmentStatus?.END_ICSI == 0
                    ? 'Update'
                    : 'View'
                  : 'Start'}
              </Button>
              {treatmentStatus?.START_ICSI == 1 &&
                treatmentStatus?.END_ICSI >= 0 && (
                  <Button
                    variant="outlined"
                    className="capitalize px-6"
                    color="error"
                    onClick={() => dispatch(openModal('endTreatment-ICSI'))}
                    disabled={treatmentStatus?.END_ICSI == 1}
                    sx={{
                      borderRadius: 0,
                      borderLeft: '1px solid rgba(0,0,0,0.12)',
                    }}
                  >
                    End
                  </Button>
                )}
            </ButtonGroup>
          )}
          {treatmentStatus?.START_IUI >= 0 && (
            <ButtonGroup>
              <span className="px-4 py-2 bg-gray-100 font-medium border-r flex items-center">
                IUI
              </span>
              <Button
                variant="contained"
                className="text-white capitalize"
                onClick={() =>
                  dispatch(openModal('IUI' + patientInfo?.activeVisitId))
                }
              >
                {treatmentStatus?.START_IUI == 1
                  ? treatmentStatus?.END_IUI == 0
                    ? 'Update'
                    : 'View'
                  : 'Start'}
              </Button>
              {treatmentStatus?.START_IUI == 1 &&
                treatmentStatus?.END_IUI >= 0 && (
                  <Button
                    variant="outlined"
                    className="capitalize"
                    color="error"
                    onClick={() => dispatch(openModal('endTreatment-IUI'))}
                    disabled={treatmentStatus?.END_IUI == 1}
                  >
                    End
                  </Button>
                )}
            </ButtonGroup>
          )}
          {treatmentStatus?.START_OITI >= 0 && (
            <ButtonGroup>
              <span className="px-4 py-2 bg-gray-100 font-medium border-r flex items-center">
                OITI
              </span>
              <Button
                variant="contained"
                className="text-white capitalize"
                onClick={() =>
                  dispatch(openModal('OITI' + patientInfo?.activeVisitId))
                }
              >
                {treatmentStatus?.START_OITI == 1
                  ? treatmentStatus?.END_OITI == 0
                    ? 'Update'
                    : 'View'
                  : 'Start'}
              </Button>
              {treatmentStatus?.START_OITI == 1 &&
                treatmentStatus?.END_OITI >= 0 && (
                  <Button
                    variant="outlined"
                    className="capitalize"
                    color="error"
                    onClick={() => dispatch(openModal('endTreatment-OITI'))}
                    disabled={treatmentStatus?.END_OITI == 1}
                  >
                    End
                  </Button>
                )}
            </ButtonGroup>
          )}
          {/* END OITI */}
          {/* {treatmentStatus?.START_OITI == 1 && treatmentStatus?.END_OITI >= 0 && (
            <Button
              variant="outlined"
              className="capitalize"
              color="error"
              onClick={() => dispatch(openModal('endTreatment-OITI'))}
              disabled={treatmentStatus?.END_OITI == 1}
            >
              End OITI
            </Button>
          )} */}
          {/* END IUI */}
          {/* {treatmentStatus?.START_IUI == 1 && treatmentStatus?.END_IUI >= 0 && (
            <Button
              variant="outlined"
              className="capitalize "
              color="error"
              onClick={() => dispatch(openModal('endTreatment-IUI'))}
              disabled={treatmentStatus?.END_IUI == 1}
            >
              End IUI
            </Button>
          )} */}
          {/* END ICSI */}
          {/* {treatmentStatus?.START_ICSI == 1 && treatmentStatus?.END_ICSI >= 0 && (
            <Button
              variant="outlined"
              className="capitalize"
              color="error"
              onClick={() => dispatch(openModal('endTreatment-ICSI'))}
              disabled={treatmentStatus?.END_ICSI == 1}
            >
              End ICSI
            </Button>
          )} */}
          {treatmentStatus?.TRIGGER_START >= 0 && (
            <Button
              variant="contained"
              className=" capitalize text-white"
              onClick={startDispatchTriggerModal}
              disabled={treatmentStatus?.TRIGGER_START == 1}
            >
              {treatmentStatus?.TRIGGER_START == 1
                ? 'Trigger Started'
                : 'Start Trigger'}
            </Button>
          )}
          <Modal
            uniqueKey="triggerDate"
            closeOnOutsideClick={true}
            onOutsideClick={() => setTriggerTime(null)}
          >
            <div className="flex justify-between">
              <Typography variant="h6" className="text-gray-800 mb-2">
                Trigger
              </Typography>
              <IconButton onClick={() => dispatch(closeModal())}>
                <Close />
              </IconButton>
            </div>
            <div className="flex flex-col gap-2 items-center">
              <DateTimePicker
                label="Trigger Time"
                className="bg-white rounded-lg w-max-content"
                name="triggerTime"
                onChange={newValue =>
                  setTriggerTime(
                    dayjs(newValue).format('YYYY-MM-DDTHH:mm:00[Z]'),
                  )
                }
                viewRenderers={{
                  hours: renderTimeViewClock,
                  minutes: renderTimeViewClock,
                  // seconds: renderTimeViewClock,
                }}
              />
              <h5 className="text-sm mt-2 text-gray-800 flex items-center gap-2">
                <InfoOutlined />
                Please Provide Trigger Time to proceed further
              </h5>
              <Button
                variant="contained"
                className="text-white capitalize mt-5"
                disabled={!triggerTime}
                onClick={handleActionOnStartTrigger}
              >
                Start Trigger
              </Button>
            </div>
          </Modal>

          {treatmentStatus?.FET_START >= 0 && (
            <ButtonGroup>
              <span className="px-4 py-2 bg-gray-100 font-medium border-r flex items-center">
                FET
              </span>
              <Button
                variant="contained"
                className="text-white capitalize"
                onClick={() =>
                  dispatch(openModal('FET' + patientInfo?.activeVisitId))
                }
              >
                {treatmentStatus?.FET_START == 1
                  ? treatmentStatus?.END_FET == 0
                    ? 'Update'
                    : 'View'
                  : 'Start'}
              </Button>
              {treatmentStatus?.FET_START == 1 &&
                treatmentStatus?.END_FET >= 0 && (
                  <Button
                    variant="outlined"
                    className="capitalize"
                    color="error"
                    onClick={() => dispatch(openModal('endTreatment-FET'))}
                    disabled={treatmentStatus?.END_FET == 1}
                  >
                    End
                  </Button>
                )}
            </ButtonGroup>
          )}
          {/* {treatmentStatus?.FET_START == 1 && treatmentStatus?.END_FET >= 0 && (
            <Button
              variant="outlined"
              className="capitalize"
              color="error"
              onClick={() => dispatch(openModal('endTreatment-FET'))}
              disabled={treatmentStatus?.END_FET == 1}
            >
              End FET
            </Button>
          )} */}

          {treatmentStatus?.START_ERA >= 0 && (
            <ButtonGroup>
              <span className="px-4 py-2 bg-gray-100 font-medium border-r flex items-center">
                ERA
              </span>
              <Button
                variant="contained"
                className="text-white capitalize"
                onClick={() =>
                  dispatch(openModal('ERA' + patientInfo?.activeVisitId))
                }
              >
                {treatmentStatus?.START_ERA == 1
                  ? treatmentStatus?.END_ERA == 0
                    ? 'Update'
                    : 'View'
                  : 'Start'}
              </Button>
              {treatmentStatus?.START_ERA == 1 &&
                treatmentStatus?.END_ERA >= 0 && (
                  <Button
                    variant="outlined"
                    className="capitalize"
                    color="error"
                    onClick={() => dispatch(openModal('endTreatment-ERA'))}
                    disabled={treatmentStatus?.END_ERA == 1}
                  >
                    End
                  </Button>
                )}
            </ButtonGroup>
          )}
          {/* {treatmentStatus?.START_ERA == 1 && treatmentStatus?.END_ERA >= 0 && (
            <Button
              variant="outlined"
              className="capitalize"
              color="error"
              onClick={() => dispatch(openModal('endTreatment-ERA'))}
              disabled={treatmentStatus?.END_ERA == 1}
            >
              End ERA
            </Button>
          )} */}

          {treatmentStatus?.START_HYSTEROSCOPY >= 0 && (
            <ButtonGroup>
              <span className="px-4 py-2 bg-gray-100 font-medium border-r flex items-center">
                Hysteroscopy
              </span>
              <Button
                variant="contained"
                className="text-white capitalize"
                onClick={() => {
                  if (
                    treatmentStatus?.START_HYSTEROSCOPY == 1 ||
                    confirm('Are you sure you want to start Hysteroscopy?')
                  ) {
                    dispatch(
                      openModal('HYSTEROSCOPY' + patientInfo?.activeVisitId),
                    )
                  }
                }}
                disabled={treatmentStatus?.END_HYSTEROSCOPY == 1}
              >
                {treatmentStatus?.START_HYSTEROSCOPY == 1
                  ? // ? treatmentStatus?.END_HYSTEROSCOPY == 0
                    'Update'
                  : // : 'View Hysteroscopy'
                    'Start'}
              </Button>
              {treatmentStatus?.START_HYSTEROSCOPY == 1 &&
                treatmentStatus?.END_HYSTEROSCOPY >= 0 && (
                  <Button
                    variant="outlined"
                    className="capitalize"
                    color="error"
                    onClick={() =>
                      dispatch(openModal('endTreatment-HYSTEROSCOPY'))
                    }
                    disabled={treatmentStatus?.END_HYSTEROSCOPY == 1}
                  >
                    End
                  </Button>
                )}
            </ButtonGroup>
          )}
          {/* <Button
            variant="outlined"
            className="capitalize"
            onClick={() => dispatch(openModal('Hysteroscopy-new'))}
          >
            Hysteroscopy
          </Button> */}

          {/* <Button
              variant="outlined"
  
              color="error"
              onClick={() => dispatch(openModal('ICSI'))}
            >
              End FET
            </Button> */}
        </>
      )}

      {type == 'Consultation' &&
        patientInfo?.activeVisitId &&
        !patientInfo?.treatmentExists && (
          <>
            <Button
              variant="outlined"
              className="capitalize"
              onClick={e => dispatch(openModal('startTreatment'))}
              name="Treatment"
              // startIcon={<Start />}
            >
              Start Treatment
            </Button>
            <Button
              variant="outlined"
              className="capitalize"
              onClick={e => dispatch(openModal('reviewCall'))}
              name="Review Call"
              disabled={!!selectedPatient?.isReviewCall}
              startIcon={<Schedule />}
            >
              {selectedPatient?.isReviewCall === null
                ? 'Review Call'
                : 'Review Call Scheduled'}
            </Button>
          </>
        )}
      {!!patientInfo?.treatmentExists && (
        <Button
          variant="outlined"
          className="capitalize"
          onClick={() => dispatch(openModal('reviewTreatmentCall'))}
          name="Review Call"
          disabled={!!selectedPatient?.reviewCallInfo?.reviewAppointmentDate}
          startIcon={<Schedule />}
        >
          <Tooltip
            title={selectedPatient?.reviewCallInfo?.reviewAppointmentDate}
          >
            <span>
              {!selectedPatient?.reviewCallInfo?.reviewAppointmentDate
                ? 'Review Treatment Call'
                : `Review Call Scheduled on ${dayjs(
                    selectedPatient?.reviewCallInfo?.reviewAppointmentDate,
                  ).format('DD-MM-YYYY')}`}
            </span>
          </Tooltip>
        </Button>
      )}
      <Modal
        uniqueKey="Hysteroscopy-new"
        maxWidth="md"
        closeOnOutsideClick={true}
      >
        <div className="flex justify-between">
          <Typography variant="h6" className="text-gray-800 mb-2">
            Hysteroscopy
          </Typography>
          <IconButton onClick={() => dispatch(closeModal())}>
            <Close />
          </IconButton>
        </div>
        <div>
          <HysteroscopySheetNew />
        </div>
      </Modal>

      <Modal
        uniqueKey={`ICSI` + patientInfo?.activeVisitId}
        // closeOnOutsideClick={true}
        maxWidth="xl"
        closeOnOutsideClick={true}
        // onOutsideClick={() => dispatch(closeModal('ICSI'))}
      >
        <div className="flex justify-between">
          <Typography variant="h6" className="text-gray-800 mb-2">
            ICSI Sheet
          </Typography>
          <IconButton onClick={() => dispatch(closeModal())}>
            <Close />
          </IconButton>
        </div>
        {treatmentStatus?.START_ICSI == 0 ? (
          <>
            {/* collect consents from patient */}
            <ConsentsCheck
              consentType="ICSI"
              patientInfo={patientInfo}
              reviewConsents={reviewConsentsICSI}
            />
          </>
        ) : patientInfo?.treatmentDetails?.treatmentTypeId != 6 &&
          patientInfo?.treatmentDetails?.treatmentTypeId != 7 ? (
          <>
            <FolicularSheet
              folicularFormData={folicularFormData}
              setFolicularFormData={setFolicularFormData}
              treatmentStatus={treatmentStatus}
              handleUpdateTreatmentSheet={handleUpdateTreatmentSheet}
              follicularTemplate={follicularTemplate}
              setFolicularTemplate={setFolicularTemplate}
              canUpdate={treatmentStatus?.END_ICSI == 0}
            />

            {/* Medication Sheet  */}
            <MedicationSheet
              medicationFormData={medicationFormData}
              setMedicationFormData={setMedicationFormData}
              allBillTypeValues={allBillTypeValues}
              columns={follicularTemplate?.columns}
              medicationOptions={medicationOptionsFollicular}
            />

            {/* Scan Sheet */}
            <ScanSheet
              scanFormData={scanFormData}
              setScanFormData={setScanFormData}
              allBillTypeValues={allBillTypeValues}
              columns={follicularTemplate?.columns}
            />
          </>
        ) : (
          <>
            <span>No Folicular Sheet available for this treatment</span>
          </>
        )}
      </Modal>
      <Modal
        uniqueKey={'IUI' + patientInfo?.activeVisitId}
        // closeOnOutsideClick={true}
        maxWidth="xl"
        closeOnOutsideClick={true}
        // onOutsideClick={() => dispatch(closeModal('ICSI'))}
      >
        <div className="flex justify-between">
          <Typography variant="h6" className="text-gray-800 mb-2">
            IUI Sheet
          </Typography>
          <IconButton onClick={() => dispatch(closeModal())}>
            <Close />
          </IconButton>
        </div>
        {treatmentStatus?.START_IUI == 0 ? (
          <>
            {/* collect consents from patient */}
            <ConsentsCheck
              consentType="IUI"
              patientInfo={patientInfo}
              reviewConsents={startIUIMutation}
            />
          </>
        ) : (
          <>
            <FolicularSheet
              folicularFormData={folicularFormData}
              setFolicularFormData={setFolicularFormData}
              treatmentStatus={treatmentStatus}
              handleUpdateTreatmentSheet={handleUpdateTreatmentSheet}
              follicularTemplate={follicularTemplate}
              setFolicularTemplate={setFolicularTemplate}
              canUpdate={treatmentStatus?.END_IUI == 0}
            />

            {/* Medication Sheet  */}
            <MedicationSheet
              medicationFormData={medicationFormData}
              setMedicationFormData={setMedicationFormData}
              allBillTypeValues={allBillTypeValues}
              columns={follicularTemplate?.columns}
              medicationOptions={medicationOptionsFollicular}
            />

            {/* Scan Sheet */}
            <ScanSheet
              scanFormData={scanFormData}
              setScanFormData={setScanFormData}
              allBillTypeValues={allBillTypeValues}
              columns={follicularTemplate?.columns}
            />
          </>
        )}
      </Modal>
      <Modal
        uniqueKey={'OITI' + patientInfo?.activeVisitId}
        maxWidth={treatmentStatus?.START_OITI == 0 ? 'xs' : 'xl'}
        closeOnOutsideClick={true}
      >
        <div className="flex justify-between">
          <Typography variant="h6" className="text-gray-800 mb-2">
            OITI Sheet
          </Typography>
          <IconButton onClick={() => dispatch(closeModal())}>
            <Close />
          </IconButton>
        </div>
        {treatmentStatus?.START_OITI == 0 ? (
          <>
            {/* collect consents from patient */}
            <div className="flex flex-col justify-center items-center gap-2">
              <span>Are you sure you want to start OITI?</span>
              <div className="flex justify-between gap-2">
                <Button
                  variant="outlined"
                  className="capitalize"
                  onClick={() =>
                    dispatch(closeModal('OITI' + patientInfo?.activeVisitId))
                  }
                >
                  No
                </Button>
                <Button
                  variant="contained"
                  className="text-white capitalize "
                  onClick={() =>
                    startOITIMutation.mutate(patientInfo?.activeVisitId)
                  }
                >
                  Yes
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <FolicularSheet
              folicularFormData={folicularFormData}
              setFolicularFormData={setFolicularFormData}
              treatmentStatus={treatmentStatus}
              handleUpdateTreatmentSheet={handleUpdateTreatmentSheet}
              follicularTemplate={follicularTemplate}
              setFolicularTemplate={setFolicularTemplate}
              canUpdate={treatmentStatus?.END_OITI == 0}
            />

            {/* Medication Sheet  */}
            <MedicationSheet
              medicationFormData={medicationFormData}
              setMedicationFormData={setMedicationFormData}
              allBillTypeValues={allBillTypeValues}
              columns={follicularTemplate?.columns}
              medicationOptions={medicationOptionsFollicular}
            />

            {/* Scan Sheet */}
            <ScanSheet
              scanFormData={scanFormData}
              setScanFormData={setScanFormData}
              allBillTypeValues={allBillTypeValues}
              columns={follicularTemplate?.columns}
            />
          </>
        )}
      </Modal>
      <Modal
        uniqueKey={`FET` + patientInfo?.activeVisitId}
        maxWidth={treatmentStatus?.FET_START == 0 ? 'sm' : 'xl'}
        closeOnOutsideClick={true}
        // onOutsideClick={() => dispatch(closeModal('ICSI'))}
      >
        <div className="flex justify-between">
          <Typography variant="h6" className="text-gray-800 mb-2">
            FET Sheet
          </Typography>
          <IconButton onClick={() => dispatch(closeModal())}>
            <Close />
          </IconButton>
        </div>
        {treatmentStatus?.FET_START == 0 ? (
          <>
            <ConsentsCheck
              consentType="FET"
              patientInfo={patientInfo}
              reviewConsents={reviewConsentsFET}
            />
          </>
        ) : (
          <>
            <FETSheet
              fetFormData={fetFormData}
              setFETFormData={setFETFormData}
              fetTemplate={fetTemplate}
              handleUpdateTreatmentFETSheet={handleUpdateTreatmentFETSheet}
              patientInfo={patientInfo}
              setFETTemplate={setFETTemplate}
              canUpdate={treatmentStatus?.END_FET == 0}
              medicationOptions={medicationOptionsFollicular}
              allBillTypeValues={allBillTypeValues}
            />
            <ScanSheet
              scanFormData={scanFetFormData}
              setScanFormData={setScanFetFormData}
              allBillTypeValues={allBillTypeValues}
              columns={fetTemplate?.columns}
            />
          </>
        )}
      </Modal>
      <Modal
        uniqueKey={`ERA` + patientInfo?.activeVisitId}
        maxWidth={treatmentStatus?.START_ERA == 0 ? 'sm' : 'xl'}
        closeOnOutsideClick={true}
      >
        <div className="flex justify-between">
          <Typography variant="h6" className="text-gray-800 mb-2">
            ERA Sheet
          </Typography>
          <IconButton onClick={() => dispatch(closeModal())}>
            <Close />
          </IconButton>
        </div>
        {treatmentStatus?.START_ERA == 0 ? (
          <>
            {/* collect consents from patient */}
            <ConsentsCheck
              consentType="ERA"
              patientInfo={patientInfo}
              reviewConsents={reviewConsentsERA}
            />
          </>
        ) : (
          <>
            <ERASheet
              eraFormData={eraFormData}
              setERAFormData={setERAFormData}
              eraTemplate={eraTemplate}
              handleUpdateTreatmentERASheet={handleUpdateTreatmentERASheet}
              patientInfo={patientInfo}
              setERATemplate={setERATemplate}
              canUpdate={treatmentStatus?.END_ERA == 0}
              medicationOptions={medicationOptionsFollicular}
              allBillTypeValues={allBillTypeValues}
            />
            <ScanSheet
              scanFormData={scanEraFormData}
              setScanFormData={setScanEraFormData}
              allBillTypeValues={allBillTypeValues}
              columns={eraTemplate?.columns}
            />
          </>
        )}
      </Modal>
      <Modal
        uniqueKey={'HYSTEROSCOPY' + patientInfo?.activeVisitId}
        maxWidth="sm"
        closeOnOutsideClick={true}
      >
        <div className="flex justify-between">
          <Typography variant="h6" className="text-gray-800 mb-2">
            Hysteroscopy
          </Typography>
          <IconButton onClick={() => dispatch(closeModal())}>
            <Close />
          </IconButton>
        </div>
        <div className="">
          {hysteroscopyTemplate ? (
            <div className="text-center mb-6">
              <HysteroscopySheet
                hysteroscopyTemplate={hysteroscopyTemplate}
                setHysteroscopyTemplate={setHysteroscopyTemplate}
              />
              <Button
                variant="contained"
                className="text-white capitalize mt-5"
                onClick={() =>
                  updateHysteroscopySheetMutation.mutate(
                    patientInfo?.activeVisitId,
                  )
                }
              >
                Update Hysteroscopy
              </Button>
            </div>
          ) : (
            <div className="text-center mb-6">
              <DateTimePicker
                label="Hysteroscopy Time"
                className="bg-white rounded-lg w-max-content mb-10"
                name="hysteroscopyTime"
                onChange={newValue =>
                  setHysteroscopyTime(
                    dayjs(newValue).format('YYYY-MM-DDTHH:mm:00[Z]'),
                  )
                }
                viewRenderers={{
                  hours: renderTimeViewClock,
                  minutes: renderTimeViewClock,
                  // seconds: renderTimeViewClock,
                }}
              />
              <h5 className="text-md font-semibold text-gray-800">
                Please Provide Hysteroscopy Time to proceed further
              </h5>
              <Button
                variant="contained"
                className="text-white capitalize mt-5"
                disabled={!hysteroscopyTime}
                onClick={() =>
                  startHysteroscopyMutation.mutate(patientInfo?.activeVisitId)
                }
              >
                Start Hysteroscopy
              </Button>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        uniqueKey="startTreatment"
        // handleClose={() => setViewForm(false)}
        // title={'New Treatment'}
        closeOnOutsideClick={true}
      >
        <div className="flex justify-between">
          <span className="text-xl font-semibold text-secondary flex items-center py-5 gap-4">
            New Treatment
          </span>
          <IconButton onClick={() => dispatch(closeModal())}>
            <Close />
          </IconButton>
        </div>
        <div className="flex flex-col gap-5">
          <RadioGroup
            value={treatmentForm.type}
            className="grid grid-cols-3 gap-2 p-2"
            // onChange={e =>
            //   setTreatmentForm({ ...treatmentForm, type: e.target.value, isPackageExists: treatmentTypes?.filter(each => each.id == e.target.value)[0]?.isPackageExists })
            // }
          >
            {treatmentTypes &&
              treatmentTypes?.map((each, index) => (
                <FormControlLabel
                  key={index}
                  value={each.id}
                  control={
                    <div
                      key={index}
                      // variant={treatmentForm.type === each ? "contained" : "outlined"}
                      onClick={() =>
                        setTreatmentForm({
                          ...treatmentForm,
                          type: each.name,
                          isPackageExists: each.isPackageExists,
                          treatmentTypeId: each.id,
                        })
                      }
                      className={` normal-case w-full hover:shadow hover:shadow-secondary text-center p-2 rounded-lg ${
                        treatmentForm.treatmentTypeId === each.id
                          ? ' shadow shadow-secondary text-secondary  '
                          : 'border hover:bg-secondary/10 hover:text-secondary '
                      }`}
                    >
                      {each.name}
                    </div>
                  }
                  // label={each}
                />
              ))}
          </RadioGroup>

          {treatmentForm?.isPackageExists && (
            <TextField
              label="Package Amount"
              value={treatmentForm.packageAmount}
              onChange={e =>
                setTreatmentForm({
                  ...treatmentForm,
                  packageAmount: e.target.value,
                })
              }
            />
          )}

          <div className="flex justify-end">
            <Button
              variant="outlined"
              onClick={() => {
                // console.log(treatmentForm, activeVisitId)
                if (!treatmentForm.type) {
                  toast.error('Please select a treatment type')
                } else if (
                  treatmentForm.isPackageExists &&
                  // treatmentForm.packageAmount &&
                  patientInfo?.activeVisitId
                ) {
                  createTreatment.mutate({
                    createType: 'Treatment',
                    type: treatmentForm.type,
                    treatmentTypeId: treatmentForm.treatmentTypeId,
                    visitId: patientInfo?.activeVisitId,
                    packageAmount: treatmentForm.packageAmount,
                  })
                } else if (
                  !treatmentForm.isPackageExists &&
                  patientInfo?.activeVisitId
                ) {
                  createTreatment.mutate({
                    createType: 'Treatment',
                    type: treatmentForm.type,
                    treatmentTypeId: treatmentForm.treatmentTypeId,
                    visitId: patientInfo?.activeVisitId,
                  })
                }
              }}
            >
              Create
            </Button>
          </div>
        </div>
      </Modal>
      <Modal uniqueKey="reviewCall" closeOnOutsideClick={true}>
        <div className="flex justify-between">
          <span className="text-lg font-semibold">Schedule a Call</span>
          <IconButton onClick={() => dispatch(closeModal())}>
            <Close />
          </IconButton>
        </div>
        <ReviewCallForm
          appointmentId={appointmentId}
          type={type}
          patientInfo={patientInfo}
          reviewAppointmentForm={reviewAppointmentForm}
          setReviewAppointmentForm={setReviewAppointmentForm}
          // selectedPatient={selectedPatient}
          // setSelectedPatient={setSelectedPatient}
        />
      </Modal>
      <Modal
        uniqueKey="reviewTreatmentCall"
        closeOnOutsideClick={true}
        maxWidth="md"
      >
        <div className="flex justify-between">
          <span className="text-lg font-semibold">Review Treatment Call</span>
          <IconButton onClick={() => dispatch(closeModal())}>
            <Close />
          </IconButton>
        </div>
        <ReviewTreatmentCall
          appointmentId={appointmentId}
          type={type}
          patientInfo={patientInfo}
          treatmentCycleId={treatmentCycleId}
          allBillTypeValues={allBillTypeValues}
          // selectedPatient={selectedPatient}
          // setSelectedPatient={setSelectedPatient}
          // reviewAppointmentForm={reviewAppointmentForm}
          // setReviewAppointmentForm={setReviewAppointmentForm}
        />
      </Modal>
      <Modal
        uniqueKey="endTreatment-ICSI"
        maxWidth="sm"
        closeOnOutsideClick={true}
      >
        <EndTreatmentModal
          type="ICSI"
          visitId={patientInfo?.activeVisitId}
          onClose={() => dispatch(closeModal('endTreatment-ICSI'))}
        />
      </Modal>
      {/* END IUI */}
      <Modal
        uniqueKey="endTreatment-IUI"
        maxWidth="sm"
        closeOnOutsideClick={true}
      >
        <EndTreatmentModal
          type="IUI"
          visitId={patientInfo?.activeVisitId}
          onClose={() => dispatch(closeModal('endTreatment-IUI'))}
        />
      </Modal>
      {/* END FET */}
      <Modal
        uniqueKey="endTreatment-FET"
        maxWidth="sm"
        closeOnOutsideClick={true}
      >
        <EndTreatmentModal
          type="FET"
          visitId={patientInfo?.activeVisitId}
          onClose={() => dispatch(closeModal('endTreatment-FET'))}
        />
      </Modal>
      {/* END OITI */}
      <Modal
        uniqueKey="endTreatment-OITI"
        maxWidth="sm"
        closeOnOutsideClick={true}
      >
        <EndTreatmentModal
          type="OITI"
          visitId={patientInfo?.activeVisitId}
          onClose={() => dispatch(closeModal('endTreatment-OITI'))}
        />
      </Modal>
      <Modal
        uniqueKey="endTreatment-Visit"
        maxWidth="sm"
        closeOnOutsideClick={true}
      >
        <CloseVisitModal
          type={type}
          visitId={patientInfo?.activeVisitId}
          consultationId={patientInfo?.consultationId}
          onClose={() => dispatch(closeModal('endTreatment-Visit'))}
        />
      </Modal>
    </div>
  )
}

export default Prescription
