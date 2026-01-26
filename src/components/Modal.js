import * as React from 'react'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import { useDispatch, useSelector } from 'react-redux'
import { closeModal } from '@/redux/modalSlice'

export default function Modal({
  uniqueKey,
  maxWidth, // xs | sm | md | lg | xl
  children,
  title,
  closeOnOutsideClick,
  onOutsideClick,
}) {
  const modal = useSelector((store) => store.modal)
  const dispatch = useDispatch()

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  // Cleanup effect when modal closes - always runs
  React.useEffect(() => {
    if (modal.key !== uniqueKey) {
      // Modal is closed, cleanup immediately
      const cleanup = () => {
        // Remove any backdrops that don't have an open dialog
        const backdrops = document.querySelectorAll(
          '[class*="MuiBackdrop-root"]',
        )
        backdrops.forEach((backdrop) => {
          const dialog =
            backdrop.parentElement?.querySelector('[role="dialog"]')
          const isOpen =
            dialog &&
            window.getComputedStyle(dialog).display !== 'none' &&
            window.getComputedStyle(dialog).visibility !== 'hidden'
          if (!isOpen) {
            backdrop.remove()
          }
        })
        // Remove body lock
        document.body.style.overflow = ''
        document.body.style.paddingRight = ''
        document.body.classList.remove('MuiModal-open')
      }

      // Run cleanup immediately and after a short delay
      cleanup()
      const timer = setTimeout(cleanup, 100)
      return () => clearTimeout(timer)
    }
  }, [modal.key, uniqueKey])

  // Early return AFTER all hooks
  if (modal.key !== uniqueKey) return null

  const handleClose = (event, reason) => {
    if (closeOnOutsideClick) {
      dispatch(closeModal())
    }
    onOutsideClick?.()
  }

  return (
    <Dialog
      fullWidth
      maxWidth={maxWidth}
      open={modal.key === uniqueKey}
      onClose={handleClose}
      PaperProps={{
        sx: {
          zIndex: 1300,
        },
      }}
      BackdropProps={{
        sx: {
          zIndex: 1299,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
        onClick: closeOnOutsideClick ? handleClose : undefined,
      }}
      disableEscapeKeyDown={!closeOnOutsideClick}
      disableScrollLock={true} // Don't lock scroll to prevent body issues
      hideBackdrop={false}
      onExited={() => {
        // Cleanup on exit - remove body lock
        document.body.style.overflow = ''
        document.body.style.paddingRight = ''
        document.body.classList.remove('MuiModal-open')
        // Force remove any remaining backdrops
        setTimeout(() => {
          const backdrops = document.querySelectorAll(
            '[class*="MuiBackdrop-root"]',
          )
          backdrops.forEach((backdrop) => {
            if (!backdrop.closest('[role="dialog"]')) {
              backdrop.remove()
            }
          })
        }, 50)
      }}
    >
      {title && <DialogTitle>{title}</DialogTitle>}
      <DialogContent
        sx={{
          p: title ? undefined : 0,
          '&.MuiDialogContent-root': { p: title ? undefined : 0 },
        }}
      >
        {children}
      </DialogContent>
    </Dialog>
  )
}
