import { Icon } from '../components/Icon.jsx';
import { Reveal, SectionLabel } from '../components/ui.jsx';
import { HISTORY, INTERESTS, MVV, NOW, SKILL_GROUPS } from '../content/site.js';

const INTEREST_ICONS = { pen: Icon.Pen, play: Icon.Play, box: Icon.Box, chart: Icon.Chart };

export function AboutPage() {
  return (
    <div className="page-enter">
      <section className="page-head">
        <div className="wrap">
          <SectionLabel>About</SectionLabel>
          <h1 className="h-display">つくる理由を、いつも近くに置く。</h1>
          <p className="h-body">
            ただ動くものを作るだけではなく、誰かが「使ってよかった」と感じられる体験に近づけたい。
            そのために、Mission / Vision / Values を判断軸として持ちながら、今は将来に向け実装力を高めるために、作りたい・面白そうと思ったWeb・アプリ・3Dを制作しています。
          </p>
          <div className="mvv-points" aria-label="制作で大切にしている軸">
            <span>Touch</span>
            <span>Useful</span>
            <span>Playful</span>
          </div>
        </div>
      </section>

      <section className="block block-tight">
        <div className="wrap">
          <div className="mvv-grid">
            {MVV.map((item, i) => (
              <Reveal key={item.label} delay={i * 80} className="mvv-card">
                <span className="mvv-label">{item.label}</span>
                <h2>{item.title}</h2>
                <p>{item.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="block">
        <div className="wrap about-grid">
          <Reveal className="about-panel">
            <SectionLabel>好きなこと</SectionLabel>
            <div className="interest-grid">
              {INTERESTS.map(({ icon, title, text }) => {
                const Ico = INTEREST_ICONS[icon] ?? Icon.Spark;
                return (
                  <div key={title} className="interest-item">
                    <div className="interest-icon"><Ico /></div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                );
              })}
            </div>
          </Reveal>
          <Reveal className="about-panel" delay={80}>
            <SectionLabel>Skills</SectionLabel>
            <div className="skill-groups">
              {SKILL_GROUPS.map(({ title, skills }) => (
                <div key={title} className="skill-group">
                  <h3>{title}</h3>
                  <div className="tags">
                    {skills.map((skill) => <span key={skill} className="tag">{skill}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal className="about-panel history-panel" delay={140}>
            <SectionLabel>これまでのこと</SectionLabel>
            <div className="timeline">
              {HISTORY.map(({ time, text }) => (
                <div key={time} className="timeline-item">
                  <strong>{time}</strong>
                  <p>{text}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="block block-tight">
        <div className="wrap">
          <Reveal className="now-panel">
            <SectionLabel>Now</SectionLabel>
            <p className="now-lead">日々、新しい技術や表現を学びながら、ワクワクするアイデアを形にしています。</p>
            <div className="now-chips">
              {NOW.map(({ title, text }) => (
                <div key={title} className="now-chip">
                  <strong>{title}</strong>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
