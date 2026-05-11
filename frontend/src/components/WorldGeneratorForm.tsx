// World Generation Form Component
import React, { useState } from 'react';
import { WorldParams } from '../types/world';
import styles from './WorldGeneratorForm.module.css';

interface WorldGeneratorFormProps {
  onGenerate: (params: WorldParams) => void;
  isLoading: boolean;
}

const CLIMATE_OPTIONS = [
  'Temperate', 'Tropical', 'Arid', 'Cold', 'Eternal Spring', 'Volatile', 'Cursed', 'Magically Stabilized'
];

const TERRAIN_OPTIONS = [
  'Forest', 'Mountain', 'Plains', 'Desert', 'Swamp', 'Tundra', 'Coastline', 'Hills', 'Valley', 'Badlands', 'Grassland', 'Savanna'
];

const WorldGeneratorForm: React.FC<WorldGeneratorFormProps> = ({ onGenerate, isLoading }) => {
  const [formData, setFormData] = useState<WorldParams>({
    name: `World of ${new Date().getFullYear()}`,
    age: 2500,
    magicLevel: 5,
    civilizationAbundance: 5,
    climate: 'Temperate',
    terrain: 'Forest'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: isNaN(Number(value)) ? value : Number(value)
    }));
  };

  const handleRandomize = (field: string) => {
    if (field === 'age') {
      setFormData(prev => ({ ...prev, age: Math.floor(Math.random() * 4900) + 100 }));
    } else if (field === 'magicLevel') {
      setFormData(prev => ({ ...prev, magicLevel: Math.floor(Math.random() * 10) + 1 }));
    } else if (field === 'civilizationAbundance') {
      setFormData(prev => ({ ...prev, civilizationAbundance: Math.floor(Math.random() * 10) + 1 }));
    } else if (field === 'climate') {
      setFormData(prev => ({ ...prev, climate: CLIMATE_OPTIONS[Math.floor(Math.random() * CLIMATE_OPTIONS.length)] }));
    } else if (field === 'terrain') {
      setFormData(prev => ({ ...prev, terrain: TERRAIN_OPTIONS[Math.floor(Math.random() * TERRAIN_OPTIONS.length)] }));
    }
  };

  const handleRandomizeAll = () => {
    const age = Math.floor(Math.random() * 4900) + 100;
    const magicLevel = Math.floor(Math.random() * 10) + 1;
    const civilizationAbundance = Math.floor(Math.random() * 10) + 1;
    const climate = CLIMATE_OPTIONS[Math.floor(Math.random() * CLIMATE_OPTIONS.length)];
    const terrain = TERRAIN_OPTIONS[Math.floor(Math.random() * TERRAIN_OPTIONS.length)];
    setFormData(prev => ({ ...prev, age, magicLevel, civilizationAbundance, climate, terrain }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(formData);
  };

  const ageLabel = formData.age < 500 ? 'Young' : formData.age < 1500 ? 'Maturing' : formData.age < 3500 ? 'Ancient' : 'Primordial';
  const magicLabel = formData.magicLevel <= 2 ? 'Mundane' : formData.magicLevel <= 4 ? 'Rare' : formData.magicLevel <= 7 ? 'Present' : 'Suffused';
  const civLabel = formData.civilizationAbundance <= 2 ? 'Frontier' : formData.civilizationAbundance <= 5 ? 'Scattered' : formData.civilizationAbundance <= 8 ? 'Settled' : 'Cosmopolitan';

  return (
    <div className={styles.container}>
      <div className={styles.formBox}>
        <h1 className={styles.title}>🌍 D&D World Builder</h1>
        <p className={styles.subtitle}>Create your next epic campaign setting</p>

        <form onSubmit={handleSubmit} className={styles.form}>

          {/* World Name */}
          <div className={styles.formGroup}>
            <label htmlFor="name">World Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter world name..."
              disabled={isLoading}
            />
          </div>

          {/* Age */}
          <div className={styles.formGroup}>
            <div className={styles.labelRow}>
              <label htmlFor="age">World Age</label>
              <span className={styles.valueDisplay}>
                {formData.age.toLocaleString()} yrs — <em>{ageLabel}</em>
              </span>
              <button
                type="button"
                className={styles.randomBtn}
                onClick={() => handleRandomize('age')}
                disabled={isLoading}
                title="Randomize"
              >🎲</button>
            </div>
            <input
              type="range"
              min="100"
              max="5000"
              value={formData.age}
              onChange={handleChange}
              name="age"
              disabled={isLoading}
              className={styles.range}
            />
            <div className={styles.rangeLabels}>
              <span>Young</span>
              <span>Ancient</span>
            </div>
          </div>

          {/* Magic Level */}
          <div className={styles.formGroup}>
            <div className={styles.labelRow}>
              <label htmlFor="magicLevel">Magic Level</label>
              <span className={styles.valueDisplay}>
                {formData.magicLevel}/10 — <em>{magicLabel}</em>
              </span>
              <button
                type="button"
                className={styles.randomBtn}
                onClick={() => handleRandomize('magicLevel')}
                disabled={isLoading}
                title="Randomize"
              >🎲</button>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={formData.magicLevel}
              onChange={handleChange}
              name="magicLevel"
              disabled={isLoading}
              className={styles.range}
            />
            <div className={styles.rangeLabels}>
              <span>None</span>
              <span>Everywhere</span>
            </div>
          </div>

          {/* Civilization Abundance */}
          <div className={styles.formGroup}>
            <div className={styles.labelRow}>
              <label htmlFor="civilizationAbundance">Civilization</label>
              <span className={styles.valueDisplay}>
                {formData.civilizationAbundance}/10 — <em>{civLabel}</em>
              </span>
              <button
                type="button"
                className={styles.randomBtn}
                onClick={() => handleRandomize('civilizationAbundance')}
                disabled={isLoading}
                title="Randomize"
              >🎲</button>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={formData.civilizationAbundance}
              onChange={handleChange}
              name="civilizationAbundance"
              disabled={isLoading}
              className={styles.range}
            />
            <div className={styles.rangeLabels}>
              <span>Isolated</span>
              <span>Cosmopolitan</span>
            </div>
          </div>

          {/* Climate + Terrain side by side */}
          <div className={styles.twoCol}>
            <div className={styles.formGroup}>
              <div className={styles.labelRow}>
                <label htmlFor="climate">Climate</label>
                <button
                  type="button"
                  className={styles.randomBtn}
                  onClick={() => handleRandomize('climate')}
                  disabled={isLoading}
                  title="Randomize"
                >🎲</button>
              </div>
              <select
                id="climate"
                name="climate"
                value={formData.climate}
                onChange={handleChange}
                disabled={isLoading}
              >
                {CLIMATE_OPTIONS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <div className={styles.labelRow}>
                <label htmlFor="terrain">Terrain</label>
                <button
                  type="button"
                  className={styles.randomBtn}
                  onClick={() => handleRandomize('terrain')}
                  disabled={isLoading}
                  title="Randomize"
                >🎲</button>
              </div>
              <select
                id="terrain"
                name="terrain"
                value={formData.terrain}
                onChange={handleChange}
                disabled={isLoading}
              >
                {TERRAIN_OPTIONS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Buttons */}
          <div className={styles.buttonGroup}>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={handleRandomizeAll}
              disabled={isLoading}
            >
              🎲 Randomize All
            </button>
            <button
              type="submit"
              className={styles.primaryBtn}
              disabled={isLoading}
            >
              {isLoading ? '⚙️ Generating...' : '✨ Generate World'}
            </button>
          </div>
        </form>

        <div className={styles.footer}>
          <p>Generates a unique world with cities, dungeons, wonders, and points of interest.</p>
        </div>
      </div>
    </div>
  );
};

export default WorldGeneratorForm;
