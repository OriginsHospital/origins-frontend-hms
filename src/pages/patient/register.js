import React, { useEffect, useRef, useState } from 'react'
import {
  Button,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import {
  createPatientRecord,
  editPatientRecord,
  getCities,
  getPatientByAadharOrMobile,
  editGuardianRecord,
  createGuardianRecord,
  getVisitsByPatientId,
  getVisitInfoById,
  getPackageData,
  createPackage,
  editPackage,
  getConsentFormsList,
  downloadConsentFormById,
  getFormFTemplatesByPatientId,
} from '@/constants/apis'
import PatientForm from '@/components/PatientForm'
import {
  DocumentScannerOutlined,
  ExpandMore,
  SearchOutlined,
} from '@mui/icons-material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import GuardianFrom from '@/components/GuardianFrom'
import { Bounce, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import { TabContext } from '@mui/lab'
import { Tab, TextField, ToggleButton } from '@mui/material'
import VisitDetail from '@/components/VisitDetail'
import Consultations from '@/components/Consultations'
// import { Box } from '@mui/material';
import defaultProfile from '../../../public/dummyProfile.jpg'
import { hideLoader, showLoader } from '@/redux/loaderSlice'
import Treatments from '@/components/Treatments'
import VisitPatientInfo from '@/components/VisitPatientInfo'
import { closeModal, openModal } from '@/redux/modalSlice'
import PackageComponent from '@/components/PackageComponent'
import ConsentCRUD from '@/components/ConsentCRUD'
import { useRouter } from 'next/router'
import { CONSENT_TYPES, PATIENT_FORMS_TYPES } from '@/constants/consentTypes'
import UploadPatientForms from '@/components/UploadPatientForms'
import dayjs from 'dayjs'
import Modal from '@/components/Modal'
import AdvancePayments from '@/components/AdvancePayments'
import PatientHistory from '@/components/PatientHistory'

const toastconfig = {
  position: 'top-right',
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: 'light',
  transition: Bounce,
}
const bloodGroupOptions = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

export default function Register() {
  const router = useRouter()
  const [searchValue, setSearchValue] = useState('')
  const [photo, setPhoto] = useState(defaultProfile)
  const [formData, setFormData] = useState({
    branchId: '',
    aadhaarNo: '',
    mobileNo: '',
    firstName: '',
    lastName: '',
    gender: 'Female',
    maritalStatus: '',
    dateOfBirth: '',
    addressLine1: '',
    addressLine2: '',
    cityId: '',
    stateId: '',
    referralId: '',
    pincode: '',
    email: '',
    // photoPath: '',
    patientTypeId: '',
    hasGuardianInfo: false,
    referralName: '',
    createActiveVisit: true,
  })
  const [tab, setTab] = useState('patientRecord')
  const handleChangeTab = (event, newTab) => {
    setTab(newTab)
  }
  const [isEdit, setIsEdit] = useState('create')
  const [uploadedDocuments, setUploadedDocuments] = useState([])
  const [ageValidationState, setAgeValidationState] = useState({
    isValid: true,
    message: '',
    requiresAdult: false,
  })

  // initially it will be 'create' ---> actions : reset ,create
  // if patient already exists after search  'noneditable' ---> actions : edit
  // if user wants to edit patient record 'edit-patient' and if added or edited guardian 'edit-all' ---> actions : Save Changes

  const userDetails = useSelector((store) => store.user)
  // const dropdowns = useSelector((store) => store.dropdowns)
  const dispatch = useDispatch()
  const QueryClient = useQueryClient()
  // console.log(dropdowns)
  const fetchPatient = async (aadhar) => {
    // console.log(String(aadhar).length)
    if (
      String(aadhar).trim().length == 12
      // ||
      // String(searchValue).trim().length == 12
    ) {
      const patientRecord = await getPatientByAadharOrMobile(
        userDetails.accessToken,
        aadhar,
      )
      if (patientRecord.status == 200) {
        console.log(patientRecord.data)
        let { uploadedDocuments, ...nonUpload } = patientRecord.data
        setFormData(nonUpload)
        if (
          !!patientRecord.data?.photoPath ||
          patientRecord.data?.photoPath != ''
        ) {
          setImagePreview(patientRecord.data?.photoPath)
          setPhoto(null)
        } else {
          setImagePreview(null)
          setPhoto(defaultProfile)
        }
        setUploadedDocuments(uploadedDocuments || [])
        setIsEdit('noneditable')
        // setPhoto(null)
      } else if (patientRecord.status == 400) {
        toast.error(patientRecord.message)
        resetForm()
        setTab('patientRecord')
      }
    } else {
      resetForm()
      toast.error('Aadhar Number should be 12 digits')
    }
  }
  //useMutateforFetchPatient
  const { mutate: fetchPatientMutate, isLoading: fetchPatientLoading } =
    useMutation({
      mutationFn: async (aadhar) => {
        try {
          console.log('fetchPatientMutate', aadhar)
          dispatch(showLoader())
          await fetchPatient(aadhar)
          setTab('patientRecord')
        } catch (error) {
          console.log(error)
        } finally {
          dispatch(hideLoader())
        }
      },
      onSuccess: () => {
        QueryClient.invalidateQueries('visits', 'packageData')
      },
    })
  const resetForm = () => {
    setFormData({
      branchId: '',
      aadhaarNo: '',
      mobileNo: '',
      firstName: '',
      lastName: '',
      gender: 'Female',
      maritalStatus: '',
      dateOfBirth: '',
      addressLine1: '',
      addressLine2: '',
      cityId: '',
      stateId: '',
      referralId: '',
      pincode: '',
      photoPath: '',
      hasGuardianInfo: false,
      email: '',
      patientTypeId: '',
      referralName: '',
      // uploadedDocuments: []
    })
    setIsEdit('create')
    setImagePreview(null)
    setPhoto(defaultProfile)
    setUploadedDocuments([])
    setAgeValidationState({ isValid: true, message: '', requiresAdult: false })
    router.push('/patient/register')
    setSearchValue('')
  }
  const { data: cities } = useQuery({
    queryKey: ['cities', formData?.stateId],
    queryFn: async () => {
      const responsejson = await getCities(
        userDetails?.accessToken,
        formData?.stateId,
      )

      return responsejson ? responsejson : []
    },
    enabled: !!formData?.stateId, // Query runs only if userId is truthy
  })
  const { data: visits } = useQuery({
    queryKey: ['visits', formData?.id],
    queryFn: () => getVisitsByPatientId(userDetails?.accessToken, formData?.id),
    enabled: !!formData?.id,
  })
  useEffect(() => {
    console.log(visits?.data)
    if (visits?.data?.length > 0) {
      let activeVisit = visits?.data.filter((visit) => visit.isActive === 1)
      setSelectedVisit(activeVisit[0])
    } else {
      console.log('no vists')
      setSelectedVisit({ id: '' })
    }
  }, [visits?.data])
  // const validation = () => {
  //   var temp = {}
  //   let valid = true
  //   Object.keys(formData).map(key => {
  //     if (formData[key] === '') {
  //       temp = { ...temp, [key]: 'Required' }
  //       valid = false
  //     }
  //   })
  //   // setErrors(temp)
  //   console.log(temp)

  //   return valid
  // }

  const handleCreatePatient = async () => {
    if (!ageValidationState.isValid) {
      toast.error(
        ageValidationState.message ||
          'Patient must be at least 18 years old for the selected type.',
      )
      return
    }
    console.log('create patient', photo == defaultProfile)
    const createPatient = createPatientRecord(
      userDetails.accessToken,
      formData,
      photo == defaultProfile ? null : photo,
      // uploadedDocuments,
    )
    createPatient.then((res) => {
      if (res.status == 200) {
        toast.success('Successfully Registered Patient', toastconfig)
        fetchPatientMutate(formData?.aadhaarNo)
      } else if (res.status == 400) {
        toast.error(res.message)
      }
    })
  }

  const handleEditPatient = async () => {
    if (!ageValidationState.isValid) {
      toast.error(
        ageValidationState.message ||
          'Patient must be at least 18 years old for the selected type.',
      )
      return
    }
    const {
      hasGuardianInfo,
      guardianDetails,
      patientId,
      createdBy,
      updatedBy,
      createdAt,
      updatedAt,
      ...editPatientPayload
    } = formData
    const editPatient = await editPatientRecord(
      userDetails?.accessToken,
      editPatientPayload,
      photo == defaultProfile ? null : photo,
    )
    if (editPatient.status == 200) {
      toast.success(editPatient.message, toastconfig)
      setIsEdit('noneditable')
      console.log('editPatientMutate', formData?.aadhaarNo)
      fetchPatientMutate(formData?.aadhaarNo)
    } else {
      toast.error(editPatient.message, toastconfig)
    }
  }

  const handleCreateGuardian = async () => {
    const guardianPayload = {
      ...formData.guardianDetails,
      patientId: formData?.id,
      // relation: 'Spouse',
      // gender: 'Male',
    }
    const createGuardian = await createGuardianRecord(
      userDetails.accessToken,
      guardianPayload,
    )
    if (createGuardian.status === 200) {
      toast.success(createGuardian.message, toastconfig)
      setIsEdit('noneditable')
      fetchPatientMutate(formData?.aadhaarNo)
    } else {
      toast.error(createGuardian.message, toastconfig)
    }
  }

  const handleEditGuardian = async () => {
    const { createdAt, updatedAt, ...editGuardianPayload } =
      formData.guardianDetails
    const editGuardian = await editGuardianRecord(
      userDetails?.accessToken,
      editGuardianPayload,
    )
    if (editGuardian.status === 200) {
      toast.success(editGuardian.message, toastconfig)
      setIsEdit('noneditable')
      fetchPatientMutate(formData?.aadhaarNo)
    } else {
      toast.error(editGuardian.message, toastconfig)
    }
  }

  const handleButtons = async () => {
    if (isEdit == 'noneditable') {
      setIsEdit('edit')
    } else {
      if (!!formData.id) {
        // Patient exists, update patient record
        await handleEditPatient()

        if (formData.hasGuardianInfo) {
          if (!!formData.guardianDetails.id) {
            // Guardian exists, update guardian details
            await handleEditGuardian()
          } else {
            // Guardian doesn't exist, create new guardian
            await handleCreateGuardian()
          }
        }
      } else {
        // Create new patient
        await handleCreatePatient()
      }
    }
  }
  const [imagePreview, setImagePreview] = useState(null)

  const uploadProfile = (event) => {
    const file = event.target.files[0]
    console.log('uploadProfile', file)
    dispatch(showLoader())
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        // Set the data URL as the image preview
        setImagePreview(reader.result)
        setPhoto(file)
      }
      reader.readAsDataURL(file)
    }
    dispatch(hideLoader())
  }
  const [selectedVisit, setSelectedVisit] = useState({ id: '' })
  // useEffect(() => {
  //     // console.log('visits', visits);

  //     // else {
  //     //     console.log('no vists')
  //     //     setSelectedVisit({ id: '' })
  //     // }
  //     // console.log(activeVisit)
  // }, [])
  const [showTab, setShowTab] = useState('consultations')
  const [selectedTab, setSelectedTab] = useState({
    type: null,
    id: null,
  })
  const { data: visitInfo } = useQuery({
    queryKey: ['visitInfo', selectedVisit?.id],
    queryFn: () =>
      getVisitInfoById(userDetails?.accessToken, selectedVisit?.id),
    enabled: !!selectedVisit?.id,
  })
  const [isEditing, setIsEditing] = useState(true)

  // /visits/getPackages/1
  const { data: PackageData } = useQuery({
    queryKey: ['PackageData', selectedVisit?.id],
    queryFn: async () => {
      const res = await getPackageData(
        userDetails?.accessToken,
        selectedVisit?.id,
      )
      if (res.status === 400) {
        toast.error(res.message)
      } else if (res.status === 200) {
        setIsEditing(!!res.data.registrationDate ? false : true)
        return res
      }
    },
    enabled: !!selectedVisit?.id,
  })
  const createPackageMutate = useMutation({
    mutationFn: async (payload) => {
      const res = await createPackage(userDetails.accessToken, {
        ...payload,
        visitId: selectedVisit?.id,
      })
      console.log('under mutation fn', res)
      if (res.status === 400) {
        toast.error(res.message)
      } else if (res.status == 200) {
        toast.success(res.message)
        setIsEditing(false)
      }
    },
    onSuccess: () => {
      QueryClient.invalidateQueries('packageData')
    },
  })
  const editPackageMutate = useMutation({
    mutationFn: async (payload) => {
      const { updatedAt, createdAt, ...newPayload } = payload
      const res = await editPackage(userDetails.accessToken, {
        ...newPayload,
        visitId: selectedVisit?.id,
      })
      console.log('under mutation fn', res)
      if (res.status === 400) {
        toast.error(res.message)
      } else if (res.status == 200) {
        toast.success(res.message)
        setIsEditing(false)
      }
    },
    onSuccess: () => {
      QueryClient.invalidateQueries('packageData')
    },
  })
  const handleChangeVisit = (e) => {
    console.log(e.target.value, visits)
    if (e.target.value == 'createVisit') {
      dispatch(openModal('createVisit'))
    } else {
      let selectVisit = visits.data.filter(
        (visit) => visit.id === e.target.value,
      )
      setSelectedVisit(selectVisit[0])
    }
  }
  const handleChangeSubTab = (event, newTab) => {
    setShowTab(newTab)
  }

  // Add useEffect to handle route changes
  useEffect(() => {
    // Get search param from URL
    const { search } = router.query
    if (search) {
      setSearchValue(search)
      fetchPatientMutate(search)
    }
  }, [router.query])

  // Modify the search field handlers
  const handleSearchChange = (e) => {
    setSearchValue(e.target.value)
  }

  const handleSearch = (value) => {
    router.push(
      {
        pathname: router.pathname,
        query: { search: value },
      },
      undefined,
      { shallow: true },
    )
  }

  const patientFormRef = useRef(null)
  const guardianFormRef = useRef(null)

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate both forms
    const isPatientFormValid = patientFormRef.current?.validateForm()
    const isGuardianFormValid = formData.hasGuardianInfo
      ? guardianFormRef.current?.validateGuardianForm()
      : true

    if (!isPatientFormValid || !isGuardianFormValid) {
      toast.error('Please fill in all required fields correctly', {
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'light',
      })
      setIsEdit('edit')
      return
    }

    try {
      const formDataToSend = new FormData()
      // ... rest of the submit logic
      if (isEdit == 'noneditable') {
        setIsEdit('edit')
      } else {
        if (!!formData.id) {
          // Patient exists, update patient record
          await handleEditPatient()

          if (formData.hasGuardianInfo) {
            if (!!formData.guardianDetails.id) {
              // Guardian exists, update guardian details
              await handleEditGuardian()
            } else {
              // Guardian doesn't exist, create new guardian
              await handleCreateGuardian()
            }
          }
        } else {
          // Create new patient
          await handleCreatePatient()
        }
      }
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <div className="pb-14 ">
      <div className="px-3 py-10 flex items-center justify-center gap-5">
        <TextField
          placeholder="Enter Aadhaar Number"
          className="w-[300px] bg-white"
          type="search"
          value={searchValue}
          onChange={handleSearchChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch(searchValue)
            }
          }}
        />
        <Button
          onClick={() => handleSearch(searchValue)}
          variant="contained"
          sx={{ color: 'white' }}
          startIcon={<SearchOutlined />}
        >
          Search
        </Button>
      </div>
      <hr />
      <TabContext value={tab}>
        <div className="flex bg-white ">
          {/* <Box> */}
          <TabList onChange={handleChangeTab}>
            {/* <span value='patientRecord'>Patient Details</span> */}
            <Tab label="Patient" value="patientRecord" />
            {formData.id && <Tab label="Visit" value="visitRecord" />}
            {/* package tab */}
            {selectedVisit?.id && PackageData?.data && (
              <Tab label="Package" value="package" />
            )}
            {selectedVisit?.id &&
              visitInfo?.data?.Treatments?.length > 0 &&
              visitInfo?.data?.Treatments[0] &&
              visitInfo?.data?.Treatments[0]?.treatmentTypeId !== 1 && (
                <Tab label="Consent Forms" value="consentForms" />
              )}
            {formData.id && <Tab label="Patient Forms" value="patientForms" />}
            {formData.id && (
              <Tab label="Advance Payments" value="advancePayment" />
            )}
          </TabList>
          {/* </Box> */}
        </div>

        <TabPanel value="patientRecord" className="">
          <div className="flex justify-between gap-3 pt-2">
            <Button
              variant="outlined"
              // disabled={activeStep === 0}
              onClick={resetForm}
              sx={{ mr: 1 }}
            >
              Reset
            </Button>

            <Button
              onClick={handleSubmit}
              variant="contained"
              sx={{
                color: 'white',
              }}
              disabled={isEdit !== 'noneditable' && !ageValidationState.isValid}
            >
              {!!formData.id
                ? isEdit == 'noneditable'
                  ? 'Edit Record'
                  : 'Update Record'
                : 'Create Record'}
            </Button>
          </div>

          <div
            className={`grid  gap-3 ${
              formData.hasGuardianInfo ? 'grid-cols-3' : 'grid-cols-1'
            }`}
          >
            <div className="flex flex-col col-span-2">
              <div className="flex justify-end">
                {formData?.patientId && (
                  <Button
                    variant="text"
                    onClick={() => {
                      dispatch(openModal(formData?.patientId + 'History'))
                    }}
                    className="capitalize text-secondary"
                  >
                    View Patient History
                  </Button>
                )}
                <PatientHistory
                  patient={{
                    patientId: formData?.patientId,
                    // activeVisitId: formData?.activeVisitId,
                  }}
                  onClose={() => {
                    dispatch(closeModal(formData?.patientId + 'History'))
                  }}
                />
              </div>
              <PatientForm
                formData={formData}
                setFormData={setFormData}
                isEdit={isEdit}
                cities={cities}
                uploadProfile={uploadProfile}
                photo={photo}
                imagePreview={imagePreview}
                uploadedDocuments={uploadedDocuments}
                setUploadedDocuments={setUploadedDocuments}
                setPhoto={setPhoto}
                setImagePreview={setImagePreview}
                ref={patientFormRef}
                bloodGroupOptions={bloodGroupOptions}
                onAgeValidationChange={(data) =>
                  setAgeValidationState((prev) => ({ ...prev, ...data }))
                }
              />
            </div>
            {formData.hasGuardianInfo && (
              <GuardianFrom
                formData={formData}
                setFormData={setFormData}
                isEdit={isEdit}
                ref={guardianFormRef}
                bloodGroupOptions={bloodGroupOptions}
              />
            )}
          </div>
        </TabPanel>

        <TabPanel value="visitRecord">
          <VisitDetail
            formData={formData}
            visits={visits}
            selectedVisit={selectedVisit}
            handleChangeVisit={handleChangeVisit}
            setSelectedVisit={setSelectedVisit}
          />
          {/* <VisitPatientInfo formData={formData} photo={photo} imagePreview={imagePreview} /> */}
          <TabContext value={showTab}>
            <TabList onChange={handleChangeSubTab}>
              <Tab label="Consultations" value="consultations"></Tab>
              <Tab label="Treatments" value="treatments"></Tab>
            </TabList>

            <TabPanel value="consultations">
              <Consultations
                Consultations={visitInfo?.data?.Consultations}
                selectedVisit={selectedVisit}
                selectedTab={selectedTab}
                setSelectedTab={setSelectedTab}
              />
            </TabPanel>
            <TabPanel value="treatments">
              <Treatments
                Treatments={visitInfo?.data?.Treatments}
                selectedVisit={selectedVisit}
                selectedTab={selectedTab}
                setSelectedTab={setSelectedTab}
              />
            </TabPanel>
          </TabContext>

          {/* <ValidSubRow row={row} UserDetails={UserDetails} /> */}
        </TabPanel>

        <TabPanel value="package">
          <VisitDetail
            formData={formData}
            visits={visits}
            selectedVisit={selectedVisit}
            handleChangeVisit={handleChangeVisit}
            setSelectedVisit={setSelectedVisit}
          />
          <PackageComponent
            selectedVisit={selectedVisit}
            packageData={PackageData?.data}
            createPackageMutate={createPackageMutate}
            editPackageMutate={editPackageMutate}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
          />
        </TabPanel>

        <TabPanel value="consentForms">
          <VisitDetail
            formData={formData}
            visits={visits}
            selectedVisit={selectedVisit}
            handleChangeVisit={handleChangeVisit}
            setSelectedVisit={setSelectedVisit}
          />
          <ConsentForms
            patientDetails={formData}
            selectedVisit={selectedVisit}
            visitInfo={visitInfo?.data}
          />
        </TabPanel>
        <TabPanel value="patientForms">
          <VisitDetail
            formData={formData}
            visits={visits}
            selectedVisit={selectedVisit}
            handleChangeVisit={handleChangeVisit}
            setSelectedVisit={setSelectedVisit}
          />
          <PatientForms
            patientDetails={formData}
            selectedVisit={selectedVisit}
            visitInfo={visitInfo?.data}
          />
        </TabPanel>
        <TabPanel value="advancePayment">
          <AdvancePayments formData={formData} />
        </TabPanel>
      </TabContext>
    </div>
  )
}

