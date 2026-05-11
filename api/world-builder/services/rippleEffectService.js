// Ripple Effect & Event System Service - Phase 5
class RippleEffectService {
  constructor(world) {
    this.world = world;
    this.eventChain = [];
    this.worldState = {
      events: [],
      impacts: [],
      trends: []
    };
  }

  // Generate initial historical events
  generateHistoricalEvents() {
    const eventCount = Math.floor(Math.random() * 10) + 5;
    const events = [];

    for (let i = 0; i < eventCount; i++) {
      const eventType = this.pickRandom([
        'War', 'Plague', 'Discovery', 'Cultural Shift', 'Trade Route Established',
        'Monster Attack', 'Religious Awakening', 'Economic Crisis', 'Natural Disaster',
        'Political Coup', 'Magical Phenomenon', 'Exploration', 'Alliance Formed'
      ]);

      const event = {
        id: `event_${i}`,
        type: eventType,
        title: this.generateEventTitle(eventType),
        description: this.generateEventDescription(eventType),
        yearOccurred: Math.floor(Math.random() * this.world.age),
        affectedCities: this.selectAffectedCities(2),
        affectedFactions: this.selectAffectedFactions(2),
        triggeredByNpcId: this.selectRandomNPC()?.id || null,
        severity: Math.floor(Math.random() * 10) + 1,
        consequences: this.generateConsequences(eventType),
        rippleChainLength: 0 // Will be calculated
      };

      events.push(event);
    }

    return events;
  }

  // The core ripple effect system: one event cascades into others
  simulateRippleChain(initialEvent) {
    const chain = [initialEvent];
    const impactLog = [];

    let currentEvent = initialEvent;
    let depth = 0;
    const maxDepth = 5; // Prevent infinite chains

    while (depth < maxDepth && Math.random() > 0.4) {
      depth++;

      // Determine what this event triggers
      const nextEvent = this.generateRippleEvent(currentEvent);
      if (!nextEvent) break;

      chain.push(nextEvent);

      // Log the chain
      impactLog.push({
        step: depth,
        trigger: currentEvent.type,
        consequence: nextEvent.type,
        impact: nextEvent.description
      });

      currentEvent = nextEvent;
    }

    return {
      chain,
      impactLog,
      chainLength: chain.length,
      totalWorldImpact: this.calculateWorldImpact(chain)
    };
  }

  generateRippleEvent(triggerEvent) {
    // Example: A bard creates a song -> becomes popular -> creates new delicacy demand
    const rippleMap = {
      'War': [
        { type: 'Economic Crisis', consequence: 'Trade disrupted, prices rise' },
        { type: 'Monster Attack', consequence: 'Weakened defenses invite monsters' },
        { type: 'Political Coup', consequence: 'Instability leads to power grabs' }
      ],
      'Plague': [
        { type: 'Economic Crisis', consequence: 'Labor shortage, prices skyrocket' },
        { type: 'Religious Awakening', consequence: 'People turn to faith for salvation' },
        { type: 'Political Coup', consequence: 'Leadership blamed, government falls' }
      ],
      'Discovery': [
        { type: 'Trade Route Established', consequence: 'New trade possibilities open' },
        { type: 'Cultural Shift', consequence: 'Society adapts to new knowledge' },
        { type: 'Economic Boom', consequence: 'New resources drive wealth' }
      ],
      'Cultural Shift': [
        { type: 'Trade Route Established', consequence: 'New cultural exchange opens trade' },
        { type: 'Religious Awakening', consequence: 'New values reshape society' },
        { type: 'Political Coup', consequence: 'New ideology challenges old order' }
      ],
      'Trade Route Established': [
        { type: 'Economic Boom', consequence: 'Commerce flourishes, wealth increases' },
        { type: 'Cultural Shift', consequence: 'Foreign ideas and goods spread' },
        { type: 'Alliance Formed', consequence: 'Trading partners become allies' }
      ],
      'Monster Attack': [
        { type: 'War', consequence: 'Organized response becomes war' },
        { type: 'Economic Crisis', consequence: 'Damage disrupts economy' },
        { type: 'Political Coup', consequence: 'Leaders blamed for failing defenses' }
      ]
    };

    const possibleRipples = rippleMap[triggerEvent.type];
    if (!possibleRipples) return null;

    const ripple = this.pickRandom(possibleRipples);

    return {
      id: `event_ripple_${Date.now()}_${Math.random()}`,
      type: ripple.type,
      title: this.generateEventTitle(ripple.type),
      description: `As a result of ${triggerEvent.type}: ${ripple.consequence}`,
      yearOccurred: triggerEvent.yearOccurred + Math.floor(Math.random() * 5) + 1,
      triggeredByEvent: triggerEvent.id,
      severity: Math.max(1, triggerEvent.severity - 1),
      consequences: this.generateConsequences(ripple.type),
      isRippleEffect: true
    };
  }

