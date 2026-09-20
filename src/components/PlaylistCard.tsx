import React from 'react';
import { Layers, PlayCircle, ArrowRight } from 'lucide-react';
import { Playlist } from '../types';

interface PlaylistCardProps {
  playlist: Playlist;
  episodeCount?: number;
  onSelect: (playlist: Playlist) => void;
  isAdmin?: boolean;
}

export const PlaylistCard: React.FC<PlaylistCardProps> = ({
  playlist,
  episodeCount = 0,
  onSelect,
  isAdmin = false
}) => {
  return (
    <div
      id={`playlist-card-${playlist.id}`}
      onClick={() => onSelect(playlist)}
      className="group relative bg-[#13141c] hover:bg-[#181a24] border border-white/5 hover:border-amber-500/40 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl hover:shadow-black/60 flex flex-col"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-zinc-950">
        <img
          src={playlist.thumbnailUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80'}
          alt={playlist.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        {/* Episode count tag */}
        <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          <span>{episodeCount} {episodeCount === 1 ? 'Episode' : 'Episodes'}</span>
        </div>

        {/* Hover action icon */}
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs font-bold text-amber-400">
          <span>View Playlist</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>

        {isAdmin && (
          <div className="absolute top-2.5 right-2.5">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                playlist.published
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              {playlist.published ? 'Published' : 'Draft'}
            </span>
          </div>
        )}
      </div>

      {/* Playlist info */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-2">
        <div>
          <h3 className="font-bold text-base text-zinc-100 group-hover:text-amber-300 transition-colors line-clamp-1">
            {playlist.title}
          </h3>
          {playlist.description && (
            <p className="text-xs text-zinc-400 line-clamp-2 mt-1 font-normal leading-relaxed">
              {playlist.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
