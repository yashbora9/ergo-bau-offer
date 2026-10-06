import gsap from 'gsap';
import { slides, sections, LEGAL, CTA, PACKAGE_ITEMS } from './slides.js';
import { createWorld } from './scene.js';
import { createNav } from './nav.js';
import './ui.css';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const canvas = document.querySelector('#gl');
const world = createWorld(canvas);

const els = {
  kicker: document.querySelector('#kicker'),
  title: document.querySelector('#title'),
  line: document.querySelector('#line'),
  quote: document.querySelector('#quote'),
  quoteText: document.querySelector('#quoteText'),
  quoteCite: document.querySelector('#quoteCite'),
  facts: document.querySelector('#facts'),
  chips: document.querySelector('#chips'),
  builder: document.querySelector('#builder'),
  checklist: document.querySelector('#checklist'),
  legal: document.querySelector('#legal'),
  cta: document.querySelector('#cta'),
  hud: document.querySelector('#hud'),
  meta: document.querySelector('#sectionLabel'),
  count: document.querySelector('#count'),
  fill: document.querySelector('#fill'),
  ticks: document.querySelector('#ticks'),
  loader: document.querySelector('#loader'),
  hint: document.querySelector('#hint'),
  prev: document.querySelector('#prev'),
  next: document.querySelector('#next'),
};

/** Package selection state — tiers only, no premiums */
const packageState = new Map(PACKAGE_ITEMS.map((p) => [p.id, p.tier]));

sections.forEach((sec) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = sec.label;
  b.dataset.section = sec.id;
  b.addEventListener('click', () => {
    const idx = slides.findIndex((s) => s.section === sec.id);
    if (idx >= 0) nav.jump(idx);
  });
  els.ticks.appendChild(b);
});

let index = 0;
const lookProxy = { x: 0.4, y: 0.2, z: 0 };

function renderFacts(slide) {
  els.facts.replaceChildren();
  (slide.facts || []).forEach((f) => {
    const d = document.createElement('div');
    d.className = 'fact';
    const v = document.createElement('b');
    v.textContent = f.v;
    const k = document.createElement('span');
    k.textContent = f.k;
    d.append(v, k);
    els.facts.appendChild(d);
  });
}

function renderChips(slide) {
  const box = els.chips;
  if (!slide.chips?.length) {
    box.hidden = true;
    box.replaceChildren();
    return;
  }
  box.hidden = false;
  box.replaceChildren();
  slide.chips.forEach((c) => {
    const chip = document.createElement('div');
    chip.className = 'chip';
    const v = document.createElement('b');
    v.textContent = c.v;
    const k = document.createElement('span');
    k.textContent = c.k;
    chip.append(v, k);
    box.appendChild(chip);
  });
}

function renderBuilder(slide) {
  const box = els.builder;
  if (!slide.builder) {
    box.hidden = true;
    box.replaceChildren();
    els.hud.classList.remove('is-builder');
    return;
  }
  box.hidden = false;
  els.hud.classList.add('is-builder');
  box.replaceChildren();

  const summary = document.createElement('div');
  summary.className = 'builder-summary';
  summary.id = 'builderSummary';

  const tiers = [
    { id: 'must', label: 'Must' },
    { id: 'recommended', label: 'Empfohlen' },
    { id: 'optional', label: 'Optional' },
  ];

  tiers.forEach((tier) => {
    const col = document.createElement('div');
    col.className = `builder-col tier-${tier.id}`;
    const h = document.createElement('h3');
    h.textContent = tier.label;
    col.appendChild(h);
    PACKAGE_ITEMS.filter((p) => packageState.get(p.id) === tier.id).forEach((p) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'builder-item';
      btn.dataset.id = p.id;
      btn.innerHTML = `<strong>${p.name}</strong><span>${p.note}</span>`;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        cycleTier(p.id);
        renderBuilder(slide);
      });
      col.appendChild(btn);
    });
    box.appendChild(col);
  });

  updateSummary(summary);
  box.appendChild(summary);
}

function cycleTier(id) {
  const order = ['must', 'recommended', 'optional', 'must'];
  const cur = packageState.get(id) || 'optional';
  const next = order[(order.indexOf(cur) + 1) % (order.length - 1)];
  packageState.set(id, next);
}

