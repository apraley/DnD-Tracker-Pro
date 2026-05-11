// Realistic Weather System Service - Phase 3
class WeatherService {
  constructor(world) {
    this.world = world;
    this.weatherHistory = new Map();
  }

  generateWorldWeather() {
    const patterns = [];
    const hexGridWidth = 51; // 0-50
    const hexGridHeight = 51;

    // Sample a grid of hexes for weather
    for (let x = 0; x < hexGridWidth; x += 5) {
      for (let y = 0; y < hexGridHeight; y += 5) {
        patterns.push(this.generateHexWeather(x, y));
      }
    }

    return patterns;
  }

  generateHexWeather(hex_x, hex_y) {
    const season = this.determineSeasonByClimate(this.world.climate);
    const baseTemp = this.getSeasonBaseTemp(season, this.world.climate);
    const variance = Math.floor(Math.random() * 20) - 10;
    const temperature = baseTemp + variance;

    const weather = {
      id: `weather_${hex_x}_${hex_y}`,
      hex_x,
      hex_y,
      season,
      currentWeather: this.generateWeatherForSeason(season, this.world.climate),
      temperature,
      windSpeed: Math.floor(Math.random() * 30),
      humidity: Math.floor(Math.random() * 100),
      precipitationChance: this.calculatePrecipitation(season, this.world.climate),
      visibility: this.calculateVisibility(season),
      anomaly: null,
      anomalySeverity: 0,
      hazards: this.generateHazards(season, this.world.climate),
      lastUpdated: new Date(),
      forecastNextDay: null
    };

    // 15% chance of anomaly
    if (Math.random() < 0.15) {
      const anomaly = this.generateAnomaly(season, temperature);
      weather.anomaly = anomaly.type;
      weather.anomalySeverity = anomaly.severity;
      weather.hazards.push(`${anomaly.type} (Severity ${anomaly.severity}/10)`);
    }

    return weather;
  }

  determineSeasonByClimate(climate) {
    const seasons = ['Spring', 'Summer', 'Autumn', 'Winter'];

    if (climate === 'Eternal Spring') return 'Spring';
    if (climate === 'Tropical') return this.pickRandom(['Summer', 'Summer', 'Spring', 'Autumn']);
    if (climate === 'Arid') return this.pickRandom(['Summer', 'Summer', 'Summer', 'Winter']);
    if (climate === 'Cold') return this.pickRandom(['Winter', 'Winter', 'Winter', 'Autumn']);
    if (climate === 'Volatile') return this.pickRandom(seasons);

    // Default for Temperate, Cursed, Magically Stabilized
    return this.pickRandom(seasons);
  }

  getSeasonBaseTemp(season, climate) {
    const temps = {
      Spring: { Temperate: 55, Tropical: 80, Arid: 70, Cold: 35, 'Eternal Spring': 65, Volatile: 50 },
      Summer: { Temperate: 75, Tropical: 95, Arid: 110, Cold: 55, 'Eternal Spring': 75, Volatile: 70 },
      Autumn: { Temperate: 55, Tropical: 75, Arid: 80, Cold: 35, 'Eternal Spring': 65, Volatile: 45 },
      Winter: { Temperate: 35, Tropical: 70, Arid: 45, Cold: 10, 'Eternal Spring': 65, Volatile: 25 }
    };

    return temps[season]?.[climate] || 60;
  }

  generateWeatherForSeason(season, climate) {
    const weatherMap = {
      Spring: ['Clear', 'Partly Cloudy', 'Light Rain', 'Showers'],
      Summer: ['Clear', 'Sunny', 'Partly Cloudy', 'Thunderstorm'],
      Autumn: ['Clear', 'Cloudy', 'Rainy', 'Windy'],
      Winter: ['Clear', 'Cloudy', 'Snow', 'Blizzard']
    };

    // Adjust for climate
    if (climate === 'Tropical') {
      return this.pickRandom(['Clear', 'Humid', 'Thunderstorm', 'Heavy Rain']);
    }
    if (climate === 'Arid') {
      return this.pickRandom(['Clear', 'Hot', 'Dust Storm', 'Clear']);
    }
    if (climate === 'Cold') {
      return this.pickRandom(['Snow', 'Blizzard', 'Clear', 'Cloudy']);
    }

    return this.pickRandom(weatherMap[season] || weatherMap.Spring);
  }

