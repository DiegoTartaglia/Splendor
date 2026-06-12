import {
  takeGems,
  buyCard,
  buyReservedCard,
  reserveCard,
  discardGems,
  nextTurn,
  getBonuses,
  canAffordCard,
  getCurrentPlayer,
  totalTokens,
  canTakeGems
} from './gameLogic';
import {
  GEMS,
  VICTORY_POINTS_TO_WIN,
  MAX_TOKENS_PER_PLAYER,
  MAX_RESERVED_CARDS
} from '../types/game';

const LEVELS = ['level1', 'level2', 'level3'];

// Cost of a card for a specific player, after their permanent bonuses
const effectiveCost = (card, bonuses) => {
  const cost = {};
  GEMS.forEach(gem => {
    cost[gem] = Math.max(0, (card.cost[gem] || 0) - (bonuses[gem] || 0));
  });
  return cost;
};

// Tokens still missing to buy a card (after spending colored gems, before gold)
const gemShortage = (player, card, bonuses) => {
  const cost = effectiveCost(card, bonuses);
  const shortage = {};
  let total = 0;
  GEMS.forEach(gem => {
    const lack = Math.max(0, cost[gem] - (player.gems[gem] || 0));
    shortage[gem] = lack;
    total += lack;
  });
  return { shortage, total };
};

// How much each gem color is requested by the cards currently on the board —
// used as a tiebreaker when the AI has no specific need.
const colorDemand = (game) => {
  const demand = { diamond: 0, emerald: 0, ruby: 0, sapphire: 0, onyx: 0 };
  LEVELS.forEach(level => {
    game.availableCards[level].forEach(card => {
      GEMS.forEach(gem => {
        demand[gem] += card.cost[gem] || 0;
      });
    });
  });
  return demand;
};

// How much one extra bonus of this color advances the player toward nobles
const nobleValue = (game, bonuses, bonusGem) => {
  let value = 0;
  game.nobles.forEach(noble => {
    const required = noble.requirement[bonusGem] || 0;
    if (required > (bonuses[bonusGem] || 0)) {
      value += 1;
    }
  });
  return value;
};

// Overall desirability of a card for the AI player
const scoreCard = (game, player, bonuses, card) => {
  const cost = effectiveCost(card, bonuses);
  const costSum = GEMS.reduce((sum, gem) => sum + cost[gem], 0);

  let score = card.points * 4;
  score += nobleValue(game, bonuses, card.bonus) * 2;
  score += 1.5; // every bonus is a permanent discount
  score -= costSum * 0.5;

  // A purchase that wins the game beats everything else
  if (player.score + card.points >= VICTORY_POINTS_TO_WIN) {
    score += 1000;
  }

  return score;
};

const findBestPurchase = (game, player, bonuses) => {
  const purchases = [];

  player.reservedCards.forEach((card, idx) => {
    if (canAffordCard(player.gems, card.cost, bonuses)) {
      purchases.push({ kind: 'reserved', idx, card });
    }
  });

  LEVELS.forEach(level => {
    game.availableCards[level].forEach(card => {
      if (canAffordCard(player.gems, card.cost, bonuses)) {
        purchases.push({ kind: 'board', card, level });
      }
    });
  });

  if (purchases.length === 0) return null;

  purchases.sort(
    (a, b) => scoreCard(game, player, bonuses, b.card) - scoreCard(game, player, bonuses, a.card)
  );
  return purchases[0];
};

// The card the AI is working toward: high value, few missing tokens.
// Cards whose discounted cost exceeds the token limit can't be paid at all
// until more bonuses are collected, so they are never targeted.
const findTargetCard = (game, player, bonuses) => {
  let candidates = [];

  LEVELS.forEach(level => {
    game.availableCards[level].forEach(card => {
      candidates.push({ card, shortage: gemShortage(player, card, bonuses) });
    });
  });
  player.reservedCards.forEach(card => {
    candidates.push({ card, shortage: gemShortage(player, card, bonuses) });
  });

  const reachable = candidates.filter(({ card }) => {
    const cost = effectiveCost(card, bonuses);
    return GEMS.reduce((sum, gem) => sum + cost[gem], 0) <= MAX_TOKENS_PER_PLAYER;
  });
  if (reachable.length > 0) candidates = reachable;

  if (candidates.length === 0) return null;

  // Missing colors that the bank can't provide make a card much harder to
  // finish, so they weigh more than ordinary shortage.
  const blockedShortage = ({ shortage }) =>
    GEMS.reduce(
      (sum, gem) => sum + (game.availableGems[gem] === 0 ? shortage.shortage[gem] || 0 : 0),
      0
    );

  candidates.sort((a, b) => {
    const valueA = scoreCard(game, player, bonuses, a.card) - a.shortage.total * 2 - blockedShortage(a) * 4;
    const valueB = scoreCard(game, player, bonuses, b.card) - b.shortage.total * 2 - blockedShortage(b) * 4;
    return valueB - valueA;
  });

  return candidates[0];
};

// A high-value board card an opponent could buy on their next turn
const findOpponentThreat = (game, player) => {
  let threat = null;

  game.players.forEach(opponent => {
    if (opponent.id === player.id) return;
    const opponentBonuses = getBonuses(opponent.cards);

    LEVELS.forEach(level => {
      game.availableCards[level].forEach(card => {
        if (card.points >= 3 && canAffordCard(opponent.gems, card.cost, opponentBonuses)) {
          if (!threat || card.points > threat.card.points) {
            threat = { card, level };
          }
        }
      });
    });
  });

  return threat;
};

