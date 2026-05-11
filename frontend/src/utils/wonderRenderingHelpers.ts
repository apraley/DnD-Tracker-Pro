/**
 * Ecological Wonders Rendering Helpers
 *
 * Utilities for rendering wonder data in UI, formatting for display,
 * and creating GRIMOIRE integration links.
 */

import { PointOfInterest } from '../types/world';

export function isEcologicalWonder(poi: PointOfInterest): boolean {
  return poi.type === 'ecological_wonder' && !!poi.wonderMetadata;
}

export function getWonderLeaderDisplay(poi: PointOfInterest): {
  name: string;
  archetype: string;
  style: string;
  alignment: string;
} | null {
  if (!isEcologicalWonder(poi)) return null;
  return poi.wonderMetadata!.leader || null;
}

export function formatLeaderStyle(style: string): string {
  // Clean up the leadership style for display
  // "rules with sacred duty, protects all creatures equally" → nicely formatted
  const sentences = style.split(', ');
  return sentences
    .map((s, i) => i === 0 ? s.charAt(0).toUpperCase() + s.slice(1) : s)
    .join('. ')
    .replace(/\.$/, '') + '.';
}

export function getWonderAlignmentColor(alignment: string): string {
  const alignmentColors: Record<string, string> = {
    'Lawful Good': '#2ecc71',
    'Neutral Good': '#27ae60',
    'Chaotic Good': '#16a085',
    'Lawful Neutral': '#f39c12',
    'Neutral': '#95a5a6',
    'Chaotic Neutral': '#e74c3c',
    'Lawful Evil': '#c0392b',
    'Neutral Evil': '#8b0000',
    'Chaotic Evil': '#2c3e50',
  };
  return alignmentColors[alignment] || '#95a5a6';
}

export function getDangerLevelDescription(level: number): {
  label: string;
  color: string;
  description: string;
} {
  if (level <= 5) {
    return { label: 'Safe', color: '#2ecc71', description: 'Generally safe for adventurers' };
  } else if (level <= 10) {
    return { label: 'Moderate', color: '#f39c12', description: 'Some hazards present' };
  } else if (level <= 15) {
    return { label: 'Dangerous', color: '#e74c3c', description: 'Significant threats' };
  } else {
    return { label: 'Deadly', color: '#2c3e50', description: 'Extreme danger' };
  }
}

export function formatBoonEffect(effect: string): string {
  // Convert mechanical shorthand to readable format
  // "+2 to spell save DC for one school of magic for 30 days"
  // stays as-is (already readable)
  return effect;
}

export function formatBaneEffect(effect: string): string {
  // Convert mechanical shorthand to readable format
  return effect;
}

export function getQuestHookDifficultyColor(difficulty: number): string {
  if (difficulty <= 3) return '#2ecc71';      // Green - easy
  if (difficulty <= 6) return '#f39c12';      // Orange - moderate
  if (difficulty <= 12) return '#e74c3c';     // Red - hard
  return '#2c3e50';                            // Dark - deadly
}

export function getQuestHookDifficultyLabel(difficulty: number): string {
  if (difficulty <= 3) return 'Easy';
  if (difficulty <= 6) return 'Moderate';
  if (difficulty <= 12) return 'Hard';
  return 'Deadly';
}

export function createGrimoireNpcBuilderLink(
  poiId: string,
  leaderName: string,
  leaderArchetype: string,
  alignment: string,
  grimoireNpcRef: string
): {
  url: string;
  label: string;
  description: string;
} {
  // Create a link/button that will trigger GRIMOIRE NPC builder
  return {
    url: `grimoire://npc-builder/${grimoireNpcRef}?source=world-builder&poi=${poiId}`,
    label: `Generate ${leaderName} (${leaderArchetype})`,
    description: `Open GRIMOIRE NPC builder to generate full stat block and personality for ${leaderName}`,
  };
}

