/**
 * Ex Umbra Dungeon Simulator — client-side
 * Simulates the Ex Umbra framework for each dungeon/ruin/POI.
 * Generates history, aspects, rooms, encounters, CR tier, and NPC inhabtants.
 */

import { PointOfInterest } from '../types/world';

// ─── CR Tiers ───────────────────────────────────────────────────────────────

export interface CRTier {
  tier: 1 | 2 | 3 | 4;
  label: string;
  levelRange: string;
  crRange: string;
  description: string;
}

const CR_TIERS: CRTier[] = [
  { tier: 1, label: 'Perilous', levelRange: '1–4', crRange: 'CR ¼–CR 4', description: 'Suitable for novice adventurers. Goblins, bandits, undead shamblers, and minor hazards.' },
  { tier: 2, label: 'Deadly', levelRange: '5–10', crRange: 'CR 5–CR 10', description: 'Seasoned heroes required. Ogres, gnolls, cultists, and dangerous magic.' },
  { tier: 3, label: 'Lethal', levelRange: '11–16', crRange: 'CR 11–CR 16', description: 'Only veterans survive. Demon-touched guardians, ancient constructs, and elder undead.' },
  { tier: 4, label: 'Mythic', levelRange: '17–20', crRange: 'CR 17+', description: 'Legend-level threats. Dragons, demon lords, world-ending magic, and divine corruption.' },
];

// ─── Dungeon Data Tables ──────────────────────────────────────────────────────

const DUNGEON_ORIGINS = [
  'a dwarven vault sealed after the last great plague',
  'a military fortress abandoned when its garrison mutinied',
  'a temple to a god whose name has been deliberately forgotten',
  'the personal project of a mad archmage obsessed with immortality',
  'a natural cave system expanded by creatures over generations',
  'a necromancer\'s laboratory abandoned mid-experiment',
  'a thieves\' guild headquarters that fell to internal betrayal',
  'an ancient tomb built for a king who was never buried there',
  'a prison for a creature whose imprisonment became the dungeon\'s entire purpose',
  'a mine that broke through into something it shouldn\'t have',
  'a noble family\'s manor that sank into the earth during an earthquake',
  'a ritual space where the barrier between worlds is dangerously thin',
  'a wizard\'s tower that sank into the earth after a failed experiment',
  'a dwarven aqueduct whose lower sections flooded and were abandoned',
  'a thieves\' guild vault whose members were betrayed and slaughtered',
  'the collapsed palace of a dynasty no one remembers',
  'a fortification built against an enemy that never came — and then a different enemy did',
  'a monastery whose monks took an oath of silence that eventually became an oath of death',
  'a network of smuggling tunnels that outlasted the empire that built them',
  'a place where a lich prepared its phylactery and then forgot where they put it',
  'a gladiatorial pit whose crowds eventually became the entertainment',
  'a natural formation that a cult chose as their home for reasons that made sense at the time',
  'the underground half of a city that was built on the surface centuries later',
  'a treasury built so securely that the builders were killed to keep its location secret',
  'a library constructed to preserve forbidden knowledge and then sealed from the outside',
  'a siege tunnel that collapsed before it reached its target and was never cleared',
  'the sanctum of a secret society that was purged by the state three centuries ago',
  'a trading post that sank into the earth after undermining by years of underground flooding',
  'a barracks complex abandoned when the army it housed was destroyed in a single battle',
  'the private laboratory of an alchemist who was searching for something they should not have found',
  'a quarry that unearthed ruins far older than the civilization doing the quarrying',
  'a pilgrimage site that was sealed when the god it served was destroyed or overthrown',
  'a fortified waystation on an old road that was rerouted, leaving the garrison stranded',
  'a diplomatic compound that served as neutral ground until both sides decided neutrality was expensive',
  'the buried remains of an entire village that was deliberately sunk as a sacrifice',
  'an arcane academy whose students turned on their masters during a failed experiment',
  'a naval dry-dock that was sealed when the inland sea it served drained away over centuries',
  'a prison built specifically for magical criminals whose escape-proofing created the current problem',
  'a mine complex that broke into a natural cavern system inhabited by something ancient',
  'the catacombs beneath a city district that burned down and was never rebuilt over the entrance',
  'a fortified granary that became a last refuge and was sealed from the outside when the siege ended',
  'an observatory built into a hillside whose astronomers recorded something they were told to destroy',
  'the archive of a conquered empire, buried to prevent the victors from reading it',
  'a bathhouse complex beneath a wealthy district whose lower levels connected to older structures',
  'the testing ground of a golem-maker whose creations outlasted their creator by several centuries',
  'a command bunker sealed after its commanders decided they preferred not to emerge',
  'a thieves\' training ground that was betrayed to the authorities and sealed as a punishment',
  'a refuge for a persecuted religious minority that was found, and then sealed from the outside',
  'a natural cavern consecrated by each new culture that discovered it, adding a layer of purpose each time',
  'a water-treatment facility for a city that no longer exists, still performing its function regardless',
];

const DUNGEON_ASPECTS = [
  { name: 'The Rot', description: 'Fungal growth covers everything. The spores are mildly toxic and the larger growths move.' },
  { name: 'The Echo', description: 'Sounds travel strangely here — whispers carry through walls, footsteps seem to come from wrong directions.' },
  { name: 'The Hunger', description: 'Something in these depths is starving. It has been eating the smaller creatures for years.' },
  { name: 'The Archive', description: 'Someone recorded everything that happened here. The records are disturbing.' },
  { name: 'The Flood', description: 'Water fills the lower levels. Some passages are completely submerged.' },
  { name: 'The Collapse', description: 'The structure is compromised. Loud sounds or heavy impacts risk cave-ins.' },
  { name: 'The Haunt', description: 'The dead here cannot rest. They aren\'t angry — they\'re confused and frightened.' },
  { name: 'The Ward', description: 'Protective magic from the original builders still functions, sometimes harmfully.' },
  { name: 'The Inhabitant', description: 'Something intelligent has made this place its home and considers the dungeon its property.' },
  { name: 'The Ritual', description: 'An unfinished ceremony has left raw magical energy saturating the stone.' },
  { name: 'The Trap', description: 'The original builders were paranoid. The traps are clever and still functional.' },
  { name: 'The Corruption', description: 'A dark influence seeps from the deepest room, slowly changing whatever stays too long.' },
  { name: 'The Memory', description: 'Psychic impressions of past events replay in certain rooms. Not ghosts — just recordings.' },
  { name: 'The Competition', description: 'Another group is already in the dungeon — with the same goal, or worse.' },
  { name: 'The Silence', description: 'No ambient noise. The absence of sound is itself unnerving. Whispers carry further than they should.' },
  { name: 'The Cold', description: 'Temperature drops below freezing in the deeper sections. Breath fogs. Metal sticks to bare skin.' },
  { name: 'The Mold', description: 'Black mold covers the lower levels. It releases spores when disturbed. It has opinions.' },
  { name: 'The Watcher', description: 'Something has been observing the dungeon for decades. It has noted everything. It is not impressed.' },
  { name: 'The Door', description: 'One door that shouldn\'t be here leads somewhere that isn\'t on any map. It\'s been locked from the other side.' },
  { name: 'The Ledger', description: 'Someone tracked every death in this dungeon. The entries go back centuries. The handwriting never changes.' },
  { name: 'The Smoke', description: 'A low-lying haze that smells of something burned long ago. It doesn\'t come from anything visible.' },
  { name: 'The Wrongness', description: 'Nothing is visibly unusual. But something fundamental is off. Animals refuse to enter. Spells behave unexpectedly.' },
  { name: 'The Thirst', description: 'No water exists anywhere within. The walls seem to drink moisture from the air. Lips crack by the second level.' },
  { name: 'The Light', description: 'An ambient glow with no source. It illuminates everything and casts no shadows. Nothing is hidden here — so why is it terrifying?' },
  { name: 'The Gravity', description: 'Heavier in the lower sections. By the third level, torches burn sideways. By the fifth, the ceiling is tempting.' },
  { name: 'The Inversion', description: 'The dungeon is backwards — the safest rooms are deepest, the most dangerous are at the entrance.' },
  { name: 'The Mirror', description: 'Every surface that could be reflective is. Something in the reflections is one step behind the party.' },
  { name: 'The Network', description: 'The dungeon was designed for communication. The pipes and tubes are still functional. So is whoever is listening.' },
  { name: 'The Heat', description: 'Temperatures rise to dangerous levels in the deeper sections. Armour becomes a liability.' },
  { name: 'The Tide', description: 'Parts of the dungeon flood and drain on a schedule. Learning the schedule is the difference between survival and drowning.' },
  { name: 'The Growth', description: 'Vines, moss, and root systems have broken through from above. The forest is reclaiming these rooms methodically.' },
  { name: 'The Debt', description: 'Something in this dungeon knows what was taken from it. It is collecting, slowly, in kind.' },
  { name: 'The Argument', description: 'Two factions have been in conflict here for decades. They will briefly unite against intruders.' },
  { name: 'The Seal', description: 'Protective markings on every door and wall. Most are intact. A few have been scratched out.' },
  { name: 'The Sand', description: 'Fine dust covers everything to the depth of several inches. The tracks in it tell several different stories.' },
  { name: 'The Clock', description: 'Something here runs on a schedule. Every six hours, everything resets — traps re-arm, doors re-lock, guards respawn.' },
  { name: 'The Paradox', description: 'The dungeon is larger on the inside than it should be. Mapping it reveals this quickly. Explaining it doesn\'t help.' },
  { name: 'The Magnetism', description: 'Metal is attracted toward the deepest room. Armoured adventurers move slower. Arrows fly crooked.' },
  { name: 'The Whispers', description: 'Voices in a language no one speaks, giving what sounds like instructions. They are incorrect.' },
  { name: 'The Wound', description: 'The dungeon itself is injured. Cracks in the walls seep something that isn\'t water. It doesn\'t heal.' },
  { name: 'The Recursion', description: 'The same room appears at different points in the dungeon, slightly changed each time.' },
  { name: 'The Garden', description: 'A thriving underground garden, tended by something. The plants are beautiful and dangerous. Not necessarily in that order.' },
  { name: 'The Price', description: 'Every door opens freely, but something is taken. Nothing obvious. By the time you notice, you\'ve paid too much.' },
  { name: 'The Map', description: 'Someone mapped this dungeon obsessively. The maps are everywhere, increasingly panicked, and wrong in specific ways.' },
  { name: 'The Machine', description: 'Ancient clockwork mechanisms fill certain rooms, still running, purpose unknown. They respond to interference.' },
  { name: 'The Possession', description: 'Items left behind are occasionally moved. The dungeon\'s original inhabitants are making themselves useful.' },
  { name: 'The Disease', description: 'A sickness incubates here. Effects are subtle at first. By the time you notice, you\'ve been carrying it for a while.' },
  { name: 'The Art', description: 'Every surface is covered in murals that tell a story. The story gets darker the deeper you go. It hasn\'t ended yet.' },
  { name: 'The Absence', description: 'Food and water brought in disappear by the second day. Nothing eats them. They\'re simply gone.' },
  { name: 'The Invitation', description: 'The dungeon was designed to be found. The traps are theatrical, not lethal. Something is watching the performance.' },
  { name: 'The Covenant', description: 'Ancient agreements bind the creatures here. They cannot harm visitors who observe the original laws. No one knows the laws.' },
  { name: 'The Witness', description: 'Something has seen every person who ever entered. It remembers all of them. It would like to show you.' },
  { name: 'The Reversal', description: 'Magic cast here affects the caster as well as the target. Healing hurts. Damage heals. Buffs become debuffs.' },
  { name: 'The Counting', description: 'Something here counts. Footsteps, heartbeats, words spoken. When the count reaches its target, something happens.' },
  { name: 'The Children', description: 'Small things live here. Harmless individually, they are everywhere, and they report to something larger.' },
  { name: 'The Anchor', description: 'Teleportation fails inside these walls. Extradimensional spaces collapse. The dungeon holds what enters it.' },
  { name: 'The Sympathy', description: 'Damage done to the dungeon\'s structure is felt by whoever caused it. The walls bleed. So do you.' },
  { name: 'The Old Owner', description: 'Whatever originally lived here never left. It is patient. It has been waiting for someone capable of a conversation.' },
  { name: 'The Trial', description: 'The dungeon was designed as a test. The criteria are not obvious. The examiner is still present.' },
  { name: 'The Replacement', description: 'Items brought in are quietly replaced with identical-looking counterfeits. The originals are somewhere in the dungeon.' },
  { name: 'The Loyalty', description: 'The dungeon\'s creatures are fanatically devoted to the boss. Not through fear — through genuine belief.' },
];

