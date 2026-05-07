// Hook for world builder API interactions
import { useState } from 'react';
import { World, WorldParams, City, PointOfInterest, Route } from '../types/world';
import {
  generateCityName,
  generateDungeonName,
  generatePOIName,
  generateWonderName,
  generateLandmarkName,
  resetNameGenerator
} from '../utils/nameGenerator';
import { generateTerrain, getViableLocations, getLandLocations } from '../utils/terrainGenerator';
import { simulateExNovo } from '../utils/exNovoSimulator';
import { fnv1a } from '../utils/establishmentGenerator';
import { exportForGrimoire } from '../utils/grimoireExport';

// Hex terrain type → travel label
const HEX_TERRAIN_LABEL: Record<number, string> = {
  0: 'sea', 1: 'sea', 2: 'sea',
  3: 'coast', 4: 'forest', 5: 'forest', 6: 'forest',
  7: 'plains', 8: 'savanna', 9: 'desert',
  10: 'hills', 11: 'mountain', 12: 'mountain',
  13: 'tundra', 14: 'ice',
};

export const useWorldBuilder = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [world, setWorld] = useState<World | null>(null);

  const generateWorld = async (params: WorldParams) => {
    setLoading(true);
    setError(null);
    try {
      const world = generateLocalWorld(params);
      setWorld(world);

      // ── Priority 1: Persist to localStorage for GRIMOIRE ──────────────────
      try {
        const payload = exportForGrimoire(world);
        localStorage.setItem('grimoire-world', JSON.stringify(payload));
        localStorage.setItem('grimoire-world-meta', JSON.stringify({
          worldName: world.name,
          savedAt: Date.now(),
          version: 1,
        }));
      } catch (storageErr) {
        console.warn('localStorage write failed (may be full or unavailable):', storageErr);
      }

      return world;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const generateLocalWorld = (params: WorldParams): World => {
    resetNameGenerator();

    const seed = Math.floor(Math.random() * 1000000);
    const worldSeed = seed.toString();
    const magicLevel = params.magicLevel ?? 5;

    // Generate fractal terrain client-side — climate + terrain drive water%, ice%, biome distribution
    const { hexGrid, stats, width: mapW, height: mapH } = generateTerrain(
      seed,
      params.climate ?? 'Temperate',
      params.terrain ?? 'Mixed',
    );
    const viableForCities = getViableLocations(hexGrid);
    const viableForPOIs = getLandLocations(hexGrid);

    // Shuffle locations
    const shuffledCities = [...viableForCities].sort(() => Math.random() - 0.5);
    const shuffledPOIs = [...viableForPOIs].sort(() => Math.random() - 0.5);

    const cities: City[] = [];
    const cityCount = Math.min(10 + ((params.civilizationAbundance || 5) * 2), 30);
    const govTypes = ['Monarchy', 'Democracy', 'Oligarchy', 'Theocracy', 'Merchant Republic'];
    const economicFocuses = ['Agriculture', 'Mining', 'Trade', 'Fishing', 'Crafting'];

    for (let i = 0; i < cityCount; i++) {
      const loc = shuffledCities[i] || { col: Math.floor(Math.random() * mapW), row: Math.floor(Math.random() * mapH) };
      const cityName = generateCityName();
      // ── Priority 3: stable seeded ID — same seed+index+name always → same ID
      const cityId = `city_${fnv1a(worldSeed + '|' + i + '|' + cityName).toString(16)}`;

      cities.push({
        id: cityId,
        name: cityName,
        population: Math.floor(Math.random() * 50000) + 5000,
        hex_x: loc.col,
        hex_y: loc.row,
        terrainType: hexGrid[`${loc.col},${loc.row}`]?.terrainType ?? 4,
        governmentType: govTypes[Math.floor(Math.random() * govTypes.length)],
        history: 'A city with a rich and storied past.',
        rulingFactions: [],
        criminalElements: 'Various underworld elements',
        notableCitizens: [],
        economicFocus: economicFocuses[Math.floor(Math.random() * economicFocuses.length)],
        discovered: false
      } as City);
    }

    // ── Priority 2: Pre-generate ExNovo districts with establishments ─────────
    for (const city of cities) {
      const exNovo = simulateExNovo(city, worldSeed, magicLevel);
      city.exNovoMetadata = {
        districtCount: exNovo.districts.length,
        districts: exNovo.districts,
      };
    }

    const pois: PointOfInterest[] = [];
    const poiCount = Math.min(30 + ((params.civilizationAbundance || 5) * 2), 50);
    const poiTypes = [
      'dungeon', 'dungeon', 'dungeon',
      'ruins', 'ruins',
      'natural_wonder', 'natural_wonder',
      'geographical_landmark', 'geographical_landmark',
      'cave', 'tomb', 'crypt', 'lair',
      'shrine', 'settlement',
    ];

    for (let i = 0; i < poiCount; i++) {
      const poiType = poiTypes[i % poiTypes.length];
      const loc = shuffledPOIs[cityCount + i] || { col: Math.floor(Math.random() * mapW), row: Math.floor(Math.random() * mapH) };
      let poiName: string;
      if (['dungeon', 'ruins', 'cave', 'tomb', 'crypt', 'lair'].includes(poiType)) {
        poiName = generateDungeonName();
      } else if (poiType === 'natural_wonder') {
        poiName = generateWonderName();
      } else if (poiType === 'geographical_landmark') {
        poiName = generateLandmarkName();
      } else {
        poiName = generatePOIName();
      }

      // ── Priority 3: stable seeded POI ID
      const poiId = `poi_${fnv1a(worldSeed + '|' + i + '|' + poiName).toString(16)}`;

      pois.push({
        id: poiId,
        name: poiName,
        type: poiType,
        hex_x: loc.col,
        hex_y: loc.row,
        terrainType: hexGrid[`${loc.col},${loc.row}`]?.terrainType ?? 4,
        dangerLevel: Math.floor(Math.random() * 20) + 1,
        description: 'A mysterious location waiting to be explored.',
        adventureHooks: [],
        discovered: false
      } as PointOfInterest);
    }

    // ── Priority 4: City-to-city routes (5 nearest neighbours per city) ──────
    const routes: Route[] = [];
    const seenPairs = new Set<string>();
    for (const city of cities) {
      const nearest = cities
        .filter(c => c.id !== city.id)
        .map(c => ({
          city: c,
          dist: Math.round(Math.sqrt((c.hex_x - city.hex_x) ** 2 + (c.hex_y - city.hex_y) ** 2)),
        }))
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 5);

      for (const { city: other, dist } of nearest) {
        const pairKey = [city.id, other.id].sort().join('|');
        if (seenPairs.has(pairKey)) continue;
        seenPairs.add(pairKey);

        // Sample midpoint hex for dominant terrain
        const midCol = Math.round((city.hex_x + other.hex_x) / 2);
        const midRow = Math.round((city.hex_y + other.hex_y) / 2);
        const midHex = hexGrid[`${midCol},${midRow}`];
        const dominantTerrain = midHex ? (HEX_TERRAIN_LABEL[midHex.terrainType] ?? 'plains') : 'plains';

        routes.push({ fromCityId: city.id, toCityId: other.id, distanceHexes: dist, dominantTerrain });
      }
    }

    return {
      name: params.name || 'Generated World',
      age: params.age || 2500,
      magicLevel,
      civilizationAbundance: params.civilizationAbundance || 5,
      climate: params.climate || 'Temperate',
      terrain: params.terrain || 'Mixed',
      worldSeed,
      createdAt: new Date(),
      cities,
      pointsOfInterest: pois,
      npcs: [],
      factions: [],
      weatherPatterns: [],
      hexGrid,
      terrainStats: stats,
      mapWidth: mapW,
      mapHeight: mapH,
      routes,
    } as World;
  };

  const generateCityLore = async (cityName: string, civilization: number, magicLevel: number, age: number, mode: 'data_array' | 'claude_ai' = 'data_array') => {
    try {
      const response = await fetch('/api/world-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generateCityLore',
          params: { cityName, civilization, magicLevel, age, lorelMode: mode }
        })
      });

      if (!response.ok) throw new Error('Failed to generate lore');
      const data = await response.json();
      return data.lore;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    }
  };

  const saveWorld = async (name: string, worldData: World) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/world-builder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'current-user-id'
        },
        body: JSON.stringify({
          action: 'saveWorld',
          params: { name, worldData }
        })
      });

      if (!response.ok) throw new Error('Failed to save world');
      const data = await response.json();
      return data.worldId;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    world,
    loading,
    error,
    generateWorld,
    generateCityLore,
    saveWorld
  };
};
