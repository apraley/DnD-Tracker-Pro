// Economic Simulation Service - Phase 4
class EconomicService {
  constructor(world, cities, factions) {
    this.world = world;
    this.cities = cities;
    this.factions = factions;
  }

  generateCommodities() {
    const commodityTypes = [
      'Grain', 'Fruit', 'Lumber', 'Stone', 'Iron Ore', 'Gold', 'Silver', 'Copper',
      'Wool', 'Linen', 'Leather', 'Wine', 'Ale', 'Herbs', 'Spices', 'Tea',
      'Furs', 'Fish', 'Salt', 'Oil', 'Wax', 'Dyes', 'Glass', 'Pottery',
      'Bronze Tools', 'Iron Tools', 'Weapons', 'Armor', 'Horses', 'Livestock'
    ];

    const commodities = [];
    const citiesSet = new Set();

    commodityTypes.forEach((commodity, idx) => {
      let originCity;
      do {
        originCity = this.pickRandom(this.cities);
      } while (citiesSet.has(originCity.id) && commodities.length < this.cities.length);

      commodities.push({
        id: `commodity_${idx}`,
        name: commodity,
        description: this.getCommodityDescription(commodity),
        baseValue: this.getCommodityBaseValue(commodity),
        originCityId: originCity.id,
        originCityName: originCity.name,
        currentDemand: Math.floor(Math.random() * 10) + 1, // 1-10
        currentSupply: Math.floor(Math.random() * 10) + 1, // 1-10
        priceTrend: this.pickRandom(['Rising', 'Falling', 'Stable']),
        rarity: this.calculateRarity(commodity),
        transportDifficulty: Math.floor(Math.random() * 10) + 1,
        perishable: this.isPerishable(commodity),
        perishDays: this.isPerishable(commodity) ? Math.floor(Math.random() * 30) + 5 : null,
        historicalPrice: this.getCommodityBaseValue(commodity),
        currentPrice: null, // Calculated based on supply/demand
        weeklyFluctuation: Math.floor(Math.random() * 30) - 15 // -15% to +15%
      });

      citiesSet.add(originCity.id);
    });

    // Calculate current prices
    commodities.forEach(commodity => {
      commodity.currentPrice = this.calculateCommodityPrice(commodity);
    });

    return commodities;
  }

  generateTradeRoutes() {
    const routes = [];
    const routeCount = this.cities.length * 1.5;

    for (let i = 0; i < routeCount; i++) {
      const fromCity = this.pickRandom(this.cities);
      let toCity;
      do {
        toCity = this.pickRandom(this.cities);
      } while (toCity.id === fromCity.id);

      const distance = this.calculateDistance(fromCity, toCity);
      const commodity = this.pickRandom(this.world.commodities);
      const controllingFaction = Math.random() > 0.5 ? this.pickRandom(this.factions) : null;

      const route = {
        id: `route_${i}`,
        fromCityId: fromCity.id,
        fromCityName: fromCity.name,
        toCityId: toCity.id,
        toCityName: toCity.name,
        commodityId: commodity.id,
        commodityName: commodity.name,
        distance,
        difficulty: this.calculateRouteDifficulty(distance),
        travelDays: Math.ceil(distance / 20),
        active: Math.random() > 0.2, // 80% active
        controllingFactionId: controllingFaction?.id || null,
        controllingFactionName: controllingFaction?.name || 'Independent',
        toll: controllingFaction ? Math.floor(Math.random() * 50) + 10 : 0,
        safety: Math.floor(Math.random() * 100),
        hazards: this.generateRouteHazards(),
        lastAttack: Math.random() > 0.7 ? Math.floor(Math.random() * 30) + 1 : null,
        profitMargin: Math.floor(Math.random() * 200) + 20, // 20-220%
        frequencyPerMonth: Math.floor(Math.random() * 10) + 2,
        reputation: this.pickRandom(['Dangerous', 'Reliable', 'Recently Attacked', 'Safe', 'Under Review'])
      };

      routes.push(route);
    }

    return routes;
  }

  calculateCommodityPrice(commodity) {
    const demandSupplyRatio = commodity.currentDemand / Math.max(commodity.currentSupply, 1);
    const priceMod = demandSupplyRatio > 1.5 ? 1.5 : demandSupplyRatio < 0.5 ? 0.5 : 1;
    const fluctuation = 1 + (commodity.weeklyFluctuation / 100);
    return Math.round(commodity.baseValue * priceMod * fluctuation);
  }

