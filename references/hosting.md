# Review, then hosting

## 1. Review

Share the built file through whatever gives slide-by-slide comments: a Claude artifact, a
shared drive, a review tool. Keep one stable link per deck and republish to it; every
republished version keeps the reviewers' place (`#N` in the URL opens a given slide).

## 2. Hosting

The deck is one HTML file with no runtime dependency except Google Fonts, so any static host
works: an object-storage bucket, a static site, an internal wiki that accepts HTML attachments,
or a password-protected presentation service (the original team hosts its decks in its own
platform console, with one revocable password per viewer).

Constraints that hold on every host:

- **≤ 6 MB.** Portraits 112 × 112 JPEG (~4 KB each), screenshots as JPEG ≤ 200 KB.
- No relative local resource (`src="img/…"`): everything as `data:` URI, except Google Fonts.
- The deck runs inside an iframe if the host wraps it: it needs no `localStorage`, makes no
  network call, and keyboard navigation only works once the iframe has focus (the wrapper
  should give it on load). `F` requests fullscreen on the iframe's document, which the wrapper
  must allow (`allow="fullscreen"`).
- A deck opened straight from disk (`file://`) works too: the engine never fetches anything.

## After the meeting

A deck stays valid as long as its numbers are dated in the footers. A new version is a new
file; retire the previous link if it must not circulate anymore.
