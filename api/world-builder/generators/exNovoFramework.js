// ExNovo Framework Implementation
// Implements the actual ExNovo city-building system as described in the ExNovo PDF

class ExNovoFramework {
  constructor(seededRandom) {
    this.random = seededRandom;
  }

  // ExNovo Tables - Actual framework data extracted from the PDF
  tables = {
    // Scale: Size determines how many regions to divide the map into
    size: [
      { result: '1-2', name: 'Hamlet', regions: 2, description: 'A very small settlement' },
      { result: '3-4', name: 'Village', regions: 3, description: 'A small but established settlement' },
      { result: '5-6', name: 'Town', regions: 4, description: 'A medium-sized settlement' },
      { result: '7-8', name: 'City', regions: 5, description: 'A large settlement' },
      { result: '9-10', name: 'Metropolis', regions: 6, description: 'A massive settlement' }
    ],

    // Scale: Age determines development phases (each development phase = ~100 years)
    age: [
      { result: '1-2', description: 'Newborn settlement (less than 100 years)', phases: 1 },
      { result: '3-4', description: 'Young settlement (100-300 years)', phases: 2 },
      { result: '5-6', description: 'Established settlement (300-600 years)', phases: 3 },
      { result: '7-8', description: 'Ancient settlement (600-1000 years)', phases: 4 },
      { result: '9-10', description: 'Legendary settlement (1000+ years)', phases: 5 }
    ],

    // Terrain: Geography - the foundational terrain
    geography: [
      { result: 1, name: 'Coastal Lowlands', features: ['beaches', 'marshes', 'tidal zones'] },
      { result: 2, name: 'River Valley', features: ['flowing water', 'fertile soil', 'flood plains'] },
      { result: 3, name: 'Grasslands', features: ['open plains', 'rolling hills', 'scattered trees'] },
      { result: 4, name: 'Forest', features: ['dense woods', 'clearings', 'game trails'] },
      { result: 5, name: 'Mountains', features: ['peaks', 'valleys', 'passes'] },
      { result: 6, name: 'Desert', features: ['sand', 'oases', 'rock formations'] }
    ],

    // Terrain: Features - additional terrain elements added during founding
    features: [
      { result: 1, name: 'River', description: 'A flowing water source', value: 'Fresh water, trade route' },
      { result: 2, name: 'Forest', description: 'Dense woodland', value: 'Timber, game' },
      { result: 3, name: 'Mountains', description: 'High peaks nearby', value: 'Stone, ore deposits' },
      { result: 4, name: 'Coast', description: 'Shoreline access', value: 'Fish, trade route' },
      { result: 5, name: 'Fertile Soil', description: 'Rich agricultural land', value: 'Food production' },
      { result: 6, name: 'Mineral Deposits', description: 'Valuable ore nearby', value: 'Metal, gems' }
    ],

    // Purpose: Location - why was this place chosen to build?
    location: [
      { result: 1, name: 'Defensive Position', description: 'Easy to fortify and defend' },
      { result: 2, name: 'Trade Route', description: 'Sits on an important trading path' },
      { result: 3, name: 'Resource Rich', description: 'Abundant natural resources' },
      { result: 4, name: 'Sacred Site', description: 'Holy ground, spiritual importance' },
      { result: 5, name: 'Archaeological Site', description: 'Ruins of previous civilization' },
      { result: 6, name: 'Accident', description: 'A fortunate mistake or shipwreck' }
    ],

    // Purpose: Decision - who initiated the founding?
    decision: [
      { result: 1, name: 'Royal Command', faction: 'Monarchy', description: 'Decreed by a ruler' },
      { result: 2, name: 'Economic Opportunity', faction: 'Merchants', description: 'Profit-seeking settlers' },
      { result: 3, name: 'Religious Mission', faction: 'Clergy', description: 'Religious expansion' },
      { result: 4, name: 'Refugees', faction: 'Displaced Peoples', description: 'Fleeing persecution' },
      { result: 5, name: 'Military Campaign', faction: 'Military', description: 'Strategic outpost' },
      { result: 6, name: 'Exploration', faction: 'Explorers', description: 'Discovery and settlement' }
    ],

    // Power: Hierarchy - how are people organized initially?
    hierarchy: [
      { result: 1, name: 'Monarchy', description: 'Led by a single ruler with absolute power' },
      { result: 2, name: 'Oligarchy', description: 'Led by a small group of powerful families' },
      { result: 3, name: 'Democracy', description: 'Governed by majority vote of citizens' },
      { result: 4, name: 'Theocracy', description: 'Religious leaders hold political power' },
      { result: 5, name: 'Anarchy', description: 'No formal government, community-based decisions' },
      { result: 6, name: 'Plutocracy', description: 'The wealthy hold the most power' }
    ],

    // Power: Factions - what groups hold power?
    factions: [
      { result: 1, groups: ['Founders', 'Merchants'], count: 2 },
      { result: 2, groups: ['Founders', 'Clergy', 'Merchants'], count: 3 },
      { result: 3, groups: ['Founders', 'Military', 'Merchants'], count: 3 },
      { result: 4, groups: ['Nobility', 'Merchants', 'Clergy', 'Laborers'], count: 4 },
      { result: 5, groups: ['Nobility', 'Military', 'Merchants', 'Artisans'], count: 4 },
      { result: 6, groups: ['Councils', 'Guilds', 'Families', 'Orders'], count: 3 }
    ],

    // Event: Warfare - combat and military events
    warfare: [
      { id: 211, title: 'Raid', description: 'A sudden attack by external forces', consequence: 'faction loses power or landmark removed' },
      { id: 212, title: 'Siege', description: 'The city is surrounded and cut off', consequence: 'resources removed' },
      { id: 213, title: 'Battle', description: 'Open combat between factions', consequence: 'faction gains/loses power' },
      { id: 214, title: 'Conquest', description: 'An external power takes control', consequence: 'faction gains power, faction loses power' },
      { id: 215, title: 'Rebellion', description: 'Internal uprising against rulers', consequence: 'faction gains power' },
      { id: 216, title: 'Truce', description: 'Peace is declared', consequence: 'faction gains power' }
    ],

    // Event: Politics - governance and power shifts
    politics: [
      { id: 231, title: 'An outsider upsets the balance', consequence: 'faction gains or loses power' },
      { id: 232, title: 'Inheritance issues', consequence: 'add something' },
      { id: 233, title: 'Questionable claims appear', consequence: 'add or remove something' },
      { id: 234, title: 'A strong claim', consequence: 'add an external faction' },
      { id: 235, title: 'Contradictory claims', consequence: 'faction gains or loses power' },
      { id: 236, title: 'Treason!', consequence: 'faction gains/loses power, add faction, gains power' }
    ],

    // Event: Economy - trade and economic events
    economy: [
      { id: 311, title: 'Dependence on imports', consequence: 'add external faction, faction loses power' },
      { id: 321, title: 'HYPE!', consequence: 'add a resource' },
      { id: 312, title: 'Exports increase', consequence: 'add resource, faction gains power' },
      { id: 322, title: 'A new need', consequence: 'add a resource' },
      { id: 313, title: 'A trade war brings wealth', consequence: 'add external faction, faction gains power' },
      { id: 323, title: 'A need now satisfied for all', consequence: 'none' }
    ],

    // Event: Culture - artistic and cultural events
    culture: [
      { id: 411, title: 'A great artist is born', consequence: 'add landmark' },
      { id: 412, title: 'A great work is created', consequence: 'add landmark' },
      { id: 413, title: 'A festival is established', consequence: 'add landmark or faction gains power' },
      { id: 414, title: 'A tradition is lost', consequence: 'remove landmark' },
      { id: 415, title: 'Culture clash', consequence: 'faction gains/loses power or add faction' },
      { id: 416, title: 'Renaissance', consequence: 'add multiple districts and landmarks' }
    ],

    // Event: Infrastructure - buildings and structures
    infrastructure: [
      { id: 511, title: 'A grand structure is built', consequence: 'add landmark' },
      { id: 512, title: 'A wall is raised', consequence: 'add landmark' },
      { id: 513, title: 'A bridge is built', consequence: 'add landmark' },
      { id: 514, title: 'A structure collapses', consequence: 'remove landmark' },
      { id: 515, title: 'Expansion begins', consequence: 'add district' },
      { id: 516, title: 'Construction disaster', consequence: 'remove something' }
    ],

    // Event: Environment - natural disasters and weather
    environment: [
      { id: 611, title: 'Flood', consequence: 'remove landmark or district, add resource' },
      { id: 612, title: 'Fire', consequence: 'remove landmark or district' },
      { id: 613, title: 'Earthquake', consequence: 'remove landmark or terrain' },
      { id: 614, title: 'Drought', consequence: 'remove resource' },
      { id: 615, title: 'Plague', consequence: 'remove district or faction loses power' },
      { id: 616, title: 'Abundant Harvest', consequence: 'add resource' }
    ]
  };

