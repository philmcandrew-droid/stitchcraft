import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Platform } from 'react-native';
import { deleteAsync } from 'expo-file-system/legacy';

import { persistOpenRouterDataUrlImage } from '@/lib/persistAiGalleryImage';
import type { GalleryImageEntry, PersistedGalleryBundle } from '@/lib/types';

const STORAGE_KEY = '@stitchcraft/gallery_images_v1';

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

type GalleryContextValue = {
  ready: boolean;
  galleryImages: GalleryImageEntry[];
  /** Writes to disk (or keeps data URL on web), prepends to gallery, returns the stored entry. */
  addGeneratedPatternImage: (dataUrl: string, prompt: string) => Promise<GalleryImageEntry>;
  removeGalleryImage: (id: string) => void;
};

const GalleryContext = createContext<GalleryContextValue | null>(null);

export function GalleryProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [galleryImages, setGalleryImages] = useState<GalleryImageEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw && !cancelled) {
          const parsed = JSON.parse(raw) as PersistedGalleryBundle;
          if (parsed?.v === 1 && Array.isArray(parsed.images)) {
            setGalleryImages(parsed.images);
          }
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const bundle: PersistedGalleryBundle = { v: 1, images: galleryImages };
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(bundle));
  }, [ready, galleryImages]);

  const addGeneratedPatternImage = useCallback(async (dataUrl: string, prompt: string) => {
    const id = newId();
    const uri = await persistOpenRouterDataUrlImage(dataUrl, id);
    const entry: GalleryImageEntry = {
      id,
      uri,
      createdAt: Date.now(),
      prompt: prompt.trim().slice(0, 500),
    };
    setGalleryImages((prev) => [entry, ...prev]);
    return entry;
  }, []);

  const removeGalleryImage = useCallback((id: string) => {
    setGalleryImages((prev) => {
      const victim = prev.find((g) => g.id === id);
      if (victim?.uri.startsWith('file:') && Platform.OS !== 'web') {
        void deleteAsync(victim.uri, { idempotent: true });
      }
      return prev.filter((g) => g.id !== id);
    });
  }, []);

  const value = useMemo<GalleryContextValue>(
    () => ({
      ready,
      galleryImages,
      addGeneratedPatternImage,
      removeGalleryImage,
    }),
    [ready, galleryImages, addGeneratedPatternImage, removeGalleryImage],
  );

  return <GalleryContext.Provider value={value}>{children}</GalleryContext.Provider>;
}

export function useGallery(): GalleryContextValue {
  const ctx = useContext(GalleryContext);
  if (!ctx) throw new Error('useGallery must be used within GalleryProvider');
  return ctx;
}
