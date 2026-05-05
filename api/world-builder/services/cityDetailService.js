// Detailed City Generation Service
class CityDetailService {
  constructor(world, factions, npcs) {
    this.world = world;
    this.factions = factions;
    this.npcs = npcs;
  }

  enrichCities() {
    return this.world.cities.map((city, idx) => {
      const associatedFactions = this.factions.filter(f => f.headquartersId === city.id);
      const cityFactions = this.factions.filter(f => !f.rivals.some(r => associatedFactions.map(af => af.id).includes(r))).slice(0, 3);

      return {
        ...city,
        government: this.generateGovernment(city.governmentType, cityFactions),
        rulingFactions: cityFactions,
        notableCitizens: this.generateNotableCitizens(city, 8),
        culturalIcons: this.generateCulturalIcons(city),
        sportsTeams: this.generateSportsTeams(),
        landmarks: this.generateLandmarks(city),
        festivals: this.generateFestivals(city),
        secrets: this.generateCitySecrets(),
        economicDetail: this.generateEconomicDetail(city),
        population_class: this.getPopulationClass(city.population),
        danger_level: this.calculateDangerLevel(city, this.world),
        prosperity_index: this.calculateProsperity(city),
        laws: this.generateLaws(city.governmentType)
      };
    });
  }

  generateGovernment(governmentType, factions) {
    const details = {
      'Absolute Monarchy': {
        description: 'A single monarch with absolute power',
        decision_speed: 'Fast',
        stability: 'High if popular, low if hated',
        change_likelihood: 'Low (unless revolution)',
        council_size: 0
      },
      'Constitutional Monarchy': {
        description: 'Monarch with power limited by constitution',
        decision_speed: 'Medium',
        stability: 'High',
        change_likelihood: 'Medium (via elections)',
        council_size: 10
      },
      'Democracy': {
        description: 'Rule by the people through voting',
        decision_speed: 'Slow (much debate)',
        stability: 'Medium (depends on participation)',
        change_likelihood: 'High (regular elections)',
        council_size: 20
      },
      'Oligarchy': {
        description: 'Rule by a small group of wealthy/powerful individuals',
        decision_speed: 'Fast',
        stability: 'Medium (alliances can shift)',
        change_likelihood: 'Medium (power struggles)',
        council_size: 5
      },
      'Theocracy': {
        description: 'Rule by religious leaders',
        decision_speed: 'Medium',
        stability: 'High (religious basis)',
        change_likelihood: 'Low (until religious shift)',
        council_size: 12
      },
      'Merchant Republic': {
        description: 'Rule by wealthy merchants and guilds',
        decision_speed: 'Medium',
        stability: 'Medium (trade-dependent)',
        change_likelihood: 'Medium (market forces)',
        council_size: 15
      },
      'Military Dictatorship': {
        description: 'Rule by military leader with iron fist',
        decision_speed: 'Very fast',
        stability: 'Medium (military loyalty)',
        change_likelihood: 'Low (until coup)',
        council_size: 8
      }
    };

    return details[governmentType] || {
      description: governmentType,
      decision_speed: 'Unknown',
      stability: 'Unknown',
      change_likelihood: 'Unknown',
      council_size: Math.floor(Math.random() * 15) + 3
    };
  }

  generateNotableCitizens(city, count) {
    const roles = [
      'Master Bard', 'Renowned Sculptor', 'Famous Playwright', 'Master Alchemist',
      'Legendary Swordmaster', 'Arch-Mage', 'High Priestess', 'Wealthy Merchant',
      'Brilliant Inventor', 'Renowned Healer', 'Master Thief', 'Celebrated Knight',
      'Famous Artist', 'Master Craftsman', 'Charismatic Gladiator'
    ];

    const citizens = [];
    for (let i = 0; i < Math.min(count, roles.length); i++) {
      const role = roles[i];
      citizens.push({
        id: `citizen_${city.id}_${i}`,
        name: this.generateNPCName(),
        role,
        description: this.generateCitizenDescription(role),
        influence: Math.floor(Math.random() * 100),
        knownFor: this.generateKnownFor(role),
        location: `${city.name}`
      });
    }
    return citizens;
  }