const ROOM_TYPES = [
  { name: 'Entry Hall', role: 'transition', description: 'The threshold between the outside world and whatever lies within.' },
  { name: 'Guard Post', role: 'encounter', description: 'Once manned by sentries. Something still watches.' },
  { name: 'The Shrine', role: 'lore', description: 'A place of worship or ritual. The deity or purpose it served is unclear.' },
  { name: 'Barracks', role: 'encounter', description: 'Sleeping quarters for inhabitants past and present.' },
  { name: 'The Vault', role: 'reward', description: 'Locked, protected, and containing something valuable.' },
  { name: 'The Laboratory', role: 'lore', description: 'Experiments were conducted here. Some may still be running.' },
  { name: 'The Throne Room', role: 'boss', description: 'Whoever runs this place receives visitors here.' },
  { name: 'The Pit', role: 'hazard', description: 'A descent into darkness. Something at the bottom may not be dead.' },
  { name: 'The Ossuary', role: 'lore', description: 'Bones stored with care or carelessness — either way there are too many.' },
  { name: 'The Forge', role: 'encounter', description: 'Weapons were made here. The bellows are cold but the tools remain.' },
  { name: 'The Garden', role: 'hazard', description: 'Something grows in the dark. It doesn\'t need sunlight.' },
  { name: 'The Hall of Records', role: 'lore', description: 'Documents, carvings, or inscriptions that tell the dungeon\'s story.' },
  { name: 'The Prison', role: 'encounter', description: 'Cells, chains, and something that may still be imprisoned.' },
  { name: 'The Sanctum', role: 'boss', description: 'The innermost room. The reason the dungeon exists.' },
  { name: 'The Collapse', role: 'hazard', description: 'Rubble and unstable passages. Traversable but dangerous.' },
  { name: 'The Antechamber', role: 'transition', description: 'A waiting room that once held supplicants. The benches are still here.' },
  { name: 'The Gallery', role: 'lore', description: 'Portraits or statues of those who once inhabited this place. Some have been defaced.' },
  { name: 'The Reliquary', role: 'reward', description: 'A room built to house sacred objects. Most are gone. Not all.' },
  { name: 'The Cistern', role: 'hazard', description: 'A water storage chamber. The water is old. Something lives in it.' },
  { name: 'The Summoning Room', role: 'encounter', description: 'The circle is still intact. Whatever was summoned may still be bound.' },
  { name: 'The Dining Hall', role: 'encounter', description: 'The long table is still set for a meal that was never eaten.' },
  { name: 'The Machine Room', role: 'hazard', description: 'Ancient mechanisms, still moving. Their purpose is unclear. Their danger is not.' },
  { name: 'The Escape Tunnel', role: 'transition', description: 'A hidden passage for emergency exit. Where it leads is the question.' },
];

// ─── Boss Types — 30+ per tier ────────────────────────────────────────────────

const BOSS_TYPES: Record<number, string[]> = {
  1: [
    'Goblin Warchief', 'Skeleton Champion', 'Bandit Captain', 'Giant Spider Queen', 'Cultist Leader',
    'Wererat Alpha', 'Zombie Lord', 'Bugbear Chief', 'Kobold Sorcerer-King', 'Stirge Mother',
    'Hobgoblin Sergeant', 'Giant Centipede Broodmother', 'Gnoll Pack Leader', 'Vine Blight Elder',
    'Ghoul Pack Alpha', 'Animated Armor Overseer', 'Swarm of Rats Gestalt', 'Dark Acolyte (Necromancer Apprentice)',
    'Orc Raider Commander', 'Will-o-Wisp Hive Mind', 'Doppelganger Infiltrator', 'Mimic Colony Patriarch',
    'Svirfneblin Warlock Renegade', 'Troglodyte Warchanter', 'Needle Blight Prophet',
    'Darkling Elder', 'Quickling Trickster-Chief', 'Shadow Demon (weakened)', 'Imp Familiar Gone Rogue',
    'Faerie Dragon Tormenter', 'Lizardfolk Shaman', 'Kenku Flock Mastermind',
  ],
  2: [
    'Ogre Mage', 'Vampire Spawn Bloodlord', 'Gnoll Flind', 'Young Dragon', 'Death Knight (fallen paladin)',
    'Mind Flayer Aberrant', 'Succubus/Incubus Manipulator', 'Night Hag', 'Rakshasa Minor',
    'Oni Warlord', 'Banshee', 'Medusa', 'Werewolf Alpha', 'Yuan-ti Malison', 'Revenant Champion',
    'Githyanki Warrior-Mage', 'Duergar Overlord', 'Ettin War-Chief', 'Stone Giant Shaman',
    'Flesh Golem Overseer', 'Wraith Overlord', 'Manticore Matriarch', 'Basilisk Ancient',
    'Wyvern Matron', 'Sea Hag Witch', 'Chasme Demon Overseer', 'Mezzoloth Commander',
    'Drider Webweaver', 'Cyclops Warmaster', 'Invisible Stalker Pack Leader',
    'Troll Regenerator-King', 'Chimera Alpha',
  ],
  3: [
    'Adult Dragon', 'Lich (weakened)', 'Demon Lord\'s Champion', 'Ancient Golem Colossus',
    'Night Hag Coven Mistress', 'Beholder Overseer', 'Aboleth Elder', 'Vampire Lord',
    'Githzerai Monk-Ascendant', 'Chain Devil Overlord', 'Erinyes General', 'Glabrezu Commander',
    'Storm Giant Warlord', 'Frost Giant Jarl', 'Fire Giant Forge-King', 'Clay Golem Behemoth',
    'Iron Golem Guardian', 'Mummy Lord', 'Nalfeshnee Demon', 'Horned Devil Captain',
    'Adult Shadow Dragon', 'Azer Forge-Warden', 'Purple Worm Nest Queen', 'Roc Nest Guardian',
    'Remorhaz Matriarch', 'Dao Grand Vizier', 'Djinni War-Sultan', 'Efreeti Flame-Tyrant',
    'Marilith Strategist', 'Archmage Lich Apprentice', 'Bodak Deathbringer',
  ],
  4: [
    'Ancient Dragon', 'Lich Archlich', 'Archdevil\'s Avatar', 'Demon Prince Manifestation',
    'Elder Brain', 'Tarrasque Fragment', 'Pit Fiend Lord', 'Balor Warlord',
    'Ancient Dracolich', 'Archfey Exile', 'Solar (Fallen)', 'Planetar Champion of Darkness',
    'Empyrean Corrupted', 'Zaratan Elder', 'Kraken Ancient', 'Elder Tempest',
    'Atropal (Near-Manifest)', 'Acererak\'s Echo', 'Aspect of Orcus', 'Aspect of Demogorgon',
    'Gnoll Fang of Yeenoghu (Chosen)', 'Elder Brain Dragon', 'God-Brain Shard',
    'Sibriex Warper', 'Ancient Oblex Collective', 'Star Spawn Larva Mage',
    'Mezodemonic Overlord', 'Annis Hag Coven Queen', 'Lich of the Sealed Tower',
    'Abyssal Titan Construct', 'Dream Eater Ancient', 'Void Dragon Primordial',
  ],
};

