import React, { useState } from 'react';
import '../styles/TripPanel.css';

export default function TripPanel({ onStartTrip, onClose }) {
  const [boatName, setBoatName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (boatName.trim()) {
      onStartTrip(boatName);
      setBoatName('');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="trip-panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <h2>Start New Trip</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="trip-form">
          <div className="form-group">
            <label htmlFor="boatName">Boat Name</label>
            <input
              id="boatName"
              type="text"
              placeholder="Enter your boat name"
              value={boatName}
              onChange={(e) => setBoatName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-info">
            <p>🗺️ Location: Severn River, Maryland</p>
            <p>⏰ This trip will be tracked and logged</p>
          </div>

          <button type="submit" className="btn btn-primary" disabled={!boatName.trim()}>
            Start Tracking
          </button>
        </form>
      </div>
    </div>
  );
}