  generateNPCName() {
    const firstNames = [
      'Aldric', 'Beatrice', 'Cassian', 'Delilah', 'Ezra', 'Freya', 'Gideon', 'Hazel',
      'Isadora', 'Jasper', 'Kaida', 'Lucius', 'Minerva', 'Nicolai', 'Ophelia', 'Perseus',
      'Quincy', 'Rosalind', 'Silas', 'Thalia', 'Uther', 'Violet', 'Wyatt', 'Xander',
      'Yara', 'Zephyr'
    ];
    const lastNames = [
      'Blackwood', 'Stonewell', 'Ashford', 'Brightwood', 'Nightshade', 'Ravenswood',
      'Silvermist', 'Ironheart', 'Goldleaf', 'Crystalhall', 'Windmere', 'Sunford'
    ];
    return `${this.pickRandom(firstNames)} ${this.pickRandom(lastNames)}`;
  }

  generateCitizenDescription(role) {
    const descriptions = {
      'Master Bard': 'A legendary musician whose songs move hearts and sway opinions.',
      'Renowned Sculptor': 'Creates breathtaking statues and monuments that inspire awe.',
      'Famous Playwright': 'Writes plays that explore the human condition.',
      'Master Alchemist': 'Seeks the secrets of transmutation and immortality.',
      'Legendary Swordmaster': 'Has trained the greatest warriors of the age.',
      'Arch-Mage': 'Commands magic that can reshape reality itself.',
      'High Priestess': 'Speaks with divine authority and heavenly wisdom.',
      'Wealthy Merchant': 'Controls vast trade networks and economic power.',
      'Brilliant Inventor': 'Creates fantastic devices that push the boundaries of technology.',
      'Renowned Healer': 'Cures the incurable and brings hope to the sick.',
      'Master Thief': 'Steals the unstealable with grace and cunning.',
      'Celebrated Knight': 'A paragon of virtue and martial prowess.',
      'Famous Artist': 'Paints masterpieces that capture the soul.',
      'Master Craftsman': 'Creates items of unparalleled quality and beauty.',
      'Charismatic Gladiator': 'Fights with honor and electrifies the crowds.'
    };
    return descriptions[role] || `A notable figure in ${role}.`;
  }

  generateKnownFor(role) {
    const knownFor = {
      'Master Bard': ['Composing the legendary "Song of Starlight"', 'Performing for kings and nobles', 'Teaching music to the next generation'],
      'Renowned Sculptor': ['Creating the Great Monument', 'Discovering new stone techniques', 'Mentoring young artists'],
      'Famous Playwright': ['Writing comedies that packed theaters', 'Winning the annual drama festival for 5 years', 'Inspiring social change through art'],
      'Master Alchemist': ['Discovering new potions', 'Almost achieving the Philosopher\'s Stone', 'Training apprentices in the craft'],
      'Legendary Swordmaster': ['Never losing a duel', 'Training city champions', 'Defeating a dragon knight'],
      'Arch-Mage': ['Casting spells that saved the city', 'Inventing new magical techniques', 'Protecting the city from magical threats']
    };
    return this.pickRandom(knownFor[role] || ['Being incredibly talented']);
  }

  generateSportsTeams() {
    const sports = ['Jousting', 'Archery', 'Wrestling', 'Sword Fighting', 'Racing', 'Swimming'];
    const teams = [];
    for (let i = 0; i < Math.floor(Math.random() * 3) + 2; i++) {
      teams.push({
        name: `The ${this.pickRandom(['Silver', 'Golden', 'Crimson', 'Black', 'Emerald'])} ${this.pickRandom(['Hawks', 'Dragons', 'Wolves', 'Lions', 'Serpents'])}`,
        sport: this.pickRandom(sports),
        reputation: Math.floor(Math.random() * 100),
        rivalTeam: null,
        championships: Math.floor(Math.random() * 5)
      });
    }
    return teams;
  }

