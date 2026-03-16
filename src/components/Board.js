import React from 'react';
import Player from './Player';

function Board({ game }) {
  return (
    <div className="board">
      <div className="players-section">
        <h2>Players</h2>
        {game.players.map((player) => (
          <Player key={player.id} player={player} />
        ))}
      </div>

      <div className="gem-pool">
        <h3>Gem Pool</h3>
        <div className="gems">
          {Object.entries(game.availableGems).map(([gem, count]) => (
            <div key={gem} className={`gem ${gem}`}>
              {gem}: {count}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Board;