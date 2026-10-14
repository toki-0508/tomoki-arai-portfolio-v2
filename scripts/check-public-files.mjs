#!/usr/bin/env node
// 公開ファイルの安全チェック
//
// public/ に置いた配布ファイルと画像は、そのまま誰でもダウンロードできる。
// 鍵・トークン・個人情報につながるものが混ざっていたら、ビルドを止めて知らせる。
//
//   npm run check:files                              # public/downloads と public/images を検査
//   node scripts/check-public-files.mjs <path...>    # 任意のファイル・フォルダを検査
//
// 検査すること
//   - 渡してはいけない名前のファイル(.env、秘密鍵、署名用キーストア、クラウドの認証情報、DB など)
//   - 中身に含まれる API キー・トークン・秘密鍵
//   - このPCのホームフォルダのパス(ユーザー名や作業フォルダが分かってしまう)
//   - 写真の位置情報(EXIF / XMP の GPS)
// zip / jar / apk などは展開して1ファイルずつ調べる(入れ子の zip も対象)。
// npm run build の前に自動で実行される(package.json の prebuild)。

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_TARGETS = ['public/downloads', 'public/images'];

const ARCHIVE_EXT = /\.(zip|jar|apk|aab|xpi|ipa|war)$/i;
// 中身を確認できない形式は、検査をすり抜けないよう公開しない
const OPAQUE_EXT = /\.(dmg|7z|rar|tar|tgz|gz|bz2|xz|iso|pkg|msi)$/i;
const MAX_INFLATED_BYTES = 1024 * 1024 * 1024;

