// 本番用と編集用の部品で共通に使う小さな関数と定数

// 'MVV.0.title' のような点区切りの場所から値を取り出す
export const getPath = (obj, dotted) => String(dotted).split('.').reduce((value, key) => value?.[key], obj);

export const COPY_FILE = 'src/content/copy.json';
export const SITE_FILE = 'src/content/site.json';
