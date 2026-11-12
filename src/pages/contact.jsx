import { Fragment, useState } from 'react';
import { Icon } from '../components/Icon.jsx';
import { PageHead } from '../components/ui.jsx';
import { PROFILE } from '../content/site.js';
import { t } from '../content/copy.js';
import { C, S } from '../editor/index.jsx';

// 問い合わせ API の向き先。未設定なら同一オリジン(Vercel の /api/contact)。
const API_BASE = import.meta.env.VITE_CONTACT_API_BASE || '';

const TYPE_KEYS = ['contact.form.typeInternship', 'contact.form.typeRequest', 'contact.form.typeQuestion', 'contact.form.typeOther'];

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
        setStatus({ state: 'done', message: t('contact.status.done') });
      } else {
        setStatus({ state: 'error', message: data.message || t('contact.status.error') });
      }
    } catch {
      setStatus({ state: 'error', message: t('contact.status.networkError') });
    }
  };

  return (
    <Fragment>
      <PageHead
        eyebrow={<C k="contact.head.eyebrow" />}
        title={<C k="contact.head.title" />}
        lead={<C k="contact.head.lead" />}
      />
      <section className="section section-tight">
        <div className="wrap contact-grid">
          <form className="contact-form" onSubmit={onSubmit}>
            <div className="form-row">
              <label className="field">
                <span className="field-label"><C k="contact.form.name" /><em><C k="contact.form.required" /></em></span>
                <input name="name" type="text" required maxLength={80} autoComplete="name" />
              </label>
              <label className="field">
                <span className="field-label"><C k="contact.form.email" /><em><C k="contact.form.required" /></em></span>
                <input name="email" type="email" required maxLength={160} autoComplete="email" inputMode="email" />
              </label>
            </div>
            <label className="field">
              <span className="field-label"><C k="contact.form.type" /><em><C k="contact.form.required" /></em></span>
              <select name="type" required defaultValue="">
                <option value="" disabled>{t('contact.form.typePlaceholder')}</option>
                {TYPE_KEYS.map((key) => <option key={key} value={t(key)}>{t(key)}</option>)}
              </select>
            </label>
            <label className="field">
              <span className="field-label"><C k="contact.form.message" /><em><C k="contact.form.required" /></em></span>
              <textarea name="message" required maxLength={3000} rows={7} />
            </label>
            {/* スパム対策のダミー項目。人には見えず、入力されていたら送信を弾く */}
            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hp-field" aria-hidden="true" />
            <div className="form-foot">
              <button type="submit" className="btn btn-primary" disabled={status.state === 'sending'}>
                {status.state === 'sending' ? <C k="contact.form.sending" /> : <C k="contact.form.submit" />}
              </button>
              <p className={`form-status is-${status.state}`} role="status" aria-live="polite">{status.message}</p>
            </div>
          </form>

          <aside className="contact-side">
            <h2><C k="contact.side.title" /></h2>
            <p><C k="contact.side.text" /></p>
            <div className="contact-socials">
              {PROFILE.socials.map((s, i) => (
                <a key={s.id} href={s.url} target="_blank" rel="noreferrer">
                  {s.id === 'github' ? <Icon.GitHub width={15} height={15} /> : <Icon.X width={13} height={13} />}
                  <S path={`PROFILE.socials.${i}.label`} />
                </a>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </Fragment>
  );
}