  calculatePrecipitation(season, climate) {
    const precipMap = {
      Spring: 45,
      Summer: 40,
      Autumn: 35,
      Winter: 25
    };

    let base = precipMap[season] || 35;

    if (climate === 'Tropical') base += 30;
    if (climate === 'Arid') base -= 40;
    if (climate === 'Cold') base -= 10;

    return Math.max(0, Math.min(100, base));
  }

  calculateVisibility(season) {
    const visibilities = ['Excellent (10+ miles)', 'Good (5-10 miles)', 'Moderate (1-5 miles)', 'Poor (1/4-1 mile)', 'Very Poor (less than 1/4 mile)'];
    return this.pickRandom(visibilities);
  }

  generateHazards(season, climate) {
    const hazards = [];

    if (season === 'Winter') hazards.push('Extreme cold (-10 to -30°F)');
    if (season === 'Summer' && climate === 'Arid') hazards.push('Extreme heat (100°F+)');
    if (climate === 'Tropical') hazards.push('Humidity (70%+ humidity)');
    if (climate === 'Volatile') hazards.push('Unpredictable weather shifts');

    return hazards;
  }

  generateAnomaly(season, temperature) {
    const anomalies = [
      { type: 'Freak Tornado', severity: 8, seasons: ['Spring', 'Summer'] },
      { type: 'Sudden Frost', severity: 6, seasons: ['Spring', 'Autumn'] },
      { type: 'Flash Flood', severity: 9, seasons: ['Spring', 'Summer', 'Autumn'] },
      { type: 'Meteor Shower', severity: 5, seasons: ['Winter', 'Autumn'] },
      { type: 'Plague of Insects', severity: 4, seasons: ['Summer', 'Autumn'] },
      { type: 'Eerie Fog', severity: 3, seasons: ['Winter', 'Autumn'] },
      { type: 'Magical Aurora', severity: 2, seasons: ['Winter'] },
      { type: 'Earthquake', severity: 9, seasons: ['any'] },
      { type: 'Volcanic Ash Cloud', severity: 7, seasons: ['any'] },
      { type: 'Haunted Storm', severity: 8, seasons: ['any'] },
      { type: 'Dimensional Rift', severity: 10, seasons: ['any'] },
      { type: 'Time Distortion', severity: 9, seasons: ['any'] }
    ];

    const viable = anomalies.filter(a => a.seasons.includes(season) || a.seasons.includes('any'));
    return this.pickRandom(viable || anomalies[0]);
  }

  // Weather affects travel
  calculateTravelDifficulty(weather) {
    let difficulty = 0;

    if (weather.temperature < 0) difficulty += 3;
    if (weather.temperature > 95) difficulty += 2;
    if (weather.windSpeed > 20) difficulty += 2;
    if (weather.precipitationChance > 70) difficulty += 2;
    if (weather.anomaly) difficulty += weather.anomalySeverity;

    return Math.min(difficulty, 20);
  }

  // Multi-plane support
  generatePlaneWeather(plane) {
    const planeWeatherMap = {
      'Material Plane': 'Realistic seasonal weather',
      'Shadowfell': 'Perpetual twilight, cold temperatures, unnatural darkness',
      'Feywild': 'Whimsical, chaotic weather, colors shift with emotion',
      'Elemental Plane of Fire': 'Extreme heat, constant flames, no rain',
      'Elemental Plane of Water': 'Constant rain and flooding, high humidity',
      'Elemental Plane of Air': 'Extreme winds, clear visibility, unpredictable',
      'Elemental Plane of Earth': 'Tremors, dust storms, stagnant air',
      'Astral Plane': 'No weather, silver void, timeless',
      'Abyss': 'Chaotic storms, impossible weather, reality warps',
      'Nine Hells': 'Sulfurous heat, acid rain, toxic air'
    };

    return planeWeatherMap[plane] || 'Unknown weather patterns';
  }

  pickRandom(array) {
    return array[Math.floor(Math.random() * array.length)];
  }
}

module.exports = WeatherService;
