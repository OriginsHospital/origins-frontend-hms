import dayjs from 'dayjs'
import InfoItem from './InfoItem'

const VitalsInformation = ({ vitals }) => {
  return (
    <div className="rounded-xl border border-[#b7e8e4] bg-white p-4">
      <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[#5e8a88]">
        Vitals
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 md:grid-cols-3 lg:grid-cols-4">
        <InfoItem label="Blood Pressure" value={vitals?.bp || '-'} />
        <InfoItem label="BMI" value={vitals?.bmi || '-'} />
        <InfoItem label="Height" value={vitals?.height || '-'} />
        <InfoItem
          label="Weight"
          value={vitals?.weight ? `${vitals?.weight} kg` : '-'}
        />
        <InfoItem label="Initials" value={vitals?.initials || '-'} />
        <InfoItem
          label="Taken On"
          value={
            vitals?.vitalsTakenTime
              ? `${dayjs(vitals?.vitalsTakenTime).format('DD-MM-YYYY')}`
              : '-'
          }
        />
        <div className="col-span-2">
          <InfoItem label="Notes" value={vitals?.notes || '-'} />
        </div>
      </div>
    </div>
  )
}

export default VitalsInformation
