export interface UserProfile {
  uid: string;
  email: string;
  role: 'admin' | 'viewer';
  createdAt: string;
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  order: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  episodeCount?: number;
}

export interface Episode {
  id: string;
  playlistId: string;
  playlistTitle?: string;
  episodeNumber: number;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  videoStorageKey?: string;
  duration?: string;
  order: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StorageConfigStatus {
  configured: boolean;
  provider: 'bunny-stream' | 'local-preview';
  libraryId?: string;
  cdnUrl?: string;
  hostname?: string;
  endpoint?: string;
  missingVars: string[];
  features?: {
    hlsReady: boolean;
    adaptiveBitrate: boolean;
    directStreaming: boolean;
    bunnyStreamDelivery?: boolean;
    embedPlayer?: boolean;
  };
}

export interface UploadResult {
  success: boolean;
  storageKey: string;
  publicUrl: string;
  thumbnailUrl?: string;
  guid?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  provider: string;
}
