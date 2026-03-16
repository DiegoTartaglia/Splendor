import React, { useState } from 'react';

function Menu({ onStartGame }) {
  const [numPlayers, setNumPlayers] = useState(2);
  const [numCPU, setNumCPU] = useState(1);

  const handleStart = () => {
    if (numPlayers >= 2 && numPlayers <= 4) {
      onStartGame(numPlayers, numCPU);
    }
  };

  const totalPlayers = numPlayers;
  const humanPlayers = totalPlayers - numCPU;

  return (
    <div className="menu">
      <h1>Splendor Game</h1>
      
      <div className="menu-section">
        <p>Select total number of players:</p>
        <div className="player-selector">
          {[2, 3, 4].map(num => (
            <button
              key={num}
              className={numPlayers === num ? 'selected' : ''}
              onClick={() => {
                setNumPlayers(num);
                // Adjust CPU count if needed
                if (numCPU >= num) {
                  setNumCPU(num - 1);
                }
              }}
            >
              {num} Players
            </button>
          ))}
        </div>
      </div>

      <div className="menu-section">
        <p>Select number of CPU opponents:</p>
        <div className="cpu-selector">
          {Array.from({ length: numPlayers }, (_, i) => i).map(num => (
            <button
              key={num}
              className={numCPU === num ? 'selected' : ''}
              onClick={() => setNumCPU(num)}
            >
              {num} CPU
            </button>
          ))}
        </div>
      </div>

      <div className="players-info">
        <p>
          <span className="human-players">Human: {humanPlayers}</span>
          <span className="cpu-players">CPU: {numCPU}</span>
        </p>
      </div>

      <button className="start-btn" onClick={handleStart}>Start Game</button>
    </div>
  );
}

export default Menu;