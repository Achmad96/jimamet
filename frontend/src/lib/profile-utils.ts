export interface ProfileData {
  fullName: string;
  email: string;
  username: string;
  age: string;
  weight: string;
  height: string;
  gender: "male" | "female";
  activityLevel: "sedentary" | "light" | "moderate" | "active" | "very_active";
  goal: "lose" | "maintain" | "gain";
}

export interface BmiInfo {
  value: number;
  label: "Underweight" | "Normal" | "Overweight" | "Obese";
  color: string;
  bmi: number;
  category: "Underweight" | "Normal" | "Overweight" | "Obese";
}

export function calculateBMI(weightKg: number, heightCm: number): BmiInfo | null {
  if (!weightKg || !heightCm || heightCm <= 0) return null;
  const heightM = heightCm / 100;
  const value = Math.round((weightKg / (heightM * heightM)) * 10) / 10;

  let label: "Underweight" | "Normal" | "Overweight" | "Obese";
  let color: string;

  if (value < 18.5) {
    label = "Underweight";
    color = "#2b6f77";
  } else if (value < 25) {
    label = "Normal";
    color = "#1b4332";
  } else if (value < 30) {
    label = "Overweight";
    color = "#d9822b";
  } else {
    label = "Obese";
    color = "#c85a32";
  }

  return {
    value,
    label,
    color,
    bmi: value,
    category: label,
  };
}

export function calculateBMR(
  weightKg: number,
  heightCm: number,
  ageYears: number,
  gender: "male" | "female"
): number | null {
  if (!weightKg || !heightCm || !ageYears) return null;
  // Mifflin-St Jeor Equation
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  return Math.round(gender === "male" ? base + 5 : base - 161);
}

export function calculateTDEE(
  bmr: number,
  activityLevel: ProfileData["activityLevel"],
  goal: ProfileData["goal"]
): number {
  const multipliers: Record<ProfileData["activityLevel"], number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };

  const maintenance = Math.round(bmr * (multipliers[activityLevel] || 1.2));

  if (goal === "lose") return Math.round(maintenance - 500);
  if (goal === "gain") return Math.round(maintenance + 500);
  return maintenance;
}
