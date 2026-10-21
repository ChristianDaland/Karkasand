# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Karkasand is a browser tile-laying game (Carcassonne-like, Viking-age Norway). One shared big screen shows the board; each player controls their moves from a phone via Socket.IO.

## Language

Everything is written in Norwegian bokmål: identifiers, comments, UI text, docs and commit messages (short plain sentences such as «Rødt kryss der ingen brikker som er igjen, passer», no prefixes). Keep to that. Non-ASCII identifiers occur (`'Ø'`, `PYNT_HJØRNE`); `oe`/`aa` are used in some names instead (`naboer`, `naa`, `nokkel`).

## Commands

```bash
npm run dev                         # server on :3000 with --watch
npm test                            # node:test, runs test/**/*.test.js
node --test --test-name-pattern="runestein" 'test/**/*.test.js'   # run a single test by name
npm run skisser                     # regenerate kunst/skisser/ (needs google-chrome + ImageMagick)
npm run brikker -- A D V            # paint tile images via ComfyUI (COMFY_URL, ImageMagick)
```

No build step, bundler, linter or TypeScript. Plain ES modules (`"type": "module"`), Node ≥ 22. Deployed to Render via `render.yaml`; game state is in memory only.

## Architecture

- **`delt/`** is shared code imported by both the server and the browser (served at `/delt`, imported as `/delt/motor.js` in `public/js`). It must stay free of Node APIs and DOM.
  - `brikker.js`: tile definitions. Each tile has `kanter` [N, Ø, S, V] and `deler` (connected areas). Each edge is split into three ports (`N0`–`N2` etc., clockwise); roads/rivers use the middle port, a city edge uses all three. Expansion tiles have `utvidelse` (`elva`, `gjestgiveri`, `handel`) and ids `R1…`, `G1…`, `H1…`; base tiles are `A`–`X`. `UTVIDELSER` lists the expansions.
  - `motor.js`: the `Spill` class, the entire rules engine (placement validity, area flood-fill, scoring, final count, undo). Pure logic, deterministic given the `tilfeldig` RNG. Phases (`fase`): `legg` → `viking` → `trekk` → … → `slutt`. Coordinates: x east, y south; rotation = clockwise quarter turns; sides 0=N,1=Ø,2=S,3=V.
  - `rom.js`: `Rom`, one game room: lobby (players, colours, table side, host = first player), mode (`tv` / `bord` / `pad`), expansions, final-count timer, and translating player actions into `Spill` calls. In `bord` mode the phone's arrow directions are rotated by the player's table side (`PLASS_FORSKYVNING`).
  - `tegning.js`: generates SVG for each tile in two styles (`skisse` = flat colour templates for AI painting, `plassholder` = fallback illustration when no painted image exists).
- **`server/index.js`**: Express + Socket.IO (static files, QR codes, `/api/bilder` listing painted images, socket events that call into `Rom`).
- **Nettbrett (`/nettbrett`, mode `pad`)**: two players on one tablet, no phones and no server round-trips. It serves `skjerm.html`; `skjerm.js` swaps the Socket.IO connection for `LokalKanal` (`public/js/lokal.js`), which runs a `Rom` in the browser and mimics the socket API, so the screen rendering is shared. `public/js/nettbrett.js` adds the lobby, a control bar along each player's edge (player 1 south, player 2 north, rotated 180°) and board taps (`BrettVisning.vedTrykk` → `flyttTil` / `roter` / `velg`). Server-side event handling for phones has a counterpart in `LokalKanal.mobil()`; keep them in step.
- **State flow**: clients send `skjerm:*` / `mobil:*` / `spill:*` events; the server mutates `Rom`/`Spill` and broadcasts the full `rom.tilstand()` (which embeds `spill.tilstand()`) as `tilstand` to everyone in the room. Clients are pure renderers of that snapshot. When adding state that clients need, add it to the relevant `tilstand()`.
- **Undo**: `Spill.lagre()` snapshots the fields listed there with `structuredClone` before a tile is placed; `angre()` restores it. New per-turn state fields must be added to that list. Undo is allowed until the next player presses «Trekk brikke». `hendelser`/`hendelseNr` are deliberately excluded so the screen sees the undo as a new event.
- **`public/`**: `skjerm.html`/`skjerm.js` (big screen, `/skjerm/:kode`), `mobil.html`/`mobil.js` (phone, `/m/:kode`), `veiledning` (rules page, built from tile data), `galleri` (shows which tiles are painted and a random board to check edge matching). `brett.js` (`BrettVisning`) renders the board and is shared by screen and gallery; `felles.js` holds shared helpers (`brikkeUrl` picks a painted image or falls back to the placeholder SVG).
- **Art**: dropping `A.jpg` / `G3.jpg` / variants like `U_2.jpg` into `kunst/brikker/` makes the game use them automatically (filename regex in `server/index.js`). Image requirements and per-tile descriptions/prompts are in `docs/BRIKKER.md`; `verktoy/lag-brikker.js` reads its prompts from that file.

## Tests

`test/motor.test.js` tests the engine directly. It uses a seeded RNG (`frø`) and `leggDirekte()` to place specific tiles without drawing from the pile. Tile counts are asserted (72 base, plus 12/18/15 per expansion), so update that test when adding tiles.

When rules or tiles change, also check the README scoring/expansion tables and the `/veiledning` page text (`public/veiledning.html`, `public/js/brikkehjelp.js`).
