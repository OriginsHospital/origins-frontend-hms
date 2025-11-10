import React from 'react'
import { Pie } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Title, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Title, Tooltip, Legend)

const SalesChart = ({ salesData }) => {
  const colors = [
    { 1: '#00C49F' },
    { 2: '#0088FE' },
    { 3: '#FFBB28' },
    { 4: '#FF8042' },
    { 5: '#FF99E6' },
    { 6: '#FF9999' },
    { 7: 'red' },
  ]

  // Product Type Pie Data (existing)
  const productPieData = {
    labels:
      salesData?.totalSalesProductTypeWise?.map(item => item.productType) || [],
    datasets: [
      {
        data:
          salesData?.totalSalesProductTypeWise?.map(item => item.amount) || [],
        backgroundColor:
          salesData?.totalSalesProductTypeWise?.map(
            (_, index) => colors[index][index + 1],
          ) || [],
        borderColor: '#ffffff',
        borderWidth: 2,
      },
    ],
  }

  // Payment Mode Pie Data (new)
  const paymentPieData = {
    labels:
      salesData?.totalSalesPaymentModeWise?.map(item => item.paymentMode) || [],
    datasets: [
      {
        data:
          salesData?.totalSalesPaymentModeWise?.map(item => item.amount) || [],
        backgroundColor:
          salesData?.totalSalesPaymentModeWise?.map(
            (_, index) => colors[index][index + 1],
          ) || [],
        borderColor: '#ffffff',
        borderWidth: 2,
      },
    ],
  }

  // Common options for both charts
  const createPieOptions = title => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: false,
        text: title,
        font: {
          size: 16,
          weight: 'bold',
        },
      },
      legend: {
        position: 'bottom',
        onClick: (e, legendItem, legend) => {
          const index = legendItem.index
          const chart = legend.chart
          const datasetMeta = chart.getDatasetMeta(0)
          const alreadyHidden = datasetMeta.data[index].hidden
          datasetMeta.data[index].hidden = !alreadyHidden
          legendItem.hidden = !alreadyHidden
          chart.update()
        },
        labels: {
          padding: 10,
          font: { size: 12 },
          generateLabels: chart => {
            const datasets = chart.data.datasets
            const meta = chart.getDatasetMeta(0)
            return chart.data.labels.map((label, index) => ({
              text: ` ${label} - ₹${datasets[0].data[index]?.toLocaleString(
                'en-IN',
              ) || 0}`,
              fillStyle: datasets[0].backgroundColor[index],
              hidden: meta.data[index] ? meta.data[index].hidden : false,
              index: index,
            }))
          },
        },
      },
      tooltip: {
        callbacks: {
          label: context => `₹${(context.raw || 0).toLocaleString('en-IN')}`,
        },
      },
    },
  })

  return (
    <div className="flex flex-col justify-center items-center gap-4">
      <div className="bg-white rounded-lg shadow-sm p-4 w-full h-[400px]">
        {salesData?.totalSalesProductTypeWise?.length > 0 ? (
          <Pie
            data={productPieData}
            options={createPieOptions('Sales by Product Type')}
          />
        ) : (
          <div className="text-gray-500">No product data available</div>
        )}
      </div>
      {/* <div className="bg-white rounded-lg shadow-sm p-4 ">
        {salesData?.totalSalesPaymentModeWise?.length > 0 ? (
          <Pie data={paymentPieData} options={createPieOptions('Sales by Payment Mode')} />
        ) : (
          <div className="text-gray-500">No payment mode data available</div>
        )}
      </div> */}
    </div>
  )
}

export default SalesChart
