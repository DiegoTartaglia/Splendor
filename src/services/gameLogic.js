import { VICTORY_POINTS_TO_WIN } from '../types/game';

// Gem distribution based on number of players
const getInitialGems = (numPlayers) => {
  const gemCounts = {
    2: { diamond: 4, emerald: 4, ruby: 4, sapphire: 4, onyx: 4, gold: 5 },
    3: { diamond: 5, emerald: 5, ruby: 5, sapphire: 5, onyx: 5, gold: 5 },
    4: { diamond: 7, emerald: 7, ruby: 7, sapphire: 7, onyx: 7, gold: 5 }
  };
  return gemCounts[numPlayers] || gemCounts[2];
};

// Generate random cost for cards
const generateRandomCost = (level) => {
  const maxCost = level + 2;
  return {
    diamond: Math.floor(Math.random() * (maxCost + 1)),
    emerald: Math.floor(Math.random() * (maxCost + 1)),
    ruby: Math.floor(Math.random() * (maxCost + 1)),
    sapphire: Math.floor(Math.random() * (maxCost + 1)),
    onyx: Math.floor(Math.random() * (maxCost + 1))
  };
};

// Generate development cards with better randomization
const generateCards = () => {
  const cards = [];
  const levels = [1, 2, 3];
  const gems = ['diamond', 'emerald', 'ruby', 'sapphire', 'onyx'];
  let cardId = 0;
  
  levels.forEach(level => {
    for (let i = 0; i < 8; i++) {
      const points = level === 1 ? 0 : level === 2 ? Math.random() > 0.5 ? 1 : 2 : Math.floor(Math.random() * 4) + 2;
      const bonus = gems[Math.floor(Math.random() * gems.length)];
      
      cards.push({
        id: `card-${cardId++}`,
        level,
        points,
        cost: generateRandomCost(level),
        bonus
      });
    }
  });
  
  // Shuffle cards
  return cards.sort(() => Math.random() - 0.5);
};

// Generate nobles with better randomization
const generateNobles = () => {
  const nobles = [];
  const gems = ['diamond', 'emerald', 'ruby', 'sapphire', 'onyx'];
  
  for (let i = 0; i < 5; i++) {
    const requirement = {};
    gems.forEach(gem => {
      requirement[gem] = Math.random() > 0.6 ? Math.floor(Math.random() * 2) + 2 : 0;
    });
    
    nobles.push({
      id: `noble-${i}`,
      points: 3,
      requirement
    });
  }
  
  return nobles.sort(() => Math.random() - 0.5);
};

export const createGame = (numPlayers) => {
  const allCards = generateCards();
  const initialGems = getInitialGems(numPlayers);
  
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
    level1: allCards.filter(c => c.level === 1).slice(0, 4),
    level2: allCards.filter(c => c.level === 2).slice(0, 4),
    level3: allCards.filter(c => c.level === 3).slice(0, 4)
  };

  return {
    players,
    availableCards,
    allCards,
    availableGems: { ...initialGems },
    nobles: generateNobles(),
    currentPlayerIndex: 0,
    gameOver: false,
    winner: null,
    numPlayers
  };
};

export const getCurrentPlayer = (game) => game.players[game.currentPlayerIndex];

export const takeGems = (game, gemsToTake) => {
  const updatedGame = { ...game };
  const player = { ...updatedGame.players[updatedGame.currentPlayerIndex] };
  
  Object.keys(gemsToTake).forEach(gem => {
    if (updatedGame.availableGems[gem] >= gemsToTake[gem]) {
      updatedGame.availableGems[gem] -= gemsToTake[gem];
      player.gems[gem] = (player.gems[gem] || 0) + gemsToTake[gem];
    }
  });

  updatedGame.players[updatedGame.currentPlayerIndex] = player;
  return updatedGame;
};

