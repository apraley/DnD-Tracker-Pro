import { useState } from 'react';
import { City } from '../types/world';
import './CityDetailModal.css';

interface CityDetailModalProps {
  city: City;
  isOpen: boolean;
  onClose: () => void;
  onGenerateLore?: (cityId: string) => void;
}

export default function CityDetailModal({
  city,
  isOpen,
  onClose,
  onGenerateLore
}: CityDetailModalProps) {
  const [isGeneratingLore, setIsGeneratingLore] = useState(false);

  if (!isOpen) return null;

  const handleGenerateLore = async () => {
    if (onGenerateLore) {
      setIsGeneratingLore(true);
      await onGenerateLore(city.id);
      setIsGeneratingLore(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="city-modal-backdrop" onClick={onClose}></div>

      {/* Modal */}
      <div className="city-detail-modal">
        {/* Header */}
        <div className="city-modal-header">
          <div className="city-modal-title">
            <h1>🏰 {city.name}</h1>
            <span className="city-type-badge">{city.governmentType}</span>
          </div>
          <button className="city-modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Content */}
        <div className="city-modal-content">
          {/* Stats Grid */}
          <div className="city-stats-grid">
            <div className="stat-item">
              <label>Population</label>
              <value>{city.population?.toLocaleString() || 'Unknown'}</value>
            </div>
            <div className="stat-item">
              <label>Government</label>
              <value>{city.governmentType}</value>
            </div>
            <div className="stat-item">
              <label>Economic Focus</label>
              <value>{city.economicFocus}</value>
            </div>
            <div className="stat-item">
              <label>Location</label>
              <value>({city.hex_x}, {city.hex_y})</value>
            </div>
          </div>

          {/* History Section */}
          <div className="city-section">
            <h3>📖 History</h3>
            <p>{city.history || 'No history recorded yet.'}</p>
          </div>

          {/* Lore Section */}
          {city.generatedLore && (
            <div className="city-section lore-section">
              <h3>✨ Detailed Lore</h3>
              <div className="lore-content">
                {city.generatedLore}
              </div>
            </div>
          )}

          {/* Factions Section */}
          {city.rulingFactions && city.rulingFactions.length > 0 && (
            <div className="city-section">
              <h3>⚔️ Ruling Factions</h3>
              <ul>
                {city.rulingFactions.map((faction, idx) => (
                  <li key={idx}>{faction}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Criminal Elements Section */}
          {city.criminalElements && (
            <div className="city-section">
              <h3>🗡️ Criminal Elements</h3>
              <p>{city.criminalElements}</p>
            </div>
          )}

          {/* Notable Citizens Section */}
          {city.notableCitizens && city.notableCitizens.length > 0 && (
            <div className="city-section">
              <h3>👥 Notable Citizens</h3>
              <ul>
                {city.notableCitizens.map((citizen, idx) => (
                  <li key={idx}>{citizen}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="city-modal-footer">
          {!city.generatedLore && (
            <button
              className="btn btn-primary"
              onClick={handleGenerateLore}
              disabled={isGeneratingLore}
            >
              {isGeneratingLore ? '✨ Generating Lore...' : '✨ Generate Detailed Lore'}
            </button>
          )}
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </>
  );
}
