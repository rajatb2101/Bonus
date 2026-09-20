import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
  Settings,
  AlertCircle
} from 'lucide-react';
import { Episode } from '../types';

interface VideoPlayerProps {
  episode: Episode;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

function getBunnyEmbedUrl(url?: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();

  // If user pasted full iframe tag snippet
  if (trimmed.includes('<iframe') && trimmed.includes('src=')) {
    const match = trimmed.match(/src=["']([^"']+)["']/i);
    if (match && match[1]) {
      return match[1];
    }
  }

  // If direct iframe.mediadelivery.net URL
  if (trimmed.includes('iframe.mediadelivery.net')) {
    return trimmed.replace('/play/', '/embed/');
  }

  // If bunny-stream storage key format
  if (trimmed.startsWith('bunny-stream:')) {
    const parts = trimmed.split(':');
    if (parts.length >= 3) {
      return `https://iframe.mediadelivery.net/embed/${parts[1]}/${parts[2]}`;
    }
  }

  return null;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  episode,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
}) => {
  const bunnyEmbedUrl = getBunnyEmbedUrl(episode.videoUrl);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<any>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [buffered, setBuffered] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [showRateMenu, setShowRateMenu] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  // Format time (seconds -> mm:ss or hh:mm:ss)
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Reset states on episode change
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setVideoError(null);
    setIsBuffering(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.load();
    }
  }, [episode.id, episode.videoUrl]);

  // Autohide controls logic
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
        setShowRateMenu(false);
      }, 3000);
    }
  };

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused || videoRef.current.ended) {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn('Playback error:', err);
      });
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const seek = (seconds: number) => {
    if (!videoRef.current) return;
    const newTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      if (val === 0) {
        setIsMuted(true);
        videoRef.current.muted = true;
      } else if (isMuted) {
        setIsMuted(false);
        videoRef.current.muted = false;
      }
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    videoRef.current.muted = nextMute;
    if (!nextMute && volume === 0) {
      setVolume(0.5);
      videoRef.current.volume = 0.5;
    }
  };

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => console.warn('Fullscreen error:', err));
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(err => console.warn('Exit fullscreen error:', err));
    }
  };

  const changeSpeed = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
    setShowRateMenu(false);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'arrowleft':
          e.preventDefault();
          seek(-5);
          break;
        case 'arrowright':
          e.preventDefault();
          seek(5);
          break;
        case 'j':
          seek(-10);
          break;
        case 'l':
          seek(10);
          break;
        case 'm':
          toggleMute();
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'arrowup':
          e.preventDefault();
          setVolume(v => {
            const next = Math.min(1, v + 0.1);
            if (videoRef.current) videoRef.current.volume = next;
            return next;
          });
          break;
        case 'arrowdown':
          e.preventDefault();
          setVolume(v => {
            const next = Math.max(0, v - 0.1);
            if (videoRef.current) videoRef.current.volume = next;
            return next;
          });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay]);

  if (bunnyEmbedUrl) {
    const embedSrc = bunnyEmbedUrl.includes('?')
      ? `${bunnyEmbedUrl}&preload=true&responsive=true`
      : `${bunnyEmbedUrl}?preload=true&responsive=true`;

    return (
      <div
        id="video-player-container"
        className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 group"
      >
        <iframe
          src={embedSrc}
          loading="lazy"
          className="w-full h-full border-0 absolute inset-0"
          allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;"
          allowFullScreen
          title={episode.title}
        />
        {/* Next / Previous quick episode navigation bar on hover */}
        <div className="absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/85 via-black/40 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between z-20">
          <div>
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
              Bunny Stream HD • Episode {episode.episodeNumber}
            </span>
            <h3 className="text-white text-sm font-semibold truncate max-w-md">{episode.title}</h3>
          </div>
          <div className="pointer-events-auto flex items-center gap-2">
            {hasPrevious && onPrevious && (
              <button
                onClick={onPrevious}
                title="Previous Episode"
                className="px-2.5 py-1 bg-black/70 hover:bg-black/95 text-white rounded-lg text-xs border border-white/10 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <SkipBack className="w-3.5 h-3.5" /> Prev
              </button>
            )}
            {hasNext && onNext && (
              <button
                onClick={onNext}
                title="Next Episode"
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors"
              >
                Next <SkipForward className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={playerContainerRef}
      id="video-player-container"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 select-none group"
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        id="main-streaming-video"
        poster={episode.thumbnailUrl}
        preload="metadata"
        playsInline
        onClick={togglePlay}
        onTimeUpdate={() => {
          if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
            if (videoRef.current.buffered.length > 0) {
              setBuffered(videoRef.current.buffered.end(videoRef.current.buffered.length - 1));
            }
          }
        }}
        onLoadedMetadata={() => {
          if (videoRef.current) {
            setDuration(videoRef.current.duration);
            setVideoError(null);
          }
        }}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => {
          setIsBuffering(false);
          setIsPlaying(true);
        }}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          if (hasNext && onNext) {
            onNext();
          }
        }}
        onError={() => {
          setVideoError(
            'Unable to stream video from CDN/storage. Verify that the video file exists and CORS is enabled on the storage bucket.'
          );
          setIsBuffering(false);
        }}
        className="w-full h-full object-contain cursor-pointer"
      >
        <source src={episode.videoUrl} type="video/mp4" />
        Your browser does not support HTML5 video streaming.
      </video>

      {/* Buffering Spinner */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/40">
          <div className="w-14 h-14 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
        </div>
      )}

      {/* Error state */}
      {videoError && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 text-center z-30">
          <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
          <h4 className="text-lg font-bold text-white mb-2">Streaming Playback Error</h4>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-md mb-4">{videoError}</p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                if (videoRef.current) {
                  setVideoError(null);
                  videoRef.current.load();
                  videoRef.current.play();
                }
              }}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              Retry Playback
            </button>
          </div>
        </div>
      )}

      {/* Center Big Play Button when paused and no error */}
      {!isPlaying && !videoError && (
        <div
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer transition-opacity"
        >
          <div className="w-20 h-20 rounded-full bg-amber-500/90 text-black flex items-center justify-center shadow-2xl shadow-amber-500/50 hover:scale-110 hover:bg-amber-400 transition-all">
            <Play className="w-8 h-8 fill-current ml-1" />
          </div>
        </div>
      )}

      {/* Top Bar with Title & Episode details on hover */}
      <div
        className={`absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/85 via-black/40 to-transparent transition-opacity duration-300 pointer-events-none ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-500 text-black text-[10px] font-extrabold uppercase px-2 py-0.5 rounded">
                EP {episode.episodeNumber}
              </span>
              <span className="text-xs text-zinc-300 font-medium">
                {episode.playlistTitle || 'Bonus Episode'}
              </span>
            </div>
            <h2 className="text-white text-base sm:text-lg font-bold mt-1 line-clamp-1 drop-shadow-md">
              {episode.title}
            </h2>
          </div>
        </div>
      </div>

      {/* Bottom Controls Bar */}
      <div
        className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent pt-8 pb-3 px-4 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Progress scrub bar */}
        <div className="relative group/scrub mb-3 flex items-center">
          {/* Track background */}
          <div className="relative w-full h-1.5 group-hover/scrub:h-2.5 bg-white/20 rounded-full overflow-hidden transition-all">
            {/* Buffered track */}
            <div
              className="absolute top-0 left-0 bottom-0 bg-white/30 transition-all duration-150"
              style={{ width: `${duration ? (buffered / duration) * 100 : 0}%` }}
            />
            {/* Current progress track */}
            <div
              className="absolute top-0 left-0 bottom-0 bg-amber-500 transition-all duration-75"
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>

          {/* Interactive Range Input */}
          <input
            id="video-scrubber-input"
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeekChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between gap-3 text-white">
          {/* Left Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Play/Pause */}
            <button
              id="player-toggle-play-btn"
              onClick={togglePlay}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-white hover:text-amber-400"
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
            </button>

            {/* Previous Episode */}
            <button
              id="player-prev-episode-btn"
              onClick={onPrevious}
              disabled={!hasPrevious}
              className={`p-1.5 rounded-lg transition-colors ${
                hasPrevious
                  ? 'hover:bg-white/10 text-white hover:text-amber-400 cursor-pointer'
                  : 'text-zinc-600 cursor-not-allowed'
              }`}
              title="Previous Episode"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            {/* 10s Backward */}
            <button
              id="player-seek-back-btn"
              onClick={() => seek(-10)}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-zinc-300 hover:text-white"
              title="Rewind 10s"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* 10s Forward */}
            <button
              id="player-seek-forward-btn"
              onClick={() => seek(10)}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-zinc-300 hover:text-white"
              title="Fast Forward 10s"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Next Episode */}
            <button
              id="player-next-episode-btn"
              onClick={onNext}
              disabled={!hasNext}
              className={`p-1.5 rounded-lg transition-colors ${
                hasNext
                  ? 'hover:bg-white/10 text-white hover:text-amber-400 cursor-pointer'
                  : 'text-zinc-600 cursor-not-allowed'
              }`}
              title="Next Episode"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Volume & Mute */}
            <div className="flex items-center gap-1.5 group/vol ml-1">
              <button
                id="player-mute-btn"
                onClick={toggleMute}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-zinc-300 hover:text-white"
                title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
              >
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                id="player-volume-slider"
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 sm:w-20 h-1 bg-white/20 accent-amber-500 rounded cursor-pointer hidden sm:block"
              />
            </div>

            {/* Time display */}
            <div className="text-xs text-zinc-300 font-mono tracking-wider ml-2">
              <span>{formatTime(currentTime)}</span>
              <span className="text-zinc-500 mx-1">/</span>
              <span className="text-zinc-400">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* Speed Rate Menu */}
            <div className="relative">
              <button
                id="player-speed-btn"
                onClick={() => setShowRateMenu(!showRateMenu)}
                className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-[11px] font-bold text-zinc-200 transition-colors cursor-pointer"
                title="Playback Speed"
              >
                {playbackRate}x
              </button>

              {showRateMenu && (
                <div className="absolute bottom-full right-0 mb-2 bg-zinc-900 border border-white/15 rounded-lg shadow-xl p-1.5 flex flex-col gap-1 min-w-[80px] z-30">
                  {[0.75, 1, 1.25, 1.5, 2].map((r) => (
                    <button
                      key={r}
                      onClick={() => changeSpeed(r)}
                      className={`px-3 py-1 text-xs text-left rounded cursor-pointer ${
                        playbackRate === r ? 'bg-amber-500 text-black font-bold' : 'text-zinc-300 hover:bg-white/10'
                      }`}
                    >
                      {r}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen */}
            <button
              id="player-fullscreen-btn"
              onClick={toggleFullscreen}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-zinc-300 hover:text-white"
              title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