  generateLandmarks(city) {
    const types = ['Temple', 'Monument', 'Market', 'Castle', 'Library', 'Arena', 'Garden', 'Bridge', 'Tower', 'Fountain'];
    const landmarks = [];
    for (let i = 0; i < Math.floor(Math.random() * 4) + 2; i++) {
      landmarks.push({
        name: `The ${this.pickRandom(['Grand', 'Great', 'Ancient', 'Magnificent'])} ${this.pickRandom(types)}`,
        type: this.pickRandom(types),
        description: 'A notable location in the city.',
        significance: Math.floor(Math.random() * 100),
        built_year: Math.floor(Math.random() * 500)
      });
    }
    return landmarks;
  }

  generateFestivals(city) {
    const festival_types = [
      'Summer Solstice Festival', 'Winter\'s End Celebration', 'Harvest Moon Festival',
      'Spring Awakening Festival', 'Founder\'s Day Parade', 'Arts Festival', 'Food Festival',
      'Military Games', 'Magical Showcase', 'Trading Fair'
    ];
    const festivals = [];
    for (let i = 0; i < Math.floor(Math.random() * 3) + 1; i++) {
      festivals.push({
        name: this.pickRandom(festival_types),
        season: this.pickRandom(['Spring', 'Summer', 'Autumn', 'Winter']),
        attendance: Math.floor(Math.random() * 50000) + 5000,
        highlights: ['Competitions', 'Performances', 'Feasting', 'Parades']
      });
    }
    return festivals;
  }

  generateCitySecrets() {
    const secrets = [
      'The mayor has a secret illegitimate child',
      'The city vault is nearly empty',
      'A high-ranking official is a spy',
      'Cursed treasure lies buried beneath the market',
      'The city guard captain leads a double life',
      'A cult operates in the sewers',
      'The city was built on a mass grave',
      'The ruling family\'s bloodline is tainted',
      'Ancient magic runs beneath the streets',
      'The city is slowly sinking'
    ];
    return [this.pickRandom(secrets), this.pickRandom(secrets)];
  }

  generateEconomicDetail(city) {
    const focuses = [
      'Agriculture',
      'Mining',
      'Trade',
      'Fishing',
      'Crafting',
      'Magic Research',
      'Mercenary Work',
      'Lumber',
      'Textiles',
      'Smithing'
    ];
    return {
      primary_industry: this.pickRandom(focuses),
      secondary_industries: [this.pickRandom(focuses), this.pickRandom(focuses)],
      major_exports: [this.pickRandom(focuses), this.pickRandom(focuses)],
      major_imports: [this.pickRandom(focuses), this.pickRandom(focuses)],
      average_wage: Math.floor(Math.random() * 50) + 5,
      cost_of_living: Math.floor(Math.random() * 30) + 10,
      debt_level: Math.floor(Math.random() * 100000)
    };
  }

  getPopulationClass(population) {
    if (population < 5000) return 'Village';
    if (population < 15000) return 'Town';
    if (population < 50000) return 'City';
    return 'Metropolis';
  }

  calculateDangerLevel(city, world) {
    let danger = 3; // Base danger
    if (world.magicLevel > 7) danger += 2;
    if (city.criminalElements) danger += 1;
    return Math.min(danger + Math.floor(Math.random() * 4), 20);
  }

  calculateProsperity(city) {
    return Math.floor(Math.random() * 100);
  }

  generateLaws(governmentType) {
    const laws = {
      'Absolute Monarchy': [
        'The monarch\'s word is absolute law',
        'Treason is punishable by death',
        'Taxation is mandatory',
        'Religious freedom is restricted'
      ],
      'Democracy': [
        'All laws require popular vote',
        'Freedom of speech is protected',
        'Taxation is fair and transparent',
        'Trial by jury is guaranteed'
      ],
      'Theocracy': [
        'Religious law supersedes civil law',
        'Blasphemy is a serious crime',
        'Tithes are mandatory',
        'Heresy is punishable'
      ],
      'Military Dictatorship': [
        'Military authority is supreme',
        'Martial law can be declared at any time',
        'Conscription may be enforced',
        'Rebellion is severely punished'
      ]
    };
    return laws[governmentType] || [
      'Laws are determined by current authority',
      'Justice is administered by officials',
      'Punishments vary by crime severity'
    ];
  }

  pickRandom(array) {
    return array[Math.floor(Math.random() * array.length)];
  }
}

module.exports = CityDetailService;
