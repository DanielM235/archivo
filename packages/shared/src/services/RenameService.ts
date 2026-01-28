import type { IRenameConfig, IRenameFileInfo, IRenameResult } from '../interfaces/IRenameConfig';
import { DateUtils } from '../utils/date.utils';
import { StringUtils } from '../utils/string.utils';
import { FileUtils } from '../utils/file.utils';
import { ZipUtils } from '../utils/zip.utils';

/**
 * Service for handling file rename operations
 * Uses static methods for easier testing and mocking
 */
export class RenameService {
  /**
   * Validate the rename configuration
   * @param config - The rename configuration to validate
   * @returns Validation result with isValid flag and optional error message
   */
  static validateConfig(config: IRenameConfig): { isValid: boolean; error?: string } {
    // Validate custom name if provided
    const customNameValidation = StringUtils.validateCustomName(config.customName);
    if (!customNameValidation.isValid) {
      return {
        isValid: false,
        error: `Invalid custom name: ${customNameValidation.error}`,
      };
    }

    return { isValid: true };
  }

  /**
   * Generate a new filename based on the rename configuration
   * @param fileInfo - The file information
   * @param config - The rename configuration
   * @returns The new filename (with extension)
   */
  static generateNewFilename(fileInfo: IRenameFileInfo, config: IRenameConfig): string {
    const { targetDateFormat, nameOrder, separator, customName } = config;

    // Use extracted date or fall back to today
    const date = fileInfo.extractedDate || new Date();
    const formattedDate = DateUtils.formatDate(date, targetDateFormat);

    // Use custom name if provided and valid, otherwise use extracted name or original name
    let name: string;
    if (customName?.trim() && StringUtils.isValidCustomName(customName)) {
      name = customName.trim();
    } else {
      name = fileInfo.extractedName || fileInfo.nameWithoutExtension;
    }
    const sanitizedName = StringUtils.sanitizeFilename(name);

    // Build the new filename based on order
    let newNameWithoutExt: string;
    if (nameOrder === 'date-name') {
      newNameWithoutExt = StringUtils.joinWithSeparator([formattedDate, sanitizedName], separator);
    } else {
      newNameWithoutExt = StringUtils.joinWithSeparator([sanitizedName, formattedDate], separator);
    }

    // Add extension back
    const extension = fileInfo.extension;
    return extension ? `${newNameWithoutExt}.${extension}` : newNameWithoutExt;
  }

  /**
   * Preview the rename operation - calculate new names without actually renaming
   * @param files - Array of files to rename
   * @param config - The rename configuration
   * @returns Updated array with new names calculated
   */
  static previewRename(files: IRenameFileInfo[], config: IRenameConfig): IRenameFileInfo[] {
    // First validate the config
    const configValidation = this.validateConfig(config);
    if (!configValidation.isValid) {
      // Return all files with the config error
      return files.map((file) => ({
        ...file,
        newName: null,
        error: configValidation.error,
      }));
    }

    const usedNames = new Set<string>();

    return files.map((file) => {
      try {
        // Extract date from original filename
        const extracted = DateUtils.extractDateFromFilename(
          file.nameWithoutExtension,
          config.sourceDateFormat
        );

        const updatedFile: IRenameFileInfo = {
          ...file,
          extractedDate: extracted?.date || null,
          extractedName: extracted?.remainingName || file.nameWithoutExtension,
        };

        // Generate new filename
        let newName = this.generateNewFilename(updatedFile, config);

        // Ensure uniqueness
        newName = FileUtils.generateUniqueFilename(newName, usedNames);
        usedNames.add(newName);

        // Validate the new filename
        const validation = FileUtils.validateFilename(newName);
        if (!validation.isValid) {
          return {
            ...updatedFile,
            newName: null,
            error: validation.error,
          };
        }

        return {
          ...updatedFile,
          newName,
          error: undefined,
        };
      } catch (error) {
        return {
          ...file,
          newName: null,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });
  }

  /**
   * Execute the rename operation on a zip file
   * @param sourceFile - The source zip file
   * @param files - Array of file info with new names
   * @returns Promise resolving to the rename result
   */
  static async executeRename(
    sourceFile: File | string,
    files: IRenameFileInfo[]
  ): Promise<IRenameResult> {
    try {
      const adapter = ZipUtils.getAdapter();
      const entries: { name: string; data: ArrayBuffer | Uint8Array }[] = [];
      let renamedCount = 0;
      let errorCount = 0;

      // Process files in batches to manage memory
      const BATCH_SIZE = 10;
      for (let i = 0; i < files.length; i += BATCH_SIZE) {
        const batch = files.slice(i, i + BATCH_SIZE);

        const batchPromises = batch.map(async (file) => {
          if (!file.newName) {
            errorCount++;
            return null;
          }

          try {
            const data = await adapter.extractEntry(sourceFile, file.originalPath);
            renamedCount++;
            return {
              name: file.newName,
              data,
            };
          } catch (error) {
            errorCount++;
            console.error(`Error extracting file ${file.originalPath}:`, error);
            return null;
          }
        });

        const results = await Promise.all(batchPromises);
        results.forEach((result) => {
          if (result) {
            entries.push(result);
          }
        });
      }

      // Create the output zip
      const outputBlob = await adapter.createZip(entries);

      return {
        success: true,
        renamedCount,
        errorCount,
        outputBlob,
      };
    } catch (error) {
      return {
        success: false,
        renamedCount: 0,
        errorCount: files.length,
        error: error instanceof Error ? error.message : 'Unknown error during rename operation',
      };
    }
  }

  /**
   * Process a folder and get file information
   * @param fileHandles - Array of file handles (from File System Access API)
   * @returns Promise resolving to array of file info
   */
  static async processFolder(fileHandles: FileSystemFileHandle[]): Promise<IRenameFileInfo[]> {
    const files: IRenameFileInfo[] = [];

    for (const handle of fileHandles) {
      try {
        const file = await handle.getFile();
        const extension = StringUtils.getExtension(file.name);
        const nameWithoutExtension = StringUtils.getNameWithoutExtension(file.name);

        files.push({
          id: crypto.randomUUID(),
          originalName: file.name,
          originalPath: file.name,
          extension,
          size: file.size,
          nameWithoutExtension,
          newName: null,
        });
      } catch (error) {
        console.error(`Error processing file handle:`, error);
      }
    }

    return files;
  }

  /**
   * Process a zip file and get file information
   * @param file - The zip file
   * @returns Promise resolving to array of file info
   */
  static async processZipFile(file: File): Promise<IRenameFileInfo[]> {
    const adapter = ZipUtils.getAdapter();
    const entries = await adapter.readZipEntries(file);
    return ZipUtils.entriesToFileInfo(entries);
  }
}
