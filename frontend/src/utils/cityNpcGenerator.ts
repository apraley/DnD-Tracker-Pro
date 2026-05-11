/**
 * City NPC Generator
 *
 * Generates city leaders, crime lords, faction leaders, and notable citizens
 * with rich backstories and mechanical integration with GRIMOIRE NPC builder.
 *
 * Every NPC created here is designed to be passed to GRIMOIRE for:
 * - Full stat block generation
 * - Personality quirks and mannerisms
 * - Detailed backstory and motivations
 * - Combat abilities and tactics
 */

import { NPC } from '../types/world';
import { fnv1a } from './establishmentGenerator';

// ─── NPC Archetypes (Roles) ───────────────────────────────────────────────

const NPC_ARCHETYPES = [
  // City Rulers & Leaders
  { role: 'Mayor', alignment: 'Lawful Neutral', description: 'Elected administrator focused on public welfare' },
  { role: 'Duke/Duchess', alignment: 'Lawful Neutral', description: 'Noble ruler claiming ancestral right' },
  { role: 'Queen/King', alignment: 'Any', description: 'Monarch with absolute authority' },
  { role: 'Chancellor', alignment: 'Lawful Neutral', description: 'Advisor who actually holds power behind the throne' },
  { role: 'Council Speaker', alignment: 'Neutral', description: 'Representative of democratic council' },

  // Merchant & Economic Leaders
  { role: 'Merchant Prince', alignment: 'Neutral Evil', description: 'Controls city through economic leverage' },
  { role: 'Guild Master', alignment: 'Lawful Neutral', description: 'Master craftsperson leading guild' },
  { role: 'Banker', alignment: 'Neutral Evil', description: 'Controls currency and debt' },
  { role: 'Trade Cartel Boss', alignment: 'Chaotic Evil', description: 'Ruthless trader controlling commerce' },

  // Military & Order
  { role: 'General', alignment: 'Lawful Neutral', description: 'Military commander with city control' },
  { role: 'Captain of the Guard', alignment: 'Lawful Good', description: 'Head of city guard, dedicated to order' },
  { role: 'Warlord', alignment: 'Chaotic Neutral', description: 'Controls city through military might' },
  { role: 'Constable', alignment: 'Lawful Neutral', description: 'Chief law enforcement officer' },

  // Religious & Mystical
  { role: 'High Priest/Priestess', alignment: 'Lawful Good', description: 'Religious leader interpreting divine will' },
  { role: 'Temple Oracle', alignment: 'Neutral', description: 'Mystic who guides through prophecy' },
  { role: 'Arch-Mage', alignment: 'Neutral', description: 'Powerful wizard controlling magical institutions' },
  { role: 'Inquisitor', alignment: 'Lawful Evil', description: 'Religious enforcer of doctrinal purity' },

  // Criminal & Underground
  { role: 'Crime Lord', alignment: 'Chaotic Evil', description: 'Rules underworld with iron fist' },
  { role: 'Thieves Guild Master', alignment: 'Chaotic Neutral', description: 'Leads organized theft and fencing' },
  { role: 'Black Market King', alignment: 'Neutral Evil', description: 'Controls shadow economy' },
  { role: 'Smuggler Boss', alignment: 'Chaotic Neutral', description: 'Runs contraband operation' },
  { role: 'Assassin Guildmaster', alignment: 'Neutral Evil', description: 'Controls mercenary killing business' },

  // Charismatic & Political
  { role: 'Demagogue', alignment: 'Chaotic Evil', description: 'Rules through populist rhetoric and propaganda' },
  { role: 'Diplomat', alignment: 'Neutral', description: 'Mediates between factions through negotiation' },
  { role: 'Patron Noble', alignment: 'Lawful Neutral', description: 'Wealthy aristocrat with political influence' },
  { role: 'Populist Leader', alignment: 'Chaotic Good', description: 'Represents common people against elite' },

  // Scholarly & Wise
  { role: 'Loremaster', alignment: 'Neutral Good', description: 'Keeper of knowledge and archives' },
  { role: 'Sage', alignment: 'Neutral Good', description: 'Wise elder dispensing counsel' },
  { role: 'Scholar-Administrator', alignment: 'Lawful Neutral', description: 'Academic leading through expertise' },
  { role: 'Librarian', alignment: 'Neutral', description: 'Guards and organizes city knowledge' },

  // Unusual & Supernatural
  { role: 'Vampire Lord', alignment: 'Neutral Evil', description: 'Undead creature controlling city from shadows' },
  { role: 'Fey Enchanter', alignment: 'Chaotic Neutral', description: 'Otherworldly being bending city to whims' },
  { role: 'Lich Governor', alignment: 'Lawful Evil', description: 'Ancient undead maintaining control through magic' },
  { role: 'Demon-Pact Mayor', alignment: 'Chaotic Evil', description: 'Leader bound to infernal power' },

  // Explorers & Outsiders
  { role: 'Adventurer-Governor', alignment: 'Chaotic Good', description: 'Former adventurer ruling with unconventional methods' },
  { role: 'Refugee Leader', alignment: 'Neutral Good', description: 'Refugee from conquered land leading displaced people' },
  { role: 'Exile', alignment: 'Neutral', description: 'Outsider who gained unexpected influence' },

  // Business & Industry
  { role: 'Factory Magnate', alignment: 'Neutral Evil', description: 'Industrial titan controlling worker population' },
  { role: 'Artisan Guildmaster', alignment: 'Lawful Good', description: 'Craft master maintaining quality standards' },
  { role: 'Mine Owner', alignment: 'Neutral Evil', description: 'Controls wealth through resource extraction' },
  { role: 'Shipbuilder', alignment: 'Lawful Neutral', description: 'Master craftsperson with city influence' },

  // Troublemakers & Antagonists
  { role: 'Cult Leader', alignment: 'Chaotic Evil', description: 'Rules through ideological zealotry' },
  { role: 'Revolutionary', alignment: 'Chaotic Neutral', description: 'Overthrows existing power structure' },
  { role: 'Tyrant', alignment: 'Lawful Evil', description: 'Rules through systematic oppression' },
  { role: 'Mad Genius', alignment: 'Chaotic Neutral', description: 'Erratic brilliant mind controlling city' },
];

