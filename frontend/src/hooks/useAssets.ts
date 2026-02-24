import { useState, useEffect, useCallback, useRef } from 'react';
import telemetryService from '@/services/telemetryService';
import type { AssetSummary, MapAsset, ConnectionStatus } from '@/types';



/**
 * Polling interval in milliseconds (2 seconds for real-time feel)
 */
const POLLING_INTERVAL = 2000;

/**
 * Maximum consecutive errors before showing connection lost
 */
const MAX_CONSECUTIVE_ERRORS = 3;

interface UseAssetsOptions {
  pollingInterval?: number;
  enabled?: boolean;
}

interface UseAssetsResult {
  assets: AssetSummary[];
  mapAssets: MapAsset[];
  isLoading: boolean;
  error: Error | null;
  connectionStatus: ConnectionStatus;
  refetch: () => Promise<void>;
}

/**
 * useAssets Hook
 * 
 * Polls /telemetry/latest endpoint every 2 seconds to provide
 * real-time asset data. Shows empty state if backend is unavailable.
 */
export function useAssets(options: UseAssetsOptions = {}): UseAssetsResult {
  const {
    pollingInterval = POLLING_INTERVAL,
    enabled = true
  } = options;

  const [assets, setAssets] = useState<AssetSummary[]>([]);
  const [mapAssets, setMapAssets] = useState<MapAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: true,
    lastChecked: new Date()
  });
  
  const consecutiveErrorsRef = useRef(0);
  const isMountedRef = useRef(true);

  const fetchAssets = useCallback(async () => {
    if (!enabled) return;
    
    try {
      // Fetch from backend
      const [assetData, mapData] = await Promise.all([
        telemetryService.getAssetSummaries(),
        telemetryService.getMapAssets()
      ]);
      
      if (!isMountedRef.current) return;
      
      // Use backend data (may be empty — that's OK)
      setAssets(assetData);
      setMapAssets(mapData);
      
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
      
      console.warn(`[useAssets] Fetch error (${consecutiveErrorsRef.current}/${MAX_CONSECUTIVE_ERRORS}):`, err);
      
      // Only show error if consecutive failures exceed threshold
      if (consecutiveErrorsRef.current >= MAX_CONSECUTIVE_ERRORS) {
        setError(err instanceof Error ? err : new Error('Bağlantı hatası'));
        setConnectionStatus({
          isConnected: false,
          lastChecked: new Date(),
          errorMessage: 'Backend bağlantısı kesildi'
        });
      }
      
      // Keep last known data on transient error
      // (assets stay as-is, no fake data injected)
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [enabled, assets.length]);

  // Initial fetch
  useEffect(() => {
    isMountedRef.current = true;
    fetchAssets();
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Polling
  useEffect(() => {
    if (!enabled) return;
    
    const intervalId = setInterval(fetchAssets, pollingInterval);
    
    return () => clearInterval(intervalId);
  }, [enabled, pollingInterval, fetchAssets]);

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
    assets,
    mapAssets,
    isLoading,
    error,
    connectionStatus,
    refetch: fetchAssets
  };
}

export default useAssets;
