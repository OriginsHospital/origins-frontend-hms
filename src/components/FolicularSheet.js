import { closeModal } from '@/redux/modalSlice'
import { Button } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import dayjs from 'dayjs'
import React, { useCallback, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import NoteAltIcon from '@mui/icons-material/NoteAlt'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'

const FollicularScanForm = ({
  folicularFormData,
  setFolicularFormData,
  follicularTemplate,
  handleUpdateTreatmentSheet,
  setFolicularTemplate,
  canUpdate,
}) => {
  const dispatch = useDispatch()
  const handleInputChange = useCallback(
    (day, side, size, value) => {
      const newValue = value === '' ? '' : parseFloat(value)
      if (isNaN(newValue) || newValue < 0 || newValue > 99) return

      setFolicularFormData(prevData => ({
        ...prevData,
        [`${day}-${side}-${size}`]: newValue,
      }))
    },
    [setFolicularFormData],
  )
  // useEffect(() => {
  //   console.log(folicularFormData)
  // }, [folicularFormData])

  // Add new function to handle adding column
  const handleAddColumn = useCallback(() => {
    if (!follicularTemplate?.columns) return

    const lastDate =
      follicularTemplate.columns[follicularTemplate.columns.length - 1]
    const nextDate = dayjs(lastDate, 'DD/MM')
      .add(1, 'day')
      .format('DD/MM')

    setFolicularTemplate(prev => ({
      ...prev,
      columns: [...prev.columns, nextDate],
    }))
  }, [follicularTemplate, setFolicularTemplate])

  const [noteModal, setNoteModal] = useState({
    open: false,
    day: null,
  })

  const handleNoteChange = (day, note) => {
    setFolicularFormData(prevData => ({
      ...prevData,
      [`${day}-note`]: note,
    }))
  }

  const handleNoteClick = day => {
    setNoteModal({
      open: true,
      day,
    })
  }

  // Add function to check if a column date matches today
  const isCurrentDate = useCallback(columnDate => {
    const today = dayjs().format('DD/MM')
    return columnDate === today
  }, [])

  return (
    <div className="w-full">
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
              onClick={() => handleUpdateTreatmentSheet('update')}
              variant="contained"
              className="bg-secondary text-white"
            >
              Update Sheet
            </Button>
          </div>
        )}
      </div>
      {/* <div className="flex justify-end pb-10">
                <DatePicker
                    // className='w-full bg-white'
                    value={dayjs(treatmentStartDate.split('T')[0])}
                    className="max-w-48"
                    label="Treatment Start Date"
                    format=" DD/MM/YYYY"
                    onChange={e => {
                        setTreatmentStartDate(dayjs(e).format('YYYY-MM-DD'))
                    }}
                    disabled={treatmentStatus?.currentStage == 'START'}
                />
            </div> */}
      <table className=" border-collapse overflow-hidden">
        <thead>
          <tr>
            <th className="bg-secondary text-white  border min-w-32">
              <p className="">{`Follicular Scan`}</p>
              <p className="text-xs">{`(in mm)`}</p>
            </th>
            {follicularTemplate?.columns?.map((day, index) => (
              <th
                key={'folicular' + day}
                className={`bg-secondary text-white p-2 border text-center ${
                  isCurrentDate(day) ? 'ring-2 ring-green-400' : ''
                }`}
                colSpan={2}
              >
                <div>{`Day ${index + 1}`}</div>
                <div className="text-xs">
                  {follicularTemplate?.columns[index]}
                </div>
              </th>
            ))}
          </tr>
          <tr>
            <th></th>
            {follicularTemplate?.columns?.flatMap(day => [
              <th
                key={`'folicular'${day}-R`}
                className={`p-2 border text-center ${
                  isCurrentDate(day) ? 'bg-green-50' : ''
                }`}
              >
                R
              </th>,
              <th
                key={`'folicular'${day}-L`}
                className={`p-2 border text-center ${
                  isCurrentDate(day) ? 'bg-green-50' : ''
                }`}
              >
                L
              </th>,
            ])}
          </tr>
        </thead>
        <tbody>
          {follicularTemplate?.rows?.map(({ value }, size) => (
            <tr
              key={'folicular' + size}
              className={size % 2 === 0 ? 'bg-slate-100' : ''}
            >
              <td
                className={`p-2 border-green-500 border text-center font-medium ${
                  size < 5
                    ? 'bg-green-200 text-green-900'
                    : size <= 10
                    ? 'bg-green-300 text-green-800'
                    : size === 21
                    ? 'bg-violet-300 text-white'
                    : 'bg-green-400 text-white'
                }`}
              >
                {value}
              </td>
              {follicularTemplate?.columns?.flatMap(day => [
                <td
                  key={`'folicular'${day}-R-${size}`}
                  className={`border ${
                    isCurrentDate(day) ? 'bg-green-100' : ''
                  }`}
                  colSpan={size === 21 ? 2 : 1}
                >
                  {size === 21 ? (
                    <Button
                      className="w-full"
                      onClick={() => handleNoteClick(day)}
                    >
                      <NoteAltIcon
                        color={
                          folicularFormData[`${day}-note`]
                            ? 'primary'
                            : 'action'
                        }
                      />
                    </Button>
                  ) : (
                    <input
                      type="number"
                      min="0"
                      max="999"
                      step="0.1"
                      value={folicularFormData[`${day}-R-${size}`] || ''}
                      disabled={false}
                      onChange={e =>
                        handleInputChange(day, 'R', size, e.target.value)
                      }
                      className="w-10 h-8 text-center border m-1"
                    />
                  )}
                </td>,
                // Only render L column if not the last row
                ...(size !== 21
                  ? [
                      <td
                        key={`'folicular'${day}-L-${value}`}
                        className={`border ${
                          isCurrentDate(day) ? 'bg-green-100' : ''
                        }`}
                      >
                        <input
                          type="number"
                          min="0"
                          max="99"
                          step="0.1"
                          disabled={false}
                          value={folicularFormData[`${day}-L-${value}`] || ''}
                          onChange={e =>
                            handleInputChange(day, 'L', value, e.target.value)
                          }
                          className="w-10 h-8 text-center border m-1"
                        />
                      </td>,
                    ]
                  : []),
              ])}
            </tr>
          ))}
        </tbody>
      </table>

      <Dialog
        open={noteModal.open}
        onClose={() => setNoteModal({ open: false, day: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Add Note for Day{' '}
          {follicularTemplate?.columns?.indexOf(noteModal.day) + 1}
        </DialogTitle>
        <DialogContent>
          <TextField
            multiline
            rows={4}
            fullWidth
            value={folicularFormData[`${noteModal.day}-note`] || ''}
            onChange={e => handleNoteChange(noteModal.day, e.target.value)}
            placeholder="Enter your notes here..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNoteModal({ open: false, day: null })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default FollicularScanForm
