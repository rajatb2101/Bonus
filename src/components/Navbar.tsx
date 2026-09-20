import React from 'react';
import { Film, Search, Shield, PlayCircle, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  currentView: 'home' | 'playlists' | 'playlist' | 'watch' | 'search' | 'admin';
  onNavigate: (view: 'home' | 'playlists' | 'playlist' | 'watch' | 'search' | 'admin', id?: string) => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  searchQuery = '',
  onSearchChange,
}) => {
  const { user, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[#0c0d12]/95 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand Logo & Name */}
          <button
            id="nav-brand-logo"
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3 group text-left cursor-pointer focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-red-600 to-rose-700 flex items-center justify-center text-white shadow-lg shadow-red-900/30 group-hover:scale-105 transition-transform">
              <Film className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-white uppercase group-hover:text-amber-400 transition-colors">
                  India Got Latent
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">
                  Bonus
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-medium tracking-wide hidden sm:block">
                Exclusive Episodes & Uncut Stage Performances
              </p>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <button
              id="nav-link-home"
              onClick={() => onNavigate('home')}
              className={`px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                currentView === 'home'
                  ? 'text-white bg-white/10 font-semibold'
                  : 'text-zinc-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Featured
            </button>
            <button
              id="nav-link-playlists"
              onClick={() => onNavigate('playlists')}
              className={`px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                currentView === 'playlists' || currentView === 'playlist'
                  ? 'text-white bg-white/10 font-semibold'
                  : 'text-zinc-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Playlists
            </button>
          </nav>

          {/* Search bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative flex-1 max-w-xs sm:w-64">
              <input
                id="nav-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  if (onSearchChange) onSearchChange(e.target.value);
                  if (currentView !== 'search') onNavigate('search');
                }}
                onFocus={() => {
                  if (currentView !== 'search') onNavigate('search');
                }}
                placeholder="Search episodes, roasts..."
                className="w-full bg-zinc-900/90 border border-white/10 rounded-full pl-9 pr-4 py-1.5 text-xs sm:text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/80 transition-all"
              />
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            {/* Mobile hamburger */}
            <button
              id="nav-mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-zinc-400 hover:text-white cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-white/10 flex flex-col gap-2">
            <button
              onClick={() => {
                onNavigate('home');
                setMobileMenuOpen(false);
              }}
              className="px-3 py-2 text-left text-sm text-zinc-200 hover:bg-white/5 rounded-md"
            >
              Home / Featured
            </button>
            <button
              onClick={() => {
                onNavigate('playlists');
                setMobileMenuOpen(false);
              }}
              className="px-3 py-2 text-left text-sm text-zinc-200 hover:bg-white/5 rounded-md"
            >
              All Playlists
            </button>
            <button
              onClick={() => {
                onNavigate('search');
                setMobileMenuOpen(false);
              }}
              className="px-3 py-2 text-left text-sm text-zinc-200 hover:bg-white/5 rounded-md"
            >
              Search
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
