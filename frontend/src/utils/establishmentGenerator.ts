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
  | 'chandler' | 'stablemaster';

export interface Establishment {
  id: string;
  name: string;
  type: EstablishmentType;
  emoji: string;
  proprietor: { name: string; description: string };
  description: string;
  features: string[];
  stock?: string[];     // shops
  menu?: string[];      // taverns, inns
  services?: string[];  // inns, temples, guildhalls
  rumor?: string;       // taverns only
  prices?: string;      // pricing summary
}

// ─── Seeded RNG ──────────────────────────────────────────────────────────────

function fnv1a(s: string): number {
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
  'The forge runs from before dawn. The queue starts not long after.',
  'Military contracts are the bread and butter; civilians are a courtesy.',
  'Three generations of smiths. The eldest still works the bellows.',
  'Specialises in repair over new work — and is right that this is more reliable income.',
  'The work is honest and the price reflects that without apology.',
  'A smaller operation than most, which means more attention per job.',
  'Known for one specific thing. Everything else is competent.',
  'Keeps unusual hours. The forge is cooler at midday and hotter at midnight.',
];

const SMITH_STOCK = [
  'Handaxe (5 gp)', 'Battleaxe (10 gp)', 'Longsword (15 gp)', 'Shortsword (10 gp)',
  'Dagger (2 gp)', 'Spear (1 gp)', 'Quarterstaff iron-shod (5 sp)', 'War pick (5 gp)',
  'Warhammer (15 gp)', 'Maul (10 gp)', 'Flail (10 gp)', 'Glaive (20 gp)',
  'Halberd (20 gp)', 'Morningstar (15 gp)', 'Light crossbow (25 gp)',
  'Chain shirt (50 gp)', 'Scale mail (50 gp)', 'Chain mail (75 gp)',
  'Breastplate (400 gp)', 'Half plate (750 gp)',
  'Shield, wooden (7 gp)', 'Shield, steel (10 gp)',
  'Horseshoes, set (5 sp)', 'Nails, 20 (1 sp)', 'Pitons, 10 (1 sp)',
  'Iron spikes, 10 (1 sp)', 'Crowbar (2 gp)', 'Hammer (1 gp)',
  'Grappling hook (2 gp)', 'Lock, good (10 gp)', 'Chain, 10 ft (5 gp)',
  'Manacles (2 gp)', 'Iron pot (2 gp)', 'Lantern, bullseye (10 gp)',
  '+1 weapon (commission, 8–12 weeks, 300+ gp on request)',
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
  'Everything from rope to rat poison, and the proprietor knows where all of it is.',
  'The shelves go further back than seems architecturally possible.',
  'Not the cheapest and not the best, but open when nothing else is.',
  'The kind of shop that exists so that people don\'t have to go to four other places.',
  'Organised in a system that only the owner understands, which they do completely.',
  'Sells everything except what you specifically need, which they can order.',
  'The prices are marked clearly and not negotiated. The owner has decided.',
  'A cramped but comprehensive emporium that has been here longer than the street.',
];

const GENERAL_STOCK = [
  'Rope, hempen (10 ft, 1 gp)', 'Rope, silk (50 ft, 10 gp)', 'Torches, 10 (1 sp)',
  'Rations, 1 day (5 sp)', 'Bedroll (1 gp)', 'Blanket (5 sp)',
  'Backpack (2 gp)', 'Sack (1 cp)', 'Pouch (5 sp)', 'Saddlebags (4 gp)',
  'Flint and steel (1 gp)', 'Tinderbox (5 sp)', 'Lantern, hooded (5 gp)',
  'Oil, flask (1 sp)', 'Candles, 10 (1 sp)', 'Mirror, small steel (5 gp)',
  'Crowbar (2 gp)', 'Hammer (1 gp)', 'Pitons, 10 (1 sp)', 'Grappling hook (2 gp)',
  'Chalk, 1 piece (1 cp)', 'Ink, 1 oz (10 gp)', 'Paper, 1 sheet (2 sp)',
  'Parchment, 1 sheet (1 sp)', 'Quill (2 cp)', 'Sealing wax (5 sp)',
  'Signal whistle (5 cp)', 'Lock (10 gp)', 'Manacles (2 gp)',
  'Net (1 gp)', 'Hunting trap (5 gp)', 'Waterskin (2 sp)', 'Mess kit (2 sp)',
  'Cook\'s utensils (1 gp)', 'Common clothes (5 sp)', 'Traveler\'s clothes (2 gp)',
];

