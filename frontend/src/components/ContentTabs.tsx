import { useState, useMemo } from 'react';
import { World, City, PointOfInterest } from '../types/world';
import './ContentTabs.css';

interface ContentTabsProps {
  world: World;
  onSelectEntity: (entity: City | PointOfInterest) => void;
}

type TabType = 'cities' | 'pois' | 'npcs' | 'factions' | 'events';
type SortField = 'name' | 'type' | 'population' | 'danger' | 'prosperity';

export default function ContentTabs({ world, onSelectEntity }: ContentTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('cities');
  const [cityFilter, setCityFilter] = useState('');
  const [poiFilter, setPoiFilter] = useState('');
  const [citySortBy, setCitySortBy] = useState<SortField>('name');
  const [poiSortBy, setPoiSortBy] = useState<SortField>('name');

  // Filter and sort cities
  const filteredCities = useMemo(() => {
    let filtered = world.cities.filter(city =>
      city.name.toLowerCase().includes(cityFilter.toLowerCase()) ||
      (city.governmentType?.toLowerCase() || '').includes(cityFilter.toLowerCase())
    );

    filtered.sort((a, b) => {
      switch (citySortBy) {
        case 'population':
          return (b.exNovoMetadata?.totalPopulation || 0) - (a.exNovoMetadata?.totalPopulation || 0);
        case 'prosperity':
          return (b.prosperity_index || 0) - (a.prosperity_index || 0);
        case 'type':
          return (a.governmentType || '').localeCompare(b.governmentType || '');
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return filtered;
  }, [world.cities, cityFilter, citySortBy]);

  // Filter and sort POIs
  const filteredPOIs = useMemo(() => {
    let filtered = world.pointsOfInterest.filter(poi =>
      poi.name.toLowerCase().includes(poiFilter.toLowerCase()) ||
      (poi.type?.toLowerCase() || '').includes(poiFilter.toLowerCase())
    );

    filtered.sort((a, b) => {
      switch (poiSortBy) {
        case 'danger':
          return (b.dangerLevel || 0) - (a.dangerLevel || 0);
        case 'type':
          return (a.type || '').localeCompare(b.type || '');
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return filtered;
  }, [world.pointsOfInterest, poiFilter, poiSortBy]);

  const dungeonCount = world.pointsOfInterest.filter(p =>
    ['dungeon', 'ruins', 'cave', 'tomb', 'lair', 'fortress', 'crypt', 'temple', 'mine', 'vault'].includes(p.type?.toLowerCase())
  ).length;

  return (
    <div className="content-tabs">
      {/* Tab Navigation */}
      <div className="tabs-nav">
        <button
          className={`tab-btn ${activeTab === 'cities' ? 'active' : ''}`}
          onClick={() => setActiveTab('cities')}
        >
          🏰 Cities ({world.cities.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'pois' ? 'active' : ''}`}
          onClick={() => setActiveTab('pois')}
        >
          📍 POIs ({world.pointsOfInterest.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'pois' ? 'active' : ''}`}
          onClick={() => setActiveTab('pois')}
          title="Dungeons subset of POIs"
        >
          🏚️ Dungeons ({dungeonCount})
        </button>
        {world.npcs && world.npcs.length > 0 && (
          <button
            className={`tab-btn ${activeTab === 'npcs' ? 'active' : ''}`}
            onClick={() => setActiveTab('npcs')}
          >
            👥 NPCs ({world.npcs.length})
          </button>
        )}
        {world.factions && world.factions.length > 0 && (
          <button
            className={`tab-btn ${activeTab === 'factions' ? 'active' : ''}`}
            onClick={() => setActiveTab('factions')}
          >
            🏛️ Factions ({world.factions.length})
          </button>
        )}
        {world.historicalEvents && world.historicalEvents.length > 0 && (
          <button
            className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            📖 Events ({world.historicalEvents.length})
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Cities Tab */}
        {activeTab === 'cities' && (
          <div className="cities-tab">
            <div className="tab-header">
              <input
                type="text"
                placeholder="Search cities..."
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="search-input"
              />
              <select
                value={citySortBy}
                onChange={(e) => setCitySortBy(e.target.value as SortField)}
                className="sort-select"
              >
                <option value="name">Sort by Name</option>
                <option value="type">Sort by Government</option>
                <option value="population">Sort by Population</option>
                <option value="prosperity">Sort by Prosperity</option>
              </select>
            </div>

            <div className="entity-grid">
              {filteredCities.length === 0 ? (
                <p className="no-results">No cities match your search</p>
              ) : (
                filteredCities.map((city) => (
                  <div
                    key={city.id}
                    className="entity-card"
                    onClick={() => onSelectEntity(city)}
                  >
                    <div className="entity-header">
                      <h4>{city.name}</h4>
                      <span className="entity-badge">{city.governmentType}</span>
                    </div>

                    <div className="entity-stats">
                      {city.exNovoMetadata?.totalPopulation && (
                        <div className="stat">
                          <span className="stat-label">Population:</span>
                          <span className="stat-value">{city.exNovoMetadata.totalPopulation.toLocaleString()}</span>
                        </div>
                      )}
                      {city.prosperity_index && (
                        <div className="stat">
                          <span className="stat-label">Prosperity:</span>
                          <span className="stat-value">{city.prosperity_index}%</span>
                        </div>
                      )}
                      {city.factions && city.factions.length > 0 && (
                        <div className="stat">
                          <span className="stat-label">Factions:</span>
                          <span className="stat-value">{city.factions.length}</span>
                        </div>
                      )}
                      {city.landmarks && city.landmarks.length > 0 && (
                        <div className="stat">
                          <span className="stat-label">Landmarks:</span>
                          <span className="stat-value">{city.landmarks.length}</span>
                        </div>
                      )}
                    </div>

                    {city.exNovoMetadata?.phases && city.exNovoMetadata.phases.length > 0 && (
                      <div className="entity-meta">
                        <strong>ExNovo Phases:</strong> {city.exNovoMetadata.phases.length}
                      </div>
                    )}

                    <button className="view-btn" onClick={(e) => {
                      e.stopPropagation();
                      onSelectEntity(city);
                    }}>
                      View Details →
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* POIs/Dungeons Tab */}
        {activeTab === 'pois' && (
          <div className="pois-tab">
            <div className="tab-header">
              <input
                type="text"
                placeholder="Search POIs..."
                value={poiFilter}
                onChange={(e) => setPoiFilter(e.target.value)}
                className="search-input"
              />
              <select
                value={poiSortBy}
                onChange={(e) => setPoiSortBy(e.target.value as SortField)}
                className="sort-select"
              >
                <option value="name">Sort by Name</option>
                <option value="type">Sort by Type</option>
                <option value="danger">Sort by Danger</option>
              </select>
            </div>

            <div className="entity-grid">
              {filteredPOIs.length === 0 ? (
                <p className="no-results">No POIs match your search</p>
              ) : (
                filteredPOIs.map((poi) => (
                  <div
                    key={poi.id}
                    className="entity-card"
                    onClick={() => onSelectEntity(poi)}
                  >
                    <div className="entity-header">
                      <h4>{poi.name}</h4>
                      <span className="entity-badge">{poi.type}</span>
                    </div>

                    <div className="entity-stats">
                      {poi.dangerLevel && (
                        <div className="stat">
                          <span className="stat-label">Danger:</span>
                          <span className="stat-value danger">{poi.dangerLevel}/20</span>
                        </div>
                      )}
                      {poi.exUmbraMetadata?.size && (
                        <div className="stat">
                          <span className="stat-label">Size:</span>
                          <span className="stat-value">{poi.exUmbraMetadata.size}</span>
                        </div>
                      )}
                      {poi.exUmbraMetadata?.difficulty && (
                        <div className="stat">
                          <span className="stat-label">Difficulty:</span>
                          <span className="stat-value">{poi.exUmbraMetadata.difficulty}</span>
                        </div>
                      )}
                      {poi.aspects && poi.aspects.length > 0 && (
                        <div className="stat">
                          <span className="stat-label">Aspects:</span>
                          <span className="stat-value">{poi.aspects.length}</span>
                        </div>
                      )}
                      {poi.inhabitants && poi.inhabitants.length > 0 && (
                        <div className="stat">
                          <span className="stat-label">Inhabitants:</span>
                          <span className="stat-value">{poi.inhabitants.length}</span>
                        </div>
                      )}
                    </div>

                    {poi.nearbyCity && (
                      <div className="entity-meta">
                        <strong>Near:</strong> {poi.nearbyCity.name}
                      </div>
                    )}

                    <button className="view-btn" onClick={(e) => {
                      e.stopPropagation();
                      onSelectEntity(poi);
                    }}>
                      View Details →
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* NPCs Tab */}
        {activeTab === 'npcs' && world.npcs && world.npcs.length > 0 && (
          <div className="npcs-tab">
            <div className="npc-grid">
              {world.npcs.map((npc) => (
                <div key={npc.id} className="entity-card">
                  <div className="entity-header">
                    <h4>{npc.name}</h4>
                    <span className="entity-badge">{npc.class} {npc.level}</span>
                  </div>

                  <div className="entity-stats">
                    {npc.alignment && (
                      <div className="stat">
                        <span className="stat-label">Alignment:</span>
                        <span className="stat-value">{npc.alignment}</span>
                      </div>
                    )}
                    {npc.role && (
                      <div className="stat">
                        <span className="stat-label">Role:</span>
                        <span className="stat-value">{npc.role}</span>
                      </div>
                    )}
                    {npc.ac !== undefined && (
                      <div className="stat">
                        <span className="stat-label">AC:</span>
                        <span className="stat-value">{npc.ac}</span>
                      </div>
                    )}
                    {npc.hp && (
                      <div className="stat">
                        <span className="stat-label">HP:</span>
                        <span className="stat-value">{npc.hp}</span>
                      </div>
                    )}
                  </div>

                  {npc.faction && (
                    <div className="entity-meta">
                      <strong>Faction:</strong> {npc.faction}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Factions Tab */}
        {activeTab === 'factions' && world.factions && world.factions.length > 0 && (
          <div className="factions-tab">
            <div className="entity-grid">
              {world.factions.map((faction) => (
                <div key={faction.id} className="entity-card">
                  <div className="entity-header">
                    <h4>{faction.name}</h4>
                    <span className="entity-badge">{faction.type}</span>
                  </div>

                  <div className="entity-stats">
                    {faction.alignment && (
                      <div className="stat">
                        <span className="stat-label">Alignment:</span>
                        <span className="stat-value">{faction.alignment}</span>
                      </div>
                    )}
                    {faction.influence && (
                      <div className="stat">
                        <span className="stat-label">Influence:</span>
                        <span className="stat-value">{faction.influence}</span>
                      </div>
                    )}
                  </div>

                  {faction.description && (
                    <p className="entity-description">{faction.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Historical Events Tab */}
        {activeTab === 'events' && world.historicalEvents && world.historicalEvents.length > 0 && (
          <div className="events-tab">
            <div className="event-list">
              {world.historicalEvents.map((event) => (
                <div key={event.id} className="event-item">
                  <div className="event-header">
                    <h4>{event.title}</h4>
                    <span className="event-year">Year {event.yearOccurred}</span>
                  </div>

                  <div className="event-meta">
                    <span className="event-type">{event.type}</span>
                    <span className="event-severity">Severity: {event.severity}/10</span>
                  </div>

                  {event.description && (
                    <p className="event-description">{event.description}</p>
                  )}

                  {event.rippleEffects && event.rippleEffects.length > 0 && (
                    <div className="event-ripples">
                      <strong>Ripple Effects:</strong>
                      <ul>
                        {event.rippleEffects.slice(0, 3).map((effect, idx) => (
                          <li key={idx}>{effect}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
