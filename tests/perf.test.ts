import { describe, expect, it } from 'vitest';
import { CONFIG } from '../src/config';
import { CARDS } from '../src/game/cards';
import { ENEMY } from '../src/game/enemyDefs';
import { NullFx } from '../src/game/fx';
import { emptyIntent } from '../src/game/intent';
import { Player } from '../src/game/player';
import { Run } from '../src/game/run';
import { World } from '../src/game/world';

describe('simulation budget', () => {
  it('a heavy combat tick (150 enemies, every card) stays within the mobile budget', () => {
    const run = new Run(4242, 0);
    run.enterFloor(1);
    const p = new Player('weaver');
    for (const c of CARDS) p.addCard(c.id);
    p.hp = p.stats.maxHp = 1e9;
    const w = new World(new NullFx(), p, 400);
    const combat = run.graph.nodes.find((n) => n.type === 'combat')!;
    w.loadRoom(run.roomFor(combat.id), 1, false);
    // Flood the room to 150 live enemies.
    const kinds = [ENEMY.bat, ENEMY.skeleton, ENEMY.ghoul, ENEMY.archer, ENEMY.witch];
    let k = 0;
    for (let y = 2; y < w.h - 2 && w.enemies.slots.count < 150; y++)
      for (let x = 2; x < w.w - 2 && w.enemies.slots.count < 150; x++)
        if (!w.solidTile(x, y) && (x + y) % 3 === 0) w.spawnEnemy(kinds[k++ % kinds.length], (x + 0.5) * 32, (y + 0.5) * 32, false, 50, 0);
    const intent = emptyIntent();
    intent.fire = true;
    intent.autoAim = true;
    for (let i = 0; i < 120; i++) w.update(CONFIG.dt, intent); // warm up the JIT
    const N = 600;
    const t0 = performance.now();
    for (let i = 0; i < N; i++) {
      intent.moveX = Math.sin(i / 40);
      intent.moveY = Math.cos(i / 55);
      w.update(CONFIG.dt, intent);
      w.events.length = 0;
    }
    const ms = (performance.now() - t0) / N;
    console.log(`avg tick: ${ms.toFixed(3)} ms with ${w.enemies.slots.count} enemies, ${w.projectiles.slots.count} projectiles`);
    expect(w.enemies.slots.count).toBeGreaterThan(100);
    expect(ms).toBeLessThan(4); // §5.D mobile simulation budget
  }, 60_000);
});
