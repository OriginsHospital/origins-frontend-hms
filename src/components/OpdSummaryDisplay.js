import React from 'react'
import { Box, CircularProgress, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { getOpdSheetTemplate } from '@/constants/apis'
import { extractOpdSummary } from '@/utils/opdSheetUtils'

function OpdSummaryDisplay({ patientId, className = '' }) {
  const user = useSelector((store) => store.user)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['opdSheetSummary', patientId],
    queryFn: () => getOpdSheetTemplate(user.accessToken, patientId),
    enabled: !!patientId && !!user?.accessToken,
  })

  const summaryContent = extractOpdSummary(data?.data?.template)

  if (!patientId) return null

  if (isLoading) {
    return (
      <Box className={`flex items-center gap-2 py-2 ${className}`}>
        <CircularProgress size={18} />
        <Typography variant="body2" color="text.secondary">
          Loading summary...
        </Typography>
      </Box>
    )
  }

  if (isError || !summaryContent) return null

  return (
    <Box className={`mb-3 ${className}`}>
      <div
        style={{
          backgroundColor: '#000',
          color: '#fff',
          padding: '8px 12px',
          textAlign: 'center',
          fontWeight: 700,
          letterSpacing: '0.05em',
        }}
      >
        SUMMARY
      </div>
      <Box
        sx={{
          border: '1px solid #000',
          p: 1.5,
          minHeight: 60,
          bgcolor: '#fff',
          '& table': { width: '100%', borderCollapse: 'collapse' },
          '& td, & th': { border: '1px solid #ccc', p: 1 },
        }}
        dangerouslySetInnerHTML={{ __html: summaryContent }}
      />
    </Box>
  )
}

export default OpdSummaryDisplay
