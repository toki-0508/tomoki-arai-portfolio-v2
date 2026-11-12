// 編集モード用の部品(仮)。差し替えが効いていることを確かめるため、編集バーの目印だけを出す。
// '../index.jsx' はこのフォルダからの読み込みなので、プラグインに差し替えられず本番用が読まれる。
export { C, S, F, SectionTitle, Prose, L, EditableImage } from '../index.jsx';

export function EditorRoot() {
  return <div className="portfolio-editor-bar" data-editor-ui>編集モード</div>;
}
