# Second Night (v1.1–v1.3) — Post-launch seasons: familiars, the inverted keep, modes and rituals

[← Roadmap overview](../ROADMAP.md)


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

#### CLS-2 · Pocket Familiars: pets with names, levels and evolutions

*Classes, characters & companions · effort L · impact 5/5*

The yellow puffball and fire imp from the reference become real companions that follow you through the keep. Each has AI, a name, persistent levels, two evolutions and a Kennel to show them off. **Player value:** A cute, collectible, persistent companion is the strongest emotional hook in the reference. It adds a second build axis and a between-runs goal (raise Ember into an Ifrit Lord).

- **CompanionStore & AI states** — Up to 6 SoA companions with FOLLOW, ENGAGE, SPECIAL, RETURN and NAP states. Pets are invulnerable and pass through enemies, so enemyAi doesn't change.
  - *Implementation:* stores.ts: CompanionStore (x, y, px, py, vx, vy, def, level, stage, state, t, cd, target, anim). src/game/companions.ts: updateCompanions(w, dt), called in World.update right after updatePlayer. FOLLOW steers toward a breadcrumb 0.35 s behind the player (64-entry Float32Array ring of player positions). ENGAGE picks the nearest enemy in line of sight within 260 u via spatial.query. Past a 320 u leash the pet teleports in a puff of smoke. NAP triggers when the room is cleared and the player has idled 4 s. Wall collision uses w.slide.
  - *Acceptance:* 6 companions add < 0.03 ms to the 140-enemy perf benchmark. Over 10k ticks on 20 seeds, no companion is ever inside a wall tile. After every door transition each companion is within 320 u of the player.
- **Starter roster of six pets** — Pip the Puffball (support): +90 u pickup magnet aura; every 7 s 'Puff Up' knocks back 380 in a 120 r ring for 60% base. Ember the Fire Imp (ranged): player-team FIREBALL every 1.4 s for 70% base plus a 3 s burn. Nibbles the Blood Bat (melee): 0.6 s bites for 45% base that heal 1% of damage. Rattles the Skull Pup (fetch): digs one extra 2–6 gem pile per cleared room; every 9 s a bark stuns non-bosses in 90 r for 1 s. Pebble the Rune Golemling (dark stone, blue spiral): every 4 s eats one enemy projectile within 70 r and returns it as a RUNE bolt. Gorelet the Twin Ogrelet (bruiser): 100 r slam every 5 s for 150% base.
  - *Implementation:* src/game/petDefs.ts holds data {id, role, cadence, dmgMul, specialCd, unlock}. Behaviours live in companions.ts behind a small PetAi enum. Pets reuse PROJ.FIREBALL and PROJ.RUNE with team 0. Rattles' dig appends to rollRoomLoot drops using the loot stream.
  - *Acceptance:* tests/pets.test.ts: Pip pulls a soul orb from 150 u in < 1 s. Pebble consumes an ARROW aimed at the player. With seed 99, Rattles adds exactly one extra scrap drop to the cleared room. Gorelet unlocks only after 5 Gorehorn kills.
- **Pet levels, bond tricks & evolutions** — Pets earn persistent Pet XP from assisted kills: 5 per kill within 260 u, ×3 for elites, ×20 for bosses. Levels run 1–10 at +6% damage per level, with a bond trick choice at Lv 3 and Lv 7. Pets evolve at Lv 5 and Lv 10: Pip → Thunderpuff (stun sparks) → Storm Cumulus (chain-lightning cloud). Ember → Hellion → Ifrit Lord (3-fireball fans). Nibbles → Night Wing → Count's Herald (2 swarmlings). Rattles → Bone Hound → Cerberus Pup (three barks).
  - *Implementation:* MetaSave.pets: Record<petId, {xp, level, tricks: string[], skin?, name?}>. XP is banked in recordRun (50% on abandon). Evolution stages are separate Pen draws memoised as ShapeCache.pet(`${id}:${stage}`). Tricks are flags read in companions.ts.
  - *Acceptance:* The curve test reaches Lv 10 in about 8 full runs. Evolutions persist across reloads. Trick choices can be changed at the Kennel for 20 souls.
- **Finding pets in the keep** — Pets are earned in the world. In a 'Caged Familiar' mystery event a skeleton jailer guards a birdcage: pay 30 gems or survive an elite wave. An 'Abandoned Egg' chest variant hatches after 3 rooms. Bosses drop trophies (Gorehorn → Gorelet, Rune Colossus → Pebble).
  - *Implementation:* Add one event def to the existing mystery-event table and an InteractKind 'cage' in world.ts. PlayerSave.egg = {petId, roomsLeft}. The pet offered comes from hashCombine(runSeed, attempt, floor, STREAM.companions).
  - *Acceptance:* The same seed and attempt always offer the same caged pet. A freed pet appears in the Kennel as soon as the run ends.
- **PET tag cards & charm synergy** — Adds the PET tag and six cards: 'Good Boy!' (+30% pet damage), 'Pack Tactics' (+20% pet attack rate per other pet), 'Treat Pouch' (pet specials −25% cooldown), 'Shared Soul' (25% of pet damage heals you), 'Bigger Bell' (+1 pet slot this run) and 'Fetch!' (pets carry pickups to you). Orbital wisps now render to match their source: bats for Bat Familiar and Bat Charm, lanterns for Wisp Lantern, imps for Imp Bell.
  - *Implementation:* cards.ts: add 'PET' to CardTag and a `requiresPet` flag filtered in offerCards. New hook keys go in Player.hooks and are read by companions.ts. The renderer familiars array carries a per-orbital `source` shape id from equipment and cards.
  - *Acceptance:* A 1000-offer property test never offers a PET card without an equipped pet. Equipping the Bat Charm draws bats, not imps.
- **Pet rendering & cuteness pass** — Chunky chibi pets get hop squash-and-stretch, blinks, eyes that track their target, and emote bubbles (heart, zZz, '!'). At campfires a 'Pet the puffball' interaction grants +5% max HP for the floor with a heart burst.
  - *Implementation:* src/render/art/pets.ts holds Pen draws per stage, plus a shared eyelid overlay context for blinks. renderer.syncCompanions uses pooled Containers (cap 6) on the y-sorted actorLayer. Blink timing uses a render-side PRNG. world.ts adds InteractKind 'pet' near the campfire, once per rest room.
  - *Acceptance:* The GraphicsContext count stays constant after 5 minutes of play. Pets y-sort correctly against enemies. The campfire pet interaction works once per rest room and its buff appears on the character sheet.
