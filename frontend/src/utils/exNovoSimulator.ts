/**
 * Ex Novo City Simulator — runs entirely client-side
 * Simulates the Ex Novo collaborative city-building game for each city,
 * generating rich history, districts, leaders, crime lords, and factions.
 */

import { City, NPC, Faction } from '../types/world';

// ─── Data Tables ────────────────────────────────────────────────────────────

const FOUNDING_REASONS = [
  'a natural harbour sheltered from storms',
  'a vein of silver discovered by a wandering prospector',
  'the crossing of two ancient trade roads',
  'a holy site where a saint performed a miracle',
  'a fertile river delta that never flooded',
  'a mountain pass that controlled all traffic through the range',
  'a freshwater spring in an otherwise arid wasteland',
  'the ruins of a far older civilisation whose stones were too useful to ignore',
  'a military garrison that became a town after the war ended',
  'a marketplace that grew into permanence over three generations',
];

const CITY_AGES = [
  { label: 'ancient', years: '—settled over a thousand years ago—' },
  { label: 'old', years: '—founded several centuries past—' },
  { label: 'established', years: '—a century or more old—' },
  { label: 'young', years: '—less than a generation old—' },
];

const DISTRICT_TYPES = [
  { name: 'The Merchant Quarter', description: 'Crammed with counting-houses, warehouses, and the smell of coin.' },
  { name: 'The Tangle', description: 'A labyrinth of narrow streets where the poor and desperate make their homes.' },
  { name: 'The High Ward', description: 'Where the wealthy retreat behind high walls and private guards.' },
  { name: 'The Docks', description: 'Smells of fish, tar, and salt. Sailors, longshoremen, and worse.' },
  { name: 'The Temple District', description: 'Spires and shrines to a dozen gods, all competing for the same souls.' },
  { name: 'The Forge Quarter', description: 'The constant clang of hammers day and night. The smiths run this part of town.' },
  { name: 'The Scholar\'s Row', description: 'Libraries, apothecaries, and scholars who argue about everything.' },
  { name: 'The Barracks', description: 'Military presence, training yards, and the discipline that keeps the peace.' },
  { name: 'The Garden Ward', description: 'Parks and townhouses for those who can afford to care about beauty.' },
  { name: 'Oldtown', description: 'The original settlement, its buildings older than anyone can remember.' },
  { name: 'The Warrens', description: 'Underground tunnels and basements where those who avoid daylight conduct business.' },
  { name: 'The Market Green', description: 'An open-air bazaar that operates every day regardless of weather or law.' },
];

const LEADER_TITLES = ['Lord Mayor', 'High Steward', 'Regent', 'Margrave', 'Consul', 'High Warden', 'Archon', 'Burgomaster'];
const CRIME_LORD_TITLES = ['the Shadow', 'the Hook', 'the Pale', 'the Coin', 'the Knife', 'the Fox', 'the Widow', 'the Hammer'];
const GUILD_MASTER_TITLES = ['Guildmaster', 'High Factor', 'Trade Warden', 'Master of Coin', 'Chief Factor'];

const FIRST_NAMES_M = ['Aldric', 'Brennan', 'Castor', 'Davin', 'Emric', 'Farrel', 'Gareth', 'Hadwin', 'Iskar', 'Jorin', 'Keld', 'Lorcan', 'Maren', 'Nestor', 'Oswin', 'Petr', 'Radulf', 'Soren', 'Torvald', 'Ulfric'];
const FIRST_NAMES_F = ['Aelith', 'Brynn', 'Calla', 'Dessa', 'Eira', 'Fenna', 'Gwynna', 'Helka', 'Isra', 'Jora', 'Kira', 'Lysa', 'Maren', 'Nira', 'Osla', 'Prya', 'Renna', 'Syla', 'Thera', 'Ulva'];
const LAST_NAMES = ['Ashford', 'Blackwood', 'Coldwater', 'Dawnmore', 'Eastmarch', 'Flint', 'Greywood', 'Hartwell', 'Ironside', 'Jasper', 'Keld', 'Longmere', 'Marsh', 'Nighthollow', 'Oakhurst', 'Pell', 'Redmoor', 'Stonegate', 'Thorn', 'Underhill'];

