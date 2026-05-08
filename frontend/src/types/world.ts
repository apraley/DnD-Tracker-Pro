// Type definitions for world builder

export interface WorldParams {
  name: string;
  age?: number;
  magicLevel?: number;
  civilizationAbundance?: number;
  climate?: string;
  terrain?: string;
  planeId?: string;
}

export interface Hex {
  x: number;
  y: number;
}

export interface City {
  id: string;
  name: string;
  population: number;
  hex_x: number;
  hex_y: number;
  governmentType: string;
  history: string;
  rulingFactions: Faction[];
  criminalElements: string;
  notableCitizens: NPC[];
  economicFocus: string;
  discovered: boolean;
  prosperity_index?: number;

  // ExNovo Integration
  exNovoMetadata?: {
    totalPopulation?: number;
    districtCount?: number;
    phases?: Array<{ phase: string; description: string }>;
    resources?: string[];
    /** Populated at world-generation time for GRIMOIRE export */
    districts?: Array<{
      name: string;
      description: string;
      character: string;
      establishments: Array<{
        id: string;
        name: string;
        type: string;
        quality: 'squalid' | 'poor' | 'modest' | 'comfortable' | 'wealthy';
        proprietor: { name: string; race: string; description: string };
        rumor?: string;
        stock?: string[];
      }>;
    }>;
  };
  factions?: Faction[];
  landmarks?: Array<{ id: string; name: string; description?: string }>;
  generatedLore?: string;
  donjonLayout?: string;
}

export interface PointOfInterest {
  id: string;
  name: string;
  type: string;
  hex_x: number;
  hex_y: number;
  dangerLevel: number;
  description: string;
  adventureHooks: AdventureHook[];
  discovered: boolean;

  // ExUmbra Integration
  exUmbraMetadata?: {
    size?: string;
    difficulty?: string;
    threatCount?: number;
    rewardCount?: number;
    aspectCount?: number;
  };
  aspects?: Array<{ id: string; name: string; category: string; description?: string }>;
  inhabitants?: NPC[];
  nearbyCity?: City;
  cityConnections?: Array<{ cityId: string; distance: number }>;
  generatedLore?: string;
  donjonLayout?: string;

  // Ecological Wonder Integration
  wonderMetadata?: {
    terrain: string;
    lore: string;
    leader?: {
      name: string;
      archetype: string;
      style: string;
      alignment: string;
      grimoireNpcRef: string;
    };
    questHooks?: Array<{ title: string; description: string; difficulty: number }>;
    boons?: Array<{ name: string; description: string; mechanicalEffect: string }>;
    banes?: Array<{ name: string; description: string; mechanicalEffect: string }>;
    establishments?: Array<{
      id: string;
      name: string;
      type: string;
      grimoireCommerceRef: string;
    }>;
    discoveryRequirement?: string;
  };
}

export interface AdventureHook {
  title: string;
  description: string;
  encounterType: string;
  difficulty: number;
}

export interface NPC {
  id: string;
  name: string;
  type: string;
  race: string;
  class?: string;
  level?: number;
  alignment: string;
  description: string;
  influence: string;
  associatedCityId?: string;
  ac?: number;
  hp?: number;
  str?: number;
  dex?: number;
  con?: number;
  int?: number;
  wis?: number;
  cha?: number;

  // Additional fields from ExNovo/ExUmbra
  role?: string;
  faction?: string;
  factionOrigin?: string;
  cityOrigin?: string;
}

export interface Faction {
  id: string;
  name: string;
  type: string;
  description: string;
  headquartersId: string;
  alignment: string;
  members: string[];
  rivals: string[];
  allies: string[];
  influence?: number;
  leader?: string;
}

export interface HistoricalEvent {
  id: string;
  title: string;
  description: string;
  yearOccurred: number;
  severity: number;
  affectedLocations: string[];
  type?: string;
  rippleEffects?: string[];
}

export interface GenerationMetadata {
  completionLevel: string;
  totalCities: number;
  totalPOIs: number;
  totalNPCs: number;
  totalFactions: number;
  totalCommodities: number;
  totalTradeRoutes: number;
  totalHistoricalEvents?: number;
  citiesWithLayouts?: number;
  dungeonsWithLayouts?: number;
}

export interface HexCell {
  col: number;
  row: number;
  terrainType: number; // 0=deep ocean, 1=shallow, 2=coast, 3=beach, 4=grassland, 5=forest, 6=hills, 7=mountains, 8=high mountains, 9=ice
  hex_x: number;
  hex_y: number;
}

export interface TerrainStats {
  water: number;
  grassland: number;
  forest: number;
  mountains: number;
  ice: number;
  totalHexes: number;
  waterPercent: number;
}

export interface Route {
  fromCityId: string;
  toCityId: string;
  /** Euclidean distance in hex units */
  distanceHexes: number;
  /** Terrain at the midpoint of the route */
  dominantTerrain: string;
}

export interface World {
  id?: string;
  name: string;
  age: number;
  magicLevel: number;
  civilizationAbundance: number;
  climate: string;
  terrain: string;
  worldSeed: string;
  createdAt: Date;
  cities: City[];
  pointsOfInterest: PointOfInterest[];
  npcs: NPC[];
  factions: Faction[];
  weatherPatterns: WeatherPattern[];
  historicalEvents?: HistoricalEvent[];
  generationMetadata?: GenerationMetadata;
  mapVisualization?: string;
  hexGrid?: Record<string, HexCell>;
  terrainStats?: TerrainStats;
  mapWidth?: number;
  mapHeight?: number;
  routes?: Route[];
}

export interface WeatherPattern {
  id: string;
  hex_x: number;
  hex_y: number;
  currentWeather: string;
  temperature: number;
  windSpeed: number;
  humidity: number;
  anomaly?: {
    name: string;
    severity: number;
  };
}

export interface Commodity {
  id: string;
  name: string;
  baseValue: number;
  originCityId: string;
  demand: number;
  supply: number;
  priceTrend: string;
}
