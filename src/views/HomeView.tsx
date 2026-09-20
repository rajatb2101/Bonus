import React from 'react';
import { Play, Sparkles, Film, ArrowRight, Layers } from 'lucide-react';
import { Episode, Playlist } from '../types';
import { EpisodeCard } from '../components/EpisodeCard';
import { PlaylistCard } from '../components/PlaylistCard';

interface HomeViewProps {
  playlists: Playlist[];
  episodes: Episode[];
  onSelectEpisode: (episode: Episode) => void;
  onSelectPlaylist: (playlist: Playlist) => void;
  onViewAllPlaylists: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  playlists,
  episodes,
  onSelectEpisode,
  onSelectPlaylist,
  onViewAllPlaylists,
}) => {
  // Published episodes sorted by order/date
  const publishedEpisodes = episodes.filter(e => e.published);
  const featuredEpisode = publishedEpisodes[0] || null;
  const recentEpisodes = publishedEpisodes.slice(0, 8);
  const publishedPlaylists = playlists.filter(p => p.published);

  return (
    <div className="space-y-12 pb-16">
      {/* Cinematic Hero Spotlight Banner */}
      {featuredEpisode ? (
        <section className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-r from-zinc-950 via-zinc-900 to-black border border-white/10 shadow-2xl">
          <div className="absolute inset-0">
            <img
              src={featuredEpisode.thumbnailUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1600&q=80'}
              alt={featuredEpisode.title}
              className="w-full h-full object-cover object-center opacity-35 scale-105 transform hover:scale-100 transition-transform duration-1000 filter brightness-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c0d12] via-[#0c0d12]/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0c0d12] via-[#0c0d12]/80 to-transparent" />
          </div>

          <div className="relative max-w-4xl px-6 sm:px-10 py-12 sm:py-20 flex flex-col justify-end min-h-[380px] sm:min-h-[440px]">
            {/* Spotlight Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-amber-500 text-black flex items-center gap-1.5 shadow-lg shadow-amber-500/30">
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                Featured Premiere
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/10 text-zinc-300 border border-white/15">
                EP {featuredEpisode.episodeNumber}
              </span>
              {featuredEpisode.playlistTitle && (
                <span className="text-xs text-amber-300/90 font-medium">
                  {featuredEpisode.playlistTitle}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight drop-shadow-lg mb-4">
              {featuredEpisode.title}
            </h1>

            {/* Description */}
            <p className="text-sm sm:text-base text-zinc-300 max-w-2xl line-clamp-3 mb-8 font-normal leading-relaxed">
              {featuredEpisode.description}
            </p>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-4">
              <button
                id="hero-watch-btn"
                onClick={() => onSelectEpisode(featuredEpisode)}
                className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-sm tracking-wide shadow-xl shadow-amber-500/25 transition-all transform hover:scale-105 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                Stream Episode Now
              </button>

              {featuredEpisode.duration && (
                <span className="text-xs text-zinc-400 font-medium px-3 py-2 rounded-lg bg-black/40 border border-white/10 backdrop-blur-md">
                  Runtime: {featuredEpisode.duration}
                </span>
              )}
            </div>
          </div>
        </section>
      ) : (
        <section className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-br from-[#12131b] via-[#101117] to-black border border-white/10 p-8 sm:p-14 text-center">
          <div className="max-w-2xl mx-auto space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-amber-500/20 border border-amber-500/40 text-amber-300">
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              Official Bonus Vault
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              India Got Latent
            </h1>
            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed font-normal">
              Exclusive uncut auditions, savage roasts, green-room banter, and full unedited performances.
            </p>
            <div className="pt-2 flex items-center justify-center gap-2 text-xs text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>New bonus episodes premiering soon</span>
            </div>
          </div>
        </section>
      )}

      {/* Latest Bonus Episodes Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              Latest Bonus Episodes
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
              Uncut auditions, unhinged roasts, and extended panel deliberations
            </p>
          </div>
          <span className="text-xs font-semibold text-zinc-400 hidden sm:block">
            {recentEpisodes.length} {recentEpisodes.length === 1 ? 'Episode' : 'Episodes'}
          </span>
        </div>

        {recentEpisodes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {recentEpisodes.map((ep) => (
              <EpisodeCard key={ep.id} episode={ep} onSelect={onSelectEpisode} />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-[#13141c] rounded-xl border border-white/5 text-zinc-400 text-sm">
            Episodes are being prepared and will appear here as soon as they are uploaded.
          </div>
        )}
      </section>

      {/* Curated Playlists Section */}
      {publishedPlaylists.length > 0 && (
        <section className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-500" />
                Curated Playlists
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                Browse complete collections and themed backstage vault series
              </p>
            </div>
            {publishedPlaylists.length > 3 && (
              <button
                onClick={onViewAllPlaylists}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

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
        </section>
      )}
    </div>
  );
};
