// ============================================================
// 編集できる文章。
//   kind="line"   … その場で1行を書き換える(Enter で確定、Esc で取り消し、外をクリックで確定)
//   kind="blocks" … 本文を入力欄に切り替える(空行で段落、「- 」で箇条書き。Cmd+Enter か外をクリックで確定)
//   kind="list"   … 1行に1項目(steps など)
// クリックは useClickCapture がまとめて受け取る(リンクやボタンは動かさない)。
// ============================================================
import { createElement, Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { getState, savePatch, showError } from './store.js';

// 編集できる要素 → 編集を始める関数
const openers = new WeakMap();

// 文言の中の {name} の差し込みを並べた文字列(変わったかどうかの比較用)
const placeholders = (text) => (String(text).match(/\{\w+\}/g) ?? []).sort().join(' ');

export function useClickCapture() {
  useEffect(() => {
    const onClick = (event) => {
      if (getState().mode !== 'edit') return;
      if (!(event.target instanceof Element) || event.target.closest('[data-editor-ui]')) return;
      // ページ側のリンク・ボタン・フォームは動かさない(閲覧に切り替えると動く)
      event.preventDefault();
      event.stopPropagation();
      const el = event.target.closest('[data-portfolio-editable]');
      if (el && !el.classList.contains('is-editing')) openers.get(el)?.();
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);
}

function LineEditor({ raw, hint, onDone }) {
  const ref = useRef(null);
  const done = useRef(false);

  useLayoutEffect(() => {
    const el = ref.current;
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
  }, []);

  const finish = (save) => {
    if (done.current) return;
    done.current = true;
    onDone(save ? ref.current.textContent.replace(/\s*\n\s*/g, ' ').trim() : null);
  };

  return (
    <Fragment>
      <span
        ref={ref}
        className="ped is-editing"
        data-portfolio-editable="line"
        contentEditable="plaintext-only"
        suppressContentEditableWarning
        spellCheck={false}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            // 日本語入力の変換を確定する Enter では確定しない
            if (event.nativeEvent.isComposing || event.keyCode === 229) return;
            event.preventDefault();
            finish(true);
          } else if (event.key === 'Escape') {
            event.preventDefault();
            finish(false);
          }
        }}
        onBlur={() => finish(true)}
      >
        {raw}
      </span>
      {hint && <span className="ped-hint" data-editor-ui>{hint}</span>}
    </Fragment>
  );
}

function BlockEditor({ raw, kind, onDone }) {
  const ref = useRef(null);
  const done = useRef(false);
  const fit = () => {
    const el = ref.current;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + 2}px`;
  };

  useLayoutEffect(() => {
    fit();
    ref.current.focus();
  }, []);

  const finish = (save) => {
    if (done.current) return;
    done.current = true;
    if (!save) return onDone(null);
    const text = ref.current.value;
    onDone(kind === 'list' ? text.split('\n').map((line) => line.replace(/^\s*-\s+/, '').trim()).filter(Boolean) : text);
  };

  return (
    <Fragment>
      <textarea
        ref={ref}
        className="ped is-editing ped-textarea"
        data-portfolio-editable={kind}
        defaultValue={kind === 'list' ? raw.join('\n') : raw}
        spellCheck={false}
        onInput={fit}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            finish(true);
          } else if (event.key === 'Escape') {
            event.preventDefault();
            finish(false);
          }
        }}
        onBlur={() => finish(true)}
      />
      <p className="ped-hint" data-editor-ui>
        {kind === 'list' ? '1行に1項目' : '空行で段落、「- 」で始まる行は箇条書き'}。Cmd+Enter で確定、Esc で取り消し
      </p>
    </Fragment>
  );
}

export function Editable({ file, target, raw, kind = 'line', required = true, hint = null, children }) {
  const ref = useRef(null);
  const [editing, setEditing] = useState(false);

  // 描き直しで要素が入れ替わることがあるので、毎回登録し直す
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    openers.set(el, () => setEditing(true));
    return () => openers.delete(el);
  });

  const onDone = (value) => {
    setEditing(false);
    if (value === null || JSON.stringify(value) === JSON.stringify(raw)) return;
    if (required && (value === '' || (Array.isArray(value) && !value.length))) {
      showError('空にはできません。元の文章に戻しました');
      return;
    }
    if (kind === 'line' && placeholders(value) !== placeholders(raw)) {
      const ok = window.confirm(
        `自動で入る部分(${placeholders(raw) || 'なし'})が変わっています。\nこのまま保存しますか?`,
      );
      if (!ok) return;
    }
    savePatch(file, target, value);
  };

  if (editing) {
    return kind === 'line'
      ? <LineEditor raw={raw} hint={hint} onDone={onDone} />
      : <BlockEditor raw={raw} kind={kind} onDone={onDone} />;
  }
  return createElement(kind === 'line' ? 'span' : 'div', { ref, className: 'ped', 'data-portfolio-editable': kind }, children);
}
