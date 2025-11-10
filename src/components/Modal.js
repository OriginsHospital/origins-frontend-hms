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
  const modal = useSelector(store => store.modal)
  const dispatch = useDispatch()

  if (modal.key != uniqueKey) return null

  return (
    <Dialog
      fullWidth
      maxWidth={maxWidth}
      open={modal.key === uniqueKey ? true : false}
      onClose={() => {
        if (closeOnOutsideClick) {
          dispatch(closeModal())
        }
        onOutsideClick?.()
      }}
    >
      {title && <DialogTitle>{title}</DialogTitle>}
      <DialogContent>{children}</DialogContent>
    </Dialog>
  )
}