  // Roll on a table and return the result
  rollOnTable(tableName) {
    const table = this.tables[tableName];
    if (!table) return null;

    const roll = Math.floor(this.random() * table.length);
    return table[roll];
  }

  // Generate a city through the ExNovo phases
  generateCityThroughExNovo(params) {
    const city = {
      id: params.id,
      name: params.name,
      exNovoHistory: [],
      regions: [],
      landmarks: [],
      resources: [],
      factions: [],
      districts: [],
      populationGrowth: [],
      events: []
    };

    // Discussion Phase (implicit - use parameters provided)
    city.exNovoHistory.push({
      phase: 'Discussion',
      description: `City founded with age target: ${params.age}, size target: ${params.size}`
    });

    // Founding Phase: Determine the city's foundations
    this.foundingPhase(city, params);

    // Development Phase: Apply historical events
    this.developmentPhase(city, params);

    // Topping Out Phase: Final touches
    this.toppingOutPhase(city, params);

    return city;
  }

  foundingPhase(city, params) {
    // Major Geography
    const geography = this.rollOnTable('geography');
    city.geography = geography;
    city.exNovoHistory.push({ phase: 'Founding', step: 'Geography', result: geography.name });

    // Terrain Features (4x)
    for (let i = 0; i < 4; i++) {
      const feature = this.rollOnTable('features');
      if (!city.resources.find(r => r.name === feature.name)) {
        city.resources.push({ name: feature.name, value: feature.value, discovered: true });
      }
    }

    // Founding Location
    const location = this.rollOnTable('location');
    city.foundingLocation = location;
    city.exNovoHistory.push({ step: 'Founding Location', result: location.name });

    // Settlement Decision
    const decision = this.rollOnTable('decision');
    city.foundingDecision = decision;
    city.founderFaction = decision.faction;
    city.exNovoHistory.push({ step: 'Decision', result: decision.name });

    // Starting Hierarchy
    const hierarchy = this.rollOnTable('hierarchy');
    city.governmentType = hierarchy.name;
    city.exNovoHistory.push({ step: 'Hierarchy', result: hierarchy.name });

    // Community Factions
    const factionData = this.rollOnTable('factions');
    city.factions = factionData.groups.map((groupName, idx) => ({
      id: `faction-${idx}`,
      name: groupName,
      power: idx === 0 ? 5 : 3,
      description: `${groupName} faction in ${city.name}`,
      alignment: this.rollAlignment()
    }));
    city.exNovoHistory.push({
      step: 'Factions',
      result: `${factionData.groups.length} factions: ${factionData.groups.join(', ')}`
    });

    // Initial districts and population
    city.districts.push({
      id: 'district-0',
      name: `${city.name} Center`,
      density: 1,
      population: Math.floor(100 + this.random() * 400),
      purpose: 'Primary settlement'
    });

    city.populationGrowth.push({ period: 0, population: city.districts[0].population });
  }

