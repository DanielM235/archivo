import type {
  IExcelMergeFile,
  IExcelMergeResult,
  IExcelMergeConfig,
} from '../interfaces/IExcelMergeData';
import * as XLSX from 'xlsx';

/**
 * Service to merge multiple Excel files into a single file
 */
export class ExcelMergerService {
  /**
   * Merge multiple Excel files into a single file
   */
  async mergeFiles(
    files: File[],
    config: IExcelMergeConfig,
    onProgress?: (current: number, total: number) => void
  ): Promise<IExcelMergeResult> {
    const fileResults: IExcelMergeFile[] = files.map((file) => ({
      file,
      sheetName: config.targetSheetName,
      status: 'pending',
    }));

    const allRows: unknown[][] = [];
    let headerRow: unknown[] | null = null;
    let successCount = 0;
    let errorCount = 0;

    try {
      // Process each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file) continue;

        const fileResult = fileResults[i];
        if (!fileResult) continue;

        fileResult.status = 'processing';

        if (onProgress) {
          onProgress(i + 1, files.length);
        }

        try {
          // Read file as ArrayBuffer
          const arrayBuffer = await file.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });

          // Get the target sheet (case-insensitive)
          let sheetName = config.targetSheetName;
          if (sheetName) {
            // Find sheet name case-insensitively
            const foundSheet = workbook.SheetNames.find(
              (name) => name.toLowerCase() === sheetName!.toLowerCase()
            );
            sheetName = foundSheet || workbook.SheetNames[0];
          } else {
            // Use first sheet if no target specified
            sheetName = workbook.SheetNames[0];
          }

          if (!sheetName) {
            throw new Error(`No sheets found in file "${file.name}"`);
          }

          const worksheet = workbook.Sheets[sheetName];
          if (!worksheet) {
            throw new Error(`Sheet "${sheetName}" not found in file "${file.name}"`);
          }

          // Convert sheet to array of arrays
          const sheetData = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
            header: 1,
            defval: '',
            raw: false,
          });

          if (sheetData.length === 0) {
            throw new Error(`Sheet "${sheetName}" is empty in file "${file.name}"`);
          }

          // Extract header from first file and detect if it has margins
          let extractedRowCount = 0;

          if (headerRow === null && sheetData[0]) {
            // Check if first file has existing margins (empty first row and/or column)
            const hasTopMargin = sheetData[0].every(
              (cell) => cell === '' || cell === null || cell === undefined
            );

            if (hasTopMargin && sheetData.length > 1) {
              // First row is empty, check second row for left margin
              const secondRow = sheetData[1];
              if (!secondRow) {
                throw new Error(`File "${file.name}" has empty top margin but no data`);
              }

              const hasLeftMargin =
                secondRow[0] === '' || secondRow[0] === null || secondRow[0] === undefined;

              if (hasLeftMargin) {
                // File already has both margins - extract header without margins
                headerRow = secondRow.slice(1);
                // Get data rows starting from row 3, without left margin
                const dataRows = sheetData
                  .slice(2)
                  .map((row) => row.slice(1))
                  .filter((row) => {
                    return row.some((cell) => cell !== '' && cell !== null && cell !== undefined);
                  });
                allRows.push(...dataRows);
                extractedRowCount = dataRows.length;
              } else {
                // File has only top margin - extract header from second row
                headerRow = secondRow;
                // Get data rows starting from row 3
                const dataRows = sheetData.slice(2).filter((row) => {
                  return row.some((cell) => cell !== '' && cell !== null && cell !== undefined);
                });
                allRows.push(...dataRows);
                extractedRowCount = dataRows.length;
              }
            } else {
              // Check if first row has left margin only
              const hasLeftMargin =
                sheetData[0] &&
                (sheetData[0][0] === '' ||
                  sheetData[0][0] === null ||
                  sheetData[0][0] === undefined);

              if (hasLeftMargin) {
                // File has only left margin - extract header without it
                headerRow = sheetData[0].slice(1);
                // Get data rows without left margin
                const dataRows = sheetData
                  .slice(1)
                  .map((row) => row.slice(1))
                  .filter((row) => {
                    return row.some((cell) => cell !== '' && cell !== null && cell !== undefined);
                  });
                allRows.push(...dataRows);
                extractedRowCount = dataRows.length;
              } else {
                // No margins - extract header as-is
                headerRow = sheetData[0];
                // Get data rows starting from row 2
                const dataRows = sheetData.slice(1).filter((row) => {
                  return row.some((cell) => cell !== '' && cell !== null && cell !== undefined);
                });
                allRows.push(...dataRows);
                extractedRowCount = dataRows.length;
              }
            }
          } else {
            // For subsequent files, skip first row (header) and extract data
            // Also handle margins in subsequent files
            let startRow = 1;
            let leftColumnOffset = 0;

            // Check if file has top margin
            if (
              sheetData[0] &&
              sheetData[0].every((cell) => cell === '' || cell === null || cell === undefined)
            ) {
              startRow = 2; // Skip empty first row
            }

            // Check if file has left margin in the first data row
            const firstDataRow = sheetData[startRow];
            if (
              firstDataRow &&
              (firstDataRow[0] === '' || firstDataRow[0] === null || firstDataRow[0] === undefined)
            ) {
              leftColumnOffset = 1; // Skip empty first column
            }

            // Extract data rows, removing margins if present
            const dataRows = sheetData
              .slice(startRow)
              .map((row) => (leftColumnOffset > 0 ? row.slice(leftColumnOffset) : row))
              .filter((row) => {
                return row.some((cell) => cell !== '' && cell !== null && cell !== undefined);
              });

            allRows.push(...dataRows);
            extractedRowCount = dataRows.length;
          }

          fileResult.status = 'completed';
          fileResult.rowCount = extractedRowCount;
          successCount++;
        } catch (error) {
          fileResult.status = 'error';
          fileResult.error =
            error instanceof Error ? error.message : 'Unknown error processing file';
          errorCount++;
        }
      }

      // Check if we have any data
      if (headerRow === null || allRows.length === 0) {
        return {
          success: false,
          totalFiles: files.length,
          successCount,
          errorCount,
          totalRows: 0,
          fileResults,
          error: 'No data was extracted from the files',
        };
      }

      // Create merged workbook
      const mergedData: unknown[][] = [];

      // Add margins if configured
      if (config.includeMargins !== false) {
        // Empty row for top margin
        mergedData.push(['']);

        // Header row with left margin
        mergedData.push(['', ...headerRow]);

        // Data rows with left margin
        for (const row of allRows) {
          mergedData.push(['', ...row]);
        }
      } else {
        // No margins
        mergedData.push(headerRow);
        mergedData.push(...allRows);
      }

      // Create workbook and sheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(mergedData);

      // Add the sheet to the workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, config.outputSheetName);

      // Generate Excel buffer
      const excelBuffer = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'array',
      });

      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      return {
        success: true,
        blob,
        totalFiles: files.length,
        successCount,
        errorCount,
        totalRows: allRows.length,
        fileResults,
      };
    } catch (error) {
      return {
        success: false,
        totalFiles: files.length,
        successCount,
        errorCount,
        totalRows: allRows.length,
        fileResults,
        error: error instanceof Error ? error.message : 'Unknown error during merge',
      };
    }
  }

  /**
   * Generate file name for the merged Excel file
   */
  generateFileName(sheetName: string): string {
    const date = new Date().toISOString().split('T')[0];
    const sanitized = this.sanitizeFileName(sheetName);
    return `merged_${sanitized}_${date}.xlsx`;
  }

  /**
   * Sanitize string for use in file name
   */
  private sanitizeFileName(name: string): string {
    return name
      .replace(/[<>:"/\\|?*]/g, '')
      .replace(/\s+/g, '_')
      .toLowerCase()
      .substring(0, 50);
  }

  /**
   * Get available sheet names from an Excel file
   */
  async getSheetNames(file: File): Promise<string[]> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      return workbook.SheetNames;
    } catch (error) {
      throw new Error(
        `Failed to read sheet names: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
