// Hook for world builder API interactions
import { useState } from 'react';
import { World, WorldParams, City, PointOfInterest } from '../types/world';
import {
  generateCityName,
  generateDungeonName,
  generatePOIName,
  generateWonderName,
  generateLandmarkName,
  resetNameGenerator
} from '../utils/nameGenerator';
import { generateTerrain, getViableLocations, getLandLocations } from '../utils/terrainGenerator';

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

    // Generate fractal terrain client-side
    const { hexGrid, stats } = generateTerrain(seed, 40, 5);
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
      const loc = shuffledCities[i] || { col: Math.floor(Math.random() * 50), row: Math.floor(Math.random() * 50) };
      cities.push({
        id: `city_${i}`,
        name: generateCityName(),
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

    const pois: PointOfInterest[] = [];
    // More POIs, weighted toward dungeons and wonders (more interesting content)
    const poiCount = Math.min(30 + ((params.civilizationAbundance || 5) * 2), 50);
    const poiTypes = [
      'dungeon', 'dungeon', 'dungeon',           // 3× — most common
      'ruins', 'ruins',                           // 2×
      'natural_wonder', 'natural_wonder',         // 2×
      'geographical_landmark', 'geographical_landmark', // 2×
      'cave', 'tomb', 'crypt', 'lair',            // 1× each
      'shrine', 'settlement',                     // 1× each
    ];

    for (let i = 0; i < poiCount; i++) {
      const poiType = poiTypes[i % poiTypes.length];
      const loc = shuffledPOIs[cityCount + i] || { col: Math.floor(Math.random() * 50), row: Math.floor(Math.random() * 50) };
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

      pois.push({
        id: `poi_${i}`,
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

    return {
      name: params.name || 'Generated World',
      age: params.age || 2500,
      magicLevel: params.magicLevel || 5,
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
          'x-user-id': 'current-user-id' // Replace with actual user ID from auth
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
