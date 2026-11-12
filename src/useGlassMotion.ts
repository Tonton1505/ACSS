import { useEffect, type RefObject } from 'react';

const surfaceSelector = '.card, .limit-card, .insights, .sidebar, .account-popover';

/** One on-demand frame loop for the scene and the surface under the pointer. */
export default function useGlassMotion(ref: RefObject<HTMLDivElement | null>, enabled: boolean) {
  useEffect(() => {
    const shell = ref.current;
    if (!enabled || !shell) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const fine = matchMedia('(hover: hover) and (pointer: fine)');
    const contrast = matchMedia('(prefers-contrast: more)');
    let frame = 0;
    let active: HTMLElement | null = null;
    let pointerX = 0;
    let pointerY = 0;
    let targetX = 0;
    let targetY = 0;
    let sceneX = 0;
    let sceneY = 0;
    const allowed = () => !reduced.matches && !contrast.matches && !document.hidden;

    function clearSurface() {
      if (!active) return;
      active.removeAttribute('data-glass-active');
      active.style.removeProperty('--glass-rx');
      active.style.removeProperty('--glass-ry');
      active = null;
    }
    function render() {
      frame = 0;
      if (!allowed()) return;
      sceneX += (targetX - sceneX) * .13;
      sceneY += (targetY - sceneY) * .13;
      shell!.style.setProperty('--scene-x', `${sceneX.toFixed(2)}px`);
      shell!.style.setProperty('--scene-y', `${sceneY.toFixed(2)}px`);
      if (active?.isConnected) {
        const rect = active.getBoundingClientRect();
        const x = pointerX - rect.left;
        const y = pointerY - rect.top;
        active.style.setProperty('--glass-x', `${x.toFixed(1)}px`);
        active.style.setProperty('--glass-y', `${y.toFixed(1)}px`);
        active.style.setProperty('--glass-rx', `${((.5 - y / rect.height) * 2.2).toFixed(2)}deg`);
        active.style.setProperty('--glass-ry', `${((x / rect.width - .5) * 2.2).toFixed(2)}deg`);
      }
      if (Math.abs(targetX - sceneX) + Math.abs(targetY - sceneY) > .08) schedule();
    }
    function schedule() { if (!frame && allowed()) frame = requestAnimationFrame(render); }
    function move(event: PointerEvent) {
      if (!allowed() || !fine.matches || event.pointerType !== 'mouse') return;
      pointerX = event.clientX;
      pointerY = event.clientY;
      targetX = (pointerX / innerWidth - .5) * 72;
      targetY = (pointerY / innerHeight - .5) * 48 - Math.min(scrollY * .045, 28);
      const surface = event.target instanceof Element ? event.target.closest<HTMLElement>(surfaceSelector) : null;
      if (active !== surface) { clearSurface(); active = surface; active?.setAttribute('data-glass-active', ''); }
      schedule();
    }
    function leave() { clearSurface(); targetX = 0; targetY = -Math.min(scrollY * .045, 28); schedule(); }
    function scroll() { clearSurface(); targetY = -Math.min(scrollY * .045, 28); schedule(); }
    function reset() {
      cancelAnimationFrame(frame); frame = 0; clearSurface();
      targetX = targetY = sceneX = sceneY = 0;
      shell!.style.removeProperty('--scene-x');
      shell!.style.removeProperty('--scene-y');
    }
    shell.addEventListener('pointermove', move, { passive: true });
    shell.addEventListener('pointerleave', leave);
    window.addEventListener('scroll', scroll, { passive: true });
    window.addEventListener('blur', reset);
    document.addEventListener('visibilitychange', reset);
    reduced.addEventListener('change', reset);
    fine.addEventListener('change', reset);
    contrast.addEventListener('change', reset);
    return () => {
      reset();
      shell.removeEventListener('pointermove', move);
      shell.removeEventListener('pointerleave', leave);
      window.removeEventListener('scroll', scroll);
      window.removeEventListener('blur', reset);
      document.removeEventListener('visibilitychange', reset);
      reduced.removeEventListener('change', reset);
      fine.removeEventListener('change', reset);
      contrast.removeEventListener('change', reset);
    };
  }, [ref, enabled]);
}
