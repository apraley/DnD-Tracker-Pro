/**
 * Ex Umbra Dungeon Simulator — client-side
 * Simulates the Ex Umbra framework for each dungeon/ruin/POI.
 * Generates history, aspects, rooms, encounters, CR tier, and NPC inhabtants.
 */

import { PointOfInterest } from '../types/world';

// ─── CR Tiers ───────────────────────────────────────────────────────────────

export interface CRTier {
  tier: 1 | 2 | 3 | 4;
  label: string;
  levelRange: string;
  crRange: string;
  description: string;
}

const CR_TIERS: CRTier[] = [
  { tier: 1, label: 'Perilous', levelRange: '1–4', crRange: 'CR ¼–CR 4', description: 'Suitable for novice adventurers. Goblins, bandits, undead shamblers, and minor hazards.' },
  { tier: 2, label: 'Deadly', levelRange: '5–10', crRange: 'CR 5–CR 10', description: 'Seasoned heroes required. Ogres, gnolls, cultists, and dangerous magic.' },
  { tier: 3, label: 'Lethal', levelRange: '11–16', crRange: 'CR 11–CR 16', description: 'Only veterans survive. Demon-touched guardians, ancient constructs, and elder undead.' },
  { tier: 4, label: 'Mythic', levelRange: '17–20', crRange: 'CR 17+', description: 'Legend-level threats. Dragons, demon lords, world-ending magic, and divine corruption.' },
];

// ─── Dungeon Data Tables ──────────────────────────────────────────────────────

const DUNGEON_ORIGINS = [
  'a dwarven vault sealed after the last great plague',
  'a military fortress abandoned when its garrison mutinied',
  'a temple to a god whose name has been deliberately forgotten',
  'the personal project of a mad archmage obsessed with immortality',
  'a natural cave system expanded by creatures over generations',
  'a necromancer\'s laboratory abandoned mid-experiment',
  'a thieves\' guild headquarters that fell to internal betrayal',
  'an ancient tomb built for a king who was never buried there',
  'a prison for a creature whose imprisonment became the dungeon\'s entire purpose',
  'a mine that broke through into something it shouldn\'t have',
  'a noble family\'s manor that sank into the earth during an earthquake',
  'a ritual space where the barrier between worlds is dangerously thin',
  'a wizard\'s tower that sank into the earth after a failed experiment',
  'a dwarven aqueduct whose lower sections flooded and were abandoned',
  'a thieves\' guild vault whose members were betrayed and slaughtered',
  'the collapsed palace of a dynasty no one remembers',
  'a fortification built against an enemy that never came — and then a different enemy did',
  'a monastery whose monks took an oath of silence that eventually became an oath of death',
  'a network of smuggling tunnels that outlasted the empire that built them',
  'a place where a lich prepared its phylactery and then forgot where they put it',
  'a gladiatorial pit whose crowds eventually became the entertainment',
  'a natural formation that a cult chose as their home for reasons that made sense at the time',
  'the underground half of a city that was built on the surface centuries later',
  'a treasury built so securely that the builders were killed to keep its location secret',
];

