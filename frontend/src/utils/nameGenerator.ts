/**
 * Fantasy Name Generator for World Builder
 * 100+ entries per category, multiple generation patterns per type
 * so cities, dungeons, wonders, and landmarks all feel distinct.
 */

// ─── City Name Components ────────────────────────────────────────────────────

const CITY_PREFIXES = [
  // Classical / Anglo-Saxon
  'Ash', 'Bram', 'Cairn', 'Dale', 'Dun', 'Earn', 'Fen', 'Glen', 'Holt', 'Holm',
  'Kirk', 'Ling', 'Mere', 'Moor', 'Nether', 'Over', 'Penn', 'Rood', 'Rud', 'Stan',
  'Thor', 'Umber', 'Vane', 'Weld', 'Wold', 'Yore',
  // Evocative descriptors
  'Amber', 'Ash', 'Blight', 'Bright', 'Briar', 'Brook', 'Burn', 'Cold', 'Copper',
  'Crow', 'Dark', 'Dead', 'Dusk', 'Ember', 'Far', 'Flint', 'Frost', 'Gold', 'Gray',
  'Green', 'Grim', 'Gust', 'Hale', 'Hard', 'Hawk', 'High', 'Hollow', 'Iron', 'Jade',
  'Keen', 'Last', 'Lone', 'Long', 'Low', 'Mast', 'Mid', 'Mill', 'Mist', 'Nail',
  'Night', 'North', 'Oak', 'Old', 'Pale', 'Pine', 'Pit', 'Quick', 'Rain', 'Raven',
  'Red', 'Reed', 'Ridge', 'Ring', 'River', 'Rock', 'Rose', 'Rust', 'Salt', 'Sand',
  'Scar', 'Shadow', 'Shield', 'Shore', 'Silver', 'Slate', 'Smoke', 'Snow', 'South',
  'Star', 'Steel', 'Stone', 'Storm', 'Straw', 'Sun', 'Swift', 'Thorn', 'Tide', 'Timber',
  'Tin', 'Tor', 'True', 'Vale', 'Veil', 'Wake', 'Warden', 'Watch', 'West', 'White',
  'Wild', 'Wind', 'Wolf', 'Wren', 'Wroth',
];

const CITY_SUFFIXES = [
  // Settlement type words
  'borough', 'bridge', 'burgh', 'by', 'caster', 'chester', 'cliff', 'croft',
  'cross', 'dale', 'den', 'down', 'dun', 'end', 'fall', 'falls', 'fen', 'ferry',
  'field', 'fold', 'ford', 'fort', 'gate', 'green', 'grove', 'hall', 'ham',
  'harbour', 'haven', 'heath', 'hill', 'holm', 'holt', 'home', 'hurst', 'keep',
  'landing', 'lea', 'lock', 'mast', 'mead', 'mere', 'mill', 'moor', 'mouth',
  'nook', 'over', 'pass', 'peak', 'point', 'pool', 'port', 'post', 'reach',
  'reef', 'rest', 'rise', 'rock', 'run', 'seat', 'set', 'shire', 'shore',
  'side', 'spire', 'spring', 'stall', 'stand', 'stead', 'steep', 'step',
  'stone', 'stow', 'strand', 'thorpe', 'tide', 'ton', 'tower', 'vale',
  'view', 'ville', 'wall', 'ward', 'watch', 'water', 'way', 'well',
  'wick', 'wood', 'worth',
];