// ─── NPC Personality & Motivation Pools ────────────────────────────────────

const NPC_MOTIVATIONS = [
  'obsessed with accumulating wealth at any cost',
  'driven by desire to protect their family legacy',
  'motivated by religious/philosophical doctrine',
  'seeks to expand power over neighboring lands',
  'driven by personal vendetta against rivals',
  'believes they alone can save the city from doom',
  'addicted to luxury and sensual pleasures',
  'determined to prove worthiness to absent parent',
  'seeks redemption for shameful past',
  'driven by ambition to reach ultimate power',
  'devoted to a higher ideal despite personal cost',
  'protecting dark secret from public exposure',
  'seeks revenge against those who wronged them',
  'believes themselves specially chosen by destiny',
  'driven by genuine desire to help people',
  'obsessed with collecting or controlling something',
  'seeking escape from their previous identity',
  'bound by ancient curse or contract',
  'influenced by possession or magical control',
  'chasing a vision only they can see',
];

const NPC_QUIRKS = [
  'speaks in riddles and metaphors constantly',
  'cannot tell a lie, compulsively honest',
  'collects obscure items obsessively',
  'speaks multiple languages but mixes them randomly',
  'always drinks from the same specific cup',
  'refuses to acknowledge certain taboo topics',
  'obsessively checks and rechecks details',
  'speaks only in formal, archaic language',
  'talks to themselves during meetings',
  'can only make decisions during specific times',
  'dresses in clothes from childhood era',
  'refuses to sit in certain types of chairs',
  'must walk specific routes only',
  'compulsively records everything in journals',
  'speaks in whispers, making people lean close',
  'laughs at inappropriate moments',
  'never makes eye contact',
  'cannot remain still, constantly fidgets',
  'only communicates through intermediaries',
  'invents elaborate lies about mundane topics',
];

const NPC_SECRETS = [
  'illegitimate child of a rival leader',
  'secretly working for enemy faction',
  'possessed by spirit of previous ruler',
  'addicted to prohibited substance',
  'responsible for mysterious disappearances',
  'blackmailed into position by unknown party',
  'harboring fugitive family member',
  'secretly financing opposing faction',
  'made pact with infernal entity',
  'murdered previous leader to seize power',
  'not who they claim to be, impostor',
  'slowly dying from incurable curse',
  'secretly infertile, heir is fake',
  'sold soul for current power',
  'responsible for great tragedy',
];

