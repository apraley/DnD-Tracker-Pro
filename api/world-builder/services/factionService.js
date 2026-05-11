// Faction & Government Service
const { GOVERNMENT_TYPES, FACTION_TYPES } = require('../data/names');

class FactionService {
  constructor(world, npcs) {
    this.world = world;
    this.npcs = npcs;
  }

  generateDetailedFactions() {
    const factions = [];
    const factionCount = 5 + Math.floor(this.world.cities.length / 3);

    for (let i = 0; i < factionCount; i++) {
      const type = this.pickRandom(FACTION_TYPES);
      const headquarters = this.pickRandom(this.world.cities);
      const leader = this.pickRandom(this.npcs);

      const faction = {
        id: `faction_${i}`,
        name: this.generateFactionName(),
        type,
        description: this.generateFactionDescription(type),
        headquartersId: headquarters.id,
        headquartersName: headquarters.name,
        leaderId: leader.id,
        leaderName: leader.name,
        alignment: this.pickRandom([
          'Lawful Good', 'Neutral Good', 'Chaotic Good',
          'Lawful Neutral', 'True Neutral', 'Chaotic Neutral',
          'Lawful Evil', 'Neutral Evil', 'Chaotic Evil'
        ]),
        goals: this.generateGoals(type),
        resources: this.generateResources(type),
        members: Math.floor(Math.random() * 1000) + 50,
        rivals: [],
        allies: [],
        secretAgents: Math.floor(Math.random() * 20),
        publicPresence: this.generatePublicPresence(type),
        darkSecrets: this.generateSecrets(type),
        reputationRating: Math.floor(Math.random() * 100) - 50, // -50 to 50
      };

      factions.push(faction);
    }

    // Create relationships
    for (let faction of factions) {
      const rivalCount = Math.floor(Math.random() * 3);
      const allyCount = Math.floor(Math.random() * 2);

      for (let j = 0; j < rivalCount; j++) {
        const rival = this.pickRandom(factions.filter(f => f.id !== faction.id));
        if (rival && !faction.rivals.includes(rival.id)) {
          faction.rivals.push(rival.id);
        }
      }

      for (let j = 0; j < allyCount; j++) {
        const ally = this.pickRandom(factions.filter(f => f.id !== faction.id && !f.rivals.includes(faction.id)));
        if (ally && !faction.allies.includes(ally.id)) {
          faction.allies.push(ally.id);
        }
      }
    }

    return factions;
  }

  generateFactionName() {
    const prefixes = [
      'Crimson', 'Silver', 'Black', 'Golden', 'Iron', 'Shadow', 'Twilight', 'Dawn',
      'Storm', 'Fire', 'Frost', 'Emerald', 'Obsidian', 'Sapphire', 'Ruby'
    ];
    const suffixes = [
      'Guard', 'Circle', 'Council', 'Order', 'Guild', 'Brotherhood', 'Sisterhood',
      'Alliance', 'League', 'Company', 'Syndicate', 'Cabal', 'Society'
    ];
    return `${this.pickRandom(prefixes)} ${this.pickRandom(suffixes)}`;
  }

  generateFactionDescription(type) {
    const descriptions = {
      'Ruling Government': 'The official government that manages the city and enforces laws.',
      'Criminal Syndicate': 'A shadowy organization dealing in black market goods and illegal services.',
      'Merchant Guild': 'A legitimate trade organization controlling commerce and setting prices.',
      'Religious Order': 'A faith-based organization spreading religious doctrine and offering spiritual guidance.',
      'Magical Academy': 'An institution devoted to magical research and training wizards.',
      'Military Order': 'A warrior society focused on martial excellence and combat.',
      'Thieves Guild': 'An underground network of thieves and rogues.',
      'Artisans Guild': 'Craftspeople organized to maintain quality standards and protect trade secrets.',
      'Noble House': 'An aristocratic family wielding political and economic power.',
      'Draconic Cult': 'A sinister organization devoted to draconic or demonic powers.',
      'Resistance Movement': 'Underground fighters opposing the current government.',
      'Secret Society': 'A mysterious organization with hidden motives and membership.',
      'Monastic Order': 'Monks devoted to spiritual practice and martial discipline.',
      'Ranger Circle': 'Wilderness guardians protecting nature and hunting monsters.',
      'Arcane Conclave': 'A council of powerful mages sharing magical knowledge.'
    };
    return descriptions[type] || 'A powerful organization with influence in the region.';
  }