// Standalone city name fragments (used for "Keldrath"-style single names)
const CITY_NAME_STARTS = [
  'Aed', 'Aldur', 'Aran', 'Arveth', 'Ath', 'Aval', 'Bael', 'Baran', 'Beorn', 'Bral',
  'Cael', 'Cal', 'Caer', 'Calad', 'Carm', 'Ceth', 'Cor', 'Crag', 'Dal', 'Dar',
  'Del', 'Dorn', 'Drav', 'Dun', 'Dur', 'Edh', 'Eld', 'Elvar', 'Embr', 'Erak',
  'Fael', 'Farr', 'Feth', 'Fin', 'Flor', 'For', 'Gael', 'Galar', 'Garm', 'Geth',
  'Gilm', 'Gol', 'Gorm', 'Grak', 'Hal', 'Halar', 'Helm', 'Heth', 'Holm', 'Hor',
  'Ildar', 'Ilm', 'Iren', 'Irn', 'Ith', 'Ival', 'Jael', 'Jarl', 'Kael', 'Kald',
  'Kal', 'Kard', 'Karn', 'Keld', 'Kelm', 'Kern', 'Keth', 'Khor', 'Kir', 'Kold',
  'Korm', 'Korth', 'Lael', 'Larn', 'Lath', 'Led', 'Leth', 'Lin', 'Lorn', 'Loth',
  'Mal', 'Malar', 'Marn', 'Math', 'Mel', 'Meldr', 'Mern', 'Meth', 'Mir', 'Mor',
  'Mord', 'Morn', 'Nal', 'Narn', 'Nath', 'Nel', 'Neld', 'Neth', 'Nir', 'Nord',
  'Odel', 'Orn', 'Oth', 'Pael', 'Parm', 'Peth', 'Pir', 'Pol', 'Por', 'Poth',
  'Rael', 'Rald', 'Ralk', 'Rarn', 'Rath', 'Rel', 'Reld', 'Reth', 'Rid', 'Rin',
  'Rod', 'Rold', 'Rorn', 'Roth', 'Sal', 'Sald', 'Sarm', 'Sath', 'Sel', 'Seld',
  'Seth', 'Shard', 'Shorn', 'Sil', 'Sirn', 'Sol', 'Sorn', 'Tal', 'Tald', 'Tarm',
  'Tath', 'Tel', 'Teld', 'Tern', 'Teth', 'Thal', 'Tharn', 'Thorn', 'Thul', 'Tir',
  'Tol', 'Torn', 'Toth', 'Uld', 'Ulm', 'Uln', 'Ulth', 'Umb', 'Und', 'Urn',
  'Val', 'Vald', 'Varm', 'Vath', 'Vel', 'Veld', 'Veth', 'Vir', 'Vor', 'Vorn',
  'Wald', 'Weln', 'Wern', 'Weth', 'Wir', 'Worn', 'Xal', 'Yald', 'Yern', 'Zel',
];