  developmentPhase(city, params) {
    const phases = params.developmentPhases || 3;

    for (let phase = 0; phase < phases; phase++) {
      // Roll on event table
      const eventType = Math.floor(this.random() * 6); // 0=warfare, 1=politics, 2=economy, 3=culture, 4=infrastructure, 5=environment
      const tables = ['warfare', 'politics', 'economy', 'culture', 'infrastructure', 'environment'];
      const eventTable = tables[eventType];
      const event = this.rollOnTable(eventTable);

      city.events.push({
        period: phase,
        type: eventTable,
        event: event.title,
        consequence: event.consequence || 'see description'
      });

      // Natural Growth (optional)
      if (this.random() > 0.3) {
        const newDistrict = {
          id: `district-${city.districts.length}`,
          name: this.generateDistrictName(),
          density: 1,
          population: Math.floor(50 + this.random() * 300),
          purpose: this.generateDistrictPurpose()
        };
        city.districts.push(newDistrict);
      }

      // Update population
      const totalPop = city.districts.reduce((sum, d) => sum + d.population, 0);
      city.populationGrowth.push({ period: phase + 1, population: totalPop });
    }

    city.exNovoHistory.push({
      phase: 'Development',
      eventsGenerated: city.events.length,
      districtsAdded: city.districts.length
    });
  }

