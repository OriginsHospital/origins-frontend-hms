import React, { useMemo } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import dayjs from 'dayjs'
import { Avatar } from '@mui/material'
import { CheckCircle } from '@mui/icons-material'
import { getAppointmentsForDoctor } from '@/constants/apis'

function statusLabel(appointment) {
  if (appointment?.status === 'CLOSED') return 'Closed'
  if (appointment?.isCompleted) return 'Seen'
  if (String(appointment?.stage || '').toLowerCase() === 'seen') return 'Seen'
  return 'Waiting'
}

export default function DoctorTodayAppointments({
  eyebrow,
  headline,
  roleName,
}) {
  const user = useSelector((store) => store.user)
  const today = dayjs()
  const todayKey = today.format('YYYY-MM-DD')
  const todayLabel = today.format('DD MMM YYYY')

  const {
    data: appointments = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['doctorDashboardAppointments', todayKey, user?.accessToken],
    enabled: !!user?.accessToken,
    queryFn: async () => {
      const response = await getAppointmentsForDoctor(
        user.accessToken,
        todayKey,
      )
      if (response.status === 200) {
        return Array.isArray(response.data) ? response.data : []
      }
      throw new Error(
        response?.message || "Could not load today's appointments",
      )
    },
  })

  const summary = useMemo(() => {
    const total = appointments.length
    const seen = appointments.filter(
      (row) =>
        row.isCompleted ||
        statusLabel(row) === 'Seen' ||
        row.status === 'CLOSED',
    ).length
    const waiting = Math.max(total - seen, 0)
    const consultations = appointments.filter(
      (row) => String(row.type || '').toLowerCase() === 'consultation',
    ).length
    return { total, seen, waiting, consultations }
  }, [appointments])

  const sortedAppointments = useMemo(() => {
    return [...appointments].sort((a, b) =>
      String(a.timeStart || '').localeCompare(String(b.timeStart || '')),
    )
  }, [appointments])

  return (
    <section className="mb-5 rounded-2xl border border-[#cfe4ee] bg-white shadow-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-secondary">
              {eyebrow || 'Doctor workspace'}
            </p>
            {roleName ? (
              <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-[#0284b8]">
                {roleName}
              </span>
            ) : null}
          </div>
          <h1 className="text-2xl font-bold text-ink leading-tight">
            {headline}
          </h1>
          <p className="text-[13px] text-muted">
            Today&apos;s appointments · {todayLabel}
          </p>
        </div>
        <Link
          href={`/doctor/appointments?date=${todayKey}`}
          className="text-sm font-semibold text-secondary hover:text-[#0284b8] whitespace-nowrap"
        >
          Open full list
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-2 px-4 pb-3">
        <SummaryTile label="Total" value={summary.total} />
        <SummaryTile label="Waiting" value={summary.waiting} tone="wait" />
        <SummaryTile label="Seen" value={summary.seen} tone="done" />
        <SummaryTile
          label="Consultations"
          value={summary.consultations}
          tone="info"
        />
      </div>

      <div className="px-4 pb-3">
        {isLoading ? (
          <p className="py-3 text-center text-sm text-muted">
            Loading today&apos;s appointments…
          </p>
        ) : isError ? (
          <p className="py-3 text-center text-sm text-error-content">
            Could not load today&apos;s appointments.
          </p>
        ) : sortedAppointments.length === 0 ? (
          <p className="py-3 text-center text-sm text-muted">
            No appointments scheduled for you today.
          </p>
        ) : (
          <div className="max-h-56 overflow-y-auto divide-y divide-[#e7f1f6] rounded-xl border border-[#e7f1f6]">
            {sortedAppointments.map((appointment) => {
              const status = statusLabel(appointment)
              const href = `/doctor/appointments?date=${todayKey}&patientId=${appointment.patientId || ''}&appointmentId=${appointment.appointmentId || ''}&type=${encodeURIComponent(appointment.type || '')}`
              return (
                <Link
                  key={`${appointment.appointmentId}-${appointment.type}`}
                  href={href}
                  className="flex items-center gap-3 px-3 py-2 bg-white hover:bg-[#f7fcfe] transition-colors"
                >
                  {appointment.photoPath && appointment.photoPath !== 'null' ? (
                    <img
                      src={appointment.photoPath}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <Avatar sx={{ width: 32, height: 32, fontSize: 13 }}>
                      {(appointment.firstName || appointment.patientName || '?')
                        .toString()
                        .charAt(0)}
                    </Avatar>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-ink truncate">
                      {appointment.patientName ||
                        appointment.firstName ||
                        'Patient'}
                    </p>
                    <p className="text-[11px] text-muted truncate">
                      {[
                        appointment.type,
                        appointment.appointmentReason,
                        appointment.visitType,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-secondary">
                      {appointment.isCompleted ? (
                        <CheckCircle
                          className="text-green-500"
                          fontSize="small"
                        />
                      ) : (
                        appointment.timeStart || '--:--'
                      )}
                    </p>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        status === 'Seen' || status === 'Closed'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-primary text-[#0284b8]'
                      }`}
                    >
                      {status}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

function SummaryTile({ label, value, tone }) {
  const tones = {
    wait: 'bg-[#fff7e8] text-[#b45309]',
    done: 'bg-[#e8f8f2] text-[#0b7a56]',
    info: 'bg-[#e7f7fc] text-[#0284b8]',
    default: 'bg-[#f4f8fb] text-ink',
  }
  return (
    <div className={`rounded-lg px-2 py-2 ${tones[tone] || tones.default}`}>
      <p className="text-[13px] font-medium opacity-80">{label}</p>
      <p className="text-2xl font-bold leading-none mt-0.5">{value}</p>
    </div>
  )
}