// ─── Minion Types — 30+ per tier ─────────────────────────────────────────────

const MINION_TYPES: Record<number, string[]> = {
  1: [
    'Goblins', 'Skeletons', 'Bandits', 'Giant Rats', 'Kobolds', 'Zombies',
    'Giant Bats', 'Stirges', 'Cultist Initiates', 'Hobgoblins', 'Troglodytes',
    'Vine Blights', 'Twig Blights', 'Needle Blights', 'Giant Centipedes',
    'Swarms of Insects', 'Swarms of Rats', 'Animated Objects', 'Shadows (minor)',
    'Gnolls (scouts)', 'Orcs (raiders)', 'Drow (scouts)', 'Quasits',
    'Imps', 'Doppelgangers (one or two)', 'Kenku', 'Kuo-toa',
    'Lizardfolk', 'Merrow (if flooded)', 'Myconid Sprouts',
    'Mud Mephits', 'Dust Mephits',
  ],
  2: [
    'Orcs', 'Gnolls', 'Cultists (experienced)', 'Ogres', 'Ghasts', 'Wererats',
    'Gargoyles', 'Duergar Warriors', 'Drow Elite', 'Gricks', 'Chuuls',
    'Nothics', 'Phase Spiders', 'Carrion Crawlers', 'Mummies (lesser)',
    'Wights', 'Specters', 'Will-o-Wisps', 'Ettins (lone)', 'Harpies',
    'Sahuagin (war party)', 'Kuo-toa Archpriest retinue', 'Berserker Cultists',
    'Winged Kobolds', 'Yuan-ti Purebloods', 'Green Hag assistants',
    'Smoke Mephits', 'Ice Mephits', 'Magma Mephits', 'Merrow war-band',
    'Githyanki Soldiers', 'Lamia Servants',
  ],
  3: [
    'Demons (lesser)', 'Undead Knights', 'Mind-Controlled Soldiers', 'Flesh Golems', 'Shadows', 'Wights',
    'Vrocks (lesser demons)', 'Hezrous', 'Bearded Devils', 'Bone Devils',
    'Death Knights (bound)', 'Liches (bound servants)', 'Drow Matrons (lesser)',
    'Githyanki War Band', 'Stone Giants (thralls)', 'Cloud Giants (enslaved)',
    'Vampire Spawn (elite)', 'Nightwalker Scouts', 'Nycaloths',
    'Yochlol (handmaidens)', 'Mezzoloth legions', 'Ultroloth captains',
    'Bodaks', 'Dao Shock Troops', 'Marut Inevitables',
    'Mordenkainen\'s Sword constructs', 'Helmed Horrors', 'Shield Guardians',
    'Arcanaloth advisors', 'Cambion officers', 'Elder Gargoyles',
  ],
  4: [
    'Demons (greater)', 'Undead Dragons', 'Death Knights', 'Pit Fiends', 'Ancient Undead', 'Aboleths',
    'Balors', 'Mariliths (elite)', 'Glabrezus (elite)', 'Nalfeshness (horde)',
    'Ultroloths', 'Arcanoloths', 'Night Hag covens', 'Ancient Vampires',
    'Dracoliches (young)', 'Storm Giant Quintessents', 'Divine Guardians (corrupted)',
    'Elder Oblex', 'Star Spawn Manglers (swarms)', 'Astral Dreadnoughts (bound)',
    'Void Wraiths', 'Shadow Demons (legions)', 'Soul Mongers',
    'Bone Nagas (elders)', 'Amnizu Devil Commanders', 'Nupperibo Masses',
    'Chain Devil Torture-Masters', 'Erinyes Captains', 'Horned Devil Shock Troops',
    'Ancient Crawling Claws (masses)', 'Deathlocks', 'Undead Archmages',
  ],
};

// ─── Traps — 20+ per tier ────────────────────────────────────────────────────

const TRAPS: Record<number, string[]> = {
  1: [
    'Pit trap (DC 12 Perception, 2d6 fall damage)',
    'Tripwire alarm (alerts all inhabitants in a 60-ft radius)',
    'Poison dart (DC 12 Con save, 1d4 poison damage per turn for 1 minute)',
    'Falling block (DC 13 Dex, 3d6 bludgeoning)',
    'Pressure plate spike floor (DC 11 Perception, 2d4 piercing)',
    'Rigged door — swings to knock intruders back (DC 12 Dex, 1d6 and knocked prone)',
    'Bear trap (DC 13 Perception, 1d6 piercing, speed 0 until DC 12 Str check to open)',
    'Noisemaker wire (clanging pots alert nearby creatures, no damage)',
    'Collapsing staircase (DC 14 Dex or fall 10 ft for 1d6 damage)',
    'Greased floor panel (DC 12 Acrobatics or fall prone)',
    'Net trap (DC 12 Perception, DC 12 Str to escape, restrained)',
    'Crude fire-pot above door (DC 11 Perception, 1d6 fire on a miss-trigger)',
    'Animated caltrops scatter (DC 10 Acrobatics or speed halved for 1 hour)',
    'Locked box with spring-loaded blade (DC 13 Thieves\' Tools or 1d8 slashing)',
    'Rotting floor (DC 12 Perception; fall through for 2d6 fall damage)',
    'Sewage flood pipe (DC 11 Perception; blinded and slowed if triggered)',
    'Loose block overhead (DC 12 Perception; 2d6 if disturbed by noise)',
    'Crossbow mounted in niche (DC 13 Perception, +4 to hit, 1d8 piercing)',
    'Ink-fog canister (blinds room for 1 minute, DC 12 Con or blinded)',
    'Whistling wire sends coded signal to guard post two rooms away',
  ],
  2: [
    'Magical ward (DC 14 Arcana, 4d6 force damage)',
    'Collapsing ceiling (DC 15 Dex save, 6d6 bludgeoning)',
    'Glyph of warding — thunder burst (DC 15 Dex, 5d8 thunder)',
    'Maze illusion (DC 14 Wis save or lost for 1 hour in looping corridors)',
    'Blade pendulum corridor (DC 14 Dex save each round, 3d6 slashing)',
    'Acid spray jets (DC 13 Dex, 3d8 acid, equipment takes damage)',
    'Symbol of fear (DC 14 Wis save or frightened for 1 minute)',
    'Magical silence trap (zone of silence activates, alerting ambushers)',
    'Stone-sealing door (locks behind party, DC 15 Str to open manually)',
    'Phantom guardian animates from statue (CR 4 equivalent, fights until destroyed)',
    'Sleep gas canister (DC 14 Con save or unconscious for 10 minutes)',
    'Reverse gravity section (DC 15 Dex or fall to ceiling for 2d6)',
    'Lightning rune floor tile (DC 14 Dex, 4d6 lightning in 10-ft radius)',
    'Mirror reflection clone (fights party with their own abilities, half HP)',
    'Flooding chamber (DC 13 Athletics each round or take 1d6 per round, exits seal)',
    'Memory wipe glyph (DC 14 Int save or forget the last 10 minutes)',
    'Spiked wall closers (DC 15 Str to hold; 4d8 piercing if walls meet)',
    'Cursed threshold (DC 14 Wis; disadvantage on attacks until short rest)',
    'Alarm golem (alerts boss directly, cannot be disabled without correct command word)',
    'Poison mist cloud (DC 13 Con; poisoned and 2d6 poison per round until exit)',
  ],
  3: [
    'Symbol of death (DC 17 Con save, 10d10 necrotic damage)',
    'Temporal trap (DC 16 Wis save or age 1d6 years, cumulative)',
    'Planar rift (DC 18 Str save or pulled to Shadowfell, exit takes 1d4 hours)',
    'Disintegration beam (DC 18 Dex, 10d6+40 force damage)',
    'Necromantic pulse (DC 16 Con; max HP halved until long rest)',
    'Maze of mirrors — soul trap (DC 17 Wis; soul imprisoned if HP reaches 0 inside)',
    'Antimagic field corridor (spells fail, magic items deactivate while inside)',
    'Guardian construct pair activates (CR 11 equivalent each, flanking)',
    'Flesh-melting acid pit (DC 16 Dex; fall in for 6d8 acid, armor destroyed on 1)',
    'Confusion rune (DC 16 Int; confused for 1 minute per creature entering)',
    'Soul-severing ward (DC 17 Wis; disadvantage on all saves for 24 hours)',
    'Gravity inversion room (floor becomes ceiling; DC 16 Dex or fall 30 ft)',
    'Living poison cloud (cloud is semi-intelligent, DC 16 Con, pursues intruders 2 rounds)',
    'Petrification beam (DC 17 Con save; restrained, then petrified on fail)',
    'Volcanic vent eruption (DC 16 Dex; 8d8 fire in 20-ft radius, tunnel collapses)',
    'Insanity field (DC 17 Wis; random short-term madness for 24 hours)',
    'Crushing ceiling (DC 17 Str; 10d6 bludgeoning + restrained)',
    'Time-lock room (DC 17 Int; anyone who fails is frozen in time for 1 hour)',
    'Empowered glyph chain (triggers three glyphs simultaneously; multiple saves required)',
    'Phase trap (DC 16 Con; shifted partially out of phase — can\'t interact with world for 1d4 rounds)',
  ],
  4: [
    'Reality anchor (DC 20 Con save; spellcasters lose all spell slots)',
    'Soul cage trap (DC 20 Cha save or soul imprisoned in gem)',
    'Annihilation field (DC 22 Dex save or die; success takes 10d10 force)',
    'Wish-eater rune (DC 20 Int; magic items permanently suppressed for 1 week)',
    'Divine-killing ward (DC 20 Con; divine spellcasters lose channel divinity and highest slot)',
    'Temporal loop (DC 20 Wis; reset to room entrance, no memory of what happened)',
    'Identity dissolution trap (DC 21 Wis; character loses class features for 24 hours)',
    'Void rift (DC 22 Str; pulled into the Far Realm for 1d6 rounds — makes madness saves)',
    'Anti-resurrection field (creatures that die here cannot be resurrected by any means)',
    'Probability inversion (DC 20 Wis; natural 20s count as 1s for 1 minute)',
    'Astral projection anchor (DC 21 Con; soul leaves body — body continues fighting against party)',
    'Divine attention trigger (deity notices party; chooses reaction based on alignment)',
    'Legendary trap — three saves in sequence (failure on any triggers the next, worse effect)',
    'Memory palace prison (DC 21 Int; trapped in shared mindscape with one party member)',
    'Entropy bomb (DC 22 Con; all items age and crumble — mundane items destroyed, magic items roll save)',
    'Planeshift trap (DC 22 Wis; entire party shifted to random outer plane)',
    'True name extractor (DC 20 Cha; boss learns party members\' true names — advantage on all saves vs. their abilities)',
    'Kill-switch rune (DC 20 Con; constructs in dungeon gain new objective: kill party)',
    'Undying loop (DC 21 Wis; each time a party member dies here, they rise as an undead servant of the dungeon)',
    'Curse of unmaking (DC 22 Wis; character loses one ability score point permanently)',
  ],
};

