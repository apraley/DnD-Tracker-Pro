/**
 * WonderDetail — Display ecological wonder with lore, quest hooks, boons/banes
 */
import React from 'react';
import { PointOfInterest } from '../types/world';
import { isEcologicalWonder } from '../utils/wonderRenderingHelpers';

interface WonderDetailProps {
  poi: PointOfInterest;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{
      fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
      color: '#d4af37', borderBottom: '1px solid #2e2e42', paddingBottom: 4, marginBottom: 10
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
    padding: '4px 10px',
    fontSize: 11,
    color,
    marginRight: 6,
    marginBottom: 4,
  }}>{children}</span>
);

const WonderDetail: React.FC<WonderDetailProps> = ({ poi }) => {
  if (!isEcologicalWonder(poi)) return null;

  const meta = poi.wonderMetadata!;
  const leader = meta.leader;

  const difficultyColor = poi.dangerLevel <= 5 ? '#2ecc71' :
                         poi.dangerLevel <= 10 ? '#f39c12' :
                         poi.dangerLevel <= 15 ? '#e74c3c' : '#2c3e50';

  const alignmentColor: Record<string, string> = {
    'Lawful Good': '#2ecc71',
    'Neutral Good': '#27ae60',
    'Chaotic Good': '#16a085',
    'Lawful Neutral': '#f39c12',
    'Neutral': '#95a5a6',
    'Chaotic Neutral': '#e74c3c',
    'Lawful Evil': '#c0392b',
    'Neutral Evil': '#8b0000',
    'Chaotic Evil': '#2c3e50',
  };

  return (
    <>
      {/* Lore Section */}
      <Section title="The Wonder">
        <div style={{
          background: '#1e1e28',
          border: '1px solid #2e2e42',
          borderLeft: `3px solid #8e44ad`,
          borderRadius: 6,
          padding: '12px 16px',
          fontSize: 12,
          color: '#b8b8c8',
          lineHeight: 1.7,
          marginBottom: 12,
        }}>
          {meta.lore}
        </div>

        {meta.terrain && (
          <div style={{ fontSize: 11, color: '#888', display: 'flex', gap: 12 }}>
            <span>🌍 <strong>{meta.terrain}</strong></span>
            <span>⚔️ <strong style={{ color: difficultyColor }}>Danger {poi.dangerLevel}</strong></span>
          </div>
        )}
      </Section>

      {/* Leader Section */}
      {leader && (
        <Section title="Ruler">
          <div style={{
            background: '#1e1e28',
            border: '1px solid #2e2e42',
            borderRadius: 6,
            padding: '12px 16px',
          }}>
            <div style={{ fontSize: 13, fontWeight: 'bold', color: '#d4af37', marginBottom: 4 }}>
              {leader.name}
            </div>
            <div style={{ fontSize: 10, color: '#888', marginBottom: 8 }}>
              <Badge color={alignmentColor[leader.alignment] || '#888'}>{leader.archetype}</Badge>
              <Badge color={alignmentColor[leader.alignment] || '#888'}>{leader.alignment}</Badge>
            </div>
            <div style={{ fontSize: 11, color: '#b8b8c8', lineHeight: 1.6, fontStyle: 'italic' }}>
              {leader.style}
            </div>
          </div>
        </Section>
      )}

      {/* Quest Hooks */}
      {meta.questHooks && meta.questHooks.length > 0 && (
        <Section title="Quest Hooks">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {meta.questHooks.map((hook, idx) => {
              const diffColor = hook.difficulty <= 3 ? '#2ecc71' :
                               hook.difficulty <= 6 ? '#f39c12' :
                               hook.difficulty <= 12 ? '#e74c3c' : '#2c3e50';

              return (
                <div
                  key={idx}
                  style={{
                    background: '#1e1e28',
                    border: '1px solid #2e2e42',
                    borderRadius: 6,
                    padding: '10px 14px',
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 6,
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 'bold', color: '#d4af37' }}>
                      {hook.title}
                    </div>
                    <span style={{
                      fontSize: 9,
                      background: `${diffColor}22`,
                      border: `1px solid ${diffColor}66`,
                      color: diffColor,
                      borderRadius: 3,
                      padding: '2px 6px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      flexShrink: 0,
                      marginLeft: 8,
                    }}>
                      DC {hook.difficulty}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: '#888', lineHeight: 1.5 }}>
                    {hook.description}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Boons */}
      {meta.boons && meta.boons.length > 0 && (
        <Section title="Boons (Potential Rewards)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {meta.boons.map((boon, idx) => (
              <div
                key={idx}
                style={{
                  background: '#1e1e28',
                  border: '1px solid #2ecc7144',
                  borderLeft: '3px solid #2ecc71',
                  borderRadius: 6,
                  padding: '10px 14px',
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 'bold', color: '#2ecc71', marginBottom: 4 }}>
                  {boon.name}
                </div>
                <div style={{ fontSize: 11, color: '#888', lineHeight: 1.5, marginBottom: 6 }}>
                  {boon.description}
                </div>
                <div style={{
                  fontSize: 10,
                  color: '#2ecc71',
                  background: '#2ecc7111',
                  border: '1px solid #2ecc7133',
                  borderRadius: 4,
                  padding: '6px 10px',
                  fontWeight: 'bold',
                  fontStyle: 'italic',
                }}>
                  ⭐ {boon.mechanicalEffect}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Banes */}
      {meta.banes && meta.banes.length > 0 && (
        <Section title="Banes (Potential Curses)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {meta.banes.map((bane, idx) => (
              <div
                key={idx}
                style={{
                  background: '#1e1e28',
                  border: '1px solid #e74c3c44',
                  borderLeft: '3px solid #e74c3c',
                  borderRadius: 6,
                  padding: '10px 14px',
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 'bold', color: '#e74c3c', marginBottom: 4 }}>
                  {bane.name}
                </div>
                <div style={{ fontSize: 11, color: '#888', lineHeight: 1.5, marginBottom: 6 }}>
                  {bane.description}
                </div>
                <div style={{
                  fontSize: 10,
                  color: '#e74c3c',
                  background: '#e74c3c11',
                  border: '1px solid #e74c3c33',
                  borderRadius: 4,
                  padding: '6px 10px',
                  fontWeight: 'bold',
                  fontStyle: 'italic',
                }}>
                  ⚠️ {bane.mechanicalEffect}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Establishments */}
      {meta.establishments && meta.establishments.length > 0 && (
        <Section title="Local Establishments">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {meta.establishments.map((est, idx) => (
              <div
                key={idx}
                style={{
                  background: '#1e1e28',
                  border: '1px solid #2e2e42',
                  borderRadius: 6,
                  padding: '10px 14px',
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 'bold', color: '#d4af37' }}>
                  {est.name}
                </div>
                <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>
                  📍 {est.type}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Discovery Info */}
      {meta.discoveryRequirement && (
        <Section title="Discovery">
          <div style={{
            fontSize: 11,
            color: '#888',
            background: '#2e2e42',
            border: '1px solid #3e3e52',
            borderRadius: 6,
            padding: '10px 14px',
            lineHeight: 1.6,
            fontStyle: 'italic',
          }}>
            {meta.discoveryRequirement}
          </div>
        </Section>
      )}
    </>
  );
};

export default WonderDetail;
