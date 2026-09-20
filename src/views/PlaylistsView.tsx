import React from 'react';
import { Layers } from 'lucide-react';
import { Playlist, Episode } from '../types';
import { PlaylistCard } from '../components/PlaylistCard';

interface PlaylistsViewProps {
  playlists: Playlist[];
  episodes: Episode[];
  onSelectPlaylist: (playlist: Playlist) => void;
}

export const PlaylistsView: React.FC<PlaylistsViewProps> = ({
  playlists,
  episodes,
  onSelectPlaylist,
}) => {
  const publishedPlaylists = playlists.filter(p => p.published);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-[#13141c] p-6 rounded-2xl border border-white/5 space-y-2">
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Layers className="w-6 h-6 text-amber-500" />
          All Curated Playlists
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400">
          Browse themed vault collections of India Got Latent bonus material and backstage archives.
        </p>
      </div>

      {/* Grid */}
      {publishedPlaylists.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {publishedPlaylists.map((pl) => {
            const count = episodes.filter(e => e.playlistId === pl.id && e.published).length;
            return (
              <PlaylistCard
                key={pl.id}
                playlist={pl}
                episodeCount={count}
                onSelect={onSelectPlaylist}
              />
            );
          })}
        </div>
      ) : (
        <div className="p-16 text-center bg-[#13141c] rounded-2xl border border-white/5 text-zinc-400">
          No playlists available.
        </div>
      )}
    </div>
  );
};
