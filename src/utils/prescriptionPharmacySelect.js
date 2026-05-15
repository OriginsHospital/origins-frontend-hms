import React from 'react'

export const PHARMACY_LOW_STOCK_THRESHOLD = 5
export const PHARMACY_LOW_STOCK_SKY_BLUE = '#87CEEB'
export const PHARMACY_LOW_STOCK_SKY_BLUE_ACCENT = '#0284C7'

export function getPharmacyStockQuantity(item) {
  return Number(item?.quantity ?? item?.availableQuantity ?? 0)
}

export function isPharmacyLowStock(item) {
  return getPharmacyStockQuantity(item) < PHARMACY_LOW_STOCK_THRESHOLD
}

export function buildPharmacySelectOption(data) {
  const quantity = getPharmacyStockQuantity(data)
  return {
    value: data.id,
    label: data.name,
    quantity,
    isLowStock: quantity < PHARMACY_LOW_STOCK_THRESHOLD,
  }
}

export function enrichPharmacySelectValue(option, allBillTypeValues) {
  if (!option?.value) {
    return option
  }

  const stockItem = allBillTypeValues?.Pharmacy?.find(
    (item) => String(item.id) === String(option.value),
  )

  if (!stockItem) {
    return option
  }

  return {
    ...option,
    ...buildPharmacySelectOption(stockItem),
  }
}

export const pharmacySelectStyles = {
  option: (provided, state) => {
    if (!state.data?.isLowStock) {
      return provided
    }

    return {
      ...provided,
      backgroundColor: state.isSelected
        ? PHARMACY_LOW_STOCK_SKY_BLUE_ACCENT
        : state.isFocused
          ? '#7EC8E3'
          : PHARMACY_LOW_STOCK_SKY_BLUE,
      color: state.isSelected ? '#ffffff' : PHARMACY_LOW_STOCK_SKY_BLUE_ACCENT,
      fontWeight: 500,
    }
  },
  multiValue: (provided, state) => {
    if (!state.data?.isLowStock) {
      return provided
    }

    return {
      ...provided,
      backgroundColor: PHARMACY_LOW_STOCK_SKY_BLUE,
    }
  },
  multiValueLabel: (provided, state) => {
    if (!state.data?.isLowStock) {
      return provided
    }

    return {
      ...provided,
      color: PHARMACY_LOW_STOCK_SKY_BLUE_ACCENT,
      fontWeight: 600,
    }
  },
}

export function formatPharmacyOptionLabel(option) {
  if (option?.isKit || !option?.isLowStock) {
    return option.label
  }

  return (
    <span className="flex w-full items-center justify-between gap-2">
      <span>{option.label}</span>
      <span
        style={{ color: PHARMACY_LOW_STOCK_SKY_BLUE_ACCENT }}
        className="text-xs font-semibold whitespace-nowrap"
      >
        Qty: {option.quantity}
      </span>
    </span>
  )
}

export function PrescriptionPharmacyLowStockLegend() {
  return (
    <p className="text-xs flex items-center gap-2 mt-1">
      <span
        className="inline-block w-3 h-3 rounded-sm shrink-0"
        style={{ backgroundColor: PHARMACY_LOW_STOCK_SKY_BLUE }}
        aria-hidden
      />
      <span style={{ color: PHARMACY_LOW_STOCK_SKY_BLUE_ACCENT }}>
        Sky blue items have available stock quantity less than 5
      </span>
    </p>
  )
}
