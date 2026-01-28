import { describe, it, expect, beforeEach } from 'vitest';
import { BtgPactualContractExtractor } from './BtgPactualContractExtractor';

describe('BtgPactualContractExtractor', () => {
  let extractor: BtgPactualContractExtractor;

  beforeEach(() => {
    extractor = new BtgPactualContractExtractor();
  });

  describe('canExtract', () => {
    it('should return true for BTG Pactual contract text', () => {
      const text = `
        BTG Pactual
        CONTRATO DE CÂMBIO
        Dados da Operação
        Valor em Moeda Estrangeira: EUR 25.000,00
      `;
      expect(extractor.canExtract(text)).toBe(true);
    });

    it('should return true with Banco BTG marker', () => {
      const text = `
        Banco BTG S.A.
        CONTRATO DE CÂMBIO
        Operação de câmbio
      `;
      expect(extractor.canExtract(text)).toBe(true);
    });

    it('should return false for unrelated text', () => {
      const text = 'This is some random contract from another bank.';
      expect(extractor.canExtract(text)).toBe(false);
    });

    it('should return false for text with only one marker', () => {
      const text = 'BTG Pactual general information document';
      expect(extractor.canExtract(text)).toBe(false);
    });
  });

  describe('extract', () => {
    it('should extract contract date from "Data do Contrato" pattern', () => {
      const text = `
        BTG Pactual
        CONTRATO DE CÂMBIO
        Dados da Operação
        Data do Contrato: 23/01/2024
      `;
      const result = extractor.extract(text, 'test.pdf');
      expect(result.contractDate).toBe('23/01/2024');
    });

    it('should extract contract date from "celebrado em" pattern', () => {
      const text = `
        BTG Pactual
        CONTRATO DE CÂMBIO
        celebrado em 15/03/2024
        Dados da Operação
      `;
      const result = extractor.extract(text, 'test.pdf');
      expect(result.contractDate).toBe('15/03/2024');
    });

    it('should extract contract number from "Contrato nº" pattern', () => {
      const text = `
        BTG Pactual
        CONTRATO DE CÂMBIO
        Contrato nº 335584002
        Dados da Operação
      `;
      const result = extractor.extract(text, 'test.pdf');
      expect(result.contractNumber).toBe('335584002');
    });

    it('should extract contract number from "Contratação" pattern', () => {
      const text = `
        BTG Pactual
        CONTRATO DE CÂMBIO
        Número do contrato de câmbio Data
        Venda Contratação 325036000 03/11/2022
        Dados da Operação
      `;
      const result = extractor.extract(text, 'test.pdf');
      expect(result.contractNumber).toBe('325036000');
    });

    it('should extract contract number from file name when text extraction fails', () => {
      const text = `
        BTG Pactual
        CONTRATO DE CÂMBIO
        Dados da Operação
      `;
      const result = extractor.extract(text, '230124 X11H181 25000Eu 335584002.pdf');
      expect(result.contractNumber).toBe('335584002');
    });

    it('should extract foreign currency value', () => {
      const text = `
        BTG Pactual
        CONTRATO DE CÂMBIO
        Dados da Operação
        Valor em Moeda Estrangeira: EUR 25.000,00
      `;
      const result = extractor.extract(text, 'test.pdf');
      expect(result.foreignCurrencyValue).toBe('25.000,00');
      expect(result.foreignCurrency).toBe('EUR');
    });

    it('should extract USD currency', () => {
      const text = `
        BTG Pactual
        CONTRATO DE CÂMBIO
        Dados da Operação
        ME: USD 50.000,00
      `;
      const result = extractor.extract(text, 'test.pdf');
      expect(result.foreignCurrency).toBe('USD');
    });

    it('should extract exchange rate from "Taxa de Câmbio" pattern', () => {
      const text = `
        BTG Pactual
        CONTRATO DE CÂMBIO
        Dados da Operação
        Taxa de Câmbio: 5,3423
      `;
      const result = extractor.extract(text, 'test.pdf');
      expect(result.exchangeRate).toBe('5,3423');
    });

    it('should extract local currency value from "Valor em Moeda Nacional" pattern', () => {
      const text = `
        BTG Pactual
        CONTRATO DE CÂMBIO
        Dados da Operação
        Valor em Moeda Nacional: R$ 133.557,50
      `;
      const result = extractor.extract(text, 'test.pdf');
      expect(result.localCurrencyValue).toBe('133.557,50');
    });

    it('should extract settlement deadline from "Liquidação até" pattern', () => {
      const text = `
        BTG Pactual
        CONTRATO DE CÂMBIO
        Dados da Operação
        Liquidação até 25/01/2024
      `;
      const result = extractor.extract(text, 'test.pdf');
      expect(result.settlementDeadline).toBe('25/01/2024');
    });

    it('should extract payer abroad from "Pagador no Exterior" pattern', () => {
      const text = `
        BTG Pactual
        CONTRATO DE CÂMBIO
        Dados da Operação
        Pagador no Exterior: ACME INTERNATIONAL LTD
      `;
      const result = extractor.extract(text, 'test.pdf');
      expect(result.payerReceiverAbroad).toBe('ACME INTERNATIONAL LTD');
    });

    it('should extract receiver abroad from "Recebedor no Exterior" pattern', () => {
      const text = `
        BTG Pactual
        CONTRATO DE CÂMBIO
        Dados da Operação
        Recebedor no Exterior: GLOBAL SHIPPING CO
      `;
      const result = extractor.extract(text, 'test.pdf');
      expect(result.payerReceiverAbroad).toBe('GLOBAL SHIPPING CO');
    });

    it('should extract vessel name from "Outras especificações" section', () => {
      const text = `
        BTG Pactual
        CONTRATO DE CÂMBIO
        Dados da Operação
        Outras especificações: Navio: ATLANTIC VOYAGER


      `;
      const result = extractor.extract(text, 'test.pdf');
      expect(result.vesselName).toBe('ATLANTIC VOYAGER');
    });

    it('should extract vessel name with M/V prefix', () => {
      const text = `
        BTG Pactual
        CONTRATO DE CÂMBIO
        Dados da Operação
        Outras especificações: M/V PACIFIC STAR


      `;
      const result = extractor.extract(text, 'test.pdf');
      expect(result.vesselName).toBe('PACIFIC STAR');
    });

    it('should set source file name', () => {
      const text = `
        BTG Pactual
        CONTRATO DE CÂMBIO
        Dados da Operação
      `;
      const result = extractor.extract(text, 'contract_2024.pdf');
      expect(result.sourceFileName).toBe('contract_2024.pdf');
    });

    it('should record extraction errors when fields cannot be found', () => {
      const text = `
        BTG Pactual
        CONTRATO DE CÂMBIO
        Some unrelated content
      `;
      const result = extractor.extract(text, 'test.pdf');
      expect(result.extractionErrors).toBeDefined();
      expect(result.extractionErrors!.length).toBeGreaterThan(0);
    });

    it('should handle complete contract text', () => {
      const text = `
        BTG Pactual
        CONTRATO DE CÂMBIO
        Contrato nº 335584002
        Data do Contrato: 23/01/2024
        Dados da Operação
        Valor em Moeda Estrangeira: EUR 25.000,00
        Taxa de Câmbio: 5,3423
        Valor em Moeda Nacional: R$ 133.557,50
        Liquidação até 25/01/2024
        Pagador no Exterior: EUROPEAN SUPPLIER LTD

        Outras especificações: Navio: X11H181


      `;
      const result = extractor.extract(text, 'test.pdf');

      expect(result.contractNumber).toBe('335584002');
      expect(result.contractDate).toBe('23/01/2024');
      expect(result.foreignCurrencyValue).toBe('25.000,00');
      expect(result.foreignCurrency).toBe('EUR');
      expect(result.exchangeRate).toBe('5,3423');
      expect(result.localCurrencyValue).toBe('133.557,50');
      expect(result.settlementDeadline).toBe('25/01/2024');
      expect(result.payerReceiverAbroad).toBe('EUROPEAN SUPPLIER LTD');
      expect(result.vesselName).toBe('X11H181');
    });

    it('should extract payer from "Pagador ou recebedor no exterior" pattern', () => {
      const text = `
        BTG Pactual
        CONTRATO DE CÂMBIO
        Dados da Operação
        Pagador ou recebedor no exterior* BENETEAU
        Outras especificações
      `;
      const result = extractor.extract(text, 'test.pdf');
      expect(result.payerReceiverAbroad).toBe('BENETEAU');
    });

    it('should extract contract number as 9-digit number from text', () => {
      const text = `
        BTG Pactual
        CONTRATO DE CÂMBIO
        Contratação 304624174
        Dados da Operação
      `;
      const result = extractor.extract(text, 'test.pdf');
      expect(result.contractNumber).toBe('304624174');
    });

    it('should extract settlement deadline from "Prazo para liquidação" pattern', () => {
      const text = `
        BTG Pactual
        CONTRATO DE CÂMBIO
        Dados da Operação
        Prazo para liquidação 25/01/2024
      `;
      const result = extractor.extract(text, 'test.pdf');
      expect(result.settlementDeadline).toBe('25/01/2024');
    });

    it('should handle PDF.js spacing artifacts in exchange rate', () => {
      const text = `
        BTG Pactual
        CONTRATO DE CÂMBIO
        Dados da Operação
        Taxa 5 , 3 1 8 0 0 0 0 0 0 0 0 0
      `;
      const result = extractor.extract(text, 'test.pdf');
      expect(result.exchangeRate).toBe('5,3180');
    });

    it('should handle PDF.js spacing artifacts in local currency value with R$:', () => {
      const text = `
        BTG Pactual
        CONTRATO DE CÂMBIO
        Dados da Operação
        Valor em moeda nacional 5 , 3 1 8 0 0 0 0 0 0 0 0 0 R$: 531.800,00
      `;
      const result = extractor.extract(text, 'test.pdf');
      expect(result.localCurrencyValue).toBe('531.800,00');
    });

    it('should extract GBP currency and value', () => {
      const text = `
        BTG Pactual
        CONTRATO DE CÂMBIO
        Dados da Operação
        Valor em Moeda Estrangeira: GBP 50.000,00
      `;
      const result = extractor.extract(text, 'test.pdf');
      expect(result.foreignCurrency).toBe('GBP');
      expect(result.foreignCurrencyValue).toBe('50.000,00');
    });

    it('should extract CHF currency and value', () => {
      const text = `
        BTG Pactual
        CONTRATO DE CÂMBIO
        Dados da Operação
        Valor em Moeda Estrangeira: CHF 75.000,00
      `;
      const result = extractor.extract(text, 'test.pdf');
      expect(result.foreignCurrency).toBe('CHF');
      expect(result.foreignCurrencyValue).toBe('75.000,00');
    });

    it('should extract JPY currency and value', () => {
      const text = `
        BTG Pactual
        CONTRATO DE CÂMBIO
        Dados da Operação
        Valor em Moeda Estrangeira: JPY 10.000.000,00
      `;
      const result = extractor.extract(text, 'test.pdf');
      expect(result.foreignCurrency).toBe('JPY');
      expect(result.foreignCurrencyValue).toBe('10.000.000,00');
    });

    it('should detect USD currency from text context when not explicit', () => {
      const text = `
        BTG Pactual
        CONTRATO DE CÂMBIO
        Dados da Operação
        US$ 25,000.00
        ME: 25.000,00
      `;
      const result = extractor.extract(text, 'test.pdf');
      expect(result.foreignCurrency).toBe('USD');
    });

    it('should detect EUR currency from € symbol', () => {
      const text = `
        BTG Pactual
        CONTRATO DE CÂMBIO
        Dados da Operação
        € 30,000.00
        ME: 30.000,00
      `;
      const result = extractor.extract(text, 'test.pdf');
      expect(result.foreignCurrency).toBe('EUR');
    });

    it('should detect GBP currency from £ symbol', () => {
      const text = `
        BTG Pactual
        CONTRATO DE CÂMBIO
        Dados da Operação
        £ 20,000.00
        ME: 20.000,00
      `;
      const result = extractor.extract(text, 'test.pdf');
      expect(result.foreignCurrency).toBe('GBP');
    });

    it('should map currency symbol $ to USD', () => {
      const text = `
        BTG Pactual
        CONTRATO DE CÂMBIO
        Dados da Operação
        $ 15.000,00
      `;
      const result = extractor.extract(text, 'test.pdf');
      expect(result.foreignCurrency).toBe('USD');
    });

    it('should handle entity names with special characters', () => {
      const text = `
        BTG Pactual
        CONTRATO DE CÂMBIO
        Dados da Operação
        Pagador no Exterior: TEST COMPANY & CO LTD
        Valor em Moeda Estrangeira: EUR 25.000,00
      `;
      const result = extractor.extract(text, 'test.pdf');
      expect(result.payerReceiverAbroad).toBeTruthy();
      expect(result.payerReceiverAbroad).toContain('TEST COMPANY');
    });

    it('should handle vessel names with special characters', () => {
      const text = `
        BTG Pactual
        CONTRATO DE CÂMBIO
        Dados da Operação
        Nome do Navio: TEST-VESSEL SHIP
        Valor em Moeda Estrangeira: EUR 25.000,00
      `;
      const result = extractor.extract(text, 'test.pdf');
      expect(result.vesselName).toBeTruthy();
      expect(result.vesselName).toContain('TEST');
    });

    it('should extract contract date from "firmado em" pattern', () => {
      const text = `
        BTG Pactual
        CONTRATO DE CÂMBIO
        firmado em 10/05/2024
        Dados da Operação
      `;
      const result = extractor.extract(text, 'test.pdf');
      expect(result.contractDate).toBe('10/05/2024');
    });

    it('should extract contract date from "assinado" pattern', () => {
      const text = `
        BTG Pactual
        CONTRATO DE CÂMBIO
        assinado em 12/06/2024
        Dados da Operação
      `;
      const result = extractor.extract(text, 'test.pdf');
      expect(result.contractDate).toBe('12/06/2024');
    });

    it('should extract contract number from "Número do contrato de câmbio" pattern', () => {
      const text = `
        BTG Pactual
        CONTRATO DE CÂMBIO
        Número do contrato de câmbio 445566778
        Dados da Operação
      `;
      const result = extractor.extract(text, 'test.pdf');
      expect(result.contractNumber).toBe('445566778');
    });

    it('should extract contract number from "Registro" pattern', () => {
      const text = `
        BTG Pactual
        CONTRATO DE CÂMBIO
        Registro 556677889
        Dados da Operação
      `;
      const result = extractor.extract(text, 'test.pdf');
      expect(result.contractNumber).toBe('556677889');
    });
  });

  describe('extractor metadata', () => {
    it('should have correct id', () => {
      expect(extractor.id).toBe('btg-pactual-forex');
    });

    it('should have correct name', () => {
      expect(extractor.name).toBe('BTG Pactual Foreign Exchange');
    });

    it('should have a description', () => {
      expect(extractor.description).toBeTruthy();
    });
  });
});
