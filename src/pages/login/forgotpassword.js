import Link from 'next/link'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { Bounce } from 'react-toastify'
import { API_ROUTES } from '../../constants/constants'
import { Formik, Form, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import AuthShell, { AuthEmailField } from '@/components/AuthShell'

function ForgotPassword() {
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
    <AuthShell
      title="Forgot password"
      subtitle="Enter your email and we will send reset instructions"
      footer={
        <p className="text-center text-sm text-muted">
          Remembered it?{' '}
          <Link href="/login" className="auth-link">
            Back to sign in
          </Link>
        </p>
      }
    >
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleForgotPassword}
      >
        {({ isSubmitting }) => (
          <Form className="space-y-5">
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
            <button
              type="submit"
              disabled={isSubmitting}
              className="auth-submit"
            >
              {isSubmitting ? 'Please wait...' : 'Send reset link'}
            </button>
          </Form>
        )}
      </Formik>
    </AuthShell>
  )
}

export default ForgotPassword