const PROBLEMS = [
  'A recent drought has caused grain prices to triple, and the poor are hungry.',
  'A guild has begun extorting small merchants with impunity.',
  'A plague of rats is destroying stored food in the warehouses.',
  'A noble family and a merchant house are in a cold war that threatens to turn hot.',
  'The city guard has become corrupt, taking bribes from criminal elements.',
  'An ancient debt to a neighbouring city is coming due and the treasury is empty.',
  'A mysterious arsonist has burned three buildings in the last month.',
  'The harbour has begun silting up, threatening the city\'s trade.',
  'A charismatic demagogue is stirring up the poor against the ruling class.',
  'The temple of the main god has declared a tithe that the merchants are refusing to pay.',
];

const SECRETS = [
  'The city was built on a mass grave, and something stirs beneath the oldest streets.',
  'The ruling family is not who they claim to be — the true bloodline was murdered two generations ago.',
  'A smuggling tunnel connects the warehouse district to outside the walls.',
  'The city\'s founding artifact is a fake; the real one was stolen decades ago.',
  'A secret society of spellcasters meets monthly in the cellar of the biggest inn.',
  'The city\'s water supply passes through a chamber where someone has been leaving offerings to a dark god.',
  'Three of the city\'s most prominent citizens are werewolves.',
  'The city guard captain is in the pay of a foreign power.',
];

const SPECIALTIES = [
  'dyes and pigments of unusual brilliance',
  'the finest steel blades in the region',
  'spiced wine from their famous vineyards',
  'enchanted textiles woven with minor protective charms',
  'rare herbs and alchemical ingredients from the surrounding wilderness',
  'exotic animals and trained creatures',
  'precision clockwork and mechanical devices',
  'ships built to last a century',
  'the region\'s best cartographers and navigators',
  'preserved foods that survive voyages of months without spoiling',
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
  return shuffled.slice(0, n);
}

function genName(rng: () => number): string {
  const female = rng() > 0.5;
  const first = pick(female ? FIRST_NAMES_F : FIRST_NAMES_M, rng);
  const last = pick(LAST_NAMES, rng);
  return `${first} ${last}`;
}

// ─── Main Simulator ──────────────────────────────────────────────────────────

export interface ExNovoCity {
  foundingStory: string;
  age: string;
  districts: Array<{ name: string; description: string }>;
  specialty: string;
  currentProblem: string;
  secret: string;
  leader: { name: string; title: string; description: string };
  crimeLord: { name: string; alias: string; description: string };
  guildMaster: { name: string; title: string; description: string };
  npcs: NPC[];
  factions: Faction[];
}

