// 編集モードの保存窓口の入出力
import { EditorError } from './drafts.mjs';

const LOCAL_HOST = /^(127\.0\.0\.1|localhost)(:\d{1,5})?$/;

// このMacの編集画面から来たリクエストだけを受け付ける。
// X-Editor ヘッダーは、ほかのサイトのページからは(事前確認なしに)付けられない。
export function isTrustedRequest(headers = {}) {
  const host = headers.host ?? '';
  if (!LOCAL_HOST.test(host)) return false;
  if (headers['x-editor'] !== '1') return false;
  const { origin } = headers;
  return !origin || origin === `http://${host}`;
}

export function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new EditorError(413, '送られたデータが大きすぎます'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export async function readJson(req, limit = 1024 * 1024) {
  const body = await readBody(req, limit);
  let data;
  try {
    data = JSON.parse(body.toString('utf8'));
  } catch {
    throw new EditorError(400, '送られたデータを読めませんでした');
  }
  // 窓口の本文はどれも { ... } の形。文字列や配列などは読めないデータとして断る
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    throw new EditorError(400, '送られたデータを読めませんでした');
  }
  return data;
}

export function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
}
