// Type declarations for file-saver
declare module "file-saver" {
  export function saveAs(blob: Blob, filename: string): void;
  export function saveAs(url: string, filename: string): void;
}
