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
  'a sacred grove chosen by a religious order as their headquarters',
  'an island too defensible to leave unfortified',
  'a ford across a river that armies and merchants both needed',
  'the discovery of a deep and perfectly sheltered natural harbour',
  'a volcanic hot spring with healing properties',
  'the intersection of three ley lines that made the ground hum with power',
  'a plateau unreachable by flood, avalanche, or cavalry',
  'the shore of a lake so large it took a week to sail across',
  'a cave network that provided shelter during an endless winter',
  'the wreck of a great ship whose cargo was too valuable to abandon',
  'a quarry of stone so fine that builders came from a thousand miles away',
  'a watchtower built to monitor an enemy that no longer exists',
  'the field where a great battle ended and the survivors decided not to leave',
  'a crossroads inn that outlasted every empire that passed through it',
  'a library built to survive the fall of whatever came next',
  'a canyon so narrow it could be defended by ten people against a thousand',
  'an estuary rich with fish and salt and amber washed up from the deep',
  'a grove of trees that bore fruit twelve months a year',
  'a prison for something dangerous that required permanent guards',
  'the first stable ground found after decades of wandering',
  'a hill with sight lines in all directions and no blind spots',
  'a valley sheltered from wind on all four sides',
  'a deposit of iron ore that a blacksmith found and never left',
  'a river bend where boats could safely winter',
  'a cliff face full of caves that needed only doors to become homes',
];

const CITY_AGES = [
  { label: 'ancient', years: '—settled over a thousand years ago—', districtBonus: 2, secretDepth: 'deep' },
  { label: 'very old', years: '—founded eight centuries past—', districtBonus: 2, secretDepth: 'deep' },
  { label: 'old', years: '—founded several centuries past—', districtBonus: 1, secretDepth: 'moderate' },
  { label: 'established', years: '—a century or more old—', districtBonus: 1, secretDepth: 'moderate' },
  { label: 'growing', years: '—two or three generations old—', districtBonus: 0, secretDepth: 'shallow' },
  { label: 'young', years: '—less than a generation old—', districtBonus: 0, secretDepth: 'shallow' },
  { label: 'newly founded', years: '—built within living memory—', districtBonus: -1, secretDepth: 'shallow' },
];

const DISTRICT_TYPES = [
  { name: 'The Merchant Quarter', description: 'Crammed with counting-houses, warehouses, and the smell of coin.' },
  { name: 'The Tangle', description: 'A labyrinth of narrow streets where the poor and desperate make their homes.' },
  { name: 'The High Ward', description: 'Where the wealthy retreat behind high walls and private guards.' },
  { name: 'The Docks', description: 'Smells of fish, tar, and salt. Sailors, longshoremen, and worse.' },
  { name: 'The Temple District', description: 'Spires and shrines to a dozen gods, all competing for the same souls.' },
  { name: 'The Forge Quarter', description: 'The constant clang of hammers day and night. The smiths run this part of town.' },
  { name: "The Scholar's Row", description: 'Libraries, apothecaries, and scholars who argue about everything.' },
  { name: 'The Barracks', description: 'Military presence, training yards, and the discipline that keeps the peace.' },
  { name: 'The Garden Ward', description: 'Parks and townhouses for those who can afford to care about beauty.' },
  { name: 'Oldtown', description: 'The original settlement, its buildings older than anyone can remember.' },
  { name: 'The Warrens', description: 'Underground tunnels and basements where those who avoid daylight conduct business.' },
  { name: 'The Market Green', description: 'An open-air bazaar that operates every day regardless of weather or law.' },
  { name: 'The Rookery', description: 'Cramped tenements stacked ten storeys high. The landlords never visit.' },
  { name: 'The Guildhall District', description: 'Every craft and trade has its hall here, each one a power unto itself.' },
  { name: 'The Harbor Front', description: 'Where ships unload things that never appear on the manifest.' },
  { name: 'The Silver Row', description: 'Jewelers, moneylenders, and pawnshops. Wealth changes hands quietly here.' },
  { name: 'The Undertow', description: 'A neighborhood that floods twice a year. The residents have stopped caring.' },
  { name: 'The Pale Quarter', description: 'Where outsiders live, by choice or by rule. A city within a city.' },
  { name: 'The Spire District', description: 'Built around a tower so old no one agrees who built it.' },
  { name: 'The Slaughterhouse Row', description: 'The butchers, tanners, and renderers. Essential, avoided, and angry about it.' },
  { name: 'Inktown', description: 'Printers, scribes, and rumormongers. The news here is always three versions of true.' },
  { name: 'The Glass Quarter', description: 'Alchemists, glaziers, and chandlers. Always smells faintly of something burning.' },
  { name: 'The Vaults', description: 'The banking district. The money here is old. The grudges are older.' },
  { name: 'The Crossings', description: 'Where three roads meet and everyone stays just long enough to cause trouble.' },
  { name: 'The Mourning Quarter', description: 'Gravediggers, coffin-makers, and priests of death. Quieter than expected.' },
  { name: 'The Tangles', description: 'A fishing district that smells of brine and arguments.' },
  { name: 'Artisan Row', description: 'Weavers, potters, woodcarvers. The good stuff is always in the back.' },
  { name: 'The Arcane Precinct', description: 'Magic practitioners cluster here by tradition, mutual suspicion, and city ordinance.' },
  { name: 'The Loom', description: 'Textile workers, dye-houses, and the guild that controls them all.' },
  { name: 'The Pit', description: 'Built into a quarry. Cheaper than the rest of the city, for obvious reasons.' },
  { name: 'Tradespire', description: 'The commercial towers where brokers shout prices from dawn to dusk.' },
  { name: 'The Stoneyard', description: 'Stonemasons, architects, and the endless sound of chisel on rock.' },
];

