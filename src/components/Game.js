import React, { useState, useEffect } from 'react';
import { createGame, nextTurn, takeGems, buyCard, getBonuses, reserveCard, buyReservedCard, canTakeGems } from '../services/gameLogic';
import { makeAIMove } from '../services/aiLogic';
import Board from './Board';
import Cards from './Cards';

function Game({ numPlayers, numCPU, onBackToMenu }) {
  const [game, setGame] = useState(createGame(numPlayers));
  const [selectedGems, setSelectedGems] = useState({});
  const [isAIThinking, setIsAIThinking] = useState(false);
  
  const currentPlayer = game.players[game.currentPlayerIndex];
  const isAIPlayer = currentPlayer.id >= numPlayers - numCPU;

  useEffect(() => {
    if (isAIPlayer && !game.gameOver) {
      setIsAIThinking(true);
      const timer = setTimeout(() => {
        const updatedGame = makeAIMove(game);
        setGame(updatedGame);
        setIsAIThinking(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [game, isAIPlayer]);

  const handleSelectGem = (gem) => {
    if (isAIPlayer) return;
    
    const totalSelected = Object.values(selectedGems).reduce((a, b) => a + b, 0);
    
    // If already selected 2 gems, can't select a third
    if (totalSelected >= 2 && !selectedGems[gem]) {
      return;
    }
    
    // If trying to add to an existing gem selection with 2 already selected
    if (selectedGems[gem] && totalSelected >= 3) {
      return;
    }

    setSelectedGems(prev => ({
      ...prev,
      [gem]: (prev[gem] || 0) + 1
    }));
  };

  const handleConfirmGems = () => {
    const totalSelected = Object.values(selectedGems).reduce((a, b) => a + b, 0);
    
    if (totalSelected === 0) {
      return;
    }

    if (!canTakeGems(game, selectedGems)) {
      alert('Invalid gem selection! Rules: Max 3 gems, only 2 of same color if 4+ available');
      return;
    }

    let updatedGame = takeGems(game, selectedGems);
    updatedGame = nextTurn(updatedGame);
    setGame(updatedGame);
    setSelectedGems({});
  };

  const handleTakeGold = () => {
    if (game.availableGems.gold <= 0) {
      alert('No gold tokens available!');
      return;
    }
    
    let updatedGame = takeGems(game, { gold: 1 });
    updatedGame = nextTurn(updatedGame);
    setGame(updatedGame);
    setSelectedGems({});
  };

  const handleBuyCard = (cardId, level) => {
    let updatedGame = buyCard(game, cardId, level);
    updatedGame = nextTurn(updatedGame);
    setGame(updatedGame);
    setSelectedGems({});
  };

  const handleReserveCard = (cardId, level) => {
    if (currentPlayer.reservedCards.length >= 3) {
      alert('You can only reserve 3 cards!');
      return;
    }
    
    let updatedGame = reserveCard(game, cardId, level);
    updatedGame = nextTurn(updatedGame);
    setGame(updatedGame);
    setSelectedGems({});
  };

  const handleBuyReservedCard = (reservedCardIndex) => {
    let updatedGame = buyReservedCard(game, reservedCardIndex);
    updatedGame = nextTurn(updatedGame);
    setGame(updatedGame);
    setSelectedGems({});
  };

  const handleClearSelection = () => {
    setSelectedGems({});
  };

  if (game.gameOver) {
    return (
      <div className="game-over">
        <h1>Game Over!</h1>
        <h2>{game.winner} wins!</h2>
        <button onClick={onBackToMenu}>Back to Menu</button>
      </div>
    );
  }

  return (
    <div className="game">
      <button className="back-btn" onClick={onBackToMenu}>← Back to Menu</button>
      <div className="current-turn">
        <h2>Current Turn: {currentPlayer.name}</h2>
        <p>Score: {currentPlayer.score}/15</p>
        {isAIThinking && <p className="thinking">🤔 CPU is thinking...</p>}
      </div>
      <Board game={game} />
      <Cards 
        game={game} 
        onBuyCard={handleBuyCard}
        onReserveCard={handleReserveCard}
        onBuyReservedCard={handleBuyReservedCard}
        currentPlayer={currentPlayer}
        disabled={isAIPlayer || isAIThinking}
      />
      
      {!isAIPlayer && !isAIThinking && (
        <div className="actions">
          <h3>Select Gems (Max 3)</h3>
          <div className="gem-selection">
            {['diamond', 'emerald', 'ruby', 'sapphire', 'onyx'].map(gem => (
              <button
                key={gem}
                className={`gem-btn ${gem}`}
                onClick={() => handleSelectGem(gem)}
              >
                {gem}
              </button>
            ))}
          </div>

          <div className="selected-gems">
            <h4>Selected:</h4>
            {Object.entries(selectedGems).map(([gem, count]) => (
              <span key={gem}>{gem}: {count} </span>
            ))}
          </div>

          <div className="turn-actions">
            <button className="confirm-btn" onClick={handleConfirmGems}>
              Take Selected Gems
            </button>
            <button className="gold-btn" onClick={handleTakeGold}>
              Take Gold Token
            </button>
            <button className="clear-btn" onClick={handleClearSelection}>
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Game;