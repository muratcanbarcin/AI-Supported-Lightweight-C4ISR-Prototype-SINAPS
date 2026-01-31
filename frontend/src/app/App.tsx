import { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';

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

// Hooks
import { useAlerts } from '@/hooks/useAlerts';
import { useAssets } from '@/hooks/useAssets';

// Services
import authService from '@/services/authService';

// Types
import type { ConnectionStatus, AlertItem } from '@/types';

// ============================================================
// Global State Context
// ============================================================

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

// ============================================================
// Global Poller Component
// ============================================================

/**
 * GlobalPoller runs at the top level to ensure background polling
 * continues regardless of which page/route is active.
 */
function GlobalPoller({ children }: { children: React.ReactNode }) {
  // Poll alerts globally - this runs even when not on AlertsPage
  const { alerts, connectionStatus: alertsConnectionStatus } = useAlerts({
    pollingInterval: 5000,
    enabled: true,
  });

  // Poll assets globally for connection status
  const { connectionStatus: assetsConnectionStatus } = useAssets({
    pollingInterval: 3000,
    enabled: true,
  });

  // Combine connection statuses - if either is disconnected, show warning
  const connectionStatus: ConnectionStatus = {
    isConnected: alertsConnectionStatus.isConnected && assetsConnectionStatus.isConnected,
    lastChecked: new Date(),
    errorMessage: alertsConnectionStatus.errorMessage || assetsConnectionStatus.errorMessage,
  };

  return (
    <>
      {/* Global Connection Warning - Always visible at top when disconnected */}
      <ConnectionWarning connectionStatus={connectionStatus} />

      {/* Provide global state to children */}
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

// ============================================================
// Main Layout Component
// ============================================================

function MainLayout() {
  const navigate = useNavigate();

  // Handler for opening asset profile (used by Map and AssetStatus pages)
  const handleOpenProfile = (assetId: string) => {
    navigate(`/assets/${assetId}`);
  };

  // Handler for focusing asset on map
  const handleFocusAsset = (assetId: string) => {
    navigate(`/map?focus=${assetId}`);
  };

  return (
    <div className="h-screen w-screen bg-tactical-bg flex overflow-hidden relative font-sans">
      {/* Top Navigation Bar - Fixed at top */}
      <TopNavBar />

      {/* Main Layout Container */}
      <div className="flex-1 flex overflow-hidden pt-16">
        {/* Main Content Area with Routes */}
        <div className="flex-1 overflow-hidden relative">
          <Routes>
            {/* Default redirect to map */}
            <Route path="/" element={<Navigate to="/map" replace />} />

            {/* Map View */}
            <Route
              path="/map"
              element={
                <div className="absolute inset-0 z-0">
                  <MapView onOpenProfile={handleOpenProfile} />
                </div>
              }
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

            {/* Profile */}
            <Route
              path="/profile"
              element={
                <div className="absolute inset-0 z-40 bg-slate-900">
                  <ProfilePage onOpenProfile={handleOpenProfile} />
                </div>
              }
            />

            {/* Fallback - 404 */}
            <Route path="*" element={<Navigate to="/map" replace />} />
          </Routes>
        </div>

        {/* Right Control Panel - Always visible */}
        <RightControlPanel />
      </div>
    </div>
  );
}

// ============================================================
// Asset Profile Wrapper (for dynamic route params)
// ============================================================

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

// ============================================================
// Protected Route Wrapper
// ============================================================

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());

  useEffect(() => {
    // Listen for auth changes
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

// ============================================================
// App Entry Point
// ============================================================

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
                window.location.href = '/map';
              }}
            />
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