const CITY_NAME_ENDS = [
  'ach', 'ael', 'ahn', 'ald', 'alen', 'aleth', 'alin', 'alm', 'alon', 'alor',
  'aloth', 'alun', 'alys', 'amed', 'amen', 'amer', 'ameth', 'amin', 'anor', 'anoth',
  'arch', 'ard', 'aren', 'areth', 'arin', 'arium', 'aroth', 'aryn', 'ath', 'athen',
  'athor', 'awn', 'dael', 'dain', 'dale', 'dar', 'dath', 'del', 'deth', 'diel',
  'dor', 'doth', 'drel', 'dreth', 'drum', 'dun', 'dur', 'eld', 'elen', 'eleth',
  'elin', 'ellum', 'eloth', 'elun', 'elys', 'emor', 'en', 'end', 'enor', 'enoth',
  'enth', 'er', 'ered', 'ereth', 'erin', 'eron', 'eroth', 'eth', 'feld', 'fell',
  'felt', 'fern', 'ford', 'form', 'forn', 'forth', 'frath', 'gael', 'gal', 'galen',
  'galeth', 'galin', 'galon', 'galor', 'galoth', 'gard', 'garen', 'gareth', 'garin',
  'garon', 'garoth', 'gath', 'gel', 'geld', 'gelen', 'geleth', 'gelin', 'geloth',
  'ger', 'gerd', 'gereth', 'gerin', 'geron', 'geroth', 'geth', 'helm', 'hold',
  'holm', 'holt', 'horn', 'hoth', 'iel', 'ien', 'ier', 'ieth', 'il', 'ild',
  'ilen', 'ileth', 'ilin', 'ilm', 'ilon', 'iloth', 'ilun', 'ilys', 'im', 'in',
  'ion', 'ir', 'ith', 'kan', 'kern', 'keth', 'khor', 'kin', 'kir', 'kith',
  'kold', 'korn', 'lan', 'las', 'lath', 'laun', 'lel', 'leld', 'lelen', 'leleth',
  'lelin', 'leloth', 'ler', 'lerd', 'lereth', 'lerin', 'leron', 'leroth', 'leth',
  'lin', 'lis', 'lith', 'lon', 'lor', 'lorn', 'loth', 'lun', 'lys', 'mal',
  'mar', 'mard', 'maren', 'mareth', 'marin', 'maron', 'maroth', 'math', 'mel',
  'meld', 'melen', 'meleth', 'melin', 'melon', 'meloth', 'mer', 'merd', 'mereth',
  'merin', 'meron', 'meroth', 'meth', 'mir', 'mith', 'mol', 'mor', 'morn', 'moth',
  'mund', 'myr', 'nad', 'nal', 'nald', 'nalen', 'naleth', 'nalin', 'nalon', 'naloth',
  'nar', 'nard', 'naren', 'nareth', 'narin', 'naron', 'naroth', 'nath', 'nel',
  'neld', 'nelen', 'neleth', 'nelin', 'neloth', 'ner', 'nerd', 'nereth', 'nerin',
  'neron', 'neroth', 'neth', 'nir', 'nith', 'nor', 'norn', 'noth', 'nul', 'nyr',
  'ol', 'old', 'olen', 'oleth', 'olin', 'olon', 'oloth', 'or', 'ord', 'oren',
  'oreth', 'orin', 'oron', 'oroth', 'oth', 'rath', 'rel', 'reld', 'relen', 'releth',
  'relin', 'reloth', 'ren', 'rend', 'reneth', 'renin', 'renon', 'renoth', 'reth',
  'rin', 'rith', 'ron', 'rorn', 'roth', 'run', 'ryn', 'sal', 'sand', 'sarn',
  'seth', 'shad', 'shard', 'shar', 'sheth', 'shir', 'shorn', 'sil', 'sind',
  'sir', 'sith', 'sol', 'sorn', 'soth', 'star', 'stead', 'stel', 'stem', 'sten',
  'stern', 'steth', 'stir', 'ston', 'storm', 'storn', 'stoth', 'tal', 'tald',
  'talen', 'taleth', 'talin', 'talon', 'taloth', 'tar', 'tard', 'taren', 'tareth',
  'tarin', 'taron', 'taroth', 'tath', 'tel', 'teld', 'telen', 'teleth', 'telin',
  'teloth', 'tern', 'teth', 'thal', 'thald', 'thalen', 'thaleth', 'thalin', 'thaloth',
  'thar', 'thard', 'tharen', 'thareth', 'tharin', 'tharon', 'tharoth', 'thath',
  'thel', 'theld', 'thelen', 'theleth', 'thelin', 'theloth', 'ther', 'therd',
  'thereth', 'therin', 'theron', 'theroth', 'theth', 'thin', 'thir', 'thol',
  'thorn', 'thoth', 'thul', 'thun', 'thyn', 'tir', 'tith', 'ton', 'torn',
  'toth', 'ul', 'uld', 'ulen', 'uleth', 'ulin', 'uloth', 'un', 'und',
  'val', 'vald', 'valen', 'valeth', 'valin', 'valon', 'valoth', 'var', 'vard',
  'varen', 'vareth', 'varin', 'varon', 'varoth', 'vath', 'vel', 'veld', 'velen',
  'veleth', 'velin', 'veloth', 'ver', 'verd', 'vereth', 'verin', 'veron', 'veroth',
  'veth', 'vin', 'vir', 'vith', 'von', 'vorn', 'voth', 'vul', 'vyr', 'wal',
  'ward', 'warden', 'wick', 'wold', 'wood', 'worth', 'wrath', 'wren', 'wyn',
  'yal', 'yald', 'yalen', 'yaleth', 'yalin', 'yalon', 'yaloth', 'yar', 'yareth',
  'yath', 'yel', 'yeld', 'yeleth', 'yelin', 'yeloth', 'yer', 'yereth', 'yerin',
  'yeroth', 'yeth', 'yin', 'yir', 'yon', 'yorn', 'yoth', 'yul', 'zal', 'zald',
  'zalen', 'zaleth', 'zalin', 'zalon', 'zaloth', 'zar', 'zareth', 'zath', 'zel',
  'zeld', 'zeleth', 'zelin', 'zeloth', 'zer', 'zereth', 'zerin', 'zeroth', 'zeth',
];

// ─── Dungeon Name Components ─────────────────────────────────────────────────