const DUNGEON_ASPECTS = [
  { name: 'The Rot', description: 'Fungal growth covers everything. The spores are mildly toxic and the larger growths move.' },
  { name: 'The Echo', description: 'Sounds travel strangely here — whispers carry through walls, footsteps seem to come from wrong directions.' },
  { name: 'The Hunger', description: 'Something in these depths is starving. It has been eating the smaller creatures for years.' },
  { name: 'The Archive', description: 'Someone recorded everything that happened here. The records are disturbing.' },
  { name: 'The Flood', description: 'Water fills the lower levels. Some passages are completely submerged.' },
  { name: 'The Collapse', description: 'The structure is compromised. Loud sounds or heavy impacts risk cave-ins.' },
  { name: 'The Haunt', description: 'The dead here cannot rest. They aren\'t angry — they\'re confused and frightened.' },
  { name: 'The Ward', description: 'Protective magic from the original builders still functions, sometimes harmfully.' },
  { name: 'The Inhabitant', description: 'Something intelligent has made this place its home and considers the dungeon its property.' },
  { name: 'The Ritual', description: 'An unfinished ceremony has left raw magical energy saturating the stone.' },
  { name: 'The Trap', description: 'The original builders were paranoid. The traps are clever and still functional.' },
  { name: 'The Corruption', description: 'A dark influence seeps from the deepest room, slowly changing whatever stays too long.' },
  { name: 'The Memory', description: 'Psychic impressions of past events replay in certain rooms. Not ghosts — just recordings.' },
  { name: 'The Competition', description: 'Another group is already in the dungeon — with the same goal, or worse.' },
  { name: 'The Silence', description: 'No ambient noise. The absence of sound is itself unnerving. Whispers carry further than they should.' },
  { name: 'The Cold', description: 'Temperature drops below freezing in the deeper sections. Breath fogs. Metal sticks to bare skin.' },
  { name: 'The Mold', description: 'Black mold covers the lower levels. It releases spores when disturbed. It has opinions.' },
  { name: 'The Watcher', description: 'Something has been observing the dungeon for decades. It has noted everything. It is not impressed.' },
  { name: 'The Door', description: 'One door that shouldn\'t be here leads somewhere that isn\'t on any map. It\'s been locked from the other side.' },
  { name: 'The Ledger', description: 'Someone tracked every death in this dungeon. The entries go back centuries. The handwriting never changes.' },
  { name: 'The Smoke', description: 'A low-lying haze that smells of something burned long ago. It doesn\'t come from anything visible.' },
  { name: 'The Wrongness', description: 'Nothing is visibly unusual. But something fundamental is off. Animals refuse to enter. Spells behave unexpectedly.' },
];

const ROOM_TYPES = [
  { name: 'Entry Hall', role: 'transition', description: 'The threshold between the outside world and whatever lies within.' },
  { name: 'Guard Post', role: 'encounter', description: 'Once manned by sentries. Something still watches.' },
  { name: 'The Shrine', role: 'lore', description: 'A place of worship or ritual. The deity or purpose it served is unclear.' },
  { name: 'Barracks', role: 'encounter', description: 'Sleeping quarters for inhabitants past and present.' },
  { name: 'The Vault', role: 'reward', description: 'Locked, protected, and containing something valuable.' },
  { name: 'The Laboratory', role: 'lore', description: 'Experiments were conducted here. Some may still be running.' },
  { name: 'The Throne Room', role: 'boss', description: 'Whoever runs this place receives visitors here.' },
  { name: 'The Pit', role: 'hazard', description: 'A descent into darkness. Something at the bottom may not be dead.' },
  { name: 'The Ossuary', role: 'lore', description: 'Bones stored with care or carelessness — either way there are too many.' },
  { name: 'The Forge', role: 'encounter', description: 'Weapons were made here. The bellows are cold but the tools remain.' },
  { name: 'The Garden', role: 'hazard', description: 'Something grows in the dark. It doesn\'t need sunlight.' },
  { name: 'The Hall of Records', role: 'lore', description: 'Documents, carvings, or inscriptions that tell the dungeon\'s story.' },
  { name: 'The Prison', role: 'encounter', description: 'Cells, chains, and something that may still be imprisoned.' },
  { name: 'The Sanctum', role: 'boss', description: 'The innermost room. The reason the dungeon exists.' },
  { name: 'The Collapse', role: 'hazard', description: 'Rubble and unstable passages. Traversable but dangerous.' },
  { name: 'The Antechamber', role: 'transition', description: 'A waiting room that once held supplicants. The benches are still here.' },
  { name: 'The Gallery', role: 'lore', description: 'Portraits or statues of those who once inhabited this place. Some have been defaced.' },
  { name: 'The Reliquary', role: 'reward', description: 'A room built to house sacred objects. Most are gone. Not all.' },
  { name: 'The Cistern', role: 'hazard', description: 'A water storage chamber. The water is old. Something lives in it.' },
  { name: 'The Summoning Room', role: 'encounter', description: 'The circle is still intact. Whatever was summoned may still be bound.' },
  { name: 'The Dining Hall', role: 'encounter', description: 'The long table is still set for a meal that was never eaten.' },
  { name: 'The Machine Room', role: 'hazard', description: 'Ancient mechanisms, still moving. Their purpose is unclear. Their danger is not.' },
  { name: 'The Escape Tunnel', role: 'transition', description: 'A hidden passage for emergency exit. Where it leads is the question.' },
];

