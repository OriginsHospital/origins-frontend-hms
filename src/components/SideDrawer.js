import { closeSideDrawer } from '@/redux/sideDrawerSlice'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import { Close } from '@mui/icons-material'
import { useSelector, useDispatch } from 'react-redux'

function SideDrawer({
  children,
  closeOnOutsideClick,
  onOutsideClick,
  uniqueKey,
}) {
  const sideDrawer = useSelector((store) => store.sideDrawer)
  const dispatch = useDispatch()

  const handleClose = () => {
    dispatch(closeSideDrawer())
    onOutsideClick?.()
  }

  if (sideDrawer.key != uniqueKey) return null

  return (
    <Drawer
      anchor={'right'}
      open={sideDrawer.key === uniqueKey ? true : false}
      onClose={() => {
        if (closeOnOutsideClick) {
          handleClose()
        }
      }}
      PaperProps={{
        sx: {
          width: { xs: '100vw', sm: 'min(560px, 100vw)' },
          maxWidth: '100vw',
        },
      }}
    >
      <div className="relative p-4 pt-12 h-dvh w-full min-w-0 bg-white overflow-y-auto">
        <IconButton
          onClick={handleClose}
          aria-label="Close"
          size="small"
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 2,
            background: '#e7f7fc',
            '&:hover': { background: '#d7eef7' },
          }}
        >
          <Close />
        </IconButton>
        {children}
      </div>
    </Drawer>
  )
}

export { SideDrawer }
