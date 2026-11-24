// 画面下の編集バーと、そこから開くパネル
import { Fragment, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useClickCapture } from './Editable.jsx';
import { Panel } from './Panels.jsx';
import { closePanel, discardAll, openPanel, refresh, setMode, useEditorState } from './store.js';

export function EditorRoot({ route }) {
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
  const toggle = (name) => (state.panel === name ? closePanel() : openPanel(name));

  return createPortal(
    <Fragment>
      <Panel route={route} />
      <div className="portfolio-editor-bar" data-editor-ui role="toolbar" aria-label="編集モード">
        <span className="peb-title">編集モード</span>
        <div className="peb-switch" role="group" aria-label="表示の切り替え">
          <button type="button" aria-pressed={state.mode === 'edit'} onClick={() => setMode('edit')}>編集</button>
          <button type="button" aria-pressed={state.mode === 'view'} onClick={() => setMode('view')}>閲覧</button>
        </div>
        <button type="button" className="peb-count" aria-pressed={state.panel === 'changes'} onClick={() => toggle('changes')}>
          変更 {state.drafts.length}件
        </button>
        <button type="button" aria-pressed={state.panel === 'settings'} onClick={() => toggle('settings')}>
          このページの設定
        </button>
        <a href="/__skill-tree" target="_blank" rel="noreferrer">スキルツリーを配置</a>
        <button type="button" aria-pressed={state.panel === 'notes'} onClick={() => toggle('notes')}>
          Claudeへのメモ{state.notes.trim() ? ' ●' : ''}
        </button>
        <button type="button" className="peb-danger" onClick={confirmDiscardAll} disabled={!state.drafts.length}>
          すべて取り消す
        </button>
        {state.error && <p className="peb-error" role="alert">{state.error}</p>}
      </div>
    </Fragment>,
    document.body,
  );
}
