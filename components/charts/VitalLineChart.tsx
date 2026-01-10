"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion } from "motion/react";

type VitalLineChartProps = {
  data: any[];
  dataKey: string;
  color: string;
  unit?: string;
};

export default function VitalLineChart({
  data,
  dataKey,
  color,
  unit,
}: VitalLineChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
    >
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <XAxis dataKey="date" hide />
          <YAxis />
          <Tooltip
            formatter={(value) => {
    if (value === undefined) return ["", ""];
    return [`${value} ${unit ?? ""}`, ""];
  }}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2.5}
            dot={false}
            animationDuration={1200}
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
