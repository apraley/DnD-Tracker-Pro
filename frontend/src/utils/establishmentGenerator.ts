/**
 * Establishment Generator — client-side, seeded
 * Generates shops, taverns, inns, and municipal buildings for each city district.
 * All results are deterministic per district+city+worldSeed.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type EstablishmentType =
  | 'tavern' | 'inn' | 'blacksmith' | 'general_store'
  | 'apothecary' | 'alchemist' | 'magic_shop' | 'bookshop'
  | 'jeweler' | 'tailor' | 'provisioner' | 'temple'
  | 'guildhall' | 'guard_post' | 'pawnbroker' | 'scribe'
  | 'chandler' | 'stablemaster'
  | 'bakery' | 'library' | 'cartographer' | 'stables' | 'taxidermist'
  | 'mortician' | 'shipwright' | 'tattoo_parlour' | 'potion_brewer'
  | 'monster_parts' | 'thieves_guild' | 'gambling_den' | 'fencing_operation'
  | 'fortune_teller' | 'trading_post' | 'scholar_tower' | 'research_station';

export type EstablishmentQuality = 'squalid' | 'poor' | 'modest' | 'comfortable' | 'wealthy';

export interface Establishment {
  id: string;
  name: string;
  type: EstablishmentType;
  quality: EstablishmentQuality;
  emoji: string;
  proprietor: {
    name: string;
    race: string;
    description: string;
    level?: number;
    ac?: number;
    hp?: number;
    str?: number;
    dex?: number;
    con?: number;
    int?: number;
    wis?: number;
    cha?: number;
    grimoireNpcRef?: string;
  };
  description: string;
  features: string[];
  stock?: string[];     // shops
  menu?: string[];      // taverns, inns
  services?: string[];  // inns, temples, guildhalls
  rumor?: string;       // taverns only
  prices?: string;      // pricing summary
  grimoireCommerceRef?: string;
}

// ─── Seeded RNG ──────────────────────────────────────────────────────────────

export function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (Math.imul(h, 0x01000193)) >>> 0;
  }
  return h;
}

function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = ((Math.imul(1664525, s) + 1013904223) >>> 0);
    return s / 0x100000000;
  };
}

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

function pickN<T>(arr: T[], n: number, rng: () => number): T[] {
  const out: T[] = [];
  const pool = [...arr];
  const count = Math.min(n, pool.length);
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(rng() * pool.length);
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}

// ─── NPC Stat Generation ────────────────────────────────────────────────────

interface ProprietorStats {
  level: number;
  ac: number;
  hp: number;
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

function generateProprietorStats(estType: EstablishmentType, rng: () => number): ProprietorStats {
  // Roll base stats (3d6 style)
  const rollStat = () => Math.floor(rng() * 6) + Math.floor(rng() * 6) + Math.floor(rng() * 6) + 3;

  // Establish baseline for establishment type
  const baseLevel = Math.floor(rng() * 5) + 3; // 3-7

  let stats = {
    str: rollStat(),
    dex: rollStat(),
    con: rollStat(),
    int: rollStat(),
    wis: rollStat(),
    cha: rollStat(),
  };

  // Boost relevant stats based on type
  switch (estType) {
    case 'blacksmith':
    case 'stablemaster':
    case 'shipwright':
      stats.str = Math.min(18, stats.str + 2);
      stats.con = Math.min(18, stats.con + 1);
      break;
    case 'thieves_guild':
    case 'fencing_operation':
    case 'pawnbroker':
      stats.dex = Math.min(18, stats.dex + 2);
      stats.cha = Math.min(18, stats.cha + 1);
      break;
    case 'alchemist':
    case 'apothecary':
    case 'potion_brewer':
      stats.int = Math.min(18, stats.int + 2);
      stats.wis = Math.min(18, stats.wis + 1);
      break;
    case 'temple':
    case 'fortune_teller':
      stats.wis = Math.min(18, stats.wis + 2);
      stats.cha = Math.min(18, stats.cha + 1);
      break;
    case 'tavern':
    case 'gambling_den':
      stats.cha = Math.min(18, stats.cha + 2);
      stats.dex = Math.min(18, stats.dex + 1);
      break;
    case 'magic_shop':
    case 'bookshop':
    case 'library':
      stats.int = Math.min(18, stats.int + 1);
      stats.wis = Math.min(18, stats.wis + 1);
      break;
    case 'guildhall':
      stats.cha = Math.min(18, stats.cha + 1);
      stats.int = Math.min(18, stats.int + 1);
      break;
    case 'trading_post':
    case 'research_station':
      stats.int = Math.min(18, stats.int + 1);
      stats.cha = Math.min(18, stats.cha + 1);
      break;
    case 'scholar_tower':
      stats.int = Math.min(18, stats.int + 2);
      stats.wis = Math.min(18, stats.wis + 1);
      break;
  }

  // Calculate AC and HP
  const ac = 10 + Math.floor((stats.dex - 10) / 2);
  const hpPerLevel = Math.floor((stats.con - 10) / 2) + 1;
  const hp = hpPerLevel * baseLevel + Math.floor(rng() * 8);

  return {
    level: baseLevel,
    ac,
    hp: Math.max(1, hp),
    str: stats.str,
    dex: stats.dex,
    con: stats.con,
    int: stats.int,
    wis: stats.wis,
    cha: stats.cha,
  };
}

// ─── Name Parts ──────────────────────────────────────────────────────────────

const EST_ADJ = [
  'Amber', 'Ancient', 'Ashen', 'Battered', 'Black', 'Blazing', 'Blind', 'Broken',
  'Bronze', 'Burnished', 'Carved', 'Chipped', 'Cobbled', 'Copper', 'Cracked', 'Crooked',
  'Dark', 'Dented', 'Dusk', 'Dusty', 'Dying', 'Faded', 'Fallen', 'Far',
  'Gilded', 'Golden', 'Grey', 'Grim', 'Half', 'Hammered', 'Hidden', 'High',
  'Hollow', 'Hooded', 'Hungry', 'Iron', 'Jade', 'Jolly', 'Last', 'Lean',
  'Limping', 'Lone', 'Lost', 'Low', 'Lucky', 'Mended', 'Midnight', 'Muddy',
  'Old', 'Pale', 'Patient', 'Pearl', 'Pitted', 'Proud', 'Quiet', 'Ragged',
  'Red', 'Reluctant', 'Rusted', 'Salt', 'Scarred', 'Sharp', 'Silver', 'Slow',
  'Smoke', 'Soot', 'Stout', 'Stubborn', 'Sunken', 'Tarnished', 'Thin', 'Three',
  'Tilted', 'Tired', 'True', 'Twin', 'Two', 'Wandering', 'Weathered', 'Whetted',
  'Whistling', 'White', 'Wide', 'Wild', 'Willing', 'Wise', 'Wobbly', 'Yellow',
];

const TAVERN_NOUNS = [
  'Anchor', 'Anvil', 'Badger', 'Barrel', 'Boar', 'Boot', 'Bottle', 'Candle',
  'Cat', 'Chalice', 'Coin', 'Crab', 'Crow', 'Cup', 'Dagger', 'Deer',
  'Dog', 'Dragon', 'Duck', 'Eel', 'Ferret', 'Fish', 'Flag', 'Flask',
  'Fox', 'Frog', 'Gauntlet', 'Goblet', 'Hammer', 'Hare', 'Hart', 'Hound',
  'Jug', 'Keg', 'Kettle', 'Lantern', 'Lion', 'Mace', 'Mare', 'Mug',
  'Nail', 'Needle', 'Newt', 'Otter', 'Owl', 'Ox', 'Pig', 'Pike',
  'Pipe', 'Plank', 'Pot', 'Raven', 'Ring', 'Rope', 'Rooster', 'Saddle',
  'Serpent', 'Shield', 'Skull', 'Spade', 'Sparrow', 'Spike', 'Stag', 'Swan',
  'Sword', 'Tankard', 'Toad', 'Torch', 'Trout', 'Viper', 'Weasel', 'Wolf',
];

const INN_NOUNS = [
  'Arms', 'Beacon', 'Belfry', 'Bridge', 'Brook', 'Chimney', 'Compass', 'Corner',
  'Crossing', 'Crown', 'Door', 'Ember', 'Feather', 'Fireplace', 'Flagon', 'Gable',
  'Gate', 'Gutter', 'Hearth', 'Hill', 'House', 'Key', 'Knoll', 'Landing',
  'Latch', 'Lodge', 'Loft', 'Mantle', 'Milestone', 'Moon', 'Path', 'Pillow',
  'Post', 'Posting House', 'Rest', 'Road', 'Roof', 'Roost', 'Shutter', 'Sign',
  'Sleep', 'Spur', 'Star', 'Stone', 'Stop', 'Sun', 'Threshold', 'Timber',
  'Tower', 'Waypoint', 'Well', 'Wheel', 'Wicket', 'Willow',
];

const SHOP_NOUNS: Record<EstablishmentType, string[]> = {
  blacksmith: [
    'Anvil', 'Armory', 'Bellows', 'Blade', 'Forge', 'Hammer', 'Hearth', 'Iron',
    'Kilns', 'Mallet', 'Smelter', 'Smith', 'Sparks', 'Steel', 'Tongs', 'Wrought',
  ],
  general_store: [
    'Bazaar', 'Counter', 'Emporium', 'Exchange', 'Goods', 'Market', 'Post', 'Provisions',
    'Shelves', 'Stand', 'Stock', 'Store', 'Stall', 'Supply', 'Trade', 'Wares',
  ],
  apothecary: [
    'Balm', 'Bark', 'Bloom', 'Bottle', 'Brew', 'Cure', 'Draught', 'Elixir',
    'Extract', 'Herb', 'Infusion', 'Leaf', 'Mortar', 'Phial', 'Remedy', 'Root',
    'Salve', 'Seed', 'Sprig', 'Tincture', 'Vial', 'Vine',
  ],
  alchemist: [
    'Alembic', 'Cauldron', 'Catalyst', 'Crucible', 'Distillate', 'Essence', 'Flame',
    'Flask', 'Formula', 'Fume', 'Philtre', 'Reagent', 'Retort', 'Smoke', 'Solution',
    'Still', 'Sulphur', 'Transmutation', 'Vapour', 'Vessel',
  ],
  magic_shop: [
    'Arcana', 'Artifice', 'Charm', 'Codex', 'Crystal', 'Enchantment', 'Ether',
    'Glyph', 'Grimoire', 'Incantation', 'Lore', 'Mystic', 'Rune', 'Scroll',
    'Sigil', 'Spark', 'Weave', 'Wisp', 'Wonder',
  ],
  bookshop: [
    'Archive', 'Binding', 'Chapter', 'Chronicle', 'Codex', 'Cover', 'Folio',
    'Ink', 'Leaf', 'Margin', 'Page', 'Press', 'Print', 'Quill', 'Record',
    'Script', 'Spine', 'Text', 'Volume', 'Word',
  ],
  jeweler: [
    'Clasp', 'Cut', 'Facet', 'Gem', 'Gilding', 'Gleam', 'Glitter', 'Lustre',
    'Pearl', 'Polish', 'Setting', 'Shine', 'Sparkle', 'Stone', 'Weight',
  ],
  tailor: [
    'Bolt', 'Button', 'Cloth', 'Cut', 'Dart', 'Drape', 'Fit', 'Fold',
    'Hem', 'Lace', 'Loom', 'Needle', 'Pin', 'Seam', 'Stitch', 'Thread',
    'Weave', 'Wool',
  ],
  provisioner: [
    'Barrel', 'Cask', 'Cellar', 'Goods', 'Larder', 'Pantry', 'Pack', 'Provision',
    'Rack', 'Ration', 'Salt', 'Sack', 'Shelf', 'Smokehouse', 'Stock', 'Store',
    'Supply', 'Victuals', 'Warehouse',
  ],
  pawnbroker: [
    'Assay', 'Claim', 'Deal', 'Exchange', 'Lien', 'Lot', 'Note', 'Pawn',
    'Pledge', 'Price', 'Reclaim', 'Redemption', 'Shelf', 'Token', 'Value',
  ],
  scribe: [
    'Charter', 'Copy', 'Draft', 'Hand', 'Ink', 'Letter', 'Margin', 'Mark',
    'Pen', 'Parchment', 'Quill', 'Record', 'Scroll', 'Seal', 'Writ',
  ],
  chandler: [
    'Candle', 'Cord', 'Fat', 'Flax', 'Grease', 'Lantern', 'Light', 'Oil',
    'Pitch', 'Resin', 'Rope', 'Rush', 'Tallow', 'Tar', 'Wick',
  ],
  stablemaster: [
    'Barn', 'Bit', 'Bridle', 'Canter', 'Farrier', 'Groom', 'Hoof', 'Mane',
    'Paddock', 'Rein', 'Saddle', 'Shoe', 'Spur', 'Stable', 'Stirrup', 'Straw',
  ],
  temple: ['Altar', 'Bell', 'Candle', 'Font', 'Gate', 'Nave', 'Relic', 'Shrine', 'Spire', 'Vigil'],
  guildhall: ['Assembly', 'Charter', 'Council', 'Hall', 'Lodge', 'Mark', 'Meeting', 'Registry', 'Seal'],
  guard_post: ['Armoury', 'Barricade', 'Gate', 'Post', 'Station', 'Tower', 'Watch', 'Ward'],
  tavern: TAVERN_NOUNS,
  inn: INN_NOUNS,
  bakery: ['Crust', 'Crumb', 'Dough', 'Fire', 'Grain', 'Hearth', 'Knead', 'Loaf', 'Mill', 'Oven', 'Rise', 'Roll', 'Rye', 'Seed', 'Wheat'],
  library: ['Archive', 'Binding', 'Collection', 'Compendium', 'Folio', 'Index', 'Ledger', 'Lore', 'Manuscript', 'Record', 'Shelf', 'Stacks', 'Volume', 'Word'],
  cartographer: ['Atlas', 'Bearing', 'Boundary', 'Chart', 'Compass', 'Course', 'Heading', 'Horizon', 'Latitude', 'Meridian', 'Route', 'Scale', 'Survey', 'Traverse'],
  stables: ['Barn', 'Bit', 'Bridle', 'Canter', 'Farrier', 'Groom', 'Hoof', 'Mane', 'Paddock', 'Rein', 'Saddle', 'Straw', 'Tack', 'Withers'],
  taxidermist: ['Hide', 'Horn', 'Mane', 'Pelt', 'Plume', 'Preserve', 'Rack', 'Scale', 'Skull', 'Specimen', 'Trophy', 'Tusk'],
  mortician: ['Ash', 'Bier', 'Candle', 'Crypt', 'Dirge', 'Drape', 'Linen', 'Pall', 'Rite', 'Shroud', 'Vigil', 'Wake'],
  shipwright: ['Adze', 'Caulk', 'Clinker', 'Frame', 'Keel', 'Mast', 'Pitch', 'Plank', 'Rivet', 'Rudder', 'Spar', 'Timber', 'Yard'],
  tattoo_parlour: ['Brand', 'Glyph', 'Ink', 'Line', 'Mark', 'Needle', 'Pigment', 'Sigil', 'Skin', 'Stain', 'Symbol', 'Woad'],
  potion_brewer: ['Alembic', 'Brew', 'Cauldron', 'Distill', 'Draft', 'Drop', 'Flask', 'Phial', 'Philtre', 'Tincture', 'Vial', 'Vintage'],
  monster_parts: ['Bone', 'Claw', 'Eye', 'Fang', 'Gland', 'Gland', 'Horn', 'Ichor', 'Scale', 'Talon', 'Tooth', 'Venom'],
  thieves_guild: ['Fence', 'Guild', 'Hand', 'Hook', 'Lock', 'Mark', 'Pick', 'Ring', 'Safe', 'Shadow', 'Touch', 'Vault'],
  gambling_den: ['Ante', 'Bet', 'Cut', 'Deal', 'Dice', 'Draw', 'Hand', 'House', 'Odds', 'Pot', 'Rake', 'Risk', 'Stake', 'Token'],
  fencing_operation: ['Cache', 'Exchange', 'Front', 'Goods', 'Hold', 'Lot', 'Move', 'Shelf', 'Stash', 'Stock', 'Trade', 'Vault'],
  fortune_teller: ['Card', 'Eye', 'Gaze', 'Glass', 'Oracle', 'Omen', 'Palm', 'Rune', 'Sign', 'Star', 'Thread', 'Veil', 'Vision'],
};

const INN_SUFFIXES = ['Inn', 'Rest', 'Lodge', 'House', 'Stay', 'Arms', 'Retreat'];

// ─── Proprietor Data ──────────────────────────────────────────────────────────

const PROP_FIRST_M = [
  'Aldric', 'Bram', 'Castor', 'Doran', 'Emric', 'Farrel', 'Gareth', 'Hadwin',
  'Iskar', 'Jorin', 'Keld', 'Lorcan', 'Merrick', 'Nolan', 'Oswin', 'Pascal',
  'Quentin', 'Rhett', 'Stefan', 'Tomas', 'Uriel', 'Victor', 'Wyatt', 'Alaric',
  'Baldric', 'Calix', 'Devron', 'Edwyn', 'Flynn', 'Gideon', 'Hakon', 'Ivan',
  'Jasper', 'Keir', 'Liam', 'Nestor', 'Owen', 'Petr', 'Radulf', 'Soren',
  'Torvald', 'Ulfric', 'Vael', 'Wulfric', 'Fenwick', 'Gorvath', 'Halveth', 'Ignace',
];

const PROP_FIRST_F = [
  'Aelith', 'Brynn', 'Calla', 'Dessa', 'Eira', 'Fenna', 'Gwynna', 'Helka',
  'Isra', 'Jora', 'Kira', 'Lysa', 'Mira', 'Nira', 'Osla', 'Petra',
  'Renna', 'Syla', 'Thera', 'Ulva', 'Vanya', 'Wren', 'Adela', 'Bela',
  'Dwyn', 'Elara', 'Faye', 'Greta', 'Hilde', 'Imelda', 'Jessa', 'Kessa',
  'Lena', 'Nessa', 'Odra', 'Reva', 'Sigrid', 'Tilda', 'Una', 'Vessa',
  'Wilda', 'Yara', 'Zara', 'Alindra', 'Calindra', 'Elindra', 'Galindra', 'Halindra',
];

const PROP_LAST = [
  'Ashford', 'Blackwood', 'Coldwater', 'Dawnmore', 'Eastmarch', 'Flint', 'Greywood',
  'Hartwell', 'Ironside', 'Jasper', 'Keld', 'Longmere', 'Marsh', 'Nighthollow',
  'Oakhurst', 'Pell', 'Redmoor', 'Stonegate', 'Thorn', 'Underhill', 'Vayne',
  'Whitmore', 'Yarrow', 'Zoll', 'Ashcroft', 'Barrow', 'Crestfall', 'Dunmore',
  'Edgewick', 'Farrow', 'Grimstone', 'Hadwick', 'Illsworth', 'Jarvis', 'Kelton',
  'Lorne', 'Mossgrove', 'Nettlewood', 'Oldbury', 'Pennwick', 'Ravenswood', 'Saltmere',
  'Thornwick', 'Umber', 'Voss', 'Wychwood', 'Yarborough', 'Zephyr',
];

// Weighted toward human — other races are notable but rarer
const PROP_RACES = [
  'Human', 'Human', 'Human', 'Human', 'Human',
  'Dwarf', 'Dwarf',
  'Elf', 'Half-Elf',
  'Halfling', 'Gnome', 'Half-Orc', 'Tiefling',
];

// District quality baseline: 0=squalid … 4=wealthy
function districtBaseQuality(districtName: string): number {
  const n = districtName.toLowerCase();
  if (/high ward|garden ward/.test(n)) return 4;
  if (/silver row|vaults|vault|moneylend|arcane|astronomer|clockwork|lawyer|runesmith/.test(n)) return 3;
  if (/tangle|warren|rookery|pit|undertow|slaughter|quarter of the lost/.test(n)) return 0;
  if (/dock|harbor|harbour|fishmonger|tanner|dyer|butch|animal|rope walk/.test(n)) return 1;
  return 2; // modest default
}

const QUALITY_TIERS: EstablishmentQuality[] = ['squalid', 'poor', 'modest', 'comfortable', 'wealthy'];

const PROP_PHYSICAL = [
  'a barrel-chested figure with hands like shovels',
  'a lean, weather-beaten woman who moves like someone half her age',
  'a heavyset man whose apron has never been white',
  'a slight woman with sharp eyes that notice everything',
  'a broad-shouldered dwarf with a braided beard to his belt',
  'a tall, stooped man who has to duck every doorframe',
  'a round-faced woman with ink-stained fingers',
  'a grizzled veteran with a poorly-healed scar across one cheek',
  'a young person who looks too young to own anything but clearly does',
  'a middle-aged woman whose calm never breaks, regardless of provocation',
  'a one-armed man who works faster than most people do with two',
  'an elderly gnome who stands on a step stool to reach the counter',
  'a half-orc with a surprisingly gentle manner and enormous hands',
  'a tiefling whose tail knocks things off shelves if they\'re not careful',
  'a dwarf woman with white hair and the grip of someone half her age',
  'a reed-thin elf who has been here longer than anyone else can remember',
  'a heavyset halfling who communicates mostly through eyebrow movements',
  'a sun-darkened man with the hands of a former sailor',
  'a woman with grey-streaked hair and the patient look of someone who has heard everything',
  'a young half-elf whose confidence exceeds their apparent years by a decade',
  'a bald man with elaborate tattoos along his forearms and neck',
  'a woman of middle years whose clothing is always slightly too fine for her trade',
  'an ancient figure whose actual age is impossible to determine',
  'a large man who is almost entirely obscured by the hair on his face',
  'a slight woman who is visibly stronger than she appears',
  'a cheerful dwarf missing two fingers on the left hand and one on the right',
  'a nervous-looking young man who is calmer in a crisis than he looks day-to-day',
  'a woman with a glass eye she makes no effort to conceal',
  'a stoic figure whose expression has three settings: suspicious, less suspicious, and asleep',
  'a person whose name no one can remember getting wrong because they correct it immediately',
  'a compact, efficient woman who never wastes a movement',
  'a florid man who sweats constantly and apologises for it',
  'a thin-lipped woman who smiles only when she means it, which is rarely',
  'a man who laughs at everything and means none of it',
  'a person of indeterminate age and certain authority',
  'a heavyset woman who treats every customer as either a good one or a last-time one',
  'a former soldier who brought military precision to an entirely civilian trade',
  'a small man with large ambitions visible in every gesture',
  'a woman who has been recommended by three different guilds for opposite reasons',
  'a self-taught craftsperson whose work has outlived the people who trained them',
];

const PROP_PERSONALITY = [
  'who speaks in short sentences and expects the same in return',
  'whose prices are fair and mood is not',
  'who remembers every customer\'s name and last purchase',
  'who has a strong opinion about everything and shares it unprompted',
  'who is unfailingly polite to everyone including people who don\'t deserve it',
  'who is openly suspicious of new customers until they prove otherwise',
  'who will negotiate on price but never on quality',
  'who hums while working and does not realise they are doing it',
  'who has a story for every item in stock and will tell it whether asked or not',
  'who has clearly heard every lie anyone has ever tried on them',
  'who is warmer to strangers than to regulars, as a policy',
  'who gives the impression of being easily distracted while missing nothing',
  'who is scrupulously honest in all things except compliments',
  'who considers silence a form of answer and interprets it correctly',
  'who has been in the business long enough to take nothing personally',
  'who becomes animated only when discussing their craft',
  'who reads people as quickly as they read stock levels',
  'who has a code of conduct that they enforce without announcing it',
  'who knows every debt in the neighbourhood and never mentions it unprompted',
  'who can smell a good deal and a bad customer from equal distance',
  'whose patience is not infinite but is considerably longer than most people\'s',
  'who keeps a running argument going with their assistant and includes customers without asking',
  'who is clearly doing two other things while serving you and misses nothing',
  'who treats their establishment with the reverence others reserve for temples',
  'who has refused to serve at least three nobles and been right to do so each time',
  'who does not take offense but does take note',
  'who has a sense of humour that surfaces without warning',
  'who respects craft, competence, and people who know what they want',
  'who has decided that the truth is faster than the alternative',
  'who was in a different, more dangerous trade before this one and it shows',
];

// ─── Establishment-specific Data ──────────────────────────────────────────────

// TAVERN —————————————————————————————————————————————————————————————————————

const TAVERN_DESCRIPTIONS = [
  'A low-ceilinged room thick with pipe smoke and the smell of old wood. Regulars are at their usual tables.',
  'Louder than it looks from outside. The fire is enormous and everyone is too warm.',
  'Three distinct crowds occupy three distinct corners, and everyone knows their corner.',
  'Clean, surprisingly. The kind of place you end up recommending despite yourself.',
  'The furniture has been repaired so many times it has become a patchwork of different woods.',
  'A single large room with a fireplace at each end and the bar in the middle.',
  'Dimly lit. Not by atmosphere — the owner simply buys fewer candles than needed.',
  'The kind of place where conversations stay in the room.',
  'A working-class establishment that has survived four mayors, two fires, and one plague.',
  'The menu changes daily. The clientele changes by the hour.',
  'Built into a converted warehouse. The ceiling is higher than any tavern needs.',
  'A nautical theme that either reflects the owner\'s past or their aspirations.',
  'The staircase to the upper rooms is famously unreliable and somehow never fixed.',
  'Frequented by a cross-section of the city that would not gather anywhere else.',
  'Serves the best of one thing and the rest barely adequately. The one thing is worth the trip.',
];

const TAVERN_DRINKS = [
  'the house dark ale — unsubtle and effective',
  'a pale wheat beer served with a slice of citrus peel',
  'river brandy, warm in winter, on ice in summer',
  'a house blend they call "the usual" that means different things to different people',
  'a sweet mead that tastes better than it should at the price',
  'a sharp cider from local orchards, ordered by people who don\'t drink',
  'spiced mulled wine served through the cold months',
  'a grain spirit served in thimble measures, which locals ignore',
  'a dark stout with a cream head that takes three minutes to pour properly',
  'a summer wine that regulars claim cures a dozen ailments',
  'a house cocktail with a name that changes every week',
  'cold water from a good well, which is more impressive here than elsewhere',
  'a bitter herbal tonic that the owner insists is medicinal',
  'imported wine at prices that explain why it\'s imported',
  'a local brew with a regional ingredient that people either love or don\'t mention',
];

const TAVERN_FOOD = [
  'a hearty stew changed daily with whatever is cheapest',
  'roasted meat on the bone served with twice-baked bread',
  'a fish dish that is better than the neighbourhood suggests',
  'cheese, bread, and pickled things — simple but generous portions',
  'a soup that has been running continuously since the owner\'s grandmother started it',
  'a meat pie with a crust thick enough to hold up under argument',
  'fried roots and salt-cured meat — honest working food',
  'three dishes: all of them filling, two of them good, one of them excellent',
  'whatever came off the market cart that morning, competently prepared',
  'a smoked dish that is the signature and the reason people come back',
  'cold cuts and pickled eggs — bar food elevated slightly above its station',
  'a noodle dish that seems out of place and is entirely authentic',
  'bread baked in-house that is the best thing they make',
  'a slow-cooked dish that requires ordering an hour ahead — worth it',
  'a vegetable plate that surprises people who assumed there would be none',
];

const TAVERN_RUMORS = [
  // City-level rumors (original)
  'The city guard captain hasn\'t been seen at their usual post for three days.',
  'A merchant arrived last week with a cart that never seemed to unload. Nobody knows what was in it.',
  'The sealed building on the corner of [nearest major street] is under new ownership. Nobody saw anyone move in.',
  'Three caravans were supposed to arrive last month. Two did. Nobody is asking about the third.',
  'The price of grain has gone up twice in six weeks. The miller says it\'s the harvest. Nobody believes the miller.',
  'A traveling scholar was asking about local history last week — specifically about what was here before.',
  'The old well in the market district was sealed without explanation. Workers were brought in from out of town.',
  'Someone paid off a large debt to three different moneylenders on the same day. People are wondering where it came from.',
  'A noble family\'s crest was found carved into a building it has no business being in.',
  'The new temple priest has been meeting with city officials after dark. The meetings are not in any official record.',
  'A map was found in the gutter near the guild district. It shows the city, but with rooms that don\'t exist.',
  'Two people who argued publicly last month have been conspicuously friendly since. People are uncertain which is worse.',
  'The locksmith was approached by three separate parties for the same unusual key. They made it for one of them.',
  'The river has been running slightly wrong. Nobody can describe how. It\'s just slightly wrong.',
  'An old mine shaft outside town was recently cleared and then immediately re-sealed.',
  'A travelling performer claimed to know something about the city\'s founding and was asked to leave.',
  'The tax records for a particular street went missing during last month\'s filing. The street\'s residents haven\'t mentioned it.',
  'A letter posted at the courier office has been collected and returned three times. Nobody knows by whom.',
  'The healers\' guild has been ordering unusual quantities of certain supplies. They haven\'t said why.',
  'A dog in the harbour district has been howling at the same building every night for two weeks.',
  'Something was moved through the city at night recently. Multiple people saw separate parts of it. Nobody saw all of it.',
  'The city\'s oldest resident has been giving away possessions. They seem neither ill nor sad.',
  'A warehouse that burned down six years ago was apparently still in use until recently.',
  'The new city council member has been interviewing former employees of someone they replaced.',
  'Three unrelated people described the same dream to the same healer in the same week.',
  'The watch rotation on a particular section of wall was quietly changed two months ago. Nobody announced it.',
  'A sealed letter was delivered to the wrong address and opened by accident. The recipient burned it without reading it, which raises its own questions.',
  'An old acquaintance of the mayor\'s has arrived in town and is staying somewhere that isn\'t the obvious place.',
  'The militia drill schedule was changed without explanation. The new one is harder to observe from the street.',
  'Something in the archives was sealed by council vote last year. Three of those council members are no longer on the council.',
  // From general store
  'The supply wagon from the capital is two weeks overdue — someone on the road is taking tolls nobody authorised.',
  'Last week a stranger paid for a rope in platinum. Nobody uses platinum. Nobody.',
  'A locked back room in one of the market shops has been locked for three years. The owner claims it\'s storage.',
  'Prices went up quietly after the miller\'s dispute. Nobody wants to say why.',
  'Someone\'s been breaking into a shop at night — but nothing is ever taken. Things are just moved.',
  // From blacksmith
  'The smith is forging something special in secret — the forge burns at night when no one should be working.',
  'A rival smith claims this one stole their technique. The rivalry is old and bitter.',
  'A sword commissioned months ago was never collected. The smith keeps it behind the counter and won\'t discuss it.',
  'The smith refused a job from the city guard and didn\'t explain why.',
  // From apothecary
  'The apothecary sold something to a lord\'s steward that left no trace in an autopsy. Or so they say.',
  'Someone is stealing specific herbs from an apothecary garden at night — not common ones, either.',
  'A child was cured of something the city healers said was terminal. Nobody will say how.',
  'Three of the labelled jars on an apothecary shelf are mislabelled — intentionally, it\'s suspected.',
  // From alchemist
  'Something in the alchemist\'s back room hasn\'t been stable for weeks.',
  'A noble paid a fortune for a compound that was supposed to make them irresistible. The results are disputed.',
  'An explosion last month was officially attributed to "atmospheric conditions." Nobody believes this.',
  'Someone bought every vial of a specific reagent in one visit. Every last one.',
  // From jeweller
  'A tiara reported stolen from the lord\'s estate was described to a jeweller last week.',
  'A gem sold recently has a twin. The two together are said to unlock something old.',
  'The most expensive piece in a jeweller\'s case has been there for twelve years. The price never drops.',
  // From bakery
  'The baker hears everything. The morning rush passes every secret through that shop.',
  'A specific morning customer hasn\'t come in for two weeks. The baker is quietly worried.',
  'Someone has been paying for bread with coins that are a shade too light in colour.',
  'The grain shipment this month was short. Someone in the supply chain is skimming.',
  // From tailor
  'The tailor knows who is sleeping with whom from the garments they\'ve repaired.',
  'A cloak was returned. There was something sewn into the lining the customer clearly didn\'t know about.',
  'Someone commissioned an identical copy of a specific noble\'s court dress. They paid in cash.',
  // From library
  'A specific book was requested three times this week by three different people who didn\'t know each other.',
  'Something was removed from the restricted section without being signed out.',
  'A scholar has been in the reading room for eleven days. The librarian has started leaving food.',
  'Someone broke in last month and read something — but took nothing.',
  // From cartographer
  'A buyer came in wanting every map of a specific stretch of coast. Bought them all. Said nothing else.',
  'There\'s a map in an archive that shows a dungeon nobody can locate on the surface today.',
  'The cartographer was offered a large sum to falsify a territorial boundary on an official document.',
  // From stables
  'A horse was brought to the stables a month ago and never collected.',
  'Three fast horses were purchased in one day. Nobody rents three fast horses unless they\'re leaving quickly.',
  'A rider arrived at midnight, stabled a horse, paid for three months in advance, and left on foot.',
  // From magic shop
  'Something in the magic shop back room is definitely sentient. The proprietor has been negotiating with it.',
  'A stolen magical item passed through a shop recently. The proprietor claims they didn\'t know.',
  'A powerful wizard visited last month and left without buying anything. Spent a long time looking at one item.',
  // From pawnshop
  'A weapon came into a pawn shop with bloodstains that pre-dated the scratches. It was moved quickly.',
  'Someone redeemed a pledge item that had been sitting two years. Paid the full accumulated interest without flinching.',
  'Three of the items on a pawnbroker\'s back shelf belong to the same person — brought in on three separate occasions.',
  // From taxidermist
  'A specimen was brought in that the taxidermist identified as a creature no one has recorded in two centuries.',
  'The taxidermist found something inside a creature during preparation that they haven\'t reported to anyone.',
  'An adventuring company sold off their trophies in bulk at prices too low. They were in a hurry.',
  // From mortician
  'A body came in with wounds that the mortician can\'t account for — and they\'ve seen most things.',
  'Two bodies arrived the same night from very different parts of the city, both with the same unusual mark.',
  'A "deceased" person was seen walking three days after the funeral. The coffin was exhumed. It was full.',
  'The mortician receives a sealed letter once a month. They burn it without reading it.',
  // From shipwright
  'A ship was brought in with damage that wasn\'t from weather. The shipwright knows what made those marks.',
  'Three ships have gone missing in the same stretch of water. The survivors describe the same thing.',
  'A derelict ship arrived at the dock with no crew aboard.',
  // From tattoo parlour
  'A specific mark is being worn by multiple people across two different parts of the city.',
  'Someone came in wanting a mark removed that the artist recognised as belonging to a dangerous organisation.',
  'A noble came in at night, alone, wanting a mark that contradicts their public position entirely.',
  // From potion brewer
  'A client commissioned a potion that the brewer prepared, but has since become worried about what it was for.',
  'The experimental batch on the discount shelf has done three different things to three different customers.',
  'Someone paid for a potion that mimics death so convincingly it fools magical detection.',
  // From monster parts
  'A specific component came in from a creature that hasn\'t been seen in this region for decades.',
  'Someone is buying components in a pattern that suggests they\'re building toward a specific ritual.',
  'An adventuring party sold off a haul and one item was significantly more valuable than they realised.',
  // From thieves guild
  'The guild has eyes in the city watch. Has for years. Nobody is sure how far up it goes.',
  'A specific contract was turned down by the guild. The guild turns down very few contracts.',
  'Someone tried to operate independently in guild territory. The outcome is an object lesson nobody discusses.',
  // From gambling den
  'The house has never lost money on a session. The mathematics don\'t entirely account for this.',
  'A crime boss watches their interests from a private booth. The staff know not to seat certain people near them.',
  'Someone staked property against a debt and lost. They\'re contesting the outcome. It isn\'t going well.',
  // From fencing operation
  'A specific item came through a fence recently that they didn\'t recognise — which is unprecedented.',
  'A city official has been selling through a local fence for three years.',
  'Someone tried to sell stolen temple relics. The fence turned it down. This is notable.',
  // From fortune teller
  'The seer predicted a death three months before it happened. Precisely.',
  'A powerful figure visits the fortune teller regularly, in disguise.',
  'Multiple people received readings this month that referenced the same symbol — one none of them had mentioned.',
  'Someone received a death reading and immediately left the city. A week later, there was a fire.',
];

const TAVERN_FEATURES = [
  'A board on the wall lists debts owed by regulars, updated in chalk, publicly.',
  'The ceiling is covered in carved initials going back at least three generations.',
  'A cat lives here with absolute authority and exercises it constantly.',
  'A game of cards has been running at one table for an indeterminate number of days.',
  'The bar top is one continuous piece of wood whose origin no one agrees on.',
  'There is a locked room upstairs that the owner says is full of old furniture.',
  'The fireplace is original to the building and has never been allowed to go cold.',
  'A musical instrument hangs on the wall. Anyone can use it. Not everyone should.',
  'The owner has a collection of unusual coins nailed above the bar.',
  'A wanted poster is framed and hung as decoration. The reward was paid; the poster stayed.',
  'A chalkboard shows today\'s prices. They are marginally different from yesterday\'s.',
  'A dog sleeps under the bar and cannot be moved, disturbed, or particularly noticed.',
  'A private booth in the back requires booking and costs extra for the privilege of privacy.',
  'The door is a different colour from every other door on the street. Apparently intentional.',
  'A map of the region behind the bar has pins indicating places the owner has been.',
  'An old trophy of unclear origin dominates one wall and no one alive remembers the context.',
  'The bartender is the fourth generation of the family to hold the position.',
  'Regulars have assigned seats that visitors learn about only by sitting in them.',
  'A small shrine to a patron deity of travelers sits near the door, freshly tended.',
  'The back exit leads somewhere other than the alley, which is noted by experienced visitors.',
];

// INN —————————————————————————————————————————————————————————————————————————

const INN_DESCRIPTIONS = [
  'Clean sheets, a working lock, and breakfast included. Nothing fancy. Nothing to complain about.',
  'A larger operation than it appears — the courtyard behind the main building has six additional rooms.',
  'The common room smells of sawdust and old hearth smoke. The private rooms are better.',
  'A family operation for three generations. Guests are treated accordingly: well, but firmly.',
  'The exterior is modest. The beds are the best in this district and the owner knows it.',
  'Busy throughout the year. Reservations are advised for market weeks.',
  'Caters to a particular class of traveler — not wealthy, not poor, but regular.',
  'The stables out back are as well-kept as the rooms, which is saying something.',
  'An establishment that values quiet and prices accordingly.',
  'Known throughout the region by travelers who prefer not to be asked questions.',
];

const INN_SERVICES_LIST = [
  'Common room sleeping (2 cp/night)',
  'Shared room, 4 beds (1 sp/night per bed)',
  'Private room, single (3 sp/night)',
  'Private room, double (5 sp/night)',
  'Private suite with sitting room (1 gp/night)',
  'Stabling with feed (1 sp/night per animal)',
  'Hot bath in a private room (2 sp)',
  'Laundry service, returned next day (1 sp per bundle)',
  'Meals included with private room',
  'Breakfast served to all paying guests',
  'Secure storage for valuables (3 cp/night)',
  'Message delivery to any address in the city (2 sp)',
  'Morning wake-call service (1 cp)',
  'Courier connection — the innkeeper knows several',
  'Guard on premises through the night',
];

const INN_NOTABLE_GUESTS = [
  'A merchant from out of town who has extended their stay without explanation.',
  'A traveling scholar who has asked to borrow every map in the building.',
  'Someone who paid for a month in advance and may or may not be in their room.',
  'A retired soldier who has been eating in silence at the same table for a week.',
  'A courier who arrived with urgent dispatches and has been here three days since.',
  'A healer passing through, or so they said when they arrived two weeks ago.',
  'An older woman who receives several visitors per day and never leaves.',
  'A young couple who may or may not be who they say they are.',
  'Nobody, suspiciously — the place is quieter than usual.',
  'A bard who has been performing in the common room and making everyone who hears them slightly uncomfortable.',
];

const INN_FEATURES = [
  'A lockbox in every room, bolted to the floor.',
  'The innkeeper\'s recipe book is legendary locally and never shared.',
  'A message board in the common room for travelers to leave notices.',
  'The stables are cleaner than some of the rooms, which is either embarrassing or impressive.',
  'A long-running policy: disputes settled by the innkeeper are final and observed.',
  'The breakfast is the thing people come back for.',
  'An old guest book going back several decades, available to browse.',
  'A warning in every room that the walls are thin and sound travels.',
  'A cat with the same authority as the tavern variety, exercised differently.',
  'The well on the premises is private and the water is tested regularly.',
  'One room is cheaper than the others for reasons that become apparent on arrival.',
  'A system of colored lanterns indicates room availability without words.',
  'A private entrance for guests who prefer not to use the common room.',
];

// BLACKSMITH —————————————————————————————————————————————————————————————————

const SMITH_DESCRIPTIONS = [
  'Heat rolls out the open front like a living thing. The smith barely looks up from the work — a piece of steel glowing orange on the anvil.',
  'Every surface is coated in a fine layer of soot. The finished weapons along the back wall are spotless.',
  'The clang of hammer on metal never quite stops. Apprentices work bellows while the master shapes metal with practiced, economical strokes.',
  'A working smithy that doubles as an armorer. The queue for repairs is longer than the queue for new commissions.',
  'Military contracts only, or so the sign says. Walk-ins are not encouraged, exactly, but they\'re tolerated if the job is interesting.',
  'The smith\'s reputation is local. The work travels much further.',
  'Specialises in agricultural ironwork — ploughs, hinges, hooks — but does weapons as a sideline that\'s become the main line.',
];

const SMITH_STOCK = [
  'Longsword (standard) — 15gp',
  'Shortsword — 10gp',
  'Handaxe — 5gp',
  'Battleaxe — 10gp',
  'Warhammer — 15gp',
  'Dagger — 2gp',
  'Spear — 1gp',
  'War pick — 5gp',
  'Maul — 10gp',
  'Glaive — 20gp',
  'Halberd — 20gp',
  'Morningstar — 15gp',
  'Chain shirt — 50gp',
  'Scale mail — 50gp',
  'Chain mail — 75gp',
  'Breastplate — 400gp',
  'Shield, steel — 10gp',
  'Shield, wooden — 7gp',
  'Crowbar — 2gp',
  'Grappling hook — 2gp',
];

export const SMITH_RUMORS = [
  'The smith is forging something special in secret — the forge burns at night when no one should be working.',
  'A rival smith in the next town claims this one stole their technique. The rivalry is old and bitter.',
  'A sword commissioned three months ago was never collected. The smith keeps it behind the counter and won\'t discuss it.',
  'The smith refused a job from the city guard and didn\'t explain why. The guard came back twice.',
  'Someone brought in a blade to repair that had no maker\'s mark anywhere on it. The smith recognised it anyway.',
  'The apprentice is better than the master already. The master knows.',
  'A shipment of good iron was short by a third. The carter swears they delivered full weight.',
  'The smith once worked for a mercenary company. They don\'t discuss which one.',
];

const SMITH_FEATURES = [
  'A board on the wall shows current wait times for commissioned work.',
  'Repair work on standard weapons done while you wait if the queue allows.',
  'Will buy back good quality used equipment at roughly half the sale price.',
  'A sample of every major weapon type is on display and available to handle.',
  'Takes military requisition notes at face value.',
  'Armour fitting done on the premises by appointment.',
  'The apprentice is good; the master is better; the difference costs extra.',
  'Will not work with cursed or suspiciously magical materials.',
  'Custom orders are quoted in writing before work begins.',
  'The forge is available for rental during off-hours for qualified practitioners.',
];

// GENERAL STORE —————————————————————————————————————————————————————————————

const GENERAL_DESCRIPTIONS = [
  'Crammed floor to ceiling with goods — rope coils beside spice jars, shovels lean against bolt-cloth, and nothing has a price tag. You have to ask.',
  'A broad-planked shop with a creaking door. The shelves hold a little of everything and a lot of nothing you actually need — until suddenly it has exactly what you were after.',
  'The owner tracks inventory with chalk tallies on a blackboard behind the counter. The board is full. They have run out of board many times before.',
  'Smells of sawdust, dried lavender, and leather. The proprietor knows every customer by name and every item by where it\'s stored, which looks like chaos and is in fact a system.',
  'A converted stable that outgrew its original purpose. Sacks of grain line one wall; the other holds hardware, cloth, and preserved foods in rough wooden crates.',
  'The most popular shop in town not because of its prices, but because its owner knows every piece of gossip and has no compunction about sharing it.',
  'Shelves groaning with goods from a dozen different suppliers. The proprietor haggles with everyone — customers and vendors alike — and considers it sport.',
];

const GENERAL_STOCK = [
  'Rope, hemp (50 ft) — 1gp',
  'Torches (10) — 1sp',
  'Rations, trail (1 day) — 5sp',
  'Lantern, hooded — 5gp',
  'Tinderbox — 5sp',
  'Backpack — 2gp',
  'Waterskin — 2sp',
  'Blanket, wool — 5sp',
  'Iron pot — 2gp',
  'Crowbar — 2gp',
  'Hammer & iron spikes (10) — 1gp',
  'Chalk (10 sticks) — 1cp',
  'Mirror, steel — 5gp',
  'Soap (block) — 2cp',
  'Candles (10) — 1sp',
  'Ink & quill — 1sp',
  'Sealing wax — 5sp',
  'Block and tackle — 1gp',
  'Grappling hook — 2gp',
  'Hunting trap — 5gp',
];

export const GENERAL_RUMORS = [
  'The supply wagon from the capital is two weeks overdue — someone on the road is taking tolls nobody authorised.',
  'Last week a stranger paid for a rope in platinum. Nobody uses platinum. Nobody.',
  'The proprietor once refused to sell to the lord\'s steward. Nobody knows why. The lord hasn\'t forgotten.',
  'A locked back room has been locked for three years. The owner claims it\'s storage. Seems like a lot of padlocks for storage.',
  'Prices went up quietly after the miller\'s dispute. Nobody wants to say why.',
  'Someone\'s been breaking in at night — but nothing is ever taken. Things are just moved.',
  'The apprentice was caught reading a restricted map that was sold in here months ago.',
  'Rumour has it the owner fences goods for a passing merchant with unusual cargo.',
];

// APOTHECARY —————————————————————————————————————————————————————————————————

const APOTH_DESCRIPTIONS = [
  'The smell hits you before you reach the door — a complicated mix of dried flowers, sharp resins, and something earthy underneath it all.',
  'Bundles of dried herbs hang from every beam. Jars of powders and tinctures fill shelves from floor to ceiling, each hand-labelled in small careful script.',
  'Quieter than you\'d expect a busy shop to be. Customers speak softly here, perhaps because the ailments that bring people to an apothecary are rarely things one discusses loudly.',
  'A legitimate shop with an entirely legitimate back room and an entirely legitimate reason the back room stays locked.',
  'The proprietor knows more about what ails you than you\'ve said. They are discreet about this, which is the main reason people come back.',
  'Half herbalist, half healer, all business. The consultation is free; the remedy costs what it costs.',
  'Specialises in compounds that are harder to find elsewhere — not because they\'re illegal, but because most apothecaries lack the patience to make them right.',
];

const APOTH_STOCK = [
  'Healer\'s Kit — 5gp',
  'Antitoxin (vial) — 50gp',
  'Herbalism Kit — 5gp',
  'Potion of Healing — 50gp',
  'Dried willow bark (fever remedy) — 3sp',
  'Calming tincture (3 doses) — 8sp',
  'Sleeping draught (1 dose) — 2sp',
  'Antiplague (vial) — 50gp',
  'Aloe salve (burn treatment) — 4sp',
  'Purgative compound — 2sp',
  'Wound packing (waxed linen) — 1sp',
  'Poultice, fever-break (3 doses) — 6sp',
  'Rat poison (restricted) — ask',
  'Contraceptive herbs (1 month) — 1gp',
  'Deworming compound — 1sp',
  'Greater Healing Potion — 150gp',
  'Insect repellent (5 doses) — 5sp',
  'Splints (pair) — 1sp',
  'Antiseptic wash — 1sp',
  'Nightshade extract (certified use only) — ask',
];

export const APOTH_RUMORS = [
  'The apothecary sold something to a lord\'s steward that left no trace in an autopsy. Or so they say.',
  'Someone is stealing specific herbs from the garden at night — not common ones, either.',
  'A patient came in with a condition the apothecary had only read about in a book. They\'ve kept notes.',
  'The apothecary reported a suspicious purchase to the watch last month. Nobody followed up.',
  'A compound was commissioned that\'s entirely legal but whose only real use is one specific thing. The apothecary made it.',
  'The supply of a specific root has tripled in price because someone is buying it all up quietly.',
  'An apprentice left suddenly last season. The apothecary says they moved on. Friends say otherwise.',
  'The apothecary refuses to treat injuries that look like they came from a blade. They refer those cases elsewhere.',
];

// ALCHEMIST —————————————————————————————————————————————————————————————————

const ALCH_DESCRIPTIONS = [
  'A faint smell of sulphur hangs over everything. The shelves are stained with old spills. Several surfaces are slightly scorched.',
  'Glass equipment covers every flat surface — some bubbling, some cooling, one flashing an alarming colour nobody is addressing.',
  'The alchemist works surrounded by notes written in a cramped, illegible hand. They claim to have a filing system. Evidence is thin.',
  'The windows are thick glass for a reason. Everything is behind the counter for a reason. The counter itself has blast marks.',
  'A practitioner who has clearly survived several explosions and learned from each. The protective eyewear is permanent.',
  'More precise than an apothecary. Considerably more expensive. Considerably more reliable for the things that count.',
  'Operates by appointment for serious commissions. Walk-ins for standard stock are tolerated with mild impatience.',
];

const ALCH_STOCK = [
  'Acid (vial) — 25gp',
  'Alchemist\'s Fire (flask) — 50gp',
  'Alchemist\'s Supplies kit — 50gp',
  'Antitoxin (vial) — 50gp',
  'Potion of Healing — 50gp',
  'Tanglefoot bag — 50gp',
  'Thunderstone — ask',
  'Alchemical silver (weapon coating) — 10gp',
  'Oil of slipperiness — 60gp',
  'Potion of Fire Breathing — 150gp',
  'Luminous ink — 5gp',
  'Transmutation reagent, base — 10gp/oz',
  'Iron gut pills (1 week) — 3sp',
  'Detection powder (invisible ink) — 2gp',
  'Sovereign glue (1 oz) — ask',
  'Universal solvent — ask',
  'Smokepowder, pinch (regulated) — ask',
  'Liquid ice — ask',
  'Antitoxin variant (custom) — 100gp',
  'Proof of purpose required for restricted items',
];

export const ALCH_RUMORS = [
  'Something in the back room hasn\'t been stable for weeks. The alchemist keeps going in with more ingredients.',
  'A noble paid a fortune for a compound that was supposed to make them irresistible. The results are disputed.',
  'The alchemist received a commission from an anonymous party that they refused. They won\'t say why.',
  'A previous apprentice left owing money and took three formulas. The alchemist is very calm about this, which is worse.',
  'An experiment here last year broke every glass object in a two-building radius. The alchemist paid for all of it.',
  'Someone has been purchasing precursor reagents from three different suppliers in small quantities. The alchemist noticed.',
  'The supply of a specific rare mineral has dried up. Nobody knows where it\'s all going.',
  'A compound was commissioned, made, and then the client never came back for it. It\'s still here.',
];

// MAGIC SHOP —————————————————————————————————————————————————————————————————

const MAGIC_DESCRIPTIONS = [
  'The door is enchanted to detect intent. The proprietor refuses to elaborate on what that means for hostile visitors.',
  'Cluttered, dim, and fascinating. Every object hums faintly with residual magic. Some of them are staring at you.',
  'The items in the display case are organised by danger level. The proprietor says this openly. Several items are not in the display case.',
  'Not everything in here is for sale. Some of it is for display. Some of it cannot be moved.',
  'Smaller stock than expected, all of it verified by someone qualified to verify it.',
  'A shop that has changed ownership several times. The inventory never quite matches the ledger.',
  'Trading in information as often as objects. The proprietor knows more about what you\'re looking for than they should.',
];

const MAGIC_STOCK = [
  'Spell component pouch — 25gp',
  'Sending stone (paired) — 200gp',
  'Bag of Holding — 500gp',
  'Eyes of Minute Seeing — 2,500gp',
  'Candle of Tell (truth detection, 1 use) — 150gp',
  'Spell scroll (cantrip) — 25gp',
  'Spell scroll (1st level) — 50gp',
  'Spell scroll (2nd level) — 150gp',
  'Spell scroll (3rd level) — 300gp',
  'Potion of Healing — 50gp',
  'Potion of Greater Healing — 150gp',
  'Potion of Climbing — 75gp',
  'Rope of Climbing — 300gp',
  'Immovable Rod — 500gp',
  'Lantern of Revealing — 500gp',
  'Ring of Warmth — 400gp',
  'Boots of Elvenkind — 500gp',
  'Identify ritual service — 25gp/item',
  'Attunement assistance — 50gp (appointment)',
  '+1 ammunition (20) — 150gp',
];

export const MAGIC_RUMORS = [
  'Something in the back room is definitely sentient. The proprietor has been negotiating with it for weeks.',
  'A stolen magical item passed through here. The proprietor claims they didn\'t know. The guild doesn\'t believe them.',
  'A scroll was sold here last month that nobody should have been able to sell — it belonged to a sealed collection.',
  'The proprietor identified something and went very quiet. They returned the object and refunded the fee.',
  'An item was left for appraisal six months ago. The client never came back. The proprietor is afraid to open it.',
  'Someone tried to sell an obviously cursed object. The proprietor refused. It was found on the doorstep the next morning.',
  'A specific type of component has been unavailable for three months. Nobody official is explaining why.',
  'The shop was broken into, but nothing was taken. Something was left behind.',
];

// BOOKSHOP —————————————————————————————————————————————————————————————————

const BOOK_DESCRIPTIONS = [
  'More books than shelf space and more shelf space than floor. Browsing is free; touching requires asking.',
  'A scholarly operation that sells what it finds interesting and lets popular taste fend for itself.',
  'Maps are the specialty. Books are the excuse.',
  'Used and new, sorted by a system that rewards patience.',
  'The owner reads everything. They have opinions. They\'ll share them.',
];

const BOOK_STOCK = [
  'Local history, bound (5 gp)', 'Regional atlas (10 gp)', 'City map, current edition (2 gp)',
  'Dungeon geography, general text (8 gp)', 'Bestiary, common creatures (12 gp)',
  'Bestiary, rare creatures (35 gp)', 'Spell theory, introductory (15 gp)',
  'Herbalism compendium (20 gp)', 'Alchemical formulary, basic (25 gp)',
  'Trade languages primer (5 gp)', 'Legal codex, local (8 gp)',
  'Historical chronicles, regional (7 gp ea)', 'Mythology and religion text (6 gp)',
  'Navigation tables (12 gp)', 'Engineering basics (10 gp)',
  'Blank journal (1 gp)', 'Blank ledger (2 gp)', 'Calligraphy primer (3 gp)',
  'Ink and quill set (5 gp)', 'Parchment, 10 sheets (2 sp ea)',
  'Rare text (price on request, may not be for sale)',
  'Map commission (time and price vary)',
  'Bought texts appraised at half market value',
];

// JEWELER —————————————————————————————————————————————————————————————————────

const JEWEL_DESCRIPTIONS = [
  'Everything in the display case catches light differently. The jeweller has positioned every lamp to maximise this effect, and it is extremely effective.',
  'Quiet, clean, and slightly intimidating. A small sign by the door reads: "Appraisals by appointment." The jeweller looks up and assesses you immediately upon entry.',
  'The front counter holds a loupe, a scale, and a very small knife. The jeweller uses all three within thirty seconds of examining any piece.',
  'The display cases are locked. The conversation is free. The price is not discussed until trust is established.',
  'Appraisal is the secondary service. It generates most of the actual business.',
  'New work, used work, and old work — all of it assessed before purchase, all of it sold with provenance stated clearly.',
  'The pieces in the window are advertising. The real stock is in the back room, where viewing is by arrangement.',
];

const JEWEL_STOCK = [
  'Gold ring (plain) — 25gp',
  'Silver necklace (filigree) — 45gp',
  'Sapphire pendant — 250gp',
  'Ruby earrings (pair) — 300gp',
  'Emerald brooch — 400gp',
  'Signet ring, silver — 15gp',
  'Signet ring, gold — 40gp',
  'Pearl pendant — 20gp',
  'Silver ring, plain — 5sp',
  'Silver ring, engraved — 1gp',
  'Gold ring, set stone — 15–50gp',
  'Cut gem, common — 5–20gp',
  'Cut gem, rare — 50–500gp',
  'Bracelet, silver — 4gp',
  'Bracelet, gold — 25gp',
  'Earrings, pair, silver — 3gp',
  'Custom setting work — quote on request',
  'Raw gem appraisal — 2sp/item',
  'Engraving service — 1gp (short text)',
  'Purchased items assessed at fair market value',
];

export const JEWEL_RUMORS = [
  'A tiara reported stolen from the lord\'s estate was described to the jeweller last week. Nobody is quite sure by whom.',
  'The jeweller has appraised something so valuable they\'re afraid to say what it was or who brought it.',
  'A commission was placed by an anonymous party — very specific design, very specific stone. It was collected by a messenger.',
  'The jeweller refused to appraise one item and asked the client to leave. They haven\'t said what it was.',
  'Three pieces brought in for repair all had the same distinctive setting mark — from a workshop nobody has heard of.',
  'A gemstone was sold here that the buyer later discovered was genuine in an unexpected way. They haven\'t complained.',
  'Someone has been asking about a specific family\'s heirloom set. Not to buy — just to know if it had been brought in.',
  'The jeweller was approached to make a replica of something. They asked no questions and made no record of it.',
];

// TAILOR ——————————————————————————————————————————————————————————————————────

const TAILOR_DESCRIPTIONS = [
  'Bolts of fabric line every wall from floor to ceiling. The tailor moves through the narrow aisles with practiced ease.',
  'A measuring tape is perpetually around the tailor\'s neck. They assess your measurements the moment you walk in — not rudely, professionally.',
  'Finished garments hang along one wall, awaiting collection. Most have names on small tags. A few have been waiting longer than seems polite.',
  'Work done in the shop while you wait, within reason. Major commissions require a fitting and patience.',
  'Repairs, alterations, and new work. Repairs are what keeps the lights on. New work is what keeps the tailor interested.',
  'The stock on the rack is ready to wear. Custom orders take two to four weeks, and the result is worth the wait.',
  'Discreet. Knows that costumes, disguises, and unusual specifications are professionally neutral work not requiring explanation.',
];

const TAILOR_STOCK = [
  'Common travelling clothes (set) — 5sp',
  'Fine wool cloak — 3gp',
  'Silk blouse/shirt — 8gp',
  'Leather jerkin (fitted) — 5gp',
  'Formal court attire (set) — 25gp',
  'Traveler\'s clothes — 2gp',
  'Fine clothes — 15gp',
  'Costume — 5gp',
  'Robes, simple — 2gp',
  'Robes, fine — 10gp',
  'Cloak, weather-treated — 5gp',
  'Boots, leather — 2gp',
  'Gloves, leather — 2sp',
  'Hat, fine — 3gp',
  'Belt — 2sp',
  'Alterations — 1sp–1gp',
  'Repair, minor — 5cp',
  'Custom commission — quoted on measurement',
  'Livery (household) — quoted per unit',
  'Military uniform alteration — ask',
];

export const TAILOR_RUMORS = [
  'The tailor recently made a uniform for a city guard who was supposed to have retired.',
  'Someone commissioned an identical copy of a specific noble\'s court dress. They paid in cash.',
  'A garment was left for alteration and never collected. The tailor is keeping it. It\'s very fine.',
  'The tailor altered a cloak that had something hidden in the lining. They didn\'t mention this to the owner.',
  'Three strangers came in the same week asking for the same unusual style of hidden pocket. They didn\'t know each other.',
  'A livery commission was placed for a household that no longer officially exists.',
  'The tailor made a shroud for someone who was supposed to still be alive.',
  'A dye lot came in from an unexpected source at an unexpected price. The tailor asked no questions.',
];

// PROVISIONER ———————————————————————————————————————————————————————————————

const PROV_DESCRIPTIONS = [
  'Trail rations, preserved goods, and the things you remember you needed only after leaving.',
  'Outfitting travelers since before the current road was built.',
  'Everything for a journey. Nothing for a party.',
  'The smoked goods are the reason most regulars come. Everything else is convenient.',
];

const PROV_STOCK = [
  'Trail rations, 1 day (5 sp)', 'Trail rations, 10 days (5 gp)',
  'Hardtack, 10 (2 sp)', 'Dried fruit, 1 lb (3 sp)', 'Salted meat, 1 lb (2 sp)',
  'Smoked fish, 2 lb (4 sp)', 'Hard cheese, 1 lb (2 sp)',
  'Cooking oil, flask (5 sp)', 'Salt, 1 lb (5 cp)', 'Spice pack, assorted (1 gp)',
  'Waterskin (2 sp)', 'Canteen, metal (1 gp)', 'Flask, hip (3 sp)',
  'Bedroll (1 gp)', 'Blanket, wool (5 sp)', 'Tent, two-person (2 gp)',
  'Mess kit (2 sp)', 'Cook pot (2 gp)', 'Tinder and flint (1 gp)',
  'Torches, 10 (1 sp)', 'Lantern oil, 5 flasks (5 sp)',
  'Rope, 50 ft hempen (1 gp)', 'Twine, 300 ft (5 sp)',
  'Animal feed, 1 day (5 cp)', 'Animal feed, week (3 sp)',
];

// PAWNBROKER ————————————————————————————————————————————————————————————————

const PAWN_DESCRIPTIONS = [
  'Everything in here has had at least one previous owner. Some of it had several, under increasingly awkward circumstances.',
  'The proprietor can name a price for anything within three seconds of looking at it. They have never been dramatically wrong.',
  'A mismatched collection of goods — jewellery alongside tools alongside weapons alongside someone\'s grandmother\'s candlesticks.',
  'They buy what people need to sell and sell what people left behind. The business model is built on other people\'s bad months.',
  'Fair is relative. Transparent, at least — prices are marked, terms are stated, and there\'s no haggling on the floor rate.',
  'The back room contains things that were pawned and not reclaimed. Very interesting things, some of which the proprietor is not in a hurry to sell.',
  'A reflection of the neighbourhood\'s recent history, visible on every shelf. You can tell when things were bad by what\'s on display.',
];

const PAWN_STOCK = [
  'Dagger (plain, used) — 1gp',
  'Shortsword (serviceable) — 6gp',
  'Crossbow, light (needs string) — 7gp',
  'Chain shirt (dented) — 30gp',
  'Lantern (scratched) — 3gp',
  'Weapons, used (condition varies) — half standard',
  'Armour pieces, used (varies)',
  'Jewellery, unclaimed (appraised before sale)',
  'Musical instruments, pawned (varies)',
  'Clothing, assorted (low prices)',
  'Books, unsorted — 1–5gp',
  'Kitchen goods — 1sp–1gp',
  'Locks, used but functional — 3–7gp',
  'Coins, foreign (exchanged at a fee)',
  'Short-term loans against pawned goods (ask, terms discussed privately)',
];

export const PAWN_RUMORS = [
  'A weapon came in with bloodstains that pre-dated the scratches. The pawnbroker moved it quickly.',
  'Someone redeemed a pledge item that had been here for two years. Paid the full accumulated interest without flinching.',
  'An item came in last week that the pawnbroker recognised and refused to purchase. They asked the seller to leave.',
  'Three separate people brought in the same type of object in a single month. The pawnbroker noticed.',
  'A note of hand was redeemed that the pawnbroker had assumed worthless. They made a tidy profit and haven\'t stopped thinking about it.',
  'A family\'s entire household contents came through here over the course of two months. Nobody is explaining why.',
  'The pawnbroker turned down a deal that would have tripled their money. They won\'t say why.',
  'An item in the window has been there for a year with no takers. Several people have come in specifically to look at it and left without buying.',
];

// SCRIBE ————————————————————————————————————————————————————————————————————

const SCRIBE_DESCRIPTIONS = [
  'Official documents, letters of introduction, and contracts drawn up on the premises.',
  'One of the few places that can produce a notarised copy of anything.',
  'Translates between eight languages. Doesn\'t recommend guessing on the others.',
  'Officially neutral. Willing to draft whatever either party needs.',
];

const SCRIBE_SERVICES = [
  'Letter drafting (2–5 sp depending on length)', 'Letter copying (1 sp per page)',
  'Document translation (2 gp per page)', 'Contract drafting (5 gp standard, more for complex)',
  'Notarisation (1 gp per document)', 'Deed registration (2 gp plus filing fee)',
  'Will and testament (5 gp)', 'Business charter drafting (10 gp)',
  'Map copying (2–5 gp depending on detail)', 'Official letterhead supply (2 sp for 10)',
  'Wax seal service (5 sp)', 'Cipher letter (3 gp)', 'Coded message (ask)',
  'Historical research (5 gp/day)', 'Title search (3 gp)',
  'Blank parchment, sheet (1 sp)', 'Ink, quality (10 gp/oz)', 'Quills, 3 (5 cp)',
];

// CHANDLER ——————————————————————————————————————————————————————————————————

const CHAND_DESCRIPTIONS = [
  'Candles, rope, tar, and oil. The essentials of keeping things lit and together.',
  'Everything they sell can be used for something else, and the owner is aware.',
  'A practical establishment for practical needs.',
  'The smell of tallow is permanent. Customers stop noticing within minutes.',
];

const CHAND_STOCK = [
  'Candle, tallow (1 cp)', 'Candle, wax (5 cp)', 'Candle, colored (2 cp)',
  'Candle, scented (5 cp)', 'Candles, 10 tallow (5 cp)', 'Candles, 10 wax (3 sp)',
  'Oil, lamp, flask (1 sp)', 'Oil, lamp, 10 flasks (9 sp)',
  'Oil, lantern, refined (2 sp)', 'Oil, cooking (3 sp)',
  'Rope, 50 ft hempen (1 gp)', 'Rope, 50 ft silk (10 gp)', 'Twine, 100 ft (2 sp)',
  'Tar, 1 lb (1 sp)', 'Pitch, 1 lb (5 cp)', 'Resin, raw (3 sp/lb)',
  'Wick material, spool (5 cp)', 'Wax, block (3 sp)', 'Tallow, rendered (1 sp/lb)',
  'Lantern, hooded (5 gp)', 'Lantern, bullseye (10 gp)', 'Lantern, storm (8 gp)',
];

// STABLEMASTER ——————————————————————————————————————————————————————————————

const STABLE_DESCRIPTIONS = [
  'Better-kept than most stables in this part of the city. It shows in the animals.',
  'Buys, sells, and boards. The boarding side is most of the income.',
  'Three generations in horses. They know more about your animal in thirty seconds than you do.',
  'The horses here are healthy. The prices reflect this without apology.',
];

const STABLE_SERVICES = [
  'Stabling, 1 night (4 sp)', 'Stabling, 1 week (2 gp)', 'Stabling, 1 month (7 gp)',
  'Feed and water included with stabling', 'Grooming service (5 sp)',
  'Farrier work, standard shoe (1 gp per hoof)', 'Farrier work, cold shoe (2 gp per hoof)',
  'Veterinary assessment (5 sp)', 'Wound treatment, minor (2 gp)',
  'Horse for sale, riding, standard (75–100 gp)', 'Horse for sale, draft (50 gp)',
  'Horse for sale, warhorse (400–500 gp)',
  'Mule for sale (8 gp)', 'Pony for sale (30 gp)',
  'Saddle, riding (10 gp)', 'Saddle, military (20 gp)', 'Saddlebags (4 gp)',
  'Bit and bridle (2 gp)', 'Barding, leather (40 gp)', 'Barding, half plate (750 gp, commission)',
  'Cart for sale (15 gp)', 'Wagon for sale (35 gp)',
];

// TEMPLE ———————————————————————————————————————————————————————————————————

const TEMPLE_DEITIES = [
  'the Allfather', 'the Healer', 'the Traveler', 'the Keeper of Records',
  'the Lady of the Harvest', 'the Lord of the Deep', 'the Smith', 'the Judge',
  'the Hunter', 'the Trickster', 'the Warden of the Dead', 'the Mother of Cities',
  'the Flame Undying', 'the Living Wind', 'the Stone Throne', 'the Weaver',
  'the Guardian of Oaths', 'the Seeker', 'the Forgotten Name', 'the Open Hand',
];

const TEMPLE_DESCRIPTIONS_LIST = [
  'Open to all who enter respectfully. The priests ask only for sincerity.',
  'A working temple — services are held at dawn, midday, and dusk.',
  'More practical than ceremonial. The healers here see a dozen patients a day.',
  'An old building. The faith it houses outlasted three others that shared the space.',
  'The coffers are always low. The door is always open.',
  'Run by a single priest whose energy suggests divine assistance.',
];

const TEMPLE_SERVICES_LIST = [
  'Prayer and counsel (free)', 'Healing, minor wounds (2 sp, donation)',
  'Healing, serious wounds (2 gp, donation)', 'Restoration, disease (5 gp, donation)',
  'Restoration, curse (15 gp, donation)', 'Last rites and preparation of the dead (2 gp)',
  'Wedding ceremony (5 gp)', 'Coming-of-age ceremony (2 gp)',
  'Blessing of a journey (1 gp)', 'Blessing of a business or home (3 gp)',
  'Divination, minor (10 gp, results not guaranteed)', 'Consecrated water, flask (5 sp)',
  'Holy symbol, simple (5 gp)', 'Holy symbol, silver (25 gp)',
  'Sanctuary for travelers in need (by arrangement)', 'Literacy classes (free, three days a week)',
  'Soup kitchen (free to those with need)',
];

// GUILDHALL ——————————————————————————————————————————————————————————————————

const GUILD_TYPES = [
  'Merchants\'', 'Craftsmen\'s', 'Mariners\'', 'Healers\'', 'Scholars\'',
  'Masons\'', 'Weavers\'', 'Smiths\'', 'Scribes\'', 'Dyers\'',
  'Carpenters\'', 'Architects\'', 'Physicians\'', 'Alchemists\'', 'Booksellers\'',
];

const GUILD_DESCRIPTIONS = [
  'The register on the front desk is the most important document in the building.',
  'Members only past the front room. Non-members may post to the board.',
  'The charter on the wall is older than the building. The building was rebuilt around it.',
  'More meetings happen in the side rooms than in the main hall.',
];

const GUILD_SERVICES = [
  'Membership registration (ask, criteria apply)', 'Member directory (members only)',
  'Job board (open to non-members to post, members to claim)',
  'Dispute resolution (members, fee applies)', 'Certification of craft (members)',
  'Letter of introduction (members, 5 gp)', 'Bonding service for contracts (ask)',
  'Meeting room hire (5 gp/session)', 'Message relay (members, 1 sp)',
  'Archive access (members, appointment)', 'Apprentice placement (members)',
  'Legal representation referral (members, fee varies)',
];

// GUARD POST —————————————————————————————————————————————————————————————————

const GUARD_DESCRIPTIONS = [
  'The duty desk is manned at all hours. The officer changes at the sixth bell.',
  'A watch station, not a prison. Questions answered; incidents reported; trouble discouraged.',
  'Functional and slightly underfunded. The officers are competent within their jurisdiction.',
  'The noticeboard outside carries the most current information on wanted individuals.',
];

const GUARD_SERVICES = [
  'Report a crime (free, response time varies)',
  'Missing person report (2 sp filing fee)',
  'Warrant inquiry (ask the duty officer)',
  'Wanted notices board (public, updated weekly)',
  'Escort service for valuables (negotiate with captain)',
  'Lost and found (items held for 30 days)',
  'Identification verification (ask, may require witnesses)',
  'Dispute mediation (minor civil matters only)',
  'Licensing questions (some permits issued here)',
];

// BAKERY ——————————————————————————————————————————————————————————————————————

const BAKERY_DESCRIPTIONS = [
  'The smell reaches you half a street away. Inside is warm and flour-dusted, and every customer leaves looking slightly calmer than when they arrived.',
  'The baker starts at four in the morning. By the time the town wakes, the first loaves are already sold. By noon the shelves are half empty.',
  'A narrow shop with a wide oven. The bread is kept behind a low counter. The baker is covered in flour from the morning rush and has stopped noticing.',
  'The display shelf holds three types of bread and a rotating selection of pastries. The pastries sell out first, every time.',
  'Run by the same family for two generations. The sourdough starter is older than the youngest child and treated accordingly.',
  'Popular enough that there\'s always a short queue in the mornings. People tolerate this because the bread is genuinely worth it.',
  'The bakery doubles as an informal gathering point. People buy bread and stay to talk. The baker listens.',
];

const BAKERY_STOCK = [
  'Rye loaf (whole) — 4cp',
  'White bread loaf — 6cp',
  'Honey roll — 3cp',
  'Seed bread (travel loaf) — 5cp',
  'Meat pie (individual) — 8cp',
  'Sweet pastry — 4cp',
  'Hard tack (10 pieces) — 2sp',
  'Spiced bun — 3cp',
  'Flatbread (6 pieces) — 3cp',
  'Festival cake (whole) — 5sp',
  'Cheese twist — 4cp',
  'Nut loaf — 6cp',
  'Journey bread (dense, week\'s rations) — 1sp',
  'Savoury scone — 4cp',
  'Morning roll (glazed) — 3cp',
  'Filled dumpling (4) — 6cp',
  'Pork roll — 7cp',
  'Sweet bread (braided) — 8cp',
  'Herb focaccia — 6cp',
  'Salted crackers (bag) — 3cp',
];

// LIBRARY —————————————————————————————————————————————————————————————————————

const LIBRARY_DESCRIPTIONS = [
  'Every shelf is full. Books have started occupying the floor, arranged in precarious towers the librarian navigates with the ease of long practice.',
  'Quieter than a temple. The librarian communicates largely in nods, sharp looks, and the occasional pointed finger at a sign reading "SILENCE."',
  'The collection is curated, not comprehensive — everything here was chosen with intention. The librarian will explain their reasoning if you ask, at length.',
  'A working scholarly library with a public reading room. Borrowing requires a deposit. Return requires the book.',
  'Old enough that some volumes predate the building. The building was constructed around the collection.',
  'Organised by a classification system the librarian invented. Outsiders find it baffling. It works perfectly.',
  'The restricted section is visible through a locked gate. The lock is old. The librarian knows who is looking at it.',
];

const LIBRARY_STOCK = [
  'Common spellbook (blank) — 50gp',
  'Scroll of common knowledge (history/geography) — 5gp',
  'City map (current) — 10gp',
  'Regional atlas — 25gp',
  'Bestiary (partial, common creatures) — 30gp',
  'Bestiary (rare creatures, scholarly) — 75gp',
  'Herbalism compendium — 20gp',
  'Alchemical formulary, basic — 25gp',
  'Legal codex, local — 8gp',
  'Historical chronicles (regional) — 7gp',
  'Navigation tables — 12gp',
  'Trade language primer — 5gp',
  'Mythology & religion text — 6gp',
  'Engineering principles — 10gp',
  'Blank journal — 1gp',
  'Blank ledger — 2gp',
  'Ink and quill set — 5gp',
  'Parchment (10 sheets) — 2sp each',
  'Reading room access (by day) — 1sp',
  'Rare text (price on request, may not be for sale)',
];

// CARTOGRAPHER ————————————————————————————————————————————————————————————————

const CARTOGRAPHER_DESCRIPTIONS = [
  'Maps cover every wall, some pinned flat, some rolled in tubes, some still half-finished and weighted at the corners with stones.',
  'The cartographer squints at a coastline with practised scepticism. "Whoever drew this," they say, not looking up, "had never been there."',
  'Half workshop, half archive. Commissions are completed at the drafting table at the front; the archive fills everything behind it.',
  'Known for accuracy over aesthetics, though the finished maps are handsome. The cartographer considers this incidental.',
  'An explorer\'s first stop before setting out and last stop on return, to correct what they got wrong.',
  'The collection includes copies of historical maps that no longer match the landscape. The cartographer finds this professionally irritating.',
  'Will commission surveys, copy existing maps, or create new ones from descriptions. Has done all three this week.',
];

const CARTOGRAPHER_STOCK = [
  'City street map (current edition) — 10gp',
  'Regional road map — 15gp',
  'Coastal navigation chart — 25gp',
  'Wilderness survey (local region) — 20gp',
  'Blank vellum (roll) — 2gp',
  'Blank parchment (mapping grade, 10) — 3gp',
  'Drafting compass — 5gp',
  'Measuring rule, folding — 2gp',
  'Sextant (basic) — 30gp',
  'Cartographer\'s tools set — 15gp',
  'Political boundary map (current) — 12gp',
  'Trade route map — 18gp',
  'Dungeon grid paper (10 sheets) — 5sp',
  'Mountain survey, partial — 8gp',
  'River system chart — 10gp',
  'Historical map (copy) — 5–25gp',
  'Custom survey commission — quoted by scope',
  'Map copying service — 2–5gp per map',
  'Map correction/update — 1–3gp',
  'Confidential commission — negotiated',
];

// STABLES ——————————————————————————————————————————————————————————————————————

const STABLES_DESCRIPTIONS = [
  'Clean straw, good smells — horses, hay, leather. The stablemaster knows every animal by name and disposition.',
  'A row of stalls, each occupied. Most are well-cared-for riding horses; one end holds a large, ill-tempered stallion that everyone is careful around.',
  'More than stabling — the operation buys, sells, and brokers animals. The stablemaster has opinions on horseflesh that they share freely.',
  'The yard is swept twice daily. The stalls are mucked at dawn. The horses are calmer here than most other stables.',
  'A family operation that has worked with most of the city\'s merchants, couriers, and guard companies at some point.',
  'Three generations in the business. The current stablemaster learned to ride before they learned to read, by their own account.',
  'The best-kept stables in this district, which is apparent the moment you step inside.',
];

const STABLES_SERVICES = [
  'Riding horse (standard) — 75gp',
  'Draft horse — 50gp',
  'Warhorse — 400gp',
  'Pony — 30gp',
  'Mule — 8gp',
  'Stabling (per night) — 4sp',
  'Stabling (per week) — 2gp',
  'Stabling (per month) — 7gp',
  'Feed and water (included with stabling)',
  'Grooming service — 5sp',
  'Farrier, standard shoe — 1gp/hoof',
  'Veterinary assessment — 5sp',
  'Wound treatment (minor) — 2gp',
  'Saddle, riding — 10gp',
  'Saddle, military — 20gp',
  'Bit and bridle — 2gp',
  'Saddlebags — 4gp',
  'Barding, leather — 40gp',
  'Cart — 15gp',
  'Wagon — 35gp',
];

// TAXIDERMIST —————————————————————————————————————————————————————————————————

const TAXIDERMIST_DESCRIPTIONS = [
  'The smell is distinctive but not unpleasant — chemical preservatives, sawdust, and something dry underneath.',
  'Every surface holds a specimen in some stage of preparation. The taxidermist works methodically and considers this a craft, not a trade.',
  'Trophy mounts line the walls. Most were commissions. A few are the taxidermist\'s own work, kept for display.',
  'Caters to hunters, natural philosophers, collectors, and occasionally alchemists who need specific components.',
  'A precise operation — the work is detailed, the timelines are realistic, and the results are permanent.',
  'The taxidermist has seen most creatures that exist in this region, if not alive then across the work table.',
  'Understated exterior, remarkable interior. The quality of the work is evident in the finished pieces.',
];

const TAXIDERMIST_STOCK = [
  'Mounted songbird (common) — 2gp',
  'Mounted raptor (medium) — 8gp',
  'Deer head mount — 15gp',
  'Wolf pelt (cured) — 10gp',
  'Bear pelt (cured) — 25gp',
  'Skull, large predator — 5gp',
  'Antler rack — 3–12gp',
  'Preserved snake (coiled display) — 6gp',
  'Preserved fish (trophy) — 4gp',
  'Exotic feathers (bundle) — 2gp',
  'Boar tusk (polished) — 3gp',
  'Alchemical components (varies by creature)',
  'Custom mount commission — quoted by species',
  'Pelt curing service — 2gp/pelt',
  'Skull cleaning and preparation — 1–5gp',
  'Component extraction (specialist) — ask',
  'Natural history specimen (display) — varies',
  'Creature identification service — 1gp',
];

// MORTICIAN ——————————————————————————————————————————————————————————————————

const MORTICIAN_DESCRIPTIONS = [
  'Quiet, cool, and professionally sombre. The mortician moves without hurry and speaks without distress.',
  'A discreet establishment that handles what other businesses prefer not to think about.',
  'Respected in the community in the way that people who do necessary work nobody else will is always respected.',
  'The mortician has performed last rites for every level of society. They treat all of them with the same care.',
  'A family business for two generations. The current mortician learned from their parent and has their own apprentice.',
  'The preparation room is separate from the front office. The front office is warm and tastefully appointed.',
  'Known for discretion above all. What comes through this door stays in this door.',
];

const MORTICIAN_SERVICES = [
  'Body preparation and laying out — 2gp',
  'Embalming (extended preservation) — 5gp',
  'Anonymous preparation (no record) — 5gp',
  'Shroud and casket (plain) — 3gp',
  'Shroud and casket (quality) — 10gp',
  'Shroud and casket (elaborate) — 30gp+',
  'Last rites ceremony — 2gp',
  'Cremation — 3gp',
  'Ash interment (urn) — 1gp',
  'Transportation of remains — 1gp/mile',
  'Cold storage (per day) — 5sp',
  'Identification of unknown remains — ask',
  'Cause of death assessment — 5gp',
  'Notification of kin — 2sp/letter',
  'Estate sealing (temporary) — 1gp',
  'Grief counsel (basic) — free by arrangement',
];

// SHIPWRIGHT —————————————————————————————————————————————————————————————————

const SHIPWRIGHT_DESCRIPTIONS = [
  'The smell of fresh timber, tar, and seawater. The yard is always busy.',
  'A working yard with vessels in various stages of construction and repair. The shipwright oversees it all.',
  'Known for solid work rather than fancy work. Ships built here last.',
  'Specialises in river craft and coastal vessels. Ocean-going commissions are referred or subcontracted.',
  'Three generations in boat-building. The eldest still swings a mallet.',
  'The order book is full three months out. Good work takes time.',
  'A shipwright who started as a sailor. They know what a vessel needs to do because they\'ve needed it to do it.',
];

const SHIPWRIGHT_STOCK = [
  'River skiff (small) — 100gp',
  'River barge (cargo) — 500gp',
  'Coastal fishing boat — 300gp',
  'Keelboat (river, 50-ton) — 3,000gp',
  'Sailboat (small, single-mast) — 500gp',
  'Rowboat — 50gp',
  'Canoe — 30gp',
  'Hull repair (minor) — 25gp+',
  'Hull repair (major) — 100gp+',
  'Caulking service — 10gp',
  'Mast replacement — 50gp+',
  'Rigging refit — 30gp+',
  'Oars (pair) — 5gp',
  'Anchor, iron — 20gp',
  'Rope, nautical (per 50ft) — 2gp',
  'Tar (naval grade, 5lb) — 2gp',
  'Custom vessel commission — quoted by spec',
  'Modification commission — quoted',
  'Waterproofing treatment — 5gp',
  'Vessel inspection and report — 10gp',
];

// TATTOO PARLOUR —————————————————————————————————————————————————————————————

const TATTOO_DESCRIPTIONS = [
  'The work on the walls is the portfolio. The artist lets it speak.',
  'A quiet space where clients and artist discuss the design before anything else. The artist won\'t rush this part.',
  'Known throughout this quarter and beyond. People wait weeks for an appointment.',
  'The style is distinctive — bold lines, confident shading, images that look right on skin.',
  'The artist does magical work alongside the decorative. Different rates, different conversation.',
  'A practitioner who takes requests seriously and declines work that doesn\'t interest them without apology.',
  'Walk-in for simple designs; appointment required for anything complex. The artist keeps their own schedule.',
];

const TATTOO_SERVICES = [
  'Simple design (small, 1–2 hours) — 5gp',
  'Standard design (medium, 3–5 hours) — 15gp',
  'Complex design (large, multiple sessions) — 30gp+',
  'Full sleeve commission (multiple sessions) — 100gp+',
  'Custom design consultation — 2gp (credited to work)',
  'Aftercare kit — 1gp',
  'Cover-up work (over existing tattoo) — 20gp+',
  'Removal assistance (partial fade) — 10gp/session',
  'Arcane tattoo (minor effect, 1/day) — 100gp',
  'Arcane tattoo (moderate effect) — 300gp',
  'Arcane tattoo (significant effect) — 500gp+',
  'Scar concealment work — 15gp+',
  'Guild/organisation mark — 10gp (verification required)',
  'Commemorative piece — quoted',
  'Paired designs (two clients) — 20% discount',
];

// POTION BREWER ——————————————————————————————————————————————————————————————

const POTION_DESCRIPTIONS = [
  'Cleaner than an alchemist\'s, warmer than an apothecary\'s. The brewer keeps a tidy operation.',
  'The shelves are organised by effect, then by duration. The brewer considers this the only logical system.',
  'A specialist rather than a generalist — everything here is drinkable and intended to be.',
  'The test batches are on a separate shelf, clearly labelled. The brewer encourages questions about them.',
  'A popular stop for adventuring parties. The brewer has standard expedition kits available.',
  'Quality over quantity. The brewer produces fewer potions than a factory might, and every one is right.',
  'The most reliable source of healing potions in this district, which makes it perpetually busy.',
];

const POTION_STOCK = [
  'Potion of Healing — 50gp',
  'Potion of Greater Healing — 150gp',
  'Potion of Superior Healing — 450gp',
  'Potion of Climbing — 75gp',
  'Potion of Water Breathing — 150gp',
  'Potion of Animal Friendship — 50gp',
  'Potion of Fire Resistance — 150gp',
  'Potion of Invisibility — 150gp',
  'Potion of Speed — 150gp',
  'Potion of Heroism — 150gp',
  'Potion of Vitality — 150gp',
  'Oil of Slipperiness — 60gp',
  'Oil of Etherealness (rare) — ask',
  'Antitoxin (brewer\'s grade) — 50gp',
  'Elixir of Health — 120gp',
  'Philtre of Love — 100gp',
  'Truth serum (one dose) — 75gp',
  'Sleeping draught (strong) — 10gp',
  'Custom potion commission — quoted',
  'Expedition kit (5 healing, 1 antitoxin) — 300gp',
];

// MONSTER PARTS ——————————————————————————————————————————————————————————————

const MONSTER_DESCRIPTIONS = [
  'The sign is understated. The smell is not. The interior is cold, which is deliberate.',
  'A specialist supplier for alchemists, artificers, and practitioners who need components the herbalist doesn\'t stock.',
  'The proprietor has extensive knowledge of what parts are useful and what they\'re useful for. They don\'t volunteer this information.',
  'Parts are catalogued, preserved, and priced by utility. The exotic specimens are kept separately.',
  'Unusual and necessary. The kind of shop that most people don\'t need and some people need very much.',
  'The sources are not discussed. The quality is verifiable. The proprietor offers no guarantees on the former.',
  'A cold room in the back holds the freshest stock. The dried and preserved components fill the shelves.',
];

const MONSTER_STOCK = [
  'Dragon scale (common, 1) — 50gp',
  'Basilisk eye (preserved) — 30gp',
  'Owlbear feather (bundle) — 5gp',
  'Troll blood (vial) — 10gp',
  'Manticore spine — 15gp',
  'Wyvern venom (vial) — 100gp',
  'Phase spider silk (small) — 25gp',
  'Displacer beast hide (small piece) — 30gp',
  'Ghoul claw — 5gp',
  'Harpy feather — 3gp',
  'Mimic adhesive (sample) — 20gp',
  'Cockatrice feather — 8gp',
  'Medusa lock (hair, preserved) — 50gp',
  'Rust monster antenna — 15gp',
  'Wraith essence (vial) — 75gp',
  'Gelatinous cube sample — 10gp',
  'Beholder eye stalk (dried) — ask',
  'Vampire dust (vial) — ask',
  'Custom component sourcing — quoted',
  'Creature identification from parts — 2gp',
];

// THIEVES GUILD ——————————————————————————————————————————————————————————————

const GUILD_THIEF_DESCRIPTIONS = [
  'It looks like a locksmith\'s, or a pawnshop, or a messenger service. These impressions are cultivated.',
  'The front is whatever seems most appropriate to the district. The guild operates in most districts.',
  'Access beyond the counter is by introduction only. The front staff are polite and entirely unreadable.',
  'A professional organisation with professional standards. The work is consistent. The discretion is absolute.',
  'Members come and go with minimal acknowledgement. The casual observer sees nothing of note.',
  'The sign advertises a legitimate service. The service is real. The guild is also real. Both are true.',
  'Everyone knows this is a guild front. Nobody says so within earshot of the building.',
];

const GUILD_THIEF_SERVICES = [
  'Lockpicking service (no questions) — 5gp+',
  'Key duplication (standard) — 1gp',
  'Key duplication (unusual) — ask',
  'Surveillance (property or person) — 5gp/day',
  'Intelligence purchase — negotiated',
  'Item acquisition (discreet) — 20% of value',
  'Document acquisition — 25gp+',
  'Package delivery (anonymous) — 5gp',
  'Secure message relay — 3gp',
  'Safe house access (member) — 2sp/night',
  'Fence referral — ask',
  'Guild membership inquiry — ask',
  'Extraction service — negotiated',
  'Counterfeiting (documents) — 15gp+',
  'Smuggling consultation — ask',
];

// GAMBLING DEN ————————————————————————————————————————————————————————————————

const GAMBLE_DESCRIPTIONS = [
  'Smoke, low light, and the sound of coins. The house is comfortable enough to encourage staying.',
  'Three tables running at any hour. The house edge is real but not obvious. This is by design.',
  'A private room in the back is available for high-stakes games. Membership implied.',
  'The drinks are good and moderately priced. The games are the reason everyone is here.',
  'Run by someone who keeps their own counsel and resolves disputes with minimal drama.',
  'Popular with merchants, off-duty guards, and people who have money they\'d rather risk than save.',
  'The house never cheats. They don\'t need to. The odds are enough.',
];

const GAMBLE_MENU = [
  'House ale — 4cp',
  'Wine (house) — 8cp',
  'Spirits, single — 1sp',
  'Spirits, bottle — 8sp',
  'Dice: Three Dragon Ante — min 5cp',
  'Dice: High-Low — min 1cp',
  'Cards: Dragonchess hand (simplified) — min 1sp',
  'Cards: Blind bid — min 5cp',
  'Pit game: arm wrestle — stakes agreed beforehand',
  'Numbers board — 1cp per mark, weekly draw',
  'Private table (high stakes) — by arrangement, members',
  'House credit (to regulars only) — assessed individually',
  'Food: cold cuts and bread — 2sp',
  'Winnings paid in coin immediately',
  'House takes 5% on all table games',
];

// FENCING OPERATION ——————————————————————————————————————————————————————————

const FENCE_DESCRIPTIONS = [
  'A business that asks nothing about provenance and answers nothing about buyers. This is the entire value proposition.',
  'Looks entirely legitimate from the outside. Is more than the sum of its legitimate parts.',
  'The fence operates at the boundary of what the watch will tolerate. They have kept this boundary consistent for years.',
  'A reliable middleman with a reliable rate and a reliable understanding of what "discretion" means.',
  'Not a criminal enterprise exactly — more of a commercial function that happens to serve a particular market.',
  'The stated business is real. The other business is also real. They coexist without apparent friction.',
  'Everyone in a certain world knows this name. Everyone outside that world sees only the legitimate front.',
];

const FENCE_STOCK = [
  'Used goods (general, no questions) — 40–60% market value',
  'Weapons (various, used) — half market',
  'Jewellery and gems — appraised before offer',
  'Coin exchange (foreign, clipped) — fee applies',
  'Documents (no questions) — negotiated',
  'Luxury goods (origin unclear) — negotiated',
  'Information purchase — ask',
  'Stolen property held for buyer — storage fee',
  'Consignment sale — 20% commission',
  'Quick buy (no paperwork, immediate) — 30% market',
  'Client introduction (to buyer network) — 10gp',
  'Guild connection referral — ask',
  'Safe storage of goods — 5sp/item/week',
  'Customs bypass consultation — ask',
  'House does not deal in: people, certain restricted magics',
];

// FORTUNE TELLER —————————————————————————————————————————————————————————————

const FORTUNE_DESCRIPTIONS = [
  'The curtain at the entrance blocks sight of the interior. The interior is quiet and smells of incense.',
  'The seer works by appointment and by walk-in. Walk-ins wait. This is noted on the sign.',
  'Everything about the space is chosen to still the visitor\'s mind. Whether this improves accuracy is debated.',
  'A practitioner who distinguishes between entertainment readings and serious work. The prices differ accordingly.',
  'The seer has been here long enough that their predictions have been tested. The record is better than chance.',
  'Popular with those about to make large decisions. The counsel is good regardless of the mechanism.',
  'No promises of certainty. The seer is explicit about this. It hasn\'t reduced business.',
];

const FORTUNE_SERVICES = [
  'Tarot reading (general, 20 min) — 5sp',
  'Tarot reading (specific question) — 1gp',
  'Palm reading — 3sp',
  'Augury (dice/bones) — 5sp',
  'Scrying (water/mirror, limited) — 5gp',
  'Dream interpretation — 2gp',
  'Astrological chart (full) — 5gp',
  'Astrological chart (natal) — 3gp',
  'Communication with the dead (limited, unreliable) — 10gp',
  'Curse identification — 2gp',
  'Hex removal (minor) — 5gp',
  'Blessing (personal) — 2gp',
  'Charm (written, luck) — 1gp',
  'Charm (written, protection) — 2gp',
  'Private consultation (extended, 1 hour) — 5gp',
];

// ─── Emoji Map ────────────────────────────────────────────────────────────────

const EMOJI: Record<EstablishmentType, string> = {
  tavern: '🍺', inn: '🛏️', blacksmith: '⚒️', general_store: '🏪',
  apothecary: '🌿', alchemist: '⚗️', magic_shop: '✨', bookshop: '📚',
  jeweler: '💎', tailor: '🧵', provisioner: '🎒', temple: '🕯️',
  guildhall: '⚑', guard_post: '🛡️', pawnbroker: '🔑', scribe: '📜',
  chandler: '🕯', stablemaster: '🐴',
  bakery: '🥖', library: '📖', cartographer: '🗺️', stables: '🐴',
  taxidermist: '🦌', mortician: '💀', shipwright: '⚓', tattoo_parlour: '🎨',
  potion_brewer: '🧪', monster_parts: '🦷', thieves_guild: '🗡️',
  gambling_den: '🎲', fencing_operation: '🔑', fortune_teller: '🔮',
  trading_post: '🏪', scholar_tower: '🧙', research_station: '🔬',
};

// ─── District → Type Mapping ──────────────────────────────────────────────────
// Returns an ordered pool of types; the generator picks the first N (with N 4–20).
// Pools are weighted — common types repeat so they appear proportionally more.

function inferTypePool(districtName: string, magicLevel: number): EstablishmentType[] {
  const n = districtName.toLowerCase();
  const M = magicLevel >= 4;

  if (n.includes('dock') || n.includes('harbor') || n.includes('port') || n.includes('undertow'))
    return ['tavern','tavern','tavern','chandler','chandler','provisioner','provisioner',
            'inn','inn','general_store','general_store','blacksmith','pawnbroker',
            'scribe','guard_post','apothecary','chandler','tavern',
            'shipwright','shipwright','monster_parts'];

  if (n.includes('merchant') || n.includes('market') || n.includes('trade') || n.includes('exchange') || n.includes('grain') || n.includes('spice'))
    return ['general_store','general_store','general_store','provisioner','provisioner',
            'jeweler','jeweler','tailor','tailor','tavern','tavern','inn',
            'scribe','scribe','pawnbroker','bookshop','apothecary','chandler',
            M ? 'magic_shop' : 'general_store','guard_post',
            'bakery','cartographer','fortune_teller'];

  if (n.includes('temple') || n.includes('shrine') || n.includes('mourn') || n.includes('pilgrim'))
    return ['temple','temple','apothecary','apothecary','scribe','scribe',
            'general_store','bookshop','tavern','inn',M ? 'magic_shop' : 'apothecary',
            'chandler','provisioner','mortician','fortune_teller'];

  if (n.includes('forge') || n.includes('smith') || n.includes('armour') || n.includes('armor') || n.includes('stoneyard') || n.includes('joiner'))
    return ['blacksmith','blacksmith','blacksmith','general_store','general_store',
            'tavern','tavern','provisioner','chandler',M ? 'alchemist' : 'provisioner',
            'scribe','pawnbroker','stablemaster','inn','guard_post','potion_brewer'];

  if (n.includes('scholar') || n.includes('inktown') || n.includes('book') || n.includes('astronomer') || n.includes('instrument') || n.includes('printer') || n.includes('map'))
    return ['bookshop','bookshop','bookshop','scribe','scribe',M ? 'alchemist' : 'apothecary',
            M ? 'magic_shop' : 'bookshop','apothecary','general_store','tavern',
            'jeweler','chandler','pawnbroker','provisioner','library','cartographer'];

  if (n.includes('arcane') || n.includes('rune') || n.includes('alchemist') || n.includes('clockwork') || n.includes('glass'))
    return [M ? 'magic_shop' : 'general_store', M ? 'magic_shop' : 'bookshop',
            'alchemist','alchemist','bookshop','apothecary','scribe',
            'chandler','general_store','jeweler','tavern',M ? 'magic_shop' : 'apothecary'];

  if (n.includes('guild'))
    return ['guildhall','guildhall','general_store','general_store','tavern','tavern',
            'blacksmith','provisioner','scribe','scribe','jeweler','bookshop',
            'pawnbroker','inn','apothecary','chandler','guard_post'];

  if (n.includes('silver') || n.includes('vault') || n.includes('gold') || n.includes('coin') || n.includes('moneylender') || n.includes('pawnbroker'))
    return ['jeweler','jeweler','jeweler','pawnbroker','pawnbroker','scribe','scribe',
            M ? 'magic_shop' : 'general_store','general_store','bookshop','tailor',
            'guard_post','inn','tavern'];

  if (n.includes('high ward') || n.includes('garden') || n.includes('tradespire'))
    return ['tailor','tailor','jeweler','jeweler','tavern','inn','general_store',
            'provisioner','bookshop',M ? 'magic_shop' : 'jeweler','scribe',
            'apothecary','chandler'];

  if (n.includes('cobblers') || n.includes('hatter') || n.includes('tailor') || n.includes('artisan') || n.includes('loom') || n.includes('weav') || n.includes('dyer') || n.includes('potter'))
    return ['tailor','tailor','tailor','general_store','general_store','provisioner',
            'tavern','chandler','apothecary','scribe','pawnbroker','jeweler','inn',
            'bakery','tattoo_parlour'];

  if (n.includes('tangle') || n.includes('warren') || n.includes('rookery') || n.includes('pit') || n.includes('quarter of the lost') || n.includes('crossings') || n.includes('undertow'))
    return ['tavern','tavern','tavern','pawnbroker','pawnbroker','general_store',
            'general_store','chandler','inn','apothecary','blacksmith','provisioner',
            'gambling_den','fencing_operation','thieves_guild'];

  if (n.includes('barracks') || n.includes('military'))
    return ['blacksmith','blacksmith','tavern','tavern','provisioner','provisioner',
            'guard_post','guard_post','chandler','general_store','apothecary','scribe','inn'];

  if (n.includes('brew') || n.includes('vintner') || n.includes('distill'))
    return ['tavern','tavern','tavern','tavern','provisioner','provisioner',
            'general_store','inn','inn','chandler','apothecary','pawnbroker'];

  if (n.includes('baker') || n.includes('fishmonger') || n.includes('butcher') || n.includes('slaughter'))
    return ['provisioner','provisioner','provisioner','general_store','general_store',
            'tavern','tavern','apothecary','chandler','scribe','pawnbroker','inn'];

  if (n.includes('rope') || n.includes('chandler'))
    return ['chandler','chandler','provisioner','provisioner','general_store',
            'tavern','blacksmith','scribe','pawnbroker','inn'];

  if (n.includes('stable') || n.includes('saddler'))
    return ['stablemaster','stablemaster','blacksmith','blacksmith','provisioner',
            'tavern','tavern','chandler','general_store','inn','scribe'];

  if (n.includes('apothecary') || n.includes('surgeon') || n.includes('herbalist'))
    return ['apothecary','apothecary','apothecary',M ? 'alchemist' : 'apothecary',
            'scribe','temple','general_store','bookshop','chandler','tavern','inn'];

  if (n.includes('foreigner') || n.includes('pale quarter') || n.includes('mercenari'))
    return ['tavern','tavern','inn','inn','provisioner','general_store',
            'general_store','pawnbroker','scribe','apothecary','blacksmith','chandler'];

  if (n.includes('entertainer') || n.includes('gambler'))
    return ['tavern','tavern','tavern','inn','inn','tailor','tailor',
            M ? 'magic_shop' : 'general_store','general_store','provisioner',
            'pawnbroker','jeweler','scribe'];

  // Oldtown, spire, warden's district, etc.
  return ['tavern','tavern','inn','general_store','general_store','blacksmith',
          'provisioner','apothecary','scribe','chandler','pawnbroker','temple',
          M ? 'magic_shop' : 'bookshop'];
}

// How many establishments fits this kind of district?
function districtCapacity(districtName: string): { min: number; max: number } {
  const n = districtName.toLowerCase();
  // Very busy commercial/port districts
  if (n.includes('merchant') || n.includes('market') || n.includes('dock') ||
      n.includes('harbor') || n.includes('guild') || n.includes('exchange') ||
      n.includes('tradespire') || n.includes('spice') || n.includes('grain'))
    return { min: 12, max: 20 };
  // Craft and forge districts
  if (n.includes('forge') || n.includes('artisan') || n.includes('weav') ||
      n.includes('tailor') || n.includes('loom') || n.includes('dyer') ||
      n.includes('brew') || n.includes('vintner') || n.includes('baker') ||
      n.includes('fishmonger') || n.includes('silver') || n.includes('vault'))
    return { min: 8, max: 15 };
  // Residential rough / entertainment
  if (n.includes('tangle') || n.includes('warren') || n.includes('rookery') ||
      n.includes('entertainer') || n.includes('gambler') || n.includes('foreigner') ||
      n.includes('mercenari') || n.includes('pale quarter'))
    return { min: 6, max: 12 };
  // Quiet / institutional
  if (n.includes('temple') || n.includes('shrine') || n.includes('barracks') ||
      n.includes('garden') || n.includes('high ward') || n.includes('mourn') ||
      n.includes('pilgrim') || n.includes('scholar') || n.includes('arcane'))
    return { min: 4, max: 9 };
  // Default
  return { min: 6, max: 14 };
}

// ─── Name Generator ───────────────────────────────────────────────────────────

function generateName(type: EstablishmentType, rng: () => number, propFirst: string, propLast: string): string {
  const adj = pick(EST_ADJ, rng);
  const pattern = Math.floor(rng() * 3);

  if (type === 'inn') {
    const noun = pick(INN_NOUNS, rng);
    const suffix = pick(INN_SUFFIXES, rng);
    return pattern === 0
      ? `The ${adj} ${noun} ${suffix}`
      : pattern === 1
        ? `${propLast}'s ${suffix}`
        : `The ${noun} ${suffix}`;
  }

  if (type === 'tavern') {
    const noun = pick(TAVERN_NOUNS, rng);
    return pattern === 0
      ? `The ${adj} ${noun}`
      : pattern === 1
        ? `The ${noun} & ${pick(TAVERN_NOUNS, rng)}`
        : `${propLast}'s`;
  }

  if (type === 'temple') {
    const deity = pick(TEMPLE_DEITIES, rng);
    return `Temple of ${deity}`;
  }

  if (type === 'guildhall') {
    const gt = pick(GUILD_TYPES, rng);
    return `${gt} Guildhall`;
  }

  if (type === 'guard_post') {
    return `Watch Station — ${pick(['North', 'South', 'East', 'West', 'River', 'Gate', 'Market', 'Dock'], rng)} District`;
  }

  // Shops: "The [Adj] [Trade Noun]" or "[Name]'s [Trade Noun]" or "The [Trade Noun]"
  const nouns = SHOP_NOUNS[type] ?? ['Goods'];
  const noun = pick(nouns, rng);
  return pattern === 0
    ? `The ${adj} ${noun}`
    : pattern === 1
      ? `${propFirst} ${propLast}'s ${noun}`
      : `${propLast}'s ${noun}`;
}

// ─── Main Generator ──────────────────────────────────────────────────────────

export function generateDistrictEstablishments(
  district: { name: string; description: string },
  cityId: string,
  _cityName: string,
  worldSeed: string,
  magicLevel: number = 5
): Establishment[] {
  // FNV-1a hash of combined key — districts with similar names in similar cities
  // get completely different seeds.
  const seedNum = fnv1a(`${cityId}|${district.name}|${worldSeed}`);
  const rng = makeRng(seedNum);

  const typePool = inferTypePool(district.name, magicLevel);
  const { min, max } = districtCapacity(district.name);
  const count = min + Math.floor(rng() * (max - min + 1)); // 4–20 depending on district type
  const establishments: Establishment[] = [];

  // Pick from the weighted pool cyclically so distribution stays realistic
  const selectedTypes: EstablishmentType[] = [];
  for (let i = 0; i < count; i++) {
    selectedTypes.push(typePool[i % typePool.length]);
  }

  for (let i = 0; i < selectedTypes.length; i++) {
    const type = selectedTypes[i];
    const isFemale = rng() > 0.5;
    const propFirst = pick(isFemale ? PROP_FIRST_F : PROP_FIRST_M, rng);
    const propLast = pick(PROP_LAST, rng);
    const propPhysical = pick(PROP_PHYSICAL, rng);
    const propPersonality = pick(PROP_PERSONALITY, rng);

    const propRace = pick(PROP_RACES, rng);
    const name = generateName(type, rng, propFirst, propLast);

    const proprietorDesc = `${propPhysical}, ${propPersonality}.`;

    // Quality: district baseline ± 1 tier, with 25% chance each direction
    const baseQ = districtBaseQuality(district.name);
    const qRoll = rng();
    const qIdx = Math.max(0, Math.min(4, baseQ + (qRoll > 0.75 ? 1 : qRoll < 0.25 ? -1 : 0)));
    const quality = QUALITY_TIERS[qIdx];

    let description = '';
    let features: string[] = [];
    let stock: string[] | undefined;
    let menu: string[] | undefined;
    let services: string[] | undefined;
    let rumor: string | undefined;
    let prices: string | undefined;

    switch (type) {
      case 'tavern':
        description = pick(TAVERN_DESCRIPTIONS, rng);
        features = pickN(TAVERN_FEATURES, 2, rng);
        menu = [
          `Specialty: ${pick(TAVERN_DRINKS, rng)}`,
          `Kitchen: ${pick(TAVERN_FOOD, rng)}`,
        ];
        rumor = pick(TAVERN_RUMORS, rng);
        prices = 'Ale 4 cp · Wine 1 sp · Meal 3 sp';
        break;

      case 'inn':
        description = pick(INN_DESCRIPTIONS, rng);
        features = pickN(INN_FEATURES, 2, rng);
        services = pickN(INN_SERVICES_LIST, 6, rng);
        menu = [`Notable guest: ${pick(INN_NOTABLE_GUESTS, rng)}`];
        prices = 'Common 2 cp · Private 5 sp · Suite 1 gp';
        break;

      case 'blacksmith':
        description = pick(SMITH_DESCRIPTIONS, rng);
        features = pickN(SMITH_FEATURES, 2, rng);
        stock = pickN(SMITH_STOCK, 8, rng);
        prices = 'Standard PHB pricing · Repairs by assessment';
        break;

      case 'general_store':
        description = pick(GENERAL_DESCRIPTIONS, rng);
        features = [
          `Specialty: ${pick(['bulk rations at discount', 'quality rope', 'imported tools', 'local crafts', 'traveler\'s supplies'], rng)}`,
          `Known for: ${pick(['fair prices', 'unusual stock', 'late hours', 'the owner\'s memory for customers', 'no-questions sourcing'], rng)}`,
        ];
        stock = pickN(GENERAL_STOCK, 10, rng);
        prices = 'Standard PHB pricing';
        break;

      case 'apothecary':
        description = pick(APOTH_DESCRIPTIONS, rng);
        features = [
          `Specialty: ${pick(['healing potions in stock', 'herbal remedies', 'custom formulations', 'emergency supplies', 'pregnancy and birth services'], rng)}`,
          `Policy: ${pick(['no questions on most purchases', 'restricted items require explanation', 'anonymous purchases available', 'bulk discount for healers'], rng)}`,
        ];
        stock = pickN(APOTH_STOCK, 8, rng);
        prices = 'Potions at standard cost · Remedies from 5 cp';
        break;

      case 'alchemist':
        description = pick(ALCH_DESCRIPTIONS, rng);
        features = [
          `Lab work: ${pick(['commissions accepted with deposit', 'bespoke formulas available', 'no experimental work without contract', 'testing samples available'], rng)}`,
          `Policy: ${pick(['proof of purpose required for restricted items', 'members of recognized guilds have priority', 'volatile items delivered at extra charge'], rng)}`,
        ];
        stock = pickN(ALCH_STOCK, 7, rng);
        prices = 'Standard cost · Custom formulas by quote';
        break;

      case 'magic_shop':
        description = pick(MAGIC_DESCRIPTIONS, rng);
        features = [
          `Specialty: ${pick(['scrolls at multiple levels', 'potions and consumables', 'minor wondrous items', 'identification services', 'attunement assistance'], rng)}`,
          `Policy: ${pick(['buyer must demonstrate legitimate purpose for restricted items', 'no questions on standard consumables', 'staff can assess unfamiliar items for a fee'], rng)}`,
        ];
        stock = pickN(MAGIC_STOCK, 8, rng);
        prices = 'Scrolls from 10 gp · Items priced individually';
        break;

      case 'bookshop':
        description = pick(BOOK_DESCRIPTIONS, rng);
        features = [
          `Best stock: ${pick(['local and regional history', 'navigation and maps', 'natural philosophy', 'religious texts', 'fiction and legend', 'rare and out-of-print volumes'], rng)}`,
          `Service: ${pick(['custom orders taken', 'appraisals on brought-in books', 'reading space available', 'lending for registered customers', 'copies made to order'], rng)}`,
        ];
        stock = pickN(BOOK_STOCK, 8, rng);
        prices = 'Common texts 1–10 gp · Rare items by negotiation';
        break;

      case 'jeweler':
        description = pick(JEWEL_DESCRIPTIONS, rng);
        features = [
          `Specialty: ${pick(['rings and signet rings', 'necklaces and pendants', 'gem cutting', 'custom settings', 'estate purchases'], rng)}`,
          `Service: ${pick(['free appraisals on request', 'purchased gems and jewelry at market rate', 'engraving on site', 'custom commission quotes within the day'], rng)}`,
        ];
        stock = pickN(JEWEL_STOCK, 8, rng);
        prices = 'Silver from 5 sp · Gold from 5 gp · Gems priced by cut and quality';
        break;

      case 'tailor':
        description = pick(TAILOR_DESCRIPTIONS, rng);
        features = [
          `Specialty: ${pick(['military and livery work', 'disguise and costume', 'fine and court dress', 'weather gear', 'traveler\'s clothing'], rng)}`,
          `Turnaround: ${pick(['repairs same-day', 'alterations 1-2 days', 'custom commissions 1-4 weeks', 'rush work available at premium'], rng)}`,
        ];
        stock = pickN(TAILOR_STOCK, 8, rng);
        prices = 'Common clothes 5 sp · Fine clothes 15 gp · Custom by quote';
        break;

      case 'provisioner':
        description = pick(PROV_DESCRIPTIONS, rng);
        features = [
          `Bulk discount: ${pick(['10+ rations at 10% off', 'bulk feed orders by arrangement', 'caravan outfitting by appointment', 'city delivery for large orders'], rng)}`,
          `Specialty: ${pick(['smoked goods in-house', 'local preserved products', 'imported spices', 'traveler kits pre-packed', 'draft animal supplies'], rng)}`,
        ];
        stock = pickN(PROV_STOCK, 8, rng);
        prices = 'Rations 5 sp/day · See board for current pricing';
        break;

      case 'pawnbroker':
        description = pick(PAWN_DESCRIPTIONS, rng);
        features = [
          `Policy: ${pick(['all items appraised before purchase', 'redemption window 30 days standard', 'no questions on origin of goods brought in', 'consignment available for quality items'], rng)}`,
          `Specialty: ${pick(['weapons and armor at fair value', 'jewelry and gems', 'trade tools and professional equipment', 'notes and debts purchased at discount'], rng)}`,
        ];
        stock = pickN(PAWN_STOCK, 7, rng);
        prices = 'Buys at roughly 40–60% of value · Redemption fees apply';
        break;

      case 'scribe':
        description = pick(SCRIBE_DESCRIPTIONS, rng);
        features = [
          `Languages: ${pick(['Common, Elvish, Dwarvish', 'Common, Draconic, Primordial', 'Common, Infernal, Celestial', 'Common, Gnomish, Halfling', 'most major regional languages plus two ancient ones'], rng)}`,
          `Turnaround: ${pick(['standard documents same-day', 'translations 1-3 days per page', 'rush service available', 'discretion standard for all work'], rng)}`,
        ];
        services = pickN(SCRIBE_SERVICES, 8, rng);
        prices = 'Letters from 2 sp · Contracts from 5 gp · Translation from 2 gp/page';
        break;

      case 'chandler':
        description = pick(CHAND_DESCRIPTIONS, rng);
        features = [
          `Specialty: ${pick(['premium beeswax candles', 'ship-grade rope', 'refined lamp oil', 'bulk tallow at discount', 'custom scented candles'], rng)}`,
          `Bulk pricing: ${pick(['rope sold by the yard or spool', '10+ flasks of oil at 10% discount', 'candle orders of 50+ negotiated'], rng)}`,
        ];
        stock = pickN(CHAND_STOCK, 8, rng);
        prices = 'Candles from 1 cp · Rope 1 gp/50 ft · Oil 1 sp/flask';
        break;

      case 'stablemaster':
        description = pick(STABLE_DESCRIPTIONS, rng);
        features = [
          `Animals in stock: ${pick(['riding horses only', 'riding and draft animals', 'warhorses available by arrangement', 'mules and ponies in addition to horses', 'exotic mounts sometimes available'], rng)}`,
          `Service: ${pick(['farrier on premises daily', 'veterinary assessment included with long-term boarding', 'horse training available for young animals', 'tack and saddlery for sale'], rng)}`,
        ];
        services = pickN(STABLE_SERVICES, 8, rng);
        prices = 'Stabling 4 sp/night · Horses from 75 gp · Warhorses from 400 gp';
        break;

      case 'temple':
        description = pick(TEMPLE_DESCRIPTIONS_LIST, rng);
        features = [
          `Focus: ${pick(['healing and restoration', 'community and justice', 'knowledge and learning', 'travel and protection', 'harvest and plenty', 'death rites and remembrance'], rng)}`,
          `Accessible: ${pick(['healing services sliding scale for those without means', 'sanctuary available', 'daily meal for the destitute', 'literacy taught free of charge'], rng)}`,
        ];
        services = pickN(TEMPLE_SERVICES_LIST, 7, rng);
        prices = 'Services by donation · No one turned away for inability to pay';
        break;

      case 'guildhall':
        description = pick(GUILD_DESCRIPTIONS, rng);
        features = [
          `Open to: ${pick(['members only beyond the front desk', 'non-members may post to the job board', 'membership applications reviewed monthly', 'journeymen sponsored by two masters'], rng)}`,
          `Resources: ${pick(['extensive archive of trade records', 'legal referral for members', 'certification of craft for export', 'apprentice placement programme'], rng)}`,
        ];
        services = pickN(GUILD_SERVICES, 7, rng);
        prices = 'Membership fees vary · Some services available to non-members';
        break;

      case 'guard_post':
        description = pick(GUARD_DESCRIPTIONS, rng);
        features = [
          `Jurisdiction: ${pick(['this district only', 'three surrounding streets', 'the waterfront and immediate approaches', 'the market and one block in each direction'], rng)}`,
          `Current priority: ${pick(['property crime', 'a specific wanted individual', 'curfew enforcement in one area', 'smuggling investigation', 'missing person case'], rng)}`,
        ];
        services = pickN(GUARD_SERVICES, 6, rng);
        prices = 'Public services free · Escort and specialist work by negotiation';
        break;

      case 'bakery':
        description = pick(BAKERY_DESCRIPTIONS, rng);
        features = [
          `Specialty: ${pick(['sourdough and rye loaves', 'sweet pastries and rolls', 'meat pies and savoury fillings', 'travel bread and hardtack', 'festival and ceremonial cakes'], rng)}`,
          `Opens: ${pick(['before dawn, sells out by mid-morning', 'at sunrise, fresh batches through the afternoon', 'twice daily — morning loaves and afternoon pastries'], rng)}`,
        ];
        stock = pickN(BAKERY_STOCK, 8, rng);
        prices = 'Bread from 3 cp · Pies from 8 cp · See board for daily specials';
        break;

      case 'library':
        description = pick(LIBRARY_DESCRIPTIONS, rng);
        features = [
          `Collection focus: ${pick(['local and regional history', 'natural philosophy and alchemy', 'legal texts and civic records', 'maps and navigation', 'religious and philosophical works', 'general reference'], rng)}`,
          `Policy: ${pick(['reading room open to all, borrowing by deposit', 'members only beyond the front shelves', 'restricted section by appointment only', 'quiet hours enforced at all times'], rng)}`,
        ];
        stock = pickN(LIBRARY_STOCK, 8, rng);
        prices = 'Reading room 1 sp/day · Texts from 5 gp · Rare items by negotiation';
        break;

      case 'cartographer':
        description = pick(CARTOGRAPHER_DESCRIPTIONS, rng);
        features = [
          `Specialty: ${pick(['city and district maps', 'regional road and trade routes', 'coastal and navigation charts', 'wilderness and dungeon surveys', 'historical maps and copies'], rng)}`,
          `Service: ${pick(['custom surveys commissioned', 'maps corrected and updated', 'copies made to order', 'expedition consultation available'], rng)}`,
        ];
        stock = pickN(CARTOGRAPHER_STOCK, 8, rng);
        prices = 'City maps from 10 gp · Regional from 15 gp · Custom by scope';
        break;

      case 'stables':
        description = pick(STABLES_DESCRIPTIONS, rng);
        features = [
          `Animals in stock: ${pick(['riding horses and mules', 'riding and draft animals', 'warhorses by arrangement', 'ponies and light breeds', 'a broad selection including exotics occasionally'], rng)}`,
          `Service: ${pick(['farrier on premises daily', 'veterinary care included with boarding', 'tack and saddlery for sale', 'cart and wagon hire available'], rng)}`,
        ];
        services = pickN(STABLES_SERVICES, 8, rng);
        prices = 'Stabling 4 sp/night · Riding horses from 75 gp · Warhorses from 400 gp';
        break;

      case 'taxidermist':
        description = pick(TAXIDERMIST_DESCRIPTIONS, rng);
        features = [
          `Specialty: ${pick(['trophy mounts and full specimens', 'pelt curing and preparation', 'alchemical component extraction', 'natural history display pieces', 'skull and bone preparation'], rng)}`,
          `Turnaround: ${pick(['standard commissions 2–4 weeks', 'rush work at premium', 'component extraction same-day', 'complex full mounts 6–8 weeks'], rng)}`,
        ];
        stock = pickN(TAXIDERMIST_STOCK, 7, rng);
        prices = 'Mounts from 5 gp · Pelts from 5 gp · Custom commissions quoted';
        break;

      case 'mortician':
        description = pick(MORTICIAN_DESCRIPTIONS, rng);
        features = [
          `Services: ${pick(['full preparation and laying out', 'cremation available', 'anonymous arrangements available', 'cold storage for delayed arrangements'], rng)}`,
          `Known for: ${pick(['discretion and no questions asked', 'respectful treatment at all price points', 'cause of death assessment on request', 'extensive experience with unusual cases'], rng)}`,
        ];
        services = pickN(MORTICIAN_SERVICES, 7, rng);
        prices = 'Preparation from 2 gp · Casket from 3 gp · Full arrangement from 10 gp';
        break;

      case 'shipwright':
        description = pick(SHIPWRIGHT_DESCRIPTIONS, rng);
        features = [
          `Specialty: ${pick(['river and lake craft', 'coastal fishing vessels', 'cargo barges', 'repair and refit', 'custom commissions'], rng)}`,
          `Current work: ${pick(['order book full 6–8 weeks', 'taking rush repairs', 'commissioning accepted with deposit', 'dry dock available for long-term work'], rng)}`,
        ];
        stock = pickN(SHIPWRIGHT_STOCK, 7, rng);
        prices = 'Rowboat 50 gp · River craft from 100 gp · Full vessel by commission';
        break;

      case 'tattoo_parlour':
        description = pick(TATTOO_DESCRIPTIONS, rng);
        features = [
          `Style: ${pick(['bold traditional designs', 'fine-line detail work', 'arcane and runic specialisation', 'portraiture and natural imagery', 'abstract and geometric patterns'], rng)}`,
          `Availability: ${pick(['walk-in for simple work', 'appointment required for complex pieces', 'arcane work by consultation only', 'waiting list for large commissions'], rng)}`,
        ];
        services = pickN(TATTOO_SERVICES, 7, rng);
        prices = 'Simple designs from 5 gp · Complex work from 15 gp · Arcane from 100 gp';
        break;

      case 'potion_brewer':
        description = pick(POTION_DESCRIPTIONS, rng);
        features = [
          `Specialty: ${pick(['healing potions in reliable stock', 'utility potions for adventurers', 'custom commissions accepted', 'expedition kits assembled to order'], rng)}`,
          `Quality: ${pick(['every batch tested before sale', 'consistent potency guaranteed', 'no experimental stock sold without disclosure', 'bulk orders for guilds and companies'], rng)}`,
        ];
        stock = pickN(POTION_STOCK, 8, rng);
        prices = 'Healing 50 gp · Greater healing 150 gp · Custom by quote';
        break;

      case 'monster_parts':
        description = pick(MONSTER_DESCRIPTIONS, rng);
        features = [
          `Specialty: ${pick(['common creature components', 'rare and exotic specimens', 'fresh components for alchemists', 'preserved specimens for collectors'], rng)}`,
          `Policy: ${pick(['no questions on use', 'restricted components require documentation', 'creature identification available', 'sourcing requests accepted'], rng)}`,
        ];
        stock = pickN(MONSTER_STOCK, 8, rng);
        prices = 'Common components from 3 gp · Rare by negotiation · Custom sourcing quoted';
        break;

      case 'thieves_guild':
        description = pick(GUILD_THIEF_DESCRIPTIONS, rng);
        features = [
          `Front: ${pick(['locksmith and key shop', 'messenger and courier service', 'pawnbroker and exchange', 'information broker', 'security consultant'], rng)}`,
          `Access: ${pick(['introduction required beyond the counter', 'members by referral only', 'front services open to all', 'no unsolicited approaches'], rng)}`,
        ];
        services = pickN(GUILD_THIEF_SERVICES, 7, rng);
        prices = 'Front services standard · Guild work negotiated';
        break;

      case 'gambling_den':
        description = pick(GAMBLE_DESCRIPTIONS, rng);
        features = [
          `Games: ${pick(['dice and card tables', 'numbers board and weekly draw', 'private high-stakes room available', 'arm wrestling and pit games'], rng)}`,
          `Atmosphere: ${pick(['low-key and discreet', 'busy and social', 'professional and quiet', 'lively but orderly'], rng)}`,
        ];
        menu = pickN(GAMBLE_MENU, 8, rng);
        prices = 'Drinks from 4 cp · Minimum stakes vary by game · House takes 5%';
        break;

      case 'fencing_operation':
        description = pick(FENCE_DESCRIPTIONS, rng);
        features = [
          `Front business: ${pick(['used goods and exchange', 'antiques and curiosities', 'import/export consultant', 'general trader'], rng)}`,
          `Policy: ${pick(['no questions on provenance', 'nothing illegal beyond a point', 'guild-connected, protection applies', 'reputation for fair rates'], rng)}`,
        ];
        stock = pickN(FENCE_STOCK, 7, rng);
        prices = 'Buys at 30–60% of value · No questions on origin';
        break;

      case 'fortune_teller':
        description = pick(FORTUNE_DESCRIPTIONS, rng);
        features = [
          `Methods: ${pick(['tarot and card reading', 'astrology and charts', 'scrying and visions', 'bone and augury', 'palm reading and body reading'], rng)}`,
          `Reputation: ${pick(['accurate beyond chance, verifiably', 'popular for entertainment and counsel both', 'known to the city watch as legitimate', 'specialist in specific question readings'], rng)}`,
        ];
        services = pickN(FORTUNE_SERVICES, 7, rng);
        prices = 'Readings from 3 sp · Extended consultation from 5 gp';
        break;
    }

    const stats = generateProprietorStats(type, rng);
    const grimoireNpcRef = `npc_${fnv1a(`${cityId}|${district.name}|${i}|${worldSeed}`).toString(16)}`;

    establishments.push({
      id: `${cityId}_${district.name.replace(/\s+/g, '_')}_${i}`,
      name,
      type,
      quality,
      emoji: EMOJI[type],
      proprietor: {
        name: type === 'guard_post' ? `Duty Officer ${propFirst} ${propLast}` : `${propFirst} ${propLast}`,
        race: propRace,
        description: proprietorDesc,
        ...stats,
        grimoireNpcRef,
      },
      description,
      features,
      grimoireCommerceRef: `commerce_${fnv1a(`${cityId}|${district.name}|${i}|commerce|${worldSeed}`).toString(16)}`,
      ...(stock && { stock }),
      ...(menu && { menu }),
      ...(services && { services }),
      ...(rumor && { rumor }),
      ...(prices && { prices }),
    });
  }

  return establishments;
}

// ─── Generic Establishment Generator (for wonders, dungeons, etc) ──────────

export function generateWonderEstablishment(
  contextId: string,
  index: number,
  worldSeed: string,
  estType: EstablishmentType = 'trading_post'
): Establishment {
  const seedNum = fnv1a(`${contextId}|est|${index}|${worldSeed}`);
  const rng = makeRng(seedNum);

  const isFemale = rng() > 0.5;
  const propFirst = pick(isFemale ? PROP_FIRST_F : PROP_FIRST_M, rng);
  const propLast = pick(PROP_LAST, rng);
  const propPhysical = pick(PROP_PHYSICAL, rng);
  const propPersonality = pick(PROP_PERSONALITY, rng);
  const propRace = pick(PROP_RACES, rng);

  const proprietorDesc = `${propPhysical}, ${propPersonality}.`;
  const name = `${propFirst}'s ${estType === 'trading_post' ? 'Trading Post' : estType === 'tavern' ? 'Tavern' : 'Establishment'}`;

  // For wonders, establishments are typically high-quality
  const quality: EstablishmentQuality = rng() > 0.6 ? 'comfortable' : rng() > 0.3 ? 'wealthy' : 'modest';

  const stats = generateProprietorStats(estType, rng);
  const grimoireNpcRef = `npc_${fnv1a(`${contextId}|${index}|npc|${worldSeed}`).toString(16)}`;
  const grimoireCommerceRef = `commerce_${fnv1a(`${contextId}|${index}|commerce|${worldSeed}`).toString(16)}`;

  let description = `A unique establishment in an extraordinary location.`;
  let features: string[] = [];
  let menu: string[] | undefined;

  // Simple template for wonder establishments
  if (estType === 'tavern' || estType === 'inn') {
    description = pick([
      'A cozy haven for travelers seeking refuge from the wonder\'s strange energies.',
      'A gathering place where locals and adventurers share stories of the location.',
      'A refuge with otherworldly charm, permeated by the place\'s essence.',
    ], rng);
    features = [
      `Specialty: ${pick(['rare spirits from across planes', 'food untouched by time', 'rooms that distort sleep cycles'], rng)}`,
      `Atmosphere: ${pick(['eerily peaceful', 'charged with magical energy', 'seems to exist between moments'], rng)}`,
    ];
    menu = ['Local specialties based on the wonder\'s unique resources'];
  } else {
    description = pick([
      'An operation that leverages the wonder\'s unique properties and resources.',
      'A specialized service provider catering to those who study this location.',
      'An enterprise built around harvesting or studying the wonder\'s gifts.',
    ], rng);
    features = [
      `Focus: ${pick(['rare resource extraction', 'knowledge accumulation', 'artifact identification'], rng)}`,
      `Reputation: ${pick(['respected scholars frequent here', 'attracts adventurers seeking rare goods', 'known for discretion'], rng)}`,
    ];
  }

  return {
    id: `${contextId}_est_${index}`,
    name,
    type: estType,
    quality,
    emoji: EMOJI[estType] || '🏚️',
    proprietor: {
      name: `${propFirst} ${propLast}`,
      race: propRace,
      description: proprietorDesc,
      ...stats,
      grimoireNpcRef,
    },
    description,
    features,
    ...(menu && { menu }),
    grimoireCommerceRef,
  };
}
