import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { setUser } from '@/redux/userSlice'
import Link from 'next/link'
import { API_ROUTES } from '../../constants/constants'
import { ToastContainer, toast, Bounce } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useRouter } from 'next/router'
import { Formik, Form, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { useQueryClient } from '@tanstack/react-query'
import { getNewAccessToken } from '@/constants/apis'
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

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const dispatch = useDispatch()
  const user = useSelector((state) => state.user)
  const router = useRouter()

  const initialValues = {
    email: '',
    password: '',
  }

  const validationSchema = Yup.object({
    email: Yup.string()
      .email('Invalid email address')
      .required('Email is required'),
    password: Yup.string()
      .min(8, 'Password must be atleast 8 characters long')
      .required('Password is required'),
  })
  const queryClient = useQueryClient()

  const handleLogin = (values, { setSubmitting, setErrors }) => {
    const { email, password } = values
    const loginApiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.LOGIN}`
    var myHeaders = new Headers()
    myHeaders.append('Content-Type', 'application/json')
    myHeaders.append('Access-Control-Allow-Origin', '*')
    var raw = JSON.stringify({
      email: email,
      password: password,
    })
    var requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: raw,
      redirect: 'follow',
      credentials: 'include',
    }

    fetch(loginApiUrl, requestOptions)
      .then((response) => {
        return response.json()
      })
      .then(async (result) => {
        console.log('res:', result)
        if (result.status === 400 || result.status === 404) {
          if (result.message === 'Session Already Exists, Please Logout') {
            console.log('invalidating loggedUserInfo')
            const refreshTokenResponseJson = await getNewAccessToken('token')
            if (refreshTokenResponseJson.status == 200) {
              // already user details are there but only accessToken is expired then accesstoken is replaced with new accessToken
              dispatch(
                setUser({
                  ...user,
                  accessToken: refreshTokenResponseJson.data.accessToken,
                }),
              )
              localStorage.setItem(
                'token',
                refreshTokenResponseJson.data.accessToken,
              )
              router.push('/home')
              return {
                ...user,
                accessToken: refreshTokenResponseJson.data.accessToken,
              }
            }
          }
          setErrors({ login: result.message })
          toast.error(result.message, toastconfig)
          setSubmitting(false)
        } else {
          const { accessToken, userDetails } = result?.data
          const {
            id,
            userName,
            fullName,
            email,
            roleDetails,
            moduleList,
            branchDetails,
          } = userDetails
          localStorage.setItem('token', accessToken)

          const userObject = {
            id,
            userName,
            fullName,
            email,
            roleDetails,
            branchDetails,
            moduleList,
            accessToken,
            isAuthenticated: true,
          }
          dispatch(setUser(userObject))

          const redirectPath = sessionStorage.getItem('redirectPath')

          if (redirectPath) {
            router.push(redirectPath)
            sessionStorage.removeItem('redirectPath')
          } else {
            router.push('/home')
          }
        }
      })
      .catch((error) => {
        console.error('Error:', error)
        toast.error(
          'An error occurred while logging in. Please try again later.',
          toastconfig,
        )
        setSubmitting(false)
      })
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to Ortus to continue your clinic workflow"
      footer={
        <>
          <div className="flex justify-center">
            <Link href="/login/changePassword" className="auth-link">
              Change password
            </Link>
          </div>
          <p className="text-center text-sm text-muted mt-3">
            {`Don't have an account? `}
            <Link href="/register" className="auth-link">
              Register here
            </Link>
          </p>
        </>
      }
    >
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleLogin}
      >
        {({ isSubmitting }) => (
          <Form className="space-y-4">
            <div>
              <label htmlFor="email" className="auth-label">
                Email
              </label>
              <AuthEmailField />
              <ErrorMessage
                name="email"
                component="div"
                className="auth-error"
              />
            </div>

            <div>
              <div className="auth-label-row">
                <label htmlFor="password" className="auth-label mb-0">
                  Password
                </label>
                <Link href="/login/forgotpassword" className="auth-link">
                  Forgot password?
                </Link>
              </div>
              <div className="mt-1.5">
                <AuthPasswordField id="password" name="password" />
              </div>
              <ErrorMessage
                name="password"
                component="div"
                className="auth-error"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="auth-submit mt-2"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </Form>
        )}
      </Formik>
    </AuthShell>
  )
}

export default Login
