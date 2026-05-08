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
      // City NPCs with GRIMOIRE NPC builder references
      _cityLeaderRef: (c.notableCitizens ?? [])[0]?.id,
      _cityNpcRefs: (c.notableCitizens ?? []).slice(1).map(n => n.id),
      // Commerce references for district establishments
      _commerceRefs: (c.exNovoMetadata?.districts ?? []).flatMap(d =>
        (d.establishments ?? []).map(e => (e as any).grimoireCommerceRef || '')
      ).filter(Boolean),
    })),

    // City-to-city travel graph (Priority 4)
    routes: world.routes ?? [],

    // Points of Interest with Ecological Wonder metadata
    pointsOfInterest: world.pointsOfInterest.map(poi => {
      if (poi.wonderMetadata?.leader?.grimoireNpcRef) {
        // Wonder has leader NPC reference — ensure it's available for GRIMOIRE NPC builder
        return {
          ...poi,
          // Marker for GRIMOIRE: use the leader NPC reference for stat block generation
          _wonderLeaderNpcRef: poi.wonderMetadata.leader.grimoireNpcRef,
          // Commerce references for establishments that need to be generated
          _wonderCommerceRefs: (poi.wonderMetadata.establishments ?? []).map(e => e.grimoireCommerceRef),
        };
      }
      return poi;
    }),

    // World-level NPCs with combat block
    npcs: (world.npcs ?? []).map(n => ({ ...n, combat: npcCombat(n) })),

    // Metadata: NPC and Commerce references for all world content
    npcReferences: {
      schema: 1,
      description: 'NPC references for GRIMOIRE NPC builder integration',

      // City leaders and notable citizens
      cityLeaders: world.cities
        .filter(c => (c.notableCitizens ?? []).length > 0)
        .map(c => ({
          cityId: c.id,
          cityName: c.name,
          leaderName: c.notableCitizens![0].name,
          leaderType: c.notableCitizens![0].type,
          leaderRole: (c.notableCitizens![0] as any).role || 'Unknown',
          leaderAlignment: c.notableCitizens![0].alignment,
          grimoireNpcRef: c.notableCitizens![0].id,
        })),

      // Other notable city citizens
      cityCitizens: world.cities
        .flatMap(c => (c.notableCitizens ?? []).slice(1).map(npc => ({
          cityId: c.id,
          cityName: c.name,
          citizenName: npc.name,
          citizenType: npc.type,
          citizenRole: (npc as any).role || 'Unknown',
          grimoireNpcRef: npc.id,
        }))),

      // Ecological wonder leaders
      wonderLeaders: world.pointsOfInterest
        .filter(poi => poi.wonderMetadata?.leader?.grimoireNpcRef)
        .map(poi => ({
          poiId: poi.id,
          poiName: poi.name,
          leaderName: poi.wonderMetadata!.leader!.name,
          leaderArchetype: poi.wonderMetadata!.leader!.archetype,
          leaderAlignment: poi.wonderMetadata!.leader!.alignment,
          grimoireNpcRef: poi.wonderMetadata!.leader!.grimoireNpcRef,
        })),
    },

    commerceReferences: {
      schema: 1,
      description: 'Commerce references for GRIMOIRE commerce engine integration',

      // City establishments (from districts)
      cityEstablishments: world.cities
        .flatMap(c => (c.exNovoMetadata?.districts ?? []).flatMap(d =>
          (d.establishments ?? []).map(est => ({
            cityId: c.id,
            cityName: c.name,
            districtName: d.name,
            establishmentId: est.id,
            establishmentName: est.name,
            establishmentType: est.type,
            proprietorName: (est as any).proprietor?.name || 'Unknown',
            grimoireCommerceRef: (est as any).grimoireCommerceRef ||
              `commerce_${Math.random().toString(16).slice(2)}`,
          }))
        )),

      // Ecological wonder establishments
      wonderEstablishments: world.pointsOfInterest
        .filter(poi => poi.wonderMetadata?.establishments && poi.wonderMetadata.establishments.length > 0)
        .flatMap(poi => (poi.wonderMetadata!.establishments ?? []).map(est => ({
          poiId: poi.id,
          poiName: poi.name,
          establishmentId: est.id,
          establishmentName: est.name,
          establishmentType: est.type,
          grimoireCommerceRef: est.grimoireCommerceRef,
        }))),
    },
  };
}