// ─── Rewards — 20+ per tier ──────────────────────────────────────────────────

const REWARDS: Record<number, string[]> = {
  1: [
    '50–200 gp in mixed coin',
    'A +1 weapon or armor',
    'Potions of healing (1d4)',
    'A low-level spell scroll (1st or 2nd level)',
    'A minor magic trinket with a single daily use',
    'Gems worth 100 gp total',
    'A set of masterwork thieves\' tools',
    'A deed to a small building in the nearest city',
    'A beast companion egg or juvenile familiar',
    'Detailed maps of the local dungeon network',
    'A faction token granting one free favour from a minor guild',
    'A set of alchemical ingredients worth 150 gp',
    'A carved wooden holy symbol that hums faintly at dawn',
    'Letters of introduction to a powerful merchant family',
    'A potion of poison (useful as weapon coating)',
    'A set of enchanted manacles that also function as a tracking device',
    'A well-preserved journal from the dungeon\'s previous occupant',
    'A minor ring of protection (+1 AC, attunement)',
    'A quiver of 10 +1 arrows or bolts',
    'A potion of climbing plus a 50-ft silk rope coiled inside a bag of holding (small)',
  ],
  2: [
    '500–2,000 gp in coin and gems',
    'A +2 weapon or uncommon magic item',
    'Spell scrolls (3rd–5th level, 1d3 of them)',
    'A rare potion (heroism, greater healing, or similar)',
    'A map leading to a greater location or lost ruin',
    'A faction\'s stolen property — worth recovering for the reward',
    'An uncommon wondrous item (cloak of protection, bag of holding, etc.)',
    'A trained riding beast of exceptional quality',
    'Access to a planar pocket containing 3,000 gp in trade goods',
    'A sealed letter from a dead noble with legal weight if delivered',
    'A tome granting +2 to a skill permanently (once read, 48 hours)',
    'A bottled elemental spirit usable once as a 5th-level conjure elemental',
    'A pair of boots of striding and springing',
    'A circlet of blasting (3 charges, 4d6 radiant, DC 15)',
    'A rod of the pact keeper +1 or similar class-specific item',
    'A chest containing 10 doses of a rare poison or alchemical substance',
    'A deed to a fortified waystation along a trade route',
    'A speaking stone linked to a wizard\'s tower (speak once per week)',
    'A legendary recipe or formula worth 800 gp to the right alchemist',
    'A writ of passage signed by a faction leader, valid in six cities',
  ],
  3: [
    '5,000–20,000 gp in treasure',
    'A rare or very rare magic item',
    'High-level spell scrolls (6th–8th level, 1d3 of them)',
    'A legendary component needed for a world-affecting ritual',
    'A bound elemental or captured spirit, one use as a 7th-level spell',
    'Ancient knowledge worth a major faction\'s lasting gratitude',
    'A very rare wondrous item (cloak of invisibility, manual of golems, etc.)',
    'The location of a hidden vault containing further treasures',
    'A title to a minor noble estate with a functioning staff',
    'A phylactery fragment — valuable to those hunting a specific lich',
    'A contract of service from a powerful NPC (one year of aid)',
    'A set of plate armor +2 with a property unique to this dungeon\'s history',
    'A staff of the magi (partially charged, 4d6+10 charges remaining)',
    'Three wishes granted by a genie freed from long captivity (limited scope)',
    'Access to a demiplane accessible only from this location',
    'A scroll of true resurrection, heavily protected against theft',
    'A living spell (sentient, bound to party leader) that acts once per day',
    'A bardic instrument of the bards (very rare variety)',
    'A set of ioun stones (3 different types, found separately)',
    'The true name of a devil or demon — vast leverage in the right negotiations',
  ],
  4: [
    '20,000+ gp in legendary loot',
    'A legendary magic item or artifact',
    '9th-level spell scrolls (one or two)',
    'The key to stopping a world-level threat',
    'A fragment of divine power (equivalent to a demigod boon)',
    'Something the gods want kept hidden',
    'An artifact weapon, armor, or item tied to the dungeon\'s origin',
    'The ability to call on a legendary creature as an ally once',
    'A gate key granting permanent access to a chosen outer plane',
    'A wish spell inscribed on a permanent, unsealed stone tablet',
    'The resurrection of a world-historical figure, bound to serve the party',
    'A divine revelation — each party member gains a permanent +1 to any ability score',
    'A deck of many things (safely contained, all cards present)',
    'A working spelljamming helm or equivalent extraplanar transport device',
    'A book of exalted deeds or book of vile darkness (sealed, usable)',
    'The binding covenant of a god — one favor of immense scope',
    'A complete set of armor of invulnerability',
    'The phylactery of a known lich — leverage or destruction',
    'Access to a library of forbidden divine knowledge (10 unique spells)',
    'A relic of the old world — civilization-changing in the right hands',
  ],
};

// ─── Secrets — 20+ per tier ──────────────────────────────────────────────────

