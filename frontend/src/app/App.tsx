/**
 * =============================================================================
 * SINAPS C4ISR Application
 * =============================================================================
 * 
 * Main application entry point with React Router v6/v7 compatible routing.
 * 
 * Routes:
 * - /         -> Dashboard (connection status, asset count)
 * - /map      -> MapComponent (main tactical view)
 * - /assets   -> Asset list
 * - /alerts   -> Alerts page
 * - /login    -> Authentication
 */

import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams, useSearchParams, NavLink } from 'react-router-dom';

// Layout Components
import { TopNavBar } from '@/features/navigation/TopNavBar';
import { RightControlPanel } from '@/features/control/RightControlPanel';
import { ConnectionWarning } from '@/features/control/ConnectionWarning';

// Page Components
import { MapView } from '@/features/map';
import { AssetStatusPage } from '@/features/assets/pages/AssetStatusPage';
import { AssetProfilePage } from '@/features/assets/pages/AssetProfilePage';
import { AlertsPage } from '@/features/alerts/pages/AlertsPage';
import { TasksPage } from '@/features/tasks/pages/TasksPage';
import { AIPage } from '@/features/ai/pages/AIPage';
import { TelemetryPage } from '@/features/telemetry/pages/TelemetryPage';
import { AnalysisPage } from '@/features/analysis/pages/AnalysisPage';
import { ProfilePage } from '@/features/profile/pages/ProfilePage';
import { LoginPage } from '@/features/auth/LoginPage';
import { AdminLayout } from '@/features/admin/AdminLayout';
import { AssetRegistry } from '@/features/admin/AssetRegistry';
import { UserManagement } from '@/features/admin/UserManagement';
import { AdminDashboard } from '@/features/admin/AdminDashboard';
import { SystemHealth } from '@/features/admin/SystemHealth';

// Services
import { checkHealth, fetchLatestTelemetry } from '@/services/api';
import authService from '@/services/authService';

// Types
import type { ConnectionStatus, AlertItem, Telemetry } from '@/types';

// Hooks
import { useAlerts } from '@/hooks/useAlerts';
import { useAssets } from '@/hooks/useAssets';

// =============================================================================
// GLOBAL STATE CONTEXT
// =============================================================================

interface GlobalState {
  connectionStatus: ConnectionStatus;
  alerts: AlertItem[];
  alertCount: number;
  isAuthenticated: boolean;
  logout: () => void;
}

const GlobalStateContext = createContext<GlobalState | null>(null);

export function useGlobalState() {
  const context = useContext(GlobalStateContext);
  if (!context) {
    throw new Error('useGlobalState must be used within GlobalStateProvider');
  }
  return context;
}

// =============================================================================
// GLOBAL POLLER - Background data fetching
// =============================================================================

function GlobalPoller({ children }: { children: React.ReactNode }) {
  const { alerts, connectionStatus: alertsConnectionStatus } = useAlerts({
    pollingInterval: 5000,
    enabled: true,
  });

  const { connectionStatus: assetsConnectionStatus } = useAssets({
    pollingInterval: 3000,
    enabled: true,
  });

  const connectionStatus: ConnectionStatus = {
    isConnected: alertsConnectionStatus.isConnected && assetsConnectionStatus.isConnected,
    lastChecked: new Date(),
    errorMessage: alertsConnectionStatus.errorMessage || assetsConnectionStatus.errorMessage,
  };

  return (
    <>
      <ConnectionWarning connectionStatus={connectionStatus} />
      <GlobalStateContext.Provider
        value={{
          connectionStatus,
          alerts,
          alertCount: alerts.length,
          isAuthenticated: true,
          logout: () => {
            authService.logout();
            window.location.href = '/login';
          },
        }}
      >
        {children}
      </GlobalStateContext.Provider>
    </>
  );
}

// =============================================================================
// DASHBOARD COMPONENT - Shows connection status and asset count
// =============================================================================

