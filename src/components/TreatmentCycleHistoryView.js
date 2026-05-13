import React, { useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import dynamic from 'next/dynamic'
import { CircularProgress } from '@mui/material'
import {
  getTreatmentSheetByTreatmentCycleId,
  getDischargeSummaryTemplate,
} from '@/constants/apis'

const JoditEditor = dynamic(() => import('jodit-react'), {
  ssr: false,
})

// Read-only rendering of the Jodit rich text content so the doctor can review
// the cycle conclusion without the toolbar clutter.
function ReadOnlyRichText({ contents }) {
  const editor = useRef(null)
  return (
    <JoditEditor
      ref={editor}
      value={contents || ''}
      tabIndex={1}
      config={{
        readonly: true,
        toolbar: false,
        showCharsCounter: false,
        showWordsCounter: false,
        showXPathInStatusbar: false,
        statusbar: false,
      }}
    />
  )
}

// Read-only visualization of the follicular scan, modelled after FolicularSheet
// but rendering plain text cells so the doctor can quickly review prior cycles.
function FollicularReadOnlyTable({ template, formData }) {
  const columns = Array.isArray(template?.columns) ? template.columns : []
  const rows = Array.isArray(template?.rows) ? template.rows : []

  if (columns.length === 0 || rows.length === 0) {
    return (
      <span className="opacity-50">
        No follicular sheet data captured for this cycle
      </span>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="border-collapse">
        <thead>
          <tr>
            <th className="bg-secondary text-white p-2 border min-w-32">
              <p>Follicular Scan</p>
              <p className="text-xs">(in mm)</p>
            </th>
            {columns.map((day, index) => (
              <th
                key={`hist-folicular-h-${day}-${index}`}
                className="bg-secondary text-white p-2 border text-center"
                colSpan={2}
              >
                <div>{`Day ${index + 1}`}</div>
                <div className="text-xs">{day}</div>
              </th>
            ))}
          </tr>
          <tr>
            <th className="border"></th>
            {columns.flatMap((day, index) => [
              <th
                key={`hist-folicular-${day}-${index}-R`}
                className="p-1 border text-center text-xs"
              >
                R
              </th>,
              <th
                key={`hist-folicular-${day}-${index}-L`}
                className="p-1 border text-center text-xs"
              >
                L
              </th>,
            ])}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ value }, size) => (
            <tr
              key={`hist-folicular-row-${size}`}
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
              {columns.flatMap((day, index) => {
                if (size === 21) {
                  const note = formData?.[`${day}-note`]
                  return [
                    <td
                      key={`hist-folicular-${day}-${index}-ET-${size}`}
                      className="border p-1 text-xs align-top whitespace-pre-wrap"
                      colSpan={2}
                    >
                      {note || '-'}
                    </td>,
                  ]
                }
                const rVal = formData?.[`${day}-R-${size}`]
                const lVal = formData?.[`${day}-L-${size}`]
                return [
                  <td
                    key={`hist-folicular-${day}-${index}-R-${size}`}
                    className="border p-1 text-center w-12 h-8"
                  >
                    {rVal === '' || rVal === undefined || rVal === null
                      ? ''
                      : rVal}
                  </td>,
                  <td
                    key={`hist-folicular-${day}-${index}-L-${size}`}
                    className="border p-1 text-center w-12 h-8"
                  >
                    {lVal === '' || lVal === undefined || lVal === null
                      ? ''
                      : lVal}
                  </td>,
                ]
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Read-only viewer for a previous treatment cycle - shows the follicular sheet
// and the cycle results (discharge summary) so the consulting doctor can review
// historical cycles directly from the appointments timeline.
function TreatmentCycleHistoryView({ treatmentCycleId }) {
  const user = useSelector((store) => store.user)

  const {
    data: treatmentSheet,
    isLoading: isTreatmentSheetLoading,
    isError: isTreatmentSheetError,
  } = useQuery({
    queryKey: ['historyTreatmentSheet', treatmentCycleId],
    enabled: !!treatmentCycleId,
    queryFn: async () => {
      const responsejson = await getTreatmentSheetByTreatmentCycleId(
        user.accessToken,
        treatmentCycleId,
      )
      if (responsejson?.status === 200 && responsejson?.data?.template) {
        try {
          return JSON.parse(responsejson.data.template)
        } catch (err) {
          console.warn('Failed to parse treatment sheet template', err)
          return null
        }
      }
      return null
    },
  })

  const {
    data: dischargeSummary,
    isLoading: isDischargeSummaryLoading,
    isError: isDischargeSummaryError,
  } = useQuery({
    queryKey: ['historyDischargeSummary', treatmentCycleId],
    enabled: !!treatmentCycleId,
    queryFn: async () => {
      const responsejson = await getDischargeSummaryTemplate(
        user.accessToken,
        treatmentCycleId,
      )
      return responsejson?.data?.template || ''
    },
  })

  const follicularTemplate = treatmentSheet
    ? {
        columns: treatmentSheet?.columns,
        rows: treatmentSheet?.rows,
      }
    : null

  return (
    <div className="flex flex-col gap-4">
      <div className="border rounded-lg p-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-secondary">
            Follicular Sheet
          </span>
        </div>
        {isTreatmentSheetLoading ? (
          <div className="flex items-center gap-2 p-2">
            <CircularProgress size={16} />
            <span className="text-xs opacity-60">
              Loading follicular sheet...
            </span>
          </div>
        ) : isTreatmentSheetError ? (
          <span className="opacity-50 text-xs">
            Unable to load follicular sheet
          </span>
        ) : !treatmentSheet ? (
          <span className="opacity-50 text-xs">
            No follicular sheet data for this cycle
          </span>
        ) : (
          <FollicularReadOnlyTable
            template={follicularTemplate}
            formData={treatmentSheet?.follicularSheet}
          />
        )}
      </div>

      <div className="border rounded-lg p-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-secondary">
            Cycle Results
          </span>
        </div>
        {isDischargeSummaryLoading ? (
          <div className="flex items-center gap-2 p-2">
            <CircularProgress size={16} />
            <span className="text-xs opacity-60">Loading cycle results...</span>
          </div>
        ) : isDischargeSummaryError ? (
          <span className="opacity-50 text-xs">
            Unable to load cycle results
          </span>
        ) : !dischargeSummary ? (
          <span className="opacity-50 text-xs">
            No cycle results recorded for this cycle
          </span>
        ) : (
          <ReadOnlyRichText contents={dischargeSummary} />
        )}
      </div>
    </div>
  )
}

export default TreatmentCycleHistoryView
