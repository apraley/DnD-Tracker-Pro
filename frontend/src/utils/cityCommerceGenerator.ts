/**
 * City Commerce Generator
 *
 * Generates shops, establishments, and commerce opportunities for cities
 * with rich proprietor lore and integration with GRIMOIRE commerce engine.
 *
 * Every establishment created here is designed to be passed to GRIMOIRE for:
 * - Inventory generation based on location and type
 * - Proprietor personality and background
 * - Price scaling and market conditions
 * - Available quests and rumors
 */

import { fnv1a } from './establishmentGenerator';

export interface Establishment {
  id: string;
  name: string;
  type: string;
  quality: 'squalid' | 'poor' | 'modest' | 'comfortable' | 'wealthy';
  proprietor: {
    name: string;
    race: string;
    description: string;
    personality: string;
  };
  rumor?: string;
  stock?: string[];
  grimoireCommerceRef: string; // Reference to GRIMOIRE commerce engine
  specialties?: string[];
  atmosphere?: string;
}

// ─── Establishment Types & Categories ──────────────────────────────────────

const TAVERN_TYPES = [
  'The Wandering Wyvern',
  'The Broken Keel',
  'The Golden Griffin',
  'The Sleeping Dragon',
  'The Crimson Crown',
  'The Shattered Glass',
  'The Rowdy Ram',
  'The Silent Siren',
  'The Laughing Magistrate',
  'The Weeping Willow',
];

const INN_NAMES = [
  'Cozy Hearth Inn',
  'Sunrise Manor',
  'Traveler\'s Rest',
  'The Peaceful Haven',
  'Moon\'s Repose',
  'Starlight Lodge',
  'The Welcoming Home',
  'Quiet Corner Inn',
  'The Gilded Rest',
  'Sanctuary House',
];

const SHOP_TYPES = [
  'Curiosity Merchant',
  'Enchanted Emporium',
  'Exotic Goods',
  'Mystic Curios',
  'Rare Collectibles',
  'Curiosities & Wonders',
  'Oddities & Antiquities',
  'The Peculiar Bazaar',
];

const SERVICE_TYPES = [
  'Healing House',
  'Potion Laboratory',
  'Herbalist\'s Garden',
  'Alchemist\'s Workshop',
  'Scribe\'s Study',
  'Cartography Bureau',
  'Fortune Teller\'s Parlor',
  'Divination Center',
];

const BLACKSMITH_TYPES = [
  'The Forge of Dawn',
  'Iron & Steel',
  'The Copper Anvil',
  'The Silver Hammer',
  'The Molten Works',
  'The Smith\'s Hall',
];

const ARMOR_SMITHS = [
  'The Armored Knight',
  'Steel Protections',
  'The Chain Smithy',
  'Plate & Mail',
];

const TAVERN_QUALITIES: Array<'squalid' | 'poor' | 'modest' | 'comfortable' | 'wealthy'> = [
  'squalid', 'poor', 'modest', 'comfortable', 'wealthy'
];

// ─── Proprietor Personality Pools ─────────────────────────────────────────

const PROPRIETOR_PERSONALITIES = [
  'cheerful and welcoming, remembers every customer\'s favorite drink',
  'stern and serious, tolerates no nonsense or mischief',
  'gossipy and curious, loves hearing juicy rumors',
  'quiet and reserved, speaks only when necessary',
  'jovial and loud, tells jokes constantly',
  'suspicious and paranoid, watches customers closely',
  'flirtatious and charming, uses charisma to sell',
  'artistic and eccentric, has strong opinions on aesthetics',
  'scholarly and pedantic, lectures about their craft',
  'shrewd and calculating, squeezes every coin',
  'kind and compassionate, helps those in need',
  'gruff and intimidating, respects only strength',
  'mysterious and enigmatic, reveals little about themselves',
  'superstitious and ritual-focused, follows strict routines',
  'ambitious and driven, talks of expansion plans',
  'melancholic and brooding, hints at tragic past',
  'chaotic and unpredictable, no two days are the same',
  'obsessive and meticulous, everything has specific place',
  'cynical and bitter, distrusts most people',
  'optimistic and naive, sees best in everyone',
];