function ConsentForms({ patientDetails, selectedVisit, visitInfo }) {
  const userDetails = useSelector((store) => store.user)
  const filteredConsents = Object.values(CONSENT_TYPES).filter((type) => {
    const treatmentId =
      visitInfo?.Treatments?.length > 0
        ? visitInfo?.Treatments[0]?.treatmentTypeId
        : null

    switch (treatmentId) {
      case 1:
        return false

      case 2:
      case 3:
        return type.id === 'IUI'

      case 4:
      case 5:
      case 6:
      case 7:
        return type.id === 'ICSI' || type.id === 'FET' || type.id === 'ERA'

      default:
        return false
    }
  })
  const [activeConsentType, setActiveConsentType] = useState(
    Object.values(filteredConsents)[0]?.id,
  )
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  const { data: consentFormsList } = useQuery({
    queryKey: ['consentFormsList', activeConsentType],
    queryFn: () =>
      getConsentFormsList(userDetails.accessToken, activeConsentType),
    enabled: !!activeConsentType,
  })
  const downloadConsentFormMutate = useMutation({
    mutationFn: async (id) => {
      const res = await downloadConsentFormById(
        userDetails.accessToken,
        id,
        patientDetails?.patientId,
      )
      console.log('res', res)
    },
  })
  const useConsentOperations = (consentType) => {
    const { apis } = CONSENT_TYPES[consentType]
    const { data: consents, isLoading } = useQuery({
      queryKey: [`${consentType.toLowerCase()}Consents`, selectedVisit?.id],
      queryFn: async () => {
        dispatch(showLoader())
        const res = await apis.get(userDetails.accessToken, selectedVisit?.id)
        dispatch(hideLoader())
        return res
      },
      enabled: !!selectedVisit?.id,
    })
    const uploadMutation = useMutation({
      mutationFn: async (file) => {
        dispatch(showLoader())
        const res = await apis.upload(
          userDetails.accessToken,
          selectedVisit?.id,
          file,
          patientDetails?.id,
        )
        if (res.status == 200) {
          queryClient.invalidateQueries(`${consentType.toLowerCase()}Consents`)
          toast.success(`${consentType} consent form uploaded successfully`)
        } else {
          toast.error(
            `Failed to upload ${consentType} consent form: ${res.message}`,
          )
        }
        dispatch(hideLoader())
        return res
      },
    })
    const deleteMutation = useMutation({
      mutationFn: async (id) => {
        dispatch(showLoader())
        const res = await apis.delete(userDetails.accessToken, id)
        dispatch(hideLoader())
        if (res.status == 200) {
          queryClient.invalidateQueries(`${consentType.toLowerCase()}Consents`)
          toast.success(`${consentType} consent form deleted successfully`)
        } else {
          toast.error(
            `Failed to delete ${consentType} consent form: ${res.message}`,
          )
        }
        return res
      },
    })

    return {
      consents,
      isLoading,
      uploadConsent: uploadMutation.mutate,
      deleteConsent: deleteMutation.mutate,
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <TabContext value={activeConsentType}>
        <div className="grid grid-cols-12 gap-6">
          {/* Vertical Tabs */}
          <div className="col-span-3 bg-white rounded-lg shadow-sm">
            <TabList
              onChange={(e, newValue) => setActiveConsentType(newValue)}
              orientation="vertical"
              variant="scrollable"
              sx={{
                borderRight: 1,
                borderColor: 'divider',
                '& .MuiTab-root': {
                  alignItems: 'flex-start',
                  textAlign: 'left',
                  paddingLeft: '1.5rem',
                  minHeight: '3.5rem',
                },
                '& .Mui-selected': {
                  backgroundColor: 'rgba(176, 233, 250, 0.2)',
                  borderRight: '2px solid #b0e9fa',
                },
                '& .MuiTabs-indicator': {
                  display: 'none',
                },
              }}
            >
              {filteredConsents.map((type) => (
                <Tab
                  key={type.id}
                  label={
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-md bg-primary">
                        <DocumentScannerOutlined className="h-5 w-5 text-secondary" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{type.id}</p>
                        {/* <p className="text-xs text-gray-500">
                          Manage {type.id.toLowerCase()} consent forms
                        </p> */}
                      </div>
                    </div>
                  }
                  value={type.id}
                  className="!min-h-[80px]"
                />
              ))}
            </TabList>
          </div>

          {/* Content Area */}
          <div className="col-span-9">
            {filteredConsents.map((type) => (
              <TabPanel
                key={type.id}
                value={type.id}
                sx={{
                  padding: 0,
                  height: '100%',
                }}
              >
                <ConsentCRUD
                  consentType={type.id}
                  consentFormsList={consentFormsList}
                  useConsentOperations={useConsentOperations}
                  downloadConsentFormMutate={downloadConsentFormMutate}
                />
              </TabPanel>
            ))}
          </div>
        </div>
      </TabContext>
    </div>
  )
}

function PatientForms({ patientDetails, selectedVisit, visitInfo }) {
  const userDetails = useSelector((store) => store.user)
  const patientFormsList = Object.values(PATIENT_FORMS_TYPES)

  const [activeFormType, setActiveFormType] = useState(patientFormsList[0].id)
  const [selectedFormDetails, setSelectedFormDetails] = useState(null)
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  const { data: getFormFHistoryByPatientId, isLoading } = useQuery({
    queryKey: ['getFormFHistoryByPatientId', patientDetails?.patientId],
    queryFn: () =>
      getFormFTemplatesByPatientId(
        userDetails.accessToken,
        patientDetails?.patientId,
      ),
    enabled: !!patientDetails?.patientId,
  })

  return (
    <div className="max-w-7xl mx-auto">
      <TabContext value={patientFormsList[0].id}>
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-3 bg-white rounded-lg shadow-sm">
            <TabList
              onChange={(e, newValue) => setActiveFormType(newValue)}
              orientation="vertical"
              variant="scrollable"
              sx={{
                borderRight: 1,
                borderColor: 'divider',
                '& .MuiTab-root': {
                  alignItems: 'flex-start',
                  textAlign: 'left',
                  paddingLeft: '1.5rem',
                  minHeight: '3.5rem',
                },
                '& .Mui-selected': {
                  backgroundColor: 'rgba(176, 233, 250, 0.2)',
                  borderRight: '2px solid #b0e9fa',
                },
                '& .MuiTabs-indicator': {
                  display: 'none',
                },
              }}
            >
              {patientFormsList.map((type) => (
                <Tab
                  key={type.id}
                  label={
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-md bg-primary">
                        <DocumentScannerOutlined className="h-5 w-5 text-secondary" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {type.label}
                        </p>
                      </div>
                    </div>
                  }
                  value={type.id}
                  className="!min-h-[80px]"
                />
              ))}
            </TabList>
          </div>

          <div className="col-span-9">
            {patientFormsList.map((type) => (
              <TabPanel
                key={type.id}
                value={type.id}
                sx={{
                  padding: 0,
                  height: '100%',
                }}
              >
                <div className="space-y-6">
                  <div className="max-h-[500px] overflow-y-auto bg-gray-50 rounded-lg p-4 shadow-inner">
                    {getFormFHistoryByPatientId?.data?.length > 0 &&
                      getFormFHistoryByPatientId?.data?.map(
                        (eachAppointment) => (
                          <div
                            className="p-6 mb-2 flex flex-col gap-6 rounded-lg shadow-lg border border-gray-200 bg-white max-h-[500px] overflow-y-auto"
                            key={eachAppointment.appointmentId}
                          >
                            <div className="flex justify-between items-center">
                              <p className="text-md font-semibold text-gray-900 truncate">
                                {dayjs(
                                  eachAppointment?.appointmentInfo
                                    ?.appointmentDate,
                                ).format('DD-MM-YYYY')}
                              </p>
                              <h2
                                title={
                                  eachAppointment?.appointmentInfo?.doctorName
                                }
                                className="text-md font-semibold text-gray-900 truncate"
                              >
                                {eachAppointment?.appointmentInfo?.doctorName}
                              </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {eachAppointment.formFTemplateDetails.map(
                                (form) => (
                                  <div
                                    className="flex flex-col gap-3 p-4 border rounded-lg bg-white shadow-md hover:shadow-lg transition-shadow duration-300"
                                    key={form.scanId}
                                  >
                                    <div className="flex justify-between items-center">
                                      <div>
                                        <p className="font-semibold text-gray-800 truncate w-[1/2]">
                                          {form.scanName}
                                        </p>
                                        <p className="text-sm text-gray-500 wrap">
                                          Scan ID: {form.scanId}
                                        </p>
                                      </div>
                                      <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
                                        {form.type}
                                      </div>
                                    </div>

                                    <div className="flex justify-end">
                                      <Button
                                        variant="contained"
                                        className="bg-secondary text-white rounded-md px-5 py-2 hover:bg-secondary-dark transition duration-200"
                                        onClick={() => {
                                          setSelectedFormDetails({
                                            ...form,
                                            patientId: patientDetails.patientId,
                                            appointmentId:
                                              eachAppointment.appointmentId,
                                          })
                                          dispatch(openModal('uploadFormF'))
                                        }}
                                      >
                                        View Details
                                      </Button>
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        ),
                      )}
                    {(!getFormFHistoryByPatientId ||
                      getFormFHistoryByPatientId.data.length <= 0) && (
                      <div className="flex flex-col items-center justify-center p-6">
                        <div className="text-gray-700 font-semibold text-lg mb-2">
                          No Paid Scans Found!
                        </div>
                        <p className="text-gray-500 text-sm">
                          Try searching again or check back later.
                        </p>
                      </div>
                    )}
                  </div>

                  <Modal
                    maxWidth={'lg'}
                    uniqueKey="uploadFormF"
                    closeOnOutsideClick={true}
                  >
                    <UploadPatientForms
                      formType={type.id}
                      formDetails={selectedFormDetails}
                    />
                  </Modal>
                </div>
              </TabPanel>
            ))}
          </div>
        </div>
      </TabContext>
    </div>
  )
}
