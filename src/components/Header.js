import { logout } from '@/constants/apis'
import { resetUser } from '@/redux/userSlice'
import { toastconfig } from '@/utils/toastconfig'
import { Logout, PersonOutlineRounded, Settings } from '@mui/icons-material'
import {
  Box,
  Divider,
  MenuItem,
  MenuList,
  Popover,
  Typography,
} from '@mui/material'
import { useMutation } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useRef, useState } from 'react'
import { CgProfile } from 'react-icons/cg'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import NotificationBell from './NotificationBell'
import Marquee from 'react-fast-marquee'
import DisplayAlerts from './DisplayAlerts'
export default function Header() {
  const userDetails = useSelector((state) => state.user)
  const anchorEl = useRef()
  const dispatch = useDispatch()
  const router = useRouter()

  const [open, setOpen] = useState(false)
  const handleOpen = () => {
    setOpen(true)
  }
  const onClose = () => {
    setOpen(false)
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
  function logoutHandler() {
    mutate()
  }

  return (
    <div className="flex flex-col">
      <div className="app-header fixed top-0 right-0 z-10 flex justify-end items-center gap-1 px-3 sm:px-5">
        <div className="ortus-header-mark" aria-label="ORTUS">
          <span className="ortus-header-rule" aria-hidden="true" />
          <span className="ortus-header-word">
            <span className="ortus-header-word-fill">ORTUS</span>
            <span className="ortus-header-word-shimmer" aria-hidden="true">
              ORTUS
            </span>
          </span>
          <span className="ortus-header-rule" aria-hidden="true" />
        </div>
        <div className="relative z-[1] flex items-center gap-2 sm:gap-3 min-w-0">
          <NotificationBell />
          <span className="flex flex-col items-end pr-1 sm:pr-2 min-w-0">
            <span className="text-ink font-semibold text-sm leading-tight truncate max-w-[140px] sm:max-w-[220px]">
              {userDetails?.fullName || userDetails?.userName || ''}
            </span>
            <span className="text-secondary text-xs font-medium truncate max-w-[140px] sm:max-w-[220px]">
              {userDetails?.roleDetails?.name}
            </span>
          </span>
        </div>

        <div className="relative z-[1] items-center gap-3 block">
          <div ref={anchorEl}>
            <CgProfile
              size={28}
              color="#0284b8"
              className="cursor-pointer rounded-full hover:opacity-80 transition-opacity"
              onClick={handleOpen}
            />
          </div>
          <Popover
            anchorEl={anchorEl.current}
            anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
            onClose={onClose}
            open={Boolean(anchorEl.current) && open}
            slotProps={{ paper: { sx: { width: '240px', marginTop: '30px' } } }}
          >
            <Box sx={{ p: '16px 20px ' }}>
              <Typography variant="subtitle1">
                {userDetails?.fullName || userDetails?.userName || ''}
              </Typography>
              <Typography color="text.secondary" variant="body2">
                {userDetails?.email}
              </Typography>
            </Box>
            <Divider />
            {/* {userRole!='Admin'&& */}
            <MenuList
              disablePadding
              sx={{ p: '8px', '& .MuiMenuItem-root': { borderRadius: 1 } }}
            >
              {/* <Link href={'/settings'} onClick={onClose} className="flex items-center p-2 gap-3">

              <Settings />

              <span>

                Settings
              </span>
            </Link> */}
              <Link
                href={'/profile'}
                onClick={onClose}
                className="flex items-center p-2 gap-3"
              >
                <PersonOutlineRounded />
                <span>Profile</span>
              </Link>
              <MenuItem
                onClick={logoutHandler}
                className="flex items-center p-2 gap-3"
              >
                <Logout />
                <span>Sign out</span>
              </MenuItem>
            </MenuList>
            {/* } */}
          </Popover>
        </div>
      </div>

      <div className="flex items-center min-h-7 bg-primary/80 border-b border-[#cfe4ee] w-full text-ink">
        <DisplayAlerts />
      </div>
    </div>
  )
}