// APOTHECARY —————————————————————————————————————————————————————————————————

const APOTH_DESCRIPTIONS = [
  'The smell hits before the door opens. Lavender, sulfur, dried herbs, and something unidentifiable.',
  'The jars are labeled. Whether the labels are accurate is a matter of ongoing local debate.',
  'A place where the legitimate and the borderline share the same shelf.',
  'Quieter than expected. The proprietor has strong views about unnecessary noise.',
  'Doubles as a consultation space; speaking quietly is the norm.',
];

const APOTH_STOCK = [
  'Healing potion (50 gp)', 'Greater healing potion (150 gp, ask)',
  'Antitoxin, vial (50 gp)', 'Antiplague (50 gp)',
  'Healer\'s kit (5 gp)', 'Herbalism kit (5 gp)',
  'Potion of animal friendship (50 gp)', 'Potion of water breathing (50 gp)',
  'Aloe salve, minor burn treatment (3 sp)', 'Fever root tea, 5 doses (4 sp)',
  'Purgative draught (2 sp)', 'Dried willow bark, pain relief (5 cp)',
  'Bandages, 10 (2 sp)', 'Splints, pair (1 sp)', 'Suture thread, waxed (3 sp)',
  'Calming tincture, 3 doses (1 sp)', 'Sleeping draught, 1 dose (2 sp)',
  'Purified charcoal, poison aid (2 sp)', 'Antiseptic wash (1 sp)',
  'Rat poison (ask, requires explanation)', 'Insect repellent, 5 doses (5 sp)',
  'Deworming compound (1 sp)', 'Midwife kit (7 gp)', 'Birthing herbs, set (4 gp)',
  'Contraceptive herbs, month supply (1 gp)', 'Restore sense tea, 3 doses (5 sp)',
  'Dried Nightshade (restricted, herbalist certification required)',
];

// ALCHEMIST —————————————————————————————————————————————————————————————————

const ALCH_DESCRIPTIONS = [
  'The windows are thick glass for a reason. Everything is behind the counter for a reason.',
  'A practitioner who has clearly survived several explosions and learned from each.',
  'The smell of sulfur is permanent and the owner has stopped noticing.',
  'More precise than an apothecary. Considerably more expensive.',
  'Operates by appointment for serious purchases. Walk-in for standard stock.',
];

const ALCH_STOCK = [
  'Alchemist\'s fire, flask (50 gp)', 'Acid, vial (25 gp)',
  'Alchemist\'s supplies kit (50 gp)',
  'Smokepowder, pinch (ask — regulated)', 'Thunderstone (ask)',
  'Tindertwigs, 10 (2 gp)', 'Liquid ice (ask)', 'Tanglefoot bag (50 gp)',
  'Healer\'s kit base chemicals (10 gp)', 'Alchemical silver (10 gp per weapon coating)',
  'Potion of fire breathing (150 gp)', 'Oil of slipperiness (60 gp)',
  'Sovereign glue, 1 oz (ask)', 'Universal solvent (ask)',
  'Iron gut pills, 1 week supply (3 sp)', 'Antitoxin variant (custom, 100 gp)',
  'Transmutation reagent, base (10 gp per oz)', 'Luminous ink (5 gp)',
  'Alchemical blackpowder, small charge (ask, proof of purpose required)',
  'Detection powder for invisible ink (2 gp)',
];

// MAGIC SHOP —————————————————————————————————————————————————————————————————

