# ERGO · Bau Partner — Interaktives Angebots-Deck

Dark-premium interactive offer deck for a mid-size German construction firm (~200 employees).  
Craft inspired by the Abadin ERGO deck (Vite + Three.js + GSAP camera fly-throughs); content and theme are new.

**Live:** https://yashbora9.github.io/ergo-bau-offer/

## Stack

- Vite 6
- Three.js 0.170
- GSAP 3.13
- `base: './'` for GitHub Pages

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (default `http://localhost:5173`).

```bash
npm run build    # → dist/
npm run preview  # preview production build
```

## Navigation

| Input | Action |
|-------|--------|
| Scroll / swipe | Next / previous slide |
| ← → ↑ ↓ / Space / PageUp·Down | Navigate |
| `1`–`9` | Jump to section tick |
| `F` | Fullscreen |
| `Esc` | Close focused card |
| Click hotspot (Risiko map) | Jump to related product |
| Click package chips | Cycle Must → Empfohlen → Optional |

## Pricing rule (hybrid)

- **No invented euro premiums** for core covers (Haftpflicht, Bauleistung, Maschinen, Inhalt, Rechtsschutz, Gruppen-Unfall, Flotte).
- Public figures only (Stand Okt. 2026):
  - **bKV Budget** (DKV): €300=€15.68 · €600=€25.97 · €900=€33.84 · €1.200=€40.21 / employee / month
  - **Kaution Pauschal:** Kompakt **0.75 %** / Plus **1.1 %** of surety line p.a. (line up to €1m)
  - **§ 100 EStG:** employer €240–960/yr → 30 % tax refund (max €288); higher caps from 2027
- CTA everywhere: **individuelles Angebot after Risikoaufnahme**. Binding euros only in a separate quote PDF.

## Careful wording

- **Bauleistungsversicherung:** public ERGO page targets project owners; a contractor annual policy (ABU) may need underwriting confirmation — not claimed as definitely available.
- **Rechtsschutz:** core Bau-Werkvertrag / VOB disputes are often excluded — noted on the slide.
- **SOKA-BAU:** West 3.2 % / East 1.7 % (commercial from Jul 2026); salaried €67 / €42.50 — shown as context for bAV top-up.
- Client placeholder: **Ihr Bauunternehmen** / **Bau Partner**.

## Deploy (GitHub Pages)

1. Create repo `yashbora9/ergo-bau-offer`
2. Push `main`
3. Settings → Pages → Deploy from `gh-pages` branch **or** GitHub Actions / `dist` from `main`
4. Ensure `public/.nojekyll` is present (already included)

```bash
git init
git add .
git commit -m "v1: ERGO Bau Partner interactive offer deck"
# then create remote and push via GitHub MCP / gh
```

## Legal footer (product slides)

> Diese Information gibt einen Überblick. Maßgeblich sind die Versicherungsbedingungen und das individuelle Angebot. Stand: Okt. 2026.
