import { useState } from 'react'
import Image from 'next/image'
import { Field } from 'formik'
import { CgEye, CgEyeAlt } from 'react-icons/cg'
import { MdLockOutline, MdOutlineMail } from 'react-icons/md'
import originslogo from '../../public/origins-new-logo.png'

export function AuthPasswordField({
  id,
  name,
  placeholder = 'Enter your password',
  autoComplete = 'current-password',
}) {
  const [show, setShow] = useState(false)

  return (
    <div className="auth-field-wrap">
      <MdLockOutline className="auth-field-icon" />
      <Field
        id={id}
        name={name}
        type={show ? 'text' : 'password'}
        className="auth-field auth-field--icon"
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        className="auth-eye"
        onClick={() => setShow((current) => !current)}
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <CgEyeAlt /> : <CgEye />}
      </button>
    </div>
  )
}

export function AuthEmailField({
  id = 'email',
  name = 'email',
  placeholder = 'you@originsivf.com',
}) {
  return (
    <div className="auth-field-wrap">
      <MdOutlineMail className="auth-field-icon" />
      <Field
        id={id}
        name={name}
        type="email"
        className="auth-field auth-field--icon"
        placeholder={placeholder}
        autoComplete="email"
      />
    </div>
  )
}

export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
  wide = false,
}) {
  return (
    <div className="auth-split">
      <aside className="auth-hero">
        <div className="auth-hero-glow" aria-hidden="true" />
        <div className="auth-hero-inner">
          <div className="auth-hero-brand">
            <div className="auth-hero-logo-frame">
              <Image
                src={originslogo}
                alt="Origins IVF"
                className="auth-hero-logo"
                priority
                style={{ width: '100%', height: 'auto' }}
              />
            </div>
            <p className="auth-hero-kicker">ORIGINS IVF</p>
            <h2 className="auth-hero-title">Ortus</h2>
            <p className="auth-hero-tagline">Believe · Conceive · Achieve</p>
          </div>
        </div>
      </aside>

      <section className="auth-panel">
        <div className={`auth-card ${wide ? 'is-wide' : ''}`}>
          <div className="auth-card-head">
            <h1>{title}</h1>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          {children}
          {footer ? <div className="auth-card-footer">{footer}</div> : null}
        </div>
      </section>
    </div>
  )
}
