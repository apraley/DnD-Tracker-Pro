// City names, POI names, and other name generators
const CITY_NAMES = [
  'Thornhaven', 'Silverdale', 'Ironkeep', 'Stormholm', 'Moonrest',
  'Sunspire', 'Blackwood', 'Whiterun', 'Shadowmere', 'Goldmarch',
  'Crystalheim', 'Brightwater', 'Darkwood', 'Starfall', 'Misthaven',
  'Stonekeep', 'Rivercross', 'Highpeak', 'Deepdale', 'Shadowholm',
  'Frostheim', 'Flamewood', 'Thunderhall', 'Windholm', 'Leafshire',
  'Ashford', 'Brightholm', 'Shadowkeep', 'Starmont', 'Cloudmire',
  'Dragonholm', 'Greyhollow', 'Silverglen', 'Blackthorn', 'Sunhold',
  'Winterford', 'Duskholm', 'Ravensholm', 'Emeraldcrest', 'Steelholm',
  'Waterdeep', 'Baldur\'s Gate', 'Neverwinter', 'Waterdeep', 'Candlekeep',
  'Amnhearth', 'Luskan', 'Triboar', 'Yartar', 'Whitepeak',
  'Fastharow', 'Loudwater', 'Everlund', 'Silverymoon', 'Sundabar',
];

const POI_NAMES = {
  dungeon: [
    'The Abyss Below', 'Cavern of Whispers', 'Tomb of Kings', 'Sunken Palace',
    'The Deep Dark', 'Crypt of Shadows', 'Black Halls', 'The Eternal Dungeon',
    'Obsidian Depths', 'Tower of Lost Souls'
  ],
  ruins: [
    'Ancient Ruins of Therathun', 'Forgotten Temple', 'Lost City', 'Crumbling Spires',
    'Shattered Sanctuary', 'Abandoned Stronghold', 'Ruined Amphitheater', 'Broken Citadel'
  ],
  natural_wonder: [
    'Crystal Caverns', 'Floating Islands', 'The Eternal Waterfalls', 'Petrified Forest',
    'Sky Mountains', 'Bioluminescent Swamp', 'The Diamond Cliffs', 'Aurora Peaks',
    'The Singing Sands', 'Mirror Lake', 'The Void Chasm', 'Frozen Tundra'
  ],
  shrine: [
    'Temple of the Eternal Sun', 'Moonlit Sanctuary', 'The Star Cathedral',
    'Oracle\'s Shrine', 'Holy Grotto', 'Sacred Circle', 'Divine Resting Place'
  ],
  settlement: [
    'Outpost of Hope', 'Trading Post', 'Mining Settlement', 'Fishing Village',
    'Caravansary', 'Hermit\'s Retreat', 'The Way Station'
  ],
  other: [
    'Merchant\'s Vale', 'The Crossroads', 'Ancient Battlefield', 'Sacred Grove',
    'The Wounded Land', 'Storm\'s Eye', 'The Deadlands', 'Enchanted Glade'
  ]
};

const GOVERNMENT_TYPES = [
  'Absolute Monarchy',
  'Constitutional Monarchy',
  'Democracy',
  'Oligarchy',
  'Theocracy',
  'Merchant Republic',
  'Military Dictatorship',
  'Tribal Council',
  'Magocracy',
  'Anarchist Free City',
  'Guild-based Rule',
  'City State',
  'Elective Monarchy',
  'Feudal Hierarchy',
  'Corporate Rule'
];

const FACTION_TYPES = [
  'Ruling Government',
  'Criminal Syndicate',
  'Merchant Guild',
  'Religious Order',
  'Magical Academy',
  'Military Order',
  'Thieves Guild',
  'Artisans Guild',
  'Noble House',
  'Draconic Cult',
  'Resistance Movement',
  'Secret Society',
  'Monastic Order',
  'Ranger Circle',
  'Arcane Conclave'
];

