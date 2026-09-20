import { StorageConfigStatus, UploadResult } from '../types';

export async function fetchStorageConfig(): Promise<StorageConfigStatus> {
  try {
    const res = await fetch('/api/storage/config');
    if (!res.ok) {
      throw new Error(`Failed to fetch storage config: ${res.statusText}`);
    }
    return await res.json();
  } catch (err: any) {
    console.warn('Storage config API error:', err);
    return {
      configured: false,
      provider: 'local-preview',
      missingVars: ['Server API unreachable'],
    };
  }
}

export async function uploadFileWithProgress(
  file: File,
  folder: 'videos' | 'thumbnails',
  onProgress: (progressPercent: number) => void
): Promise<UploadResult> {
  // Check if direct presigned URL is supported
  try {
    const presignRes = await fetch('/api/storage/presigned-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type || 'application/octet-stream',
        folder
      })
    });

    if (presignRes.ok) {
      const presignData = await presignRes.json();
      const { uploadUrl, storageKey, publicUrl, provider = 'backblaze-b2' } = presignData;

      // If presigned URL is an S3/B2/R2 direct link (starts with http/https)
      if (uploadUrl.startsWith('http://') || uploadUrl.startsWith('https://')) {
        return new Promise<UploadResult>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('PUT', uploadUrl, true);
          xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percent = Math.round((event.loaded / event.total) * 100);
              onProgress(percent);
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              onProgress(100);
              resolve({
                success: true,
                storageKey,
                publicUrl,
                fileName: file.name,
                fileSize: file.size,
                mimeType: file.type,
                provider
              });
            } else {
              reject(new Error(`Presigned upload failed with status ${xhr.status}`));
            }
          };

          xhr.onerror = () => reject(new Error('Network error during presigned upload'));
          xhr.send(file);
        });
      }
    }
  } catch (err) {
    console.log('Falling back to direct multipart upload endpoint:', err);
  }

  // Multipart upload with XMLHttpRequest for live progress
  return new Promise<UploadResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    xhr.open('POST', `/api/storage/upload?folder=${encodeURIComponent(folder)}`, true);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          onProgress(100);
          resolve({
            success: true,
            storageKey: data.storageKey,
            publicUrl: data.publicUrl,
            thumbnailUrl: data.thumbnailUrl,
            guid: data.guid,
            fileName: data.fileName,
            fileSize: data.fileSize,
            mimeType: data.mimeType,
            provider: data.provider || 'server-storage'
          });
        } catch (e) {
          reject(new Error('Invalid response from upload server'));
        }
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during file upload'));
    xhr.send(formData);
  });
}

export async function deleteStorageFile(storageKey: string): Promise<boolean> {
  try {
    const res = await fetch('/api/storage/file', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storageKey })
    });
    const data = await res.json();
    return Boolean(data.success);
  } catch (err) {
    console.error('Failed to delete storage file:', err);
    return false;
  }
}
