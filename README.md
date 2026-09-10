# HTML Deck

An [Agent Skill](https://code.claude.com/docs/en/skills) that builds **keynote-grade
presentations as a single self-contained HTML file**: a fixed 1600 × 900 stage scaled to any
screen, animated counters, bar and combo charts, twelve-month sparklines, funnels, per-slide
timers, keyboard and touch navigation, a review-by-screenshot step, and a hosting checklist.

It was distilled from a 51-slide all-hands deck. What made that deck good is what the skill
enforces: sourced and dated numbers, a structure that follows the meeting's agenda, one visual
identity applied without exception.

## What it does

- **Workflow** — frame the meeting in five lines, collect numbers with a named source and a
  dated window, write the structure one line per slide, build, check by screenshot, publish.
- **Engine** — `assets/engine.css` + `assets/engine.js`: slides, HUD, timers (`data-timer`),
  counters (`data-count`), grouped bars (`data-chart`), amount + count combo (`data-combo`),
  sparklines with `null` gaps (`data-spark`), funnels, avatar stacks, screenshot frames.
- **Theme** — a token set on `:root`, black-block default, overridable in one CSS block.
  Typography defaults to Outfit + JetBrains Mono from Google Fonts; a licensed brand face can be
  embedded as base64.
- **Catalogue** — `references/components.md` holds the markup of every component, to copy.
- **Build script** — `scripts/build.py` assembles the fragment into the deck, refuses files
  above 6 MB or non-embedded images, and captures chosen slides with headless Chromium.
- **Example** — `templates/exemple-deck.html` is a built ten-slide deck; `templates/exemple-slides.html`
  is its source fragment.

## Install

With the [`skills`](https://www.npmjs.com/package/skills) CLI:

```bash
npx -y skills add -g https://github.com/unlocker-io/html-deck
```

Or by hand — the skill is the repository root, so a clone can be symlinked directly:

```bash
git clone https://github.com/unlocker-io/html-deck.git ~/src/html-deck
ln -s ~/src/html-deck ~/.claude/skills/html-deck   # Claude Code
ln -s ~/src/html-deck ~/.agents/skills/html-deck   # Codex
```

Symlinking means `git pull` is your update channel. `npx skills add` copies instead, so re-run
`npx -y skills update -g` to refresh.

## Layout

| Path | Role |
|---|---|
| `SKILL.md` | The workflow, the build rules, the red flags |
| `references/theme.md` | Colour tokens, typography, geometry, tone |
| `references/components.md` | Every component with its markup |
| `references/data.md` | The discipline for numbers |
| `references/hosting.md` | Review link, hosting constraints, iframe behaviour |
| `assets/` | Engine CSS and JS, placeholder logo |
| `templates/` | Page template, example fragment and built example |
| `scripts/build.py` | Assemble, guard size and embedding, screenshot |
| `agents/openai.yaml` | Display metadata for OpenAI-compatible surfaces |
| `evals/evals.json` | Dry evals: framing, fixed stage, screenshot gate, series gaps |

## Contributing

This repository is a **public mirror**. The canonical source lives in a private upstream
repository, and mirrored files (everything except `README.md` and `LICENSE`) are overwritten on
each sync — so a change committed here directly would be lost.

Issues and pull requests are still welcome: maintainers port accepted changes upstream, and the
sync tool refuses to run when the mirror carries an unported change, so nothing is silently
dropped.

## License

[Creative Commons Attribution-ShareAlike 4.0 International](LICENSE) (CC BY-SA 4.0).

Use it, modify it, redistribute it, including at work and inside commercial activity — on two
conditions: credit the source, and release any adaptation under this same license.
