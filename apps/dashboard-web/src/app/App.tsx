import { useState } from 'react';
import { TopNavBar, type ActiveView } from '@/features/navigation/TopNavBar';
import { RightControlPanel } from '@/features/control/RightControlPanel';
import { AssetStatusPage } from '@/features/assets/pages/AssetStatusPage';
import { AlertsPage } from '@/features/alerts/pages/AlertsPage';
import { MapPlaceholder } from '@/features/map/pages/MapPlaceholder';

export function App() {
  const [activeView, setActiveView] = useState<ActiveView>("map");

  return (
    <div className="h-screen w-screen bg-slate-900 flex overflow-hidden relative">
      {/* Top Navigation Bar - Sol Üstte */}
      <TopNavBar activeView={activeView} onChangeView={setActiveView} />

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden relative">
          {/* Harita - Her zaman arka planda */}
          {activeView === "map" && (
            <div className="absolute inset-0">
              <MapPlaceholder />
            </div>
          )}

          {/* Sayfalar - Harita üzerinde overlay olarak */}
          {activeView === "assets" && (
            <div className="absolute inset-0 z-40 bg-slate-900">
              <AssetStatusPage />
            </div>
          )}

          {activeView === "alerts" && (
            <div className="absolute inset-0 z-40 bg-slate-900">
              <AlertsPage />
            </div>
          )}
        </div>

        {/* Right Control Panel */}
        <RightControlPanel />
      </div>
    </div>
  );
}
