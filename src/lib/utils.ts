/**
 * Sleep utility for retry delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 * @param attempt - Current attempt number (0-indexed)
 * @param baseDelay - Base delay in milliseconds (default: 1000ms)
 * @returns Delay in milliseconds
 */
export function getExponentialBackoff(attempt: number, baseDelay = 1000): number {
  return baseDelay * Math.pow(2, attempt);
}

/**
 * Format date/time for display
 */
export function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Check if error is retryable (429, 500, 503)
 */
export function isRetryableError(status: number): boolean {
  return status === 429 || status === 500 || status === 503;
}