export function createGrimoireCommerceLink(
  poiId: string,
  estName: string,
  estType: string,
  grimoireCommerceRef: string
): {
  url: string;
  label: string;
  description: string;
} {
  return {
    url: `grimoire://commerce-engine/${grimoireCommerceRef}?source=world-builder&poi=${poiId}`,
    label: `Generate ${estName}`,
    description: `Open GRIMOIRE commerce engine to generate inventory, proprietor, and rumors for ${estName}`,
  };
}

export function extractBoonChoices(wonder: PointOfInterest): Array<{
  id: string;
  name: string;
  description: string;
  effect: string;
}> {
  if (!isEcologicalWonder(wonder) || !wonder.wonderMetadata?.boons) {
    return [];
  }

  return wonder.wonderMetadata.boons.map((boon, idx) => ({
    id: `boon_${idx}`,
    name: boon.name,
    description: boon.description,
    effect: formatBoonEffect(boon.mechanicalEffect),
  }));
}

export function extractBaneChoices(wonder: PointOfInterest): Array<{
  id: string;
  name: string;
  description: string;
  effect: string;
}> {
  if (!isEcologicalWonder(wonder) || !wonder.wonderMetadata?.banes) {
    return [];
  }

  return wonder.wonderMetadata.banes.map((bane, idx) => ({
    id: `bane_${idx}`,
    name: bane.name,
    description: bane.description,
    effect: formatBaneEffect(bane.mechanicalEffect),
  }));
}

export function getEstablishmentIcon(type: string): string {
  const icons: Record<string, string> = {
    'Trading Post': '🏪',
    "Scholar's Tower": '📚',
    'Healing Spring House': '💊',
    'Alchemist Lab': '⚗️',
    'Beast Handler': '🐲',
    'Guide Service': '🧭',
  };
  return icons[type] || '🏛️';
}

export function buildWonderSummary(poi: PointOfInterest): string {
  if (!isEcologicalWonder(poi)) return '';

  const meta = poi.wonderMetadata!;
  const leaderInfo = meta.leader
    ? `${meta.leader.name} (${meta.leader.archetype})`
    : 'Unknown Leader';

  const questCount = meta.questHooks?.length ?? 0;
  const estCount = meta.establishments?.length ?? 0;

  return `
${poi.name} (${meta.terrain})
Ruled by: ${leaderInfo}
Danger Level: ${poi.dangerLevel}
Quest Hooks: ${questCount}
Local Establishments: ${estCount}

${meta.lore}
  `.trim();
}

export function getWonderBreadcrumbs(poi: PointOfInterest): Array<{
  label: string;
  type: 'type' | 'terrain' | 'leader' | 'danger';
  value: string;
}> {
  if (!isEcologicalWonder(poi)) return [];

  const meta = poi.wonderMetadata!;
  const danger = getDangerLevelDescription(poi.dangerLevel);

  return [
    { label: 'Ecological Wonder', type: 'type', value: 'ecological_wonder' },
    { label: meta.terrain, type: 'terrain', value: meta.terrain },
    { label: meta.leader?.archetype || 'Unknown', type: 'leader', value: meta.leader?.archetype || 'unknown' },
    { label: danger.label, type: 'danger', value: danger.label },
  ];
}

export function createWonderExportData(poi: PointOfInterest): Record<string, unknown> {
  if (!isEcologicalWonder(poi)) {
    return { error: 'Not an ecological wonder' };
  }

  const meta = poi.wonderMetadata!;

  return {
    name: poi.name,
    terrain: meta.terrain,
    dangerLevel: poi.dangerLevel,
    leader: {
      name: meta.leader?.name,
      archetype: meta.leader?.archetype,
      alignment: meta.leader?.alignment,
      style: meta.leader?.style,
    },
    boons: meta.boons?.map(b => ({
      name: b.name,
      effect: b.mechanicalEffect,
    })),
    banes: meta.banes?.map(b => ({
      name: b.name,
      effect: b.mechanicalEffect,
    })),
    questHooks: meta.questHooks?.map(q => ({
      title: q.title,
      difficulty: q.difficulty,
    })),
    establishments: meta.establishments?.map(e => ({
      name: e.name,
      type: e.type,
    })),
  };
}

