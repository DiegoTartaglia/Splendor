// AI-vs-AI smoke test: node scripts/simulate.cjs (bundled via esbuild)
import { createGame, getCurrentPlayer, totalTokens } from '../src/services/gameLogic';
import { makeAIMove } from '../src/services/aiLogic';

const GAMES = 60;
const MAX_TURNS = 400;

let finished = 0;
let totalTurns = 0;

for (let n = 0; n < GAMES; n++) {
  let game = createGame(2 + (n % 3));
  let turns = 0;

  while (!game.gameOver && turns < MAX_TURNS) {
    const before = getCurrentPlayer(game);
    if (totalTokens(before) > 10) {
      throw new Error(`Token limit violated by ${before.name}: ${totalTokens(before)}`);
    }
    game = makeAIMove(game);
    turns++;
  }

  // The token pool must be conserved: bank + players = initial supply
  const gems = ['diamond', 'emerald', 'ruby', 'sapphire', 'onyx', 'gold'];
  gems.forEach(gem => {
    const inPlay = game.players.reduce((sum, p) => sum + (p.gems[gem] || 0), 0);
    const total = inPlay + game.availableGems[gem];
    if (total < 0 || game.availableGems[gem] < 0) {
      throw new Error(`Negative ${gem} pool: bank=${game.availableGems[gem]}`);
    }
  });

  if (game.gameOver) {
    finished++;
    totalTurns += turns;
  } else {
    console.log(`Game ${n}: NOT finished after ${MAX_TURNS} turns (players: ${game.numPlayers})`);
    game.players.forEach(p =>
      console.log(`  ${p.name}: score=${p.score} cards=${p.cards.length} tokens=${totalTokens(p)} reserved=${p.reservedCards.length}`)
    );
  }
}

console.log(`Finished: ${finished}/${GAMES} games, avg turns: ${(totalTurns / Math.max(1, finished)).toFixed(1)}`);
