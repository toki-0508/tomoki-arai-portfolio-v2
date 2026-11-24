import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../Icon.jsx';
import { C } from '../../editor/index.jsx';
import { t } from '../../content/copy.js';
import MODEL from '../../content/skill-tree.json';
import { sortSkillsByName } from '../../lib/skill-tree-model.js';
import { buildSkillTree, reframeCamera } from '../../lib/skill-tree.js';
import { useTreeCamera } from './useTreeCamera.js';
import { SkillGraph } from './SkillGraph.jsx';
import { SkillDetails } from './SkillDetails.jsx';
import './skill-tree.css';

function CameraControls({ camera, zoom, fit }) {
  return (
    <div className="skill-tree-zoom" role="group" aria-label={t('about.tree.zoomControls')}>
      <button
        className="skill-tree-tool"
        type="button"
        disabled={camera.scale <= 0.1}
        onClick={() => zoom(1 / 1.25)}
        aria-label={t('about.tree.zoomOut')}
        title={t('about.tree.zoomOut')}
      >
        <Icon.Minus />
      </button>
      <output aria-live="off">{Math.round(camera.scale * 100)}%</output>
      <button
        className="skill-tree-tool"
        type="button"
        disabled={camera.scale >= 2}
        onClick={() => zoom(1.25)}
        aria-label={t('about.tree.zoomIn')}
        title={t('about.tree.zoomIn')}
      >
        <Icon.Plus />
      </button>
      <span className="skill-tree-toolbar-rule" />
      <button
        className="skill-tree-tool"
        type="button"
        onClick={() => fit()}
        aria-label={t('about.tree.fit')}
        title={t('about.tree.fit')}
      >
        <Icon.Fit />
      </button>
    </div>
  );
}

function originClip(rect) {
  return `inset(${Math.max(0, rect.top)}px ${Math.max(0, innerWidth - rect.right)}px ${Math.max(0, innerHeight - rect.bottom)}px ${Math.max(0, rect.left)}px round 6px)`;
}

const revealTiming = { duration: 420, easing: 'cubic-bezier(.22, 1, .36, 1)' };

function TreeExplorer({ tree, initialView, getOriginRect, onRestore, onClose }) {
  const dialog = useRef(null);
  const viewport = useRef(null);
  const closing = useRef(false);
  const [selected, setSelected] = useState(null);
  const initialCamera = {
    ...initialView.camera,
    x: initialView.camera.x + initialView.rect.left,
    y: initialView.camera.y + initialView.rect.top,
  };
  const controls = useTreeCamera(viewport, tree.nodes, { smooth: true, initialView, initialCamera });
  const { camera, size, fit, handlers, restore } = controls;

  function select(id, keyboard = false) {
    if (id === 'root') {
      setSelected(null);
      fit();
      return;
    }
    setSelected(id);
    if (keyboard) fit(id);
  }
  useLayoutEffect(() => {
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element.showModal();
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      element.animate(
        [{ clipPath: originClip(initialView.rect) }, { clipPath: 'inset(0px round 0px)' }],
        revealTiming,
      );
    }
    return () => {
      element.getAnimations().forEach((animation) => animation.cancel());
      element.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [initialView]);

  function requestClose() {
    if (closing.current) return;
    closing.current = true;
    const rect = getOriginRect();
    const previewCamera = reframeCamera(camera, size, rect);
    onRestore(previewCamera);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onClose();
      return;
    }
    restore({ ...previewCamera, x: previewCamera.x + rect.left, y: previewCamera.y + rect.top });
    const element = dialog.current;
    const from = getComputedStyle(element).clipPath;
    element.getAnimations().forEach((animation) => animation.cancel());
    const animation = element.animate([{ clipPath: from }, { clipPath: originClip(rect) }], {
      ...revealTiming,
      fill: 'forwards',
    });
    animation.finished.then(onClose, () => {});
  }

  function trapTab(event) {
    if (event.key !== 'Tab') return;
    const controls = [
      ...dialog.current.querySelectorAll('button:not(:disabled), a[href], [tabindex="0"]'),
    ].filter((control) => control.getClientRects().length > 0);
    const boundary = event.shiftKey ? controls[0] : controls.at(-1);
    if (document.activeElement === boundary) {
      event.preventDefault();
      (event.shiftKey ? controls.at(-1) : controls[0])?.focus();
    }
  }
  const node = tree.nodes.find((candidate) => candidate.id === selected);
  return createPortal(
    <dialog
      ref={dialog}
      className="skill-tree-dialog"
      aria-labelledby="skill-tree-dialog-title"
      onKeyDown={trapTab}
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
    >
      <header className="skill-tree-toolbar">
        <div>
          <span className="skill-tree-small">TOMOKI ARAI</span>
          <h2 id="skill-tree-dialog-title">
            <C k="about.tree.title" />
          </h2>
        </div>
        <button type="button" className="skill-tree-minimize" onClick={requestClose} autoFocus>
          <Icon.Minimize />
          <C k="about.tree.minimize" />
        </button>
      </header>
      <div className="skill-tree-explorer-body">
        <div
          ref={viewport}
          className="skill-tree-viewport"
          tabIndex={0}
          role="group"
          aria-label={t('about.tree.mapLabel')}
          aria-describedby="skill-tree-keys"
          {...handlers}
        >
          <SkillGraph tree={tree} camera={camera} selected={selected} interactive onSelect={select} />
        </div>
        <p className="visually-hidden" id="skill-tree-keys">
          <C k="about.tree.keys" />
        </p>
        {node && <SkillDetails node={node} onClose={() => setSelected(null)} onNavigate={onClose} />}
        <CameraControls {...controls} />
      </div>
    </dialog>,
    document.body,
  );
}