  generateGoals(type) {
    const goalTemplates = {
      'Ruling Government': [
        'Maintain order and stability',
        'Collect taxes and maintain infrastructure',
        'Defend against external threats',
        'Expand influence'
      ],
      'Criminal Syndicate': [
        'Control black market trade',
        'Eliminate rival gangs',
        'Corrupt officials to gain protection',
        'Accumulate wealth'
      ],
      'Merchant Guild': [
        'Monopolize trade routes',
        'Set fair prices for members',
        'Expand markets to new regions',
        'Maintain trade secrets'
      ],
      'Religious Order': [
        'Convert non-believers',
        'Establish temples and holy sites',
        'Accumulate religious artifacts',
        'Oppose heretical beliefs'
      ],
      'Magical Academy': [
        'Advance magical knowledge',
        'Train talented mages',
        'Research forbidden spells',
        'Protect magical artifacts'
      ],
      'Military Order': [
        'Defend the realm',
        'Eliminate monsters and threats',
        'Perfect combat techniques',
        'Expand military power'
      ]
    };
    return goalTemplates[type] || ['Grow in power', 'Influence others', 'Accumulate wealth'];
  }

  generateResources(type) {
    const resources = {
      'Ruling Government': {
        treasury: Math.floor(Math.random() * 100000) + 50000,
        militia: Math.floor(Math.random() * 500) + 100,
        buildings: Math.floor(Math.random() * 30) + 5,
        territories: Math.floor(Math.random() * 5) + 1
      },
      'Criminal Syndicate': {
        safehouses: Math.floor(Math.random() * 20) + 3,
        agents: Math.floor(Math.random() * 200) + 20,
        blackMarketValue: Math.floor(Math.random() * 50000) + 10000,
        corruption: Math.floor(Math.random() * 100)
      },
      'Merchant Guild': {
        tradeCargos: Math.floor(Math.random() * 50) + 10,
        warehouses: Math.floor(Math.random() * 10) + 2,
        merchantShips: Math.floor(Math.random() * 20) + 3,
        goldInReserve: Math.floor(Math.random() * 75000) + 25000
      }
    };
    return resources[type] || { influence: Math.floor(Math.random() * 100) };
  }

  generatePublicPresence(type) {
    const presences = {
      'Ruling Government': 'Open, official buildings, visible enforcement',
      'Criminal Syndicate': 'Hidden, rumors, underground networks',
      'Merchant Guild': 'Market stalls, guild halls, trade agreements',
      'Religious Order': 'Temples, priests, public ceremonies',
      'Magical Academy': 'Tower, scholars, magical exhibitions',
      'Military Order': 'Barracks, soldiers, public training',
      'Thieves Guild': 'Hidden bases, fences, black market contacts',
      'Artisans Guild': 'Workshops, apprenticeships, public works'
    };
    return presences[type] || 'Mysterious and hidden';
  }

  generateSecrets(type) {
    const secrets = {
      'Ruling Government': [
        'Embezzled tax money',
        'Illegal treaties with enemies',
        'Leader\'s illegitimate child',
        'Cover-up of a scandal'
      ],
      'Criminal Syndicate': [
        'Location of hidden treasure',
        'Blackmail on city officials',
        'Internal betrayal brewing',
        'Connection to a demon cult'
      ],
      'Merchant Guild': [
        'Price-fixing conspiracy',
        'Slave trade connections',
        'Stolen shipments',
        'Counterfeit goods'
      ]
    };
    return secrets[type] ? this.pickRandom(secrets[type]) : 'A dark truth hidden from the public';
  }

  pickRandom(array) {
    return array[Math.floor(Math.random() * array.length)];
  }
}

module.exports = FactionService;
