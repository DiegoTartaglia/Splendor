import React, { useState } from 'react';
import Menu from './components/Menu';
import Game from './components/Game';
import './index.css';

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [numPlayers, setNumPlayers] = useState(2);
  const [numCPU, setNumCPU] = useState(1);

  const handleStartGame = (players, cpuCount) => {
    setNumPlayers(players);
    setNumCPU(cpuCount);
    setGameStarted(true);
  };

  const handleBackToMenu = () => {
    setGameStarted(false);
  };

  return (
    <div className="App">
      {!gameStarted ? (
        <Menu onStartGame={handleStartGame} />
      ) : (
        <Game numPlayers={numPlayers} numCPU={numCPU} onBackToMenu={handleBackToMenu} />
      )}
    </div>
  );
}

export default App;
