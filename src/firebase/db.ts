import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db, auth } from './config';
import { Playlist, Episode, UserProfile } from '../types';

const PLAYLISTS_COLLECTION = 'playlists';
const EPISODES_COLLECTION = 'episodes';
const USERS_COLLECTION = 'users';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const isSamplePlaylist = (p: { id: string }): boolean =>
  p.id === 'india-got-latent-bonus-episodes' ||
  p.id === 'india-got-latent-uncut-judgements' ||
  p.id === 'india-got-latent-green-room-tapes';

export const isSampleEpisode = (e: { id: string; videoUrl?: string }): boolean =>
  e.id.startsWith('igl-bonus-ep-') ||
  e.id.startsWith('igl-uncut-ep-') ||
  e.id.startsWith('igl-greenroom-ep-') ||
  Boolean(e.videoUrl && (e.videoUrl.includes('commondatastorage.googleapis.com') || e.videoUrl.includes('BigBuckBunny')));

export const INITIAL_PLAYLISTS: Playlist[] = [];
export const INITIAL_EPISODES: Episode[] = [];

// User Profile Operations
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const docRef = doc(db, USERS_COLLECTION, uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (err) {
    console.warn('Error fetching user profile:', err);
    return null;
  }
}

export async function setUserProfile(profile: UserProfile): Promise<void> {
  const docRef = doc(db, USERS_COLLECTION, profile.uid);
  try {
    await setDoc(docRef, {
      ...profile,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${USERS_COLLECTION}/${profile.uid}`);
  }
}

// Playlist Operations
export async function getPlaylists(publishedOnly = false): Promise<Playlist[]> {
  try {
    const collRef = collection(db, PLAYLISTS_COLLECTION);
    const q = publishedOnly
      ? query(collRef, where('published', '==', true), orderBy('order', 'asc'))
      : query(collRef, orderBy('order', 'asc'));

    const snapshot = await getDocs(q);
    const playlists: Playlist[] = [];
    snapshot.forEach((d) => {
      if (!isSamplePlaylist({ id: d.id })) {
        playlists.push({ id: d.id, ...d.data() } as Playlist);
      }
    });
    return playlists;
  } catch (err) {
    console.warn('Warning getting playlists:', err);
    return [];
  }
}

export async function getPlaylistById(id: string): Promise<Playlist | null> {
  if (isSamplePlaylist({ id })) return null;
  try {
    const docRef = doc(db, PLAYLISTS_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (!isSamplePlaylist({ id: snap.id })) {
        return { ...data, id: snap.id } as Playlist;
      }
    }
    return null;
  } catch (err) {
    console.warn('Error fetching playlist:', err);
    return null;
  }
}

export async function savePlaylist(playlist: Partial<Playlist> & { id: string }): Promise<void> {
  const docRef = doc(db, PLAYLISTS_COLLECTION, playlist.id);
  const now = new Date().toISOString();

  try {
    const existing = await getDoc(docRef);
    if (existing.exists()) {
      await updateDoc(docRef, {
        ...playlist,
        updatedAt: now
      });
    } else {
      await setDoc(docRef, {
        ...playlist,
        order: playlist.order ?? 1,
        published: playlist.published ?? true,
        createdAt: now,
        updatedAt: now
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${PLAYLISTS_COLLECTION}/${playlist.id}`);
  }
}

export async function deletePlaylist(playlistId: string): Promise<void> {
  try {
    const docRef = doc(db, PLAYLISTS_COLLECTION, playlistId);
    await deleteDoc(docRef);

    // Clean up associated episodes
    const epQuery = query(collection(db, EPISODES_COLLECTION), where('playlistId', '==', playlistId));
    const epSnap = await getDocs(epQuery);
    const batch = writeBatch(db);
    epSnap.forEach((d) => {
      batch.delete(d.ref);
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${PLAYLISTS_COLLECTION}/${playlistId}`);
  }
}

// Episode Operations
export async function getEpisodes(playlistId?: string, publishedOnly = false): Promise<Episode[]> {
  try {
    const collRef = collection(db, EPISODES_COLLECTION);
    let q;
    if (playlistId && publishedOnly) {
      q = query(
        collRef,
        where('playlistId', '==', playlistId),
        where('published', '==', true),
        orderBy('order', 'asc')
      );
    } else if (playlistId) {
      q = query(collRef, where('playlistId', '==', playlistId), orderBy('order', 'asc'));
    } else if (publishedOnly) {
      q = query(collRef, where('published', '==', true), orderBy('order', 'asc'));
    } else {
      q = query(collRef, orderBy('order', 'asc'));
    }

    const snapshot = await getDocs(q);
    const episodes: Episode[] = [];
    snapshot.forEach((d) => {
      const data = d.data();
      if (!isSampleEpisode({ id: d.id, videoUrl: data.videoUrl })) {
        episodes.push({ ...data, id: d.id } as Episode);
      }
    });
    return episodes;
  } catch (err) {
    console.warn('Warning fetching episodes:', err);
    return [];
  }
}

export async function getEpisodeById(id: string): Promise<Episode | null> {
  if (isSampleEpisode({ id })) return null;
  try {
    const docRef = doc(db, EPISODES_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (!isSampleEpisode({ id: snap.id, videoUrl: data.videoUrl })) {
        return { ...data, id: snap.id } as Episode;
      }
    }
    return null;
  } catch (err) {
    console.warn('Error fetching episode by id:', err);
    return null;
  }
}

export async function saveEpisode(episode: Partial<Episode> & { id: string }): Promise<void> {
  const docRef = doc(db, EPISODES_COLLECTION, episode.id);
  const now = new Date().toISOString();

  try {
    const existing = await getDoc(docRef);
    if (existing.exists()) {
      await updateDoc(docRef, {
        ...episode,
        updatedAt: now
      });
    } else {
      await setDoc(docRef, {
        ...episode,
        order: episode.order ?? 1,
        published: episode.published ?? true,
        createdAt: now,
        updatedAt: now
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${EPISODES_COLLECTION}/${episode.id}`);
  }
}

export async function deleteEpisode(episodeId: string): Promise<void> {
  try {
    const docRef = doc(db, EPISODES_COLLECTION, episodeId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${EPISODES_COLLECTION}/${episodeId}`);
  }
}

export async function reorderEpisodes(orderedEpisodes: { id: string; order: number }[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    orderedEpisodes.forEach(item => {
      const docRef = doc(db, EPISODES_COLLECTION, item.id);
      batch.update(docRef, { order: item.order, updatedAt: new Date().toISOString() });
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, EPISODES_COLLECTION);
  }
}

export async function reorderPlaylists(orderedPlaylists: { id: string; order: number }[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    orderedPlaylists.forEach(item => {
      const docRef = doc(db, PLAYLISTS_COLLECTION, item.id);
      batch.update(docRef, { order: item.order, updatedAt: new Date().toISOString() });
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, PLAYLISTS_COLLECTION);
  }
}

// Cleanup any remnant sample items from the database
export async function cleanupSampleData(): Promise<number> {
  try {
    const [playlistsSnap, episodesSnap] = await Promise.all([
      getDocs(collection(db, PLAYLISTS_COLLECTION)),
      getDocs(collection(db, EPISODES_COLLECTION))
    ]);

    const batch = writeBatch(db);
    let count = 0;

    playlistsSnap.forEach(d => {
      if (isSamplePlaylist({ id: d.id })) {
        batch.delete(d.ref);
        count++;
      }
    });

    episodesSnap.forEach(d => {
      const data = d.data() as Episode;
      if (isSampleEpisode({ id: d.id, videoUrl: data.videoUrl })) {
        batch.delete(d.ref);
        count++;
      }
    });

    if (count > 0) {
      await batch.commit();
      console.log(`Cleaned up ${count} sample items from Firestore.`);
    }
    return count;
  } catch (err) {
    console.warn('Notice: Sample cleanup skipped:', err);
    return 0;
  }
}

// Ensure no dummy sample data is created
export async function seedInitialDataIfEmpty(): Promise<void> {
  // Clean up any old sample data if present
  await cleanupSampleData();
}

