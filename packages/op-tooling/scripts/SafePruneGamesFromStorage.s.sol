// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";
import { console2 } from "forge-std/console2.sol";
import { IMulticall3 } from "forge-std/interfaces/IMulticall3.sol";

import { GnosisSafe } from "safe-contracts/GnosisSafe.sol";
import { Enum } from "safe-contracts/common/Enum.sol";

import { GameType, GameId, Timestamp, Hash, Claim } from "src/dispute/lib/Types.sol";
import { IDisputeGame } from "interfaces/dispute/IDisputeGame.sol";
import { IDisputeGameFactory } from "interfaces/dispute/IDisputeGameFactory.sol";
import { IProxyAdmin } from "interfaces/universal/IProxyAdmin.sol";

/// @notice Temporary implementation that replaces DisputeGameFactory to prune games from storage.
///         Must mirror the DisputeGameFactory storage layout exactly.
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
      uint256 gameIndex_ = _disputeGameList.length - 1;
      GameId gameId_ = _disputeGameList[gameIndex_];

      (GameType gameType_, , address proxy_) = gameId_.unpack();

      IDisputeGame game_ = IDisputeGame(proxy_);
      Claim rootClaim_ = game_.rootClaim();
      bytes memory extraData_ = game_.extraData();

      Hash uuid_ = Hash.wrap(keccak256(abi.encode(gameType_, rootClaim_, extraData_)));

      _disputeGames[uuid_] = GameId.wrap(bytes32(0));
      _disputeGameList.pop();

      emit GamePruned(gameIndex_, gameId_, uuid_, gameType_, proxy_);
    }
  }
}

