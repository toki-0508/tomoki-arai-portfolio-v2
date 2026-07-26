import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon.jsx';
import { CategoryChip, Thumb } from './ui.jsx';
import { isAudio } from '../content/loader.js';

// 同時に鳴るのは常に1つにするため、Audio はモジュールで共有する。
let sharedAudio = null;
let activeSetter = null;

function stopShared() {
  if (sharedAudio) {
    sharedAudio.pause();
    sharedAudio = null;
  }
  if (activeSetter) {
    activeSetter(false);
    activeSetter = null;
  }
}

// 音源ファイルはその場で試聴できるようにする(ダウンロード前に中身がわかる)。
function AudioPreview({ src, name }) {
  const [playing, setPlaying] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (activeSetter === setPlayingSafe) stopShared();
    };
  }, []);

  const setPlayingSafe = (value) => {
    if (mounted.current) setPlaying(value);
  };

  const toggle = () => {
    if (playing) {
      stopShared();
      return;
    }
    stopShared();
    sharedAudio = new Audio(src);
    activeSetter = setPlayingSafe;
    sharedAudio.addEventListener('ended', stopShared);
    sharedAudio.play().then(() => setPlayingSafe(true)).catch(stopShared);
  };

  return (
    <button
      type="button"
      className={`audio-btn ${playing ? 'playing' : ''}`}
      onClick={toggle}
      aria-label={playing ? `${name} の再生を停止` : `${name} を試聴`}
      title={playing ? '停止' : '試聴'}
    >
      {playing ? <Icon.Pause width={15} height={15} /> : <Icon.Play width={15} height={15} />}
    </button>
  );
}

export function DownloadRow({ file }) {
  return (
    <div className="dl-row">
      <div className="dl-thumb">
        <Thumb src={file.image} alt={file.name} />
      </div>
      <div className="dl-body">
        <div className="dl-head">
          <CategoryChip category={file.category} label={file.categoryLabel} />
          <span className="dl-date">{file.dateLabel}</span>
        </div>
        <h3 className="dl-title">{file.name}</h3>
        <div className="dl-desc">
          {file.lead.map((block, i) =>
            block.type === 'p' ? <p key={i}>{block.text}</p> : null,
          )}
        </div>
      </div>
      <div className="dl-actions">
        {isAudio(file) && file.file && <AudioPreview src={file.file} name={file.name} />}
        {file.file ? (
          <a className="btn btn-primary dl-btn" href={file.file} download>
            <Icon.Download width={16} height={16} />
            <span>ダウンロード</span>
            {file.size && <small>{file.size}</small>}
          </a>
        ) : (
          <span className="dl-unavailable">準備中</span>
        )}
      </div>
    </div>
  );
}
