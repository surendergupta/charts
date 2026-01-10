import { AreaChart, Area, ResponsiveContainer } from 'recharts';

const WeightChart = ({ data }: { data: any[] }) => {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data}>
        <Area
          type="monotone"
          dataKey="weight"
          stroke="#00D8FF"
          fill="rgba(0,216,255,0.3)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export default WeightChart