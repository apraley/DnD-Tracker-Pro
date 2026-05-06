import { useState, useMemo } from 'react';
import WorldGeneratorForm from './components/WorldGeneratorForm';
import HexMap from './components/HexMap';
import EntityDetailsModal from './components/EntityDetailsModal';
import AdventureForgeExport from './components/AdventureForgeExport';
import { useWorldBuilder } from './hooks/useWorldBuilder';
import { simulateExNovo } from './utils/exNovoSimulator';
import { World, City, PointOfInterest, WorldParams } from './types/world';
import './App.css';

type SidebarTab = 'cities' | 'dungeons' | 'wonders' | 'poi' | 'landmarks';

function App() {
  const { world: initialWorld, loading, error, generateWorld } = useWorldBuilder();
  const [world, setWorld] = useState<World | null>(initialWorld);
  const [selectedEntity, setSelectedEntity] = useState<City | PointOfInterest | null>(null);
  const [hoveredHex, setHoveredHex] = useState<{ x: number; y: number } | null>(null);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('cities');
  const [worldLore, setWorldLore] = useState<string | null>(null);
  const [showWorldLore, setShowWorldLore] = useState(false);
  const [worldLoreLoading, setWorldLoreLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleGenerateWorld = async (params: WorldParams) => {
    try {
      const generatedWorld = await generateWorld(params);
      setWorld(generatedWorld);
      setSelectedEntity(null);
      setSidebarTab('cities');
    } catch (err) {
      console.error('Generation failed:', err);
    }
  };

  // Derive sidebar lists from POI types
  const dungeons = useMemo(() =>
    world?.pointsOfInterest.filter(p => ['dungeon', 'ruins', 'cave', 'tomb', 'crypt', 'lair'].includes(p.type)) ?? [],
    [world]);
  const wonders = useMemo(() =>
    world?.pointsOfInterest.filter(p => p.type === 'natural_wonder') ?? [],
    [world]);
  const landmarks = useMemo(() =>
    world?.pointsOfInterest.filter(p => p.type === 'geographical_landmark') ?? [],
    [world]);
  const otherPOIs = useMemo(() =>
    world?.pointsOfInterest.filter(p => !['dungeon','ruins','cave','tomb','crypt','lair','natural_wonder','geographical_landmark'].includes(p.type)) ?? [],
    [world]);

  const tabCounts: Record<SidebarTab, number> = {
    cities: world?.cities.length ?? 0,
    dungeons: dungeons.length,
    wonders: wonders.length,
    poi: otherPOIs.length,
    landmarks: landmarks.length,
  };

  const currentList = useMemo(() => {
    const q = searchQuery.toLowerCase();
    let list: Array<City | PointOfInterest> = [];
    if (sidebarTab === 'cities') list = world?.cities ?? [];
    else if (sidebarTab === 'dungeons') list = dungeons;
    else if (sidebarTab === 'wonders') list = wonders;
    else if (sidebarTab === 'landmarks') list = landmarks;
    else list = otherPOIs;
    return q ? list.filter(e => e.name.toLowerCase().includes(q)) : list;
  }, [sidebarTab, world, dungeons, wonders, landmarks, otherPOIs, searchQuery]);

  const handleGenerateWorldLore = async () => {
    if (!world) return;
    setWorldLoreLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${API_URL}/api/world-builder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generateWorldLore', params: { world } })
      });
      if (!response.ok) throw new Error('API not available');
      const data = await response.json();
      setWorldLore(data.lore);
      setShowWorldLore(true);
    } catch {
      // Fallback: generate basic lore locally
      const stats = world.terrainStats;
      const lore = `${world.name} is a world ${world.age} years old, shaped by ${stats?.waterPercent ?? 40}% ocean and vast continents of ${world.terrain?.toLowerCase() ?? 'mixed'} terrain. ${world.cities.length} settlements have taken root across its landmasses, from coastal trading posts to mountain fortresses carved from living rock. The world hums with a magic level of ${world.magicLevel}/10 — ${world.magicLevel > 7 ? 'arcane energy crackles visibly in the air and spellcasters are everywhere' : world.magicLevel > 4 ? 'magic is real but rare enough to inspire wonder' : 'magic is whispered about but seldom witnessed'}.`;
      setWorldLore(lore);
      setShowWorldLore(true);
    } finally {
      setWorldLoreLoading(false);
    }
  };

  const handleExportWorld = () => {
    if (!world) return;
    const dataStr = JSON.stringify(world, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${world.name.replace(/\s+/g, '_')}.json`;
    a.click();
  };

  const isCity = (e: City | PointOfInterest): e is City => 'governmentType' in e;

  const getTabIcon = (tab: SidebarTab) => {
    const icons: Record<SidebarTab, string> = {
      cities: '🏙️', dungeons: '⚔️', wonders: '✨', poi: '📍', landmarks: '🗻'
    };
    return icons[tab];
  };

  const getTabLabel = (tab: SidebarTab) => {
    const labels: Record<SidebarTab, string> = {
      cities: 'Cities', dungeons: 'Dungeons', wonders: 'Wonders', poi: 'Points of Interest', landmarks: 'Landmarks'
    };
    return labels[tab];
  };

  if (!world) {
    return (
      <div className="app-shell">
        <WorldGeneratorForm onGenerate={handleGenerateWorld} isLoading={loading} />
        {error && <div className="error-toast">❌ {error}</div>}
      </div>
    );
  }

  return (
    <div className="app-shell">
      {/* ── Top Bar ── */}
      <header className="topbar">
        <div className="topbar-left">
          <h1 className="world-title">{world.name}</h1>
          <div className="world-meta">
            <span>🕰 {world.age}y</span>
            <span>✨ Magic {world.magicLevel}/10</span>
            <span>👥 Civ {world.civilizationAbundance}/10</span>
            <span>🌡 {world.climate}</span>
            {world.terrainStats && (
              <>
                <span>🌊 {world.terrainStats.waterPercent}% ocean</span>
                <span>🌿 {Math.round((world.terrainStats.grassland / world.terrainStats.totalHexes) * 100)}% grassland</span>
                <span>🌲 {Math.round((world.terrainStats.forest / world.terrainStats.totalHexes) * 100)}% forest</span>
                <span>⛰️ {Math.round((world.terrainStats.mountains / world.terrainStats.totalHexes) * 100)}% mountains</span>
              </>
            )}
          </div>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-lore" onClick={handleGenerateWorldLore} disabled={worldLoreLoading}>
            {worldLoreLoading ? '⏳' : '📜'} LORE
          </button>
          {worldLore && (
            <button className="btn btn-ghost" onClick={() => setShowWorldLore(true)}>🌍 View Lore</button>
          )}
          <AdventureForgeExport world={world} />
          <button className="btn btn-ghost" onClick={handleExportWorld}>📥 Export</button>
          <button className="btn btn-ghost" onClick={() => { setWorld(null); setWorldLore(null); }}>🔄 New World</button>
        </div>
      </header>

      {/* ── Main Layout ── */}
      <div className="main-layout">
        {/* ── Left Sidebar ── */}
        <aside className="sidebar">
          {/* Tab Nav */}
          <nav className="sidebar-tabs">
            {(['cities','dungeons','wonders','poi','landmarks'] as SidebarTab[]).map(tab => (
              <button
                key={tab}
                className={`sidebar-tab ${sidebarTab === tab ? 'active' : ''}`}
                onClick={() => { setSidebarTab(tab); setSearchQuery(''); }}
                title={getTabLabel(tab)}
              >
                <span className="tab-icon">{getTabIcon(tab)}</span>
                <span className="tab-label">{getTabLabel(tab)}</span>
                <span className="tab-count">{tabCounts[tab]}</span>
              </button>
            ))}
          </nav>

          {/* Search */}
          <div className="sidebar-search">
            <input
              type="text"
              placeholder={`Search ${getTabLabel(sidebarTab).toLowerCase()}...`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Entity List */}
          <div className="entity-list">
            {currentList.length === 0 && (
              <div className="empty-list">No {getTabLabel(sidebarTab).toLowerCase()} found.</div>
            )}
            {currentList.map(entity => {
              const city = isCity(entity) ? entity : null;
              const poi = !isCity(entity) ? entity : null;
              const exNovo = city ? simulateExNovo(city, world.worldSeed) : null;
              return (
                <div
                  key={entity.id}
                  className={`entity-card ${selectedEntity?.id === entity.id ? 'selected' : ''}`}
                  onClick={() => setSelectedEntity(entity)}
                >
                  <div className="entity-card-header">
                    <span className="entity-name">{entity.name}</span>
                    {city && <span className="entity-tag">{city.governmentType}</span>}
                    {poi && <span className="entity-tag poi-tag">{poi.type.replace('_', ' ')}</span>}
                  </div>
                  {city && exNovo && (
                    <div className="entity-card-body">
                      <div className="entity-detail">👑 {exNovo.leader.title}: <strong>{exNovo.leader.name}</strong></div>
                      <div className="entity-detail">🗡️ Crime: <strong>"{exNovo.crimeLord.alias}"</strong></div>
                      <div className="entity-detail">💰 {city.economicFocus}</div>
                      <div className="entity-founding">{exNovo.foundingStory.slice(0, 80)}…</div>
                    </div>
                  )}
                  {poi && (
                    <div className="entity-card-body">
                      <div className="entity-detail">⚠️ Danger: <strong>{poi.dangerLevel}/20</strong></div>
                      <div className="entity-founding">{poi.description.slice(0, 80)}…</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* ── Map ── */}
        <main className="map-area">
          {hoveredHex && (
            <div className="hex-coords">Hex ({hoveredHex.x}, {hoveredHex.y})</div>
          )}
          <HexMap
            world={world}
            onHexHover={(x, y) => setHoveredHex({ x, y })}
            onHexClick={entity => setSelectedEntity(entity)}
          />
        </main>
      </div>

      {/* ── Entity Detail Modal ── */}
      {selectedEntity && (
        <EntityDetailsModal entity={selectedEntity} onClose={() => setSelectedEntity(null)} />
      )}

      {/* ── World Lore Modal ── */}
      {showWorldLore && worldLore && (
        <div className="modal-overlay" onClick={() => setShowWorldLore(false)}>
          <div className="lore-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowWorldLore(false)}>✕</button>
            <h2 className="lore-title">📜 The Lore of {world.name}</h2>
            {world.terrainStats && (
              <div className="lore-stats">
                <span>🌊 {world.terrainStats.waterPercent}% Ocean</span>
                <span>🌿 Grasslands</span>
                <span>🌲 Forests</span>
                <span>⛰️ Mountains</span>
              </div>
            )}
            <div className="lore-body">{worldLore}</div>
          </div>
        </div>
      )}

      {error && <div className="error-toast">❌ {error}</div>}
    </div>
  );
}

export default App;