const FORBIDDEN_NAMES = [
  [/(^|\/)\.env(\.(?!example$)[^/]+)?$/i, '環境変数ファイル(.env)'],
  [/\.(pem|key|p8|p12|pfx)$/i, '秘密鍵・証明書'],
  [/(^|\/)id_(rsa|dsa|ecdsa|ed25519)(\.pub)?$/i, 'SSH の鍵'],
  [/\.(jks|keystore)$/i, 'Android の署名用キーストア'],
  [/(^|\/)key\.properties$/i, 'Android の署名設定'],
  [/\.(mobileprovision|provisionprofile)$/i, 'Apple のプロビジョニングプロファイル'],
  [
    /(^|\/)(google-services\.json|GoogleService-Info\.plist|firebase-adminsdk[^/]*\.json|service[-_]?account[^/]*\.json|credentials?[^/]*\.json|client_secret[^/]*\.json)$/i,
    'クラウドの認証情報',
  ],
  [/(^|\/)\.(npmrc|netrc|pypirc|git-credentials)$/i, '認証情報を含む設定ファイル'],
  [/(^|\/)\.git(\/|$)/, 'Git の管理フォルダ(履歴ごと渡ってしまう)'],
  [/\.(sqlite3?|db)$/i, 'データベース(利用データが入っている可能性)'],
  [/(^|\/)\.DS_Store$/, 'macOS のフォルダ情報(.DS_Store。同じフォルダのファイル名が分かる)'],
  [/(^|\/)__MACOSX\//, 'macOS が圧縮時に付けるデータ(__MACOSX)'],
];

const SECRET_PATTERNS = [
  [/AKIA[0-9A-Z]{16}/, 'AWS のアクセスキー'],
  [/AIza[0-9A-Za-z_-]{35}/, 'Google / Firebase の API キー'],
  [/gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{40,}/, 'GitHub のトークン'],
  [/(?<![A-Za-z0-9])sk-(?:ant-|proj-)?[A-Za-z0-9_-]{32,}/, 'AI サービスの API キー'],
  [/(?:sk|rk)_live_[A-Za-z0-9]{20,}/, 'Stripe の本番キー'],
  [/(?<![A-Za-z0-9])re_[A-Za-z0-9]{8,}_[A-Za-z0-9]{16,}/, 'Resend の API キー'],
  [/xox[abposr]-[A-Za-z0-9-]{10,}/, 'Slack のトークン'],
  [/-----BEGIN (?:RSA |EC |DSA |OPENSSH |ENCRYPTED )?PRIVATE KEY-----\s*[A-Za-z0-9+/=]{40}/, '秘密鍵'],
];

// ホームフォルダのパスは「このPCのユーザー名」なので、実行したPCのものだけを探す
const home = os.homedir();
const HOME_PATTERN = /^\/(Users|home)\/[^/]+$/.test(home)
  ? new RegExp(`${home.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![A-Za-z0-9._-])`)
  : null;

const problems = [];
const stats = { files: 0, entries: 0 };
let inflatedTotal = 0;

function report(label, reason) {
  problems.push({ label, reason });
}

// ---- 中身の検査 ----

function checkName(label, name) {
  for (const [pattern, reason] of FORBIDDEN_NAMES) {
    if (pattern.test(name)) report(label, reason);
  }
}

function checkContent(label, buf) {
  // バイナリも対象にするため latin1 で 1 バイト = 1 文字として扱う
  const text = buf.toString('latin1');
  for (const [pattern, reason] of SECRET_PATTERNS) {
    if (pattern.test(text)) report(label, reason);
  }
  if (HOME_PATTERN?.test(text)) report(label, `このPCのフォルダのパス(${home})`);
  if (hasGps(buf)) report(label, '写真の位置情報(GPS)');
}

function checkBuffer(label, name, buf) {
  stats.entries++;
  checkName(label, name);
  if (OPAQUE_EXT.test(name)) {
    report(label, '中身を検査できない形式です。zip にしてから置いてください');
    return;
  }
  if (ARCHIVE_EXT.test(name)) {
    checkArchive(label, buf);
    return;
  }
  checkContent(label, buf);
}

// ---- 写真の位置情報 ----

function hasGps(buf) {
  // XMP(Photoshop・Lightroom・iPhone の書き出しなど)
  if (/exif:GPS(Latitude|Longitude)/.test(buf.toString('latin1'))) return true;
  // EXIF は JPEG / HEIC では "Exif\0\0" の後ろ、PNG は eXIf チャンク、WebP は EXIF チャンクにある
  const markers = [
    [Buffer.from('Exif\0\0', 'latin1'), 6],
    [Buffer.from('eXIf', 'latin1'), 4],
    [Buffer.from('EXIF', 'latin1'), 8],
  ];
  for (const [marker, skip] of markers) {
    let i = buf.indexOf(marker);
    while (i !== -1) {
      if (tiffHasGps(buf, i + skip)) return true;
      i = buf.indexOf(marker, i + 1);
    }
  }
  return false;
}

function tiffHasGps(buf, start) {
  if (start + 8 > buf.length) return false;
  const order = buf.toString('latin1', start, start + 2);
  if (order !== 'II' && order !== 'MM') return false;
  const le = order === 'II';
  const u16 = (o) => (le ? buf.readUInt16LE(o) : buf.readUInt16BE(o));
  const u32 = (o) => (le ? buf.readUInt32LE(o) : buf.readUInt32BE(o));
  if (u16(start + 2) !== 42) return false;

  const entriesOf = (ifdOffset) => {
    const at = start + ifdOffset;
    if (at + 2 > buf.length) return [];
    const count = u16(at);
    const list = [];
    for (let n = 0; n < count && at + 2 + n * 12 + 12 <= buf.length; n++) {
      const e = at + 2 + n * 12;
      list.push({ tag: u16(e), value: u32(e + 8) });
    }
    return list;
  };

  const gpsPointer = entriesOf(u32(start + 4)).find((e) => e.tag === 0x8825);
  if (!gpsPointer) return false;
  // 緯度(2)・経度(4)が入っているときだけ位置情報ありとみなす
  return entriesOf(gpsPointer.value).some((e) => e.tag === 2 || e.tag === 4);
}

// ---- zip 系 ----

function findCentralDirectory(buf) {
  const min = Math.max(0, buf.length - 0xffff - 22);
  for (let i = buf.length - 22; i >= min; i--) {
    if (buf.readUInt32LE(i) !== 0x06054b50) continue;
    let count = buf.readUInt16LE(i + 10);
    let offset = buf.readUInt32LE(i + 16);
    if (count === 0xffff || offset === 0xffffffff) {
      // ZIP64
      const locator = i - 20;
      if (locator < 0 || buf.readUInt32LE(locator) !== 0x07064b50) return null;
      const eocd64 = Number(buf.readBigUInt64LE(locator + 8));
      if (buf.readUInt32LE(eocd64) !== 0x06064b50) return null;
      count = Number(buf.readBigUInt64LE(eocd64 + 32));
      offset = Number(buf.readBigUInt64LE(eocd64 + 48));
    }
    return { count, offset };
  }
  return null;
}

function readZip64Extra(buf, start, length, entry) {
  let p = start;
  while (p + 4 <= start + length) {
    const id = buf.readUInt16LE(p);
    const size = buf.readUInt16LE(p + 2);
    if (id === 0x0001) {
      let q = p + 4;
      for (const key of ['size', 'compressedSize', 'localOffset']) {
        if (entry[key] === 0xffffffff) {
          entry[key] = Number(buf.readBigUInt64LE(q));
          q += 8;
        }
      }
    }
    p += 4 + size;
  }
}

function checkArchive(label, buf) {
  const cd = findCentralDirectory(buf);
  if (!cd) {
    report(label, 'zip として読み取れず、中身を検査できません');
    return;
  }
  let p = cd.offset;
  for (let n = 0; n < cd.count; n++) {
    if (p + 46 > buf.length || buf.readUInt32LE(p) !== 0x02014b50) {
      report(label, 'zip の目次が壊れていて、中身を検査できません');
      return;
    }
    const flags = buf.readUInt16LE(p + 8);
    const entry = {
      method: buf.readUInt16LE(p + 10),
      compressedSize: buf.readUInt32LE(p + 20),
      size: buf.readUInt32LE(p + 24),
      localOffset: buf.readUInt32LE(p + 42),
    };
    const nameLength = buf.readUInt16LE(p + 28);
    const extraLength = buf.readUInt16LE(p + 30);
    const commentLength = buf.readUInt16LE(p + 32);
    const name = buf.toString('utf8', p + 46, p + 46 + nameLength);
    readZip64Extra(buf, p + 46 + nameLength, extraLength, entry);
    p += 46 + nameLength + extraLength + commentLength;

    const entryLabel = `${label} › ${name}`;
    if (name.endsWith('/')) {
      stats.entries++;
      checkName(entryLabel, name);
      continue;
    }
    if (flags & 1) {
      report(entryLabel, 'パスワード付きで、中身を検査できません');
      continue;
    }
    const data = readEntry(buf, entry, entryLabel);
    if (data) checkBuffer(entryLabel, name, data);
  }
}

function readEntry(buf, entry, label) {
  const at = entry.localOffset;
  if (at + 30 > buf.length || buf.readUInt32LE(at) !== 0x04034b50) {
    report(label, 'zip の中身を読み取れません');
    return null;
  }
  const start = at + 30 + buf.readUInt16LE(at + 26) + buf.readUInt16LE(at + 28);
  const raw = buf.subarray(start, start + entry.compressedSize);
  inflatedTotal += entry.size;
  if (inflatedTotal > MAX_INFLATED_BYTES) {
    report(label, '展開後のサイズが大きすぎて、検査できません');
    return null;
  }
  if (entry.method === 0) return raw;
  if (entry.method === 8) return zlib.inflateRawSync(raw);
  report(label, `未対応の圧縮方式(${entry.method})で、中身を検査できません`);
  return null;
}

// ---- 実行 ----

function walk(target) {
  const stat = fs.statSync(target);
  if (stat.isDirectory()) {
    for (const child of fs.readdirSync(target).sort()) walk(path.join(target, child));
    return;
  }
  stats.files++;
  const relative = path.relative(ROOT, target);
  const label = relative && !relative.startsWith('..') ? relative : target;
  checkBuffer(label, label.split(path.sep).join('/'), fs.readFileSync(target));
}

const targets = process.argv.slice(2);
for (const target of targets.length ? targets : DEFAULT_TARGETS) {
  const full = path.resolve(ROOT, target);
  if (fs.existsSync(full)) walk(full);
}

if (problems.length) {
  console.error('\n公開ファイルの安全チェックで、渡すべきでない可能性があるものが見つかりました:\n');
  for (const { label, reason } of problems) console.error(`  ✗ ${label}\n      ${reason}`);
  console.error(
    `\n${problems.length} 件。該当ファイルを取り除くか、中身を消して作り直してから、もう一度ビルドしてください。\n`,
  );
  process.exit(1);
}

console.log(`公開ファイルの安全チェック: ${stats.files} ファイル(展開後 ${stats.entries} 件)を検査し、問題はありませんでした。`);
