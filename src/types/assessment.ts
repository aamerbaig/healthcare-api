// Patient data structure from API
export interface Patient {
  patient_id: string;
  name: string;
  age: number | string | null;
  gender: string;
  blood_pressure: string | null;
  temperature: number | string | null;
  visit_date: string;
  diagnosis: string;
  medications: string;
}

// API Response Types
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface Metadata {
  timestamp: string;
  version: string;
  requestId: string;
}

export interface PatientsResponse {
  data: Patient[];
  pagination: Pagination;
  metadata: Metadata;
}

// Risk Scoring Types
export interface RiskScore {
  bloodPressure: number;
  temperature: number;
  age: number;
  total: number;
}

export interface PatientWithRisk extends Patient {
  riskScore: RiskScore;
  isHighRisk: boolean;
  hasFever: boolean;
  hasDataQualityIssues: boolean;
}

export type RiskCategory = "Normal" | "Elevated" | "Stage 1" | "Stage 2" | "Invalid";

// Assessment Results
export interface AssessmentResults {
  high_risk_patients: string[];
  fever_patients: string[];
  data_quality_issues: string[];
}

// Submission Response
export interface SubmissionBreakdown {
  score: number;
  max: number;
  correct: number;
  submitted: number;
  matches: number;
}

export interface SubmissionResults {
  score: number;
  percentage: number;
  status: string;
  breakdown: {
    high_risk: SubmissionBreakdown;
    fever: SubmissionBreakdown;
    data_quality: SubmissionBreakdown;
  };
  feedback: {
    strengths: string[];
    issues: string[];
  };
  attempt_number: number;
  remaining_attempts: number;
  is_personal_best: boolean;
  can_resubmit: boolean;
}

export interface SubmissionResponse {
  success: boolean;
  message: string;
  results: SubmissionResults;
}

// Progress Tracking
export type ProgressStatus = 
  | "idle" 
  | "fetching" 
  | "analyzing" 
  | "submitting" 
  | "complete" 
  | "error";

export interface ProgressLog {
  timestamp: Date;
  message: string;
  type: "info" | "success" | "warning" | "error";
}

