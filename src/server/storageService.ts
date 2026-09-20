import fs from 'fs';
import path from 'path';

export interface StorageConfig {
  provider: 'bunny-stream' | 'local-preview';
  libraryId?: string;
  apiKey?: string;
  cdnHostname?: string;
  embedBaseUrl?: string;
  endpoint?: string;
  cdnUrl?: string;
}

export function getStorageConfig(): StorageConfig {
  const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID || process.env.BUNNY_LIBRARY_ID;
  const apiKey = process.env.BUNNY_STREAM_API_KEY || process.env.BUNNY_API_KEY;
  const cdnHostname = process.env.BUNNY_STREAM_CDN_HOSTNAME || process.env.BUNNY_CDN_HOSTNAME || process.env.VIDEO_CDN_URL;

  const isBunnyStreamConfigured = Boolean(
    libraryId &&
    apiKey &&
    !libraryId.includes('your_') &&
    !apiKey.includes('your_')
  );

  const cleanHost = cdnHostname ? cdnHostname.replace(/^https?:\/\//, '').replace(/\/$/, '') : undefined;

  return {
    provider: isBunnyStreamConfigured ? 'bunny-stream' : 'local-preview',
    libraryId,
    apiKey,
    cdnHostname: cleanHost,
    embedBaseUrl: 'https://iframe.mediadelivery.net',
    endpoint: `https://video.bunnycdn.com/library/${libraryId || ''}`,
    cdnUrl: cleanHost ? `https://${cleanHost}` : 'https://iframe.mediadelivery.net',
  };
}

/**
 * Resolves the streaming CDN or public URL for a given video/thumbnail storage key
 */
export function getVideoPublicUrl(storageKey: string): string {
  const config = getStorageConfig();

  if (storageKey.startsWith('http://') || storageKey.startsWith('https://')) {
    return storageKey;
  }

  // If storageKey is in bunny-stream format
  if (storageKey.startsWith('bunny-stream:')) {
    const parts = storageKey.split(':');
    let libId = config.libraryId;
    let guid = parts[1];

    if (parts.length >= 3) {
      libId = parts[1];
      guid = parts[2];
    }

    if (libId && guid) {
      return `https://iframe.mediadelivery.net/embed/${libId}/${guid}`;
    }
  }

  const cleanKey = storageKey.replace(/^\/+/, '');
  return `/uploads/${cleanKey}`;
}

/**
 * Generate upload URL or proxy endpoint for video/media upload
 */
export async function getPresignedUploadUrl(
  storageKey: string,
  contentType: string
): Promise<{ uploadUrl: string; storageKey: string; publicUrl: string; provider: string }> {
  const config = getStorageConfig();

  return {
    uploadUrl: `/api/storage/upload?key=${encodeURIComponent(storageKey)}`,
    storageKey,
    publicUrl: getVideoPublicUrl(storageKey),
    provider: config.provider,
  };
}

/**
 * Delete a file from Bunny Stream or local preview storage
 */
export async function deleteStorageObject(storageKey: string): Promise<boolean> {
  const config = getStorageConfig();

  if (storageKey.startsWith('bunny-stream:') && config.apiKey) {
    try {
      const parts = storageKey.split(':');
      let libId = config.libraryId;
      let guid = parts[1];

      if (parts.length >= 3) {
        libId = parts[1];
        guid = parts[2];
      }

      if (libId && guid) {
        const url = `https://video.bunnycdn.com/library/${libId}/videos/${guid}`;
        const res = await fetch(url, {
          method: 'DELETE',
          headers: {
            'AccessKey': config.apiKey,
          },
        });
        return res.ok || res.status === 404;
      }
    } catch (err) {
      console.error('Error deleting video from Bunny Stream:', err);
      return false;
    }
  }

  try {
    const localPath = path.join(process.cwd(), 'public', 'uploads', storageKey);
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
    }
    return true;
  } catch (err) {
    console.error('Error deleting local file:', err);
    return false;
  }
}

/**
 * Save uploaded buffer directly to Bunny Stream (for videos) or local storage (for thumbnails)
 */
export async function saveUploadedFile(
  storageKey: string,
  buffer: Buffer,
  mimeType: string,
  title?: string
): Promise<{ storageKey: string; publicUrl: string; provider: string; guid?: string; thumbnailUrl?: string }> {
  const config = getStorageConfig();
  const isVideo = mimeType.startsWith('video/') || storageKey.startsWith('videos/') || storageKey.endsWith('.mp4') || storageKey.endsWith('.webm');

  // If video and Bunny Stream is configured: Upload directly to Bunny Stream Video Library!
  if (isVideo && config.provider === 'bunny-stream' && config.libraryId && config.apiKey) {
    try {
      // Step 1: Create Video Object in Bunny Stream
      const videoTitle = title || path.basename(storageKey).replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
      const createUrl = `https://video.bunnycdn.com/library/${config.libraryId}/videos`;

      const createRes = await fetch(createUrl, {
        method: 'POST',
        headers: {
          'AccessKey': config.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          title: videoTitle,
        }),
      });

      if (!createRes.ok) {
        const errText = await createRes.text();
        throw new Error(`Bunny Stream video creation failed (${createRes.status}): ${errText}`);
      }

      const createData = (await createRes.json()) as { guid: string };
      const videoGuid = createData.guid;

      // Step 2: Upload Video File Binary to Bunny Stream
      const uploadUrl = `https://video.bunnycdn.com/library/${config.libraryId}/videos/${videoGuid}`;
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'AccessKey': config.apiKey,
          'Content-Type': 'application/octet-stream',
        },
        body: buffer as unknown as BodyInit,
      });

      if (!uploadRes.ok) {
        const errText = await uploadRes.text();
        throw new Error(`Bunny Stream binary upload failed (${uploadRes.status}): ${errText}`);
      }

      const embedUrl = `https://iframe.mediadelivery.net/embed/${config.libraryId}/${videoGuid}`;
      const thumbUrl = config.cdnHostname
        ? `https://${config.cdnHostname}/${videoGuid}/thumbnail.jpg`
        : undefined;

      return {
        storageKey: `bunny-stream:${config.libraryId}:${videoGuid}`,
        publicUrl: embedUrl,
        provider: 'bunny-stream',
        guid: videoGuid,
        thumbnailUrl: thumbUrl,
      };
    } catch (err: any) {
      console.error('Bunny Stream upload error:', err);
      throw err;
    }
  }

  // Local preview fallback (and for thumbnail image files)
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', path.dirname(storageKey));
  fs.mkdirSync(uploadDir, { recursive: true });
  const filePath = path.join(process.cwd(), 'public', 'uploads', storageKey);
  fs.writeFileSync(filePath, buffer);

  return {
    storageKey,
    publicUrl: getVideoPublicUrl(storageKey),
    provider: 'local-preview',
  };
}