function updateSummary(el) {
  const counts = { must: 0, recommended: 0, optional: 0 };
  packageState.forEach((t) => {
    counts[t] = (counts[t] || 0) + 1;
  });
  el.innerHTML = `<b>${counts.must}</b> Must · <b>${counts.recommended}</b> Empfohlen · <b>${counts.optional}</b> Optional — <em>keine Euro-Beträge; Angebot nach Risikoaufnahme</em>`;
}

function renderChecklist(slide) {
  const box = els.checklist;
  if (!slide.checklist?.length) {
    box.hidden = true;
    box.replaceChildren();
    return;
  }
  box.hidden = false;
  box.replaceChildren();
  const ul = document.createElement('ul');
  slide.checklist.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = item;
    ul.appendChild(li);
  });
  box.appendChild(ul);
}

function renderHud(slide, first = false) {
  const dur = reduced || first ? 0.01 : 0.55;
  const targets = [
    els.kicker,
    els.title,
    els.line,
    els.quote,
    els.facts,
    els.chips,
    els.builder,
    els.checklist,
    els.legal,
    els.cta,
  ];
  const tl = gsap.timeline();
  if (!first) {
    tl.to(targets, { opacity: 0, y: 12, duration: 0.28, ease: 'power2.in' });
  }
  tl.add(() => {
    els.kicker.textContent = slide.kicker;
    els.title.textContent = slide.title;
    els.line.textContent = slide.line || '';
    if (slide.quote) {
      els.quote.hidden = false;
      els.quoteText.textContent = slide.quote;
      els.quoteCite.textContent = slide.cite || '';
    } else {
      els.quote.hidden = true;
      els.quoteText.textContent = '';
      els.quoteCite.textContent = '';
    }
    renderFacts(slide);
    renderChips(slide);
    renderBuilder(slide);
    renderChecklist(slide);

    if (slide.legal) {
      els.legal.hidden = false;
      els.legal.textContent = LEGAL;
    } else {
      els.legal.hidden = true;
    }
    if (slide.cta) {
      els.cta.hidden = false;
      els.cta.textContent = CTA;
    } else {
      els.cta.hidden = true;
    }

    const sec = sections.find((s) => s.id === slide.section);
    els.meta.textContent = sec ? sec.label : '';
    els.count.textContent = `${String(index + 1).padStart(2, '0')}  /  ${String(slides.length).padStart(2, '0')}`;
    document.querySelectorAll('.ticks button').forEach((b) => {
      b.classList.toggle('active', b.dataset.section === slide.section);
    });
    els.fill.style.width = `${((index + 1) / slides.length) * 100}%`;
    els.prev.disabled = index === 0;
    els.next.disabled = index === slides.length - 1;
  });
  tl.fromTo(targets, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: dur, stagger: 0.04, ease: 'power3.out' });
  if (index > 0) els.hint.classList.add('gone');
}

function camFor(slide) {
  const mobile = window.innerWidth < 720;
  const c = slide.cam;
  if (!mobile) return { pos: { x: c.x, y: c.y, z: c.z }, look: { x: c.tx, y: c.ty, z: c.tz } };
  return {
    pos: { x: c.x * 0.12, y: c.y + 0.2, z: Math.min(c.z + 0.6, 11) },
    look: { x: Math.min(c.tx * 0.3, 1.0), y: c.ty + 0.25, z: c.tz },
  };
}

function moveCamera(slide, withTrail) {
  const dur = reduced ? 0.01 : 1.5;
  const from = world.camera.position.clone();
  const mapped = camFor(slide);
  const to = mapped.pos;
  if (withTrail && !reduced) world.burstTrail(from, to);
  const mid = {
    x: (from.x + to.x) / 2 + (to.z - from.z) * 0.07,
    y: (from.y + to.y) / 2 + 0.3,
    z: (from.z + to.z) / 2 - 0.12,
  };
  gsap.killTweensOf(world.camera.position);
  gsap.killTweensOf(lookProxy);
  if (reduced) {
    world.camera.position.set(to.x, to.y, to.z);
    lookProxy.x = mapped.look.x;
    lookProxy.y = mapped.look.y;
    lookProxy.z = mapped.look.z;
    world.look.set(lookProxy.x, lookProxy.y, lookProxy.z);
    return;
  }
  gsap.to(world.camera.position, {
    keyframes: [
      { x: mid.x, y: mid.y, z: mid.z, duration: dur * 0.42 },
      { x: to.x, y: to.y, z: to.z, duration: dur * 0.58 },
    ],
    ease: 'power2.inOut',
  });
  gsap.to(lookProxy, {
    x: mapped.look.x,
    y: mapped.look.y,
    z: mapped.look.z,
    duration: dur,
    ease: 'power3.inOut',
    onUpdate: () => world.look.set(lookProxy.x, lookProxy.y, lookProxy.z),
  });
}

