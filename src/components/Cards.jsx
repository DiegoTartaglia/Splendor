import React from 'react';
import { canAffordCard, getBonuses } from '../services/gameLogic';
import { GEMS } from '../types/game';

function CostList({ cost, bonuses = {} }) {
  return (
    <div className="card-cost">
      {GEMS.map(gem => {
        const value = cost[gem] || 0;
        if (value <= 0) return null;
        const covered = (bonuses[gem] || 0) >= value;
        return (
          <span key={gem} className={`cost-gem gem-${gem} ${covered ? 'cost-covered' : ''}`} title={gem}>
            {value}
          </span>
        );
      })}
    </div>
  );
}

function Card({ card, canAfford, disabled, onBuy, onReserve, canReserve, bonuses }) {
  return (
    <div className={`card gem-${card.bonus} ${canAfford ? 'card-affordable' : ''}`}>
      <div className="card-top">
        <span className="card-points">{card.points > 0 ? card.points : ''}</span>
        <span className={`card-bonus gem-${card.bonus}`} title={`Bonus: ${card.bonus}`} />
      </div>
      <CostList cost={card.cost} bonuses={bonuses} />
      <div className="card-actions">
        <button
          className="btn btn-buy"
          onClick={onBuy}
          disabled={!canAfford || disabled}
        >
          Buy
        </button>
        {onReserve && (
          <button
            className="btn btn-reserve"
            onClick={onReserve}
            disabled={!canReserve || disabled}
          >
            Reserve
          </button>
        )}
      </div>
    </div>
  );
}

function Cards({ game, onBuyCard, onReserveCard, onBuyReservedCard, currentPlayer, disabled }) {
  const bonuses = getBonuses(currentPlayer.cards);
  const canReserve = currentPlayer.reservedCards.length < 3;

  return (
    <div className={`cards-section ${disabled ? 'cards-disabled' : ''}`}>
      <div className="nobles-row">
        {game.nobles.map(noble => {
          const canGetNoble = Object.entries(noble.requirement).every(
            ([gem, req]) => (bonuses[gem] || 0) >= req
          );
          return (
            <div key={noble.id} className={`noble ${canGetNoble ? 'noble-reachable' : ''}`}>
              <span className="noble-crown">👑</span>
              <span className="noble-points">{noble.points}</span>
              <div className="noble-requirement">
                {GEMS.map(gem =>
                  noble.requirement[gem] > 0 ? (
                    <span
                      key={gem}
                      className={`req-gem gem-${gem} ${(bonuses[gem] || 0) >= noble.requirement[gem] ? 'req-met' : ''}`}
                    >
                      {noble.requirement[gem]}
                    </span>
                  ) : null
                )}
              </div>
            </div>
          );
        })}
      </div>

      {['level3', 'level2', 'level1'].map(level => (
        <div key={level} className="card-level">
          <div className={`deck deck-${level}`}>
            <span className="deck-level">{'●'.repeat(Number(level.replace('level', '')))}</span>
            <span className="deck-count">{game.decks[level].length}</span>
          </div>
          <div className="cards-row">
            {game.availableCards[level].map(card => (
              <Card
                key={card.id}
                card={card}
                bonuses={bonuses}
                canAfford={canAffordCard(currentPlayer.gems, card.cost, bonuses)}
                canReserve={canReserve}
                disabled={disabled}
                onBuy={() => onBuyCard(card.id, level)}
                onReserve={() => onReserveCard(card.id, level)}
              />
            ))}
          </div>
        </div>
      ))}

      {currentPlayer.reservedCards.length > 0 && (
        <div className="reserved-section">
          <h3>Your reserved cards</h3>
          <div className="cards-row">
            {currentPlayer.reservedCards.map((card, idx) => (
              <Card
                key={`${card.id}-${idx}`}
                card={card}
                bonuses={bonuses}
                canAfford={canAffordCard(currentPlayer.gems, card.cost, bonuses)}
                disabled={disabled}
                onBuy={() => onBuyReservedCard(idx)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Cards;
