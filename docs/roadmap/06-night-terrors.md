# Night Terrors (v0.7) — Bestiary, elites, bosses reborn, statuses and the living score

[← Roadmap overview](../ROADMAP.md)


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

#### ENM-3 · Bestiary I: 15 new monsters and second moves for the original seven

*Enemies, elites & bosses · effort XL · impact 5/5*

Fill the Castle Gate, Bone Catacombs and Moonlit Throne with Castlevania-flavoured archetypes. Each asks the player a different question: dodge the sine wave, flank the shield, kill the support first, or wake the sleeper (or don't). **Player value:** Enemy variety grows from 7 to 22 types, and each floor gets its own cast and threat profile. Runs stop feeling like the same skeleton room three times.

- **Castle Gate pack: Medusa Head, Spear Guard, Zombie, Fleaman, Raven** — - Medusa Head (hp 10, cost 5 per stream of 5): flies a straight lane at 120 px/s with a 48 px sine weave (1.6 s period) and passes through walls. Contact deals 8 damage plus Stone Touch (move ×0.5 for 0.6 s). Tell: a green glint and a hiss at the wall 0.7 s before the stream.
- Spear Guard (hp 60, speed 70, damage 12, cost 3): a frontal shield (100° arc) blocks projectiles with a 'TINK' spark. Thrust: a 0.5 s LINE telegraph (110 × 24 px), then a 140 px lunge, leaving it exposed for 0.7 s. Shockwave Dash breaks its guard for 2 s.
- Zombie (hp 22, speed 45, lurching to 90 every 2 s, damage 9, cost 1): rises in clusters of 5–8 from dirt-mound telegraphs (1.0 s).
- Fleaman (hp 16, cost 1): makes erratic parabolic hops of 90–160 px every 0.45–0.9 s, ignores ground hazards while airborne, and lands with a 30 px splash.
- Raven (hp 12, cost 1): perches on banner or window decor, caws, dives along a 0.45 s LINE telegraph at 520 px/s, then flaps back to its perch.
  - *Implementation:* Add enemyDefs ids 10–14 with brains sineLane, guard (MoveSet THRUST), shamble, hopper and perchDive. The Medusa emitter is a hidden def with an 'emitter' brain: it releases its heads only while its wall is inside the fixed logical view rect (CONFIG.viewTilesW × viewTilesH around the player), then dies. The frontal block lives in hitEnemy and the melee sweep, using SHIELDED_FRONT plus the dot product of facing and hit direction. Fleaman hop height uses the z column, and the renderer offsets bodyWrap.y and scales the shadow. Raven perches come from room.decor via World.perches.
  - *Acceptance:* Medusa Heads stay within ±52 px of their lane centre while crossing wall tiles. A Spear Guard takes 0 damage from 20 frontal Weaver orbs and full damage from behind. Zombies appear only after their 1.0 s telegraph. Fleaman lands on floor tiles in 1,000/1,000 seeded hops. Ravens are back on their perch within 3 s of a dive.
- **Bone Catacombs pack: Mummy, Bone Pillar, Red Skeleton, Ectoplasm, Lantern Wight** — - Mummy (hp 140, speed 40, damage 18, cost 5): starts DORMANT in a coffin anchor and wakes at 200 px or when hit. Bandage Lash: a 0.6 s CONE telegraph (70°, 170 px) that pulls the player 60 px inward. On death, a Bandage Wisp crawls back to the coffin and re-forms the Mummy at 50% HP after 6 s unless the wisp is hit or burned (FLAME synergy).
- Bone Pillar (hp 120 as 3 stacked skulls of 40, cost 4): a stationary turret that blocks its tile. It alternates 5-fireball fan breaths left and right every 1.8 s after a 0.5 s jaw-glow tell. Each skull lost shortens the pillar and its fan. Immune to knockback.
- Red Skeleton (hp 30, cost 2): collapses into a bone pile on death and reassembles in 3.5 s unless hit by HOLY damage or overkilled by a crit for ≥ 40% of max HP.
- Ectoplasm (hp 18, cost 2): drifts through walls and fades to 0.3 alpha when more than 180 px from the player. Its touch deals 6 damage and drains 8 energy. Knockback-immune.
- Lantern Wight (hp 45, cost 4, support): keeps 260 px away from the player. Its green lantern aura (160 px ground ring) gives undead +25% speed and 2% HP/s regen, which makes it the priority target.
  - *Implementation:* Brains: sleeper (MoveSet LASH/PULL), turret, reassemble (UNTARGETABLE flag plus a spawnT-style rise), drifter (wall-pass slide that bypasses w.slide) and supportAura. The aura is a per-wight spatial query that writes E.buffT, so cost scales with wights × neighbours. Coffin anchors come from room.decor coffins (Epic 1 awareness). Room clear ignores bone piles once every other enemy is dead.
  - *Acceptance:* A Mummy wisp re-forms in 6.0 s unless hit. Bone Pillar sides alternate deterministically. A Red Skeleton killed by a Holy Cross never reassembles, and room clear never waits on a pile. Undead inside a wight aura move at exactly 1.25× speed. Ectoplasm never collides with tiles.
- **Moonlit Throne pack: Specter Knight, Phantom Waltzers, Hellhound, Crimson Bride** — - Specter Knight (hp 110, cost 5): fades out over 0.4 s, reappears 120 px behind the player, then swings a 0.5 s CONE sword arc (120°, 95 px). 4 s cooldown.
- Phantom Waltzers (a pair, hp 40 each, cost 4 per pair): two ballroom ghosts orbit each other at 40 px while drifting toward the player. Every 2.4 s of sim time they release a 12-petal ring with a 2-bullet gap. If one dies, the survivor enrages: +50% fire rate plus a petal spiral.
- Hellhound (hp 50, speed 200, cost 3, packs of 3): circles at 150 px. The pack takes turns: a 0.45 s crouch tell, then a 220 px lunge that leaves 3 EMBER puddles.
- Crimson Bride (hp 70, cost 5): blinks between pillars. Charm: a 0.8 s pink FOLLOW telegraph, then a 2 s pull toward her at 60 px/s that any dash breaks. She also throws a 3-way blood kiss fan.
  - *Implementation:* Brains: blinkFlank, pairOrbit (partner stored in the parent column), packCircle (a round-robin token in the pack leader's aux2 until Epic 4's attack tokens land) and charmer. Pillar anchors come from room.decor 'pillar'. PETAL and EMBER come from the Epic 1 pattern and hazard libraries.
  - *Acceptance:* A Specter Knight never deals damage within 0.5 s of reappearing. Every Waltzer ring keeps a gap ≥ 40 px at 200 px from the pair. Only one Hellhound per pack lunges at a time. The Charm pull ends on the tick the player dashes.
- **Second moves for the original seven** — - Skeleton: tosses a bone on a lob arc (0.4 s raised-arm tell) when more than 220 px away. 25% spawn with a buckler that blocks one frontal hit.
- Ghoul: lunge bite (0.45 s crouch, 160 px). It also feeds on fresh corpses, healing 30%, so kill order matters.
- Blood Bat: roosts dormant on the ceiling and scatters in panic when a flockmate dies.
- Bone Archer: arrow rain (3 arrows lobbed onto a 0.9 s circle telegraph) and a retreat hop.
- Hex Witch: hex sigil (a FOLLOW telegraph that locks 0.3 s before detonating) and a blink away when the player comes within 120 px.
- Axe Armor: throws a returning axe when line of sight blocks its charge, plus a guard stance.
- Gargoyle: disguises itself as a statue (DORMANT, drawn like decor) and dive-slams with a 0.6 s circle telegraph.
  - *Implementation:* Convert the 7 existing defs in src/game/enemyDefs.ts to MoveSets. Add an enemy-team PF_RETURN branch in world.updateProjectiles that flies back to the owner column. Corpse feeding reuses the Epic 2 corpse ring buffer.
  - *Acceptance:* Each original enemy has at least 2 move ids, and coverage tests show each move fires within 60 s of bot play. A thrown enemy axe returns to its living owner or expires on the owner's death. A buckler blocks exactly one frontal hit.
- **Tell poses and monster art rigs** — Every new monster is a vector rig of 2–4 parts (body, head, and a weapon, wing or limb) in the chunky-cartoon style: thick ink outlines, one cel highlight, glowing eyes. Every move phase has a named pose (windup crouch, strike extension, recovery slump), so tells read by silhouette and not only by the orange flash.
  - *Implementation:* Add src/render/art/monsters/{gate,catacombs,throne}.ts, drawn with Pen and registered in ShapeCache.enemies. EnemyDef.parts lists part keys with pivots. A new src/render/enemyPoses.ts maps (def, move, phase progress) to per-part rotation and offset through small lerp tables. makeEnemyView builds parts generically, replacing the bat, ogre and golem special cases. Views are pooled per def, so a slot that changes def reuses a cached view instead of destroying and rebuilding.
  - *Acceptance:* Every def has a body context and a flash context, each built exactly once (ShapeCache count test). After warm-up, 600 ticks of mixed spawns allocate zero EnemyViews. A lint test checks that every move with windup ≥ 0.3 s has a pose entry.
- **Spawn-table integration and tuning pass** — Set cost, weight and minFloor for all 22 types, calibrated against the threat score (Epic 4). First encounters show a toast with a tell tip, e.g. 'A Spear Guard bars the hall! Strike from behind.'
  - *Implementation:* Tune the numbers in enemyDefs.ts and the rosters.ts role tables. A run-scoped seen-set in the run state triggers HUD toasts (UI domain).
  - *Acceptance:* Across 200 seeded floors, at least 6 distinct defs appear in 90% of 10-room samples. In bot play, the median combat-room clear takes 35–75 s on floor 0 and 45–90 s on floor 2.

**Depends on:** Epic 1 toolkit: moves, telegraphs, patterns, dormancy and traits; Epic 2 corpse buffer and Epic 4 attack tokens for Hellhound packs; ART: rig and pose rendering, pooled EnemyViews and about 15 monster draw functions; WORLD/GEN: room.decor anchors (coffins, pillars, banners, windows) exposed to the spawner; PLAYER: slow, energy-drain and pull fields; UI: first-encounter toasts
**Risks:** Wall-passing Medusa Heads and Ectoplasm can feel cheap off-screen. Emitters only fire inside the fixed logical view, and ghosts fade in before contact.; Dormant and reassembling enemies could soft-lock room clear. A 20 s forced-ALERT rule and clear logic that ignores piles prevent it.; Art for 15 monsters is a heavy content load. Ship it as three floor packs of roughly M effort each.; A Charm pull feels bad on touch if it can't be escaped, so any dash always breaks it.
**Constraint check:** Every monster is a Pen-drawn vector rig cached as shared GraphicsContexts, with no textures. Behaviour is MoveSet data driven by the deterministic w.rng, and emitters and anchors are seeded from the room seed. Per-tick cost is O(n), with spatial-hash queries only for auras and packs. The estimated cost is about 0.05 ms more per 150 enemies and about 18 KB gzipped of art and data. Every counter is movement or dash, so the mechanics are identical on touch, KB+M and gamepad.

**Review notes:**
- *feasibility* (keep): Sound. Art for 15 monsters is the long pole, so gate it on a shared parts kit. Wall-pass and dormancy rules must use a sim-side view rect, not the device camera.
- *player* (keep): Highest player-value enemy epic: each monster asks a new question, very Castlevania. Ship per-floor packs; blocked on ENM-1 and ART-3 pose swaps. Second moves first, cheapest win.
- *completeness* (keep): Right scope as three floor packs. Medusa Head, Fleaman, Bone Pillar, Red Skeleton and Spear Guard are lifted Castlevania names; rename in an IP pass.

#### ENM-4 · Night Watch Director: biome rosters, squads and fair pressure

*Enemies, elites & bosses · effort L · impact 5/5*

Replace 'spend the budget on a flat table' with an encounter director. It has per-biome rosters split by role, named squad templates placed with intent, attack tokens that cap simultaneous threats, wave grammar with ambushes, and room modifiers. **Player value:** Rooms feel composed, not random: a shield wall with archers behind it, a Mummy crypt guarded by Bone Pillars. Difficulty rises through smarter mixes rather than HP bloat, and phones never face unreadable pile-ups.

- **Biome roster tables** — src/game/rosters.ts defines ROSTERS[biomeId]: roles (fodder, line, support, heavy, flyer, turret) mapped to weighted def lists. For now biomeId is the FLOOR_THEMES index, and the table is ready for Clock Tower, Forbidden Library and Drowned Aqueduct. Default combat-room quotas: 50% fodder, 25% line, 10% support, 15% heavy or flyer.
  - *Implementation:* Rewrite the table filter in src/gen/spawner.ts to pick by role quotas from CONFIG.encounter, keeping cost and budget semantics. minFloor stays as a secondary gate for the floor-0 tutorial pacing.
  - *Acceptance:* Across 500 Throne rooms, Skeleton weight is ≤ 15%. Every biome lists at least 7 defs. Existing gen tests still pass: spawns on floor tiles, the 6-tile minimum distance and cap folding.
- **Squad templates** — Named formations, each with anchor rules (along a wall, near a pillar, centre, corridor mouth), a facing and a budget cost:
- Shield Wall: 3 Spear Guards in a line facing the entrance, with 2 Bone Archers 3 tiles behind.
- Graveyard Shift: 6 Zombies plus a Lantern Wight.
- Bat Cloud: 8 Blood Bats ringing a Hex Witch.
- Crypt Watch: a dormant Mummy at a coffin, flanked by 2 Bone Pillars.
- Hunting Pack: 3 Hellhounds and a Crimson Bride.
- Medusa Gallery: 2 emitters on opposite walls plus 4 Skeletons.
- Ballroom: 2 Waltzer pairs and a Specter Knight.
  - *Implementation:* Add src/gen/squads.ts. Placement uses the existing Poisson points plus an anchor search over room.tiles and room.decor. Templates are weighted per biome, and a template falls back to singles when no valid anchor exists. Facing goes into SpawnEntry.
  - *Acceptance:* Shield Wall guards face within 30° of the entrance direction. Every squad member stands on a floor tile with clearance ≥ 1. Plans are deterministic over 1,000 rooms. Templates appear in at least 30% of floor-1+ combat rooms.
- **Attack-token threat director** — Fixed token pools keep pressure readable. At most 4 ranged shooters can be in windup or active at once, at most 3 melee windups, and at most 1 lunge per pack. Enemies cannot start ranged moves while outside a fixed logical view rect (24 × 13.5 tiles around the player, plus a 1-tile margin), and gain no ranged fire for 1.0 s after spawning.
  - *Implementation:* World.tokens is a small Uint8Array per token class. The Epic 1 moves runner calls requestToken and releaseToken, and tokens are freed on death, stun, stagger or move end. The view rect is a constant from CONFIG and never comes from the device camera, so results stay identical across devices.
  - *Acceptance:* In a 150-enemy flood test, concurrent ranged windups never exceed 4. No enemy outside the logical rect starts a ranged move. The token count returns to 0 after room clear, so nothing leaks.
- **Wave grammar and ambushes** — Waves are typed as opener, pressure or finisher. A wave triggers when remaining threat drops to ≤ 25% of the current wave's or after 12 s. From floor 1, 20% of rooms get an ambush wave that bursts from crypt holes on the entrance side, with a 1.2 s telegraph and an audio sting. Elites arrive in the pressure wave rather than the opener (elite rooms excepted). The final wave shows a 'The last of them!' toast.
  - *Implementation:* SpawnPlan.waves gain role, trigger and ambush fields. world.updateWaves reads them, and the HAZ.SPAWN telegraph length is set per wave.
  - *Acceptance:* Ambush telegraphs last at least 1.2 s. Elites never appear in wave 0 of multi-wave combat rooms. Wave timing is deterministic under the golden test.
- **Threat-scored budgets and Horde Brutes** — threat(def) = sqrt(ehp × dps), normalised so a Skeleton scores 2, and computed at load from def stats and moves. Room budgets are spent in threat units. When the mobile cap bites, surplus fodder merges into Horde Brutes instead of raising every enemy's HP. For example, 6 Zombies become 2 Zombie Brutes with ×2.6 HP and ×1.3 size.
  - *Implementation:* Add computeThreat in enemyDefs.ts and rewrite the cap-fold in spawner.ts. A Brute is a SpawnEntry flag setting size and HP, separate from affixes.
  - *Acceptance:* Across 1,000 rooms, room threat stays within ±10% of budget. With enemyCap 80, total effective HP stays within ±5% of the uncapped plan. Brutes only come from the fodder role.
- **Room encounter modifiers** — From floor 1, 12–15% of combat rooms roll one modifier:
- Haunted Hall: all enemies turn spectral (wall-pass, 0.6 alpha, -20% HP).
- Ossuary: every Skeleton reassembles.
- Blood Moon: +15% enemy move speed, +1 elite, +25% scrap.
- Silent Crypt: everyone starts DORMANT, so careful players can pick their fights.
- Swarm: double fodder at half HP.

The modifier shows on the door badge and in a toast.
  - *Implementation:* planSpawns rolls SpawnPlan.modifier from a sub-hash of STREAM.enemies, and World applies it at spawn. The door badge art reuses ShapeCache.badges (ART/UI dependency).
  - *Acceptance:* Modifiers are deterministic per room seed. Blood Moon applies exactly +15% speed. In Silent Crypt rooms, every enemy is DORMANT at t = 0 and wakes under the Epic 1 rules.

**Depends on:** Epic 1: moves runner with token hooks, and dormancy; Epic 3 monsters to populate rosters; WORLD/GEN: decor anchors and future biome ids (Clock Tower, Library, Aqueduct) from the world/biome domain; UI/ART: door badges for modifiers and the ambush cue; AUDIO: ambush and last-wave stings
**Risks:** Tokens can make rooms feel passive if set too low. Tune with bot clear-time bands.; Anchor-hungry templates fail in cavern-heavy rooms, so singles are the fallback.; Threat formulas mis-rate support units like the Lantern Wight. Add a manual threat override per def.; Ambushes behind the player can feel cheap. A 1.2 s telegraph and audio cue are mandatory.
**Constraint check:** All decisions happen at generation time on the deterministic enemies stream, or in-sim on w.rng. The logical view rect is a constant, so behaviour never depends on screen size. Tokens are a few bytes and squads are static data with zero per-tick allocation. Bundle cost is under 4 KB gzipped, and difficulty adapts through composition rather than device-specific rules.

**Review notes:**
- *feasibility* (revise): Absorb BAL-4's wave director and BIO-1's per-biome spawn tables so one module owns spawning. The token director is cheap; keep it on the enemies stream so layouts don't shift.
- *player* (keep): Squads and attack tokens make pressure fair and readable. Owns the wave director (drop BAL-4's duplicate). Rosters only matter once ENM-3 lands; ship tokens and wave grammar first.
- *completeness* (revise): Wave director, threat budgets and pacing overlap BAL-4 and BAL-3. Make ENM-4 the only director, implementing BAL-4's targets. Biome ids conflict between BIO-5 and ENM-8.

#### ENM-5 · Curtain Call: multi-phase boss framework, intros and the big three reborn

*Enemies, elites & bosses · effort XL · impact 5/5*

Give every boss a script: HP-gated phases with transitions, invulnerability and bullet clears; a skewed 'EPIC BOSS FIGHT!' intro; a bespoke death; and HUD and music hooks. Then rebuild Gorehorn, the Rune Colossus and Count Vlador into three-phase showpieces. **Player value:** Boss fights become the 'EPIC BOSS FIGHTS!' the art direction promises: escalating, readable, theatrical, and memorable enough to want to beat again.

- **BossScript phase framework** — Each boss gets a script: phases [{at: 1.0, moves, music}, {at: 0.66, transition, moves}, …], an intro and a death. At each threshold the boss turns invulnerable for 1.5 s and shows a gold 'IMMUNE' text on hit. Its bullets turn into soul sparks worth 0.5 XP each, and it plays a transition move. Damage clamps at phase thresholds, so burst damage can't skip a phase. Soft enrage at 210 s: +10% speed and -10% cooldowns every 30 s, up to 3 steps.
  - *Implementation:* Add src/game/ai/bossScript.ts. The current phase is stored in a new phase column, and transitions run as a reserved move. hitEnemy clamps damage via a per-enemy hpFloor column. New WorldEvent types bossIntro, bossPhase and bossStagger are handled in app.ts.
  - *Acceptance:* A one-shot that would kill from 70% leaves the boss at exactly 66% and triggers the transition. All enemy bullets are released on transition and each spawns one soul pickup. Enrage steps fire at 210, 240 and 270 s and stop after 3.
- **Intros and death sequences** — Intro, 2.5 s: the boss poses while the camera pans to it with letterbox bars. A skewed 'EPIC BOSS FIGHT!' banner shows a name card with an epithet, e.g. 'GOREHORN, Twin Terror of the Gate'. Neither the boss nor the player can be hurt during the intro. It can be skipped once seen, and is always skippable in Boss Rush. Death, 2.4 s: a boss-specific breakup. Gorehorn's heads topple, the Colossus crumbles into rune-lit chunks, and Vlador collapses into ash and bats. A 'SLAIN' banner follows, then rewards.
  - *Implementation:* In the sim, the intro sets boss spawnT and gives the player invulnerability, then emits bossIntro {dur}. The camera pan and letterbox come from the renderer (ART dependency), and the banner and name card from the HUD (UI dependency). killEnemy for tier 'boss' runs a death script from bossScript.death through the fx sink before emitting bossDefeated.
  - *Acceptance:* No damage events occur during the intro (recording FxSink). Once the meta 'seen' flag is set, any input skips the intro. bossDefeated fires exactly once, after the death script ends.
- **Gorehorn rework (3 phases)** — Phase 1, Two Heads One Club (100–60%):
- Club Slam: a 0.85 s circle telegraph (135 px), then a 380 px SHOCK ring and 12 bone shards.
- Bull Charge: a 0.6 s LINE telegraph across the arena. Hitting a wall staggers him and triggers rockfall ×5.
- Belly Bounce: a hop toward the player that lands with a DONUT telegraph (inner 70, outer 180).

Phase 2, Heads Argue (60–25%): control alternates every 8 s.
- Gore, the horned left head, attacks with a 3-hit club combo of CONE telegraphs (0.5, 0.4 and 0.6 s).
- Horn, the topknot right head, lobs 3 boulders onto circle telegraphs. Each boulder leaves a 3 s rubble slow-patch.
- Hits from the dozing head's side deal ×1.5.

Phase 3, Twin Fury (25%): both heads roar.
- A club-spin ROTOR (160 px, 3 turns, with a lane gap).
- Rockfall rain every 2 s (6 circles).
- 3 Skeletons summoned every 15 s.
  - *Implementation:* src/game/ai/brains/gorehorn.ts rebuilt on BossScript and MoveSets. The controlling head is stored in aux2, and the side-weakness test compares facing with the hit direction. Rubble is a slow-type ENEMY_FIRE patch with no damage. The renderer swaps eye glow per head (ART).
  - *Acceptance:* Move-coverage tests hit all 8 move ids. Side hits on the dozing head deal 1.5× (±1 for rounding). The Phase 3 spin always leaves a gap ≥ 48 px.
- **Rune Colossus rework (3 phases, multi-part)** — Phase 1, Awakening (100–66%): radial rune bursts, 5 FOLLOW-lock ground spikes, and a 7-rune aimed fan.

Transition at 66%: the fists detach as child entities, 600 HP each, with 50% of damage dealt to a fist forwarded to the core. Each fist slams independently: a 70 px circle on a 0.7 s telegraph. Meanwhile the core stands still and fires a slow spiral.

Phase 3, Spiral Core (33%): the fists explode, and the blue chest spiral turns magenta as the cracks glow.
- A rotating 4-arm BEAM ROTOR at 30°/s. It reverses every 6 s after a 0.8 s pause tell.
- A floor rune grid: 2 × 2-tile cells in an alternating checkerboard telegraph for 1.0 s, then detonate, and the safe pattern shifts each cycle.
  - *Implementation:* brains/colossus.ts plus fist child defs (tier 'boss', using the parent column). The HUD shows sub-bars for the fists. Grid cells are spawned as pooled HAZ.TELEGRAPH squares, so this needs a RECT variant in the Epic 1 library. The art reuses drawGolem split into body and fist contexts.
  - *Acceptance:* The core takes exactly 50% of fist damage. The checkerboard always leaves at least 40% of floor cells safe. The ROTOR reverses only after its 0.8 s tell. Fist slams never overlap a grid detonation on the same tick (scheduler test).
- **Count Vlador rework (3 phases plus true form)** — Phase 1, The Gentleman (100–60%): teleport, then a triple hellfire homage, a 2-arm blood spiral, and a 0.5 s cape-swipe CONE when the player is close.

Transition at 60%, Blood Moon Rises: the arena darkens and 4 corner blood pools (ENEMY_FIRE) persist.

Phase 2, Lord of Bats:
- Bat Storm: Vlador dissolves into 24 bats that share his HP pool through the parent link, sweeps a sine formation for 6 s, then reforms behind a laneWall of blood with a gap.
- Hellfire becomes 5-way.
- Crimson Mist FOLLOW telegraphs.

Phase 3 at 30%, True Form 'Nosferatu':
- A towering demon-bat whose wing gusts push the player 80 px/s, telegraphed by a cone.
- A meteor fireball rain of 8 circles every 2 s.
- Bloody Tears: PF_DELAY drops.
- A final-night spiral.

Death: he crumbles to ash, his cape flutters down and bats scatter.
  - *Implementation:* brains/vlador.ts. Bat-storm bats are lightweight child entities that redirect damage to the parent, with their contact damage halved. Add a 'vladorTrue' shape set in ShapeCache with a new Pen drawing (ART dependency). Gust uses a push field on the player (PLAYER dependency).
  - *Acceptance:* Damage to storm bats reduces Vlador's HP 1:1. Every laneWall has a reachable gap from the player's position at spawn (BFS test). The phase 3 swap keeps the same HP bar continuous.
- **Boss HUD, camera and music hooks** — The boss bar gains phase pips at the thresholds, a shield overlay while immune, a stagger meter, an epithet line, and support for two bars (duos and Colossus fists). Each phase can cue the music: per-boss leitmotif layers, plus a key change and +8 bpm in phase 3.
  - *Implementation:* World exposes bossIndices (an Int16Array of 4) instead of a single bossIndex. app.ts forwards bossPhase to music.setMood with a phase argument (AUDIO dependency) and to hud.ts (UI dependency).
  - *Acceptance:* The HUD shows pips at 66% and 33% for the Colossus. Two bars render for duo fights. Music receives exactly one phase cue per transition.
- **Fairness and anti-cheese rules** — - At most 2 concurrent patterns per boss.
- Every radial pattern must have a verified safe gap.
- An anti-corner sweep: if the player stays within 2 tiles of a wall for 6 s, the boss uses a wall-hugging lane attack.
- A bot-measured time-to-kill band per boss feeds the CI regression.
  - *Implementation:* The scheduler in bossScript counts active pattern moves. A validator checks gaps on pattern descriptors in tests. The anti-corner timer lives in an aux column, and the bot TTK runs in tests/bosses.test.ts.
  - *Acceptance:* A level-8 median-build bot kills Gorehorn in 60–120 s, the Colossus in 80–150 s and Vlador in 110–200 s, with a ≥ 40% survival rate. More than 2 concurrent patterns never occur over 600 s of bot fights.

**Depends on:** Epic 1: telegraph shapes, patterns, poise and parent links; ART: camera pan and letterbox, Vlador true-form art, eye-glow swaps and arena darkening (lighting); UI: skewed 'EPIC BOSS FIGHT!' banner, name card, phase pips and duo bars; AUDIO: per-boss leitmotifs and phase layers; PLAYER: push and gust fields; META: 'intro seen' flags
**Risks:** Child entities (fists, bats) complicate kill-all-on-death and boss-index tracking, so tier-aware killEnemy needs tests.; Damage clamping at thresholds can feel bad if transitions are slow, so keep them ≤ 1.5 s.; Bot TTK bands are sensitive to card balance changes. Re-baseline per release.; Darkened arenas on low presets must keep telegraphs readable, so telegraphs render above the lighting layer.
**Constraint check:** Bosses stay pure sim data on w.rng, with phases gated by HP and time only, so fights replay from the room seed. Child parts reuse the enemy SoA pool (≤ 30 entities per boss). Intros pause damage but keep ticking at the fixed 120 Hz. All visuals are Pen vector art and shared contexts, and leitmotifs are procedural Web Audio. Adds about 12 KB gzipped. Mechanics avoid aim-precision checks, so they work on touch.

**Review notes:**
- *feasibility* (keep): Owns phase logic; absorb BAL-4's boss tuning. Intros and deaths must run with the sim paused, so skips and 'seen' flags never shift tick timing. ART-6 owns presentation.
- *player* (keep): Core showpiece. Make it the sole owner of boss intros, phases and deaths: absorb ART-6, BAL-4's phase tables, UX-8's banner and STO-3 intro hooks. Skippable after first view.
- *completeness* (keep): Boss intros are claimed by ENM-5, ART-6, UX-8, AUD-8 and STO-3. ENM-5 owns BossScript and one bossPhase event; the others consume it.

#### ENM-2 · Elite Affixes: Vampiric, Shielded, Splitting, Cursed and friends

*Enemies, elites & bosses · effort L · impact 5/5*

Elites stop being 'the big gold one' and become named puzzles with readable tells: 16 deterministic affixes from a dedicated PRNG stream. Floor 0 elites get 1 affix, floor 1 gets 1–2 and floor 2+ gets 2–3. Each affix has a sigil, a rim colour and a sound cue. **Player value:** The existing 7 monsters, and every future one, now come in hundreds of combinations. 'Cursed Splitting Ghoul, the Hungering' becomes a story players tell. Elite nodes on the map become a spicy, high-reward choice.

- **Affix data model and deterministic roll** — src/game/affixes.ts defines AFFIXES entries with: id, bit, name, epithet pool, sigil, rim colour, per-biome weights, minFloor, bans (by trait or def) and an incompatibility list. Counts per floor: floor 0 gets 1, floor 1 gets 1–2, floor 2+ gets 2–3. Nightmare mode (Epic 7) adds +1. Example bans: Shielded on Medusa Head, Splitting on Bone Pillar, Phasing on any tier ≥ mini, Splitting + Necromantic together.
  - *Implementation:* Append STREAM.affixes = 7 in src/core/rng.ts so existing streams are untouched. planSpawns rolls affixes per elite with streamRng(room.seed, STREAM.affixes) and writes a bitmask to SpawnEntry.affixes, which spawnEnemy copies into EnemyStore.affix. Behaviour lives in hook tables (onSpawn, onTick, onHitPlayer, onDamaged, onDeath), dispatched by iterating set bits with Math.clz32, so there are no arrays and no allocation.
  - *Acceptance:* The same seed yields identical affixes. Changing any affix weight leaves enemy defs and positions bit-identical. Over 10,000 rolls, banned or incompatible pairs never occur and per-floor counts match the table.
- **Defensive affixes** — - Shielded: 4 holy-glass panes orbit at 34 px. Each pane absorbs one projectile or melee hit from its side, and one pane regrows every 3 s. Vanguard's Shockwave Dash shatters all four at once.
- Juggernaut: knockback- and stun-immune, +50% HP, size ×1.15, and a ground-thump shake every step.
- Phasing: when hit, blinks 140 px to a seeded walkable spot (3 s cooldown) and leaves a 0.25 s violet afterimage.
- Undying: once per life, revives at 40% HP after a 2 s 'rising' state. Any HOLY-tagged hit, or an overkill crit, cancels the revive.
  - *Implementation:* Store pane state as a 4-bit mask in aux2, with pane angles derived from phase. The pane check runs in world.updateProjectiles and the player melee sweep before hitEnemy. Undying keeps the corpse slot alive with an UNTARGETABLE flag and reuses the spawnT rise visual.
  - *Acceptance:* A Shielded elite hit 4 times from one side takes 0 damage, then full damage on the 5th hit. A pane regrows in 3.0 s ± 1 tick. Under Shockwave Dash, a Juggernaut's kbx/kby stay at 0. A Phasing blink never lands in a wall over 5,000 seeded trials. An Undying elite killed by a Holy Cross stays dead.
- **Offensive affixes** — - Vampiric: heals 30% of the damage it deals and siphons the player through a visible crimson tether (4 dps within 110 px). +1 heart drop chance on kill.
- Frenzied: +35% move speed, cooldowns ×0.7, red after-images.
- Infernal: drops an ENEMY_FIRE puddle every 0.3 s (2 s life, 6 dps, 22 px radius). Immune to burn.
- Frostbound: its shots slow the player by 30% for 1.5 s, and it releases an 8-shard ICE nova on death.
- Thunderous: every 4 s, a 0.7 s LINE telegraph (380 × 28 px) points at the player, then a lightning lane strikes along it.
- Bombardier: every 3.5 s, lobs a bomb at the player's position with a 0.9 s circle telegraph.
- Runic (floor 2+): two ROTOR beams, 200 px long, turning at 35°/s after a 1 s warm-up.
  - *Implementation:* Hooks call the Epic 1 actions SPAWN_HAZARD, LOB and BEAM. The player slow uses p.slowT and p.slowMul, read by playerCombat movement (player domain). Vampiric healing clamps to maxHp. Infernal keeps a per-enemy cap of 8 live puddles, counted in aux2.
  - *Acceptance:* Per-affix sim tests check the stated cadence to within ±1 tick. An Infernal elite never has more than 8 live puddles. Frostbound slow never stacks beyond 30%. Runic beams never activate while the elite is DORMANT.
- **On-death affixes** — - Splitting: splits into 2 copies at radius ×0.75 and 40% max HP. The copies are non-elite and carry no affixes, for one generation only, and pop out on a 0.3 s spawn arc.
- Cursed: on death, a violet sigil telegraphs for 1.0 s (90 px), then blasts and applies Curse: -15% damage dealt for 5 s, stacking up to ×3.
- Necromantic: while alive, a green beam raises a Zombie from up to 3 corpses within 200 px every 6 s.
- Bloated (Catacombs only): bursts into 12 bone shards on death.
  - *Implementation:* Add a corpse ring buffer to World: a Float32Array of 3 × 32 holding x, y and def cost, written by killEnemy. If Splitting finds the pool at enemyCap, it folds both children into one copy with ×1.8 HP. Curse lives on Player as curseT and curseStacks and is read by world.baseDamage (player domain).
  - *Acceptance:* With the pool at its cap, a Splitting elite spawns ≤ 1 entity. Children never split. Curse caps at 3 stacks and expires on time. Necromantic raises ≤ 3 Zombies per cycle and never from boss or mini-boss corpses.
- **Readability: nameplates, sigils, rims and audio cues** — Elites get a nameplate built from affix prefixes plus a seeded epithet, e.g. 'Cursed Vampiric Axe Armor, the Gorged'. Up to 3 vector sigils sit above the HP bar, and a rim tint pulses through the affix colours. Each affix plays a short ZzFX cue when its signature effect fires: a glass tink when a pane shatters, a thunder crack, a curse choir sting.
  - *Implementation:* renderer.makeEnemyView creates the BitmapText nameplate and sigil Graphics once at spawn, drawing sigils from shared contexts in a new src/render/art/sigils.ts. syncEnemies only toggles visibility and alpha. A nameplate shows within 260 px, and on phones (short edge < 600 px) it collapses to sigils only. Add the new SfxName entries in src/game/fx.ts.
  - *Acceptance:* A test over AFFIXES confirms every affix has a unique sigil and rim colour. A heap-sampling test of 600 ticks of syncEnemies with 10 elites sees zero allocations after spawn. Sigils stay legible at render scale 0.5 (screenshot check).
- **Champion packs and reward scaling** — From floor 1, 12% of combat rooms replace one squad with a Champion pack: 3–4 non-elite monsters with a blue champion glow that share one affix. Each affix adds +15% XP and +1 scrap tier on drop. An elite with 2 affixes guarantees an uncommon-or-better chest, and one with 3 guarantees rare or better.
  - *Implementation:* Add a champion branch to src/gen/spawner.ts that draws from STREAM.affixes. killEnemy scales XP and scrap by the popcount of the affix bitmask. The chest guarantee passes a new minRarity argument to rollRoomLoot in src/gen/loot.ts (loot domain).
  - *Acceptance:* Champion packs appear in 12% ± 2% of 2,000 seeded floor-1+ combat rooms. A 3-affix elite kill always drops a rare+ chest. A 2-affix elite's XP equals base × 3 × 1.3.

**Depends on:** Epic 1: moves, telegraph shapes, hook columns and corpse buffer; PLAYER domain: slow and curse fields and their effect on movement and damage; LOOT domain: minRarity parameter on rollRoomLoot; AUDIO domain: affix cue SFX parameter sets; ART: 16 sigil icons and the rim tint pulse; UI: codex entries for affixes (Epic 7)
**Risks:** Stacked combos (Frenzied + Runic + Vampiric) can be unfair. Mitigation: an incompatibility matrix plus bot-measured kill-time ceilings in CI.; Nameplate clutter on phones. Mitigation: show at most 3 nameplates and use sigils only on short screens.; Splitting can push past the mobile enemy cap, so children fold into one copy at the cap.; If affixes shared the enemies stream, existing seeds would reshape. Using a separate appended stream avoids this.
**Constraint check:** Each affix is one bit in a Uint16 column, reusing existing scratch columns. Hook dispatch iterates set bits with no allocation. Rolls come from a new appended stream (STREAM.affixes), so existing seeds keep identical layouts and rosters, and runs stay reproducible from runSeed + floor + attempt. Sigils are Pen-drawn shared GraphicsContexts and cues are ZzFX parameter arrays (no files). Adds about 6 KB gzipped. Every counter is movement or dash, so it works on all input methods.

**Review notes:**
- *feasibility* (revise): Absorb BAL-7's affixes. 'Fold at mobile cap' relies on the preset-dependent enemyCap in spawner.ts, which breaks cross-device determinism for dailies and replays. Make caps ruleset constants.
- *player* (revise, effort M): Great roguelite texture, but 16 affixes plus champion packs is too much for 3–4 floors. Ship 8 with clear sigils (about M); absorbs BAL-7's affixes. Depends on ENM-1, BLD-2.
- *completeness* (keep): Make this the only elite-affix system (BAL-7 lists 'Elite affixes' too). Define stacking with heat candles and curses so modifiers aren't applied twice.

#### BLD-2 · E2 · Hexes, Hellfire & Hoarfrost: Status Effects and Reactions

*Combat systems & buildcraft · effort L · impact 5/5*

Six statuses (burn, freeze, shock, poison, bleed, curse) on a structure-of-arrays (SoA) status block, a matrix of seven named reactions, boss poise instead of stunlock immunity, and enemies that inflict readable statuses on the hunter. **Player value:** Elemental builds get real depth: freeze a ghoul, then shatter it with an axe; set a poisoned crowd alight for Witchfire; smite a cursed Count with holy water for an Exorcism. Bosses can be staggered by a crowd-control (CC) build without being stunlocked.

- **StatusStore SoA & unified status tick** — One status block per enemy (6 statuses × stacks, timer and power) replaces burnDps/burnT. A single updateStatuses pass ticks DoTs at 4 Hz through dealHit (DOT flag: no crit, no procs) and handles expiry and visual flags.
  - *Implementation:* EnemyStore in stores.ts gains: stStacks Uint8Array(512*6), stTime Float32Array(512*6), stPower Float32Array(512*6) (damage per stack, snapshotted from the applier's base damage), stMask Uint8Array (active bits, so idle enemies are skipped), immuneT Float32Array(512*6), reactCd Float32Array, slowMul Float32Array, and poise/poiseMax for bosses. New src/game/status.ts exports applyStatus(w, i, st, stacks, power, dur) and updateStatuses(w, dt), called from World.update before updateEnemies. The burn branch in enemyAi.ts:24-33 is removed. FROZEN gates AI the same way stun does today.
  - *Acceptance:* The status block uses under 32 KB. Perf test: 400 enemies carrying all 6 statuses add at most 0.15 ms per tick. Legacy parity: one copy of Burning Hex still deals about 5 dps for 3 s on a dummy (±5%), now with damage numbers and ledger credit.
- **Six statuses with Castlevania flavour** — - BURN (FIRE): +1 stack per proc, max 8. 4 dps per stack, scaled by applier damage/20. 3 s, refreshed on reapply. Burning enemies take +10% FIRE.
- CHILL → FROZEN (FROST): max 5 chill, each −10% move and −8% fire rate. At 5 stacks the enemy is FROZEN for 1.5 s (0.9 s on elites), then gets 4 s of chill immunity. Bosses get Frostbite instead (a 1 s, 50% slow). Frozen enemies deal no contact damage and take +30% PHYS.
- SHOCK (SHOCK): max 5, 4 s. Every 0.5 s it zaps the nearest enemy within 150 for 8% × stacks of the applier's base damage. +4% damage taken per stack.
- POISON (POISON): max 30, 1.5 dps per stack, 6 s refresh. An enemy dying with 10 or more stacks bursts and spreads half of them to enemies within 120.
- BLEED (BLOOD): max 10, 2 dps per stack, 5 s. Doubled while the target moves faster than 20 u/s, which punishes Axe Armor charges and Count Vlador's dashes.
- CURSE (ARCANE): a single 8 s mark, +20% damage taken from everything. On death the enemy releases a homing wraith worth 60% of its max HP, capped at 3× player base damage.
  - *Implementation:* A STATUS_DEFS table lives in status.ts, with every number in CONFIG.status. Chill writes slowMul, which enemyAi.ts multiplies into E.speed and the E.fireT decrement. The wraith reuses PROJ.ORB with PF_HOMING and src WRAITH.
  - *Acceptance:* 5 chill on a Skeleton freezes it for exactly 180 ticks. Gorehorn is never FROZEN. Poison caps at 30 stacks. Bleed damage doubles while an Axe Armor is in S_CHARGE. Curse adds exactly +20% damage taken. Bone-material enemies reject poison and bleed.
- **Reaction matrix (7 named reactions)** — - SHATTER: a HEAVY or PHYS hit of at least 2× base on a FROZEN enemy deals 250% plus 6 ice shards at 40% FROST, and ends the freeze.
- STEAM BURST: FIRE on a CHILLED or FROZEN enemy triggers a 140-radius burst at 120% FIRE. Ranged enemies inside it fire with ±30° spread for 2 s.
- OVERLOAD: SHOCK on a BURNING enemy explodes in radius 110 for 50% + 15% per burn stack, with knockback 300.
- SUPERCONDUCT: SHOCK on a CHILLED enemy applies −40% to all resists for 6 s, shown as a 'BRITTLE' crack overlay.
- WITCHFIRE: FIRE on a POISONED enemy spawns a toxic flame cloud (HAZ.MIASMA, radius 90, 3 s) dealing poison stacks × 3 dps and spreading 1 poison per tick.
- HEMORRHAGE: a crit on an enemy with 5 or more BLEED stacks consumes them for 150% of their remaining damage and heals the hunter 3 HP.
- EXORCISM: HOLY damage on a CURSED enemy gets +100% on that hit and expels a holy flare (radius 120, 80% HOLY) with a 50% chance to drop a small heart.
  - *Implementation:* src/game/reactions.ts holds a REACTIONS table indexed [applied][present] → reactionId, with handlers as module functions. Checks run only inside applyStatus and dealHit (for crit and HEAVY triggers), never per tick. A per-enemy reaction cooldown of 0.4 s (reactCd) prevents chain storms. New HAZ.MIASMA and HAZ.FROSTSHARD kinds are added, and POOLS.hazards goes from 64 to 128.
  - *Acceptance:* A table-driven test sets up each pair and asserts the reaction fires exactly once, consumes the documented stacks, respects the 0.4 s cooldown and is deterministic for a fixed seed. Stress test: 150 enemies under BURN, SHOCK and POISON triggering Witchfire stay inside the 4 ms budget.
- **Status sources: wiring existing cards & new stats** — Existing content becomes status sources:
- Burning Hex applies BURN on hit (100% × procCoef).
- Storm Chain arcs apply 1 SHOCK.
- The Moonlit Dash trail applies CHILL.
- Holy Water pools become Consecrated ground, which triggers Exorcism.
- Singularity Pulse detonation applies 2 CHILL ('gravity frost').
The new statusChance, statusPower and statusDur stats feed every source.
  - *Implementation:* Each ported effect module in effects/ calls applyStatus. Card descriptions are updated in data. A STATUS_COLORS token set is added to theme.ts.
  - *Acceptance:* A sim with Burning Hex and Storm Chain against 20 skeletons produces at least one OVERLOAD within 30 s. statusDur +50% extends burn from 3 s to exactly 4.5 s.
- **Boss poise & CC diminishing returns** — Bosses get a gold poise bar under their HP bar. Freezes (+100), shatters (+150), stuns (+80), interrupts (+120) and overloads (+60) fill it. When full, the boss is BROKEN for 2.5 s (AI forced into recovery, +50% damage taken), then poiseMax ×1.5. This replaces the blanket 'if (!boss) stun' in shockwaveSweep, so CC builds pay off against Gorehorn, the Rune Colossus and Count Vlador without stunlocking them.
  - *Implementation:* EnemyStore gets poise, poiseMax and brokenT. poiseMax equals 6% of the boss's max HP in poise units. updateBoss in enemyAi.ts checks brokenT and forces state 3 (recover). Shockwave Dash adds poise to bosses instead of stun.
  - *Acceptance:* A Vanguard spamming Shockwave Dash on Gorehorn for 60 s produces between 1 and 3 BROKEN states. A boss is never broken twice within 20 s. The existing 'bosses run all their patterns' test still passes.
- **Player-side statuses & cleansing** — Enemies inflict readable statuses on the hunter:
- Hex Witch fireballs: BURN (3 dps, 2 s).
- Rune Colossus enrage-spiral runes: CHILL (−10% move per stack, max 3, never freezes the player).
- Count Vlador's blood spiral: BLEED, doubled while moving, which teaches stand-still or dash-out timing.
Cleanse by dashing through your own Holy Water, eating Pot Roast (E3) or triggering an Exorcism. Damage over time can never take the player below 1 HP.
  - *Implementation:* Player gets pSt: Uint8Array(6) and pStT: Float32Array(6). An ENEMY_SHOT_STATUS table (PROJ kind → status) lives in enemyDefs.ts and is applied in updateProjectiles on hurtPlayer. HUD pips sit next to the HP pill (dependency). The accessibility 'Gentle' preset halves durations.
  - *Acceptance:* A witch fireball applies burn that deals 6 HP over 2 s. Dashing through holy fire clears it. DoT cannot kill the player (HP floor of 1). Gentle mode halves durations.
- **Status readability: vector pips, ice block, sparks** — - Enemies show a pip row above the HP bar (flame, snowflake, bolt, skull-drop, blood-drop, violet eye) with stack counts.
- Frozen enemies sit inside a translucent cyan ice prism with one cel highlight.
- Shocked enemies spit micro-arcs, poisoned ones drip green bubbles, and cursed ones carry an orbiting eye sigil.
- Reactions pop skewed 'SHATTER!', 'OVERLOAD!' and 'EXORCISM!' callouts in the chunky outlined font.
- Icons differ by shape, not only colour, for colour-blind players.
  - *Implementation:* render/shapes.ts builds the 6 pip GraphicsContexts and the ice prism once and shares them. The enemy loop in renderer.ts reads stMask and toggles pooled sprites. Particles go through fx.particle with a per-enemy rate cap. The low preset shows only the top 2 statuses.
  - *Acceptance:* With 300 statused enemies on the mid-phone profile, the render frame grows by at most 1 ms. Pips use shared contexts (no per-frame Graphics rebuilds). A headless-browser screenshot of each status passes visual sign-off.

**Depends on:** RENDER/ART: status pip GraphicsContexts, frozen ice prism, reaction callout text; HUD: boss poise sub-bar and player status pips beside the heart pill; ENEMY domain: per-enemy material, immunity and status-on-hit tuning; AUDIO: ZzFX presets for freeze, shatter, zap, hiss and the exorcism chime; E1 damage pipeline, sources and effect registry
**Risks:** Reaction cascades (Overload into Witchfire into poison spread) can explode particle and hazard counts. Bounded by the 0.4 s reaction cooldown, the 128-slot hazard pool and per-reaction particle budgets.; Status pips are noisy on phones. The low preset shows only the top 2.; Freeze could trivialise elites. Elite freeze lasts 0.9 s, followed by 4 s of immunity.
**Constraint check:** Statuses are fixed-capacity typed arrays, so nothing allocates per tick. DoTs tick at 4 Hz and idle enemies are skipped via stMask. Budget: at most 0.15 ms per tick at 400 enemies, well inside 2 ms desktop and 4 ms mobile. All visuals are shared vector GraphicsContexts and pooled sprites, with no raster art. Every roll uses the combat stream, so behaviour is deterministic. About 10 KB gzipped. Identical on every device.

**Review notes:**
- *feasibility* (revise): Assumes a 128-slot hazard pool, but POOLS.hazards is 64 and is scanned every tick. Reactions that spawn hazards need a bigger, budgeted pool. Share status UI with UX-8's row.
- *player* (keep): Statuses and reactions give HOLY/FLAME/BLOOD tags real teeth. Seven reactions plus player statuses is heavy to read on phones; launch 4 statuses and 3 reactions, grow later.
- *completeness* (keep): Fine, but poise is also defined in ENM-1; pick one. Statuses, reactions, affixes and curses all compete for glyph space on phones, so enforce a budget.

#### ART-6 · 6. CURTAIN CALL: Boss intros, phase beats and themed screen transitions

*Art, animation, VFX & lighting · effort L · impact 4/5*

Every boss gets a 3-4 second Castlevania-meets-mobile-gacha entrance with a skewed 'EPIC BOSS FIGHT!' card, and every door, floor and death gets a themed wipe (keyhole iris, castle curtain, dripping blood) instead of a DOM opacity fade. **Player value:** Boss fights become events worth screenshotting and sharing. Floors feel like chapters, deaths feel dramatic rather than abrupt, and the presentation finally matches the reference's 'EPIC BOSS FIGHTS!' energy.

- **Cinematic director and camera override** — A small timeline system plays typed cues: camera pan, zoom, hold, letterbox in and out, title card, actor pose (rig clip), FX burst, shake, flash, music stinger and wait. It runs in render time while the sim is paused, and any input skips it after 0.5 s.
  - *Implementation:* New src/render/cinematic/director.ts (cue arrays and an interpreter) and src/render/cinematic/cues.ts. GameRenderer gains cameraOverride {x, y, zoomMul, lerp} consumed in render() before the existing camera damp. Add a new App state 'cinematic' in src/app.ts (loop.simulate=false, HUD hidden). A dedicated skip pill appears on touch, so tapping does not conflict with the floating joystick. Per-boss 'seen' flags go in meta: the first viewing plays the full intro, later ones a 1.2 s short cut, plus a setting to always skip.
  - *Acceptance:* No sim tick and no RNG draw occur during a cinematic (test with a mocked loop and a World tick counter). A full intro runs 4.0 s or less and the short cut 1.2 s or less. Skip returns control within 150 ms on all inputs. Saving or continuing mid-cinematic resumes at the boss-room start (save written before the cinematic).
- **Three scripted boss intros** — Gorehorn, Twin Ogre: the camera pans to the north wall, dust sifts, the wall-door bursts (40 debris, shake 10), two stomping footfalls, the left head bonks the right head, both roar at the camera (zoom punch 1.15x), title card. The Rune Colossus: ambient dims to 15%, scattered boulders slide together, six spiral runes ignite one by one at 0.15 s intervals, the eye slit flares red and magenta cracks pulse. Count Vlador: the window vistas turn blood red as the blood moon rises, a swarm of 30 bats spirals onto the throne and coalesces into the Count, a cape flourish, then a bow.
  - *Implementation:* Cue lists in src/render/cinematic/intros.ts keyed by ENEMY_DEFS key. Debris and dust use the existing ParticlePool kinds, the boss pose uses Epic 3 rig clips (with a transform-tween fallback), lighting comes from Epic 5 and the windows from Epic 7. Bat-swarm particles use a new 'bat' atlas frame drawn with Pen in particles.ts.
  - *Acceptance:* Each of the 3 bosses has an intro cue list covered by an Art Lab playback test. On the Low preset, letterbox animation becomes hard cuts and particles are halved. The Canvas fallback jumps straight to the title card. Every intro ends with the boss in its idle pose at its spawn position (asserted).
- **'EPIC BOSS FIGHT!' world-space title card** — A -12 degree skewed banner with a chunky ink outline, flat gold-to-orange stacked color bands, a crimson boss nameplate pill and a subtitle ('The Two-Headed Terror', 'Keeper of the Ossuary', 'Lord of the Crimson Keep'). It slams in with overshoot (scale 1.8 to 1.0 over 0.18 s) and a star sparkle burst, holds, then slides out. Phase-change and victory cards reuse it ('ENRAGED!', 'BOSS DEFEATED!').
  - *Implementation:* New src/render/cinematic/titleCard.ts: banner GraphicsContexts built once (bands as stacked flat rects, consistent with the cel style, so no gradient texture is needed), BitmapText in the CK-Display font, skew via Container.skew. Placed in GameRenderer.screen, respecting safe-area insets passed from app.resize. This replaces hud.banner for boss events (the DOM banner stays for floor names if UI prefers).
  - *Acceptance:* Legible at 360x640 (cap height at least 28 CSS px) and at 4K. Respects env(safe-area-inset-*) insets. The slam-in curve is 0.18 s plus or minus 1 frame. No allocation per show (pooled).
- **Enrage and phase-change beats** — At 40% HP each boss gets a beat: a 0.4 s hit-stop, a 1.1x zoom punch and an enrage palette pulse. The Colossus's cracks spread through 4 prebuilt crack stages. Both Gorehorn heads turn angry red-faced. Vlador's cape tears, his eyes flare and the windows bleed red.
  - *Implementation:* COMBAT emits a new WorldEvent 'bossPhase' {name, phase}. Handled in app.ts and forwarded to a director mini-cue list (the sim is not paused: zoom and pulse only, plus Epic 1 hit-stop). Golem crack stages 1-4 are prebuilt contexts in shapes.ts replacing the single golemCracks toggle.
  - *Acceptance:* The beat triggers exactly once per boss per fight (test with a scripted HP drop). It never pauses the sim for more than 0.4 s. Under Reduce Flashing the palette pulse becomes a 0.15-alpha vignette tint.
- **Boss death finales** — The killing blow gets a 2-frame full-screen impact frame (screen inked, boss white), then the existing 0.3x slow-mo. The boss rig explodes into its spinning parts, four rings expand and a column of soul light rises. Vlador's finale is unique: he crumbles into ash bats that scatter out of the windows.
  - *Implementation:* In src/render/cinematic/finales.ts, triggered from FxSink.death when the def is a boss. It uses the Epic 3 per-part debris path, a tall additive quad (new atlas frame 'column') and the Epic 1 hit-stop bossKill value.
  - *Acceptance:* Each boss has a finale that completes within the existing slowT window (1.2 s real time at 0.3x). Under Reduce Flashing the inked impact frame becomes a desaturation fade. The 'BOSS DEFEATED!' card appears after the finale, not over it.
- **Themed vector screen transitions** — Door: a keyhole iris that closes on the player and reopens at the new room's entrance (0.35 s total). Floor: a castle curtain that drops with the floor title card over a silhouette of the next floor's skyline (1.2 s). Death: twelve blood drips run down from the top of the screen into the Game Over screen. Shop and Sanctuary: a candle-snuff circular wipe. Reduced motion uses a 0.2 s crossfade.
  - *Implementation:* New src/render/transitions.ts: mask GraphicsContexts (keyhole, curtain, drips, snuff) built once and scaled or translated over a full-screen ink rect in GameRenderer.screen. app.transitionTo and nextFloor call renderer.transition(kind, onCovered) instead of toggling this.fade opacity, and the room build happens inside onCovered (keeps the 240/400 ms budget). Drip speeds come from the render PRNG.
  - *Acceptance:* Door transitions take 0.5 s or less end to end and floor transitions 1.2 s or less. Room build plus the Epic 4 bake fit inside the covered window (no visible pop-in in the browser harness). Under reduced motion the 0.2 s crossfade is used. The DOM fade element is removed.
- **Boss-room camera framing** — In boss rooms the camera frames both fighters: it targets a 0.65 player / 0.35 boss weighted midpoint and zooms out to 0.85x when they are more than 500 px apart. Shockwave Dash and Singularity Pulse crits get a 1.04x zoom punch for 0.15 s.
  - *Implementation:* In GameRenderer.render, when w.bossIndex >= 0, blend the look-ahead target with the boss position and adjust world.scale through a damped zoomMul. Clamp to world bounds as today.
  - *Acceptance:* A test of the pure camera function with synthetic positions shows the player always stays inside the central 70% of the screen in boss rooms. The zoom stays between 0.85x and 1.15x. Zoom punches never stack above 1.15x.

**Depends on:** TEC: App 'cinematic' state, a skip input action on every device, and saving before the cinematic; COMBAT/AI: new 'bossPhase' WorldEvent, and the boss held inactive (spawnT) until the intro ends so activation happens on a fixed tick; AUDIO: organ and harpsichord stingers per boss, a roar layered under the title card, a door-burst crash, and thunder for the curtain; META: per-boss 'intro seen' flags in the meta save; ART Epics 3, 5 and 7: rig poses, lighting dims and window vistas (each intro has a fallback without them)
**Risks:** Intros slow pacing on repeat runs of 20-30 minutes. Mitigated by the short version after the first viewing, skip, and a 'skip intros' setting.; Tap-to-skip conflicts with the touch joystick. Mitigated by a dedicated skip pill.; Pixi transitions behind the DOM HUD and modals cause layering bugs. Mitigated by hiding the HUD during transitions (already done with hud.setVisible) and by a test for each modal path.; Continue-run during a cinematic. Mitigated by saving before it and restarting the intro on load.
**Constraint check:** Code-only: cutscenes are cue arrays driving existing vector shapes, rigs and runtime-rasterized BitmapText, and transition masks are vector contexts built once. Determinism: the sim is paused during intros (no ticks, no RNG draws) and the boss activates on a fixed tick afterwards, so a run replays identically from its seed whether intros are skipped or watched. Perf: cinematics are render-only with modest particle counts and Low preset fallbacks. Bundle: about 8 KB gz. Cross-platform: skip works on touch, keyboard and gamepad, and the title card respects safe areas on notched phones.

**Review notes:**
- *feasibility* (revise): Keep the cinematic director and transitions, and absorb UX-8's boss card. Cinematics must pause the sim so skips and 'seen' flags never change tick timing. ENM-5 owns phases.
- *player* (merge → ENM-5): Boss intros, phase beats and deaths duplicate ENM-5. Themed screen transitions are low-value polish; a single keyhole wipe can live in UX-8.
- *completeness* (revise, effort M): Keep the cinematic director and themed transitions; boss-intro content belongs to ENM-5, and this takes UX-8's banner card. Its name also collides with ENM-5's 'Curtain Call'.

#### AUD-7 · The Living Score: adaptive stems, biome themes and leitmotifs

*Music & sound · effort L · impact 5/5*

A MusicDirector reads combat intensity from the World every frame and fades five stems per song on the beat. Each floor gets its own composed theme, rooms get their own pieces, and recurring leitmotifs (the hero's call and the Count's lament) build towards the final fight. **Player value:** The music breathes with the fight. A lone bat keeps the harpsichord ticking; a room full of Axe Armors brings in timpani, organ and choir, which fall away as the last skeleton crumbles into a cartoony 'Room Cleared!' cadence. By Floor 3 you recognise the Count's lament before you ever see him.

- **Intensity director** — Each frame, read World SoA without writing to it. threat = Σ over alive enemies of cost × (elite ? 2.5 : 1) × proximity, where proximity = clamp(1 - (d - 150)/650, 0.2, 1). target = clamp(threat/22 + 0.4·(1 - hpFrac)² + recentHurt (decays over 2 s) + 0.25·wavePending, 0, 1), smoothed with τ 0.6 s rising and 4 s falling. Stems use hysteresis: L1 ≥0.05; L2 ≥0.25 (off <0.18); L3 ≥0.5 (off <0.4); L4 ≥0.8 (off <0.68). Changes apply on the next beat as equal-power fades lasting one bar.
  - *Implementation:* src/audio/director.ts, called in App.render after renderer.render. O(slots.high) over E.x/E.y/E.def/E.elite. Settings musicMode 'steady' pins intensity at 0.4.
  - *Acceptance:* Update cost ≤0.03 ms with 400 enemies (perf test). In a scripted scenario (spawn 30 skeletons near the player, then kill them all), stems rise and then fall, and no stem toggles more than once per 4 s.
- **Three biome themes, five stems each** — Castle Gate, 'Gatebreaker March': D minor, 132 bpm, 4/4. L0 wind drone; L1 harpsichord 16th ostinato; L2 organ and walking bass; L3 snare rolls and timpani; L4 brass stabs and choir. Form A(16) B(16) A′.
Bone Catacombs, 'Ossuary Waltz': E Phrygian, 108 bpm, 3/4. Bone xylophone melody, pizzicato bass and drip percussion, then tom-toms and a 'skeleton shaker' at L3 and a low 'oo' choir at L4, in the spirit of a cartoon skeleton dance.
Moonlit Throne, 'Nocturne of the Blood Moon': C harmonic minor, 116 bpm, 6/8. Vox Humana organ, harpsichord counterpoint, a bell toll every 16 bars, and full organ with choir at L4.
Explore and battle are the same song at different intensity, so there is never a hard cut.
  - *Implementation:* src/audio/score/songs/{gate,catacombs,throne}.ts in Grimoire notation, mapped by floor index (replacing KEY_ROOT).
  - *Acceptance:* Each song compiles with all 5 layers non-empty, loops seamlessly (no event straddles the loop point without a tie), and passes the Epic 2 loudness smoke for every intensity level.
- **Room-type and run-arc pieces** — Shop 'Merchant's Lantern': music box and cartoony FM bassoon, F major, 3/4, 92 bpm. Sanctuary 'Campfire Hymn': lute with fire crackle, 66 bpm. Mystery event 'Curious Corridor': whole-tone celesta, 80 bpm. Elite rooms lift the biome theme a semitone, force L3 on and open with an 'elite_horn'. Title 'Crimson Keep Overture'. Game over 'Requiem for a Hunter': 8 bars of minor plagal choir quoting the public-domain Dies Irae. Victory 'Dawn over the Keep' in D major.
  - *Implementation:* setMoodForRoom in app.ts maps room.kind and floor to a song id through a table in src/audio/score/songs/index.ts instead of the 5 hard-coded moods.
  - *Acceptance:* Every RoomKind × floor maps to a song (registry test). The shop and sanctuary pieces never fire L3/L4.
- **Leitmotif system** — Hero 'Crimson Call' (D-A-G-A-D′) in each class's colour (Vanguard brass, Weaver celesta, Phantom muted pizzicato) plays on the title, level-up, room clear and victory. Count Vlador's 'Lament' (descending chromatic tetrachord A-G♯-G-F♯-F plus a Dies Irae incipit) is foreshadowed: a music box at Floor 1 blood shrines, low organ in Floor 2 mystery events, the explore bass at L2+ on Floor 3, and the full statement in the boss fight. Gorehorn's 'Two Heads' is a tritone grunt call-and-response; the Colossus has a 7-note bell ostinato (E-B-E-F-E-B-A).
  - *Implementation:* src/audio/score/motifs.ts with a MotifPlayer that transposes and re-harmonizes into the current song's key and mode, quantized to the next 8th note.
  - *Acceptance:* Every level-up stinger note belongs to the current scale (test). An automated 3-floor run log shows the Count motif at least once per floor.
- **Musical transitions** — A room clear plays a 2-bar 'Room Cleared!' cadence (V-i with tambourine sparkle) on the next downbeat, then stems fall back to explore. Walking through a door continues the floor song (resume) with a one-bar crossfade if the room type changes. A wave telegraph (0.8 s) triggers a drum riser timed to land on a beat where possible; only audio quantizes, the sim is untouched. A floor change plays a 4-bar outro and the new biome intro under the floor title card.
  - *Implementation:* Director listens to app.ts world events ('cleared', 'exit') and the hazard cues from Epic 3.
  - *Acceptance:* The cleared cadence starts within one bar of the event. Two songs never overlap for more than one bar. Crossfades are equal-power (sum of gains² = 1 ±0.02).
- **Danger layer at low HP** — Below 25% HP a synth heartbeat layer starts at 72 bpm and rises to 110 bpm at 10% HP, and the music is high-passed at 300 Hz (-3 dB). An active Bloodlust card adds a pulsing red choir drone. Healing restores the mix within 1 s.
  - *Implementation:* Director reads player.hp/stats.maxHp and p.hooks.bloodlust, and switches to the lowHp mix snapshot (Epic 1).
  - *Acceptance:* At hp 0.2 the heartbeat is on; back at 0.3 it stops within 1 s. The heartbeat respects telegraphBoost and captions 'Low health'.
- **Beat clock for other domains** — Exposes Conductor.beatPhase and barIndex so other domains can sync to the music: candelabra flames flaring on downbeats, the title-screen castle windows pulsing, the HUD 'Round x/y' pill bouncing on bar 1.
  - *Implementation:* A read-only getter on MusicDirector; consumers poll it each frame, with no events and no allocation.
  - *Acceptance:* beatPhase moves monotonically from 0 to 1 within each beat and resets on beat boundaries within 2 ms. A stub consumer test passes.

**Depends on:** Epics 1, 5 and 6; SIM: read-only World SoA access (exists); named enemy/boss state constants exported from enemyAi.ts; NARRATIVE/EVENTS: hooks in mystery events and blood shrines to request motif playback; UI: floor title card timing; ART/UI to consume beatPhase (optional)
**Risks:** Composition quality is the main risk; budget a dedicated composer pass.; Adaptive thrash; mitigate with hysteresis and bar quantization.; Three themes may wear thin over 20–30 minute runs; mitigate with A/B sections and seeded variation.; Melodies must be original (no Konami quotes); public-domain quotes only (Dies Irae, the BWV 565 gesture).
**Constraint check:** Songs are notation strings in TypeScript (about 12 KB gz for 10 songs). The director is a read-only O(n) pass costing ≤0.03 ms. Variation is deterministic through STREAM.music. No sim changes. All instruments are synthesized. Main-thread audio work (drain + director + conductor) stays under 0.3 ms per frame on desktop and 0.6 ms on phones.

**Review notes:**
- *feasibility* (keep): Five stems per song multiplies voices on phones; tie layers to AUD-6's quality tiers. Reading intensity read-only from World is determinism-safe.
- *player* (keep): Adaptive stems and leitmotifs strongly support mood. Composition quality is the real risk; budget a composer pass and write biome themes in step with BIO-5.
- *completeness* (revise, effort XL): Only three biome themes, but BIO-5 and BIO-8 add six biomes. Budget a theme per biome. Composition is the critical path; closer to XL.

#### AUD-8 · EPIC BOSS FIGHTS!: boss themes, phase music and stingers

*Music & sound · effort L · impact 5/5*

Each boss gets its own multi-phase theme, synced to its attack state machine and HP thresholds. Fights are framed by a gong-and-organ intro stinger timed to the 'EPIC BOSS FIGHT!' banner, phase-change shouts, and a tape-stop and fanfare on the kill. The run gets a matching set of in-key stingers. **Player value:** Every boss sounds like itself. Gorehorn's two heads argue in stereo, the Rune Colossus hums in an odd 7/8 rune rhythm, and Count Vlador's organ toccata collapses into silence when he vanishes, then crashes back as he reappears behind you.

- **Boss intro stinger synced to the banner** — On bossSpawned, a 2.5 s stinger plays: tam-tam hit, full-organ chord, choir 'ah' swell and the boss motif. The floor theme ducks, and the HUD 'EPIC BOSS FIGHT!' banner lands on the gong. The theme starts on bar 1 as the stinger ends. This replaces the double boss_roar (app.ts plus enemyAi.ts).
  - *Implementation:* src/audio/score/stingers.ts. The Conductor schedules the stinger and fires a callback at gong time, which app.ts uses to call hud.banner.
  - *Acceptance:* The theme's first downbeat falls at the stinger's end ±10 ms. The banner callback fires within one frame of the gong.
- **Gorehorn, Twin Ogre: 'Two Heads, One Appetite'** — 6/8 at 144 bpm: a stomping FM tuba bass and two duelling melody voices panned -0.45 and +0.45 (the two heads argue in call-and-response). A timpani roll exactly fills each slam telegraph (0.85 s). The charge (state 2) adds a galloping snare. Below 60% HP, the summon phase adds a skeleton xylophone. Enraged below 40% HP, the key rises a semitone and the hi-hats go double-time.
  - *Implementation:* src/audio/score/songs/bossOgre.ts. The director maps ogre states (windup 1, charge windup 4, charge 2, summon 5) to layers.
  - *Acceptance:* With a scripted boss HP below 0.4, the next bar plays a semitone up. The timpani roll's duration equals the slam telegraph's life ±1 tick.
- **Rune Colossus: 'Runes of the Sleeping Stone'** — 7/8 at 100 bpm with a bell ostinato (the blue rune pulses) over a sub drone. Rune-burst volleys (state 4) trigger bell clusters on the beat, ground spikes (state 5) tick, and the enraged spiral (state 7) adds a shimmering celesta arpeggio layer. On enrage, the bass gets waveshaper distortion and magenta 'crack' noise hits come in.
  - *Implementation:* src/audio/score/songs/bossGolem.ts plus a per-song distortion insert on the bass channel.
  - *Acceptance:* Entering state 7 brings in the celesta layer within one beat, and it leaves within one bar of state 3.
- **Count Vlador: 'Crimson Nocturne'** — Opens with an organ toccata (a transformed version of the public-domain BWV 565 mordent gesture), harpsichord counterpoint and choir. Vanish (state 4) drops the music to its reverb tail for 0.5 s, then it crashes back with an organ stab when he reappears. Hellfire (state 5) brings brass hits per fan, the blood spiral (6) a pulsing choir, and bats (7) a shrill string tremolo. Phase 2 below 40% HP becomes the 'Blood Moon Waltz' in 3/4, with Dies Irae in the bass and an accelerando from 120 to 138 bpm.
  - *Implementation:* src/audio/score/songs/bossCount.ts. The vanish gap is implemented as a stem gate plus reverb-send boost.
  - *Acceptance:* During state 4, the dry music bus gain is ≤-30 dB. On reappearing, the stab plays within 20 ms. Phase 2 reaches 138 bpm within 8 bars.
- **Phase and attack sync from boss state** — The director reads boss HP fraction (as hud.ts already does) and E.state[bossIndex] each frame. Crossing 60% or 40% fires a phase stinger (choir shout and gong) and swaps sections on the next bar.
  - *Implementation:* Requires named boss state constants exported from enemyAi.ts (OGRE.SLAM_WINDUP = 1, COUNT.VANISH = 4, and so on), ideally plus a 'bossPhase' WorldEvent. Epic 2 contract tests guard the mapping.
  - *Acceptance:* Crossing 40% fires the phase stinger within one frame and changes section within one bar. A test fails if a boss state id used by music is missing from the enum.
- **Defeat and victory stingers** — On bossDefeated, the music tape-stops in sync with the 0.3 timeScale slow-mo (1.2 s), a choir cadence follows, and the hero's 'Crimson Call' plays as a major fanfare under the 'BOSS DEFEATED!' banner. Killing the Count leads into 'Dawn over the Keep' on the end screen.
  - *Implementation:* The 'victory' snapshot (Epic 1) plus a sequence in stingers.ts, triggered from handleEvents in app.ts.
  - *Acceptance:* The tape-stop ends within ±50 ms of slowT expiring. The fanfare is in the parallel major of the boss key.
- **Run stingers, always in key** — Elite spawn: brass stab. Level-up: an arpeggio in the current key. Card rarity: common pluck, uncommon bell, rare organ chord, epic choir with bell and gong. Chest open: sparkle. Blood shrine: minor organ chord. Game over: 'Requiem' sting. All are quantized to the next 8th note and transposed into the current key.
  - *Implementation:* stingers.ts via the MotifPlayer (Epic 7). Each stinger declares its duck depth.
  - *Acceptance:* Every stinger is ≤3 s, ducks the music by its declared amount, and all its notes belong to the current scale (test).

**Depends on:** Epics 1, 5, 6 and 7; SIM/BOSS domain: exported boss state enums in enemyAi.ts and ideally a 'bossPhase' WorldEvent; UI: a hud.banner timing callback for the intro stinger; BOSS/CONTENT domain: new or redesigned bosses must ship a theme and motif
**Risks:** Boss states are magic numbers today, so an AI refactor can silently break sync; Epic 2 contract tests catch it.; Busy music over bullet-hell patterns can mask telegraphs; keep L4 restrained and let telegraph cues duck the music.; Copyright: no Konami melodies, only originals and public-domain quotes.
**Constraint check:** Boss themes are notation strings, about 2 KB gz each. The boss-room voice budget is capped per quality tier (≤16 music voices on low). Boss state is read only. Variation is deterministic through STREAM.music. Everything is synthesized, with no files. Total audio growth across all epics is about 50 KB gz, so the bundle stays near 300 KB against the 1 MB budget.

**Review notes:**
- *feasibility* (keep): Needs ENM-5's bossPhase event, not magic state numbers. Every new boss from ENM-6/7 and BIO-5/8 adds a theme, so budget composer time explicitly.
- *player* (keep): Boss themes are a Castlevania must. Depends on ENM-5's bossPhase events and exported state enums; schedule after ENM-5, not before.
- *completeness* (revise): Covers three bosses, but ENM-6/7/8 add about 14 bosses and mini-bosses. Add a reusable boss-theme template and a cheaper mini-boss variant.
