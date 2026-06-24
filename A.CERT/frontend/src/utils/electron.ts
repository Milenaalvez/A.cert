// Check if app is running inside Electron
export function isElectron(): boolean {
  return typeof window !== 'undefined' && !!(window as any).electronAPI?.isElectron;
}

// Get Electron API
export function getElectronAPI() {
  return typeof window !== 'undefined' ? (window as any).electronAPI : null;
}
