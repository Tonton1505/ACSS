import { useLayoutEffect, useRef, type PointerEvent } from 'react';
import type { LucideIcon } from 'lucide-react';

type Item = { id: string; label: string; icon: LucideIcon };

/** A single glass bubble stretches between destinations, then settles in place. */
export default function LiquidNav({ items, active, onNavigate }: { items: Item[]; active: string; onNavigate: (id: string) => void }) {
  const nav = useRef<HTMLElement>(null);
  const lens = useRef<HTMLSpanElement>(null);
  const animation = useRef<Animation | null>(null);
  const initialized = useRef(false);
  const align = useRef<(animate: boolean, target?: HTMLButtonElement) => void>(() => {});
  const drag = useRef<{ pointer: number; startY: number; offset: number; started: boolean; button: HTMLButtonElement } | null>(null);
  const suppressClick = useRef(false);

  function clearDrag() {
    nav.current?.removeAttribute('data-dragging');
    nav.current?.querySelector('[data-drop-target]')?.removeAttribute('data-drop-target');
    drag.current = null;
  }
  function startDrag(event: PointerEvent<HTMLElement>) {
    if (event.button !== 0) return;
    suppressClick.current = false;
    const button = (event.target as Element).closest<HTMLButtonElement>('button[data-nav-id]');
    if (!button) return;
    drag.current = { pointer: event.pointerId, startY: event.clientY, offset: event.clientY - button.getBoundingClientRect().top, started: false, button };
  }
  function moveDrag(event: PointerEvent<HTMLElement>) {
    const state = drag.current;
    const container = nav.current;
    const bubble = lens.current;
    if (!state || !container || !bubble || state.pointer !== event.pointerId) return;
    if (!state.started) {
      if (Math.abs(event.clientY - state.startY) < 6) return;
      state.started = true;
      animation.current?.cancel();
      container.setPointerCapture(event.pointerId);
      container.dataset.dragging = '';
      bubble.removeAttribute('data-moving');
    }
    event.preventDefault();
    const bounds = container.getBoundingClientRect();
    const buttons = Array.from(container.querySelectorAll<HTMLButtonElement>('button[data-nav-id]'));
    const first = buttons[0].getBoundingClientRect();
    const last = buttons[buttons.length - 1].getBoundingClientRect();
    const source = state.button.getBoundingClientRect();
    const top = Math.max(first.top, Math.min(last.bottom - source.height, event.clientY - state.offset));
    bubble.style.width = `${source.width}px`;
    bubble.style.height = `${source.height}px`;
    bubble.style.transform = `translate(${source.left - bounds.left - container.clientLeft}px, ${top - bounds.top - container.clientTop}px)`;
    const center = top + source.height / 2;
    const nearest = buttons.reduce((best, button) => {
      const distance = (item: HTMLButtonElement) => { const rect = item.getBoundingClientRect(); return Math.abs(rect.top + rect.height / 2 - center); };
      return distance(button) < distance(best) ? button : best;
    });
    container.querySelector('[data-drop-target]')?.removeAttribute('data-drop-target');
    nearest.dataset.dropTarget = '';
  }
  function endDrag(event: PointerEvent<HTMLElement>, cancelled = false) {
    const state = drag.current;
    if (!state || state.pointer !== event.pointerId) return;
    const target = nav.current?.querySelector<HTMLButtonElement>('[data-drop-target]');
    const started = state.started;
    clearDrag();
    if (nav.current?.hasPointerCapture(event.pointerId)) nav.current.releasePointerCapture(event.pointerId);
    if (!started) return;
    suppressClick.current = true;
    if (!cancelled && target?.dataset.navId) {
      align.current(true, target);
      if (target.dataset.navId !== active) onNavigate(target.dataset.navId);
    } else align.current(true);
  }

  useLayoutEffect(() => {
    const container = nav.current!;
    const indicator = lens.current!;
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    function position(animate: boolean, destination?: HTMLButtonElement) {
      if (drag.current?.started) return;
      const target = destination || container.querySelector<HTMLButtonElement>('[aria-current="page"]');
      if (!target) return;
      const parent = container.getBoundingClientRect();
      const before = indicator.getBoundingClientRect();
      const to = target.getBoundingClientRect();
      const x = to.left - parent.left - container.clientLeft;
      const y = to.top - parent.top - container.clientTop;
      // Read the visible bubble before cancelling so rapid clicks never teleport it.
      const fromX = before.left - parent.left - container.clientLeft;
      const fromY = before.top - parent.top - container.clientTop;
      animation.current?.cancel();
      indicator.removeAttribute('data-moving');
      indicator.style.width = `${to.width}px`;
      indicator.style.height = `${to.height}px`;
      indicator.style.transform = `translate(${x}px, ${y}px)`;
      if (animate && initialized.current) {
        const startCX = fromX + before.width / 2;
        const startCY = fromY + before.height / 2;
        const endCX = x + to.width / 2;
        const endCY = y + to.height / 2;
        const dx = endCX - startCX;
        const dy = endCY - startCY;
        const distance = Math.hypot(dx, dy);
        if (distance < .5) return;
        const vertical = Math.abs(dy) >= Math.abs(dx);
        const stretch = Math.min(.85, .42 + distance / 450);
        const frames: Keyframe[] = [];
        for (let i = 0; i <= 60; i++) {
          const t = i / 60;
          const p = media.matches ? t : i === 60 ? 1 : 1 - Math.exp(-7.8 * t) * (Math.cos(9.2 * t) + .32 * Math.sin(9.2 * t));
          // Elongate along travel, compress across it, then give a short jelly rebound.
          const jelly = media.matches || i === 60 ? 0 : 2.5 * Math.sin(2 * Math.PI * t) * Math.exp(-3.4 * t);
          const width = Math.max(1, (before.width + (to.width - before.width) * p) * (1 + jelly * stretch * (vertical ? -.12 : 1)));
          const height = Math.max(1, (before.height + (to.height - before.height) * p) * (1 + jelly * stretch * (vertical ? 1 : -.12)));
          frames.push({
            transform: `translate(${startCX + dx * p - width / 2}px, ${startCY + dy * p - height / 2}px)`,
            width: `${width}px`, height: `${height}px`,
            borderRadius: `${20 + Math.max(0, jelly) * 12}px`, offset: t,
          });
        }
        indicator.dataset.moving = vertical ? (dy > 0 ? 'down' : 'up') : (dx > 0 ? 'right' : 'left');
        const current = indicator.animate(frames, { duration: media.matches ? 160 : 760, easing: 'linear' });
        animation.current = current;
        const finish = () => {
          if (animation.current !== current) return;
          animation.current = null;
          indicator.removeAttribute('data-moving');
          position(false);
        };
        current.onfinish = finish;
        current.oncancel = finish;
      }
      initialized.current = true;
    }
    align.current = position;
    position(true);
    let size = { width: container.clientWidth, height: container.clientHeight };
    const resize = new ResizeObserver(() => {
      if (size.width === container.clientWidth && size.height === container.clientHeight) return;
      size = { width: container.clientWidth, height: container.clientHeight };
      // A page can change the scrollbar gutter. Keep an in-flight slide visible.
      if (!animation.current || animation.current.playState !== 'running') position(false);
    });
    resize.observe(container);
    const reduce = () => { if (media.matches) position(false); };
    media.addEventListener('change', reduce);
    return () => { resize.disconnect(); media.removeEventListener('change', reduce); };
  }, [active, items.map(item => item.id).join(',')]);

  useLayoutEffect(() => () => { animation.current?.cancel(); }, []);

  return <nav className="liquid-nav" ref={nav} aria-label="Điều hướng chính" onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={event => endDrag(event)} onPointerCancel={event => endDrag(event, true)} onLostPointerCapture={event => { if (event.target === event.currentTarget && drag.current?.started && !event.currentTarget.hasPointerCapture(event.pointerId)) endDrag(event, true); }} onPointerLeave={() => { if (!drag.current?.started) clearDrag(); }} onDragStart={event => event.preventDefault()} onClickCapture={event => { if (suppressClick.current && event.detail > 0) { suppressClick.current = false; event.preventDefault(); event.stopPropagation(); } }}>
    <span className="liquid-lens" ref={lens} aria-hidden="true"/>
    {items.map(({ id, label, icon: Icon }) => <button key={id} data-nav-id={id} onClick={event => { align.current(true, event.currentTarget); onNavigate(id); }} aria-current={active === id ? 'page' : undefined}><Icon size={18} aria-hidden="true"/><span>{label}</span></button>)}
  </nav>;
}
