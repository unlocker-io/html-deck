---
name: html-deck
description: >
  Use when someone needs a presentation: a workshop, a board meeting, a monthly review, a demo,
  an investor update, a team ritual. Triggers on "deck", "slides", "presentation", "workshop",
  "board meeting", "make me some slides", "a PowerPoint", "keynote". Produces ONE self-contained
  HTML deck (fonts and images embedded) on a fixed 1600×900 stage, with animated counters, bar
  and combo charts, twelve-month sparklines, funnels, per-slide timers and keyboard navigation,
  checked by screenshot before it ships. Theme is a token set: black-block default, overridable.
  Not for product screens or web pages.
---

# `/html-deck` — a keynote-grade deck as a single HTML file

This skill produces **one self-contained HTML file** you can project as is, and it carries
everything needed to do so: the slide engine, a component catalogue, a theme, a data discipline,
a build script with screenshot checks. Nothing is improvised along the way.

It was distilled from a 51-slide all-hands deck. What made that deck good, in this order:
**sourced and dated numbers**, **a structure that follows the meeting's agenda**, **one visual
identity applied without exception**.

## What you deliver

1. `<slug>.html` — the deck, self-contained (fonts and images embedded), **≤ 6 MB**.
2. Screenshots of every slide that carries numbers, looked at before publishing.
3. The file, hosted wherever the audience can open it (see `references/hosting.md`).

## Workflow

### 1. Frame it in five lines, before anything else

Write for yourself, then confirm with the person: **occasion** (workshop, board, monthly
review, demo), **audience** (team, investors, customers), **duration**, **agenda** (the parts,
their timing, who speaks), **measured period** (exact bounds and the comparison period).
A deck without a comparison period shows numbers without relief; a deck without an agenda has
no structure. If a point is missing, ask now, not halfway through.

### 2. Collect the numbers, sources first

Read `references/data.md`. Absolute rule: **a number has a named source, a dated window and a
comparison** (previous period or twelve months). Whatever cannot be measured is said in words
("no clear process"), never with an invented figure. Inaccessible sources are asked for from
their owner, and the deck says "not measured" until they arrive.

### 3. Write the structure, one line per slide

The agenda gives the **parts**; each part opens with a **divider** and, when someone speaks
for a set time, carries a **timer**. A typical team-meeting skeleton (adapt it):

```
Cover · Agenda (one row per part, with the faces of who presents)
01 Divider · Headline numbers · Detail by theme (1 slide = 1 idea + its numbers)
02 Divider · One slide per team or speaker, timed
03 Divider · Vision, decisions: 1 slide = 1 point, white on black
04 Divider · Demo, questions (timed)
05 Workshops · Closing
```

One slide = one idea, a short-sentence title, at most six numbers. The title states the
conclusion ("A summer that doubled"), the subtitle says what it is about, the footer names the
source and the window. Details in `references/components.md` §Structure.

### 4. Build

Read `references/theme.md` and `references/components.md`, then copy
`templates/exemple-slides.html`, replace its slides, and assemble with `scripts/build.py`:

```bash
python3 <skill>/scripts/build.py --slides my-slides.html --out my-deck.html --title "Title"
```

`my-slides.html` holds only `<section class="slide …">` elements: it is a fragment, not a deck.
Only the file produced by the script is projectable. `templates/exemple-deck.html` is the
built example (ten slides) to open to see the expected result; `templates/exemple-slides.html`
is its source. The script embeds the engine, puts `assets/logo.svg` where `__LOGO__` stands,
and refuses a file above 6 MB or an image that is not embedded.

Non-negotiable build rules:

- **Fixed 1600 × 900 stage**, scaled by the engine: every size in `px`, never `vh`/`vw`, never
  a media query. The rendering is identical on every projector.
- **An existing component before any new style.** If the catalogue lacks what you need, add a
  CSS rule to the deck's `<style>`, within the theme, and say so at the end.
- **Photos**: portraits cropped to 112 × 112 JPEG, screenshots as JPEG at most 1600 px wide,
  all as `data:` URIs. The reference deck weighs 2.3 MB with 51 slides, 16 portraits and 15
  screenshots: that is the order of magnitude to hold.
- **Motion**: counters (`data-count`), bars, lines and sparklines animate on arrival, and
  everything honours `prefers-reduced-motion`. No decorative animation on top.

- **Progress**: on every slide change the engine emits `window.parent.postMessage({type:'deck:slide', index, total}, '*')` (`index` is 1-based). A host embedding the deck in an iframe can listen to it for reading statistics; a deck opened on its own emits nothing useful and never breaks.

### 5. Check by screenshot, slide by slide

No deck ships without looking at the slides that carry numbers. The script captures a list of
slides at 1600 × 900 with reduced motion, to see the resting state:

```bash
python3 <skill>/scripts/build.py --slides my-slides.html --out my-deck.html --shoot 3,4,5,9
```

What you look for: a number overflowing its tile, a label crossing a curve, a decorative corner
overlapping a caption, an empty tile, truncated text. Fix, re-shoot, then publish. Every defect
found on the reference deck was found in a screenshot, never by reading the HTML.

### 6. Publish

A review link first (comments slide by slide), then the final hosting. Procedure and
constraints in `references/hosting.md`.

## What separates a good deck from a generic one

- **The title carries the conclusion**, not the topic. "Faster, less friction", not "Support
  statistics".
- **Every change has its tag**: `+89 %` in green, `−17 %` in red when the drop matters, `÷15`
  when the ratio speaks better, `flat` for a plain reminder.
- **Faces**: avatar stacks say who presents and who is concerned. Real photos of the team,
  never generated avatars.
- **A word from the team**: a short quote, attributed.
- **What is missing is said**: "not measured", "to reconcile", "to decide in workshop 06".
  A named gap beats a plugged number.
- **Sobriety**: no emoji, no superlative, no gradient, no shadow. Black and white carry the
  structure; colours sign actors and states.

## Red flags — stop

- You type a number you cannot trace to a query, an export or a document.
- You add a slide "for completeness" with no idea behind it.
- You write `vh`, `vw`, `@media`, `box-shadow` or `linear-gradient` in the deck.
- You publish without screenshots of the numbered slides.
- You exceed 6 MB: shrink the images, do not drop the fonts.
- You invent a component while `references/components.md` has an equivalent.
