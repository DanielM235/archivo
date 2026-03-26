/**
 * Cash flow utilities
 */

/**
 * Generate a random number from normal distribution using Box-Muller transform
 * @param mean - Mean of the distribution
 * @param stdDev - Standard deviation
 * @returns Random number from N(mean, stdDev^2)
 */
function randomNormal(mean: number, stdDev: number): number {
  // Box-Muller transform
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return z0 * stdDev + mean;
}

/**
 * Generate n fractions that sum to K using normal distribution
 * @param K - Total value to split
 * @param n - Number of fractions
 * @param stdDevPercent - Standard deviation as percentage of the mean (K/n)
 * @returns Array of n positive numbers that sum to K
 */
export function generateFractions(K: number, n: number, stdDevPercent: number): number[] {
  if (n <= 0 || K < 0 || stdDevPercent < 0) {
    throw new Error('Invalid parameters: n must be positive, K and stdDevPercent non-negative');
  }

  const mean = K / n;
  const stdDev = mean * (stdDevPercent / 100);

  // Generate n values from normal distribution
  const raw = Array.from({ length: n }, () => randomNormal(mean, stdDev));

  // Ensure non-negative values (take absolute value to avoid negative cash flows)
  const positive = raw.map((v) => Math.abs(v));

  // Normalize to sum to K
  const sum = positive.reduce((a, b) => a + b, 0);
  if (sum === 0) {
    // If all were zero (unlikely), return equal fractions
    return Array(n).fill(K / n);
  }
  const scale = K / sum;

  return positive.map((v) => v * scale);
}
