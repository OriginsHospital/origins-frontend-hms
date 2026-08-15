import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import Link from 'next/link'
import { ToastContainer, toast, Bounce } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { API_ROUTES } from '../../constants/constants'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'

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
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="auth-card">
        <h2 className="text-center text-2xl font-bold tracking-tight text-ink mb-6">
          Change your password
        </h2>

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleChangePassword}
        >
          {({ isSubmitting, isValid, dirty }) => (
            <Form className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-ink"
                >
                  Email address
                </label>
                <div className="mt-2">
                  <Field
                    id="email"
                    name="email"
                    type="email"
                    className="auth-field"
                  />
                  <ErrorMessage
                    name="email"
                    component="div"
                    className="text-red-500 p-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="oldPassword"
                  className="block text-sm font-medium text-ink"
                >
                  Old password
                </label>
                <div className="mt-2">
                  <Field
                    id="oldPassword"
                    name="oldPassword"
                    type="password"
                    className="auth-field"
                  />
                  <ErrorMessage
                    name="oldPassword"
                    component="div"
                    className="text-red-500 p-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-ink"
                >
                  New password
                </label>
                <div className="mt-2">
                  <Field
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    className="auth-field"
                  />
                  <ErrorMessage
                    name="newPassword"
                    component="div"
                    className="text-red-500 p-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-ink"
                >
                  Confirm password
                </label>
                <div className="mt-2">
                  <Field
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    className="auth-field"
                  />
                  <ErrorMessage
                    name="confirmPassword"
                    component="div"
                    className="text-red-500 p-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting || !isValid || !dirty}
                  className="auth-submit disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Please wait...' : 'Change password'}
                </button>
              </div>
            </Form>
          )}
        </Formik>

        <p className="mt-5 text-center text-sm text-muted">
          <Link
            href="/login"
            className="font-semibold text-secondary hover:text-[#0284b8]"
          >
            Back to login
          </Link>
        </p>
      </div>
    </div>
  )
}

export default ChangePassword
