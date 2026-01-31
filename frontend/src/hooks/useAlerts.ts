import { useState, useEffect, useCallback, useRef } from 'react';
import alarmService from '@/services/alarmService';
import type { AlertItem, ConnectionStatus } from '@/types';

// Import mock data as fallback
import { mockAlerts as fallbackAlerts } from '@/services/mockData';

/**
 * Polling interval in milliseconds (5 seconds for alerts is sufficient)
 */
const POLLING_INTERVAL = 5000;

/**
 * Maximum consecutive errors before showing connection lost
 */
const MAX_CONSECUTIVE_ERRORS = 3;

interface UseAlertsOptions {
  pollingInterval?: number;
  enabled?: boolean;
}

interface UseAlertsResult {
  alerts: AlertItem[];
  isLoading: boolean;
  error: Error | null;
  connectionStatus: ConnectionStatus;
  acknowledgeAlert: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * useAlerts Hook
 * 
 * Polls /alarms/active endpoint to provide real-time alert data.
 * Falls back to mock data if backend is unavailable.
 */
export function useAlerts(options: UseAlertsOptions = {}): UseAlertsResult {
  const {
    pollingInterval = POLLING_INTERVAL,
    enabled = true
  } = options;

  const [alerts, setAlerts] = useState<AlertItem[]>(fallbackAlerts);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: true,
    lastChecked: new Date()
  });
  
  const consecutiveErrorsRef = useRef(0);
  const isMountedRef = useRef(true);

  const fetchAlerts = useCallback(async () => {
    if (!enabled) return;
    
    try {
      const alertData = await alarmService.getAlerts();
      
      if (!isMountedRef.current) return;
      
      // Use backend data if available
      if (alertData.length > 0) {
        setAlerts(alertData);
      } else {
        // Keep fallback if no data from backend
        setAlerts(fallbackAlerts);
      }
      
      // Reset error state on success
      consecutiveErrorsRef.current = 0;
      setError(null);
      setConnectionStatus({
        isConnected: true,
        lastChecked: new Date()
      });
      
    } catch (err) {
      if (!isMountedRef.current) return;
      
      consecutiveErrorsRef.current += 1;
      
      console.warn(`[useAlerts] Fetch error (${consecutiveErrorsRef.current}/${MAX_CONSECUTIVE_ERRORS}):`, err);
      
      // Only show error if consecutive failures exceed threshold
      if (consecutiveErrorsRef.current >= MAX_CONSECUTIVE_ERRORS) {
        setError(err instanceof Error ? err : new Error('Bağlantı hatası'));
        setConnectionStatus({
          isConnected: false,
          lastChecked: new Date(),
          errorMessage: 'Backend bağlantısı kesildi'
        });
      }
      
      // Keep using fallback/last known data
      if (alerts.length === 0) {
        setAlerts(fallbackAlerts);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [enabled, alerts.length]);

  const acknowledgeAlert = useCallback(async (id: string) => {
    try {
      await alarmService.acknowledgeAlarm(id);
      // Remove from local state
      setAlerts(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error('[useAlerts] Failed to acknowledge alert:', err);
      throw err;
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    isMountedRef.current = true;
    fetchAlerts();
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Polling
  useEffect(() => {
    if (!enabled) return;
    
    const intervalId = setInterval(fetchAlerts, pollingInterval);
    
    return () => clearInterval(intervalId);
  }, [enabled, pollingInterval, fetchAlerts]);

  // Listen for connection events
  useEffect(() => {
    const handleConnectionLost = () => {
      setConnectionStatus({
        isConnected: false,
        lastChecked: new Date(),
        errorMessage: 'Backend bağlantısı kesildi'
      });
    };
    
    window.addEventListener('api:connection_lost', handleConnectionLost);
    
    return () => {
      window.removeEventListener('api:connection_lost', handleConnectionLost);
    };
  }, []);

  return {
    alerts,
    isLoading,
    error,
    connectionStatus,
    acknowledgeAlert,
    refetch: fetchAlerts
  };
}

export default useAlerts;
