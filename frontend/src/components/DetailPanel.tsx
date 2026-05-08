/**
 * DetailPanel — slide-over panel showing full Ex Novo / Ex Umbra data
 * with a "Launch in Mythweaver" button that passes data to the Game Master app.
 */
import React from 'react';
import { City, PointOfInterest, World } from '../types/world';
import type { ExNovoCity } from '../utils/exNovoSimulator';
import type { ExUmbraDungeon } from '../utils/exUmbraSimulator';
import { generateDistrictEstablishments, Establishment, EstablishmentType } from '../utils/establishmentGenerator';
import CityMiniMap from './CityMiniMap';
import DungeonMap from './DungeonMap';
import WonderDetail from './WonderDetail';
import { isEcologicalWonder } from '../utils/wonderRenderingHelpers';

interface DetailPanelProps {
  entity: City | PointOfInterest | null;
  world: World;
  mythweaverUrl: string;
  onClose: () => void;
  exNovo: ExNovoCity | null;
  dungeon: ExUmbraDungeon | null;
  dungeonPayload: object | null;
}

function isCity(e: City | PointOfInterest): e is City {
  return 'governmentType' in e;
}

// ─── Mythweaver deep-link ─────────────────────────────────────────────────

function launchMythweaver(payload: object, mythweaverUrl: string) {
  const base = mythweaverUrl.replace(/\/$/, '');
  const encoded = btoa(encodeURIComponent(JSON.stringify(payload)));
  const url = `${base}/?prefill=${encoded}`;
  window.open(url, '_blank', 'noopener');
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{
      fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
      color: '#666', borderBottom: '1px solid #2e2e42', paddingBottom: 4, marginBottom: 10
    }}>
      {title}
    </div>
    {children}
  </div>
);

const Badge: React.FC<{ color?: string; children: React.ReactNode }> = ({ color = '#d4af37', children }) => (
  <span style={{
    display: 'inline-block',
    background: `${color}22`,
    border: `1px solid ${color}66`,
    borderRadius: 4,
    padding: '2px 8px',
    fontSize: 11,
    color,
    marginRight: 6,
    marginBottom: 4,
  }}>{children}</span>
);

const RoomChip: React.FC<{ role: string; name: string; description: string }> = ({ role, name, description }) => {
  const colors: Record<string, string> = {
    encounter: '#c0392b', reward: '#d4af37', boss: '#8e44ad',
    lore: '#2980b9', hazard: '#e67e22', transition: '#27ae60'
  };
  const c = colors[role] || '#666';
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
      <span style={{
        flex: '0 0 auto', fontSize: 9, background: `${c}22`, border: `1px solid ${c}66`,
        color: c, borderRadius: 3, padding: '2px 6px', textTransform: 'uppercase',
        letterSpacing: '0.06em', marginTop: 1,
      }}>{role}</span>
      <div>
        <div style={{ fontSize: 12, color: '#e2e2e8', fontWeight: 'bold' }}>{name}</div>
        <div style={{ fontSize: 11, color: '#666', lineHeight: 1.4 }}>{description}</div>
      </div>
    </div>
  );
};

// ─── Establishment Card ───────────────────────────────────────────────────

const TYPE_LABEL: Record<EstablishmentType, string> = {
  tavern: 'Tavern', inn: 'Inn', blacksmith: 'Blacksmith', general_store: 'General Store',
  apothecary: 'Apothecary', alchemist: 'Alchemist', magic_shop: 'Magic Shop', bookshop: 'Bookshop',
  jeweler: 'Jeweler', tailor: 'Tailor', provisioner: 'Provisioner', temple: 'Temple',
  guildhall: 'Guildhall', guard_post: 'Guard Post', pawnbroker: 'Pawnbroker', scribe: 'Scribe',
  chandler: 'Chandler', stablemaster: 'Stablemaster',
  bakery: 'Bakery', library: 'Library', cartographer: 'Cartographer', stables: 'Stables',
  taxidermist: 'Taxidermist', mortician: 'Mortician', shipwright: 'Shipwright',
  tattoo_parlour: 'Tattoo Parlour', potion_brewer: 'Potion Brewer', monster_parts: 'Monster Parts',
  thieves_guild: 'Thieves\' Guild', gambling_den: 'Gambling Den', fencing_operation: 'Fencing Operation',
  fortune_teller: 'Fortune Teller',
};

