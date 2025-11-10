import React, { useEffect, useMemo, useState, useRef } from 'react'
import RenderPrescriptionPharmacy from './RenderPrescriptionPharmacy'
import dynamic from 'next/dynamic'

import RichText from '@/components/RichText'
import { useDispatch, useSelector } from 'react-redux'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, IconButton } from '@mui/material'
import Select from 'react-select'
import Modal from './Modal'
import { FaPrescriptionBottleMedical } from 'react-icons/fa6'
import { closeModal, openModal } from '@/redux/modalSlice'
import {
  getLineBillsAndNotesForAppointment,
  saveLineBillsAndNotes,
  printPrescription,
} from '@/constants/apis'
import { toast } from 'react-toastify'
import { toastconfig } from '@/utils/toastconfig'
import { Close } from '@mui/icons-material'
import { getMultipleForQuatityCalculation } from '@/constants/utils'
import dayjs from 'dayjs'

const JoditEditor = dynamic(() => import('jodit-react'), {
  ssr: false,
})

function PatientPrescription({
  allBillTypeValues,
  type,
  appointmentId,
  activeVisitAppointments,
}) {
  const user = useSelector(store => store.user)
  const { billTypes } = useSelector(store => store.dropdowns)
  const [notesValue, setNotesValue] = useState()
  const [defaultLineBillValues, setDefaultLineBillValues] = useState(null)
  const [printTemplate, setPrintTemplate] = useState(null)
  const dispatch = useDispatch()
  const editor = useRef(null)
  const modal = useSelector(store => store.modal)
  const queryClient = useQueryClient()
  const billTypesMap = useMemo(() => {
    const map = {}
    billTypes.map(eachBillType => {
      map[eachBillType.id] = eachBillType.name
      map[eachBillType.name] = eachBillType.id
    })
    return map
  }, [billTypes])

  const {
    data: lineBillsAndNotesDataForCurrentAppointment,
    isLoading,
  } = useQuery({
    queryKey: ['lineBillsAndNotesForCurrentAppointment', type, appointmentId],
    queryFn: async () => {
      const responsejson = await getLineBillsAndNotesForAppointment(
        user.accessToken,
        type,
        appointmentId,
      )
      if (responsejson.status == 200) {
        return responsejson.data
      } else {
        throw new Error(
          'Error occurred while fetching Line Bills and Notes for Current Appointment',
        )
      }
    },
    enabled: !!appointmentId && !!type && modal.key === 'addPrescription',
  })

  const { mutate, isPending } = useMutation({
    mutationFn: async payload => {
      const res = await saveLineBillsAndNotes(user.accessToken, payload)
      if (res.status === 200) {
        dispatch(closeModal())
        queryClient.invalidateQueries({
          queryKey: ['medicationOptionsFollicular'],
        })
        toast.success('Saved Successfully', toastconfig)
      } else {
        console.log(res)
        toast.error(res.message, toastconfig)
      }
    },
  })

  function onAddPrescriptionClick() {
    dispatch(openModal('addPrescription'))
  }
  function onSaveClick() {
    let DBFormatData = ConvertDataToDBFormat()
    if (notesValue == null && DBFormatData.length === 0) {
      toast.error('Please enter values', toastconfig)
    } else {
      mutate({
        createType: type,
        appointmentId: appointmentId,
        notes: notesValue,
        lineBillEntries: DBFormatData,
      })
    }
  }
  function ConvertDataToDBFormat() {
    let billTypeStruct = []
    if (defaultLineBillValues) {
      const SelectedTypeIdArray = Object.keys(defaultLineBillValues)
      if (SelectedTypeIdArray.length != 0) {
        SelectedTypeIdArray?.map(data => {
          const SelectedTypeValuesArray = defaultLineBillValues?.[data]
          if (SelectedTypeValuesArray?.length != 0) {
            // Filter out paid items and remove status field from each item
            const billTypeValues = SelectedTypeValuesArray.filter(
              item => item.status !== 'PAID',
            ).map(({ status, ...item }) => item) // Destructure to remove status

            if (billTypeValues.length > 0) {
              billTypeStruct.push({
                billTypeId: data,
                billTypeValues: billTypeValues,
              })
            }
          }
        })
      }
    }
    return billTypeStruct
  }
  const setSelectedValues = name => selectedOptions => {
    const billTypeId = billTypesMap[name]

    // Get current paid items
    const currentPaidItems =
      defaultLineBillValues?.[billTypeId]?.filter(
        item => item.status === 'PAID',
      ) ?? []

    let copyOfDefaultLineBillValues = { ...defaultLineBillValues }
    let billTypeValues = [...currentPaidItems] // Start with paid items

    // Add selected unpaid items
    selectedOptions?.forEach(element => {
      // Skip if it's already in paid items
      if (!currentPaidItems.some(paid => paid.id === element.value)) {
        const BillTypeValuesArray = allBillTypeValues[name]
        const BillTYpeValueObject = BillTypeValuesArray.find(values => {
          return values.id === element.value
        })

        // console.log(name, BillTypeValuesArray, element)
        if (name === 'Pharmacy') {
          const infoObject = defaultLineBillValues['3']?.find(values => {
            return values.id === BillTYpeValueObject.id
          })

          billTypeValues.push({
            id: element.value,
            name: element.label,
            amount: parseInt(BillTYpeValueObject.amount, 10),
            prescribedQuantity: infoObject?.prescribedQuantity ?? 1,
            prescriptionDetails: infoObject?.prescriptionDetails ?? '',
            prescriptionDays: infoObject?.prescriptionDays ?? 1,
            status: 'UNPAID',
          })
        } else {
          billTypeValues.push({
            id: element.value,
            name: element.label,
            amount: parseInt(BillTYpeValueObject.amount, 10),
            status: 'UNPAID',
          })
        }
      }
    })

    copyOfDefaultLineBillValues[billTypeId] = billTypeValues
    setDefaultLineBillValues(copyOfDefaultLineBillValues)
  }
  const handleDeleteClicked = (pharmacyId, id) => {
    setDefaultLineBillValues(prevState => {
      if (!prevState) return {}
      const copyOfLineBillValues = { ...prevState }
      if (copyOfLineBillValues?.[pharmacyId]) {
        copyOfLineBillValues[pharmacyId] = copyOfLineBillValues[
          pharmacyId
        ].filter(lineBill => lineBill.id !== id)
      }
      return copyOfLineBillValues
    })
  }

  const handleDaysChange = (prescriptionId, days) => {
    const billTypeIdPrescription = '3' //bill type = prescription
    const copyOfDefaultLineBillValues = JSON.parse(
      JSON.stringify(defaultLineBillValues),
    )
    let tempLineBillValues = copyOfDefaultLineBillValues?.[
      billTypeIdPrescription
    ]?.map(lineBillValues => {
      if (lineBillValues.id == prescriptionId) {
        lineBillValues.prescriptionDays = days
        lineBillValues.prescribedQuantity =
          days *
          getMultipleForQuatityCalculation(lineBillValues.prescriptionDetails)
      }
      return lineBillValues
    })
    if (copyOfDefaultLineBillValues[billTypeIdPrescription]?.length != 0) {
      copyOfDefaultLineBillValues[billTypeIdPrescription] = tempLineBillValues
      setDefaultLineBillValues(copyOfDefaultLineBillValues)
    }
  }
  const handleIntakeChange = (prescriptionId, medIntake) => {
    const billTypeIdPrescription = '3' //bill type = prescription
    const copyOfDefaultLineBillValues = JSON.parse(
      JSON.stringify(defaultLineBillValues),
    )
    let tempLineBillValues = copyOfDefaultLineBillValues?.[
      billTypeIdPrescription
    ]?.map(lineBillValues => {
      if (lineBillValues.id == prescriptionId) {
        lineBillValues.prescriptionDetails = medIntake
        lineBillValues.prescribedQuantity =
          lineBillValues.prescriptionDays *
          getMultipleForQuatityCalculation(medIntake)
      }
      return lineBillValues
    })
    if (copyOfDefaultLineBillValues[billTypeIdPrescription]?.length != 0) {
      copyOfDefaultLineBillValues[billTypeIdPrescription] = tempLineBillValues
      setDefaultLineBillValues(copyOfDefaultLineBillValues)
    }
  }
  useEffect(() => {
    let tempdefaultData = {}
    if (lineBillsAndNotesDataForCurrentAppointment) {
      const selectedData = ['lineBillsData', 'Notesdata']
      lineBillsAndNotesDataForCurrentAppointment[selectedData[0]].map(data => {
        const billTypeId = data['billType']?.id
        const updatedArray = data?.billTypeValues
          ?.map(
            ({
              id,
              name,
              amount,
              prescribedQuantity,
              prescriptionDetails,
              prescriptionDays,
              status,
              isSpouse,
            }) => ({
              id,
              name,
              amount,
              prescribedQuantity: billTypeId === 3 ? prescribedQuantity : 1,
              prescriptionDetails: billTypeId === 3 ? prescriptionDetails : '',
              prescriptionDays:
                billTypeId === 3 && prescriptionDays ? prescriptionDays : 1,
              status,
              isSpouse,
            }),
          )
          .filter(item => item.isSpouse === 0)
        tempdefaultData[data.billType.id] = updatedArray
      })
      const notesText =
        lineBillsAndNotesDataForCurrentAppointment.notesData?.notes
      setNotesValue(notesText ? notesText : '')
      setDefaultLineBillValues(tempdefaultData)
    }
  }, [lineBillsAndNotesDataForCurrentAppointment])

  const handlePrintPrescription = async () => {
    try {
      const response = await printPrescription(user.accessToken, {
        type: type,
        appointmentId: appointmentId,
        isSpouse: 0,
      })
      if (response.status === 200) {
        setPrintTemplate(response?.data)

        dispatch(openModal(`printPrescription-${type}-${appointmentId}`))
      } else {
        toast.error('Failed to fetch print template', toastconfig)
      }
    } catch (error) {
      console.log(error)
      toast.error(
        'An error occurred while fetching print template',
        toastconfig,
      )
    }
  }

  const fetchAndSetLineBills = async (selectedType, selectedAppointmentId) => {
    try {
      const response = await getLineBillsAndNotesForAppointment(
        user.accessToken,
        selectedType,
        selectedAppointmentId,
      )

      if (response.status === 200) {
        const data = response.data

        // Set notes
        setNotesValue(data.notesData?.notes || '')

        // Process line bills
        let tempDefaultData = {}
        if (data.lineBillsData) {
          data.lineBillsData.forEach(billTypeData => {
            if (billTypeData.billType && billTypeData.billTypeValues) {
              const billTypeId = billTypeData.billType.id
              const updatedArray = billTypeData.billTypeValues
                .filter(item => !item.isSpouse) // Filter out spouse items
                .map(item => ({
                  id: item.id,
                  name: item.name,
                  amount: parseInt(item.amount, 10),
                  prescribedQuantity:
                    billTypeId === 3 ? item.prescribedQuantity || 1 : 1,
                  prescriptionDetails:
                    billTypeId === 3 ? item.prescriptionDetails || '' : '',
                  prescriptionDays:
                    billTypeId === 3 ? item.prescriptionDays || 1 : 1,
                  status: 'UNPAID', // Set as unpaid for new prescription
                }))

              if (updatedArray.length > 0) {
                tempDefaultData[billTypeId] = updatedArray
              }
            }
          })
        }

        // Log the processed data for debugging
        console.log('Processed line bills:', tempDefaultData)

        // Update the state
        setDefaultLineBillValues(prev => {
          const newState = { ...tempDefaultData }
          console.log('New state:', newState)
          return newState
        })

        // Verify that the data was set correctly
        setTimeout(() => {
          console.log('Current defaultLineBillValues:', defaultLineBillValues)
        }, 0)

        toast.success('Prescription copied successfully', toastconfig)
      } else {
        throw new Error('Failed to fetch prescription details')
      }
    } catch (error) {
      console.error('Error fetching line bills:', error)
      toast.error('Failed to fetch prescription details', toastconfig)
    }
  }

  // Add this useEffect to monitor state changes
  useEffect(() => {
    console.log('defaultLineBillValues updated:', defaultLineBillValues)
  }, [defaultLineBillValues])

  return (
    <div>
      <Button
        className=" capitalize"
        variant="outlined"
        onClick={onAddPrescriptionClick}
        startIcon={<FaPrescriptionBottleMedical />}
      >
        Prescription
      </Button>
      <Modal
        uniqueKey="addPrescription"
        closeOnOutsideClick={true}
        maxWidth="md"
      >
        <div className="flex justify-between">
          <span className="text-xl font-semibold text-secondary flex items-center py-5 gap-4">
            Patient Prescription
          </span>

          <IconButton onClick={() => dispatch(closeModal())}>
            <Close />
          </IconButton>
        </div>
        <div className="flex flex-col gap-3">
          {activeVisitAppointments && (
            <div className="flex flex-col gap-2">
              <span className="font-semibold">Previous Prescriptions</span>
              <Select
                options={activeVisitAppointments.map(appointment => ({
                  value: `${appointment.type}-${appointment.appointmentId}`,
                  label: `${dayjs(appointment.appointmentDate).format(
                    'DD-MM-YYYY',
                  )} | ${appointment.type} | ${appointment.doctorName}`,
                  appointment: appointment,
                }))}
                onChange={selected => {
                  if (
                    selected &&
                    confirm('Are you sure you want to copy this prescription?')
                  ) {
                    const [type, appointmentId] = selected.value.split('-')
                    console.log('Fetching line bills for:', type, appointmentId)
                    fetchAndSetLineBills(type, appointmentId)
                  } else {
                    // Clear the form when no option is selected
                    setDefaultLineBillValues(null)
                    setNotesValue('')
                  }
                }}
                placeholder="Select appointment to copy prescription"
                isClearable
              />
            </div>
          )}
          {/* Notes Section */}
          <div className="flex flex-col gap-2">
            <span className="font-semibold">Notes</span>
            <RichText value={notesValue} setValue={setNotesValue} />
          </div>

          {/* Bill Types Section */}
          {allBillTypeValues ? (
            billTypes.map(billType => {
              const defaultValues =
                defaultLineBillValues?.[billType.id]?.map(billData => ({
                  value: billData.id,
                  label: billData.name,
                  status: billData.status,
                })) ?? []

              const selectOptions =
                allBillTypeValues?.[billType.name]?.map(data => ({
                  value: data.id,
                  label: data.name,
                })) ?? []
              return (
                <React.Fragment key={`${billType.name}-multiselect`}>
                  <p className="font-semibold">{billType.name}</p>

                  {/* Paid Items Display */}
                  <div className="flex flex-wrap gap-2">
                    {defaultValues.map(
                      item =>
                        item.status === 'PAID' && (
                          <span
                            key={`paid-${item.value}`}
                            className="text-success-content bg-success p-1 px-2 rounded-md"
                          >
                            {item.label}
                          </span>
                        ),
                    )}
                  </div>

                  {/* Selection Component */}
                  {/* <span>{selectOptions.map(item => item.value)}</span> */}
                  <Select
                    isMulti
                    name={billType.name}
                    value={defaultValues.filter(item => item.status !== 'PAID')}
                    options={selectOptions}
                    onChange={setSelectedValues(billType.name)}
                    classNamePrefix={`select-${billType.name.toLowerCase()}`}
                  />
                  {billType.name === 'Pharmacy' && (
                    <div className="h-48 border flex flex-col items-center p-2 overflow-y-auto gap-2 bg-primary/10 rounded-lg">
                      {defaultLineBillValues?.['3']?.length > 0 ? (
                        defaultLineBillValues['3'].map(prescription =>
                          prescription.id && prescription.status !== 'PAID' ? (
                            <RenderPrescriptionPharmacy
                              key={`prescription-${prescription.id}`}
                              prescriptionId={prescription.id}
                              prescriptionName={prescription.name}
                              prescribedQuantity={
                                prescription.prescribedQuantity
                              }
                              deleteClicked={handleDeleteClicked}
                              daysChange={handleDaysChange}
                              prescriptionIntake={
                                prescription.prescriptionDetails
                              }
                              prescriptionIntakeChange={handleIntakeChange}
                              prescriptionDays={prescription.prescriptionDays}
                              // status={prescription.status}
                            />
                          ) : null,
                        )
                      ) : (
                        <div className="flex justify-center h-full items-center">
                          <span>No medicine selected</span>
                        </div>
                      )}
                    </div>
                  )}
                  {billType.name === 'Pharmacy' && (
                    <div className=" border flex flex-col  p-2 overflow-y-auto gap-2 rounded-lg">
                      {defaultLineBillValues?.['3']?.length > 0 ? (
                        defaultLineBillValues['3'].map(prescription =>
                          prescription.id && prescription.status == 'PAID' ? (
                            <div
                              className="w-full border p-2 flex items-center justify-between rounded bg-gray-100"
                              key={`paid-${prescription.id}`}
                            >
                              <div className="w-full flex items-center justify-between gap-4">
                                <span
                                  className="text-sm font-medium w-40 min-w-0 overflow-hidden whitespace-nowrap text-ellipsis"
                                  title={prescription.name}
                                >
                                  {prescription.name}
                                </span>
                                <div className="flex flex-col">
                                  <span className="text-xs text-gray-500">
                                    Quantity
                                  </span>
                                  <span className="text-sm">
                                    {prescription.prescribedQuantity}
                                  </span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-xs text-gray-500">
                                    Days
                                  </span>
                                  <span className="text-sm">
                                    {prescription.prescriptionDays}
                                  </span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-xs text-gray-500">
                                    Intake
                                  </span>
                                  <span className="text-sm">
                                    {prescription?.prescriptionDetails.startsWith(
                                      'OTHER_',
                                    )
                                      ? prescription?.prescriptionDetails?.split(
                                          '_',
                                        )[1]
                                      : prescription?.prescriptionDetails}
                                  </span>
                                </div>
                                <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                                  Paid
                                </span>
                              </div>
                            </div>
                          ) : null,
                        )
                      ) : (
                        <div className="flex justify-center h-full items-center">
                          <span>No medicine selected</span>
                        </div>
                      )}
                    </div>
                  )}
                </React.Fragment>
              )
            })
          ) : (
            <p>No details available</p>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end">
            {/* <Button
              className="capitalize"
              variant="outlined"
              onClick={() => dispatch(closeModal())}
            >
              Close
            </Button> */}
            <div className="flex gap-2">
              <Button
                className="capitalize"
                variant="outlined"
                onClick={handlePrintPrescription}
              >
                Print
              </Button>
              <Button
                className="text-white capitalize"
                variant="contained"
                onClick={onSaveClick}
                disabled={isPending}
              >
                {isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        uniqueKey={`printPrescription-${type}-${appointmentId}`}
        closeOnOutsideClick={true}
        maxWidth="md"
      >
        <div className="flex flex-col gap-3">
          <div className="flex justify-between">
            <Button
              className="capitalize"
              variant="outlined"
              onClick={() => dispatch(closeModal())}
            >
              Close
            </Button>
          </div>
          <JoditEditor
            ref={editor}
            value={printTemplate}
            config={{
              readonly: true,
            }}
          />
        </div>
      </Modal>
    </div>
  )
}

export default PatientPrescription
