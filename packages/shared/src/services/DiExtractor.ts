import type { IDiData } from '../interfaces/IDiData';

/**
 * Extractor for DI (Declaração de Importação) PDF documents
 * Extracts VMLD value and exchange rates
 */
export class DiExtractor {
  /**
   * Check if this extractor can handle the given PDF text content
   * Looks for DI-specific markers
   */
  canExtract(text: string): boolean {
    const markers = [
      /Declara[çc][ãa]o\s+de\s+Importa[çc][ãa]o/i,
      /VMLD/i,
      /TAXAS\s+DE\s+C[ÂA]MBIO/i,
    ];

    // Must match at least 2 markers to be considered DI format
    const matchCount = markers.filter((marker) => marker.test(text)).length;
    return matchCount >= 2;
  }

  /**
   * Extract DI data from PDF text
   */
  extract(text: string, fileName: string): IDiData {
    const errors: string[] = [];

    // Normalize text for easier parsing
    const normalizedText = this.normalizeText(text);

    // Extract DI number and date
    const diNumber = this.extractDiNumber(text, errors);
    const diDate = this.extractDiDate(text, errors);

    // Extract VMLD value
    const vmldValueUsd = this.extractVmldValue(normalizedText, errors);

    // Extract exchange rates
    const { usdRate, eurRate } = this.extractExchangeRates(normalizedText, errors);

    // Calculate USD to EUR rate
    const usdToEurRate = this.calculateUsdToEurRate(usdRate, eurRate, errors);

    // Calculate VMLD in EUR
    const vmldValueEur = this.calculateVmldEur(vmldValueUsd, usdToEurRate, errors);

    return {
      sourceFileName: fileName,
      diNumber,
      diDate,
      vmldValueUsd,
      usdToBrlRate: usdRate,
      eurToBrlRate: eurRate,
      usdToEurRate,
      vmldValueEur,
      extractionErrors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Normalize text for easier parsing
   */
  private normalizeText(text: string): string {
    return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\s+/g, ' ').trim();
  }

  /**
   * Extract DI number from text
   * Format: "Declaração: 23/0602316-5"
   */
  private extractDiNumber(text: string, errors: string[]): string {
    // Pattern for DI number: "Declaração: XX/XXXXXXX-X"
    const pattern = /Declara[çc][ãa]o\s*:\s*([\d/-]+)/i;
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }

    errors.push('Could not extract DI number');
    return '';
  }

  /**
   * Extract DI registration date from text
   * Format: "Data do Registro: 28/03/2023"
   */
  private extractDiDate(text: string, errors: string[]): string {
    // Pattern for DI date: "Data do Registro: DD/MM/YYYY"
    const pattern = /Data\s+do\s+Registro\s*:\s*(\d{2}\/\d{2}\/\d{4})/i;
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }

    errors.push('Could not extract DI date');
    return '';
  }

  /**
   * Extract VMLD value in USD
   * Format: "VMLD: DOLAR DOS ESTADOS UNIDOS 409.635,02"
   */
  private extractVmldValue(text: string, errors: string[]): string {
    // Pattern 1: VMLD followed by currency name and value
    const pattern1 = /VMLD\s*:\s*(?:DOLAR\s+DOS\s+ESTADOS\s+UNIDOS|USD|US\$)\s*([\d.,]+)/i;
    const match1 = text.match(pattern1);
    if (match1?.[1]) {
      return match1[1].trim();
    }

    // Pattern 2: VMLD with colon and value on same line
    const pattern2 = /VMLD\s*:?\s*([\d.,]+)/i;
    const match2 = text.match(pattern2);
    if (match2?.[1]) {
      return match2[1].trim();
    }

    errors.push('Could not extract VMLD value');
    return '';
  }

  /**
   * Extract exchange rates
   * Format: "US$ : 5,4000;" and "EURO: 5,7931;"
   */
  private extractExchangeRates(
    text: string,
    errors: string[]
  ): { usdRate: string; eurRate: string } {
    let usdRate = '';
    let eurRate = '';

    // Pattern for USD rate: "US$ : 5,4000" or "USD: 5.4000"
    const usdPattern = /(?:US\$|USD)\s*:\s*([\d.,]+)/i;
    const usdMatch = text.match(usdPattern);
    if (usdMatch?.[1]) {
      usdRate = usdMatch[1].trim().replace(/;$/, '');
    } else {
      errors.push('Could not extract USD to BRL rate');
    }

    // Pattern for EUR rate: "EURO: 5,7931" or "EUR: 5.7931"
    const eurPattern = /(?:EURO|EUR)\s*:\s*([\d.,]+)/i;
    const eurMatch = text.match(eurPattern);
    if (eurMatch?.[1]) {
      eurRate = eurMatch[1].trim().replace(/;$/, '');
    } else {
      errors.push('Could not extract EUR to BRL rate');
    }

    return { usdRate, eurRate };
  }

  /**
   * Calculate USD to EUR rate from BRL rates
   * Formula: USD/EUR = (USD/BRL) / (EUR/BRL)
   */
  private calculateUsdToEurRate(usdRate: string, eurRate: string, errors: string[]): string {
    if (!usdRate || !eurRate) {
      return '';
    }

    try {
      const usdValue = this.parseNumber(usdRate);
      const eurValue = this.parseNumber(eurRate);

      if (eurValue === 0) {
        errors.push('EUR rate is zero, cannot calculate USD to EUR rate');
        return '';
      }

      const rate = usdValue / eurValue;
      // Format with 4 decimal places, using comma as decimal separator
      return rate.toFixed(4).replace('.', ',');
    } catch {
      errors.push('Error calculating USD to EUR rate');
      return '';
    }
  }

  /**
   * Calculate VMLD value in EUR
   */
  private calculateVmldEur(vmldUsd: string, usdToEurRate: string, errors: string[]): string {
    if (!vmldUsd || !usdToEurRate) {
      return '';
    }

    try {
      const vmldValue = this.parseNumber(vmldUsd);
      const rate = this.parseNumber(usdToEurRate);

      const vmldEur = vmldValue * rate;
      // Format with 2 decimal places, using Brazilian format
      return this.formatBrazilianNumber(vmldEur);
    } catch {
      errors.push('Error calculating VMLD in EUR');
      return '';
    }
  }

  /**
   * Parse a Brazilian formatted number string to a number
   * "409.635,02" -> 409635.02
   */
  private parseNumber(value: string): number {
    if (!value) return 0;
    // Remove thousand separators (periods) and replace comma with period
    const normalized = value.replace(/\./g, '').replace(',', '.');
    return parseFloat(normalized);
  }

  /**
   * Format a number to Brazilian format
   * 409635.02 -> "409.635,02"
   */
  private formatBrazilianNumber(value: number): string {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
}