- **Kennel screen & pet HUD pill** — Before a run, the Kennel lets you pick one pet, rename it (12 characters max) and view its level, evolution and tricks. In a run, a pet pill next to the HP pill shows a level badge and a special-cooldown ring.
  - *Implementation:* screens.ts adds kennelScreen, and classSelect gains a pet slot. hud.ts adds the pet pill through the existing set() diff cache. Names are sanitised to [A-Za-z0-9 '-] and never reach the sim.
  - *Acceptance:* The Kennel is fully navigable by gamepad via nav.ts. The pill updates at most 4×/s. A name containing HTML renders escaped.

**Depends on:** EVENTS/rooms domain: event framework hook for Caged Familiar and the egg chest variant; META/save domain: MetaSave v2 migration (shared with Epic 5); ART domain: optional rig clips for pet idle animation (pose swaps here work without it); AUDIO domain: pet chirp SFX presets (ZzFX)
**Risks:** Pets steal the player's power fantasy; cap the pet share at about 20% of room damage for non-Warden classes, checked by the harness; Visual clutter alongside 140 enemies; draw pets at 0.9 scale with a soft rim light; Rattles' extra scrap inflates the economy; account for it in shop prices; Pet XP grind feeling mandatory; Lv 1 pets are already useful and evolutions are sidegrades with flair
**Constraint check:** Vector-only Pen art with contexts built once per stage. Fixed-capacity SoA store (6), no allocation per tick. All pet randomness comes from STREAM.companions seeded from room.seed; names and skins never enter the sim. About +10 KB gzipped. Pets act on their own, so they need no new controls on any device.

**Review notes:**
- *feasibility* (revise): Absorb BLD-6's minions and unify the pet cast across BLD-6, MET-8 and STO-6. Persistent pet levels are a profile-dependent sim input; snapshot them into the RunRules header.
- *player* (keep, effort XL): Pets straight from the reference art; strong charm and identity. Absorb BLD-6 minions and STO-6 pet rescues under one cast (Pip/Cinder). AI, levels, evolutions and Kennel is XL.
- *completeness* (keep): Canonical pet epic. Absorb BLD-6's MinionStore, STO-6's pet rescues and MET-8's familiar skins, with one roster and one set of names.

#### BLD-6 · E6 · Alchemy & Familiars: Card Evolutions and the Summoner Archetype

*Combat systems & buildcraft · effort L · impact 4/5*

Vampire-Survivors-style evolutions: a maxed card plus a catalyst becomes a legendary card. Alongside them, a real minion system brings in the cute pets from the reference art: Pip the yellow puffball, Cinder the fire imp, bone thralls and a spectral knight. **Player value:** Big payoff moments ('my axes evolved into Death's Guillotine!') and a brand-new way to play: a pet-tamer surrounded by adorable, deadly familiars.

- **Twelve evolution recipes** — Each recipe is base (max tier) + catalyst → legendary card:
1. Holy Cross III + Saint's Rosary (item) → Rosary of the Twelve: 12 crosses orbit at radius 110 for 3 s every 5 s, then fly outward at 160% HOLY.
2. Executioner's Axe III + Headsman's Oath → Death's Guillotine: axes always crit; crits execute non-bosses under 15% HP; executions drop a heart 20% of the time.
3. Holy Water III + Burning Hex → Hellfire Font: pools of radius 80 that burn and consecrate.
4. Phase Satellites III + Arcane Battery → Moonlit Orrery: 6 wisps on counter-rotating rings; each pass chills.
5. Bat Familiar III + Vampiric Fang → Nightwing Brood: 5 diving bats that apply 2 bleed and heal you 1% per dive.
6. Storm Chain III + Keen Edge → Tempest Crown: every crit chains (100%), 6 jumps, applies SHOCK.
7. Forked Vector III + Split Volley → Fractal Lance: shards fork once more and pierce 1.
8. Reaper's Scythe + Bloodlust → Crimson Harvest: scythe radius +6% per kill in the room (max +60%); applies 3 bleed.
9. Requiem + Guardian Aegis → Dies Irae: the nova grants 1.5 s of invulnerability and exorcises cursed enemies.
10. Moonlit Dash III + Swift Greaves → Eclipse Step: dashing leaves a shadow clone that taunts, then bursts for 200% ARCANE.
11. Thorned Mail III + Iron Will → Iron Maiden: 120% thorns plus a ring of 8 spikes at 100% PHYS when hit.
12. Singularity Core + Chrono Sigil → Event Horizon: crit pulls become mini-wells that detonate for 150%.
  - *Implementation:* src/game/evolutions.ts holds EVOLUTIONS {base, catalyst: {card|item|sub|relic}, result}. Player.recompute computes evoReady. Boss and elite chests offer a ready evolution instead of an item. Evolving removes the base card and keeps the catalyst (the Vampire Survivors rule). Evolved cards are legendary with maxStacks 1 and count double toward their tags for resonance.
  - *Acceptance:* Data validation: every base can reach max tier and every catalyst exists. Holding Holy Cross III and Saint's Rosary, the next boss chest deterministically offers Rosary of the Twelve. Taking it removes holy_cross, keeps the rosary, and spawns 12 crosses within 5 s.
- **Evolution ceremony & discovery** — The new Alchemist's Crucible mystery event fuses an evolution early, for 25% HP or 60 gems. The evolved card flips over with a crimson-gold burst. The pause Cards tab gains a 'Grimoire of Evolutions' page with silhouettes and riddling hints ('A blade of the headsman, sworn by oath…'). Discovered recipes persist in meta.
  - *Implementation:* economy.ts EVENTS gains an 'evolve' EventEffect. screens.ts gets an evolution screen. MetaSave gains discoveredEvos (dependency META/UI). The event rolls on the events stream.
  - *Acceptance:* The Crucible's fuse option appears only when an evolution is ready; otherwise it offers a hint. The discovered list persists across runs. The screen is fully navigable with keyboard, gamepad and touch.
- **MinionStore & familiar AI** — Autonomous allies, distinct from today's orbit hit-circles. A fixed pool of 48 minions supports five behaviours: ORBIT_GUARD, SEEK_BITE (dive and return), TURRET, TAUNT_TANK and COLLECTOR. Minion damage goes through dealHit with per-minion sources (procCoef 0.4), so minions apply statuses, count for resonance and show up in the DPS ledger.
  - *Implementation:* stores.ts adds MinionStore (x, y, vx, vy, kind, hp, life, target, state, t, atkT). src/game/minions.ts runs updateMinions(w, dt) after updatePlayer. Targets are reacquired every 0.25 s, staggered by index (i % 30 === tick % 30) through spatial.query. New mods: minionCap, minionDmg, minionDur. Minions never count toward room clear. Room load clears them, except pets, which respawn at the player.
  - *Acceptance:* 24 minions plus 300 enemies add at most 0.1 ms per tick. Minion behaviour is deterministic on crng. Pets follow through room transitions. Minions never block doors or trigger exits.
- **Six pets from the reference art** — - Pip the Puffball (yellow puffball): bounces between enemies for 60% PHYS with big knockback, vacuums gems within 150, and heals 1 HP per 10 gems.
- Cinder the fire imp: hovers at your shoulder and spits a fireball every 1.2 s for 80% FIRE plus 1 burn.
- Bone Thrall: 10% chance on kill to raise a skeleton ally for 8 s (max 4) with a 50% melee attack.
- Spectral Knight: a ghostly axe armor that taunts enemies within 160 for 2 s every 6 s and soaks 3 hits.
- Nightwing bats: from the Nightwing Brood evolution.
- Moth Lantern: a holy moth that cleanses one player status every 12 s.
All are chibi with big eyes, ink outlines and an idle bob and blink.
  - *Implementation:* Each card references a MINION kind. render/art/characters.ts gets pet draw functions built into shared GraphicsContexts (dependency ART). Pets are y-sorted with the other actors in renderer.ts.
  - *Acceptance:* Per-pet tests: Pip credits collected gems to scrap, Cinder applies burn, Thralls cap at 4, the Knight's taunt redirects at least one enemy, and the Lantern cleanses within 12 s.
- **Taunt & minion threat** — Enemies can target minions. Chasers head for a taunting Spectral Knight, and ranged enemies may shoot minions (3 hits kills one). Bosses ignore taunts, but Count Vlador's bat swarms hunt minions, so summoners must protect their pack.
  - *Implementation:* EnemyStore gains tauntT and tauntIdx. While taunted, chase AI steers straight to the minion instead of following the flow field. Team-1 projectiles test against minions (at most 48, cheap). Hooks into enemyAi.ts are coordinated with the ENEMY AI domain.
  - *Acceptance:* A taunted skeleton moves toward the knight. Enemy projectiles damage minions. Gorehorn ignores taunt. The perf budget holds.

**Depends on:** ART: chibi pet rigs (Pip, Cinder, Bone Thrall, Spectral Knight, Nightwing, Moth Lantern) and the evolved-card crimson-gold frame; ENEMY AI domain: taunt and minion targeting hooks in enemyAi.ts; UI: evolution ceremony and Grimoire of Evolutions page; META: persistence of discovered evolutions; EVENTS domain: Alchemist's Crucible; E5 card tiers and maxStacks, E1 sources and effect registry
**Risks:** Summons can trivialise rooms or crowd the screen. Capped at 24 active minions, with minion damage budgeted in the balance harness.; Boss-chest gating can deliver evolutions too late in a 3-floor run. Elite chests and the Crucible event give earlier access.; Extra y-sorted sprites cost render time on low-end phones. Pets use a simplified context on the low preset.
**Constraint check:** MinionStore is a fixed 48-slot SoA with staggered target reacquisition (at most 2 spatial queries per tick), costing at most 0.1 ms. Pets are vector chibis built from shared GraphicsContexts, with no raster art. Evolution data is tiny (about 5 KB gzipped). Minion decisions use the combat stream, so behaviour is deterministic. Pets need no extra input, so play is identical on touch, KB+M and gamepad.

**Review notes:**
- *feasibility* (revise, effort M): Keep evolutions. MinionStore and the six pets duplicate CLS-2, and pet names conflict (Pip/Cinder, Puff/Ignis, Ember); move pets to CLS-2. What remains is M.
- *player* (revise): Evolutions are a proven hook; keep them alongside BLD-5. MinionStore and the six reference pets duplicate CLS-2's CompanionStore; move pets there. Pet names differ across epics.
- *completeness* (revise, effort M): Keep evolutions here. Move MinionStore and pets to CLS-2: it's the same six reference pets under clashing names (Pip/Cinder, Puff/Ignis, Pip/Ember).

#### BIO-7 · 7. Secrets, the Count's Relics and the true ending (the inverted Castle Keep)

*Biomes, run structure & world · effort XL · impact 5/5*

Hide a second game inside the castle. Breakable walls hide pot roasts and gem caches, hidden map nodes lead to secret chambers, and each biome has a small puzzle guarding one of the Count's five Relics. Bring enough relics to the Moonlit Throne and the moon turns black, the castle flips upside down, and the real final fight begins. **Player value:** Long-term mystery, mastery and bragging rights. Even after a first win there's a reason to poke at every wall and to compare notes ('the red book in the Library opens a door!').

- **Breakable walls and secret pockets** — About 18% of combat and elite rooms hide a 5x4 pocket behind a cracked wall tile. The tells are a hairline crack in the brick face, slightly lighter mortar and a candle beside it. Three hits from any attack break it, or one from the axe or holy water sub-weapons. A seeded roll decides the contents: a Wall Roast (a chunky cartoon roast chicken that heals 50%), a Gem Cache (30 + 15 × depth), a Relic Map Fragment, or a Secret Merchant (a hooded skeleton selling rare stock).
  - *Implementation:* Reuses TILE_CRACKED and wallHp from Epic 4. A new `carveSecretPocket(grid, rng)` in room.ts uses `hashCombine(seed, STREAM.secrets = 9)`. It looks for a north or south wall run with at least 6 solid tiles behind it, carves an enclosed pocket, and joins it to the room with a single cracked tile. Breaking the tile fires a 'secretFound' event, rebuilds flow costs and spawns the pocket's interactables. RoomView covers the broken tile with a rubble overlay sprite and a burst, without rebuilding its static geometry.
  - *Acceptance:* Over 1000 seeds, 18% ± 3% of combat rooms have a pocket. A flood-fill test shows the pocket is unreachable before the wall breaks and reachable after. An axe breaks the wall in 1 hit and a dagger in 3. Contents are deterministic. The pocket never opens onto the void.
- **Hidden map nodes** — Each act has a 50% chance of a secret node hanging off one mid-map room. It isn't drawn on the map until found. You reach it through a hidden door in that room's north wall, a cracked door tile behind a banner. The secret chamber is a set-piece, such as the Forgotten Chapel, the Vampire's Wine Cellar or the Clockmaker's Study, and its exit leads back to the parent room's next column.
  - *Implementation:* graph.ts gains `secret?: {parent, id}`, a node of type 'secret' that mapView ignores until it appears in `run.secretsFound`. The parent room gets a north DoorInfo with `hidden: true` over a TILE_CRACKED tile (doors on any side come from Epic 4). Run.moveTo only accepts the hidden edge once it has been discovered. Uses STREAM.secrets.
  - *Acceptance:* A DOM test confirms the node never appears on the map before discovery. Breaking the hidden door leads to the secret room, whose exits go to the parent's next column. Placement is the same for the same seed.
- **Biome puzzle secrets** — Each biome has one seeded, solvable puzzle guarding its relic vault. Clock Tower: set 3 wall clocks to the time on a cracked pocket watch found earlier in the act. Library: pull the one red book sticking out of a shelf. Reservoir: turn 2 sluice valves in the order of a drip-mark tally to drain a sunken vault. Chapel: ring 3 bells in the colour order of the rose window. Alchemy Lab: pour 3 flasks into the cauldron following a recipe scroll. Colosseum: fill the Hype meter to 100% before the last gauntlet wave. Gate, Catacombs and Throne get simpler pocket-style secrets.
  - *Implementation:* New src/game/secrets.ts: `PuzzleDef {biome, setup(rng, graph): PuzzlePlan, check(state)}`. The plan picks which rooms hold the clue and the mechanism; it is drawn from STREAM.secrets when the act starts and stored in RunSave v2. Mechanisms are new InteractKinds ('lever', 'clock', 'valve', 'bell', 'cauldron') whose state lives in Run, so it survives room changes. Clues are seeded decor variants, such as clock hand angles or rose-window colour order.
  - *Acceptance:* For each biome and 200 seeds, the correct input sequence solves the puzzle, and a wrong sequence resets it without soft-locking. A graph test confirms the clue room is reachable before the mechanism room on at least one path.
- **The Count's Relics** — Five relics, each with a small passive, held for the run and also recorded in a permanent collection. Signet Ring: +10% gems. Ruby Fang: 2% lifesteal. Black Rosary: +0.15 s of invulnerability after a hit. Clockwork Heart: +15 max HP. Blood Chalice: blood shrines cost 15% HP instead of 20%. The true-ending gate needs 2 relics in Short, 3 in Standard and 5 in Long.
  - *Implementation:* New src/game/relics.ts holds the data. Player.relics is persisted in PlayerSave, and passives apply in Player.recompute through stat hooks owned by the card and item domains. A relic row appears in the HUD, the Atlas shows collected relics, and MetaSave records relicsEverFound.
  - *Acceptance:* Each relic changes its stat by exactly the stated amount. The relic count survives save and continue. Each mode's requirement is enforced at the Throne.
- **The Black Moon Gate and the inverted Castle Keep** — If you hold enough relics when Count Vlador falls, the blood moon turns black and a Black Moon Gate opens beside the normal exit portal. The final act is the castle turned upside down. Rooms run east to west, chandeliers stand up from the floor, banners hang upward, and stars glitter below through holes in the floor. The palette is the Throne's, inverted. Enemies carry an 'Inverse' modifier: a black-gold aura, +40% speed and curving shots. Final boss: Vlador, Crimson Sovereign, beneath a Black Sun.
  - *Implementation:* BiomeDef 'keep' (tier 6) sets `invert: true`. `invertTheme(theme)` rotates hue 180° in HSL while keeping luminance, so ink contrast survives. Generation mirrors rooms horizontally, putting the entrance in the east and exits in the west (doors on any side come from Epic 4). DECOR_DRAW takes a `flipped` flag. mapView reverses its columns. The music sets `inversion: true`: intervals are mirrored around the root and the chord progression plays in reverse. Spawn rows reuse Throne and Catacombs enemies with `INVERSE = {hpMul: 1.3, spdMul: 1.4}`.
  - *Acceptance:* The gate appears only when relics ≥ the mode's requirement. Keep rooms pass every generation test with doors on the opposite sides. The contrast between ink and floor colours is ≥ 3:1 (computed luminance test). A music test confirms the inverted notes.
- **Endings and epilogues** — Three endings, each with a code-drawn SVG epilogue scene and a credits roll. 'Dawn Breaks' (normal): the Count falls and the castle crumbles at sunrise. 'Eclipse Unmade' (true): the Black Sun shatters and the hero's chibi silhouette stands on the inverted spire. 'The Long Night': clearing round 30 of the Tower. The first true ending unlocks 'Crimson Moon' New Game+: +0.5 depth on every act, the Inverse modifier on elites and souls ×1.3.
  - *Implementation:* New src/ui/endings.ts builds SVG scenes from layered silhouettes and sun or moon discs, with CSS parallax, about 3 KB each. MetaSave v2 adds `endings` and `ngPlus`. Change to `endRun(result: 'defeat'|'dawn'|'eclipse'|'longNight')`. The credits can be skipped and respect reduced motion.
  - *Acceptance:* A god-mode app test with a mocked renderer reaches each ending. Endings persist in meta. New Game+ unlocks only after 'eclipse' and adds +0.5 to every act's depth.
- **Atlas completion and secret tracking** — The Atlas gains a completion overlay showing, per biome, 'Secrets 2/3 · Relic ✓ · Boss ✓', plus a global '% of castle explored'. Undiscovered secret areas show as silhouettes.
  - *Implementation:* MetaSave.secrets is a `Record<BiomeId, string[]>` of ids such as 'clocktower:puzzle'. The Atlas reads it, and the percentage is computed from the registry totals.
  - *Acceptance:* A newly found secret shows on the next Atlas open. Completion reaches exactly 100% when every registered secret, relic, boss and ending has been recorded (synthetic meta test).

**Depends on:** EPICS 1, 2 and 4 (route, doors on any side, cracked walls, set-pieces); EPIC 5 and 8 biomes, for their puzzles (each puzzle ships with its biome); BOSS: Vlador, Crimson Sovereign (true form); ENEMY: Inverse modifier visuals, Mimic; ART: roast chicken, relic icons, epilogue silhouettes; META/UI: endings, New Game+, Atlas codex; AUD: inverted theme arrangement, ending stingers
**Risks:** If secrets are too obscure, nobody finds the true ending. Add escalating hints: Relic Map Fragments, a ghost event that gives hints, and Atlas silhouettes.; If they are too obvious, the mystery is gone. Keep the tells subtle but always the same (crack plus candle).; Puzzle state that spans rooms complicates saving. Keep it in Run and RunSave v2, with migration tests.; Flipped decor and reversed doors may break assumptions in RoomView's 3/4 wall faces. Needs a dedicated visual QA pass.
**Constraint check:** Secrets and puzzle solutions come from STREAM.secrets and are stored in the save, so a seed always has the same secrets and solutions. The inverted palette is computed rather than authored. Epilogues are SVG and CSS. wallHp is allocated on room load, never per tick. Bundle grows about 25 KB gzipped. Puzzles use the generic interact input, so they work with touch, gamepad, and keyboard and mouse.

**Review notes:**
- *feasibility* (revise): Breakable walls and hidden nodes duplicate GEN-6; the true-ending gate conflicts with STO-7's Moon Mirror shards. Keep the relic puzzles and inverted keep. Flipping RoomView's walls is real render work.
- *player* (keep): Secrets and a true ending are pure Castlevania. Absorb GEN-6 walls/keys and STO-7 endings: one macguffin (Relics or Mirror shards, not both). Inverted castle could be a remix pass.
- *completeness* (merge → STO-7): Competes with STO-7 (Relics vs Mirror shards, inverted castle vs Moon Below); keep one true ending. Secret walls go to GEN-6. The inverted castle is a SOTN signature.

#### STO-7 · Many Dawns: Multiple Endings & the True Ending

*Narrative, lore & quests · effort L · impact 5/5*

Replace the single 'VICTORY!' with a final choice over Vlador's body that leads to five endings, from comic to dark to bittersweet. Seven Moon Mirror shards unlock the true ending, after which the game enters a post-game 'Second Night' state. **Player value:** Choices made across dozens of runs (blood pacts, mercy, quests, the Deed) pay off in an ending that reflects how you played, with a clear, long-term goal: restore the Moon Mirror.

- **Ending resolver and Vlador's last choice** — After Vlador's bossDefeated on the final floor, the player chooses before the portal opens. 'Stake the Count' is always available. 'Accept the Blood Crown' needs blood debt 3+ this run. 'Serve the Eviction Notice' needs the Deed. 'Take Lunette Home' needs lunette_freed. 'Restore the Moon Mirror' needs 7 shards plus lunette_freed.
  - *Implementation:* src/narrative/endings.ts holds an ENDINGS list in priority order, each with a requires Cond. App's bossDefeated handler on the final floor opens a dialogue-plus-choice before spawnBossRewards' portal. Change endRun(victory) to endRun(victory, endingId). SeedRecord gains an optional ending field.
  - *Acceptance:* The resolver is pure, and tests cover every flag combination. 'dawn' is always offered. The chosen ending is stored in NarrativeSave.endings and in the seed history.
- **Five endings with epilogue slides** — 'Dawn Over Hollowmere' (the standard ending: an orange sunrise version of the title backdrop and cheering villagers). 'Long Live the Count' (dark: a blood-red moon with your hunter's silhouette in the castle window, while Vlador retires to run Mortimer's shop: 'Finally, a vacation.'). 'Under New Management' (comic: an UNDER NEW MANAGEMENT banner on the castle as Mortimer evicts Vlador, who leaves with a suitcase of carpets). 'A Daughter's Light' (bittersweet: Lunette walks out with you, but the Moon will rise again in 100 years). 'The Last Blood Moon' (true: the mirror is restored, the Sanguine Moon cracks into stars, and Vlador and Lunette reunite and fade to dust at peace).
  - *Implementation:* 3-5 slides per ending, drawn in code with SVG/Pen from title-backdrop pieces (castleSilhouette with a palette swap, moon, bats) plus portrait canvases. Each class gets its own final line, 15 in total. endScreen shows the ending title above the existing stats sheet. First-time soul bonus: +100 for Crown, Merchant and Lunette, +300 for True (Dawn keeps its existing +60).
  - *Acceptance:* Every ending is reachable from a constructed test profile. Slides are skippable. The first-time bonus is paid once.
- **Moon Mirror meta goal** — A visible long-term goal: 7 shards from Grimsby, Candela, Mortimer, Gore & Horn, Vlador's Diary, Mira and the Colossus, and Corvin's first win.
  - *Implementation:* A Codex 'Moon Mirror' tab draws a gothic mirror with 7 wedge slots. Filled slots name their source, and empty ones show a hint. The main-menu moon gains one faint glint per shard. The shard count is derived from flags, not stored as a separate counter.
  - *Acceptance:* The count always equals the number of source flags set (no drift test). Each empty slot shows a hint that points at its source.
- **True-ending final act** — Choosing 'Restore the Moon Mirror' starts the final act. Script for the Sanguine Moon's voice: all caps, echoing and petty: 'I GAVE HIM ETERNITY. HE GAVE ME... CARPETS.'
  - *Implementation:* Preferred path: hand off to a Floor 4, 'The Moon Below', with a final boss 'The Sanguine Moon' (CONTENT/COMBAT domain). Story-only fallback: an extended cinematic in which Vlador fights beside you as a bark-only ally, followed by the 'Moonfall' slides. Either way, 'true_ending_seen' is set.
  - *Acceptance:* The fallback is complete and shippable without Floor 4. When Floor 4 exists, the flow hands off without breaking Run.isFinalFloor.
- **Second Night post-game state** — The world remembers your ending. Vlador: 'You again? I KNEW I recognised those boots.' After the true ending the title switches to a dawn palette, Abelard retires and hands over his hat as a cosmetic, Vlador's ghost turns up as a rival merchant, and a 'Night of the Crimson Moon' new-game-plus hook opens.
  - *Implementation:* Ending flags are added as conditions on dialogue, events and the title backdrop. A 'dawn' entry in FLOOR_THEMES and a palette for the title. The NG+ modifiers themselves come from the BALANCE domain.
  - *Acceptance:* At least 10 lines reference earlier endings. The title palette swap can be tested by setting a flag. NG+ stays hidden until an ending has been seen.
- **Endings gallery and code-drawn credits** — Replay endings from the Codex, plus credits with a parade of the cast.
  - *Implementation:* The Codex Endings tab can replay any seen ending in read-only mode. The credits are DOM text scrolling over a cast parade of portrait canvases. A new 'dawn' mood in music.ts STYLES plays a major-key organ chorale.
  - *Acceptance:* Replays never change saved state. Credits last 90 s or less and are skippable.

**Depends on:** Epics 1, 2, 3 and 6 (flags, dialogue, blood-debt events, quests); CONTENT/COMBAT: Floor 4 'The Moon Below' and the Sanguine Moon boss (optional, since a fallback exists); ART: ending vignettes and title palette variants; AUDIO: 'dawn' music mood and ending stingers; BALANCE: NG+ modifiers
**Risks:** The true ending could be gated by too much grind. Target 25-40 runs, with hints in every empty mirror slot.; The fallback ending may feel anticlimactic without Floor 4.; The Codex could spoil endings. Keep unseen endings fully masked.; Interrupting right after the boss kill. The choice appears after the slow-motion moment and before the portal.
**Constraint check:** Endings are DOM/SVG slides and runtime Pen vignettes, with no images. Music is a new procedural mood. All state is NarrativeSave flags in IndexedDB. Nothing touches the simulation loop. About 8 KB gzipped of text in a lazy chunk.

**Review notes:**
- *feasibility* (revise): Unify with BIO-7: one true-ending item (Relics or Moon Mirror shards) and one Floor 4. The endings are mostly content once STO-3's dialogue lands.
- *player* (merge → BIO-7): A second true-ending macguffin (Mirror shards vs Count's Relics). Keep the ending resolver and epilogues inside BIO-7; three endings, not five.
- *completeness* (keep, effort XL): Single endings epic; absorb BIO-7. Choose relics or mirror shards. A 25–40 run gate is long for mobile players; validate it with playtests.

#### GEN-6 · Hidden Halls: breakable secret walls, keys and locked vaults

*Procedural generation technology · effort L · impact 5/5*

Castlevania's best habit: hit every wall. Breakable secret walls hide wall-roast nooks and relic caches. A floor-level lock-and-key planner hides Iron, Bone and Moon keys that open vault annexes. A rare Hidden Passage node skips a whole column of the map. **Player value:** Exploration finally pays off. 'SECRET!' banners, the pot-roast moment, a key that sends you hunting for its vault, and veterans finding the clock-tower shortcut give the run discoveries worth talking about.

- **Secret wall carving** — Find wall faces with solid rock behind them, carve a pocket, and seal it with breakable bricks that carry a subtle visual tell.
  - *Implementation:* In src/gen/secrets.ts, the 'secrets' pass scans room-facing wall tiles that have floor on exactly one side, a solid (pocket.w+2)×(pocket.h+2) block behind, at least 3 tiles of distance from the border and door pads, and no MF_SETPIECE unless the piece has an 'x' glyph. Pocket library: Roast Nook 3x3, Hidden Reliquary 5x4, Bat Roost Cache 7x5, Ossuary Niche 4x6. Pockets connect through 1–2 TILE_BREAKABLE tiles flagged MF_SECRET, which take 3 player hits. Tells: a hairline crack plus a slightly mismatched brick tint (REN) and a hollow 'tok' when hit (AUD). Frequency: 35% of combat and elite rooms, plus at least one per floor pre-assigned at Run.enterFloor.
  - *Acceptance:* Treating BREAKABLE as solid, the flood fill never reaches a pocket; treating it as passable, it always does (20,000 rooms). At least 1 secret per floor over 10,000 floors. Pockets never overlap set-pieces or each other.
- **Secret contents table** — Weighted Castlevania-flavoured rewards, rolled per uid at generation.
  - *Implementation:* Wall Roast 30 (a pot roast on a plate, heals 50% max HP); Gem Hoard 25 (20–40 + 10×floor gems); Relic Chest 15 (rare or better via the chest roll with luck +0.15); Bat Roost Ambush 15 (6 Blood Bats burst out, then an uncommon chest); Hunter's Journal 10 (a lore page for the codex plus 1 stat point); Cursed Mirror 5 (a mini-event that swaps a card for an epic with the same tag).
  - *Acceptance:* Distribution is within ±3% of the weights over 50,000 secrets. Ambush bats spawn at least 4 tiles from the player. The reward is granted once and persisted through RoomDelta.
- **Floor-level lock and key planner** — Choose a vault node and an ancestor key node in the floor DAG, so the key always comes before the lock and the vault is never required to progress.
  - *Implementation:* src/gen/locks.ts runs at Run.enterFloor from passRng(fSeed, LOCKS). The vault node V is a combat, elite or event node in column 3 or later, not in the pre-boss column. The key node K is chosen from ancestors(V), preferring col(K) ≤ col(V) − 2. The key container is an elite drop if K is elite, otherwise a secret pocket or a coffin destructible. Keys: Iron Key (Castle Gate), Bone Key (Catacombs), Moon Key (Moonlit Throne). They crumble on leaving the floor. Chance of a vault: 40% on floor 0, 70% on floor 1, 100% on floor 2. Keys are stored in Run.keys.
  - *Acceptance:* Across 10,000 floors with a vault, a path start → K → V → boss exists; K ≠ V; neither is the start or boss node; the boss is reachable from every node without passing through V.
- **Vault annex and gate** — A gated annex stamped against the room wall, opened by interacting with the right key.
  - *Implementation:* The 'Vault Annex' set-piece sits behind a TILE_VAULT wrought-iron gate with a padlock glyph. Interacting with the key calls setTile(FLOOR), plays 'vault_open' and records RoomDelta.opened. Themes: Count's Treasury (epic chest plus 60 gems), Armory Vault (choose 1 of 3 rare-or-better items), Saint's Reliquary (a guaranteed rare HOLY card from Holy Cross, Holy Water or Requiem Nova).
  - *Acceptance:* With VAULT solid, the flood fill never reaches the interior. The open state persists through Continue. Rewards are granted exactly once.
- **Hidden Passage node** — A rare secret graph node behind a breakable wall that skips a column, leading to a special room.
  - *Implementation:* Chance of 6% per floor (12% on floor 2): graph.ts adds node S of type 'secret' between columns c and c+2, with c in [1, cols−3]. A pre-assigned secret wall in a column-c room opens onto a secret TILE_DOOR targeting S. S is a bespoke room (Clock Tower Gears, Underground Lake or Count's Library) whose exits go to every column c+2 node. S is exempt from the edge-crossing rule. The map draws it dashed once found (UI).
  - *Acceptance:* Graph fuzz: S is reachable only through the secret door; every existing graph invariant holds once secret edges are included; taking the passage skips exactly one column.
- **Discovery UX hooks** — Discovery feedback and ways to buy hints, so secrets are learnable rather than random.
  - *Implementation:* A skewed 'SECRET!' banner in the 'EPIC BOSS FIGHTS!' style (UI) and a chime (AUD). Run summary shows 'Secrets 3/5'. The Fortune-Teller's Skull event gains 'Ask where the walls are hollow' (outline MF_SECRET tiles on this floor). A new Sub-Routine item, the Hunter's Lantern, reveals breakable walls within 6 tiles. The generator exposes floorSecrets(floor) for the UI.
  - *Acceptance:* The reveal outlines exactly the MF_SECRET tiles of the current floor's generated rooms. Summary counts match generator totals.

**Depends on:** Epic 1 (BREAKABLE and VAULT tiles, setTile, RoomDelta, keys in RunSave v2); Epic 3 (Vault Annex, secret room set-pieces); Epic 4 (coffin and urn containers for keys); UI: SECRET banner, key and padlock icons on the SVG map, dashed secret edges; AUD: hollow knock, crumble and vault chimes; ECO: vault reward balance; META: codex pages from Hunter's Journal
**Risks:** Players who miss the tell may feel secrets are random. The tint and knock must be consistent, and hint items help.; The vault-reachability guarantee depends on the graph shape. Reroll the vault choice if no ancestor key node exists.; Testers may treat the Hidden Passage as a speedrun exploit. Accept it as intended Castlevania design.
**Constraint check:** Code-only pocket templates. Planning happens at floor or room generation from dedicated pass streams. Runtime cost is limited to breakable hit checks through the destructible bucket grid. Saves use RoomDelta. Works with any input, since walls break from normal attacks. Expected bundle growth is about 6 KB gzipped.

**Review notes:**
- *feasibility* (keep): Absorb BIO-7's breakable walls and hidden nodes. The lock-and-key planner across graph columns is solid. Keys and opened walls persist through GEN-1's RoomDelta and TEC-4.
- *player* (merge → BIO-7): Breakable walls, pot roasts and hidden nodes duplicate BIO-7. The key and vault planner is good content; fold it in as BIO-7's secret layer.
- *completeness* (keep): Owns secret walls, keys and vaults; absorb BIO-7's breakable walls and hidden nodes. The Hidden Passage column skip may break BAL-4 per-path guarantees.

#### ENM-6 · Hall Guardians: the mini-boss tier

*Enemies, elites & bosses · effort L · impact 4/5*

Add a tier between elite and boss: six named guardians with two-phase scripts that turn elite rooms and new Guardian nodes into memorable mid-floor duels. **Player value:** Gives each floor a mid-floor spike and a reason to take the risky branch. Each guardian guarantees a rare relic, and their names become run milestones.

- **Mini-boss framework** — A 'mini' tier with about 8–12× a heavy's HP and a light two-phase BossScript (split at 50%). Each fight opens with a 1.2 s name splash (no full intro) and shows a slim HUD bar. Unlike bosses, a mini-boss's death doesn't wipe the room. Guardians appear in 30% of elite rooms from floor 1, replacing the elites, and in a new Guardian node that guards a relic chest. Each guarantees a rare+ chest.
  - *Implementation:* Add the 'mini' tier in enemyDefs. killEnemy kills everything else only for tier 'boss'. planSpawns gains a guardian branch on STREAM.enemies. Adding the Guardian node type needs the WORLD graph domain. Brains live in src/game/ai/brains/mini/*.ts.
  - *Acceptance:* Over 1,000 floor-1+ elite rooms, a guardian appears in 30% ± 3%. A guardian kill never kills its adds. Its rare+ chest spawns 100% of the time.
- **Dullahan, the Headless Rider** — Base HP 700, floor-scaled.

Phase 1, mounted: Lance Run. A 0.8 s LINE telegraph spans the room (56 px wide), then a 900 px/s charge. He makes 3 charges on alternating lanes, and the spectral hoofprints burn for 3 s.

Phase 2, dismounted at 50%:
- He hurls his flaming head. It orbits the player at 160 px for 4 s, firing 3-bullet fans every 1 s.
- The head is a weak point (×2 damage) with its own 200 HP pool. Destroying it stuns the body for 3 s.
- The body swings a 110° sword cone.
  - *Implementation:* The head is a child entity linked through parent, with an orbit brain. The steed is a visual-only part removed at the transition. Art: a headless knight and a spectral horse in Pen, with a flaming-head projectile set.
  - *Acceptance:* Lance lanes are always fully telegraphed at least 0.8 s before the charge. Head damage applies ×2 to the shared bar until the head breaks, and breaking it triggers exactly 3 s of stun.
- **Werewolf 'Lupus Rex'** — Base HP 800.
- Pounce Chain: 3 leaps of 180 px, each onto a 0.5 s, 70 px circle telegraph.
- Claw Flurry: 3 CONE swipes with tells of 0.35, 0.3 and 0.45 s, stepping forward each time.
- Howl: a 0.9 s rear-up tell, used at 50% and every 20 s. It summons 2 Hellhounds and grants +25% speed for 6 s.
- Moonlight: window moonbeam tiles heal it 1% per second, shown by a silver sparkle, so players can bait it out of the light.

Phase 2, Frenzy: its pounce chain grows to 4 leaps.
  - *Implementation:* Moonbeam tiles come from room.decor 'window' projections, exposed by GEN as World.moonTiles. Hellhounds reuse the Epic 3 def. Art: a hulking chibi wolf with big eyes and torn cape scraps.
  - *Acceptance:* It heals only while its centre is on a moon tile, at exactly 1%/s. Each pounce lands on its telegraphed point within 4 px. Howl summons never exceed 4 live hounds.
- **Twin Mummy Lords, Sekhmut and Nephrah** — 2 × 420 HP, linked by a bandage tether: a BEAM between them deals 12 damage to anyone who crosses it, except through dash i-frames.
- Sekhmut fights in melee with a bandage-whip cone and a pull.
- Nephrah casts sand-scarab swarms (6 SCARAB bullets that slowly home) and a sandstorm DONUT.
- When one dies, the survivor channels an 8 s resurrection. A stagger or killing both within the window stops it.
  - *Implementation:* Partners link through the parent columns, and the tether is an owner-attached BEAM updated every tick. The channel is a move with an interruptible flag. The HUD shows duo bars from Epic 5.
  - *Acceptance:* The tether always connects both living lords. A stagger cancels the resurrection channel. If both die within 8 s, the fight ends.
- **The Executioner** — Base HP 760: a giant Axe Armor in a headsman's hood.
- Twin Axes: 2 axes curve out and return (enemy PF_RETURN), after a 0.6 s tell.
- Whirlwind: a 3 s spin dealing damage within 110 px while drifting toward the player at 90 px/s, after a 0.7 s tell.
- Execution Cleave: a 0.9 s LINE telegraph, 260 × 60 px.
- Armor shedding: its pauldrons break off at 66% and 33%, each adding +15% speed and lowering poise.
  - *Implementation:* Art reuses drawKnight parts at ×1.8 scale plus a hood and executioner axe. The pauldrons are separate parts hidden at their thresholds.
  - *Acceptance:* Returning axes always return to the Executioner or expire. The speed buffs stack to exactly 1.3225×. Whirlwind never starts without its 0.7 s tell.
- **Bone Serpent** — Base HP 900, all on the head. A 10-segment skeletal snake.
- Only the skull takes damage. Segments block player projectiles with a bone 'clack'.
- Burrow: it turns untargetable and resurfaces at a 0.8 s FOLLOW-lock circle.
- Tail Rattle: each segment fires a perpendicular bone shard in a travelling wave.

Phase 2: the segments ignite and leave a fire trail.
  - *Implementation:* Segments are child entities that follow the head through a position-history ring buffer (a Float32Array of 10 × 64) owned by the head's aux. Art reuses the skull() helper at several scales.
  - *Acceptance:* Segments keep 22 ± 2 px spacing. Damage to segments deals 0 to the head. The burrow exit is always on a floor tile.
- **Phantom Bat Lord** — Base HP 720: a giant violet bat.
- Screech: a 60° CONE, 260 px long, after a 0.6 s tell. It slows the player by 40% for 2 s.
- Swoop: a LINE dive.
- Sonar: expanding rings, each with a gap.
- Split: at 50% it bursts into 16 bats that share its HP pool, then reforms after 6 s or once 4 or fewer remain.
  - *Implementation:* Art reuses the bat body and wings at ×3 scale. The split reuses the shared-pool child pattern from Vlador's Bat Storm.
  - *Acceptance:* The shared pool stays consistent: the bats' damage sum equals the Lord's HP loss. It always reforms within 6 s. Sonar gaps are at least 44 px.

**Depends on:** Epic 1 toolkit and Epic 5 BossScript, duo bars and shared-pool children; WORLD/GEN: Guardian node type in graph.ts and moon-tile projection for windows; LOOT/ITEMS: guaranteed rare+ relic chest; ART: about 6 mini-boss rigs (several reuse existing parts); UI: slim mini-boss bar and name splash
**Risks:** Mini-bosses can steal the bosses' thunder, so keep their move counts at 3–4.; Multi-part entities (serpent, head, bats) stress the child-entity logic and need shared tests with Epic 5.; Guardian rooms can lengthen runs, so cap them at 1 per floor.
**Constraint check:** Mini-bosses reuse enemy SoA pools and deterministic MoveSets. Their spawns come from the seeded enemies stream. Art is vector parts, often scaled reuses of existing contexts. Expect about 8 KB gzipped and under 0.05 ms per tick during a fight, all inside the existing budgets.

**Review notes:**
- *feasibility* (revise, effort XL): Absorb BIO-4's mini-boss halls and BIO-8's named mini-bosses. Six rigs plus a new Guardian node type (which reshapes graph seeds) is XL. Ship three guardians first.
- *player* (revise, effort XL): Mid-floor duels fit, but six scripted, rigged guardians is XL, not L. Ship 3 that reuse parts (Dullahan, Executioner, Bat Lord); absorb BIO-4's Mini-boss Hall room kind.
- *completeness* (keep): Fine scope. The Guardian node overlaps BIO-4 Mini-boss Halls and GEN-7 node types, so batch all graph.ts node additions into one change.

#### ENM-7 · New Nightmares: seeded boss pools, five new bosses and Boss Rush

*Enemies, elites & bosses · effort XL · impact 5/5*

Bosses stop being fixed per floor. Each biome draws from a seeded pool, five new bosses arrive (Medusa, Death the Reaper, Legion, The Creature and Fritz, and a secret Doppelganger), and Boss Rush, Guardian Gauntlet and Practice modes, a codex and Nightmare variants let players replay them. **Player value:** Players face a different boss at each gate, chase the codex, master bosses in practice, and race seeded daily Boss Rushes. That adds long-tail replay value.

- **Seeded boss pools** — BOSS_POOLS[biome]:
- Castle Gate: Gorehorn, The Creature and Fritz, or Medusa.
- Bone Catacombs: Rune Colossus, Legion, or Death.
- Moonlit Throne: always Count Vlador, the finale.

The Doppelganger appears only through a secret 'Mirror Hall' event. The pick depends only on runSeed, floor and attempt (never on meta progress), and the boss node on the map shows the chosen boss's silhouette. When Bestiary II biomes arrive, pools are re-homed (Medusa to the Garden, Death to the Clock Tower).
  - *Implementation:* Append STREAM.bosses = 8 in core/rng.ts. Run.enterFloor computes bossDef via streamRng(fSeed, STREAM.bosses), and planSpawns reads it instead of BOSS_FOR_FLOOR. RunSave stores no extra state, because the pick is derived.
  - *Acceptance:* Over 3,000 seeds, each pool member is picked 33% ± 3% of the time. The same seed gives the same boss on every device. The silhouette matches the spawned boss.
- **Medusa, Gorgon of the Moonlit Garden** — Base HP 2600.

Phase 1, Serpent Queen (100–65%):
- Snake Hair: a fan of 8 SNAKE bullets that sine-weave with a 26 px amplitude.
- Petrifying Gaze: a 1.1 s charge with a full-length 50° CONE telegraph. It petrifies only if her eye has line of sight to the player when it fires, so hiding behind one of the arena's 4 pillars or dashing through it works. Petrify lasts 1.0 s (mashing any input shortens it by 40%), with a 3 s immunity afterwards.
- Tail Lash: a DONUT (inner 90 px, outer 200 px).

Phase 2, Gallery of Heads (65–30%): Medusa Head streams pour from all 4 walls in alternating lanes while she coils at the centre and fires a snake spiral.

Phase 3, Last Glare: the gaze becomes a sweeping 25°/s ROTOR cone, so players circle the pillars.
  - *Implementation:* brains/medusa.ts uses w.los from the eye point. Petrify uses p.stunT (PLAYER dependency). The boss room generator must guarantee 4 pillars (GEN dependency). Art: a chibi gorgon with a snake-hair crown and a stone overlay for the petrified player.
  - *Acceptance:* The gaze never petrifies when a wall or pillar tile blocks LOS. Petrify can't reapply within 3 s. The arena always has 4 pillars. Stream lanes never overlap on the same tick.
- **Death, the Pale Reaper** — Base HP 4200.

Intro: Death plucks the player's Sub-Routine item and hangs it on his scythe. It comes back on victory with +1 forge level, and comes back on defeat too, so nothing is ever lost permanently.

Phase 1, Harvest:
- Sickle Storm: 6 SICKLE bullets hang for 0.6 s (PF_DELAY), then curve after the player (PF_CURVE) for 4 s. At most 12 are live.
- Reap: a 0.6 s CONE, 150° and 140 px.
- Blink.

Phase 2 at 60%, Reaper's Mark: a skull counter floats over the player, gaining 1 per hit taken and losing 1 every 4 s without a hit. At 5, 'Reaped' deals 40% of max HP. Four Sickle Sentinels orbit Death (PF_ORBIT_OWNER).

Phase 3 at 25%, true form: a giant skull. Death's Wheel spins 3 ROTOR beams plus a sickle spiral, then 'Memento', a slow ring with a gap.
  - *Implementation:* brains/death.ts. The item hold and return goes through the ITEMS domain API (equipment.ts unequip and re-equip) and is recorded in RunSave. The mark counter lives in a Player field (PLAYER dependency).
  - *Acceptance:* The mark decays exactly 1 per 4 s. No more than 12 sickles are ever live. The held item is restored on both victory and defeat, and only victory adds +1 forge level.
- **Legion, the Corpse Sphere** — Core HP 2600, plus 32 corpse nodes of 50 HP each in two counter-rotating rings (70 px and 100 px).
- Phase 1: the core is immune while 16 or more nodes live. Nodes detach as Zombies every 5 s, and the core fires wail rings with gaps through the shell.
- Phase 2: once at least 50% of nodes are destroyed, the core is exposed and fires a rotating 4-arm BEAM.
- Phase 3 (core below 30%): Legion rolls around the arena in slams and regrows nodes from corpses on the floor, so killing Zombies fast denies the regrowth.
  - *Implementation:* Nodes are child entities with orbit positions computed from the core's phase. Regrowth consumes the Epic 2 corpse ring buffer. Art: a lumpy sphere of chibi corpse heads with ink outlines, built from 3 node variants.
  - *Acceptance:* The core takes 0 damage while 16 or more nodes live. Regrowth happens only from corpse buffer entries. The fight never exceeds 33 boss entities plus 12 adds.
- **The Creature and Fritz (duo)** — The Creature (1900 HP) and Fritz, a Fleaman (500 HP).
- The Creature: Galvanic Slam (a 0.8 s, 120 px circle, then 4 electric LINE lanes in a cross), Boulder Heave (a lob that leaves a rubble slow-patch), and a lumbering chase.
- Fritz rides the Creature's shoulder, hops off to throw firebombs (lob plus ENEMY_FIRE), and recharges a staggered Creature in 2 s unless interrupted.
- Kill order matters. If Fritz dies first, the Creature enrages (+30% speed, double slam lanes). If the Creature dies first, Fritz panics (2× hop rate, kamikaze bombs).
  - *Implementation:* Two boss-tier entities with bossIndices[0..1] and duo bars (Epic 5). The riding state copies Fritz's position from the Creature each tick while 'mounted'.
  - *Acceptance:* The fight completes only when both are dead. The enrage branch follows kill order. Fritz's recharge is cancelled by any hit of 40 or more damage.
- **Doppelganger (secret boss)** — Base HP 3200 × floorHpMul. It mirrors the player's class using ClassDef.attack and ability, at 0.6× damage with 1.3× windups, and adds the tells the hero lacks:
- Arc Slash gets a 0.4 s CONE.
- Homing Orbs turn at 1.1 rad/s.
- Shadow Step leaves a 0.5 s smoke tell.

It also copies the hooks of the player's 3 most-stacked cards as enemy variants (Holy Cross becomes an enemy PF_RETURN, Holy Water becomes an ENEMY_FIRE lob). At 50% it swaps to another class's silhouette. Its palette is a dark tint of the hero art.
  - *Implementation:* brains/doppelganger.ts reads player.cls and the owned-card map at spawn and snapshots them into params, so the fight stays deterministic for a given run state. The Mirror Hall event comes from the EVENTS domain.
  - *Acceptance:* Every Doppelganger attack has a telegraph of at least 0.3 s. With 0 cards it still uses 3 moves. It never uses player-team projectiles.
- **Boss Rush, Guardian Gauntlet and Practice** — - Boss Rush: every unlocked boss in biome order, each arena generated from hashCombine(runSeed, 0xb055, i). Between fights an Antechamber heals 35%, offers 3 cards and grants 1 free forge. Split timer, seeded daily Boss Rush, local best times.
- Guardian Gauntlet: 6 mini-bosses, each with +1 affix.
- Practice: fight any boss seen in the codex with a chosen class and a preset level-10 build, with no rewards.
  - *Implementation:* Add 'bossRush', 'gauntlet' and 'practice' run modes to Run and RunSave. app.ts gets new states (UI/TEC dependency). Arenas reuse generateRoom('boss').
  - *Acceptance:* The same seed gives the same order and arenas. Continue works between fights. Practice never grants souls or meta progress. Splits persist to meta.
- **Codex data, kill tracking and Nightmare variants** — src/game/codex.ts holds an entry for every enemy, mini-boss, boss and affix: epithet, biome, a tongue-in-cheek lore line, a tell tip (e.g. 'When the Spear Guard plants its foot, step aside') and weakness traits. Kill counts and first-kill dates persist in meta. After a boss's first kill, its Nightmare variant unlocks:
- +1 move per phase.
- A palette swap: Gorehorn becomes 'Bloodhorn' crimson, the Colossus becomes 'Obsidian' with gold runes, Vlador becomes 'Vlador Eternal' in white and gold.
- +1 affix on adds.
- ×1.5 souls.
  - *Implementation:* Codex data is plain TS with no rendering. Tints are per-boss constants applied in the renderer. The Nightmare flag is recorded in RunSave so runs stay reproducible. Codex screens and portraits reuse the Pen draw functions (UI dependency), and kill counts live in MetaSave (META dependency).
  - *Acceptance:* A test confirms every def and affix has a codex entry. Nightmare is off by default and stored in RunSave. A Nightmare boss shows its extra move in coverage tests.

**Depends on:** Epics 1, 2, 4 and 5 (toolkit, corpse buffer, threat and rosters, BossScript); WORLD/GEN: boss arena variants with guaranteed pillars, and future biome re-homing of pools; ITEMS: hold and return of an equipped item for Death's intro; EVENTS: 'Mirror Hall' secret event for the Doppelganger; UI/TEC: mode select, Antechamber screen, codex screens and app state machine states; META: kill counts, first-kill dates, Nightmare unlocks and best times; AUDIO: leitmotifs for 5 new bosses; ART: 5 boss rigs plus Nightmare tints
**Risks:** Medusa's petrify and Death's mark can feel punishing, so durations are capped and both are always escapable by dash.; Death 'stealing' an item can upset players, so it is always returned and gated behind a setting.; Pool randomness may hide new bosses from players. Practice mode and codex silhouettes surface them.; Content volume is high, so ship the bosses one at a time behind the pool table.
**Constraint check:** Boss choice is derived from seed streams only (no meta influence), so runs remain reproducible from runSeed + floor + attempt. Boss Rush arenas derive from hashCombine. All bosses are Pen vector rigs with procedural leitmotifs. Entity counts stay under 45 per fight, within pools and the 2 ms tick budget. Estimated +30 KB gzipped, which keeps the bundle far under 1 MB. Counterplay relies on positioning, pillars and dash, never aim precision, so all inputs are equal.

**Review notes:**
- *feasibility* (revise): Over-stuffed: five bosses, three modes and a codex. Move Boss Rush and Practice to BIO-6, the codex to MET-6. Seeded pools change BOSS_FOR_FLOOR, so join the GEN_VERSION bump.
- *player* (revise): Seeded boss pools are the real replay win; ship that with 2 new bosses. Codex goes to MET-6, Boss Rush to BIO-6 modes. Doppelganger/Nightmare later. Effectively multiple XLs.
- *completeness* (revise): Death, Legion, Creature and Fritz, Doppelganger and the item-stealing intro are Castlevania signatures. Redesign them. Boss Rush and Practice should share BIO-6's mode framework.

#### BIO-6 · 6. Run lengths and the endless Tower of Trials

*Biomes, run structure & world · effort M · impact 4/5*

Let players choose tonight's run length: Midnight Sprint (~15 min), Full Moon (~30-35 min) or Eternal Night (~60 min). For pure arena combat there is the Tower of Trials: a 30-round climb shown as a 'Round 3/30' pill straight from the reference screenshot, which continues past round 30 into an infinite 'Beyond the Bell'. **Player value:** A full run fits a commute or a long evening. Endless mode suits quick phone sessions, offers score-chasing and a daily leaderboard to come back for, and tests builds harder than the main campaign.

- **Mode definitions and mode select** — SHORT 'Midnight Sprint': 3 acts (T1 → T2 → T5), 4-5 columns per act, souls ×0.6. STANDARD 'Full Moon': 4 acts (T1 → T2 → T3 → T5), 5-6 columns, souls ×1.0. LONG 'Eternal Night': 6 acts (T1 → T2 → T3 → T4 Colosseum → the other T3 option → T5), 5-7 columns, souls ×1.6. ENDLESS 'Tower of Trials'. Long unlocks after the first Standard win, and Endless after reaching Act III.
  - *Implementation:* New src/game/modes.ts: `MODES: Record<ModeId, {acts: ActSchedule, soulsMul, unlock(meta), label, blurb, estMinutes}>`. A mode row of chunky pill buttons, showing estimated minutes and lock icons, is added as a step of S.classSelect. Change to `App.startRun(cls, seed, attempt, daily, mode)`. Short uses depths [0, 1.1, 2.3], so its final act is as hard as Standard's.
  - *Acceptance:* Route tests validate every mode over 1000 seeds. Locked modes can't start, guarded in both the UI and App. soulsFromRun applies the multiplier (unit test). Simulated room counts per mode fall in 13-16 (Short), 20-24 (Standard) and 34-40 (Long).
- **Graph scaling per mode** — Column counts and guaranteed rooms adapt to the mode. Short acts still guarantee a shop and a rest within 4-5 columns, and Long acts add a guaranteed treasure node.
  - *Implementation:* generateFloorGraph takes its opts from the ActSchedule entry. The hardcoded shop and rest guarantee code becomes a general `guarantees: {kind, minCount, columnRule}[]`.
  - *Acceptance:* Graph tests run for every mode over 600 seeds. All guarantees hold, column counts are within range, and every node is reachable.
- **Tower of Trials core loop** — Each round is one arena room; clearing every wave rings the bell and you climb. The biome changes every 5 rounds: Gate (1-5), Catacombs (6-10), Reservoir (11-15), Library (16-20), Clock Tower (21-25), Throne (26-30). Bosses appear on round 10 (Gorehorn), 20 (Rune Colossus) and 30 (Count Vlador, remixed with that band's hazards). After every 5th round comes an Intermission: one room with a campfire, merchant and anvil. Level-ups and cards work as in the campaign.
  - *Implementation:* New src/game/tower.ts with `Tower {round, band}`, `depth(round) = 0.075·round` (2.25 at round 30) and `roundSeed = hashCombine(runSeed, 0x70a3, round, attempt)`. New src/gen/arena.ts with `generateArena(seed, ctx)`: 4 arena prefabs (Oval, Cross, Pillar Ring, Gear Floor) with transforms, the band biome's hazards at 0.7 density, one sealed entrance and a bell-door exit. Each round has `3 + floor(round/8)` waves with a budget of `budgetMul(depth) × 1.2`. App sends exit events to `tower.nextRound()` instead of the graph. The World sim is unchanged.
  - *Acceptance:* Rounds 1-30 match pinned fingerprints. Boss rounds spawn the correct boss. Every Intermission contains a campfire, merchant and anvil. A god-mode scripted run clears rounds 1-30 with no soft-locks.
- **Round HUD pill and 'Beyond the Bell'** — The HUD shows a pill in the reference's style: rounded, ink-outlined, gold numerals reading 'Round 3/30'. Boss rounds open with a skewed 'ROUND 10 · EPIC BOSS FIGHT!' banner. After round 30 (the 'Long Night' ending from Epic 7), Beyond the Bell continues: a random biome per round, depth +0.15 per round, a boss every 5 rounds with boss HP compounding by 25% each time, and a pill reading 'Round 34 ∞'.
  - *Implementation:* Add `setRoundPill(round, max|null)` to src/ui/hud.ts, reusing the HP and ATK pill CSS, plus a skewed 'boss' banner variant. The post-30 rules live in tower.ts and rely on the damage taper from Epic 1.
  - *Acceptance:* The pill updates with no layout shift (fixed width per digit count). After round 30 the run continues and the pill shows ∞. dmgMul at round 60 is ≤ 3.0× round 1.
- **Scoring and local leaderboards** — Tower score = round × 1000 + kills × 10, plus 250 for each round cleared without a hit, plus a time bonus of max(0, 90 − seconds) × 5 per round. The top 10 scores per seed are kept, with a separate Daily Tower board. The end screen shows your rank, personal best and a share string containing the seed and score. There is no backend.
  - *Implementation:* src/game/score.ts holds pure functions. Scores are stored in IndexedDB under 'tower:<seed>' through save/db.ts and trimmed to 10. S.endScreen gets a tower variant. The share string goes to the clipboard, falling back to selectable text.
  - *Acceptance:* Unit tests cover the score function. Boards persist across reloads and keep 10 entries. Replaying the same seed with the same scripted inputs gives an identical score (sim test).
- **Dailies per mode and the Weekly Gauntlet** — Every mode gets a daily seed (Daily Sprint, Daily Full Moon, Daily Tower). The Weekly Gauntlet uses a fixed route plus 2 rotating Curse modifiers, for example 'Glass Hearts' with 'Bell Fever' (the bell tolls every 5 s).
  - *Implementation:* onDaily in app.ts seeds with `hashString('daily:' + mode + ':' + Y-M-D)`. The weekly seed is `hashString('weekly:' + ISOYear + '-W' + week)`, with modifiers picked from STREAM.events and the route forced through the route code mechanism. Trap intensity is locked to Normal.
  - *Acceptance:* With a mocked Date, two clients produce identical first-room fingerprints for every daily mode. A new ISO week changes the weekly seed.
- **Long-session robustness** — 60-minute runs and 100-round towers must not leak memory or slow down. They save after every room and every round, and survive the browser killing the tab.
  - *Implementation:* RunSave v2 stores the mode, tower.round and endless modifiers. A Node soak test performs 300 room loads and checks heap growth and listener counts. The RoomView.destroy audit includes the TilingSprite textures from Epic 3.
  - *Acceptance:* The soak test shows heap growth < 5 MB. Reloading mid-tower resumes the same round with the same arena fingerprint. A debug counter shows the renderer's texture count holds steady across 100 transitions.

**Depends on:** EPIC 1 depth curves; EPIC 2 act schedule and route codes; EPIC 3/4 arena hazards and prefabs (the Tower can launch with plain arenas); UI: mode select step, round pill, leaderboard screen; META: unlock rules, souls multipliers, the 'Long Night' ending flag; BOSS: remixed boss variants for the Tower
**Risks:** Four modes multiply balance testing. Share the depth curves, and give Short and Long the same final-act difficulty as Standard.; In endless mode, stacked cards can trivialise rounds past 30. Tune compounding boss HP and the damage taper with autoplay simulations.; Local-only leaderboards raise cheating questions. Label them as local, and put the seed in the share string so a score can later be checked by replay.
**Constraint check:** There is no backend: leaderboards live in IndexedDB, and daily and weekly seeds come from date hashes. Tower rounds derive from runSeed + round + attempt through an isolated salt. Arenas reuse the room-entry generation pipeline, and the HUD pill is DOM and CSS. Bundle grows about 8 KB gzipped. All input methods work.

**Review notes:**
- *feasibility* (revise, effort L): Keep modes and the Tower of Trials, and absorb ENM-7's Boss Rush. Dailies per mode, the Weekly Gauntlet and leaderboards duplicate MET-7 and SOC-5. Endless rounds need HP clamps and a soak test.
- *player* (revise, effort L): Run-length choice and Tower of Trials suit mobile sessions and echo the reference 'Round 3/30'. Absorb ENM-7's Boss Rush; weekly gauntlet belongs to MET-7. Four modes is L.
- *completeness* (revise, effort L): Four modes, Tower of Trials, per-mode dailies, a weekly gauntlet and leaderboards is L. Dailies overlap MET-7/SOC-2 and boards overlap SOC-5.

#### MET-7 · 7. The Moon Calendar: daily and weekly seeded challenges

*Meta-progression, economy & hub · effort L · impact 4/5*

Turn 'Daily Moon' into a real ritual. Each UTC date sets one class, two mutators and three Curse candles; you get one ranked attempt with a deterministic score, a moon-phase calendar of medals, streaks, and shareable result cards that friends can compare without a server. Zaza's weekly 'Eclipse' and Helga's bounties add longer goals. **Player value:** A reason to open the game every day, a fair shared puzzle ('Today: Code Weaver, Bat Night + Midas Touch, Curse 3'), bragging rights through share codes, and trial runs of locked classes.

- **Deterministic challenge generator** — The daily key is the zero-padded UTC date and the weekly key is the ISO week. Both are fully defined by the key: seed, class (including locked classes as a 'trial'), 2 mutators, 3 candles, and standard rules with no Blessings.
  - *Implementation:* New src/meta/challenges.ts: dailyChallenge(key) gives seed = hashString('ck:daily:v2:' + key) and rng = Rng(hashCombine(seed, STREAM.challenge = 8)) for the class pick, mutator picks without repeats, and candle ranks totalling 3-5 points. weeklyChallenge(isoWeek) picks from a curated rotation. Today's legacy key in app.ts:277 is not zero-padded; it is kept for legacy records only.
  - *Acceptance:* Golden test: '2026-10-14' always yields the same class, mutators, candles and first-room spawn plan hash in Node and browser. Day boundaries follow UTC, and the UI shows a local-time countdown to the next moon.
- **Mutator library** — Run-rule twists distinct from Curse: Bat Night (all non-boss spawns become Blood Bats, budget ×1.4). Holy Week (card pool limited to HOLY and untagged cards; Holy Relics forced on). Glass Hunter (×2 damage dealt and taken). Midas Touch (×2 gem drops, ×2 shop prices). Fog of the Moor (minimap and room labels hidden). Familiar Frenzy (start with Bat Familiar and Phase Satellites). Iron Curtain (shop nodes become combat, +1 chest per elite). Pilgrimage (no Sanctuary nodes, big hearts ×2).
  - *Implementation:* New src/meta/mutators.ts: MutatorDef {id, name, icon, desc, apply: (rules) => void} writes fields into RunRules (spawnOverride, cardFilter, dmgDealtMul, dmgTakenMul, gemMul, priceMul, hudFlags, nodeRemap, startCards). Node remaps are a post-pass over graph node types with no extra layout RNG; remapped rooms differ by design because sizeFor depends on type, while all other rooms stay identical. Consumers: spawner, offerCards (filter), World damage paths (multipliers read once per room), loot, hud.ts.
  - *Acceptance:* Each mutator has a test of its effect (Bat Night: every non-boss SpawnEntry has def === ENEMY.bat; Holy Week: 1,000 offers contain only HOLY or untagged cards). With no mutators, output is identical to standard rules (golden hash). Iron Curtain leaves non-shop rooms byte-identical.
- **Ranked attempt, practice and scoring** — The first attempt per key is ranked; later ones are practice. The score is deterministic: 5,000 per boss + 300 per room + 10 per kill + 150 per elite + victory time bonus max(0, 1800 − s) × 5 − 20 per hit taken, all × (1 + 0.1 × Curse).
  - *Implementation:* profile.core.challenges[key] = {ranked: RunRecord ref, best, attempts}. Ranked status is stored in RunSave (mode, challengeKey, ranked), so Continue keeps it. Abandon finalises the score. The end screen 'Retry' becomes 'Practice (unranked)' for challenge modes. scoreFor(tally, record, rules) lives in challenges.ts.
  - *Acceptance:* Closing the tab mid-ranked run and continuing keeps ranked. A second start is practice and does not overwrite the ranked score. The score recomputed from the stored record equals the stored score. The same seed and intent replay give the same score (sim test with a scripted intent stream).
- **Moon Calendar screen, medals and streaks** — A month grid where each day shows its moon phase (code-drawn SVG) and a medal: bronze for beating the first boss, silver for the second, gold for a victory, crimson for a victory with 3 or fewer hits. A streak counter counts consecutive UTC days with a ranked attempt and pays 3/7/14/30-day rewards (50/150/300 souls, the Moon Halo headwear). One 'Moon Ward' earned per 7-day streak forgives a missed day.
  - *Implementation:* calendarScreen in metaScreens.ts computes the phase with a simple synodic-month formula from the date (29.53 days, epoch 2000-01-06). Streak logic is in challenges.ts updateStreak(prevKey, key, wards).
  - *Acceptance:* The streak increments on consecutive days and resets after a gap unless a ward is spent. The medal shown matches the ranked record. Phases render for any month 2020-2040 without errors (property test).
- **Share card and backend-free friend compare** — A copyable result code, CK1·D2026-10-14·weaver·S18420·F3·T21:14·#a9f3, plus a runtime-drawn share image showing the class portrait, score, mutator badges and moon, shared through the native share sheet on phones or downloaded on desktop. Pasting friends' codes builds a local 'Rivals' board for that day.
  - *Implementation:* In challenges.ts, encodeResult/decodeResult with a hashString checksum over the fields and the challenge key. shareImage(record) draws to an offscreen Canvas2D (portrait, ink outlines, text) and calls canvas.toBlob, then navigator.share({files}) when canShare, else a download. The image is generated at runtime, not shipped. Rivals are stored in profile.core.rivals[key] (capped at 20).
  - *Acceptance:* Codes round-trip. A tampered checksum shows 'unverified'. The image generates in under 100 ms on desktop and the dist/ build contains no raster files. It works offline, and codes for a different day go to that day's board.
- **Weekly Eclipse and Helga's bounties** — A weekly curated run ('Eclipse of the Bat King: Bat Night + Swift Shadows 2 + Thin Veil') with best-of-3 ranked attempts, plus 3 weekly bounties seeded by ISO week, such as 'Slay 150 Ghouls', 'Clear 5 elite rooms without taking damage' or 'Win with Code Weaver at Curse 4+', that pay souls and cosmetics.
  - *Implementation:* weeklyChallenge(isoWeek) and bounties(isoWeek) use Rng(hashCombine(hashString(week), STREAM.challenge)) over a BountyDef table whose progress functions read tally and record. Progress merges at runEnd into profile.core.bounties[week]. The bounties are shown on the Guild Board (hub) or in the menu.
  - *Acceptance:* Bounties are deterministic per ISO week. Progress persists across sessions and reloads. Each reward is granted exactly once. Week rollover archives the previous week's progress.
- **Optional leaderboard adapter seam** — A typed provider interface so a later Tauri/Steam or serverless adapter can publish scores. The default is local-only, so no backend is ever required.
  - *Implementation:* src/meta/leaderboard.ts declares interface LeaderboardProvider {submit(record): Promise<void>; fetch(key): Promise<Entry[]>}, with LocalProvider reading rivals and history. It is chosen at boot, with no network calls unless a provider is injected.
  - *Acceptance:* The build passes and the game works with no network (PWA offline test). Swapping in a mock provider in tests receives exactly one submit per ranked run.

**Depends on:** COMBAT/AI: mutator hooks for damage multipliers and spawn overrides (read-only multipliers); optional AI mutators later; TEC/PLATFORM: clipboard, Web Share API and file-share wrappers; optional Tauri/Capacitor bridge for native share; ART: moon-phase and mutator badge icons; share-card layout; UI: calendar grid and rivals list; Depends on Epic 3 (RunRules), Epic 4 (candles), Epic 1 (records); Epic 5 hosts it at Zaza's tent
**Risks:** Local clock manipulation. Accept it (scores are local), label unverifiable results, and record the key used.; Timezone confusion. Everything is UTC with a clear local countdown.; Mutators that remap nodes could break determinism assumptions. Golden tests cover every mutator.
**Constraint check:** Everything runs offline with no required backend. Seeds come from hashString plus hashCombine on a dedicated STREAM.challenge, with no Math.random in generation. Mutators are rule fields read at spawn or room granularity, so the hot loop stays allocation-free. Share images are runtime Canvas2D, not shipped rasters. Estimated +10 KB gzipped.

**Review notes:**
- *feasibility* (keep): Absorb SOC-2's Daily v2 and Weekly Rite and BIO-6's weekly gauntlet. Fair dailies across devices need TEC-3's dmath and a device-independent enemy cap.
- *player* (keep): Daily ritual is a cheap retention win on mobile. Absorb SOC-2's Daily Moon v2/Weekly Rite and BIO-6 weekly gauntlet. Mutators should be MET-4 candles, not a second library.
- *completeness* (keep): Canonical dailies; absorb SOC-2's Daily Moon v2 and Weekly Rite and BIO-6's per-mode dailies. Stamp a build fingerprint so cached PWA versions don't produce different dailies.

#### CLS-5 · Class Mastery & Feats

*Classes, characters & companions · effort M · impact 4/5*

Every run feeds a per-class Mastery level (1–20), with a reward track of alt abilities, talent nodes, skins, heirlooms, titles and frames, plus five Feats per hunter. **Player value:** Long-term goals for each hunter, a reason to play all nine, and the satisfying green 'Lv. 7' EXP pill from the reference on every class card.

- **MetaSave v2 & safe migration** — Adds a per-class mastery, records, feats, pets, loadouts and cosmetics schema with a real migration.
  - *Implementation:* meta.ts: version 2 with `mastery: Record<ClassId, {xp, level, claimed: number[]}>`, records, feats, pets, loadouts and cosmetics. A pure migrateMeta(raw) replaces app.ts's shallow spread. Before the first v2 write, the v1 blob is copied to the key 'meta.v1.bak'.
  - *Acceptance:* v1 fixtures (3 classes, 2 packs, statBonus, history) migrate losslessly. Migration is idempotent. Corrupt fields fall back to defaults without throwing.
- **Mastery XP & curve** — XP = 10×rooms + 40×elites + 120×bosses + 250 for a victory + 2×level reached, with abandoned runs at 50% and daily seeds at ×1.5. Lv n needs 300·n^1.35 XP, so Lv 20 takes about 30 runs.
  - *Implementation:* meta.ts masteryFromRun(stats: RunStats), a pure function called in endRun next to soulsFromRun.
  - *Acceptance:* Formula unit tests pass. Runs shorter than 2 rooms grant 0 (anti-farm).
- **20-step reward track per class** — Example track: Lv 2 talent node, Lv 3 Alt Ability A, Lv 4 skin #2, Lv 5 heirloom #2, Lv 7 Alt Primary, Lv 8 title ('Bonecrusher', 'Moon-Touched'…), Lv 10 skin #3 and silver frame, Lv 12 Alt Ability B, Lv 15 skin #4, Lv 20 Gilded skin, gold frame and the title 'Legend of the Keep'.
  - *Implementation:* src/game/masteryRewards.ts holds the data tables. Rewards are claimed automatically on level-up and stored in mastery.claimed.
  - *Acceptance:* A test checks that every class has exactly 20 entries and every referenced ability, skin and heirloom id exists.
- **Per-class records & Hall of Hunters** — Tracks best floor, fastest victory (sim time), biggest single hit, most kills and highest level per class, shown on class cards and in a Hall of Hunters screen.
  - *Implementation:* Records update in endRun from RunStats. screens.hallScreen renders them.
  - *Acceptance:* Records survive a reload and change only when beaten. Times are shown as mm:ss computed from run.elapsed.
- **Feats (5 per hunter)** — Deterministic per-run challenges, each paying 50 souls plus a cosmetic. Examples: Vanguard 'Juggernaut' (stun 60 enemies with Shockwave Dash in one run). Weaver 'Event Horizon' (catch 15 enemies in one Singularity). Phantom 'Unseen' (clear Castle Gate taking no damage). Hunter 'Time Out' (kill 10 enemies inside one Stopwatch). Aegis 'Mirror Match' (kill Count Vlador with a reflected blood bullet). Abbess 'Undying Faith' (trigger Last Rites and still win).
  - *Implementation:* Feat predicates run over RunStats plus kit-emitted counters (a fixed enum index, so no allocation). They are evaluated at room clear and at run end.
  - *Acceptance:* Each feat has a unit test using synthetic stats. A feat is never awarded twice, and awards persist through migration.
- **Mastery ceremony** — The end screen fills a green class EXP pill and shows a skewed 'MASTERY UP!' banner and reward cards.
  - *Implementation:* Extend screens.endScreen with CSS transitions. Any input skips, and the reduced-motion setting disables the tween.
  - *Acceptance:* The ceremony is skippable on every input device. With reduced motion on there are no tweens; the final values show instantly.

**Depends on:** META/save domain: shared v2 schema owner if one exists; ACHIEVEMENTS domain: feats can reuse a global achievement predicate system; UI domain: banner and pill components
**Risks:** Grind perception; Lv 1 kits stay complete and unlocks are sidegrades; Migration bugs corrupting saves (v1 backup key plus fixture tests); Reward pacing for players who main one class
**Constraint check:** Meta-only code with no sim impact. Evaluation is a pure function of deterministic run stats. Saves stay in IndexedDB with the in-memory fallback, no backend. About +4 KB gzipped.

**Review notes:**
- *feasibility* (revise): Keep the mastery track. MetaSave v2 belongs to TEC-4, and Feats should be MET-6 achievement predicates. Snapshot mastery-gated kit options for daily fairness.
- *player* (revise): Mastery tracks drive retention, but feats duplicate MET-6 achievements and MetaSave v2 belongs to TEC-4. Keep a lean 10-step track that feeds CLS-6 and CLS-7 unlocks.
- *completeness* (keep): Fine. Reuse MET-6's achievement predicates for Feats and TEC-4's registry for MetaSave v2 rather than owning another migration.

#### CLS-6 · Arsenal: Alternate Abilities, Loadouts & Signature Cards

*Classes, characters & companions · effort L · impact 4/5*

Mastery unlocks alternate primaries and abilities, a pre-run loadout panel, heirloom starting relics and class-exclusive signature cards. **Player value:** Lets players tune their favourite hunter to their style (melee brawler vs safe zoner) and makes card offers feel tailored to the class.

- **Alternate abilities (2 per slot per class)** — Vanguard: 'Aegis Leap' (leap 220 u to the aim point, then a 140 r shockwave that stuns 0.8 s) or 'Crimson Banner' (an 8 s banner giving +25% attack speed and 3 HP/s within 160 r). Weaver: 'Moonfall' (3 meteors, each with a 0.6 s telegraph, 220% in 70 r) or 'Rune Prison' (a 120 r ring that roots non-bosses for 2 s). Phantom: 'Fan of Knives' (a 16-dagger ring at 80%) or 'Smoke Bomb' (2 s stealth: enemies lose track and wander). The new hunters get equivalents, e.g. Hunter's 'Rosary' wipes all enemy bullets.
  - *Implementation:* Ability ids are handled inside each kit's onAbility by a switch on the equipped id (no closures). Meteors use HAZ.TELEGRAPH with team 0. Smoke Bomb sets w.playerHidden, which enemyAi treats as 'wander to last-known position'.
  - *Acceptance:* Every alt runs in the harness without errors and lands within the class band. During Smoke Bomb no enemy fires a projectile at the player.
- **Alternate primaries** — Vanguard 'Halberd Thrust' (120 u narrow pierce, 34 damage, 0.6 s). Weaver 'Moonbeam' (hold fire for a 360 u channelled beam, 9 ticks/s at 30%). Phantom 'Shuriken' (one star that bounces twice).
  - *Implementation:* Kit primary handlers keyed by primaryId. Moonbeam uses a segment query per tick (shared capsule helper) and renders one stretched beam Graphics.
  - *Acceptance:* Moonbeam deals no damage through walls (w.los check). Its tick cost with 140 enemies is < 0.05 ms.
- **Loadout panel at class select** — Choose primary, A1, A2 and heirloom per hunter; the choice is remembered. A 'Random' button picks a loadout seeded from the run seed. Daily seeds force a loadout derived from the date for fairness.
  - *Implementation:* Add screens.loadoutPanel inside the classSelect carousel. Choices are stored in MetaSave.loadouts[cls]. The random/daily pick uses hashCombine(seed, STREAM.loadout). RunSave stores the loadout ids.
  - *Acceptance:* The same daily seed gives every player the same loadout. A continued run restores its loadout exactly. Locked options show their Mastery requirement.
- **Heirlooms (starting relic choice)** — Three per class replace the fixed startCore. Vanguard: Ember Heart (+15 HP), Oathkeeper Crest (+6 ARM, −5% move) or Bone Reliquary (start with a random HOLY card). Weaver: Moon Heart, Astrolabe (+1 orb, −15% orb damage) or Witch's Cat Bell (pet +2 levels this run). Phantom: Ember Heart, Raven Feather (+1 dash charge) or Poisoned Vial (daggers apply a 3 s bleed).
  - *Implementation:* equipment.ts adds `heirloom: true` items in the core slot, excluded from rollItem. Player's constructor takes the loadout's heirloom. The Bone Reliquary card draw uses STREAM.cards.
  - *Acceptance:* Heirlooms never appear in shops or chests. Bone Reliquary gives the same card for the same seed and attempt.
- **Signature cards (5 per hunter)** — Class-exclusive cards, e.g. Vanguard 'Unbreakable Oath' (Shockwave Dash grants 30% damage reduction for 2 s), Weaver 'Gravitational Lensing' (orbs passing a well split ×2), Phantom 'Twin Moon' (Shadow Step smokes both the start and end points), Hunter 'Triple Crash' (sub-weapons throw 3 for 3× hearts), Dhampir 'Sanguine Waltz' (each 3rd rapier hit refunds 5 blood), Alchemist 'Volatile Mixture' (reactions +50% radius), Abbess 'Great Bell' (Toll every 3rd swing), Warden 'Alpha Howl' (Rally also grants pets 3 s of frenzy), Aegis 'Shield of the Sun' (reflected projectiles ignite).
  - *Implementation:* cards.ts: CardDef gains `cls?: string[]` and `ability?: string[]`. offerCards filters by class and equipped ability ids and gives signature cards a 1.3× weight. The SIGNATURE tag gets a crimson card frame in styles.css.
  - *Acceptance:* A 10k-offer property test never shows another class's signature card. Each class's effective pool is 32 ± 3 cards.
- **Loadout-aware HUD & first-use tips** — Ability tiles show the equipped ability's icon and name. The first time an alt is equipped, a one-line toast explains it.
  - *Implementation:* hud.setClass becomes setLoadout(loadout). MetaSave tracks seen-tips flags.
  - *Acceptance:* Icons match the equipped ids on all three input methods. Each tip shows once per profile.

**Depends on:** Epic 1 (ability slots and kits); Epic 5 (unlock gating); ENEMY/AI domain: wander and root states for Smoke Bomb and Rune Prison; UI domain: carousel and panel components
**Risks:** Combinatorial balance (3 primaries × 3 × 3 × 3 heirlooms per class); the harness iterates all combinations nightly; Card pool dilution, avoided by scoping signature cards to their class; Daily-seed fairness when players own different unlocks (daily picks only from base options)
**Constraint check:** Alternates are switch-dispatched handlers in existing kits with no extra allocation. Loadout randomness comes from STREAM.loadout and is stored in RunSave, so runs replay exactly. About +10 KB gzipped. No new input bindings beyond Epic 1's slots.

**Review notes:**
- *feasibility* (revise): Absorb BLD-8's alternate primaries. Heirlooms duplicate MET-3's Heirloom Rack; keep one. A nightly harness over all combinations grows combinatorially, so sample instead.
- *player* (keep): Hades-style aspects add depth per class without new buttons. Absorbs BLD-8 weapon families as alternates and MET-3's heirloom rack. Dailies must use base kits.
- *completeness* (revise): Heirlooms appear in CLS-6, MET-3 and BLD-7, and primaries overlap BLD-8. Keep alternate abilities and signature cards; move heirlooms to MET-3.

#### CLS-7 · Wardrobe: Code-Drawn Skins, Accessories & Dyes

*Classes, characters & companions · effort M · impact 3/5*

Refactor hero and pet art to palette tokens, then ship 4–5 code-drawn skins per hunter, head accessories, weapon-trail tints, custom dyes and a Wardrobe screen with a live preview. **Player value:** Self-expression and visible proof of mastery (the Gilded skin), earned through play with no monetisation, while staying readable against red enemies.

- **Palette-token refactor** — Hero draw functions take a HeroPalette instead of hex literals.
  - *Implementation:* HeroPalette = {primary, primaryShade, primaryHi, secondary, trim, skin, hair, eyes, metal, glow}. drawVanguard/drawWeaver/drawPhantom (and the new heroes) take (p: Pen, pal). The default palettes reproduce today's literals. ShapeCache.heroes becomes a lazy, memoised `hero(cls, skinId)` Map. The flash silhouette context stays shared per class because 'w' mode ignores colour.
  - *Acceptance:* Default-skin portrait canvases hash identically to pre-refactor. Building a new skin's contexts takes < 4 ms once and never per frame (counter test).
- **Skin catalogue** — Vanguard: Crimson Crusader (default), Silver Paladin (white plate, blue plume), Obsidian Revenant (black plate, ember visor glow), Pumpkin Knight (orange plume, jack-o'-lantern emblem; October event), Gilded Champion (Mastery 20). Weaver: Moon Witch, Sun Priestess (gold-white robe, red hair), Frost Sibyl (ice-blue), Void Astronomer (indigo robe with runtime-generated star speckles). Phantom: Night Stalker, Crimson Ronin (red cloak, straw hat), Bone Mask, Moth Prince (pale green). Each new hunter ships with 4 of its own.
  - *Implementation:* src/render/art/skins.ts holds palette data. Void Astronomer's speckle pattern is drawn once to a canvas and turned into a Texture for a masked fill on the robe part.
  - *Acceptance:* All skins render in the portrait test without errors. Every skin id referenced by a mastery or feat reward exists.
- **Accessory layer & weapon trails** — Hats and ears (witch hat, bat hairclip, cat ears, tiny crown, halo, pumpkin head) attach at a per-class head anchor. Weapon-trail tints recolour the slash arc and projectile glow.
  - *Implementation:* HERO_ART gains `headAnchor: [x, y, scale]`. Accessories are shared contexts added as children of playerBodyWrap so they inherit bob and squash. The trail tint overrides the fx.slash colour and PROJ_GLOW per player projectile at render time only.
  - *Acceptance:* Accessories follow facing flips and squash for all 9 classes. A trail tint changes no sim value (state hash unchanged).
- **Readability guard** — Skins must never read as enemies or elites.
  - *Implementation:* tests/skins.test.ts computes, per skin, ≥ 3:1 luminance contrast of the dominant fill against the ink outline, and ≥ 25° hue distance from enemy red 0xe8344e and elite gold 0xffc23d unless the optional player ring is on. Settings get a 'Player ring' toggle (a soft cyan ellipse under the hero).
  - *Acceptance:* The test fails on a deliberately enemy-red skin. The ring toggle persists and draws a single shared context.
- **Custom dyes** — Pick primary and secondary colours from a curated 16-swatch gothic-cartoon palette; shade and highlight are derived automatically.
  - *Implementation:* A tiny OKLab utility in src/render/color.ts shifts lightness ±0.12 to derive the shade and highlight. The readability validator runs live and rejects unreadable combinations with a message.
  - *Acceptance:* Every allowed swatch pair passes the guard. A rejected pair shows its reason, and the dye saves into MetaSave.cosmetics.
- **Wardrobe screen (heroes & pets)** — Live rotating preview, lock reasons ('Mastery 10', 'Feat: Unseen', '200 souls') and pet skins (Pip: Lemon, Strawberry, Mint, Storm; Ember: Ember, Azure Flame, Void).
  - *Implementation:* screens.wardrobeScreen uses renderer.portrait(cls, size, skin, accessory) (extended signature) on a cached canvas. Selection goes in MetaSave.cosmetics and is applied at startRun. RunSave keeps only a display skin id.
  - *Acceptance:* Fully navigable by gamepad and touch. The preview regenerates only on change. Skin choice provably does not affect the sim state hash.

**Depends on:** Epic 5 (unlock sources), Epic 2 (pet skins); ART domain: coordinate draw-function signatures if a limb rig lands; UI domain: screen layout components
**Risks:** Art regressions during the token refactor (portrait hash test); GPU memory from many skin contexts; only build owned and equipped skins, about 30 KB each; Seasonal skins need a date check; use the local date only for display, never the sim
**Constraint check:** Palettes are numbers and accessories are vector contexts built once; the only runtime texture is the generated speckle canvas, with no image files. Zero sim impact, so determinism is untouched. About +5 KB gzipped. Works on every platform.

**Review notes:**
- *feasibility* (keep): The palette-token refactor is the engineering core; share tokens with ART-2's colorblind LUT. Absorb MET-8's catalogue. Build contexts lazily, only for owned skins.
- *player* (revise, effort L): Low player-impact cosmetics; absorb MET-8 so there is one wardrobe. The palette-token refactor shares work with ART-2. 4–5 skins across 9 hunters is L.
- *completeness* (keep, effort L): Canonical wardrobe; absorb MET-8. Base the palette-token refactor on ART-2's semantic tokens. One catalogue, one screen, hosted at Velvet's caravan.

#### MET-8 · 8. The Velvet Wardrobe: cosmetics

*Meta-progression, economy & hub · effort L · impact 3/5*

About 60 code-drawn cosmetics earned through play: class palettes, headwear, familiar skins (the yellow puffball Pip and the fire imp Ember), dash trails, death effects, HUD skins and titles. Velvet the bat-winged seamstress sells the rest for souls as a long-term sink. **Player value:** Self-expression and visible proof of mastery ('Pumpkin Paladin Vanguard wearing the Moonslayer title with a Blood-Moon trail'), plus a souls sink once the Litany is complete. None of it affects gameplay.

- **Cosmetic catalogue and unlock sources** — Slots: palette per class, headwear, familiar skin, dash trail, death effect, victory banner, HUD skin, title, and title-screen variant. Each cosmetic has one source: achievement, Curse threshold, bestiary mastery, daily streak, NPC rescue, or a soul purchase at Velvet for 80-400 souls.
  - *Implementation:* New src/meta/cosmetics.ts: CosmeticDef {id, slot, name, cls?, source: {achievement|heat|mastery|streak|rescue|souls}, params}. Equipped loadouts per class (3 slots) are stored in profile.core.cosmetics. The RunRecord stores the snapshot for share cards and the Hall of Records.
  - *Acceptance:* A catalogue test checks every source reference resolves to an existing id (achievement, enemy, heat level, NPC), there are no duplicate ids, and every class has at least 3 palettes. Purchases deduct the exact souls.
- **Class palette swaps** — Vanguard: Crimson Plate (default), Silver Templar, Obsidian Knight, Pumpkin Paladin. Weaver: Moon-Witch (default), Sunfire Sorceress, Abyss Weaver. Phantom: Night Stalker (default), Fog Cloak, Bloodmoon Ronin. The ink outline and cel highlight rules are kept.
  - *Implementation:* ART work: drawVanguard/drawWeaver/drawPhantom in render/art/characters.ts accept a HeroPalette {fill, shade, accent, trim, eye}, with defaults equal to today's colours. ShapeCache (render/shapes.ts) builds hero GraphicsContexts for the equipped palette once at run or hub load (keyed cls+palette) and disposes the previous set. GameRenderer.portrait uses the palette.
  - *Acceptance:* Default palettes are pixel-identical to today (headless screenshot diff). Switching palette constructs hero contexts exactly once (counted). A readability check confirms no palette's main fill is within ΔE 15 of Blood Bat or Skeleton fills.
- **Headwear and familiar skins** — Headwear: Witch Hat, Crown of Night, Pumpkin, Bat Ears (Blood Bat mastery), Moon Halo (streak), Gorehorn Horns (flawless Gorehorn). Familiar skins replace orbital visuals: Pip the yellow puffball, Ember the fire imp (drawImp already exists), Lantern Ghost, Tiny Gargoyle.
  - *Implementation:* Overlay GraphicsContexts are parented to playerBodyWrap with a per-class head anchor, so they inherit the existing bob, squash and transform animation. The familiar view in the renderer picks its context from the equipped skin. Contexts are built once in ShapeCache.
  - *Acceptance:* Headwear follows bob and squash with no frame jitter (screenshot sequence). All orbitals use the equipped familiar skin. No per-frame allocation (renderer frame heap-delta check).
- **Trails, death and victory effects** — Dash trail tints (Holy Gold, Blood Red, Moon Blue, Candy Rainbow cycling 6 hues), death effects (bat burst, rose petals, coffin drop), and victory banner styles ('DAWN BREAKS!' in skewed gold, matching the 'EPIC BOSS FIGHTS!' banner style).
  - *Implementation:* Pure FX parameters. RenderFx and playerCombat moonDash/dash trail colours read a cosmetic tint passed in at run start. Death effects are scripted bursts in App on 'died' using the existing particle pools. Banner styles are CSS classes on hud.banner.
  - *Acceptance:* Effects use existing ParticlePool budgets (no new pools, total within preset maxParticles). Disabling screen shake also disables any shake inside a cosmetic. The simulation state hash is identical with any cosmetic equipped.
- **HUD skins and titles** — HUD skins: Lavender Tiles (default, matching the reference), Crimson Velvet, Bone & Brass, Stained Glass. Titles appear on the end screen, the hub nameplate and share cards ('Batmaster', 'Moonslayer', 'Good Shepherd').
  - *Implementation:* CSS custom properties on #hud and .screen (--pill-fill, --pill-edge, --tile-fill, --banner-fill) are set from the skin, in styles.css. Titles are stored in the profile and rendered by the endScreen, nameplate and shareImage.
  - *Acceptance:* Switching skin only changes CSS variables (no HUD DOM rebuild, verified by a MutationObserver). A unit test computing WCAG contrast from the token values confirms every skin keeps text contrast at 4.5:1 or higher.
- **Wardrobe screen (Velvet's Caravan)** — A mannequin preview of the hero with the selected cosmetics, rotating gently, plus 3 loadouts per class, a 'Randomize' option, and lock hints that say how to earn each item.
  - *Implementation:* wardrobeScreen in metaScreens.ts uses a live preview canvas rendered by GameRenderer.portrait with a cosmetics parameter, re-rendered only on change. Randomize uses freshSeed() (UI only, not generation). It is gamepad navigable through Nav.
  - *Acceptance:* The preview updates within 50 ms of a change. Loadouts persist across reloads. Locked items show their source ('Win at Curse 20'). Purchases at Velvet go through confirmScreen and deduct the exact soul cost.

**Depends on:** ART: parameterised hero palettes in render/art/characters.ts; headwear and familiar-skin art; Reaper/coffin death-effect shapes; RENDER: ShapeCache rebuild-on-loadout, portrait helper with a cosmetics parameter; UI: wardrobe layout and HUD skin tokens in styles.css; Depends on Epic 6 (achievements, mastery) and Epic 4 (heat rewards) as unlock sources; Epic 5 hosts it at Velvet's caravan
**Risks:** Art cost multiplies per class × palette. Start with 2 extra palettes per class.; Readability: a cosmetic that hides the hero among enemies. Covered by the ΔE readability check and a ban on red-dominant hero fills.; Bundle growth. Budget each cosmetic at under 400 bytes gzipped, about 25 KB in total.
**Constraint check:** All cosmetics are vector GraphicsContexts or CSS variables built once per loadout and shared, with no image files. They never touch the simulation or RNG streams, so determinism holds. Effects reuse existing particle pools within preset budgets, so 120 FPS desktop and 60 FPS mobile targets are unaffected. Estimated +25 KB gzipped; with the other epics this domain adds about 95 KB, keeping the bundle near 345 KB, well under 1 MB.

**Review notes:**
- *feasibility* (merge → CLS-7): Duplicates CLS-7's Wardrobe. Keep Velvet's Caravan as a storefront for CLS-7; the 25 KB cosmetic budget is fine.
- *player* (merge → CLS-7): Second cosmetics epic duplicating CLS-7's wardrobe, palettes and pet skins. Keep Velvet as the shop front once a hub exists.
- *completeness* (merge → CLS-7): Same cosmetic catalogue and hero palette refactor as CLS-7. Keep Velvet as the storefront.

#### STO-3 · Speak, Monster! Dialogue, Code-Drawn Portraits & Boss Banter

*Narrative, lore & quests · effort L · impact 5/5*

A data-driven dialogue system with typewriter speech boxes, chibi bust portraits with expressions drawn in code, synthesized voice blips, boss intros and outros, and non-blocking barks during fights. **Player value:** Bosses and NPCs feel like characters. Gore and Horn bicker, Vlador complains about his carpets, the Colossus speaks in glyphs. This delivers the reference's 'EPIC BOSS FIGHTS!' energy with personality.

- **Dialogue engine** — Branching conversations with conditions, effects, variable interpolation, and memory of what has already been said.
  - *Implementation:* src/narrative/dialogue.ts: DialogueScript { id; start; nodes: Record<id,{ who: SpeakerId; mood: Mood; text: StringKey; next?; choices?: {label, cond?, effects?, goto}[]; cond?; effects? }> }. A runner yields resolved lines with {gems}, {hunter}, {night} interpolation and richText {highlights}. NarrativeSave.linesSeen chooses between 'first meeting' and 'repeat' variants. Bark pools pick the least recently seen line, with ties broken by STREAM.dialogue.
  - *Acceptance:* Unit tests cover branching, conditions, effects and interpolation. Validation rejects any cycle that has no choice. Given the same profile and the same seed, the same lines are chosen.
- **Chunky speech-box UI** — A bottom speech panel in the reference's HUD style, usable with every input method.
  - *Implementation:* src/ui/dialogue.ts plus styles.css: a 0.22 rem ink border, the portrait inside a lavender tile frame (like the reference's skill tiles), and a pill-shaped name tag in the speaker's colour. Typewriter at 45 chars/s, with a setting for 30/45/90/instant. Confirm (Enter/Space/A/tap) first completes the line, then advances. Holding fast-forwards. Back asks 'Skip conversation?' the first time and skips straight away after that. Choices use the existing Nav focus system. A reduced-motion setting removes letter bounce.
  - *Acceptance:* Works on keyboard and mouse, touch and gamepad (nav tests). No overflow at 640x360 across UI scales -0.25 to +0.25 (Epic 8 layout test). A full conversation can always be skipped in 2 inputs or fewer.
- **Portrait rig with moods** — Bust portraits for 13 speakers (3 hunters, Vlador, Gore and Horn sharing one frame, the Colossus, Mortimer, Sister Candela, Grimsby, Lunette, Old Abelard, Puff, Ignis), each with 7 moods: neutral, happy, angry, smug, scared, sad, shocked.
  - *Implementation:* src/render/art/portraits.ts drawPortrait(p: Pen, id, mood). Moods use parametric parts: brow angle; eyes via Pen.eye with look and pupil scale, or closed '^ ^' arcs for happy; mouth shapes (smile, frown, O, fanged grin); extras (sweat drop, anger vein, blush). The Colossus face swaps a rune glyph per mood. GameRenderer.portrait becomes portrait(id, mood, size), cached in a 24-entry LRU of canvases made with renderer.extract.canvas. Prewarm the cache on room load for the NPC in that room.
  - *Acceptance:* A headless test renders all 13x7 combinations without error. Generating one takes 4 ms or less on a mid-range phone, and a cache hit takes under 0.1 ms. All portraits use the 3 px ink outline of characters.ts.
- **Synthesized voice blips** — Animal-Crossing-style babble with a distinct voice for each character.
  - *Implementation:* src/audio/voice.ts with ZzFX presets: Vlador, a low square at 110 Hz with vibrato; Gore, a 70 Hz noise growl; Horn, a nasal 180 Hz saw; Mortimer, a two-note 'heh'; Candela, a soft 660 Hz sine bell; Lunette, a glassy 880 Hz sine with tremolo; the Colossus, a sub rumble per word; Puff, a 1.2 kHz chirp. One blip every 2 visible characters, on a single voice channel that respects the Audio 30 ms merge and the SFX volume. Settings toggle 'Voice blips'.
  - *Acceptance:* Never more than 1 concurrent voice node. Turning the setting off creates no nodes. No audio files are added.
- **Boss intros and outros** — Short, skippable confrontations before and after each boss. Gorehorn: GORE: 'SMASH TINY MAN!' / HORN: 'Gore, we've discussed this. Tiny PERSON.' The Colossus speaks in glyphs with subtitles, and the Weaver gets a translated variant: 'SEAL INTEGRITY 31%. PLEASE... FIX.' Vlador: 'Welcome to Crimson Keep! Do wipe your boots. No? ...Then I shall wipe the floor with YOU.' After the intro comes a skewed 'EPIC BOSS FIGHT!' banner.
  - *Implementation:* SIM: a World.bossHold flag keeps the boss rising but inactive until App releases it after dialogue. Scripts live in src/narrative/dialogue/bosses.en.ts: a full 3-5 line intro on the first encounter, a 1-line variant afterwards, plus variants by class and by flags ('slippers', 'rude_note', blood debt 3+: 'I can smell my own kind on you'). Outros hook into Epic 6 (Spare Gorehorn) and Epic 7 (Vlador's choice). A setting 'Skip boss intros' is added.
  - *Acceptance:* A sim test shows a held boss deals no damage and runs no AI. First-time intro to fight takes 8 s or less; a repeat takes 2.5 s or less. One input skips the intro.
- **Non-blocking combat barks** — Speech bubbles during fights that never pause play. Vlador at 50% HP: 'My CARPET! Do you know what velvet costs in this economy?'
  - *Implementation:* Hud.bark(speaker, text, seconds) shows a DOM speech bubble under the boss bar, with a mini portrait. Triggers: boss HP crossing 75/50/25% (SIM: World pushes a 'bossPhase' event once per crossing), player HP under 20%, an elite spawning, and multi-kills. Each boss gets 5-8 barks. A rate limit allows one bark per 6 s and none while dialogue is open. Barks are mirrored to an aria-live region.
  - *Acceptance:* World.update allocates nothing for bark triggers: one event push per threshold crossing, verified by the perf test. Limiter unit test. A screen reader announces barks.
- **Hunter quips** — Short class-specific lines on floor entry, room clear streaks, level milestones and low HP. Example from Aldric: 'Grandfather said the carpets were nice. He was not wrong.'
  - *Implementation:* Each class gets 6 lines per trigger in src/narrative/dialogue/hunters.en.ts, delivered through Hud.bark and chosen by linesSeen. A settings toggle 'Hunter chatter' controls them.
  - *Acceptance:* No quip repeats until its pool is exhausted. Turning the toggle off suppresses all of them.

**Depends on:** Epic 1 (NarrativeSave.linesSeen, StoryBus, STREAM.dialogue); ART: portrait busts and mood parts in the characters.ts Pen style (could share work with ART's rig and animation); SIM: World.bossHold and threshold 'bossPhase' events; AUDIO: ZzFX voice presets; UX: new settings (text speed, voice, skip intros, hunter chatter) and Nav integration
**Risks:** Dialogue can break the pace of an action game. Mitigate with 1-line repeat intros, non-blocking barks and skips everywhere.; 13x7 portraits is a lot of art. Ship hunters, bosses and Mortimer first.; extract.canvas can stall on low-end phones. Prewarm during the room fade.; Humour can undercut the menace. Rule: Vlador gets one serious line per intro.
**Constraint check:** Portraits are runtime-generated textures drawn with Pen, then GraphicsContext, then extract.canvas, and cached. That is allowed and works under the Canvas2D fallback. Voices are synthesized with ZzFX. Dialogue is DOM shown while the sim is paused, so the 120 Hz loop is untouched apart from threshold event pushes. About 15 KB gzipped for the engine and UI.

**Review notes:**
- *feasibility* (keep): Fine. Pre-warm portrait extracts during room fades. Voice blips and hunter quips absorb CLS-8's barks. bossHold must be a sim-paused cinematic, shared with ART-6.
- *player* (revise): Boss banter adds personality, but 13x7 portraits is heavy. Hunters and bosses only; intros ride ENM-5; barks rate-limited and non-blocking.
- *completeness* (keep): Good. Portraits for ~13 characters × 7 moods are heavy; share the rig with ART-3. Boss intro lines must slot into ENM-5's single intro timeline.
