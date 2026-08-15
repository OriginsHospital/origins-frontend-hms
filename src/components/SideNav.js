import { useState, useMemo, useRef, useEffect, useLayoutEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ToastContainer, toast } from 'react-toastify'
import { Bounce } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSelector, useDispatch } from 'react-redux'
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined'
import PregnantWomanOutlinedIcon from '@mui/icons-material/PregnantWomanOutlined'
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined'
import LocalHospitalOutlinedIcon from '@mui/icons-material/LocalHospitalOutlined'
import LocalPharmacyOutlinedIcon from '@mui/icons-material/LocalPharmacyOutlined'
import VaccinesOutlinedIcon from '@mui/icons-material/VaccinesOutlined'
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined'
import { logout } from '@/constants/apis'
import { resetUser } from '@/redux/userSlice'
import { withPermission } from './withPermission'
import { ACCESS_TYPES } from '@/constants/constants'
import {
  HomeOutlined,
  ScannerOutlined,
  ChevronLeft,
  Menu,
} from '@mui/icons-material'

import { FaUserDoctor } from 'react-icons/fa6'
import { GiMedicines, GiMicroscope } from 'react-icons/gi'
import {
  TbBuildingHospital,
  TbCalendarStats,
  TbClipboardList,
  TbDna,
  TbInbox,
  TbReportAnalytics,
  TbScan,
  TbStethoscope,
} from 'react-icons/tb'
import { LuCalendarDays, LuLayoutDashboard, LuBedDouble } from 'react-icons/lu'
import { FiUser, FiUsers } from 'react-icons/fi'
import { HiUsers } from 'react-icons/hi2'

import Image from 'next/image'
import originslogo from '../../public/origins-new-logo.png'
// Helper function to check if user has access to New Patient Tracker
const hasNewPatientTrackerAccess = (userEmail) => {
  if (!userEmail) return false
  return userEmail.toLowerCase() === 'nikhilsuvva77@gmail.com'
}

function isRouteActive(pathname, routePath) {
  if (!routePath) return false
  if (routePath === '/home') return pathname === '/home'
  return pathname === routePath || pathname.startsWith(`${routePath}/`)
}

