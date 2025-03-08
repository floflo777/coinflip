// src/App.jsx
import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import CoinflipContract from './Coinflip.json';
import './App.css';
import CreateGameModal from './CreateGameModal';
import GameList from './GameList';
import CoinFlipAnimation from './CoinFlipAnimation';

const contractAddress = "0x3E81Ea523Fa184AcDDe571eD84bA3F5d1e579270";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function App() {
  const [account, setAccount] = useState(null);
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  // Animation states
  const [showAnimation, setShowAnimation] = useState(false);
  const [flipResult, setFlipResult] = useState(null);
  const [resultMessage, setResultMessage] = useState("");

  async function connectWallet() {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        const web3Instance = new Web3(window.ethereum);
        setWeb3(web3Instance);
        const coinflipInstance = new web3Instance.eth.Contract(CoinflipContract.abi, contractAddress);
        setContract(coinflipInstance);
      } catch (error) {
        console.error("Connection error:", error);
      }
    } else {
      alert("Please install MetaMask!");
    }
  }

  async function loadGames() {
    if (!contract || !web3) return;
    setLoading(true);
    try {
      const openGameIds = await contract.methods.getOpenGames().call();
      const data = await Promise.all(
        openGameIds.map(async (id) => {
          const g = await contract.methods.getGame(id).call();
          return {
            gameId: id,
            player1: g[0],
            player2: g[1],
            betAmount: web3.utils.fromWei(g[2], 'ether'),
            winner: g[3],
            createTime: g[4],
            player1Choice: g[5]
          };
        })
      );
      setGames(data);
    } catch (error) {
      console.error("Error loading games:", error);
    }
    setLoading(false);
  }

  async function createGame(betAmount, isHeads) {
    if (!contract || !web3 || !account) {
      alert("Please connect your wallet first.");
      return;
    }
    try {
      const weiAmount = web3.utils.toWei(betAmount, 'ether');
      await contract.methods.createGame(weiAmount, isHeads).send({
        from: account,
        value: weiAmount
      });
      alert("Game created successfully!");
      setShowModal(false);
      loadGames();
    } catch (err) {
      console.error("Error creating game:", err);
      alert("Failed to create game.");
    }
  }

  async function joinGame(gameId, betAmount, player1Choice) {
    if (!contract || !web3 || !account) {
      alert("Please connect your wallet first.");
      return;
    }
    try {
      const weiAmount = web3.utils.toWei(betAmount, 'ether');
      await contract.methods.joinGame(gameId).send({
        from: account,
        value: weiAmount
      });
      alert("Game joined successfully!");
      const updatedGame = await contract.methods.getGame(gameId).call();
      const winner = updatedGame[3];
      const p1Choice = updatedGame[5];
      let result = "heads";
      if (
        (winner.toLowerCase() === updatedGame[0].toLowerCase() && !p1Choice) ||
        (winner.toLowerCase() !== updatedGame[0].toLowerCase() && p1Choice)
      ) {
        result = "tails";
      }
      // Append timestamp to force update even if result remains the same
      setFlipResult(result + "-" + Date.now());
      
      // Determine win/lose message (for joining player)
      const betNum = parseFloat(betAmount);
      let message = "";
      if (account.toLowerCase() === winner.toLowerCase()) {
        message = "You win " + (betNum * 0.99).toFixed(5) + " ETH!";
      } else {
        message = "You lose " + betAmount + " ETH.";
      }
      setResultMessage(message);
      setShowAnimation(true);
      loadGames();
      
      // Hide the overlay after 5 seconds
      setTimeout(() => {
        setShowAnimation(false);
        setFlipResult(null);
        setResultMessage("");
      }, 5000);
    } catch (err) {
      console.error("Error joining game:", err);
      alert("Failed to join game.");
    }
  }

  useEffect(() => {
    if (contract) {
      loadGames();
      contract.events.GameCreated({}, (error, event) => {
        if (!error) {
          console.log("GameCreated:", event.returnValues);
          setTimeout(loadGames, 2000);
        }
      });
      contract.events.GameJoined({}, (error, event) => {
        if (!error) {
          console.log("GameJoined:", event.returnValues);
          setTimeout(loadGames, 2000);
        }
      });
      return () => {
        contract.events.GameCreated().removeAllListeners();
        contract.events.GameJoined().removeAllListeners();
      };
    }
  }, [contract]);

  function shortAddress(addr) {
    return addr.slice(0, 6) + "..." + addr.slice(-4);
  }

  return (
    <>
      <header>
        <button className="create-button" onClick={() => setShowModal(true)}>
          Create Game
        </button>
        <h1>Coinflip on ETH</h1>
        <button className="connect-button" onClick={connectWallet}>
          {account ? shortAddress(account) : "Connect"}
        </button>
      </header>

      <div className="main-content">
        {loading ? (
          <p style={{ color: "#37367b", textAlign: "center" }}>Loading...</p>
        ) : (
          <GameList account={account} games={games} joinGame={joinGame} />
        )}
      </div>

      {showAnimation && flipResult && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <CoinFlipAnimation flipResult={flipResult} />
          <h2 style={{
            marginTop: '20px',
            color: '#14044d',
            fontSize: '2rem',
            textShadow: '2px 2px 4px #000'
          }}>
            {resultMessage}
          </h2>
        </div>
      )}

      <CreateGameModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onCreate={createGame}
      />
    </>
  );
}

export default App;
