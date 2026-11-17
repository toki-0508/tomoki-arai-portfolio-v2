// ============================================================
// 差し替えられる画像。画像の枠(この部品を置いた親要素)の右上に「画像を差し替え」を出し、
// クリックでファイルを選ぶか、枠の上にドラッグ&ドロップして差し替える。
// ============================================================
import { Fragment, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { reencodeImage } from './reencode.js';
import { getState, openPanel, showError, uploadImage } from './store.js';

export function EditableImage({ item, children }) {
  const buttonRef = useRef(null);
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const replace = async (file) => {
    if (!file || busy) return;
    setBusy(true);
    try {
      const image = await uploadImage(item.source, await reencodeImage(file));
      // 作品の画像は説明文(alt)も確かめてもらう
      if (image && item.source.startsWith('src/content/works/')) openPanel('settings', 'imageAlt');
    } catch (err) {
      showError(err.message);
    } finally {
      setBusy(false);
    }
  };
  const replaceRef = useRef(replace);
  replaceRef.current = replace;

  useEffect(() => {
    const host = buttonRef.current?.parentElement;
    if (!host) return undefined;
    const hasFile = (event) => getState().mode === 'edit' && [...(event.dataTransfer?.types ?? [])].includes('Files');
    const over = (event) => {
      if (!hasFile(event)) return;
      event.preventDefault();
      host.classList.add('is-dropping');
    };
    const leave = () => host.classList.remove('is-dropping');
    const drop = (event) => {
      leave();
      if (!hasFile(event)) return;
      event.preventDefault();
      replaceRef.current(event.dataTransfer.files[0]);
    };
    host.classList.add('ped-image-host');
    host.addEventListener('dragover', over);
    host.addEventListener('dragleave', leave);
    host.addEventListener('drop', drop);
    return () => {
      host.classList.remove('ped-image-host', 'is-dropping');
      host.removeEventListener('dragover', over);
      host.removeEventListener('dragleave', leave);
      host.removeEventListener('drop', drop);
    };
  }, []);

  return (
    <Fragment>
      {children}
      <button
        ref={buttonRef}
        type="button"
        className="ped-image-btn"
        data-editor-ui
        disabled={busy}
        onClick={(event) => {
          // カードはリンクなので、ボタンを押してもページを移動させない
          event.preventDefault();
          event.stopPropagation();
          inputRef.current?.click();
        }}
      >
        {busy ? '保存しています…' : '画像を差し替え'}
      </button>
      {/* リンクの中に置くとクリックがリンクに伝わるので、ファイル選択は body 直下に置く */}
      {createPortal(
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          hidden
          data-editor-ui
          // ポータルのイベントは React の木では親(リンク)へ伝わるので、ここで止める
          onClick={(event) => event.stopPropagation()}
          onChange={(event) => {
            replace(event.target.files?.[0]);
            event.target.value = '';
          }}
        />,
        document.body,
      )}
    </Fragment>
  );
}
