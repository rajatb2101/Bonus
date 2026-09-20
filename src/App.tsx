import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { HomeView } from './views/HomeView';
import { PlaylistView } from './views/PlaylistView';
import { PlaylistsView } from './views/PlaylistsView';
import { WatchView } from './views/WatchView';
import { SearchView } from './views/SearchView';
import { AdminView } from './views/AdminView';
import { Playlist, Episode } from './types';
import { getPlaylists, getEpisodes, seedInitialDataIfEmpty, INITIAL_PLAYLISTS, INITIAL_EPISODES } from './firebase/db';
import { Film, AlertCircle, RefreshCw } from 'lucide-react';

function AppContent() {
  const [currentView, setCurrentView] = useState<'home' | 'playlists' | 'playlist' | 'watch' | 'search' | 'admin'>('home');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [playlists, setPlaylists] = useState<Playlist[]>(INITIAL_PLAYLISTS);
  const [episodes, setEpisodes] = useState<Episode[]>(INITIAL_EPISODES);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load Firestore data
  const loadData = useCallback(async () => {
    setLoadingData(true);
    setLoadError(null);
    try {
      // Seed if database is empty on first boot
      await seedInitialDataIfEmpty();

      const [pls, eps] = await Promise.all([
        getPlaylists(false), // Fetch all; views filter by published status
        getEpisodes(undefined, false)
      ]);

      if (pls && pls.length > 0) setPlaylists(pls);
      if (eps && eps.length > 0) setEpisodes(eps);
    } catch (err: any) {
      console.warn('Failed to load database content, serving initial catalogue:', err);
      setPlaylists(INITIAL_PLAYLISTS);
      setEpisodes(INITIAL_EPISODES);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // URL routing synchronization: supports /admin pathname and hash navigation
  useEffect(() => {
    const syncRouteFromUrl = () => {
      const pathname = window.location.pathname.toLowerCase().replace(/\/+$/, '');
      const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();

      if (pathname === '/admin' || hash === 'admin') {
        setCurrentView('admin');
      } else if (hash.startsWith('watch/')) {
        const epId = hash.replace('watch/', '');
        setSelectedEpisodeId(epId);
        setCurrentView('watch');
      } else if (hash.startsWith('playlist/')) {
        const plId = hash.replace('playlist/', '');
        setSelectedPlaylistId(plId);
        setCurrentView('playlist');
      } else if (hash === 'playlists' || pathname === '/playlists') {
        setCurrentView('playlists');
      } else if (hash === 'search' || pathname === '/search') {
        setCurrentView('search');
      } else {
        setCurrentView('home');
      }
    };

    syncRouteFromUrl();
    window.addEventListener('hashchange', syncRouteFromUrl);
    window.addEventListener('popstate', syncRouteFromUrl);
    return () => {
      window.removeEventListener('hashchange', syncRouteFromUrl);
      window.removeEventListener('popstate', syncRouteFromUrl);
    };
  }, []);

  // Update dynamic page title
  useEffect(() => {
    if (currentView === 'watch' && selectedEpisodeId) {
      const ep = episodes.find(e => e.id === selectedEpisodeId);
      if (ep) {
        document.title = `${ep.title} — India Got Latent Bonus Episodes`;
        return;
      }
    }
    if (currentView === 'playlist' && selectedPlaylistId) {
      const pl = playlists.find(p => p.id === selectedPlaylistId);
      if (pl) {
        document.title = `${pl.title} — India Got Latent Bonus Episodes`;
        return;
      }
    }
    if (currentView === 'admin') {
      document.title = 'Admin Console — India Got Latent Bonus Episodes';
      return;
    }
    document.title = 'India Got Latent Bonus Episodes — Exclusive Stage Performances';
  }, [currentView, selectedEpisodeId, selectedPlaylistId, episodes, playlists]);

  // Navigation handlers
  const handleNavigate = (view: 'home' | 'playlists' | 'playlist' | 'watch' | 'search' | 'admin', id?: string) => {
    if (view === 'watch' && id) {
      setSelectedEpisodeId(id);
      window.location.hash = `watch/${id}`;
    } else if (view === 'playlist' && id) {
      setSelectedPlaylistId(id);
      window.location.hash = `playlist/${id}`;
    } else if (view === 'admin') {
      if (window.location.pathname !== '/admin') {
        window.history.pushState(null, '', '/admin');
      }
      window.location.hash = 'admin';
    } else if (view === 'playlists') {
      if (window.location.pathname === '/admin') {
        window.history.pushState(null, '', '/');
      }
      window.location.hash = 'playlists';
    } else if (view === 'search') {
      if (window.location.pathname === '/admin') {
        window.history.pushState(null, '', '/');
      }
      window.location.hash = 'search';
    } else {
      if (window.location.pathname === '/admin') {
        window.history.pushState(null, '', '/');
      }
      window.location.hash = 'home';
    }
    setCurrentView(view);
  };

  const handleSelectEpisode = (episode: Episode) => {
    handleNavigate('watch', episode.id);
  };

  const handleSelectPlaylist = (playlist: Playlist) => {
    handleNavigate('playlist', playlist.id);
  };

  const activeEpisode = episodes.find(e => e.id === selectedEpisodeId) || episodes.filter(e => e.published)[0];
  const activePlaylist = playlists.find(p => p.id === selectedPlaylistId);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-zinc-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      {/* Top Navigation */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {loadingData && episodes.length === 0 ? (
          <div className="py-24 text-center space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin mx-auto" />
            <p className="text-sm font-semibold text-zinc-400">
              Connecting to Firestore & Loading Streaming Episodes...
            </p>
          </div>
        ) : loadError ? (
          <div className="p-8 bg-red-950/40 border border-red-500/30 rounded-2xl text-center space-y-3 max-w-lg mx-auto my-12">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
            <h3 className="text-base font-bold text-white">Connection Error</h3>
            <p className="text-xs text-red-200">{loadError}</p>
            <button
              onClick={loadData}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg cursor-pointer inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        ) : (
          <>
            {currentView === 'home' && (
              <HomeView
                playlists={playlists}
                episodes={episodes}
                onSelectEpisode={handleSelectEpisode}
                onSelectPlaylist={handleSelectPlaylist}
                onViewAllPlaylists={() => handleNavigate('playlists')}
              />
            )}

            {currentView === 'playlists' && (
              <PlaylistsView
                playlists={playlists}
                episodes={episodes}
                onSelectPlaylist={handleSelectPlaylist}
              />
            )}

            {currentView === 'playlist' && activePlaylist && (
              <PlaylistView
                playlist={activePlaylist}
                episodes={episodes}
                onSelectEpisode={handleSelectEpisode}
                onBack={() => handleNavigate('home')}
              />
            )}

            {currentView === 'watch' && activeEpisode && (
              <WatchView
                episode={activeEpisode}
                allEpisodes={episodes}
                playlist={playlists.find(p => p.id === activeEpisode.playlistId) || null}
                onSelectEpisode={handleSelectEpisode}
                onBack={() => handleNavigate('home')}
              />
            )}

            {currentView === 'search' && (
              <SearchView
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                episodes={episodes}
                onSelectEpisode={handleSelectEpisode}
              />
            )}

            {currentView === 'admin' && (
              <AdminView
                playlists={playlists}
                episodes={episodes}
                onRefreshData={loadData}
                onClose={() => handleNavigate('home')}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#090a0e] py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-amber-500 flex items-center justify-center text-black font-extrabold text-[10px]">
              IGL
            </div>
            <span className="font-bold text-zinc-300">India Got Latent Bonus Episodes</span>
            <span>•</span>
            <span>Decoupled CDN Streaming Platform</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[11px] text-zinc-500">
              Firebase Firestore Backend • Cloudflare R2 / CDN Compatible
            </span>
            <button
              onClick={() => handleNavigate('admin')}
              className="text-zinc-400 hover:text-amber-400 cursor-pointer font-medium"
            >
              Admin Access
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
