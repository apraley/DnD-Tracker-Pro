import { useState } from 'react';
import WorldGeneratorForm from './components/WorldGeneratorForm';
import HexMap from './components/HexMap';
import EntityDetailsModal from './components/EntityDetailsModal';
import APISettings from './components/APISettings';
import ContentTabs from './components/ContentTabs';
import AsyncLoreGeneratorUI from './components/AsyncLoreGenerator';
import AdventureForgeExport from './components/AdventureForgeExport';
import { useWorldBuilder } from './hooks/useWorldBuilder';
import { World, City, PointOfInterest, WorldParams } from './types/world';
import './App.css';

function App() {
  const { world: initialWorld, loading, error, generateWorld } = useWorldBuilder();
  const [world, setWorld] = useState<World | null>(initialWorld);
  const [selectedEntity, setSelectedEntity] = useState<City | PointOfInterest | null>(null);
  const [hoveredHex, setHoveredHex] = useState<{ x: number; y: number } | null>(null);
  const [apiKeys, setApiKeys] = useState<{ claude?: string; chatgpt?: string }>({});
  const [mapVisualization, setMapVisualization] = useState<string | null>(null);
  const [showMapViz, setShowMapViz] = useState(false);
  const [worldLore, setWorldLore] = useState<string | null>(null);
  const [showWorldLore, setShowWorldLore] = useState(false);
  const [worldLoreLoading, setWorldLoreLoading] = useState(false);

  const handleGenerateWorld = async (params: WorldParams) => {
    try {
      const generatedWorld = await generateWorld(params);
      setWorld(generatedWorld);

      // Auto-call ChatGPT for map visualization if key is available
      if (apiKeys.chatgpt && generatedWorld) {
        generateMapVisualization(generatedWorld);
      }
    } catch (err) {
      console.error('Generation failed:', err);
    }
  };

  const generateMapVisualization = async (world: World) => {
    if (!apiKeys.chatgpt) {
      console.log('ChatGPT API key not configured');
      return;
    }

    try {
      const prompt = `You are a D&D map visualization expert. Based on this world data, create a detailed map description and ASCII art representation:

World: ${world.name}
Age: ${world.age} years
Magic Level: ${world.magicLevel}/10
Civilization: ${world.civilizationAbundance}/10
Climate: ${world.climate}
Terrain: ${world.terrain}

Cities (${world.cities.length}): ${world.cities.slice(0, 5).map(c => c.name).join(', ')}${world.cities.length > 5 ? '...' : ''}

Points of Interest (${world.pointsOfInterest.length}): ${world.pointsOfInterest.slice(0, 5).map(p => p.name).join(', ')}${world.pointsOfInterest.length > 5 ? '...' : ''}

Create:
1. A vivid text description of what this world looks like
2. An ASCII or text-based map representation (using simple characters)
3. Geographic features and landmarks placement

Make it creative, atmospheric, and helpful for a D&D campaign.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKeys.chatgpt}`
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 2000,
          temperature: 0.8
        })
      });

      if (!response.ok) throw new Error('ChatGPT API failed');
      const data = await response.json();
      const visualization = data.choices[0].message.content;
      setMapVisualization(visualization);
      setShowMapViz(true);
    } catch (err) {
      console.error('Map visualization failed:', err);
    }
  };

  const handleGenerateWorldLore = async () => {
    if (!world) return;
    setWorldLoreLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/world-builder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generateWorldLore', params: { world } })
      });
      if (!response.ok) throw new Error('Failed to generate world lore');
      const data = await response.json();
      setWorldLore(data.lore);
      setShowWorldLore(true);
    } catch (err) {
      console.error('World lore failed:', err);
      alert('World lore generation failed. Check that your API server is running and ANTHROPIC_API_KEY is set.');
    } finally {
      setWorldLoreLoading(false);
    }
  };

  const handleSaveWorld = async () => {
    if (!world) return;
    try {
      // TODO: Implement save functionality with backend
      console.log('Saving world:', world.name);
    } catch (err) {
      console.error('Save failed:', err);
    }
  };

  const handleExportWorld = () => {
    if (!world) return;
    const dataStr = JSON.stringify(world, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${world.name.replace(/\s+/g, '_')}.json`;
    link.click();
  };

  const getPhaseInfo = () => {
    if (!world) return '';
    if (world.generationMetadata?.completionLevel === '100% - All 5 Phases') {
      return '✅ All 5 Phases Complete';
    }
    return 'Phase 1 Complete';
  };

  return (
    <div className="app">
      <div className="top-bar">
        <APISettings onSettingsChange={setApiKeys} />
        {mapVisualization && (
          <button className="btn btn-secondary" onClick={() => setShowMapViz(true)}>
            🗺️ View Map Visualization
          </button>
        )}
      </div>

      {!world ? (
        <WorldGeneratorForm onGenerate={handleGenerateWorld} isLoading={loading} />
      ) : (
        <div className="world-view">
          {/* Header */}
          <div className="header">
            <div className="header-content">
              <div className="world-info">
                <h1>{world.name}</h1>
                <div className="phase-badge">{getPhaseInfo()}</div>
                <div className="world-stats">
                  <span>🕰️ Age: {world.age} years</span>
                  <span>✨ Magic: {world.magicLevel}/10</span>
                  <span>👥 Civilization: {world.civilizationAbundance}/10</span>
                  <span>🌍 Climate: {world.climate}</span>
                  <span>🏞️ Terrain: {world.terrain}</span>
                </div>
                {world.generationMetadata && (
                  <div className="world-stats">
                    <span>🎯 {world.generationMetadata.totalCities} Cities</span>
                    <span>📍 {world.generationMetadata.totalPOIs} POIs</span>
                    <span>👥 {world.generationMetadata.totalNPCs} NPCs</span>
                    <span>🏛️ {world.generationMetadata.totalFactions} Factions</span>
                    <span>📦 {world.generationMetadata.totalCommodities} Commodities</span>
                    <span>🛤️ {world.generationMetadata.totalTradeRoutes} Trade Routes</span>
                  </div>
                )}
                {world.terrainStats && (
                  <div className="world-stats">
                    <span>🌊 {world.terrainStats.waterPercent}% Ocean</span>
                    <span>🌿 {Math.round((world.terrainStats.grassland / world.terrainStats.totalHexes) * 100)}% Grassland</span>
                    <span>🌲 {Math.round((world.terrainStats.forest / world.terrainStats.totalHexes) * 100)}% Forest</span>
                    <span>⛰️ {Math.round((world.terrainStats.mountains / world.terrainStats.totalHexes) * 100)}% Mountains</span>
                    {world.terrainStats.ice > 0 && <span>🧊 {Math.round((world.terrainStats.ice / world.terrainStats.totalHexes) * 100)}% Ice</span>}
                  </div>
                )}
                <div className="location-info">
                  {hoveredHex && (
                    <p>Hex ({hoveredHex.x}, {hoveredHex.y})</p>
                  )}
                </div>
              </div>
              <div className="header-actions">
                <button
                  className="btn btn-primary"
                  onClick={handleGenerateWorldLore}
                  disabled={worldLoreLoading}
                  title="Generate geographic lore describing this world's continents, oceans, and natural wonders"
                >
                  {worldLoreLoading ? '⏳ Writing...' : '📜 LORE'}
                </button>
                {worldLore && (
                  <button className="btn btn-secondary" onClick={() => setShowWorldLore(true)}>
                    🌍 View World Lore
                  </button>
                )}
                <AsyncLoreGeneratorUI
                  world={world}
                  onLoreGenerated={setWorld}
                  apiKey={apiKeys.claude}
                />
                <AdventureForgeExport world={world} />
                <button className="btn btn-secondary" onClick={() => window.location.reload()}>
                  🔄 New World
                </button>
                <button className="btn btn-secondary" onClick={handleSaveWorld}>
                  💾 Save
                </button>
                <button className="btn btn-primary" onClick={handleExportWorld}>
                  📥 Export
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="main-content">
            <div className="map-container">
              <HexMap
                world={world}
                onHexHover={(x, y) => setHoveredHex({ x, y })}
                onHexClick={(entity) => setSelectedEntity(entity)}
                mapVisualization={mapVisualization || undefined}
              />
            </div>

            {/* Content Tabs for Cities, POIs, NPCs, etc. */}
            <div className="sidebar">
              <ContentTabs world={world} onSelectEntity={setSelectedEntity} />
            </div>
          </div>

          {/* Entity Details Modal */}
          <EntityDetailsModal entity={selectedEntity} onClose={() => setSelectedEntity(null)} />

          {/* World Lore Modal */}
          {showWorldLore && worldLore && (
            <div className="modal-overlay" onClick={() => setShowWorldLore(false)}>
              <div className="map-viz-modal" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={() => setShowWorldLore(false)}>✕</button>
                <h2>📜 The Lore of {world.name}</h2>
                {world.terrainStats && (
                  <div className="world-stats" style={{ marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span>🌊 {world.terrainStats.waterPercent}% Ocean</span>
                    <span>🌿 Grassland</span>
                    <span>🌲 Forest</span>
                    <span>⛰️ Mountains</span>
                    {world.terrainStats.ice > 0 && <span>🧊 Polar Ice</span>}
                  </div>
                )}
                <div className="map-viz-content" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.7' }}>
                  {worldLore}
                </div>
              </div>
            </div>
          )}

          {/* Map Visualization Modal */}
          {showMapViz && mapVisualization && (
            <div className="modal-overlay" onClick={() => setShowMapViz(false)}>
              <div className="map-viz-modal" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={() => setShowMapViz(false)}>✕</button>
                <h2>🗺️ World Map Visualization</h2>
                <div className="map-viz-content">
                  <pre>{mapVisualization}</pre>
                </div>
                <button className="pop-out-btn" onClick={() => {
                  const win = window.open('', 'mapvis', 'width=1200,height=800');
                  if (win) {
                    win.document.write(`
                      <html><head><title>Map Visualization</title></head>
                      <body style="background: #1a1a2e; color: #d4af37; font-family: monospace; padding: 20px; overflow-y: auto;">
                        <h1>${world?.name} - World Map</h1>
                        <pre style="white-space: pre-wrap; word-wrap: break-word;">${mapVisualization}</pre>
                      </body></html>
                    `);
                  }
                }}>
                  📤 Pop Out
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="error-toast">
          ❌ {error}
        </div>
      )}
    </div>
  );
}

export default App;
