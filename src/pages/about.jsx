import { Fragment } from 'react';
import { Icon } from '../components/Icon.jsx';
import { Link, SectionHead } from '../components/ui.jsx';
import { workById } from '../content/loader.js';
import { SkillTree } from '../components/skill-tree/SkillTree.jsx';
import { C, EditableImage, F, S } from '../editor/index.jsx';
import { HISTORY, INTERESTS, MVV, NOW, NOW_UPDATED, PROFILE } from '../content/site.js';

const INTEREST_ICONS = { pen: Icon.Pen, play: Icon.Play, box: Icon.Box, chart: Icon.Chart };
const monthLabel = (ym) => ym.replace('-', '.');

export function AboutPage() {
  const mouseWork = workById('handheld-mouse');
  return (
    <Fragment>
      <header className="intro-band" aria-labelledby="about-title">
        <div className="wrap about-intro">
          <div>
            <p className="eyebrow intro-kicker"><C k="about.intro.eyebrow" vars={{ nameEn: PROFILE.nameEn }} /></p>
            <h1 className="intro-title" id="about-title"><S path="PROFILE.nameJa" /></h1>
            <p className="about-reading"><S path="PROFILE.reading" /> / <S path="PROFILE.nickname" /></p>
            <p className="intro-lead"><C k="about.intro.lead" /></p>
            <dl className="profile-list">
              <div><dt><C k="about.profile.affiliation" /></dt><dd><S path="PROFILE.affiliation" /></dd></div>
              <div><dt><C k="about.profile.fields" /></dt><dd><S path="PROFILE.fields" /></dd></div>
            </dl>
            <div className="profile-links">
              <Link to="/contact" className="text-link"><C k="about.intro.contactLink" /><Icon.Arrow width={15} height={15} /></Link>
              {PROFILE.socials.map((social, i) => (
                <a key={social.id} href={social.url} target="_blank" rel="noreferrer" className="text-link">
                  <S path={`PROFILE.socials.${i}.label`} /><Icon.External width={13} height={13} />
                </a>
              ))}
            </div>
          </div>
          {mouseWork?.image && (
            <figure className="about-figure">
              <EditableImage item={mouseWork}>
                <img src={mouseWork.image} alt={mouseWork.imageAlt} width="1600" height="1000" />
              </EditableImage>
              <figcaption className="intro-caption">
                <Link to={`/works/${mouseWork.id}`} className="text-link"><F item={mouseWork} field="name" /><Icon.Arrow width={15} height={15} /></Link>
                <span><C k="about.figure.caption" /></span>
              </figcaption>
            </figure>
          )}
        </div>
      </header>

      <section className="section section-band">
        <div className="wrap career-layout">
          <SectionHead eyebrow={<C k="about.history.eyebrow" />} title={<C k="about.history.title" />} />
          <ol className="timeline career-timeline">
            {HISTORY.map(({ title, work }, i) => {
              const relatedWork = workById(work);
              return (
                <li key={title}>
                  <p className="career-time"><S path={`HISTORY.${i}.time`} /></p>
                  <h3><S path={`HISTORY.${i}.title`} /></h3>
                  <p><S path={`HISTORY.${i}.text`} /></p>
                  {relatedWork && (
                    <Link to={`/works/${relatedWork.id}`} className="text-link">
                      <F item={relatedWork} field="name" /><Icon.Arrow width={15} height={15} />
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <SectionHead eyebrow={<C k="about.principles.eyebrow" />} title={<C k="about.principles.title" />} />
          <div className="mvv">
            {MVV.map((item, i) => (
              <article key={item.label} className="mvv-card">
                <p className="eyebrow"><S path={`MVV.${i}.label`} /></p>
                <h3><S path={`MVV.${i}.title`} /></h3>
                <p><S path={`MVV.${i}.text`} /></p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-band">
        <div className="wrap">
          <SectionHead
            eyebrow={<C k="about.skills.eyebrow" />}
            title={<C k="about.skills.title" />}
            note={<C k="about.skills.note" />}
          />
          <SkillTree />
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div>
            <SectionHead eyebrow={<C k="about.interests.eyebrow" />} title={<C k="about.interests.title" />} />
            <ul className="interests">
              {INTERESTS.map(({ icon, title }, i) => {
                const Ico = INTEREST_ICONS[icon] ?? Icon.Spark;
                return (
                  <li key={title}>
                    <span className="interest-icon"><Ico /></span>
                    <div>
                      <h3><S path={`INTERESTS.${i}.title`} /></h3>
                      <p><S path={`INTERESTS.${i}.text`} /></p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      <section className="section section-tight">
        <div className="wrap">
          <SectionHead
            eyebrow={<C k="about.now.eyebrow" />}
            title={<C k="about.now.title" />}
            note={<C k="about.now.note" vars={{ month: monthLabel(NOW_UPDATED) }} />}
          />
          <dl className="now">
            {NOW.map(({ title }, i) => (
              <div key={title}>
                <dt><S path={`NOW.${i}.title`} /></dt>
                <dd><S path={`NOW.${i}.text`} /></dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </Fragment>
  );
}
