function InfoItem({ label, value }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <span className="truncate text-sm font-semibold text-slate-800">
        {value}
      </span>
    </div>
  )
}

export default InfoItem
