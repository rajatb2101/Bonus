import React, { useEffect } from 'react';
import { ArrowLeft, Play, Clock, Folder, ChevronRight, Share2, Check } from 'lucide-react';
import { Episode, Playlist } from '../types';
import { VideoPlayer } from '../components/VideoPlayer';

interface WatchViewProps {
  episode: Episode;
  allEpisodes: Episode[];
  playlist?: Playlist | null;
  onSelectEpisode: (episode: Episode) => void;
  onBack: () => void;
}

export const WatchView: React.FC<WatchViewProps> = ({
  episode,
  allEpisodes,
  playlist,
  onSelectEpisode,
  onBack,
}) => {
  const [copied, setCopied] = React.useState(false);

  // Filter episodes belonging to the current playlist (or all if no playlist)
  const playlistEpisodes = allEpisodes
    .filter(e => e.playlistId === episode.playlistId && e.published)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const currentIndex = playlistEpisodes.findIndex(e => e.id === episode.id);
  const previousEpisode = currentIndex > 0 ? playlistEpisodes[currentIndex - 1] : null;
  const nextEpisode = currentIndex < playlistEpisodes.length - 1 ? playlistEpisodes[currentIndex + 1] : null;

  // Scroll to top on episode change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [episode.id]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Breadcrumb navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Browse
        </button>

        <button
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-900 border border-white/10 hover:border-amber-500/50 text-xs font-medium text-zinc-300 hover:text-white transition-all cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Link Copied</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Episode</span>
            </>
          )}
        </button>
      </div>

      {/* Main Player & Playlist Sidebar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Player & Metadata (2 columns on large screens) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Professional Video Player */}
          <VideoPlayer
            episode={episode}
            hasPrevious={Boolean(previousEpisode)}
            hasNext={Boolean(nextEpisode)}
            onPrevious={() => previousEpisode && onSelectEpisode(previousEpisode)}
            onNext={() => nextEpisode && onSelectEpisode(nextEpisode)}
          />

          {/* Episode Info Header */}
          <div className="space-y-4 bg-[#13141c] p-6 rounded-2xl border border-white/5 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md text-xs font-black tracking-wider uppercase bg-amber-500 text-black">
                  EPISODE {episode.episodeNumber}
                </span>
                {episode.playlistTitle && (
                  <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                    <Folder className="w-3.5 h-3.5" />
                    {episode.playlistTitle}
                  </span>
                )}
              </div>

              {episode.duration && (
                <span className="text-xs text-zinc-400 flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  {episode.duration}
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
              {episode.title}
            </h1>

            {/* Description */}
            {episode.description && (
              <div className="pt-2 border-t border-white/10 text-sm text-zinc-300 leading-relaxed space-y-2">
                <p>{episode.description}</p>
              </div>
            )}

            {/* Next / Previous Quick Jump bar */}
            <div className="pt-4 flex items-center justify-between border-t border-white/10 gap-3">
              {previousEpisode ? (
                <button
                  onClick={() => onSelectEpisode(previousEpisode)}
                  className="flex-1 text-left p-3 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-white/5 hover:border-amber-500/30 transition-all cursor-pointer"
                >
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">
                    ← Previous Episode
                  </span>
                  <span className="text-xs font-bold text-zinc-200 line-clamp-1 mt-0.5">
                    EP {previousEpisode.episodeNumber}: {previousEpisode.title}
                  </span>
                </button>
              ) : (
                <div className="flex-1" />
              )}

              {nextEpisode && (
                <button
                  onClick={() => onSelectEpisode(nextEpisode)}
                  className="flex-1 text-right p-3 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-white/5 hover:border-amber-500/30 transition-all cursor-pointer"
                >
                  <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block">
                    Next Episode →
                  </span>
                  <span className="text-xs font-bold text-zinc-200 line-clamp-1 mt-0.5">
                    EP {nextEpisode.episodeNumber}: {nextEpisode.title}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Playlist Episode Queue */}
        <div className="space-y-4">
          <div className="bg-[#13141c] p-5 rounded-2xl border border-white/5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="font-bold text-base text-white tracking-tight">
                  Playlist Queue
                </h3>
                <p className="text-xs text-zinc-400 truncate max-w-[200px]">
                  {playlist?.title || episode.playlistTitle || 'Bonus Episodes'}
                </p>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white/10 text-zinc-300">
                {currentIndex + 1} / {playlistEpisodes.length}
              </span>
            </div>

            {/* Scrollable list of episodes */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {playlistEpisodes.map((ep, idx) => {
                const isCurrent = ep.id === episode.id;
                return (
                  <div
                    key={ep.id}
                    onClick={() => !isCurrent && onSelectEpisode(ep)}
                    className={`flex items-center gap-3 p-2.5 rounded-xl transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-amber-500/15 border border-amber-500/40 text-white'
                        : 'bg-zinc-900/50 hover:bg-zinc-800/80 border border-transparent text-zinc-300'
                    }`}
                  >
                    {/* Thumbnail preview */}
                    <div className="relative w-20 aspect-video rounded-lg overflow-hidden bg-black shrink-0">
                      <img
                        src={ep.thumbnailUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=300&q=80'}
                        alt={ep.title}
                        className="w-full h-full object-cover"
                      />
                      {isCurrent ? (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-black">
                            <Play className="w-3 h-3 fill-current ml-0.5" />
                          </div>
                        </div>
                      ) : (
                        <div className="absolute bottom-1 right-1 bg-black/80 px-1 py-0.2 rounded text-[9px] font-bold text-zinc-300">
                          EP {ep.episodeNumber}
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-400">
                        <span>Episode {ep.episodeNumber}</span>
                        {isCurrent && (
                          <span className="text-[9px] uppercase px-1 py-0.2 bg-amber-500 text-black font-extrabold rounded">
                            Now Playing
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold truncate text-zinc-100 mt-0.5">
                        {ep.title}
                      </h4>
                      {ep.duration && (
                        <span className="text-[10px] text-zinc-400 block mt-0.5">
                          {ep.duration}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
