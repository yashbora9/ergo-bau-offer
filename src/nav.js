export function createNav({ total, onGo, getIndex, onSection, onEscape }) {
  let locked = false;
  let wheelAcc = 0;
  let touchY = null;

  function lock(ms = 950) {
    locked = true;
    window.setTimeout(() => {
      locked = false;
    }, ms);
  }

  function go(dir) {
    if (locked) return;
    const next = getIndex() + dir;
    if (next < 0 || next >= total) return;
    lock();
    onGo(next);
  }

  function onWheel(e) {
    e.preventDefault();
    wheelAcc += e.deltaY;
    if (Math.abs(wheelAcc) < 55) return;
    const dir = wheelAcc > 0 ? 1 : -1;
    wheelAcc = 0;
    go(dir);
  }

  function onKey(e) {
    if (e.key === 'Escape' && onEscape?.()) {
      e.preventDefault();
      return;
    }
    if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(e.key)) {
      e.preventDefault();
      go(1);
    } else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) {
      e.preventDefault();
      go(-1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      if (!locked) {
        lock();
        onGo(0);
      }
    } else if (e.key === 'End') {
      e.preventDefault();
      if (!locked) {
        lock();
        onGo(total - 1);
      }
    } else if (e.key === 'f' || e.key === 'F') {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
      else document.exitFullscreen?.();
    } else if (/^[1-9]$/.test(e.key) && onSection) {
      e.preventDefault();
      onSection(Number(e.key) - 1);
    }
  }

  function onTouchStart(e) {
    touchY = e.touches[0].clientY;
  }
  function onTouchEnd(e) {
    if (touchY == null) return;
    const dy = touchY - e.changedTouches[0].clientY;
    touchY = null;
    if (Math.abs(dy) < 40) return;
    go(dy > 0 ? 1 : -1);
  }

  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('keydown', onKey);
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchend', onTouchEnd, { passive: true });

  return { go, jump: (i) => { if (locked) return; lock(); onGo(i); } };
}
