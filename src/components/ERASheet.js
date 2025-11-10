import React, { useCallback } from 'react'
import { Button, IconButton, Typography } from '@mui/material'
import dayjs from 'dayjs'
import { useDispatch } from 'react-redux'
import { closeModal } from '@/redux/modalSlice'
import MedicationSheet from './MedicationSheet'
import ScanSheet from './ScanSheet'
import { Close } from '@mui/icons-material'

const ERASheet = ({
  eraFormData,
  setERAFormData,
  eraTemplate,
  handleUpdateTreatmentERASheet,
  patientInfo,
  setERATemplate,
  canUpdate,
  medicationOptions,
  allBillTypeValues,
}) => {
  const dispatch = useDispatch()

  // Handle input changes
  const handleInputChange = useCallback(
    (day, medication, value) => {
      setERAFormData(prevData => ({
        ...prevData,
        [`${day}-${medication}`]: value,
      }))
    },
    [setERAFormData],
  )

  // Add handleAddColumn function
  const handleAddColumn = useCallback(() => {
    if (!eraTemplate?.columns) return

    const lastDate = eraTemplate.columns[eraTemplate.columns.length - 1]
    const nextDate = dayjs(lastDate, 'DD/MM')
      .add(1, 'day')
      .format('DD/MM')

    setERATemplate(prev => ({
      ...prev,
      columns: [...prev.columns, nextDate],
    }))
  }, [eraTemplate, setERATemplate])

  return (
    <div className="w-full p-4">
      {/* Action Buttons */}
      <div className="flex justify-end p-3">
        {canUpdate && (
          <div className="flex gap-2">
            <Button
              variant="outlined"
              onClick={handleAddColumn}
              className="bg-white text-secondary border-secondary hover:bg-secondary hover:text-white"
            >
              Add Column
            </Button>
            <Button
              variant="contained"
              className="bg-secondary text-white"
              onClick={() => handleUpdateTreatmentERASheet('update')}
            >
              Update Sheet
            </Button>
          </div>
        )}
      </div>

      {/* ERA Sheet Table */}
      <MedicationSheet
        medicationFormData={eraFormData}
        setMedicationFormData={setERAFormData}
        columns={eraTemplate?.columns}
        medicationOptions={medicationOptions}
      />
    </div>
  )
}

export default ERASheet
