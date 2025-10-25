import type { Patient, PatientWithRisk, RiskScore, RiskCategory } from "@/types/assessment";

/**
 * Parse and score blood pressure reading
 * Format: "systolic/diastolic" (e.g., "120/80")
 * 
 * Scoring Rules:
 * - Normal (Systolic <120 AND Diastolic <80): 1 point
 * - Elevated (Systolic 120-129 AND Diastolic <80): 2 points
 * - Stage 1 (Systolic 130-139 OR Diastolic 80-89): 3 points
 * - Stage 2 (Systolic ≥140 OR Diastolic ≥90): 4 points
 * - Invalid/Missing: 0 points
 * 
 * If readings fall into different categories, use higher risk stage
 */
export function scoreBloodPressure(bp: string | null | undefined): { score: number; isValid: boolean; category: RiskCategory } {
  // Handle null, undefined, or empty values
  if (!bp || bp.trim() === "") {
    return { score: 0, isValid: false, category: "Invalid" };
  }

  // Parse the blood pressure reading
  const parts = bp.split("/");
  if (parts.length !== 2) {
    return { score: 0, isValid: false, category: "Invalid" };
  }

  const systolicStr = parts[0].trim();
  const diastolicStr = parts[1].trim();

  // Check for missing values (e.g., "150/" or "/90")
  if (systolicStr === "" || diastolicStr === "") {
    return { score: 0, isValid: false, category: "Invalid" };
  }

  // Parse to numbers
  const systolic = Number(systolicStr);
  const diastolic = Number(diastolicStr);

  // Check if parsing resulted in valid numbers
  if (isNaN(systolic) || isNaN(diastolic)) {
    return { score: 0, isValid: false, category: "Invalid" };
  }

  // Determine risk category for systolic
  let systolicScore = 0;
  if (systolic >= 140) {
    systolicScore = 4; // Stage 2
  } else if (systolic >= 130) {
    systolicScore = 3; // Stage 1
  } else if (systolic >= 120) {
    systolicScore = 2; // Elevated (only if diastolic < 80)
  } else {
    systolicScore = 1; // Normal (only if diastolic < 80)
  }

  // Determine risk category for diastolic
  let diastolicScore = 0;
  if (diastolic >= 90) {
    diastolicScore = 4; // Stage 2
  } else if (diastolic >= 80) {
    diastolicScore = 3; // Stage 1
  } else {
    // Diastolic < 80
    if (systolic >= 120 && systolic < 130) {
      diastolicScore = 2; // Elevated
    } else if (systolic < 120) {
      diastolicScore = 1; // Normal
    }
  }

  // Use the higher risk score
  const finalScore = Math.max(systolicScore, diastolicScore);
  
  let category: RiskCategory;
  if (finalScore === 4) category = "Stage 2";
  else if (finalScore === 3) category = "Stage 1";
  else if (finalScore === 2) category = "Elevated";
  else category = "Normal";

  return { score: finalScore, isValid: true, category };
}

/**
 * Score temperature reading
 * 
 * Scoring Rules:
 * - Normal (≤99.5°F): 0 points
 * - Low Fever (99.6-100.9°F): 1 point
 * - High Fever (≥101.0°F): 2 points
 * - Invalid/Missing: 0 points
 */
export function scoreTemperature(temp: number | string | null | undefined): { score: number; isValid: boolean } {
  // Handle null or undefined
  if (temp === null || temp === undefined) {
    return { score: 0, isValid: false };
  }

  // Convert to number if string
  const temperature = typeof temp === "string" ? Number(temp) : temp;

  // Check if valid number
  if (isNaN(temperature)) {
    return { score: 0, isValid: false };
  }

  // Score based on temperature ranges
  if (temperature >= 101.0) {
    return { score: 2, isValid: true };
  } else if (temperature >= 99.6) {
    return { score: 1, isValid: true };
  } else {
    return { score: 0, isValid: true };
  }
}

/**
 * Score age
 * 
 * Scoring Rules:
 * - Under 40 (<40 years): 1 point
 * - 40-65 (40-65 years, inclusive): 1 point
 * - Over 65 (>65 years): 2 points
 * - Invalid/Missing: 0 points
 */
export function scoreAge(age: number | string | null | undefined): { score: number; isValid: boolean } {
  // Handle null or undefined
  if (age === null || age === undefined) {
    return { score: 0, isValid: false };
  }

  // Convert to number if string
  const ageNum = typeof age === "string" ? Number(age) : age;

  // Check if valid number
  if (isNaN(ageNum)) {
    return { score: 0, isValid: false };
  }

  // Score based on age ranges
  if (ageNum > 65) {
    return { score: 2, isValid: true };
  } else if (ageNum >= 40) {
    return { score: 1, isValid: true };
  } else {
    return { score: 1, isValid: true };
  }
}

/**
 * Calculate total risk score for a patient
 * Returns patient with risk assessment details
 */
export function assessPatientRisk(patient: Patient): PatientWithRisk {
  const bpResult = scoreBloodPressure(patient.blood_pressure);
  const tempResult = scoreTemperature(patient.temperature);
  const ageResult = scoreAge(patient.age);

  const riskScore: RiskScore = {
    bloodPressure: bpResult.score,
    temperature: tempResult.score,
    age: ageResult.score,
    total: bpResult.score + tempResult.score + ageResult.score,
  };

  // Determine if patient has data quality issues
  const hasDataQualityIssues = !bpResult.isValid || !tempResult.isValid || !ageResult.isValid;

  // Determine if patient is high risk (total >= 4)
  const isHighRisk = riskScore.total >= 4;

  // Determine if patient has fever (temp >= 99.6)
  const hasFever = tempResult.isValid && patient.temperature !== null && patient.temperature !== undefined && 
                   Number(patient.temperature) >= 99.6;

  return {
    ...patient,
    riskScore,
    isHighRisk,
    hasFever,
    hasDataQualityIssues,
  };
}

/**
 * Categorize patients based on assessment criteria
 */
export function categorizePatients(patients: PatientWithRisk[]): {
  high_risk_patients: string[];
  fever_patients: string[];
  data_quality_issues: string[];
} {
  const highRiskPatients: string[] = [];
  const feverPatients: string[] = [];
  const dataQualityIssues: string[] = [];

  for (const patient of patients) {
    if (patient.isHighRisk) {
      highRiskPatients.push(patient.patient_id);
    }
    if (patient.hasFever) {
      feverPatients.push(patient.patient_id);
    }
    if (patient.hasDataQualityIssues) {
      dataQualityIssues.push(patient.patient_id);
    }
  }

  return {
    high_risk_patients: highRiskPatients,
    fever_patients: feverPatients,
    data_quality_issues: dataQualityIssues,
  };
}

