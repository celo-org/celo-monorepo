// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";

import { GnosisSafe } from "safe-contracts/GnosisSafe.sol";
import { Enum } from "safe-contracts/common/Enum.sol";

import { ISystemConfig } from "interfaces/L1/ISystemConfig.sol";

contract SafeSystemConfigOwner is Script {
  // This script requires running with --root and the following env vars:
  // SYSTEM_CONFIG (required) - address of the SystemConfig proxy
  // SAFE (required) - address of the Gnosis Safe (current owner)
  // SENDER (required) - address of the sender in the Gnosis Safe
  // NEW_OWNER (required) - address of the new owner (Safe or EOA)
  // SIG (optional) - signatures for the Safe transaction

  error MissingSignatures();

  struct EnvConfig {
    address systemConfig;
    address safe;
    address sender;
    address newOwner;
    bytes signatures;
  }

  function readEnv() internal view returns (EnvConfig memory) {
    return
      EnvConfig(
        vm.envAddress("SYSTEM_CONFIG"),
        vm.envAddress("SAFE"),
        vm.envAddress("SENDER"),
        vm.envAddress("NEW_OWNER"),
        vm.envOr("SIG", bytes(""))
      );
  }

  function _logConfig(EnvConfig memory config) internal view {
    console.log("SystemConfig:", config.systemConfig);
    console.log("Safe:", config.safe);
    console.log("New Owner:", config.newOwner);
    console.log("Current owner:", ISystemConfig(config.systemConfig).owner());
  }

  function _transferCalldata(address newOwner_) internal pure returns (bytes memory) {
    return abi.encodeWithSelector(ISystemConfig.transferOwnership.selector, newOwner_);
  }

  function _hashSafe(EnvConfig memory config, bytes memory data) internal view returns (bytes32) {
    GnosisSafe safe = GnosisSafe(payable(config.safe));
    return
      safe.getTransactionHash(
        config.systemConfig,
        0, // value
        data,
        Enum.Operation(0), // call
        0, // safeTxGas
        0, // baseGas
        0, // gasPrice
        address(0), // gasToken
        config.sender, // refundReceiver
        safe.nonce()
      );
  }

  function _execSafe(EnvConfig memory config, bytes memory data) internal {
    GnosisSafe safe = GnosisSafe(payable(config.safe));
    vm.startBroadcast();
    safe.execTransaction(
      config.systemConfig,
      0, // value
      data,
      Enum.Operation(0), // call
      0, // safeTxGas
      0, // baseGas
      0, // gasPrice
      address(0), // gasToken
      payable(config.sender), // refundReceiver
      config.signatures
    );
    vm.stopBroadcast();
  }

  function getTransactionHash() public view returns (bytes32) {
    EnvConfig memory config = readEnv();
    _logConfig(config);

    bytes32 txHash = _hashSafe(config, _transferCalldata(config.newOwner));

    console.log("Transaction hash for Safe:");
    console.logBytes32(txHash);

    return txHash;
  }

  function execTransaction() public {
    EnvConfig memory config = readEnv();
    if (config.signatures.length == 0) revert MissingSignatures();

    _logConfig(config);
    require(
      ISystemConfig(config.systemConfig).owner() == config.safe,
      "Safe is not the current SystemConfig owner"
    );

    _execSafe(config, _transferCalldata(config.newOwner));
    console.log("Transaction executed with Safe");

    address actualOwner = ISystemConfig(config.systemConfig).owner();
    console.log("Verified new owner:", actualOwner);
    require(actualOwner == config.newOwner, "Owner mismatch after transfer");
  }
}
