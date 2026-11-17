// ============================================================
// 編集モード用の部品。src/editor/index.jsx(本番用)と同じ名前・同じ引数で、
// 表示に加えてクリックで書き換えられるようにする。Vite プラグインが差し替える。
// ============================================================
import './editor.css';
import { COPY, t } from '../../content/copy.js';
import { SITE } from '../../content/site.js';
import { splitBody } from '../../lib/markdown-parse.js';
import { COPY_FILE, SITE_FILE, getPath } from '../shared.js';
import { Editable } from './Editable.jsx';

export { EditableImage } from './EditableImage.jsx';
export { EditorRoot } from './EditorBar.jsx';

const PLACEHOLDER_HINT = '{…} は自動で入る部分です';

export function C({ k, vars }) {
  const raw = COPY[k];
  return (
    <Editable file={COPY_FILE} target={{ key: k }} raw={raw} hint={/\{\w+\}/.test(raw) ? PLACEHOLDER_HINT : null}>
      {t(k, vars)}
    </Editable>
  );
}

export function S({ path, children }) {
  const raw = getPath(SITE, path) ?? '';
  return <Editable file={SITE_FILE} target={{ path }} raw={raw}>{children ?? raw}</Editable>;
}

export function F({ item, field, children }) {
  return (
    <Editable file={item.source} target={{ field }} raw={item[field] ?? ''} required={field === 'name'}>
      {children ?? item[field] ?? ''}
    </Editable>
  );
}

export function SectionTitle({ item, section }) {
  const title = item.sections[section]?.title ?? '';
  return <Editable file={item.source} target={{ section, part: 'title' }} raw={title}>{title}</Editable>;
}

export function Prose({ item, part, section, children }) {
  const body = splitBody(item.body);
  const lead = part === 'lead';
  return (
    <Editable
      file={item.source}
      target={lead ? { part: 'lead' } : { section, part: 'body' }}
      raw={lead ? body.lead : body.sections[section]?.body ?? ''}
      kind="blocks"
      required={!lead}
    >
      {children}
    </Editable>
  );
}

export function L({ item, field, children }) {
  return (
    <Editable file={item.source} target={{ field }} raw={item[field] ?? []} kind="list" required={false}>
      {children}
    </Editable>
  );
}
