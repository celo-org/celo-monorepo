// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

import { Hash, GameId, GameType, Timestamp, Claim } from "src/dispute/lib/Types.sol";
import { IDisputeGame } from "interfaces/dispute/IDisputeGame.sol";

contract DisputeGameFactoryPrunner {
  event GamePruned(
    uint256 indexed index,
    GameId indexed gameId,
    Hash indexed gameUUID,
    GameType gameType,
    address gameProxy
  );

  uint256[103] internal __gap; // slots 0...102
  mapping(Hash => GameId) internal _disputeGames; // slot 103
  GameId[] internal _disputeGameList; // slot 104

  function pruneGames(uint256 _desiredLength) external {
    require(_desiredLength <= _disputeGameList.length, "Desired length exceeds current length");
    while (_disputeGameList.length > _desiredLength) {
      // Retrieve game id to prune
      uint256 gameIndex_ = _disputeGameList.length - 1;
      GameId gameId_ = _disputeGameList[gameIndex_];

      // Unpack game id
      (GameType gameType_, Timestamp timestamp_, address proxy_) = gameId_.unpack();

      // Load game data
      IDisputeGame game_ = IDisputeGame(proxy_);
      Claim rootClaim_ = game_.rootClaim();
      bytes memory extraData_ = game_.extraData();

      // Compute game hash
      Hash uuid_ = getGameUUID(gameType_, rootClaim_, extraData_);

      // Delete game from storage
      _disputeGames[uuid_] = GameId.wrap(bytes32(0));
      _disputeGameList.pop();

      // Emit event
      emit GamePruned(gameIndex_, gameId_, uuid_, gameType_, proxy_);
    }
  }

  function getGameUUID(
    GameType _gameType,
    Claim _rootClaim,
    bytes memory _extraData
  ) public pure returns (Hash uuid_) {
    uuid_ = Hash.wrap(keccak256(abi.encode(_gameType, _rootClaim, _extraData)));
  }
}
