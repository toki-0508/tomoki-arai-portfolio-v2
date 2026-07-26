import { useState } from 'react';
import { Icon } from '../components/Icon.jsx';
import { Reveal, SectionLabel } from '../components/ui.jsx';
import { PROFILE } from '../content/site.js';

// GitHub Pages 版はクロスオリジンで Vercel の API を叩く。
// Vercel 版は VITE_CONTACT_API_BASE 未設定(空文字)なので同一オリジン。
const API_BASE = import.meta.env.VITE_CONTACT_API_BASE || '';

const TYPES = ['制作のご依頼', '協業・お誘い', 'ご質問', 'その他'];

export function ContactPage() {
  const [status, setStatus] = useState({ state: 'idle', message: '' });

  const onSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    setStatus({ state: 'sending', message: '' });
    try {
      const res = await fetch(`${API_BASE}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        form.reset();
        setStatus({ state: 'done', message: data.message || 'お問い合わせを送信しました。' });
      } else {
        setStatus({ state: 'error', message: data.message || '送信に失敗しました。時間をおいて再度お試しください。' });
      }
    } catch {
      setStatus({ state: 'error', message: '送信に失敗しました。ネットワークをご確認ください。' });
    }
  };

  return (
    <div className="page-enter">
      <section className="page-head">
        <div className="wrap">
          <SectionLabel>Contact</SectionLabel>
          <h1 className="h-display">お問い合わせ</h1>
          <p className="h-body">
            制作のご依頼・ご相談など、お気軽にご連絡ください。通常2〜3日以内にお返事します。
          </p>
        </div>
      </section>

      <section className="block block-tight">
        <div className="wrap contact-grid">
          <Reveal className="contact-form-card">
            <form onSubmit={onSubmit}>
              <div className="form-row">
                <label className="field">
                  <span>お名前 <em>必須</em></span>
                  <input name="name" type="text" required maxLength={80} autoComplete="name" placeholder="山田太郎" />
                </label>
                <label className="field">
                  <span>メールアドレス <em>必須</em></span>
                  <input name="email" type="email" required maxLength={160} autoComplete="email" placeholder="you@example.com" />
                </label>
              </div>
              <label className="field">
                <span>ご相談の種類 <em>必須</em></span>
                <select name="type" required defaultValue="">
                  <option value="" disabled>選択してください</option>
                  {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <label className="field">
                <span>メッセージ <em>必須</em></span>
                <textarea name="message" required maxLength={3000} rows={7} placeholder="ご相談内容をご記入ください" />
              </label>
              {/* スパム対策のハニーポット(人には見えない) */}
              <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hp-field" aria-hidden="true" />
              <div className="form-foot">
                <button type="submit" className="btn btn-primary" disabled={status.state === 'sending'}>
                  {status.state === 'sending' ? '送信中…' : '送信する'} <Icon.Arrow className="arrow" />
                </button>
                {status.message && (
                  <p className={`form-status ${status.state}`} role="status">{status.message}</p>
                )}
              </div>
            </form>
          </Reveal>

          <Reveal className="contact-side" delay={80}>
            <div className="contact-side-card">
              <h2>直接連絡する</h2>
              <p>フォームが使えない場合は、メールやSNSからもご連絡いただけます。</p>
              <a className="contact-mail" href={`mailto:${PROFILE.email}`}>
                <Icon.Mail width={16} height={16} /> {PROFILE.email}
              </a>
              <div className="contact-socials">
                {PROFILE.socials.map((social) => (
                  <a key={social.id} href={social.url} target="_blank" rel="noreferrer">
                    {social.id === 'github' ? <Icon.GitHub width={15} height={15} /> : <Icon.X width={13} height={13} />}
                    {social.label}
                  </a>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
