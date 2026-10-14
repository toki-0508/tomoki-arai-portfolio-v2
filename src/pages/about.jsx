import { Fragment } from 'react';
import { Icon } from '../components/Icon.jsx';
import { Link, PageHead, SectionHead } from '../components/ui.jsx';
import { usageOf } from '../content/loader.js';
import { HISTORY, INTERESTS, MVV, NOW, NOW_UPDATED, PROFILE, SKILL_GROUPS } from '../content/site.js';

const INTEREST_ICONS = { pen: Icon.Pen, play: Icon.Play, box: Icon.Box, chart: Icon.Chart };
const monthLabel = (ym) => ym.replace('-', '.');

export function AboutPage() {
  return (
    <Fragment>
      <PageHead
        eyebrow="About"
        title="プロフィール"
        lead="ただ動くものを作るだけでなく、使った人が「使ってよかった」と感じられる体験を目指しています。いまは実装力を高めるために、作りたい・面白そうと思ったWeb・アプリ・3Dの制作に取り組んでいます。"
      />

      <section className="section section-tight">
        <div className="wrap">
          <div className="profile">
            <div className="profile-name">
              <p className="profile-ja">{PROFILE.nameJa}</p>
              <p className="profile-reading">{PROFILE.reading}</p>
              <p className="profile-nick">
                「<span className="hand">{PROFILE.nickname}</span>」と呼ばれることが多いです。
              </p>
            </div>
            <dl className="profile-list">
              <div>
                <dt>英語表記</dt>
                <dd>{PROFILE.nameEn}</dd>
              </div>
              <div>
                <dt>所属</dt>
                <dd>{PROFILE.affiliation}</dd>
              </div>
              <div>
                <dt>制作領域</dt>
                <dd>{PROFILE.fields}</dd>
              </div>
              <div>
                <dt>連絡先</dt>
                <dd className="profile-links">
                  <Link to="/contact">お問い合わせ</Link>
                  {PROFILE.socials.map((s) => (
                    <a key={s.id} href={s.url} target="_blank" rel="noreferrer">{s.label}</a>
                  ))}
                </dd>
              </div>
            </dl>
          </div>
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
        <div className="wrap about-columns">
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
          <div>
            <SectionHead eyebrow="History" title="これまで" />
            <ol className="timeline">
              {HISTORY.map(({ time, text }) => (
                <li key={time}>
                  <h3>{time}</h3>
                  <p>{text}</p>
                </li>
              ))}
            </ol>
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
