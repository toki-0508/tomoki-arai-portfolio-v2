import { useEffect, useState } from 'react';
import { BackToTop, Footer, Nav, ScrollProgress } from './components/Layout.jsx';
import { HomePage } from './pages/home.jsx';
import { AboutPage } from './pages/about.jsx';
import { WorksPage } from './pages/works.jsx';
import { WorkDetailPage } from './pages/work-detail.jsx';
import { DownloadsPage } from './pages/downloads.jsx';
import { ContactPage } from './pages/contact.jsx';
import { workById } from './content/loader.js';
import { PROFILE } from './content/site.js';

// '#/works?cat=web' → '/works' のようにクエリを除いたパスを返す
function getRoute() {
  const hash = window.location.hash.replace(/^#/, '') || '/';
  const path = hash.split('?')[0];
  if (['/about', '/works', '/downloads', '/contact'].includes(path)) return path;
  if (path.startsWith('/works/')) return path;
  return '/';
}

// どのページでも「新井智己 / Tomoki Arai」が title に入るようにする(検索対策)
const SITE_TITLE = `${PROFILE.nameJa}(${PROFILE.reading} / ${PROFILE.nickname})| ${PROFILE.nameEn} Portfolio`;

const TITLES = {
  '/': SITE_TITLE,
  '/about': `About | ${PROFILE.nameJa} - ${PROFILE.nameEn} Portfolio`,
  '/works': `Works 作品一覧 | ${PROFILE.nameJa} - ${PROFILE.nameEn} Portfolio`,
  '/downloads': `Downloads 公開データ | ${PROFILE.nameJa} - ${PROFILE.nameEn} Portfolio`,
  '/contact': `Contact お問い合わせ | ${PROFILE.nameJa} - ${PROFILE.nameEn} Portfolio`,
};

function titleFor(route) {
  if (route.startsWith('/works/')) {
    const work = workById(route.split('/').pop());
    if (work) return `${work.name} | ${PROFILE.nameJa}の作品 - ${PROFILE.nameEn} Portfolio`;
  }
  return TITLES[route] ?? TITLES['/'];
}

export function App() {
  const [route, setRoute] = useState(getRoute());

  useEffect(() => {
    const onHash = () => setRoute(getRoute());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    document.title = titleFor(route);
  }, [route]);

  let Page = HomePage;
  if (route === '/about') Page = AboutPage;
  else if (route === '/works') Page = WorksPage;
  else if (route.startsWith('/works/')) {
    const id = route.split('/').pop();
    Page = () => <WorkDetailPage id={id} />;
  } else if (route === '/downloads') Page = DownloadsPage;
  else if (route === '/contact') Page = ContactPage;

  return (
    <div className="app">
      <ScrollProgress />
      <Nav route={route} />
      <main id="main" key={route}><Page /></main>
      <Footer />
      <BackToTop />
    </div>
  );
}
