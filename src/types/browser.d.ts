// Browser APIs not (yet) in TypeScript's DOM library.

interface FileSystemHandlePermissionDescriptor {
  mode?: 'read' | 'readwrite';
}

interface FileSystemHandle {
  queryPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
  requestPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
}

interface FilePickerAcceptType {
  description?: string;
  accept: Record<string, string[]>;
}

interface FilePickerOptions {
  types?: FilePickerAcceptType[];
  excludeAcceptAllOption?: boolean;
  id?: string;
}

interface Window {
  showOpenFilePicker(options?: FilePickerOptions & { multiple?: boolean }): Promise<FileSystemFileHandle[]>;
  showSaveFilePicker(options?: FilePickerOptions & { suggestedName?: string }): Promise<FileSystemFileHandle>;
  launchQueue?: {
    setConsumer(consumer: (params: { files: readonly FileSystemHandle[] }) => void): void;
  };
}

declare const __APP_VERSION__: string;
