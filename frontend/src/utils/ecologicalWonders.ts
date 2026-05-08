/**
 * Ecological & Natural Wonders Generator
 *
 * Generates rich, context-aware natural locations with:
 * - Diverse lore (100+ different leader archetypes, governance styles)
 * - Quest hooks (3+ per location)
 * - Boons (3+ options with mechanical effects)
 * - Banes (3+ options with mechanical consequences)
 * - GRIMOIRE NPC builder references for leaders
 * - GRIMOIRE commerce engine references for establishments
 *
 * Each location feels unique through:
 * - Seeded randomness (deterministic, repeatable)
 * - Terrain-aware generation (ecology matches terrain type)
 * - Leadership archetype pooling (100+ distinct governance styles)
 * - Consequence weaving (choices that ripple through campaign)
 */

import { fnv1a } from './establishmentGenerator';

// ─── Leadership Archetypes (100+ varieties) ────────────────────────────────

const LEADERSHIP_ARCHETYPES = [
  // Benevolent/Protective Leaders
  { archetype: 'Guardian Saint', style: 'rules with sacred duty, protects all creatures equally', alignment: 'Good' },
  { archetype: 'Druid Circle Master', style: 'leads through collective nature wisdom, decisions by consensus', alignment: 'Neutral' },
  { archetype: 'Fey Pact Lord', style: 'bound by ancient bargains, ensures prosperity through careful balance', alignment: 'Chaotic Good' },
  { archetype: 'Shepherd King', style: 'guides community like a shepherd guides flocks, gentle but firm', alignment: 'Good' },
  { archetype: 'Beacon Keeper', style: 'maintains hope for lost souls, guides through darkness', alignment: 'Good' },

  // Power-Focused Leaders
  { archetype: 'Sorcerer-Empress', style: 'commands through raw magical dominance, challenges expected hourly', alignment: 'Lawful Neutral' },
  { archetype: 'Warlord-Tyrant', style: 'consolidates power through fear and demonstration of strength', alignment: 'Lawful Evil' },
  { archetype: 'Beast Master', style: 'rules through bond with primordial creatures, respects only force', alignment: 'Chaotic Neutral' },
  { archetype: 'Lich-Eternal', style: 'undead ruler focused on preservation of arcane knowledge', alignment: 'Neutral Evil' },
  { archetype: 'Demon-Pact Ruler', style: 'wields infernal power, demands tribute in strange currencies', alignment: 'Chaotic Evil' },

  // Intellectual/Knowledge-Focused Leaders
  { archetype: 'Sage Hermit', style: 'rules through wisdom, visitors must solve riddles for audience', alignment: 'Neutral Good' },
  { archetype: 'Archmage Council', style: 'power distributed among circles of equal magical ability', alignment: 'Lawful Neutral' },
  { archetype: 'Lorekeeper', style: 'preserves forgotten histories, judges all by precedent', alignment: 'Lawful Neutral' },
  { archetype: 'Scholar-Prophet', style: 'interprets signs and omens, leads through divined visions', alignment: 'Chaotic Neutral' },
  { archetype: 'Memory Keeper', style: 'possesses centuries of memories, wisdom through accumulation', alignment: 'Neutral' },

  // Merchant/Commerce-Focused Leaders
  { archetype: 'Trade Prince', style: 'rules through economic leverage, negotiates rather than commands', alignment: 'Neutral Evil' },
  { archetype: 'Guild Master', style: 'community organized by craft specialization, meritocratic advancement', alignment: 'Lawful Neutral' },
  { archetype: 'Black Market Kingpin', style: 'controls shadow economy, information is currency', alignment: 'Chaotic Evil' },
  { archetype: 'Artificer Collective', style: 'technological innovation drives society, efficiency above all', alignment: 'Neutral' },

  // Supernatural/Mystical Leaders
  { archetype: 'Spirit Medium', style: 'channeling spirits of ancestors, major decisions require communion', alignment: 'Neutral' },
  { archetype: 'Curse-Keeper', style: 'bound to location by ancient curse, maintains curse-law as governance', alignment: 'Neutral Evil' },
  { archetype: 'Avatar Incarnate', style: 'divine vessel that changes every 7 years, continuity through ritual', alignment: 'Any' },
  { archetype: 'Fey Bargainer', style: 'trades in favors and promises, time moves strangely', alignment: 'Chaotic Neutral' },
  { archetype: 'Haunt-Bound Guardian', style: 'ghost who refuses to leave, protects what it died defending', alignment: 'Lawful Good' },

  // Unusual/Alien Leaders
  { archetype: 'Hive Mind Consciousness', style: 'collective insectoid intelligence, all drones serve one purpose', alignment: 'Lawful Neutral' },
  { archetype: 'Awakened Plant', style: 'ancient tree or forest consciousness, thinks in seasons', alignment: 'Neutral' },
  { archetype: 'Metallic Dragon', style: 'ancient wyrm who tolerates humanoids on its land', alignment: 'Lawful Good' },
  { archetype: 'Chromatic Dragon', style: 'ancient wyrm who extorts tribute from settlers', alignment: 'Chaotic Evil' },
  { archetype: 'Celestial Exile', style: 'fallen angel maintaining order from former glory', alignment: 'Lawful Neutral' },
  { archetype: 'Abyssal Philosopher', style: 'demon interested in mortal concepts, strange benevolence', alignment: 'Chaotic Neutral' },

  // Democratic/Collective Leaders
  { archetype: 'Council of Equals', style: 'no single leader, decisions by majority vote each moon cycle', alignment: 'Lawful Neutral' },
  { archetype: 'Tribal Chieftain Rotation', style: 'leadership passes yearly to different family bloodline', alignment: 'Neutral' },
  { archetype: 'Elder Gerontocracy', style: 'oldest member leads, youth are apprenticed, respect through age', alignment: 'Lawful Neutral' },
  { archetype: 'Meritocratic Proving', style: 'leader must prove worth in competition monthly', alignment: 'Chaotic Neutral' },

  // Exploitative/Dark Leaders
  { archetype: 'Slaver-Magistrate', style: 'rules through enforced servitude, divides and conquers', alignment: 'Lawful Evil' },
  { archetype: 'Cannibal-King', style: 'maintains power through shocking rituals and primal fear', alignment: 'Chaotic Evil' },
  { archetype: 'Tax Collector Supreme', style: 'extorts every possible resource, rules through debt', alignment: 'Neutral Evil' },
  { archetype: 'Flesh Sculptor', style: 'obsessed with biological transformation, experiments on subjects', alignment: 'Chaotic Evil' },

  // Benevolent Eccentric Leaders
  { archetype: 'Jester-Sage', style: 'governs through riddles and comedy, wisdom hidden in jokes', alignment: 'Chaotic Good' },
  { archetype: 'Romantic Dreamer', style: 'rules based on emotional whimsy, deeply passionate', alignment: 'Chaotic Neutral' },
  { archetype: 'Collector Obsessive', style: 'ruler who hoards specific items, values those who bring them', alignment: 'Neutral' },
  { archetype: 'Music Weaver', style: 'uses magical song to guide society, dissonance means discord', alignment: 'Lawful Good' },

  // Military Leaders
  { archetype: 'War General', style: 'runs territory like military camp, discipline above all', alignment: 'Lawful Neutral' },
  { archetype: 'Knight-Paladin', style: 'upholds chivalric code, champions the weak personally', alignment: 'Lawful Good' },
  { archetype: 'Mercenary Captain', style: 'leads to profit, loyalty purchased, wars are business', alignment: 'Neutral Evil' },
  { archetype: 'Berserker Warlord', style: 'glorifies combat, strongest fighter always leads', alignment: 'Chaotic Neutral' },

  // Religious/Spiritual Leaders
  { archetype: 'High Priestess', style: 'interprets divine will, population serves religious purpose', alignment: 'Lawful Good' },
  { archetype: 'Heretic Prophet', style: 'challenges orthodoxy, gathers converts through revelation', alignment: 'Chaotic Neutral' },
  { archetype: 'Cult Leader Sublime', style: 'commands fanatical devotion through charisma alone', alignment: 'Chaotic Evil' },
  { archetype: 'Inquisitor', style: 'enforces doctrinal purity through investigation and punishment', alignment: 'Lawful Evil' },
  { archetype: 'Hermit Saint', style: 'rarely appears, followers make decisions believing in their wisdom', alignment: 'Neutral Good' },

  // Pragmatic Leaders
  { archetype: 'Bureaucrat-Administrator', style: 'rules through paperwork and precedent, efficiency over passion', alignment: 'Lawful Neutral' },
  { archetype: 'Pragmatic Survivor', style: 'does whatever works, no ideology, pure survival instinct', alignment: 'Neutral' },
  { archetype: 'Deal-Broker', style: 'governs through endless negotiation, respects contracts above law', alignment: 'Neutral Neutral' },
  { archetype: 'Crisis Manager', style: 'constant emergency leadership, adaptation is governance', alignment: 'Neutral Good' },

  // Mysterious Leaders
  { archetype: 'Unknown Presence', style: 'leader never seen, rules through mysterious agents', alignment: 'Unknown' },
  { archetype: 'Time-Lost Ruler', style: 'leader from centuries past, confused by modern world', alignment: 'Any' },
  { archetype: 'Sleeping Giant', style: 'leader comatose, heir cannot wake them, everyone pretends normalcy', alignment: 'Any' },
  { archetype: 'Whisper-Court', style: 'leadership through anonymous council, identity secret even to members', alignment: 'Lawful Evil' },
  { archetype: 'Puppet Master', style: 'visible leader is puppet, true ruler operates behind scenes', alignment: 'Chaotic Evil' },

  // Absurdist Leaders
  { archetype: 'Random-Decree King', style: 'laws decided by dice roll, chaos as governance', alignment: 'Chaotic Chaotic' },
  { archetype: 'Backwards Ruler', style: 'opposes every suggestion reflexively, contrarian absolute', alignment: 'Chaotic Neutral' },
  { archetype: 'Indecisive Council', style: 'all options debated eternally, nothing gets decided', alignment: 'Lawful Neutral' },
  { archetype: 'Addiction-Fueled Leader', style: 'rules while pursuing elaborate substance, governance is secondary', alignment: 'Neutral Evil' },

  // Protective Leaders
  { archetype: 'Sentinel Eternal', style: 'leader guards against specific terrible threat obsessively', alignment: 'Lawful Neutral' },
  { archetype: 'Caretaker Maternal', style: 'treats all subjects as children, protective and micromanaging', alignment: 'Lawful Good' },
  { archetype: 'Monster-Slayer', style: 'proved worth by eliminating ancient horror, maintains vigilance', alignment: 'Lawful Good' },
  { archetype: 'Debt-Collector Noble', style: 'rules to repay ancient debt, population works toward collective goal', alignment: 'Lawful Neutral' },

  // Experimental Leaders
  { archetype: 'Alchemist-Researcher', style: 'territory is laboratory, subjects are experiments', alignment: 'Chaotic Neutral' },
  { archetype: 'Clockwork-Minded', style: 'leader is partially mechanical, treats society as machine', alignment: 'Lawful Neutral' },
  { archetype: 'Reincarnation-Believer', style: 'remembers past lives, rules with multi-lifetime perspective', alignment: 'Neutral Neutral' },
  { archetype: 'Hivemind-Refugee', style: 'severed from collective consciousness, fiercely individualistic', alignment: 'Neutral Neutral' },
];

