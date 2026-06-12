import React, { useState } from 'react';
import { GEMS } from '../types/game';

function Menu({ onStartGame }) {
  const [numPlayers, setNumPlayers] = useState(2);
  const [numCPU, setNumCPU] = useState(1);

  const handleStart = () => {
    if (numPlayers >= 2 && numPlayers <= 4) {
      onStartGame(numPlayers, numCPU);
    }
  };

  return (
    <div className="menu">
      <div className="menu-panel">
        <div className="menu-gems">
          {GEMS.map(gem => <span key={gem} className={`menu-gem gem-${gem}`} />)}
        </div>
        <h1 className="menu-title">Splendor</h1>
        <p className="menu-subtitle">Collect gems, build your engine, reach 15 points</p>

        <div className="menu-section">
          <p>Players</p>
          <div className="selector">
            {[2, 3, 4].map(num => (
              <button
                key={num}
                className={`btn ${numPlayers === num ? 'btn-selected' : ''}`}
                onClick={() => {
                  setNumPlayers(num);
                  if (numCPU >= num) setNumCPU(num - 1);
                }}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        <div className="menu-section">
          <p>CPU opponents</p>
          <div className="selector">
            {Array.from({ length: numPlayers }, (_, i) => i).map(num => (
              <button
                key={num}
                className={`btn ${numCPU === num ? 'btn-selected' : ''}`}
                onClick={() => setNumCPU(num)}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        <p className="menu-summary">
          🧑 {numPlayers - numCPU} human · 🤖 {numCPU} CPU
        </p>

        <button className="btn btn-primary btn-start" onClick={handleStart}>
          Start Game
        </button>
      </div>
    </div>
  );
}

export default Menu;
