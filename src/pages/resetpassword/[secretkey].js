import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import { API_ROUTES } from '../../constants/constants'
import { RotatingLines } from 'react-loader-spinner'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { Bounce } from 'react-toastify'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'

const ResetPassword = () => {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmpassword, setConfirmPassword] = useState('')
  const [showResetPasswordPage, setShowResetPasswordPage] = useState(false)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [secretCode, setSecretCode] = useState('')

  const initialValues = {
    password: '',
    confirmpassword: '',
  }

  const validationSchema = Yup.object({
    password: Yup.string()
      .min(8, 'Password must be atleast 8 characters long')
      .required('Password is required'),
    confirmpassword: Yup.string()
      .oneOf([Yup.ref('password'), null], 'Passwords must match')
      .required('Confirm Password is required'),
  })

  useEffect(() => {
    const secretKey = router.query.secretkey
    if (secretKey) {
      checkGetResetPasswordApi(secretKey)
    }
  }, [router.query.secretkey])

  const checkGetResetPasswordApi = (secretKey) => {
    setLoading(true)
    const getResetPasswordApiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.RESET_PASSWORD}/${secretKey}`
    console.log('getResetPasswordApiUrl:', getResetPasswordApiUrl)
    var myHeaders = new Headers()
    myHeaders.append('Content-Type', 'application/json')
    fetch(getResetPasswordApiUrl)
      .then((response) => {
        if (response.ok) {
          return response.json().then((result) => {
            setEmail(result.data.email)
            setSecretCode(result.data.secretCode)
            setShowResetPasswordPage(true)
          })
        } else {
          setShowResetPasswordPage(false)
        }
      })
      .catch((error) => {
        console.log('error', error)
        setShowResetPasswordPage(false)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  const changePasswordHandler = (values, { setSubmitting, setErrors }) => {
    const { password, confirmpassword } = values
    const changePasswordApiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.RESET_PASSWORD}`
    console.log('changePasswordApiUrl:', changePasswordApiUrl)

    var myHeaders = new Headers()
    myHeaders.append('Content-Type', 'application/json')
    var raw = JSON.stringify({
      email: email,
      password: password,
      confirmPassword: confirmpassword,
      secretCode: secretCode,
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

    fetch(changePasswordApiUrl, requestOptions)
      .then((response) => {
        if (response.status === 200) {
          return response.json().then((result) => {
            toast.success(result.data, toastconfig)
            setSubmitting(false)
            router.push('/login')
          })
        } else {
          return response.json().then((result) => {
            toast.error(result.data, toastconfig)
            setSubmitting(false)
          })
        }
      })
      .catch((error) => {
        console.log('error', error)
        setSubmitting(false)
      })
  }

  const renderResetPasswordPage = () => {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-12">
        <div className="auth-card">
          <h2 className="text-center text-2xl font-bold tracking-tight text-ink mb-6">
            Reset password
          </h2>
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={changePasswordHandler}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-6">
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-ink"
                  >
                    Password
                  </label>
                  <div className="mt-2">
                    <Field
                      id="password"
                      name="password"
                      type="password"
                      className="auth-field"
                    />
                    <ErrorMessage
                      name="password"
                      component="div"
                      className="text-red-500 text-xs mt-1"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirmpassword"
                    className="block text-sm font-medium text-ink"
                  >
                    Confirm password
                  </label>
                  <div className="mt-2">
                    <Field
                      id="confirmpassword"
                      name="confirmpassword"
                      type="password"
                      className="auth-field"
                    />
                    <ErrorMessage
                      name="confirmpassword"
                      component="div"
                      className="text-red-500 text-xs mt-1"
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    className="auth-submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting
                      ? 'Changing password...'
                      : 'Change your password'}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    )
  }

  const renderLinkExpiredPage = () => {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="auth-card text-center">
          <p className="text-lg font-semibold text-error-content">
            Link is invalid or expired. Please try again.
          </p>
          <button
            className="auth-submit mt-5"
            onClick={() => {
              router.push('/login/forgotpassword')
            }}
          >
            Go to forgot password
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {loading ? (
        <div className="flex justify-center items-center h-screen">
          <RotatingLines
            visible={true}
            height="96"
            width="96"
            color="grey"
            strokeWidth="5"
            animationDuration="0.75"
            ariaLabel="rotating-lines-loading"
            wrapperStyle={{}}
            wrapperClass=""
          />
        </div>
      ) : showResetPasswordPage ? (
        renderResetPasswordPage()
      ) : (
        renderLinkExpiredPage()
      )}
    </>
  )
}

export default ResetPassword