const NPC_RELATIONSHIPS = [
  'bitter rivals competing for same goal',
  'secret lovers meeting in shadows',
  'parent-child with unresolved issues',
  'former allies now enemies',
  'siblings with conflicting loyalties',
  'debt-bound to criminal organization',
  'protégé looking to surpass mentor',
  'former enemy now reluctant ally',
  'childhood friends with diverging paths',
  'blood-feud families now forced together',
];

// ─── Helper Functions ─────────────────────────────────────────────────────

function seededRandom(seed: string, index: number): number {
  const hash = fnv1a(seed + '|' + index);
  return (hash >>> 0) / 0x100000000;
}

function pickSeeded<T>(array: T[], seed: string, index: number): T {
  const rand = seededRandom(seed, index);
  return array[Math.floor(rand * array.length)];
}

function getMultipleSeeded<T>(array: T[], seed: string, index: number, count: number): T[] {
  const result: T[] = [];
  for (let i = 0; i < count; i++) {
    result.push(pickSeeded(array, seed + '|' + i, index));
  }
  return result;
}

function generateNpcBackstory(
  name: string,
  archetype: string,
  motivation: string,
  secret: string,
  seed: string
): string {
  const quirk = pickSeeded(NPC_QUIRKS, seed, 100);
  const relationship = pickSeeded(NPC_RELATIONSHIPS, seed, 101);

  return `
${name} is a ${archetype} who rose to prominence by ${motivation}.
Known for being someone who ${quirk.toLowerCase()}, ${name}
maintains a complex ${relationship} with key figures in their life.

Behind closed doors, ${name}'s greatest burden is that they are ${secret.toLowerCase()}.
This secret drives many of their decisions, though few suspect the truth.
  `.trim();
}

// ─── Main NPC Generation ──────────────────────────────────────────────────

export function generateCityLeader(
  cityIndex: number,
  cityName: string,
  worldSeed: string
): NPC {
  const npcSeed = worldSeed + '|leader|' + cityIndex + '|' + cityName;

  // Pick archetype for this leader
  const archetype = pickSeeded(NPC_ARCHETYPES, npcSeed, 0);

  // Generate name (reuse leader name from ecologicalWonders if needed)
  const firstName = pickSeeded(
    ['Thel', 'Mar', 'Vor', 'Syn', 'Kra', 'Quel', 'Myr', 'Zar', 'Eris', 'Leth'],
    npcSeed,
    1
  );
  const lastName = pickSeeded(
    ['dor', 'mir', 'kar', 'thar', 'ven', 'wise', 'bane', 'stone', 'wing', 'shade'],
    npcSeed,
    2
  );
  const name = firstName + 'or ' + lastName.charAt(0).toUpperCase() + lastName.slice(1);

  // Stats determined by role
  const stats = generateStatsForRole(archetype.role, npcSeed);

  // Generate backstory elements
  const motivation = pickSeeded(NPC_MOTIVATIONS, npcSeed, 10);
  const secret = pickSeeded(NPC_SECRETS, npcSeed, 11);
  const backstory = generateNpcBackstory(name, archetype.role, motivation, secret, npcSeed);

  // Determine class based on role
  const npcClass = deriveClassFromRole(archetype.role);

  // Determine level based on city importance
  const level = Math.floor(seededRandom(npcSeed, 20) * 8) + 8; // Level 8-15

  return {
    id: `npc_${fnv1a(npcSeed).toString(16)}`,
    name,
    type: 'city_leader',
    race: pickSeeded(['Human', 'Elf', 'Dwarf', 'Halfling', 'Dragonborn', 'Tiefling'], npcSeed, 30),
    class: npcClass,
    level,
    alignment: archetype.alignment,
    description: backstory,
    influence: `Controls ${cityName} as ${archetype.role}`,
    associatedCityId: `city_${fnv1a(worldSeed + '|' + cityIndex).toString(16)}`,
    ...stats,
    role: archetype.role,
    faction: 'City Government', // Can be overridden
  };
}

