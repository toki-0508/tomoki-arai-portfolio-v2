import { useEffect, useState } from 'react';
import { BackToTop, Footer, Nav } from './components/Layout.jsx';
import { HomePage } from './pages/home.jsx';
import { AboutPage } from './pages/about.jsx';
import { WorksPage } from './pages/works.jsx';
import { WorkDetailPage } from './pages/work-detail.jsx';
import { DownloadsPage } from './pages/downloads.jsx';
import { ContactPage } from './pages/contact.jsx';
import { workById } from './content/loader.js';
import { NAV_LINKS, PROFILE } from './content/site.js';
import { t } from './content/copy.js';
import { EditorRoot } from './editor/index.jsx';

// '#/works?cat=web' → '/works' のようにクエリを除いたパスを返す
function getRoute() {
  const hash = window.location.hash.replace(/^#/, '') || '/';
  const path = hash.split('?')[0];
  if (NAV_LINKS.some((link) => link.id === path)) return path;
  if (path.startsWith('/works/')) return path;
  return '/';
}

// タブのタイトルは「ページ名 | 新井智己 – Tomoki Arai Portfolio」に統一する。
// トップだけは名前の読みを含めた形(検索結果に出るため)。
function titleFor(route) {
  const site = t('layout.title.site', { nameJa: PROFILE.nameJa, nameEn: PROFILE.nameEn });
  if (route.startsWith('/works/')) {
    const work = workById(route.split('/').pop());
    if (work) return t('layout.title.page', { page: work.name, site });
  }
  const link = NAV_LINKS.find((l) => l.id === route);
  if (link) return t('layout.title.page', { page: link.title, site });
  return t('layout.title.home', { nameJa: PROFILE.nameJa, reading: PROFILE.reading, nickname: PROFILE.nickname, nameEn: PROFILE.nameEn });
}

const PAGES = {
  '/about': AboutPage,
  '/works': WorksPage,
  '/downloads': DownloadsPage,
  '/contact': ContactPage,
};

export function App() {
  const [route, setRoute] = useState(getRoute());
  // 初回表示ではフェードさせず、ページを移動したときだけフェードする
  const [hasNavigated, setHasNavigated] = useState(false);

  useEffect(() => {
    const onHash = () => {
      setHasNavigated(true);
      setRoute(getRoute());
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    document.title = titleFor(route);
  }, [route]);

  let page;
  if (route.startsWith('/works/')) page = <WorkDetailPage id={route.split('/').pop()} />;
  else {
    const Page = PAGES[route] ?? HomePage;
    page = <Page />;
  }

  return (
    <div className="app">
      <Nav route={route} />
      <main id="main" key={route} tabIndex={-1} className={hasNavigated ? 'page-transition' : undefined}>
        {page}
      </main>
      <Footer />
      <BackToTop />
      <EditorRoot route={route} />
    </div>
  );
}
