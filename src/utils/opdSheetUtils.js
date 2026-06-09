const isBlankHtml = (html = '') => {
  const text = String(html)
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return !text
}

const getMeaningfulHtml = (element) => {
  if (!element) return null
  const html = element.innerHTML?.trim()
  if (!html || isBlankHtml(html)) return null
  return html
}

export const extractOpdSummary = (html = '') => {
  if (!html?.trim()) return null

  if (typeof DOMParser === 'undefined') return null

  const doc = new DOMParser().parseFromString(html, 'text/html')
  const candidates = doc.body.querySelectorAll(
    'h1,h2,h3,h4,h5,h6,td,th,div,p,span,strong,b',
  )

  for (const element of candidates) {
    const label = element.textContent?.replace(/\s+/g, ' ').trim().toUpperCase()
    if (label !== 'SUMMARY') continue

    const nextSiblingContent = getMeaningfulHtml(element.nextElementSibling)
    if (nextSiblingContent) return nextSiblingContent

    const parentNextContent = getMeaningfulHtml(
      element.parentElement?.nextElementSibling,
    )
    if (parentNextContent) return parentNextContent

    const tableCell = element.closest('td,th')
    if (tableCell) {
      const adjacentCellContent = getMeaningfulHtml(
        tableCell.nextElementSibling,
      )
      if (adjacentCellContent) return adjacentCellContent
    }

    const tableRow = element.closest('tr')
    if (tableRow) {
      const nextRow = tableRow.nextElementSibling
      if (nextRow) {
        const cells = nextRow.querySelectorAll('td,th')
        const rowContent =
          cells.length > 1
            ? getMeaningfulHtml(cells[cells.length - 1])
            : getMeaningfulHtml(nextRow)
        if (rowContent) return rowContent
      }
    }

    const summaryContainer = element.closest('div,section,article')
    if (summaryContainer) {
      const containerNextContent = getMeaningfulHtml(
        summaryContainer.nextElementSibling,
      )
      if (containerNextContent) return containerNextContent
    }
  }

  const regexMatch = html.match(
    /SUMMARY[\s\S]*?<\/(?:h[1-6]|div|td|th|p|span)[^>]*>\s*(?:<\/div>)?\s*<(?:div|td|table)[^>]*>([\s\S]*?)<\/(?:div|td|table)>/i,
  )
  if (regexMatch?.[1] && !isBlankHtml(regexMatch[1])) {
    return regexMatch[1].trim()
  }

  return null
}

export const hasOpdSummaryContent = (html = '') => {
  const summary = extractOpdSummary(html)
  return !!summary && !isBlankHtml(summary)
}
