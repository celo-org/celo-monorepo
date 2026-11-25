// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";
import { IMulticall3 } from "forge-std/interfaces/IMulticall3.sol";

import { GnosisSafe } from "safe-contracts/GnosisSafe.sol";
import { Enum } from "safe-contracts/common/Enum.sol";

import { IProxyAdmin } from "interfaces/universal/IProxyAdmin.sol";
import { IAnchorStateRegistry } from "interfaces/dispute/IAnchorStateRegistry.sol";
import { StorageSetter } from "src/universal/StorageSetter.sol";

contract SafeResetAnchorGame is Script {
  // This script requires running with --root and the following env vars:
  // ASR (required) - address of the AnchorStateRegistry proxy
  // PROXY_ADMIN (required) - address of the ProxyAdmin
  // SAFE (required) - address of the Gnosis Safe to execute the transaction
  // SENDER (required) - address of the sender in the Gnosis Safe
  // ANCHOR_GAME (required) - address of the new anchor game to set
  // SIG (optional) - signatures for the Safe transaction
  //
  // Slot layout changed between ASR versions due to inheritance changes:
  //   v2.2.2: anchorGame at slot 3 (superchainConfig packed w/ _initialized in slot 0, optimismPortal at slot 2)
  //   v3.5.0: anchorGame at slot 2 (systemConfig packed w/ _initialized in slot 0, no optimismPortal)

  address constant DETERMINISTIC_DEPLOYER = 0x4e59b44847b379578588920cA78FbF26c0B4956C;
  bytes32 constant SALT = bytes32("SafeResetAnchorGame");
  uint256 constant ANCHOR_GAME_SLOT = 2;

  error MissingSignatures();

  struct EnvConfig {
    address asr;
    address proxyAdmin;
    address safe;
    address sender;
    address anchorGame;
    bytes signatures;
  }

  function readEnv() internal view returns (EnvConfig memory) {
    return
      EnvConfig(
        vm.envAddress("ASR"),
        vm.envAddress("PROXY_ADMIN"),
        vm.envAddress("SAFE"),
        vm.envAddress("SENDER"),
        vm.envAddress("ANCHOR_GAME"),
        vm.envOr("SIG", bytes(""))
      );
  }

  function _storageSetterAddress() internal pure returns (address) {
    return
      computeCreate2Address(
        SALT,
        hashInitCode(type(StorageSetter).creationCode),
        DETERMINISTIC_DEPLOYER
      );
  }

  function _deployStorageSetterIfNeeded() internal returns (address) {
    address predicted_ = _storageSetterAddress();
    if (predicted_.code.length > 0) {
      console.log("StorageSetter already deployed at:", predicted_);
      return predicted_;
    }

    vm.startBroadcast();
    (bool success_, ) = DETERMINISTIC_DEPLOYER.call(
      abi.encodePacked(SALT, type(StorageSetter).creationCode)
    );
    vm.stopBroadcast();

    require(success_, "StorageSetter CREATE2 deploy failed");
    require(predicted_.code.length > 0, "StorageSetter not at predicted address");
    console.log("StorageSetter deployed at:", predicted_);
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
    address storageSetter_
  ) internal view returns (bytes memory) {
    address originalImpl_ = IProxyAdmin(config.proxyAdmin).getProxyImplementation(config.asr);
    console.log("Original ASR impl:", originalImpl_);

    // Read current anchor game for logging
    bytes32 currentSlot3_ = vm.load(config.asr, bytes32(uint256(ANCHOR_GAME_SLOT)));
    address currentAnchorGame_ = address(uint160(uint256(currentSlot3_)));
    console.log("Current anchorGame:", currentAnchorGame_);
    console.log("New anchorGame:", config.anchorGame);

    IMulticall3.Call3[] memory calls = new IMulticall3.Call3[](2);

    // upgradeAndCall: swap to StorageSetter and set slot 3 to new anchor game
    {
      bytes memory setterCalldata_ = abi.encodeWithSignature(
        "setAddress(bytes32,address)",
        bytes32(uint256(ANCHOR_GAME_SLOT)),
        config.anchorGame
      );

      calls[0] = IMulticall3.Call3(
        config.proxyAdmin,
        false,
        abi.encodeWithSelector(
          IProxyAdmin.upgradeAndCall.selector,
          config.asr,
          storageSetter_,
          setterCalldata_
        )
      );
    }

    // Restore original implementation
    calls[1] = IMulticall3.Call3(
      config.proxyAdmin,
      false,
      abi.encodeWithSelector(IProxyAdmin.upgrade.selector, config.asr, originalImpl_)
    );

    return abi.encodeWithSelector(IMulticall3.aggregate3.selector, calls);
  }

  function getTransactionHash() public view returns (bytes32) {
    EnvConfig memory config = readEnv();
    address storageSetter_ = _storageSetterAddress();

    console.log("ASR:", config.asr);
    console.log("ProxyAdmin:", config.proxyAdmin);
    console.log("Safe:", config.safe);
    console.log("StorageSetter:", storageSetter_);

    bytes memory calls = buildSafeTx(config, storageSetter_);
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

    console.log("ASR:", config.asr);
    console.log("ProxyAdmin:", config.proxyAdmin);
    console.log("Safe:", config.safe);

    // Deploy StorageSetter if needed
    address storageSetter_ = _deployStorageSetterIfNeeded();

    // Build tx
    bytes memory calls = buildSafeTx(config, storageSetter_);

    // Pre-state for verification
    bytes32 currentSlot3_ = vm.load(config.asr, bytes32(uint256(ANCHOR_GAME_SLOT)));
    address preAnchorGame_ = address(uint160(uint256(currentSlot3_)));
    console.log("Pre-exec anchorGame:", preAnchorGame_);

    // Exec tx
    _execSafe(config, calls);
    console.log("Transaction executed with Safe");

    // Verify
    {
      address actualAnchorGame_ = address(IAnchorStateRegistry(config.asr).anchorGame());

      console.log("Verified anchorGame:", actualAnchorGame_);

      require(actualAnchorGame_ == config.anchorGame, "anchorGame mismatch");
    }
  }
}