const DUNGEON_PREFIXES = [
  // Architecture / Structure
  'The Abyssal', 'The Ancient', 'The Ashen', 'The Battered', 'The Black', 'The Blighted',
  'The Blind', 'The Blood-Soaked', 'The Bone', 'The Broken', 'The Buried', 'The Burning',
  'The Carrion', 'The Chained', 'The Charred', 'The Collapsed', 'The Corroded', 'The Corrupted',
  'The Crumbling', 'The Cursed', 'The Dark', 'The Dead', 'The Decaying', 'The Defiled',
  'The Desolate', 'The Doomed', 'The Drowned', 'The Dust-Choked', 'The Dying', 'The Echoing',
  'The Eldritch', 'The Endless', 'The Eternal', 'The Fallen', 'The Festering', 'The Flooded',
  'The Forbidden', 'The Forgotten', 'The Forsaken', 'The Fractured', 'The Frozen', 'The Gaping',
  'The Ghost-Haunted', 'The Grim', 'The Hollow', 'The Hungering', 'The Imprisoned', 'The Iron',
  'The Jagged', 'The Labyrinthine', 'The Lightless', 'The Lingering', 'The Locked', 'The Lost',
  'The Malign', 'The Misbegotten', 'The Mold-Thick', 'The Nameless', 'The Obsidian', 'The Old',
  'The Pale', 'The Petrified', 'The Poisoned', 'The Profaned', 'The Rotted', 'The Ruined',
  'The Salt-Crusted', 'The Sealed', 'The Shadow', 'The Shattered', 'The Silent', 'The Sinking',
  'The Skull-Carved', 'The Slumbering', 'The Smoke-Filled', 'The Sorrow-Steeped', 'The Stained',
  'The Starless', 'The Sunken', 'The Tainted', 'The Tomb-Deep', 'The Twisted', 'The Unlit',
  'The Unseen', 'The Vault of', 'The Vile', 'The Void', 'The Wretched',
];

const DUNGEON_MIDDLES = [
  // What it was / what it contains
  'Catacombs', 'Caverns', 'Chambers', 'Citadel', 'Crypt', 'Crypts', 'Depths',
  'Dungeon', 'Fortress', 'Galleries', 'Halls', 'Labyrinth', 'Mines', 'Passages',
  'Pit', 'Ruins', 'Sanctum', 'Spire', 'Temple', 'Tombs', 'Tower', 'Tunnels',
  'Vaults', 'Warren',
];

const DUNGEON_SUFFIXES_NAMES = [
  // Proper noun endings
  'Ashenmoor', 'Bael', 'Blackthorn', 'Bloodmere', 'Boneshear', 'Coldspire', 'Dawnfall',
  'Deathmarch', 'Duskwall', 'Emberveil', 'Frostgate', 'Gloomhaven', 'Gorethis', 'Grimstone',
  'Hellmarch', 'Ironheart', 'Ironveil', 'Jadespire', 'Keldrath', 'Korrath', 'Leadenmere',
  'Lifebane', 'Losthold', 'Malgrith', 'Mirethis', 'Morduin', 'Morokan', 'Morthas',
  'Nathrek', 'Nightfall', 'Noxspire', 'Oblivion', 'Palerock', 'Rashketh', 'Ravenstone',
  'Redmarch', 'Rothmere', 'Saltdepth', 'Shadowgate', 'Shardmere', 'Silentreach', 'Skarath',
  'Skullrock', 'Slatefall', 'Smokehaven', 'Sorvath', 'Soulbane', 'Sourwater', 'Stonedepth',
  'Stormveil', 'Thornwall', 'Tidemark', 'Tombreach', 'Torrath', 'Ulkran', 'Valketh',
  'Veilstone', 'Venomhold', 'Voidmere', 'Vuldrak', 'Wormholt', 'Wraithstone', 'Zalmeth',
];

// ─── POI Name Components ─────────────────────────────────────────────────────

