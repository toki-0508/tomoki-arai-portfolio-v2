import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon.jsx';
import { GeneratedCover } from './GeneratedCover.jsx';
import { CategoryLabel, Thumb } from './ui.jsx';
import { isAudio } from '../content/loader.js';

// 同時に鳴るのは常に1曲だけにするため、Audio はモジュールで共有する。
let sharedAudio = null;
let stopActive = null;

function stopShared() {
  sharedAudio?.pause();
  sharedAudio = null;
  stopActive?.();
  stopActive = null;
}

// 音源はダウンロード前にその場で試聴できるようにする
function AudioPreview({ src, name }) {
  const [playing, setPlaying] = useState(false);
  const mounted = useRef(true);
  const markStopped = useRef(() => {
    if (mounted.current) setPlaying(false);
  });

  useEffect(() => {
    mounted.current = true;
    const marker = markStopped.current;
    return () => {
      mounted.current = false;
      if (stopActive === marker) stopShared();
    };
  }, []);

  const toggle = () => {
    if (playing) {
      stopShared();
      return;
    }
    stopShared();
    sharedAudio = new Audio(src);
    stopActive = markStopped.current;
    sharedAudio.addEventListener('ended', stopShared);
    sharedAudio
      .play()
      .then(() => mounted.current && setPlaying(true))
      .catch(stopShared);
  };

  return (
    <button
      type="button"
      className={`audio-btn ${playing ? 'is-playing' : ''}`}
      onClick={toggle}
      aria-pressed={playing}
      aria-label={playing ? `${name}の再生を停止` : `${name}を試聴`}
    >
      {playing ? <Icon.Pause width={14} height={14} /> : <Icon.Play width={14} height={14} />}
      <span>{playing ? '停止' : '試聴'}</span>
    </button>
  );
}

// compact: トップページ用。使うときの注意は省き、説明は1行に収める(注意はダウンロードページで読める)
export function DownloadRow({ file, compact = false }) {
  const spec = [file.platform && `${file.platform}用`, file.length, file.size].filter(Boolean);

  return (
    <article className={`dl-row ${compact ? 'is-compact' : ''}`}>
      <div className="dl-cover">
        {file.category === 'sounds' ? (
          <GeneratedCover name={file.name} label={file.length ? `SOUND · ${file.length}` : 'SOUND'} />
        ) : file.image ? (
          <Thumb src={file.image} alt="" />
        ) : (
          <GeneratedCover name={file.name} label={(file.tags[1] ?? file.categoryLabel).toUpperCase()} pattern="blocks" />
        )}
      </div>
      <div className="dl-body">
        <p className="meta">
          <CategoryLabel category={file.category} label={file.categoryLabel} />
          <time dateTime={file.date}>{file.dateLabel}</time>
        </p>
        <h3 className="dl-title">{file.name}</h3>
        {file.lead.map((block, i) => (block.type === 'p' ? <p key={i} className="dl-desc">{block.text}</p> : null))}
        {file.note && !compact && <p className="dl-note">{file.note}</p>}
        {spec.length > 0 && <p className="dl-spec">{spec.join(' · ')}</p>}
      </div>
      <div className="dl-actions">
        {isAudio(file) && file.file && <AudioPreview src={file.file} name={file.name} />}
        {file.file ? (
          <a className="btn btn-primary btn-sm" href={file.file} download>
            <Icon.Download width={16} height={16} />
            ダウンロード
          </a>
        ) : (
          <span className="dl-unavailable">準備中です</span>
        )}
      </div>
    </article>
  );
}
