import type { IContractData } from '../interfaces/IContractData';
import type { IContractExtractor } from '../interfaces/IContractExtractor';

/**
 * Contract extractor for BTG Pactual foreign exchange contracts
 * Parses the specific format used by BTG Pactual bank
 */
export class BtgPactualContractExtractor implements IContractExtractor {
  readonly id = 'btg-pactual-forex';
  readonly name = 'BTG Pactual Foreign Exchange';
  readonly description = 'Extractor for BTG Pactual bank foreign exchange contracts';

  /**
   * Check if this extractor can handle the given PDF text content
   * Looks for BTG Pactual specific markers
   */
  canExtract(text: string): boolean {
    const markers = [
      /BTG\s*Pactual/i,
      /Banco\s+BTG/i,
      /CONTRATO\s+DE\s+C[ÂA]MBIO/i,
      /Dados\s+da\s+Opera[çc][ãa]o/i,
    ];

    // Must match at least 2 markers to be considered BTG Pactual format
    const matchCount = markers.filter((marker) => marker.test(text)).length;
    return matchCount >= 2;
  }

  /**
   * Extract contract data from BTG Pactual PDF text
   */
  extract(text: string, fileName: string): IContractData {
    const errors: string[] = [];

    // Normalize text for easier parsing
    const normalizedText = this.normalizeText(text);

    // Extract each field
    const contractDate = this.extractContractDate(normalizedText, errors);
    const contractNumber = this.extractContractNumber(normalizedText, errors, fileName);
    const { value: foreignCurrencyValue, currency: foreignCurrency } =
      this.extractForeignCurrencyValue(normalizedText, errors);
    const exchangeRate = this.extractExchangeRate(normalizedText, errors);
    const localCurrencyValue = this.extractLocalCurrencyValue(normalizedText, errors);
    const settlementDeadline = this.extractSettlementDeadline(normalizedText, errors);
    const payerReceiverAbroad = this.extractPayerReceiverAbroad(normalizedText, errors);
    const vesselName = this.extractVesselName(normalizedText, errors);

    return {
      sourceFileName: fileName,
      contractDate,
      contractNumber,
      foreignCurrencyValue,
      foreignCurrency,
      exchangeRate,
      localCurrencyValue,
      settlementDeadline,
      payerReceiverAbroad,
      vesselName,
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
   * Remove spacing artifacts from PDF.js text extraction
   * Converts "5 , 3 1 8 0 0 0 0 0 0 0 0 0" to "5,318000000000"
   * Only removes spaces in patterns that look like PDF.js artifacts:
   * - Single digits separated by single spaces
   * - Spaces around decimal separators (comma/period)
   */
  private removeSpacingArtifacts(text: string): string {
    // Remove spaces around commas and periods in numbers
    let result = text.replace(/(\d)\s*,\s*(\d)/g, '$1,$2');
    result = result.replace(/(\d)\s*\.\s*(\d)/g, '$1.$2');

    // Only remove spaces in patterns like "5 3 1 8" (single digits separated by single spaces)
    // This pattern looks for sequences of "single_digit space single_digit space ..."
    // Match at least 3 single digits with spaces between them
    result = result.replace(/\b(\d)(?: (\d)){2,}\b/g, (match) => {
      return match.replace(/ /g, '');
    });

    return result;
  }

  /**
   * Extract contract date
   * Looks for patterns like "Data do Contrato: DD/MM/YYYY" or date after "Contrato de Câmbio"
   */
  private extractContractDate(text: string, errors: string[]): string {
    // Pattern 1: Explicit "Data do Contrato" field
    const pattern1 = /Data\s+do\s+Contrato[:\s]+(\d{2}[/-]\d{2}[/-]\d{4})/i;
    const match1 = text.match(pattern1);
    if (match1?.[1]) {
      return this.normalizeDate(match1[1]);
    }

    // Pattern 2: Date near the header
    const pattern2 = /(?:celebrado|firmado|assinado)\s+em\s+(\d{2}[/-]\d{2}[/-]\d{4})/i;
    const match2 = text.match(pattern2);
    if (match2?.[1]) {
      return this.normalizeDate(match2[1]);
    }

    // Pattern 3: Look for date format DD/MM/YYYY near "contrato" keyword
    const pattern3 = /contrato.*?(\d{2}[/-]\d{2}[/-]\d{4})|(\d{2}[/-]\d{2}[/-]\d{4}).*?contrato/i;
    const match3 = text.match(pattern3);
    const dateValue3 = match3?.[1] ?? match3?.[2];
    if (dateValue3) {
      return this.normalizeDate(dateValue3);
    }

    // Pattern 4: General date format near beginning
    const pattern4 = /^\s*(\d{2}[/-]\d{2}[/-]\d{4})/;
    const match4 = text.match(pattern4);
    if (match4?.[1]) {
      return this.normalizeDate(match4[1]);
    }

    errors.push('Could not extract contract date');
    return '';
  }

  /**
   * Extract contract number
   * BTG Pactual format: "Número do contrato de câmbio" header, then "Venda Contratação 325036000"
   * Also validates against file name which typically contains the contract number
   */
  private extractContractNumber(text: string, errors: string[], fileName: string): string {
    // Note: Don't use removeSpacingArtifacts here as it can merge numbers with dates
    // Contract numbers should be intact in the text

    // Try to extract contract number from file name first (as it's most reliable)
    const fileNameNumber = this.extractContractNumberFromFileName(fileName);

    // Pattern 1: "Contratação" followed by 9-digit number (most reliable for BTG format)
    // Format: "Venda Contratação 325036000 03/11/2022"
    const pattern1 = /Contrata[çc][ãa]o\s+(\d{9})(?:\s|$)/i;
    const match1 = text.match(pattern1);
    if (match1?.[1]) {
      return match1[1].trim();
    }

    // Pattern 2: Look for 9-digit number that matches the one in the file name
    if (fileNameNumber) {
      const escapedNumber = fileNameNumber.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern2 = new RegExp(`\\b${escapedNumber}\\b`);
      if (pattern2.test(text)) {
        return fileNameNumber;
      }
      // If the file name number is found, use it even if not in text
      // (file names are typically reliable)
      return fileNameNumber;
    }

    // Pattern 3: "Número do contrato de câmbio" followed by 9 digits
    const pattern3 = /N[úu]mero\s+do\s+contrato\s+de\s+c[âa]mbio[^\d]*(\d{9})(?:\D|$)/i;
    const match3 = text.match(pattern3);
    if (match3?.[1]) {
      return match3[1].trim();
    }

    // Pattern 4: "Registro" followed by exactly 9 digits
    const pattern4 = /Registro[^\d]*(\d{9})(?:\D|$)/i;
    const match4 = text.match(pattern4);
    if (match4?.[1]) {
      return match4[1].trim();
    }

    // Pattern 5: Look for any standalone 9-digit number
    const pattern5 = /\b(\d{9})\b/;
    const match5 = text.match(pattern5);
    if (match5?.[1]) {
      return match5[1].trim();
    }

    // Pattern 6: "Contrato nº" followed by a number (not just any word)
    const pattern6 = /Contrato\s+n[º°]\s*:?\s*(\d+)/i;
    const match6 = text.match(pattern6);
    if (match6?.[1]) {
      return match6[1].trim();
    }

    errors.push('Could not extract contract number');
    return '';
  }

  /**
   * Extract contract number from file name
   * File names typically contain the contract number as a 9-digit sequence
   * Example: "230124 X11H181 25000Eu 335584002.pdf" -> "335584002"
   */
  private extractContractNumberFromFileName(fileName: string): string | null {
    // Remove extension
    const nameWithoutExt = fileName.replace(/\.[^.]+$/, '');

    // Look for 9-digit number in the file name
    const match = nameWithoutExt.match(/\b(\d{9})\b/);
    return match?.[1] ?? null;
  }

  /**
   * Extract foreign currency value and currency code
   */
  private extractForeignCurrencyValue(
    text: string,
    errors: string[]
  ): { value: string; currency: string } {
    // Pattern 1: Currency code followed by value (USD 25.000,00 or EUR 25,000.00)
    const pattern1 =
      /(?:Valor\s+(?:em\s+)?(?:Moeda\s+)?Estrangeira|ME)[:\s]*(USD|EUR|GBP|CHF|JPY)?\s*([\d.,]+)/i;
    const match1 = text.match(pattern1);
    if (match1?.[2]) {
      return {
        currency: match1[1]?.toUpperCase() ?? this.detectCurrency(text),
        value: this.normalizeNumber(match1[2]),
      };
    }

    // Pattern 2: Look for currency symbols
    const pattern2 =
      /(USD|EUR|GBP|CHF|JPY|US\$|\$|€|£)\s*([\d.,]+)|(?:[\d.,]+)\s*(USD|EUR|GBP|CHF|JPY)/i;
    const match2 = text.match(pattern2);
    if (match2?.[2]) {
      const currency = (match2[1] ?? match2[3] ?? '').toUpperCase();
      const mappedCurrency = this.mapCurrencySymbol(currency);
      return {
        currency: mappedCurrency,
        value: this.normalizeNumber(match2[2]),
      };
    }

    errors.push('Could not extract foreign currency value');
    return { value: '', currency: '' };
  }

  /**
   * Extract exchange rate
   * Handles PDF.js spacing artifacts like "5 , 3 1 8 0 0 0"
   * Limits to 4 decimal places for display
   */
  private extractExchangeRate(text: string, errors: string[]): string {
    // Clean text to handle spacing artifacts
    const cleanText = this.removeSpacingArtifacts(text);

    // Pattern 1: "Taxa" followed by number with 4+ decimal places
    const pattern1 = /Taxa[^\d]*(\d+[,.]\d{4,})/i;
    const match1 = cleanText.match(pattern1);
    if (match1?.[1]) {
      return this.limitDecimalPlaces(this.normalizeNumber(match1[1]), 4);
    }

    // Pattern 2: "Taxa de Câmbio" or "Taxa"
    const pattern2 = /(?:Taxa\s+(?:de\s+)?C[âa]mbio|Taxa)[:\s]*([\d.,]+)/i;
    const match2 = cleanText.match(pattern2);
    if (match2?.[1]) {
      return this.limitDecimalPlaces(this.normalizeNumber(match2[1]), 4);
    }

    // Pattern 3: "Cotação"
    const pattern3 = /Cota[çc][ãa]o[:\s]*([\d.,]+)/i;
    const match3 = cleanText.match(pattern3);
    if (match3?.[1]) {
      return this.limitDecimalPlaces(this.normalizeNumber(match3[1]), 4);
    }

    // Pattern 4: Look for exchange rate format (number with many decimal places)
    const pattern4 = /\b(\d{1,2}[,.]\d{6,})\b/;
    const match4 = cleanText.match(pattern4);
    if (match4?.[1]) {
      return this.limitDecimalPlaces(this.normalizeNumber(match4[1]), 4);
    }

    errors.push('Could not extract exchange rate');
    return '';
  }

  /**
   * Limit a number string to a specific number of decimal places
   * Works with both comma and period as decimal separators
   */
  private limitDecimalPlaces(value: string, places: number): string {
    // Detect decimal separator (comma for Brazilian format)
    const commaPos = value.lastIndexOf(',');
    const periodPos = value.lastIndexOf('.');

    // Determine which is the decimal separator (the rightmost one)
    if (commaPos > periodPos) {
      // Comma is decimal separator (Brazilian format)
      const parts = value.split(',');
      const decimalPart = parts[1];
      if (parts.length === 2 && decimalPart && decimalPart.length > places) {
        return `${parts[0]},${decimalPart.substring(0, places)}`;
      }
    } else if (periodPos > commaPos) {
      // Period is decimal separator
      const parts = value.split('.');
      const decimalPart = parts[1];
      if (parts.length === 2 && decimalPart && decimalPart.length > places) {
        return `${parts[0]}.${decimalPart.substring(0, places)}`;
      }
    }

    return value;
  }

  /**
   * Extract local currency (BRL) value
   * Handles PDF format "Valor em moeda nacional" with "R$:  531.800,00"
   */
  private extractLocalCurrencyValue(text: string, errors: string[]): string {
    // Clean text to handle spacing artifacts
    const cleanText = this.removeSpacingArtifacts(text);

    // Pattern 1: "Valor em moeda nacional" followed by R$: and value
    // Format: "Valor em moeda nacional 5318000000000 R$: 531.800,00"
    const pattern1 = /Valor\s+em\s+moeda\s+nacional[^R]*R\$[:\s]*([\d.,]+)/i;
    const match1 = cleanText.match(pattern1);
    if (match1?.[1]) {
      return this.normalizeNumber(match1[1]);
    }

    // Pattern 2: "R$:" followed by value (with colon)
    const pattern2 = /R\$\s*:\s*([\d.,]+)/i;
    const match2 = cleanText.match(pattern2);
    if (match2?.[1]) {
      return this.normalizeNumber(match2[1]);
    }

    // Pattern 3: "Valor em Moeda Nacional" or "Valor em BRL" or "Valor em Reais"
    const pattern3 =
      /(?:Valor\s+(?:em\s+)?(?:Moeda\s+)?Nacional|Valor\s+em\s+(?:BRL|Reais|R\$)|MN)[:\s]*(?:R\$|BRL)?\s*([\d.,]+)/i;
    const match3 = cleanText.match(pattern3);
    if (match3?.[1]) {
      return this.normalizeNumber(match3[1]);
    }

    // Pattern 4: "Equivalente em Reais"
    const pattern4 = /Equivalente\s+(?:em\s+)?(?:Reais|R\$|BRL)[:\s]*([\d.,]+)/i;
    const match4 = cleanText.match(pattern4);
    if (match4?.[1]) {
      return this.normalizeNumber(match4[1]);
    }

    // Pattern 5: R$ followed by value (general)
    const pattern5 = /R\$\s*([\d.,]+)/i;
    const match5 = cleanText.match(pattern5);
    if (match5?.[1]) {
      return this.normalizeNumber(match5[1]);
    }

    errors.push('Could not extract local currency value');
    return '';
  }

  /**
   * Extract settlement deadline
   * Handles "Prazo para liquidação" with date in DD/MM/YYYY format
   */
  private extractSettlementDeadline(text: string, errors: string[]): string {
    // Clean text to handle spacing artifacts in dates
    const cleanText = this.removeSpacingArtifacts(text);

    // Pattern 1: "Prazo para liquidação" followed by date
    const pattern1 = /Prazo\s+para\s+liquida[çc][ãa]o[^\d]*(\d{2}[/-]\d{2}[/-]\d{4})/i;
    const match1 = cleanText.match(pattern1);
    if (match1?.[1]) {
      return this.normalizeDate(match1[1]);
    }

    // Pattern 2: "Liquidação até" or "Data de Liquidação"
    const pattern2 =
      /(?:Liquida[çc][ãa]o\s+(?:at[ée]|em)|Data\s+de\s+Liquida[çc][ãa]o)[:\s]*(\d{2}[/-]\d{2}[/-]\d{4})/i;
    const match2 = cleanText.match(pattern2);
    if (match2?.[1]) {
      return this.normalizeDate(match2[1]);
    }

    // Pattern 3: "Prazo" followed by date
    const pattern3 = /Prazo[^\d]*(\d{2}[/-]\d{2}[/-]\d{4})/i;
    const match3 = cleanText.match(pattern3);
    if (match3?.[1]) {
      return this.normalizeDate(match3[1]);
    }

    // Pattern 4: "Vencimento"
    const pattern4 = /Vencimento[^\d]*(\d{2}[/-]\d{2}[/-]\d{4})/i;
    const match4 = cleanText.match(pattern4);
    if (match4?.[1]) {
      return this.normalizeDate(match4[1]);
    }

    // Pattern 5: Look for second date in document (first is contract date, second is settlement)
    const dates = cleanText.match(/\d{2}\/\d{2}\/\d{4}/g);
    if (dates && dates.length >= 2 && dates[1]) {
      return this.normalizeDate(dates[1]);
    }

    errors.push('Could not extract settlement deadline');
    return '';
  }

  /**
   * Extract payer/receiver abroad
   * Handles "Pagador ou recebedor no exterior*" followed by company name
   * Example: "Pagador ou recebedor no exterior* BENETEAU"
   */
  private extractPayerReceiverAbroad(text: string, errors: string[]): string {
    // Pattern 1: "Pagador ou recebedor no exterior" followed by company name
    // The asterisk (*) may be present, and company name follows
    const pattern1 =
      /Pagador\s+ou\s+recebedor\s+no\s+exterior\*?\s*([A-Za-z][A-Za-z0-9\s.,&'-]+?)(?=\s+(?:Outras|Institui|Natureza|C[óo]digo|Forma|Pa[ií]s|Dados|Valor|$))/i;
    const match1 = text.match(pattern1);
    if (match1?.[1]) {
      return this.cleanEntityName(match1[1]);
    }

    // Pattern 2: "Pagador ou recebedor no exterior" with simpler capture
    const pattern2 = /Pagador\s+ou\s+recebedor\s+no\s+exterior\*?\s+([A-Z][A-Z0-9\s.-]+)/i;
    const match2 = text.match(pattern2);
    if (match2?.[1]) {
      return this.cleanEntityName(match2[1]);
    }

    // Pattern 3: "Pagador no Exterior:" or "Recebedor no Exterior:" with colon and value
    // Match until newline, end of line, or next known field
    const pattern3 =
      /(?:Pagador|Recebedor|Benefici[áa]rio)\s+(?:no\s+)?Exterior\s*:\s*([A-Za-z][A-Za-z0-9\s.,&-]+?)(?=\s+Outras|\s+Contraparte|\s+Parte\s+no|\s+Data|\s+Valor|\s+Taxa|\s+Liquida|\s+Prazo|\s+Vencimento|\s+Assinatura|\s+Institui|\s*$)/i;
    const match3 = text.match(pattern3);
    if (match3?.[1]) {
      return this.cleanEntityName(match3[1]);
    }

    // Pattern 4: "Pagador no Exterior" or "Recebedor no Exterior" without colon
    const pattern4 =
      /(?:Pagador|Recebedor|Benefici[áa]rio)\s+(?:no\s+)?Exterior[\s*]+([A-Za-z][A-Za-z0-9\s.,&-]+?)(?=\s+(?:Outras|Contraparte|Parte\s+no|Data|Valor|Taxa|Liquida|Prazo|Vencimento|Assinatura|Institui)|$)/i;
    const match4 = text.match(pattern4);
    if (match4?.[1]) {
      return this.cleanEntityName(match4[1]);
    }

    // Pattern 5: "Contraparte Estrangeira"
    const pattern5 =
      /Contraparte\s+Estrangeira[:\s]*([A-Za-z][A-Za-z0-9\s.,&-]+?)(?=\s+(?:Outras|Pagador|Recebedor|Data|Valor|Taxa|Liquida|Prazo)|$)/i;
    const match5 = text.match(pattern5);
    if (match5?.[1]) {
      return this.cleanEntityName(match5[1]);
    }

    // Pattern 6: "Parte no Exterior"
    const pattern6 =
      /Parte\s+(?:no\s+)?Exterior[:\s]*([A-Za-z][A-Za-z0-9\s.,&-]+?)(?=\s+(?:Outras|Contraparte|Pagador|Recebedor|Data|Valor|Taxa)|$)/i;
    const match6 = text.match(pattern6);
    if (match6?.[1]) {
      return this.cleanEntityName(match6[1]);
    }

    errors.push('Could not extract payer/receiver abroad');
    return '';
  }

  /**
   * Extract vessel name from "Outras especificações" field
   */
  private extractVesselName(text: string, errors: string[]): string {
    // First, find the "Outras especificações" section
    const sectionPattern = /Outras\s+especifica[çc][õo]es[:\s]*([\s\S]*?)(?=(?:\n\s*\n|$))/i;
    const sectionMatch = text.match(sectionPattern);

    if (sectionMatch?.[1]) {
      const section = sectionMatch[1];

      // Pattern 1: Look for "Navio:", "Embarcação:", "Vessel:", "M/V", "MV"
      const vesselPatterns = [
        /(?:Navio|Embarca[çc][ãa]o|Vessel|Nau)[:\s]*([A-Z][A-Z0-9\s.-]+)/i,
        /(?:M\/V|MV)\s+([A-Z][A-Z0-9\s.-]+)/i,
        /(?:Nome\s+do\s+Navio)[:\s]*([A-Z][A-Z0-9\s.-]+)/i,
      ];

      for (const pattern of vesselPatterns) {
        const match = section.match(pattern);
        if (match?.[1]) {
          return this.cleanVesselName(match[1]);
        }
      }

      // Pattern 2: Look for vessel name in uppercase words
      const upperCasePattern = /\b([A-Z][A-Z0-9\s.-]{3,}(?:\s+[A-Z0-9.-]+)*)\b/;
      const upperMatch = section.match(upperCasePattern);
      if (upperMatch?.[1]) {
        const potential = upperMatch[1].trim();
        // Validate it looks like a vessel name (not common words)
        if (!this.isCommonWord(potential)) {
          return this.cleanVesselName(potential);
        }
      }
    }

    // Try finding vessel name in the entire text
    const globalPattern = /(?:Navio|Embarca[çc][ãa]o|Vessel|M\/V|MV)[:\s]*([A-Z][A-Z0-9\s.-]+)/i;
    const globalMatch = text.match(globalPattern);
    if (globalMatch?.[1]) {
      return this.cleanVesselName(globalMatch[1]);
    }

    errors.push('Could not extract vessel name');
    return '';
  }

  // Helper methods

  private normalizeDate(date: string): string {
    return date.replace(/-/g, '/');
  }

  private normalizeNumber(value: string): string {
    // Brazilian format: 1.234,56 -> keep as is for Brazilian output
    // If it looks like Brazilian format (has comma as decimal), return as is
    if (/^\d{1,3}(?:\.\d{3})*,\d{2}$/.test(value)) {
      return value;
    }
    // Clean and return
    return value.trim();
  }

  private detectCurrency(text: string): string {
    if (/\bUSD\b|US\$|\$\s*\d/i.test(text)) return 'USD';
    if (/\bEUR\b|€/i.test(text)) return 'EUR';
    if (/\bGBP\b|£/i.test(text)) return 'GBP';
    if (/\bCHF\b/i.test(text)) return 'CHF';
    if (/\bJPY\b|¥/i.test(text)) return 'JPY';
    return 'USD'; // Default
  }

  private mapCurrencySymbol(symbol: string): string {
    const mapping: Record<string, string> = {
      $: 'USD',
      US$: 'USD',
      '€': 'EUR',
      '£': 'GBP',
      '¥': 'JPY',
    };
    return mapping[symbol] ?? symbol;
  }

  private cleanEntityName(name: string): string {
    return name
      .replace(/[^\w\s.,&-]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 200); // Limit length
  }

  private cleanVesselName(name: string): string {
    return name
      .replace(/[^\w\s.-]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase()
      .substring(0, 100);
  }

  private isCommonWord(word: string): boolean {
    const commonWords = [
      'CONTRATO',
      'CAMBIO',
      'BANCO',
      'DADOS',
      'OPERACAO',
      'VALOR',
      'MOEDA',
      'TAXA',
      'DATA',
      'PRAZO',
      'LIQUIDACAO',
      'PAGADOR',
      'RECEBEDOR',
      'OUTRAS',
      'ESPECIFICACOES',
      'NACIONAL',
      'ESTRANGEIRA',
      'EXTERIOR',
    ];
    return commonWords.includes(word.toUpperCase().replace(/\s+/g, ''));
  }
}
