import type { ConnectionStatus } from '@/types';

interface ConnectionWarningProps {
  connectionStatus: ConnectionStatus;
}

/**
 * ConnectionWarning Component
 * 
 * Displays a tactical-themed warning banner when backend connection is lost.
 * Appears at the top of the screen with animation.
 */
export function ConnectionWarning({ connectionStatus }: ConnectionWarningProps) {
  if (connectionStatus.isConnected) {
    return null;
  }

  return (
    <div className="fixed top-14 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div className="flex items-center gap-3 bg-red-950/95 backdrop-blur-lg border border-red-500/50 px-6 py-3 shadow-[0_0_30px_rgba(220,38,38,0.3)] animate-pulse pointer-events-auto">
        {/* Warning Icon */}
        <div className="w-8 h-8 flex items-center justify-center border border-red-500/50 bg-red-900/30">
          <i className="fa-solid fa-triangle-exclamation text-red-500 text-lg animate-pulse"></i>
        </div>
        
        {/* Warning Text */}
        <div className="flex flex-col">
          <span className="text-xs font-bold text-red-400 uppercase tracking-[0.3em]">
            CONNECTION LOST
          </span>
          <span className="text-[10px] text-red-300/70 font-mono tracking-wider">
            {connectionStatus.errorMessage || 'Backend bağlantısı kesildi'}
          </span>
        </div>
        
        {/* Decorative Elements */}
        <div className="ml-4 flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></div>
          <span className="text-[9px] text-red-400/80 font-mono uppercase tracking-wider">
            RETRY...
          </span>
        </div>

        {/* Corner Brackets */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-red-500/50"></div>
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-red-500/50"></div>
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-red-500/50"></div>
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-red-500/50"></div>
      </div>
    </div>
  );
}

export default ConnectionWarning;
