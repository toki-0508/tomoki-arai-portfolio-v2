const LABELS = {
  all: 'All',
  app: 'App',
  web: 'Web',
  electronics: 'Electronics',
  game: 'Games & Events',
  '3d': '3D',
  other: 'Other',
};

const categories = (ids) => ids.map((id) => ({ id, label: LABELS[id] }));

export const WORK_CATEGORIES = categories(['all', 'app', 'web', 'electronics', 'game', 'other']);
export const DOWNLOAD_CATEGORIES = categories(['all', 'app', '3d', 'electronics', 'other']);

const LEGACY = {
  work: new Map([['event', 'game'], ['3d', 'other']]),
  download: new Map([['sounds', 'other']]),
};

export function categoryId(kind, value, fallback = 'other') {
  const available = kind === 'work' ? WORK_CATEGORIES : DOWNLOAD_CATEGORIES;
  const requested = LEGACY[kind].get(value) ?? value;
  return available.some(({ id }) => id === requested && id !== 'all') ? requested : fallback;
}

export const categoryLabel = (id) => LABELS[id];