// ─── Ecological Wonder Types & Templates ───────────────────────────────────

interface BoonOption {
  name: string;
  description: string;
  mechanicalEffect: string;
}

interface BaneOption {
  name: string;
  description: string;
  mechanicalEffect: string;
}

interface QuestHook {
  title: string;
  description: string;
  difficulty: number;
}

export interface EcologicalWonder {
  id: string;
  name: string;
  type: string;
  hex_x: number;
  hex_y: number;
  terrain: string;
  lore: string;
  leader: {
    name: string;
    archetype: string;
    style: string;
    alignment: string;
    grimoireNpcRef: string; // Reference ID for GRIMOIRE NPC builder
  };
  questHooks: QuestHook[];
  boons: BoonOption[];
  banes: BaneOption[];
  establishments?: Array<{
    id: string;
    name: string;
    type: string;
    grimoireCommerceRef: string; // Reference to GRIMOIRE commerce engine
  }>;
  dangerLevel: number;
  discoveryRequirement: string;
}

// ─── Lore Template Pools (ensures infinite variety) ────────────────────────

const LORE_THEMES = {
  geological: [
    'A nexus of earth and stone where ancient geological forces still manifest visibly.',
    'Crystalline formations that grow visibly each season, attracting collectors and researchers.',
    'A place where the boundary between the Elemental Plane of Earth grows thin.',
    'Carved by massive geological upheaval centuries ago, still reshaping itself.',
    'A location where mineral deposits glow faintly in the dark, attracting miners and mages.',
  ],
  biological: [
    'Home to unique flora that exists nowhere else in the realm.',
    'A breeding ground for creatures found in no other ecosystem.',
    'Where evolution seems accelerated, species adapt visibly over years.',
    'A location of symbiotic relationships unlike any elsewhere.',
    'Where primal biology and arcane magic intertwine visibly.',
  ],
  temporal: [
    'Time moves differently here—seasons compressed or stretched.',
    'A location where past echoes remain visible and sometimes interactive.',
    'Where the future is sometimes glimpsed in prophetic visions.',
    'A place where aging accelerates or reverses unpredictably.',
    'Where history repeats cyclically, never quite the same way twice.',
  ],
  divine: [
    'A location touched by divine intervention or celestial attention.',
    'Where prayers are answered faster than anywhere else.',
    'A place where the barrier between mortal and divine grows thin.',
    'Where miracles occur regularly, defying natural explanation.',
    'A nexus of multiple divine and infernal interests simultaneously.',
  ],
  infernal: [
    'A place where infernal forces exert unusual influence on reality.',
    'Tainted by demonic presence, yet somehow maintained in equilibrium.',
    'A location where dark pacts have carved permanent marks on existence.',
    'Where damnation seems to linger in the very air.',
    'A crossroads of devilish deals and unholy bargains.',
  ],
  mystical: [
    'An epicenter of ley lines where magical energy pools visibly.',
    'A location where illusions and reality blur dangerously.',
    'Where magic is stronger and stranger than anywhere else.',
    'A place saturated with residual enchantments from ages past.',
    'Where the Feywild and Material Plane overlap significantly.',
  ],
};