const BOSS_TYPES: Record<number, string[]> = {
  1: ['Goblin Warchief', 'Skeleton Champion', 'Bandit Captain', 'Giant Spider', 'Cultist Leader', 'Wererat Alpha'],
  2: ['Ogre Mage', 'Vampire Spawn', 'Gnoll Flind', 'Young Dragon', 'Death Knight', 'Mind Flayer Aberrant'],
  3: ['Adult Dragon', 'Lich (weakened)', 'Demon Lord\'s Champion', 'Ancient Golem', 'Night Hag Coven', 'Beholder'],
  4: ['Ancient Dragon', 'Lich', 'Archdevil\'s Avatar', 'Demon Prince Manifestation', 'Elder Brain', 'Tarrasque Fragment'],
};

const MINION_TYPES: Record<number, string[]> = {
  1: ['Goblins', 'Skeletons', 'Bandits', 'Giant Rats', 'Kobolds', 'Zombies'],
  2: ['Orcs', 'Gnolls', 'Cultists', 'Ogres', 'Ghasts', 'Wererats'],
  3: ['Demons (lesser)', 'Undead Knights', 'Mind-Controlled Soldiers', 'Flesh Golems', 'Shadows', 'Wights'],
  4: ['Demons (greater)', 'Undead Dragons', 'Death Knights', 'Pit Fiends', 'Ancient Undead', 'Aboleths'],
};

const TRAPS: Record<number, string[]> = {
  1: ['Pit trap (DC 12 Perception, 2d6 fall)', 'Tripwire alarm (alerts inhabitants)', 'Poison dart (DC 12 Con, 1d4 poison)', 'Falling block (DC 13 Dex, 3d6)'],
  2: ['Magical ward (DC 14, 4d6 force)', 'Collapsing ceiling (DC 15 Dex, 6d6)', 'Glyph of warding (DC 15, 5d8)', 'Maze illusion (DC 14 Wis or lost 1 hour)'],
  3: ['Symbol of death (DC 17 Con, 10d10)', 'Temporal trap (DC 16 Wis or age 1d6 years)', 'Planar rift (DC 18 Str or pulled to Shadowfell)', 'Disintegration beam (DC 18 Dex, 10d6+40)'],
  4: ['Reality anchor (DC 20, spellcasters lose slots)', 'Soul cage trap (DC 20 Cha or soul imprisoned)', 'Annihilation field (DC 22 Dex, save or die)', 'Wish-eater rune (DC 20 Int, magic items suppressed)'],
};

const REWARDS: Record<number, string[]> = {
  1: ['50-200 gp in mixed coin', 'A +1 weapon or armor', 'Potions of healing (1d4)', 'A low-level spell scroll', 'A minor magic trinket', 'Gems worth 100 gp'],
  2: ['500-2000 gp and gems', 'A +2 weapon or uncommon magic item', 'Spell scrolls (3rd-5th level)', 'A rare potion', 'A map to a greater location', 'A faction\'s stolen property worth recovering'],
  3: ['5000-20000 gp in treasure', 'A rare or very rare magic item', 'High-level spell scrolls (6th-8th)', 'Legendary component for a ritual', 'A bound elemental or captured spirit', 'Ancient knowledge worth a faction\'s gratitude'],
  4: ['20000+ gp in legendary loot', 'A legendary magic item or artifact', '9th-level spell scrolls', 'The key to stopping a world threat', 'A fragment of divine power', 'Something the gods want kept hidden'],
};

