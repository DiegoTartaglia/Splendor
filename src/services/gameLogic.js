import {
  GEMS,
  VICTORY_POINTS_TO_WIN,
  MAX_TOKENS_PER_PLAYER,
  MAX_RESERVED_CARDS
} from '../types/game';

// Gem distribution based on number of players
const getInitialGems = (numPlayers) => {
  const gemCounts = {
    2: { diamond: 4, emerald: 4, ruby: 4, sapphire: 4, onyx: 4, gold: 5 },
    3: { diamond: 5, emerald: 5, ruby: 5, sapphire: 5, onyx: 5, gold: 5 },
    4: { diamond: 7, emerald: 7, ruby: 7, sapphire: 7, onyx: 7, gold: 5 }
  };
  return gemCounts[numPlayers] || gemCounts[2];
};

const randInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

const shuffle = (arr) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// Cards get a cost budget proportional to their level and points, like the
// real game: cheap engine cards at level 1, expensive point cards at level 3.
const LEVEL_CONFIG = {
  1: { count: 32, budget: [3, 5], colors: [1, 3], points: () => (Math.random() < 0.2 ? 1 : 0) },
  2: { count: 24, budget: [5, 8], colors: [1, 3], points: () => randInt(1, 3) },
  3: { count: 18, budget: [8, 12], colors: [2, 4], points: () => randInt(3, 5) }
};

const generateCost = (level) => {
  const config = LEVEL_CONFIG[level];
  let budget = randInt(config.budget[0], config.budget[1]);
  const numColors = randInt(config.colors[0], config.colors[1]);
  const colors = shuffle([...GEMS]).slice(0, numColors);

  const cost = { diamond: 0, emerald: 0, ruby: 0, sapphire: 0, onyx: 0 };
  colors.forEach(color => {
    cost[color] = 1;
    budget -= 1;
  });

  while (budget > 0) {
    const candidates = colors.filter(color => cost[color] < 7);
    if (candidates.length === 0) break;
    cost[candidates[Math.floor(Math.random() * candidates.length)]] += 1;
    budget -= 1;
  }

  return cost;
};

const generateDecks = () => {
  const decks = { level1: [], level2: [], level3: [] };
  let cardId = 0;

  [1, 2, 3].forEach(level => {
    const config = LEVEL_CONFIG[level];
    for (let i = 0; i < config.count; i++) {
      decks[`level${level}`].push({
        id: `card-${cardId++}`,
        level,
        points: config.points(),
        cost: generateCost(level),
        bonus: GEMS[Math.floor(Math.random() * GEMS.length)]
      });
    }
    shuffle(decks[`level${level}`]);
  });

  return decks;
};

// Nobles follow the real game's patterns: 3 bonuses of 3 colors, or 4 of 2.
const generateNobles = (numPlayers) => {
  const nobles = [];
  const count = numPlayers + 1;

  for (let i = 0; i < count; i++) {
    const requirement = { diamond: 0, emerald: 0, ruby: 0, sapphire: 0, onyx: 0 };
    const wide = Math.random() < 0.5;
    const colors = shuffle([...GEMS]).slice(0, wide ? 3 : 2);
    colors.forEach(color => {
      requirement[color] = wide ? 3 : 4;
    });

    nobles.push({ id: `noble-${i}`, points: 3, requirement });
  }

  return nobles;
};

export const createGame = (numPlayers) => {
  const decks = generateDecks();

  const players = Array.from({ length: numPlayers }, (_, i) => ({
    id: i,
    name: `Player ${i + 1}`,
    gems: { diamond: 0, emerald: 0, ruby: 0, sapphire: 0, onyx: 0, gold: 0 },
    cards: [],
    nobles: [],
    score: 0,
    reservedCards: []
  }));

  const availableCards = {
    level1: decks.level1.splice(0, 4),
    level2: decks.level2.splice(0, 4),
    level3: decks.level3.splice(0, 4)
  };

  return {
    players,
    decks,
    availableCards,
    availableGems: { ...getInitialGems(numPlayers) },
    nobles: generateNobles(numPlayers),
    currentPlayerIndex: 0,
    gameOver: false,
    winner: null,
    numPlayers
  };
};

const cloneGame = (game) => structuredClone(game);

export const getCurrentPlayer = (game) => game.players[game.currentPlayerIndex];

export const totalTokens = (player) =>
  Object.values(player.gems).reduce((a, b) => a + b, 0);

export const getBonuses = (cards) => {
  const bonuses = { diamond: 0, emerald: 0, ruby: 0, sapphire: 0, onyx: 0 };
  cards.forEach(card => {
    bonuses[card.bonus]++;
  });
  return bonuses;
};

export const canAffordCard = (playerGems, cardCost, bonuses = {}) => {
  let goldAvailable = playerGems.gold || 0;

  for (const gem of GEMS) {
    const need = Math.max(0, (cardCost[gem] || 0) - (bonuses[gem] || 0));
    const have = playerGems[gem] || 0;

    if (have < need) {
      const shortage = need - have;
      if (goldAvailable < shortage) {
        return false;
      }
      goldAvailable -= shortage;
    }
  }

  return true;
};

