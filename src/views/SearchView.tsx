import React, { useMemo } from 'react';
import { Search, Film, X } from 'lucide-react';
import { Episode } from '../types';
import { EpisodeCard } from '../components/EpisodeCard';

interface SearchViewProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  episodes: Episode[];
  onSelectEpisode: (episode: Episode) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({
  searchQuery,
  onSearchChange,
  episodes,
  onSelectEpisode,
}) => {
  const publishedEpisodes = episodes.filter(e => e.published);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) {
      return publishedEpisodes;
    }
    const q = searchQuery.toLowerCase().trim();
    return publishedEpisodes.filter((ep) => {
      const matchTitle = ep.title.toLowerCase().includes(q);
      const matchPlaylist = ep.playlistTitle?.toLowerCase().includes(q);
      const matchNumber = `ep ${ep.episodeNumber}`.includes(q) || `episode ${ep.episodeNumber}`.includes(q) || `${ep.episodeNumber}` === q;
      const matchDesc = ep.description?.toLowerCase().includes(q);
      return matchTitle || matchPlaylist || matchNumber || matchDesc;
    });
  }, [searchQuery, publishedEpisodes]);

  return (
    <div className="space-y-6 pb-16">
      {/* Search Header */}
      <div className="bg-[#13141c] p-6 rounded-2xl border border-white/5 space-y-4">
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Search className="w-6 h-6 text-amber-500" />
          Search Episodes & Bonus Acts
        </h1>

        {/* Input */}
        <div className="relative max-w-xl">
          <input
            id="search-view-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by episode title, number (e.g. 'Episode 1' or '2'), playlist, or keywords..."
            className="w-full bg-zinc-900 border border-white/15 rounded-xl pl-11 pr-10 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
            autoFocus
          />
          <Search className="w-5 h-5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="p-1 text-zinc-400 hover:text-white absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span>
            {searchQuery ? `Showing results for "${searchQuery}"` : 'All available bonus episodes'}
          </span>
          <span className="font-semibold text-zinc-300">
            {filtered.length} {filtered.length === 1 ? 'result found' : 'results found'}
          </span>
        </div>
      </div>

      {/* Results grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((ep) => (
            <EpisodeCard key={ep.id} episode={ep} onSelect={onSelectEpisode} />
          ))}
        </div>
      ) : (
        <div className="p-16 text-center bg-[#13141c] rounded-2xl border border-white/5 space-y-3">
          <Film className="w-12 h-12 text-zinc-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No episodes found matching "{searchQuery}"</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Try searching for another keyword, episode number (e.g., "1", "2"), or check all playlists.
          </p>
        </div>
      )}
    </div>
  );
};
