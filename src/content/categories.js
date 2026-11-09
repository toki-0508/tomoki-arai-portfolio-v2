import { t } from './copy.js';

// 表示名は copy.json(common.category.*)にある
const LABEL_KEYS = {
  all: 'common.category.all',
  app: 'common.category.app',
  web: 'common.category.web',
  electronics: 'common.category.electronics',
  game: 'common.category.game',
  '3d': 'common.category.3d',
  other: 'common.category.other',
};

const categories = (ids) => ids.map((id) => ({ id, label: t(LABEL_KEYS[id]) }));

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

export const categoryLabel = (id) => (LABEL_KEYS[id] ? t(LABEL_KEYS[id]) : undefined);