export function simulateExNovo(city: City, worldSeed: string): ExNovoCity {
  // Stable seed per city so re-renders don't change things
  const seedNum = city.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) +
    parseInt(worldSeed.replace(/\D/g, '').slice(0, 6) || '42', 10);
  const rng = makeRng(seedNum);

  const founding = pick(FOUNDING_REASONS, rng);
  const ageEntry = pick(CITY_AGES, rng);
  const districts = pickN(DISTRICT_TYPES, Math.floor(rng() * 3) + 3, rng);
  const specialty = pick(SPECIALTIES, rng);
  const problem = pick(PROBLEMS, rng);
  const secret = pick(SECRETS, rng);

  // Generate key NPCs
  const leaderName = genName(rng);
  const leaderTitle = pick(LEADER_TITLES, rng);
  const crimeLordName = genName(rng);
  const crimeLordAlias = pick(CRIME_LORD_TITLES, rng);
  const guildMasterName = genName(rng);
  const guildTitle = pick(GUILD_MASTER_TITLES, rng);

  const leader: ExNovoCity['leader'] = {
    name: leaderName,
    title: leaderTitle,
    description: `${leaderTitle} ${leaderName} ${rng() > 0.5 ? 'rules with an iron fist, feared more than loved' : 'governs through compromise and careful alliances, respected if not beloved'}. ${rng() > 0.5 ? 'They are secretly terrified of losing power.' : 'They carry a burden the public knows nothing about.'}`,
  };

  const crimeLord: ExNovoCity['crimeLord'] = {
    name: crimeLordName,
    alias: crimeLordAlias,
    description: `Known only as "${crimeLordAlias}", ${crimeLordName} controls the shadows of ${city.name}. ${rng() > 0.5 ? 'Nobody has ever seen their face at a crime scene.' : 'They operate through intermediaries so insulated that even their lieutenants don\'t know who gives the orders.'} The city guard knows they exist; proving it is another matter.`,
  };

  const guildMaster: ExNovoCity['guildMaster'] = {
    name: guildMasterName,
    title: guildTitle,
    description: `${guildMasterName} serves as ${guildTitle} of ${city.name}'s merchant consortium. ${rng() > 0.5 ? 'Affable and generous in public, ruthless in contract negotiations.' : 'A former sailor who clawed their way up through the trading houses by knowing exactly when to lie and when to tell the truth.'} Controls more of the city's actual decisions than the ${leaderTitle} does.`,
  };

  // Build NPC array for Grimoire export
  const npcs: NPC[] = [
    {
      id: `${city.id}_leader`,
      name: leaderName,
      type: 'leader',
      race: 'Human',
      alignment: rng() > 0.5 ? 'Lawful Neutral' : 'Lawful Good',
      description: leader.description,
      influence: 'high',
      role: leaderTitle,
      associatedCityId: city.id,
    },
    {
      id: `${city.id}_crimelord`,
      name: `${crimeLordName} ("${crimeLordAlias}")`,
      type: 'criminal',
      race: 'Human',
      alignment: rng() > 0.5 ? 'Chaotic Neutral' : 'Neutral Evil',
      description: crimeLord.description,
      influence: 'high',
      role: 'Crime Lord',
      associatedCityId: city.id,
    },
    {
      id: `${city.id}_guild`,
      name: guildMasterName,
      type: 'merchant',
      race: 'Human',
      alignment: 'True Neutral',
      description: guildMaster.description,
      influence: 'high',
      role: guildTitle,
      associatedCityId: city.id,
    },
  ];

  // Factions
  const factions: Faction[] = [
    {
      id: `${city.id}_ruling`,
      name: `The ${pick(LAST_NAMES, rng)} Council`,
      type: 'Political',
      description: `The ruling body of ${city.name}, nominally led by the ${leaderTitle}.`,
      headquartersId: city.id,
      alignment: 'Lawful Neutral',
      members: [leaderName],
      rivals: [`${city.id}_shadow`],
      allies: [`${city.id}_guild_faction`],
      leader: leaderName,
    },
    {
      id: `${city.id}_shadow`,
      name: `The ${pick(['Crimson', 'Pale', 'Iron', 'Hollow', 'Silent'], rng)} Hand`,
      type: 'Criminal',
      description: `The criminal network controlled by "${crimeLordAlias}". They deal in smuggled goods, protection rackets, and information.`,
      headquartersId: city.id,
      alignment: 'Chaotic Neutral',
      members: [crimeLordName],
      rivals: [`${city.id}_ruling`],
      allies: [],
      leader: `${crimeLordName} ("${crimeLordAlias}")`,
    },
    {
      id: `${city.id}_guild_faction`,
      name: `The ${city.name} Merchant Consortium`,
      type: 'Economic',
      description: `The merchant guild that controls trade through ${city.name}. They back whoever keeps taxes low and roads safe.`,
      headquartersId: city.id,
      alignment: 'True Neutral',
      members: [guildMasterName],
      rivals: [],
      allies: [`${city.id}_ruling`],
      leader: guildMasterName,
    },
  ];

  return {
    foundingStory: `${city.name} grew from ${founding}. It is ${ageEntry.label} ${ageEntry.years}, and its streets carry the weight of that history in every stone.`,
    age: ageEntry.label,
    districts,
    specialty: `${city.name} is known across the region for ${specialty}.`,
    currentProblem: problem,
    secret,
    leader,
    crimeLord,
    guildMaster,
    npcs,
    factions,
  };
}
