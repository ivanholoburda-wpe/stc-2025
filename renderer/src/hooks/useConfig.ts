import { useState, useEffect } from 'react';

interface ConfigState {
  isOffline: boolean;
  loading: boolean;
}

/**
 * Хук для отримання конфігурації застосунку (наприклад, режиму офлайн).
 * @returns Поточний стан конфігурації.
 */
export const useConfig = (): ConfigState => {
  const [isOffline, setIsOffline] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchConfig() {
      try {
        if (window.configAPI) {
          const offlineStatus = await window.configAPI.isOfflineMode();
          setIsOffline(offlineStatus);
        } else {
          console.warn('configAPI not found. Assuming online mode.');
          setIsOffline(false);
        }
      } catch (error) {
        console.error('Failed to fetch configuration:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchConfig();
  }, []);

  return { isOffline, loading };
};