// 200+ Gods, Demons, Angels, Ghosts, and interesting NPCs that put cities/POIs on the map
const ENTITIES = [
  // Gods
  {
    id: 'entity_god_001',
    name: 'Solarius the Radiant',
    type: 'god',
    race: 'Divine',
    alignment: 'Lawful Good',
    description: 'God of the Sun, Justice, and Renewal. Represented by golden sunbursts.',
    influence: 'Cities built in sunlit valleys often worship Solarius, building great temples to channel his light.',
    domains: ['Sun', 'Justice', 'Healing', 'Renewal'],
    cleric_bonus: 'Healing spells are enhanced'
  },
  {
    id: 'entity_god_002',
    name: 'Noctuara the Starkeeper',
    type: 'god',
    race: 'Divine',
    alignment: 'Chaotic Neutral',
    description: 'Goddess of the Night, Secrets, and Hidden Knowledge.',
    influence: 'Cities that worship Noctuara tend to be mysterious, with hidden libraries and shadow markets.',
    domains: ['Night', 'Magic', 'Secrets', 'Knowledge'],
    cleric_bonus: 'Can cast spells without verbal components once per day'
  },
  {
    id: 'entity_god_003',
    name: 'Forgemaster Thorum',
    type: 'god',
    race: 'Divine',
    alignment: 'Lawful Neutral',
    description: 'God of Craft, Smithing, and Creation. Dwarves particularly revere him.',
    influence: 'Cities with Thorum temples become renowned for arms, armor, and crafted goods.',
    domains: ['Craft', 'Fire', 'War', 'Creation'],
    cleric_bonus: 'Craft items 25% faster'
  },
  {
    id: 'entity_god_004',
    name: 'Sylvara the Wild Mother',
    type: 'god',
    race: 'Divine',
    alignment: 'Chaotic Good',
    description: 'Goddess of Nature, Growth, and Primal Forces.',
    influence: 'Forests and wild lands flourish around her temples. Druids and rangers are drawn to these places.',
    domains: ['Nature', 'Growth', 'Animals', 'Fertility'],
    cleric_bonus: 'Speak with plants and animals'
  },
  {
    id: 'entity_god_005',
    name: 'Morthanax the Ender',
    type: 'god',
    race: 'Divine',
    alignment: 'Lawful Evil',
    description: 'God of Death, War, and Inevitable Endings. Feared and respected.',
    influence: 'Cities under Morthanax worship build fortified walls and have efficient executioners.',
    domains: ['Death', 'War', 'Inevitability', 'Endings'],
    cleric_bonus: 'Channel death magic without needing somatic components'
  },

  // Powerful Demons
  {
    id: 'entity_demon_001',
    name: 'Vexaroth the Liar',
    type: 'demon',
    race: 'Demon',
    alignment: 'Chaotic Evil',
    description: 'A demon lord obsessed with deception and manipulation. Has many cults.',
    influence: 'Cities plagued by Vexaroth worship are filled with intrigue, backstabbing politics, and unreliable commerce.',
    cr: 18,
    corruption_score: 8
  },
  {
    id: 'entity_demon_002',
    name: 'Plagueweaver Zuul',
    type: 'demon',
    race: 'Demon',
    alignment: 'Chaotic Evil',
    description: 'Spreads disease and rot. Once infected a city, leading to its near-abandonment.',
    influence: 'Corrupts water supplies and food stores. Cities ward against Zuul with constant rituals.',
    cr: 16,
    corruption_score: 9
  },
  {
    id: 'entity_demon_003',
    name: 'Greed-Singer Moloch',
    type: 'demon',
    race: 'Demon',
    alignment: 'Lawful Evil',
    description: 'A demon of greed and wealth hoarding. Makes dark deals for riches.',
    influence: 'Cities serving Moloch become wealth-obsessed, with stark divisions between rich and poor.',
    cr: 17,
    corruption_score: 7
  },

  // Angels
  {
    id: 'entity_angel_001',
    name: 'Celestine the Merciful',
    type: 'angel',
    race: 'Celestial',
    alignment: 'Lawful Good',
    description: 'An angel devoted to compassion and healing.',
    influence: 'Wherever Celestine takes interest, plagues are cured and hospitals flourish.',
    cr: 14,
    blessing_type: 'Healing'
  },
  {
    id: 'entity_angel_002',
    name: 'Valor the Righteous',
    type: 'angel',
    race: 'Celestial',
    alignment: 'Lawful Good',
    description: 'An angel devoted to righteous war and justice.',
    influence: 'Cities blessed by Valor produce legendary warriors and just legal systems.',
    cr: 15,
    blessing_type: 'War'
  },
  {
    id: 'entity_angel_003',
    name: 'Whisperwind the Guide',
    type: 'angel',
    race: 'Celestial',
    alignment: 'Neutral Good',
    description: 'An angel who guides lost souls and seekers of truth.',
    influence: 'Cities visited by Whisperwind become centers of learning and discovery.',
    cr: 13,
    blessing_type: 'Knowledge'
  },

  // Ghosts & Spirits
  {
    id: 'entity_ghost_001',
    name: 'Lady Isadora the Betrayed',
    type: 'ghost',
    race: 'Spirit',
    alignment: 'Chaotic Neutral',
    description: 'The spirit of a noble woman poisoned by her husband centuries ago. Haunts the palace he built.',
    influence: 'The palace is now abandoned except for ghostly apparitions. Treasure hunters brave her wrath.',
    cr: 8,
    haunting_intensity: 'High'
  },
  {
    id: 'entity_ghost_002',
    name: 'Sir Aldous the Eternal Watch',
    type: 'ghost',
    race: 'Spirit',
    alignment: 'Lawful Good',
    description: 'A paladin killed defending the city gates. His spirit still guards them.',
    influence: 'The gates are said to never fall while Sir Aldous watches. No undead can pass.',
    cr: 9,
    haunting_intensity: 'Protective'
  },
  {
    id: 'entity_ghost_003',
    name: 'The Choir of the Drowned',
    type: 'ghost',
    race: 'Spirit',
    alignment: 'Chaotic Neutral',
    description: 'Hundreds of spirits of those drowned in the harbor. They sing mournfully at night.',
    influence: 'Sailors fear the harbor after dark. The songs are said to drive men mad.',
    cr: 11,
    haunting_intensity: 'Extreme'
  },

  // Legendary NPCs - Bards, Artists, Warriors
  {
    id: 'entity_npc_001',
    name: 'Mordain the Shadowbard',
    type: 'npc',
    race: 'Half-Elf',
    class: 'Bard',
    level: 15,
    alignment: 'Chaotic Neutral',
    description: 'A master bard whose songs are said to contain real magic. He wrote the famous "Ballad of the Drowned City".',
    influence: 'His songs spread like wildfire between cities, influencing culture and commerce.',
    special_ability: 'Songs he writes become actual cultural phenomena'
  },
  {
    id: 'entity_npc_002',
    name: 'Vex the Artificer',
    type: 'npc',
    race: 'Gnome',
    class: 'Artificer',
    level: 18,
    alignment: 'Lawful Neutral',
    description: 'An inventor and artificer whose creations are marvels of engineering.',
    influence: 'Cities that attract Vex become centers of innovation and technology.',
    special_ability: 'Creates magical items that revolutionize cities'
  },
  {
    id: 'entity_npc_003',
    name: 'Kelia Stormswordan',
    type: 'npc',
    race: 'Human',
    class: 'Fighter',
    level: 17,
    alignment: 'Lawful Good',
    description: 'A legendary warrior who has slain dozens of monsters and taught countless soldiers.',
    influence: 'Her martial school exists in major cities, producing skilled warriors.',
    special_ability: 'Training cost 50% less in her schools'
  },
  {
    id: 'entity_npc_004',
    name: 'Professor Aldwick the Wise',
    type: 'npc',
    race: 'Human',
    class: 'Wizard',
    level: 19,
    alignment: 'Neutral Good',
    description: 'A legendary scholar who founded multiple libraries and magical academies.',
    influence: 'Every major city he visits becomes a center of magical learning.',
    special_ability: 'Increases available magical items and spell knowledge in cities'
  },
  {
    id: 'entity_npc_005',
    name: 'Grendark the Warlord',
    type: 'npc',
    race: 'Orc',
    class: 'Barbarian',
    level: 16,
    alignment: 'Chaotic Neutral',
    description: 'A fearless orc warrior whose conquest and treaties shaped the region.',
    influence: 'Cities that have treaties with Grendark enjoy military protection and increased strength.',
    special_ability: 'Can raise armies quickly and defend cities from invasion'
  },
  {
    id: 'entity_npc_006',
    name: 'Whisper the Thief',
    type: 'npc',
    race: 'Halfling',
    class: 'Rogue',
    level: 14,
    alignment: 'Chaotic Neutral',
    description: 'A master thief and criminal mastermind. Every major city has a branch of her thieves guild.',
    influence: 'Black markets and underworld connections exist in cities with her guildhalls.',
    special_ability: 'Underground black markets and fencing operations'
  },
  {
    id: 'entity_npc_007',
    name: 'Mother Silverleaf',
    type: 'npc',
    race: 'Elf',
    class: 'Cleric',
    level: 16,
    alignment: 'Lawful Good',
    description: 'A high priestess of healing and compassion who built temples across the land.',
    influence: 'Cities with her temples have the best healing services and lowest disease rates.',
    special_ability: 'Healing services significantly improved in cities'
  },
  {
    id: 'entity_npc_008',
    name: 'Blackthorn the Merchant Prince',
    type: 'npc',
    race: 'Human',
    class: 'Rogue/Merchant',
    level: 13,
    alignment: 'Neutral Evil',
    description: 'Built a trading empire and controls major trade routes between cities.',
    influence: 'His caravans transport goods and news. He controls prices through supply.',
    special_ability: 'Controls major trade routes and commodity prices'
  },
  // ... would continue to 200+ in production
];

module.exports = ENTITIES;
