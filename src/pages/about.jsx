import { Fragment } from 'react';
import { Icon } from '../components/Icon.jsx';
import { Link, SectionHead } from '../components/ui.jsx';
import { usageOf, workById } from '../content/loader.js';
import { HISTORY, INTERESTS, MVV, NOW, NOW_UPDATED, PROFILE, SKILL_GROUPS } from '../content/site.js';

const INTEREST_ICONS = { pen: Icon.Pen, play: Icon.Play, box: Icon.Box, chart: Icon.Chart };
const monthLabel = (ym) => ym.replace('-', '.');

export function AboutPage() {
  const mouseWork = workById('handheld-mouse');
  return (
    <Fragment>
      <header className="intro-band" aria-labelledby="about-title">
        <div className="wrap about-intro">
          <div>
            <p className="eyebrow intro-kicker">About / {PROFILE.nameEn}</p>
            <h1 className="intro-title" id="about-title">{PROFILE.nameJa}</h1>
            <p className="about-reading">{PROFILE.reading} / {PROFILE.nickname}</p>
            <p className="intro-lead">欲しいアプリを自分で作り、欲しい操作感を基板から試す。ソフトウェアと実物の両方を作っています。</p>
            <dl className="profile-list">
              <div><dt>所属</dt><dd>{PROFILE.affiliation}</dd></div>
              <div><dt>制作領域</dt><dd>{PROFILE.fields}</dd></div>
            </dl>
            <div className="profile-links">
              <Link to="/contact" className="text-link">お問い合わせ<Icon.Arrow width={15} height={15} /></Link>
              {PROFILE.socials.map((social) => (
                <a key={social.id} href={social.url} target="_blank" rel="noreferrer" className="text-link">
                  {social.label}<Icon.External width={13} height={13} />
                </a>
              ))}
            </div>
          </div>
          {mouseWork?.image && (
            <figure className="about-figure">
              <img src={mouseWork.image} alt={mouseWork.imageAlt} width="1600" height="1000" />
              <figcaption className="intro-caption">
                <Link to={`/works/${mouseWork.id}`} className="text-link">{mouseWork.name}<Icon.Arrow width={15} height={15} /></Link>
                <span>基板・ケースの試作</span>
              </figcaption>
            </figure>
          )}
        </div>
      </header>

      <section className="section section-band">
        <div className="wrap career-layout">
          <SectionHead eyebrow="History" title="制作と活動の歩み" />
          <ol className="timeline career-timeline">
            {HISTORY.map(({ time, title, text, work }) => {
              const relatedWork = workById(work);
              return (
                <li key={title}>
                  <p className="career-time">{time}</p>
                  <h3>{title}</h3>
                  <p>{text}</p>
                  {relatedWork && (
                    <Link to={`/works/${relatedWork.id}`} className="text-link">
                      {relatedWork.name}<Icon.Arrow width={15} height={15} />
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
          <SectionHead eyebrow="Principles" title="大切にしていること" />
          <div className="mvv">
            {MVV.map((item) => (
              <article key={item.label} className="mvv-card">
                <p className="eyebrow">{item.label}</p>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-band">
        <div className="wrap">
          <SectionHead
            eyebrow="Skills"
            title="スキル"
            note="点の付いた技術は、このサイトに載せている作品やダウンロードで実際に使っているものです。数字はその件数です。"
          />
          <div className="skill-groups">
            {SKILL_GROUPS.map((group) => (
              <div key={group.title} className="skill-group">
                <h3>{group.title}</h3>
                <ul className="chips">
                  {group.skills.map((skill) => {
                    const used = usageOf(skill);
                    return (
                      <li key={skill} className={`chip ${used ? 'is-used' : ''}`}>
                        {skill}
                        {used > 0 && (
                          <span className="chip-count">
                            <span className="visually-hidden">（使用実績</span>
                            {used}
                            <span className="visually-hidden">件）</span>
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div>
            <SectionHead eyebrow="Interests" title="好きなこと" />
            <ul className="interests">
              {INTERESTS.map(({ icon, title, text }) => {
                const Ico = INTEREST_ICONS[icon] ?? Icon.Spark;
                return (
                  <li key={title}>
                    <span className="interest-icon"><Ico /></span>
                    <div>
                      <h3>{title}</h3>
                      <p>{text}</p>
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
          <SectionHead eyebrow="Now" title="いま取り組んでいること" note={`${monthLabel(NOW_UPDATED)} 時点の内容です。`} />
          <dl className="now">
            {NOW.map(({ title, text }) => (
              <div key={title}>
                <dt>{title}</dt>
                <dd>{text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </Fragment>
  );
}
