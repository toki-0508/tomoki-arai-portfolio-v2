import { Fragment, useState } from 'react';
import { Icon } from '../components/Icon.jsx';
import { PageHead } from '../components/ui.jsx';
import { PROFILE } from '../content/site.js';

// 問い合わせ API の向き先。未設定なら同一オリジン(Vercel の /api/contact)。
const API_BASE = import.meta.env.VITE_CONTACT_API_BASE || '';

const TYPES = ['インターン・採用について', '制作のご依頼', 'ご質問', 'その他'];

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
        setStatus({ state: 'done', message: '送信しました。内容を確認のうえ、ご連絡します。' });
      } else {
        setStatus({ state: 'error', message: data.message || '送信できませんでした。時間をおいてもう一度お試しいただくか、メールでご連絡ください。' });
      }
    } catch {
      setStatus({ state: 'error', message: '送信できませんでした。通信状況を確認するか、メールでご連絡ください。' });
    }
  };

  return (
    <Fragment>
      <PageHead
        eyebrow="Contact"
        title="お問い合わせ"
        lead="インターンや制作のご相談など、お気軽にご連絡ください。"
      />
      <section className="section section-tight">
        <div className="wrap contact-grid">
          <form className="contact-form" onSubmit={onSubmit}>
            <div className="form-row">
              <label className="field">
                <span className="field-label">お名前<em>必須</em></span>
                <input name="name" type="text" required maxLength={80} autoComplete="name" />
              </label>
              <label className="field">
                <span className="field-label">メールアドレス<em>必須</em></span>
                <input name="email" type="email" required maxLength={160} autoComplete="email" inputMode="email" />
              </label>
            </div>
            <label className="field">
              <span className="field-label">ご相談の種類<em>必須</em></span>
              <select name="type" required defaultValue="">
                <option value="" disabled>選択してください</option>
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label className="field">
              <span className="field-label">メッセージ<em>必須</em></span>
              <textarea name="message" required maxLength={3000} rows={7} />
            </label>
            {/* スパム対策のダミー項目。人には見えず、入力されていたら送信を弾く */}
            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hp-field" aria-hidden="true" />
            <div className="form-foot">
              <button type="submit" className="btn btn-primary" disabled={status.state === 'sending'}>
                {status.state === 'sending' ? '送信しています…' : '送信する'}
              </button>
              <p className={`form-status is-${status.state}`} role="status" aria-live="polite">{status.message}</p>
            </div>
          </form>

          <aside className="contact-side">
            <h2>メールで直接連絡する</h2>
            <p>フォームが使えない場合は、メールやSNSからもご連絡いただけます。</p>
            <a className="contact-mail" href={`mailto:${PROFILE.email}`}>
              <Icon.Mail width={16} height={16} />
              {PROFILE.email}
            </a>
            <div className="contact-socials">
              {PROFILE.socials.map((s) => (
                <a key={s.id} href={s.url} target="_blank" rel="noreferrer">
                  {s.id === 'github' ? <Icon.GitHub width={15} height={15} /> : <Icon.X width={13} height={13} />}
                  {s.label}
                </a>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </Fragment>
  );
}
