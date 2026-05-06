/**
 * DetailPanel — slide-over panel showing full Ex Novo / Ex Umbra data
 * with a "Launch in Mythweaver" button that passes data to the Game Master app.
 */
import React from 'react';
import { City, PointOfInterest, World } from '../types/world';
import { simulateExNovo, ExNovoCity } from '../utils/exNovoSimulator';
import { simulateExUmbra, buildMythweaverPayload, ExUmbraDungeon } from '../utils/exUmbraSimulator';

interface DetailPanelProps {
  entity: City | PointOfInterest | null;
  world: World;
  mythweaverUrl: string;
  onClose: () => void;
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

// ─── City Detail ──────────────────────────────────────────────────────────

const CityDetail: React.FC<{ city: City; exNovo: ExNovoCity; world: World; mythweaverUrl: string }> = ({ city, exNovo, world, mythweaverUrl }) => {
  const [copied, setCopied] = React.useState(false);

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
      <Section title="Founding">
        <p style={{ fontSize: 13, color: '#b8b8c8', lineHeight: 1.7, fontStyle: 'italic' }}>{exNovo.foundingStory}</p>
      </Section>

      <Section title="Known For">
        <p style={{ fontSize: 13, color: '#b8b8c8', lineHeight: 1.7 }}>{exNovo.specialty}</p>
      </Section>

      <Section title="Districts">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {exNovo.districts.map(d => (
            <div key={d.name} style={{ background: '#1e1e28', border: '1px solid #2e2e42', borderRadius: 6, padding: '8px 12px' }}>
              <div style={{ fontSize: 12, fontWeight: 'bold', color: '#d4af37', marginBottom: 3 }}>{d.name}</div>
              <div style={{ fontSize: 11, color: '#888', lineHeight: 1.4 }}>{d.description}</div>
            </div>
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
        {exNovo.factions.map(f => (
          <div key={f.id} style={{ marginBottom: 6 }}>
            <Badge>{f.type}</Badge>
            <span style={{ fontSize: 12, color: '#e2e2e8' }}>{f.name}</span>
            <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{f.description}</div>
          </div>
        ))}
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

const DungeonDetail: React.FC<{ poi: PointOfInterest; dungeon: ExUmbraDungeon; world: World; mythweaverUrl: string }> = ({ poi, dungeon, world, mythweaverUrl }) => {
  const [copied, setCopied] = React.useState(false);
  const payload = buildMythweaverPayload(poi, dungeon, world.name);

  const tierColors: Record<number, string> = { 1: '#27ae60', 2: '#d4af37', 3: '#e67e22', 4: '#c0392b' };
  const tc = tierColors[dungeon.crTier.tier];

  const handleCopy = () => {
    copyToClipboard(JSON.stringify(payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
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

const DetailPanel: React.FC<DetailPanelProps> = ({ entity, world, mythweaverUrl, onClose }) => {
  if (!entity) return null;

  const city = isCity(entity) ? entity : null;
  const poi = !isCity(entity) ? entity : null;
  const exNovo = city ? simulateExNovo(city, world.worldSeed) : null;
  const exUmbra = poi ? simulateExUmbra(poi, world.worldSeed) : null;

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
            {poi && exUmbra && (
              <div style={{ fontSize: 12, marginTop: 4 }}>
                <span style={{
                  background: `${['#27ae60','#d4af37','#e67e22','#c0392b'][exUmbra.crTier.tier - 1]}22`,
                  border: `1px solid ${['#27ae60','#d4af37','#e67e22','#c0392b'][exUmbra.crTier.tier - 1]}66`,
                  color: ['#27ae60','#d4af37','#e67e22','#c0392b'][exUmbra.crTier.tier - 1],
                  borderRadius: 4, padding: '2px 8px', fontSize: 11,
                }}>
                  {exUmbra.crTier.label} · Levels {exUmbra.crTier.levelRange}
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
          {poi && exUmbra && (
            <DungeonDetail poi={poi} dungeon={exUmbra} world={world} mythweaverUrl={mythweaverUrl} />
          )}
        </div>
      </div>
    </>
  );
};

export default DetailPanel;
