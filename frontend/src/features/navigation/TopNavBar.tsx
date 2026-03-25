import { Link, useLocation, useNavigate } from 'react-router-dom';
import authService from '@/services/authService';

/**
 * Route configuration for navigation tabs
 * Maps paths to display labels
 */
const navItems = [
  { path: "/map", label: "HARİTA" },
  { path: "/telemetry", label: "CANLI AKIŞ" },
  { path: "/analysis", label: "ANALİZ" },
  { path: "/assets", label: "BİRİM DURUMU" },
  { path: "/tasks", label: "GÖREVLER" },
  { path: "/ai", label: "AI ASİSTAN" },
  { path: "/alerts", label: "UYARILAR" },
];

export function TopNavBar() {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active path - check if current path starts with nav item path
  const isActive = (path: string) => {
    if (path === '/map') {
      return location.pathname === '/' || location.pathname === '/map';
    }
    if (path === '/assets') {
      return location.pathname.startsWith('/assets');
    }
    if (path === '/ai') {
      return location.pathname === '/ai' || location.pathname.startsWith('/ai/');
    }
    return location.pathname === path;
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 border-b border-tactical-border/30 bg-[#0f172a]/95 backdrop-blur-sm z-50 pointer-events-auto flex items-center justify-between px-6 shadow-sm font-sans">
      {/* Left: Logo */}
      <div className="flex items-center gap-3 w-64">
        <Link to="/map" className="group">
          <h1 className="text-2xl font-black tracking-wider text-white uppercase leading-none font-sans italic group-hover:text-sky-400 transition-colors">
            SINAPS
          </h1>
        </Link>
      </div>

      {/* Center: Navigation - Technical Tabs with Router Links */}
      <nav className="flex-1 flex justify-center">
        <ul className="flex items-center gap-1 bg-slate-800/30 p-1 rounded-sm border border-slate-700/30 backdrop-blur-md">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`
                    px-6 py-1.5 text-xs font-bold tracking-widest transition-all rounded-sm uppercase block
                    ${active
                      ? 'bg-sky-600/90 text-white shadow-sm border border-sky-400/50'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 border border-transparent'}
                  `}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 w-60 justify-end">
        {/* Profile */}
        <Link
          to="/profile"
          className={`w-9 h-9 flex items-center justify-center bg-slate-800/30 border border-slate-700 text-slate-400 hover:text-sky-400 hover:bg-slate-700 transition-colors rounded-sm group ${
            location.pathname === '/profile' ? 'bg-sky-500/20 text-sky-400 border-sky-500' : ''
          }`}
          title="Profil"
        >
          <i className="fa-solid fa-user"></i>
        </Link>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-9 h-9 flex items-center justify-center bg-slate-800/30 border border-slate-700 text-slate-400 hover:text-red-400 hover:border-red-500/30 transition-all rounded-sm"
          title="Çıkış Yap"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
          </svg>
        </button>
      </div>
    </header>
  );
}
