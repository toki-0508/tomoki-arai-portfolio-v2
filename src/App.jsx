import { useEffect, useState } from 'react';
import { Footer, Nav } from './components/Layout.jsx';
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

const TITLES = {
  '/': `${PROFILE.nameJa} | ${PROFILE.nameEn} Portfolio`,
  '/about': `About | ${PROFILE.nameEn} Portfolio`,
  '/works': `Works | ${PROFILE.nameEn} Portfolio`,
  '/downloads': `Downloads | ${PROFILE.nameEn} Portfolio`,
  '/contact': `Contact | ${PROFILE.nameEn} Portfolio`,
};

function titleFor(route) {
  if (route.startsWith('/works/')) {
    const work = workById(route.split('/').pop());
    if (work) return `${work.name} | ${PROFILE.nameEn} Portfolio`;
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
      <Nav route={route} />
      <main id="main" key={route}><Page /></main>
      <Footer />
    </div>
  );
}