export function generateCrimeLord(
  cityIndex: number,
  cityName: string,
  worldSeed: string
): NPC {
  const npcSeed = worldSeed + '|criminal|' + cityIndex + '|' + cityName;

  const criminalRoles = [
    'Crime Lord',
    'Thieves Guild Master',
    'Black Market King',
    'Smuggler Boss',
    'Assassin Guildmaster',
  ];

  const roleIndex = Math.floor(seededRandom(npcSeed, 0) * criminalRoles.length);
  const role = criminalRoles[roleIndex];

  const firstName = pickSeeded(
    ['Vex', 'Kaz', 'Silk', 'Razor', 'Shadow', 'Night', 'Raven', 'Ash'],
    npcSeed,
    1
  );
  const lastName = pickSeeded(
    ['blade', 'fang', 'claw', 'heart', 'bane', 'curse', 'shade', 'dark'],
    npcSeed,
    2
  );
  const name = firstName + ' the ' + lastName.charAt(0).toUpperCase() + lastName.slice(1);

  const stats = generateStatsForRole(role, npcSeed);
  const motivation = pickSeeded(NPC_MOTIVATIONS, npcSeed, 10);
  const secret = pickSeeded(NPC_SECRETS, npcSeed, 11);
  const backstory = generateNpcBackstory(name, role, motivation, secret, npcSeed);

  const level = Math.floor(seededRandom(npcSeed, 20) * 6) + 10; // Level 10-15

  return {
    id: `npc_${fnv1a(npcSeed).toString(16)}`,
    name,
    type: 'crime_lord',
    race: pickSeeded(['Human', 'Elf', 'Half-Orc', 'Tiefling'], npcSeed, 30),
    class: pickSeeded(['Rogue', 'Ranger', 'Barbarian', 'Warlock'], npcSeed, 31),
    level,
    alignment: 'Chaotic Evil',
    description: backstory,
    influence: `Controls criminal underworld of ${cityName}`,
    associatedCityId: `city_${fnv1a(worldSeed + '|' + cityIndex).toString(16)}`,
    ...stats,
    role,
    faction: 'Criminal Underground',
  };
}

export function generateFactionLeader(
  factionIndex: number,
  factionName: string,
  worldSeed: string
): NPC {
  const npcSeed = worldSeed + '|faction|' + factionIndex + '|' + factionName;

  const archetype = pickSeeded(NPC_ARCHETYPES, npcSeed, 0);

  const firstName = pickSeeded(
    ['Aldur', 'Cael', 'Dorn', 'Fael', 'Gael', 'Hel', 'Iren', 'Jael'],
    npcSeed,
    1
  );
  const lastName = pickSeeded(
    ['Stormborn', 'Firehand', 'Shadowbane', 'Ironheart', 'Frostbringer', 'Dragonslayer'],
    npcSeed,
    2
  );
  const name = firstName + ' ' + lastName;

  const stats = generateStatsForRole(archetype.role, npcSeed);
  const motivation = pickSeeded(NPC_MOTIVATIONS, npcSeed, 10);
  const secret = pickSeeded(NPC_SECRETS, npcSeed, 11);
  const backstory = generateNpcBackstory(name, archetype.role, motivation, secret, npcSeed);

  const level = Math.floor(seededRandom(npcSeed, 20) * 8) + 6; // Level 6-13

  return {
    id: `npc_${fnv1a(npcSeed).toString(16)}`,
    name,
    type: 'faction_leader',
    race: pickSeeded(['Human', 'Elf', 'Dwarf', 'Halfling'], npcSeed, 30),
    class: deriveClassFromRole(archetype.role),
    level,
    alignment: archetype.alignment,
    description: backstory,
    influence: `Leads the ${factionName}`,
    ...stats,
    role: archetype.role,
    faction: factionName,
  };
}

// ─── Stat Generation ──────────────────────────────────────────────────────

function generateStatsForRole(role: string, seed: string): Partial<NPC> {
  // Different roles have different stat distributions
  const baseStats = {
    str: 10,
    dex: 10,
    con: 10,
    int: 10,
    wis: 10,
    cha: 10,
  };

  // Adjust based on role
  if (role.includes('General') || role.includes('Warlord') || role.includes('Barbarian')) {
    baseStats.str = 15;
    baseStats.con = 13;
  } else if (role.includes('Rogue') || role.includes('Thief') || role.includes('Assassin')) {
    baseStats.dex = 15;
    baseStats.int = 12;
  } else if (role.includes('Priest') || role.includes('Oracle') || role.includes('Sage')) {
    baseStats.wis = 15;
    baseStats.int = 13;
  } else if (role.includes('Mage') || role.includes('Arch') || role.includes('Scholar')) {
    baseStats.int = 15;
    baseStats.wis = 12;
  } else if (role.includes('Prince') || role.includes('Duke') || role.includes('King')) {
    baseStats.cha = 15;
    baseStats.int = 12;
  } else {
    // Generic leaders get balanced stats
    baseStats.cha = 14;
    baseStats.wis = 12;
    baseStats.int = 12;
  }

  // Add random variation
  for (const key of Object.keys(baseStats) as Array<keyof typeof baseStats>) {
    const variation = Math.floor(seededRandom(seed, Object.keys(baseStats).indexOf(key)) * 4) - 2;
    baseStats[key] = Math.max(8, Math.min(18, baseStats[key] + variation));
  }

  // Calculate AC and HP
  const dexMod = Math.floor((baseStats.dex - 10) / 2);
  const conMod = Math.floor((baseStats.con - 10) / 2);
  const ac = 10 + dexMod + Math.floor(seededRandom(seed, 50) * 3); // 10-12 base
  const hp = 8 + conMod + Math.floor(seededRandom(seed, 51) * 30); // 8-37 range

  return {
    str: baseStats.str,
    dex: baseStats.dex,
    con: baseStats.con,
    int: baseStats.int,
    wis: baseStats.wis,
    cha: baseStats.cha,
    ac: Math.max(10, Math.min(18, ac)),
    hp: Math.max(10, hp),
  };
}

