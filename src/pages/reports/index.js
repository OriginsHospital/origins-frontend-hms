import DashboardCard from '@/components/DashboardCard'
import { withPermission } from '@/components/withPermission'
import { ACCESS_TYPES } from '@/constants/constants'
import React, { useMemo } from 'react'
import { FaClock } from 'react-icons/fa6'
import { FiUser } from 'react-icons/fi'
import { TbFileAnalytics } from 'react-icons/tb'
import { GoClockFill } from 'react-icons/go'
import { useSelector } from 'react-redux'
import { IoAlertSharp } from 'react-icons/io5'
import { Announcement } from '@mui/icons-material'
import { hasRevenueAccess } from '@/utils/revenueAccess'

const subNav = [
  {
    path: '/reports/revenue',
    title: 'Revenue',
    relatedModule: null,
    icon: TbFileAnalytics,
    requiresRevenueAccess: true, // Flag to indicate this requires revenue access
  },
  {
    path: '/reports/expenses',
    title: 'Expenses',
    relatedModule: 'expenses',
    icon: TbFileAnalytics,
    requiresRevenueAccess: false,
  },
  {
    path: '/reports/prescribedReport',
    title: 'Prescribed ',
    relatedModule: 'prescribedReport',
    icon: TbFileAnalytics,
    requiresRevenueAccess: false,
  },
  {
    path: '/reports/grnvendor',
    title: 'Payments',
    relatedModule: 'grnVendorPaymentReport',
    icon: TbFileAnalytics,
    requiresRevenueAccess: false,
  },
  {
    path: '/reports/salereturninfo',
    title: 'Refund',
    relatedModule: 'patientRefund',
    icon: TbFileAnalytics,
    requiresRevenueAccess: false,
  },
  {
    path: '/reports/incidents',
    title: 'Incidents',
    relatedModule: 'incidents',
    icon: TbFileAnalytics,
    requiresRevenueAccess: false,
  },
  {
    path: '/reports/gstGRN',
    title: 'GST-GRN Sales',
    relatedModule: 'gstGrnSalesReport',
    icon: TbFileAnalytics,
    requiresRevenueAccess: false,
  },
  {
    path: '/reports/stockReport',
    title: 'GRN Stock',
    relatedModule: 'grnStock',
    icon: TbFileAnalytics,
    requiresRevenueAccess: false,
  },
  {
    path: '/reports/alerts',
    title: 'Alerts',
    relatedModule: 'alerts',
    icon: Announcement,
    requiresRevenueAccess: false,
  },
  {
    path: '/reports/stageReports',
    title: 'Patient Wait Times',
    relatedModule: 'stageDurationReport',
    icon: GoClockFill,
    requiresRevenueAccess: false,
  },
  {
    path: '/reports/formFReport',
    title: 'Form F ',
    relatedModule: 'formFReport',
    icon: TbFileAnalytics,
    requiresRevenueAccess: false,
  },
  {
    path: '/reports/noShowReport',
    title: 'No Show',
    relatedModule: 'noShowReport',
    icon: TbFileAnalytics,
    requiresRevenueAccess: false,
  },
  {
    path: '/reports/items',
    title: 'Item wise',
    relatedModule: 'itemsReports',
    icon: TbFileAnalytics,
    requiresRevenueAccess: false,
  },
  {
    path: '/reports/orders',
    title: 'Orders',
    relatedModule: 'orders',
    icon: TbFileAnalytics,
    requiresRevenueAccess: false,
  },
  {
    path: '/reports/treatmentCycles',
    title: 'Treatment Cycles',
    relatedModule: 'treatmentCycles',
    icon: TbFileAnalytics,
    requiresRevenueAccess: false,
  },
  {
    path: '/reports/revenueNew',
    title: 'Revenue New',
    relatedModule: null,
    icon: TbFileAnalytics,
    requiresRevenueAccess: true, // Flag to indicate this requires revenue access
  },
]

function Reports() {
  const user = useSelector((store) => store.user)

  // Filter out Revenue menu items for unauthorized users
  const filteredSubNav = useMemo(() => {
    return subNav.filter((nav) => {
      // If this nav item requires revenue access, check if user has access
      if (nav.requiresRevenueAccess) {
        return hasRevenueAccess(user?.email)
      }
      // Otherwise, show all other menu items
      return true
    })
  }, [user?.email])

  return (
    <div className=" w-full grid gap-4 grid-cols-2 lg:grid-cols-4 m-4">
      {filteredSubNav?.map((eachNav, i) => {
        const CardComponent = eachNav.relatedModule
          ? withPermission(DashboardCard, false, eachNav.relatedModule, [
              ACCESS_TYPES.READ,
              ACCESS_TYPES.WRITE,
            ])
          : DashboardCard
        return (
          <CardComponent
            key={eachNav.title + '-' + i}
            title={eachNav.title}
            // subtitle="Registration & Appointments"
            href={eachNav.path}
            Icon={eachNav.icon || TbFileAnalytics}
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
