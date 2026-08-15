import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export const LOGIN_WELCOME_KEY = 'ortusShowWelcome'

export function triggerLoginWelcome() {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(LOGIN_WELCOME_KEY, '1')
  window.dispatchEvent(new Event('ortus-login-welcome'))
}

const PLAY_MS = 5200
const EXIT_MS = 900
const REDUCED_PLAY_MS = 1100

function DnaHelix({ className, gradientId = 'helixGrad' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 90 320"
      fill="none"
      aria-hidden="true"
    >
      <path
        className="cinematic-welcome-helix-path cinematic-welcome-helix-path--a"
        d="M28 6 C64 40 8 74 46 108 C84 142 10 176 46 210 C82 244 12 278 32 314"
        stroke={`url(#${gradientId})`}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        className="cinematic-welcome-helix-path cinematic-welcome-helix-path--b"
        d="M46 6 C10 40 66 74 28 108 C-8 142 64 176 28 210 C-6 244 62 278 42 314"
        stroke="#8be7ff"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <g stroke="#b9fff2" strokeWidth="1.35" opacity="0.8">
        <line x1="22" y1="28" x2="54" y2="28" />
        <line x1="16" y1="58" x2="58" y2="58" />
        <line x1="20" y1="88" x2="56" y2="88" />
        <line x1="18" y1="118" x2="58" y2="118" />
        <line x1="22" y1="148" x2="54" y2="148" />
        <line x1="16" y1="178" x2="58" y2="178" />
        <line x1="20" y1="208" x2="56" y2="208" />
        <line x1="18" y1="238" x2="58" y2="238" />
        <line x1="22" y1="268" x2="54" y2="268" />
        <line x1="20" y1="298" x2="52" y2="298" />
      </g>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9af7e2" />
          <stop offset="1" stopColor="#06aee9" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function SyringeMotif({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 160 64"
      fill="none"
      aria-hidden="true"
    >
      <g
        stroke="#d7fff6"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="18" y="22" width="78" height="20" rx="4" />
        <rect x="4" y="25" width="14" height="14" rx="2" />
        <line x1="96" y1="32" x2="142" y2="32" />
        <line x1="142" y1="26" x2="142" y2="38" />
        <line x1="36" y1="22" x2="36" y2="42" opacity="0.65" />
        <line x1="50" y1="22" x2="50" y2="42" opacity="0.65" />
        <line x1="64" y1="22" x2="64" y2="42" opacity="0.65" />
        <line x1="78" y1="22" x2="78" y2="42" opacity="0.65" />
      </g>
      <circle cx="150" cy="32" r="4.5" fill="#7ef0d6" />
      <circle cx="150" cy="32" r="8" stroke="#7ef0d6" strokeOpacity="0.45" />
    </svg>
  )
}

function OocyteMotif({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 88 88"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="44" cy="44" r="28" stroke="#7ef0d6" strokeWidth="1.8" />
      <circle
        cx="44"
        cy="44"
        r="21"
        stroke="#5ee4ff"
        strokeWidth="1"
        opacity="0.7"
      />
      <circle cx="41" cy="41" r="10" fill="url(#oocyteFill)" />
      <g stroke="#9af7e2" strokeWidth="1.3" opacity="0.85">
        <line x1="44" y1="16" x2="44" y2="8" />
        <line x1="64" y1="24" x2="70" y2="18" />
        <line x1="72" y1="44" x2="80" y2="44" />
        <line x1="64" y1="64" x2="70" y2="70" />
        <line x1="44" y1="72" x2="44" y2="80" />
        <line x1="24" y1="64" x2="18" y2="70" />
        <line x1="16" y1="44" x2="8" y2="44" />
        <line x1="24" y1="24" x2="18" y2="18" />
      </g>
      <defs>
        <radialGradient id="oocyteFill" cx="38%" cy="34%" r="70%">
          <stop offset="0" stopColor="#f4fffb" />
          <stop offset="0.45" stopColor="#6ee7c5" />
          <stop offset="1" stopColor="#0284b8" />
        </radialGradient>
      </defs>
    </svg>
  )
}

function BlastocystMotif({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 72 72"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="36" cy="36" r="24" stroke="#67e8f9" strokeWidth="1.7" />
      <circle cx="28" cy="30" r="7" fill="#22d3ee" opacity="0.72" />
      <circle cx="44" cy="28" r="6" fill="#6ee7c5" opacity="0.7" />
      <circle cx="32" cy="44" r="6.5" fill="#06aee9" opacity="0.72" />
      <circle cx="46" cy="44" r="5" fill="#9af7e2" opacity="0.55" />
    </svg>
  )
}

function SpermMotif({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 92 28"
      fill="none"
      aria-hidden="true"
    >
      <ellipse cx="10" cy="14" rx="8" ry="5.5" fill="#7ef0d6" opacity="0.9" />
      <path
        d="M18 14 C36 4 52 24 72 10 C80 6 86 12 90 8"
        stroke="#8be7ff"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function LoginWelcomePreloader() {
  const [phase, setPhase] = useState('idle')
  const exitTimer = useRef(null)
  const playTimer = useRef(null)
  const skipTimer = useRef(null)
  const started = useRef(false)
  const canSkip = useRef(false)

  const particles = useMemo(
    () =>
      Array.from({ length: 42 }, (_, index) => ({
        id: index,
        left: `${(index * 17) % 100}%`,
        top: `${(index * 29) % 100}%`,
        size: 2 + (index % 5),
        delay: (index % 12) * 0.18,
        duration: 7 + (index % 6),
      })),
    [],
  )

  const finish = useCallback(() => {
    started.current = false
    canSkip.current = false
    sessionStorage.removeItem(LOGIN_WELCOME_KEY)
    setPhase('idle')
    document.body.classList.remove('cinematic-welcome-lock')
  }, [])

  const beginExit = useCallback(() => {
    setPhase((current) => {
      if (current !== 'playing') return current
      return 'exiting'
    })
  }, [])

  const requestSkip = useCallback(() => {
    if (!canSkip.current) return
    beginExit()
  }, [beginExit])

  const start = useCallback(() => {
    if (typeof window === 'undefined') return
    if (started.current) return
    if (sessionStorage.getItem(LOGIN_WELCOME_KEY) !== '1') return
    started.current = true
    canSkip.current = false
    document.body.classList.add('cinematic-welcome-lock')
    setPhase('playing')
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    window.clearTimeout(playTimer.current)
    window.clearTimeout(skipTimer.current)
    skipTimer.current = window.setTimeout(() => {
      canSkip.current = true
    }, 700)
    playTimer.current = window.setTimeout(
      beginExit,
      reduced ? REDUCED_PLAY_MS : PLAY_MS,
    )
  }, [beginExit])

  useEffect(() => {
    start()
    window.addEventListener('ortus-login-welcome', start)
    return () => {
      window.removeEventListener('ortus-login-welcome', start)
      window.clearTimeout(playTimer.current)
      window.clearTimeout(exitTimer.current)
      window.clearTimeout(skipTimer.current)
      document.body.classList.remove('cinematic-welcome-lock')
    }
  }, [start])

  useEffect(() => {
    if (phase !== 'exiting') return undefined
    window.clearTimeout(playTimer.current)
    exitTimer.current = window.setTimeout(finish, EXIT_MS)
    return () => window.clearTimeout(exitTimer.current)
  }, [phase, finish])

  useEffect(() => {
    if (phase === 'idle') return undefined
    const onKey = (event) => {
      if (
        event.key === 'Escape' ||
        event.key === 'Enter' ||
        event.key === ' '
      ) {
        event.preventDefault()
        requestSkip()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, requestSkip])

  return (
    <AnimatePresence>
      {phase !== 'idle' && (
        <motion.div
          key="login-welcome"
          className={`cinematic-welcome ${phase === 'exiting' ? 'is-exiting' : ''}`}
          role="dialog"
          aria-label="Welcome to Ortus"
          aria-live="polite"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          onClick={requestSkip}
        >
          <div className="cinematic-welcome-letterbox cinematic-welcome-letterbox--top" />
          <div className="cinematic-welcome-letterbox cinematic-welcome-letterbox--bottom" />
          <div className="cinematic-welcome-vignette" />
          <div className="cinematic-welcome-rays" />
          <div className="cinematic-welcome-grain" />

          <DnaHelix
            className="cinematic-welcome-helix cinematic-welcome-helix--left"
            gradientId="helixGradLeft"
          />
          <DnaHelix
            className="cinematic-welcome-helix cinematic-welcome-helix--right"
            gradientId="helixGradRight"
          />

          <div className="cinematic-welcome-motif cinematic-welcome-motif--oocyte">
            <OocyteMotif />
          </div>
          <div className="cinematic-welcome-motif cinematic-welcome-motif--syringe">
            <SyringeMotif />
          </div>
          <div className="cinematic-welcome-motif cinematic-welcome-motif--blastocyst">
            <BlastocystMotif />
          </div>
          <div className="cinematic-welcome-motif cinematic-welcome-motif--sperm-a">
            <SpermMotif />
          </div>
          <div className="cinematic-welcome-motif cinematic-welcome-motif--sperm-b">
            <SpermMotif />
          </div>

          <div className="cinematic-welcome-particles" aria-hidden="true">
            {particles.map((particle) => (
              <span
                key={particle.id}
                className="cinematic-welcome-particle"
                style={{
                  left: particle.left,
                  top: particle.top,
                  width: particle.size,
                  height: particle.size,
                  animationDelay: `${particle.delay}s`,
                  animationDuration: `${particle.duration}s`,
                }}
              />
            ))}
          </div>

          <div className="cinematic-welcome-stage">
            <p className="cinematic-welcome-kicker">Welcome to</p>
            <div className="cinematic-welcome-title-wrap">
              <span className="cinematic-welcome-title-outline">ORTUS</span>
              <span className="cinematic-welcome-title-fill">ORTUS</span>
              <span
                className="cinematic-welcome-title-shimmer"
                aria-hidden="true"
              >
                ORTUS
              </span>
            </div>
            <p className="cinematic-welcome-tagline">
              Believe · Conceive · Achieve
            </p>
            <div className="cinematic-welcome-progress" />
          </div>

          <p className="cinematic-welcome-skip">Continue</p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