export function getWonderTypeEmoji(poiType: string): string {
  const emojiMap: Record<string, string> = {
    ecological_wonder: '🌿',
    dungeon: '🏰',
    ruins: '🏛️',
    geographical_landmark: '⛰️',
    cave: '⛏️',
    tomb: '⚰️',
    crypt: '🦇',
    lair: '🐲',
    shrine: '⛩️',
    settlement: '🏘️',
  };
  return emojiMap[poiType] || '📍';
}

export function sortWondersByDanger(wonders: PointOfInterest[]): PointOfInterest[] {
  return [...wonders].sort((a, b) => a.dangerLevel - b.dangerLevel);
}

export function filterWondersByTerrain(wonders: PointOfInterest[], terrain: string): PointOfInterest[] {
  return wonders.filter(w => isEcologicalWonder(w) && w.wonderMetadata?.terrain === terrain);
}

export function filterWondersByAlignment(wonders: PointOfInterest[], alignment: string): PointOfInterest[] {
  return wonders.filter(w => isEcologicalWonder(w) && w.wonderMetadata?.leader?.alignment === alignment);
}

export function filterWondersByArchetype(wonders: PointOfInterest[], archetype: string): PointOfInterest[] {
  return wonders.filter(w => isEcologicalWonder(w) && w.wonderMetadata?.leader?.archetype === archetype);
}

export function findWonderById(wonders: PointOfInterest[], id: string): PointOfInterest | undefined {
  return wonders.find(w => w.id === id);
}

export function getUniqueTerrains(wonders: PointOfInterest[]): string[] {
  const terrains = new Set<string>();
  wonders.forEach(w => {
    if (isEcologicalWonder(w) && w.wonderMetadata?.terrain) {
      terrains.add(w.wonderMetadata.terrain);
    }
  });
  return Array.from(terrains).sort();
}

export function getUniqueArchetypes(wonders: PointOfInterest[]): string[] {
  const archetypes = new Set<string>();
  wonders.forEach(w => {
    if (isEcologicalWonder(w) && w.wonderMetadata?.leader?.archetype) {
      archetypes.add(w.wonderMetadata.leader.archetype);
    }
  });
  return Array.from(archetypes).sort();
}

export function getUniqueAlignments(wonders: PointOfInterest[]): string[] {
  const alignments = new Set<string>();
  wonders.forEach(w => {
    if (isEcologicalWonder(w) && w.wonderMetadata?.leader?.alignment) {
      alignments.add(w.wonderMetadata.leader.alignment);
    }
  });
  return Array.from(alignments).sort();
}

export function calculateWonderStats(wonders: PointOfInterest[]): {
  totalWonders: number;
  totalQuestHooks: number;
  avgDangerLevel: number;
  terrainDistribution: Record<string, number>;
  archetypeDistribution: Record<string, number>;
} {
  const stats = {
    totalWonders: 0,
    totalQuestHooks: 0,
    avgDangerLevel: 0,
    terrainDistribution: {} as Record<string, number>,
    archetypeDistribution: {} as Record<string, number>,
  };

  let dangerSum = 0;

  wonders.forEach(w => {
    if (isEcologicalWonder(w)) {
      stats.totalWonders++;
      dangerSum += w.dangerLevel;

      const meta = w.wonderMetadata!;

      stats.totalQuestHooks += meta.questHooks?.length ?? 0;

      if (meta.terrain) {
        stats.terrainDistribution[meta.terrain] = (stats.terrainDistribution[meta.terrain] ?? 0) + 1;
      }

      if (meta.leader?.archetype) {
        stats.archetypeDistribution[meta.leader.archetype] =
          (stats.archetypeDistribution[meta.leader.archetype] ?? 0) + 1;
      }
    }
  });

  stats.avgDangerLevel = stats.totalWonders > 0 ? Math.round(dangerSum / stats.totalWonders) : 0;

  return stats;
}
