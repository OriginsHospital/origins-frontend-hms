import React, { useMemo } from 'react'
import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Title, Tooltip, Legend } from 'chart.js'
import { CircularProgress } from '@mui/material'
import { formatRupeeRounded, roundCurrency } from '@/utils/currencyFormat'
import { computePercentage } from '@/utils/revenueCategories'

ChartJS.register(ArcElement, Title, Tooltip, Legend)

const doughnutCenterPlugin = {
  id: 'salesChartCenter',
  afterDraw(chart) {
    const { ctx, chartArea } = chart
    const total = chart.config?.options?.plugins?.centerText?.total
    if (!chartArea || total == null) return

    const x = (chartArea.left + chartArea.right) / 2
    const y = (chartArea.top + chartArea.bottom) / 2

    ctx.save()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#5a7384'
    ctx.font = '600 11px DM Sans, Segoe UI, sans-serif'
    ctx.fillText('Total', x, y - 12)
    ctx.fillStyle = '#123047'
    ctx.font = '700 15px DM Sans, Segoe UI, sans-serif'
    ctx.fillText(formatRupeeRounded(total), x, y + 8)
    ctx.restore()
  },
}

const SalesChart = ({ dataset, isLoading, hasData }) => {
  const totalAmount = useMemo(() => {
    return roundCurrency(
      (dataset?.amounts || []).reduce((sum, amount) => sum + amount, 0),
    )
  }, [dataset])

  const pieData = useMemo(() => {
    const labels = dataset?.labels || []
    const amounts = dataset?.amounts || []
    const colors = dataset?.colors || []

    return {
      labels,
      datasets: [
        {
          data: amounts,
          backgroundColor: colors,
          borderColor: '#ffffff',
          borderWidth: 3,
          hoverOffset: 6,
        },
      ],
    }
  }, [dataset])

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: '62%',
      animation: {
        duration: 500,
        easing: 'easeInOutQuad',
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => {
              const amount = roundCurrency(context.raw)
              return ` ${formatRupeeRounded(amount)} (${computePercentage(
                amount,
                totalAmount,
              )})`
            },
          },
        },
        centerText: { total: totalAmount },
      },
    }),
    [totalAmount],
  )

  const legendItems = useMemo(() => {
    if (!pieData.labels?.length) return []
    const labels = pieData.labels
    const amounts = pieData.datasets?.[0]?.data || []
    const colors = pieData.datasets?.[0]?.backgroundColor || []

    return labels.map((label, index) => {
      const amount = roundCurrency(amounts[index])
      return {
        label,
        amount,
        color: colors[index],
        percentage: computePercentage(amount, totalAmount),
      }
    })
  }, [pieData, totalAmount])

  return (
    <div className="h-full w-full">
      <div className="relative flex h-full min-h-[420px] flex-col rounded-2xl border border-[#cfe4ee] bg-white p-4 shadow-[0_2px_10px_rgba(18,48,71,0.06)]">
        <div className="mb-3">
          <h3 className="text-[15px] font-bold text-[#123047]">Service mix</h3>
          <p className="text-xs text-[#5a7384]">Share of filtered sales</p>
        </div>
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/70">
            <CircularProgress size={28} thickness={5} />
          </div>
        )}
        {hasData ? (
          <>
            <div className="h-[220px] w-full">
              <Doughnut
                data={pieData}
                options={chartOptions}
                plugins={[doughnutCenterPlugin]}
              />
            </div>
            <div className="mt-3 flex flex-1 flex-col gap-1.5 overflow-auto pr-1">
              {legendItems.map((item) => (
                <div
                  key={item.label}
                  className="grid grid-cols-[10px_minmax(0,1fr)_auto] items-center gap-2 rounded-lg bg-[#f7fbfd] px-2 py-1.5"
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="truncate text-xs font-semibold text-[#123047]">
                    {item.label}
                  </span>
                  <span className="whitespace-nowrap text-right text-[11px] text-[#5a7384]">
                    {formatRupeeRounded(item.amount)} · {item.percentage}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-[#5a7384]">
            No data available for the selected filters
          </div>
        )}
      </div>
    </div>
  )
}

export default SalesChart
