export type ThreadSwatch = {
  dmc: string;
  hex: string;
  name?: string;
};

export type Project = {
  id: string;
  name: string;
  width: number;
  height: number;
  /** length width*height; -1 empty, else palette index */
  design: number[];
  palette: ThreadSwatch[];
  /** length width*height; only meaningful where design[i] >= 0 */
  stitched: boolean[];
  tags: string[];
  updatedAt: number;
};

export type PersistedBundle = {
  v: 1;
  projects: Project[];
  activeProjectId: string | null;
};

/** Raster previews from the AI pattern tab (stored separately from chart projects). */
export type GalleryImageEntry = {
  id: string;
  /** `file://` on native, or a `data:` URL on web */
  uri: string;
  createdAt: number;
  prompt: string;
};

export type PersistedGalleryBundle = {
  v: 1;
  images: GalleryImageEntry[];
};