  toppingOutPhase(city, params) {
    // Add remaining growth and final touches
    const additionalLandmarks = Math.floor(this.random() * 2) + 2;
    for (let i = 0; i < additionalLandmarks; i++) {
      city.landmarks.push({
        id: `landmark-${i}`,
        name: this.generateLandmarkName(),
        type: this.generateLandmarkType(),
        description: `A notable landmark in ${city.name}`
      });
    }

    city.exNovoHistory.push({
      phase: 'Topping Out',
      landmarksAdded: additionalLandmarks,
      finalPopulation: city.populationGrowth[city.populationGrowth.length - 1].population
    });
  }

  // Helper methods
  generateDistrictName() {
    const prefixes = ['North', 'South', 'East', 'West', 'Upper', 'Lower', 'Old', 'New', 'High', 'Low', 'Merchants\'', 'Craftsmens\'', 'Noble'];
    const names = ['Ward', 'Quarter', 'District', 'Sector', 'Borough', 'Precinct', 'Haven', 'Vale', 'Row', 'Gate'];

    const prefix = prefixes[Math.floor(this.random() * prefixes.length)];
    const name = names[Math.floor(this.random() * names.length)];

    return `${prefix} ${name}`;
  }

  generateDistrictPurpose() {
    const purposes = [
      'Commercial hub and marketplace',
      'Noble estates and aristocratic residences',
      'Guild halls and craftspeople',
      'Harbor and trade district',
      'Temple and religious institutions',
      'Military barracks and training grounds',
      'Scholarly libraries and academies',
      'Entertainment and hospitality',
      'Artisans and crafters',
      'Farming and agriculture'
    ];

    return purposes[Math.floor(this.random() * purposes.length)];
  }

  generateLandmarkName() {
    const adjectives = ['Grand', 'Ancient', 'Royal', 'Sacred', 'Dark', 'Golden', 'Silver', 'Marble', 'Stone', 'Crystal'];
    const nouns = ['Tower', 'Hall', 'Gate', 'Bridge', 'Plaza', 'Temple', 'Archive', 'Keep', 'Monument', 'Fountain'];

    const adj = adjectives[Math.floor(this.random() * adjectives.length)];
    const noun = nouns[Math.floor(this.random() * nouns.length)];

    return `The ${adj} ${noun}`;
  }

  generateLandmarkType() {
    const types = ['Monument', 'Building', 'Natural Feature', 'Trade Hub', 'Religious Site', 'Military Fortification'];
    return types[Math.floor(this.random() * types.length)];
  }

  rollAlignment() {
    const alignments = ['Lawful Good', 'Neutral Good', 'Chaotic Good', 'Lawful Neutral', 'True Neutral', 'Chaotic Neutral', 'Lawful Evil', 'Neutral Evil', 'Chaotic Evil'];
    return alignments[Math.floor(this.random() * alignments.length)];
  }
}

module.exports = ExNovoFramework;
