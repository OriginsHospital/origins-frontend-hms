import { roundCurrency } from '@/utils/currencyFormat'

export const CATEGORY_ORDER = [
  'IVF Package',
  'Embryo Freezing',
  'PGTA',
  'ERA',
  'Procedures',
  'Donor Sperm',
  'Microfluidics',
  'Others',
]

export const CATEGORY_COLORS = {
  'IVF Package': '#0f9d6e',
  'Embryo Freezing': '#0369a1',
  PGTA: '#7c3aed',
  ERA: '#d97706',
  Procedures: '#e67e22',
  'Donor Sperm': '#dc3b3b',
  Microfluidics: '#06aee9',
  Others: '#5a7384',
}

export const PAYMENT_MODE_COLORS = {
  CASH: '#0f9d6e',
  UPI: '#06aee9',
  CARD: '#7c3aed',
  ONLINE: '#0369a1',
  BANK: '#0284b8',
}

export const CHART_PALETTE = [
  '#06aee9',
  '#0f9d6e',
  '#0369a1',
  '#e67e22',
  '#7c3aed',
  '#d97706',
  '#dc3b3b',
  '#5a7384',
  '#0284b8',
  '#2ecc71',
]

export function getCategoryFromServiceName(serviceName) {
  if (!serviceName) return 'Others'

  const upperServiceName = String(serviceName).toUpperCase().trim()

  if (
    upperServiceName.includes('REGISTRATION') ||
    upperServiceName.includes('DAY1') ||
    upperServiceName === 'D1' ||
    upperServiceName.includes('TRIGGER') ||
    upperServiceName.includes('PICKUP') ||
    upperServiceName.includes('PICK UP') ||
    upperServiceName.includes('PICK-UP') ||
    upperServiceName.includes('FET') ||
    (upperServiceName.includes('UPT') &&
      !upperServiceName.includes('UPTPOSITIVE')) ||
    upperServiceName.includes('DONOR_BOOKING') ||
    upperServiceName.includes('DONOR BOOKING') ||
    upperServiceName === 'DONOR_BOOKING_AMOUNT' ||
    upperServiceName === 'DAY1_AMOUNT' ||
    upperServiceName === 'REGISTRATION_FEE' ||
    upperServiceName === 'FET_AMOUNT' ||
    upperServiceName === 'PICKUP_AMOUNT' ||
    upperServiceName.includes('MIDDLE')
  ) {
    return 'IVF Package'
  }

  if (
    upperServiceName.includes('FREEZING') ||
    upperServiceName.includes('EMBRYO FREEZING') ||
    upperServiceName.includes('DAY5FREEZING') ||
    upperServiceName.includes('DAY5 FREEZING') ||
    upperServiceName === 'DAY5FREEZING_AMOUNT' ||
    (upperServiceName.includes('EMBRYO') &&
      upperServiceName.includes('FREEZING'))
  ) {
    return 'Embryo Freezing'
  }

  if (
    upperServiceName.includes('PGTA') ||
    upperServiceName.includes('PGT') ||
    upperServiceName.includes('EMBRYOS FOR PGTA') ||
    (upperServiceName.includes('EMBRYO') &&
      upperServiceName.includes('PGTA')) ||
    upperServiceName.includes('PGT-A')
  ) {
    return 'PGTA'
  }

  if (upperServiceName.includes('ERA') || upperServiceName === 'ERA_AMOUNT') {
    return 'ERA'
  }

  if (
    upperServiceName.includes('LSCS') ||
    upperServiceName.includes('HYSTEROSCOPY') ||
    upperServiceName.includes('HYTEROSCOPY') ||
    upperServiceName.includes('LAPAROSCOPY') ||
    upperServiceName.includes('POLYPECTOMY') ||
    upperServiceName.includes('CERCLAGE') ||
    upperServiceName.includes('CONSULTATION') ||
    upperServiceName.includes('OBSERVATION') ||
    upperServiceName.includes('OP FEE') ||
    upperServiceName === 'SCAN' ||
    upperServiceName.includes('SONOGRAPHY') ||
    upperServiceName.includes('OVULATION SCAN') ||
    upperServiceName.includes('DISCHARGE')
  ) {
    return 'Procedures'
  }

  if (
    upperServiceName.includes('DONOR SPERM') ||
    upperServiceName.includes('DONOR_SPERM')
  ) {
    return 'Donor Sperm'
  }

  if (
    upperServiceName.includes('MICROFLUIDICS') ||
    upperServiceName.includes('MICRO FLUIDS') ||
    upperServiceName.includes('MICROFLUIDS') ||
    upperServiceName === 'MICRO FLUIDS'
  ) {
    return 'Microfluidics'
  }

  return 'Others'
}

export function getCategoryColor(label) {
  return CATEGORY_COLORS[label] || '#7f8c8d'
}

export function getPaymentModeColor(mode) {
  const key = String(mode || 'CASH').toUpperCase()
  return PAYMENT_MODE_COLORS[key] || '#5a7384'
}

export function computePercentage(value, total) {
  if (!total) return '0%'
  return `${((Number(value || 0) / total) * 100).toFixed(1)}%`
}

export function buildNamedTotals(rows, getKey) {
  const totals = (rows || []).reduce((acc, row) => {
    const key = getKey(row) || 'Others'
    acc[key] = (acc[key] || 0) + (Number(row?.amount) || 0)
    return acc
  }, {})

  const labels = Object.keys(totals).sort((a, b) => {
    const indexA = CATEGORY_ORDER.indexOf(a)
    const indexB = CATEGORY_ORDER.indexOf(b)
    if (indexA !== -1 && indexB !== -1) return indexA - indexB
    if (indexA !== -1) return -1
    if (indexB !== -1) return 1
    return totals[b] - totals[a]
  })

  const amounts = labels.map((label) => roundCurrency(totals[label]))
  const total = amounts.reduce((sum, amount) => sum + amount, 0)

  return {
    labels,
    amounts,
    total,
    items: labels.map((label, index) => ({
      label,
      amount: amounts[index],
      percentage: computePercentage(amounts[index], total),
      color: getCategoryColor(label),
    })),
  }
}

export function buildCategoryDataset(rows = []) {
  return buildNamedTotals(rows, (row) =>
    getCategoryFromServiceName(row?.productType || row?.service),
  )
}