const SECRETS: Record<number, string[]> = {
  1: [
    'The dungeon\'s creator isn\'t dead — they\'re hiding in plain sight nearby.',
    'A trapped NPC inside the dungeon has been a prisoner for years.',
    'The boss works for someone the party has already met.',
    'The treasure isn\'t what it appears to be.',
    'One of the dungeon\'s inhabitants wants to defect and will aid the party if approached correctly.',
    'The dungeon was intentionally unsealed — someone wants the party to go in.',
    'A map on the bottom level reveals a second, hidden dungeon nearby.',
    'The boss was hired, not born here; their employer is still waiting for results.',
    'A long-dead adventurer\'s ghost haunts one room, not hostile, but desperate to communicate.',
    'The "treasure" at the bottom is bait. The real treasure was hidden in the first room.',
    'The dungeon is built atop an older one. The original owners are still on the lower level.',
    'The boss has a twin who doesn\'t know this place exists — the twin is in town.',
    'One of the traps was deliberately left disabled by a previous group who plans to return.',
    'The dungeon\'s founder was a hero who became what they feared — a journal explains why.',
    'The dungeon was built to contain something that has already left through a back exit.',
    'Three separate factions hired three separate parties to explore this dungeon this week.',
    'The apparent boss is a decoy; the real leader operates from a room the maps don\'t show.',
    'A simple act of kindness to a creature here will unlock an area that violence cannot.',
    'The dungeon was built as a home. Someone was evicted. They want it back.',
    'The treasure, if taken, is magically tracked. The real owners are already on their way.',
  ],
  2: [
    'The dungeon is a test — someone is watching to evaluate the party.',
    'The boss can be reasoned with, but only through a specific ritual or phrase.',
    'Something in the dungeon is innocent and doesn\'t belong here.',
    'The dungeon is slowly moving — it will be somewhere else next month.',
    'The boss is protecting the dungeon\'s treasure from a worse threat, not hoarding it.',
    'A faction the party trusts sent an agent here first. The agent has gone silent — and sided with the enemy.',
    'The dungeon was built by the same civilization that built a city the party visited. There are connections.',
    'The treasure was cursed by the previous adventurers who found it. Their bones are nearby.',
    'The dungeon\'s boss answers to something deeper in. Defeating the boss awakens it.',
    'A secret passage connects this dungeon to a location of political significance in the nearest city.',
    'One room in this dungeon is a failed attempt at a demiplane — it has its own mini-ecosystem.',
    'The dungeon was originally a school. The students never left. They are the monsters.',
    'The supposed villain is actually the victim. The actual villain is the faction that sent the party here.',
    'An ancient truce prevents the dungeon\'s creatures from attacking if specific conditions are met.',
    'The dungeon\'s walls are semi-alive. They\'ve been recording. They will share the recordings if asked correctly.',
    'The boss is the last of its kind and knows it. It is building an ark.',
    'A second entrance exists that bypasses all traps. It requires the name of the dungeon\'s builder to open.',
    'The dungeon is a prison, but the party\'s target is the jailer, not the prisoner.',
    'This dungeon is mirrored by one on another plane. Whatever happens here happens there too.',
    'The treasure is real, but taking it severs the party\'s connection to a higher power they haven\'t noticed yet.',
  ],
  3: [
    'The dungeon is a prison, not a lair — what\'s inside is meant to be contained.',
    'Clearing the dungeon will trigger a larger threat the party didn\'t expect.',
    'The boss was once a hero. Something here caused them to fall.',
    'The treasure is a trap — taking it initiates a binding contract with a devil.',
    'The dungeon exists in two realities simultaneously at certain times of day.',
    'Every creature in the dungeon is bound here by a name-curse. Speaking the right name frees them.',
    'The dungeon\'s creator is still alive and has been watching through the walls for a century.',
    'The boss serves a god the party\'s patron opposes. Defeating it triggers divine political fallout.',
    'A member of a faction that hired the party is the dungeon\'s actual architect.',
    'Removing the artifact from the dungeon removes the seal on something much worse below it.',
    'Three previous parties attempted this. Each one added to the dungeon\'s defenses. Their notes are inside.',
    'The dungeon\'s boss is the same entity as the artifact being sought — one cannot exist without the other.',
    'This dungeon is a node in a network. Destroying it sends a signal to eleven other nodes.',
    'The dungeon was built to contain a disease. The party has already been exposed.',
    'The real dungeon hasn\'t started yet. This is the antechamber.',
    'The boss is maintaining a ward that is the only thing preventing an undead apocalypse in the region.',
    'The dungeon\'s layout is a map. Followed correctly, it leads to something worth more than everything inside.',
    'Every death in the dungeon makes the boss stronger. The party has already helped.',
    'The dungeon is aware of the party\'s true names. It plans to use them.',
    'A second group entered three days ago. The dungeon has already reconfigured to trap both parties together.',
  ],
  4: [
    'The dungeon exists in two realities simultaneously. The real threat is in the other one.',
    'The boss is not the final threat — defeating it unlocks something worse.',
    'The dungeon is a god\'s dream. Killing the boss wakes the god.',
    'Victory is impossible by force — the solution is something else entirely.',
    'The dungeon is the god. It has been alive the entire time. The party has been inside a being.',
    'The artifact here is the soul of a living person. Taking it kills them. Leaving it kills the world.',
    'The dungeon exists outside of time. Events that happen here have already happened elsewhere, with different outcomes.',
    'The boss is the only thing keeping the dungeon from merging with the plane of destruction.',
    'Every legendary dungeon in the known world is connected to this one. They share a single soul.',
    'The dungeon was built by a god who lost a war. The dungeon is their tomb. The boss is their last servant.',
    'The party\'s patron sent them here because the patron is compromised. The dungeon knows this and is trying to tell them.',
    'The treasure is the party\'s own future selves, imprisoned here to prevent a specific event.',
    'The dungeon will follow the party when they leave. It has chosen them as its new location.',
    'The boss is seeking death, not victory. It requires a killing blow from a specific type of weapon that no one in the party has — yet.',
    'Completing the dungeon completes a ritual that was begun two hundred years ago by people who intended something very different.',
    'The dungeon is a voting mechanism. The party\'s actions here will decide which of two deities gains dominion over a domain.',
    'The true dungeon master is a lich whose phylactery is the party leader\'s most prized possession.',
    'The final room contains a choice. Both options are terrible. The dungeon has been engineering the party toward the worse one.',
    'The dungeon is a test set by the party\'s patron deity. Failure means abandonment; success means a burden no one asked for.',
    'The dungeon has been waiting for this specific party for centuries. It prepared everything for them. This was always going to happen.',
  ],
};

// ─── Natural Wonder Data ─────────────────────────────────────────────────────

const WONDER_ORIGINS = [
  'a convergence of ley lines so powerful the landscape itself was reshaped',
  'the burial site of a primordial elemental whose body became the terrain',
  'the impact crater of a shard of a fallen star',
  'the remains of a divine battle that scarred the earth permanently',
  'an ancient experiment by a god who has since abandoned this world',
  'a place where the boundary between planes is permanently thin',
  'the site where a world-tree once grew before it was destroyed',
  'a natural phenomenon so old it predates the current age of the world',
  'the crystallized remnants of a magical cataclysm from the first age',
  'a location where the raw stuff of creation bubbles to the surface',
  'the footprint of a primordial titan that walked this land before mortals existed',
  'an ocean of magical energy that solidified into terrain during the age of chaos',
  'the exhalation of a sleeping elder dragon whose dreams reshaped the earth around it',
  'a wound in the world that never healed after a god died here',
  'the site where two elemental planes intersected for one catastrophic moment',
  'a node in the world\'s magical circulatory system, exposed to the surface',
  'the anchoring point of a planar bridge that collapsed but left its foundations',
  'the resting place of a constellation that fell from the sky during the first winter',
  'a place where time moves differently — the landscape shows multiple eras simultaneously',
  'the heart of a storm that has been running continuously for eight hundred years',
];

const WONDER_ASPECTS = [
  { name: 'The Pulse', description: 'The ground here beats with a slow rhythm. Animals grow calm. Spellcasters feel their power sharpen.' },
  { name: 'The Perpetual Storm', description: 'Lightning strikes in the same places every hour. The thunderclaps never echo.' },
  { name: 'The Reversal', description: 'Water flows upward here. Flames burn cold. Compasses spin uselessly.' },
  { name: 'The Song', description: 'A sound that isn\'t quite music emanates from somewhere below. It has words, if you listen long enough.' },
  { name: 'The Bloom', description: 'Plants grow here in hours what takes years elsewhere. Some of them should not exist.' },
  { name: 'The Stillness', description: 'Sound dies within fifty feet of the center. Not muffled — absent. Even heartbeats.' },
  { name: 'The Shimmer', description: 'Light bends strangely. You can see things that aren\'t there yet, or aren\'t here at all.' },
  { name: 'The Weight', description: 'Gravity is wrong here. Everything feels twice as heavy, or half as heavy, or both.' },
  { name: 'The Memory', description: 'Visions of the past replay without prompting. Not ghosts — recordings burned into the air.' },
  { name: 'The Hunger', description: 'Magic is consumed here. Spell slots drain. Enchanted items go quiet. The effect fades on departure.' },
  { name: 'The Presence', description: 'Something enormous and ancient is aware of visitors. It has not yet decided what to do.' },
  { name: 'The Veil', description: 'The boundary to the spirit world is thin here. The recently dead linger. The long dead walk.' },
  { name: 'The Tide', description: 'The wonder\'s energy ebbs and flows like water. At high tide, magic is doubled. At low tide, it fails entirely.' },
  { name: 'The Acceleration', description: 'Time moves faster near the center. An hour inside equals three outside. The reverse is also rumoured.' },
  { name: 'The Multiplication', description: 'Creatures here sometimes see doubles of themselves. The doubles are not illusions.' },
  { name: 'The Wound', description: 'The wonder is injured. Something damaged it long ago. The damage is slowly spreading.' },
  { name: 'The Anchor', description: 'The wonder holds things in place. Teleportation fails within its boundary. So does extradimensional travel.' },
  { name: 'The Growth', description: 'Everything brought here grows. Plants, injuries, ideas, ambitions. Not always usefully.' },
  { name: 'The Mirror', description: 'The wonder reflects the inner state of those who enter. The reflection is not always flattering.' },
  { name: 'The Cold Light', description: 'The wonder glows without heat. The light reveals things hidden elsewhere. Some things prefer to remain hidden.' },
];