function Dashboard() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [assetCount, setAssetCount] = useState<number>(0);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkConnection = useCallback(async () => {
    setIsLoading(true);
    try {
      const healthy = await checkHealth();
      setIsConnected(healthy);

      if (healthy) {
        const telemetry = await fetchLatestTelemetry();
        setAssetCount(telemetry.length);
      }
    } catch {
      setIsConnected(false);
    } finally {
      setIsLoading(false);
      setLastCheck(new Date());
    }
  }, []);

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 10000);
    return () => clearInterval(interval);
  }, [checkConnection]);

  return (
    <div className="absolute inset-0 z-40 bg-slate-900 p-8 overflow-auto">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">
          SINAPS C4ISR Dashboard
        </h1>

        {/* Connection Status Card */}
        <div className="bg-slate-800 rounded-xl p-6 mb-6 border border-slate-700">
          <h2 className="text-lg font-semibold text-slate-300 mb-4">
            Bağlantı Durumu
          </h2>

          <div className="flex items-center gap-4">
            {/* Status Indicator */}
            <div className={`
              w-16 h-16 rounded-full flex items-center justify-center
              ${isLoading ? 'bg-slate-700 animate-pulse' :
                isConnected ? 'bg-emerald-500/20' : 'bg-red-500/20'}
            `}>
              <div className={`
                w-8 h-8 rounded-full
                ${isLoading ? 'bg-slate-500' :
                  isConnected ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' :
                    'bg-red-500 shadow-lg shadow-red-500/50'}
              `} />
            </div>

            <div>
              <p className={`text-2xl font-bold ${isConnected ? 'text-emerald-400' : 'text-red-400'
                }`}>
                {isLoading ? 'Kontrol ediliyor...' :
                  isConnected ? 'BAĞLANTI BAŞARILI' : 'BAĞLANTI YOK'}
              </p>
              <p className="text-slate-400 text-sm">
                Backend: http://localhost:8080/api/v1
              </p>
              {lastCheck && (
                <p className="text-slate-500 text-xs mt-1">
                  Son kontrol: {lastCheck.toLocaleTimeString('tr-TR')}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={checkConnection}
            disabled={isLoading}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 
                       text-white rounded-lg transition-colors text-sm"
          >
            {isLoading ? 'Kontrol ediliyor...' : 'Tekrar Kontrol Et'}
          </button>
        </div>

        {/* Asset Count Card */}
        <div className="bg-slate-800 rounded-xl p-6 mb-6 border border-slate-700">
          <h2 className="text-lg font-semibold text-slate-300 mb-4">
            Aktif Varlıklar
          </h2>

          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold text-cyan-400">
              {assetCount}
            </span>
            <span className="text-slate-400">adet asset takip ediliyor</span>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-4">
          <NavLink
            to="/map"
            className="bg-slate-800 hover:bg-slate-700 rounded-xl p-6 border border-slate-700 
                       transition-colors group"
          >
            <div className="text-2xl mb-2">🗺️</div>
            <h3 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors">
              Harita Görünümü
            </h3>
            <p className="text-slate-400 text-sm mt-1">
              Taktik harita ve varlık takibi
            </p>
          </NavLink>

          <NavLink
            to="/assets"
            className="bg-slate-800 hover:bg-slate-700 rounded-xl p-6 border border-slate-700 
                       transition-colors group"
          >
            <div className="text-2xl mb-2">📊</div>
            <h3 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors">
              Varlık Listesi
            </h3>
            <p className="text-slate-400 text-sm mt-1">
              Tüm varlıkların detaylı listesi
            </p>
          </NavLink>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN LAYOUT
// =============================================================================

function MainLayout() {
  const navigate = useNavigate();

  const handleOpenProfile = (assetId: string) => {
    navigate(`/assets/${assetId}`);
  };

  const handleFocusAsset = (assetId: string) => {
    navigate(`/map?focus=${assetId}`);
  };

  return (
    <div className="h-screen w-screen bg-tactical-bg flex overflow-hidden relative font-sans">
      {/* Top Navigation Bar */}
      <TopNavBar />

      {/* Main Layout Container */}
      <div className="flex-1 flex overflow-hidden pt-16">
        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden relative">
          <Routes>
            {/* Dashboard - Connection status and asset count */}
            <Route path="/" element={<Dashboard />} />

            {/* Map View */}
            <Route
              path="/map"
              element={<MapViewWrapper onOpenProfile={handleOpenProfile} />}
            />

            {/* Telemetry / Live Feed */}
            <Route
              path="/telemetry"
              element={
                <div className="absolute inset-0 z-40 bg-slate-900">
                  <TelemetryPage />
                </div>
              }
            />

            {/* Analysis */}
            <Route
              path="/analysis"
              element={
                <div className="absolute inset-0 z-40 bg-slate-900">
                  <AnalysisPage />
                </div>
              }
            />

            {/* Asset Status List */}
            <Route
              path="/assets"
              element={
                <div className="absolute inset-0 z-40 bg-slate-900">
                  <AssetStatusPage onOpenProfile={handleOpenProfile} />
                </div>
              }
            />

            {/* Asset Profile - Dynamic Route */}
            <Route
              path="/assets/:assetId"
              element={<AssetProfileWrapper onFocusAsset={handleFocusAsset} />}
            />

            {/* Alerts */}
            <Route
              path="/alerts"
              element={
                <div className="absolute inset-0 z-40 bg-slate-900">
                  <AlertsPage />
                </div>
              }
            />

            {/* Tasks */}
            <Route
              path="/tasks"
              element={
                <div className="absolute inset-0 z-40 bg-slate-900">
                  <TasksPage />
                </div>
              }
            />

            {/* AI Assistant */}
            <Route
              path="/ai"
              element={
                <div className="absolute inset-0 z-40 bg-slate-900">
                  <AIPage />
                </div>
              }
            />
            <Route
              path="/ai/:sessionId"
              element={
                <div className="absolute inset-0 z-40 bg-slate-900">
                  <AIPage />
                </div>
              }
            />

            {/* Profile */}
            <Route
              path="/profile"
              element={
                <div className="absolute inset-0 z-40 bg-slate-900">
                  <ProfilePage onOpenProfile={handleOpenProfile} />
                </div>
              }
            />

            {/* Fallback - Redirect to Dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>

        {/* Right Control Panel */}
        <RightControlPanel />
      </div>
    </div>
  );
}

// =============================================================================
// ASSET PROFILE WRAPPER
// =============================================================================

function AssetProfileWrapper({ onFocusAsset }: { onFocusAsset: (id: string) => void }) {
  const navigate = useNavigate();
  const { assetId } = useParams<{ assetId: string }>();

  if (!assetId) {
    return <Navigate to="/assets" replace />;
  }

  return (
    <div className="absolute inset-0 z-40 bg-slate-900">
      <AssetProfilePage
        assetId={assetId}
        onBack={() => navigate(-1)}
        onFocusAsset={onFocusAsset}
      />
    </div>
  );
}

// =============================================================================
// MAP VIEW WRAPPER (reads ?focus=assetId from URL)
// =============================================================================

function MapViewWrapper({ onOpenProfile }: { onOpenProfile: (id: string) => void }) {
  const [searchParams] = useSearchParams();
  const focusId = searchParams.get('focus');

  return (
    <div className="absolute inset-0 z-0">
      <MapView onOpenProfile={onOpenProfile} focusedAssetId={focusId} />
    </div>
  );
}

// =============================================================================
// PROTECTED ROUTE
// =============================================================================

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());

  useEffect(() => {
    const handleLogout = () => setIsAuthenticated(false);
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  if (!isAuthenticated) {
    return <LoginPage onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <GlobalPoller>
      {children}
    </GlobalPoller>
  );
}

// =============================================================================
// ADMIN ROUTE
// =============================================================================

function AdminRoute({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());
  const [isAdmin, setIsAdmin] = useState(authService.isAdmin());

  useEffect(() => {
    const handleLogout = () => {
      setIsAuthenticated(false);
      setIsAdmin(false);
    };
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <GlobalPoller>
      {children}
    </GlobalPoller>
  );
}

// =============================================================================
// APP ENTRY POINT
// =============================================================================

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login Route (public) */}
        <Route
          path="/login"
          element={
            <LoginPage
              onLogin={() => {
                window.location.href = '/';
              }}
            />
          }
        />

        {/* Admin Panel Routes */}
        <Route
          path="/admin/*"
          element={
            <AdminRoute>
              <Routes>
                <Route element={<AdminLayout />}>
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="assets" element={<AssetRegistry />} />
                  <Route path="users" element={<UserManagement />} />
                  <Route path="system" element={<SystemHealth />} />
                  <Route index element={<Navigate to="dashboard" />} />
                </Route>
              </Routes>
            </AdminRoute>
          }
        />

        {/* All other routes are protected */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