contract SafePruneGamesFromStorage is Script {
  // This script requires running with --root and the following env vars:
  // FACTORY (required) - address of the DisputeGameFactory proxy
  // PROXY_ADMIN (required) - address of the ProxyAdmin
  // SAFE (required) - address of the Gnosis Safe to execute the transaction
  // SENDER (required) - address of the sender in the Gnosis Safe
  // RETENTION_INDEX (required) - index up to which games are retained (games after this are pruned)
  // SIG (optional) - signatures for the Safe transaction

  address constant DETERMINISTIC_DEPLOYER = 0x4e59b44847b379578588920cA78FbF26c0B4956C;
  bytes32 constant SALT = bytes32("SafePruneGamesFromStorage");
  uint256 constant MAX_PRUNE = 500;

  error MissingSignatures();

  struct EnvConfig {
    address factory;
    address proxyAdmin;
    address safe;
    address sender;
    uint256 retentionIndex;
    bytes signatures;
  }

  function readEnv() internal view returns (EnvConfig memory) {
    return
      EnvConfig(
        vm.envAddress("FACTORY"),
        vm.envAddress("PROXY_ADMIN"),
        vm.envAddress("SAFE"),
        vm.envAddress("SENDER"),
        vm.envUint("RETENTION_INDEX"),
        vm.envOr("SIG", bytes(""))
      );
  }

  function _prunnerAddress() internal pure returns (address) {
    return
      computeCreate2Address(
        SALT,
        hashInitCode(type(DisputeGameFactoryPrunner).creationCode),
        DETERMINISTIC_DEPLOYER
      );
  }

  function _deployPrunnerIfNeeded() internal returns (address) {
    address predicted_ = _prunnerAddress();
    if (predicted_.code.length > 0) {
      console.log("DisputeGameFactoryPrunner already deployed at:", predicted_);
      return predicted_;
    }

    vm.startBroadcast();
    (bool success_, ) = DETERMINISTIC_DEPLOYER.call(
      abi.encodePacked(SALT, type(DisputeGameFactoryPrunner).creationCode)
    );
    vm.stopBroadcast();

    require(success_, "DisputeGameFactoryPrunner CREATE2 deploy failed");
    require(predicted_.code.length > 0, "DisputeGameFactoryPrunner not at predicted address");
    console.log("DisputeGameFactoryPrunner deployed at:", predicted_);
    return predicted_;
  }

  // Isolates the 10-param Safe getTransactionHash call
  function _hashSafe(EnvConfig memory config, bytes memory calls) internal view returns (bytes32) {
    GnosisSafe safe = GnosisSafe(payable(config.safe));
    return
      safe.getTransactionHash(
        MULTICALL3_ADDRESS,
        0, // value
        calls,
        Enum.Operation(1), // delegate call
        0, // safeTxGas
        0, // baseGas
        0, // gasPrice
        address(0), // gasToken
        config.sender, // refundReceiver
        safe.nonce()
      );
  }

  // Isolates the 10-param Safe execTransaction call
  function _execSafe(EnvConfig memory config, bytes memory calls) internal {
    GnosisSafe safe = GnosisSafe(payable(config.safe));
    vm.startBroadcast();
    safe.execTransaction(
      MULTICALL3_ADDRESS,
      0, // value
      calls,
      Enum.Operation(1), // delegate call
      0, // safeTxGas
      0, // baseGas
      0, // gasPrice
      address(0), // gasToken
      payable(config.sender), // refundReceiver
      config.signatures
    );
    vm.stopBroadcast();
  }

  function buildSafeTx(
    EnvConfig memory config,
    address prunner_
  ) internal view returns (bytes memory) {
    IDisputeGameFactory factory_ = IDisputeGameFactory(config.factory);
    address originalImpl_ = IProxyAdmin(config.proxyAdmin).getProxyImplementation(config.factory);
    console.log("Original factory impl:", originalImpl_);

    uint256 currentGameCount_ = factory_.gameCount();
    console.log("Current game count:", currentGameCount_);
    require(config.retentionIndex < currentGameCount_, "Retention index out of bounds");

    uint256 prunCount_ = (currentGameCount_ - 1) - config.retentionIndex;
    require(prunCount_ <= MAX_PRUNE, "Too many games to prune (max 500)");
    console.log("Games to prune:", prunCount_);

    uint256 targetLength_ = config.retentionIndex + 1;
    console.log("Target game count:", targetLength_);

    IMulticall3.Call3[] memory calls = new IMulticall3.Call3[](2);

    // upgradeAndCall: swap to prunner and prune games
    calls[0] = IMulticall3.Call3(
      config.proxyAdmin,
      false,
      abi.encodeWithSelector(
        IProxyAdmin.upgradeAndCall.selector,
        config.factory,
        prunner_,
        abi.encodeWithSelector(DisputeGameFactoryPrunner.pruneGames.selector, targetLength_)
      )
    );

    // Restore original implementation
    calls[1] = IMulticall3.Call3(
      config.proxyAdmin,
      false,
      abi.encodeWithSelector(IProxyAdmin.upgrade.selector, config.factory, originalImpl_)
    );

    return abi.encodeWithSelector(IMulticall3.aggregate3.selector, calls);
  }

  function getTransactionHash() public view returns (bytes32) {
    EnvConfig memory config = readEnv();
    address prunner_ = _prunnerAddress();

    console.log("Factory:", config.factory);
    console.log("ProxyAdmin:", config.proxyAdmin);
    console.log("Safe:", config.safe);
    console.log("RetentionIndex:", config.retentionIndex);
    console.log("DisputeGameFactoryPrunner:", prunner_);

    bytes memory calls = buildSafeTx(config, prunner_);
    bytes32 txHash = _hashSafe(config, calls);

    console.log("Transaction hash for Safe:");
    console.logBytes32(txHash);

    return txHash;
  }

  function execTransaction() public {
    EnvConfig memory config = readEnv();
    if (config.signatures.length == 0) {
      revert MissingSignatures();
    }

    console.log("Factory:", config.factory);
    console.log("ProxyAdmin:", config.proxyAdmin);
    console.log("Safe:", config.safe);
    console.log("RetentionIndex:", config.retentionIndex);

    // Deploy prunner if needed
    address prunner_ = _deployPrunnerIfNeeded();

    // Build tx
    bytes memory calls = buildSafeTx(config, prunner_);

    // Pre-state
    IDisputeGameFactory factory_ = IDisputeGameFactory(config.factory);
    uint256 preGameCount_ = factory_.gameCount();
    console.log("Pre-exec game count:", preGameCount_);

    // Exec tx
    _execSafe(config, calls);
    console.log("Transaction executed with Safe");

    // Verify
    {
      uint256 postGameCount_ = factory_.gameCount();
      uint256 expectedCount_ = config.retentionIndex + 1;
      console.log("Post-exec game count:", postGameCount_);

      require(postGameCount_ == expectedCount_, "Game count mismatch after pruning");

      // Log retained game at retention index
      (GameType gameType_, Timestamp timestamp_, IDisputeGame proxy_) = factory_.gameAtIndex(
        config.retentionIndex
      );
      console.log("Game retained at index:", config.retentionIndex);
      console2.log("  Type:", uint32(gameType_.raw()));
      console2.log("  Created:", uint64(timestamp_.raw()));
      console.log("  Proxy:", address(proxy_));
    }
  }
}
