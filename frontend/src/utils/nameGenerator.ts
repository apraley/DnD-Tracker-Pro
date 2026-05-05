/**
 * Fantasy Name Generator for World Builder
 * Generates unique names for cities, dungeons, POIs, and natural wonders
 */

const cityPrefixes = [
  'Water', 'Bald', 'Never', 'Candle', 'Silver', 'Gold', 'Dragon', 'Shadow',
  'Bright', 'Dark', 'Crystal', 'Iron', 'Stone', 'Old', 'New', 'Star',
  'Sun', 'Moon', 'Wind', 'Storm', 'Fire', 'Frost', 'Emerald', 'Sapphire'
];

const citySuffixes = [
  'deep', 'keep', 'winter', 'gate', 'moon', 'wood', 'marsh', 'peak',
  'haven', 'stone', 'light', 'hall', 'port', 'ford', 'wick', 'dale',
  'field', 'ridge', 'crest', 'shire', 'borough', 'ton', 'view', 'watch'
];

const dungeonNames = [
  'The Ancient Caverns of', 'The Forgotten Crypt of', 'The Lost Mines of',
  'The Sunken Temple of', 'The Obsidian Depths of', 'The Whispering Halls of',
  'The Iron Fortress of', 'The Shadow Realm of', 'The Crystal Labyrinth of',
  'The Cursed Tombs of', 'The Dragonspine Caves of', 'The Void Vaults of',
  'The Shattered Sanctum of', 'The Bone Galleries of', 'The Eternal Dungeons of',
  'The Petrified Catacombs of', 'The Lich\'s Tower of', 'The Titan\'s Vault of'
];

const poiDescriptors = [
  'Ancient', 'Sacred', 'Mystical', 'Lost', 'Hidden', 'Forbidden', 'Enchanted',
  'Cursed', 'Shattered', 'Floating', 'Submerged', 'Petrified', 'Eternal'
];

const poiTypes = [
  'Ruins', 'Shrine', 'Monument', 'Portal', 'Crater', 'Tree', 'Stone Circle',
  'Tower', 'Well', 'Bridge', 'Statue', 'Obelisk', 'Arch', 'Gate', 'Fountain',
  'Library', 'Observatory', 'Mine', 'Waterfall', 'Canyon'
];

const wonderTypes = [
  'Mount', 'Peak', 'Ridge', 'Range', 'Lake', 'River', 'Forest', 'Grove',
  'Valley', 'Gorge', 'Delta', 'Plateau', 'Cliff', 'Beach', 'Marsh',
  'Cavern System', 'Geyser Field', 'Crystal Cave', 'Meteor Crater'
];

const wonderDescriptors = [
  'Emerald', 'Sapphire', 'Crimson', 'Golden', 'Silver', 'Azure', 'Violet',
  'Obsidian', 'Pearl', 'Jade', 'Amber', 'Ivory', 'Scarlet', 'Eternal',
  'Ancient', 'Windswept', 'Starlit', 'Moonlit', 'Sunlit'
];

let usedNames = new Set<string>();

export function resetNameGenerator() {
  usedNames.clear();
}

export function generateCityName(): string {
  let name: string;
  let attempts = 0;

  do {
    const prefix = cityPrefixes[Math.floor(Math.random() * cityPrefixes.length)];
    const suffix = citySuffixes[Math.floor(Math.random() * citySuffixes.length)];
    name = prefix + "'s " + suffix.charAt(0).toUpperCase() + suffix.slice(1);
    attempts++;
  } while (usedNames.has(name) && attempts < 100);

  usedNames.add(name);
  return name;
}

export function generateDungeonName(): string {
  let name: string;
  let attempts = 0;

  do {
    const descriptor = dungeonNames[Math.floor(Math.random() * dungeonNames.length)];
    const location = cityPrefixes[Math.floor(Math.random() * cityPrefixes.length)];
    name = descriptor + ' ' + location;
    attempts++;
  } while (usedNames.has(name) && attempts < 100);

  usedNames.add(name);
  return name;
}

export function generatePOIName(): string {
  let name: string;
  let attempts = 0;

  do {
    const descriptor = poiDescriptors[Math.floor(Math.random() * poiDescriptors.length)];
    const type = poiTypes[Math.floor(Math.random() * poiTypes.length)];
    name = descriptor + ' ' + type;
    attempts++;
  } while (usedNames.has(name) && attempts < 100);

  usedNames.add(name);
  return name;
}

export function generateWonderName(): string {
  let name: string;
  let attempts = 0;

  do {
    const descriptor = wonderDescriptors[Math.floor(Math.random() * wonderDescriptors.length)];
    const type = wonderTypes[Math.floor(Math.random() * wonderTypes.length)];
    name = descriptor + ' ' + type;
    attempts++;
  } while (usedNames.has(name) && attempts < 100);

  usedNames.add(name);
  return name;
}
