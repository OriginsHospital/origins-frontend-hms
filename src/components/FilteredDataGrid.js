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
  onRowsChange,
  hideExport = false,
  sx,
  ...props
}) => {
  const [filteredRows, setFilteredRows] = useState(rows)

  const notifyChange = (newRows) => {
    if (typeof onRowsChange === 'function') {
      onRowsChange(newRows)
    }
  }

  useEffect(() => {
    setFilteredRows(rows)
    notifyChange(rows)
  }, [rows])

  const handleFilterChange = (filters) => {
    const filtered = filterData(rows, filters)
    setFilteredRows(filtered)
    notifyChange(filtered)
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
          hideExport,
        },
      }}
      sx={{
        '& .MuiDataGrid-cell': {
          color: '#123047',
          fontWeight: 600,
          overflow: 'hidden',
        },
        '& .MuiDataGrid-cellContent': {
          color: '#123047',
          fontWeight: 600,
          textOverflow: 'clip',
          overflow: 'hidden',
        },
        '& .MuiDataGrid-columnHeaderTitle': {
          color: '#123047',
          fontWeight: 800,
        },
        '& .MuiDataGrid-columnSeparator': {
          display: 'none',
        },
        ...sx,
      }}
      {...props}
    />
  )
}

export default FilteredDataGrid