const MAGIC_DESCRIPTIONS = [
  'Not everything in here is for sale. Some of it is for display. Some of it cannot be moved.',
  'The proprietor will appraise items at no charge. The purchase price tends to follow.',
  'Smaller stock than expected, all of it verified.',
  'A shop that has changed ownership several times. The inventory never quite matches the ledger.',
  'Trading in information as often as objects.',
];

const MAGIC_STOCK = [
  'Spell scroll, cantrip (10–25 gp)', 'Spell scroll, 1st level (50 gp)', 'Spell scroll, 2nd level (150 gp)',
  'Spell scroll, 3rd level (300 gp, limited availability)',
  'Potion of healing (50 gp)', 'Potion of greater healing (150 gp)',
  'Potion of climbing (75 gp)', 'Potion of water breathing (150 gp)',
  'Bag of holding (500 gp)', 'Rope of climbing (300 gp)',
  'Eyes of minute seeing (250 gp)', 'Sending stones, pair (300 gp)',
  'Immovable rod (500 gp)', 'Lantern of revealing (500 gp)',
  'Necklace of adaptation (250 gp)', 'Cloak of protection (commission)',
  'Ring of warmth (400 gp)', 'Boots of elvenkind (500 gp)',
  'Gloves of thievery (300 gp)',
  'Component pouch (25 gp)', 'Arcane focus, standard (25–100 gp)',
  'Identify ritual service (25 gp per item)',
  'Attunement assistance (50 gp, appointment required)',
  '+1 ammunition, 20 (150 gp)',
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
  'The display cases are locked. The conversation is free.',
  'Appraisal is the secondary service. It generates most of the actual business.',
  'New work, used work, and old work — all of it assessed before purchase.',
  'The pieces in the window are advertising. The real stock is in the back.',
];

const JEWEL_STOCK = [
  'Silver ring, plain (5 sp)', 'Silver ring, engraved (1 gp)', 'Silver ring with stone (2–5 gp)',
  'Gold ring, plain (5 gp)', 'Gold ring, set stone (15–50 gp)',
  'Silver necklace (3–8 gp)', 'Gold necklace (20–100 gp)',
  'Pearl pendant (20 gp)', 'Gemstone pendant (price varies)',
  'Signet ring, silver (15 gp)', 'Signet ring, gold (40 gp)',
  'Bracelet, silver (4 gp)', 'Bracelet, gold (25 gp)',
  'Brooch, decorative (2–10 gp)', 'Earrings, pair, silver (3 gp)',
  'Raw gem appraisal (2 sp per item)', 'Cut gem, common (5–20 gp)',
  'Cut gem, rare (50–500 gp)', 'Custom setting work (quote on request)',
  'Purchased items assessed at fair market value',
  'Engraving service (1 gp for short text)',
];

// TAILOR ——————————————————————————————————————————————————————————————————────

const TAILOR_DESCRIPTIONS = [
  'Work done in the shop while you wait, within reason. Major commissions require a fitting.',
  'Repairs, alterations, and new work. Repairs are what keeps the lights on.',
  'The stock on the rack is ready to wear. Custom orders take two to four weeks.',
  'Discreet. Knows that costumes and disguises are professionally neutral work.',
];

const TAILOR_STOCK = [
  'Common clothes (5 sp)', 'Traveler\'s clothes (2 gp)', 'Fine clothes (15 gp)',
  'Costume (5 gp)', 'Robes, simple (2 gp)', 'Robes, fine (10 gp)',
  'Cloak, wool (5 sp)', 'Cloak, fine (3 gp)', 'Cloak, weather treated (5 gp)',
  'Boots, leather (2 gp)', 'Boots, fine (5 gp)', 'Boots, riding (4 gp)',
  'Gloves, leather (2 sp)', 'Gloves, lined (1 gp)', 'Hat, common (1 sp)', 'Hat, fine (3 gp)',
  'Belt (2 sp)', 'Sash (5 sp)', 'Sash, decorative (2 gp)',
  'Alterations (1 sp – 1 gp depending on work)', 'Repair, minor (5 cp)',
  'Custom commission (quoted on measurement)',
  'Livery commission for household (quoted per unit)',
  'Military uniform alteration (ask)',
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
  'They buy what people need to sell and sell what people left behind.',
  'Fair is relative. Transparent, at least.',
  'The back room contains things that were pawned and not reclaimed. Very interesting things.',
  'A reflection of the neighbourhood\'s recent history, visible on every shelf.',
];

