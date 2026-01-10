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

export default function BloodPressureChart({ data }: { data: any[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.15 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data}>
        <XAxis dataKey="date" hide />
        <YAxis />
        <Tooltip />
        <Line
          dataKey="systolic"
          stroke="#FF8C00"
          strokeWidth={2}
        />
        <Line
          dataKey="diastolic"
          stroke="#FF4D4F"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
    </motion.div>
  );
}