const WONDER_AREAS = [
  { name: 'The Approach', role: 'transition', description: 'The point where the wonder\'s influence first becomes palpable.' },
  { name: 'The Outer Ring', role: 'hazard', description: 'Strange effects manifest at the periphery — a preview of what lies deeper.' },
  { name: 'The Heart', role: 'boss', description: 'The source of the wonder\'s power. Overwhelming to stand near.' },
  { name: 'The Reflection Pool', role: 'lore', description: 'Still water or crystal that shows things it shouldn\'t.' },
  { name: 'The Rift', role: 'hazard', description: 'A crack in reality. Things come through. Some don\'t return.' },
  { name: 'The Sanctuary', role: 'reward', description: 'A place of safety within the wonder, sheltered from its extremes.' },
  { name: 'The Archive', role: 'lore', description: 'Natural formations that record history in ways scholars can barely read.' },
  { name: 'The Convergence', role: 'encounter', description: 'Where multiple aspects of the wonder collide and intensify.' },
  { name: 'The Threshold', role: 'transition', description: 'The point of no return, visible to those who know what to look for.' },
  { name: 'The Resonance Chamber', role: 'lore', description: 'A natural hollow where the wonder\'s true nature can be studied.' },
];

// ─── Wonder Guardians — 20+ per tier ─────────────────────────────────────────

const WONDER_GUARDIANS: Record<number, string[]> = {
  1: [
    'Awakened Animal Guardian', 'Minor Nature Spirit', 'Treant Sapling', 'Animated Terrain Feature',
    'Giant Eagle Sentinel', 'Swarm of Awakened Insects', 'Dryad Warden', 'Pixie Trickster Collective',
    'Sprite Court Patrol', 'Satyr Revelmaster', 'Blink Dog Pack', 'Pseudodragon Clutch',
    'Awakened Shrubs', 'Wood Woad', 'Grung Tribe', 'Mephit Host (nature variety)',
    'Faerie Dragon Juveniles', 'Needle Blight Congregation', 'Giant Frog Colony', 'Vine Blight Tangle',
  ],
  2: [
    'Ancient Treant', 'Storm Giant Warden', 'Elemental Prince (minor)', 'Fey Court Champion',
    'Unicorn', 'Green Dragon (young)', 'Korred Stonedancer', 'Meenlock Collective',
    'Sea Hag Coven (nature-bound)', 'Bulette Nest Guardian', 'Nymph Queen', 'Frost Giant Skald',
    'Wyvern Clutch', 'Cloud Giant Hermit', 'Ankheg Matriarch', 'Vrock (nature-bound)',
    'Griffon Aerie Warden', 'Peryton Flock', 'Roc Juvenile', 'Thunderbird Elder',
  ],
  3: [
    'Primordial Elemental', 'Ancient Dragon (nature-bound)', 'Archdruid Ascendant', 'Spirit of the Location',
    'Zaratan (elder)', 'Marid Sea-Lord', 'Elder Tempest Fragment', 'Fey Wild Hunt Aspect',
    'Titan\'s Hand (severed, animated)', 'Empyrean (nature-bound, weakened)', 'Ancient Green Dragon',
    'Dao Stone-King', 'Efreeti (nature variant)', 'Phoenix Matron', 'Kraken Hatchling',
    'Behir Ancient', 'Sphinx (Gyno or Androsphinx)', 'Elder Dragon Turtle', 'Leviathan Fragment', 'Marut Naturalist',
  ],
  4: [
    'Aspect of a Nature Deity', 'Elder Primordial', 'World-Serpent Fragment', 'The Wonder Itself',
    'Tarrasque (dormant, disturbed)', 'Ancient Kraken', 'Zaratan Fully Awakened', 'Divine Aspect of the Wild',
    'The Last Dryad of a World-Tree', 'Elder Tempest in Full', 'Primordial Dragon', 'Leviathan Ancient',
    'Aspect of Silvanus', 'Aspect of Melora', 'Star-Touched Treant Elder', 'Storm of Living Lightning',
    'Void Whale Fragment', 'Phoenix God-Form', 'Elemental God Shard', 'The Memory of the First Forest',
  ],
};

const WONDER_HAZARDS: Record<number, string[]> = {
  1: [
    'Wild magic surge zone (DC 12 Arcana to navigate safely)',
    'Enchanted sleep (DC 13 Wis save or fall asleep for 1 hour)',
    'Gravity reversal patch (DC 12 Acrobatics or fall "up" 10 ft)',
    'Flowering spore cloud (DC 11 Con save or poisoned for 10 minutes)',
    'Living vines attempt to grapple (DC 12 Athletics to escape)',
    'Minor time distortion (DC 12 Int save or lose 1 action this round)',
    'Magnetic rock formation (DC 11 Str; metal items drag toward formation)',
    'Emotion aura (DC 13 Wis; random strong emotion for 1 minute)',
    'Illusion field (DC 12 Wis; see doubles of all creatures)',
    'Enchanted water (DC 13 Con; speak only truth for 1 hour if drunk)',
    'Pixie trap web (DC 12 Perception; restrained until DC 12 Str)',
    'Sound mirror (DC 12 Stealth; all sounds echo back after 3 seconds, alerting guardians)',
    'Feywild step hazard (DC 12 Arcana; momentarily displaced to adjacent feywild — 1 round)',
    'Memory theft pollen (DC 13 Wis; forget the last 5 minutes)',
    'Charm blossom field (DC 12 Wis; charmed by the nearest creature for 1 minute)',
  ],
  2: [
    'Temporal distortion (age 1d6 years on failed DC 14 Con save)',
    'Memory wipe (DC 14 Int save or forget the last hour)',
    'Elemental surge (4d8 damage of random type, DC 14 Dex)',
    'Planar echo (DC 14 Wis; party sees themselves from another timeline — distracting)',
    'Magnetic storm (DC 14 Str; metal armor becomes a liability, disadvantage on Dex checks)',
    'Growth field (DC 14 Con; body rapidly ages 10 years cosmetically, permanent)',
    'Sound wall (solid barrier of compressed sound; DC 14 Con each round inside)',
    'Emotion storm (DC 14 Wis; all in area must make saves vs. random extreme emotion)',
    'Fey gateway flicker (DC 15 Arcana; 50% chance of being routed through Feywild — arrive elsewhere)',
    'Luck drain field (DC 14 Wis; cannot use inspiration or lucky feat while inside)',
    'Poisonous pollen cloud (DC 13 Con; 3d6 poison and disadvantage on attack rolls for 1 hour)',
    'Gravity well (DC 14 Str; pulled toward point, taking 3d6 bludgeoning if pulled into terrain)',
    'Wild surge cascade (DC 15 Arcana; all magic items activate simultaneously, uncontrolled)',
    'Time freeze bubble (DC 14 Wis; frozen in place for 2 rounds)',
    'Reflection trap (DC 14 Wis; the party\'s reflections step out and attack for 1 round)',
  ],
  3: [
    'Planar bleed (DC 16 Wis save: pulled partially into adjacent plane for 1 minute)',
    'Reality fracture (spells randomly redirect, DC 16 Arcana each time a spell is cast)',
    'Essence drain (lose one level until long rest, DC 17 Con save)',
    'Time bubble (DC 16 Int; trapped in a 6-second time loop for 1d4 minutes)',
    'Identity dissolution field (DC 17 Wis; random class feature suppressed for 24 hours)',
    'Wild storm (DC 17 Arcana; 10d6 random elemental damage to all in area)',
    'Probability collapse (DC 17 Int; all ability checks are 10 for 1 hour)',
    'Primordial memory flood (DC 17 Wis; overwhelmed by ancient visions — incapacitated 1 round)',
    'Gravity reversal zone (DC 17 Dex; fall 60 ft; DC 15 Dex to grab something on the way)',
    'Anti-healing zone (DC 16 Con; healing spells deal damage instead for 1 minute)',
    'Life drain aura (DC 17 Con; max HP reduced by 2d10 until long rest)',
    'Soul impression (DC 17 Wis; one party member becomes visible to all planar entities for 24 hours)',
    'Permanent wild magic taint (DC 18 Con; roll on wild surge table whenever a spell slot of 1st+ is spent)',
    'Temporal stasis (DC 18 Wis; frozen for 1d4 rounds, cannot act)',
    'Planar anchor (DC 16 Con; cannot leave this area by any magical means for 1 hour)',
  ],
  4: [
    'Divine attention (the wonder\'s patron deity notices the party and chooses a reaction)',
    'Identity dissolution (DC 20 Wis save or forget who you are for 24 hours)',
    'Permanent wild magic taint (DC 20 Con save; unremovable except by wish)',
    'Soul severance (DC 21 Con; soul partially exits body — disadvantage on all saves for 1 week)',
    'Entropy field (DC 21 Con; all equipment degrades one quality tier)',
    'Reality inversion (DC 20 Wis; alignment shifts one step in a random direction, permanent)',
    'Cosmic awareness overload (DC 21 Int; character gains an indefinite madness from forbidden knowledge)',
    'Time prison (DC 22 Wis; character is frozen in time — exists in stasis until someone frees them)',
    'Essence replacement (DC 21 Con; character\'s personality gradually replaced by wonder\'s ancient inhabitant over 3 days)',
    'Absolute gravity reversal (DC 22 Dex; fall "up" into the sky unless tethered)',
    'Divine erasure (DC 22 Wis; character is forgotten by every deity — no divine spells function for 1 month)',
    'Primordial possession (DC 21 Cha; ancient elemental consciousness takes temporary control for 1 round)',
    'Truth compulsion (DC 20 Wis; must answer all questions honestly for 24 hours)',
    'Omniscience flash (DC 21 Int; learns three true facts about the world that no mortal should know)',
    'Age acceleration (DC 21 Con; ages 1d10 × 10 years in a single round)',
  ],
};

