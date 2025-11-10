import DashboardCard from '@/components/DashboardCard'
import { withPermission } from '@/components/withPermission'
import { ACCESS_TYPES } from '@/constants/constants'
import React from 'react'
import { FaClock } from 'react-icons/fa6'
import { FiUser } from 'react-icons/fi'
import { TbFileAnalytics } from 'react-icons/tb'
import { GoClockFill } from 'react-icons/go'
import { useSelector } from 'react-redux'
import { IoAlertSharp } from 'react-icons/io5'
import { Announcement } from '@mui/icons-material'
const subNav = [
  {
    path: '/reports/revenue',
    title: 'Revenue',
    relatedModule: 'revenueReport',
    icon: TbFileAnalytics,
  },
  {
    path: '/reports/expenses',
    title: 'Expenses',
    relatedModule: 'expenses',
    icon: TbFileAnalytics,
  },
  {
    path: '/reports/prescribedReport',
    title: 'Prescribed ',
    relatedModule: 'prescribedReport',
    icon: TbFileAnalytics,
  },
  {
    path: '/reports/grnvendor',
    title: 'Payments',
    relatedModule: 'grnVendorPaymentReport',
    icon: TbFileAnalytics,
  },
  {
    path: '/reports/salereturninfo',
    title: 'Refund',
    relatedModule: 'patientRefund',
    icon: TbFileAnalytics,
  },
  {
    path: '/reports/incidents',
    title: 'Incidents',
    relatedModule: 'incidents',
    icon: TbFileAnalytics,
  },
  {
    path: '/reports/gstGRN',
    title: 'GST-GRN Sales',
    relatedModule: 'gstGrnSalesReport',
    icon: TbFileAnalytics,
  },
  {
    path: '/reports/stockReport',
    title: 'GRN Stock',
    relatedModule: 'grnStock',
    icon: TbFileAnalytics,
  },
  {
    path: '/reports/alerts',
    title: 'Alerts',
    relatedModule: 'alerts',
    icon: Announcement,
  },
  {
    path: '/reports/stageReports',
    title: 'Patient Wait Times',
    relatedModule: 'stageDurationReport',
    icon: GoClockFill,
  },
  {
    path: '/reports/formFReport',
    title: 'Form F ',
    relatedModule: 'formFReport',
    icon: TbFileAnalytics,
  },
  {
    path: '/reports/noShowReport',
    title: 'No Show',
    relatedModule: 'noShowReport',
    icon: TbFileAnalytics,
  },
  {
    path: '/reports/items',
    title: 'Item wise',
    relatedModule: 'itemsReports',
    icon: TbFileAnalytics,
  },
  {
    path: '/reports/orders',
    title: 'Orders',
    relatedModule: 'orders',
    icon: TbFileAnalytics,
  },
  {
    path: '/reports/treatmentCycles',
    title: 'Treatment Cycles',
    relatedModule: 'treatmentCycles',
    icon: TbFileAnalytics,
  },
]
function Reports() {
  const user = useSelector(store => store.user)
  return (
    <div className=" w-full grid gap-4 grid-cols-2 lg:grid-cols-4 m-4">
      {subNav?.map((eachNav, i) => {
        const PermissionedDashboardCard = withPermission(
          DashboardCard,
          false,
          eachNav.relatedModule,
          [ACCESS_TYPES.READ, ACCESS_TYPES.WRITE],
        )
        return (
          <PermissionedDashboardCard
            key={eachNav.title + '-' + i}
            title={eachNav.title}
            // subtitle="Registration & Appointments"
            href={eachNav.path}
            Icon={eachNav.icon || TBFileAnalytics}
          />
        )
      })}
    </div>
  )
}

export default withPermission(Reports, true, 'reportsModule', [
  ACCESS_TYPES.READ,
  ACCESS_TYPES.WRITE,
])