export function SkillTree() {
  const tree = useMemo(() => buildSkillTree(MODEL), [MODEL]);
  const preview = useRef(null);
  const opener = useRef(null);
  const [expanded, setExpanded] = useState(null);
  const controls = useTreeCamera(preview, tree.nodes, { smooth: true, focus: 'root', wheel: 'modified' });
  const { camera, size, handlers, restore } = controls;
  const skillCount = tree.nodes.length - 1;
  const close = useCallback(() => {
    setExpanded(null);
    requestAnimationFrame(() => opener.current?.focus({ preventScroll: true }));
  }, []);
  function open() {
    setExpanded({ camera, size, rect: preview.current.getBoundingClientRect() });
  }
  return (
    <div className="skill-tree">
      <div className="skill-tree-preview-shell">
        <div
          ref={preview}
          className="skill-tree-preview skill-tree-viewport"
          tabIndex={0}
          role="group"
          aria-label={t('about.tree.mapLabel')}
          aria-describedby="skill-tree-preview-keys"
          {...handlers}
          onClick={open}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              open();
            } else handlers.onKeyDown(event);
          }}
        >
          <div aria-hidden="true">
            <SkillGraph tree={tree} camera={camera} />
          </div>
        </div>
        <div className="skill-tree-preview-head">
          <span>SKILL TREE</span>
          <span>{String(skillCount).padStart(2, '0')} NODES</span>
        </div>
        <CameraControls {...controls} />
        <button
          ref={opener}
          className="skill-tree-open"
          type="button"
          onClick={open}
          aria-haspopup="dialog"
          aria-expanded={Boolean(expanded)}
          aria-label={t('about.tree.open')}
          title={t('about.tree.openCaption')}
        >
          <Icon.Maximize width={20} height={20} />
        </button>
      </div>
      <p className="visually-hidden" id="skill-tree-preview-keys">
        <C k="about.tree.previewKeys" />
      </p>
      <ul className="skill-tree-list visually-hidden" aria-label={t('about.tree.list')}>
        {sortSkillsByName(MODEL.nodes).map((node) => (
          <li key={node.id}>{node.name}</li>
        ))}
      </ul>
      {expanded && (
        <TreeExplorer
          tree={tree}
          initialView={expanded}
          getOriginRect={() => preview.current.getBoundingClientRect()}
          onRestore={restore}
          onClose={close}
        />
      )}
    </div>
  );
}
