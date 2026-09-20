import React from 'react';
import { ArrowLeft, Play, Layers, Clock } from 'lucide-react';
import { Playlist, Episode } from '../types';
import { EpisodeCard } from '../components/EpisodeCard';

interface PlaylistViewProps {
  playlist: Playlist;
  episodes: Episode[];
  onSelectEpisode: (episode: Episode) => void;
  onBack: () => void;
}

export const PlaylistView: React.FC<PlaylistViewProps> = ({
  playlist,
  episodes,
  onSelectEpisode,
  onBack,
}) => {
  // Ordered published episodes
  const playlistEpisodes = episodes
    .filter(e => e.playlistId === playlist.id && e.published)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const firstEpisode = playlistEpisodes[0];

  return (
    <div className="space-y-8 pb-16">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home / Playlists
      </button>

      {/* Playlist Hero Header */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-zinc-950 via-zinc-900 to-black border border-white/10 p-6 sm:p-8 flex flex-col md:flex-row gap-6 items-start md:items-center">
        {/* Playlist Cover Art */}
        <div className="relative w-full md:w-72 aspect-video md:aspect-[4/3] rounded-xl overflow-hidden shrink-0 border border-white/10 shadow-xl">
          <img
            src={playlist.thumbnailUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80'}
            alt={playlist.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-3 bg-black/80 px-2.5 py-1 rounded text-xs font-bold text-amber-400 border border-white/10 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            {playlistEpisodes.length} Episodes
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 space-y-3">
          <div className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Curated Playlist
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {playlist.title}
          </h1>
          {playlist.description && (
            <p className="text-sm text-zinc-300 leading-relaxed max-w-2xl">
              {playlist.description}
            </p>
          )}

          {firstEpisode && (
            <div className="pt-2">
              <button
                id="play-all-episodes-btn"
                onClick={() => onSelectEpisode(firstEpisode)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs tracking-wide shadow-lg shadow-amber-500/20 transition-all transform hover:scale-105 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                Play All (Start Episode 1)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Ordered List of Episodes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>Episodes in this Playlist</span>
            <span className="text-xs font-normal text-zinc-400">
              (Order defined by curators)
            </span>
          </h2>
          <span className="text-xs font-semibold text-zinc-400">
            {playlistEpisodes.length} {playlistEpisodes.length === 1 ? 'Episode' : 'Episodes'}
          </span>
        </div>

        {playlistEpisodes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {playlistEpisodes.map((ep) => (
              <EpisodeCard key={ep.id} episode={ep} onSelect={onSelectEpisode} />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-[#13141c] rounded-xl border border-white/5 text-zinc-400">
            No published episodes in this playlist yet.
          </div>
        )}
      </div>
    </div>
  );
};
