import { describe, it, expect } from 'vitest';
import { generateFractions } from './cashFlow.utils';

describe('generateFractions', () => {
  it('should generate n fractions that sum to K', () => {
    const K = 100;
    const n = 5;
    const stdDevPercent = 50; // 50% of mean (20)

    const result = generateFractions(K, n, stdDevPercent);

    expect(result).toHaveLength(n);
    const sum = result.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(K, 5); // Allow small floating point errors
  });

  it('should throw error for invalid parameters', () => {
    expect(() => generateFractions(-1, 5, 10)).toThrow();
    expect(() => generateFractions(100, 0, 10)).toThrow();
    expect(() => generateFractions(100, 5, -1)).toThrow();
  });

  it('should return equal fractions when stdDevPercent is 0', () => {
    const K = 100;
    const n = 4;
    const stdDevPercent = 0;

    const result = generateFractions(K, n, stdDevPercent);

    expect(result).toHaveLength(n);
    result.forEach((fraction) => {
      expect(fraction).toBe(K / n);
    });
  });
});