// What the AI would like to draw this turn, ignoring the token limit
const chooseGems = (game, player, target) => {
  const demand = colorDemand(game);
  const shortage = target ? target.shortage.shortage : {};

  const neededColors = GEMS
    .filter(gem => (shortage[gem] || 0) > 0 && game.availableGems[gem] > 0)
    .sort((a, b) => shortage[b] - shortage[a]);

  // Missing 2+ of a single color: grab two of it if the pool allows it
  if (neededColors.length === 1 && shortage[neededColors[0]] >= 2 && game.availableGems[neededColors[0]] >= 4) {
    return { [neededColors[0]]: 2 };
  }

  // Otherwise take up to 3 different colors: needed ones first. Filler
  // colors are only worth picking when the hand isn't already crowded.
  const fillers = totalTokens(player) <= 6
    ? GEMS
        .filter(gem => !neededColors.includes(gem) && game.availableGems[gem] > 0)
        .sort((a, b) => demand[b] - demand[a])
    : [];

  const picks = [...neededColors, ...fillers].slice(0, 3);
  if (picks.length === 0) return null;

  const selection = {};
  picks.forEach(gem => {
    selection[gem] = 1;
  });

  return selection;
};

// Tokens the player can give back without hurting the target purchase
const chooseDiscards = (player, target, bonuses, count) => {
  const need = target ? effectiveCost(target.card, bonuses) : {};
  const discard = {};
  let remaining = count;

  const surplus = GEMS
    .map(gem => ({ gem, extra: (player.gems[gem] || 0) - (need[gem] || 0) }))
    .filter(({ extra }) => extra > 0)
    .sort((a, b) => b.extra - a.extra);

  for (const { gem, extra } of surplus) {
    if (remaining <= 0) break;
    const amount = Math.min(extra, remaining);
    discard[gem] = amount;
    remaining -= amount;
  }

  return remaining === 0 ? discard : null;
};

// Draw gems toward the target, swapping out useless tokens when the hand
// is full — without this the AI can deadlock at the 10-token limit.
const collectGems = (game, player, bonuses, target) => {
  const selection = chooseGems(game, player, target);
  if (!selection) return null;

  let total = Object.values(selection).reduce((a, b) => a + b, 0);
  let workingGame = game;
  const overflow = totalTokens(player) + total - MAX_TOKENS_PER_PLAYER;

  if (overflow > 0) {
    const discard = chooseDiscards(player, target, bonuses, overflow);
    if (discard) {
      workingGame = discardGems(game, discard);
    } else {
      // Nothing safe to discard: shrink the draw to fit the limit
      const room = MAX_TOKENS_PER_PLAYER - totalTokens(player);
      if (room <= 0) return null;
      const trimmed = {};
      let left = room;
      for (const [gem, count] of Object.entries(selection)) {
        if (left <= 0) break;
        trimmed[gem] = Math.min(count, left);
        left -= trimmed[gem];
      }
      // A trimmed double-take of one color stays legal; a partial multi-color
      // take is fine too
      return canTakeGems(game, trimmed) ? { game, selection: trimmed } : null;
    }
  }

  return canTakeGems(workingGame, selection) ? { game: workingGame, selection } : null;
};

export const makeAIMove = (game) => {
  const player = getCurrentPlayer(game);
  const bonuses = getBonuses(player.cards);

  // 1. Buy the best affordable card (board or reserved)
  const purchase = findBestPurchase(game, player, bonuses);
  if (purchase) {
    const updatedGame =
      purchase.kind === 'reserved'
        ? buyReservedCard(game, purchase.idx)
        : buyCard(game, purchase.card.id, purchase.level);
    return nextTurn(updatedGame);
  }

  const target = findTargetCard(game, player, bonuses);

  // 2. Deny an opponent a big card they could buy next turn
  const threat = findOpponentThreat(game, player);
  if (threat && player.reservedCards.length < MAX_RESERVED_CARDS) {
    return nextTurn(reserveCard(game, threat.card.id, threat.level));
  }

  // 3. Collect tokens toward the target card
  const collected = collectGems(game, player, bonuses, target);
  if (collected) {
    return nextTurn(takeGems(collected.game, collected.selection));
  }

  // 4. Nothing to take (pool empty or hand full): reserve to grab a gold token
  if (
    target &&
    player.reservedCards.length < MAX_RESERVED_CARDS &&
    LEVELS.some(level => game.availableCards[level].some(c => c.id === target.card.id))
  ) {
    const level = LEVELS.find(l => game.availableCards[l].some(c => c.id === target.card.id));
    return nextTurn(reserveCard(game, target.card.id, level));
  }

  // 5. Completely stuck (full hand, useless colors, bank empty): give back
  // up to 3 surplus tokens so the economy keeps circulating instead of
  // deadlocking with every token locked in players' hands.
  for (let amount = Math.min(3, totalTokens(player)); amount >= 1; amount--) {
    const surplusDiscard = chooseDiscards(player, target, bonuses, amount);
    if (surplusDiscard) {
      return nextTurn(discardGems(game, surplusDiscard));
    }
  }

  // 6. No legal useful move: pass
  return nextTurn(game);
};