export const canAffordCard = (playerGems, cardCost, bonuses = {}) => {
  let gemsNeeded = { ...cardCost };
  
  Object.keys(bonuses).forEach(gem => {
    gemsNeeded[gem] = Math.max(0, gemsNeeded[gem] - bonuses[gem]);
  });

  let goldAvailable = playerGems.gold || 0;
  
  for (const gem of ['diamond', 'emerald', 'ruby', 'sapphire', 'onyx']) {
    const have = playerGems[gem] || 0;
    const need = gemsNeeded[gem] || 0;
    
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

export const buyCard = (game, cardId, level) => {
  const updatedGame = { ...game };
  const player = { ...updatedGame.players[updatedGame.currentPlayerIndex] };
  const cardIndex = updatedGame.availableCards[level].findIndex(c => c.id === cardId);
  
  if (cardIndex === -1) return updatedGame;
  
  const card = updatedGame.availableCards[level][cardIndex];
  
  if (!canAffordCard(player.gems, card.cost, getBonuses(player.cards))) {
    return updatedGame;
  }

  updatedGame.availableCards[level].splice(cardIndex, 1);
  
  // Replace with new card from deck
  const remainingCards = updatedGame.allCards.filter(
    c => c.level === level && 
    !updatedGame.availableCards[level].some(ac => ac.id === c.id) &&
    !player.cards.some(pc => pc.id === c.id) &&
    !player.reservedCards.some(rc => rc.id === c.id)
  );
  
  if (remainingCards.length > 0) {
    updatedGame.availableCards[level].push(remainingCards[0]);
  }
  
  player.cards.push(card);
  player.score += card.points;

  checkAndAwardNobles(updatedGame, player);

  if (player.score >= VICTORY_POINTS_TO_WIN) {
    updatedGame.gameOver = true;
    updatedGame.winner = player.name;
  }

  updatedGame.players[updatedGame.currentPlayerIndex] = player;
  return updatedGame;
};

export const reserveCard = (game, cardId, level) => {
  const updatedGame = { ...game };
  const player = { ...updatedGame.players[updatedGame.currentPlayerIndex] };

  if (player.reservedCards.length >= 3) {
    return updatedGame;
  }

  const cardIndex = updatedGame.availableCards[level].findIndex(c => c.id === cardId);
  
  if (cardIndex === -1) return updatedGame;
  
  const card = updatedGame.availableCards[level][cardIndex];

  updatedGame.availableCards[level].splice(cardIndex, 1);
  
  // Replace with new card from deck
  const remainingCards = updatedGame.allCards.filter(
    c => c.level === level && 
    !updatedGame.availableCards[level].some(ac => ac.id === c.id) &&
    !player.cards.some(pc => pc.id === c.id) &&
    !player.reservedCards.some(rc => rc.id === c.id)
  );
  
  if (remainingCards.length > 0) {
    updatedGame.availableCards[level].push(remainingCards[0]);
  }
  
  player.reservedCards.push(card);

  if (updatedGame.availableGems.gold > 0) {
    updatedGame.availableGems.gold -= 1;
    player.gems.gold = (player.gems.gold || 0) + 1;
  }

  updatedGame.players[updatedGame.currentPlayerIndex] = player;
  return updatedGame;
};

export const buyReservedCard = (game, reservedCardIndex) => {
  const updatedGame = { ...game };
  const player = { ...updatedGame.players[updatedGame.currentPlayerIndex] };
  
  if (reservedCardIndex < 0 || reservedCardIndex >= player.reservedCards.length) {
    return updatedGame;
  }

  const card = player.reservedCards[reservedCardIndex];

  if (!canAffordCard(player.gems, card.cost, getBonuses(player.cards))) {
    return updatedGame;
  }

  player.reservedCards.splice(reservedCardIndex, 1);
  player.cards.push(card);
  player.score += card.points;

  checkAndAwardNobles(updatedGame, player);

  if (player.score >= VICTORY_POINTS_TO_WIN) {
    updatedGame.gameOver = true;
    updatedGame.winner = player.name;
  }

  updatedGame.players[updatedGame.currentPlayerIndex] = player;
  return updatedGame;
};

export const getBonuses = (cards) => {
  const bonuses = { diamond: 0, emerald: 0, ruby: 0, sapphire: 0, onyx: 0 };
  cards.forEach(card => {
    bonuses[card.bonus]++;
  });
  return bonuses;
};

export const checkAndAwardNobles = (game, player) => {
  const bonuses = getBonuses(player.cards);
  const indicesToRemove = [];
  
  game.nobles.forEach((noble, index) => {
    if (!player.nobles.includes(noble.id)) {
      let hasRequirement = true;
      
      Object.keys(noble.requirement).forEach(gem => {
        if ((bonuses[gem] || 0) < (noble.requirement[gem] || 0)) {
          hasRequirement = false;
        }
      });

      if (hasRequirement) {
        player.nobles.push(noble.id);
        player.score += noble.points;
        indicesToRemove.push(index);
      }
    }
  });
  
  // Remove nobles in reverse order to avoid index issues
  for (let i = indicesToRemove.length - 1; i >= 0; i--) {
    game.nobles.splice(indicesToRemove[i], 1);
  }
};

export const nextTurn = (game) => {
  const updatedGame = { ...game };
  updatedGame.currentPlayerIndex = (updatedGame.currentPlayerIndex + 1) % updatedGame.players.length;
  return updatedGame;
};

export const canTakeGems = (game, gemsToTake) => {
  // Check if trying to take 2 gems of same color
  const entries = Object.entries(gemsToTake).filter(([_, count]) => count > 0);
  
  if (entries.length === 1) {
    const [gem, count] = entries[0];
    // Can only take 2 of same gem if 4+ available
    if (count === 2 && game.availableGems[gem] < 4) {
      return false;
    }
  }
  
  // Can't take 2 gems and then a 3rd
  const totalGems = Object.values(gemsToTake).reduce((a, b) => a + b, 0);
  if (totalGems > 3) {
    return false;
  }
  
  // Check if gems are available
  for (const [gem, count] of entries) {
    if (game.availableGems[gem] < count) {
      return false;
    }
  }
  
  return true;
};