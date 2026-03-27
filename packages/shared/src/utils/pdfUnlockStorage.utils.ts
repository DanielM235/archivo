/**
 * Configuration for PDF unlocking
 */
export interface IPdfUnlockConfig {
  /** Reference number (e.g., CPF) */
  referenceNumber: string;
  /** Number of first digits to use as password */
  numDigits: number;
  /** Timestamp when this config was last used successfully */
  lastUsed: number;
  /** Optional label for display */
  label?: string;
}

/**
 * Storage utility for PDF unlock configurations
 */
export class PdfUnlockStorage {
  private static readonly STORAGE_KEY = 'pdf-unlock-configs';

  /**
   * Get all stored configurations
   */
  static getConfigs(): IPdfUnlockConfig[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];

      const configs = JSON.parse(stored) as IPdfUnlockConfig[];
      return configs.sort((a, b) => b.lastUsed - a.lastUsed); // Most recent first
    } catch (error) {
      console.error('Failed to load PDF unlock configs:', error);
      return [];
    }
  }

  /**
   * Save a successful configuration
   */
  static saveConfig(config: Omit<IPdfUnlockConfig, 'lastUsed'>): void {
    try {
      const configs = this.getConfigs();

      // Check if this exact config already exists
      const existingIndex = configs.findIndex(
        (c) => c.referenceNumber === config.referenceNumber && c.numDigits === config.numDigits
      );

      const newConfig: IPdfUnlockConfig = {
        ...config,
        lastUsed: Date.now(),
      };

      if (existingIndex >= 0) {
        // Update existing config
        configs[existingIndex] = newConfig;
      } else {
        // Add new config
        configs.unshift(newConfig); // Add to beginning
      }

      // Keep only the most recent 10 configs
      const trimmedConfigs = configs.slice(0, 10);

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmedConfigs));
    } catch (error) {
      console.error('Failed to save PDF unlock config:', error);
    }
  }

  /**
   * Clear all stored configurations
   */
  static clearConfigs(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear PDF unlock configs:', error);
    }
  }

  /**
   * Get the most recently used configuration
   */
  static getLastUsedConfig(): IPdfUnlockConfig | null {
    const configs = this.getConfigs();
    return configs[0] || null;
  }
}