const POI_DESCRIPTORS = [
  'Abandoned', 'Ancient', 'Arcane', 'Blasted', 'Bleeding', 'Blessed', 'Blighted', 'Broken',
  'Buried', 'Burnt', 'Carved', 'Chained', 'Claimed', 'Collapsed', 'Cracked', 'Crumbled',
  'Cursed', 'Dark', 'Dead', 'Defiled', 'Drowned', 'Dust-Covered', 'Echoing', 'Ember-Lit',
  'Empty', 'Enchanted', 'Endless', 'Enigmatic', 'Eroded', 'Fabled', 'Fallen', 'Famed',
  'Far', 'Fathomless', 'Fiend-Touched', 'Flame-Scarred', 'Floating', 'Forbidden', 'Forgotten',
  'Forsaken', 'Fractured', 'Frozen', 'Ghost-Lit', 'Glowing', 'Godless', 'Gold-Inlaid', 'Grand',
  'Hallowed', 'Haunted', 'Hidden', 'High', 'Hollow', 'Holy', 'Humming', 'Ice-Kissed',
  'Illuminated', 'Immovable', 'Infamous', 'Inscribed', 'Iron-Shod', 'Jagged', 'Jeweled',
  'Last', 'Leaning', 'Lichen-Covered', 'Lightless', 'Lone', 'Long-Lost', 'Lost', 'Low',
  'Luminous', 'Lurking', 'Midnight', 'Misty', 'Moonlit', 'Mossy', 'Mud-Sunken', 'Mysterious',
  'Nameless', 'Night-Dark', 'Obsidian', 'Old', 'Overgrown', 'Pale', 'Petrified', 'Pitted',
  'Profane', 'Proud', 'Radiant', 'Restored', 'Ruined', 'Runic', 'Sacred', 'Salt-Bleached',
  'Scarred', 'Sealed', 'Shadow-Draped', 'Shattered', 'Shifting', 'Shrouded', 'Silver-Veined',
  'Singing', 'Sinking', 'Skeletal', 'Smoke-Stained', 'Solitary', 'Sorrow-Worn', 'Spectral',
  'Star-Touched', 'Stone-Cold', 'Storm-Battered', 'Submerged', 'Sunken', 'Thorn-Wrapped',
  'Timeless', 'Toppled', 'Twisted', 'Unknown', 'Unlit', 'Unnamed', 'Unstable', 'Veiled',
  'Vine-Claimed', 'Void-Touched', 'Warded', 'Weed-Choked', 'Weathered', 'Windswept',
  'Witch-Marked', 'Worn', 'Wretched',
];

const POI_TYPES = [
  'Altar', 'Arch', 'Archive', 'Beacon', 'Bell Tower', 'Cairn', 'Causeway', 'Cenotaph',
  'Chapel', 'Cistern', 'Column', 'Crossing', 'Crypt', 'Dolmen', 'Effigy', 'Enclosure',
  'Forge', 'Fortification', 'Fountain', 'Gallery', 'Gate', 'Gatehouse', 'Graveyard',
  'Hall', 'Henge', 'Hollow', 'Idol', 'Inscription', 'Keep', 'Landmark', 'Library',
  'Lighthouse', 'Lodge', 'Marker', 'Mausoleum', 'Memorial', 'Mill', 'Mine', 'Monolith',
  'Monument', 'Mound', 'Observatory', 'Obelisk', 'Outpost', 'Palisade', 'Passage',
  'Path', 'Pillar', 'Portal', 'Post', 'Reliquary', 'Ritual Site', 'Ruin', 'Sanctuary',
  'Sepulchre', 'Settlement', 'Shrine', 'Signal Fire', 'Sinkhole', 'Spire', 'Standing Stone',
  'Station', 'Statue', 'Stele', 'Stone Circle', 'Stronghold', 'Temple', 'Tomb',
  'Tower', 'Vault', 'Waypost', 'Well', 'Wychwood',
];

// ─── Natural Wonder Name Components ─────────────────────────────────────────

