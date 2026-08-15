import Link from 'next/link'
import React from 'react'
import { motion } from 'framer-motion'

const DashboardCard = ({ title, subtitle, Icon, href, index = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: Math.min(index * 0.04, 0.32) }}
    >
      <Link
        href={href}
        className="group flex items-start gap-2.5 w-full min-h-[68px] p-2.5 rounded-xl relative overflow-hidden bg-white shadow-card border border-[#cfe4ee] hover:-translate-y-0.5 hover:shadow-panel hover:border-secondary/40 transition-all duration-200"
      >
        <span className="relative z-10 flex items-center justify-center w-9 h-9 rounded-lg bg-[#e7f7fc] text-secondary shrink-0 group-hover:bg-secondary group-hover:text-white group-hover:scale-110 transition-all duration-200">
          <Icon className="text-[18px]" />
        </span>
        <div className="relative z-10 min-w-0">
          <h3 className="font-bold text-[15px] leading-tight text-ink">
            {title}
          </h3>
          {subtitle ? (
            <p className="text-[13px] leading-snug text-muted mt-0.5">
              {subtitle}
            </p>
          ) : null}
        </div>
      </Link>
    </motion.div>
  )
}

export default DashboardCard
