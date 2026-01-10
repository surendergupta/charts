export function getBMICategory(bmi: number) {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Healthy Weight";
  if (bmi < 30) return "Overweight";
  if (bmi < 35) return "Class 1 Obesity";
  if (bmi < 40) return "Class 2 Obesity";
  return "Class 3 Obesity (Severe)";
}
