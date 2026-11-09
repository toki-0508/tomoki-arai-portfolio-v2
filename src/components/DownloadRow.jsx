import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon.jsx';
import { GeneratedCover } from './GeneratedCover.jsx';
import { CategoryLabel, Thumb } from './ui.jsx';
import { isAudio } from '../content/loader.js';
import { t } from '../content/copy.js';
import { C, EditableImage, F, Prose } from '../editor/index.jsx';

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
      aria-label={playing ? t('common.download.stopLabel', { name }) : t('common.download.playLabel', { name })}
    >
      {playing ? <Icon.Pause width={14} height={14} /> : <Icon.Play width={14} height={14} />}
      <span>{playing ? <C k="common.download.stop" /> : <C k="common.download.play" />}</span>
    </button>
  );
}

// compact: トップページ用。使うときの注意は省き、説明は1行に収める(注意はダウンロードページで読める)
export function DownloadRow({ file, compact = false }) {
  const spec = [file.platform && t('common.download.platform', { platform: file.platform }), file.length, file.size].filter(Boolean);
  const sound = t('common.download.coverSound');
  const audio = isAudio(file);

  return (
    <article className={`dl-row ${compact ? 'is-compact' : ''}`}>
      <div className="dl-cover">
        {audio ? (
          <GeneratedCover name={file.name} label={file.length ? `${sound} · ${file.length}` : sound} />
        ) : file.image ? (
          <EditableImage item={file}><Thumb src={file.image} alt="" /></EditableImage>
        ) : (
          <GeneratedCover name={file.name} label={(file.tags[1] ?? file.categoryLabel).toUpperCase()} pattern="blocks" />
        )}
      </div>
      <div className="dl-body">
        <p className="meta">
          <CategoryLabel category={file.category} label={file.categoryLabel} />
          {audio && <span className="dl-format"><C k="common.download.audio" /></span>}
          <time dateTime={file.date}>{file.dateLabel}</time>
        </p>
        <h3 className="dl-title"><F item={file} field="name" /></h3>
        <Prose item={file} part="lead">
          {file.lead.map((block, i) => (block.type === 'p' ? <p key={i} className="dl-desc">{block.text}</p> : null))}
        </Prose>
        {file.note && !compact && <p className="dl-note"><F item={file} field="note" /></p>}
        {spec.length > 0 && <p className="dl-spec">{spec.join(' · ')}</p>}
      </div>
      <div className={`dl-actions${file.guide && !compact ? ' has-guide' : ''}`}>
        {audio && file.file && <AudioPreview src={file.file} name={file.name} />}
        {file.file ? (
          <a className="btn btn-primary btn-sm" href={file.file} download aria-label={t('common.download.buttonLabel', { name: file.name })}>
            <Icon.Download width={16} height={16} />
            {file.downloadLabel ? <F item={file} field="downloadLabel" /> : <C k="common.download.button" />}
          </a>
        ) : (
          <span className="dl-unavailable"><C k="common.download.unavailable" /></span>
        )}
        {file.guide && !compact && (
          <a className="btn btn-secondary btn-sm" href={file.guide}><C k="common.download.guide" /></a>
        )}
      </div>
    </article>
  );
}
