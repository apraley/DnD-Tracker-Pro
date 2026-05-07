/**
 * GRIMOIRE Export Bridge
 *
 * Transforms the internal World object into the canonical shape GRIMOIRE expects.
 * Written to localStorage under 'grimoire-world' immediately after world generation.
 *
 * Priority 5: NPC flat stat fields are wrapped into a `combat` block so GRIMOIRE's
 * npcStatBlockHTML() renders them with zero translation.
 *
 * Priority 6: exportForGrimoire() is the single canonical exit point — no render
 * state leaks across the bridge.
 */

import { World, NPC } from '../types/world';

// ─── NPC combat block (Priority 5) ───────────────────────────────────────────

function npcCombat(npc: NPC) {
  const level    = npc.level ?? 1;
  const dexMod   = npc.dex ? Math.floor((npc.dex - 10) / 2) : 0;
  const profBonus = Math.max(2, Math.ceil(level / 4) + 1);
  return {
    level,
    stats: {
      str: npc.str ?? 10,
      dex: npc.dex ?? 10,
      con: npc.con ?? 10,
      int: npc.int ?? 10,
      wis: npc.wis ?? 10,
      cha: npc.cha ?? 10,
    },
    hp:         npc.hp  ?? 8,
    ac:         npc.ac  ?? 10,
    initiative: dexMod,
    speed:      30,
    profBonus,
    moves:      [] as Array<{ name: string; desc: string }>,
  };
}

// ─── Main export (Priority 6) ─────────────────────────────────────────────────

export function exportForGrimoire(world: World) {
  return {
    schema:    1,
    worldName: world.name,
    worldSeed: world.worldSeed,
    savedAt:   Date.now(),

    cities: world.cities.map(c => ({
      id:             c.id,
      name:           c.name,
      hex_x:          c.hex_x,
      hex_y:          c.hex_y,
      population:     c.population,
      governmentType: c.governmentType,
      economicFocus:  c.economicFocus,
      // Districts were pre-generated at world-creation time (Priority 2)
      districts:      c.exNovoMetadata?.districts ?? [],
      npcs:           (c.notableCitizens ?? []).map(n => ({ ...n, combat: npcCombat(n) })),
      factions:       c.rulingFactions ?? [],
    })),

    // City-to-city travel graph (Priority 4)
    routes: world.routes ?? [],

    pointsOfInterest: world.pointsOfInterest,

    // World-level NPCs with combat block
    npcs: (world.npcs ?? []).map(n => ({ ...n, combat: npcCombat(n) })),
  };
}
