/**
 * Shared interfaces exports
 */

export type {
  IRenameFileInfo,
  IRenameConfig,
  IRenameResult,
  SeparatorType,
  NameOrderType,
  RenameProcessState,
} from './IRenameConfig';

export { DEFAULT_RENAME_CONFIG, SEPARATOR_OPTIONS, NAME_ORDER_OPTIONS } from './IRenameConfig';

// Contract extraction interfaces
export type {
  IContractData,
  IContractExtractionResult,
  IBatchExtractionResult,
  ICsvExportOptions,
} from './IContractData';

export type {
  IContractExtractor,
  IPdfTextAdapter,
  IContractExtractorRegistry,
} from './IContractExtractor';

// DI (Declaração de Importação) interfaces
export type {
  IDiData,
  IDiExtractionResult,
  IReconciliationContract,
  IReconciliationSummary,
} from './IDiData';

// Excel merge interfaces
export type {
  IExcelMergeFile,
  IExcelMergeResult,
  IExcelMergeConfig,
  IHeaderExtractionResult,
} from './IExcelMergeData';
