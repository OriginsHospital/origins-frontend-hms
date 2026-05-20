/**
 * When a trigger medicine is prescribed, these companion items are added automatically.
 * Names are matched flexibly against pharmacy master data (case, spacing, optional suffixes like INJ).
 */
export const PHARMACY_AUTO_COMPANION_RULES = [
  {
    trigger: 'EUTRIG-HP 10000',
    companions: [{ name: 'NIPRO SYRINGE 2.5ML', quantity: 1 }],
  },
  {
    trigger: 'EUTRIG-HP 2000',
    companions: [
      { name: 'NIPRO SYRINGE 2.5ML', quantity: 1 },
      { name: 'DISPOVAN NEEDLE 26', quantity: 1 },
    ],
  },
  {
    trigger: 'EUTRIG-HP 5000',
    companions: [{ name: 'NIPRO SYRINGE 2.5ML', quantity: 1 }],
  },
  {
    trigger: 'ARACHITOL',
    companions: [{ name: 'NIPRO SYRINGE 2.5ML', quantity: 1 }],
  },
  {
    trigger: 'CETROCARE 0.25 MG INJ',
    companions: [
      { name: 'NIPRO SYRINGE 2.5ML', quantity: 1 },
      { name: 'DISPOVAN NEEDLE 26', quantity: 1 },
    ],
  },
  {
    trigger: 'SITRODIN 150 IU',
    companions: [
      { name: 'NIPRO SYRINGE 2.5ML', quantity: 1 },
      { name: 'DISPOVAN NEEDLE 26', quantity: 1 },
    ],
  },
  {
    trigger: 'SITRODIN 75 IU',
    companions: [
      { name: 'NIPRO SYRINGE 2.5ML', quantity: 1 },
      { name: 'DISPOVAN NEEDLE 26', quantity: 1 },
    ],
  },
  {
    trigger: 'PERSINAL 150',
    companions: [{ name: 'NIPRO SYRINGE 2.5ML', quantity: 1 }],
  },
  {
    trigger: 'SIFASI 5000',
    companions: [{ name: 'NIPRO SYRINGE 2.5ML', quantity: 1 }],
  },
  {
    trigger: 'GLUCI',
    companions: [{ name: 'NIPRO SYRINGE 10ML', quantity: 1 }],
  },
  {
    trigger: 'SUSTEN 100 INJ',
    companions: [{ name: 'NIPRO SYRINGE 2.5ML', quantity: 1 }],
  },
  {
    trigger: 'Strone 100 mg inj',
    companions: [{ name: 'NIPRO SYRINGE 2.5ML', quantity: 1 }],
  },
  {
    trigger: 'BETT AMP',
    companions: [{ name: 'NIPRO SYRINGE 2.5ML', quantity: 1 }],
  },
]

export function normalizePharmacyName(name = '') {
  return String(name).toUpperCase().replace(/\s+/g, ' ').trim()
}

export function normalizePharmacyNameCompact(name = '') {
  return normalizePharmacyName(name).replace(/\s/g, '')
}

export function pharmacyNamesMatch(nameA, nameB) {
  const normA = normalizePharmacyName(nameA)
  const normB = normalizePharmacyName(nameB)
  if (!normA || !normB) {
    return false
  }
  if (normA === normB) {
    return true
  }
  const compactA = normalizePharmacyNameCompact(nameA)
  const compactB = normalizePharmacyNameCompact(nameB)
  if (compactA === compactB) {
    return true
  }
  return normA.includes(normB) || normB.includes(normA)
}

export function findPharmacyItemByName(billTypeValuesArray, targetName) {
  if (!billTypeValuesArray?.length || !targetName) {
    return null
  }
  return (
    billTypeValuesArray.find((item) =>
      pharmacyNamesMatch(item.name, targetName),
    ) ?? null
  )
}

export function getCompanionMedicinesForTriggers(selectedMedicineNames = []) {
  const companions = []
  const seen = new Set()

  for (const rule of PHARMACY_AUTO_COMPANION_RULES) {
    const triggerSelected = selectedMedicineNames.some((name) =>
      pharmacyNamesMatch(name, rule.trigger),
    )
    if (!triggerSelected) {
      continue
    }
    for (const companion of rule.companions) {
      const key = normalizePharmacyNameCompact(companion.name)
      if (seen.has(key)) {
        continue
      }
      seen.add(key)
      companions.push(companion)
    }
  }

  return companions
}

/**
 * Adds companion medicines to the prescription list when not already present (unpaid).
 */
export function applyPharmacyCompanionMedicines({
  companions,
  billTypeValuesArray,
  billTypeValues,
  existingAllItems = [],
  defaultLineBillValues,
}) {
  if (!companions?.length || !billTypeValuesArray?.length) {
    return billTypeValues
  }

  companions.forEach((companion) => {
    const medicineInPharmacy = findPharmacyItemByName(
      billTypeValuesArray,
      companion.name,
    )
    if (!medicineInPharmacy) {
      return
    }

    const alreadyInSelection = billTypeValues.some(
      (item) => item.id === medicineInPharmacy.id && item.status !== 'PAID',
    )
    if (alreadyInSelection) {
      return
    }

    const existingUnpaid = existingAllItems.find(
      (item) => item.id === medicineInPharmacy.id && item.status !== 'PAID',
    )

    const infoObject = defaultLineBillValues?.['3']?.find(
      (values) =>
        values.id === medicineInPharmacy.id && values.status !== 'PAID',
    )

    if (existingUnpaid) {
      billTypeValues.push({
        id: medicineInPharmacy.id,
        name: medicineInPharmacy.name,
        amount: parseInt(medicineInPharmacy.amount, 10),
        prescribedQuantity:
          existingUnpaid.prescribedQuantity ?? companion.quantity,
        prescriptionDetails:
          infoObject?.prescriptionDetails ??
          existingUnpaid.prescriptionDetails ??
          '',
        prescriptionDays:
          infoObject?.prescriptionDays ?? existingUnpaid.prescriptionDays ?? 1,
        status: 'UNPAID',
      })
      return
    }

    billTypeValues.push({
      id: medicineInPharmacy.id,
      name: medicineInPharmacy.name,
      amount: parseInt(medicineInPharmacy.amount, 10),
      prescribedQuantity: infoObject?.prescribedQuantity ?? companion.quantity,
      prescriptionDetails: infoObject?.prescriptionDetails ?? '',
      prescriptionDays: infoObject?.prescriptionDays ?? 1,
      status: 'UNPAID',
    })
  })

  return billTypeValues
}
