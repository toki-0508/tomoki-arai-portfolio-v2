// 画面下の編集バー
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useClickCapture } from './Editable.jsx';
import { discardAll, refresh, setMode, useEditorState } from './store.js';

export function EditorRoot() {
  const state = useEditorState();
  useClickCapture();

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    document.documentElement.dataset.editorMode = state.mode;
  }, [state.mode]);

  const confirmDiscardAll = () => {
    if (window.confirm('すべての下書きを取り消します。元に戻せません。よろしいですか?')) discardAll();
  };

  return createPortal(
    <div className="portfolio-editor-bar" data-editor-ui role="toolbar" aria-label="編集モード">
      <span className="peb-title">編集モード</span>
      <div className="peb-switch" role="group" aria-label="表示の切り替え">
        <button type="button" aria-pressed={state.mode === 'edit'} onClick={() => setMode('edit')}>編集</button>
        <button type="button" aria-pressed={state.mode === 'view'} onClick={() => setMode('view')}>閲覧</button>
      </div>
      <span className="peb-count">変更 {state.drafts.length}件</span>
      <button type="button" className="peb-danger" onClick={confirmDiscardAll} disabled={!state.drafts.length}>
        すべて取り消す
      </button>
      {state.error && <p className="peb-error" role="alert">{state.error}</p>}
    </div>,
    document.body,
  );
}
