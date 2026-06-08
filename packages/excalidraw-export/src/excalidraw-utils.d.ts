declare module '@excalidraw/utils' {
  export function exportToBlob(options: {
    elements: ReadonlyArray<unknown>;
    appState?: Record<string, unknown>;
    files?: Record<string, unknown> | null;
    mimeType?: string;
  }): Promise<Blob>;
}
