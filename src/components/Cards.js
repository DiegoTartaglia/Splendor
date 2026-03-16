import React from 'react';
import { canAffordCard, getBonuses } from '../services/gameLogic';

const gemIcons = {
  diamond: '💎',
  emerald: '🔋',
  ruby: '🔴',
  sapphire: '🔵',
  onyx: '⬛',
  gold: '⭐'
};

function Cards({ game, onBuyCard, onReserveCard, onBuyReservedCard, currentPlayer, disabled }) {
  const bonuses = getBonuses(currentPlayer.cards);

  const CardDisplay = ({ card, level }) => {
    const canAfford = canAffordCard(currentPlayer.gems, card.cost, bonuses);
    const canReserve = currentPlayer.reservedCards.length < 3;
    
    return (
      <div 
        className={`card ${canAfford ? 'affordable' : 'unaffordable'}`}
        data-bonus={card.bonus}
      >
        <div className="card-points">{card.points}pts</div>
        <div className={`card-bonus bonus-${card.bonus}`}>
          {card.bonus}
        </div>
        <div className="card-cost">
          {Object.entries(card.cost).map(([gem, cost]) => 
            cost > 0 ? (
              <div key={gem} className={`cost-gem ${gem}`} title={gem}>
                {cost}
              </div>
            ) : null
          )}
        </div>
        <div className="card-buttons">
          <button 
            onClick={() => onBuyCard(card.id, level)}
            disabled={!canAfford || disabled}
            className="buy-btn"
            title="Buy this card"
          >
            Buy
          </button>
          <button 
            onClick={() => onReserveCard(card.id, level)}
            disabled={!canReserve || disabled}
            className="reserve-btn"
            title="Reserve and take gold"
          >
            Reserve
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={`cards-section ${disabled ? 'disabled' : ''}`}>
      <h3>Available Cards</h3>
      {['level1', 'level2', 'level3'].map(level => (
        <div key={level} className="card-level">
          <h4>Level {level.replace('level', '')}</h4>
          <div className="cards-grid">
            {game.availableCards[level].map(card => (
              <CardDisplay key={card.id} card={card} level={level} />
            ))}
          </div>
        </div>
      ))}

      {currentPlayer.reservedCards.length > 0 && (
        <div className="reserved-cards-section">
          <h3>Your Reserved Cards ({currentPlayer.reservedCards.length}/3)</h3>
          <div className="reserved-cards-grid">
            {currentPlayer.reservedCards.map((card, idx) => {
              const canAfford = canAffordCard(currentPlayer.gems, card.cost, bonuses);
              return (
                <div 
                  key={idx} 
                  className={`card reserved ${canAfford ? 'affordable' : 'unaffordable'}`}
                  data-bonus={card.bonus}
                >
                  <div className="card-points">{card.points}pts</div>
                  <div className={`card-bonus bonus-${card.bonus}`}>
                    {card.bonus}
                  </div>
                  <div className="card-cost">
                    {Object.entries(card.cost).map(([gem, cost]) => 
                      cost > 0 ? (
                        <div key={gem} className={`cost-gem ${gem}`} title={gem}>
                          {cost}
                        </div>
                      ) : null
                    )}
                  </div>
                  <button 
                    onClick={() => onBuyReservedCard(idx)}
                    disabled={!canAfford || disabled}
                    className="buy-btn"
                    title="Buy this reserved card"
                  >
                    Buy
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="nobles-section">
        <h3>Available Nobles</h3>
        <div className="nobles-grid">
          {game.nobles.map((noble) => {
            const playerBonuses = getBonuses(currentPlayer.cards);
            const canGetNoble = Object.entries(noble.requirement).every(
              ([gem, req]) => (playerBonuses[gem] || 0) >= req
            );
            
            return (
              <div 
                key={noble.id} 
                className={`noble ${canGetNoble ? 'can-get' : ''}`}
              >
                <div className="noble-points">{noble.points}pts</div>
                <div className="noble-requirement">
                  {Object.entries(noble.requirement).map(([gem, req]) =>
                    req > 0 ? (
                      <div 
                        key={gem} 
                        className={`req-gem ${gem} ${(playerBonuses[gem] || 0) >= req ? 'met' : ''}`} 
                        title={gem}
                      >
                        {req}
                      </div>
                    ) : null
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Cards;