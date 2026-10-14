# Crimson Keep — Expansion Roadmap

> 114 epics from 14 planning areas, reviewed by 3 critics (feasibility, player experience, completeness) and sequenced into 9 milestones. Effort: S ≤3 dev-days · M ≤2 weeks · L ≤1 month · XL >1 month (one developer). Impact 1–5.

## Documents

- [Epic index](roadmap/epic-index.md): all epics with area, effort, impact and milestone
- [Night Watch (v0.2) — Guardrails, frozen contracts and instant crunch](roadmap/01-night-watch.md)
- [Keep Kernel (v0.3) — Architecture, determinism, replays and an honest economy](roadmap/02-keep-kernel.md)
- [Grimoire (v0.4) — Data-driven combat, generation, readability and sound](roadmap/03-grimoire.md)
- [Clock Tower (v0.5) — Vertical slice: one new biome end to end](roadmap/04-clock-tower.md)
- [Castle Atlas (v0.6) — Epoch Two: rebuilt structure, branching acts, two more biomes](roadmap/05-castle-atlas.md)
- [Night Terrors (v0.7) — Bestiary, elites, bosses reborn, statuses and the living score](roadmap/06-night-terrors.md)
- [Hunter's Arsenal (v0.8) — Kits, new hunters, Card System v2, the unlock tree, heat and 30 events](roadmap/07-hunter-s-arsenal.md)
- [Dawn (v1.0) — Learnable, accessible, translated, robust and launch-ready](roadmap/08-dawn.md)
- [Second Night (v1.1–v1.3) — Post-launch seasons: familiars, the inverted keep, modes and rituals](roadmap/09-second-night.md)
- [Appendix A — Current-state gaps by area](roadmap/appendix-a-current-gaps.md)
- [Appendix B — Deferred and cut epics in full](roadmap/appendix-b-deferred-epics.md)

## Vision

Crimson Keep grows from a 25-minute, three-floor proof into a branching gothic castle crawl that players come back to for years. A Full Moon run forks through four acts and six biomes. The Castle Gate opens onto the ticking Clock Tower or the bone-choked Catacombs, then the Forbidden Library or the drowned Reservoir, and every route ends at Count Vlador's throne. About 30 monsters each ask the player a different question. Six bosses play out as multi-phase showpieces with their own organ themes. Six hunters fight with whips, holy sub-weapons fuelled by candle drops and 80 cards of buildcraft, with a heat ladder for veterans. All of it is still drawn in thick ink and synthesized in code. One offline PWA codebase runs at 60 FPS on a mid-range phone and 120 FPS at 4K, and any run replays exactly from its seed. After 1.0, seasonal updates add pocket familiars (the yellow puffball and the fire imp), the inverted keep and a true ending, the Tower of Trials and daily rituals. Every release is built on contracts that were frozen once, a single seed epoch and a measured budget for performance, bundle size and content throughput.

## Design pillars

- **Ink, Organ and Code.** Every sprite, rig, glyph and note is generated in code: thick ink outlines, flat saturated fills with one cel highlight, chibi proportions, gothic halls, synthesized organ and harpsichord. No asset files, ever. New content is assembled from a shared parts kit and ink bible (ART-9) rather than drawn from scratch.
- **Readable in 150 ms, Fair Every Time.** Shape says the verb, colour says the owner, and nothing strobes. Every hit the player takes can be seen, heard and dodged, in any palette mode and on any screen size. Telegraphs and enemy bullets always render above spectacle, and each preset has a clutter budget.
- **One Castle, Every Screen.** Designed phone-first: at most 6 gameplay actions and at most 4 on-screen thumb buttons. Targets are 60 FPS on a mid-range phone and 120 FPS at 4K, as an offline PWA with live switching between touch, keyboard and mouse, and gamepad. The simulation never reads the device: caps, view rect and timing are ruleset constants, and weak hardware gets presentation-only LOD.
- **Same Seed, Same Night.** Any run can be reproduced from its seed plus an input tape on any browser engine. There is one append-only stream registry, one deliberate seed epoch, and a build fingerprint on every castle code, daily and replay. Profile-dependent inputs are snapshotted into the RunHeader.
- **Every Night Is Different, Every Night Counts.** Branching acts, an encounter director, deep cards and heat make each run new. An honest economy, an unlock tree and a codex make each run matter. Systems unlock one layer at a time within a written decision budget for each run.
- **Gothic Setup, Cartoon Punchline.** Castlevania gravitas (candelabras, moonbeams, a vampire Count) delivered with mobile-cartoon charm: skewed 'EPIC BOSS FIGHT!' cards, bone piles that clatter, chibi heroes with big eyes. Names and mechanics stay a safe IP distance from their inspirations.

## Roadmap at a glance

| Milestone | Version | Theme | Est. weeks | Epics |
|---|---|---|---|---|
| Night Watch | v0.2 | Guardrails, frozen contracts and instant crunch | 9 | 8 |
| Keep Kernel | v0.3 | Architecture, determinism, replays and an honest economy | 12 | 10 |
| Grimoire | v0.4 | Data-driven combat, generation, readability and sound | 13 | 12 |
| Clock Tower | v0.5 | Vertical slice: one new biome end to end | 14 | 10 |
| Castle Atlas | v0.6 | Epoch Two: rebuilt structure, branching acts, two more biomes | 14 | 13 |
| Night Terrors | v0.7 | Bestiary, elites, bosses reborn, statuses and the living score | 15 | 8 |
| Hunter's Arsenal | v0.8 | Kits, new hunters, Card System v2, the unlock tree, heat and 30 events | 13 | 11 |
| Dawn | v1.0 | Learnable, accessible, translated, robust and launch-ready | 12 | 10 |
| Second Night | v1.1–v1.3 | Post-launch seasons: familiars, the inverted keep, modes and rituals | 26 | 14 |

Total: about 128 weeks for a team of 2–3.

## First 30 days

**Week 1**

- Stand up the TEC-1 PR tier: typecheck, vitest, build, a gzip bundle gate with a per-domain KB table, a raster/audio file ban, and GitHub Pages deploy from main.
- Publish the DIR-1 system-ownership table from the merge verdicts (one owner epic per store, registry, save section and stream), with CODEOWNERS and an ADR template.
- Ship the live bug fixes as standalone PRs with regression tests: curse persistence through continue-run (BLD-7's fix) and STO-1's two event bugs.
- Land the scrap→gems rename as one mechanical PR (MET-2's first step) before other branches diverge.
- Record manual phone baselines: tick and FPS for a 140-enemy Bone Catacombs room on a low-end Android, a mid-range Android and an iPhone. These are the first rows of the budget ledger.
- UX-9 workshop: inventory every proposed action (A2, ultimate, sub-weapon, swap, charge, parry, interact, photo) and draft a set of at most 6 actions with touch, gamepad and keyboard/mouse layouts.

**Week 2**

- Add the nightly CI tier: a 4x CPU-throttled perf gate and a cross-engine Playwright smoke test (Chromium, Firefox, WebKit).
- GOV-1 contracts sprint, part 1: Intent v2 from the UX-9 draft, FxSink v2 (numbers instead of strings, colour token ids, hitStop/impact/death), the WorldEvent catalog and the time-scale arbiter API.
- GOV-1 part 2: the append-only stream registry in core/rng.ts with reserved secrets, boss-pool, story and cosmetic streams; Uint16 content ids; HazardStore at 128 slots; Uint16 projectile flags; the RunHeader shape.
- DIR-1 reconciliation pass: one pet roster, one mentor, one true-ending macguffin, one heat ladder, canonical biome and boss names, and renames for the 'Grimoire', 'Curtain Call' and 'Relic' collisions. Create src/canon.ts with ipRisk ratings.
- REL-1 groundwork: a build-time flag module, an immutable archived build per deploy, and a service-worker update prompt that never swaps builds mid-run.
- Land UX-6's i18n core early (t(), string-extraction lint, pseudo-locale) so every new string from here on goes through catalogs.

**Week 3**

- Prototype the UX-9 layouts on a 5.5-inch phone and an 8-inch tablet with 3 testers, freeze the action set and sign the ADR.
- Finish and review all GOV-1 contracts and freeze them through ADRs; any later change needs a new ADR.
- TEC-4 save envelope: version, checksum, A/B writes and a migration registry with fixture tests, plus room-state deltas so a used Sanctuary fire stays out.
- Start ART-1 on the FxSink v2 draft: presentation-only hit-stop through the arbiter, impact squash, the Skeleton bone-pile death and the Blood Bat spiral-and-pop death.
- BAL-5: implement the input buffer and dash grace as tick-defined sim rules with replay-safe tests.
- BIZ-1 early items: add a LICENSE, third-party notices (PixiJS, ZzFX) and the no-IAP/no-ads/no-gacha business-model ADR.

**Week 4**

- Migration week: codemod the codebase onto Intent v2, FxSink v2 (which removes the per-hit damage-number strings), Uint16 ids and the widened pools, gated by sim-hash parity tests.
- Rasterize the code-drawn icon to PNG and maskable icons at build time (TEC-8's quick win) so iOS home screens look right.
- ART-1: Axe Armor burst with a rolling helmet, plus Ghoul, Gargoyle, Hex Witch and Bone Archer deaths; Hit-stop and Reduce Flashing toggles.
- Start TEC-3 groundwork: split sim and cosmetic RNG and add the lint banning Math.random and FX calls on sim streams. This prerequisite gates TEC-2's parity checks in v0.3.
- Draft BAL-8 playtest protocol v1: session script, a named owner for guardian consent, and a bug template that attaches a replay.
- Cut v0.2-rc on the beta channel, re-run the 3-phone baseline and compare it against week 1 in the budget ledger.

## Milestones

### Night Watch (v0.2) — Guardrails, frozen contracts and instant crunch


**Goal:** Make the keep safe to change before ~100 epics touch it. That means CI on every push, a two-to-three-week contracts sprint that freezes every shared interface, one canon and ownership table, a frozen thumb-zone action set, build flags with archived builds, and crash-safe versioned saves. In parallel, players get hit-stop, cartoon deaths and forgiving controls.

**Demo moment:** You crit an Axe Armor. The frame freezes for a heartbeat, the armor bursts apart and its helmet rolls across the red carpet, and the dash you pressed a moment too early fires exactly when it should.

**Why now:** Every later epic edits world.ts (1,055 lines), app.ts (871) or enemyAi.ts (512). Without CI, frozen contracts, flags and a canon, the backlog's ~25% duplication turns into parallel rewrites and rename churn. UX-9 has to finish before Intent v2 freezes. TEC-4 lands now because about 8 epics want save v2 and the curse-persistence bug is live. ART-1 and BAL-5 need only FxSink v2 and the time arbiter, so a second developer ships visible feel improvements while the contracts sprint runs.

**Estimate:** ~9 weeks

**Exit criteria:**

- [ ] The PR CI tier finishes in under 10 minutes: typecheck, vitest, build, gzipped bundle < 1 MB with per-domain KB budgets, a ban on raster and audio files, content validation, and a CPU-throttled (4x) tick gate of ≤ 4 ms for 140 enemies. Merges to main auto-deploy to GitHub Pages.
- [ ] The GOV-1 contracts are merged and codemodded across the codebase: Intent v2 (≤ 6 actions, per UX-9), FxSink v2 (numbers not strings, colour token ids, hitStop/impact/death), a WorldEvent catalog, an append-only stream registry in core/rng.ts, Uint16 content ids, HazardStore at 128 slots, Uint16 projectile flags, a RunHeader, and a single time-scale arbiter in core/loop.ts. Each one has an ADR and a CODEOWNERS entry.
- [ ] src/canon.ts exists and CI rejects any player-facing name not registered in it. The reconciliation ADR settles one pet roster, one mentor, one true-ending macguffin, one heat ladder, canonical biome and boss names, and the 'Grimoire', 'Curtain Call' and 'Relic' collisions. Every name has an ipRisk rating, and a system-ownership table names one owner epic per store, registry, save section and stream.
- [ ] UX-9 layouts are validated by 3+ testers on a 5.5-inch phone and an 8-inch tablet: ≤ 4 on-screen touch buttons, and every action reachable on touch, gamepad and keyboard/mouse.
- [ ] Saves use a versioned, checksummed envelope with A/B writes and a migration registry with fixture tests. Killing the tab mid-write loses at most the current room. The used Sanctuary fire and active curses survive continue-run.
- [ ] Build-time flags let unfinished features merge dark. Every deploy is archived immutably. The service worker never swaps builds mid-run, and a downgrade guard refuses saves written by a newer build.
- [ ] Hit-stop and family-specific cartoon deaths exist for all 7 enemy types and are presentation-only: sim hashes are identical with hit-stop on and off. The input buffer and dash grace are tick-defined sim rules with replay tests.

| Epic | Area | Effort | Impact |
|---|---|---|---|
| TEC-1 · 1. Night Watch CI: quality gates, golden screenshots and GitHub Pages deploy | Engineering, performance, platform & tooling | M | 5 |
| GAP-1 · GOV-1 Keystone Contracts: Intent v2, FxSink v2, WorldEvent catalog, stream and content-ID registries, RunHeader | Gaps found in review | L | 5 |
| GAP-3 · UX-9 Thumb Zone Charter: one frozen action set and per-device control layouts | Gaps found in review | M | 5 |
| GAP-5 · DIR-1 Crimson Canon: creative pillars, a machine-checked canon registry and one progression map | Gaps found in review | M | 4 |
| GAP-7 · REL-1 Release Train: feature flags, version skew, archived builds, QA gates, beta channels and live-ops cadence | Gaps found in review | L | 4 |
| TEC-4 · 4. Soul Ledger: save schema v2, migrations and continue-run integrity | Engineering, performance, platform & tooling | M | 4 |
| ART-1 · 1. CRUNCH: Hit-stop, impact frames and cartoon death animations | Art, animation, VFX & lighting | L | 5 |
| BAL-5 · Velvet Controls: feel tuning | Game design, balance & difficulty | M | 4 |

**Full epic details:** [docs/roadmap/01-night-watch.md](roadmap/01-night-watch.md)

### Keep Kernel (v0.3) — Architecture, determinism, replays and an honest economy


**Goal:** Split App and World into a kernel (typed event bus, command layer, system scheduler, content registries), make every run replayable from seed plus tape on any engine, record what actually happened (RunTally and RunRecords), and fix the economy so spending gems never costs meta-progress. Settings v2 and a local-first trust layer ship at the same time as the first untrusted imports.

**Demo moment:** You die to Count Vlador's blood spiral, open the replay on the same phone, scrub back four seconds and see exactly which bullet clipped you. Then the Soul Ledger pays you for the elites you slew, not the gems you hoarded.

**Why now:** About 40 epics edit world.ts and app.ts, so the kernel split comes before any of them. TEC-3's state hashes and stream split go first within the milestone because they are the parity gate that guards TEC-2. Tapes then build on TEC-2's command layer. MET-1 and the economy fix need the bus. TRU-1 lands with the first untrusted imports (Soul Sigil, tapes), not at launch, and its opt-in funnel lets the vertical slice measure drop-off.

**Estimate:** ~12 weeks

**Exit criteria:**

- [ ] The app.ts and world.ts split lands in slices behind sim-hash parity: 500 recorded seeds produce identical per-second world hashes before and after every slice.
- [ ] The sim/cosmetic RNG split is complete, and a lint rule bans Math.random and FX calls that consume sim streams. enemyCap and the view rect are ruleset constants, and no sim code reads the device or preset.
- [ ] A run recorded in desktop Chromium replays to identical state hashes in Firefox, WebKit and on an Android phone. A 30-minute run tape is under 200 KB, and crash reports are stored locally with their tape.
- [ ] A perf overlay (?debug=perf) shows per-system timings. Allocations per sim tick are zero (alloc-counting test), and heap stays within ±2 MB over a 10-minute bot soak.
- [ ] Souls are paid from achievements on a Soul Ledger end screen, not from hoarded gems. The boss purse is guaranteed and the shop has a reroll. Economy model tests keep gems and souls per floor inside their tuned bands.
- [ ] The schema-driven settings v2 panel has categories, presets and live previews. The Hunter's Oath first-run card takes 30 seconds or less.
- [ ] Production runs under a strict CSP. Save sigils and tapes all pass through one size-limited, fuzzed decoder, and no innerHTML sinks remain. Analytics are opt-in with no endpoint configured, and Export Diagnostics works offline.
- [ ] Playtest protocol v1 has been run with 5+ external players, and every 'that felt unfair' report carries a replay.

| Epic | Area | Effort | Impact |
|---|---|---|---|
| TEC-2 · 2. Keep Kernel: event bus, command layer, system scheduler and the app.ts split | Engineering, performance, platform & tooling | L | 5 |
| TEC-3 · 3. Chronicle of Blood: determinism hardening, replays and local crash reports | Engineering, performance, platform & tooling | L | 5 |
| SOC-1 · Chronicle Core: deterministic command tape and ranked integrity | Social, multiplayer & community | L | 5 |
| TEC-6 · 6. Bone-Dry Heap: perf observatory, debug overlays and zero-GC sweep | Engineering, performance, platform & tooling | M | 4 |
| MET-1 · 1. Reliquary Ledger: versioned saves, run tally and run records (foundation) | Meta-progression, economy & hub | M | 4 |
| MET-2 · 2. Blood, Gems & Souls: economy rebalance | Meta-progression, economy & hub | M | 5 |
| BAL-6 · Gem and soul economy 2.0 | Game design, balance & difficulty | M | 4 |
| UX-7 · The Hunter's Oath — settings v2, accessibility presets & first-run quality UX | UX, onboarding, accessibility & localization | M | 4 |
| BAL-8 · The Confessional: playtest protocol, replays and live tuning | Game design, balance & difficulty | M | 3 |
| GAP-10 · TRU-1 Trust & Telemetry: threat model, strict CSP, safe untrusted input and privacy-first opt-in analytics | Gaps found in review | L | 4 |

**Full epic details:** [docs/roadmap/02-keep-kernel.md](roadmap/02-keep-kernel.md)

### Grimoire (v0.4) — Data-driven combat, generation, readability and sound


**Goal:** Replace the hard-wired enemy switch, damage path, floor themes and SFX table with registries that every content epic will write into. Make each threat readable and fair in any palette on any device, give every sound a mixer, and ship full remapping before new actions arrive.

**Demo moment:** In deuteranopia mode a Bone Archer winds up just off-screen. An edge chevron and a bow creak warn you, and the charge lane reads by its shape, not its colour. Then a brand-new monster asks a question the original seven never did.

**Why now:** ENM-1, BLD-1, BIO-1 and GEN-1 are the four substrates that every enemy, card, biome and trap epic writes into, so content built before them would be throwaway. ART-2 (absorbing UX-2) ships with ENM-1 so there is exactly one telegraph grammar, and BAL-1 consumes ENM-1's AttackIds. The mixer and contract tests must exist before ~95 sounds and adaptive stems arrive. UX-3 builds on M1's Intent v2 and must precede BLD-3's sub-weapon action. ART-8 is the dev shell ART-3 needs for authoring rigs.

**Estimate:** ~13 weeks

**Exit criteria:**

- [ ] Brains plus WINDUP/ACTIVE/RECOVER move sets replace enemyAi.ts's switch. The original 7 enemies and 3 bosses are ported with golden-hash parity, and 3 proof monsters each take at most 80 lines of data plus one draw function.
- [ ] The typed damage pipeline (damage types, resistances, proc coefficients, effect registry) is live, its attribution source table feeds the death screen, and hitEnemy no longer allocates a string per hit.
- [ ] The biome registry reproduces byte-identical rooms for 10,000 epoch-1 seeds. The epoch-2 pipeline (per-pass streams, setTile, stable entity ids, RoomDelta) is merged dark behind a flag.
- [ ] Every AttackId has a telegraph at or above the minimum and an audio tell. No enemy fires from outside a fixed sim-side logical rect centred on the player, wave spawns respect a minimum distance from the player, and a full-HP one-shot floor (Death's Door) applies.
- [ ] The 5-shape telegraph grammar and semantic palette ship. Deuteranopia, protanopia, tritanopia and high-contrast modes are token swaps with contrast tests in CI. The FlashGovernor caps flashing at ≤ 3 Hz and no text renders below 12 px.
- [ ] The mixer has buses, priority voice stealing, ducking and snapshots. About 45 SfxDefs with seeded variants exist, a 140-enemy swarm stays inside the voice budget, and DSP golden-hash and sim-to-sound contract tests run in Node.
- [ ] Full remapping works on keyboard and gamepad, with layout-aware key labels and code-drawn Xbox, PlayStation, Nintendo and Steam Deck glyphs. ?artlab=1 works and its chunk is excluded from the build precache.

| Epic | Area | Effort | Impact |
|---|---|---|---|
| ENM-1 · Grimoire of Behaviours: data-driven enemy AI toolkit | Enemies, elites & bosses | L | 5 |
| BLD-1 · E1 · The Hit Ledger: Damage Pipeline 2.0 | Combat systems & buildcraft | L | 5 |
| BIO-1 · 1. Biome Engine: data-driven biomes and depth-based difficulty curves | Biomes, run structure & world | M | 5 |
| GEN-1 · Castle Foundry: layered tile model, per-pass seeds and saved room state | Procedural generation technology | L | 5 |
| BAL-1 · The Hunter's Code: fairness rules | Game design, balance & difficulty | M | 5 |
| ART-2 · 2. READ THE ROOM: Telegraph grammar, semantic palette and colorblind-safe modes | Art, animation, VFX & lighting | L | 5 |
| UX-2 · Moonlight Clarity — vision, photosensitivity & motion safety | UX, onboarding, accessibility & localization | L | 5 |
| ART-8 · 8. ART LAB: In-game shape viewer, animation scrubber and automated art QA | Art, animation, VFX & lighting | M | 3 |
| AUD-1 · Crypt Mixer: priority voices, buses, ducking and a sample-accurate sound queue | Music & sound | M | 4 |
| AUD-2 · Audio Proving Grounds: deterministic DSP, a fake AudioContext and golden-hash tests | Music & sound | M | 3 |
| AUD-3 · Bestiary of Sounds: about 95 voiced sounds for every monster, weapon, card and menu | Music & sound | L | 5 |
| UX-3 · Rebind the Keep — remapping, glyph sets & controller robustness | UX, onboarding, accessibility & localization | L | 4 |

**Full epic details:** [docs/roadmap/03-grimoire.md](roadmap/03-grimoire.md)

### Clock Tower (v0.5) — Vertical slice: one new biome end to end


**Goal:** Build the Clock Tower end to end: terrain and about 6 telegraphed hazards, about 5 new monsters from the parts kit, a multi-phase boss on the BossScript core, candles that drop hearts for holy sub-weapons, rigged heroes and boss, and an organ and music-box score. The slice proves the pipeline and measures the real cost of each content unit.

**Demo moment:** You whip a candelabra in the Clock Tower, catch the heart and hurl a holy axe over a swinging pendulum blade while the gears grind, and the music box swells into the clock boss's organ theme.

**Why now:** The slice comes once the substrates exist, so nothing is built twice. It uses only the slices it needs of ENM-5 (BossScript core), AUD-7 (MusicDirector) and AUD-8 (one boss theme), and those epics complete in v0.7. Art is the long pole for every later content epic, so ART-3 rigs (absorbing CLS-8's pose swaps) and the ART-9 parts kit come before the next ~25 creatures. BLD-3 needs GEN-4's candles and UX-3's remappable action. BIO-3 absorbs GEN-5's traps. Measuring unit cost here is the only honest way to size v0.6–v1.0. Clock Tower art and music pre-production starts during v0.4.

**Estimate:** ~14 weeks

**Exit criteria:**

- [ ] The Clock Tower is playable as an opt-in route under an epoch-2 seed label, on the beta channel and opt-in on main. Existing seeds, seed history and dailies are untouched.
- [ ] Unit costs are measured and published (dev-days per monster, hazard, boss, room archetype, minute of music and SFX), and M5–M8 scope and weeks are re-baselined from them.
- [ ] A new monster goes from scaffold to merge in ≤ 2 dev-days using the parts kit. CI enforces the definition of done: canon name, t() strings, sfx block, provisional budget fields, codex stub and golden snapshot.
- [ ] The sub-weapon slot holds 8 IP-renamed sub-weapons with ammo from breakable candles, pre-rolled on the loot stream. It fits the UX-9 action set, and Item Crash becomes the CLS-1 ultimate rather than a new button.
- [ ] Water, pits and conveyor terrain plus about 6 hazard kinds ship with the safe-route solver proven by fuzz tests. Hazards damage monsters too, and a chandelier can be dropped on enemies.
- [ ] Heroes and the Clock Tower boss run on procedural rigs while crowds use pose swaps. The Clock Tower holds 60 FPS on the reference mid-range phone at Medium, with tick ≤ 4 ms in the CPU-throttled gate.
- [ ] Organ, harpsichord and music-box voices ship with phone fallbacks, and the Clock Tower theme is written in the score format and played by the Conductor.

| Epic | Area | Effort | Impact |
|---|---|---|---|
| GAP-6 · PRD-1 Clock Tower Vertical Slice and the 1.0 Roadmap | Gaps found in review | XL | 5 |
| GAP-4 · ART-9 Monster Foundry: Ink Bible, parts kit, variants and one-command content intake | Gaps found in review | L | 5 |
| ART-3 · 3. MARIONETTE: Procedural rig animation, gaits and facial expressions | Art, animation, VFX & lighting | XL | 5 |
| CLS-8 · Hero Personality & Feel | Classes, characters & companions | M | 3 |
| BLD-3 · E3 · Hearts Are Ammo: Castlevania Sub-Weapons | Combat systems & buildcraft | L | 5 |
| GEN-4 · Candles and Clutter: decoration grammar and Castlevania-style breakables | Procedural generation technology | L | 5 |
| BIO-3 · 3. Terrain layer and environmental hazards | Biomes, run structure & world | L | 5 |
| GEN-5 · Death Traps of the Keep: spikes, pendulums, chandeliers and floor-specific traps | Procedural generation technology | L | 4 |
| AUD-5 · Grimoire: a tiny tracker-style score format and Conductor | Music & sound | M | 3 |
| AUD-6 · Gothic Instrument Foundry: organ, harpsichord, choir, bells and generated reverb | Music & sound | L | 4 |

**Full epic details:** [docs/roadmap/04-clock-tower.md](roadmap/04-clock-tower.md)

### Castle Atlas (v0.6) — Epoch Two: rebuilt structure, branching acts, two more biomes


**Goal:** Ship every seed-reshaping change in one migrated release: a device-independent ruleset, the set-piece grammar and boss arenas, four-sided doors, branching acts through the Castle Atlas, a paced difficulty curve, and the Forbidden Library and Underground Reservoir biomes. Nightly bots and power budgets balance it all, and castle codes make every night shareable.

**Demo moment:** You beat the Castle Gate boss and the Castle Atlas unfolds: one portal ticks toward the Clock Tower, the other drips toward the drowned Reservoir. A friend pastes your castle code and walks the same night.

**Why now:** Bundling every reshaper (GEN-1's per-pass streams from v0.4, GEN-3 with BIO-4's prefabs, GEN-8's doors, BIO-2's acts, BAL-4's path guarantees) into one epoch means seed history and dailies break once, not seven times. BIO-2 only matters with two biomes per tier, so BIO-5 (absorbing ENM-8's rosters) ships with it. GEN-2's quality gates validate the new archetypes. TEC-7 (absorbing BAL-2) and BAL-3 must run before the big monster and card waves so new content is priced when it comes in. SOC-2 owns the code format that BIO-2's route codes reuse.

**Estimate:** ~14 weeks

**Exit criteria:**

- [ ] Epoch Two is the default, with one generation-epoch bump. Seed labels and castle codes carry the epoch and build fingerprint, the epoch-1 generator lazy-loads for one release, and old seed-history entries still replay.
- [ ] Streams for secrets, boss pools, captives and lore are reserved in the registry, so post-launch content never forces a third epoch. Seeded boss-pool draws ship with single-entry pools.
- [ ] A nightly 200k-seed fuzz run shows zero connectivity, safe-route or spawn-fairness failures, and p99 room generation is ≤ 8 ms on the reference phone.
- [ ] A Full Moon run takes four acts (Gate → {Catacombs | Clock Tower} → {Library | Reservoir} → Throne) in ~30–35 minutes. The Castle Atlas pause tab works, and castle codes share as a link, share sheet or QR. Only four-sided doors ship from GEN-8; daises, chasms and Long March halls are not in scope.
- [ ] Kiter, Brawler and Greedy bots play 1,000 seeded runs nightly across 3 classes. Boss share of floor enemy HP is ≤ 40%, level-ups per floor sit within band, and CI rejects any card, item or enemy without a budget value.
- [ ] The same daily seed produces identical tapes and hashes on desktop Chromium, iOS Safari and Android Chrome.

| Epic | Area | Effort | Impact |
|---|---|---|---|
| GAP-2 · GOV-2 Epoch Two: one coordinated seed rebaseline and a device-independent ruleset | Gaps found in review | L | 5 |
| GEN-2 · Castle Surveyor: generation quality metrics, fuzzing and fairness guarantees | Procedural generation technology | M | 5 |
| GEN-3 · Gothic Blueprints: a set-piece grammar and room archetypes | Procedural generation technology | L | 5 |
| BIO-4 · 4. Set-piece rooms and prefab stamps | Biomes, run structure & world | L | 4 |
| GEN-8 · Grand Halls: four-sided doors, multi-screen rooms and depth illusions | Procedural generation technology | XL | 4 |
| BIO-2 · 2. Acts and branching biome routes (Castle Atlas) | Biomes, run structure & world | L | 5 |
| BAL-4 · The Night Clock: pacing and difficulty curve | Game design, balance & difficulty | L | 5 |
| BIO-5 · 5. Biome wave A: Clock Tower, Forbidden Library, Underground Reservoir (plus an uplift for the original three) | Biomes, run structure & world | XL | 5 |
| ENM-8 · Bestiary II: Clock Tower, Forbidden Library and Drowned Aqueduct | Enemies, elites & bosses | XL | 4 |
| TEC-7 · 7. Ghost Hunters Balance Lab: headless bot runs, metrics and balance bands | Engineering, performance, platform & tooling | L | 4 |
| BAL-2 · Bloodhound: headless balance bots, telemetry and dashboard | Game design, balance & difficulty | L | 5 |
| BAL-3 · The Ledger: class, card, item and enemy power budgets | Game design, balance & difficulty | L | 5 |
| SOC-2 · Crimson Invitations: castle codes, challenge links and share sheets | Social, multiplayer & community | M | 4 |

**Full epic details:** [docs/roadmap/05-castle-atlas.md](roadmap/05-castle-atlas.md)

### Night Terrors (v0.7) — Bestiary, elites, bosses reborn, statuses and the living score


**Goal:** Populate the castle: 15 new monsters plus second moves for the original seven, an encounter director with squads and attack tokens, 8 readable elite affixes, statuses and reactions with boss poise, three-phase rebuilds of Gorehorn, the Rune Colossus and Count Vlador with sim-paused cinematic intros, and adaptive stems with leitmotifs and boss themes.

**Demo moment:** The skewed 'EPIC BOSS FIGHT!' card slams in and Count Vlador rises. At half health the music drops to a lone organ as he bursts into a swarm of bats: phase two.

**Why now:** The new monsters need ENM-1, ART-3 rigs, the parts kit, BAL-3 budgets and GEN-3 decor anchors, all of which exist now. The director needs rosters to fill. Boss rebuilds need the BossScript core proven in the slice plus BLD-2's poise, and AUD-8 and ART-6 consume ENM-5's single bossPhase event, so all four ship together. ENM-2 follows BLD-2 so affixes like Cursed use real statuses.

**Estimate:** ~15 weeks

**Exit criteria:**

- [ ] About 30 monsters span 6 biomes, each with a distinct tactical question, IP-safe name, codex stub and sfx block, and all 7 original enemies have a second move.
- [ ] The encounter director owns all spawning. Attack tokens cap simultaneous ranged threats, wave grammar includes ambushes, and bot runs show no room where more than the token budget of projectiles is live at once.
- [ ] 8 affixes each have a sigil, rim colour and sound cue, are drawn from their own stream, and use ruleset-constant caps.
- [ ] Launch ships 4 statuses and 3 reactions within the phone glyph budget. Boss poise replaces stunlock immunity, and reaction hazards stay inside the 128-slot pool.
- [ ] All 6 bosses run on BossScript with HP-gated phases, bespoke deaths and one bossPhase event consumed by HUD, music and FX. Intros pause the sim and can be skipped, and 'seen' flags never shift tick timing.
- [ ] The MusicDirector fades up to 5 stems on the beat, with one theme per biome (6), hero and Count leitmotifs and per-phase boss themes. Stem count follows the quality tier on phones.
- [ ] Tick stays ≤ 4 ms in the CPU-throttled gate with 140 enemies, statuses and the director active, and the bundle is still under its per-domain budgets.

| Epic | Area | Effort | Impact |
|---|---|---|---|
| ENM-3 · Bestiary I: 15 new monsters and second moves for the original seven | Enemies, elites & bosses | XL | 5 |
| ENM-4 · Night Watch Director: biome rosters, squads and fair pressure | Enemies, elites & bosses | L | 5 |
| ENM-5 · Curtain Call: multi-phase boss framework, intros and the big three reborn | Enemies, elites & bosses | XL | 5 |
| ENM-2 · Elite Affixes: Vampiric, Shielded, Splitting, Cursed and friends | Enemies, elites & bosses | L | 5 |
| BLD-2 · E2 · Hexes, Hellfire & Hoarfrost: Status Effects and Reactions | Combat systems & buildcraft | L | 5 |
| ART-6 · 6. CURTAIN CALL: Boss intros, phase beats and themed screen transitions | Art, animation, VFX & lighting | L | 4 |
| AUD-7 · The Living Score: adaptive stems, biome themes and leitmotifs | Music & sound | L | 5 |
| AUD-8 · EPIC BOSS FIGHTS!: boss themes, phase music and stingers | Music & sound | L | 5 |

**Full epic details:** [docs/roadmap/06-night-terrors.md](roadmap/06-night-terrors.md)

### Hunter's Arsenal (v0.8) — Kits, new hunters, Card System v2, the unlock tree, heat and 30 events


**Goal:** Deepen every run with pluggable hunter kits that add an ultimate charged by a Soul Gauge, three new hunters, an 80-card pool with resonance and offer tools, perfect dodge and parry, a stained-glass unlock tree applied through RunRules, a single heat system with difficulty presets, a canon story bible and 30 branching gothic-comedy events. Card screens also get their tarot polish.

**Demo moment:** As the new whip-wielding hunter you chain a perfect dodge into a parry, fill the Soul Gauge and unleash your ultimate. Then three tarot cards deal and flip, and the HOLY resonance chip lights up as your build comes together.

**Why now:** Kits, cards and heat multiply the balance space, so they come after the TEC-7 bots and BAL-3 budgets and after the content they act on: sub-weapons from v0.5, statuses and affixes from v0.7. MET-4 lands after ENM-2 so affix and heat stacking is defined once. STO-2's ambushes and curses ride ENM-4's director and MET-4's mutators. Keeping CLS-4 talents and BLD-8 weapon swaps out of this milestone holds the decision budget per run.

**Estimate:** ~13 weeks

**Exit criteria:**

- [ ] A new hunter is one data entry, one kit module and one art module. A2 and the ultimate fit the frozen UX-9 action set with no new touch button.
- [ ] Six hunters ship (the original 3 plus wave one: the whip hunter, the Dhampir and the Shield Knight, under canon names), each within ±10% of the mean bot win rate at heat 0. Wave two waits for CLS-2's CompanionStore.
- [ ] The 80-card pool launches with reroll, banish, skip and pity. No card raises bot win rate by more than 8 percentage points. SUMMON cards wait for the minion system.
- [ ] Perfect-dodge and parry windows are defined in ticks, with the device class recorded in the RunHeader. The combo meter is folded into the Soul Gauge, and room grades are cut.
- [ ] A ~40-node unlock tree applies through the RunRules snapshot, and dailies use base kits.
- [ ] 12 heat candles absorb BAL-7's heat and SOC-3's curses, with Squire, Hunter and Nightmare presets. A seed's layout is identical at every heat level, and max-heat tick stays within budget.
- [ ] 30 events are drawn deterministically from per-biome pools, the 2 original event bugs have regression tests, and the story bible is published.
- [ ] Tarot cards deal and flip, counters roll, and a nav stack remembers focus, all with reduced-motion variants.

| Epic | Area | Effort | Impact |
|---|---|---|---|
| CLS-1 · Hunter Kit Framework: data-driven classes with three ability slots | Classes, characters & companions | L | 5 |
| CLS-3 · Six New Hunters | Classes, characters & companions | XL | 5 |
| BLD-5 · E5 · The Grimoire Expands: Card System v2 and an 80-Card Pool | Combat systems & buildcraft | XL | 5 |
| BLD-4 · E4 · Moonlight Evade: Perfect Dodge, Parry & the Bloodline Combo | Combat systems & buildcraft | M | 4 |
| MET-3 · 3. The Litany of Saint Ember: branching unlock tree and run rules | Meta-progression, economy & hub | M | 4 |
| MET-4 · 4. Curse of the Crimson Moon: heat candles and ascension | Meta-progression, economy & hub | L | 5 |
| SOC-3 · Curses & Covenants: community challenge rules and mutators | Social, multiplayer & community | M | 4 |
| BAL-7 · Difficulty modes and Blood Moon Heat | Game design, balance & difficulty | L | 4 |
| STO-1 · Blood Moon Canon: Story Bible & Narrative Core | Narrative, lore & quests | M | 4 |
| STO-2 · Thirty Doors of Mystery: Event System 2.0 | Narrative, lore & quests | L | 5 |
| UX-8 · Velvet & Gilt — UI polish & animation | UX, onboarding, accessibility & localization | M | 3 |

**Full epic details:** [docs/roadmap/07-hunter-s-arsenal.md](roadmap/07-hunter-s-arsenal.md)

### Dawn (v1.0) — Learnable, accessible, translated, robust and launch-ready


**Goal:** Make the full game learnable, accessible, translated and robust on weak phones, then ship to stores. That covers the Gatehouse Drill and contextual Whispers, recorded assists and screen-reader menus, tooltips and a glossary, five languages, captions and spatial cues, the bestiary and achievements, PNG icons and native wrappers with a device lab, a Lite tier with lifecycle resilience, and closure of IP, licence and store readiness.

**Demo moment:** A friend who has never played picks up a phone, learns dodge and sub-weapons from a candle-headed ghost in four minutes, plays in Japanese with captions on, and reaches the Clock Tower on their first run.

**Why now:** The Drill, glossary and translations are written once systems and text are stable after v0.8, so tutorials teach the shipped game and translators don't redo thousands of words. t() and string lint have been enforced since v0.2 (UX-6's core landed early, absorbing STO-8's tables), so extraction is cheap. The Lite tier, Device Lab, wrappers and the IP and store audit all need final content to measure and rate.

**Estimate:** ~12 weeks

**Exit criteria:**

- [ ] The skippable Drill takes ≤ 4 minutes with a single canon mentor, and a Whisper fires on the first encounter with each system and the first unspent stat point.
- [ ] Assists, including the game-speed slider, are recorded in the RunHeader. Menus pass axe-core with zero critical violations, and one-thumb touch layouts plus the layout editor work.
- [ ] Every card, tag, stat, item and door has a tooltip with glossary keywords. The death recap reads BLD-1 attribution, and its 'watch' button opens the TEC-3 replay.
- [ ] Lint finds zero hard-coded strings. Pseudo-locale layout tests pass, and ES, PT-BR, FR, DE and JA ship as lazy chunks outside the initial bundle.
- [ ] Every telegraph cue has a caption and an off-screen indicator, and positional audio is capped at 6 line-of-sight raycasts per frame.
- [ ] The codex covers every monster and boss in tiers, with about 40 achievements and a Hall of Records for the last 100 runs.
- [ ] PNG and maskable icons, safe service-worker updates, and Capacitor (iOS/Android) and Tauri builds all come from CI. The Device Lab passes on ≥ 6 devices (low-end and mid Android, iPhone, iPad, Steam Deck, 4K/120 desktop), and the Lite tier holds 60 FPS on the named weakest phone.
- [ ] The game survives WebGL/WebGPU context loss, phone calls, rotation mid-fight, tab kills and Bluetooth audio latency. The IP audit closes with every canon name rated low risk, a LICENSE and third-party notices exist, the no-IAP/no-ads/no-gacha ADR is recorded, and the store kit and age-rating answers are generated.

| Epic | Area | Effort | Impact |
|---|---|---|---|
| UX-1 · The Gatehouse Drill — first-run onboarding & contextual Whispers | UX, onboarding, accessibility & localization | L | 5 |
| UX-4 · Assist Grimoire — motor access, difficulty assists & screen-reader menus | UX, onboarding, accessibility & localization | L | 5 |
| UX-5 · Codex of Whispers — tooltips, keyword glossary, damage log & death recap | UX, onboarding, accessibility & localization | M | 4 |
| UX-6 · Tongues of the Keep — i18n framework & first languages | UX, onboarding, accessibility & localization | XL | 4 |
| STO-8 · Ink & Quill: Writing Pipeline, Tone Guide & Narrative QA | Narrative, lore & quests | M | 3 |
| AUD-4 · Hear Everywhere, See Every Sound: spatial audio and audio accessibility | Music & sound | M | 4 |
| MET-6 · 6. The Grimoire Library and Hall of Honors: codex, bestiary, achievements, records | Meta-progression, economy & hub | L | 4 |
| TEC-8 · 8. Every Castle Gate: PNG icons, SW updates, Capacitor, Tauri and the real-device lab | Engineering, performance, platform & tooling | XL | 4 |
| GAP-8 · TEC-9 Every Phone Survives: Lite tier, global budget ledger and app-lifecycle and GPU resilience | Gaps found in review | L | 5 |
| GAP-9 · BIZ-1 Clean Hands: IP distance, licences, business-model stance and store and ratings readiness | Gaps found in review | M | 4 |

**Full epic details:** [docs/roadmap/08-dawn.md](roadmap/08-dawn.md)

### Second Night (v1.1–v1.3) — Post-launch seasons: familiars, the inverted keep, modes and rituals


**Goal:** Three free seasonal updates on the release train. v1.1 'Familiars' brings pocket pets from the reference art with levels and evolutions, card evolutions, class mastery, alternate abilities and signature cards, and the Wardrobe. v1.2 'The Inverted Keep' brings secret walls, keys and vaults, the Count's Relics with a true ending and inverted castle, Hall Guardians and seeded boss pools. v1.3 'Moon Calendar' brings run lengths, the Tower of Trials and Boss Rush, the daily and weekly ritual, and hunter and boss banter.

**Demo moment:** You carry the fifth Relic to the Moonlit Throne. The moon turns black, the castle flips upside down, and Pip the puffball, newly evolved, bounces after you into the real final fight.

**Why now:** These are the strongest retention features, but each one multiplies the balance space or depends on the whole 1.0 stack. Pets need kits and the director. Secrets need GEN-3 prefabs, four-sided doors and reserved streams. Endings need the canon and STO-2's flags, and ranked dailies need GOV-2's device-independent ruleset. BIO-7 and STO-7 ship together under the one macguffin chosen by DIR-1. Shipping them after 1.0 keeps the launch date honest and gives live-ops a six-month content runway.

**Estimate:** ~26 weeks

**Exit criteria:**

- [ ] Each season ships with no new seed epoch, using only reserved streams, with bots, budgets, perf and bundle gates green.
- [ ] Pip and Cinder (canon names) ship as companions with AI, persistent levels and two evolutions. Pet levels are snapshotted into the RunHeader, and BLD-6 ships at least 6 card evolutions.
- [ ] Breakable secret walls, 3 key types and vault annexes come from the appended secrets stream. 5 Relics drive one true-ending resolver with 3 endings, and the inverted keep remix is playable.
- [ ] 3 Hall Guardians ship, and seeded boss pools include 2 IP-redesigned new bosses with themes.
- [ ] Midnight Sprint (~15 min), Full Moon and Eternal Night run lengths ship, plus the Tower of Trials (30 rounds and endless) with a 'Round N/30' pill, Boss Rush, and per-mode local boards.
- [ ] Each day gets one ranked daily attempt with a deterministic score and a shareable result card, plus a moon-phase streak calendar, all stamped with the build fingerprint.
- [ ] A 10-step mastery track, alternate abilities, signature cards and 4–5 code-drawn skins per hunter ship in one Wardrobe with Velvet as its storefront. Hunter and boss dialogue ships with rate-limited barks and a mute toggle.

| Epic | Area | Effort | Impact |
|---|---|---|---|
| CLS-2 · Pocket Familiars: pets with names, levels and evolutions | Classes, characters & companions | L | 5 |
| BLD-6 · E6 · Alchemy & Familiars: Card Evolutions and the Summoner Archetype | Combat systems & buildcraft | L | 4 |
| BIO-7 · 7. Secrets, the Count's Relics and the true ending (the inverted Castle Keep) | Biomes, run structure & world | XL | 5 |
| STO-7 · Many Dawns: Multiple Endings & the True Ending | Narrative, lore & quests | L | 5 |
| GEN-6 · Hidden Halls: breakable secret walls, keys and locked vaults | Procedural generation technology | L | 5 |
| ENM-6 · Hall Guardians: the mini-boss tier | Enemies, elites & bosses | L | 4 |
| ENM-7 · New Nightmares: seeded boss pools, five new bosses and Boss Rush | Enemies, elites & bosses | XL | 5 |
| BIO-6 · 6. Run lengths and the endless Tower of Trials | Biomes, run structure & world | M | 4 |
| MET-7 · 7. The Moon Calendar: daily and weekly seeded challenges | Meta-progression, economy & hub | L | 4 |
| CLS-5 · Class Mastery & Feats | Classes, characters & companions | M | 4 |
| CLS-6 · Arsenal: Alternate Abilities, Loadouts & Signature Cards | Classes, characters & companions | L | 4 |
| CLS-7 · Wardrobe: Code-Drawn Skins, Accessories & Dyes | Classes, characters & companions | M | 3 |
| MET-8 · 8. The Velvet Wardrobe: cosmetics | Meta-progression, economy & hub | L | 3 |
| STO-3 · Speak, Monster! Dialogue, Code-Drawn Portraits & Boss Banter | Narrative, lore & quests | L | 5 |

**Full epic details:** [docs/roadmap/09-second-night.md](roadmap/09-second-night.md)

## Cross-cutting workstreams

- **Keep Kernel and Platform** — Engine, determinism, saves, perf, balance automation, platform wrappers and trust. Owns core/rng.ts stream registry, the RunHeader, FxSink/Intent contracts, the event bus, the save migration registry, the CI tiers (PR < 10 min, nightly, weekly matrix), the per-domain tick, bundle and memory budget ledger, the Device Lab and the single headless bot runner that every harness uses. *(TEC-1, GAP-1, TEC-4, TEC-2, TEC-3, SOC-1, TEC-6, MET-1, GAP-10, GAP-2, TEC-7, BAL-2, TEC-8, GAP-8)*
- **Castle Builders** — Generation and world structure: the biome registry, per-pass generation pipeline, quality gates and fuzzing, prefab grammar and arenas, breakables and candles, terrain and traps, doors, acts and routes, the new biomes, and the post-launch secret, mode and inverted-keep layers. Owns every change that could reshape a seed and funnels it through the single Epoch Two release. *(BIO-1, GEN-1, GEN-4, BIO-3, GEN-5, GEN-2, GEN-3, BIO-4, GEN-8, BIO-2, BIO-5, ENM-8, BIO-7, GEN-6, BIO-6)*
- **Combat, Bestiary and Balance** — Behaviour toolkit, damage pipeline, statuses, sub-weapons, cards, kits and hunters, elites, director, bosses, guardians and pets, plus fairness rules, feel tuning, power budgets, pacing and the playtest protocol. Owns AttackIds, poise, attack tokens and the balance bands the bots enforce. *(BAL-5, BAL-8, ENM-1, BLD-1, BAL-1, BLD-3, BAL-4, BAL-3, ENM-3, ENM-4, ENM-5, ENM-2, BLD-2, CLS-1, CLS-3, BLD-5, BLD-4, CLS-2, BLD-6, ENM-6, ENM-7)*
- **Ink and Organ (Art, Animation, Audio)** — Code-drawn craft: hit-feel, the telegraph grammar and colorblind tokens, rigs and pose swaps, the parts kit and ink bible, the Art Lab dev shell, the cinematic director, the mixer, DSP tests, ~95 SFX, the score format, instrument voices, adaptive stems, boss themes and spatial and caption accessibility. Throughput is measured in the slice and paced to match content waves. *(ART-1, ART-2, UX-2, ART-8, AUD-1, AUD-2, AUD-3, GAP-4, ART-3, CLS-8, AUD-5, AUD-6, ART-6, AUD-7, AUD-8, AUD-4)*
- **Hunter's Journey (UX, Meta, Narrative)** — Everything between and around fights: settings v2, remapping, onboarding and Whispers, assists, tooltips and glossary, i18n, UI polish, the economy, the unlock tree, heat, the codex, dailies, castle codes, the story bible, events, dialogue, endings, mastery, alternate kits and the wardrobe. Every system unlocks one layer at a time against DIR-1's decision budget. *(MET-2, BAL-6, UX-7, UX-3, SOC-2, MET-3, MET-4, SOC-3, BAL-7, STO-1, STO-2, UX-8, UX-1, UX-4, UX-5, UX-6, STO-8, MET-6, STO-7, MET-7, CLS-5, CLS-6, CLS-7, MET-8, STO-3)*
- **Direction, Release and Clean Hands** — Producer-level governance: the canon registry and ownership table, the frozen thumb-zone action set, the vertical slice and roadmap re-baselining, the release train (flags, archived builds, beta channel, rollback) and the IP, licence, business-model and store-readiness gate before any submission. *(GAP-5, GAP-3, GAP-6, GAP-7, GAP-9)*

## Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Capacity mismatch. Even after merges and deferrals, 1.0 is about 100 weeks for 2–3 agent-assisted developers. If unit costs come in higher than estimated, the game could sit permanently mid-refactor. | High | High | Re-baseline M5–M8 from the unit costs measured in the v0.5 slice. Publish an ordered cut line: Reservoir biome to v1.1, ENM-3 down to 10 monsters, CLS-3 wave one down to 2 hunters, 3 launch languages instead of 5, ENM-2 down to 6 affixes. Keep main shippable at all times behind REL-1 flags, and make every milestone a public release. |
| Mobile tick and frame budget erosion. The 0.3 ms figure is desktop Node; phones run JS 4–8x slower and execute two ticks per 60 FPS frame, while statuses, the director, weighted flow fields, rigs and hazards all add per-tick cost. | High | High | A per-domain tick budget table and a 4x CPU-throttled CI gate from v0.2. Manual 3-phone baselines in the first 30 days, then Device Lab runs at every milestone. A Lite tier (TEC-9) and the TEC-5 trigger. Tiered CI (PR < 10 min, nightly fuzz and bots, weekly cross-engine matrix) keeps runner minutes affordable. |
| Cross-device determinism leaks: preset-dependent enemyCap, aspect-dependent view area, ~75 Math.sin/cos/exp/hypot calls in the sim, presentation RNG consumed in the sim, and device-specific timing or aim-assist rules. | High | High | GOV-1's stream registry and TEC-3's sim/cosmetic split, both enforced by lint. Ruleset constants for caps and a sim-side logical view rect. dmath in the sim. Device class and assists recorded in the RunHeader. Nightly cross-engine replay-hash CI over a growing tape corpus. |
| Seed and version fragmentation: seven epics reshape seeds, several version numbers each break reproducibility differently, and cached PWA builds let two players run different builds on the same daily. | Medium | High | One Epoch Two release (v0.6) with streams reserved for all post-launch content. One composite build fingerprint embedded in every code, link, tape and daily. Immutable archived builds, a service worker that never swaps mid-run, and the epoch-1 generator lazy-loaded for one release. |
| Duplication creeps back and hot files become contested: about 25 of 104 epics overlapped, and ~40 of them edit world.ts, enemyAi.ts or app.ts. | Medium | High | The DIR-1 ownership table plus CODEOWNERS, and a PR template that asks for the owner epic. PRs that add a second implementation are rejected. The kernel split lands first, and all signature migrations are batched into M1's single codemod week. |
| Content throughput, not code, is the critical path: ~25 new monsters, 6 bosses rebuilt or new, hero and boss rigs, 6 biome themes, ~95 SFX and ~10k words across 5 locales. | High | High | The ART-9 parts kit and scaffolder, with a ≤ 2 dev-day monster target. Unit-cost measurement in the slice. Re-tinted placeholder variants and boss-theme templates. Content ships in biome packs behind flags, and translation waits for text freeze. |
| Touch input saturation: A2, the ultimate, sub-weapons, swap, charge, parry, interact and photo all compete for a 6-inch phone's thumb zone. | Medium | High | UX-9 freezes ≤ 6 actions and ≤ 4 on-screen buttons in v0.2. Item Crash becomes the ultimate, parry is timing on an existing action, and BLD-8's swap and charge are deferred. Any new action needs a validated layout on a 5.5-inch phone. |
| Progression, cognitive and screen-clutter overload: stats, cards, items, sub-weapons, statuses, affixes, heat, the unlock tree and mastery, plus sigils, pips, hazards and pets on top of 140 enemies. | Medium | High | A DIR-1 progression map with a decision budget per run. CLS-4, BLD-7 and BLD-8 deferred, and 4 statuses with 3 reactions at launch. UX-1 Whispers unlock one layer at a time. ART-2 sets a clutter budget per preset with telegraphs always drawn on top, and contrast checks run on golden scenes. |
| Time-scale proliferation: hit-stop, perfect-dodge slow-mo, the Stopwatch sub-weapon, the game-speed assist and cinematics all bend time, risking desyncs, input-latch bugs and exploit stacking. | Medium | Medium | One time-scale arbiter in core/loop.ts (GOV-1) that combines requests by minimum. Cinematics and dialogue pause the sim entirely. Hit-stop is presentation-only, and gameplay slow-mo windows are defined in sim ticks and recorded in the tape. Pairwise replay tests cover every combination. |
| Bundle and memory erosion against the < 1 MB gzip cap and iOS texture limits: locales, lore, 80 cards, scores, dev tools, stacked render targets and generated reverb impulse responses. | Medium | Medium | Per-domain KB budgets reported on every PR. Lazy locale, lore and score chunks, with dev tools (Art Lab, overlays) excluded from build and precache. TEC-9 owns a memory table per preset with LRU eviction, and Low, Lite and Canvas2D presets disable features that rely heavily on render targets. |
| IP exposure grows with fidelity to Castlevania and the reference mobile RPG (Belmont-like whip hunter, hearts-as-ammo naming, Item Crash, Pot Roast, Stopwatch, Medusa Head, Death, Legion, the inverted castle), especially on commercial stores. | Medium | High | A DIR-1 ipRisk column and rename list from v0.2, before any slice art fixes names. Folklore over franchise expressions. The BIZ-1 audit is a hard gate before any store submission, and music originality is reviewed for AUD-7 and AUD-8. |
| Save loss from iOS Safari eviction, killed tabs and stale cached builds opening newer saves, across growing replays, records and codex data. | Medium | High | TEC-4's checksummed A/B writes, migration fixtures and downgrade guard. navigator.storage.persist(), Soul Sigil backup prompts, a storage budget per store with LRU eviction for replays, and storage usage shown in Settings. |

## Success metrics

| Metric | Target | How measured |
|---|---|---|
| Sim tick cost | p95 ≤ 2 ms desktop and ≤ 4 ms on the reference mid-range phone with 140 enemies, statuses and the director active | tests/perf in CI with a 4x CPU-throttled phone multiplier, plus Device Lab bench scenes driven by recorded tapes at each milestone |
| Frame rate | p95 ≥ 60 FPS on the reference mid-range phone (Medium), ≥ 60 FPS on the named weakest phone (Lite), ≥ 120 FPS at 4K on a high-end desktop | Device Lab replays of fixed bench tapes (Bone Catacombs swarm, Clock Tower hazards, Vlador phase 3), with frame-time histograms archived per build |
| Bundle size | Initial gzipped load ≤ 600 KB at 1.0 (hard cap 1 MB), with every domain inside its KB budget | TEC-1 bundle gate on every PR, with per-chunk gzip reports; locale, lore and score chunks measured separately |
| Determinism | 100% of the nightly replay corpus (≥ 1,000 tapes) re-simulates to identical state hashes on Chromium, Firefox and WebKit; 0 daily desyncs across devices | TEC-3 headless re-simulation in the nightly CI tier; a daily-seed cross-device check in the Device Lab |
| Generation quality | 0 failures across 200k nightly fuzz seeds (connectivity, safe routes, spawn fairness); p99 room generation ≤ 8 ms on the reference phone | GEN-2 nightly fuzzer with shrinker and metrics dashboard, run fully offline in Node |
| Fairness | 100% of AttackIds meet the telegraph minimum and have an audio tell; 0 bot-recorded hits from outside the logical view rect; 0 one-shots from full HP at heat 0 | BAL-1 registry checks in CI, plus TEC-7 bot telemetry aggregated per attack id |
| Balance bands | Each hunter's heat-0 bot win rate within ±10% of the mean; no card's win-rate lift > 8 percentage points; boss share of floor enemy HP between 25% and 40% | TEC-7 nightly 1,000-run matrix (Kiter, Brawler, Greedy) checked against BAL-3 budgets; regressions fail the nightly |
| Content throughput | Median monster scaffold-to-merge ≤ 2 dev-days after v0.5; each content type's measured unit cost within 25% of the re-baselined plan | ART-9 scaffolder timestamps and PR history, reviewed at every milestone retro |
| Onboarding and first-run retention | ≥ 80% complete or skip the Drill without quitting; ≥ 60% of first runs reach floor 2; median first session ≥ 20 minutes | Moderated playtests (BAL-8 protocol) plus TRU-1's local event ledger and opt-in aggregate funnel; no endpoint by default |
| Run length | Full Moon median 30–35 minutes at 1.0; Midnight Sprint ≤ 15 minutes post-launch | Bot run timings, cross-checked against playtest replays (tick counts in tapes) |
| Accessibility | 0 critical axe-core violations; every telegraph at contrast ≥ 3:1 against its floor in all 4 palette modes; 0 flashes above 3 Hz; no text below 12 px | Playwright and axe-core in CI, plus ART-2 contrast tests on golden scenes and the FlashGovernor test harness |
| Stability and save integrity | ≥ 99.5% crash-free sessions; 0 corrupted saves across fuzzed migration fixtures; heap within ±2 MB over a 30-minute soak | Local crash reports with tapes (opt-in aggregate), the TEC-4 migration fuzz suite, and TEC-6 bot-driven soak on Chromium and a real Android device |

## Deferred and cut

Full write-ups: [Appendix B](roadmap/appendix-b-deferred-epics.md).

- **SOC-8 · Grimoire Packs: JSON content mods** — Majority cut (feasibility and player). JSON modding locks a schema before content stabilises, opens an innerHTML/XSS surface and fragments determinism. TEC-2's content registries keep the option open, so revisit after v1.3 with mod licence terms.
- **TEC-5 · 5. Stained-Glass Pipeline: baked vector atlases, instanced actors and WebGPU** — Conditional, not scheduled. The sim is ~0.3 ms, nothing yet shows render is the bottleneck, and ART-3 limits full rigs to heroes, bosses and pets with pose-swap crowds. Trigger: if the TEC-9 budget ledger or Device Lab shows the Bone Catacombs or a Clock Tower crowd below 60 FPS on the reference mid-range phone at Medium, pull chunk baking (its cheapest slice) into the current milestone.
- **ART-4 · 4. BAKED GOODS: Texture baking, pose atlases and 4K LOD** — All three reviewers merged it into TEC-5, so it is deferred with TEC-5 under the same measurement trigger. One render-pipeline owner and one atlas memory budget.
- **MET-5 · 5. Hamlet of Saint Ember: walkable hub and NPC rescues** — An XL second game mode (outdoor tileset, 8 NPC rigs). At 1.0 its services run as menus (MET-3 tree, MET-6 library, CLS-7 wardrobe). Revisit the walkable hub after the cast is unified with STO-6 and v0.5 has measured art throughput.
- **STO-4 · The Hunter's Codex: Lore Pickups, Bestiary & Collections** — The codex and bestiary moved to MET-6. Lore pickups wait for narrative wave 2 (with STO-5 and STO-6), once lazy per-locale text chunks and translation costs are measured.
- **STO-5 · Hunters of the Blood Moon: Prologue, Interludes & Class Arcs** — Its mentor merges into UX-1's single canon mentor, and killer-naming death lines are covered by the MET-6/UX-5 death recap. The comic prologue and per-hunter arcs multiply across 6+ hunters, so they belong to narrative wave 2 after v1.3.
- **STO-6 · Friends in Low Places: Recurring NPCs & Cross-Run Side-Quests** — XL. Its cast overlaps MET-5's villagers and CLS-2's pets, and its Moon Mirror shards conflict with BIO-7's Relics. Schedule it with the hub once one cast list is canon.
- **SOC-4 · Phantom Rivals: ghost races and Replay Theatre** — The player review cut it: ghost races barely work when branching routes diverge. The Death Cam already ships as the 'watch' button on the death recap via TEC-3. Revisit ghosts for fixed-route modes (Tower of Trials) after v1.3.
- **SOC-5 · Daily Moon Boards: pluggable, offline-first leaderboards** — Local per-mode boards ship inside BIO-6 and MET-7. An online reference verifier strains the 'no required backend' rule and needs moderation, a privacy policy and cross-engine re-simulation, so only the provider seam is kept.
- **SOC-6 · Blood Pact Duo: local co-op** — XL. About 25–29 single-player-target sites plus single-target boss AI, cameras, saves and tapes would need rewriting. A two-player spike is prototyped during TEC-2 (v0.3) so the kernel stays multiplayer-ready. Full gamepad-only couch co-op comes after v1.3, and touch co-op is out of scope.
- **SOC-7 · Spotlight: photo mode and streamer kit** — Photo-mode pose quality depends on ART-3. Twitch 'Chat Decides' is cut (third-party network dependency and terms of service). Photo mode and LiveSplit export are revisited after v1.3.
- **BIO-8 · 8. Biome wave B: Royal Chapel, Alchemy Lab, Colosseum** — Biome wave B is premature before wave A's measured costs. The player review cut it and feasibility re-sized it to XL. The Colosseum duplicates the Tower of Trials arena loop, and the chapel imagery needs an age-rating review. Next content wave after v1.3.
- **BLD-7 · E7 · Relics, Curses & Blessings** — It adds yet another relic-like noun and progression layer, and its Curse Level is absorbed into MET-4. Its curse-persistence bug fix ships as a standalone patch in the first 30 days via TEC-4. Drawback relics are re-evaluated against DIR-1's progression map using 1.0 telemetry.
- **BLD-8 · E8 · The Arsenal: Weapon Families, Affixes and Swapping** — The player review folds weapon families into CLS-6's alternate primaries, and the chain-whip Morning Star belongs to CLS-3's hunter. The two-weapon swap and charged heavy attacks exceed the UX-9 action budget. Remaining scope is re-evaluated after CLS-6 ships.
- **CLS-4 · Grimoire Talent Trees** — The player review cut it and the others said 'defer until BLD-5 settles'. It would be a ninth progression layer, with ~144 nodes overlapping stats, cards and the unlock tree. Re-evaluate against DIR-1's decision budget with 1.0 telemetry; if kept, three trees only.
- **ART-5 · 5. CANDLELIGHT: 2D lighting, darkness and colored lights** — Darkness fights the flat cartoon look and phone readability (player review) and adds iOS render-target memory pressure. Post-1.x as warm torch pools and emissive eyes with baked static shadows only, off on Low and Lite.
- **ART-7 · 7. LIVING CASTLE: Parallax vistas, weather, animated set dressing and biome palettes** — Reviewers cut weather, and biome palettes already live in BIO-1's registry. Window vistas and animated set dressing are a post-1.x polish pass gated by TEC-9's memory table and reduce-motion rules.
- **GEN-7 · Trials and Riddles: challenge and puzzle rooms** — Puzzle rooms stall an action roguelite and are fiddly on touch. There should be one puzzle framework, owned with BIO-7. Bell Trials are re-planned after the Tower of Trials (BIO-6) proves the arena loop.