const WONDER_DISCOVERIES: Record<number, string[]> = {
  1: [
    'A minor magical spring with healing properties (2d4+2 healing once per day per person)',
    'Rare herbs worth 200 gp to the right alchemist',
    'A map showing the wonder\'s hidden inner sanctum',
    'Crystals that act as spell components for any school of magic',
    'A small creature that imprinted on the party and will serve as a guide in this region',
    'A pool that, when stared into for one hour, answers one yes-or-no question truthfully',
    'Awakened flowers that can transmit messages to others of their kind within a mile',
    'A cache left by a previous adventurer containing gear and a coded journal',
    'A minor blessing from the wonder\'s spirit (+1 to nature checks for one month)',
    'Seeds that, if planted near a city, grow into a tree of alarm (warns of approaching danger)',
    'A feather from the wonder\'s guardian — evidence that opens doors with one specific faction',
    'A shard of the wonder\'s material that faintly glows near the presence of evil',
    'A song that was recorded in the wonder\'s memory — it can soothe any hostile fey creature',
    'A perfectly smooth river stone that, when held, always points toward fresh water',
    'A written record left by a scholar who studied here — contains extensive useful lore',
  ],
  2: [
    'A ritual site that allows the free casting of a 4th-level spell (once, recharged in one month)',
    'Access to a planar pocket with 3,000 gp in unclaimed resources',
    'The blessing of whatever power inhabits this place (+1 to a chosen ability score, 1 week)',
    'Ancient lore lost to the outside world — worth 1,000 gp to the right scholar',
    'A gem that stores one spell of 4th level or lower, charged by the wonder itself',
    'Directions to three more wonders of this type in the region',
    'A staff of flowering (2d6 healing, 5 charges, recharged in a place of natural power)',
    'A speaking stone tuned to the wonder\'s frequency — can ask one question per week',
    'A guardian token — the wonder\'s minor guardians will not attack the bearer for one year',
    'A temporary boon of regeneration (regain 1 HP per minute for one day)',
    'A map of ley lines in the region, showing which wonders are connected',
    'A rare plant specimen that a druid order has been seeking for decades',
    'The ability to speak with plants in this region for 1 week (as the spell, at will)',
    'A vision of the wonder\'s history — reveals a secret that matters to a current political situation',
    'A pendant made from wonder-material — acts as a focus for nature domain spells (+1 spell save DC)',
  ],
  3: [
    'A permanent magical boon from the wonder\'s spirit (chosen by DM from a short list)',
    'A legendary component needed for a world-affecting ritual',
    'The true name of a powerful being (devil, demon, fey, or elemental lord)',
    'A glimpse of the future — and the choice of whether to act on it',
    'A fragment of the wonder\'s power stored in a gem (usable as a 7th-level spell, once)',
    'The location of a secret the wonder has been keeping for five centuries',
    'Mastery of a new cantrip tied to the wonder\'s nature (permanently learned)',
    'A direct psychic impression from the wonder that answers one question of any complexity',
    'A seed of the world-tree, if planted, grows into a tree that functions as a planar gateway',
    'The knowledge of how to seal or unseal one nearby planar rift',
    'Access to a hidden vault that the wonder has guarded for three centuries',
    'A ritual that, when performed here, grants immunity to one damage type for one week',
    'A primordial language inscription — if decoded (DC 20 Arcana over a week), grants three ancient spells',
    'A connection to the wonder — gain advantage on all checks when within 10 miles of it',
    'A wonder-shard weapon (+2, deals force damage, glows in presence of outsiders)',
  ],
  4: [
    'The power to reshape a small part of reality (as the reshape landscape legend lore effect)',
    'A direct audience with a deity or primordial',
    'The ability to seal or unseal the wonder itself — a world-changing decision',
    'Knowledge that changes the nature of the quest entirely',
    'A fragment of divine essence — grants a permanent supernatural ability chosen from a list',
    'The true name of a god (extraordinary leverage, extraordinary risk)',
    'The power to close one planar rift anywhere in the world, permanently',
    'The ability to call the wonder\'s guardian as an ally once (legendary creature)',
    'A prophecy — specific, accurate, and terrible',
    'Access to a demiplane that belongs to the wonder — an entire extra world, accessible only from here',
    'A permanent attunement to the wonder (treat this location as your extended home plane)',
    'The wonder gifts the party leader a divine spark (equivalent to a very specific wish, with consequences)',
    'A revelation about the nature of the world that no living being has known for ten centuries',
    'The wonder\'s blessing of protection (advantage on death saves, permanent, for all party members)',
    'A completely accurate map of the known world\'s ley line network — and what happens if they\'re disrupted',
  ],
};

const WONDER_SECRETS: Record<number, string[]> = {
  1: [
    'The wonder is dying. Without intervention, it will be gone in a generation.',
    'Something is using the wonder as a larder, draining it slowly.',
    'The wonder is a lid. What\'s beneath it does not want to stay beneath.',
    'The wonder\'s guardian was placed here against its will. It resents this and will ask for help.',
    'A nearby city knows about the wonder and has been secretly harvesting from it for decades.',
    'The wonder is linked to a person — and that person doesn\'t know it.',
    'The wonder\'s power is seasonal. In winter, it reverses entirely.',
    'A small cult worships the wonder incorrectly. Their rituals are slowly harming it.',
    'The wonder has been slowly migrating. In ten years, it will appear under a city.',
    'The wonder grants its most devoted visitor a power. The last visitor never left.',
    'Someone is trying to destroy the wonder. They have good reasons. They are mostly wrong.',
    'The wonder was artificially created — the creator is embarrassed and doesn\'t want anyone to know.',
    'Animals from miles around come here to die. The reason is not morbid — it is beautiful and sad.',
    'The wonder remembers everyone who has ever visited. It has a favorite. The favorite has been coming back for decades.',
    'The wonder is slowly awakening. In fifty years, it will be able to speak.',
  ],
  2: [
    'The wonder was created deliberately — and the creator is still alive.',
    'A faction already knows the wonder\'s true nature and is exploiting it.',
    'The wonder is connected to other wonders across the world by ley lines.',
    'The wonder was once a person. A very old, very powerful person.',
    'A second wonder exists in the Feywild, directly mirroring this one. What happens here happens there.',
    'The wonder is the burial site of a god. The god is not entirely dead.',
    'Something from another plane has been using the wonder as a door. It has made several trips.',
    'The wonder\'s power has been building for a century. It is nearly ready for something no one planned.',
    'The faction that sent the party here wants the wonder for themselves. They will arrive two days after the party.',
    'The wonder is the only thing preventing a planar incursion in this region.',
    'The wonder\'s guardian has been corrupted by extended exposure. It is not protecting the wonder; it is consuming it.',
    'A scholar has deciphered what the wonder is saying. The message is urgent and addressed to the party specifically.',
    'The wonder is aware of the party from a past life. It is trying to communicate this through the environment.',
    'The wonder\'s power cannot be taken from it, only borrowed. The debt comes due at a specified future moment.',
    'Two noble families have a long-standing feud over the wonder. Both are wrong about what it is.',
  ],
  3: [
    'The wonder is a prison. The prisoner is almost free.',
    'The wonder is a god\'s body. It is not entirely dead.',
    'Visiting the wonder changes you permanently — most visitors don\'t notice.',
    'The wonder is counting down. Its purpose is fulfilled when something specific happens.',
    'The wonder is the last piece of a larger magical structure. Finding the other pieces reveals something terrible.',
    'The wonder was a weapon. It still functions as intended. The target is still out there.',
    'Destroying the wonder would benefit the world. Preserving it would benefit the party. The wonder knows this.',
    'The wonder is the reason a specific prophecy keeps failing to come true.',
    'A primordial that was supposed to be destroyed at the end of the first age has been hiding here.',
    'The wonder is the source of all magical ability in this region. If it dies, so does magic here.',
    'The wonder belongs to someone. They are coming to take it back. They have the legal, moral, and divine right to do so.',
    'The wonder\'s guardian is a person the party has already met, transformed.',
    'Three wonders are needed for a ritual. This is the first. Visiting it triggers the ritual — automatically.',
    'The wonder is aware of the party\'s worst decisions. It is still undecided about them.',
    'The wonder is a test. The test has been running for three hundred years. The party is not the first to almost pass.',
  ],
  4: [
    'The wonder is a key. The question is what it unlocks.',
    'The wonder has been here longer than the world. It came first.',
    'The wonder is aware of every person who has ever visited it. It remembers them all.',
    'The wonder is a god\'s eye. Everything seen here is seen by the deity.',
    'The wonder is the world\'s last defense against something outside reality. It is failing.',
    'The wonder exists simultaneously in all planes. Actions taken here affect all of them equally.',
    'The wonder is a vote. Many wonders are votes. Someone is counting.',
    'The wonder is a mirror. The world it shows is the world that should have been.',
    'The wonder is the source of divine magic itself. Its destruction would end all divine spellcasting, everywhere, permanently.',
    'The wonder is counting. When it reaches zero, it creates something. No one knows what.',
    'The wonder has been waiting for the party specifically. It prepared. This was always going to happen.',
    'The wonder is alive in the way gods are alive — incomprehensibly. It is not hostile. It is curious. That is worse.',
    'The wonder was placed here by an entity from outside the multiverse. It serves as a beacon.',
    'The wonder\'s destruction is required to stop the end of the world. Its preservation is required to stop a different end of the world.',
    'The wonder is the memory of a world that died. This world is repeating its mistakes precisely.',
  ],
};

