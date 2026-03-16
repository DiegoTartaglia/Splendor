import React from 'react';

function Player({ player }) {
  return (
    <div className="player">
      <h3>{player.name}</h3>
      <p className="player-score">Score: <span>{player.score}</span>/15</p>
      <div className="gems">
        {Object.entries(player.gems).map(([gem, count]) => (
          <div key={gem} className={`gem ${gem}`} title={gem}>
            {gem}: {count}
          </div>
        ))}
      </div>
      {player.cards.length > 0 && (
        <div className="player-cards">
          <p>Cards: {player.cards.length}</p>
        </div>
      )}
      {player.reservedCards.length > 0 && (
        <div className="player-reserved">
          <p>Reserved: {player.reservedCards.length}/3</p>
          <div className="reserved-cards-preview">
            {player.reservedCards.map((card, idx) => (
              <div key={idx} className={`reserved-card-mini bonus-${card.bonus}`}>
                {card.points}pts
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Player;