  // Specific example: Bard's song creates cultural delicacy demand
  simulateBardSongRipple() {
    const bard = this.pickRandom(this.world.npcs.filter(n => n.type === 'bard' || n.class === 'Bard'));
    if (!bard) return null;

    const song = {
      id: `song_${Date.now()}`,
      title: this.generateSongTitle(),
      composedBy: bard.name,
      theme: this.pickRandom(['Love', 'Heroism', 'Nature', 'Food', 'History']),
      popularity: 0, // Will grow
      spreadRadius: 0 // Will expand
    };

    const ripples = [];

    // Step 1: Song becomes popular
    ripples.push({
      stage: 1,
      event: `${bard.name}'s song "${song.title}" becomes wildly popular`,
      affectedCities: this.selectAffectedCities(3),
      moralBoost: 15,
      economicBoost: 5
    });

    // Step 2: Song is about a delicacy (e.g., owlbear meat)
    if (song.theme === 'Food') {
      const delicacy = 'Owlbear Meat';
      ripples.push({
        stage: 2,
        event: `The song creates demand for ${delicacy}`,
        affectedCities: this.selectAffectedCities(2),
        newDemandFor: delicacy,
        demandIncrease: 60
      });

      // Step 3: Town with hunting economy prospers
      const huntingTown = this.pickRandom(
        this.world.cities.filter(c => c.economicFocus === 'Hunting')
      );
      if (huntingTown) {
        ripples.push({
          stage: 3,
          event: `${huntingTown.name} experiences economic boom from ${delicacy} exports`,
          affectedCities: [huntingTown],
          populationGrowth: 20,
          wealthIncrease: 35,
          newJobs: 150
        });

        // Step 4: Trade routes strengthen
        ripples.push({
          stage: 4,
          event: `Trade routes from ${huntingTown.name} strengthen due to high demand`,
          tradesIncreased: 5,
          profitMarginIncrease: 25
        });

        // Step 5: Regional economic shift
        ripples.push({
          stage: 5,
          event: `Regional economy shifts toward hunting and meat trade`,
          affectedRegions: ['Northern trade network'],
          longTermEconomicImpact: 'Permanent structural change'
        });
      }
    }

    return {
      triggerEvent: `Song by ${bard.name}`,
      rippleChain: ripples,
      totalImpact: `Changed regional culture, economy, and trade`
    };
  }

  // Event chain: Party actions trigger ripples
  generatePartyActionRipples(actionType, targetEntity) {
    const ripples = [];

    switch (actionType) {
      case 'Killed Bandit Leader':
        ripples.push({
          shortTerm: 'Local merchants celebrate, ambushes cease',
          mediumTerm: 'Bandit gang fragments into smaller groups',
          longTerm: 'Trade routes become safer, prices drop'
        });
        break;

      case 'Established Alliance':
        ripples.push({
          shortTerm: 'Two factions become allies',
          mediumTerm: 'Joint military ventures',
          longTerm: 'Cultural and economic integration'
        });
        break;

      case 'Discovered Ancient Artifact':
        ripples.push({
          shortTerm: 'Immediate value in magical research',
          mediumTerm: 'Schools and cults seek the artifact',
          longTerm: 'Power balance in region shifts'
        });
        break;

      case 'Defeated Monster':
        ripples.push({
          shortTerm: 'Area becomes safe again',
          mediumTerm: 'Settlements expand into cleared lands',
          longTerm: 'New trade routes open'
        });
        break;
    }

    return ripples;
  }

