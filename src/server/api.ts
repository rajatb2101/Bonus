import express, { Request, Response, Router } from 'express';
import multer from 'multer';
import path from 'path';
import {
  getStorageConfig,
  getPresignedUploadUrl,
  deleteStorageObject,
  saveUploadedFile,
  getVideoPublicUrl
} from './storageService';

export const apiRouter: Router = express.Router();

// Configure multer memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB upload limit
  }
});

/**
 * Storage configuration status endpoint
 */
apiRouter.get('/storage/config', (req: Request, res: Response) => {
  const config = getStorageConfig();
  const missingVars: string[] = [];

  const hasLib = process.env.BUNNY_STREAM_LIBRARY_ID || process.env.BUNNY_LIBRARY_ID;
  const hasKey = process.env.BUNNY_STREAM_API_KEY || process.env.BUNNY_API_KEY;

  if (!hasLib) missingVars.push('BUNNY_STREAM_LIBRARY_ID (Video Library ID)');
  if (!hasKey) missingVars.push('BUNNY_STREAM_API_KEY (Stream API Key)');

  const isConfigured = config.provider === 'bunny-stream';

  res.json({
    configured: isConfigured,
    provider: config.provider,
    targetProvider: 'bunny-stream',
    libraryId: config.libraryId || 'Not configured',
    hostname: config.cdnHostname || 'iframe.mediadelivery.net',
    endpoint: config.endpoint,
    cdnUrl: config.cdnUrl || 'https://iframe.mediadelivery.net',
    missingVars,
    features: {
      hlsReady: true,
      adaptiveBitrate: true,
      directStreaming: true,
      bunnyStreamDelivery: isConfigured,
      embedPlayer: true,
    }
  });
});

/**
 * Presigned upload URL generation endpoint (direct browser -> Cloudflare R2)
 */
apiRouter.post('/storage/presigned-url', async (req: Request, res: Response) => {
  try {
    const { filename, contentType, folder = 'videos' } = req.body;
    if (!filename || !contentType) {
      return res.status(400).json({ error: 'filename and contentType are required' });
    }

    const ext = filename.split('.').pop() || 'mp4';
    const cleanName = filename
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_{2,}/g, '_')
      .toLowerCase();
    const timestamp = Date.now();
    const storageKey = `${folder}/${timestamp}_${cleanName}.${ext}`;

    const result = await getPresignedUploadUrl(storageKey, contentType);
    res.json(result);
  } catch (err: any) {
    console.error('Presigned URL error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate upload URL' });
  }
});

/**
 * Direct file upload handler (multipart stream)
 */
apiRouter.post('/storage/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const folder = (req.query.folder as string) || (req.body.folder as string) || 'media';
    const customKey = (req.query.key as string) || (req.body.key as string);
    
    let storageKey = customKey;
    if (!storageKey) {
      const ext = file.originalname.split('.').pop() || 'bin';
      const cleanName = file.originalname
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .toLowerCase();
      storageKey = `${folder}/${Date.now()}_${cleanName}`;
      if (!storageKey.endsWith(`.${ext}`)) {
        storageKey += `.${ext}`;
      }
    }

    const title = (req.body.title as string) || (req.query.title as string);
    const result = await saveUploadedFile(storageKey, file.buffer, file.mimetype, title);

    res.json({
      success: true,
      storageKey: result.storageKey,
      publicUrl: result.publicUrl,
      thumbnailUrl: result.thumbnailUrl,
      guid: result.guid,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      provider: result.provider
    });
  } catch (err: any) {
    console.error('Upload handler error:', err);
    res.status(500).json({ error: err.message || 'File upload failed' });
  }
});

/**
 * Storage deletion endpoint
 */
apiRouter.delete('/storage/file', async (req: Request, res: Response) => {
  try {
    const { storageKey } = req.body;
    if (!storageKey) {
      return res.status(400).json({ error: 'storageKey is required' });
    }

    const deleted = await deleteStorageObject(storageKey);
    res.json({ success: deleted, storageKey });
  } catch (err: any) {
    console.error('Delete storage error:', err);
    res.status(500).json({ error: err.message || 'Failed to delete file' });
  }
});

/**
 * Public URL resolver endpoint for storage key
 */
apiRouter.get('/storage/url', (req: Request, res: Response) => {
  const key = req.query.key as string;
  if (!key) {
    return res.status(400).json({ error: 'key query parameter is required' });
  }
  res.json({ publicUrl: getVideoPublicUrl(key) });
});

// Full Express application mounted for middleware
export const apiApp = express();
apiApp.use(express.json({ limit: '50mb' }));
apiApp.use(express.urlencoded({ extended: true, limit: '50mb' }));
apiApp.use('/api', apiRouter);
apiApp.use('/uploads', express.static(path.resolve(process.cwd(), 'public/uploads')));
