import {
  getEraConsentsByVisitId,
  getFETConsentsByVisitId,
  getIcsiConsentsByVisitId,
  getIuiConsentsByVisitId,
} from '@/constants/apis'
import { OpenInNew } from '@mui/icons-material'
import { Button, Checkbox } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'

function ConsentsCheck({ consentType, patientInfo, reviewConsents }) {
  const userDetails = useSelector((state) => state.user)
  // const [signedConsents, setSignedConsents] = useState([])
  const [checkedConsents, setCheckedConsents] = useState({})
  const { data: consentsData } = useQuery({
    queryKey: ['consents', consentType],
    queryFn: () => {
      if (consentType == 'ICSI') {
        return getIcsiConsentsByVisitId(
          userDetails?.accessToken,
          patientInfo?.activeVisitId,
        )
      } else if (consentType == 'IUI') {
        return getIuiConsentsByVisitId(
          userDetails?.accessToken,
          patientInfo?.activeVisitId,
        )
      } else if (consentType == 'FET') {
        return getFETConsentsByVisitId(
          userDetails?.accessToken,
          patientInfo?.activeVisitId,
        )
      } else if (consentType == 'ERA') {
        return getEraConsentsByVisitId(
          userDetails?.accessToken,
          patientInfo?.activeVisitId,
        )
      }
    },
    enabled: !!patientInfo?.activeVisitId,
  })

  useEffect(() => {
    if (consentsData?.data) {
      const initialCheckedState = consentsData.data.reduce((acc, consent) => {
        acc[consent.id] = false
        return acc
      }, {})
      setCheckedConsents(initialCheckedState)
    }
  }, [consentsData])

  const convertToNormalCase = (str) => {
    let words = str.split('_')
    let capitalizedWords = words.map(
      (word) => word.charAt(0).toUpperCase() + word.slice(1),
    )
    return capitalizedWords
      .join(' ')
      .split(/(?=[A-Z])/)
      .join(' ')
      .trim()
  }

  const { isConsentOptional } = require('../constants/optionalConsents')

  const areAllConsentsChecked = () => {
    // If this is an optional consent type and no consents are uploaded, return true
    if (isConsentOptional(consentType) && consentsData?.data?.length === 0) {
      return true
    }
    // Otherwise check if all uploaded consents are checked
    return Object.values(checkedConsents).every((value) => value === true)
  }

  const handleReviewConsents = () => {
    console.log(
      'treatment type',
      patientInfo?.treatmentDetails?.treatmentTypeId,
    )
    if (confirm('Are you sure you want to review consents?')) {
      reviewConsents.mutate(patientInfo?.activeVisitId)
    } else if (!isConsentOptional(consentType)) {
      toast.error('Please review all consents')
    }
  }

  return (
    <div className="flex flex-col gap-3 w-fit">
      <span className="text-lg font-semibold">
        Review Consent Forms {isConsentOptional(consentType) && '(Optional)'}
      </span>
      {consentsData?.data?.length == 0 && (
        <span className="text-sm text-secondary">
          {isConsentOptional(consentType)
            ? 'No consents uploaded (optional)'
            : 'No consents found'}
        </span>
      )}
      {consentsData?.data?.length > 0 &&
        consentsData?.data?.map((consent) => (
          <div
            key={consent?.id}
            className="flex items-center justify-start gap-3 p-2 border rounded-md"
          >
            <Checkbox
              checked={checkedConsents[consent.id] || false}
              onChange={(e) => {
                setCheckedConsents((prev) => ({
                  ...prev,
                  [consent.id]: e.target.checked,
                }))
              }}
            />
            <Link
              href={consent?.link}
              target="_blank"
              className="capitalize text-secondary "
            >
              <Button
                variant="text"
                endIcon={<OpenInNew size={16} />}
                // className="capitalize"
              >
                <span className="text-[16px] capitalize">
                  {convertToNormalCase(
                    consent?.key
                      .split('_')
                      .slice(1, consent?.key.split('_').length - 1)
                      .join(' '),
                  )}
                </span>
              </Button>
            </Link>
          </div>
        ))}
      {consentsData?.data?.length > 0 && (
        <Button
          variant="contained"
          className="capitalize text-white"
          onClick={handleReviewConsents}
          disabled={!areAllConsentsChecked()}
        >
          Review Consents
        </Button>
      )}
    </div>
  )
}

export default ConsentsCheck
