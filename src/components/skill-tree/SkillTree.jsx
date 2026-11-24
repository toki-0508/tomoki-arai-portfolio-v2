import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../Icon.jsx';
import { Link } from '../ui.jsx';
import { C, F, S } from '../../editor/index.jsx';
import { t } from '../../content/copy.js';
import { PROFILE, SKILL_GROUPS } from '../../content/site.js';
import { SKILL_BRANCHES } from '../../content/skill-tree.js';
import { DOWNLOADS, WORKS, usageOf } from '../../content/loader.js';
import { buildSkillTree, fitCamera, NODE_SIZE, normalizeSkill, TREE_SIZE } from '../../lib/skill-tree.js';
import { useElementSize, useTreeCamera } from './useTreeCamera.js';
import './skill-tree.css';

function TreeGraph({ tree, camera, selected, branch, interactive = false, onSelect }) {
  const overview = camera.scale < 0.45;
  const displayedNodes = tree.nodes.map((node) => {
    if (!overview || node.type !== 'branch') return node;
    const spread = Math.min(1, (0.45 - camera.scale) / 0.2);
    const center = TREE_SIZE / 2;
    const ratio = (345 + spread * 335) / 345;
    return { ...node, x: center + (node.x - center) * ratio, y: center + (node.y - center) * ratio };
  });
  const byId = new Map(displayedNodes.map((node) => [node.id, node]));
  const edges = overview
    ? tree.edges
        .filter((edge) => byId.get(edge.to).type !== 'track')
        .map((edge) => ({
          ...edge,
          from: byId.get(edge.from).type === 'track' ? `branch-${edge.branch}` : edge.from,
        }))
    : tree.edges;
  return (
    <div
      className="skill-tree-world"
      style={{
        width: TREE_SIZE,
        height: TREE_SIZE,
        transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`,
      }}
    >
      <svg className="skill-tree-lines" width={TREE_SIZE} height={TREE_SIZE} aria-hidden="true">
        {[345, 590, 1040].map((radius) => (
          <circle
            key={radius}
            className="skill-tree-orbit"
            cx={TREE_SIZE / 2}
            cy={TREE_SIZE / 2}
            r={radius}
          />
        ))}
        {edges.map((edge) => {
          const from = byId.get(edge.from);
          const to = byId.get(edge.to);
          return (
            <line
              key={edge.to}
              className={`skill-tone-${edge.branch} ${branch && branch !== edge.branch ? 'is-muted' : ''}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
            />
          );
        })}
      </svg>
      {displayedNodes
        .filter((node) => !overview || node.type !== 'track')
        .map((node) => {
          const [width, height] = overview && node.type === 'skill' ? [22, 22] : NODE_SIZE[node.type];
          const Glyph = Icon[node.icon] || Icon.Spark;
          const count = node.type === 'skill' ? usageOf(node.name) : 0;
          const className = `skill-tree-node is-${node.type} skill-tone-${node.branch || 'root'} ${overview ? 'is-overview' : ''} ${selected === node.id ? 'is-selected' : ''} ${branch && node.branch && branch !== node.branch ? 'is-muted' : ''} ${count ? 'has-work' : ''}`;
          const content = (
            <>
              {node.type === 'root' ? (
                <>
                  <span className="skill-tree-monogram">TA</span>
                  <span>{PROFILE.nameEn}</span>
                </>
              ) : (
                <>
                  <span className="skill-tree-node-icon">
                    {node.type === 'skill' ? (
                      <span className="skill-tree-dot" />
                    ) : (
                      <Glyph width={22} height={22} />
                    )}
                  </span>
                  <span className="skill-tree-node-name">
                    {node.path ? <S path={node.path} /> : node.name}
                  </span>
                  {count > 0 && <span className="skill-tree-count">{count}</span>}
                </>
              )}
            </>
          );
          const factor = overview
            ? node.type === 'skill'
              ? 0.6 / camera.scale
              : Math.min(3.4, 0.68 / camera.scale)
            : 1;
          const style = {
            left: node.x - width / 2,
            top: node.y - height / 2,
            width,
            height,
            transform: `scale(${factor})`,
            fontSize:
              !overview && ['skill', 'track'].includes(node.type)
                ? Math.max(16, 13 / camera.scale)
                : undefined,
          };
          return interactive && !(overview && node.type === 'skill') ? (
            <button
              key={node.id}
              type="button"
              style={style}
              className={className}
              data-node-id={node.id}
              aria-label={
                node.type === 'root'
                  ? t('about.tree.all')
                  : node.type === 'skill'
                    ? t('about.tree.skillLabel', { name: node.name, count })
                    : node.name
              }
              aria-pressed={node.type === 'skill' ? selected === node.id : undefined}
              onClick={() => onSelect(node.id)}
              onFocus={(event) => {
                if (event.target.matches(':focus-visible')) onSelect(node.id, true);
              }}
            >
              {content}
            </button>
          ) : (
            <div key={node.id} style={style} className={className}>
              {content}
            </div>
          );
        })}
    </div>
  );
}

