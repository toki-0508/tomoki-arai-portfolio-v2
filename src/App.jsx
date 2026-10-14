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
const SITE_NAME = `${PROFILE.nameJa} – ${PROFILE.nameEn} Portfolio`;
const HOME_TITLE = `${PROFILE.nameJa}（${PROFILE.reading}・${PROFILE.nickname}）| ${PROFILE.nameEn} Portfolio`;

function titleFor(route) {
  if (route.startsWith('/works/')) {
    const work = workById(route.split('/').pop());
    if (work) return `${work.name} | ${SITE_NAME}`;
  }
  const link = NAV_LINKS.find((l) => l.id === route);
  return link ? `${link.title} | ${SITE_NAME}` : HOME_TITLE;
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
    </div>
  );
}
