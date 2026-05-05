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
}

export interface HistoricalEvent {
  id: string;
  title: string;
  description: string;
  yearOccurred: number;
  severity: number;
  affectedLocations: string[];
}

export interface GenerationMetadata {
  completionLevel: string;
  totalCities: number;
  totalPOIs: number;
  totalNPCs: number;
  totalFactions: number;
  totalCommodities: number;
  totalTradeRoutes: number;
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