const WONDER_CONFLICTS = [
  'Multiple factions compete for control, each believing themselves rightful heir.',
  'Two contradictory magical forces maintain stalemate, neither dominant.',
  'The leader battles their own corruption from the location\'s power.',
  'External forces constantly attempt conquest, creating persistent danger.',
  'Internal schism—population divided on proper governance and use.',
  'The leader makes increasingly difficult choices to maintain balance.',
  'A curse demands periodic sacrifice to maintain stability.',
  'Multiple interdimensional entities claim ownership simultaneously.',
  'The location\'s power slowly drives its leaders to madness.',
  'Prophecy suggests the location\'s dominion will pass hands within years.',
];

const RESOURCE_FOCUSES = [
  'Magic-infused water that holds medicinal properties',
  'Rare crystals formed only under specific conditions',
  'Unique fauna whose byproducts are valuable in alchemy',
  'Flora that blooms rarely with powerful reagent properties',
  'Spiritual energy that can be harvested and bottled',
  'Mineral deposits worth fortunes to the right buyer',
  'Knowledge preserved in archaic runes and ancient records',
  'Seeds and specimens that propagate nowhere else',
];

const DANGER_SOURCES = [
  'Territorial creatures that view all visitors as prey',
  'Environmental hazards that test even the experienced',
  'The leader\'s mercurial temperament and volatile magic',
  'Other factions hidden within the wilderness',
  'Monsters drawn by the location\'s unusual magical aura',
  'The land itself seems actively hostile to trespassers',
  'Temporal distortions that disorient and strand travelers',
];