  calculateDistance(city1, city2) {
    const dx = city1.hex_x - city2.hex_x;
    const dy = city1.hex_y - city2.hex_y;
    return Math.ceil(Math.sqrt(dx * dx + dy * dy) * 10);
  }

  calculateRouteDifficulty(distance) {
    if (distance < 50) return this.pickRandom([1, 2, 2, 3]);
    if (distance < 150) return this.pickRandom([3, 4, 4, 5]);
    if (distance < 300) return this.pickRandom([5, 6, 6, 7]);
    return this.pickRandom([7, 8, 8, 9]);
  }

  generateRouteHazards() {
    const hazardPool = [
      'Bandits', 'Monsters', 'Natural Disasters', 'Political Instability',
      'Corrupt Officials', 'Rival Merchants', 'Beast Attacks', 'Harsh Weather'
    ];

    const hazards = [];
    for (let i = 0; i < Math.floor(Math.random() * 3); i++) {
      hazards.push(this.pickRandom(hazardPool));
    }
    return hazards;
  }

  getCommodityDescription(commodity) {
    const descriptions = {
      'Grain': 'Essential staple crop, high demand in cities',
      'Fruit': 'Fresh produce, perishable, valued luxury',
      'Lumber': 'Building material, constant demand',
      'Stone': 'Construction and building material',
      'Iron Ore': 'Raw material for metalworking',
      'Gold': 'Precious metal, high value, sought after',
      'Wine': 'Luxury beverage, long shelf life',
      'Spices': 'High value, light weight, in demand',
      'Weapons': 'Military equipment, essential for armies',
      'Armor': 'Protection gear, steady demand'
    };
    return descriptions[commodity] || 'A valuable commodity';
  }

  getCommodityBaseValue(commodity) {
    const baseValues = {
      'Grain': 5, 'Fruit': 10, 'Lumber': 15, 'Stone': 8, 'Iron Ore': 20,
      'Gold': 500, 'Silver': 100, 'Copper': 15, 'Wool': 20, 'Linen': 25,
      'Leather': 30, 'Wine': 40, 'Ale': 15, 'Herbs': 25, 'Spices': 100,
      'Tea': 50, 'Furs': 75, 'Fish': 10, 'Salt': 5, 'Oil': 15,
      'Wax': 20, 'Dyes': 30, 'Glass': 40, 'Pottery': 20, 'Bronze Tools': 50,
      'Iron Tools': 60, 'Weapons': 200, 'Armor': 300, 'Horses': 500, 'Livestock': 50
    };
    return baseValues[commodity] || 25;
  }

  calculateRarity(commodity) {
    const rare = ['Gold', 'Silver', 'Spices', 'Tea', 'Furs', 'Magic Essence'];
    const uncommon = ['Iron Ore', 'Wine', 'Herbs', 'Glass', 'Weapons'];

    if (rare.includes(commodity)) return 'Rare';
    if (uncommon.includes(commodity)) return 'Uncommon';
    return 'Common';
  }

  isPerishable(commodity) {
    const perishables = ['Fruit', 'Fish', 'Wine', 'Ale', 'Herbs', 'Tea', 'Vegetables'];
    return perishables.includes(commodity);
  }

  // Economic impact simulation
  simulateEconomicImpact(event) {
    const impacts = [];

    if (event.type === 'Commodity Boom') {
      // Increase demand and price
      const commodity = this.pickRandom(this.world.commodities);
      commodity.currentDemand = Math.min(10, commodity.currentDemand + 3);
      commodity.currentPrice = this.calculateCommodityPrice(commodity);
      impacts.push(`${commodity.name} demand surged! Price: ${commodity.currentPrice}gp`);
    }

    if (event.type === 'Trade Route Blockade') {
      const route = this.pickRandom(this.world.tradeRoutes);
      route.active = false;
      impacts.push(`Trade route from ${route.fromCityName} to ${route.toCityName} blocked!`);
    }

    if (event.type === 'New Discovery') {
      // Create new commodity
      const newCommodity = {
        name: 'Rare Exotic Item',
        baseValue: 500,
        currentDemand: 8,
        currentSupply: 1,
        priceTrend: 'Rising'
      };
      impacts.push(`New commodity discovered: ${newCommodity.name}`);
    }

    return impacts;
  }

  pickRandom(array) {
    return array[Math.floor(Math.random() * array.length)];
  }
}

module.exports = EconomicService;
