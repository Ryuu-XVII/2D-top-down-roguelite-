import { hashCombine, Rng, STREAM } from '../core/rng';
import type { Rarity } from '../gen/loot';
import { offerCards, type CardDef, type UnlockPack } from './cards';
import { rollItem, type ItemDef } from './equipment';

export type ShopEntry =
  | { kind: 'card'; card: CardDef; price: number; sold: boolean }
  | { kind: 'item'; item: ItemDef; price: number; sold: boolean }
  | { kind: 'potion'; price: number; sold: boolean }
  | { kind: 'tonic'; price: number; sold: boolean };

const CARD_PRICE: Record<Rarity, number> = { common: 30, uncommon: 45, rare: 70, epic: 110 };
const ITEM_PRICE: Record<Rarity, number> = { common: 35, uncommon: 55, rare: 85, epic: 130 };

/** Deterministic shop stock for a shop room. */
export function shopStock(roomSeed: number, floor: number, owned: ReadonlyMap<string, number>, packs: ReadonlySet<UnlockPack>): ShopEntry[] {
  const rng = new Rng(hashCombine(roomSeed, STREAM.shop));
  const mul = 1 + 0.25 * floor;
  const out: ShopEntry[] = [];
  for (const c of offerCards(rng, owned, packs, 3)) out.push({ kind: 'card', card: c, price: Math.round(CARD_PRICE[c.rarity] * mul), sold: false });
  const rarities: Rarity[] = ['uncommon', rng.chance(0.35) ? 'epic' : 'rare'];
  const seen = new Set<string>();
  for (const r of rarities) {
    let it = rollItem(rng, r);
    for (let k = 0; k < 4 && seen.has(it.id); k++) it = rollItem(rng, r);
    seen.add(it.id);
    out.push({ kind: 'item', item: it, price: Math.round(ITEM_PRICE[it.rarity] * mul), sold: false });
  }
  out.push({ kind: 'potion', price: Math.round(25 * mul), sold: false });
  out.push({ kind: 'tonic', price: Math.round(60 * mul), sold: false });
  return out;
}

// ── Mystery events (data-driven; effects resolved by the game) ─────────────

export type EventEffect =
  | { type: 'hpCostCard'; hpPct: number; rarity: Rarity }
  | { type: 'scrapHeal'; cost: number }
  | { type: 'gamble'; cost: number }
  | { type: 'vision' }
  | { type: 'cursedItem'; hp: number; rarity: Rarity }
  | { type: 'statPoints'; amount: number }
  | { type: 'xp'; amount: number }
  | { type: 'healPct'; pct: number }
  | { type: 'card'; id: string }
  | { type: 'leave' };

export interface EventChoice {
  label: string;
  detail: string;
  effect: EventEffect;
}

export interface MysteryEvent {
  id: string;
  title: string;
  text: string;
  icon: string;
  choices: EventChoice[];
}

export const EVENTS: MysteryEvent[] = [
  {
    id: 'blood_altar',
    title: 'The Blood Altar',
    text: 'A chalice brims with something dark and warm. Whispers promise power — for a price.',
    icon: 'drop',
    choices: [
      { label: 'Offer blood', detail: 'Lose 25% HP. Choose a RARE card.', effect: { type: 'hpCostCard', hpPct: 0.25, rarity: 'rare' } },
      { label: 'Offer gems', detail: 'Pay 40 gems. Heal to full.', effect: { type: 'scrapHeal', cost: 40 } },
      { label: 'Walk away', detail: 'Nothing happens.', effect: { type: 'leave' } },
    ],
  },
  {
    id: 'fortune_skull',
    title: "The Fortune-Teller's Skull",
    text: 'A grinning skull on a velvet cushion clacks its jaw. "Care to wager, hunter?"',
    icon: 'skull',
    choices: [
      { label: 'Gamble 30 gems', detail: '50%: double them. 50%: lose them.', effect: { type: 'gamble', cost: 30 } },
      { label: 'Ask for a vision', detail: 'Choose 1 of 3 cards.', effect: { type: 'vision' } },
      { label: 'Leave', detail: 'The skull sulks.', effect: { type: 'leave' } },
    ],
  },
  {
    id: 'cursed_armory',
    title: 'The Forgotten Armory',
    text: 'Rusted racks hold a single gleaming relic, chained and humming with malice.',
    icon: 'sword',
    choices: [
      { label: 'Break the chains', detail: 'Gain a RARE item. −10 max HP (permanent).', effect: { type: 'cursedItem', hp: 10, rarity: 'rare' } },
      { label: 'Leave it be', detail: 'Wise, perhaps.', effect: { type: 'leave' } },
    ],
  },
  {
    id: 'wandering_ghost',
    title: 'A Wandering Ghost',
    text: 'A lantern-eyed ghost drifts by, lost in the halls it once guarded.',
    icon: 'soul',
    choices: [
      { label: 'Guide it home', detail: '+2 stat points.', effect: { type: 'statPoints', amount: 2 } },
      { label: 'Absorb its essence', detail: 'Gain a burst of experience.', effect: { type: 'xp', amount: 160 } },
    ],
  },
  {
    id: 'holy_fountain',
    title: 'The Moonlit Fountain',
    text: 'Silver water glows under a shaft of moonlight. It smells faintly of lilies.',
    icon: 'moon',
    choices: [
      { label: 'Drink deeply', detail: 'Heal 50% HP.', effect: { type: 'healPct', pct: 0.5 } },
      { label: 'Fill a flask', detail: 'Gain the Vital Draught card.', effect: { type: 'card', id: 'vital_draught' } },
    ],
  },
];

export function pickEvent(roomSeed: number): MysteryEvent {
  const rng = new Rng(hashCombine(roomSeed, STREAM.events));
  return rng.pick(EVENTS);
}
