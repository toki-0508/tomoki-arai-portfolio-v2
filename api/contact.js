const CONTACT_TO_EMAIL = process.env.CONTACT_TO_EMAIL || 'toki.zeno.0508@gmail.com';
const CONTACT_FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || 'Portfolio Contact <onboarding@resend.dev>';
const RESEND_API_URL = 'https://api.resend.com/emails';

// この API を呼び出してよいオリジン。サイトと同じオリジン(本番の Vercel)だけを許可する。
// (旧ドメインや GitHub Pages は本番 URL への転送のみで、フォームは置いていない)
const ALLOWED_ORIGINS = new Set(['https://tomoki-arai.vercel.app']);

const MAX_FIELD_LENGTHS = {
  name: 80,
  email: 160,
  type: 80,
  message: 3000,
};

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(payload));
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function readJsonBody(request) {
  if (request.body && typeof request.body === 'object') {
    return request.body;
  }

  const chunks = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const bodyText = Buffer.concat(chunks).toString('utf8');
  if (!bodyText) return {};
  return JSON.parse(bodyText);
}

function validatePayload(payload) {
  const fields = {
    name: normalizeText(payload.name),
    email: normalizeText(payload.email),
    type: normalizeText(payload.type),
    message: normalizeText(payload.message),
    website: normalizeText(payload.website),
  };

  if (fields.website) {
    return { ok: false, code: 'SPAM_DETECTED', message: '送信できませんでした。' };
  }

  for (const [fieldName, maxLength] of Object.entries(MAX_FIELD_LENGTHS)) {
    if (!fields[fieldName]) {
      return { ok: false, code: 'REQUIRED_FIELD', message: '未入力の項目があります。' };
    }
    if (fields[fieldName].length > maxLength) {
      return { ok: false, code: 'FIELD_TOO_LONG', message: '入力内容が長すぎます。' };
    }
  }

  if (!isValidEmail(fields.email)) {
    return { ok: false, code: 'INVALID_EMAIL', message: 'メールアドレスの形式を確認してください。' };
  }

  return { ok: true, fields };
}

function buildEmail(fields) {
  const subject = `Portfolio inquiry: ${fields.type}`;
  const text = [
    'ポートフォリオサイトからお問い合わせが届きました。',
    '',
    `お名前: ${fields.name}`,
    `メール: ${fields.email}`,
    `相談内容: ${fields.type}`,
    '',
    'メッセージ:',
    fields.message,
  ].join('\n');

  const html = `
    <div style="font-family: sans-serif; line-height: 1.7; color: #0f172a;">
      <h1 style="font-size: 18px;">ポートフォリオサイトからお問い合わせが届きました。</h1>
      <p><strong>お名前:</strong> ${escapeHtml(fields.name)}</p>
      <p><strong>メール:</strong> ${escapeHtml(fields.email)}</p>
      <p><strong>相談内容:</strong> ${escapeHtml(fields.type)}</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0;" />
      <p style="white-space: pre-wrap;">${escapeHtml(fields.message)}</p>
    </div>
  `;

  return { subject, text, html };
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

async function sendContactEmail(fields) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, status: 503, code: 'MAIL_SERVICE_NOT_CONFIGURED' };
  }

  const email = buildEmail(fields);
  const resendResponse = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: CONTACT_FROM_EMAIL,
      to: [CONTACT_TO_EMAIL],
      reply_to: fields.email,
      subject: email.subject,
      text: email.text,
      html: email.html,
    }),
  });

  if (!resendResponse.ok) {
    let detail = null;
    try {
      detail = await resendResponse.json();
    } catch {
      detail = { message: await resendResponse.text() };
    }

    console.error('Resend contact email failed', {
      status: resendResponse.status,
      detail,
    });

    return { ok: false, status: 502, code: 'MAIL_PROVIDER_ERROR' };
  }

  return { ok: true };
}

export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // GitHub Pages 版はこの API をクロスオリジンで叩くため、許可オリジンを明示する。
  // Vercel 版は同一オリジンなので、この分岐に関係なく従来どおり動作する。
  const origin = request.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    response.setHeader('Access-Control-Allow-Origin', origin);
    response.setHeader('Vary', 'Origin');
  }

  if (request.method === 'OPTIONS') {
    response.statusCode = 204;
    response.end();
    return;
  }

  if (request.method !== 'POST') {
    sendJson(response, 405, { ok: false, message: 'POSTで送信してください。' });
    return;
  }

  let payload;
  try {
    payload = await readJsonBody(request);
  } catch {
    sendJson(response, 400, { ok: false, message: '送信内容を読み取れませんでした。' });
    return;
  }

  const validation = validatePayload(payload);
  if (!validation.ok) {
    sendJson(response, 400, { ok: false, code: validation.code, message: validation.message });
    return;
  }

  try {
    const result = await sendContactEmail(validation.fields);
    if (!result.ok) {
      const message = result.code === 'MAIL_SERVICE_NOT_CONFIGURED'
        ? 'メール送信設定が未完了です。メールアプリから送信してください。'
        : 'メール送信に失敗しました。時間をおいて再度お試しください。';
      sendJson(response, result.status, { ok: false, code: result.code, message });
      return;
    }

    sendJson(response, 200, { ok: true, message: 'お問い合わせを送信しました。' });
  } catch (error) {
    console.error('Contact API failed', error);
    sendJson(response, 500, { ok: false, message: 'メール送信中にエラーが発生しました。' });
  }
}
