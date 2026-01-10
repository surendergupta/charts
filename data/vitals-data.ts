import { DAYS } from "./vitals-month";

/* HEART RATE */
export const heartRateData = DAYS.map((date) => ({
  date,
  value: 65 + Math.floor(Math.random() * 15), // 65–80 bpm
}));

/* BLOOD PRESSURE */
export const bloodPressureData = DAYS.map((date) => ({
  date,
  systolic: 115 + Math.floor(Math.random() * 10),  // 115–125
  diastolic: 75 + Math.floor(Math.random() * 8),   // 75–83
}));

/* WEIGHT (kg) */
export const weightData = DAYS.map((date, i) => ({
  date,
  value: 72 + i * 0.02 + Math.random() * 0.2,
}));

/* SPO2 */
export const spo2Data = DAYS.map((date) => ({
  date,
  value: 96 + Math.random() * 3, // 96–99%
}));

/* BODY TEMPERATURE (°F) */
export const temperatureData = DAYS.map((date) => ({
  date,
  value: 97.5 + Math.random() * 1.5,
}));

/* PULSE RATE */
export const pulseRateData = DAYS.map((date) => ({
  date,
  value: 70 + Math.floor(Math.random() * 10),
}));

/* BMI */
export const bmiData = DAYS.map((date) => ({
  date,
  value: 22 + Math.random() * 0.6,
}));

/* HEIGHT (constant, still charted) */
export const heightData = DAYS.map((date) => ({
  date,
  value: 170, // cm
}));
