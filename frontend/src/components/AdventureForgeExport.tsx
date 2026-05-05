import { useState } from 'react';
import { World } from '../types/world';
import './AdventureForgeExport.css';

interface AdventureForgeExportProps {
  world: World;
}

interface ForgeData {
  worldName: string;
  version: string;
  metadata: {
    worldAge: number;
    magicLevel: number;
    civilization: number;
    generatedAt: string;
  };
  encounters: {
    total: number;
    data: any[];
  };
  quests: {
    total: number;
    data: any[];
  };
  oneShots: {
    total: number;
    data: any[];
  };
  miniCampaigns: {
    total: number;
    data: any[];
  };
}

export default function AdventureForgeExport({ world }: AdventureForgeExportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [forgeData, setForgeData] = useState<ForgeData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activePreviewTab, setActivePreviewTab] = useState<'encounters' | 'quests' | 'oneshots' | 'campaigns'>('encounters');

  const generateForgeData = () => {
    setIsGenerating(true);

    // Simulate data generation (in real app, this would call backend)
    const encounters: any[] = [];
    const quests: any[] = [];
    const oneShots: any[] = [];
    const miniCampaigns: any[] = [];

    // Generate encounters from dungeons
    world.pointsOfInterest.forEach((poi) => {
      if (['dungeon', 'ruins', 'cave', 'tomb', 'lair', 'fortress', 'crypt', 'temple', 'mine', 'vault'].includes(poi.type?.toLowerCase())) {
        // Combat encounters from POI
        encounters.push({
          id: `encounter-${poi.id}-0`,
          name: `Combat in ${poi.name}`,
          location: poi.name,
          type: 'Combat',
          difficulty: poi.exUmbraMetadata?.difficulty || 'Medium',
          partyLevel: Math.ceil((poi.dangerLevel || 10) / 5),
          description: `A dangerous combat encounter in ${poi.name}`,
          xpReward: `${(poi.dangerLevel || 5) * 100} XP`,
          rewards: `${(poi.dangerLevel || 5) * 50}-${(poi.dangerLevel || 5) * 150} gp`
        });

        // Social encounter
        encounters.push({
          id: `encounter-${poi.id}-1`,
          name: `Social Encounter in ${poi.name}`,
          location: poi.name,
          type: 'Social',
          difficulty: 'Variable',
          description: `A creature willing to negotiate or share information`,
          xpReward: `50-100 XP`,
          rewards: `Information, clues`
        });

        // Puzzle encounter
        encounters.push({
          id: `encounter-${poi.id}-2`,
          name: `Puzzle in ${poi.name}`,
          location: poi.name,
          type: 'Puzzle',
          difficulty: 'Variable',
          description: `An ancient mechanism or riddle blocking progress`,
          xpReward: `50-100 XP`,
          rewards: `Treasure, progress`
        });

        // Create quest for dungeon
        quests.push({
          id: `quest-${poi.id}-0`,
          title: `Explore ${poi.name}`,
          giver: 'Local adventure guild',
          hook: `A dangerous location threatens the region`,
          location: poi.name,
          objective: `Clear or explore ${poi.name}`,
          difficulty: poi.exUmbraMetadata?.difficulty || 'Medium',
          reward: `${(poi.dangerLevel || 5) * 100}+ gp`,
          type: 'Exploration'
        });

        // Create one-shot
        if (oneShots.length < 3) {
          oneShots.push({
            id: `oneshot-${poi.id}`,
            title: `The Mystery of ${poi.name}`,
            duration: '3-4 hours',
            partyLevel: `${Math.max(1, Math.ceil((poi.dangerLevel || 10) / 5) - 2)}-${Math.ceil((poi.dangerLevel || 10) / 5) + 2}`,
            setting: `${poi.name} in the world of ${world.name}`,
            acts: [
              {
                title: 'Arrival and Discovery',
                description: 'The party enters and encounters initial challenges'
              },
              {
                title: 'Deepening Danger',
                description: 'The location reveals its secrets'
              },
              {
                title: 'Final Confrontation',
                description: 'The party faces the greatest challenge'
              }
            ],
            rewards: {
              xp: `${(poi.dangerLevel || 5) * 250} XP`,
              treasure: `${(poi.dangerLevel || 5) * 100}+ gp`,
              magic: 'Possible magical items'
            }
          });
        }
      }
    });

    // Generate city quests
    world.cities.slice(0, 3).forEach((city) => {
      quests.push({
        id: `quest-${city.id}-0`,
        title: `Mission in ${city.name}`,
        giver: city.notableCitizens?.[0]?.name || 'A local patron',
        location: city.name,
        objective: city.notableCitizens?.[0]?.description || `Help with matters in ${city.name}`,
        difficulty: 'Variable',
        reward: `100-500 gp and city favor`,
        type: 'Urban'
      });
    });

    // Generate mini-campaign if there are historical events
    if (world.historicalEvents && world.historicalEvents.length > 0) {
      miniCampaigns.push({
        id: 'campaign-main',
        title: `The Fate of ${world.name}`,
        duration: '5-8 sessions',
        partyLevel: '3-8',
        setting: world.name,
        plot: `A world-spanning adventure affecting the fate of ${world.name}`,
        acts: [
          {
            title: 'Gathering Shadows',
            description: 'Strange events plague the realm'
          },
          {
            title: 'Uncovering Truth',
            description: 'The party discovers the real threat'
          },
          {
            title: 'Final Conflict',
            description: 'An epic confrontation determines the world\'s future'
          }
        ]
      });
    }

    const data: ForgeData = {
      worldName: world.name,
      version: '1.0',
      metadata: {
        worldAge: world.age,
        magicLevel: world.magicLevel,
        civilization: world.civilizationAbundance,
        generatedAt: new Date().toISOString()
      },
      encounters: {
        total: encounters.length,
        data: encounters
      },
      quests: {
        total: quests.length,
        data: quests
      },
      oneShots: {
        total: oneShots.length,
        data: oneShots
      },
      miniCampaigns: {
        total: miniCampaigns.length,
        data: miniCampaigns
      }
    };

    setForgeData(data);
    setIsGenerating(false);
  };

  const downloadJSON = () => {
    if (!forgeData) return;

    const dataStr = JSON.stringify(forgeData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${world.name.replace(/\s+/g, '_')}_adventure_forge.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadCSV = () => {
    if (!forgeData) return;

    let csv = 'Type,ID,Name,Location/Giver,Difficulty,Reward\n';

    // Add encounters
    forgeData.encounters.data.forEach(enc => {
      csv += `Encounter,${enc.id},"${enc.name}","${enc.location}","${enc.difficulty}","${enc.rewards}"\n`;
    });

    // Add quests
    forgeData.quests.data.forEach(quest => {
      csv += `Quest,${quest.id},"${quest.title}","${quest.giver || quest.location}","${quest.difficulty}","${quest.reward}"\n`;
    });

    const dataBlob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${world.name.replace(/\s+/g, '_')}_adventures.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <button
        className="forge-export-btn"
        onClick={() => {
          setIsOpen(true);
          if (!forgeData) {
            generateForgeData();
          }
        }}
        title="Export world data to ADVENTURE FORGE format"
      >
        ⚔️ ADVENTURE FORGE Export
      </button>

      {isOpen && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="forge-export-modal" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setIsOpen(false)}>✕</button>

            <h2>⚔️ ADVENTURE FORGE Export</h2>
            <p className="modal-subtitle">
              Export encounters, quests, and campaigns for use in ADVENTURE FORGE
            </p>

            {isGenerating ? (
              <div className="generating">
                <div className="spinner"></div>
                <p>Generating ADVENTURE FORGE data...</p>
              </div>
            ) : forgeData ? (
              <>
                {/* Summary Stats */}
                <div className="export-stats">
                  <div className="stat-card">
                    <div className="stat-icon">⚔️</div>
                    <div className="stat-info">
                      <div className="stat-label">Encounters</div>
                      <div className="stat-value">{forgeData.encounters.total}</div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">📜</div>
                    <div className="stat-info">
                      <div className="stat-label">Quests</div>
                      <div className="stat-value">{forgeData.quests.total}</div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">🎭</div>
                    <div className="stat-info">
                      <div className="stat-label">One-Shots</div>
                      <div className="stat-value">{forgeData.oneShots.total}</div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">📚</div>
                    <div className="stat-info">
                      <div className="stat-label">Campaigns</div>
                      <div className="stat-value">{forgeData.miniCampaigns.total}</div>
                    </div>
                  </div>
                </div>

                {/* Preview Tabs */}
                <div className="preview-section">
                  <div className="preview-tabs">
                    <button
                      className={`preview-tab ${activePreviewTab === 'encounters' ? 'active' : ''}`}
                      onClick={() => setActivePreviewTab('encounters')}
                    >
                      ⚔️ Encounters ({forgeData.encounters.total})
                    </button>
                    <button
                      className={`preview-tab ${activePreviewTab === 'quests' ? 'active' : ''}`}
                      onClick={() => setActivePreviewTab('quests')}
                    >
                      📜 Quests ({forgeData.quests.total})
                    </button>
                    <button
                      className={`preview-tab ${activePreviewTab === 'oneshots' ? 'active' : ''}`}
                      onClick={() => setActivePreviewTab('oneshots')}
                    >
                      🎭 One-Shots ({forgeData.oneShots.total})
                    </button>
                    {forgeData.miniCampaigns.total > 0 && (
                      <button
                        className={`preview-tab ${activePreviewTab === 'campaigns' ? 'active' : ''}`}
                        onClick={() => setActivePreviewTab('campaigns')}
                      >
                        📚 Campaigns ({forgeData.miniCampaigns.total})
                      </button>
                    )}
                  </div>

                  <div className="preview-content">
                    {activePreviewTab === 'encounters' && (
                      <div className="preview-list">
                        {forgeData.encounters.data.slice(0, 5).map(enc => (
                          <div key={enc.id} className="preview-item">
                            <div className="item-header">
                              <strong>{enc.name}</strong>
                              <span className="item-type">{enc.type}</span>
                            </div>
                            <div className="item-meta">
                              <span>📍 {enc.location}</span>
                              <span>⚠️ {enc.difficulty}</span>
                            </div>
                          </div>
                        ))}
                        {forgeData.encounters.total > 5 && (
                          <p className="more-items">+{forgeData.encounters.total - 5} more encounters...</p>
                        )}
                      </div>
                    )}

                    {activePreviewTab === 'quests' && (
                      <div className="preview-list">
                        {forgeData.quests.data.slice(0, 5).map(quest => (
                          <div key={quest.id} className="preview-item">
                            <div className="item-header">
                              <strong>{quest.title}</strong>
                              <span className="item-type">{quest.type}</span>
                            </div>
                            <div className="item-meta">
                              <span>👤 {quest.giver}</span>
                              <span>💰 {quest.reward}</span>
                            </div>
                          </div>
                        ))}
                        {forgeData.quests.total > 5 && (
                          <p className="more-items">+{forgeData.quests.total - 5} more quests...</p>
                        )}
                      </div>
                    )}

                    {activePreviewTab === 'oneshots' && (
                      <div className="preview-list">
                        {forgeData.oneShots.data.map(oneshot => (
                          <div key={oneshot.id} className="preview-item">
                            <div className="item-header">
                              <strong>{oneshot.title}</strong>
                              <span className="item-type">{oneshot.duration}</span>
                            </div>
                            <div className="item-meta">
                              <span>📍 {oneshot.setting}</span>
                              <span>👥 Level {oneshot.partyLevel}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {activePreviewTab === 'campaigns' && (
                      <div className="preview-list">
                        {forgeData.miniCampaigns.data.map(campaign => (
                          <div key={campaign.id} className="preview-item">
                            <div className="item-header">
                              <strong>{campaign.title}</strong>
                              <span className="item-type">{campaign.duration}</span>
                            </div>
                            <div className="item-meta">
                              <span>📍 {campaign.setting}</span>
                              <span>👥 Level {campaign.partyLevel}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Export Buttons */}
                <div className="export-buttons">
                  <button className="btn btn-primary" onClick={downloadJSON}>
                    📥 Download JSON (ADVENTURE FORGE)
                  </button>
                  <button className="btn btn-secondary" onClick={downloadCSV}>
                    📊 Download CSV
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      generateForgeData();
                    }}
                  >
                    🔄 Regenerate
                  </button>
                </div>

                <div className="export-info">
                  <p>💡 The JSON file is ready to import into ADVENTURE FORGE. The CSV can be imported into spreadsheets for additional analysis.</p>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}
