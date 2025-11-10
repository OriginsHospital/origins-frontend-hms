import Link from 'next/link'
import React, { useMemo } from 'react'
import { FiUser, FiUsers } from 'react-icons/fi'
import { FaUserDoctor } from 'react-icons/fa6'
import { GiMedicines } from 'react-icons/gi'
import {
  TbChecklist,
  TbCheckupList,
  TbFileAnalytics,
  TbBuilding,
} from 'react-icons/tb'
import { GrSchedule } from 'react-icons/gr'
import { FaHospitalUser } from 'react-icons/fa6'
import Card from './DashboardCard'
import { ACCESS_TYPES } from '@/constants/constants'
import { withPermission } from './withPermission'
import { FaTasks } from 'react-icons/fa'
import { SlPeople } from 'react-icons/sl'
const HoverDevCards = () => {
  const routes = useMemo(
    () => [
      {
        path: '/appointments',
        name: 'Appointments',
        relatedModule: 'appointment',
        Iconn: GrSchedule,
      },
      {
        path: '/patient',
        name: 'Patient',
        relatedModule: 'patients',
        Iconn: FiUser,
        subRoutes: [
          {
            path: '/patient/register',
            name: 'Register Patient',
            relatedModule: 'appointmentCreation',
          },
          {
            path: '/patient',
            name: 'All Patients',
            relatedModule: 'allPatients',
          },
          {
            path: '/patient/donor',
            name: 'Donor',
            relatedModule: 'donorModule',
          },
          {
            path: '/patient/treatmentcycles',
            name: 'Treatment Cycles',
            relatedModule: 'donorModule',
          },
        ],
      },
      {
        path: '/doctor',
        name: 'Doctor',
        relatedModule: 'appointments',
        Iconn: FaUserDoctor,
        subRoutes: [
          {
            path: '/doctor',
            name: 'Manage Doctors',
            relatedModule: 'manageDoctors',
          },
          {
            path: '/doctor/appointments',
            name: 'Appointments ',
            relatedModule: 'appointments',
          },
          // {
          //   path: "/patient/all",
          //   name: "All Patients",
          // },
        ],
      },
      {
        path: '/pharmacy/medicinestages',
        name: 'Pharmacy',
        relatedModule: 'pharmacy',
        Iconn: GiMedicines,
        subRoutes: [
          {
            path: '/pharmacy/medicinestages',
            name: 'Pharmacy',
            relatedModule: 'pharmacy',
            // icon: <FaMoneyBill size={30} />,
          },
          {
            path: '/GRN',
            name: 'GRN',
            relatedModule: 'grnModule',
          },
          {
            path: '/pharmacy/dashboard',
            name: 'Dashboard',
          },
        ],
      },

      // {
      //   path: "/messages",
      //   name: "Messages",
      //   icon: <MdMessage size={30} />,
      // },
      {
        path: '/laboratory',
        name: 'Lab',
        Iconn: TbCheckupList,
        relatedModule: 'labModule',
      },
      {
        path: '/scan',
        name: 'Scan',
        Iconn: TbChecklist,
        relatedModule: 'scanModule',
      },

      {
        path: '/clinical/otscheduler',
        name: 'Clinical',
        Iconn: TbChecklist,
        relatedModule: 'otScheduler',
        subRoutes: [
          {
            path: '/clinical/otscheduler',
            name: 'OT Scheduler',
            relatedModule: 'otScheduler',
            // icon: <BiAnalyse size={30} />,
          },
          {
            path: '/clinical/injectionsheet',
            name: 'Injection Sheet',
            relatedModule: 'injectionSheet',
            // icon: <FaMoneyBill size={30} />,
          },
        ],
      },
      {
        path: '/admin/manageusers',
        name: 'Admin',
        Iconn: FiUsers,
        relatedModule: 'manageUsers',
        subRoutes: [
          {
            path: '/admin/manageusers',
            name: 'Manage Users',
            relatedModule: 'manageUsers',
            // icon: <BiAnalyse size={30} />,
          },
          {
            path: '/admin/managefields',
            name: 'Master Data',
            relatedModule: 'masterData',
            // icon: <BiAnalyse size={30} />,
          },
          {
            path: '/admin/reports',
            name: 'Reports',
            // icon: <FaMoneyBill size={30} />,
          },
        ],
      },
      {
        path: '/reports',
        name: 'Reports',
        relatedModule: 'reports',
        Iconn: TbFileAnalytics,
        subRoutes: [],
      },
      // {
      //   //formF
      //   path: '/formF',
      //   name: 'Form F',
      //   relatedModule: 'formF',
      //   Iconn: TbFileAnalytics,
      //   subRoutes: [],
      // },
      {
        path: '/reports/orders',
        name: 'Orders',
        relatedModule: 'orders',
        Iconn: TbFileAnalytics,
        subRoutes: [],
      },
      {
        path: '/tasktracker',
        name: 'Task Tracker',
        relatedModule: 'tasktracker',
        Iconn: FaTasks,
        subRoutes: [],
      },
      {
        path: '/consultantRoasters',
        name: 'Consultant Roster',
        relatedModule: 'consultantRoasters',
        Iconn: SlPeople,
        subRoutes: [],
      },
      {
        path: '/indent',
        name: 'IP Indent',
        relatedModule: 'indent',
        Iconn: TbFileAnalytics,
        subRoutes: [],
      },
      {
        path: '/ipmodule',
        name: 'IP Module',
        relatedModule: 'ipmodule',
        Iconn: TbBuilding,
        subRoutes: [],
      },
    ],
    [],
  )
  return (
    <div className="p-4 pt-8">
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {routes.map((each, i) => {
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
              // subtitle="Registration & Appointments"
              href={each.path}
              Icon={each.Iconn}
            />
          )
        })}
        {/* <Card
          title="Patient"
          subtitle="Registration & Appointments"
          href="/patient/register"
          Icon={FiUser}
        />
        <Card
          title="Doctor"
          subtitle="Appointments"
          href="/doctor/appointments"
          Icon={FaUserDoctor}
        />
        <Card
          title="Pharmacy"
          subtitle="Manage Pharmacy"
          href="#"
          Icon={GiMedicines}
        />
        <Card
          title="Laboratory"
          subtitle="Manage Laboratory"
          href="/laboratory"
          Icon={TbCheckupList}
        />
        <Card
          title="Appointments"
          subtitle="Manage Appointments"
          href="/appointments"
          Icon={GrSchedule}
        />
        <Card
          title="Users"
          subtitle="Manage user and permissions"
          href="/admin/manageusers"
          Icon={FiUsers}
        /> */}
        {/* <Card
          title="Out Patient"
          subtitle="Manage Out Patient"
          href="/outpatient"
          Icon={FaHospitalUser}
        /> */}
      </div>
    </div>
  )
}

export default HoverDevCards
