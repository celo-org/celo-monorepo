// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";
import { console2 } from "forge-std/console2.sol";

import { Bytes } from "src/libraries/Bytes.sol";
import { Blueprint } from "src/libraries/Blueprint.sol";
import { GameType, GameTypes, Duration } from "src/dispute/lib/Types.sol";

import { IAnchorStateRegistry } from "interfaces/dispute/IAnchorStateRegistry.sol";
import { IDelayedWETH } from "interfaces/dispute/IDelayedWETH.sol";
import { IDisputeGame } from "interfaces/dispute/IDisputeGame.sol";
import { IDisputeGameFactory } from "interfaces/dispute/IDisputeGameFactory.sol";
import { IFaultDisputeGame } from "interfaces/dispute/IFaultDisputeGame.sol";
import { IPermissionedDisputeGame } from "interfaces/dispute/IPermissionedDisputeGame.sol";
import { IOPContractsManager } from "interfaces/L1/IOPContractsManager.sol";

contract RedeployGames is Script {
  struct Blueprints {
    address permissionedDisputeGame1;
    address permissionedDisputeGame2;
    address permissionlessDisputeGame1;
    address permissionlessDisputeGame2;
  }

  function run() external {
    console.log("Starting redeployment of dispute games...");

    IOPContractsManager oldOpcm_ = IOPContractsManager(vm.envAddress("OPCM"));
    console.log("Old OPCM:", address(oldOpcm_));

    IOPContractsManager.Blueprints memory oldBlueprints_ = oldOpcm_.blueprints();
    Blueprints memory blueprints_ = Blueprints({
      permissionedDisputeGame1: oldBlueprints_.permissionedDisputeGame1,
      permissionedDisputeGame2: oldBlueprints_.permissionedDisputeGame2,
      permissionlessDisputeGame1: oldBlueprints_.permissionlessDisputeGame1,
      permissionlessDisputeGame2: oldBlueprints_.permissionlessDisputeGame2
    });
    console.log("Old PermissionedDisputeGame blueprint 1:", blueprints_.permissionedDisputeGame1);
    console.log("Old PermissionedDisputeGame blueprint 2:", blueprints_.permissionedDisputeGame2);
    console.log(
      "Old PermissionlessDisputeGame blueprint 1:",
      blueprints_.permissionlessDisputeGame1
    );
    console.log(
      "Old PermissionlessDisputeGame blueprint 2:",
      blueprints_.permissionlessDisputeGame2
    );

    IDisputeGameFactory factory_ = IDisputeGameFactory(vm.envAddress("FACTORY"));
    console.log("DisputeGameFactory:", address(factory_));

    IPermissionedDisputeGame oldPermissionedGame_ = IPermissionedDisputeGame(
      address(factory_.gameImpls(GameTypes.PERMISSIONED_CANNON))
    );
    console.log("Old PermissionedDisputeGame:", address(oldPermissionedGame_));
    IFaultDisputeGame oldPermissionlessGame_ = IFaultDisputeGame(
      address(factory_.gameImpls(GameTypes.CANNON))
    );
    console.log("Old PermissionlessDisputeGame:", address(oldPermissionlessGame_));
    uint256 chainId_ = oldPermissionedGame_.l2ChainId();
    console.log("L2 Chain ID:", chainId_);

    address systemConfigProxy_ = vm.envAddress("SYSTEM_CONFIG");
    console.log("SystemConfig proxy:", systemConfigProxy_);
    uint256 maxClock_ = vm.envUint("MAX_CLOCK_DURATION");
    console.log("New max clock duration (seconds):", maxClock_);

    vm.startBroadcast();
    deployAndSetNewGameImpl({
      _l2ChainId: chainId_,
      _disputeGame: IDisputeGame(address(oldPermissionedGame_)),
      _gameType: GameTypes.PERMISSIONED_CANNON,
      _blueprints: blueprints_,
      _systemConfig: systemConfigProxy_,
      _maxClock: uint64(maxClock_)
    });
    if (address(oldPermissionlessGame_) != address(0)) {
      deployAndSetNewGameImpl({
        _l2ChainId: chainId_,
        _disputeGame: IDisputeGame(address(oldPermissionlessGame_)),
        _gameType: GameTypes.CANNON,
        _blueprints: blueprints_,
        _systemConfig: systemConfigProxy_,
        _maxClock: uint64(maxClock_)
      });
    }
    vm.stopBroadcast();
    console.log("Redeployment of dispute games complete.");
  }

  function deployAndSetNewGameImpl(
    uint256 _l2ChainId,
    IDisputeGame _disputeGame,
    GameType _gameType,
    Blueprints memory _blueprints,
    address _systemConfig,
    uint64 _maxClock
  ) internal {
    console.log("Deploying new implementation for game type:", GameType.unwrap(_gameType));

    // Get the constructor params for the game
    IFaultDisputeGame.GameConstructorParams memory params_ = getGameConstructorParams(
      IFaultDisputeGame(address(_disputeGame))
    );

    // Modify the params with the new vm values.
    params_.maxClockDuration = Duration.wrap(_maxClock);

    IDisputeGame newGame;
    if (GameType.unwrap(_gameType) == GameType.unwrap(GameTypes.PERMISSIONED_CANNON)) {
      address proposer = IPermissionedDisputeGame(address(_disputeGame)).proposer();
      console.log("Proposer:", proposer);
      address challenger = IPermissionedDisputeGame(address(_disputeGame)).challenger();
      console.log("Challenger:", challenger);
      console2.log("Clock extension (seconds):", uint64(Duration.unwrap(params_.clockExtension)));
      console2.log(
        "Split depth extension (seconds):",
        uint64(Duration.unwrap(params_.clockExtension)) * 2
      );
      console2.log("Challenge period (seconds):", params_.vm.oracle().challengePeriod());
      console2.log(
        "Max game depth extension (seconds):",
        params_.clockExtension.raw() + params_.vm.oracle().challengePeriod()
      );
      console2.log(
        "Max clock duration (seconds):",
        uint64(Duration.unwrap(params_.maxClockDuration))
      );
      newGame = IDisputeGame(
        Blueprint.deployFrom(
          _blueprints.permissionedDisputeGame1,
          _blueprints.permissionedDisputeGame2,
          computeSalt(_l2ChainId, reusableSaltMixer(_systemConfig), "PermissionedDisputeGame"),
          encodePermissionedFDGConstructor(params_, proposer, challenger)
        )
      );
      console.log("New PermissionedDisputeGame:", address(newGame));
    } else {
      newGame = IDisputeGame(
        Blueprint.deployFrom(
          _blueprints.permissionlessDisputeGame1,
          _blueprints.permissionlessDisputeGame2,
          computeSalt(_l2ChainId, reusableSaltMixer(_systemConfig), "PermissionlessDisputeGame"),
          encodePermissionlessFDGConstructor(params_)
        )
      );
      console.log("New PermissionlessDisputeGame:", address(newGame));
    }
  }

  function computeSalt(
    uint256 _l2ChainId,
    string memory _saltMixer,
    string memory _contractName
  ) internal pure returns (bytes32) {
    bytes32 salt_ = keccak256(abi.encode(_l2ChainId, _saltMixer, _contractName));
    console.log("Computed salt:");
    console.logBytes32(salt_);
    return salt_;
  }

  function encodePermissionlessFDGConstructor(
    IFaultDisputeGame.GameConstructorParams memory _params
  ) internal view virtual returns (bytes memory) {
    bytes memory dataWithSelector_ = abi.encodeCall(IFaultDisputeGame.__constructor__, (_params));
    return Bytes.slice(dataWithSelector_, 4);
  }

  function encodePermissionedFDGConstructor(
    IFaultDisputeGame.GameConstructorParams memory _params,
    address _proposer,
    address _challenger
  ) internal view virtual returns (bytes memory) {
    bytes memory dataWithSelector_ = abi.encodeCall(
      IPermissionedDisputeGame.__constructor__,
      (_params, _proposer, _challenger)
    );
    return Bytes.slice(dataWithSelector_, 4);
  }

  function reusableSaltMixer(address _systemConfigProxy) internal pure returns (string memory) {
    string memory mixer_ = string(bytes.concat(bytes32(uint256(uint160(_systemConfigProxy)))));
    return mixer_;
  }

  /// @notice Retrieves the constructor params for a given game.
  function getGameConstructorParams(
    IFaultDisputeGame _disputeGame
  ) internal view returns (IFaultDisputeGame.GameConstructorParams memory) {
    return
      IFaultDisputeGame.GameConstructorParams({
        gameType: _disputeGame.gameType(),
        absolutePrestate: _disputeGame.absolutePrestate(),
        maxGameDepth: _disputeGame.maxGameDepth(),
        splitDepth: _disputeGame.splitDepth(),
        clockExtension: _disputeGame.clockExtension(),
        maxClockDuration: _disputeGame.maxClockDuration(),
        vm: _disputeGame.vm(),
        weth: _disputeGame.weth(),
        anchorStateRegistry: _disputeGame.anchorStateRegistry(),
        l2ChainId: _disputeGame.l2ChainId()
      });
  }
}