const LEADER_TITLES = [
  'Lord Mayor', 'High Steward', 'Regent', 'Margrave', 'Consul', 'High Warden',
  'Archon', 'Burgomaster', 'High Chancellor', 'Prefect', 'Voivode', 'Strategos',
  'High Alderman', 'Tribune', 'Castellan', 'Doge', 'Reeve', 'Lord Protector',
  'Grand Marshal', 'Legate', 'Syndic', 'Justiciar',
];

const CRIME_LORD_ALIASES = [
  'the Shadow', 'the Hook', 'the Pale', 'the Coin', 'the Knife', 'the Fox',
  'the Widow', 'the Hammer', 'the Crow', 'the Veil', 'the Hound', 'the Silence',
  'the Worm', 'the Ghost', 'the Asp', 'the Lantern', 'the Wraith', 'the Brand',
  'the Stitch', 'the Rat', 'the Chain', 'the Bell', 'the Spade', 'Old Smoke',
  'the Leech', 'the Needle', 'the Scale', 'the Mask', 'Black Thread', 'the Coil',
];

const GUILD_MASTER_TITLES = [
  'Guildmaster', 'High Factor', 'Trade Warden', 'Master of Coin', 'Chief Factor',
  'Grand Merchant', 'Harbor Master', 'Factor General', 'Trade Consul',
  'Master Broker', 'Chief Steward', 'Comptroller',
];

const FIRST_NAMES_M = [
  'Aldric', 'Brennan', 'Castor', 'Davin', 'Emric', 'Farrel', 'Gareth', 'Hadwin',
  'Iskar', 'Jorin', 'Keld', 'Lorcan', 'Maren', 'Nestor', 'Oswin', 'Petr',
  'Radulf', 'Soren', 'Torvald', 'Ulfric', 'Vael', 'Wulfric', 'Xander', 'Yorick',
  'Zoren', 'Aldous', 'Bram', 'Cade', 'Doran', 'Everett', 'Flynn', 'Gideon',
  'Hakon', 'Ivan', 'Jasper', 'Keir', 'Liam', 'Merrick', 'Nolan', 'Owen',
  'Pascal', 'Quentin', 'Rhett', 'Stefan', 'Tomas', 'Uriel', 'Victor', 'Wyatt',
];

const FIRST_NAMES_F = [
  'Aelith', 'Brynn', 'Calla', 'Dessa', 'Eira', 'Fenna', 'Gwynna', 'Helka',
  'Isra', 'Jora', 'Kira', 'Lysa', 'Maren', 'Nira', 'Osla', 'Prya',
  'Renna', 'Syla', 'Thera', 'Ulva', 'Vanya', 'Wren', 'Xera', 'Ysa',
  'Zora', 'Adela', 'Bela', 'Calla', 'Dwyn', 'Elara', 'Faye', 'Greta',
  'Hilde', 'Imelda', 'Jessa', 'Kessa', 'Lena', 'Mira', 'Nessa', 'Odra',
  'Petra', 'Quara', 'Reva', 'Sigrid', 'Tilda', 'Una', 'Vessa', 'Wilda',
];

