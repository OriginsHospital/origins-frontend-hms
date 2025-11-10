import Breadcrumb from '@/components/Breadcrumb'
import SalesDashboard from '@/components/SalesDashboard'
import { withPermission } from '@/components/withPermission'
import { SalesReportDashboard } from '@/constants/apis'
import { ACCESS_TYPES } from '@/constants/constants'
import {
  Card,
  CardContent,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import React, { useContext, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
function Sales() {
  const userDetails = useSelector(store => store.user)
  const dropdowns = useSelector(store => store.dropdowns)
  const [fromDate, setFromDate] = useState(new Date())
  const [toDate, setToDate] = useState(new Date())
  const [branchId, setBranchId] = useState('')
  const [activeView, setActiveView] = useState('sales') // 'sales' or 'refunds'
  const [filteredData, setFilteredData] = useState(null)

  useEffect(() => {
    if (dropdowns?.branches?.length > 0) {
      setBranchId(dropdowns.branches[0].id)
    }
  }, [dropdowns])

  const { data: salesDashboardData } = useQuery({
    queryKey: [
      'salesDashboardData',
      userDetails.accessToken,
      fromDate,
      toDate,
      branchId,
    ],
    queryFn: async () => {
      const response = await SalesReportDashboard(
        userDetails?.accessToken,
        dayjs(fromDate).format('YYYY-MM-DD'),
        dayjs(toDate).format('YYYY-MM-DD'),
        branchId,
      )
      return response.data
    },
    enabled: userDetails.accessToken && branchId ? true : false,
  })

  useEffect(() => {
    if (salesDashboardData) {
      setFilteredData(salesDashboardData)
    }
  }, [salesDashboardData, fromDate, toDate])

  return (
    <div>
      <div className="m-5">
        <Breadcrumb />
      </div>
      <div className="flex flex-wrap gap-5 p-5 ">
        {/* Summary Cards in a row */}
        <div className="flex gap-4">
          <div
            onClick={() => setActiveView('sales')}
            style={{ cursor: 'pointer' }}
          >
            <SummaryCard
              title="Total Sales"
              value={`₹${(
                salesDashboardData?.salesDashboard?.totalSales || 0
              ).toLocaleString('en-IN')}`}
              isActive={activeView === 'sales'}
            />
          </div>
          <div
            onClick={() => setActiveView('refunds')}
            style={{ cursor: 'pointer' }}
          >
            <SummaryCard
              title={'Total Refunds'}
              value={`₹${(
                salesDashboardData?.salesDashboard?.totalReturns || 0
              ).toLocaleString('en-IN')}`}
              isActive={activeView === 'refunds'}
            />
          </div>
        </div>
        <DatePicker
          label="From Date"
          // disabled={isEdit == 'noneditable'}

          value={fromDate ? dayjs(fromDate) : null}
          name="fromDate"
          format="DD/MM/YYYY"
          onChange={newValue => setFromDate(newValue)}
        />
        <DatePicker
          label="To Date"
          // disabled={isEdit == 'noneditable'}
          format="DD/MM/YYYY"
          className="bg-white rounded-lg"
          value={toDate ? dayjs(toDate) : null}
          name="fromDate"
          onChange={newValue => setToDate(newValue)}
        />
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth variant="outlined" className="bg-white">
            <InputLabel>Branch</InputLabel>
            <Select
              label="Branch"
              name="branchId"
              value={branchId}
              onChange={e => setBranchId(e.target.value)}
              className="flex w-[125px]"
              placeholder="branch"
            >
              {dropdowns?.branches?.map((branch, idx) => (
                <MenuItem key={branch.id} value={branch.id}>
                  {branch.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </div>
      <SalesDashboard
        data={filteredData || salesDashboardData}
        branchId={branchId}
        reportName="Revenue_Report"
        reportType="revenue"
        branchName={dropdowns?.branches?.find(branch => branch.id === branchId)?.name}
        filters={{
          fromDate: dayjs(fromDate).format('YYYY-MM-DD'),
          toDate: dayjs(toDate).format('YYYY-MM-DD'),
          branchId: branchId
        }}
        // labels={{
        //   returns: 'Refunds',
        //   milestone: 'IVF Package',
        //   labTest: 'Lab',
        // }}
        activeView={activeView}
      />
    </div>
  )
}
const SummaryCard = ({ title, value, isActive }) => (
  <Card
    className="row-span-1"
    style={{
      minWidth: '200px',
      maxHeight: '60px',
      backgroundColor: isActive ? '#b0e9fa' : 'white',
      // border: isActive ? '1px solid #0ea5e9' : '1px solid #e5e7eb',
    }}
  >
    <CardContent className="p-2 flex flex-col justify-between">
      <span className="text-xs font-medium text-secondary">{title}</span>
      <span className="text-lg font-bold ">{value}</span>
    </CardContent>
  </Card>
)

export default withPermission(Sales, true, 'revenueReport', [
  ACCESS_TYPES.READ,
  ACCESS_TYPES.WRITE,
])