  calculateWorldImpact(eventChain) {
    let impact = 0;

    eventChain.forEach(event => {
      impact += event.severity || 5;
    });

    return {
      totalSeverity: impact,
      populationAffected: impact * 1000,
      economicImpact: impact * 5000,
      likelihood: eventChain.length > 2 ? 'Cascading' : 'Single Event'
    };
  }

  generateEventTitle(eventType) {
    const titles = {
      'War': ['The Great Conflict', 'War of the Roses', 'The Siege', 'The Invasion'],
      'Plague': ['The Sickness', 'The Black Death Returns', 'The Pestilence', 'The Infection'],
      'Discovery': ['The Lost City Found', 'Treasure Unearthed', 'The Ancient Truth', 'A New World'],
      'Trade Route Established': ['The Silk Road Opens', 'New Trade Links', 'Commerce Flourishes'],
      'Economic Boom': ['Golden Years', 'Prosperity Rising', 'The Wealth Explosion'],
      'Monster Attack': ['The Beasts Attack', 'Monsters Invade', 'The Reckoning'],
      'Religious Awakening': ['Faith Reborn', 'The Spiritual Awakening', 'Divine Revelation'],
      'Political Coup': ['The Coup', 'Power Shifts', 'The Overthrow']
    };

    return this.pickRandom(titles[eventType] || [eventType]);
  }

  generateEventDescription(eventType) {
    const descriptions = {
      'War': 'Two factions clash in armed conflict',
      'Plague': 'A disease sweeps through the land',
      'Discovery': 'Something long lost has been found',
      'Economic Crisis': 'Markets collapse, prices soar',
      'Trade Route Established': 'New commerce routes open between cities',
      'Monster Attack': 'Creatures attack settlements',
      'Religious Awakening': 'Faith and spirituality transform society',
      'Cultural Shift': 'Society\'s values and beliefs change',
      'Political Coup': 'Government leadership changes violently',
      'Magical Phenomenon': 'Magic behaves unpredictably',
      'Alliance Formed': 'Factions join together',
      'Exploration': 'New lands are discovered'
    };

    return descriptions[eventType] || 'An event of significance occurs';
  }

  generateConsequences(eventType) {
    const consequenceMap = {
      'War': ['Economic damage', 'Population loss', 'Political instability', 'Refugee crisis'],
      'Plague': ['Population decline', 'Labor shortage', 'Economic disruption', 'Desperation'],
      'Discovery': ['New opportunities', 'Wealth influx', 'Scientific advancement', 'Cultural change'],
      'Trade Route': ['Economic growth', 'Cultural exchange', 'Increased wealth', 'New alliances']
    };

    return consequenceMap[eventType] || ['Uncertainty', 'Change', 'Adaptation'];
  }

  generateSongTitle() {
    const titles = [
      'The Ballad of Starlight',
      'Song of Valor',
      'The Lover\'s Lament',
      'The Feast of Kings',
      'Owlbear Heart',
      'The Journey Home',
      'Heroes\' Anthem',
      'The Lost Love',
      'The Dragon\'s Fall',
      'The Wanderer\'s Tale'
    ];
    return this.pickRandom(titles);
  }

  selectAffectedCities(count) {
    const cities = [];
    for (let i = 0; i < count; i++) {
      cities.push(this.pickRandom(this.world.cities).name);
    }
    return cities;
  }

  selectAffectedFactions(count) {
    const factions = [];
    for (let i = 0; i < count; i++) {
      factions.push(this.pickRandom(this.world.factions || []).name || 'Unknown');
    }
    return factions;
  }

  selectRandomNPC() {
    return this.pickRandom(this.world.npcs || []);
  }

  pickRandom(array) {
    if (!array || array.length === 0) return null;
    return array[Math.floor(Math.random() * array.length)];
  }
}

module.exports = RippleEffectService;