const LAST_NAMES = [
  'Ashford', 'Blackwood', 'Coldwater', 'Dawnmore', 'Eastmarch', 'Flint',
  'Greywood', 'Hartwell', 'Ironside', 'Jasper', 'Keld', 'Longmere',
  'Marsh', 'Nighthollow', 'Oakhurst', 'Pell', 'Redmoor', 'Stonegate',
  'Thorn', 'Underhill', 'Vayne', 'Whitmore', 'Xander', 'Yarrow',
  'Zoll', 'Ashcroft', 'Barrow', 'Crestfall', 'Dunmore', 'Edgewick',
  'Farrow', 'Grimstone', 'Hadwick', 'Illsworth', 'Jarvis', 'Kelton',
  'Lorne', 'Mossgrove', 'Nettlewood', 'Oldbury', 'Pennwick', 'Quarry',
  'Ravenswood', 'Saltmere', 'Thornwick', 'Umber', 'Voss', 'Wychwood',
  'Yarborough', 'Zephyr',
];

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
  'A new road bypasses the city entirely, and trade has dropped by half.',
  'The city\'s water supply has been tainted — nobody knows how or by whom.',
  'Three prominent citizens have gone missing in the last fortnight.',
  'A religious festival has brought pilgrims who refuse to leave.',
  'The garrison has mutinied over three months of missing pay.',
  'A neighbouring lord has imposed a toll on the road that feeds the city.',
  'A disease is spreading through the Warrens and the wealthy pretend it isn\'t.',
  'The city\'s main bridge has become unstable and repairs will cost a fortune.',
  'Two gangs are openly fighting in the streets over territory.',
  'An ambassador from a hostile nation is in residence and demanding impossible concessions.',
  'A series of murders has the city in a panic and the guard has no suspects.',
  'The grain stores were found to be rotted — sabotage or incompetence, nobody knows.',
  'A wildfire outside the walls has destroyed the farms that feed the city.',
  'A prophet has arrived predicting the city\'s imminent destruction.',
  'The dockworkers have gone on strike and nothing is moving through the port.',
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
  'The city is slowly sinking into a network of ancient tunnels below.',
  'A dragon sleeps beneath the oldest part of the city, and the ruling family knows.',
  'The city\'s grain supply is controlled by a single merchant who could starve everyone at will.',
  'The beloved historical founder was actually a war criminal who destroyed a rival city.',
  'A portal to the Shadowfell opens in the deepest cellar of the city\'s oldest inn, every new moon.',
  'The city\'s real governing body is a council of twelve who never appear in public.',
  'An ancient curse means no one born in the city can ever leave permanently — they always return.',
  'The city was built over a sealed vault containing something the gods want forgotten.',
  'Half the city guard are members of the same criminal organization they\'re supposed to police.',
  'The city\'s famous spring actually flows from a ruptured planar seal.',
  'The city\'s most beloved healer has been poisoning patients to keep them coming back.',
  'Something in the city walls resonates with undead energy — the dead here don\'t always stay dead.',
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
  "the region's best cartographers and navigators",
  'preserved foods that survive voyages of months without spoiling',
  'highly accurate astrological charts and star maps',
  'architectural stonework admired across three kingdoms',
  'the most reliable couriers and message runners on the continent',
  'siege engineers whose work has never been successfully breached',
  'glasswork so fine it is purchased by royalty as gifts',
  'scholars who have produced more arcane texts than any other city',
  'horses bred for endurance over rough terrain',
  'a brewing tradition that produces ales found nowhere else',
  'the best physicians and surgeons in the known world',
  'spies and intelligence brokers who sell information to all sides',
  'perfumes and cosmetics traded across the known world',
  'religious relics of uncertain authenticity but unquestionable demand',
  'cheeses aged in the limestone caves beneath the city',
  'paper and ink made from a unique local material',
  'trained birds of prey that sell for small fortunes',
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
  const districtCount = Math.min(Math.max(2, Math.floor(rng() * 3) + 3 + ageEntry.districtBonus), 6);
  const districts = pickN(DISTRICT_TYPES, districtCount, rng);
  const specialty = pick(SPECIALTIES, rng);
  const problem = pick(PROBLEMS, rng);
  const secret = pick(SECRETS, rng);

  // Generate key NPCs
  const leaderName = genName(rng);
  const leaderTitle = pick(LEADER_TITLES, rng);
  const crimeLordName = genName(rng);
  const crimeLordAlias = pick(CRIME_LORD_ALIASES, rng);
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