const ADVENTURE_HOOK_TEMPLATES = [
  {
    title: 'The Mysterious Disappearance',
    description: 'A prominent citizen has gone missing under mysterious circumstances. The local authorities need adventurers to investigate.',
    encounterType: 'Investigation'
  },
  {
    title: 'Bandits on the Road',
    description: 'A group of bandits has been attacking merchants traveling through the area. Someone needs to stop them.',
    encounterType: 'Combat'
  },
  {
    title: 'The Ancient Secret',
    description: 'Scholars have discovered references to an ancient artifact hidden in this location. They seek brave souls to retrieve it.',
    encounterType: 'Exploration'
  },
  {
    title: 'Rescue Mission',
    description: 'Innocents are trapped in danger. Time is running out, and heroes are needed.',
    encounterType: 'Rescue'
  },
  {
    title: 'The Dark Ritual',
    description: 'A cult is preparing a terrible ritual that could bring calamity. It must be stopped before midnight.',
    encounterType: 'Combat/Roleplay'
  },
  {
    title: 'Broken Alliance',
    description: 'Two factions are on the brink of war. A diplomatic solution is desperately needed.',
    encounterType: 'Roleplay'
  },
  {
    title: 'The Hidden Passage',
    description: 'Local legends speak of a hidden passage that leads to treasure or knowledge. But it\'s protected by ancient guardians.',
    encounterType: 'Exploration/Puzzle'
  },
  {
    title: 'Curse of the Land',
    description: 'A terrible curse plagues the area, causing crops to wither and animals to flee. The source must be found and destroyed.',
    encounterType: 'Investigation/Combat'
  },
  {
    title: 'The Lost Love',
    description: 'A noble seeks help reuniting with their lost love, separated by circumstance or curse.',
    encounterType: 'Roleplay/Quest'
  },
  {
    title: 'Monsters in the Night',
    description: 'Mysterious creatures have been terrorizing the populace. What are they, and why are they here?',
    encounterType: 'Combat/Investigation'
  }
];

const WEATHER_CONDITIONS = [
  'Clear',
  'Partly Cloudy',
  'Overcast',
  'Light Rain',
  'Heavy Rain',
  'Thunderstorm',
  'Light Snow',
  'Heavy Snow',
  'Blizzard',
  'Fog',
  'Mist',
  'Dust Storm',
  'Hail',
  'Sleet'
];

const ANOMALIES = [
  { name: 'Freak Tornado', severity: 8, duration: '2-8 hours' },
  { name: 'Sudden Frost', severity: 6, duration: '3-5 days' },
  { name: 'Flash Flood', severity: 9, duration: '6-12 hours' },
  { name: 'Meteor Shower', severity: 5, duration: '1 night' },
  { name: 'Plague of Insects', severity: 4, duration: '1-3 weeks' },
  { name: 'Eerie Fog', severity: 3, duration: 'variable' },
  { name: 'Magical Aurora', severity: 2, duration: '1 night' },
  { name: 'Earthquake', severity: 9, duration: 'minutes' },
  { name: 'Volcanic Ash', severity: 7, duration: '1-7 days' },
  { name: 'Haunted Storm', severity: 8, duration: '3-8 hours' }
];

const TERRAIN_TYPES = [
  'Forest',
  'Mountain',
  'Plains',
  'Desert',
  'Swamp',
  'Tundra',
  'Coastline',
  'Hills',
  'Valley',
  'Badlands',
  'Grassland',
  'Savanna'
];

const CLIMATE_TYPES = [
  'Temperate',
  'Tropical',
  'Arid',
  'Cold',
  'Eternal Spring',
  'Volatile',
  'Cursed',
  'Magically Stabilized'
];

module.exports = {
  CITY_NAMES,
  POI_NAMES,
  GOVERNMENT_TYPES,
  FACTION_TYPES,
  ADVENTURE_HOOK_TEMPLATES,
  WEATHER_CONDITIONS,
  ANOMALIES,
  TERRAIN_TYPES,
  CLIMATE_TYPES
};
