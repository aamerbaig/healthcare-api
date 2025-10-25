"use client";

import { useState } from "react";
import type {
  Patient,
  PatientWithRisk,
  ProgressStatus,
  ProgressLog,
  SubmissionResponse,
} from "@/types/assessment";
import { assessPatientRisk, categorizePatients } from "@/lib/risk-scoring";
import { formatTimestamp } from "@/lib/utils";

export default function Home() {
  const [status, setStatus] = useState<ProgressStatus>("idle");
  const [patients, setPatients] = useState<PatientWithRisk[]>([]);
  const [progressLogs, setProgressLogs] = useState<ProgressLog[]>([]);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addLog = (message: string, type: ProgressLog["type"] = "info") => {
    setProgressLogs((prev) => [
      ...prev,
      { timestamp: new Date(), message, type },
    ]);
  };

  const resetAssessment = () => {
    setStatus("idle");
    setPatients([]);
    setProgressLogs([]);
    setSubmissionResult(null);
    setError(null);
  };

  const startAssessment = async () => {
    resetAssessment();
    setStatus("fetching");
    addLog("Starting healthcare risk assessment...", "info");

    try {
      // Fetch patients from server-side API
      addLog("Connecting to DemoMed Healthcare API...", "info");
      const response = await fetch("/api/fetch-patients");
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch patients");
      }

      const data = await response.json();
      const fetchedPatients: Patient[] = data.patients;
      
      addLog(`Successfully fetched ${fetchedPatients.length} patients`, "success");

      // Analyze risk scores
      setStatus("analyzing");
      addLog("Analyzing patient risk scores...", "info");
      
      const patientsWithRisk = fetchedPatients.map(assessPatientRisk);
      setPatients(patientsWithRisk);
      
      addLog("Risk analysis complete", "success");

      // Categorize patients
      const categorized = categorizePatients(patientsWithRisk);
      addLog(`Identified ${categorized.high_risk_patients.length} high-risk patients`, "info");
      addLog(`Identified ${categorized.fever_patients.length} patients with fever`, "info");
      addLog(`Identified ${categorized.data_quality_issues.length} data quality issues`, "warning");

      // Submit assessment
      setStatus("submitting");
      addLog("Submitting assessment results...", "info");
      
      const submitResponse = await fetch("/api/submit-assessment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(categorized),
      });

      if (!submitResponse.ok) {
        const errorData = await submitResponse.json();
        throw new Error(errorData.message || "Failed to submit assessment");
      }

      const submissionData: SubmissionResponse = await submitResponse.json();
      setSubmissionResult(submissionData);
      
      addLog("Assessment submitted successfully!", "success");
      addLog(
        `Score: ${submissionData.results.score.toFixed(2)}/${submissionData.results.breakdown.high_risk.max + submissionData.results.breakdown.fever.max + submissionData.results.breakdown.data_quality.max} (${submissionData.results.percentage}%)`,
        "success"
      );
      
      setStatus("complete");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      addLog(`Error: ${errorMessage}`, "error");
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Healthcare Risk Assessment Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            DemoMed Healthcare API - Automated Patient Risk Scoring System
          </p>
          
          <div className="flex gap-4">
            <button
              onClick={startAssessment}
              disabled={status === "fetching" || status === "analyzing" || status === "submitting"}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                status === "fetching" || status === "analyzing" || status === "submitting"
                  ? "bg-gray-300 dark:bg-gray-600 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg"
              }`}
            >
              {status === "fetching" || status === "analyzing" || status === "submitting"
                ? "Processing..."
                : status === "complete"
                ? "Run New Assessment"
                : "Start Assessment"}
            </button>
            
            {(status === "complete" || status === "error") && (
              <button
                onClick={resetAssessment}
                className="px-6 py-3 rounded-lg font-medium bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white transition-all"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Progress Panel */}
        {progressLogs.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="mr-2">📊</span> Progress Log
            </h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {progressLogs.map((log, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 text-sm p-2 rounded ${
                    log.type === "error"
                      ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                      : log.type === "success"
                      ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                      : log.type === "warning"
                      ? "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300"
                      : "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                  }`}
                >
                  <span className="font-mono text-xs opacity-75 whitespace-nowrap">
                    {formatTimestamp(log.timestamp)}
                  </span>
                  <span>{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && status === "error" && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2 flex items-center">
              <span className="mr-2">❌</span> Error
            </h2>
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Patient Data Table */}
        {patients.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="mr-2">👥</span> Patient Data ({patients.length} patients)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-2 font-semibold text-gray-900 dark:text-white">ID</th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-900 dark:text-white">Name</th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-900 dark:text-white">Age</th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-900 dark:text-white">BP</th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-900 dark:text-white">Temp</th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-900 dark:text-white">Risk Score</th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-900 dark:text-white">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((patient) => (
                    <tr
                      key={patient.patient_id}
                      className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="py-3 px-2 font-mono text-xs text-gray-800 dark:text-gray-200">
                        {patient.patient_id}
                      </td>
                      <td className="py-3 px-2 text-gray-800 dark:text-gray-200">{patient.name}</td>
                      <td className="py-3 px-2 text-gray-800 dark:text-gray-200">{patient.age ?? "N/A"}</td>
                      <td className="py-3 px-2 text-gray-800 dark:text-gray-200">
                        {patient.blood_pressure || "N/A"}
                      </td>
                      <td className="py-3 px-2 text-gray-800 dark:text-gray-200">
                        {patient.temperature ?? "N/A"}
                      </td>
                      <td className="py-3 px-2">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                            patient.riskScore.total >= 5
                              ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                              : patient.riskScore.total >= 4
                              ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                              : patient.riskScore.total >= 2
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                              : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                          }`}
                        >
                          {patient.riskScore.total} pts
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex gap-1 flex-wrap">
                          {patient.isHighRisk && (
                            <span className="inline-block px-2 py-0.5 rounded text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                              High Risk
                            </span>
                          )}
                          {patient.hasFever && (
                            <span className="inline-block px-2 py-0.5 rounded text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                              Fever
                            </span>
                          )}
                          {patient.hasDataQualityIssues && (
                            <span className="inline-block px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                              Data Issue
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Results Dashboard */}
        {submissionResult && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="mr-2">🎯</span> Assessment Results
            </h2>
            
            {/* Score Overview */}
            <div className="mb-6 p-4 rounded-lg bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-semibold text-gray-900 dark:text-white">Overall Score</span>
                <span
                  className={`text-3xl font-bold ${
                    submissionResult.results.percentage >= 90
                      ? "text-green-600 dark:text-green-400"
                      : submissionResult.results.percentage >= 70
                      ? "text-yellow-600 dark:text-yellow-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {submissionResult.results.percentage}%
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {submissionResult.results.score.toFixed(2)} out of{" "}
                {submissionResult.results.breakdown.high_risk.max +
                  submissionResult.results.breakdown.fever.max +
                  submissionResult.results.breakdown.data_quality.max}{" "}
                points
              </div>
              <div className="mt-2">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                    submissionResult.results.status === "PASS"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                      : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                  }`}
                >
                  {submissionResult.results.status}
                </span>
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">High-Risk Patients</h3>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                  {submissionResult.results.breakdown.high_risk.score}/
                  {submissionResult.results.breakdown.high_risk.max}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {submissionResult.results.breakdown.high_risk.matches} correct,{" "}
                  {submissionResult.results.breakdown.high_risk.submitted} submitted
                </div>
              </div>

              <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Fever Patients</h3>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                  {submissionResult.results.breakdown.fever.score}/
                  {submissionResult.results.breakdown.fever.max}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {submissionResult.results.breakdown.fever.matches} correct,{" "}
                  {submissionResult.results.breakdown.fever.submitted} submitted
                </div>
              </div>

              <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Data Quality Issues</h3>
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">
                  {submissionResult.results.breakdown.data_quality.score}/
                  {submissionResult.results.breakdown.data_quality.max}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {submissionResult.results.breakdown.data_quality.matches} correct,{" "}
                  {submissionResult.results.breakdown.data_quality.submitted} submitted
                </div>
              </div>
            </div>

            {/* Feedback */}
            <div className="space-y-4">
              {submissionResult.results.feedback.strengths.length > 0 && (
                <div>
                  <h3 className="font-semibold text-green-800 dark:text-green-300 mb-2">Strengths</h3>
                  <ul className="space-y-1">
                    {submissionResult.results.feedback.strengths.map((strength, idx) => (
                      <li key={idx} className="text-sm text-gray-700 dark:text-gray-300">
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {submissionResult.results.feedback.issues.length > 0 && (
                <div>
                  <h3 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
                    Areas for Improvement
                  </h3>
                  <ul className="space-y-1">
                    {submissionResult.results.feedback.issues.map((issue, idx) => (
                      <li key={idx} className="text-sm text-gray-700 dark:text-gray-300">
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Attempt Info */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex justify-between">
                <span>Attempt: {submissionResult.results.attempt_number}</span>
                <span>Remaining: {submissionResult.results.remaining_attempts}</span>
              </div>
            </div>
          </div>
        )}

        {/* Info Footer */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-sm text-gray-600 dark:text-gray-400">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">About This Assessment</h3>
          <p className="mb-2">
            This dashboard evaluates patient risk scores based on blood pressure, temperature, and age data
            from the DemoMed Healthcare API.
          </p>
          <p>
            <strong>Risk Criteria:</strong> High-Risk (≥4 pts), Fever (≥99.6°F), Data Quality Issues (invalid/missing data)
          </p>
        </div>
      </div>
    </div>
  );
}