const SECRETS: Record<number, string[]> = {
  1: ['The dungeon\'s creator isn\'t dead — they\'re hiding in plain sight nearby.', 'A trapped NPC inside the dungeon has been a prisoner for years.', 'The boss works for someone the party has already met.', 'The treasure isn\'t what it appears to be.'],
  2: ['The dungeon is a test — someone is watching to evaluate the party.', 'The boss can be reasoned with, but only in a specific way.', 'Something in the dungeon is innocent and doesn\'t belong here.', 'The dungeon is slowly moving — it will be somewhere else next month.'],
  3: ['The dungeon is a prison, not a lair — what\'s inside is meant to be contained.', 'Clearing the dungeon will trigger a larger threat the party didn\'t expect.', 'The boss was once a hero. Something here caused them to fall.', 'The treasure is a trap — taking it has consequences.'],
  4: ['The dungeon exists in two realities simultaneously. The real threat is in the other one.', 'The boss is not the final threat — defeating them unlocks something worse.', 'The dungeon is a god\'s dream. Killing the boss wakes the god.', 'Victory is impossible by force — the solution is something else entirely.'],
};

// ─── Natural Wonder Data ─────────────────────────────────────────────────────

const WONDER_ORIGINS = [
  'a convergence of ley lines so powerful the landscape itself was reshaped',
  'the burial site of a primordial elemental whose body became the terrain',
  'the impact crater of a shard of a fallen star',
  'the remains of a divine battle that scarred the earth permanently',
  'an ancient experiment by a god who has since abandoned this world',
  'a place where the boundary between planes is permanently thin',
  'the site where a world-tree once grew before it was destroyed',
  'a natural phenomenon so old it predates the current age of the world',
  'the crystallized remnants of a magical cataclysm from the first age',
  'a location where the raw stuff of creation bubbles to the surface',
];

const WONDER_ASPECTS = [
  { name: 'The Pulse', description: 'The ground here beats with a slow rhythm. Animals grow calm. Spellcasters feel their power sharpen.' },
  { name: 'The Perpetual Storm', description: 'Lightning strikes in the same places every hour. The thunderclaps never echo.' },
  { name: 'The Reversal', description: 'Water flows upward here. Flames burn cold. Compasses spin uselessly.' },
  { name: 'The Song', description: 'A sound that isn\'t quite music emanates from somewhere below. It has words, if you listen long enough.' },
  { name: 'The Bloom', description: 'Plants grow here in hours what takes years elsewhere. Some of them should not exist.' },
  { name: 'The Stillness', description: 'Sound dies within fifty feet of the center. Not muffled — absent. Even heartbeats.' },
  { name: 'The Shimmer', description: 'Light bends strangely. You can see things that aren\'t there yet, or aren\'t here at all.' },
  { name: 'The Weight', description: 'Gravity is wrong here. Everything feels twice as heavy, or half as heavy, or both.' },
  { name: 'The Memory', description: 'Visions of the past replay without prompting. Not ghosts — recordings burned into the air.' },
  { name: 'The Hunger', description: 'Magic is consumed here. Spell slots drain. Enchanted items go quiet. The effect fades on departure.' },
  { name: 'The Presence', description: 'Something enormous and ancient is aware of visitors. It has not yet decided what to do.' },
  { name: 'The Veil', description: 'The boundary to the spirit world is thin here. The recently dead linger. The long dead walk.' },
];

const WONDER_AREAS = [
  { name: 'The Approach', role: 'transition', description: 'The point where the wonder\'s influence first becomes palpable.' },
  { name: 'The Outer Ring', role: 'hazard', description: 'Strange effects manifest at the periphery — a preview of what lies deeper.' },
  { name: 'The Heart', role: 'boss', description: 'The source of the wonder\'s power. Overwhelming to stand near.' },
  { name: 'The Reflection Pool', role: 'lore', description: 'Still water or crystal that shows things it shouldn\'t.' },
  { name: 'The Rift', role: 'hazard', description: 'A crack in reality. Things come through. Some don\'t return.' },
  { name: 'The Sanctuary', role: 'reward', description: 'A place of safety within the wonder, sheltered from its extremes.' },
  { name: 'The Archive', role: 'lore', description: 'Natural formations that record history in ways scholars can barely read.' },
  { name: 'The Convergence', role: 'encounter', description: 'Where multiple aspects of the wonder collide and intensify.' },
  { name: 'The Threshold', role: 'transition', description: 'The point of no return, visible to those who know what to look for.' },
  { name: 'The Resonance Chamber', role: 'lore', description: 'A natural hollow where the wonder\'s true nature can be studied.' },
];

