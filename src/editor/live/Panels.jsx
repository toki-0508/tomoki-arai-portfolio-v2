// ============================================================
// 編集バーから開くパネル
//   changes  … 変更した下書きの一覧と、1件ずつの取り消し
//   settings … このページの設定(画面に出ない項目と、クリックでは直せない文言)
//   notes    … Claude へのメモ
// ============================================================
import { useEffect, useRef, useState } from 'react';
import { COPY } from '../../content/copy.js';
import { SITE } from '../../content/site.js';
import { DOWNLOADS, workById } from '../../content/loader.js';
import { DOWNLOAD_FIELDS, WORK_FIELDS } from '../patch.js';
import { COPY_FILE, SITE_FILE } from '../shared.js';
import { closePanel, discard, saveNotes, savePatch, useEditorState } from './store.js';

const WORK_LABELS = {
  name: '作品名',
  summary: '紹介文(一覧カード)',
  role: '自分の担当',
  status: '現在地',
  outcome: '確認できた成果',
  date: '制作時期(2026-10 の形)',
  tags: '使用技術(カンマ区切り)',
  steps: '操作の流れ(1行に1つ)',
  url: '公開URL',
  github: 'GitHub URL',
  imageAlt: '画像の説明文(読み上げ用)',
  imageCaption: '画像の注記',
  imageFit: '画像の表示',
};
const DOWNLOAD_LABELS = {
  name: '名前',
  date: '公開時期(2026-10 の形)',
  size: 'ファイルサイズ',
  length: '長さ(音源)',
  platform: '対応環境',
  note: '使うときの注意',
  downloadLabel: 'ダウンロードボタンの文言(空なら共通の文言)',
  tags: 'タグ(カンマ区切り)',
};
const PROFILE_LABELS = {
  nameJa: '名前',
  nameEn: '名前(英語)',
  reading: '読み',
  nickname: '通称',
  affiliation: '所属',
  fields: '制作領域',
  fieldsEn: '制作領域(英語)',
  tagline: 'キャッチコピー',
};
const PAGE_PREFIX = { '/': 'home.', '/about': 'about.', '/works': 'works.', '/downloads': 'downloads.', '/contact': 'contact.' };
const prefixFor = (route) => (route.startsWith('/works/') ? 'work.' : PAGE_PREFIX[route] ?? 'home.');
const placeholders = (text) => (String(text).match(/\{\w+\}/g) ?? []).sort().join(' ');

// 1項目の入力欄。外をクリックするか Enter で保存する
function Field({ label, code, type, value, onSave, focus }) {
  const ref = useRef(null);
  const initial = type === 'list' ? (value ?? []).join('\n') : type === 'tags' ? (value ?? []).join(', ') : value ?? '';
  const [text, setText] = useState(initial);
  useEffect(() => setText(initial), [initial]);
  useEffect(() => {
    if (!focus) return;
    ref.current?.focus();
    ref.current?.scrollIntoView({ block: 'center' });
  }, [focus]);

  const commit = () => {
    if (text === initial) return;
    if (type === 'list') onSave(text.split('\n').map((line) => line.replace(/^\s*-\s+/, '').trim()).filter(Boolean));
    else if (type === 'tags') onSave(text.split(',').map((item) => item.trim()).filter(Boolean));
    else onSave(text.trim());
  };

  let input;
  if (type === 'fit') {
    input = (
      <select ref={ref} value={value ?? ''} onChange={(event) => onSave(event.target.value)}>
        <option value="">枠いっぱい(はみ出す部分は切る)</option>
        <option value="contain">全体を表示</option>
      </select>
    );
  } else if (type === 'list') {
    input = <textarea ref={ref} rows={4} value={text} onChange={(event) => setText(event.target.value)} onBlur={commit} />;
  } else {
    input = (
      <input
        ref={ref}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.nativeEvent.isComposing && event.keyCode !== 229) {
            event.preventDefault();
            commit();
          }
        }}
      />
    );
  }
  return (
    <label className="pep-field">
      <span>{label}{code && <code>{code}</code>}</span>
      {input}
    </label>
  );
}

const fieldType = (fields, field) => (field === 'tags' ? 'tags' : fields[field] === 'list' ? 'list' : fields[field] === 'fit' ? 'fit' : 'text');

function ItemFields({ item, fields, labels, focusField }) {
  return Object.keys(fields).map((field) => (
    <Field
      key={field}
      label={labels[field]}
      type={fieldType(fields, field)}
      value={item[field]}
      focus={focusField === field}
      onSave={(value) => savePatch(item.source, { field }, value)}
    />
  ));
}

