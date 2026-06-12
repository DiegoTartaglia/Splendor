import React, { useState, useEffect, useRef } from 'react';
import {
  createGame,
  nextTurn,
  takeGems,
  buyCard,
  reserveCard,
  buyReservedCard,
  canTakeGems,
  totalTokens
} from '../services/gameLogic';
import { makeAIMove } from '../services/aiLogic';
import { GEMS, MAX_TOKENS_PER_PLAYER, VICTORY_POINTS_TO_WIN } from '../types/game';
import Board from './Board';
import Cards from './Cards';
import GemToken from './GemToken';

function Game({ numPlayers, numCPU, onBackToMenu }) {
  const [game, setGame] = useState(() => createGame(numPlayers));
  const [selectedGems, setSelectedGems] = useState({});
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [message, setMessage] = useState(null);
  const messageTimer = useRef(null);

  const currentPlayer = game.players[game.currentPlayerIndex];
  const isAIPlayer = currentPlayer.id >= numPlayers - numCPU;

  const showMessage = (text) => {
    setMessage(text);
    clearTimeout(messageTimer.current);
    messageTimer.current = setTimeout(() => setMessage(null), 2500);
  };

  useEffect(() => () => clearTimeout(messageTimer.current), []);

  useEffect(() => {
    if (isAIPlayer && !game.gameOver) {
      setIsAIThinking(true);
      const timer = setTimeout(() => {
        setGame(makeAIMove(game));
        setIsAIThinking(false);
      }, 1100);
      return () => clearTimeout(timer);
    }
  }, [game, isAIPlayer]);

  const handleSelectGem = (gem) => {
    if (isAIPlayer || game.gameOver) return;

    const next = { ...selectedGems, [gem]: (selectedGems[gem] || 0) + 1 };
    const entries = Object.entries(next).filter(([, c]) => c > 0);
    const total = entries.reduce((sum, [, c]) => sum + c, 0);

    if (total > 3) return showMessage('You can take at most 3 gems per turn');
    if (next[gem] > 2) return showMessage('At most 2 gems of the same color');
    if (next[gem] === 2 && entries.length > 1) {
      return showMessage('Two gems of one color must be your only pick');
    }
    if (next[gem] === 2 && game.availableGems[gem] < 4) {
      return showMessage('Two of a color only when 4+ are available');
    }
    if (game.availableGems[gem] < next[gem]) {
      return showMessage('Not enough gems in the bank');
    }
    if (totalTokens(currentPlayer) + total > MAX_TOKENS_PER_PLAYER) {
      return showMessage(`Token limit: max ${MAX_TOKENS_PER_PLAYER} per player`);
    }

    setSelectedGems(next);
  };

  const handleConfirmGems = () => {
    const total = Object.values(selectedGems).reduce((a, b) => a + b, 0);
    if (total === 0) return showMessage('Select some gems first');

    if (!canTakeGems(game, selectedGems)) {
      return showMessage('Invalid gem selection');
    }

    setGame(nextTurn(takeGems(game, selectedGems)));
    setSelectedGems({});
  };

  const handleBuyCard = (cardId, level) => {
    setGame(nextTurn(buyCard(game, cardId, level)));
    setSelectedGems({});
  };

  const handleReserveCard = (cardId, level) => {
    if (currentPlayer.reservedCards.length >= 3) {
      return showMessage('You can reserve at most 3 cards');
    }
    setGame(nextTurn(reserveCard(game, cardId, level)));
    setSelectedGems({});
  };

  const handleBuyReservedCard = (reservedCardIndex) => {
    setGame(nextTurn(buyReservedCard(game, reservedCardIndex)));
    setSelectedGems({});
  };

  const totalSelected = Object.values(selectedGems).reduce((a, b) => a + b, 0);

  if (game.gameOver) {
    const ranking = [...game.players].sort((a, b) => b.score - a.score);
    return (
      <div className="game-over">
        <div className="game-over-panel">
          <h1>🏆 {game.winner} wins!</h1>
          <ul className="final-ranking">
            {ranking.map(player => (
              <li key={player.id}>
                <span>{player.name}</span>
                <span>{player.score} pts · {player.cards.length} cards</span>
              </li>
            ))}
          </ul>
          <button className="btn btn-primary" onClick={onBackToMenu}>Back to Menu</button>
        </div>
      </div>
    );
  }

  return (
    <div className="game">
      <header className="game-header">
        <button className="btn btn-ghost" onClick={onBackToMenu}>← Menu</button>
        <div className="turn-indicator">
          <span className={`turn-dot ${isAIPlayer ? 'turn-ai' : 'turn-human'}`} />
          <strong>{currentPlayer.name}</strong>
          <span className="turn-score">{currentPlayer.score}/{VICTORY_POINTS_TO_WIN} pts</span>
        </div>
        <div className="thinking-slot">
          {isAIThinking && <span className="thinking">🤖 thinking…</span>}
        </div>
      </header>

      {message && <div className="toast">{message}</div>}

      <div className="game-layout">
        <Board game={game} numCPU={numCPU} />

        <main className="table-panel">
          <Cards
            game={game}
            onBuyCard={handleBuyCard}
            onReserveCard={handleReserveCard}
            onBuyReservedCard={handleBuyReservedCard}
            currentPlayer={currentPlayer}
            disabled={isAIPlayer || isAIThinking}
          />

          <div className={`bank ${isAIPlayer || isAIThinking ? 'cards-disabled' : ''}`}>
            <div className="bank-tokens">
              {GEMS.map(gem => (
                <GemToken
                  key={gem}
                  gem={gem}
                  count={game.availableGems[gem]}
                  size="lg"
                  selected={!!selectedGems[gem]}
                  disabled={isAIPlayer || isAIThinking}
                  onClick={() => handleSelectGem(gem)}
                />
              ))}
              <GemToken gem="gold" count={game.availableGems.gold} size="lg" />
            </div>

            <div className="bank-actions">
              <div className="selection-preview">
                {totalSelected === 0 ? (
                  <span className="player-muted">Tap gems to select (max 3)</span>
                ) : (
                  Object.entries(selectedGems).map(([gem, count]) =>
                    count > 0 ? <GemToken key={gem} gem={gem} count={count} size="sm" /> : null
                  )
                )}
              </div>
              <button
                className="btn btn-primary"
                onClick={handleConfirmGems}
                disabled={isAIPlayer || isAIThinking || totalSelected === 0}
              >
                Take gems
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => setSelectedGems({})}
                disabled={totalSelected === 0}
              >
                Clear
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Game;
