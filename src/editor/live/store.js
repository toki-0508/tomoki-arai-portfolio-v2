// 編集モードの状態(表示の切り替え・下書きの一覧・メモ・開いているパネル)と、保存窓口とのやり取り
import { useSyncExternalStore } from 'react';

const API = '/__editor';
let state = { mode: 'edit', drafts: [], notes: '', error: '', panel: null, focusField: null };
const listeners = new Set();

function set(patch) {
  state = { ...state, ...patch };
  for (const listener of listeners) listener();
}

export const getState = () => state;
const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
export const useEditorState = () => useSyncExternalStore(subscribe, getState);

async function request(method, url, body, type = 'application/json') {
  const init = { method, headers: { 'X-Editor': '1' } };
  if (body !== undefined) {
    init.headers['Content-Type'] = type;
    init.body = type === 'application/json' ? JSON.stringify(body) : body;
  }
  const res = await fetch(`${API}${url}`, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `保存できませんでした(${res.status})`);
  return data;
}

// 失敗したら編集バーにメッセージを出して false を返す
async function run(task) {
  try {
    const result = await task();
    set({ error: '' });
    return result ?? true;
  } catch (err) {
    set({ error: err.message });
    return false;
  }
}

export const refresh = () =>
  run(async () => {
    const data = await request('GET', '/state');
    set({ drafts: data.drafts, notes: data.notes });
  });

export const savePatch = (file, target, value) =>
  run(async () => {
    await request('POST', '/patch', { file, target, value });
    await refresh();
  });

export const uploadImage = (file, blob) =>
  run(async () => {
    const data = await request('POST', `/image?file=${encodeURIComponent(file)}`, blob, blob.type);
    await refresh();
    return data.image;
  });

export const discard = (file) =>
  run(async () => {
    await request('POST', '/discard', { file });
    await refresh();
  });

export const discardAll = () =>
  run(async () => {
    await request('POST', '/discard', {});
    await refresh();
  });

export const saveNotes = (text) =>
  run(async () => {
    await request('PUT', '/notes', { text });
    set({ notes: text });
  });

export const setMode = (mode) => set({ mode });
export const openPanel = (panel, focusField = null) => set({ panel, focusField });
export const closePanel = () => set({ panel: null, focusField: null });
export const showError = (message) => set({ error: message });