const PAWN_STOCK = [
  'Assorted tools, used (varies)', 'Weapons, used, condition varies (half standard)',
  'Clothing, assorted (low prices)', 'Books, unsorted (1–5 gp)',
  'Jewellery, unclaimed (appraised before sale)', 'Musical instruments, pawned (varies)',
  'Armour pieces, used (varies)', 'Kitchen goods (1 sp – 1 gp)',
  'Locks, used but functional (3–7 gp)', 'Rope, partial lengths (cheap)',
  'Coins, foreign (exchanged at a fee)', 'Notes of hand (purchased at discount)',
  'Small sculptures and art (price on display)', 'Unredeemed pledges (ask)',
  'Short-term loans against pawned goods (ask, terms discussed privately)',
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

// ─── Emoji Map ────────────────────────────────────────────────────────────────

const EMOJI: Record<EstablishmentType, string> = {
  tavern: '🍺', inn: '🛏️', blacksmith: '⚒️', general_store: '🏪',
  apothecary: '🌿', alchemist: '⚗️', magic_shop: '✨', bookshop: '📚',
  jeweler: '💎', tailor: '🧵', provisioner: '🎒', temple: '🕯️',
  guildhall: '⚑', guard_post: '🛡️', pawnbroker: '🔑', scribe: '📜',
  chandler: '🕯', stablemaster: '🐴',
};

// ─── District → Type Mapping ──────────────────────────────────────────────────

function inferTypes(districtName: string, magicLevel: number): EstablishmentType[] {
  const n = districtName.toLowerCase();
  const hasMagic = magicLevel >= 4;

  if (n.includes('dock') || n.includes('harbor') || n.includes('port') || n.includes('tangles') || n.includes('undertow'))
    return ['tavern', 'chandler', 'provisioner', 'inn', 'general_store'];
  if (n.includes('temple') || n.includes('shrine') || n.includes('mourn') || n.includes('pilgrim'))
    return ['temple', 'apothecary', 'scribe', hasMagic ? 'magic_shop' : 'general_store'];
  if (n.includes('forge') || n.includes('smith') || n.includes('armour') || n.includes('armor') || n.includes('stoneyard') || n.includes('joiner'))
    return ['blacksmith', 'general_store', 'tavern', hasMagic ? 'alchemist' : 'provisioner'];
  if (n.includes('scholar') || n.includes('inktown') || n.includes('book') || n.includes('scribe') || n.includes('astronomer') || n.includes('instrument'))
    return ['bookshop', hasMagic ? 'alchemist' : 'apothecary', 'scribe', hasMagic ? 'magic_shop' : 'general_store'];
  if (n.includes('arcane') || n.includes('alchemist') || n.includes('glass') || n.includes('rune') || n.includes('clockwork'))
    return [hasMagic ? 'magic_shop' : 'general_store', 'alchemist', 'bookshop', 'apothecary'];
  if (n.includes('merchant') || n.includes('market') || n.includes('trade') || n.includes('exchange') || n.includes('grain') || n.includes('spice'))
    return ['general_store', 'jeweler', 'provisioner', 'tavern'];
  if (n.includes('guild'))
    return ['guildhall', 'general_store', 'tavern', 'blacksmith'];
  if (n.includes('silver') || n.includes('vault') || n.includes('gold') || n.includes('coin') || n.includes('moneylender') || n.includes('pawnbroker'))
    return ['jeweler', hasMagic ? 'magic_shop' : 'general_store', 'pawnbroker', 'scribe'];
  if (n.includes('high ward') || n.includes('garden') || n.includes('tradespire') || n.includes('tailor') || n.includes('cobblers') || n.includes('hatter'))
    return ['tailor', 'jeweler', 'tavern', 'provisioner'];
  if (n.includes('tangle') || n.includes('warren') || n.includes('rookery') || n.includes('pit') || n.includes('quarter of the lost') || n.includes('crossings'))
    return ['tavern', 'pawnbroker', 'general_store', 'chandler'];
  if (n.includes('barracks') || n.includes('military'))
    return ['blacksmith', 'tavern', 'provisioner', 'guard_post'];
  if (n.includes('artisan') || n.includes('loom') || n.includes('weav') || n.includes('dyer') || n.includes('potter'))
    return ['tailor', 'general_store', 'provisioner', 'tavern'];
  if (n.includes('brew') || n.includes('vintner') || n.includes('distill'))
    return ['tavern', 'provisioner', 'general_store', 'inn'];
  if (n.includes('baker') || n.includes('fishmonger') || n.includes('butcher') || n.includes('slaughter'))
    return ['provisioner', 'general_store', 'tavern', 'apothecary'];
  if (n.includes('rope') || n.includes('chandler'))
    return ['chandler', 'provisioner', 'general_store', 'tavern'];
  if (n.includes('stable') || n.includes('saddler'))
    return ['stablemaster', 'blacksmith', 'provisioner', 'tavern'];
  if (n.includes('apothecary') || n.includes('surgeon') || n.includes('herbalist'))
    return ['apothecary', hasMagic ? 'alchemist' : 'general_store', 'scribe', 'temple'];
  if (n.includes('foreigner') || n.includes('pale quarter') || n.includes('mercenari'))
    return ['tavern', 'inn', 'provisioner', 'general_store'];
  if (n.includes('entertainer') || n.includes('gambler'))
    return ['tavern', 'inn', hasMagic ? 'magic_shop' : 'general_store', 'tailor'];
  // oldtown, spire, collapse — generic
  return ['tavern', 'inn', 'general_store', 'blacksmith'];
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
  cityName: string,
  worldSeed: string,
  magicLevel: number = 5
): Establishment[] {
  // FNV-1a hash of combined key — districts with similar names in similar cities
  // get completely different seeds.
  const seedNum = fnv1a(`${cityId}|${district.name}|${worldSeed}`);
  const rng = makeRng(seedNum);

  const types = inferTypes(district.name, magicLevel);
  const count = 3 + Math.floor(rng() * 3); // 3–5 establishments
  const establishments: Establishment[] = [];

  // Ensure at least one tavern or inn in most districts
  const selectedTypes: EstablishmentType[] = [...types.slice(0, count)];
  if (count > types.length) {
    // Pad with more from the list cyclically
    for (let i = types.length; i < count; i++) {
      selectedTypes.push(types[i % types.length]);
    }
  }

  for (let i = 0; i < selectedTypes.length; i++) {
    const type = selectedTypes[i];
    const isFemale = rng() > 0.5;
    const propFirst = pick(isFemale ? PROP_FIRST_F : PROP_FIRST_M, rng);
    const propLast = pick(PROP_LAST, rng);
    const propPhysical = pick(PROP_PHYSICAL, rng);
    const propPersonality = pick(PROP_PERSONALITY, rng);

    const name = generateName(type, rng, propFirst, propLast);

    const proprietorDesc = `${propPhysical}, ${propPersonality}.`;

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
    }

    establishments.push({
      id: `${cityId}_${district.name.replace(/\s+/g, '_')}_${i}`,
      name,
      type,
      emoji: EMOJI[type],
      proprietor: {
        name: type === 'guard_post' ? `Duty Officer ${propFirst} ${propLast}` : `${propFirst} ${propLast}`,
        description: proprietorDesc,
      },
      description,
      features,
      ...(stock && { stock }),
      ...(menu && { menu }),
      ...(services && { services }),
      ...(rumor && { rumor }),
      ...(prices && { prices }),
    });
  }

  return establishments;
}
