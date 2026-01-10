import GlassCard from "@/components/ui/GlassCard";
// import HeartRateChart from "@/components/HeartRateChart";
// import BloodPressureChart from "@/components/BloodPressureChart";
import VitalLineChart from "@/components/charts/VitalLineChart";
import BloodPressureChart from "@/components/charts/BloodPressureChart";
import BMIPieWithNeedle from "@/components/charts/BMIPieWithNeedle";
import { getBMICategory } from "@/utils/bmi";
import {
  heartRateData,
  bloodPressureData,
  weightData,
  spo2Data,
  temperatureData,
  pulseRateData,
  bmiData,
  heightData,
} from "@/data/vitals-data";
import Card from "@/components/Card";


// import { Style } from '@/components/Styles/glass.module.css'

// const heartRateData = [
//   { time: "08:00", heartRate: 72 },
//   { time: "12:00", heartRate: 78 },
//   { time: "16:00", heartRate: 70 },
//   { time: "20:00", heartRate: 74 },
// ];
// const bloodPressureData = [
//   { time: "08:00", systolic: 120, diastolic: 80 },
//   { time: "12:00", systolic: 125, diastolic: 82 },
//   { time: "16:00", systolic: 118, diastolic: 78 },
//   { time: "20:00", systolic: 122, diastolic: 79 },
// ];

export default function Home() {
  const sampleBMI = 32.4;
  return (
    <div className="mx-auto max-w-7xl bg-gray-200 min-h-screen">
      <h1 className="text-4xl font-bold text-center py-3">Welcome to the Home Page</h1>
      <p className="text-center text-lg">This is a sample Next.js application.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        <Card title="BMI">
  <BMIPieWithNeedle bmi={sampleBMI} />
  <p className="mt-3 text-center text-sm text-black/80">
    BMI: <strong>{sampleBMI}</strong> — {getBMICategory(sampleBMI)}
  </p>
</Card>
        <Card title="Heart Rate" className="hover:shadow-[0_0_40px_rgba(255,77,79,0.25)]">
  <VitalLineChart
    data={heartRateData}
    dataKey="value"
    color="#ff4d4f"
    unit="bpm"
  />
</Card>
      <GlassCard title="Heart Rate">
        <VitalLineChart data={heartRateData} dataKey="value" color="#ff4d4f" unit="bpm" />
      </GlassCard>

      <GlassCard title="Blood Pressure">
        <BloodPressureChart data={bloodPressureData} />
      </GlassCard>

      <GlassCard title="Weight">
        <VitalLineChart data={weightData} dataKey="value" color="#00d8ff" unit="kg" />
      </GlassCard>

      <GlassCard title="SpO₂">
        <VitalLineChart data={spo2Data} dataKey="value" color="#00ffa2" unit="%" />
      </GlassCard>

      <GlassCard title="Temperature">
        <VitalLineChart data={temperatureData} dataKey="value" color="#ff6b6b" unit="°F" />
      </GlassCard>

      <GlassCard title="Pulse Rate">
        <VitalLineChart data={pulseRateData} dataKey="value" color="#c77dff" unit="bpm" />
      </GlassCard>

      <GlassCard title="BMI">
        <VitalLineChart data={bmiData} dataKey="value" color="#ffd166" />
      </GlassCard>

      <GlassCard title="Height">
        <VitalLineChart data={heightData} dataKey="value" color="#4dabf7" unit="cm" />
      </GlassCard>
    </div>
    </div>
  )
}