const WONDER_GUARDIANS: Record<number, string[]> = {
  1: ['Awakened Animal Guardian', 'Minor Nature Spirit', 'Treant Sapling', 'Animated Terrain Feature'],
  2: ['Ancient Treant', 'Storm Giant', 'Elemental Prince', 'Fey Court Champion'],
  3: ['Primordial Elemental', 'Ancient Dragon (nature-bound)', 'Archdruid Ascendant', 'Spirit of the Location'],
  4: ['Aspect of a Nature Deity', 'Elder Primordial', 'World-Serpent Fragment', 'The Wonder Itself'],
};

const WONDER_HAZARDS: Record<number, string[]> = {
  1: ['Wild magic surge zone (DC 12 Arcana to navigate)', 'Enchanted sleep (DC 13 Wis or fall asleep for 1 hour)', 'Gravity reversal (DC 12 Acrobatics or fall "up")'],
  2: ['Temporal distortion (age 1d6 years on failed DC 14 Con)', 'Memory wipe (DC 14 Int or forget the last hour)', 'Elemental surge (4d8 damage of random type, DC 14 Dex)'],
  3: ['Planar bleed (DC 16: pulled partially into adjacent plane)', 'Reality fracture (spells randomly redirect, DC 16 Arcana)', 'Essence drain (lose a level until long rest, DC 17 Con)'],
  4: ['Divine attention (deity notices the party)', 'Identity dissolution (DC 20 Wis or forget who you are)', 'Permanent wild magic taint (DC 20 Con)'],
};

const WONDER_DISCOVERIES: Record<number, string[]> = {
  1: ['A minor magical spring with healing properties', 'Rare herbs worth 200 gp to the right alchemist', 'A map showing the wonder\'s hidden inner sanctum', 'Crystals that act as spell components'],
  2: ['A ritual site that allows the casting of a 4th-level spell for free', 'Access to a planar pocket with unclaimed resources', 'The blessing of whatever power inhabits this place', 'Ancient lore lost to the outside world'],
  3: ['A permanent magical boon from the wonder\'s spirit', 'A legendary component needed for a world-affecting ritual', 'The true name of a powerful being', 'A glimpse of the future (and the choice to act on it)'],
  4: ['The power to reshape a small part of reality', 'A direct audience with a deity or primordial', 'The ability to seal or unseal the wonder itself', 'Knowledge that changes the nature of the quest'],
};

const WONDER_SECRETS: Record<number, string[]> = {
  1: ['The wonder is dying. Without intervention, it will be gone in a generation.', 'Something is using the wonder as a larder, draining it slowly.', 'The wonder is a lid. What\'s beneath it does not want to stay beneath.'],
  2: ['The wonder was created deliberately — and the creator is still alive.', 'A faction already knows the wonder\'s true nature and is exploiting it.', 'The wonder is connected to other wonders across the world by ley lines.'],
  3: ['The wonder is a prison. The prisoner is almost free.', 'The wonder is a god\'s body. It is not entirely dead.', 'Visiting the wonder changes you permanently — most visitors don\'t notice.'],
  4: ['The wonder is a key. The question is what it unlocks.', 'The wonder has been here longer than the world. It came first.', 'The wonder is aware of every person who has ever visited it. It remembers them all.'],
};

// ─── Geographical Landmark Data ──────────────────────────────────────────────

const LANDMARK_ORIGINS = [
  'a geographic feature so extreme it forced civilisation to route around it',
  'the remnant of a geological cataclysm from the world\'s early age',
  'a formation that has served as a waypoint for travelers since the first roads',
  'a natural border that no army has successfully crossed without permission',
  'a feature so distinctive that it appears on every map ever drawn of this region',
  'the highest or lowest or widest or deepest point in the known world',
  'a natural formation that resonates with the world\'s own magical frequency',
  'a place where two ecosystems collide, creating something found nowhere else',
];