const WONDER_DESCRIPTORS = [
  'Alabaster', 'Amber', 'Ancient', 'Ashen', 'Azure', 'Blazing', 'Bleeding', 'Blossoming',
  'Blue', 'Bone-White', 'Brazen', 'Bright', 'Brilliant', 'Bronze', 'Burning', 'Cascade',
  'Cerulean', 'Chartreuse', 'Chromatic', 'Cinder', 'Cinnabar', 'Cobalt', 'Copper', 'Coral',
  'Crimson', 'Crystal', 'Deep', 'Dusk', 'Dusky', 'Dwarf-Carved', 'Ebony', 'Elder',
  'Emerald', 'Endless', 'Eternal', 'Ever-Dark', 'Ever-Lit', 'Fathomless', 'Fern-Draped',
  'Fever', 'First', 'Flame', 'Fog-Wreathed', 'Frost', 'Frozen', 'Ghost-Lit', 'Gilded',
  'Glass', 'Glittering', 'Gold', 'Grand', 'Gray', 'Great', 'Green', 'Haunted',
  'High', 'Hollow', 'Honey', 'Howling', 'Humming', 'Icy', 'Jade', 'Jagged',
  'Jet', 'Last', 'Leaden', 'Living', 'Lone', 'Low', 'Luminous', 'Magma',
  'Midnight', 'Mist-Cloaked', 'Moonlit', 'Moonwashed', 'Mossy', 'Oaken', 'Obsidian', 'Ocean',
  'Old', 'Opal', 'Pallid', 'Pearl', 'Pearlescent', 'Perpetual', 'Phantom', 'Primeval',
  'Quartz', 'Rain-Carved', 'Rare', 'Red', 'Ringing', 'Roaring', 'Rose', 'Rusted',
  'Sacred', 'Sapphire', 'Scarlet', 'Sea', 'Shimmering', 'Silent', 'Silver', 'Singing',
  'Slate', 'Slow', 'Smoldering', 'Solitary', 'Star', 'Starlit', 'Steam', 'Stone',
  'Storm', 'Sunken', 'Sunlit', 'Swift', 'Thorn', 'Thunder', 'Tidal', 'Titan',
  'Twilight', 'Uncharted', 'Undying', 'Vast', 'Verdant', 'Vermillion', 'Violet', 'Viridian',
  'Voice', 'Wandering', 'White', 'Wild', 'Wind', 'Windswept', 'Winter',
];

const WONDER_TYPES = [
  'Abyss', 'Archway', 'Atoll', 'Basin', 'Bay', 'Beach', 'Bluff', 'Bog',
  'Bowl', 'Brine Pool', 'Caldera', 'Cascade', 'Cavern', 'Cavern System', 'Chasm', 'Cinder Cone',
  'Cliff', 'Cloud Forest', 'Col', 'Coral Shelf', 'Crater', 'Crevasse', 'Crown',
  'Current', 'Defile', 'Delta', 'Dunes', 'Estuary', 'Fall', 'Falls', 'Fen',
  'Fjord', 'Flats', 'Flood Plain', 'Fog Bank', 'Forest', 'Geyser', 'Geyser Field',
  'Glacier', 'Glen', 'Gorge', 'Grotto', 'Grove', 'Heights', 'Hot Spring',
  'Ice Field', 'Ice Sheet', 'Isthmus', 'Jungle', 'Karst', 'Kelp Forest', 'Labyrinth',
  'Lagoon', 'Lake', 'Lava Field', 'Lava Tube', 'Mangrove', 'Maelstrom', 'Marsh', 'Mesa',
  'Mire', 'Mist', 'Moraine', 'Moor', 'Mud Flats', 'Mud Volcano', 'Pass', 'Peat Bog',
  'Pinnacle', 'Plateau', 'Plunge Pool', 'Pool', 'Range', 'Rapids', 'Ravine', 'Reach',
  'Reef', 'Ridge', 'Rift', 'River', 'Salt Flat', 'Salt Lake', 'Sand Sea', 'Sea Stack',
  'Shore', 'Sink', 'Sound', 'Spring', 'Steppe', 'Stone Forest', 'Strait', 'Swamp',
  'Tide Pool', 'Tidal Flat', 'Tor', 'Tundra', 'Uplift', 'Vale', 'Valley', 'Vent Field',
  'Waterfall', 'Whirlpool', 'Wildwood',
];

// ─── Geographical Landmark Name Components ───────────────────────────────────

const LANDMARK_DESCRIPTORS = [
  'Ageless', 'Arching', 'Barren', 'Basalt', 'Battered', 'Bent', 'Black', 'Bleak',
  'Blind', 'Bone-Dry', 'Broken', 'Cairn', 'Calloused', 'Chalk', 'Chiseled', 'Cleft',
  'Cold', 'Colossal', 'Commanding', 'Contested', 'Cracked', 'Craggy', 'Crown', 'Curved',
  'Dead', 'Deep', 'Divided', 'Dour', 'Driven', 'Dry', 'Dusk', 'East',
  'Elder', 'Endless', 'Eroded', 'Famous', 'Far', 'Fissured', 'Flat', 'Formidable',
  'Fractured', 'Frozen', 'Giant', 'Gnarled', 'Granite', 'Grim', 'Hard', 'Harsh',
  'Haunted', 'High', 'Hollow', 'Howling', 'Hulking', 'Immovable', 'Impassable', 'Imposing',
  'Inland', 'Iron', 'Jagged', 'Jutting', 'Known', 'Landmark', 'Last', 'Lean',
  'Leaning', 'Legendary', 'Limestone', 'Lone', 'Long', 'Lost', 'Low', 'Looming',
  'Marble', 'Massive', 'Named', 'Narrow', 'North', 'Notched', 'Old', 'Outer',
  'Overgrown', 'Pale', 'Petrified', 'Pitted', 'Pointed', 'Proud', 'Rough', 'Salt',
  'Scarred', 'Sentinel', 'Sheer', 'Sheared', 'Slate', 'South', 'Storied', 'Storm-Cut',
  'Tall', 'Thousand-Year', 'Time-Worn', 'True', 'Twin', 'Unknown', 'Unmapped', 'Unscaled',
  'Vast', 'Veined', 'Volcanic', 'Watched', 'West', 'Wide', 'Wind-Carved',
];

