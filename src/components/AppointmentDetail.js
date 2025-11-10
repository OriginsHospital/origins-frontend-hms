import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { getLineBillsAndNotesForAppointment } from '@/constants/apis'
import {
  Typography,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Divider,
  Box,
  Card,
  CardContent,
  Grid,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Button,
} from '@mui/material'
import {
  ExpandMore,
  Download,
  Receipt,
  MedicalServices,
  Assignment,
  LocalPharmacy,
  Science,
  Biotech,
} from '@mui/icons-material'
import dayjs from 'dayjs'
import { Generate_Invoice } from '@/constants/apis'
import RichText from '@/components/RichText'
import { TabContext, TabList, TabPanel } from '@mui/lab'
import BillDataFallBack from '@/fallbacks/BillDataFallBack'

function AppointmentDetail({ appointmentId, type, onClose }) {
  const user = useSelector(store => store.user)
  const [expandedSection, setExpandedSection] = useState('details')
  const [activeTab, setActiveTab] = useState(0)
  const [horizontalTabInModal, setHorizontalTabInModal] = useState(null)

  // Fetch appointment details using the lineBills API
  const { data: appointmentDetails, isLoading, error } = useQuery({
    queryKey: ['appointmentDetail', type, appointmentId],
    queryFn: async () => {
      const response = await getLineBillsAndNotesForAppointment(
        user.accessToken,
        type,
        appointmentId,
      )
      if (response.status === 200) {
        console.log(response.data)
        return response.data
      } else {
        throw new Error('Error fetching appointment details')
      }
    },
    enabled: !!appointmentId && !!type,
  })
  useEffect(() => {
    if (
      appointmentDetails?.lineBillsData?.length > 0 &&
      !horizontalTabInModal
    ) {
      setHorizontalTabInModal(appointmentDetails.lineBillsData[0].billType.name)
    }
  }, [appointmentDetails])

  // Loading state
  if (isLoading) {
    return (
      <Box className="flex justify-center items-center p-8">
        <CircularProgress />
      </Box>
    )
  }

  // Error state
  if (error) {
    return (
      <Alert severity="error" className="m-4">
        {error.message || 'Failed to load appointment details'}
      </Alert>
    )
  }

  // Empty state
  if (!appointmentDetails) {
    return (
      <Box className="p-4 text-center">
        <Typography color="text.secondary">
          No details available for this appointment
        </Typography>
      </Box>
    )
  }

  // Group line bills by category for prescription display
  const prescriptionCategories = {
    Pharmacy: [],
    Lab: [],
    Scan: [],
    Other: [],
  }

  function handleHorizontalTabChangeInModal(e, newTab) {
    setHorizontalTabInModal(newTab)
  }

  return (
    <div className="">
      {isLoading ? (
        <BillDataFallBack />
      ) : (
        <>
          <RichText
            value={appointmentDetails.notesData.notes || 'No Notes Provided'}
            readOnly={true}
          />
          <div className="flex flex-col  px-2 my-2 w-full overflow-auto">
            {appointmentDetails?.lineBillsData?.length > 0 ? (
              <TabContext value={horizontalTabInModal}>
                <Box className="w-max h-full">
                  <TabList
                    onChange={handleHorizontalTabChangeInModal}
                    aria-label="line bills and notes"
                  >
                    {appointmentDetails?.lineBillsData?.map(bill => (
                      <Tab
                        key={bill.billType.id}
                        label={bill.billType.name}
                        value={bill.billType.name}
                      />
                    ))}
                  </TabList>
                </Box>
                {appointmentDetails?.lineBillsData?.map(bill => (
                  <TabPanel
                    className="p-3 h-auto min-w-full"
                    key={
                      bill.billType.id +
                      '-' +
                      bill.billType.name +
                      '-' +
                      bill.appointmentId
                    }
                    value={bill.billType.name}
                  >
                    {bill?.billTypeValues?.length > 0 ? (
                      <div className="space-y-3">
                        {bill.billTypeValues.map(item => (
                          <div key={item.id} className="flex justify-between">
                            <Chip label={item.name} />
                            {/* <span>{item.price}</span> */}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-full flex justify-center items-center">
                        <span className="opacity-50">No Data</span>
                      </div>
                    )}
                  </TabPanel>
                ))}
              </TabContext>
            ) : (
              <div className="grow flex justify-center items-center">
                <span className="opacity-50">{'No Line Bills Data'}</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default AppointmentDetail
