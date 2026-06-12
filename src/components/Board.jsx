import React from 'react';
import Player from './Player';

function Board({ game, numCPU }) {
  const firstAIIndex = game.numPlayers - numCPU;

  return (
    <aside className="players-panel">
      {game.players.map((player, index) => (
        <Player
          key={player.id}
          player={player}
          isActive={index === game.currentPlayerIndex}
          isAI={index >= firstAIIndex}
        />
      ))}
    </aside>
  );
}

export default Board;