const TYPE_COLOR: Record<EstablishmentType, string> = {
  tavern: '#e67e22', inn: '#27ae60', blacksmith: '#e74c3c', general_store: '#7f8c8d',
  apothecary: '#2ecc71', alchemist: '#9b59b6', magic_shop: '#8e44ad', bookshop: '#2980b9',
  jeweler: '#d4af37', tailor: '#16a085', provisioner: '#c0392b', temple: '#f39c12',
  guildhall: '#2980b9', guard_post: '#7f8c8d', pawnbroker: '#795548', scribe: '#5d6d7e',
  chandler: '#f39c12', stablemaster: '#795548',
  bakery: '#e67e22', library: '#2471a3', cartographer: '#1a5276', stables: '#6e4c1e',
  taxidermist: '#7d6608', mortician: '#5d6d7e', shipwright: '#1a6b8a', tattoo_parlour: '#6c3483',
  potion_brewer: '#9b59b6', monster_parts: '#922b21', thieves_guild: '#1c2833',
  gambling_den: '#d35400', fencing_operation: '#626567', fortune_teller: '#6c3483',
};

// ─── Grimoire session-note formatter ────────────────────────────────────────
// Matches the text format used by saveCommerceToSession in Grimoire so notes
// can be pasted directly into the Grimoire session editor.

function buildGrimoireNote(est: Establishment, districtName: string, cityName: string): string {
  const lines: string[] = [
    `${est.name} (${TYPE_LABEL[est.type]}) — ${districtName}, ${cityName}`,
    `Proprietor: ${est.proprietor.name} — ${est.proprietor.description}`,
    `Description: ${est.description}`,
  ];
  if (est.prices) lines.push(`Pricing: ${est.prices}`);
  if (est.features.length > 0) lines.push(`Features: ${est.features.join(' | ')}`);
  if (est.stock && est.stock.length > 0) lines.push(`In Stock: ${est.stock.join('; ')}`);
  if (est.menu && est.menu.length > 0) lines.push(`Menu/Notable: ${est.menu.join('; ')}`);
  if (est.services && est.services.length > 0) lines.push(`Services: ${est.services.join('; ')}`);
  if (est.rumor) lines.push(`Rumor heard here: "${est.rumor}"`);
  return lines.join('\n');
}

