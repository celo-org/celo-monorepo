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
import { GameType } from "src/dispute/lib/Types.sol";

contract SafeRetireASR is Script {
  // This script requires running with --root and the following env vars:
  // ASR (required) - address of the AnchorStateRegistry proxy
  // PROXY_ADMIN (required) - address of the ProxyAdmin
  // SAFE (required) - address of the Gnosis Safe to execute the transaction
  // SENDER (required) - address of the sender in the Gnosis Safe
  // SIG (optional) - signatures for the Safe transaction
  // RETIREMENT_TIMESTAMP (optional) - explicit unix timestamp; defaults to block.timestamp - 30 days
  //
  // Slot 6 is packed: respectedGameType (uint32, offset 0) + retirementTimestamp (uint64, offset 4)
  // Packed as: (uint256(retirementTimestamp) << 32) | uint256(respectedGameType)

  address constant DETERMINISTIC_DEPLOYER = 0x4e59b44847b379578588920cA78FbF26c0B4956C;
  bytes32 constant SALT = bytes32("SafeRetireASR");
  uint256 constant SLOT_6 = 6;

  error MissingSignatures();

  struct EnvConfig {
    address asr;
    address proxyAdmin;
    address safe;
    address sender;
    uint64 retirementTimestamp;
    bytes signatures;
  }

  function readEnv() internal view returns (EnvConfig memory) {
    return
      EnvConfig(
        vm.envAddress("ASR"),
        vm.envAddress("PROXY_ADMIN"),
        vm.envAddress("SAFE"),
        vm.envAddress("SENDER"),
        uint64(vm.envOr("RETIREMENT_TIMESTAMP", uint256(0))),
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

  function _resolveTimestamp(uint64 ts_) internal view returns (uint64) {
    if (ts_ != 0) return ts_;
    require(block.timestamp > 30 days, "block.timestamp too small for 30-day offset");
    return uint64(block.timestamp - 30 days);
  }

  // Reads slot 6, preserves respectedGameType, packs with new retirementTimestamp
  function _packSlot6(address asr_, uint64 newTimestamp_) internal view returns (bytes32, uint32) {
    bytes32 currentSlot6_ = vm.load(asr_, bytes32(uint256(SLOT_6)));
    uint32 gameType_ = uint32(uint256(currentSlot6_));
    bytes32 newSlot6_ = bytes32((uint256(newTimestamp_) << 32) | uint256(gameType_));
    return (newSlot6_, gameType_);
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

    IMulticall3.Call3[] memory calls = new IMulticall3.Call3[](2);

    // Scope: compute packed slot and build upgradeAndCall entry
    {
      uint64 newTimestamp_ = _resolveTimestamp(config.retirementTimestamp);
      (bytes32 newSlot6_, uint32 gameType_) = _packSlot6(config.asr, newTimestamp_);

      console.log("respectedGameType:", gameType_);
      console.log("New retirementTimestamp:", uint256(newTimestamp_));
      console.logBytes32(newSlot6_);

      // Explicit signature to disambiguate setBytes32 overload
      bytes memory setterCalldata_ = abi.encodeWithSignature(
        "setBytes32(bytes32,bytes32)",
        bytes32(uint256(SLOT_6)),
        newSlot6_
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
    uint64 newTimestamp_ = _resolveTimestamp(config.retirementTimestamp);
    (, uint32 preGameType_) = _packSlot6(config.asr, newTimestamp_);

    // Exec tx
    _execSafe(config, calls);
    console.log("Transaction executed with Safe");

    // Verify
    {
      uint64 actualTimestamp_ = IAnchorStateRegistry(config.asr).retirementTimestamp();
      uint32 actualGameType_ = GameType.unwrap(
        IAnchorStateRegistry(config.asr).respectedGameType()
      );

      console.log("Verified retirementTimestamp:", uint256(actualTimestamp_));
      console.log("Verified respectedGameType:", actualGameType_);

      require(actualTimestamp_ == newTimestamp_, "retirementTimestamp mismatch");
      require(actualGameType_ == preGameType_, "respectedGameType corrupted");
    }
  }
}