const LANDMARK_TYPES = [
  'Arch', 'Arm', 'Ascent', 'Back', 'Barrow', 'Bight', 'Bluff', 'Break',
  'Bridge', 'Brow', 'Cap', 'Crest', 'Cut', 'Descent', 'Divide', 'Edge',
  'Escarpment', 'Face', 'Finger', 'Flank', 'Fork', 'Gap', 'Gate', 'Head',
  'Horn', 'Isle', 'Junction', 'Knob', 'Knoll', 'Massif', 'Mouth', 'Notch',
  'Overlook', 'Pass', 'Peak', 'Pinnacle', 'Pit', 'Plain', 'Plateau', 'Point',
  'Range', 'Reach', 'Ridge', 'Rise', 'Rock', 'Saddle', 'Scarp', 'Sentinel',
  'Shelf', 'Shoulder', 'Slope', 'Span', 'Spire', 'Spur', 'Stack', 'Step',
  'Summit', 'Table', 'Tarn', 'Throat', 'Tooth', 'Tower', 'Wall', 'Way',
];

// ─── Name Pool for Proper Nouns (used in landmark/wonder names) ──────────────

const PROPER_NOUNS = [
  "Aeon's", "Aldur's", "the Allfather's", "Anath's", "Ardath's", "Ash-King's",
  "Baelor's", "Baern's", "the Betrayer's", "the Blind God's", "Calavar's", "Caldris's",
  "the Chosen's", "the Conquerer's", "the Crushed King's", "Daern's", "the Damned",
  "the Dead God's", "the Deep Lord's", "Dorvath's", "Dralmar's", "Durvin's", "Edras's",
  "the Elder's", "the Eternal's", "the Exile's", "Faethos's", "the Fallen King's",
  "the Firstborn's", "Galadur's", "Galvar's", "the God-Eater's", "Gorthak's",
  "the Great Worm's", "the Grim Lord's", "Halveth's", "the Hanged King's", "Harnak's",
  "the Horned One's", "Ildar's", "the Iron Saint's", "Jalveth's", "Jarath's",
  "Kael's", "Kaldrath's", "the Last King's", "Lethara's", "the Living God's",
  "the Long-Dead's", "Malveth's", "the Nameless God's", "Narash's", "the Night God's",
  "the Old Dragon's", "the Old Empire's", "the Old King's", "Osrath's", "the Pale Queen's",
  "Qarath's", "the Quiet God's", "Raldath's", "Ralnor's", "the Risen Dead's",
  "Saldrath's", "the Sea God's", "the Shattered God's", "the Silver Empress's",
  "the Sky Father's", "the Sleeper's", "the Storm Lord's", "the Sun God's", "Taldrath's",
  "Talveth's", "the Titan's", "the Twin Gods'", "the Unbroken's", "Valdrath's",
  "Valnor's", "the Wanderer's", "the War God's", "the Watcher's", "Yaldrath's",
  "the Young King's", "Zareth's",
];

// ─── Seeded utilities ─────────────────────────────────────────────────────────

let usedNames = new Set<string>();

export function resetNameGenerator() {
  usedNames.clear();
}

function rndPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function unique(gen: () => string, maxAttempts = 200): string {
  for (let i = 0; i < maxAttempts; i++) {
    const name = gen();
    if (!usedNames.has(name)) {
      usedNames.add(name);
      return name;
    }
  }
  // Fall back to a guaranteed-unique name by appending a counter
  const base = gen();
  const final = `${base} (${usedNames.size})`;
  usedNames.add(final);
  return final;
}