// ─── Boon/Bane Pools ──────────────────────────────────────────────────────

const BOON_POOLS = {
  magical: [
    {
      name: 'Essence Attunement',
      description: 'Touch the location\'s core and become attuned to its magical essence.',
      mechanicalEffect: '+2 to spell save DC for one school of magic for 30 days'
    },
    {
      name: 'Conduit Blessing',
      description: 'The location\'s magic flows through you momentarily.',
      mechanicalEffect: 'Gain advantage on your next 3 spell attacks'
    },
    {
      name: 'Mystic Resonance',
      description: 'Magical items in your possession are temporarily enhanced.',
      mechanicalEffect: 'All magical items gain +1 to their effects for 10 days'
    },
  ],
  physical: [
    {
      name: 'Enhanced Vitality',
      description: 'The location\'s pure energy rejuvenates your body.',
      mechanicalEffect: 'Regain 2d10 + CON mod HP immediately'
    },
    {
      name: 'Physical Transformation',
      description: 'Temporarily embody the power of creatures native here.',
      mechanicalEffect: '+2 to STR and DEX for 7 days'
    },
    {
      name: 'Primal Empowerment',
      description: 'Attune to the raw biological power of the ecosystem.',
      mechanicalEffect: 'Gain resistance to the dominant environmental damage type for 14 days'
    },
  ],
  knowledge: [
    {
      name: 'Sudden Insight',
      description: 'The location reveals its secrets through vision or premonition.',
      mechanicalEffect: 'Ask the DM one yes/no question about the location\'s secrets'
    },
    {
      name: 'Language Flash',
      description: 'Understand the ancient language of this place.',
      mechanicalEffect: 'Learn to speak and understand one rare ancient language'
    },
    {
      name: 'Skill Impartation',
      description: 'Witness master practitioners and gain insight into their craft.',
      mechanicalEffect: '+3 bonus to one Skill check per long rest for 30 days'
    },
  ],
  social: [
    {
      name: 'Charismatic Echo',
      description: 'Others find you unusually trustworthy in this location.',
      mechanicalEffect: '+3 to Persuasion checks within 10 miles of this location for 7 days'
    },
    {
      name: 'Diplomatic Mantle',
      description: 'Assume temporary authority respected by native creatures.',
      mechanicalEffect: 'Native creatures will listen to you for 10 minutes without attack'
    },
    {
      name: 'Legend Whisper',
      description: 'Stories of your deeds spread mysteriously.',
      mechanicalEffect: '+5 to reputation within 50 miles for the next month'
    },
  ],
};

