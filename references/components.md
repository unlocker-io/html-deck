# Component catalogue

Everything below is carried by `assets/engine.css` and `assets/engine.js`. Snippets are copied
as is. The `rv` class marks blocks that fade up on arrival (increasing delay by rank).

## Structure

### The slide

```html
<section class="slide light" data-section="02 · Support" data-timer="300">
  <div class="slide-head">
    <div><div class="eyebrow">Team · 5 minutes</div><h2>Faster, less friction</h2></div>
    <div class="side"><div class="stack-av head"><img src="data:…" alt=""><img src="data:…" alt=""></div>What customers told us, and what we did about it.</div>
  </div>
  <div class="slide-body"> … </div>
  <div class="slide-foot"><span class="foot-note">Source, window, assumptions.</span><span>Right-hand note</span></div>
</section>
```

- `light` (canvas background, white tiles) or `dark` (black). `data-section` feeds the HUD.
- `data-timer="300"` starts a countdown (seconds) on arrival; T pauses, R resets. It turns
  orange under 60 s, red past zero.
- `.side` carries the intent sentence and, top right, the faces concerned (`.stack-av.head`).

### Animated cover

The cover shows a pulsing "rent collected" node, five dashed flows to the actors, € tokens
travelling along them, and a scenario rotation every 7.6 s with animated amounts. The full
markup is the first section of `templates/exemple-slides.html`. Adapt the eyebrow, the `.big`
title (one word, a coloured dot), the line under it and the footer. The scenarios (amounts,
labels) live in `engine.js`, array `scenes`: change values, not structure. Drop the whole
`.scene-wrap` block for a plain cover.

### Agenda

```html
<div class="agenda">
  <div class="row rv"><span class="n">01</span><div><div class="t">The numbers</div><div class="s">What the period says, in six figures then by theme.</div></div><span class="d">15 min</span></div>
  <div class="row rv"><span class="n">02</span><div><div class="t">Decisions</div><div class="s">One slide per point.</div></div><div class="stack-av"><img src="data:…" alt=""><img src="data:…" alt=""></div><span class="d">30 min</span></div>
</div>
```

The number exists only because the agenda is a sequence. Faces say who presents.

### Part divider

```html
<section class="slide dark divider" data-section="01 · The numbers">
  <div class="slide-head"><div class="eyebrow">Part 01</div></div>
  <div class="slide-body">
    <div class="idx rv">01</div>
    <h2 class="big rv">The numbers</h2>
    <div class="rule"></div>
    <p class="sub rv">1 July to 7 September 2026. Every change compares to the previous 69 days.</p>
  </div>
  <div class="slide-foot"><span>Sources: production database, tracker, chat</span><span></span></div>
</section>
```

Keys 1 to 9 jump to the dividers (and to `qa` slides), in deck order.

### Question / pause / transition (`qa`)

```html
<section class="slide dark qa" data-section="04 · Questions" data-timer="900">
  <div class="slide-head"><div class="eyebrow">Q&amp;A</div></div>
  <div class="slide-body">
    <h2 class="big rv">Your questions<span style="color:var(--accent-400)">.</span></h2>
    <p class="hint rv">Product, technology, calendar: everything is open.</p>
  </div>
  <div class="slide-foot"><span>15 minutes</span><span></span></div>
</section>
```

Same template for a white-on-black slide that states one idea alone ("And tomorrow?").

### Closing

```html
<section class="slide dark closing" data-section="Thanks">
  <div class="slide-head"><div class="top">__LOGO__</div></div>
  <div class="slide-body"><h2 class="big rv">Thank you<span style="color:var(--accent-400)">.</span></h2></div>
  <div class="slide-foot"><span>September 2026</span><span></span></div>
</section>
```

## Grids and layouts

- `.grid.g2` / `.g3` / `.g4`: tile grids with 2, 3, 4 columns, 11 / 16 px gaps.
- `.split`: two columns `1.05fr 1fr`; `style="grid-template-columns:.9fr 1.1fr"` to give room
  to a chart.
- A stacked column: `<div class="rv" style="display:flex;flex-direction:column;gap:11px">`.
- `.slide-body` centres its content vertically; no fixed heights on blocks.

## Number tiles

```html
<div class="tile black hero rv">
  <span class="eyebrow">Rent and bookings collected</span>
  <span class="v"><span data-count="3.10" data-dec="2"></span><small>M€</small></span>
  <span class="row"><span class="tag up">+89 %</span><span class="sub">in 69 days, against 1.64 M€ before</span></span>
  <div class="spark" data-spark='[164000,181000,…,237000]' data-fmt="keur" data-name="Collected"></div>
</div>
```

- Variants: `.tile` (white), `.tile.black`, `.tile.pinkl` (pink, black ink), `.tile.blue` (one
  summary block per deck), `.hero` (larger figure).
- `data-count` animates the number; `data-dec="1"` for one decimal; `data-fmt="eur"` appends
  ` €`; `<small>` for the unit (`%`, `M€`, `min`).
- Tags: `.tag.up` (green), `.tag.down` (red), `.tag.flat` (neutral), `.tag.info` (blue).
- `.sub`: the definition or the comparison, one sentence.
- Text instead of a figure: `<span class="v" style="font-size:1.6em">No clear process</span>`.

### Twelve-month sparkline

