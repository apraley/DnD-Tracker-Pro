import React, { useState } from 'react';
import WorldGeneratorForm from './components/WorldGeneratorForm';
import HexMap from './components/HexMap';
import EntityDetailsModal from './components/EntityDetailsModal';
import { useWorldBuilder } from './hooks/useWorldBuilder';
import { World, City, PointOfInterest, WorldParams } from './types/world';
import './App.css';

function App() {
  const { world, loading, error, generateWorld } = useWorldBuilder();
  const [selectedEntity, setSelectedEntity] = useState<City | PointOfInterest | null>(null);
  const [hoveredHex, setHoveredHex] = useState<{ x: number; y: number } | null>(null);

  const handleGenerateWorld = async (params: WorldParams) => {
    try {
      await generateWorld(params);
    } catch (err) {
      console.error('Generation failed:', err);
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

  return (
    <div className="app">
      {!world ? (
        <WorldGeneratorForm onGenerate={handleGenerateWorld} isLoading={loading} />
      ) : (
        <div className="world-view">
          {/* Header */}
          <div className="header">
            <div className="header-content">
              <div className="world-info">
                <h1>{world.name}</h1>
                <div className="world-stats">
                  <span>🕰️ Age: {world.age} years</span>
                  <span>✨ Magic: {world.magicLevel}/10</span>
                  <span>👥 Civilization: {world.civilizationAbundance}/10</span>
                  <span>🌍 Climate: {world.climate}</span>
                  <span>🏞️ Terrain: {world.terrain}</span>
                </div>
                <div className="location-info">
                  {hoveredHex && (
                    <p>Hex ({hoveredHex.x}, {hoveredHex.y})</p>
                  )}
                </div>
              </div>
              <div className="header-actions">
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
              />
            </div>

            {/* Sidebar with Entity Lists */}
            <div className="sidebar">
              <div className="sidebar-section">
                <h3>📍 Points of Interest ({world.pointsOfInterest.length})</h3>
                <div className="entity-list">
                  {world.pointsOfInterest.slice(0, 10).map((poi) => (
                    <button
                      key={poi.id}
                      className="entity-item"
                      onClick={() => setSelectedEntity(poi)}
                    >
                      <span className="entity-name">{poi.name}</span>
                      <span className="entity-type">{poi.type}</span>
                    </button>
                  ))}
                  {world.pointsOfInterest.length > 10 && (
                    <p className="more-items">+{world.pointsOfInterest.length - 10} more</p>
                  )}
                </div>
              </div>

              <div className="sidebar-section">
                <h3>🏰 Cities ({world.cities.length})</h3>
                <div className="entity-list">
                  {world.cities.slice(0, 10).map((city) => (
                    <button
                      key={city.id}
                      className="entity-item"
                      onClick={() => setSelectedEntity(city)}
                    >
                      <span className="entity-name">{city.name}</span>
                      <span className="entity-type">{city.governmentType}</span>
                    </button>
                  ))}
                  {world.cities.length > 10 && (
                    <p className="more-items">+{world.cities.length - 10} more</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Entity Details Modal */}
          <EntityDetailsModal entity={selectedEntity} onClose={() => setSelectedEntity(null)} />
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
