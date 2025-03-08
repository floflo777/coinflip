// src/CreateGameModal.js
import React, { useState } from 'react';

export default function CreateGameModal({ isOpen, onClose, onCreate }) {
  const [betAmount, setBetAmount] = useState("");
  const [choice, setChoice] = useState("true");

  if (!isOpen) return null;

  function handleCreate() {
    onCreate(betAmount, choice === "true");
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-gold">
          <h2>Créer une partie</h2>
          <div className="parameter">
            <label>Mise (ETH): </label>
            <input
              type="text"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
            />
          </div>
          <div className="parameter">
            <label>Choix: </label>
            <select value={choice} onChange={(e) => setChoice(e.target.value)}>
              <option value="true">Heads</option>
              <option value="false">Tails</option>
            </select>
          </div>
        </div>
        <button className="gold-button" onClick={handleCreate}>Créer</button>
        <button className="cancel-button" onClick={onClose}>Annuler</button>
      </div>
    </div>
  );
}

