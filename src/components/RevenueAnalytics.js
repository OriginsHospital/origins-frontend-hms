import React, { useMemo, useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { Doughnut, Line, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import {
  TrendingUp,
  Payments,
  AccountBalanceWallet,
  ReceiptLong,
} from '@mui/icons-material'
import { formatRupeeRounded, roundCurrency } from '@/utils/currencyFormat'
import { getRevenueBranchDisplayCode } from '@/utils/branchMapping'
import {
  buildCategoryDataset,
  buildNamedTotals,
  CHART_PALETTE,
  computePercentage,
  getCategoryColor,
  getPaymentModeColor,
} from '@/utils/revenueCategories'

dayjs.extend(isoWeek)

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
)

const FILTER_SX = {
  minWidth: 160,
  backgroundColor: '#fff',
  '& .MuiInputBase-root': {
    height: 44,
    borderRadius: '10px',
  },
}

const rupeeTick = (value) =>
  `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

const doughnutCenterPlugin = {
  id: 'revenueDoughnutCenter',
  afterDraw(chart) {
    const { ctx, chartArea } = chart
    const total = chart.config?.options?.plugins?.centerText?.total
    const label = chart.config?.options?.plugins?.centerText?.label || 'Total'
    if (!chartArea || total == null) return

    const x = (chartArea.left + chartArea.right) / 2
    const y = (chartArea.top + chartArea.bottom) / 2

    ctx.save()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#5a7384'
    ctx.font = '600 11px DM Sans, Segoe UI, sans-serif'
    ctx.fillText(label, x, y - 12)
    ctx.fillStyle = '#123047'
    ctx.font = '700 16px DM Sans, Segoe UI, sans-serif'
    ctx.fillText(formatRupeeRounded(total), x, y + 8)
    ctx.restore()
  },
}

const ChartCard = ({ title, subtitle, children, height = 320 }) => (
  <Card
    elevation={0}
    sx={{
      height: '100%',
      border: '1px solid #cfe4ee',
      borderRadius: '16px',
      boxShadow: '0 2px 10px rgba(18, 48, 71, 0.06)',
    }}
  >
    <CardContent sx={{ p: 2.5, height: '100%' }}>
      <Typography
        sx={{ fontSize: 15, fontWeight: 700, color: '#123047', mb: 0.25 }}
      >
        {title}
      </Typography>
      {subtitle ? (
        <Typography sx={{ fontSize: 12, color: '#5a7384', mb: 1.5 }}>
          {subtitle}
        </Typography>
      ) : (
        <Box sx={{ mb: 1.5 }} />
      )}
      <Box sx={{ height, position: 'relative' }}>{children}</Box>
    </CardContent>
  </Card>
)

const KpiCard = ({ title, value, hint, icon, accent }) => (
  <Card
    elevation={0}
    sx={{
      height: '100%',
      border: '1px solid #cfe4ee',
      borderRadius: '16px',
      background: `linear-gradient(180deg, ${accent.wash} 0%, #ffffff 58%)`,
      boxShadow: '0 2px 10px rgba(18, 48, 71, 0.06)',
    }}
  >
    <CardContent sx={{ p: 2, display: 'flex', gap: 1.5, alignItems: 'center' }}>
      <Box
        sx={{
          width: 42,
          height: 42,
          borderRadius: '12px',
          display: 'grid',
          placeItems: 'center',
          backgroundColor: accent.soft,
          color: accent.main,
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: 12, color: '#5a7384', fontWeight: 600 }}>
          {title}
        </Typography>
        <Typography
          sx={{
            fontSize: 20,
            fontWeight: 800,
            color: '#123047',
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
          }}
        >
          {value}
        </Typography>
        {hint ? (
          <Typography sx={{ fontSize: 11, color: '#5a7384' }}>
            {hint}
          </Typography>
        ) : null}
      </Box>
    </CardContent>
  </Card>
)

const LegendList = ({ items }) => {
  if (!items?.length) {
    return (
      <Typography
        sx={{ fontSize: 13, color: '#5a7384', py: 4, textAlign: 'center' }}
      >
        No data for the selected filters
      </Typography>
    )
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        height: '100%',
        overflowY: 'auto',
        pr: 0.5,
      }}
    >
      {items.map((item) => (
        <Box
          key={item.label}
          sx={{
            display: 'grid',
            gridTemplateColumns: '10px 1fr auto',
            gap: 1,
            alignItems: 'center',
            minHeight: 36,
            px: 1,
            py: 0.5,
            borderRadius: '10px',
            backgroundColor: '#f7fbfd',
          }}
        >
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: '3px',
              backgroundColor: item.color,
              flexShrink: 0,
            }}
          />
          <Typography
            sx={{
              fontSize: 12,
              fontWeight: 600,
              color: '#123047',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {item.label}
          </Typography>
          <Box sx={{ textAlign: 'right' }}>
            <Typography
              sx={{ fontSize: 12, fontWeight: 700, color: '#123047' }}
            >
              {formatRupeeRounded(item.amount)}
            </Typography>
            <Typography sx={{ fontSize: 11, color: '#5a7384' }}>
              {item.percentage}
            </Typography>
          </Box>
        </Box>
      ))}
    </Box>
  )
}