function deriveClassFromRole(role: string): string {
  const roleClassMap: Record<string, string> = {
    'General': 'Fighter',
    'Warlord': 'Barbarian',
    'Captain': 'Fighter',
    'Crime Lord': 'Rogue',
    'Thieves Guild Master': 'Rogue',
    'Assassin': 'Rogue',
    'High Priest': 'Cleric',
    'Priestess': 'Cleric',
    'Oracle': 'Cleric',
    'Arch-Mage': 'Wizard',
    'Mage': 'Wizard',
    'Witch': 'Warlock',
    'Duke': 'Aristocrat',
    'Duke/Duchess': 'Aristocrat',
    'Mayor': 'Commoner',
    'Diplomat': 'Bard',
    'Demagogue': 'Bard',
  };

  for (const [key, value] of Object.entries(roleClassMap)) {
    if (role.includes(key)) return value;
  }

  return 'Commoner';
}

// ─── Bulk Generation ──────────────────────────────────────────────────────

export function generateCityNotableCitizens(
  cityIndex: number,
  cityName: string,
  worldSeed: string,
  count: number = 5
): NPC[] {
  const citizens: NPC[] = [];

  // Always include a leader
  citizens.push(generateCityLeader(cityIndex, cityName, worldSeed));

  // Sometimes include a crime lord (50% chance)
  if (seededRandom(worldSeed + '|crime|' + cityIndex, 0) > 0.5) {
    citizens.push(generateCrimeLord(cityIndex, cityName, worldSeed));
  }

  // Add remaining citizens
  const remainingCount = Math.max(0, count - citizens.length);
  for (let i = 0; i < remainingCount; i++) {
    const archetype = pickSeeded(NPC_ARCHETYPES, worldSeed + '|npc|' + i, cityIndex);
    const name = pickSeeded(['Aldric', 'Beatrice', 'Cedric', 'Diana', 'Elias', 'Fiona'], worldSeed, 70 + i) +
                 ' ' +
                 pickSeeded(['the Bold', 'the Wise', 'the Cunning', 'the Fair', 'the Strong'], worldSeed, 80 + i);

    const stats = generateStatsForRole(archetype.role, worldSeed + '|npc|' + i + '|' + cityIndex);
    const motivation = pickSeeded(NPC_MOTIVATIONS, worldSeed + '|npc|' + i, 10);
    const secret = pickSeeded(NPC_SECRETS, worldSeed + '|npc|' + i, 11);
    const backstory = generateNpcBackstory(name, archetype.role, motivation, secret, worldSeed + '|npc|' + i);

    const level = Math.floor(seededRandom(worldSeed + '|npc|' + i, 20) * 6) + 3; // Level 3-8

    citizens.push({
      id: `npc_${fnv1a(worldSeed + '|npc|' + i + '|' + cityName).toString(16)}`,
      name,
      type: 'notable_citizen',
      race: pickSeeded(['Human', 'Elf', 'Dwarf', 'Halfling'], worldSeed, 90 + i),
      class: deriveClassFromRole(archetype.role),
      level,
      alignment: archetype.alignment,
      description: backstory,
      influence: `Notable citizen of ${cityName}`,
      associatedCityId: `city_${fnv1a(worldSeed + '|' + cityIndex).toString(16)}`,
      ...stats,
      role: archetype.role,
    });
  }

  return citizens;
}
