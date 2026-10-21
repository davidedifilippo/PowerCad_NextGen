import { Doc } from '../model/types';

export interface FileSaveResult {
  success: boolean;
  fileName?: string;
  handle?: FileSystemFileHandle | null;
  error?: string;
}

export interface FileOpenResult {
  success: boolean;
  doc?: Doc;
  fileName?: string;
  handle?: FileSystemFileHandle | null;
  error?: string;
}

/**
 * Checks if the browser supports the modern File System Access API
 */
export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'showSaveFilePicker' in window && 'showOpenFilePicker' in window;
}

/**
 * Sanitizes a filename and ensures it has the requested extension (.json or .pwrcad)
 */
export function sanitizeFileName(name: string, ext: '.json' | '.pwrcad' = '.json'): string {
  let clean = name.trim().replace(/[\\/:*?"<>|]/g, '_');
  if (!clean) {
    clean = 'Schema_senza_titolo';
  }
  if (!clean.toLowerCase().endsWith('.json') && !clean.toLowerCase().endsWith('.pwrcad')) {
    clean += ext;
  }
  return clean;
}

/**
 * Saves a Doc using the native File System Access API dialog (showSaveFilePicker)
 * or falls back to standard browser Blob download.
 */
export async function saveDocWithPicker(
  doc: Doc,
  suggestedName: string = 'Schema_senza_titolo.json',
  preferredExt: '.json' | '.pwrcad' = '.json'
): Promise<FileSaveResult> {
  const jsonContent = JSON.stringify(doc, null, 2);
  const cleanName = sanitizeFileName(suggestedName, preferredExt);

  // 1. Try modern File System Access API
  if (isFileSystemAccessSupported()) {
    try {
      const options: any = {
        suggestedName: cleanName,
        types: [
          {
            description: 'File Schema PowerCAD JSON (*.json)',
            accept: { 'application/json': ['.json'] },
          },
          {
            description: 'File Progetto PowerCAD (*.pwrcad)',
            accept: { 'application/octet-stream': ['.pwrcad'] },
          },
        ],
      };

      const handle: FileSystemFileHandle = await (window as any).showSaveFilePicker(options);
      const writable = await (handle as any).createWritable();
      await writable.write(jsonContent);
      await writable.close();

      return {
        success: true,
        fileName: handle.name,
        handle,
      };
    } catch (err: any) {
      // If user aborted / clicked cancel, return cancelled
      if (err.name === 'AbortError') {
        return { success: false, error: 'Salvataggio annullato dall\'utente.' };
      }
      console.warn('showSaveFilePicker error, falling back to download blob:', err);
      // Fallback to blob download below
    }
  }

  // 2. Fallback: Browser download via Blob
  try {
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = cleanName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 150);

    return {
      success: true,
      fileName: cleanName,
      handle: null,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Errore durante il salvataggio del file.',
    };
  }
}

/**
 * Saves a Doc directly to an existing FileSystemFileHandle without prompting the user.
 */
export async function saveDocToHandle(doc: Doc, handle: FileSystemFileHandle): Promise<FileSaveResult> {
  try {
    const jsonContent = JSON.stringify(doc, null, 2);
    const writable = await (handle as any).createWritable();
    await writable.write(jsonContent);
    await writable.close();

    return {
      success: true,
      fileName: handle.name,
      handle,
    };
  } catch (err: any) {
    console.error('Error writing to existing file handle:', err);
    return {
      success: false,
      error: err?.message || 'Impossibile aggiornare il file aperto.',
    };
  }
}

/**
 * Opens a Doc using the native File System Access API dialog (showOpenFilePicker)
 * or falls back to file input element.
 */
export async function openDocWithPicker(): Promise<FileOpenResult> {
  if (isFileSystemAccessSupported()) {
    try {
      const options: any = {
        multiple: false,
        types: [
          {
            description: 'File Schema PowerCAD (*.json, *.pwrcad)',
            accept: {
              'application/json': ['.json', '.pwrcad'],
            },
          },
        ],
      };

      const [handle]: FileSystemFileHandle[] = await (window as any).showOpenFilePicker(options);
      const file = await (handle as any).getFile();
      const text = await file.text();
      const doc = JSON.parse(text) as Doc;

      if (!doc.elements || !doc.wires) {
        return {
          success: false,
          error: 'Il file selezionato non è uno schema PowerCAD valido.',
        };
      }

      return {
        success: true,
        doc,
        fileName: handle.name,
        handle,
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { success: false, error: 'Apertura annullata.' };
      }
      return {
        success: false,
        error: err?.message || 'Errore durante la lettura del file.',
      };
    }
  }

  return {
    success: false,
    error: 'La selezione file avanzata non è supportata dal browser corrente.',
  };
}