// ─── Public generators ────────────────────────────────────────────────────────

export function generateCityName(): string {
  return unique(() => {
    const pattern = Math.floor(Math.random() * 4);
    switch (pattern) {
      case 0: {
        // Compound: prefix + suffix (e.g. "Irongate", "Stormhaven")
        const p = rndPick(CITY_PREFIXES);
        const s = rndPick(CITY_SUFFIXES);
        return p + capitalize(s);
      }
      case 1: {
        // Phonetic single word (e.g. "Keldrath", "Valmorn")
        const start = rndPick(CITY_NAME_STARTS);
        const end = rndPick(CITY_NAME_ENDS);
        return capitalize(start + end);
      }
      case 2: {
        // "The X" compound (e.g. "The Irongate", "Highstone")
        const p = rndPick(CITY_PREFIXES);
        const s = rndPick(CITY_SUFFIXES);
        return p + capitalize(s);
      }
      default: {
        // Three-part: prefix + middle syllable + suffix word
        const start = rndPick(CITY_NAME_STARTS);
        const end = rndPick(CITY_NAME_ENDS);
        const suf = rndPick(CITY_SUFFIXES);
        return capitalize(start + end) + capitalize(suf);
      }
    }
  });
}

export function generateDungeonName(): string {
  return unique(() => {
    const pattern = Math.floor(Math.random() * 3);
    switch (pattern) {
      case 0:
        // "The Cursed Catacombs of Keldrath"
        return `${rndPick(DUNGEON_PREFIXES)} ${rndPick(DUNGEON_MIDDLES)} of ${rndPick(DUNGEON_SUFFIXES_NAMES)}`;
      case 1:
        // "The Vault of Bone"
        return `The Vault of ${rndPick(DUNGEON_SUFFIXES_NAMES)}`;
      default:
        // "Keldrath's Crypt" / "The Dark Halls"
        return `${rndPick(DUNGEON_PREFIXES)} ${rndPick(DUNGEON_MIDDLES)}`;
    }
  });
}

export function generatePOIName(): string {
  return unique(() => {
    const pattern = Math.floor(Math.random() * 3);
    switch (pattern) {
      case 0:
        // "The Ancient Shrine"
        return `The ${rndPick(POI_DESCRIPTORS)} ${rndPick(POI_TYPES)}`;
      case 1:
        // "Kael's Vault"
        return `${rndPick(PROPER_NOUNS)} ${rndPick(POI_TYPES)}`;
      default:
        // "Forbidden Tower of Valnor"
        return `${rndPick(POI_DESCRIPTORS)} ${rndPick(POI_TYPES)} of ${rndPick(DUNGEON_SUFFIXES_NAMES)}`;
    }
  });
}

export function generateWonderName(): string {
  return unique(() => {
    const pattern = Math.floor(Math.random() * 3);
    switch (pattern) {
      case 0:
        // "The Emerald Falls"
        return `The ${rndPick(WONDER_DESCRIPTORS)} ${rndPick(WONDER_TYPES)}`;
      case 1:
        // "The Falls of Kael" / "The Sea of Jade"
        return `The ${rndPick(WONDER_TYPES)} of ${rndPick(PROPER_NOUNS).replace("'s", '')}`;
      default:
        // "Crimson Tide Lake"
        return `${rndPick(WONDER_DESCRIPTORS)} ${rndPick(WONDER_DESCRIPTORS)} ${rndPick(WONDER_TYPES)}`;
    }
  });
}

export function generateLandmarkName(): string {
  return unique(() => {
    const pattern = Math.floor(Math.random() * 3);
    switch (pattern) {
      case 0:
        // "The Broken Ridge"
        return `The ${rndPick(LANDMARK_DESCRIPTORS)} ${rndPick(LANDMARK_TYPES)}`;
      case 1:
        // "Kael's Peak" / "The Titan's Wall"
        return `${rndPick(PROPER_NOUNS)} ${rndPick(LANDMARK_TYPES)}`;
      default:
        // "Black Iron Spire"
        return `${rndPick(LANDMARK_DESCRIPTORS)} ${rndPick(LANDMARK_DESCRIPTORS)} ${rndPick(LANDMARK_TYPES)}`;
    }
  });
}