// Spend the player's tokens for a card, using gold to cover shortages,
// and return everything spent to the common pool.
const payForCard = (game, player, card) => {
  const bonuses = getBonuses(player.cards);

  GEMS.forEach(gem => {
    const need = Math.max(0, (card.cost[gem] || 0) - (bonuses[gem] || 0));
    const fromGems = Math.min(need, player.gems[gem] || 0);

    player.gems[gem] -= fromGems;
    game.availableGems[gem] += fromGems;

    const shortage = need - fromGems;
    if (shortage > 0) {
      player.gems.gold -= shortage;
      game.availableGems.gold += shortage;
    }
  });
};

const refillBoard = (game, level) => {
  if (game.decks[level].length > 0) {
    game.availableCards[level].push(game.decks[level].shift());
  }
};

const finishPurchase = (game, player, card) => {
  player.cards.push(card);
  player.score += card.points;

  checkAndAwardNobles(game, player);

  if (player.score >= VICTORY_POINTS_TO_WIN) {
    game.gameOver = true;
    game.winner = player.name;
  }
};

export const canTakeGems = (game, gemsToTake) => {
  const entries = Object.entries(gemsToTake).filter(([, count]) => count > 0);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  if (total === 0 || total > 3) return false;

  // Taking 2 of one color: must be the only pick, and 4+ must be available
  for (const [gem, count] of entries) {
    if (count > 2) return false;
    if (count === 2 && (entries.length > 1 || game.availableGems[gem] < 4)) {
      return false;
    }
    if (game.availableGems[gem] < count) return false;
  }

  if (totalTokens(getCurrentPlayer(game)) + total > MAX_TOKENS_PER_PLAYER) {
    return false;
  }

  return true;
};

export const takeGems = (game, gemsToTake) => {
  const updatedGame = cloneGame(game);
  const player = getCurrentPlayer(updatedGame);

  Object.entries(gemsToTake).forEach(([gem, count]) => {
    const taken = Math.min(count, updatedGame.availableGems[gem]);
    updatedGame.availableGems[gem] -= taken;
    player.gems[gem] = (player.gems[gem] || 0) + taken;
  });

  return updatedGame;
};

export const discardGems = (game, gemsToDiscard) => {
  const updatedGame = cloneGame(game);
  const player = getCurrentPlayer(updatedGame);

  Object.entries(gemsToDiscard).forEach(([gem, count]) => {
    const discarded = Math.min(count, player.gems[gem] || 0);
    player.gems[gem] -= discarded;
    updatedGame.availableGems[gem] += discarded;
  });

  return updatedGame;
};

export const buyCard = (game, cardId, level) => {
  const updatedGame = cloneGame(game);
  const player = getCurrentPlayer(updatedGame);
  const cardIndex = updatedGame.availableCards[level].findIndex(c => c.id === cardId);

  if (cardIndex === -1) return updatedGame;

  const card = updatedGame.availableCards[level][cardIndex];

  if (!canAffordCard(player.gems, card.cost, getBonuses(player.cards))) {
    return updatedGame;
  }

  updatedGame.availableCards[level].splice(cardIndex, 1);
  refillBoard(updatedGame, level);

  payForCard(updatedGame, player, card);
  finishPurchase(updatedGame, player, card);

  return updatedGame;
};

export const reserveCard = (game, cardId, level) => {
  const updatedGame = cloneGame(game);
  const player = getCurrentPlayer(updatedGame);

  if (player.reservedCards.length >= MAX_RESERVED_CARDS) {
    return updatedGame;
  }

  const cardIndex = updatedGame.availableCards[level].findIndex(c => c.id === cardId);

  if (cardIndex === -1) return updatedGame;

  const card = updatedGame.availableCards[level][cardIndex];

  updatedGame.availableCards[level].splice(cardIndex, 1);
  refillBoard(updatedGame, level);

  player.reservedCards.push(card);

  if (updatedGame.availableGems.gold > 0 && totalTokens(player) < MAX_TOKENS_PER_PLAYER) {
    updatedGame.availableGems.gold -= 1;
    player.gems.gold = (player.gems.gold || 0) + 1;
  }

  return updatedGame;
};

export const buyReservedCard = (game, reservedCardIndex) => {
  const updatedGame = cloneGame(game);
  const player = getCurrentPlayer(updatedGame);

  if (reservedCardIndex < 0 || reservedCardIndex >= player.reservedCards.length) {
    return updatedGame;
  }

  const card = player.reservedCards[reservedCardIndex];

  if (!canAffordCard(player.gems, card.cost, getBonuses(player.cards))) {
    return updatedGame;
  }

  player.reservedCards.splice(reservedCardIndex, 1);

  payForCard(updatedGame, player, card);
  finishPurchase(updatedGame, player, card);

  return updatedGame;
};

export const checkAndAwardNobles = (game, player) => {
  const bonuses = getBonuses(player.cards);
  const indicesToRemove = [];

  game.nobles.forEach((noble, index) => {
    if (!player.nobles.includes(noble.id)) {
      const hasRequirement = Object.keys(noble.requirement).every(
        gem => (bonuses[gem] || 0) >= (noble.requirement[gem] || 0)
      );

      if (hasRequirement) {
        player.nobles.push(noble.id);
        player.score += noble.points;
        indicesToRemove.push(index);
      }
    }
  });

  for (let i = indicesToRemove.length - 1; i >= 0; i--) {
    game.nobles.splice(indicesToRemove[i], 1);
  }
};

export const nextTurn = (game) => {
  const updatedGame = cloneGame(game);
  updatedGame.currentPlayerIndex =
    (updatedGame.currentPlayerIndex + 1) % updatedGame.players.length;
  return updatedGame;
};
