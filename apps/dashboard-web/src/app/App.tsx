import { useState } from 'react';
import { TopNavBar, type ActiveView } from '@/features/navigation/TopNavBar';
import { RightControlPanel } from '@/features/control/RightControlPanel';
import { AssetStatusPage } from '@/features/assets/pages/AssetStatusPage';
import { AlertsPage } from '@/features/alerts/pages/AlertsPage';
import { TasksPage } from '@/features/tasks/pages/TasksPage';
import { AIPage } from '@/features/ai/pages/AIPage';
import { ProfilePage } from '@/features/profile/pages/ProfilePage';
import { AssetProfilePage } from '@/features/assets/pages/AssetProfilePage';
import { MapView } from '@/features/map';
import { LoginPage } from '@/features/auth/LoginPage';

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeView, setActiveView] = useState<ActiveView>("map");
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  if (!isAuthenticated) {
    return <LoginPage onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="h-screen w-screen bg-tactical-bg flex overflow-hidden relative font-sans">
      {/* Top Navigation Bar - Sol Üstte */}
      <TopNavBar activeView={activeView} onChangeView={setActiveView} />

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden relative">
          {/* Harita - Her zaman arka planda */}

          {activeView === "map" && (
            <div className="absolute inset-0 z-0">
              {/* @ts-ignore - props will be added next */}
              <MapView onOpenProfile={(id) => { setSelectedAssetId(id); setActiveView("asset-profile"); }} />
            </div>
          )}

          {/* Sayfalar - Harita üzerinde overlay olarak */}
          {activeView === "assets" && (
            <div className="absolute inset-0 z-40 bg-slate-900">
              {/* @ts-ignore - props will be added next */}
              <AssetStatusPage onOpenProfile={(id) => { setSelectedAssetId(id); setActiveView("asset-profile"); }} />
            </div>
          )}

          {activeView === "alerts" && (
            <div className="absolute inset-0 z-40 bg-slate-900">
              <AlertsPage />
            </div>
          )}

          {activeView === "tasks" && (
            <div className="absolute inset-0 z-40 bg-slate-900">
              <TasksPage />
            </div>
          )}

          {activeView === "ai" && (
            <div className="absolute inset-0 z-40 bg-slate-900">
              <AIPage />
            </div>
          )}

          {activeView === "profile" && (
            <div className="absolute inset-0 z-40 bg-slate-900">
              {/* @ts-ignore */}
              <ProfilePage onOpenProfile={(id) => { setSelectedAssetId(id); setActiveView("asset-profile"); }} />
            </div>
          )}

          {activeView === "asset-profile" && selectedAssetId && (
            <div className="absolute inset-0 z-40 bg-slate-900">
              <AssetProfilePage
                assetId={selectedAssetId}
                onBack={() => setActiveView("map")}
                onFocusAsset={(id) => {
                  setSelectedAssetId(id);
                  setActiveView("map");
                }}
              />
            </div>
          )}
        </div>

        {/* Right Control Panel */}
        <RightControlPanel />
      </div>
    </div>
  );
}
