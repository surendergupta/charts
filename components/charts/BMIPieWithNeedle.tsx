"use client";

import { Pie, PieChart, Cell, Tooltip } from "recharts";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useState } from "react";

// --- BMI Ranges and Colors ---
const BMI_RANGES = [
  { name: "Underweight", value: 18.5, color: "#60a5fa" },
  { name: "Healthy Weight", value: 6.5, color: "#22c55e" }, // 18.5–25
  { name: "Overweight", value: 5, color: "#facc15" },      // 25–30
  { name: "Class 1 Obesity", value: 5, color: "#fb923c" }, // 30–35
  { name: "Class 2 Obesity", value: 5, color: "#f97316" }, // 35–40
  { name: "Class 3 Obesity", value: 10, color: "#ef4444" },// 40+
];

// Sample trend data for 30 days
const bmiTrendData = Array.from({ length: 30 }, (_, i) => ({
  day: (i + 1).toString(),
  bmi: 20 + Math.sin(i / 5) * 2, // example oscillation for trend
}));

// --- Helpers ---
function getBMICategory(bmi: number) {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Healthy Weight";
  if (bmi < 30) return "Overweight";
  if (bmi < 35) return "Class 1 Obesity";
  if (bmi < 40) return "Class 2 Obesity";
  return "Class 3 Obesity";
}

function getBMIColor(bmi: number) {
  if (bmi < 18.5) return "#60a5fa";
  if (bmi < 25) return "#22c55e";
  if (bmi < 30) return "#facc15";
  if (bmi < 35) return "#fb923c";
  if (bmi < 40) return "#f97316";
  return "#ef4444";
}

function getBMIRange(name: string) {
  switch (name) {
    case "Underweight": return "< 18.5";
    case "Healthy Weight": return "18.5 – 24.9";
    case "Overweight": return "25 – 29.9";
    case "Class 1 Obesity": return "30 – 34.9";
    case "Class 2 Obesity": return "35 – 39.9";
    case "Class 3 Obesity": return "≥ 40";
    default: return "";
  }
}

type Props = {
  bmi: number;
  trendData?: { day: string; bmi: number }[];
};

export default function BMIPieWithNeedle({ bmi, trendData = bmiTrendData }: Props) {
  const cx = 150;
  const cy = 150;
  const radius = 110;
  const innerRadius = 70;

  const clampedBMI = Math.min(Math.max(bmi, 0), 50);

  const animatedBMI = useMotionValue(0);
  const [displayBMI, setDisplayBMI] = useState(0);

  // Animate needle with spring physics
  useEffect(() => {
    const controls = animate(animatedBMI, clampedBMI, {
      type: "spring",
      stiffness: 200,
      damping: 12,
      mass: 1,
    });
    const unsubscribe = animatedBMI.onChange((v) => setDisplayBMI(v));
    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [clampedBMI]);

  const needleLength = 90;

  // Needle angle
  const angle = useTransform(animatedBMI, (v) => 180 - (v / 50) * 180);
  const x = useTransform(angle, (a) => cx + needleLength * Math.cos(-Math.PI / 180 * a));
  const y = useTransform(angle, (a) => cy + needleLength * Math.sin(-Math.PI / 180 * a));

  // Needle color
  const needleColor = getBMIColor(clampedBMI);

  // Pulse for high BMI
  const needlePulse = clampedBMI >= 30
    ? { scale: [1, 1.08, 1], rotate: [0, 2, 0] }
    : {};

  // Shimmer rotation along needle
  const shimmerRotate = useTransform(angle, (a) => a - 90);

  return (
    <div className="relative flex justify-center items-center w-full max-w-sm mx-auto">
      {/* Shimmer following needle */}
      <motion.div
        className="absolute w-[250px] h-[250px] rounded-full pointer-events-none overflow-hidden"
        style={{ rotate: shimmerRotate }}
      >
        <motion.div
          className="w-[200%] h-full bg-white/10 absolute top-0 left-[-100%] blur-2xl"
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
        />
      </motion.div>

      <PieChart width={300} height={200}>
        {/* Main BMI segments */}
        <Pie
          dataKey="value"
          startAngle={180}
          endAngle={0}
          data={BMI_RANGES}
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={radius}
          paddingAngle={1}
          stroke="none"
          isAnimationActive={false}
        >
          {BMI_RANGES.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>

        {/* Trend highlight along Pie */}
        <Pie
          dataKey="bmi"
          startAngle={180}
          endAngle={0}
          data={trendData}
          cx={cx}
          cy={cy}
          innerRadius={innerRadius + 5}
          outerRadius={radius + 5}
          stroke="none"
          fill="rgba(255,255,255,0.3)"
          isAnimationActive={true}
        />

        {/* Tooltip */}
        <Tooltip content={<BMIGaugeTooltip />} />

        {/* Needle */}
        <motion.g animate={needlePulse}>
          <motion.line
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke={needleColor}
            strokeWidth={4}
            strokeLinecap="round"
          />
          <circle cx={cx} cy={cy} r={6} fill={needleColor} />
        </motion.g>

        {/* Center BMI number */}
        <text
          x={cx}
          y={cy + 40}
          textAnchor="middle"
          className={`font-bold text-lg ${clampedBMI >= 30 ? "text-red-500" : "text-white"}`}
        >
          {displayBMI.toFixed(1)}
        </text>

        {/* BMI Category */}
        <text
          x={cx}
          y={cy + 60}
          textAnchor="middle"
          className="text-white/80 text-sm"
        >
          {getBMICategory(clampedBMI)}
        </text>
      </PieChart>
    </div>
  );
}

// Tooltip Component
const BMIGaugeTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;

  const { name, color } = payload[0].payload;

  return (
    <div className="rounded-lg bg-black/80 px-3 py-2 text-sm text-white backdrop-blur">
      <div className="font-semibold" style={{ color }}>
        {name}
      </div>
      <div className="text-white/80">
        BMI Range: {getBMIRange(name)}
      </div>
    </div>
  );
};
