import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  Layers,
  Film,
  Upload,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  EyeOff,
  MoveUp,
  MoveDown,
  ExternalLink,
  Cloud,
  Zap,
  Check,
  Copy,
  RefreshCw,
  LogOut,
  Lock,
  Key,
  FileVideo,
  Image as ImageIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Playlist, Episode, StorageConfigStatus } from '../types';
import {
  savePlaylist,
  deletePlaylist,
  saveEpisode,
  deleteEpisode,
  reorderEpisodes,
  reorderPlaylists,
  cleanupSampleData
} from '../firebase/db';
import {
  fetchStorageConfig,
  uploadFileWithProgress,
  deleteStorageFile
} from '../services/storageClient';

interface AdminViewProps {
  playlists: Playlist[];
  episodes: Episode[];
  onRefreshData: () => Promise<void>;
  onClose: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  playlists,
  episodes,
  onRefreshData,
  onClose,
}) => {
  const { user, isAdmin, signIn, updateAdminPassword, logout } = useAuth();

  // Auth form states
  const [authEmail, setAuthEmail] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authFeedback, setAuthFeedback] = useState<string | null>(null);
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState<boolean>(false);
  const [newPasswordInput, setNewPasswordInput] = useState<string>('');

  // Admin tabs
  const [activeTab, setActiveTab] = useState<'dashboard' | 'playlists' | 'episodes' | 'storage'>('dashboard');

  // Storage status
  const [storageStatus, setStorageStatus] = useState<StorageConfigStatus | null>(null);
  const [checkingStorage, setCheckingStorage] = useState<boolean>(false);

  // Playlist Form State
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [playlistModalOpen, setPlaylistModalOpen] = useState<boolean>(false);
  const [plFormTitle, setPlFormTitle] = useState<string>('');
  const [plFormDesc, setPlFormDesc] = useState<string>('');
  const [plFormThumb, setPlFormThumb] = useState<string>('');
  const [plFormOrder, setPlFormOrder] = useState<number>(1);
  const [plFormPublished, setPlFormPublished] = useState<boolean>(true);
  const [plUploadingThumb, setPlUploadingThumb] = useState<boolean>(false);
  const [plThumbProgress, setPlThumbProgress] = useState<number>(0);
  const [plSaving, setPlSaving] = useState<boolean>(false);

  // Episode Form State
  const [editingEpisode, setEditingEpisode] = useState<Episode | null>(null);
  const [episodeModalOpen, setEpisodeModalOpen] = useState<boolean>(false);
  const [epFormNumber, setEpFormNumber] = useState<number>(1);
  const [epFormTitle, setEpFormTitle] = useState<string>('');
  const [epFormDesc, setEpFormDesc] = useState<string>('');
  const [epFormPlaylistId, setEpFormPlaylistId] = useState<string>('');
  const [epFormThumbnailUrl, setEpFormThumbnailUrl] = useState<string>('');
  const [epFormVideoUrl, setEpFormVideoUrl] = useState<string>('');
  const [epFormStorageKey, setEpFormStorageKey] = useState<string>('');
  const [epFormDuration, setEpFormDuration] = useState<string>('');
  const [epFormOrder, setEpFormOrder] = useState<number>(1);
  const [epFormPublished, setEpFormPublished] = useState<boolean>(true);

  // Episode Upload Progress
  const [videoUploadProgress, setVideoUploadProgress] = useState<number>(0);
  const [isVideoUploading, setIsVideoUploading] = useState<boolean>(false);
  const [thumbUploadProgress, setThumbUploadProgress] = useState<number>(0);
  const [isThumbUploading, setIsThumbUploading] = useState<boolean>(false);
  const [epSaving, setEpSaving] = useState<boolean>(false);

  // Notification / Message
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2500);
    showToast(`Copied ${label} to clipboard`);
  };

  // File input refs
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const plThumbInputRef = useRef<HTMLInputElement>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const loadStorageStatus = async () => {
    setCheckingStorage(true);
    try {
      const status = await fetchStorageConfig();
      setStorageStatus(status);
    } catch (e) {
      console.error(e);
    } finally {
      setCheckingStorage(false);
    }
  };

  useEffect(() => {
    loadStorageStatus();
  }, []);

  // Handle Auth submission
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      setAuthFeedback('Please enter both your admin email and password.');
      return;
    }
    setAuthLoading(true);
    setAuthFeedback(null);
    try {
      await signIn(authEmail.trim(), authPassword.trim());
      showToast('Authenticated successfully. Welcome Admin!');
    } catch (err: any) {
      setAuthFeedback(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setAuthFeedback('Default admin password is: rajat123 (or admin123). You can also change it anytime inside Admin Panel.');
  };

  const handleSaveNewPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasswordInput || newPasswordInput.trim().length < 4) {
      showToast('Password must be at least 4 characters long', 'error');
      return;
    }
    updateAdminPassword(newPasswordInput.trim());
    setShowPasswordChangeModal(false);
    setNewPasswordInput('');
    showToast('Admin password updated successfully!');
  };

  // Open Playlist Modal
  const handleOpenPlaylistModal = (pl?: Playlist) => {
    if (pl) {
      setEditingPlaylist(pl);
      setPlFormTitle(pl.title);
      setPlFormDesc(pl.description || '');
      setPlFormThumb(pl.thumbnailUrl || '');
      setPlFormOrder(pl.order || 1);
      setPlFormPublished(pl.published);
    } else {
      setEditingPlaylist(null);
      setPlFormTitle('');
      setPlFormDesc('');
      setPlFormThumb('');
      setPlFormOrder((playlists.length || 0) + 1);
      setPlFormPublished(true);
    }
    setPlaylistModalOpen(true);
  };

  // Save Playlist
  const handleSavePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plFormTitle.trim()) {
      showToast('Playlist title is required', 'error');
      return;
    }

    setPlSaving(true);
    try {
      const id = editingPlaylist ? editingPlaylist.id : plFormTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `playlist-${Date.now()}`;
      await savePlaylist({
        id,
        title: plFormTitle.trim(),
        description: plFormDesc.trim(),
        thumbnailUrl: plFormThumb.trim(),
        order: Number(plFormOrder),
        published: plFormPublished,
      });
      await onRefreshData();
      setPlaylistModalOpen(false);
      showToast(editingPlaylist ? 'Playlist updated' : 'Playlist created');
    } catch (err: any) {
      showToast(err.message || 'Failed to save playlist', 'error');
    } finally {
      setPlSaving(false);
    }
  };

  // Delete Playlist
  const handleDeletePlaylist = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete playlist "${title}" and its associated episodes?`)) {
      return;
    }
    try {
      await deletePlaylist(id);
      await onRefreshData();
      showToast(`Deleted playlist "${title}"`);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete playlist', 'error');
    }
  };

  // Reorder Playlists Up / Down
  const handleMovePlaylist = async (index: number, direction: 'up' | 'down') => {
    const sorted = [...playlists].sort((a, b) => (a.order || 0) - (b.order || 0));
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= sorted.length) return;

    const temp = sorted[index];
    sorted[index] = sorted[targetIdx];
    sorted[targetIdx] = temp;

    const reordered = sorted.map((p, idx) => ({ id: p.id, order: idx + 1 }));
    try {
      await reorderPlaylists(reordered);
      await onRefreshData();
      showToast('Playlist order updated');
    } catch (err: any) {
      showToast('Failed to update playlist order', 'error');
    }
  };

  // Open Episode Modal
  const handleOpenEpisodeModal = (ep?: Episode) => {
    if (ep) {
      setEditingEpisode(ep);
      setEpFormNumber(ep.episodeNumber);
      setEpFormTitle(ep.title);
      setEpFormDesc(ep.description || '');
      setEpFormPlaylistId(ep.playlistId);
      setEpFormThumbnailUrl(ep.thumbnailUrl || '');
      setEpFormVideoUrl(ep.videoUrl || '');
      setEpFormStorageKey(ep.videoStorageKey || '');
      setEpFormDuration(ep.duration || '');
      setEpFormOrder(ep.order || 1);
      setEpFormPublished(ep.published);
    } else {
      setEditingEpisode(null);
      const defaultPl = playlists[0]?.id || '';
      const existingInPl = episodes.filter(e => e.playlistId === defaultPl);
      const nextNum = existingInPl.length + 1;
      setEpFormNumber(nextNum);
      setEpFormTitle(`India Got Latent Episode ${nextNum}`);
      setEpFormDesc('');
      setEpFormPlaylistId(defaultPl);
      setEpFormThumbnailUrl('');
      setEpFormVideoUrl('');
      setEpFormStorageKey('');
      setEpFormDuration('');
      setEpFormOrder(nextNum);
      setEpFormPublished(true);
    }
    setEpisodeModalOpen(true);
  };

  // Upload Episode Thumbnail
  const handleUploadEpisodeThumbnail = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (JPG, PNG, WebP)', 'error');
      return;
    }

    setIsThumbUploading(true);
    setThumbUploadProgress(0);
    try {
      const result = await uploadFileWithProgress(file, 'thumbnails', (pct) => {
        setThumbUploadProgress(pct);
      });
      setEpFormThumbnailUrl(result.publicUrl);
      showToast('Thumbnail uploaded successfully');
    } catch (err: any) {
      showToast(err.message || 'Thumbnail upload failed', 'error');
    } finally {
      setIsThumbUploading(false);
    }
  };

  // Upload Episode Video
  const handleUploadEpisodeVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate video file
    const validVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/mkv', 'video/x-matroska'];
    const isVideo = file.type.startsWith('video/') || validVideoTypes.includes(file.type) || file.name.endsWith('.mp4');

    if (!isVideo) {
      showToast('Please select a valid video file (.mp4, .webm, etc.)', 'error');
      return;
    }

    setIsVideoUploading(true);
    setVideoUploadProgress(0);
    try {
      const result = await uploadFileWithProgress(file, 'videos', (pct) => {
        setVideoUploadProgress(pct);
      });

      setEpFormVideoUrl(result.publicUrl);
      setEpFormStorageKey(result.storageKey);
      showToast(`Video uploaded to storage (${(file.size / (1024 * 1024)).toFixed(1)} MB)`);
    } catch (err: any) {
      showToast(err.message || 'Video upload failed', 'error');
    } finally {
      setIsVideoUploading(false);
    }
  };

  // Upload Playlist Thumbnail
  const handleUploadPlaylistThumb = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPlUploadingThumb(true);
    setPlThumbProgress(0);
    try {
      const result = await uploadFileWithProgress(file, 'thumbnails', (pct) => {
        setPlThumbProgress(pct);
      });
      setPlFormThumb(result.publicUrl);
      showToast('Playlist thumbnail uploaded');
    } catch (err: any) {
      showToast(err.message || 'Upload failed', 'error');
    } finally {
      setPlUploadingThumb(false);
    }
  };

  // Save Episode
  const handleSaveEpisode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!epFormTitle.trim()) {
      showToast('Episode title is required', 'error');
      return;
    }
    if (!epFormPlaylistId) {
      showToast('Please select a playlist for this episode', 'error');
      return;
    }
    if (!epFormVideoUrl.trim()) {
      showToast('Video URL or video upload is required', 'error');
      return;
    }

    setEpSaving(true);
    try {
      const id = editingEpisode ? editingEpisode.id : `ep-${Date.now()}`;
      const selectedPl = playlists.find(p => p.id === epFormPlaylistId);

      await saveEpisode({
        id,
        playlistId: epFormPlaylistId,
        playlistTitle: selectedPl?.title || '',
        episodeNumber: Number(epFormNumber),
        title: epFormTitle.trim(),
        description: epFormDesc.trim(),
        thumbnailUrl: epFormThumbnailUrl.trim(),
        videoUrl: epFormVideoUrl.trim(),
        videoStorageKey: epFormStorageKey.trim() || undefined,
        duration: epFormDuration.trim() || undefined,
        order: Number(epFormOrder),
        published: epFormPublished,
      });

      await onRefreshData();
      setEpisodeModalOpen(false);
      showToast(editingEpisode ? 'Episode updated' : 'Episode created and saved to Firestore');
    } catch (err: any) {
      showToast(err.message || 'Failed to save episode', 'error');
    } finally {
      setEpSaving(false);
    }
  };

  // Toggle Episode Publish state directly
  const handleTogglePublish = async (ep: Episode) => {
    try {
      await saveEpisode({
        id: ep.id,
        published: !ep.published,
      });
      await onRefreshData();
      showToast(`Episode ${!ep.published ? 'published to public website' : 'set to unpublished draft'}`);
    } catch (err: any) {
      showToast('Failed to toggle publish status', 'error');
    }
  };

  // Delete Episode
  const handleDeleteEpisode = async (ep: Episode) => {
    if (!window.confirm(`Delete episode "EP ${ep.episodeNumber}: ${ep.title}"?`)) {
      return;
    }
    try {
      if (ep.videoStorageKey) {
        await deleteStorageFile(ep.videoStorageKey);
      }
      await deleteEpisode(ep.id);
      await onRefreshData();
      showToast('Episode deleted successfully');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete episode', 'error');
    }
  };

  // Reorder Episodes Up / Down
  const handleMoveEpisode = async (episodesList: Episode[], index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= episodesList.length) return;

    const copy = [...episodesList];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;

    const reordered = copy.map((e, idx) => ({ id: e.id, order: idx + 1 }));
    try {
      await reorderEpisodes(reordered);
      await onRefreshData();
      showToast('Episode order updated');
    } catch (err: any) {
      showToast('Failed to update episode order', 'error');
    }
  };

  // If user is not authenticated or not admin, show secure login prompt
  if (!user || !isAdmin) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 sm:p-8 bg-[#13141c] border border-white/10 rounded-2xl shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto mb-2">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Admin Authentication
          </h2>
          <p className="text-xs text-zinc-400">
            Secure admin access for managing India Got Latent episodes, playlists, and video storage.
          </p>
        </div>

        {user && !isAdmin && (
          <div className="p-3 bg-red-950/50 border border-red-500/40 rounded-xl text-xs text-red-300 space-y-2">
            <p className="font-bold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" /> Access Denied
            </p>
            <p>
              Logged in as <span className="font-mono text-white">{user.email}</span>, which is not an authorized administrator.
            </p>
            <button
              onClick={logout}
              className="text-xs text-red-200 underline font-semibold cursor-pointer"
            >
              Sign out and log in with admin account
            </button>
          </div>
        )}

        {authFeedback && (
          <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{authFeedback}</span>
          </div>
        )}

        <form onSubmit={handleAuthSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Admin Email
            </label>
            <input
              id="admin-email-input"
              type="email"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              placeholder="Enter your admin email"
              className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-zinc-300">
                Password
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-[11px] text-amber-400 hover:text-amber-300 hover:underline cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
            <input
              id="admin-password-input"
              type="password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          <button
            id="admin-login-submit-btn"
            type="submit"
            disabled={authLoading}
            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs tracking-wider uppercase transition-all shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
          >
            {authLoading ? 'Verifying...' : 'Enter Admin Panel'}
          </button>
        </form>

        <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs space-y-1.5">
          <p className="text-amber-400 font-bold flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" /> Direct Admin Login
          </p>
          <div className="text-[11px] text-zinc-300 space-y-0.5">
            <p>Admin Email: <span className="text-amber-300 font-mono font-semibold">rajatb419@gmail.com</span></p>
            <p>Default Password: <span className="text-amber-300 font-mono font-semibold">rajat123</span></p>
          </div>
          <p className="text-[10px] text-zinc-400 pt-0.5 border-t border-white/5">
            No Firebase Auth required. You can change this password anytime in Admin Settings.
          </p>
        </div>

        <div className="flex items-center justify-end text-[11px] text-zinc-400 pt-2 border-t border-white/5">
          <button
            onClick={onClose}
            className="hover:text-white cursor-pointer"
          >
            Back to Website
          </button>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalPlaylists = playlists.length;
  const totalEpisodes = episodes.length;
  const publishedEpisodes = episodes.filter(e => e.published).length;
  const unpublishedEpisodes = totalEpisodes - publishedEpisodes;

  return (
    <div className="space-y-8 pb-20">
      {/* Toast popup */}
      {toastMsg && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold border animate-bounce ${
            toastMsg.type === 'success'
              ? 'bg-emerald-950 text-emerald-200 border-emerald-500/50'
              : 'bg-rose-950 text-rose-200 border-rose-500/50'
          }`}
        >
          {toastMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Top Admin Header */}
      <div className="bg-[#13141c] p-6 rounded-2xl border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500 text-black">
              Authorized Console
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              {user.email}
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mt-1">
            Admin Panel — India Got Latent
          </h1>
          <p className="text-xs text-zinc-400">
            Control video playlists, upload bonus episodes, manage CDN streaming keys, and toggle visibility.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            id="admin-exit-btn"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-xs font-bold text-black cursor-pointer transition-all shadow-md shadow-amber-500/20"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Exit to Website
          </button>

          <button
            id="admin-clean-sample-btn"
            onClick={async () => {
              try {
                const count = await cleanupSampleData();
                await onRefreshData();
                showToast(`Cleaned up ${count} sample items`);
              } catch (e: any) {
                showToast('Cleanup failed', 'error');
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 hover:border-amber-500/50 text-xs font-semibold text-zinc-300 hover:text-amber-400 cursor-pointer transition-all"
            title="Purge all sample and dummy episodes/playlists from Firestore"
          >
            <Trash2 className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Purge Samples</span>
          </button>

          <button
            id="admin-refresh-btn"
            onClick={() => {
              onRefreshData();
              loadStorageStatus();
              showToast('Data refreshed');
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 hover:border-amber-500/50 text-xs font-semibold text-zinc-300 hover:text-white cursor-pointer transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>

          <button
            id="admin-change-pass-btn"
            onClick={() => setShowPasswordChangeModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 hover:border-amber-500/50 text-xs font-semibold text-zinc-300 hover:text-amber-400 cursor-pointer transition-all"
            title="Change admin login password"
          >
            <Key className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Password</span>
          </button>

          <button
            id="admin-signout-btn"
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 hover:border-red-500/50 text-xs font-semibold text-zinc-300 hover:text-red-300 cursor-pointer transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'dashboard'
              ? 'bg-amber-500 text-black'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Dashboard Overview
        </button>
        <button
          onClick={() => setActiveTab('playlists')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'playlists'
              ? 'bg-amber-500 text-black'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Playlists ({totalPlaylists})
        </button>
        <button
          onClick={() => setActiveTab('episodes')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'episodes'
              ? 'bg-amber-500 text-black'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Episodes ({totalEpisodes})
        </button>
        <button
          onClick={() => setActiveTab('storage')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'storage'
              ? 'bg-amber-500 text-black'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          Bunny Stream Setup
        </button>
      </div>

      {/* TAB 1: DASHBOARD OVERVIEW */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Stat Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#13141c] p-5 rounded-2xl border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-xs font-semibold">Total Playlists</span>
                <Layers className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-3xl font-extrabold text-white">
                {totalPlaylists}
              </div>
              <p className="text-[11px] text-zinc-500">Active series collections</p>
            </div>

            <div className="bg-[#13141c] p-5 rounded-2xl border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-xs font-semibold">Total Episodes</span>
                <Film className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-3xl font-extrabold text-white">
                {totalEpisodes}
              </div>
              <p className="text-[11px] text-zinc-500">All registered episodes</p>
            </div>

            <div className="bg-[#13141c] p-5 rounded-2xl border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-xs font-semibold">Published (Public)</span>
                <Eye className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-3xl font-extrabold text-emerald-400">
                {publishedEpisodes}
              </div>
              <p className="text-[11px] text-zinc-500">Streaming on public site</p>
            </div>

            <div className="bg-[#13141c] p-5 rounded-2xl border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-xs font-semibold">Unpublished (Drafts)</span>
                <EyeOff className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-3xl font-extrabold text-amber-400">
                {unpublishedEpisodes}
              </div>
              <p className="text-[11px] text-zinc-500">Only visible to admin</p>
            </div>
          </div>

          {/* Bunny Stream Video Platform Status Card */}
          <div className="bg-[#13141c] p-6 rounded-2xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  Bunny Stream Video Platform Status
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    storageStatus?.configured
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {storageStatus?.configured
                    ? '✓ Bunny Stream Active'
                    : 'Local Preview Active (Ready for Bunny Stream Library Keys)'}
                </span>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed max-w-3xl">
              Videos are powered by <strong>Bunny Stream</strong> (video.bunnycdn.com). Videos uploaded or embedded are automatically transcoded into adaptive bitrates (HLS 4K, 1080p, 720p, 480p) and served via Bunny's responsive player with zero buffering.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 text-xs">
              <div className="p-3 bg-zinc-900/60 rounded-xl border border-white/5">
                <span className="text-zinc-500 block mb-1">Platform</span>
                <span className="font-mono text-white font-semibold">
                  {storageStatus?.configured ? 'Bunny Stream' : 'Local Preview (Bunny Stream Ready)'}
                </span>
              </div>
              <div className="p-3 bg-zinc-900/60 rounded-xl border border-white/5">
                <span className="text-zinc-500 block mb-1">Video Library ID</span>
                <span className="font-mono text-white font-semibold truncate block">
                  {storageStatus?.libraryId || 'Not Set'}
                </span>
              </div>
              <div className="p-3 bg-zinc-900/60 rounded-xl border border-white/5">
                <span className="text-zinc-500 block mb-1">Player Host</span>
                <span className="font-mono text-amber-400 font-semibold truncate block">
                  {storageStatus?.hostname || 'iframe.mediadelivery.net'}
                </span>
              </div>
              <div className="p-3 bg-zinc-900/60 rounded-xl border border-white/5">
                <span className="text-zinc-500 block mb-1">Player Engine</span>
                <span className="font-mono text-emerald-400 font-semibold truncate block">
                  Adaptive Iframe + HLS
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PLAYLIST MANAGEMENT */}
      {activeTab === 'playlists' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Curated Playlists</h2>
              <p className="text-xs text-zinc-400">Manage playlists, cover art, and public visibility</p>
            </div>
            <button
              id="admin-create-playlist-btn"
              onClick={() => handleOpenPlaylistModal()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all cursor-pointer shadow-lg shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              Create Playlist
            </button>
          </div>

          <div className="space-y-3">
            {[...playlists].sort((a, b) => (a.order || 0) - (b.order || 0)).map((pl, idx) => {
              const epCount = episodes.filter(e => e.playlistId === pl.id).length;
              return (
                <div
                  key={pl.id}
                  className="bg-[#13141c] p-4 rounded-xl border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Order controls */}
                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        onClick={() => handleMovePlaylist(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 hover:bg-white/10 rounded disabled:opacity-20 text-zinc-400 hover:text-white cursor-pointer"
                        title="Move Up"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMovePlaylist(idx, 'down')}
                        disabled={idx === playlists.length - 1}
                        className="p-1 hover:bg-white/10 rounded disabled:opacity-20 text-zinc-400 hover:text-white cursor-pointer"
                        title="Move Down"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Thumbnail */}
                    <div className="w-20 aspect-video rounded-lg overflow-hidden bg-black shrink-0 border border-white/10">
                      <img src={pl.thumbnailUrl} alt={pl.title} className="w-full h-full object-cover" />
                    </div>

                    {/* Info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-white truncate">{pl.title}</h4>
                        <span
                          className={`text-[9px] px-2 py-0.2 rounded-full font-bold uppercase ${
                            pl.published
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {pl.published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 truncate max-w-md">{pl.description}</p>
                      <span className="text-[11px] text-amber-400/90 font-medium">
                        {epCount} {epCount === 1 ? 'Episode' : 'Episodes'} • Order #{pl.order}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => handleOpenPlaylistModal(pl)}
                      className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-zinc-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
                      title="Edit Playlist"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeletePlaylist(pl.id, pl.title)}
                      className="p-2 bg-zinc-900 hover:bg-rose-900/50 rounded-lg text-zinc-300 hover:text-rose-300 border border-white/10 hover:border-rose-500/40 transition-colors cursor-pointer"
                      title="Delete Playlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: EPISODE MANAGEMENT */}
      {activeTab === 'episodes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Bonus Episodes Manager</h2>
              <p className="text-xs text-zinc-400">
                Upload video files, set episode order, toggle published state, and manage CDN metadata
              </p>
            </div>
            <button
              id="admin-create-episode-btn"
              onClick={() => handleOpenEpisodeModal()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all cursor-pointer shadow-lg shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              Upload & Add Episode
            </button>
          </div>

          <div className="space-y-3">
            {[...episodes].sort((a, b) => (a.order || 0) - (b.order || 0)).map((ep, idx) => (
              <div
                key={ep.id}
                className="bg-[#13141c] p-4 rounded-xl border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 min-w-0">
                  {/* Order adjustment */}
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      onClick={() => handleMoveEpisode(episodes, idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 hover:bg-white/10 rounded disabled:opacity-20 text-zinc-400 hover:text-white cursor-pointer"
                      title="Move Up"
                    >
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMoveEpisode(episodes, idx, 'down')}
                      disabled={idx === episodes.length - 1}
                      className="p-1 hover:bg-white/10 rounded disabled:opacity-20 text-zinc-400 hover:text-white cursor-pointer"
                      title="Move Down"
                    >
                      <MoveDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Thumbnail */}
                  <div className="w-24 aspect-video rounded-lg overflow-hidden bg-black shrink-0 border border-white/10 relative">
                    <img src={ep.thumbnailUrl} alt={ep.title} className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 right-1 bg-black/80 px-1 rounded text-[9px] font-bold text-amber-300">
                      EP {ep.episodeNumber}
                    </span>
                  </div>

                  {/* Metadata */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-white truncate">{ep.title}</h4>
                      <span
                        className={`text-[9px] px-2 py-0.2 rounded-full font-bold uppercase ${
                          ep.published
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {ep.published ? 'Published' : 'Draft'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 mt-0.5">
                      <span className="text-amber-400/90 font-medium">
                        {ep.playlistTitle || 'Bonus Episodes'}
                      </span>
                      {ep.duration && <span>• {ep.duration}</span>}
                      <span>• Order #{ep.order}</span>
                    </div>

                    {ep.videoStorageKey && (
                      <span className="text-[10px] text-zinc-500 font-mono block truncate max-w-sm">
                        Key: {ep.videoStorageKey}
                      </span>
                    )}
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  {/* Quick Publish / Unpublish Toggle */}
                  <button
                    onClick={() => handleTogglePublish(ep)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                      ep.published
                        ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                    title={ep.published ? 'Click to unpublish' : 'Click to publish'}
                  >
                    {ep.published ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{ep.published ? 'Unpublish' : 'Publish'}</span>
                  </button>

                  <button
                    onClick={() => handleOpenEpisodeModal(ep)}
                    className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-zinc-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
                    title="Edit Episode"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDeleteEpisode(ep)}
                    className="p-2 bg-zinc-900 hover:bg-rose-900/50 rounded-lg text-zinc-300 hover:text-rose-300 border border-white/10 hover:border-rose-500/40 transition-colors cursor-pointer"
                    title="Delete Episode"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: BUNNY STREAM SETUP & GUIDE */}
      {activeTab === 'storage' && (
        <div className="space-y-6 max-w-4xl">
          <div className="bg-[#13141c] p-6 rounded-2xl border border-white/10 space-y-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-orange-600 text-white flex items-center gap-1">
                  <Zap className="w-3 h-3 inline" /> Bunny Stream
                </span>
                <span className="text-xs text-amber-400 font-bold">
                  Dedicated Video Streaming Platform (video.bunnycdn.com)
                </span>
              </div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2 mt-1">
                Bunny Stream Setup & Video Library Configuration
              </h2>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed mt-1">
                Bunny Stream handles all video encoding, multiple bitrate transcoding (4K/1080p/720p/480p), adaptive HLS packaging, and instant delivery using Bunny's responsive video player iframe.
              </p>
            </div>

            {/* Status Box */}
            <div className="p-4 bg-zinc-900/80 rounded-xl border border-white/10 space-y-3">
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                Current Bunny Stream Connection Status
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-zinc-500 block">Status:</span>
                  <span className={storageStatus?.configured ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                    {storageStatus?.configured
                      ? '✓ Bunny Stream Connected'
                      : 'Preview Storage Active (Ready for Library Keys)'}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Video Library ID:</span>
                  <span className="font-mono text-zinc-200">{storageStatus?.libraryId || 'Not Set'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Player / CDN Host:</span>
                  <span className="font-mono text-amber-400">{storageStatus?.hostname || 'iframe.mediadelivery.net'}</span>
                </div>
              </div>
            </div>

            {/* Step by step instructions */}
            <div className="space-y-4 pt-1">
              <h3 className="text-sm font-bold text-white">How to connect your Bunny Stream Video Library:</h3>

              <div className="space-y-3 text-xs text-zinc-300">
                <div className="p-3 bg-zinc-900/50 rounded-xl border border-white/5 space-y-1">
                  <span className="font-bold text-white block">Step 1: Open Bunny Stream in Bunny.net</span>
                  <p>
                    Log into your <a href="https://panel.bunny.net/stream" target="_blank" rel="noreferrer" className="text-amber-400 hover:underline inline-flex items-center gap-1">Bunny.net Dashboard &rarr; Stream <ExternalLink className="w-3 h-3" /></a>. Click <strong>Add Video Library</strong> (e.g. name it <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-amber-300">igl-bonus-episodes</code>).
                  </p>
                </div>

                <div className="p-3 bg-zinc-900/50 rounded-xl border border-white/5 space-y-1">
                  <span className="font-bold text-white block">Step 2: Get Video Library ID & Stream API Key</span>
                  <p>
                    Click on your new Video Library and select <strong>API</strong> from the left sidebar menu. Copy your <strong>Video Library ID</strong> (number, e.g. <code className="text-amber-300">318290</code>) and your <strong>API Key</strong> (alphanumeric access key).
                  </p>
                </div>

                <div className="p-3 bg-zinc-900/50 rounded-xl border border-white/5 space-y-1">
                  <span className="font-bold text-white block">Step 3: (Optional) Pull Zone CDN Hostname</span>
                  <p>
                    Bunny Stream creates a CDN hostname (e.g. <code className="text-amber-300">vz-xxxx.b-cdn.net</code>). If you have one, enter it as <code className="text-amber-300">BUNNY_STREAM_CDN_HOSTNAME</code>. If omitted, it automatically streams via <code className="text-amber-300">iframe.mediadelivery.net</code>.
                  </p>
                </div>

                <div className="p-3 bg-zinc-900/50 rounded-xl border border-white/5 space-y-1">
                  <span className="font-bold text-white block">Step 4: Two Flexible Ways to Stream Videos</span>
                  <ul className="list-disc list-inside space-y-1 mt-1 text-zinc-400">
                    <li><strong>Direct Dashboard Upload:</strong> Click "Select & Upload Video File" in the Episode modal. The app automatically pushes the file into your Bunny Stream Video Library and enables adaptive streaming.</li>
                    <li><strong>Direct Embed / GUID Paste:</strong> You can also copy the embed iframe or Video ID (GUID) directly from Bunny Stream dashboard and paste it into the Episode Video URL field!</li>
                  </ul>
                </div>
              </div>

              {/* Copyable Environment Variables */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-300">
                    Environment Variables for Bunny Stream:
                  </span>
                  <button
                    onClick={() => copyToClipboard(`VIDEO_STORAGE_PROVIDER="bunny-stream"
BUNNY_STREAM_LIBRARY_ID="your_video_library_id"
BUNNY_STREAM_API_KEY="your_bunny_stream_api_key"
BUNNY_STREAM_CDN_HOSTNAME="vz-xxxx.b-cdn.net"`, 'Bunny Stream Variables')}
                    className="flex items-center gap-1 px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                  >
                    {copiedText === 'Bunny Stream Variables' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedText === 'Bunny Stream Variables' ? 'Copied Variables' : 'Copy Environment Block'}
                  </button>
                </div>

                <div className="bg-black/90 p-4 rounded-xl border border-white/10 font-mono text-xs text-zinc-200 overflow-x-auto select-all leading-relaxed">
{`VIDEO_STORAGE_PROVIDER="bunny-stream"
BUNNY_STREAM_LIBRARY_ID="your_video_library_id"
BUNNY_STREAM_API_KEY="your_bunny_stream_api_key"
BUNNY_STREAM_CDN_HOSTNAME="vz-xxxx.b-cdn.net"`}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PLAYLIST CREATE / EDIT MODAL */}
      {playlistModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#13141c] border border-white/10 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingPlaylist ? 'Edit Playlist' : 'Create New Playlist'}
              </h3>
              <button
                onClick={() => setPlaylistModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePlaylist} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Playlist Title
                </label>
                <input
                  id="playlist-title-input"
                  type="text"
                  value={plFormTitle}
                  onChange={(e) => setPlFormTitle(e.target.value)}
                  placeholder="e.g. India Got Latent – Bonus Episodes"
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Description
                </label>
                <textarea
                  id="playlist-desc-input"
                  value={plFormDesc}
                  onChange={(e) => setPlFormDesc(e.target.value)}
                  placeholder="Playlist synopsis or overview..."
                  rows={3}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Thumbnail Upload & Preview */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Cover Thumbnail
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-24 aspect-video rounded-lg overflow-hidden bg-black border border-white/10 shrink-0">
                    <img src={plFormThumb} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      ref={plThumbInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleUploadPlaylistThumb}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => plThumbInputRef.current?.click()}
                      disabled={plUploadingThumb}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-white/15 hover:border-amber-500 rounded-lg text-xs font-semibold text-zinc-200 cursor-pointer"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                      {plUploadingThumb ? `Uploading (${plThumbProgress}%)` : 'Upload Image'}
                    </button>
                    <input
                      type="text"
                      value={plFormThumb}
                      onChange={(e) => setPlFormThumb(e.target.value)}
                      placeholder="Or enter image URL"
                      className="w-full bg-zinc-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300"
                    />
                  </div>
                </div>
              </div>

              {/* Order & Published toggle */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={plFormOrder}
                    onChange={(e) => setPlFormOrder(parseInt(e.target.value) || 1)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Status
                  </label>
                  <button
                    type="button"
                    onClick={() => setPlFormPublished(!plFormPublished)}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer border ${
                      plFormPublished
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    }`}
                  >
                    {plFormPublished ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    {plFormPublished ? 'Published' : 'Unpublished (Draft)'}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setPlaylistModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="save-playlist-submit-btn"
                  type="submit"
                  disabled={plSaving}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {plSaving ? 'Saving...' : 'Save Playlist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EPISODE CREATE / EDIT MODAL */}
      {episodeModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#13141c] border border-white/10 rounded-2xl w-full max-w-2xl p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingEpisode ? 'Edit Bonus Episode' : 'Upload & Add New Bonus Episode'}
              </h3>
              <button
                onClick={() => setEpisodeModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEpisode} className="space-y-4">
              {/* Row 1: Episode Number & Playlist */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Episode Number
                  </label>
                  <input
                    id="episode-number-input"
                    type="number"
                    min="1"
                    value={epFormNumber}
                    onChange={(e) => setEpFormNumber(parseInt(e.target.value) || 1)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Playlist
                  </label>
                  <select
                    id="episode-playlist-select"
                    value={epFormPlaylistId}
                    onChange={(e) => setEpFormPlaylistId(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                    required
                  >
                    {playlists.map((pl) => (
                      <option key={pl.id} value={pl.id}>
                        {pl.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Episode Title */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Episode Title
                </label>
                <input
                  id="episode-title-input"
                  type="text"
                  value={epFormTitle}
                  onChange={(e) => setEpFormTitle(e.target.value)}
                  placeholder="e.g. India Got Latent Bonus Episode 1: Uncut Roasts"
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Description / Synopsis
                </label>
                <textarea
                  id="episode-desc-input"
                  value={epFormDesc}
                  onChange={(e) => setEpFormDesc(e.target.value)}
                  placeholder="What happens in this bonus episode? Comedians, acts, roast notes..."
                  rows={2}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* VIDEO UPLOAD COMPONENT (BUNNY STREAM) */}
              <div className="p-4 bg-zinc-900/90 rounded-xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" />
                    Bunny Stream Video Delivery
                  </label>
                  {epFormStorageKey && (
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Key: {epFormStorageKey}
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*,.mp4,.webm,.mkv"
                    onChange={handleUploadEpisodeVideo}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={isVideoUploading}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold cursor-pointer disabled:opacity-50 transition-all shadow-md shadow-amber-500/20"
                  >
                    <Upload className="w-4 h-4" />
                    {isVideoUploading ? 'Uploading to Bunny Stream...' : 'Upload Video to Bunny Stream'}
                  </button>

                  <span className="text-xs text-zinc-400">or paste Bunny Stream Embed / URL:</span>
                </div>

                {/* Video Upload Progress Bar */}
                {isVideoUploading && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-zinc-300 font-semibold">
                      <span>Uploading to Bunny Stream Video Library...</span>
                      <span>{videoUploadProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 transition-all duration-150"
                        style={{ width: `${videoUploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <input
                  id="episode-video-url-input"
                  type="text"
                  value={epFormVideoUrl}
                  onChange={(e) => setEpFormVideoUrl(e.target.value)}
                  placeholder="e.g. https://iframe.mediadelivery.net/embed/318290/a1b2c3d4 or video GUID"
                  className="w-full bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-zinc-200"
                  required
                />

                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span>Accepts: Bunny Stream iframe URL, Video GUID, or MP4 CDN URL</span>
                  {(epFormVideoUrl.includes('iframe.mediadelivery.net') || epFormVideoUrl.startsWith('bunny-stream:')) && (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      ✓ Bunny Stream Player Active
                    </span>
                  )}
                </div>
              </div>

              {/* THUMBNAIL UPLOAD COMPONENT */}
              <div className="p-4 bg-zinc-900/90 rounded-xl border border-white/10 space-y-3">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-amber-400" />
                  Episode Thumbnail
                </label>

                <div className="flex items-center gap-4">
                  <div className="w-28 aspect-video rounded-lg overflow-hidden bg-black border border-white/10 shrink-0">
                    <img src={epFormThumbnailUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>

                  <div className="flex-1 space-y-2">
                    <input
                      ref={thumbInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleUploadEpisodeThumbnail}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => thumbInputRef.current?.click()}
                      disabled={isThumbUploading}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-white/15 rounded-lg text-xs font-semibold text-zinc-200 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                      {isThumbUploading ? `Uploading (${thumbUploadProgress}%)` : 'Upload Thumbnail Image'}
                    </button>
                    <input
                      id="episode-thumb-url-input"
                      type="text"
                      value={epFormThumbnailUrl}
                      onChange={(e) => setEpFormThumbnailUrl(e.target.value)}
                      placeholder="Or enter image URL"
                      className="w-full bg-zinc-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300"
                    />
                  </div>
                </div>
              </div>

              {/* Duration, Order & Published toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Duration (e.g. 14:20)
                  </label>
                  <input
                    type="text"
                    value={epFormDuration}
                    onChange={(e) => setEpFormDuration(e.target.value)}
                    placeholder="14:20"
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Order Sequence
                  </label>
                  <input
                    type="number"
                    value={epFormOrder}
                    onChange={(e) => setEpFormOrder(parseInt(e.target.value) || 1)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Publish Status
                  </label>
                  <button
                    type="button"
                    onClick={() => setEpFormPublished(!epFormPublished)}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer border ${
                      epFormPublished
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    }`}
                  >
                    {epFormPublished ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    {epFormPublished ? 'Published' : 'Unpublished (Draft)'}
                  </button>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEpisodeModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="save-episode-submit-btn"
                  type="submit"
                  disabled={epSaving}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {epSaving ? 'Saving Episode...' : 'Save to Firestore'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Change Password Modal */}
      {showPasswordChangeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181926] border border-white/15 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">Change Admin Password</h3>
              </div>
              <button
                onClick={() => setShowPasswordChangeModal(false)}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Set a new custom password for <span className="text-amber-400 font-mono">rajatb419@gmail.com</span>. This will be saved directly for future admin logins.
            </p>

            <form onSubmit={handleSaveNewPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  New Password
                </label>
                <input
                  id="new-admin-password-input"
                  type="password"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowPasswordChangeModal(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="save-new-password-btn"
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold cursor-pointer"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
