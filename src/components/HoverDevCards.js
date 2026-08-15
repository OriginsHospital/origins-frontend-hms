import React, { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { FiUser, FiUsers } from 'react-icons/fi'
import { GiMedicines } from 'react-icons/gi'
import {
  TbChecklist,
  TbCheckupList,
  TbFileAnalytics,
  TbBuilding,
  TbTicket,
  TbReportMedical,
} from 'react-icons/tb'
import { GrSchedule } from 'react-icons/gr'
import Card from './DashboardCard'
import { ACCESS_TYPES } from '@/constants/constants'
import { withPermission } from './withPermission'
import { FaTasks, FaNotesMedical } from 'react-icons/fa'
import { SlPeople } from 'react-icons/sl'
import { LuCalendarDays, LuBedDouble } from 'react-icons/lu'
import { MdLocalHospital, MdOutlineAssignment } from 'react-icons/md'
import { HiOutlineDocumentReport } from 'react-icons/hi'
import DoctorTodayAppointments from './DoctorTodayAppointments'

function getRoleKey(roleDetails) {
  const id = Number(roleDetails?.id)
  const name = String(
    roleDetails?.name || roleDetails?.roleName || roleDetails?.role || '',
  )
    .toLowerCase()
    .trim()

  if (id === 2 || name.includes('doctor') || name.includes('consultant')) {
    return 'doctor'
  }
  if (id === 1 || name === 'admin' || name.includes('super admin')) {
    return 'admin'
  }
  if (id === 3 || name.includes('pharmac')) {
    return 'pharmacist'
  }
  if (id === 4 || name.includes('lab')) {
    return 'lab'
  }
  if (name.includes('embryolog')) {
    return 'embryology'
  }
  if (
    name.includes('nurse') ||
    name.includes('scan') ||
    name.includes('clinical')
  ) {
    return 'clinical'
  }
  if (
    name.includes('reception') ||
    name.includes('front') ||
    name.includes('staff') ||
    id === 5
  ) {
    return 'staff'
  }
  return 'staff'
}

function displayName(user) {
  return user?.fullName || user?.userName || 'there'
}

const ROLE_DASHBOARDS = {
  doctor: {
    eyebrow: 'Doctor workspace',
    headline: (user) => `Welcome, ${displayName(user)}`,
    description:
      'Consultations, patient reviews, scan reports, and clinical follow-up for your list today.',
    groups: [
      {
        id: 'clinical',
        label: 'Clinical',
        Iconn: GrSchedule,
        cards: [
          {
            path: '/doctor/appointments',
            name: 'My Appointments',
            subtitle: 'Patients waiting for consultation',
            relatedModule: 'appointments',
            Iconn: GrSchedule,
          },
          {
            path: '/patient',
            name: 'Patients',
            subtitle: 'Records and treatment history',
            relatedModule: 'Patients',
            Iconn: FiUser,
          },
          {
            path: '/scan',
            name: 'Scan',
            subtitle: 'Ultrasound and scan reports',
            relatedModule: 'scanModule',
            Iconn: TbChecklist,
          },
          {
            path: '/scan/prescription',
            name: 'Prescriptions',
            subtitle: 'View and print prescriptions',
            relatedModule: 'scanModule',
            Iconn: GiMedicines,
          },
          {
            path: '/laboratory',
            name: 'Lab Results',
            subtitle: 'Investigations and reports',
            relatedModule: 'labModule',
            Iconn: TbCheckupList,
          },
          {
            path: '/clinical/injectionsheet',
            name: 'Injection Sheet',
            subtitle: 'Stimulation and injections',
            relatedModule: 'injectionSheet',
            Iconn: FaNotesMedical,
          },
        ],
      },
      {
        id: 'procedures',
        label: 'Procedures',
        Iconn: MdLocalHospital,
        cards: [
          {
            path: '/clinical/otscheduler',
            name: 'OT Scheduler',
            subtitle: 'Theatre and procedure list',
            relatedModule: 'otScheduler',
            Iconn: MdLocalHospital,
          },
          {
            path: '/scan/hystero-lap',
            name: 'Hystero/Lap',
            subtitle: 'Operation notes and reports',
            relatedModule: 'scanModule',
            Iconn: TbReportMedical,
          },
          {
            path: '/scan/opu-sheet',
            name: 'OPU Sheet',
            subtitle: 'Oocyte pickup records',
            relatedModule: 'scanModule',
            Iconn: MdOutlineAssignment,
          },
          {
            path: '/scan/discharge-card',
            name: 'Discharge Card',
            subtitle: 'Discharge summaries',
            relatedModule: 'scanModule',
            Iconn: HiOutlineDocumentReport,
          },
          {
            path: '/embryology',
            name: 'Embryology',
            subtitle: 'Cycle notes and lab progress',
            relatedModule: 'embryology',
            Iconn: TbCheckupList,
          },
        ],
      },
      {
        id: 'followup',
        label: 'Follow-up',
        Iconn: LuCalendarDays,
        cards: [
          {
            path: '/patient/futurecycles',
            name: 'Future Cycles',
            subtitle: 'Planned treatment cycles',
            relatedModule: 'Patients',
            Iconn: LuCalendarDays,
          },
          {
            path: '/patient/treatmentcycles',
            name: 'Treatment Cycles',
            subtitle: 'Active and past cycles',
            relatedModule: 'donorModule',
            Iconn: TbChecklist,
          },
          {
            path: '/scan/upt',
            name: 'UPT Results',
            subtitle: 'Pregnancy test follow-up',
            relatedModule: 'scanModule',
            Iconn: TbCheckupList,
          },
          {
            path: '/patient/donor',
            name: 'Donor',
            subtitle: 'Donor records and matching',
            relatedModule: 'donorModule',
            Iconn: FiUsers,
          },
          {
            path: '/consultantRoasters',
            name: 'Consultant Roster',
            subtitle: 'Duty and availability',
            relatedModule: 'consultantRoasters',
            Iconn: SlPeople,
          },
          {
            path: '/ticketing',
            name: 'Ticketing',
            subtitle: 'Clinic requests and issues',
            relatedModule: 'ticketing',
            Iconn: TbTicket,
          },
        ],
      },
    ],
  },
  admin: {
    eyebrow: 'Admin workspace',
    headline: (user) => `Welcome, ${displayName(user)}`,
    description:
      'Operations, users, billing, and clinic-wide reports in one place.',
    groups: [
      {
        id: 'ops',
        label: 'Operations',
        Iconn: LuCalendarDays,
        cards: [
          {
            path: '/admin/manageusers',
            name: 'Manage Users',
            subtitle: 'Roles and staff accounts',
            relatedModule: 'manageUsers',
            Iconn: FiUsers,
          },
          {
            path: '/appointments',
            name: 'Appointments',
            subtitle: 'Clinic schedule overview',
            relatedModule: 'appointment',
            Iconn: GrSchedule,
          },
          {
            path: '/patient',
            name: 'Patients',
            subtitle: 'Registration and records',
            relatedModule: 'Patients',
            Iconn: FiUser,
          },
          {
            path: '/ticketing',
            name: 'Ticketing',
            subtitle: 'Staff requests and issues',
            relatedModule: 'ticketing',
            Iconn: TbTicket,
          },
          {
            path: '/tasktracker',
            name: 'Task Tracker',
            subtitle: 'Assigned work across teams',
            relatedModule: 'tasktracker',
            Iconn: FaTasks,
          },
          {
            path: '/ipmodule',
            name: 'IP Module',
            subtitle: 'Admissions and beds',
            relatedModule: 'ipmodule',
            Iconn: TbBuilding,
          },
        ],
      },
      {
        id: 'finance',
        label: 'Finance',
        Iconn: TbFileAnalytics,
        cards: [
          {
            path: '/home/payments',
            name: 'Payments',
            subtitle: 'Collections and vendor bills',
            relatedModule: 'dashboard',
            Iconn: TbFileAnalytics,
          },
          {
            path: '/reports',
            name: 'Reports',
            subtitle: 'Revenue, stock, and cycles',
            relatedModule: 'reportsModule',
            Iconn: HiOutlineDocumentReport,
          },
          {
            path: '/dailyreport',
            name: 'Daily Report',
            subtitle: 'End-of-day clinic summary',
            relatedModule: 'reportsModule',
            Iconn: LuCalendarDays,
          },
          {
            path: '/pharmacy/medicinestages',
            name: 'Pharmacy',
            subtitle: 'Stock and dispensing',
            relatedModule: 'pharmacy',
            Iconn: GiMedicines,
          },
        ],
      },
    ],
  },
  pharmacist: {
    eyebrow: 'Pharmacy workspace',
    headline: (user) => `Welcome, ${displayName(user)}`,
    description:
      'Dispense medicines, clear pending sales, and keep stock in check.',
    groups: [
      {
        id: 'dispense',
        label: 'Dispensing',
        Iconn: GiMedicines,
        cards: [
          {
            path: '/pharmacy/medicinestages',
            name: 'Pharmacy',
            subtitle: 'Dispense and medicine stages',
            relatedModule: 'pharmacy',
            Iconn: GiMedicines,
          },
          {
            path: '/pharmacy/pendingsales',
            name: 'Pending Sales',
            subtitle: 'Bills waiting to be packed',
            relatedModule: 'pharmacy',
            Iconn: TbFileAnalytics,
          },
          {
            path: '/pharmacy/refund',
            name: 'Refund',
            subtitle: 'Returns and refunds',
            relatedModule: 'pharmacy',
            Iconn: TbTicket,
          },
          {
            path: '/patient',
            name: 'Patients',
            subtitle: 'Look up a patient bill',
            relatedModule: 'Patients',
            Iconn: FiUser,
          },
        ],
      },
      {
        id: 'stock',
        label: 'Stock',
        Iconn: TbChecklist,
        cards: [
          {
            path: '/GRN',
            name: 'GRN',
            subtitle: 'Goods received notes',
            relatedModule: 'grnModule',
            Iconn: TbChecklist,
          },
          {
            path: '/pharmacy/dashboard',
            name: 'Stock Expiry',
            subtitle: 'Near-expiry inventory',
            relatedModule: 'grnStockExpiryDate',
            Iconn: TbCheckupList,
          },
          {
            path: '/reports/stockReport',
            name: 'Stock Report',
            subtitle: 'Current pharmacy stock',
            relatedModule: 'reportsModule',
            Iconn: TbFileAnalytics,
          },
        ],
      },
    ],
  },
  lab: {
    eyebrow: 'Laboratory workspace',
    headline: (user) => `Welcome, ${displayName(user)}`,
    description: 'Sample work, results, and outsourced tests for the day.',
    groups: [
      {
        id: 'lab',
        label: 'Laboratory',
        Iconn: TbCheckupList,
        cards: [
          {
            path: '/laboratory',
            name: 'Lab',
            subtitle: 'Pending and completed tests',
            relatedModule: 'labModule',
            Iconn: TbCheckupList,
          },
          {
            path: '/laboratory/labslist',
            name: 'Labs List',
            subtitle: 'Lab catalogue and setup',
            relatedModule: 'labModule',
            Iconn: TbChecklist,
          },
          {
            path: '/laboratory/outsourcing',
            name: 'Outsourcing',
            subtitle: 'External lab referrals',
            relatedModule: 'outsourcing',
            Iconn: TbFileAnalytics,
          },
          {
            path: '/scan',
            name: 'Scan',
            subtitle: 'Imaging linked to visits',
            relatedModule: 'scanModule',
            Iconn: TbChecklist,
          },
          {
            path: '/patient',
            name: 'Patients',
            subtitle: 'Look up a patient record',
            relatedModule: 'Patients',
            Iconn: FiUser,
          },
        ],
      },
    ],
  },
  embryology: {
    eyebrow: 'Embryology workspace',
    headline: (user) => `Welcome, ${displayName(user)}`,
    description: 'Embryo lab work, UPT follow-up, and linked scan records.',
    groups: [
      {
        id: 'lab',
        label: 'Lab work',
        Iconn: TbCheckupList,
        cards: [
          {
            path: '/embryology',
            name: 'Embryology',
            subtitle: 'Culture and procedure notes',
            relatedModule: 'embryology',
            Iconn: TbCheckupList,
          },
          {
            path: '/embryology/embryology-upt',
            name: 'Embryology & UPT',
            subtitle: 'Outcome and pregnancy tests',
            relatedModule: 'embryology',
            Iconn: TbChecklist,
          },
          {
            path: '/scan',
            name: 'Scan',
            subtitle: 'Follicular and related scans',
            relatedModule: 'scanModule',
            Iconn: TbChecklist,
          },
          {
            path: '/scan/opu-sheet',
            name: 'OPU Sheet',
            subtitle: 'Pickup records',
            relatedModule: 'scanModule',
            Iconn: MdOutlineAssignment,
          },
          {
            path: '/patient',
            name: 'Patients',
            subtitle: 'Cycle and patient history',
            relatedModule: 'Patients',
            Iconn: FiUser,
          },
          {
            path: '/clinical/otscheduler',
            name: 'OT Scheduler',
            subtitle: 'OPU and related procedures',
            relatedModule: 'otScheduler',
            Iconn: GrSchedule,
          },
        ],
      },
    ],
  },
  clinical: {
    eyebrow: 'Clinical workspace',
    headline: (user) => `Welcome, ${displayName(user)}`,
    description: 'Nursing, scan, injections, and procedure support.',
    groups: [
      {
        id: 'floor',
        label: 'Floor',
        Iconn: TbChecklist,
        cards: [
          {
            path: '/scan',
            name: 'Scan',
            subtitle: 'Scan list for today',
            relatedModule: 'scanModule',
            Iconn: TbChecklist,
          },
          {
            path: '/clinical/injectionsheet',
            name: 'Injection Sheet',
            subtitle: 'Stimulation and injections',
            relatedModule: 'injectionSheet',
            Iconn: GiMedicines,
          },
          {
            path: '/clinical/otscheduler',
            name: 'OT Scheduler',
            subtitle: 'Theatre and procedure list',
            relatedModule: 'otScheduler',
            Iconn: GrSchedule,
          },
          {
            path: '/patient',
            name: 'Patients',
            subtitle: 'Patient charts and vitals',
            relatedModule: 'Patients',
            Iconn: FiUser,
          },
          {
            path: '/scan/upt',
            name: 'UPT Results',
            subtitle: 'Record pregnancy tests',
            relatedModule: 'scanModule',
            Iconn: TbCheckupList,
          },
          {
            path: '/appointments',
            name: 'Appointments',
            subtitle: 'Who is expected today',
            relatedModule: 'appointment',
            Iconn: LuCalendarDays,
          },
          {
            path: '/ipmodule',
            name: 'IP Module',
            subtitle: 'Admissions and beds',
            relatedModule: 'ipmodule',
            Iconn: LuBedDouble,
          },
        ],
      },
    ],
  },
  staff: {
    eyebrow: 'Front desk workspace',
    headline: (user) => `Welcome, ${displayName(user)}`,
    description:
      'Register patients, book visits, and keep the day’s front-desk work moving.',
    groups: [
      {
        id: 'desk',
        label: 'Front desk',
        Iconn: GrSchedule,
        cards: [
          {
            path: '/appointments',
            name: 'Appointments',
            subtitle: 'Book and manage visits',
            relatedModule: 'appointment',
            Iconn: GrSchedule,
          },
          {
            path: '/patient/register',
            name: 'Register Patient',
            subtitle: 'Create a new patient file',
            relatedModule: 'appointmentCreation',
            Iconn: FiUser,
          },
          {
            path: '/patient',
            name: 'Patients',
            subtitle: 'Search existing records',
            relatedModule: 'Patients',
            Iconn: FiUsers,
          },
          {
            path: '/patient/referringdoctors',
            name: 'Referring Doctors',
            subtitle: 'Referral source list',
            relatedModule: 'Patients',
            Iconn: SlPeople,
          },
          {
            path: '/ticketing',
            name: 'Ticketing',
            subtitle: 'Raise and track requests',
            relatedModule: 'ticketing',
            Iconn: TbTicket,
          },
          {
            path: '/tasktracker',
            name: 'Task Tracker',
            subtitle: 'Your assigned tasks',
            relatedModule: 'tasktracker',
            Iconn: FaTasks,
          },
          {
            path: '/book-option',
            name: 'Book Option',
            subtitle: 'IP booking and beds',
            relatedModule: 'ipmodule',
            Iconn: TbBuilding,
          },
          {
            path: '/home/payments',
            name: 'Payments',
            subtitle: 'Collections and receipts',
            relatedModule: 'dashboard',
            Iconn: TbFileAnalytics,
          },
        ],
      },
    ],
  },
}

const HoverDevCards = () => {
  const user = useSelector((store) => store.user)
  const roleName =
    user?.roleDetails?.name || user?.roleDetails?.roleName || 'Staff'
  const roleKey = getRoleKey(user?.roleDetails)
  const dashboard = ROLE_DASHBOARDS[roleKey] || ROLE_DASHBOARDS.staff
  const groups = dashboard.groups || []
  const [activeGroup, setActiveGroup] = useState(groups[0]?.id || '')

  const visibleGroup = useMemo(() => {
    return groups.find((group) => group.id === activeGroup) || groups[0]
  }, [groups, activeGroup])

  const cards = visibleGroup?.cards || dashboard.cards || []

  return (
    <div className="p-5 md:p-7">
      {roleKey === 'doctor' ? (
        <DoctorTodayAppointments
          eyebrow={dashboard.eyebrow}
          headline={dashboard.headline(user)}
          roleName={roleName}
        />
      ) : (
        <div className="mb-5 rounded-2xl border border-[#cfe4ee] bg-white p-4 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary">
            {dashboard.eyebrow}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-ink">
            {dashboard.headline(user)}
          </h1>
          <p className="mt-1 max-w-3xl text-[15px] text-muted">
            {dashboard.description}
          </p>
          <div className="mt-3 inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-semibold text-[#0284b8]">
            {roleName}
          </div>
        </div>
      )}

      {groups.length > 1 ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {groups.map((group) => {
            const TabIcon = group.Iconn
            const isActive = group.id === visibleGroup?.id
            return (
              <button
                key={group.id}
                type="button"
                onClick={() => setActiveGroup(group.id)}
                className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[14px] font-semibold border transition-all duration-200 ${
                  isActive
                    ? 'bg-secondary text-white border-secondary shadow-card'
                    : 'bg-white text-ink border-[#cfe4ee] hover:border-secondary/50'
                }`}
              >
                {TabIcon ? <TabIcon className="text-[16px]" /> : null}
                {group.label}
              </button>
            )
          })}
        </div>
      ) : null}

      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {cards.map((each, i) => {
          const CardPermission = withPermission(
            Card,
            false,
            each.relatedModule,
            [ACCESS_TYPES.READ, ACCESS_TYPES.WRITE],
          )
          return (
            <CardPermission
              key={each.path + '-' + i}
              title={each.name}
              subtitle={each.subtitle}
              href={each.path}
              Icon={each.Iconn}
              index={i}
            />
          )
        })}
      </div>
    </div>
  )
}

export default HoverDevCards
