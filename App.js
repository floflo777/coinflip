import { useState } from 'react';
import Web3 from 'web3';
import Coinflip from './Coinflip.json'; 
import './App.css';
import axios from 'axios';
import fetch from 'node-fetch';

function App() {
  const [connectedAccount, setConnectedAccount] = useState('null');
  const [callStatus, setCallStatus] = useState('');
  const [games, setGames] = useState([]);
  const [betAmount, setBetAmount] = useState('0.1');
  const [timeLimit, setTimeLimit] = useState('60');
  const [coinSide, setCoinSide] = useState(true); // true pour face, false pour pile
  const [sortOrder, setSortOrder] = useState(0); // 0 pour croissant, 1 pour décroissant
  const [sortBy, setSortBy] = useState('betAmount'); // par défaut, trier par montant de mise
  const [isModalOpen, setIsModalOpen] = useState(false);

  async function connectMetamask() {
    if (window.ethereum) {
      const web3 = new Web3(window.ethereum);
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const accounts = await web3.eth.getAccounts();
      setConnectedAccount(accounts[0]);
    } else {
      alert('Please download metamask');
    } 
  }


  async function createGame() {
    /* Fonction pour créer une partie */

    if (!betAmount || !timeLimit) {
      alert("Bet amount and time limit must be filled in.");
      return;
    }

    if (window.ethereum && connectedAccount !== 'null') {
      const web3 = new Web3(window.ethereum);
      const coinflipContract = new web3.eth.Contract(Coinflip.abi, '0x74eD373F3134730D4B129Ca3Fb0c72A528F0BbCF');
      const amount = web3.utils.toWei(betAmount, 'ether'); 
      try {
        await coinflipContract.methods.createGame(amount, coinSide).send({ from: connectedAccount, value: amount });
        const gameData = {
          player1: connectedAccount,
          player2: null, 
          betAmount: amount,
          winner: null,
          createTime: null,
          player1Choice: coinSide,
          timeLimit: timeLimit,
          coinSide: coinSide
        };
        const response = await fetch('http://localhost:3001/games', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(gameData)
        });
        const responseData = await response.json();
        console.log('Game stored in database:', response.statusText);
        console.log('Game stored in database:', JSON.stringify(responseData));
        console.log('game Id ', responseData.insertId, responseData.gameId, responseData._id, responseData.id);
        setGames([...games, { gameId:responseData.gameId, betAmount, timeLimit, coinSide, creator: connectedAccount}]);
        //console.log('Game created:', setGames);
      } catch (error) {
        console.error('Error calling createGame:', error);
        setCallStatus('Error creating game: ' + error.message);
      }
    } else {
      setCallStatus('Please connect to Metamask.');
    }
  }

  async function joinGame(gameId) {
    alert(gameId);
    /* Fonction pour rejoindre une partie */
    if (window.ethereum && connectedAccount !== 'null') {
      const web3 = new Web3(window.ethereum);
      const coinflipContract = new web3.eth.Contract(Coinflip.abi, '0x74eD373F3134730D4B129Ca3Fb0c72A528F0BbCF');
      const game = games.find(g => g.gameId === gameId);
      if (!game) {
        alert('Game not found!');
        return;
      }
      const amount = web3.utils.toWei(game.betAmount, 'ether');
      try {
        await coinflipContract.methods.joinGame(gameId).send({ from: connectedAccount, value: amount });
        setGames(games.filter(g => g.gameId !== gameId));
      } catch (error) {
        console.error('Error calling joinGame:', error);
      }
    }
  }

  function shorten(address) {
    if (address.length >= 7) {
      return `${address.slice(0, 5)}...${address.slice(address.length - 3)}`;
    }
    return address;
  }
  
  function sortGames(games) {
    return games.sort((a, b) => {
      const aValue = sortBy === 'betAmount' ? parseFloat(a.betAmount) : parseInt(a.timeLimit);
      const bValue = sortBy === 'betAmount' ? parseFloat(b.betAmount) : parseInt(b.timeLimit);
      
      if (sortOrder === 0) {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });
  }

  function handleOpenModal() {
    setIsModalOpen(true);
  }
  
  function handleCloseModal() {
    setIsModalOpen(false);
  }

  /*<button onClick={() => { setSortBy('betAmount'); setSortOrder(0); }}>Trier par montant croissant</button>
  <button onClick={() => { setSortBy('betAmount'); setSortOrder(1); }}>Trier par montant décroissant</button>
  <button onClick={() => { setSortBy('timeLimit'); setSortOrder(0); }}>Trier par temps croissant</button>
  <button onClick={() => { setSortBy('timeLimit'); setSortOrder(1); }}>Trier par temps décroissant</button>*/

  const gameInputWrapper = (label, inputElement) => (
    <div className="input-wrapper">
      <label>{label}</label>
      {inputElement}
    </div>
  );

  return (
    <div className="App">
      <header>
        <h1>Whaleflip x ETH</h1>
        <img class="logo" alt="Logo" src="/whale.png" />
      </header>

      <div className="main-content">
        <button className="connect-button" onClick={connectMetamask}>
          {connectedAccount !== 'null' ? `${shorten(connectedAccount)}` : 'Connect'}
        </button>

        <button className="create-button" onClick={() => setIsModalOpen(true)}>Create Game</button>

        {isModalOpen && (
          <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Create a Game</h2>
              {gameInputWrapper("Bet Amount", <input type="text" class="parameter" placeholder="0.1 ETH" value={betAmount} onChange={(e) => setBetAmount(e.target.value)} />)}
              {gameInputWrapper("Time Limit", <input type="text" class="parameter" placeholder="60" value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} />)}
              {gameInputWrapper("Coin Side", <select class="parameter" value={coinSide} onChange={(e) => setCoinSide(e.target.value === 'true')}>
                <option value="true">Heads</option>
                <option value="false">Tails</option>
              </select>)}
              <button onClick={createGame}>Create</button>
              <button onClick={() => setIsModalOpen(false)}>Cancel</button>
            </div>
          </div>
        )}

        <p>{callStatus}</p>

        <div className="game-list">
          {sortGames(games).map((game, index) => (
            <div className="game-item" key={index}>
              <div>
                <p>&nbsp;&nbsp;&nbsp; {shorten(game.creator)} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    {game.coinSide ? 'Heads' : 'Tails'} 
                    &nbsp;&nbsp; | &nbsp;&nbsp;
                    {shorten(game.betAmount)} ETH 
                    &nbsp;&nbsp;&nbsp;
                </p>
              </div>
              <button className="join-button" onClick={() => joinGame(game.gameId)}>Join Game</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