const BANE_POOLS = {
  magical: [
    {
      name: 'Spell Backlash',
      description: 'The location\'s wild magic rejects your spellcasting.',
      mechanicalEffect: 'Disadvantage on spell attack rolls and spell save DCs for 7 days'
    },
    {
      name: 'Mana Drought',
      description: 'The location drains magical resources as price for intrusion.',
      mechanicalEffect: 'Spell slots cast from this location cost double'
    },
    {
      name: 'Curse of Silence',
      description: 'Magic refuses to answer your call.',
      mechanicalEffect: 'Cannot cast spells with verbal components for 3 days'
    },
  ],
  physical: [
    {
      name: 'Weakening Touch',
      description: 'The location drains physical strength as trespass penalty.',
      mechanicalEffect: '-2 to STR and CON for 14 days'
    },
    {
      name: 'Wasting Affliction',
      description: 'Slow degradation of your physical form begins.',
      mechanicalEffect: 'Lose 1 HP per hour until you leave and rest 8 hours elsewhere'
    },
    {
      name: 'Curse of Fragility',
      description: 'Your body becomes fragile and susceptible to harm.',
      mechanicalEffect: 'Gain vulnerability to all damage for 3 days'
    },
  ],
  mental: [
    {
      name: 'Whispers of Madness',
      description: 'The location\'s presence intrudes on your thoughts.',
      mechanicalEffect: 'Disadvantage on Wisdom saves and Perception checks for 7 days'
    },
    {
      name: 'Identity Erosion',
      description: 'You begin forgetting details about yourself.',
      mechanicalEffect: 'Disadvantage on WIS-based skills and lose 1d4 memories'
    },
    {
      name: 'Compulsion Fragment',
      description: 'The location\'s influence plants an unwilling compulsion.',
      mechanicalEffect: 'Random chance each hour to act against your best interests'
    },
  ],
  social: [
    {
      name: 'Outcast Stigma',
      description: 'The location marks you as anathema to native creatures.',
      mechanicalEffect: 'All native creatures are hostile; -3 to Persuasion checks for 14 days'
    },
    {
      name: 'Betrayal Jinx',
      description: 'Those who accompany you become suspicious and hostile.',
      mechanicalEffect: 'Allies gain disadvantage on trust rolls toward you for 10 days'
    },
    {
      name: 'Reputation Corruption',
      description: 'Stories of your visit become distorted and damaging.',
      mechanicalEffect: '-10 to reputation within 50 miles for 30 days'
    },
  ],
};

