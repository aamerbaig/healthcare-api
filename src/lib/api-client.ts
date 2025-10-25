import type { Patient, PatientsResponse, SubmissionResponse, AssessmentResults } from "@/types/assessment";
import { sleep, getExponentialBackoff, isRetryableError } from "./utils";

const MAX_RETRIES = 5;
const BASE_DELAY = 1000; // 1 second
const RATE_LIMIT_DELAY = 500; // Delay between successful requests to avoid rate limiting

export interface FetchProgress {
  page: number;
  totalPages: number;
  patientsCount: number;
  message: string;
  type: "info" | "success" | "warning" | "error";
}

/**
 * Fetch a single page of patients with retry logic
 */
async function fetchPatientsPage(
  apiKey: string,
  baseUrl: string,
  page: number,
  limit = 5
): Promise<PatientsResponse> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const url = `${baseUrl}/patients?page=${page}&limit=${limit}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "x-api-key": apiKey,
        },
      });

      // Check for retryable errors
      if (isRetryableError(response.status)) {
        // Use longer delay for rate limit errors (429)
        const baseDelayForRetry = response.status === 429 ? BASE_DELAY * 2 : BASE_DELAY;
        const delay = getExponentialBackoff(attempt, baseDelayForRetry);
        console.log(
          `Retryable error ${response.status} on page ${page}, attempt ${attempt + 1}/${MAX_RETRIES}. Retrying in ${delay}ms...`
        );
        await sleep(delay);
        continue;
      }

      // If not retryable and not successful, throw error
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: PatientsResponse = await response.json();
      
      // Validate response structure (API can return inconsistent data)
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format: response is not an object');
      }
      
      if (!Array.isArray(data.data)) {
        console.warn(`Invalid data format on page ${page}:`, data);
        // Return empty data array if format is wrong, but keep pagination info
        return {
          data: [],
          pagination: data.pagination || {
            page,
            limit,
            total: 0,
            totalPages: 1,
            hasNext: false,
            hasPrevious: false
          },
          metadata: data.metadata || {
            timestamp: new Date().toISOString(),
            version: 'v1.0',
            requestId: 'unknown'
          }
        };
      }
      
      return data;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // If this is the last attempt, throw the error
      if (attempt === MAX_RETRIES - 1) {
        break;
      }

      // Otherwise, retry with exponential backoff
      const delay = getExponentialBackoff(attempt, BASE_DELAY);
      console.log(
        `Error fetching page ${page}, attempt ${attempt + 1}/${MAX_RETRIES}. Retrying in ${delay}ms...`
      );
      await sleep(delay);
    }
  }

  throw lastError || new Error(`Failed to fetch page ${page} after ${MAX_RETRIES} attempts`);
}

/**
 * Fetch all patients with pagination and progress tracking
 */
export async function fetchAllPatients(
  apiKey: string,
  baseUrl: string,
  onProgress?: (progress: FetchProgress) => void
): Promise<Patient[]> {
  const allPatients: Patient[] = [];
  let currentPage = 1;
  let totalPages = 1;

  try {
    // Fetch first page to get total pages
    onProgress?.({
      page: currentPage,
      totalPages: 1,
      patientsCount: 0,
      message: "Starting to fetch patient data...",
      type: "info",
    });

    const firstPageData = await fetchPatientsPage(apiKey, baseUrl, currentPage);
    
    // Safely add patients (API can return inconsistent data)
    if (Array.isArray(firstPageData.data) && firstPageData.data.length > 0) {
      allPatients.push(...firstPageData.data);
    }
    
    totalPages = firstPageData.pagination?.totalPages || 1;

    const firstPageCount = Array.isArray(firstPageData.data) ? firstPageData.data.length : 0;
    onProgress?.({
      page: currentPage,
      totalPages,
      patientsCount: allPatients.length,
      message: `Fetched page ${currentPage} of ${totalPages} (${firstPageCount} patients)`,
      type: "success",
    });

    // Fetch remaining pages
    for (currentPage = 2; currentPage <= totalPages; currentPage++) {
      // Add delay before fetching next page to avoid rate limiting
      await sleep(RATE_LIMIT_DELAY);
      
      onProgress?.({
        page: currentPage,
        totalPages,
        patientsCount: allPatients.length,
        message: `Fetching page ${currentPage} of ${totalPages}...`,
        type: "info",
      });

      const pageData = await fetchPatientsPage(apiKey, baseUrl, currentPage);
      
      // Safely add patients (API can return inconsistent data)
      const patientsInPage = Array.isArray(pageData.data) ? pageData.data.length : 0;
      if (Array.isArray(pageData.data) && pageData.data.length > 0) {
        allPatients.push(...pageData.data);
      }

      onProgress?.({
        page: currentPage,
        totalPages,
        patientsCount: allPatients.length,
        message: `Fetched page ${currentPage} of ${totalPages} (${patientsInPage} patients)`,
        type: "success",
      });
    }

    onProgress?.({
      page: totalPages,
      totalPages,
      patientsCount: allPatients.length,
      message: `Successfully fetched all ${allPatients.length} patients!`,
      type: "success",
    });

    return allPatients;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    onProgress?.({
      page: currentPage,
      totalPages,
      patientsCount: allPatients.length,
      message: `Error: ${errorMessage}`,
      type: "error",
    });
    throw error;
  }
}

/**
 * Submit assessment results with retry logic
 */
export async function submitAssessment(
  apiKey: string,
  baseUrl: string,
  results: AssessmentResults
): Promise<SubmissionResponse> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const url = `${baseUrl}/submit-assessment`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify(results),
      });

      // Check for retryable errors
      if (isRetryableError(response.status)) {
        // Use longer delay for rate limit errors (429)
        const baseDelayForRetry = response.status === 429 ? BASE_DELAY * 2 : BASE_DELAY;
        const delay = getExponentialBackoff(attempt, baseDelayForRetry);
        console.log(
          `Retryable error ${response.status} on submission, attempt ${attempt + 1}/${MAX_RETRIES}. Retrying in ${delay}ms...`
        );
        await sleep(delay);
        continue;
      }

      // If not retryable and not successful, throw error
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data: SubmissionResponse = await response.json();
      return data;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // If this is the last attempt, throw the error
      if (attempt === MAX_RETRIES - 1) {
        break;
      }

      // Otherwise, retry with exponential backoff
      const delay = getExponentialBackoff(attempt, BASE_DELAY);
      console.log(
        `Error submitting assessment, attempt ${attempt + 1}/${MAX_RETRIES}. Retrying in ${delay}ms...`
      );
      await sleep(delay);
    }
  }

  throw lastError || new Error(`Failed to submit assessment after ${MAX_RETRIES} attempts`);
}

