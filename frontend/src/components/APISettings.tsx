import React, { useState, useEffect } from 'react';
import styles from './APISettings.module.css';

interface APISettingsProps {
  onSettingsChange: (keys: { claude?: string; chatgpt?: string }) => void;
}

const APISettings: React.FC<APISettingsProps> = ({ onSettingsChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [claudeKey, setClaudeKey] = useState('');
  const [chatgptKey, setChatgptKey] = useState('');
  const [showKeys, setShowKeys] = useState(false);

  useEffect(() => {
    // Load keys from localStorage
    const saved = localStorage.getItem('dnd_api_keys');
    if (saved) {
      const { claude, chatgpt } = JSON.parse(saved);
      if (claude) setClaudeKey(claude);
      if (chatgpt) setChatgptKey(chatgpt);
    }
  }, []);

  const handleSave = () => {
    const keys = {
      claude: claudeKey || undefined,
      chatgpt: chatgptKey || undefined
    };
    localStorage.setItem('dnd_api_keys', JSON.stringify(keys));
    onSettingsChange(keys);
    setIsOpen(false);
  };

  const hasKeys = claudeKey || chatgptKey;

  return (
    <div className={styles.container}>
      <button
        className={styles.settingsBtn}
        onClick={() => setIsOpen(!isOpen)}
        title="API Settings"
      >
        ⚙️ {hasKeys ? '✓' : ''} API Keys
      </button>

      {isOpen && (
        <div className={styles.panel}>
          <h3>🔑 API Configuration</h3>

          <div className={styles.inputGroup}>
            <label>Claude API Key</label>
            <div className={styles.inputWrapper}>
              <input
                type={showKeys ? 'text' : 'password'}
                value={claudeKey}
                onChange={(e) => setClaudeKey(e.target.value)}
                placeholder="sk-ant-..."
              />
              {claudeKey && <span className={styles.checkmark}>✓</span>}
            </div>
            <small>For lore generation and world descriptions</small>
          </div>

          <div className={styles.inputGroup}>
            <label>ChatGPT API Key</label>
            <div className={styles.inputWrapper}>
              <input
                type={showKeys ? 'text' : 'password'}
                value={chatgptKey}
                onChange={(e) => setChatgptKey(e.target.value)}
                placeholder="sk-..."
              />
              {chatgptKey && <span className={styles.checkmark}>✓</span>}
            </div>
            <small>For map visualization and image generation</small>
          </div>

          <div className={styles.actions}>
            <button
              className={styles.toggleBtn}
              onClick={() => setShowKeys(!showKeys)}
            >
              {showKeys ? '🙈 Hide' : '👁️ Show'} Keys
            </button>
            <button className={styles.saveBtn} onClick={handleSave}>
              💾 Save Keys
            </button>
          </div>

          <p className={styles.disclaimer}>
            ⚠️ Keys are stored locally in your browser. Never share them.
          </p>
        </div>
      )}
    </div>
  );
};

export default APISettings;
