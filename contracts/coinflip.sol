// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Coinflip {
    struct Game {
        address payable player1;
        address payable player2;
        uint256 betAmount;
        address payable winner;
        uint256 createTime;
        bool player1Choice;
    }

    uint256 private gameID = 0;
    mapping(uint256 => Game) private games;
    mapping(address => uint256) public transactionVolume;

    event GameCreated(uint256 indexed gameID, address indexed player1, uint256 betAmount, bool player1Choice);
    
    event GameJoined(uint256 indexed gameID, address indexed player2);
    
    function createGame(uint256 _amount, bool _choice) external payable {
        require(msg.value == _amount, "Incorrect amount sent");

        games[gameID] = Game({
            player1: payable(msg.sender),
            player2: payable(address(0)),
            betAmount: _amount,
            winner: payable(address(0)),
            createTime: block.timestamp,
            player1Choice: _choice
        });

        transactionVolume[msg.sender] += _amount;
        emit GameCreated(gameID, msg.sender, _amount, _choice);
        gameID++;
    }

    function joinGame(uint256 _gameID) external payable {
        Game storage game = games[_gameID];
        require(game.player1 != address(0), "Game does not exist");
        require(msg.value == game.betAmount, "Incorrect amount sent");
        require(game.player2 == address(0), "Game already has a second player");

        game.player2 = payable(msg.sender);
        transactionVolume[msg.sender] += msg.value;
        emit GameJoined(_gameID, msg.sender);
        flip(_gameID);
    }

    function randMod(uint _modulus, uint256 _gameID) internal returns(uint) {
        Game storage game = games[_gameID];
        game.betAmount++;
        return uint(keccak256(abi.encodePacked(block.timestamp, msg.sender, game.betAmount))) % _modulus;
    }

    function flip(uint256 _gameID) internal {
        Game storage game = games[_gameID];
        uint result = randMod(2, _gameID);
        bool player1Wins = (result == 0 && game.player1Choice) || (result == 1 && !game.player1Choice);
        game.winner = player1Wins ? game.player1 : game.player2;

        uint256 payout = game.betAmount * 398 / 200;
        game.winner.transfer(payout);
    }

    function refundIfNoOpponent(uint256 _gameID) external {
        Game storage game = games[_gameID];
        require(msg.sender == game.player1, "Only player1 can request a refund");
        require(game.player2 == address(0), "Game has a second player");

        uint256 refundAmount = game.betAmount;
        game.player1.transfer(refundAmount);
    }
    
    function getOpenGames() external view returns (uint256[] memory) {
        uint256 openCount = 0;
        for (uint256 i = 0; i < gameID; i++) {
            if (games[i].player2 == address(0)) {
                openCount++;
            }
        }
        uint256[] memory openGameIds = new uint256[](openCount);
        uint256 index = 0;
        for (uint256 i = 0; i < gameID; i++) {
            if (games[i].player2 == address(0)) {
                openGameIds[index] = i;
                index++;
            }
        }
        return openGameIds;
    }
    
    function getGame(uint256 _gameID) external view returns (
        address player1,
        address player2,
        uint256 betAmount,
        address winner,
        uint256 createTime,
        bool player1Choice
    ) {
        Game storage game = games[_gameID];
        return (
            game.player1,
            game.player2,
            game.betAmount,
            game.winner,
            game.createTime,
            game.player1Choice
        );
    }
}
