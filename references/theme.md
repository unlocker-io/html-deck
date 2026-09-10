# Theme — tokens and rules

The engine (`assets/engine.css`) reads its colours from variables on `:root`. The default set is
a "black blocks" identity: black chrome, white cards, one blue accent, three actor colours.
Override the variables in the deck's `<style>` (the `__EXTRA_CSS__` slot of the template) to
apply your own brand; do not edit the engine.

## Colours (default values)

| Role | Value | Variable | Use in a deck |
|---|---|---|---|
| Chrome black | `#0B0B0C` | `--black` | Dark slide backgrounds, `.tile.black`, primary action |
| Canvas | `#F6F6F4` | `--canvas` | Light slide backgrounds |
| Card | `#FFFFFF` | `--card` | Tiles, chart cards |
| Accent blue | `#173CC1` | `--accent` | Bars, lines, active nav, one word in a title. **Sparingly** |
| Light blue | `#7996FF` | `--accent-400` | The final dot of a title on black, second actor |
| Pink | `#FCD1FF` | `--pink` | Cover corner, `.tile.pinkl`, first actor |
| Green | `#3FCC8C` | `--green` | Increase (`.tag.up`), third actor, count bars |
| Yellow | `#FFBF49` | `--yellow` | Fourth actor, warning |
| Red | `#FF5454` | `--red` | Decrease that matters (`.tag.down`), failures |
| Ink 2 / 3 | `#5B5B61` / `#9A9AA0` | `--ink-2`, `--ink-3` | Subtitles, eyebrows, footers |
| On black | `#C9C9CF` / `#7C7C82` | `--ink-inv-2`, `--ink-inv-3` | Secondary text on black |

Rules:

- **Blue is an accent**, never a slide background nor a button. One `.tile.blue` per deck at
  most, for a single summary block.
- **No shadow, no gradient, no decorative transparency.** Hierarchy comes from black, white and
  radii.
- Semantic colours (green, red, yellow) only encode states: up, down, alert. They do not decorate.
- Actor colours are a closed palette: give each recurring actor (customer, partner, provider,
  platform…) one colour and keep it across every chart.

## Typography

- **Outfit** (Google Fonts, 300 / 500 / 700) by default, loaded by the template. Fallback
  `-apple-system, system-ui, sans-serif`. To use a licensed brand face, embed it as base64
  `@font-face` in the deck's `<style>` and set `--font`.
- **JetBrains Mono** for the HUD (slide counter, timer) and screen paths (`.mono`).
- Base 22 px on the 1600 × 900 stage. Slide title `h2` 40 px / 700 / `-.025em`. Divider title
  `.big` 118 px. Tile number `.v` 2.6 em / 700 / `-.035em`, tabular figures.
- **Eyebrow**: 11 px, 700, uppercase, `letter-spacing .08em`, ink 3. It is the label above
  every number and every slide.
- Sentence case everywhere. Uppercase comes from `text-transform`, never from the text.

## Geometry

- Radius **16 px** on tiles, cards, button-like tags (`--r-card`). 8 px on small tags, 50 %
  on avatars only.
- 1 px `#ECECEC` border on light tiles; black tiles have none.
- Slide margins: 38 px top, 80 px sides, 50 px bottom. Grids with 11 / 16 px gaps.
- The cover's coloured corner is anchored to the slide root (`.corner`); it must never overlap
  a caption: check in a screenshot.

## Tone

- Titles as sentences, conclusion first. Factual subtitles. No emoji, no exclamation mark, no
  superlative.
- Numbers in the audience's locale: the engine formats `data-count` with a thin-space thousands
  separator and a comma decimal (French style). Adapt `fmtInt`/`fmt` in `engine.js` for another
  locale.
- People are named by first name on team slides; never a customer's name outside an explicitly
  wanted ranking.
