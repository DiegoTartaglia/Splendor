import { takeGems, buyCard, reserveCard, nextTurn, getBonuses, canAffordCard } from './gameLogic';

export const makeAIMove = (game) => {
  const aiPlayer = game.players[game.currentPlayerIndex];
  
  // Strategy 1: Try to buy affordable cards
  const affordableCards = findAffordableCards(game, aiPlayer);
  if (affordableCards.length > 0) {
    const card = affordableCards[0];
    let updatedGame = buyCard(game, card.id, card.level);
    return nextTurn(updatedGame);
  }

  // Strategy 2: Try to reserve high-value cards
  const highValueCards = findHighValueCards(game);
  if (highValueCards.length > 0 && aiPlayer.reservedCards.length < 3) {
    const card = highValueCards[0];
    let updatedGame = reserveCard(game, card.id, card.level);
    return nextTurn(updatedGame);
  }

  // Strategy 3: Take gems strategically
  const gemsToTake = chooseGems(game, aiPlayer);
  let updatedGame = takeGems(game, gemsToTake);
  return nextTurn(updatedGame);
};

const findAffordableCards = (game, player) => {
  const bonuses = getBonuses(player.cards);
  const affordable = [];

  ['level3', 'level2', 'level1'].forEach(level => {
    game.availableCards[level].forEach(card => {
      if (canAffordCard(player.gems, card.cost, bonuses)) {
        affordable.push({ ...card, level });
      }
    });
  });

  // Sort by points (descending)
  return affordable.sort((a, b) => b.points - a.points);
};

const findHighValueCards = (game) => {
  const highValue = [];

  ['level3', 'level2'].forEach(level => {
    game.availableCards[level].forEach(card => {
      if (card.points >= 2) {
        highValue.push({ ...card, level });
      }
    });
  });

  return highValue.sort((a, b) => b.points - a.points);
};

const chooseGems = (game, player) => {
  const gems = ['diamond', 'emerald', 'ruby', 'sapphire', 'onyx'];
  const needed = {};
  let totalNeeded = 0;

  // Check what gems are needed for affordable cards
  ['level3', 'level2', 'level1'].forEach(level => {
    game.availableCards[level].forEach(card => {
      Object.keys(card.cost).forEach(gem => {
        if (card.cost[gem] > 0) {
          needed[gem] = (needed[gem] || 0) + card.cost[gem];
        }
      });
    });
  });

  // Prioritize gems that are most needed
  const sortedGems = gems
    .filter(gem => game.availableGems[gem] > 0 && !player.gems[gem] || player.gems[gem] < 10)
    .sort((a, b) => (needed[b] || 0) - (needed[a] || 0));

  const gemSelection = {};
  for (let i = 0; i < Math.min(3, sortedGems.length); i++) {
    const gem = sortedGems[i];
    if (game.availableGems[gem] > 0) {
      gemSelection[gem] = 1;
      totalNeeded++;
    }
  }

  return gemSelection;
};