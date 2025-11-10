import React, { useRef, useState } from 'react'
import {
  DoneAll,
  DoubleArrowOutlined,
  NotificationsOutlined,
  ReadMore,
  VisibilityOutlined,
} from '@mui/icons-material'
import { Box, Button, IconButton, Popover, Typography } from '@mui/material'
import { useRouter } from 'next/router'

const initialNotifications = [
  {
    id: 1,
    title: 'New patient Registered',
    message: 'Test Patient',
    timestamp: '2024-03-20T10:30',
    isRead: false,
    route: '/patient/register?search=123412341234',
  },
  {
    id: 2,
    title: 'New task assigned',
    message: 'Srinivas | Lab ',
    timestamp: '2024-03-20T09:00',
    isRead: true,
    route: '/tasktracker/',
  },
  {
    id: 3,
    title: 'New patient Registered',
    message: 'Test Patient',
    timestamp: '2024-03-19T16:45',
    isRead: false,
    route: '/patient/register?search=123412341234',
  },
]

export default function NotificationBell() {
  const notificationAnchorEl = useRef()
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [notifications, setNotifications] = useState(initialNotifications)
  const router = useRouter()
  const handleNotificationOpen = () => {
    setNotificationOpen(true)
    // setNotifications(prevNotifications =>
    //     prevNotifications.map(notification => ({
    //         ...notification,
    //         isRead: true
    //     }))
    // )
  }

  const handleNotificationClose = () => {
    setNotificationOpen(false)
  }

  const handleNotificationClick = notification => {
    router.push(notification.route)
    handleNotificationClose()
  }

  const handleMarkAsRead = (event, notificationId) => {
    event.stopPropagation() // Prevent triggering the notification click
    setNotifications(prevNotifications =>
      prevNotifications.map(notification =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification,
      ),
    )
  }

  return (
    <div className="relative">
      <NotificationsOutlined
        className="cursor-pointer"
        onClick={handleNotificationOpen}
        ref={notificationAnchorEl}
      />
      {/* <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {notifications.filter(n => !n.isRead).length > 0 && notifications.filter(n => !n.isRead).length}
            </span> */}
      {notifications.filter(n => !n.isRead).length > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
          {notifications.filter(n => !n.isRead).length}
        </span>
      )}
      <Popover
        anchorEl={notificationAnchorEl.current}
        open={notificationOpen}
        onClose={handleNotificationClose}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        slotProps={{
          paper: {
            sx: {
              width: '320px',
              marginTop: '10px',
              maxHeight: '400px',
              overflow: 'auto',
            },
          },
        }}
      >
        <Box sx={{ p: 1.5 }}>
          <Typography
            variant="h6"
            sx={{ mb: 2, borderBottom: '1px solid #e0e0e0', pb: 1 }}
          >
            Notifications
          </Typography>
          {notifications.map(notification => (
            <Box
              key={notification.id}
              sx={{
                p: 1,
                mb: 0.5,
                backgroundColor: notification.isRead
                  ? 'transparent'
                  : '#f0f9ff',
                borderRadius: 1,
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                },
                border: '1px solid #e0e0e0',
              }}
            >
              <div className="flex justify-between">
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: notification.isRead ? 'normal' : 'bold' }}
                >
                  {notification.title}
                </Typography>
                <Typography
                  variant="body2"
                  className="cursor-pointer"
                  color="text.secondary"
                  onClick={() => handleNotificationClick(notification)}
                >
                  {notification.message}
                </Typography>
              </div>
              <div className="flex justify-between items-center">
                <Typography variant="caption" color="text.secondary">
                  {new Date(notification.timestamp).toLocaleString()}
                </Typography>
                {!notification.isRead ? (
                  <Button
                    onClick={e => handleMarkAsRead(e, notification.id)}
                    className="text-xs capitalize"
                  >
                    Mark as Read
                  </Button>
                ) : (
                  <DoneAll fontSize="1rem" color="success" />
                )}
              </div>
            </Box>
          ))}
        </Box>
      </Popover>
    </div>
  )
}
