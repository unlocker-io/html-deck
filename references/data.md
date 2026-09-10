# Numbers — discipline

1. **A dated window.** "From 1 July to 7 September 2026", never "this summer". The comparison
   period has the same length and is named in the slide footer.
2. **A named source** per family of numbers, in the footer: "Production database, as of
   7 September"; "Issue tracker, label Customer feedback"; "Accounting, reported by Rachel".
3. **One counter = one definition**, written in the subtitle: "with at least one active lease",
   "verdict received from the provider". Two slides about the same object use the same
   definition; if the figures diverge, say so ("platform vs registry gap, to reconcile").
4. **Twelve months for trends.** A numbered tile carries its twelve-month sparkline when the
   series exists; months without a measure stay `null` (dashed gap, "not measured" on hover);
   never interpolate.
5. **Assumptions are written.** If a figure rests on a rule (manual validation = the manager's
   setting), the rule is in the footer.
6. **A number in the present tense rots.** Write "as of 7 September", not "today".
7. **Nothing invented.** An unmeasurable figure becomes a sentence; an inaccessible source
   becomes "not measured".

## Before you query

- Write the list of numbers the slides need, with the definition of each, before opening a
  database. It stops the deck from following the data instead of the story.
- Prefer the system of record (production database, tracker API, analytics API) over an export
  someone made by hand; when a hand-made export is the only source, name its author and date.
- Keep every query or API call in a scratch file next to the deck: a number you cannot recompute
  is a number you cannot defend.
- Watch for bulk imports and migrations: a month with an abnormal spike is often a backfill, not
  activity. Start the twelve-month window after it, and say so.

## Comparisons that read well

- Same-length previous period for the headline tiles (`+89 %`).
- Twelve months for the sparkline under each tile.
- A ratio (`÷15`, `×3.5`) when the change is too large for a percentage to be legible.
- Per-working-day rates for operational throughput ("5.8 opened · 5.4 validated per working day").