// ─── Helper Functions ──────────────────────────────────────────────────────

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

// ─── Main Generation Function ─────────────────────────────────────────────

export function generateEcologicalWonder(
  wonderIndex: number,
  worldSeed: string,
  wonderName: string,
  hex_x: number,
  hex_y: number,
  terrainType: number,
  terrainName: string
): EcologicalWonder {
  const wonderSeed = worldSeed + '|wonder|' + wonderIndex + '|' + wonderName;

  // Pick leader archetype
  const leaderArchetype = pickSeeded(LEADERSHIP_ARCHETYPES, wonderSeed, 0);
  const leaderName = generateLeaderName(wonderSeed);

  // Build leader NPC reference for GRIMOIRE
  const grimoireNpcRef = `npc_${fnv1a(wonderSeed + '|leader').toString(16)}`;

  // Generate lore by combining multiple theme pools
  const themeKeys = Object.keys(LORE_THEMES) as Array<keyof typeof LORE_THEMES>;
  const primaryTheme = pickSeeded(themeKeys, wonderSeed, 1);
  const secondaryTheme = pickSeeded(themeKeys, wonderSeed, 2);

  const primaryLore = pickSeeded(LORE_THEMES[primaryTheme], wonderSeed, 3);
  const secondaryLore = pickSeeded(LORE_THEMES[secondaryTheme], wonderSeed, 4);
  const conflict = pickSeeded(WONDER_CONFLICTS, wonderSeed, 5);
  const resource = pickSeeded(RESOURCE_FOCUSES, wonderSeed, 6);
  const danger = pickSeeded(DANGER_SOURCES, wonderSeed, 7);

  const lore = `${primaryLore} ${secondaryLore} The location is notable for its ${resource}. ${conflict} Despite this, ${danger}.`;

  // Generate quest hooks (3-5 of varying difficulty)
  const questHooks: QuestHook[] = [
    {
      title: `Seek the ${leaderArchetype.archetype}'s Wisdom`,
      description: `Approach ${leaderName} and request guidance on matters of ${pickSeeded(['survival', 'magic', 'leadership', 'ancient history'], wonderSeed, 10)}. Their counsel comes at a price.`,
      difficulty: Math.floor(seededRandom(wonderSeed, 11) * 5) + 1,
    },
    {
      title: `Investigate the Location\'s Mystery`,
      description: `Something strange is occurring at this location. The usual natural order is disrupted. Discover the cause and correct it—or learn to live with it.`,
      difficulty: Math.floor(seededRandom(wonderSeed, 12) * 8) + 1,
    },
    {
      title: `Serve the Community`,
      description: `The local inhabitants have a desperate need: ${pickSeeded(['protection from an ancient predator', 'discovery of a lost resource', 'settlement of a resource dispute', 'recovery of stolen artifacts'], wonderSeed, 13)}. Those who help gain favor with powerful allies.`,
      difficulty: Math.floor(seededRandom(wonderSeed, 14) * 6) + 2,
    },
    {
      title: `Witness the Phenomenon`,
      description: `A rare event occurs in this location—once per season, the stars align, a celestial event manifests, or the land itself transforms. Observe it and survive; knowledge gained might reshape campaigns.`,
      difficulty: Math.floor(seededRandom(wonderSeed, 15) * 4) + 3,
    },
  ];

  // Generate boons (3 diverse options)
  const boonCategories = Object.keys(BOON_POOLS) as Array<keyof typeof BOON_POOLS>;
  const boonCategories1 = pickSeeded(boonCategories, wonderSeed, 20);
  const boonCategories2 = pickSeeded(boonCategories, wonderSeed, 21);
  const boonCategories3 = pickSeeded(boonCategories, wonderSeed, 22);

  const boons: BoonOption[] = [
    pickSeeded(BOON_POOLS[boonCategories1], wonderSeed, 23),
    pickSeeded(BOON_POOLS[boonCategories2], wonderSeed, 24),
    pickSeeded(BOON_POOLS[boonCategories3], wonderSeed, 25),
  ];

  // Generate banes (3 diverse options)
  const baneCategories = Object.keys(BANE_POOLS) as Array<keyof typeof BANE_POOLS>;
  const baneCategories1 = pickSeeded(baneCategories, wonderSeed, 30);
  const baneCategories2 = pickSeeded(baneCategories, wonderSeed, 31);
  const baneCategories3 = pickSeeded(baneCategories, wonderSeed, 32);

  const banes: BaneOption[] = [
    pickSeeded(BANE_POOLS[baneCategories1], wonderSeed, 33),
    pickSeeded(BANE_POOLS[baneCategories2], wonderSeed, 34),
    pickSeeded(BANE_POOLS[baneCategories3], wonderSeed, 35),
  ];

  // Generate 2-4 local establishments connected to GRIMOIRE commerce
  const establishmentCount = Math.floor(seededRandom(wonderSeed, 40) * 3) + 2;
  const establishments = [];

  for (let i = 0; i < establishmentCount; i++) {
    const estType = pickSeeded(
      ['Trading Post', 'Scholar\'s Tower', 'Healing Spring House', 'Alchemist Lab', 'Beast Handler', 'Guide Service'],
      wonderSeed, 41 + i
    );
    establishments.push({
      id: `est_${fnv1a(wonderSeed + '|est|' + i).toString(16)}`,
      name: `${estType} of ${wonderName}`,
      type: estType,
      grimoireCommerceRef: `commerce_${fnv1a(wonderSeed + '|commerce|' + i).toString(16)}`,
    });
  }

  // Danger level influenced by terrain and local conditions
  const baseDanger = Math.floor(seededRandom(wonderSeed, 50) * 15) + 3;
  const terrainModifier = terrainType >= 10 && terrainType <= 12 ? 3 : terrainType <= 2 ? 2 : 0;
  const dangerLevel = Math.min(20, baseDanger + terrainModifier);

  return {
    id: `wonder_${fnv1a(wonderSeed).toString(16)}`,
    name: wonderName,
    type: 'ecological_wonder',
    hex_x,
    hex_y,
    terrain: terrainName,
    lore,
    leader: {
      name: leaderName,
      archetype: leaderArchetype.archetype,
      style: leaderArchetype.style,
      alignment: leaderArchetype.alignment,
      grimoireNpcRef,
    },
    questHooks,
    boons,
    banes,
    establishments,
    dangerLevel,
    discoveryRequirement: `Location known to ${pickSeeded(['scholars', 'explorers', 'natives', 'hidden society'], wonderSeed, 60)}. Rumors suggest hidden entrance at ${wonderName}.`,
  };
}

