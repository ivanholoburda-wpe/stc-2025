import {Snapshot} from "./snapshot";

export interface ParsingResult {
  success: boolean,
  data: any,
  message: string,
}

/**
 * Інтерфейс для моделі пристрою, що надходить із бекенду.
 */
export interface Device {
  id: number;
  hostname: string;
  model?: string;
  firstSeenSnapshot?: {
    id: number;
    created_at: string;
    root_folder_path: string;
  };
}

/**
 * Універсальний інтерфейс для результату виклику API.
 */
export interface APIResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Інтерфейс, що визначає функції, доступні через `window.electronAPI`.
 */
interface ElectronAPI {
  runParsing: () => Promise<ParsingResult>;
  getDevices: () => Promise<APIResult<Device[]>>;
  getAllSnapshots: () => Promise<APIResult<Snapshot[]>>;
  createDevice: (device: { hostname: string; model?: string }) => Promise<APIResult<Device>>;
  analyzeSnapshot: (snapshotId: number, prompt: string) => Promise<APIResult<string>>;
}

/**
 * Інтерфейс, що визначає функції, доступні через `window.configAPI`.
 */
interface ConfigAPI {
  isOfflineMode: () => Promise<boolean>;
  getAiModelKey: () => Promise<string | null>;
}

/**
 * Оголошення глобального інтерфейсу Window для додавання об'єктів electronAPI та configAPI.
 */
declare global {
  interface Window {
    electronAPI: ElectronAPI;
    configAPI: ConfigAPI;
  }
}