import { describe, it, expect } from 'vitest';

/**
 * Sample test file to verify test setup
 */
describe('Test Setup', () => {
  it('should pass a simple test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should support async tests', async () => {
    const result = await Promise.resolve('hello');
    expect(result).toBe('hello');
  });
});