function goTo(i, { first = false } = {}) {
  index = i;
  const slide = slides[i];
  renderHud(slide, first);
  moveCamera(slide, slide.trail && !first);
  world.setSlide(i, {
    reduced,
    section: slide.section,
    siteMode: slide.site || 'wide',
    hotspots: !!slide.hotspots,
  });
  document.getElementById('app')?.classList.remove('is-focus');
}

const nav = createNav({
  total: slides.length,
  getIndex: () => index,
  onGo: (i) => goTo(i),
  onSection: (n) => {
    const sec = sections[n];
    if (!sec) return;
    const idx = slides.findIndex((s) => s.section === sec.id);
    if (idx >= 0) nav.jump(idx);
  },
  onEscape: () => world.closeFocus(),
});

els.prev.addEventListener('click', () => nav.go(-1));
els.next.addEventListener('click', () => nav.go(1));

world.onHotspotPick((id, label) => {
  const map = {
    mensch: 'menschen',
    baustelle: 'bauwerk',
    maschinen: 'maschinen',
    betrieb: 'inhalt',
    recht: 'recht',
    liquiditaet: 'liquiditaet',
    zukunft: 'warum',
  };
  const sec = map[id];
  if (!sec) return;
  const idx = slides.findIndex((s) => s.section === sec);
  if (idx >= 0) {
    els.hint.textContent = `${label} →`;
    els.hint.classList.remove('gone');
    window.setTimeout(() => nav.jump(idx), 280);
  }
});

window.addEventListener('click', (e) => {
  if (e.target.closest('.nav-btn, .ticks, .chrome, .progress, .hint, .builder, .chips, .checklist')) return;
  world.onClick();
});

const cursor = document.querySelector('#cursor');
const cursorDot = cursor?.querySelector('i');
const cursorRing = cursor?.querySelector('b');
const finePointer = window.matchMedia('(pointer: fine)').matches && !reduced;
const ring = { x: 0, y: 0 };
const mouse = { x: 0, y: 0 };

if (finePointer && cursor && cursorDot && cursorRing) {
  document.documentElement.classList.add('cursor-on');
  cursor.hidden = false;
  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = -(e.clientY / window.innerHeight) * 2 + 1;
    world.setPointer(x, y);
    cursorDot.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
  });
  window.addEventListener('mouseleave', () => {
    cursor.style.opacity = '0';
  });
  window.addEventListener('mouseenter', () => {
    cursor.style.opacity = '1';
  });
} else {
  window.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = -(e.clientY / window.innerHeight) * 2 + 1;
    world.setPointer(x, y);
  });
}

function onResize() {
  world.resize(window.innerWidth, window.innerHeight);
  const slide = slides[index];
  if (!slide) return;
  const mapped = camFor(slide);
  gsap.killTweensOf(world.camera.position);
  gsap.killTweensOf(lookProxy);
  world.camera.position.set(mapped.pos.x, mapped.pos.y, mapped.pos.z);
  lookProxy.x = mapped.look.x;
  lookProxy.y = mapped.look.y;
  lookProxy.z = mapped.look.z;
  world.look.set(lookProxy.x, lookProxy.y, lookProxy.z);
}
window.addEventListener('resize', onResize);
onResize();

const clock = { t: 0 };
function loop() {
  clock.t += 0.016;
  if (finePointer && cursorRing) {
    ring.x += (mouse.x - ring.x) * 0.18;
    ring.y += (mouse.y - ring.y) * 0.18;
    cursorRing.style.transform = `translate(${ring.x}px, ${ring.y}px) translate(-50%, -50%)`;
  }
  world.tick(clock.t, reduced);
  requestAnimationFrame(loop);
}

async function start() {
  try {
    await document.fonts.ready;
  } catch {
    /* fallback fonts ok */
  }
  await world.buildSlides(slides);
  onResize();
  goTo(0, { first: true });
  loop();
  requestAnimationFrame(() => els.loader.classList.add('hide'));
}

start();
