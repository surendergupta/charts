"use client";

import { LineChart, Line, Tooltip, ResponsiveContainer } from 'recharts';

type BloodPressureChartProps = {
  data: any[];
};

const BloodPressureChart = ({ data }: BloodPressureChartProps) => {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <Line dataKey="systolic" stroke="#FF9500" />
        <Line dataKey="diastolic" stroke="#FF5E5E" />
        <Tooltip />
      </LineChart>
    </ResponsiveContainer>
  )
}

export default BloodPressureChart