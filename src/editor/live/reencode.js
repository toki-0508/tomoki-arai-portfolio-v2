// ============================================================
// 選んだ画像をブラウザの中で描き直してから保存する。
// - 位置情報(GPS)などの埋め込み情報は、描き直すときにすべて消える
// - 長辺が MAX_SIDE を超える写真は縮小する(サイトを重くしない)
// - PNG は PNG のまま(透明を保つ)、それ以外は JPEG にする
// ============================================================
export const MAX_SIDE = 2400;
const JPEG_QUALITY = 0.88;

export function targetSize(width, height, max = MAX_SIDE) {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

export const outputType = (file) => (file.type === 'image/png' ? 'image/png' : 'image/jpeg');

export async function reencodeImage(file) {
  let bitmap;
  try {
    // 写真の向き(EXIF の回転)は createImageBitmap が反映してから描く
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error('この画像は読み込めませんでした。JPEG か PNG で書き出してから選んでください(iPhone の HEIC など)。');
  }
  const { width, height } = targetSize(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  const type = outputType(file);
  if (type === 'image/jpeg') {
    // JPEG は透明を持てないので、透明な部分は白にする
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
  }
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, type, type === 'image/jpeg' ? JPEG_QUALITY : undefined));
  if (!blob) throw new Error('画像を保存できませんでした。別の画像で試してください。');
  return blob;
}
