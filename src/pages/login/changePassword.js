import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import Link from 'next/link'
import { ToastContainer, toast, Bounce } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { API_ROUTES } from '../../constants/constants'
import { Formik, Form, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import AuthShell, {
  AuthEmailField,
  AuthPasswordField,
} from '@/components/AuthShell'

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

function ChangePassword() {
  const initialValues = {
    email: '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  }

  const validationSchema = Yup.object({
    email: Yup.string()
      .email('Invalid email address')
      .required('Email is required'),
    oldPassword: Yup.string().required('Old password is required'),
    newPassword: Yup.string().required('New password is required'),
    confirmPassword: Yup.string()
      .required('Confirm password is required')
      .oneOf([Yup.ref('newPassword'), null], 'Passwords must match'),
  })

  const handleChangePassword = (
    values,
    { setSubmitting, setErrors, resetForm },
  ) => {
    const { email, oldPassword, newPassword } = values
    const changePasswordApiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.CHANGE_PASSWORD}`
    var myHeaders = new Headers()
    myHeaders.append('Content-Type', 'application/json')
    var raw = JSON.stringify({
      email: email,
      oldPassword: oldPassword,
      newPassword: newPassword,
    })
    var requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: raw,
      redirect: 'follow',
    }

    fetch(changePasswordApiUrl, requestOptions)
      .then((response) => {
        return response.json().then((result) => {
          if (response.status === 200) {
            toast.success(
              result.message || 'Password changed successfully!',
              toastconfig,
            )
            resetForm() // Clear the form on success
            setSubmitting(false)
          } else {
            toast.error(
              result.message || 'Failed to change password',
              toastconfig,
            )
            setSubmitting(false)
          }
        })
      })
      .catch((error) => {
        console.log('error', error)
        setSubmitting(false)
        toast.error('An error occurred! Please try again later.', toastconfig)
      })
  }

  return (
    <AuthShell
      title="Change password"
      subtitle="Update your Ortus password and return to sign in"
      footer={
        <p className="text-center text-sm text-muted">
          <Link href="/login" className="auth-link">
            Back to sign in
          </Link>
        </p>
      }
    >
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleChangePassword}
      >
        {({ isSubmitting, isValid, dirty }) => (
          <Form className="space-y-4">
            <div>
              <label htmlFor="email" className="auth-label">
                Email address
              </label>
              <AuthEmailField />
              <ErrorMessage
                name="email"
                component="div"
                className="auth-error"
              />
            </div>

            <div>
              <label htmlFor="oldPassword" className="auth-label">
                Current password
              </label>
              <AuthPasswordField
                id="oldPassword"
                name="oldPassword"
                placeholder="Enter current password"
                autoComplete="current-password"
              />
              <ErrorMessage
                name="oldPassword"
                component="div"
                className="auth-error"
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="auth-label">
                New password
              </label>
              <AuthPasswordField
                id="newPassword"
                name="newPassword"
                placeholder="Enter new password"
                autoComplete="new-password"
              />
              <ErrorMessage
                name="newPassword"
                component="div"
                className="auth-error"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="auth-label">
                Confirm password
              </label>
              <AuthPasswordField
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Re-enter new password"
                autoComplete="new-password"
              />
              <ErrorMessage
                name="confirmPassword"
                component="div"
                className="auth-error"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !isValid || !dirty}
              className="auth-submit disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Please wait...' : 'Update password'}
            </button>
          </Form>
        )}
      </Formik>
    </AuthShell>
  )
}

export default ChangePassword
