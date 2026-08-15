import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import Link from 'next/link'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { Bounce } from 'react-toastify'
import { API_ROUTES } from '../../constants/constants'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'

function ForgotPassword() {
  const dispatch = useDispatch()

  const initialValues = {
    email: '',
  }

  const validationSchema = Yup.object({
    email: Yup.string()
      .email('Invalid email address')
      .required('Email is required'),
  })

  const handleForgotPassword = (values, { setSubmitting, setErrors }) => {
    const { email } = values
    const forgotPasswordApiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.FORGOT_PASSWORD}`
    console.log('forgotPasswordApiUrl:', forgotPasswordApiUrl)
    var myHeaders = new Headers()
    myHeaders.append('Content-Type', 'application/json')
    var raw = JSON.stringify({
      email: email,
    })
    var requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: raw,
      redirect: 'follow',
    }
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

    fetch(forgotPasswordApiUrl, requestOptions)
      .then((response) => {
        if (response.status === 200) {
          return response.json().then((result) => {
            toast.success(result.message, toastconfig)
            setSubmitting(false)
          })
        } else {
          return response.json().then((result) => {
            toast.error(result.message, toastconfig)
            setSubmitting(false)
          })
        }
      })
      .catch((error) => {
        console.log('error', error)
        setSubmitting(false)
        toast.error('An error occurred!  Please try again later.', toastconfig)
      })
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="auth-card">
        <h2 className="text-center text-2xl font-bold tracking-tight text-ink mb-6">
          Forgot your password?
        </h2>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleForgotPassword}
        >
          {({ isSubmitting }) => (
            <Form className="space-y-6">
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
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="auth-submit"
                >
                  {isSubmitting ? 'Please wait...' : 'Get your password'}
                </button>
              </div>
            </Form>
          )}
        </Formik>

        <p className="mt-8 text-center text-sm text-muted">
          {'Not registered? '}
          <Link
            href="/register"
            className="font-semibold text-secondary hover:text-[#0284b8]"
          >
            Click here to register
          </Link>
        </p>
      </div>
    </div>
  )
}

export default ForgotPassword
