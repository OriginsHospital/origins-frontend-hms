import { getAllAlerts } from '@/constants/apis'
import { Divider } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import React from 'react'
import Marquee from 'react-fast-marquee'
import { useSelector } from 'react-redux'

function DisplayAlerts() {
  const userDetails = useSelector((state) => state.user)
  const { data: alertsData, isLoading } = useQuery({
    queryKey: ['alerts', userDetails.accessToken],
    queryFn: async () => await getAllAlerts(userDetails.accessToken),
    enabled: !!userDetails.accessToken,
    refetchInterval: 1000 * 60,
  })
  if (isLoading)
    return <div className="px-3 py-0.5 text-xs text-muted">Loading alerts…</div>
  return (
    <Marquee speed={50} pauseOnHover={true}>
      <div className="flex items-center gap-4 py-0.5 text-[13px] text-ink">
        {alertsData?.data?.map((alert) => (
          <div key={alert.id} className="flex items-center gap-4">
            <span>{alert.alertMessage}</span>
            <Divider
              orientation="vertical"
              flexItem
              className="text-secondary"
            />
          </div>
        ))}
      </div>
    </Marquee>
  )
}

export default DisplayAlerts