```html
<div class="spark" data-spark='[36,38,42,49,59,66,78,89,97,108,115,116]' data-fmt="int" data-name="Managers"></div>
<div class="spark" data-spark='[null,null,14,15,20,18,30,24,null,9,null,null]' data-kind="bars" data-name="New customers"></div>
<div class="spark inl" data-spark='[…]' data-fmt="eur" data-name="Platform"></div>
```

- Twelve values, `null` = month not measured (dashed between neighbours, "not measured" on
  hover; a dash in bar mode). The curve stretches from the first to the last measured month.
- Default month labels are French `oct.` → `sept. (7 j)`; pass `data-labels='["Oct","…"]'`
  for your own (or edit `SPM` in `engine.js`).
- `data-fmt`: `int`, `eur`, `keur`, `pct`, `h`, `min`, `dur` (seconds → "8 min 14 s").
- First and last values are printed above the curve; `.inl` for a 110 × 22 px mini-curve in a
  `.part` row.
- Colour: blue on a light tile, green on a black tile, black on a pink tile.

## Number lists (`kpis`)

```html
<div class="kpis rv">
  <div class="kpi"><span class="v"><span data-count="137"></span></span><span class="l">chat conversations opened</span><span class="tag up">+9 %</span></div>
</div>
```

`.kpis.compact` for a tight version inside a tile.

## Charts

### Grouped bars

```html
<div class="chart-card rv">
  <div class="ttl">Twelve months, conversations and tickets</div>
  <div class="legend"><span><i style="background:#173CC1"></i>Conversations</span><span><i style="background:#3FCC8C"></i>Tickets</span></div>
  <div class="chart" data-chart='{"labels":["Oct","Nov","Dec"],"series":[{"name":"Conversations","color":"#173CC1","values":[null,32,87]},{"name":"Tickets","color":"#3FCC8C","values":[null,null,40]}]}'></div>
  <div class="cap">Chat since February, tracker since April: no measure before.</div>
</div>
```

`null` = no bar. Value printed above each bar, detail on hover.

### Amount + count combo

```html
<div class="chart combo" data-combo='{"labels":["Oct","…"],"amount":[164,181,…],"count":[284,293,…],"labelA":"Amount, k€","labelB":"Incoming transactions","unitA":"k€","unitB":"transactions"}'></div>
```

Line + area for the amount on top, bars for the count below, same axis.

### Funnel / horizontal bars

```html
<div class="funnel">
  <div class="fstep"><span class="l">Sent to the provider</span><div class="b k" style="width:100%"></div><span class="v">278</span></div>
  <div class="fstep"><span class="l">Enrolled</span><div class="b g" style="width:95.7%"></div><span class="v">266</span></div>
  <div class="fstep"><span class="l">Failures</span><div class="b r" style="width:11.2%"></div><span class="v">31</span></div>
</div>
```

Bar colours: blue by default, `.k` black, `.g` green, `.r` red. `.funnel.srcs` inside a tile for
a compact version ("What revenue is made of", "Who answers" with `.fstep.who` and an avatar in
the label). Widths are % of the maximum, computed by hand.

### Stacked manual / automatic bars

```html
<div class="stack">
  <div class="stack-row"><span class="l">Transactions</span><div class="bar"><div class="seg k" style="width:73%"><b>73 %</b> manual · 4 045</div><div class="seg g" style="width:27%"><b>27 %</b> auto · 1 501</div></div></div>
</div>
```

### Shares of a total

```html
<div class="parts">
  <div class="part"><span class="dot" style="background:#3FCC8C"></span><span class="l">Owners (net)</span><span class="v num">2 233 593 €</span><div class="spark inl" data-spark='[…]' data-fmt="eur"></div><span class="tag up">+103 %</span></div>
</div>
```

## People

- `.stack-av`: avatar stack (112 × 112 images as `data:`), in an agenda row or a tile;
  `.stack-av.head` top right of `.side`.
- `.chipp`: photo chip + first name in a list (roles, roster).
- `.fstep.who`: avatar + first name in a funnel ("Who answers").
- Portraits: square crop, face centred, JPEG quality 80, 112 px. Never generated avatars.

## Screenshots and demo

```html
<div class="phil-dash">
  <div class="shot main rv"><img src="data:image/jpeg;base64,…" alt="Dashboard"></div>
  <div class="phil-side rv"><div class="cs light"><b>Title</b><span>One sentence.</span></div><div class="cs light">…</div></div>
</div>
```

- `.shot.main`: rounded screenshot, `.narrow` for a narrow screen, `.scrollframe` +
  `.screen-scroll` to scroll a long page top to bottom in 30 s.
- One screenshot per slide. Several screenshots = several slides, same template.
- Screenshots come from the real product, never a recomposed mockup.

## Blue summary block

```html
<div class="tile blue rv" style="align-items:center;justify-content:center;text-align:center">
  <span class="eyebrow">Executive board</span>
  <span class="v"><span data-count="7"></span><small>members</small></span>
  <span class="sub">including 2 external</span>
</div>
```

## A word from the team

```html
<div class="tile"><span class="eyebrow">A word from the team</span><span class="v" style="font-size:1.35em;line-height:1.25">"Less maintenance, more product: we are flat out."</span><span class="sub">Tech</span></div>
```

## HUD and navigation (provided by the template)

Progress bar, `05 / 51` counter, current section, timer; left/right click zones; touch swipe;
`?` help; `F` fullscreen; `#N` in the URL opens a slide directly.