// ─── Geographical Landmark Data ──────────────────────────────────────────────

const LANDMARK_ORIGINS = [
  'a geographic feature so extreme it forced civilisation to route around it',
  'the remnant of a geological cataclysm from the world\'s early age',
  'a formation that has served as a waypoint for travelers since the first roads',
  'a natural border that no army has successfully crossed without permission',
  'a feature so distinctive that it appears on every map ever drawn of this region',
  'the highest or lowest or widest or deepest point in the known world',
  'a natural formation that resonates with the world\'s own magical frequency',
  'a place where two ecosystems collide, creating something found nowhere else',
  'the fossilized remains of a creature so large its body became a mountain range',
  'a canyon carved by a river so old it predates the names of the gods who watch over it',
  'a salt flat left behind when an inland sea evaporated three ages ago',
  'a forest that has been growing since before mortal civilization existed',
  'a glacier that has been advancing or retreating for ten thousand years, indifferent to politics',
  'an island that appears only at certain tides or seasons, believed to be impossible',
  'a mountain peak that is the origin point of three major river systems',
  'a desert that was once ocean floor — the fossils of sea creatures are visible everywhere',
  'a valley so deep that it has its own distinct weather and ecology',
  'the shore of a lake so large that its far side cannot be seen from any normal vantage',
  'a volcanic field that has been continuously active since the world was young',
  'a cave system large enough to contain cities, discovered independently by three civilizations',
];

const LANDMARK_AREAS = [
  { name: 'The Approach Road', role: 'transition', description: 'The well-worn path that all travelers use.' },
  { name: 'The Overlook', role: 'lore', description: 'The best vantage point for understanding the landmark\'s scale.' },
  { name: 'The Interior', role: 'encounter', description: 'The heart of the feature — caves, canyons, passes, or peaks.' },
  { name: 'The Hidden Path', role: 'reward', description: 'A route through the landmark that only locals know.' },
  { name: 'The Dangerous Crossing', role: 'hazard', description: 'The point where the landmark must be traversed, not avoided.' },
  { name: 'The Shrine', role: 'lore', description: 'Travelers have been leaving offerings here for centuries.' },
  { name: 'The Camp', role: 'transition', description: 'The traditional stopping point before the difficult section.' },
  { name: 'The Summit or Depth', role: 'boss', description: 'The extreme point — highest, deepest, most remote.' },
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
  return shuffled.slice(0, Math.min(n, shuffled.length));
}

// ─── Main Simulator ──────────────────────────────────────────────────────────

export interface ExUmbraDungeon {
  crTier: CRTier;
  origin: string;
  aspects: Array<{ name: string; description: string }>;
  rooms: Array<{ name: string; role: string; description: string }>;
  boss: string;
  minions: string;
  traps: string[];
  reward: string;
  secret: string;
  dungeonLevel: number; // recommended character level
  /** Pre-formatted text ready to paste into Mythweaver's "existing_encounters" field */
  mythweaverEncounters: string;
  /** Pre-formatted text ready to paste into Mythweaver's "world_lore" field */
  mythweaverLore: string;
}

export function simulateExUmbra(poi: PointOfInterest, worldSeed: string): ExUmbraDungeon {
  const seedNum = poi.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) +
    parseInt(worldSeed.replace(/\D/g, '').slice(0, 6) || '42', 10);
  const rng = makeRng(seedNum);

  // Determine CR tier from dangerLevel (1-20)
  const dl = poi.dangerLevel || 5;
  const tierIndex = dl <= 5 ? 0 : dl <= 10 ? 1 : dl <= 15 ? 2 : 3;
  const crTier = CR_TIERS[tierIndex];
  const dungeonLevel = Math.floor(rng() * (parseInt(crTier.levelRange.split('–')[1]) - parseInt(crTier.levelRange.split('–')[0]) + 1)) + parseInt(crTier.levelRange.split('–')[0]);

  const isWonder = poi.type === 'natural_wonder';
  const isLandmark = poi.type === 'geographical_landmark';

  let origin: string, aspects: Array<{name: string; description: string}>, rooms: Array<{name: string; role: string; description: string}>, boss: string, minions: string, traps: string[], reward: string, secret: string;

  if (isWonder) {
    origin = pick(WONDER_ORIGINS, rng);
    aspects = pickN(WONDER_ASPECTS, 3, rng);
    rooms = pickN(WONDER_AREAS, Math.floor(rng() * 3) + 4, rng);
    boss = pick(WONDER_GUARDIANS[crTier.tier], rng);
    minions = pick(MINION_TYPES[crTier.tier], rng);
    traps = pickN(WONDER_HAZARDS[crTier.tier], 2, rng);
    reward = pick(WONDER_DISCOVERIES[crTier.tier], rng);
    secret = pick(WONDER_SECRETS[crTier.tier], rng);
  } else if (isLandmark) {
    origin = pick(LANDMARK_ORIGINS, rng);
    aspects = pickN(WONDER_ASPECTS, 2, rng);
    rooms = pickN(LANDMARK_AREAS, Math.floor(rng() * 2) + 4, rng);
    boss = pick(WONDER_GUARDIANS[crTier.tier], rng);
    minions = pick(MINION_TYPES[crTier.tier], rng);
    traps = pickN(WONDER_HAZARDS[crTier.tier], 1, rng);
    reward = pick(WONDER_DISCOVERIES[crTier.tier], rng);
    secret = pick(WONDER_SECRETS[crTier.tier], rng);
  } else {
    // Dungeon, ruins, cave, tomb, crypt, lair, etc.
    origin = pick(DUNGEON_ORIGINS, rng);
    aspects = pickN(DUNGEON_ASPECTS, 3, rng);
    rooms = pickN(ROOM_TYPES, Math.floor(rng() * 3) + 5, rng);
    boss = pick(BOSS_TYPES[crTier.tier], rng);
    minions = pick(MINION_TYPES[crTier.tier], rng);
    traps = pickN(TRAPS[crTier.tier], 2, rng);
    reward = pick(REWARDS[crTier.tier], rng);
    secret = pick(SECRETS[crTier.tier], rng);
  }

  // Build Mythweaver-ready encounter text
  const mythweaverEncounters = `DUNGEON: ${poi.name}
TYPE: ${poi.type.replace('_', ' ')}
CHALLENGE: ${crTier.label} (${crTier.crRange}, levels ${crTier.levelRange})
DANGER LEVEL: ${dl}/20

ORIGIN: This dungeon was once ${origin}.

KEY ASPECTS (environmental hazards and themes):
${aspects.map((a, i) => `${i + 1}. ${a.name}: ${a.description}`).join('\n')}

ROOMS/AREAS:
${rooms.map((r, i) => `${i + 1}. ${r.name} [${r.role.toUpperCase()}]: ${r.description}`).join('\n')}

INHABITANTS:
- Boss: ${boss}
- Minions: ${minions}

TRAPS:
${traps.map((t, i) => `${i + 1}. ${t}`).join('\n')}

REWARD: ${reward}
SECRET: ${secret}`;

  const mythweaverLore = `${poi.name} is ${poi.description}

It began as ${origin}. Now it is a ${crTier.label.toLowerCase()} location (danger level ${dl}/20) recommended for characters of levels ${crTier.levelRange}.

The dungeon is defined by three aspects: ${aspects.map(a => a.name).join(', ')}. ${aspects[0].description}

The primary threat within is ${boss}, commanding forces of ${minions}. ${secret}`;

  return {
    crTier,
    origin,
    aspects,
    rooms,
    boss,
    minions,
    traps,
    reward,
    secret,
    dungeonLevel,
    mythweaverEncounters,
    mythweaverLore,
  };
}

/** Build a complete Mythweaver generate payload from a dungeon */
export function buildMythweaverPayload(
  poi: PointOfInterest,
  dungeon: ExUmbraDungeon,
  worldName: string
) {
  const dl = poi.dangerLevel || 5;
  const tierIndex = dl <= 5 ? 0 : dl <= 10 ? 1 : dl <= 15 ? 2 : 3;
  const tier = CR_TIERS[tierIndex];

  return {
    rule_system: 'D&D 5e',
    setting_custom: worldName,
    environment_custom: `${poi.type.replace('_', ' ')} — ${poi.name}`,
    story_type: 'Dungeon Delve',
    tone: tier.tier >= 3 ? 'Dark & Gritty' : tier.tier === 2 ? 'Heroic' : 'Heroic',
    party_size: '4 players',
    character_level: `Tier ${tier.tier} (${tier.levelRange})`,
    length: 'One-Shot (3-4 hours)',
    existing_encounters: dungeon.mythweaverEncounters,
    world_lore: dungeon.mythweaverLore,
    existing_npcs: `Boss: ${dungeon.boss}\nMinions: ${dungeon.minions}`,
    campaign_context: `This dungeon is part of the world "${worldName}". The party has discovered it during exploration.`,
  };
}