const EstablishmentCard: React.FC<{
  est: Establishment;
  districtName: string;
  cityName: string;
}> = ({ est, districtName, cityName }) => {
  const [open, setOpen] = React.useState(false);
  const [noteCopied, setNoteCopied] = React.useState(false);
  const color = TYPE_COLOR[est.type];

  const handleCopyNote = (e: React.MouseEvent) => {
    e.stopPropagation();
    const note = buildGrimoireNote(est, districtName, cityName);
    copyToClipboard(note);
    setNoteCopied(true);
    setTimeout(() => setNoteCopied(false), 2000);
  };

  return (
    <div style={{
      background: '#111118',
      border: `1px solid ${color}33`,
      borderLeft: `3px solid ${color}`,
      borderRadius: 6,
      marginBottom: 8,
      overflow: 'hidden',
    }}>
      {/* Header row */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px', cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <span style={{ fontSize: 16 }}>{est.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 'bold', color: '#e2e2e8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {est.name}
          </div>
          <div style={{ fontSize: 10, color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {TYPE_LABEL[est.type]}
          </div>
        </div>
        <button
          onClick={handleCopyNote}
          title="Copy session note (Grimoire format)"
          style={{
            flexShrink: 0, fontSize: 10, padding: '2px 6px', cursor: 'pointer',
            background: noteCopied ? '#d4af3722' : 'transparent',
            border: `1px solid ${noteCopied ? '#d4af3766' : '#333'}`,
            borderRadius: 3, color: noteCopied ? '#d4af37' : '#555',
            lineHeight: 1.4, marginRight: 4,
          }}
        >{noteCopied ? '✓ Copied' : '📋 Note'}</button>
        <span style={{ fontSize: 10, color: '#444', flexShrink: 0 }}>{open ? '▲' : '▼'}</span>
      </div>

      {/* Expanded content */}
      {open && (
        <div style={{ padding: '0 12px 12px' }}>
          {/* Proprietor */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', marginBottom: 2 }}>
              Proprietor
            </div>
            <div style={{ fontSize: 11, color: color, fontWeight: 'bold' }}>{est.proprietor.name}</div>
            <div style={{ fontSize: 11, color: '#777', lineHeight: 1.5, marginTop: 2 }}>
              {est.proprietor.description}
            </div>
          </div>

          {/* Description */}
          <div style={{ fontSize: 11, color: '#999', lineHeight: 1.5, marginBottom: 8, fontStyle: 'italic' }}>
            {est.description}
          </div>

          {/* Pricing */}
          {est.prices && (
            <div style={{ fontSize: 10, color: '#d4af37', marginBottom: 8 }}>
              💰 {est.prices}
            </div>
          )}

          {/* Features */}
          {est.features.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              {est.features.map((f, i) => (
                <div key={i} style={{ fontSize: 11, color: '#888', lineHeight: 1.5, display: 'flex', gap: 6 }}>
                  <span style={{ color: color, flexShrink: 0 }}>•</span>
                  <span>{f}</span>
                </div>
              ))}
            </div>
          )}

          {/* Rumor (taverns) */}
          {est.rumor && (
            <div style={{
              background: '#8e44ad18', border: '1px solid #8e44ad44',
              borderRadius: 4, padding: '6px 10px', marginBottom: 8,
            }}>
              <div style={{ fontSize: 9, color: '#8e44ad', textTransform: 'uppercase', marginBottom: 3 }}>
                Rumor heard here
              </div>
              <div style={{ fontSize: 11, color: '#b8b8c8', lineHeight: 1.5, fontStyle: 'italic' }}>
                "{est.rumor}"
              </div>
            </div>
          )}

          {/* Menu (tavern/inn) */}
          {est.menu && est.menu.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 9, color: '#555', textTransform: 'uppercase', marginBottom: 4 }}>
                {est.type === 'inn' ? 'Notable' : 'Menu'}
              </div>
              {est.menu.map((m, i) => (
                <div key={i} style={{ fontSize: 11, color: '#888', lineHeight: 1.5 }}>• {m}</div>
              ))}
            </div>
          )}

          {/* Stock (shops) */}
          {est.stock && est.stock.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 9, color: '#555', textTransform: 'uppercase', marginBottom: 4 }}>
                In Stock
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 8px' }}>
                {est.stock.map((s, i) => (
                  <div key={i} style={{ fontSize: 10, color: '#888', lineHeight: 1.6 }}>• {s}</div>
                ))}
              </div>
            </div>
          )}

          {/* Services */}
          {est.services && est.services.length > 0 && (
            <div>
              <div style={{ fontSize: 9, color: '#555', textTransform: 'uppercase', marginBottom: 4 }}>
                Services
              </div>
              {est.services.map((s, i) => (
                <div key={i} style={{ fontSize: 11, color: '#888', lineHeight: 1.6 }}>• {s}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── District with Establishments ────────────────────────────────────────────

const DistrictCard: React.FC<{
  district: { name: string; description: string };
  city: City;
  worldSeed: string;
  magicLevel: number;
}> = ({ district, city, worldSeed, magicLevel }) => {
  const [open, setOpen] = React.useState(false);
  const [establishments, setEstablishments] = React.useState<Establishment[] | null>(null);
  const [salt, setSalt] = React.useState(0);

  const handleExplore = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!open) {
      // Generate on first open (or re-generate with new salt)
      const ests = generateDistrictEstablishments(
        district, city.id, city.name, worldSeed + salt, magicLevel
      );
      setEstablishments(ests);
    }
    setOpen(o => !o);
  };

  const handleReroll = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextSalt = salt + 1;
    setSalt(nextSalt);
    const ests = generateDistrictEstablishments(
      district, city.id, city.name, worldSeed + nextSalt, magicLevel
    );
    setEstablishments(ests);
  };

  return (
    <div style={{ background: '#1e1e28', border: '1px solid #2e2e42', borderRadius: 6, overflow: 'hidden' }}>
      {/* District header */}
      <div style={{ padding: '8px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
          <div style={{ fontSize: 12, fontWeight: 'bold', color: '#d4af37' }}>{district.name}</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {open && (
              <button
                onClick={handleReroll}
                style={{
                  fontSize: 10, padding: '2px 7px', cursor: 'pointer',
                  background: 'transparent', border: '1px solid #2e2e42',
                  borderRadius: 3, color: '#555', lineHeight: 1.4,
                }}
                title="Reroll establishments"
              >↺ Reroll</button>
            )}
            <button
              onClick={handleExplore}
              style={{
                fontSize: 10, padding: '2px 8px', cursor: 'pointer',
                background: open ? '#d4af3722' : 'transparent',
                border: `1px solid ${open ? '#d4af3766' : '#2e2e42'}`,
                borderRadius: 3,
                color: open ? '#d4af37' : '#666',
                lineHeight: 1.4,
              }}
            >
              {open ? '▲ Hide' : '🏪 Explore'}
            </button>
          </div>
        </div>
        <div style={{ fontSize: 11, color: '#888', lineHeight: 1.4 }}>{district.description}</div>
      </div>

      {/* Establishments */}
      {open && establishments && (
        <div style={{ padding: '0 10px 10px', borderTop: '1px solid #2e2e42', paddingTop: 10 }}>
          {establishments.map(est => (
            <EstablishmentCard
              key={est.id}
              est={est}
              districtName={district.name}
              cityName={city.name}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── City Detail ──────────────────────────────────────────────────────────

const CityDetail: React.FC<{ city: City; exNovo: ExNovoCity; world: World; mythweaverUrl: string }> = ({ city, exNovo, world, mythweaverUrl }) => {
  const [copied, setCopied] = React.useState(false);

  const terrainType = world.hexGrid?.[`${city.hex_x},${city.hex_y}`]?.terrainType;

  const payload = {
    rule_system: 'D&D 5e',
    setting_custom: world.name,
    environment_custom: `Urban — ${city.name}`,
    story_type: 'City Adventure',
    tone: 'Heroic',
    party_size: '4 players',
    character_level: 'Tier 2 (5-10)',
    length: 'One-Shot (3-4 hours)',
    existing_npcs: [
      `${exNovo.leader.title} ${exNovo.leader.name}: ${exNovo.leader.description}`,
      `Crime Lord "${exNovo.crimeLord.alias}" (${exNovo.crimeLord.name}): ${exNovo.crimeLord.description}`,
      `${exNovo.guildMaster.title} ${exNovo.guildMaster.name}: ${exNovo.guildMaster.description}`,
    ].join('\n\n'),
    world_lore: [
      exNovo.foundingStory,
      exNovo.specialty,
      `Current problem: ${exNovo.currentProblem}`,
      `Hidden secret: ${exNovo.secret}`,
    ].join('\n\n'),
    campaign_context: `${city.name} is a ${city.governmentType.toLowerCase()} city in the world of ${world.name}. The party has arrived here.`,
  };

  const handleCopy = () => {
    copyToClipboard(JSON.stringify(payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <CityMiniMap
        cityId={city.id}
        worldSeed={world.worldSeed}
        districts={exNovo.districts}
        cityName={city.name}
        terrainType={terrainType}
      />
      {/* City at a glance */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {[
          { label: 'Government', value: city.governmentType },
          { label: 'Economy', value: city.economicFocus },
          { label: 'Age', value: exNovo.age },
          { label: 'Districts', value: String(exNovo.districts.length) },
        ].map(stat => (
          <div key={stat.label} style={{
            flex: '1 1 auto', minWidth: 90,
            background: '#1e1e28', border: '1px solid #2e2e42', borderRadius: 6,
            padding: '8px 12px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 9, color: '#555566', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>{stat.label}</div>
            <div style={{ fontSize: 12, color: '#d4af37', fontWeight: 'bold' }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <Section title="Founding">
        <p style={{ fontSize: 13, color: '#b8b8c8', lineHeight: 1.7, fontStyle: 'italic' }}>{exNovo.foundingStory}</p>
      </Section>

      <Section title="Known For">
        <p style={{ fontSize: 13, color: '#b8b8c8', lineHeight: 1.7 }}>{exNovo.specialty}</p>
      </Section>

      <Section title="Districts — click 🏪 Explore to generate establishments">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {exNovo.districts.map(d => (
            <DistrictCard
              key={d.name}
              district={d}
              city={city}
              worldSeed={world.worldSeed}
              magicLevel={world.magicLevel}
            />
          ))}
        </div>
      </Section>

      <Section title="Key NPCs">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { label: '👑 ' + exNovo.leader.title, name: exNovo.leader.name, desc: exNovo.leader.description, color: '#d4af37' },
            { label: '🗡️ Crime Lord', name: `"${exNovo.crimeLord.alias}" (${exNovo.crimeLord.name})`, desc: exNovo.crimeLord.description, color: '#c0392b' },
            { label: '💰 ' + exNovo.guildMaster.title, name: exNovo.guildMaster.name, desc: exNovo.guildMaster.description, color: '#2980b9' },
          ].map(npc => (
            <div key={npc.name} style={{ background: '#1e1e28', border: `1px solid ${npc.color}33`, borderLeft: `3px solid ${npc.color}`, borderRadius: 6, padding: '8px 12px' }}>
              <div style={{ fontSize: 10, color: npc.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{npc.label}</div>
              <div style={{ fontSize: 12, fontWeight: 'bold', color: '#e2e2e8', marginBottom: 4 }}>{npc.name}</div>
              <div style={{ fontSize: 11, color: '#888', lineHeight: 1.5 }}>{npc.desc}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Factions">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {exNovo.factions.map(f => {
            const factionColor = f.type === 'Political' ? '#2980b9'
              : f.type === 'Criminal' ? '#c0392b'
              : '#d4af37';
            return (
              <div key={f.id} style={{
                background: '#1e1e28', border: `1px solid ${factionColor}33`,
                borderLeft: `3px solid ${factionColor}`, borderRadius: 6, padding: '10px 14px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 'bold', color: '#e2e2e8' }}>{f.name}</span>
                  <span style={{
                    fontSize: 9, background: `${factionColor}22`, border: `1px solid ${factionColor}66`,
                    color: factionColor, borderRadius: 3, padding: '2px 7px',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}>{f.type}</span>
                </div>
                {f.leader && (
                  <div style={{ fontSize: 11, color: factionColor, marginBottom: 4 }}>
                    ⚑ Leader: <strong style={{ color: '#e2e2e8' }}>{f.leader}</strong>
                  </div>
                )}
                <div style={{ fontSize: 11, color: '#888', lineHeight: 1.5, marginBottom: f.rivals.length > 0 || f.allies.length > 0 ? 6 : 0 }}>
                  {f.description}
                </div>
                {(f.rivals.length > 0 || f.allies.length > 0) && (
                  <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                    {f.rivals.length > 0 && (
                      <span style={{ fontSize: 10, color: '#c0392b' }}>
                        ⚔ Rivals with {exNovo.factions.filter(r => f.rivals.includes(r.id)).map(r => r.name).join(', ') || 'unknown'}
                      </span>
                    )}
                    {f.allies.length > 0 && (
                      <span style={{ fontSize: 10, color: '#27ae60' }}>
                        🤝 Allied with {exNovo.factions.filter(a => f.allies.includes(a.id)).map(a => a.name).join(', ') || 'unknown'}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Current Situation">
        <div style={{ background: '#1e1e28', border: '1px solid #c0392b44', borderLeft: '3px solid #c0392b', borderRadius: 6, padding: '10px 14px', marginBottom: 10 }}>
          <div style={{ fontSize: 10, color: '#c0392b', textTransform: 'uppercase', marginBottom: 4 }}>Active Problem</div>
          <p style={{ fontSize: 12, color: '#b8b8c8', lineHeight: 1.6 }}>{exNovo.currentProblem}</p>
        </div>
        <div style={{ background: '#1e1e28', border: '1px solid #8e44ad44', borderLeft: '3px solid #8e44ad', borderRadius: 6, padding: '10px 14px' }}>
          <div style={{ fontSize: 10, color: '#8e44ad', textTransform: 'uppercase', marginBottom: 4 }}>Hidden Secret</div>
          <p style={{ fontSize: 12, color: '#b8b8c8', lineHeight: 1.6 }}>{exNovo.secret}</p>
        </div>
      </Section>

      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button onClick={() => launchMythweaver(payload, mythweaverUrl)} style={launchBtnStyle}>
          ⚔️ Launch in Mythweaver
        </button>
        <button onClick={handleCopy} style={copyBtnStyle}>
          {copied ? '✓ Copied' : '📋 Copy Data'}
        </button>
      </div>
    </>
  );
};

// ─── Dungeon Detail ───────────────────────────────────────────────────────

const DungeonDetail: React.FC<{ poi: PointOfInterest; dungeon: ExUmbraDungeon; mythweaverUrl: string; dungeonPayload: object; worldSeed: string }> = ({ poi, dungeon, mythweaverUrl, dungeonPayload, worldSeed }) => {
  const [copied, setCopied] = React.useState(false);
  const payload = dungeonPayload;

  const tierColors: Record<number, string> = { 1: '#27ae60', 2: '#d4af37', 3: '#e67e22', 4: '#c0392b' };
  const tc = tierColors[dungeon.crTier.tier];

  const handleCopy = () => {
    copyToClipboard(JSON.stringify(payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <DungeonMap poi={poi} dungeon={dungeon} worldSeed={worldSeed} />
      <div style={{ background: `${tc}18`, border: `1px solid ${tc}55`, borderRadius: 8, padding: '12px 16px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 10, color: tc, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Challenge Rating</div>
          <div style={{ fontSize: 18, fontWeight: 'bold', color: tc }}>{dungeon.crTier.label}</div>
          <div style={{ fontSize: 11, color: '#888' }}>{dungeon.crTier.crRange} · Levels {dungeon.crTier.levelRange}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, color: '#666', textTransform: 'uppercase', marginBottom: 2 }}>Danger Level</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: tc }}>{poi.dangerLevel}<span style={{ fontSize: 12, color: '#666' }}>/20</span></div>
        </div>
      </div>

      <Section title="Origin">
        <p style={{ fontSize: 13, color: '#b8b8c8', lineHeight: 1.7, fontStyle: 'italic' }}>
          This place began as {dungeon.origin}.
        </p>
        <p style={{ fontSize: 11, color: '#666', marginTop: 6 }}>{dungeon.crTier.description}</p>
      </Section>

      <Section title="Aspects — What Makes This Dungeon Dangerous">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {dungeon.aspects.map(a => (
            <div key={a.name} style={{ background: '#1e1e28', border: '1px solid #2e2e42', borderLeft: '3px solid #e67e22', borderRadius: 6, padding: '8px 12px' }}>
              <div style={{ fontSize: 12, fontWeight: 'bold', color: '#e67e22', marginBottom: 3 }}>{a.name}</div>
              <div style={{ fontSize: 11, color: '#888', lineHeight: 1.4 }}>{a.description}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Areas">
        {dungeon.rooms.map(r => <RoomChip key={r.name} {...r} />)}
      </Section>

      <Section title="Threats">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ background: '#1e1e28', border: `1px solid ${tc}44`, borderLeft: `3px solid ${tc}`, borderRadius: 6, padding: '8px 12px' }}>
            <div style={{ fontSize: 10, color: tc, textTransform: 'uppercase', marginBottom: 2 }}>Boss</div>
            <div style={{ fontSize: 13, color: '#e2e2e8', fontWeight: 'bold' }}>{dungeon.boss}</div>
          </div>
          <div style={{ background: '#1e1e28', border: '1px solid #2e2e42', borderRadius: 6, padding: '8px 12px' }}>
            <div style={{ fontSize: 10, color: '#666', textTransform: 'uppercase', marginBottom: 2 }}>Minions</div>
            <div style={{ fontSize: 12, color: '#b8b8c8' }}>{dungeon.minions}</div>
          </div>
        </div>
      </Section>

      <Section title="Traps">
        {dungeon.traps.map((t, i) => (
          <div key={i} style={{ fontSize: 12, color: '#888', padding: '4px 0', borderBottom: '1px solid #2e2e42' }}>
            ⚙️ {t}
          </div>
        ))}
      </Section>

      <Section title="Reward">
        <div style={{ background: '#d4af3722', border: '1px solid #d4af3766', borderRadius: 6, padding: '8px 12px' }}>
          <span style={{ fontSize: 12, color: '#d4af37' }}>💰 {dungeon.reward}</span>
        </div>
      </Section>

      <Section title="The Secret">
        <div style={{ background: '#8e44ad22', border: '1px solid #8e44ad66', borderLeft: '3px solid #8e44ad', borderRadius: 6, padding: '10px 14px' }}>
          <p style={{ fontSize: 12, color: '#b8b8c8', lineHeight: 1.6, fontStyle: 'italic' }}>{dungeon.secret}</p>
        </div>
      </Section>

      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button onClick={() => launchMythweaver(payload, mythweaverUrl)} style={launchBtnStyle}>
          ⚔️ Launch in Mythweaver
        </button>
        <button onClick={handleCopy} style={copyBtnStyle}>
          {copied ? '✓ Copied' : '📋 Copy Data'}
        </button>
      </div>
    </>
  );
};

// ─── Button styles ────────────────────────────────────────────────────────

const launchBtnStyle: React.CSSProperties = {
  flex: 1,
  background: 'linear-gradient(135deg, #d4af37, #9a7d20)',
  border: 'none',
  borderRadius: 6,
  color: '#000',
  fontWeight: 'bold',
  fontSize: 13,
  padding: '10px 16px',
  cursor: 'pointer',
  letterSpacing: '0.03em',
};

const copyBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid #2e2e42',
  borderRadius: 6,
  color: '#888',
  fontSize: 12,
  padding: '10px 14px',
  cursor: 'pointer',
};

// ─── Main Panel ───────────────────────────────────────────────────────────

const DetailPanel: React.FC<DetailPanelProps> = ({ entity, world, mythweaverUrl, onClose, exNovo, dungeon, dungeonPayload }) => {
  if (!entity) return null;

  const city = isCity(entity) ? entity : null;
  const poi = !isCity(entity) ? entity : null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 200,
        }}
      />
      {/* Panel */}
      <div style={{
        position: 'fixed',
        top: 0, right: 0,
        width: 420,
        height: '100vh',
        background: '#16161d',
        borderLeft: '2px solid #d4af37',
        zIndex: 201,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.6)',
      }}>
        {/* Header */}
        <div style={{
          background: '#0f0f13',
          borderBottom: '1px solid #2e2e42',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 10, color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
              {city ? '🏙️ City' : `📍 ${poi?.type.replace('_', ' ')}`}
            </div>
            <h2 style={{ fontSize: 18, color: '#d4af37', fontWeight: 'bold' }}>{entity.name}</h2>
            {city && <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{city.governmentType} · Pop. {city.population?.toLocaleString()}</div>}
            {poi && dungeon && (
              <div style={{ fontSize: 12, marginTop: 4 }}>
                <span style={{
                  background: `${['#27ae60','#d4af37','#e67e22','#c0392b'][dungeon.crTier.tier - 1]}22`,
                  border: `1px solid ${['#27ae60','#d4af37','#e67e22','#c0392b'][dungeon.crTier.tier - 1]}66`,
                  color: ['#27ae60','#d4af37','#e67e22','#c0392b'][dungeon.crTier.tier - 1],
                  borderRadius: 4, padding: '2px 8px', fontSize: 11,
                }}>
                  {dungeon.crTier.label} · Levels {dungeon.crTier.levelRange}
                </span>
              </div>
            )}
          </div>
          <button onClick={onClose} style={{
            background: 'transparent', border: '1px solid #2e2e42',
            color: '#666', borderRadius: 4, width: 28, height: 28,
            cursor: 'pointer', fontSize: 14, flexShrink: 0,
          }}>✕</button>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {city && exNovo && (
            <CityDetail city={city} exNovo={exNovo} world={world} mythweaverUrl={mythweaverUrl} />
          )}
          {poi && isEcologicalWonder(poi) && (
            <WonderDetail poi={poi} />
          )}
          {poi && !isEcologicalWonder(poi) && dungeon && dungeonPayload && (
            <DungeonDetail poi={poi} dungeon={dungeon} mythweaverUrl={mythweaverUrl} dungeonPayload={dungeonPayload} worldSeed={world.worldSeed} />
          )}
        </div>
      </div>
    </>
  );
};

export default DetailPanel;
