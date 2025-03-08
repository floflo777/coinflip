// src/GameList.jsx
import React from 'react';

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export default function GameList({ account, games, joinGame }) {
  // Afficher uniquement les parties où player2 == ZERO_ADDRESS
  const openGames = games.filter(g => g.player2.toLowerCase() === ZERO_ADDRESS);

  function shortAddress(addr) {
    return addr.slice(0, 6) + "..." + addr.slice(-4);
  }

  return (
    <div>
      <h3 style={{ color: "#000", textAlign: "center" }}>Open Games</h3>
      <div className="game-list">
        {openGames.length === 0 ? (
          <p style={{ color: "#000", textAlign: "center" }}>Aucune partie ouverte.</p>
        ) : (
          openGames.map((game) => (
            <div key={game.gameId} className="game-item">
              <div>{shortAddress(game.player1)}</div>
              <div>
                {game.player1Choice ? "Heads" : "Tails"} | {game.betAmount} ETH
              </div>
              <div>
                <button
                  className="join-button"
                  onClick={() => joinGame(game.gameId, game.betAmount, game.player1Choice)}
                >
                  Join
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

