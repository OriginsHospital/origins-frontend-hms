import React from 'react'
import TextField from '@mui/material/TextField'
import { Button, FormControlLabel, Checkbox } from '@mui/material'

import { DeleteOutline } from '@mui/icons-material'

function RenderPrescriptionPharmacy({
  prescriptionId,
  prescriptionName,
  prescribedQuantity,
  deleteClicked,
  daysChange,
  prescriptionIntake,
  prescriptionIntakeChange,
  prescriptionDays,
}) {
  return (
    <div className="w-full border p-2 flex items-center rounded bg-white">
      <span
        title={prescriptionName}
        className="w-40 min-w-0 overflow-hidden whitespace-nowrap text-ellipsis"
      >
        {prescriptionName}
      </span>
      <div className="flex flex-col items-start gap-2">
        <div className="flex flex-col items-start">
          {/* <span className="text-sm">Days/Weeks</span> */}
          {/* based on checkbox selection show days or weeks */}
          {prescriptionIntake?.startsWith('WO') ||
          prescriptionIntake?.startsWith('WT') ? (
            <span className="text-sm">Weeks</span>
          ) : (
            <span className="text-sm">Days</span>
          )}
          <TextField
            className="w-24 mr-4"
            id="standard-basic"
            // align="center"
            size="small"
            type="number"
            // label="Days"
            value={prescriptionDays}
            // variant="standard"
            // disabled
            onChange={e => daysChange(prescriptionId, e.target.value)}
          />
        </div>

        <div className="flex flex-col items-start">
          <span className="text-sm">Quantity</span>
          {/* {prescriptionIntake?.startsWith('OTHER_') ? (
            <span className="text-sm">Total Dosage</span>
          ) : (
            <span className="text-sm">Quantity</span>
          )} */}
          <TextField
            className="w-24 mr-4"
            id="standard-basic"
            align="center"
            size="small"
            type="number"
            value={prescribedQuantity}
            disabled
          />
        </div>
      </div>

      <div className=" w-3/4 mr-4">
        <div className="flex flex-col gap-2">
          {/* Row 1 */}
          <div className="grid grid-cols-4 gap-4">
            <FormControlLabel
              control={
                <Checkbox
                  checked={prescriptionIntake === 'OD'}
                  onChange={e => prescriptionIntakeChange(prescriptionId, 'OD')}
                />
              }
              label="OD"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={prescriptionIntake === 'BID'}
                  onChange={e =>
                    prescriptionIntakeChange(prescriptionId, 'BID')
                  }
                />
              }
              label="BID"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={prescriptionIntake === 'TID'}
                  onChange={e =>
                    prescriptionIntakeChange(prescriptionId, 'TID')
                  }
                />
              }
              label="TID"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={prescriptionIntake === 'QID'}
                  onChange={e =>
                    prescriptionIntakeChange(prescriptionId, 'QID')
                  }
                />
              }
              label="QID"
            />
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-4 gap-4">
            <FormControlLabel
              control={
                <Checkbox
                  checked={prescriptionIntake === '2OD'}
                  onChange={e =>
                    prescriptionIntakeChange(prescriptionId, '2OD')
                  }
                />
              }
              label="2OD"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={prescriptionIntake === '2BID'}
                  onChange={e =>
                    prescriptionIntakeChange(prescriptionId, '2BID')
                  }
                />
              }
              label="2BID"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={prescriptionIntake === '2TID'}
                  onChange={e =>
                    prescriptionIntakeChange(prescriptionId, '2TID')
                  }
                />
              }
              label="2TID"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={prescriptionIntake === '2QID'}
                  onChange={e =>
                    prescriptionIntakeChange(prescriptionId, '2QID')
                  }
                />
              }
              label="2QID"
            />
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-4 gap-4">
            <FormControlLabel
              control={
                <Checkbox
                  checked={prescriptionIntake === 'HS'}
                  onChange={e => prescriptionIntakeChange(prescriptionId, 'HS')}
                />
              }
              label="HS"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={prescriptionIntake === '2HS'}
                  onChange={e =>
                    prescriptionIntakeChange(prescriptionId, '2HS')
                  }
                />
              }
              label="2HS"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={prescriptionIntake === 'WO'}
                  onChange={e => prescriptionIntakeChange(prescriptionId, 'WO')}
                />
              }
              label="WO"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={prescriptionIntake === 'WT'}
                  onChange={e => prescriptionIntakeChange(prescriptionId, 'WT')}
                />
              }
              label="WT"
            />
          </div>

          {/* New Row for Other option */}
          <div className="grid grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={prescriptionIntake?.startsWith('OTHER_')}
                    onChange={e =>
                      prescriptionIntakeChange(prescriptionId, 'OTHER_')
                    }
                  />
                }
                label="Other"
              />
            </div>
            <div>
              {prescriptionIntake?.startsWith('OTHER_') && (
                <TextField
                  size="small"
                  type="number"
                  value={parseInt(prescriptionIntake.split('_')[1]) || ''}
                  onChange={e => {
                    const value = parseInt(e.target.value) || null
                    prescriptionIntakeChange(prescriptionId, `OTHER_${value}`)
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      <Button
        color="error"
        variant="text"
        size="small"
        onClick={() => deleteClicked('3', prescriptionId)}
        className="min-w-[32px] h-[32px] p-0"
      >
        <DeleteOutline fontSize="small" />
      </Button>
    </div>
  )
}

export default RenderPrescriptionPharmacy