const ESTABLISHMENT_RUMORS = [
  'The proprietor was seen meeting with city guard captain in middle of night',
  'Heard they\'re involved with the thieves guild somehow',
  'They donate generously to the local temple for a reason',
  'Whispers that they\'re not actually from this country',
  'A terrible tragedy happened here years ago, they never speak of it',
  'They have connections to nobility; seen fancy visitors come through back door',
  'Used to be an adventurer, settled down after some incident',
  'The proprietor is secretly funding the resistance movement',
  'Strange deliveries arrive at midnight, never seen what\'s inside',
  'They hire people who ask few questions, rumored to shelter fugitives',
  'The proprietor\'s past doesn\'t match their current story, something\'s off',
  'Whispered that they\'re being blackmailed by someone powerful',
  'They know far too much about people\'s secrets, dangerous knowledge',
  'The proprietor is slowly going mad, sanity slipping away',
  'Someone saw them performing strange rituals in the cellar',
];

const ATMOSPHERE_DESCRIPTORS = [
  'warm and inviting, smells of hearth fire and bread',
  'dimly lit by flickering candlelight, shadows dance on walls',
  'loud and raucous, filled with laughter and conversation',
  'quiet and contemplative, perfect for thinking',
  'bustling and chaotic, barely keeping up with customers',
  'refined and elegant, staff move silently and efficiently',
  'rough and dangerous, hardened patrons eyeing newcomers',
  'cozy and intimate, private booths hidden from view',
  'exotic and foreign, smells and decor from distant lands',
  'austere and orderly, everything has its place',
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

function getQualityForType(type: string, seed: string): 'squalid' | 'poor' | 'modest' | 'comfortable' | 'wealthy' {
  // Different types have different quality distributions
  const rand = seededRandom(seed, 0);

  if (type.includes('Tavern') || type.includes('Inn')) {
    if (rand < 0.15) return 'squalid';
    if (rand < 0.35) return 'poor';
    if (rand < 0.65) return 'modest';
    if (rand < 0.85) return 'comfortable';
    return 'wealthy';
  } else if (type.includes('Luxury') || type.includes('Enchanted') || type.includes('Wizard')) {
    if (rand < 0.1) return 'comfortable';
    if (rand < 0.4) return 'comfortable';
    return 'wealthy';
  } else {
    if (rand < 0.2) return 'poor';
    if (rand < 0.5) return 'modest';
    if (rand < 0.75) return 'comfortable';
    return 'wealthy';
  }
}

function generateProprietorDescription(
  name: string,
  race: string,
  personality: string,
  seed: string
): string {
  const detail1 = pickSeeded(
    ['wears distinctive', 'sports a striking', 'has a notable', 'displays a unusual', 'carries a rare'],
    seed, 1
  );
  const detail2 = pickSeeded(
    ['heirloom', 'scar', 'tattoo', 'birthmark', 'piece of jewelry'],
    seed, 2
  );

  return `${race} proprietor who is ${personality}. They ${detail1} ${detail2} that hints at a mysterious past.`;
}

// ─── Main Establishment Generation ────────────────────────────────────────

export function generateTavern(
  index: number,
  cityName: string,
  worldSeed: string
): Establishment {
  const estSeed = worldSeed + '|tavern|' + index + '|' + cityName;

  const name = pickSeeded(TAVERN_TYPES, estSeed, 0);
  const quality = getQualityForType('Tavern', estSeed);

  const proprietorRace = pickSeeded(['Human', 'Dwarf', 'Halfling', 'Elf', 'Half-Orc'], estSeed, 10);
  const proprietorName = pickSeeded(['Barnabus', 'Gertrude', 'Mortis', 'Sylvie', 'Rok'], estSeed, 11);
  const personality = pickSeeded(PROPRIETOR_PERSONALITIES, estSeed, 12);
  const proprietorDesc = generateProprietorDescription(proprietorName, proprietorRace, personality, estSeed);

  const rumor = pickSeeded(ESTABLISHMENT_RUMORS, estSeed, 13);
  const atmosphere = pickSeeded(ATMOSPHERE_DESCRIPTORS, estSeed, 14);

  const specialties = [
    'Local ales and meads',
    'Street performer entertainment',
    'Gambling and card games',
    'Secret back room meetings',
    'Adventurer-friendly atmosphere',
  ];

  return {
    id: `est_${fnv1a(estSeed).toString(16)}`,
    name,
    type: 'Tavern',
    quality,
    proprietor: {
      name: proprietorName,
      race: proprietorRace,
      description: proprietorDesc,
      personality,
    },
    rumor,
    atmosphere,
    specialties,
    grimoireCommerceRef: `commerce_${fnv1a(estSeed + '|grimoire').toString(16)}`,
  };
}

export function generateInn(
  index: number,
  cityName: string,
  worldSeed: string
): Establishment {
  const estSeed = worldSeed + '|inn|' + index + '|' + cityName;

  const name = pickSeeded(INN_NAMES, estSeed, 0);
  const quality = getQualityForType('Inn', estSeed);

  const proprietorRace = pickSeeded(['Human', 'Halfling', 'Gnome', 'Elf'], estSeed, 10);
  const proprietorName = pickSeeded(['Margaret', 'Thaddeus', 'Eleanor', 'Wilhelm'], estSeed, 11);
  const personality = pickSeeded(PROPRIETOR_PERSONALITIES, estSeed, 12);
  const proprietorDesc = generateProprietorDescription(proprietorName, proprietorRace, personality, estSeed);

  const rumor = pickSeeded(ESTABLISHMENT_RUMORS, estSeed, 13);
  const atmosphere = pickSeeded(ATMOSPHERE_DESCRIPTORS, estSeed, 14);

  const specialties = ['Clean beds', 'Hot meals', 'Stable for mounts', 'Safe storage', 'Discreet lodging'];

  return {
    id: `est_${fnv1a(estSeed).toString(16)}`,
    name,
    type: 'Inn',
    quality,
    proprietor: {
      name: proprietorName,
      race: proprietorRace,
      description: proprietorDesc,
      personality,
    },
    rumor,
    atmosphere,
    specialties,
    grimoireCommerceRef: `commerce_${fnv1a(estSeed + '|grimoire').toString(16)}`,
  };
}

export function generateShop(
  index: number,
  cityName: string,
  worldSeed: string,
  shopSubtype?: string
): Establishment {
  const estSeed = worldSeed + '|shop|' + index + '|' + cityName;

  let name: string;
  let type: string;

  if (shopSubtype === 'armor') {
    name = pickSeeded(ARMOR_SMITHS, estSeed, 0);
    type = 'Armor Smithy';
  } else if (shopSubtype === 'weapon') {
    name = pickSeeded(BLACKSMITH_TYPES, estSeed, 0);
    type = 'Weapon Smithy';
  } else {
    name = pickSeeded(SHOP_TYPES, estSeed, 0);
    type = 'General Shop';
  }

  const quality = getQualityForType(type, estSeed);

  const proprietorRace = pickSeeded(['Human', 'Dwarf', 'Gnome', 'Elf'], estSeed, 10);
  const proprietorName = pickSeeded(['Hamrick', 'Grunzel', 'Tinkertop', 'Ironfoot'], estSeed, 11);
  const personality = pickSeeded(PROPRIETOR_PERSONALITIES, estSeed, 12);
  const proprietorDesc = generateProprietorDescription(proprietorName, proprietorRace, personality, estSeed);

  const rumor = pickSeeded(ESTABLISHMENT_RUMORS, estSeed, 13);
  const atmosphere = pickSeeded(ATMOSPHERE_DESCRIPTORS, estSeed, 14);

  let specialties: string[] = [];
  if (type === 'Armor Smithy') {
    specialties = ['Custom fit armor', 'Repairs', 'Enchantment services', 'Sizing for unusual creatures'];
  } else if (type === 'Weapon Smithy') {
    specialties = ['Quality weapons', 'Repairs and maintenance', 'Custom orders', 'Enchanted blades'];
  } else {
    specialties = ['Rare goods', 'Hard-to-find items', 'Bulk purchases', 'Special orders'];
  }

  return {
    id: `est_${fnv1a(estSeed).toString(16)}`,
    name,
    type,
    quality,
    proprietor: {
      name: proprietorName,
      race: proprietorRace,
      description: proprietorDesc,
      personality,
    },
    rumor,
    atmosphere,
    specialties,
    grimoireCommerceRef: `commerce_${fnv1a(estSeed + '|grimoire').toString(16)}`,
  };
}

export function generateService(
  index: number,
  cityName: string,
  worldSeed: string,
  serviceType?: string
): Establishment {
  const estSeed = worldSeed + '|service|' + index + '|' + cityName;

  let name: string;
  let type: string;

  if (serviceType === 'healing') {
    name = pickSeeded(['The Healing Hand', 'Sacred Sanctuary', 'The Mended Soul'], estSeed, 0);
    type = 'Healing House';
  } else if (serviceType === 'potion') {
    name = pickSeeded(['Brewmaster\'s Bottlery', 'The Alchemical Cauldron', 'Liquid Solutions'], estSeed, 0);
    type = 'Potion Laboratory';
  } else if (serviceType === 'magic') {
    name = pickSeeded(['Arcane Sanctum', 'The Spellwright\'s Tower', 'Mystic Enclave'], estSeed, 0);
    type = 'Magic Shop';
  } else {
    name = pickSeeded(SERVICE_TYPES, estSeed, 0);
    type = 'Service Provider';
  }

  const quality = getQualityForType(type, estSeed);

  const proprietorRace = pickSeeded(['Human', 'Elf', 'Tiefling', 'Dwarf'], estSeed, 10);
  const proprietorName = pickSeeded(['Morgra', 'Elara', 'Zephyr', 'Malachai'], estSeed, 11);
  const personality = pickSeeded(PROPRIETOR_PERSONALITIES, estSeed, 12);
  const proprietorDesc = generateProprietorDescription(proprietorName, proprietorRace, personality, estSeed);

  const rumor = pickSeeded(ESTABLISHMENT_RUMORS, estSeed, 13);
  const atmosphere = pickSeeded(ATMOSPHERE_DESCRIPTORS, estSeed, 14);

  let specialties: string[] = [];
  if (type === 'Healing House') {
    specialties = ['Wound treatment', 'Disease cures', 'Restorative services', 'Preventative medicine'];
  } else if (type === 'Potion Laboratory') {
    specialties = ['Custom potions', 'Rare ingredients', 'Alchemical research', 'Quick fixes'];
  } else if (type === 'Magic Shop') {
    specialties = ['Spell components', 'Magical items', 'Spellcasting services', 'Enchantments'];
  } else {
    specialties = ['Professional services', 'Expert consultation', 'Custom solutions'];
  }

  return {
    id: `est_${fnv1a(estSeed).toString(16)}`,
    name,
    type,
    quality,
    proprietor: {
      name: proprietorName,
      race: proprietorRace,
      description: proprietorDesc,
      personality,
    },
    rumor,
    atmosphere,
    specialties,
    grimoireCommerceRef: `commerce_${fnv1a(estSeed + '|grimoire').toString(16)}`,
  };
}

// ─── Bulk District Generation ─────────────────────────────────────────────

export function generateCityEstablishments(
  cityIndex: number,
  cityName: string,
  worldSeed: string
): Establishment[] {
  const establishments: Establishment[] = [];
  let estIndex = 0;

  // Every city has at least one tavern and one inn
  establishments.push(generateTavern(estIndex++, cityName, worldSeed));
  establishments.push(generateInn(estIndex++, cityName, worldSeed));

  // Add 2-4 shops
  const shopCount = Math.floor(seededRandom(worldSeed + '|shops|' + cityIndex, 0) * 3) + 2;
  for (let i = 0; i < shopCount; i++) {
    const subtype = ['armor', 'weapon', undefined][i % 3];
    establishments.push(generateShop(estIndex++, cityName, worldSeed, subtype));
  }

  // Add 1-3 service providers
  const serviceCount = Math.floor(seededRandom(worldSeed + '|services|' + cityIndex, 1) * 2) + 1;
  for (let i = 0; i < serviceCount; i++) {
    const subtype = ['healing', 'potion', 'magic'][i % 3];
    establishments.push(generateService(estIndex++, cityName, worldSeed, subtype));
  }

  return establishments;
}

export function estimateEstablishmentCount(cityPopulation: number): number {
  // Rule of thumb: roughly 1 establishment per 1000 people
  return Math.max(5, Math.floor(cityPopulation / 1000));
}