const LANDMARK_AREAS = [
  { name: 'The Approach Road', role: 'transition', description: 'The well-worn path that all travelers use.' },
  { name: 'The Overlook', role: 'lore', description: 'The best vantage point for understanding the landmark\'s scale.' },
  { name: 'The Interior', role: 'encounter', description: 'The heart of the feature — caves, canyons, passes, or peaks.' },
  { name: 'The Hidden Path', role: 'reward', description: 'A route through the landmark that only locals know.' },
  { name: 'The Dangerous Crossing', role: 'hazard', description: 'The point where the landmark must be traversed, not avoided.' },
  { name: 'The Shrine', role: 'lore', description: 'Travelers have been leaving offerings here for centuries.' },
  { name: 'The Camp', role: 'transition', description: 'The traditional stopping point before the difficult section.' },
  { name: 'The Summit or Depth', role: 'boss', description: 'The extreme point — highest, deepest, most remote.' },
];

// ─── Seeded RNG ──────────────────────────────────────────────────────────────

function makeRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return Math.abs(s) / 0x100000000;
  };
}

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

function pickN<T>(arr: T[], n: number, rng: () => number): T[] {
  const shuffled = [...arr].sort(() => rng() - 0.5);
  return shuffled.slice(0, Math.min(n, shuffled.length));
}

// ─── Main Simulator ──────────────────────────────────────────────────────────

export interface ExUmbraDungeon {
  crTier: CRTier;
  origin: string;
  aspects: Array<{ name: string; description: string }>;
  rooms: Array<{ name: string; role: string; description: string }>;
  boss: string;
  minions: string;
  traps: string[];
  reward: string;
  secret: string;
  dungeonLevel: number; // recommended character level
  /** Pre-formatted text ready to paste into Mythweaver's "existing_encounters" field */
  mythweaverEncounters: string;
  /** Pre-formatted text ready to paste into Mythweaver's "world_lore" field */
  mythweaverLore: string;
}

