// Detailed Entity Information Modal
import React from 'react';
import { City, PointOfInterest, NPC } from '../types/world';
import styles from './EntityDetailsModal.module.css';

interface EntityDetailsModalProps {
  entity: City | PointOfInterest | NPC | null;
  onClose: () => void;
}

const EntityDetailsModal: React.FC<EntityDetailsModalProps> = ({ entity, onClose }) => {
  if (!entity) return null;

  const isCity = 'governmentType' in entity;
  const isPOI = 'dangerLevel' in entity && !('governmentType' in entity) && !('race' in entity);
  const isNPC = 'race' in entity;

  const renderCityDetails = (city: City) => (
    <>
      <h2 className={styles.title}>🏰 {city.name}</h2>
      <div className={styles.section}>
        <h3>Basic Information</h3>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.label}>Population:</span>
            <span>{city.population.toLocaleString()}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.label}>Government:</span>
            <span>{city.governmentType}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.label}>Location:</span>
            <span>Hex ({city.hex_x}, {city.hex_y})</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.label}>Economic Focus:</span>
            <span>{city.economicFocus}</span>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h3>History</h3>
        <p className={styles.text}>{city.history}</p>
      </div>

      <div className={styles.section}>
        <h3>Criminal Elements</h3>
        <p className={styles.text}>{city.criminalElements}</p>
      </div>

      {city.rulingFactions && city.rulingFactions.length > 0 && (
        <div className={styles.section}>
          <h3>Ruling Factions</h3>
          <ul className={styles.list}>
            {city.rulingFactions.map((faction, idx) => (
              <li key={idx}>{faction.name} ({faction.type})</li>
            ))}
          </ul>
        </div>
      )}

      {city.notableCitizens && city.notableCitizens.length > 0 && (
        <div className={styles.section}>
          <h3>Notable Citizens</h3>
          <ul className={styles.list}>
            {city.notableCitizens.map((npc, idx) => (
              <li key={idx}>{npc.name} - {npc.type}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );

  const renderPOIDetails = (poi: PointOfInterest) => (
    <>
      <h2 className={styles.title}>📍 {poi.name}</h2>
      <div className={styles.section}>
        <h3>Basic Information</h3>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.label}>Type:</span>
            <span>{poi.type.replace('_', ' ').toUpperCase()}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.label}>Danger Level:</span>
            <span>{poi.dangerLevel}/20</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.label}>Location:</span>
            <span>Hex ({poi.hex_x}, {poi.hex_y})</span>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h3>Description</h3>
        <p className={styles.text}>{poi.description}</p>
      </div>

      <div className={styles.section}>
        <h3>Adventure Hooks</h3>
        {poi.adventureHooks.map((hook, idx) => (
          <div key={idx} className={styles.hook}>
            <h4>{hook.title}</h4>
            <p>{hook.description}</p>
            <div className={styles.hookMeta}>
              <span className={styles.badge}>{hook.encounterType}</span>
              <span className={styles.badge}>DC {hook.difficulty}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );

  const renderNPCDetails = (npc: NPC) => (
    <>
      <h2 className={styles.title}>👤 {npc.name}</h2>
      <div className={styles.section}>
        <h3>Basic Information</h3>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.label}>Type:</span>
            <span>{npc.type}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.label}>Race:</span>
            <span>{npc.race}</span>
          </div>
          {npc.class && (
            <div className={styles.infoItem}>
              <span className={styles.label}>Class:</span>
              <span>{npc.class}</span>
            </div>
          )}
          {npc.level && (
            <div className={styles.infoItem}>
              <span className={styles.label}>Level:</span>
              <span>{npc.level}</span>
            </div>
          )}
          <div className={styles.infoItem}>
            <span className={styles.label}>Alignment:</span>
            <span>{npc.alignment}</span>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h3>Description</h3>
        <p className={styles.text}>{npc.description}</p>
      </div>

      <div className={styles.section}>
        <h3>Influence & Role</h3>
        <p className={styles.text}>{npc.influence}</p>
      </div>

      {(npc.str !== undefined || npc.dex !== undefined) && (
        <div className={styles.section}>
          <h3>Ability Scores</h3>
          <div className={styles.abilityScores}>
            {npc.str && <div className={styles.ability}><span className={styles.label}>STR</span> {npc.str}</div>}
            {npc.dex && <div className={styles.ability}><span className={styles.label}>DEX</span> {npc.dex}</div>}
            {npc.con && <div className={styles.ability}><span className={styles.label}>CON</span> {npc.con}</div>}
            {npc.int && <div className={styles.ability}><span className={styles.label}>INT</span> {npc.int}</div>}
            {npc.wis && <div className={styles.ability}><span className={styles.label}>WIS</span> {npc.wis}</div>}
            {npc.cha && <div className={styles.ability}><span className={styles.label}>CHA</span> {npc.cha}</div>}
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>
        <div className={styles.content}>
          {isCity && renderCityDetails(entity as City)}
          {isPOI && renderPOIDetails(entity as PointOfInterest)}
          {isNPC && renderNPCDetails(entity as NPC)}
        </div>
      </div>
    </div>
  );
};

export default EntityDetailsModal;
