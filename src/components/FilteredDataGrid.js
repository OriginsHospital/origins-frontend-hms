import React, { useState, useEffect } from 'react'
import { DataGrid } from '@mui/x-data-grid'
import EnhancedCustomToolbar from './EnhancedCustomToolbar'

const FilteredDataGrid = ({
  rows,
  columns,
  customFilters,
  filterData,
  getUniqueValues,
  reportName,
  reportType,
  branchName,
  filters = {},
  ...props
}) => {
  const [filteredRows, setFilteredRows] = useState(rows)

  useEffect(() => {
    setFilteredRows(rows)
  }, [rows])

  const handleFilterChange = filters => {
    const filtered = filterData(rows, filters)
    setFilteredRows(filtered)
  }

  return (
    <DataGrid
      rows={filteredRows}
      columns={columns}
      slots={{
        toolbar: EnhancedCustomToolbar,
      }}
      slotProps={{
        toolbar: {
          customFilters,
          onFilterChange: handleFilterChange,
          getUniqueValues,
          reportName,
          reportType,
          branchName,
          filters,
          data: filteredRows,
          columns,
        },
      }}
      {...props}
    />
  )
}

export default FilteredDataGrid