export function simulateExUmbra(poi: PointOfInterest, worldSeed: string): ExUmbraDungeon {
  const seedNum = poi.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) +
    parseInt(worldSeed.replace(/\D/g, '').slice(0, 6) || '42', 10);
  const rng = makeRng(seedNum);

  // Determine CR tier from dangerLevel (1-20)
  const dl = poi.dangerLevel || 5;
  const tierIndex = dl <= 5 ? 0 : dl <= 10 ? 1 : dl <= 15 ? 2 : 3;
  const crTier = CR_TIERS[tierIndex];
  const dungeonLevel = Math.floor(rng() * (parseInt(crTier.levelRange.split('–')[1]) - parseInt(crTier.levelRange.split('–')[0]) + 1)) + parseInt(crTier.levelRange.split('–')[0]);

  const isWonder = poi.type === 'natural_wonder';
  const isLandmark = poi.type === 'geographical_landmark';

  let origin: string, aspects: Array<{name: string; description: string}>, rooms: Array<{name: string; role: string; description: string}>, boss: string, minions: string, traps: string[], reward: string, secret: string;

  if (isWonder) {
    origin = pick(WONDER_ORIGINS, rng);
    aspects = pickN(WONDER_ASPECTS, 3, rng);
    rooms = pickN(WONDER_AREAS, Math.floor(rng() * 3) + 4, rng);
    boss = pick(WONDER_GUARDIANS[crTier.tier], rng);
    minions = pick(MINION_TYPES[crTier.tier], rng);
    traps = pickN(WONDER_HAZARDS[crTier.tier], 2, rng);
    reward = pick(WONDER_DISCOVERIES[crTier.tier], rng);
    secret = pick(WONDER_SECRETS[crTier.tier], rng);
  } else if (isLandmark) {
    origin = pick(LANDMARK_ORIGINS, rng);
    aspects = pickN(WONDER_ASPECTS, 2, rng);
    rooms = pickN(LANDMARK_AREAS, Math.floor(rng() * 2) + 4, rng);
    boss = pick(WONDER_GUARDIANS[crTier.tier], rng);
    minions = pick(MINION_TYPES[crTier.tier], rng);
    traps = pickN(WONDER_HAZARDS[crTier.tier], 1, rng);
    reward = pick(WONDER_DISCOVERIES[crTier.tier], rng);
    secret = pick(WONDER_SECRETS[crTier.tier], rng);
  } else {
    // Dungeon, ruins, cave, tomb, crypt, lair, etc.
    origin = pick(DUNGEON_ORIGINS, rng);
    aspects = pickN(DUNGEON_ASPECTS, 3, rng);
    rooms = pickN(ROOM_TYPES, Math.floor(rng() * 3) + 5, rng);
    boss = pick(BOSS_TYPES[crTier.tier], rng);
    minions = pick(MINION_TYPES[crTier.tier], rng);
    traps = pickN(TRAPS[crTier.tier], 2, rng);
    reward = pick(REWARDS[crTier.tier], rng);
    secret = pick(SECRETS[crTier.tier], rng);
  }

  // Build Mythweaver-ready encounter text
  const mythweaverEncounters = `DUNGEON: ${poi.name}
TYPE: ${poi.type.replace('_', ' ')}
CHALLENGE: ${crTier.label} (${crTier.crRange}, levels ${crTier.levelRange})
DANGER LEVEL: ${dl}/20

ORIGIN: This dungeon was once ${origin}.

KEY ASPECTS (environmental hazards and themes):
${aspects.map((a, i) => `${i + 1}. ${a.name}: ${a.description}`).join('\n')}

ROOMS/AREAS:
${rooms.map((r, i) => `${i + 1}. ${r.name} [${r.role.toUpperCase()}]: ${r.description}`).join('\n')}

INHABITANTS:
- Boss: ${boss}
- Minions: ${minions}

TRAPS:
${traps.map((t, i) => `${i + 1}. ${t}`).join('\n')}

REWARD: ${reward}
SECRET: ${secret}`;

  const mythweaverLore = `${poi.name} is ${poi.description}

It began as ${origin}. Now it is a ${crTier.label.toLowerCase()} location (danger level ${dl}/20) recommended for characters of levels ${crTier.levelRange}.

The dungeon is defined by three aspects: ${aspects.map(a => a.name).join(', ')}. ${aspects[0].description}

The primary threat within is ${boss}, commanding forces of ${minions}. ${secret}`;

  return {
    crTier,
    origin,
    aspects,
    rooms,
    boss,
    minions,
    traps,
    reward,
    secret,
    dungeonLevel,
    mythweaverEncounters,
    mythweaverLore,
  };
}

/** Build a complete Mythweaver generate payload from a dungeon */
export function buildMythweaverPayload(
  poi: PointOfInterest,
  dungeon: ExUmbraDungeon,
  worldName: string
) {
  const dl = poi.dangerLevel || 5;
  const tierIndex = dl <= 5 ? 0 : dl <= 10 ? 1 : dl <= 15 ? 2 : 3;
  const tier = CR_TIERS[tierIndex];

  return {
    rule_system: 'D&D 5e',
    setting_custom: worldName,
    environment_custom: `${poi.type.replace('_', ' ')} — ${poi.name}`,
    story_type: 'Dungeon Delve',
    tone: tier.tier >= 3 ? 'Dark & Gritty' : tier.tier === 2 ? 'Heroic' : 'Heroic',
    party_size: '4 players',
    character_level: `Tier ${tier.tier} (${tier.levelRange})`,
    length: 'One-Shot (3-4 hours)',
    existing_encounters: dungeon.mythweaverEncounters,
    world_lore: dungeon.mythweaverLore,
    existing_npcs: `Boss: ${dungeon.boss}\nMinions: ${dungeon.minions}`,
    campaign_context: `This dungeon is part of the world "${worldName}". The party has discovered it during exploration.`,
  };
}
