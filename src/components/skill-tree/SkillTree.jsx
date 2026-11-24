import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../Icon.jsx';
import { C, S } from '../../editor/index.jsx';
import { t } from '../../content/copy.js';
import { SKILL_GROUPS } from '../../content/site.js';
import { SKILL_BRANCHES } from '../../content/skill-tree.js';
import { buildSkillTree, branchBounds, fitCamera } from '../../lib/skill-tree.js';
import { useElementSize, useTreeCamera } from './useTreeCamera.js';
import { SkillGraph } from './SkillGraph.jsx';
import { SkillDetails } from './SkillDetails.jsx';
import './skill-tree.css';

function TreeExplorer({ tree, onClose }) {
  const dialog = useRef(null);
  const viewport = useRef(null);
  const [selected, setSelected] = useState(null);
  const { camera, fit, zoom, handlers } = useTreeCamera(viewport, tree.nodes);
  function select(id, keyboard = false) {
    if (id === 'root') {
      setSelected(null);
      fit();
      return;
    }
    setSelected(id);
    if (keyboard) fit(id);
  }
  useEffect(() => {
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element.showModal();
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

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
        onClose();
      }}
    >
      <header className="skill-tree-toolbar">
        <div>
          <span className="skill-tree-small">TOMOKI ARAI</span>
          <h2 id="skill-tree-dialog-title">
            <C k="about.tree.title" />
          </h2>
        </div>
        <button type="button" className="skill-tree-minimize" onClick={onClose} autoFocus>
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
      </div>
    </dialog>,
    document.body,
  );
}

export function SkillTree() {
  const tree = useMemo(() => buildSkillTree(SKILL_GROUPS, SKILL_BRANCHES), [SKILL_GROUPS]);
  const preview = useRef(null);
  const opener = useRef(null);
  const size = useElementSize(preview);
  const [expanded, setExpanded] = useState(false);
  const skillCount = tree.nodes.filter((node) => node.type === 'skill').length;
  const close = useCallback(() => {
    setExpanded(false);
    requestAnimationFrame(() => opener.current?.focus({ preventScroll: true }));
  }, []);
  return (
    <div className="skill-tree">
      <div ref={preview} className="skill-tree-preview">
        <div className="skill-tree-preview-head">
          <span>SKILL TREE</span>
          <span>{String(skillCount).padStart(2, '0')} NODES</span>
        </div>
        <div aria-hidden="true">
          <SkillGraph tree={tree} camera={fitCamera(size, branchBounds(tree.nodes), 54)} />
        </div>
        <button
          ref={opener}
          className="skill-tree-open"
          type="button"
          onClick={() => setExpanded(true)}
          aria-haspopup="dialog"
          aria-expanded={expanded}
          aria-label={t('about.tree.open')}
        >
          <span className="skill-tree-open-caption">
            <Icon.Maximize width={16} height={16} />
            <C k="about.tree.openCaption" />
          </span>
        </button>
      </div>
      <details className="skill-tree-list">
        <summary>
          <C k="about.tree.list" />
        </summary>
        <ul>
          {SKILL_GROUPS.flatMap((group, gi) =>
            group.skills.map((skill, si) => (
              <li key={`${gi}-${si}`}>
                <S path={`SKILL_GROUPS.${gi}.skills.${si}`} />
              </li>
            )),
          )}
        </ul>
      </details>
      {expanded && <TreeExplorer tree={tree} onClose={close} />}
    </div>
  );
}