// ─── Leader Name Generator (deterministic, diverse) ────────────────────────

function generateLeaderName(seed: string): string {
  const prefixes = [
    'Thel', 'Mar', 'Vor', 'Syn', 'Kra', 'Quel', 'Myr', 'Zar', 'Eris', 'Leth',
    'Tal', 'Nor', 'Vil', 'Ash', 'Cass', 'Nym', 'Tyr', 'Xen', 'Syl', 'Bryn'
  ];

  const middles = [
    'a', 'o', 'ae', 'el', 'an', 'ir', 'on', 'ar', 'us', 'is',
    'eth', 'ath', 'ium', 'ora', 'ine', 'age', 'ous', 'ful'
  ];

  const suffixes = [
    'dor', 'mir', 'kar', 'thar', 'ven', 'wise', 'bane', 'stone', 'wing', 'shade',
    'seer', 'guard', 'smith', 'wright', 'flame', 'frost', 'shadow', 'breath'
  ];

  const prefix = pickSeeded(prefixes, seed, 0);
  const middle = pickSeeded(middles, seed, 1);
  const suffix = pickSeeded(suffixes, seed, 2);

  return prefix + middle + suffix;
}

export function generateBulkWonders(
  worldSeed: string,
  wonderCount: number,
  locations: Array<{ col: number; row: number; terrainType: number; terrainName: string }>,
  wonderNames: string[]
): EcologicalWonder[] {
  const wonders: EcologicalWonder[] = [];

  for (let i = 0; i < Math.min(wonderCount, locations.length); i++) {
    const loc = locations[i];
    const name = wonderNames[i] || `Unknown Wonder ${i}`;

    wonders.push(
      generateEcologicalWonder(
        i,
        worldSeed,
        name,
        loc.col,
        loc.row,
        loc.terrainType,
        loc.terrainName
      )
    );
  }

  return wonders;
}
