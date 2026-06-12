import React from 'react';
import GemToken from './GemToken';
import { getBonuses, totalTokens } from '../services/gameLogic';
import { GEMS, VICTORY_POINTS_TO_WIN, MAX_TOKENS_PER_PLAYER } from '../types/game';

function Player({ player, isActive, isAI }) {
  const bonuses = getBonuses(player.cards);
  const tokens = totalTokens(player);

  return (
    <div className={`player ${isActive ? 'player-active' : ''}`}>
      <div className="player-header">
        <span className="player-name">
          {isAI ? '🤖 ' : ''}{player.name}
        </span>
        <span className="player-score">{player.score}<small>/{VICTORY_POINTS_TO_WIN}</small></span>
      </div>

      <div className="score-track">
        <div
          className="score-track-fill"
          style={{ width: `${Math.min(100, (player.score / VICTORY_POINTS_TO_WIN) * 100)}%` }}
        />
      </div>

      <div className="player-row">
        <span className="player-row-label">Tokens {tokens}/{MAX_TOKENS_PER_PLAYER}</span>
        <div className="player-tokens">
          {[...GEMS, 'gold'].map(gem =>
            player.gems[gem] > 0 ? (
              <GemToken key={gem} gem={gem} count={player.gems[gem]} size="sm" />
            ) : null
          )}
        </div>
      </div>

      <div className="player-row">
        <span className="player-row-label">Bonuses</span>
        <div className="player-bonuses">
          {GEMS.map(gem =>
            bonuses[gem] > 0 ? (
              <span key={gem} className={`bonus-chip gem-${gem}`}>{bonuses[gem]}</span>
            ) : null
          )}
          {player.cards.length === 0 && <span className="player-muted">—</span>}
        </div>
      </div>

      <div className="player-row">
        <span className="player-row-label">Reserved {player.reservedCards.length}/3</span>
        <div className="reserved-minis">
          {player.reservedCards.map((card, idx) => (
            <span key={idx} className={`reserved-mini gem-${card.bonus}`}>{card.points}</span>
          ))}
        </div>
        {player.nobles.length > 0 && (
          <span className="player-nobles" title="Nobles">👑 ×{player.nobles.length}</span>
        )}
      </div>
    </div>
  );
}

export default Player;
