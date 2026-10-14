import { describe, expect, it } from 'vitest';
import { CONFIG } from '../src/config';
import { Rng } from '../src/core/rng';
import { CARDS, offerCards } from '../src/game/cards';
import { CLASS_ORDER } from '../src/game/classes';
import { NullFx } from '../src/game/fx';
import { emptyIntent } from '../src/game/intent';
import { Player } from '../src/game/player';
import { Run } from '../src/game/run';
import { armorReduce, equipScale, upgradeCost, xpReq } from '../src/game/stats';
import { World } from '../src/game/world';
import { ENEMY } from '../src/game/enemyDefs';

describe('RPG formulas', () => {
  it('matches the spec', () => {
    expect(xpReq(1)).toBe(100);
    expect(xpReq(2)).toBe(Math.floor(100 * Math.pow(2, 1.45)));
    expect(armorReduce(100, 100)).toBe(50);
    expect(armorReduce(100, 0)).toBe(100);
    expect(equipScale(1)).toBe(1);
    expect(equipScale(3)).toBeCloseTo(1.4);
    expect(upgradeCost(1)).toBe(25);
    expect(upgradeCost(3)).toBe(Math.floor(25 * 1.6 * 1.6));
  });

  it('level-ups grant stat points and caps hold', () => {
    const p = new Player('phantom');
    p.attrs.foc = 200;
    p.attrs.int = 200;
    p.attrs.agi = 200;
    p.recompute();
    expect(p.stats.crit).toBeLessThanOrEqual(CONFIG.caps.crit);
    expect(p.stats.cdr).toBeLessThanOrEqual(CONFIG.caps.cdr);
    expect(p.stats.move).toBeLessThanOrEqual(260 * (1 + CONFIG.caps.moveBonus) + 1e-6);
    expect(p.gainXp(250)).toBeGreaterThanOrEqual(1);
  });

  it('card offers are distinct and favour owned tags', () => {
    const rng = new Rng(9);
    const owned = new Map([['phase_satellites', 1]]);
    let orbit = 0;
    for (let i = 0; i < 400; i++) {
      const o = offerCards(rng, owned, new Set());
      expect(new Set(o.map((c) => c.id)).size).toBe(o.length);
      for (const c of o) {
        if (c.tags.includes('ORBIT')) orbit++;
        expect(c.pack).toBeUndefined();
      }
    }
    expect(orbit).toBeGreaterThan(0);
    expect(CARDS.length).toBeGreaterThanOrEqual(20);
  });
});

function playRoom(world: World, rng: Rng, ticks: number) {
  const intent = emptyIntent();
  let t = 0;
  for (let k = 0; k < ticks; k++) {
    if (k % 60 === 0) {
      const a = rng.next() * Math.PI * 2;
      intent.moveX = Math.cos(a);
      intent.moveY = Math.sin(a);
    }
    intent.fire = true;
    intent.autoAim = true;
    intent.dash = k % 200 === 0;
    intent.ability = k % 150 === 0;
    intent.interact = k % 90 === 0;
    world.update(CONFIG.dt, intent);
    world.events.length = 0;
    t++;
    if (!world.player.alive) break;
  }
  return t;
}

describe('simulation smoke test', () => {
  for (const cls of CLASS_ORDER) {
    it(`${cls} can fight through rooms without errors`, () => {
      const run = new Run(1234, 0);
      run.enterFloor(0);
      const player = new Player(cls);
      // Give every hook so all effect paths execute.
      for (const c of CARDS) player.addCard(c.id);
      player.hp = player.stats.maxHp = 1e6;
      const world = new World(new NullFx(), player, 150);
      const rng = new Rng(77);
      let kills = 0;
      for (let step = 0; step < 4; step++) {
        world.loadRoom(run.currentRoom(), run.floor, false);
        playRoom(world, rng, 1200);
        kills = player.kills;
        if (run.node.next.length) run.moveTo(run.node.next[0]);
      }
      expect(kills).toBeGreaterThan(0);
      expect(Number.isFinite(player.x) && Number.isFinite(player.y)).toBe(true);
    }, 60_000);
  }

  it('bosses run all their patterns', () => {
    for (let f = 0; f < 3; f++) {
      const run = new Run(99, 0);
      run.enterFloor(f);
      const player = new Player('vanguard');
      player.stats.maxHp = player.hp = 1e7;
      player.stats.dmgMul = 0.01;
      const world = new World(new NullFx(), player, 150);
      world.loadRoom(run.roomFor(run.graph.bossId), f, false);
      expect(world.bossIndex).toBeGreaterThanOrEqual(0);
      const boss = world.bossIndex;
      const expected = [ENEMY.ogre, ENEMY.golem, ENEMY.count][f];
      expect(world.enemies.def[boss]).toBe(expected);
      playRoom(world, new Rng(f), 120 * 40);
      // Boss is still alive at 1% damage and has been shooting at us.
      expect(world.enemies.slots.alive[boss]).toBe(1);
    }
  }, 60_000);
});