function saveCopy(key, value) {
  if (placeholders(value) !== placeholders(COPY[key])) {
    const ok = window.confirm(`自動で入る部分(${placeholders(COPY[key]) || 'なし'})が変わっています。\nこのまま保存しますか?`);
    if (!ok) return;
  }
  savePatch(COPY_FILE, { key }, value);
}

function CopyGroup({ title, prefix, open }) {
  const keys = Object.keys(COPY).filter((key) => key.startsWith(prefix));
  return (
    <details open={open}>
      <summary>{title}</summary>
      {keys.map((key) => (
        <Field key={key} label="" code={key} type="text" value={COPY[key]} onSave={(value) => saveCopy(key, value)} />
      ))}
    </details>
  );
}

function SettingsPanel({ route }) {
  const { focusField } = useEditorState();
  const work = route.startsWith('/works/') ? workById(route.split('/').pop()) : null;
  return (
    <div>
      {work && (
        <details open>
          <summary>この作品「{work.name}」</summary>
          <ItemFields item={work} fields={WORK_FIELDS} labels={WORK_LABELS} focusField={focusField} />
        </details>
      )}
      {route === '/downloads' && DOWNLOADS.map((file) => (
        <details key={file.id}>
          <summary>ダウンロード「{file.name}」</summary>
          <ItemFields item={file} fields={DOWNLOAD_FIELDS} labels={DOWNLOAD_LABELS} focusField={null} />
        </details>
      ))}
      <CopyGroup title="このページの文言" prefix={prefixFor(route)} open={!work} />
      <CopyGroup title="共通の部品の文言" prefix="common." />
      <CopyGroup title="ナビ・フッター・タブのタイトル" prefix="layout." />
      <details>
        <summary>プロフィールの基本情報</summary>
        {Object.keys(PROFILE_LABELS).map((field) => (
          <Field
            key={field}
            label={PROFILE_LABELS[field]}
            type="text"
            value={SITE.PROFILE[field]}
            onSave={(value) => savePatch(SITE_FILE, { path: `PROFILE.${field}` }, value)}
          />
        ))}
        <Field
          label="「いま取り組んでいること」の時点(2026-10 の形)"
          type="text"
          value={SITE.NOW_UPDATED}
          onSave={(value) => savePatch(SITE_FILE, { path: 'NOW_UPDATED' }, value)}
        />
      </details>
    </div>
  );
}

function ChangesPanel() {
  const { drafts } = useEditorState();
  if (!drafts.length) return <p className="pep-muted">下書きはまだありません。</p>;
  return (
    <ul className="pep-changes">
      {drafts.map((draft) => (
        <li key={draft.file}>
          <div>
            <strong>{draft.label}</strong>
            <code>{draft.file}</code>
            {draft.images.length > 0 && <span className="pep-muted">画像を差し替えています</span>}
            {draft.conflict && (
              <span className="pep-warn">下書きを作り始めた後に、元のファイルが更新されています。公開の前に Claude が確認します。</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => window.confirm(`「${draft.label}」の下書きを取り消します。よろしいですか?`) && discard(draft.file)}
          >
            取り消す
          </button>
        </li>
      ))}
    </ul>
  );
}

function NotesPanel() {
  const { notes } = useEditorState();
  const [text, setText] = useState(notes);
  const [saved, setSaved] = useState(false);
  useEffect(() => setText(notes), [notes]);
  return (
    <div>
      <p className="pep-muted">公開を頼むときに Claude が読みます。「ここは長いかも」「この表現でいいか見てほしい」など、自由に書いてください。</p>
      <textarea
        className="pep-notes"
        rows={8}
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          setSaved(false);
        }}
        onBlur={async () => {
          if (text !== notes && (await saveNotes(text))) setSaved(true);
        }}
      />
      <p className="pep-muted">{saved ? '保存しました' : '入力欄の外をクリックすると保存されます'}</p>
    </div>
  );
}

const TITLES = { changes: '変更した下書き', settings: 'このページの設定', notes: 'Claudeへのメモ' };

export function Panel({ route }) {
  const { panel } = useEditorState();
  if (!panel) return null;
  return (
    <aside className="portfolio-editor-panel" data-editor-ui aria-label={TITLES[panel]}>
      <header>
        <h2>{TITLES[panel]}</h2>
        <button type="button" onClick={closePanel} aria-label="閉じる">閉じる</button>
      </header>
      <div className="pep-body">
        {panel === 'changes' && <ChangesPanel />}
        {panel === 'settings' && <SettingsPanel route={route} />}
        {panel === 'notes' && <NotesPanel />}
      </div>
    </aside>
  );
}