function RevenueAnalytics({
  salesData = [],
  returnData = [],
  isLoading = false,
  branchCatalog = [],
  dropdownBranches = [],
}) {
  const [breakdown, setBreakdown] = useState('category')
  const [flowGrain, setFlowGrain] = useState('day')
  const [flowMetric, setFlowMetric] = useState('both')

  const getBranchLabel = (row) =>
    getRevenueBranchDisplayCode(row, branchCatalog, dropdownBranches) ||
    'Unknown'

  const pieDataset = useMemo(() => {
    if (breakdown === 'payment') {
      const named = buildNamedTotals(salesData, (row) =>
        String(row?.paymentMode || 'CASH').toUpperCase(),
      )
      return {
        ...named,
        colors: named.labels.map((label) => getPaymentModeColor(label)),
        items: named.labels.map((label, index) => ({
          label,
          amount: named.amounts[index],
          percentage: computePercentage(named.amounts[index], named.total),
          color: getPaymentModeColor(label),
        })),
      }
    }

    if (breakdown === 'branch') {
      const named = buildNamedTotals(salesData, getBranchLabel)
      return {
        ...named,
        colors: named.labels.map(
          (_, index) => CHART_PALETTE[index % CHART_PALETTE.length],
        ),
        items: named.labels.map((label, index) => ({
          label,
          amount: named.amounts[index],
          percentage: computePercentage(named.amounts[index], named.total),
          color: CHART_PALETTE[index % CHART_PALETTE.length],
        })),
      }
    }

    const named = buildCategoryDataset(salesData)
    return {
      ...named,
      colors: named.labels.map((label) => getCategoryColor(label)),
    }
  }, [salesData, breakdown, branchCatalog, dropdownBranches])

  const flowDataset = useMemo(() => {
    const bucketKey = (value) => {
      const date = dayjs(value)
      if (!date.isValid()) return 'Unknown'
      return flowGrain === 'week'
        ? `W${date.isoWeek()} ${date.format('YYYY')}`
        : date.format('DD MMM')
    }
    const sortKey = (value) => {
      const date = dayjs(value)
      if (!date.isValid()) return 0
      return flowGrain === 'week'
        ? date.startOf('isoWeek').valueOf()
        : date.valueOf()
    }

    const salesMap = {}
    const refundMap = {}
    const order = []

    const touch = (map, row) => {
      const rawDate = row?.date
      const key = bucketKey(rawDate)
      if (!salesMap[key] && !refundMap[key]) {
        order.push({ key, sort: sortKey(rawDate) })
      }
      const amount = Math.abs(Number(row?.amount) || 0)
      map[key] = (map[key] || 0) + amount
    }

    salesData.forEach((row) => touch(salesMap, row))
    returnData.forEach((row) => touch(refundMap, row))

    const labels = order.sort((a, b) => a.sort - b.sort).map((item) => item.key)

    return {
      labels,
      sales: labels.map((label) => roundCurrency(salesMap[label] || 0)),
      refunds: labels.map((label) => roundCurrency(refundMap[label] || 0)),
    }
  }, [salesData, returnData, flowGrain])

  const paymentBars = useMemo(() => {
    const named = buildNamedTotals(salesData, (row) =>
      String(row?.paymentMode || 'CASH').toUpperCase(),
    )
    return {
      labels: named.labels,
      amounts: named.amounts,
      colors: named.labels.map((label) => getPaymentModeColor(label)),
    }
  }, [salesData])

  const branchBars = useMemo(() => {
    const named = buildNamedTotals(salesData, getBranchLabel)
    return {
      labels: named.labels,
      amounts: named.amounts,
      colors: named.labels.map(
        (_, index) => CHART_PALETTE[index % CHART_PALETTE.length],
      ),
    }
  }, [salesData, branchCatalog, dropdownBranches])

  const kpis = useMemo(() => {
    const totalSales = roundCurrency(
      salesData.reduce((sum, row) => sum + (Number(row?.amount) || 0), 0),
    )
    const totalRefunds = roundCurrency(
      returnData.reduce(
        (sum, row) => sum + Math.abs(Number(row?.amount) || 0),
        0,
      ),
    )
    const count = salesData.length
    return {
      totalSales,
      totalRefunds,
      net: roundCurrency(totalSales - totalRefunds),
      count,
      avg: count ? roundCurrency(totalSales / count) : 0,
    }
  }, [salesData, returnData])

  const doughnutData = useMemo(
    () => ({
      labels: pieDataset.labels,
      datasets: [
        {
          data: pieDataset.amounts,
          backgroundColor: pieDataset.colors,
          borderColor: '#ffffff',
          borderWidth: 3,
          hoverOffset: 6,
        },
      ],
    }),
    [pieDataset],
  )

  const doughnutOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: '62%',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => {
              const amount = roundCurrency(context.raw)
              return ` ${formatRupeeRounded(amount)} (${computePercentage(
                amount,
                pieDataset.total,
              )})`
            },
          },
        },
        centerText: {
          total: pieDataset.total,
          label: 'Sales',
        },
      },
    }),
    [pieDataset.total],
  )

  const lineData = useMemo(() => {
    const datasets = []
    if (flowMetric !== 'refunds') {
      datasets.push({
        label: 'Sales',
        data: flowDataset.sales,
        borderColor: '#06aee9',
        backgroundColor: 'rgba(6, 174, 233, 0.16)',
        fill: true,
        tension: 0.35,
        pointRadius: 3,
        pointBackgroundColor: '#0284b8',
        borderWidth: 2.5,
      })
    }
    if (flowMetric !== 'sales') {
      datasets.push({
        label: 'Refunds',
        data: flowDataset.refunds,
        borderColor: '#dc3b3b',
        backgroundColor: 'rgba(220, 59, 59, 0.12)',
        fill: true,
        tension: 0.35,
        pointRadius: 3,
        pointBackgroundColor: '#b42318',
        borderWidth: 2.5,
      })
    }
    return { labels: flowDataset.labels, datasets }
  }, [flowDataset, flowMetric])

  const lineOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: { boxWidth: 10, usePointStyle: true, color: '#123047' },
        },
        tooltip: {
          callbacks: {
            label: (context) =>
              ` ${context.dataset.label}: ${formatRupeeRounded(context.raw)}`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#5a7384', maxRotation: 0, autoSkip: true },
        },
        y: {
          beginAtZero: true,
          grid: { color: '#e7f0f5' },
          ticks: {
            color: '#5a7384',
            callback: rupeeTick,
          },
        },
      },
    }),
    [],
  )

  const makeBarData = (dataset) => ({
    labels: dataset.labels,
    datasets: [
      {
        data: dataset.amounts,
        backgroundColor: dataset.colors,
        borderRadius: 8,
        maxBarThickness: 36,
      },
    ],
  })

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => ` ${formatRupeeRounded(context.raw)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#5a7384' },
      },
      y: {
        beginAtZero: true,
        grid: { color: '#e7f0f5' },
        ticks: { color: '#5a7384', callback: rupeeTick },
      },
    },
  }

  const hasPieData = pieDataset.amounts.some((amount) => amount > 0)
  const pieTitle =
    breakdown === 'payment'
      ? 'Payment mix'
      : breakdown === 'branch'
        ? 'Branch mix'
        : 'Service mix'

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: 1.5,
          '@media (max-width: 1100px)': {
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          },
          '@media (max-width: 640px)': {
            gridTemplateColumns: '1fr',
          },
        }}
      >
        <KpiCard
          title="Total Sales"
          value={formatRupeeRounded(kpis.totalSales)}
          hint={`${kpis.count} transactions`}
          icon={<TrendingUp fontSize="small" />}
          accent={{ main: '#0284b8', soft: '#d9f3fb', wash: '#eef9fd' }}
        />
        <KpiCard
          title="Total Refunds"
          value={formatRupeeRounded(kpis.totalRefunds)}
          hint={`${returnData.length} refunds`}
          icon={<Payments fontSize="small" />}
          accent={{ main: '#dc3b3b', soft: '#fdecec', wash: '#fff7f7' }}
        />
        <KpiCard
          title="Net Revenue"
          value={formatRupeeRounded(kpis.net)}
          hint="Sales minus refunds"
          icon={<AccountBalanceWallet fontSize="small" />}
          accent={{ main: '#0f9d6e', soft: '#e8f8f2', wash: '#f3fbf7' }}
        />
        <KpiCard
          title="Avg. Ticket"
          value={formatRupeeRounded(kpis.avg)}
          hint="Average sale amount"
          icon={<ReceiptLong fontSize="small" />}
          accent={{ main: '#d97706', soft: '#fef6e6', wash: '#fffaf0' }}
        />
      </Box>

      <Card
        elevation={0}
        sx={{
          border: '1px solid #cfe4ee',
          borderRadius: '16px',
          px: 2,
          py: 1.5,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1.5,
          alignItems: 'center',
        }}
      >
        <Typography
          sx={{ fontSize: 13, fontWeight: 700, color: '#123047', mr: 0.5 }}
        >
          Analytics filters
        </Typography>
        <FormControl size="small" sx={FILTER_SX}>
          <InputLabel>Breakdown</InputLabel>
          <Select
            label="Breakdown"
            value={breakdown}
            onChange={(e) => setBreakdown(e.target.value)}
          >
            <MenuItem value="category">Service category</MenuItem>
            <MenuItem value="payment">Payment mode</MenuItem>
            <MenuItem value="branch">Branch</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={FILTER_SX}>
          <InputLabel>Flow grain</InputLabel>
          <Select
            label="Flow grain"
            value={flowGrain}
            onChange={(e) => setFlowGrain(e.target.value)}
          >
            <MenuItem value="day">Daily</MenuItem>
            <MenuItem value="week">Weekly</MenuItem>
          </Select>
        </FormControl>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={flowMetric}
          onChange={(_, value) => value && setFlowMetric(value)}
          sx={{
            ml: { xs: 0, md: 'auto' },
            '& .MuiToggleButton-root': {
              textTransform: 'none',
              px: 1.75,
              height: 36,
              fontWeight: 600,
              borderColor: '#cfe4ee',
              color: '#5a7384',
              '&.Mui-selected': {
                backgroundColor: '#e7f7fc',
                color: '#0284b8',
                borderColor: '#06aee9',
              },
            },
          }}
        >
          <ToggleButton value="both">Sales + Refunds</ToggleButton>
          <ToggleButton value="sales">Sales only</ToggleButton>
          <ToggleButton value="refunds">Refunds only</ToggleButton>
        </ToggleButtonGroup>
      </Card>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 5fr) minmax(0, 7fr)',
          gap: 2,
          '@media (max-width: 1100px)': {
            gridTemplateColumns: '1fr',
          },
        }}
      >
        <ChartCard
          title={pieTitle}
          subtitle="Share of filtered sales"
          height={280}
        >
          {isLoading ? (
            <Box sx={{ height: '100%', display: 'grid', placeItems: 'center' }}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1fr)',
                gap: 1.5,
                height: '100%',
                '@media (max-width: 720px)': {
                  gridTemplateColumns: '1fr',
                },
              }}
            >
              <Box sx={{ minHeight: 220 }}>
                {hasPieData ? (
                  <Doughnut
                    data={doughnutData}
                    options={doughnutOptions}
                    plugins={[doughnutCenterPlugin]}
                  />
                ) : (
                  <Box
                    sx={{
                      height: '100%',
                      display: 'grid',
                      placeItems: 'center',
                      color: '#5a7384',
                    }}
                  >
                    No data available
                  </Box>
                )}
              </Box>
              <LegendList items={pieDataset.items} />
            </Box>
          )}
        </ChartCard>

        <ChartCard
          title="Revenue flow"
          subtitle={
            flowGrain === 'week'
              ? 'Weekly sales and refund trend'
              : 'Daily sales and refund trend'
          }
          height={280}
        >
          {isLoading ? (
            <Box sx={{ height: '100%', display: 'grid', placeItems: 'center' }}>
              <CircularProgress size={28} />
            </Box>
          ) : flowDataset.labels.length ? (
            <Line data={lineData} options={lineOptions} />
          ) : (
            <Box
              sx={{
                height: '100%',
                display: 'grid',
                placeItems: 'center',
                color: '#5a7384',
              }}
            >
              No trend data for the selected range
            </Box>
          )}
        </ChartCard>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 2,
          '@media (max-width: 900px)': {
            gridTemplateColumns: '1fr',
          },
        }}
      >
        <ChartCard
          title="Payment mode"
          subtitle="Collected amount by mode"
          height={260}
        >
          {paymentBars.labels.length ? (
            <Bar data={makeBarData(paymentBars)} options={barOptions} />
          ) : (
            <Box
              sx={{
                height: '100%',
                display: 'grid',
                placeItems: 'center',
                color: '#5a7384',
              }}
            >
              No payment data
            </Box>
          )}
        </ChartCard>
        <ChartCard
          title="Branch performance"
          subtitle="Collected amount by branch"
          height={260}
        >
          {branchBars.labels.length ? (
            <Bar data={makeBarData(branchBars)} options={barOptions} />
          ) : (
            <Box
              sx={{
                height: '100%',
                display: 'grid',
                placeItems: 'center',
                color: '#5a7384',
              }}
            >
              No branch data
            </Box>
          )}
        </ChartCard>
      </Box>
    </Box>
  )
}

export default RevenueAnalytics
