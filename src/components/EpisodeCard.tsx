import React from 'react';
import { Play, Clock, Folder } from 'lucide-react';
import { Episode } from '../types';

interface EpisodeCardProps {
  episode: Episode;
  onSelect: (episode: Episode) => void;
  showStatusBadge?: boolean;
}

export const EpisodeCard: React.FC<EpisodeCardProps> = ({
  episode,
  onSelect,
  showStatusBadge = false,
}) => {
  return (
    <div
      id={`episode-card-${episode.id}`}
      onClick={() => onSelect(episode)}
      className="group flex flex-col bg-[#13141c] hover:bg-[#181a24] border border-white/5 hover:border-amber-500/40 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl hover:shadow-black/60"
    >
      {/* Thumbnail container */}
      <div className="relative aspect-video w-full overflow-hidden bg-zinc-950">
        <img
          src={episode.thumbnailUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80'}
          alt={episode.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

        {/* Episode Number Badge */}
        <div className="absolute top-2.5 left-2.5 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10 text-[11px] font-bold tracking-wider text-amber-300">
          EP {episode.episodeNumber}
        </div>

        {/* Duration badge */}
        {episode.duration && (
          <div className="absolute bottom-2.5 right-2.5 bg-black/85 backdrop-blur-sm px-2 py-0.5 rounded text-[11px] font-semibold text-zinc-200 flex items-center gap-1 border border-white/10">
            <Clock className="w-3 h-3 text-amber-400" />
            {episode.duration}
          </div>
        )}

        {/* Play Icon hover bubble */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40">
          <div className="w-12 h-12 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-lg shadow-amber-500/50 transform group-hover:scale-110 transition-transform">
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </div>
        </div>

        {/* Admin only: status badge */}
        {showStatusBadge && (
          <div className="absolute top-2.5 right-2.5">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                episode.published
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              {episode.published ? 'Published' : 'Draft'}
            </span>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-2">
        <div>
          {/* Playlist tag */}
          {episode.playlistTitle && (
            <div className="flex items-center gap-1.5 text-xs text-amber-400/90 font-medium mb-1">
              <Folder className="w-3 h-3" />
              <span className="truncate">{episode.playlistTitle}</span>
            </div>
          )}

          {/* Title */}
          <h3 className="font-bold text-sm sm:text-base text-zinc-100 group-hover:text-amber-300 line-clamp-2 transition-colors leading-snug">
            {episode.title}
          </h3>
        </div>

        {/* Description preview */}
        {episode.description && (
          <p className="text-xs text-zinc-400 line-clamp-2 font-normal leading-relaxed">
            {episode.description}
          </p>
        )}
      </div>
    </div>
  );
};
