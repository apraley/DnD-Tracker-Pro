import { useState, useMemo } from 'react';
import WorldGeneratorForm from './components/WorldGeneratorForm';
import HexMap from './components/HexMap';
import AdventureForgeExport from './components/AdventureForgeExport';
import DetailPanel from './components/DetailPanel';
import { useWorldBuilder } from './hooks/useWorldBuilder';
import { simulateExNovo } from './utils/exNovoSimulator';
import { simulateExUmbra } from './utils/exUmbraSimulator';
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
  const [mythweaverUrl, setMythweaverUrl] = useState(
    import.meta.env.VITE_MYTHWEAVER_URL || 'http://localhost:5000'
  );
  const [openAiKey, setOpenAiKey] = useState('');
  const [mapImageUrl, setMapImageUrl] = useState<string | null>(null);
  const [mapImageLoading, setMapImageLoading] = useState(false);
  const [mapImageOpacity, setMapImageOpacity] = useState(0.35);
  const [showSettings, setShowSettings] = useState(false);

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

  const handleGenerateMapArt = async () => {
    if (!world || !openAiKey) { setShowSettings(true); return; }
    setMapImageLoading(true);
    try {
      const stats = world.terrainStats;
      const waterPct = stats?.waterPercent ?? 40;
      const forestPct = stats ? Math.round((stats.forest / stats.totalHexes) * 100) : 20;
      const mtnPct = stats ? Math.round((stats.mountains / stats.totalHexes) * 100) : 10;
      const magicDesc = world.magicLevel >= 8
        ? 'highly magical with visible arcane phenomena, glowing ley lines, and floating islands'
        : world.magicLevel >= 5
        ? 'moderately magical with ancient ruins and arcane landmarks'
        : 'low magic with a grounded, realistic feel';
      const climateDesc = world.climate?.toLowerCase() ?? 'temperate';
      const prompt = [
        `Fantasy world map in the style of a master cartographer's illuminated atlas, circa 1400s.`,
        `The world is called "${world.name}": ${waterPct}% ocean, ${forestPct}% forests, ${mtnPct}% mountains.`,
        `Climate: ${climateDesc}. Magic level: ${magicDesc}.`,
        `Style: aged parchment texture, hand-drawn coastlines, illustrated mountain ranges and forests,`,
        `decorative compass rose, sea monsters in the oceans, ornate border.`,
        `No text labels or annotations. Aerial top-down perspective. Rich warm tones.`,
        `${world.cities.length} major settlements suggested by subtle illustrated icons.`,
      ].join(' ');

      const resp = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openAiKey}` },
        body: JSON.stringify({ model: 'dall-e-3', prompt, n: 1, size: '1024x1024', quality: 'standard' }),
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error?.message || 'DALL-E request failed');
      }
      const data = await resp.json();
      setMapImageUrl(data.data[0].url);
    } catch (e: unknown) {
      console.error('Map art generation failed:', e);
      alert(`Map art failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setMapImageLoading(false);
    }
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
          <button
            className="btn btn-ghost"
            onClick={handleGenerateMapArt}
            disabled={mapImageLoading}
            title={openAiKey ? 'Generate AI map art (DALL-E 3)' : 'Set OpenAI API key in ⚙️ Settings first'}
            style={mapImageUrl ? { borderColor: '#9b59b6', color: '#9b59b6' } : undefined}
          >
            {mapImageLoading ? '⏳' : '🎨'} {mapImageUrl ? 'Regen Art' : 'Map Art'}
          </button>
          {mapImageUrl && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 10, color: '#555566' }}>opacity</span>
              <input
                type="range" min={0.1} max={1} step={0.05}
                value={mapImageOpacity}
                onChange={e => setMapImageOpacity(Number(e.target.value))}
                style={{ width: 70, cursor: 'pointer', accentColor: '#9b59b6' }}
                title="Adjust map art overlay opacity"
              />
              <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: 11 }}
                onClick={() => setMapImageUrl(null)} title="Remove map art overlay">✕</button>
            </div>
          )}
          <AdventureForgeExport world={world} />
          <button className="btn btn-ghost" onClick={handleExportWorld}>📥 Export</button>
          <button className="btn btn-ghost" onClick={() => setShowSettings(true)} title="Configure Mythweaver URL">⚙️</button>
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
              const isDungeon = poi && ['dungeon', 'ruins', 'cave', 'tomb', 'crypt', 'lair'].includes(poi.type);
              const exUmbra = isDungeon && poi ? simulateExUmbra(poi, world.worldSeed) : null;
              const tierColors: Record<number, string> = { 1: '#27ae60', 2: '#d4af37', 3: '#e67e22', 4: '#c0392b' };
              return (
                <div
                  key={entity.id}
                  className={`entity-card ${selectedEntity?.id === entity.id ? 'selected' : ''}`}
                  onClick={() => setSelectedEntity(entity)}
                >
                  <div className="entity-card-header">
                    <span className="entity-name">{entity.name}</span>
                    {city && <span className="entity-tag">{city.governmentType}</span>}
                    {poi && !exUmbra && <span className="entity-tag poi-tag">{poi.type.replace('_', ' ')}</span>}
                    {exUmbra && (
                      <span className="entity-tag poi-tag" style={{
                        background: `${tierColors[exUmbra.crTier.tier]}22`,
                        color: tierColors[exUmbra.crTier.tier],
                        borderColor: `${tierColors[exUmbra.crTier.tier]}66`,
                      }}>
                        {exUmbra.crTier.label}
                      </span>
                    )}
                  </div>
                  {city && exNovo && (
                    <div className="entity-card-body">
                      <div className="entity-detail">👑 {exNovo.leader.title}: <strong>{exNovo.leader.name}</strong></div>
                      <div className="entity-detail">🗡️ Crime: <strong>"{exNovo.crimeLord.alias}"</strong></div>
                      <div className="entity-detail">💰 {city.economicFocus}</div>
                      <div className="entity-founding">{exNovo.foundingStory.slice(0, 80)}…</div>
                    </div>
                  )}
                  {exUmbra && poi && (
                    <div className="entity-card-body">
                      <div className="entity-detail">⚔️ Boss: <strong>{exUmbra.boss}</strong></div>
                      <div className="entity-detail">👥 Minions: <strong>{exUmbra.minions}</strong></div>
                      <div className="entity-detail">⚠️ Danger: <strong>{poi.dangerLevel}/20</strong> · Levels {exUmbra.crTier.levelRange}</div>
                      <div className="entity-founding">{exUmbra.origin.slice(0, 70)}…</div>
                    </div>
                  )}
                  {poi && !exUmbra && (
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
          {/* DALL-E map art overlay */}
          {mapImageUrl && (
            <img
              src={mapImageUrl}
              alt="AI-generated map art"
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%',
                objectFit: 'cover',
                opacity: mapImageOpacity,
                pointerEvents: 'none',
                mixBlendMode: 'multiply',
              }}
            />
          )}
          {mapImageLoading && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.6)', zIndex: 5,
              gap: 12,
            }}>
              <div style={{ fontSize: 32 }}>🎨</div>
              <div style={{ fontSize: 14, color: '#d4af37' }}>Generating map art via DALL-E 3…</div>
              <div style={{ fontSize: 11, color: '#555566' }}>This takes ~15 seconds</div>
            </div>
          )}
        </main>
      </div>

      {/* ── Entity Detail Panel (slide-over) ── */}
      {selectedEntity && (
        <DetailPanel
          entity={selectedEntity}
          world={world}
          mythweaverUrl={mythweaverUrl}
          onClose={() => setSelectedEntity(null)}
        />
      )}

      {/* ── Settings Modal ── */}
      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="lore-modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowSettings(false)}>✕</button>
            <h2 className="lore-title">⚙️ Settings</h2>

            <div style={{ marginTop: 20 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                🎨 OpenAI API Key <span style={{ color: '#555566', textTransform: 'none', letterSpacing: 0 }}>(for DALL-E 3 map art)</span>
              </label>
              <input
                type="password"
                value={openAiKey}
                onChange={e => setOpenAiKey(e.target.value)}
                placeholder="sk-..."
                style={{
                  width: '100%', background: '#0f0f13', border: '1px solid #2e2e42',
                  borderRadius: 4, color: '#e2e2e8', fontSize: 13, padding: '8px 12px',
                  outline: 'none', fontFamily: 'Courier New, monospace',
                }}
              />
              <p style={{ fontSize: 11, color: '#555566', marginTop: 6, lineHeight: 1.5 }}>
                Used only in your browser. Never sent to any server other than OpenAI directly.
                Click "🎨 Map Art" in the toolbar to generate an illuminated atlas image of your world.
              </p>
            </div>

            <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #2e2e42' }}>
              <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                ⚔️ Mythweaver / Game Master App URL
              </label>
              <input
                type="text"
                value={mythweaverUrl}
                onChange={e => setMythweaverUrl(e.target.value)}
                placeholder="http://localhost:5000"
                style={{
                  width: '100%', background: '#0f0f13', border: '1px solid #2e2e42',
                  borderRadius: 4, color: '#e2e2e8', fontSize: 13, padding: '8px 12px',
                  outline: 'none', fontFamily: 'Courier New, monospace',
                }}
              />
              <p style={{ fontSize: 11, color: '#555566', marginTop: 6, lineHeight: 1.5 }}>
                When you click "Launch in Mythweaver" from a city or dungeon panel, data is sent to this URL.
              </p>
            </div>
            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-lore" onClick={() => setShowSettings(false)}>Save</button>
            </div>
          </div>
        </div>
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