function SkillDetails({ node, onClose, onNavigate }) {
  const matches = (entry) => entry.tags.some((tag) => normalizeSkill(tag) === normalizeSkill(node.name));
  const works = WORKS.filter(matches);
  const downloads = DOWNLOADS.filter(matches);
  return (
    <aside className="skill-tree-details" aria-labelledby="skill-detail-title" aria-live="polite">
      <div className="skill-tree-detail-head">
        <div>
          <p className="eyebrow">
            <C k="about.tree.selected" />
          </p>
          <h3 id="skill-detail-title">
            <S path={node.path} />
          </h3>
        </div>
        <button
          className="skill-tree-tool"
          type="button"
          onClick={onClose}
          aria-label={t('about.tree.closeDetails')}
          title={t('about.tree.closeDetails')}
        >
          <Icon.Close />
        </button>
      </div>
      <p className="skill-tree-detail-count">
        <C k="about.skills.usagePrefix" />
        {works.length + downloads.length}
        <C k="about.skills.usageSuffix" />
      </p>
      {works.length + downloads.length ? (
        <ul className="skill-tree-related">
          {works.map((work) => (
            <li key={`work-${work.id}`}>
              <Link to={`/works/${work.id}`} onNavigate={onNavigate}>
                <span>
                  <F item={work} field="name" />
                </span>
                <Icon.Arrow width={16} height={16} />
              </Link>
            </li>
          ))}
          {downloads.map((download) => (
            <li key={`download-${download.id}`}>
              <Link to={`/downloads?cat=${download.category}`} onNavigate={onNavigate}>
                <span>
                  <F item={download} field="name" />
                  <small>
                    <C k="about.tree.download" />
                  </small>
                </span>
                <Icon.Arrow width={16} height={16} />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="skill-tree-empty">
          <C k="about.tree.noWorks" />
        </p>
      )}
    </aside>
  );
}

function TreeExplorer({ tree, onClose }) {
  const dialog = useRef(null);
  const viewport = useRef(null);
  const [selected, setSelected] = useState(null);
  const [branch, setBranch] = useState(null);
  const { camera, fit, zoom, handlers } = useTreeCamera(viewport, tree.nodes);
  function select(id, keyboard = false) {
    const node = tree.nodes.find((candidate) => candidate.id === id);
    if (!node) return;
    if (node.type === 'skill') {
      setSelected(node.id);
      setBranch(node.branch);
      if (keyboard) fit(node.branch);
    } else {
      setSelected(null);
      setBranch(node.branch || null);
      fit(node.branch || null);
    }
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

  const node = tree.nodes.find((candidate) => candidate.id === selected);
  function chooseBranch(id) {
    setBranch(id);
    setSelected(null);
    fit(id);
  }
  function trapTab(event) {
    if (event.key !== 'Tab') return;
    const controls = [
      ...dialog.current.querySelectorAll('button:not(:disabled), a[href], [tabindex="0"]'),
    ].filter((control) => control.getClientRects().length > 0);
    const first = controls[0];
    const last = controls.at(-1);
    const boundary = event.shiftKey ? first : last;
    if (document.activeElement === boundary) {
      event.preventDefault();
      (event.shiftKey ? last : first)?.focus();
    }
  }
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
          <p className="eyebrow">SKILL TREE</p>
          <h2 id="skill-tree-dialog-title">
            <C k="about.tree.title" />
          </h2>
        </div>
        <button type="button" className="skill-tree-minimize" onClick={onClose} autoFocus>
          <Icon.Minimize />
          <C k="about.tree.minimize" />
        </button>
      </header>
      <nav className="skill-tree-tabs" aria-label={t('about.tree.branches')}>
        <button type="button" aria-pressed={!branch} onClick={() => chooseBranch(null)}>
          <C k="about.tree.all" />
        </button>
        {tree.branches.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className={`skill-tone-${entry.id}`}
            aria-pressed={branch === entry.id}
            onClick={() => chooseBranch(entry.id)}
          >
            <span className="skill-tree-dot" />
            {entry.title}
          </button>
        ))}
      </nav>
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
          <TreeGraph
            tree={tree}
            camera={camera}
            selected={selected}
            branch={branch}
            interactive
            onSelect={select}
          />
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
            onClick={() => fit(branch)}
            aria-label={t('about.tree.fit')}
            title={t('about.tree.fit')}
          >
            <Icon.Fit />
          </button>
        </div>
      </div>
      <footer className="skill-tree-footer">
        <span className="skill-tree-legend-dot" />
        <C k="about.tree.legend" />
      </footer>
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
      <div className="skill-tree-preview-head">
        <p className="skill-tree-summary">
          <span>{String(tree.branches.length).padStart(2, '0')}</span>
          <C k="about.tree.fields" />
          <span>{String(skillCount).padStart(2, '0')}</span>
          <C k="about.tree.skills" />
        </p>
        <span className="skill-tree-preview-label">SKILL TREE / TOMOKI ARAI</span>
      </div>
      <div ref={preview} className="skill-tree-preview">
        <div aria-hidden="true">
          <TreeGraph tree={tree} camera={fitCamera(size)} />
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
            <Icon.Maximize width={18} height={18} />
            <C k="about.tree.openCaption" />
            <Icon.Arrow width={17} height={17} />
          </span>
        </button>
      </div>
      <div className="skill-tree-preview-foot">
        <ul className="skill-tree-branch-legend">
          {tree.branches.map((entry) => (
            <li key={entry.id} className={`skill-tone-${entry.id}`}>
              <span className="skill-tree-dot" />
              {entry.title}
            </li>
          ))}
        </ul>
        <span className="skill-tree-preview-legend">
          <span className="skill-tree-legend-dot" />
          <C k="about.tree.legend" />
        </span>
      </div>
      <details className="skill-tree-list">
        <summary>
          <C k="about.tree.list" />
        </summary>
        <div className="skill-tree-list-groups">
          {SKILL_GROUPS.map((group, gi) => (
            <div key={gi}>
              <h3>
                <S path={`SKILL_GROUPS.${gi}.title`} />
              </h3>
              <ul>
                {group.skills.map((skill, si) => (
                  <li key={si}>
                    <S path={`SKILL_GROUPS.${gi}.skills.${si}`} />
                    {usageOf(skill) > 0 && <span className="skill-tree-list-count">{usageOf(skill)}</span>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </details>
      {expanded && <TreeExplorer tree={tree} onClose={close} />}
    </div>
  );
}
