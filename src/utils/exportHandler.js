import {
  generateReportFileName,
  detectReportContext,
  generateEnhancedReportFileName,
  downloadFile,
} from './fileNamingUtils'

/**
 * Enhanced export handler for DataGrid with dynamic file naming
 */
export class ExportHandler {
  constructor(options = {}) {
    this.options = {
      reportName: null,
      reportType: null,
      branchName: null,
      filters: {},
      includeTimestamp: true,
      includeUniqueId: false,
      ...options,
    }
  }

  /**
   * Generate filename for export
   * @param {string} format - Export format (csv, xlsx, pdf)
   * @returns {string} - Generated filename
   */
  generateFileName(format = 'csv') {
    return generateEnhancedReportFileName({
      reportName: this.options.reportName,
      reportType: this.options.reportType,
      format,
      date: new Date(),
      branchName: this.options.branchName,
      filters: this.options.filters,
      includeTimestamp: this.options.includeTimestamp,
      includeUniqueId: this.options.includeUniqueId,
    })
  }

  /**
   * Handle CSV export with dynamic naming
   * @param {Array} data - Data to export
   * @param {Array} columns - Column definitions
   * @param {string} format - Export format
   */
  exportCSV(data, columns, format = 'csv') {
    const fileName = this.generateFileName(format)

    // Convert data to CSV format
    const csvContent = this.convertToCSV(data, columns)

    // Add BOM for proper UTF-8 encoding
    const BOM = '\uFEFF'
    const csvWithBOM = BOM + csvContent

    // Create blob and download
    const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' })
    this.downloadBlob(blob, fileName)
  }

  /**
   * Handle Excel export with dynamic naming
   * @param {Array} data - Data to export
   * @param {Array} columns - Column definitions
   */
  exportExcel(data, columns) {
    const fileName = this.generateFileName('xlsx')

    // For Excel export, we'll use a simple CSV approach
    // In a real implementation, you'd use a library like xlsx
    const csvContent = this.convertToCSV(data, columns)
    const blob = new Blob([csvContent], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    downloadFile(blob, fileName)
  }

  /**
   * Handle PDF export with dynamic naming
   * @param {Array} data - Data to export
   * @param {Array} columns - Column definitions
   */
  exportPDF(data, columns) {
    const fileName = this.generateFileName('pdf')

    // For PDF export, we'll create a simple text-based PDF
    // In a real implementation, you'd use a library like jsPDF
    const textContent = this.convertToText(data, columns)
    const blob = new Blob([textContent], { type: 'application/pdf' })
    downloadFile(blob, fileName)
  }

  /**
   * Convert data to CSV format
   * @param {Array} data - Data to convert
   * @param {Array} columns - Column definitions
   * @returns {string} - CSV content
   */
  convertToCSV(data, columns) {
    if (!data || data.length === 0) return ''

    // Get visible columns
    const visibleColumns = columns.filter((col) => col.field && col.headerName)

    // Create header row
    const headers = visibleColumns.map((col) => col.headerName).join(',')

    // Create data rows
    const rows = data.map((row) => {
      return visibleColumns
        .map((col) => {
          const value = row[col.field]
          // Escape commas and quotes in CSV
          if (
            typeof value === 'string' &&
            (value.includes(',') || value.includes('"'))
          ) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value || ''
        })
        .join(',')
    })

    return [headers, ...rows].join('\n')
  }

  /**
   * Convert data to text format
   * @param {Array} data - Data to convert
   * @param {Array} columns - Column definitions
   * @returns {string} - Text content
   */
  convertToText(data, columns) {
    if (!data || data.length === 0) return ''

    const visibleColumns = columns.filter((col) => col.field && col.headerName)

    // Create header
    const headers = visibleColumns.map((col) => col.headerName).join('\t')

    // Create data rows
    const rows = data.map((row) => {
      return visibleColumns
        .map((col) => {
          return row[col.field] || ''
        })
        .join('\t')
    })

    return [headers, ...rows].join('\n')
  }

  /**
   * Download blob as file
   * @param {Blob} blob - File blob
   * @param {string} fileName - File name
   */
  downloadBlob(blob, fileName) {
    try {
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      link.style.display = 'none'

      // Add to DOM, click, and remove
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Clean up
      window.URL.revokeObjectURL(url)

      console.log(`File downloaded: ${fileName}`)
    } catch (error) {
      console.error('Download failed:', error)
      // Fallback: open in new window
      const url = window.URL.createObjectURL(blob)
      window.open(url, '_blank')
    }
  }

  /**
   * Update export options
   * @param {Object} newOptions - New options to merge
   */
  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions }
  }
}

/**
 * Create export handler instance
 * @param {Object} options - Export options
 * @returns {ExportHandler} - Export handler instance
 */
export const createExportHandler = (options = {}) => {
  return new ExportHandler(options)
}

/**
 * Hook for handling exports in React components
 * @param {Object} options - Export options
 * @returns {Object} - Export functions
 */
export const useExportHandler = (options = {}) => {
  const handler = new ExportHandler(options)

  return {
    exportCSV: (data, columns) => handler.exportCSV(data, columns, 'csv'),
    exportExcel: (data, columns) => handler.exportExcel(data, columns),
    exportPDF: (data, columns) => handler.exportPDF(data, columns),
    generateFileName: (format) => handler.generateFileName(format),
    updateOptions: (newOptions) => handler.updateOptions(newOptions),
  }
}

export default ExportHandler