function NavItem({
  clickedNavItem,
  setClickedNavItem,
  path,
  name,
  Iconn,
  subRoutes,
  badgeCount,
}) {
  const router = useRouter()
  const user = useSelector((store) => store.user)
  const userEmail = user?.email || user?.userDetails?.email || ''

  const filteredSubRoutes =
    subRoutes?.filter((route) => {
      if (route.path === '/reports/newPatientTracker') {
        return hasNewPatientTrackerAccess(userEmail)
      }
      if (route.path === '/patient/management') {
        return hasNewPatientTrackerAccess(userEmail)
      }
      return true
    }) || []

  const menuRoutes = useMemo(() => {
    const list = [...filteredSubRoutes]
    if (path && !list.some((route) => route.path === path)) {
      list.unshift({
        path,
        name,
        relatedModule: filteredSubRoutes[0]?.relatedModule,
      })
    }
    return list
  }, [filteredSubRoutes, path, name])

  const hasSubOptions = menuRoutes.length > 0 && filteredSubRoutes.length > 0
  const isChildActive = menuRoutes.some((route) =>
    isRouteActive(router.pathname, route.path),
  )
  const isOpen = hasSubOptions && clickedNavItem === name
  const isActive = isRouteActive(router.pathname, path) || isChildActive

  function toggleOpen() {
    setClickedNavItem((current) => (current === name ? '' : name))
  }

  if (hasSubOptions) {
    return (
      <div className={`sidenav-group ${isOpen ? 'is-open' : ''}`}>
        <button
          type="button"
          className={`sidenav-item ${isActive ? 'is-active' : ''}`}
          onClick={toggleOpen}
          aria-expanded={isOpen}
        >
          <div className="w-full flex justify-start items-center gap-2">
            <span className="sidenav-icon-tile">
              <Iconn className="sidenav-item-icon" />
            </span>
            <span className="sidenav-item-label">{name}</span>
            {badgeCount !== undefined && badgeCount > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center min-w-[20px]">
                {badgeCount > 99 ? '99+' : badgeCount}
              </span>
            )}
            <svg
              className={`sidenav-caret ${isOpen ? 'is-open' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </button>
        {isOpen ? (
          <div className="sidenav-submenu">
            {menuRoutes.map((eachSubRouteObj, i) => {
              const NavOption = withPermission(
                SubNavItem,
                false,
                eachSubRouteObj.relatedModule,
                [ACCESS_TYPES.READ, ACCESS_TYPES.WRITE],
              )
              return (
                <NavOption
                  key={
                    i + (eachSubRouteObj.relatedModule || eachSubRouteObj.path)
                  }
                  eachSubRouteObj={eachSubRouteObj}
                  i={i}
                />
              )
            })}
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <Link
      href={path}
      className={`sidenav-item ${isRouteActive(router.pathname, path) ? 'is-active' : ''}`}
    >
      <div className="w-full flex justify-start items-center gap-2">
        <span className="sidenav-icon-tile">
          <Iconn className="sidenav-item-icon" />
        </span>
        <span className="sidenav-item-label">{name}</span>
        {badgeCount !== undefined && badgeCount > 0 && (
          <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {badgeCount > 99 ? '99+' : badgeCount}
          </span>
        )}
      </div>
    </Link>
  )
}

function LogoutNavButton({
  expanded,
  clickedNavItem,
  setClickedNavItem,
  name,
  icon,
  // subRoutes,
}) {
  const dispatch = useDispatch()
  const QueryClient = useQueryClient()
  const router = useRouter()
  // const buttonRef = useRef(null)

  const toastconfig = {
    position: 'top-right',
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: 'light',
    transition: Bounce,
  }

  const { mutate } = useMutation({
    mutationFn: (token) => logout(token),
    onSuccess: () => {
      //remove userdetails in store
      localStorage.clear()
      dispatch(resetUser())
      toast.success('Logged-out successfully', toastconfig)
      router.push('/login')
    },
    onError: (error) => {
      console.log(error)
      toast.error('Failed to logout', toastconfig)
    },
  })

  // function handleClick() {
  //   setClickedNavItem(name)
  // }

  // function handleClose() {
  //   setClickedNavItem('')
  // }

  function logoutHandler() {
    mutate()
  }

  return (
    <>
      <button
        // ref={buttonRef}
        className={`py-1 pl-2.5 pr-4 flex justify-center rounded text-nowrap `}
        onClick={logoutHandler}
      >
        <div className=" relative w-full flex flex-col items-center">
          <div className="w-6 h-6 flex justify-center items-center">{icon}</div>
          <span className={` text-[#06aee9] font-semibold`}>{name}</span>
          {/* <ChevronRightIcon
            className={`absolute -right-5 ${expanded ? 'opacity-100' : 'opacity-0'} transition-[opacity] duration-[0.5s]`}
          /> */}
        </div>
      </button>
      {/* {subRoutes?.length > 0 && (
        <Popover
          open={name == clickedNavItem}
          onClose={handleClose}
          anchorEl={buttonRef.current}
          elevation={4}
          anchorOrigin={{
            vertical: 'up',
            horizontal: 'right',
          }}
        >
          {subRoutes.map((eachSubRouteObj, i) => (
            <Link
              key={eachSubRouteObj.name + i}
              className={`py-1 pl-2.5 pr-4 flex rounded text-nowrap bg-white`}
              href={eachSubRouteObj.path}
            >
              {eachSubRouteObj.name}
            </Link>
          ))}
        </Popover>
      )} */}
      <div>{/* <ToastContainer /> */}</div>
    </>
  )
}
const SubNavItem = ({ eachSubRouteObj, i }) => {
  const router = useRouter()
  const isActive = isRouteActive(router.pathname, eachSubRouteObj.path)

  return (
    <Link
      key={eachSubRouteObj.name + i}
      className={`sidenav-subitem ${isActive ? 'is-active' : ''}`}
      href={eachSubRouteObj.path}
    >
      {eachSubRouteObj.name}
    </Link>
  )
}
function SideNav(props) {
  const user = useSelector((store) => store.user)
  const [expanded, setExpanded] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    if (window.innerWidth < 1024) return true
    try {
      return localStorage.getItem('sidenav-collapsed') === '1'
    } catch (error) {
      return false
    }
  })
  const [clickedNavItem, setClickedNavItem] = useState('')
  const router = useRouter()

  // Get user email for access control
  const userEmail = user?.email || user?.userDetails?.email || ''
  const hasTeamsAccess = userEmail.toLowerCase() === 'nikhilsuvva77@gmail.com'
  const hasInboxAccess = userEmail.toLowerCase() === 'nikhilsuvva77@gmail.com'
  // const iconsColor = '#06aee9'

  const routes = useMemo(() => {
    const allRoutes = [
      {
        path: '/home',
        name: 'Dashboard',
        relatedModule: 'dashboard',
        description: 'Home overview and daily workspace',
        Iconn: LuLayoutDashboard,
      },
      {
        path: '/teams',
        name: 'Teams',
        relatedModule: 'teams',
        description: 'Team members and collaboration',
        Iconn: HiUsers,
      },
      {
        path: '/inbox',
        name: 'Inbox',
        relatedModule: 'inbox',
        description: 'Messages and notifications',
        Iconn: TbInbox,
      },
      {
        path: '/appointments',
        name: 'Appointments',
        relatedModule: 'appointment',
        description: 'Calendar bookings and visit slots',
        Iconn: LuCalendarDays,
      },
      {
        path: '/patient',
        name: 'Patient',
        relatedModule: 'patients',
        description: 'Patient records, donors, and cycles',
        icon: <PregnantWomanOutlinedIcon className="text-secondary" />,
        Iconn: FiUser,
        subRoutes: [
          {
            path: '/patient',
            name: 'Patients',
            relatedModule: 'Patients',
          },
          {
            path: '/patient/management',
            name: 'Patient Management',
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
          {
            path: '/patient/futurecycles',
            name: 'Future Cycles',
            relatedModule: 'Patients',
          },
          {
            path: '/patient/referringdoctors',
            name: 'Referring Doctors',
            relatedModule: 'Patients',
          },
          {
            path: '/reports/newPatientTracker',
            name: 'New Patient Tracker',
            relatedModule: 'reportsModule',
          },
        ],
      },
      {
        path: '/doctor',
        name: 'Doctor',
        relatedModule: 'manageDoctors',
        description: 'Doctors and consultation appointments',
        icon: <LocalHospitalOutlinedIcon className="text-secondary" />,
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
        description: 'Medicines, GRN, stock, and refunds',
        Iconn: GiMedicines,
        icon: <LocalPharmacyOutlinedIcon className="text-secondary" />,
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
            relatedModule: 'grnStockExpiryDate',
            name: 'Stock Expiry',
          },
          {
            path: '/pharmacy/pendingsales',
            relatedModule: 'pharmacy',
            name: 'Pending Sales',
          },
          {
            path: '/pharmacy/refund',
            relatedModule: 'pharmacy',
            name: 'Refund',
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
        Iconn: GiMicroscope,
        relatedModule: 'labModule',
        description: 'Lab tests, labs list, and outsourcing',
        icon: <VaccinesOutlinedIcon className="text-secondary" />,
        subRoutes: [
          {
            path: '/laboratory',
            name: 'Lab',
            relatedModule: 'labModule',
          },
          {
            path: '/laboratory/labslist',
            name: 'Labs List',
            relatedModule: 'labModule',
          },
          {
            path: '/laboratory/outsourcing',
            name: 'Outsourcing',
            relatedModule: 'outsourcing',
          },
        ],
      },
      {
        path: '/embryology',
        name: 'Embryology',
        relatedModule: 'embryology',
        description: 'Embryo lab and UPT workflows',
        Iconn: TbDna,
        subRoutes: [
          {
            path: '/embryology',
            name: 'Embryology',
            relatedModule: 'embryology',
          },
          {
            path: '/embryology/embryology-upt',
            name: 'Embryology & UPT',
            relatedModule: 'embryology',
          },
        ],
      },
      {
        path: '/scan',
        name: 'Scan',
        Iconn: TbScan,
        relatedModule: null,
        description: 'Ultrasound, OPU, UPT, and scan sheets',
        icon: <ScannerOutlined className="text-secondary" />,
        subRoutes: [
          {
            path: '/scan',
            name: 'Scan List',
            relatedModule: 'scanModule',
          },
          {
            path: '/scan/prescription',
            name: 'Prescription',
            relatedModule: 'scanModule',
          },
          {
            path: '/scan/opu-sheet',
            name: 'OPU Sheet',
            relatedModule: null,
          },
          {
            path: '/scan/hystero-lap',
            name: 'Hystero/Lap',
            relatedModule: 'scanModule',
          },
          {
            path: '/scan/upt',
            name: 'UPT Results',
            relatedModule: 'scanModule',
          },
          {
            path: '/scan/discharge-card',
            name: 'Discharge Card',
            relatedModule: 'scanModule',
          },
        ],
      },

      {
        path: '/clinical',
        name: 'Clinical',
        Iconn: TbStethoscope,
        relatedModule: 'otScheduler',
        description: 'OT scheduler and injection sheets',
        icon: <ScannerOutlined className="text-secondary" />,
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
      // Hidden Layouts menu item - accessible via IP Module > Layouts button
      // {
      //   path: '/layouts',
      //   name: 'Layouts',
      //   relatedModule: 'layouts',
      //   Iconn: LuBedDouble,
      //   subRoutes: [],
      // },
      {
        path: '/indent',
        name: 'IP Indent',
        relatedModule: 'indent',
        description: 'Inpatient indent and ward requests',
        Iconn: TbClipboardList,
        subRoutes: [],
      },
      {
        path: '/admin',
        name: 'Admin',
        Iconn: FiUsers,
        relatedModule: 'manageUsers',
        description: 'Users, master data, and layouts',
        icon: <PersonOutlineOutlinedIcon className="text-secondary" />,
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
            path: '/admin/layouts',
            name: 'Master Layouts',
            relatedModule: 'masterData',
          },
          // {
          //   path: '/admin/reports',
          //   name: 'Reports',
          //   // icon: <FaMoneyBill size={30} />,
          // },
        ],
      },
      {
        path: '/reports',
        name: 'Reports',
        relatedModule: 'reportsModule',
        description: 'Revenue, expenses, and operational reports',
        Iconn: TbReportAnalytics,
        subRoutes: [],
      },
      {
        path: '/dailyreport',
        name: 'Daily Report',
        relatedModule: 'reportsModule',
        description: 'Day-end clinic summary',
        Iconn: TbCalendarStats,
        subRoutes: [],
      },
      // {
      //   path: '/formF',
      //   name: 'Form F',
      //   relatedModule: 'formF',
      //   Iconn: TbChecklist,
      //   subRoutes: [],
      // },
      {
        path: '/ipmodule',
        name: 'IP Module',
        relatedModule: 'ipmodule',
        description: 'Inpatient list and bed booking',
        Iconn: TbBuildingHospital,
        subRoutes: [
          {
            path: '/ipmodule',
            name: 'IP List',
            relatedModule: 'ipmodule',
          },
          {
            path: '/book-option',
            name: 'Book Option',
            relatedModule: 'ipmodule',
          },
        ],
      },
    ]

    // Filter out Teams and Inbox routes if user doesn't have access
    let filteredRoutes = allRoutes
    if (!hasTeamsAccess) {
      filteredRoutes = filteredRoutes.filter((route) => route.path !== '/teams')
    }
    if (!hasInboxAccess) {
      filteredRoutes = filteredRoutes.filter((route) => route.path !== '/inbox')
    }
    return filteredRoutes
  }, [hasTeamsAccess, hasInboxAccess])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    const media = window.matchMedia('(max-width: 1023px)')
    const syncOverlay = () => {
      if (media.matches) {
        setCollapsed(true)
      } else {
        try {
          setCollapsed(localStorage.getItem('sidenav-collapsed') === '1')
        } catch (error) {
          console.warn('Could not restore sidenav state', error)
        }
      }
    }
    syncOverlay()
    media.addEventListener('change', syncOverlay)
    return () => media.removeEventListener('change', syncOverlay)
  }, [])

  useLayoutEffect(() => {
    document.documentElement.setAttribute(
      'data-sidenav',
      collapsed ? 'collapsed' : 'expanded',
    )
    try {
      if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
        localStorage.setItem('sidenav-collapsed', collapsed ? '1' : '0')
      }
    } catch (error) {
      console.warn('Could not save sidenav state', error)
    }
  }, [collapsed])

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setCollapsed(true)
    }
  }, [router.pathname])

  useEffect(() => {
    const match = routes.find((route) => {
      if (route.subRoutes?.length) {
        return (
          isRouteActive(router.pathname, route.path) ||
          route.subRoutes.some((subRoute) =>
            isRouteActive(router.pathname, subRoute.path),
          )
        )
      }
      return false
    })
    setClickedNavItem(match?.name || '')
  }, [router.pathname, routes])

  return (
    <>
      {!collapsed ? (
        <button
          type="button"
          className="sidenav-backdrop"
          aria-label="Close navigation"
          onClick={() => setCollapsed(true)}
        />
      ) : null}
      <button
        type="button"
        className="sidenav-toggle"
        onClick={() => setCollapsed((current) => !current)}
        aria-label={collapsed ? 'Show navigation' : 'Hide navigation'}
        title={collapsed ? 'Show navigation' : 'Hide navigation'}
      >
        {collapsed ? (
          <Menu fontSize="small" />
        ) : (
          <ChevronLeft fontSize="small" />
        )}
      </button>
      <div className="sidenav-shell h-screen z-20 left-0 top-0 flex flex-col gap-2 overflow-hidden">
        <div className="sidenav-brand">
          <div className="sidenav-logo-frame">
            <img
              src={originslogo.src}
              alt="Origins IVF"
              className="sidenav-logo-img"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1 overflow-y-auto pb-4">
          {routes.map((eachRouteObj, i) => {
            // const userModule = user.moduleList?.find(
            //   eachModuleObj => eachModuleObj.enum == eachRouteObj.relatedModule,
            // )
            // console.log('module list', user.moduleList, userModule)
            const NavOption = withPermission(
              NavItem,
              false,
              eachRouteObj.relatedModule,
              [ACCESS_TYPES.READ, ACCESS_TYPES.WRITE],
            )
            return (
              <NavOption
                key={eachRouteObj.name + i}
                expanded={expanded}
                clickedNavItem={clickedNavItem}
                setClickedNavItem={setClickedNavItem}
                icon={eachRouteObj.icon}
                Iconn={eachRouteObj.Iconn}
                name={eachRouteObj.name}
                path={eachRouteObj.path}
                subRoutes={eachRouteObj.subRoutes}
              />
            )
          })}
        </div>
        {/* <div className="flex flex-col-reverse gap-3 grow ">
        <LogoutNavButton
          key={'logout'}
          expanded={expanded}
          clickedNavItem={clickedNavItem}
          setClickedNavItem={setClickedNavItem}
          icon={<LogoutOutlinedIcon className="text-secondary" />}
          name={'Logout'}
        // subRoutes={eachRouteObj.subRoutes}
        />
      </div> */}
      </div>
    </>
  )
}

export { SideNav }
