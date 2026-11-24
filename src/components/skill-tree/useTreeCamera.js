import { useCallback, useEffect, useRef, useState } from 'react';
import {
  branchBounds,
  constrainCamera,
  fitCamera,
  zoomCamera,
  centerCamera,
  reframeCamera,
} from '../../lib/skill-tree.js';
import { useMotionCamera } from './useMotionCamera.js';

export function useElementSize(ref) {
  const [size, setSize] = useState({ width: 1, height: 1 });
  useEffect(() => {
    const element = ref.current;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return size;
}

export function useTreeCamera(ref, nodes, options = {}) {
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const previousSize = useRef(null);
  const size = useElementSize(ref);
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;
  const ready = nodes.length > 0;
  const [camera, setCamera] = useState(() => options.initialCamera || fitCamera({ width: 800, height: 600 }));
  const renderedCamera = useMotionCamera(camera, options.smooth);
  const pointers = useRef(new Map());
  const gesture = useRef(null);
  const suppressClick = useRef(false);
  const fittedView = useRef({ target: null, minimumScale: null });
  const fit = useCallback(
    (target = null, minimumScale = 0) => {
      fittedView.current = { target, minimumScale };
      const fitted = fitCamera(size, branchBounds(nodesRef.current, target), 48);
      const readableScale = target ? Math.max(0.55, minimumScale) : minimumScale;
      setCamera(
        fitted.scale < readableScale
          ? zoomCamera(fitted, readableScale, { x: size.width / 2, y: size.height / 2 })
          : fitted,
      );
    },
    [size],
  );
  useEffect(() => {
    if (!ready || size.width <= 1 || size.height <= 1) return;
    const config = optionsRef.current;
    if (config.focus || config.initialView) {
      const previous = previousSize.current;
      previousSize.current = size;
      setCamera((current) => {
        if (previous) return reframeCamera(current, previous, size);
        if (config.initialView)
          return reframeCamera(config.initialView.camera, config.initialView.size, size, 1.12);
        const focus = nodesRef.current.find((node) => node.id === config.focus) || nodesRef.current[0];
        return centerCamera(size, focus, size.width < 640 ? 0.4 : 0.72);
      });
      return;
    }
    const { target, minimumScale } = fittedView.current;
    // 開いた直後は技術を読める倍率、リセットでは全体像を表示する。
    fit(target, minimumScale ?? (size.width < 640 ? 0.34 : 0.48));
  }, [fit, ready]);

  const zoom = useCallback(
    (factor, point = { x: size.width / 2, y: size.height / 2 }) => {
      setCamera((current) => constrainCamera(zoomCamera(current, current.scale * factor, point), size));
    },
    [size],
  );

  useEffect(() => {
    const element = ref.current;
    // This surface moves only through its camera, never native focus scrolling.
    const lockScroll = () => {
      if (element.scrollLeft || element.scrollTop) element.scrollTo(0, 0);
    };
    element.addEventListener('scroll', lockScroll, { passive: true });
    const onWheel = (event) => {
      if (optionsRef.current.wheel === 'modified' && !event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      const rect = element.getBoundingClientRect();
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? size.height : 1);
      zoom(Math.exp(-Math.max(-100, Math.min(100, delta)) * 0.005), {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });
    };
    element.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      element.removeEventListener('wheel', onWheel);
      element.removeEventListener('scroll', lockScroll);
    };
  }, [ref, size.height, zoom]);

  function onPointerDown(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 1) {
      suppressClick.current = false;
      gesture.current = {
        x: event.clientX,
        y: event.clientY,
        moved: false,
      };
    } else if (gesture.current) gesture.current.moved = true;
    // ノードの通常タップはネイティブの click に任せる。移動した時点でだけ捕捉する。
    if (!event.target.closest('[data-node-id]')) event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event) {
    const previous = pointers.current.get(event.pointerId);
    if (!previous) return;
    const next = { x: event.clientX, y: event.clientY };
    const other = [...pointers.current.entries()].find(([id]) => id !== event.pointerId)?.[1];
    pointers.current.set(event.pointerId, next);
    if (gesture.current && Math.hypot(next.x - gesture.current.x, next.y - gesture.current.y) > 5)
      gesture.current.moved = true;
    if (!gesture.current?.moved) return;
    if (!event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.setPointerCapture(event.pointerId);
    setCamera((current) => {
      if (!other)
        return constrainCamera(
          { ...current, x: current.x + next.x - previous.x, y: current.y + next.y - previous.y },
          size,
        );
      const rect = ref.current.getBoundingClientRect();
      const before = { x: (previous.x + other.x) / 2, y: (previous.y + other.y) / 2 };
      const after = { x: (next.x + other.x) / 2, y: (next.y + other.y) / 2 };
      const distance = Math.max(1, Math.hypot(previous.x - other.x, previous.y - other.y));
      const scale = (current.scale * Math.hypot(next.x - other.x, next.y - other.y)) / distance;
      const panned = { ...current, x: current.x + after.x - before.x, y: current.y + after.y - before.y };
      return constrainCamera(
        zoomCamera(panned, scale, { x: after.x - rect.left, y: after.y - rect.top }),
        size,
      );
    });
  }

  function endPointer(event) {
    if (!pointers.current.has(event.pointerId)) return;
    suppressClick.current = gesture.current?.moved || event.type !== 'pointerup';
    pointers.current.delete(event.pointerId);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    if (!pointers.current.size) gesture.current = null;
  }

  function onClickCapture(event) {
    if (suppressClick.current && event.detail > 0) {
      event.preventDefault();
      event.stopPropagation();
      suppressClick.current = false;
    }
  }

  function onKeyDown(event) {
    const directions = { ArrowLeft: [72, 0], ArrowRight: [-72, 0], ArrowUp: [0, 72], ArrowDown: [0, -72] };
    if (directions[event.key]) {
      event.preventDefault();
      const [dx, dy] = directions[event.key];
      setCamera((current) => constrainCamera({ ...current, x: current.x + dx, y: current.y + dy }, size));
    } else if (['+', '=', '-', '0'].includes(event.key)) {
      event.preventDefault();
      if (event.key === '0') fit();
      else zoom(event.key === '-' ? 1 / 1.2 : 1.2);
    }
  }

  return {
    camera: renderedCamera,
    size,
    restore: setCamera,
    zoom,
    fit,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endPointer,
      onPointerCancel: endPointer,
      onLostPointerCapture: (event) => {
        if (event.target === event.currentTarget) endPointer(event);
      },
      onClickCapture,
      onKeyDown,
    },
  };
}
