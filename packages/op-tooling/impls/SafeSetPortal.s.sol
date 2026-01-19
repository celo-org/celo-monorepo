// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";
import { IMulticall3 } from "forge-std/interfaces/IMulticall3.sol";

import { GnosisSafe } from "safe-contracts/GnosisSafe.sol";
import { Enum } from "safe-contracts/common/Enum.sol";

import { IProxyAdmin } from "interfaces/universal/IProxyAdmin.sol";

contract SafeSetPortal is Script {
  // This script requires running with --root and the following env vars:
  // PORTAL_PROXY (required) - address of the OptimismPortal2 proxy
  // PORTAL_IMPL (required) - address of the new OptimismPortal2 implementation
  // PROXY_ADMIN (required) - address of the ProxyAdmin managing the OptimismPortal
  // SAFE (required) - address of the Gnosis Safe to execute the transaction
  // SENDER (required) - address of the sender in the Gnosis Safe
  // SIG (optional) - signatures for the Safe transaction; if not provided, the transaction

  error MissingSignatures();

  struct EnvConfig {
    address proxy;
    address impl;
    address proxyAdmin;
    address safe;
    address sender;
    bytes signatures;
  }

  function readEnv() internal view returns (EnvConfig memory) {
    return
      EnvConfig(
        vm.envAddress("PORTAL_PROXY"),
        vm.envAddress("PORTAL_IMPL"),
        vm.envAddress("PROXY_ADMIN"),
        vm.envAddress("SAFE"),
        vm.envAddress("SENDER"),
        vm.envOr("SIG", bytes(hex"00"))
      );
  }

  function buildSafeTx(EnvConfig memory config) internal pure returns (bytes memory) {
    IMulticall3.Call3[] memory calls = new IMulticall3.Call3[](1);
    calls[0] = IMulticall3.Call3(
      config.proxyAdmin,
      false,
      abi.encodeWithSelector(IProxyAdmin.upgrade.selector, config.proxy, config.impl)
    );

    return abi.encodeWithSelector(IMulticall3.aggregate3.selector, calls);
  }

  function getTransactionHash() public view returns (bytes32) {
    EnvConfig memory config = readEnv();

    // Build tx
    bytes memory calls = buildSafeTx(config);

    // Build tx hash
    GnosisSafe safe = GnosisSafe(payable(config.safe));
    bytes32 txHash = safe.getTransactionHash(
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
    console.log("Transaction hash for Safe: ");
    console.logBytes32(txHash);

    return txHash;
  }

  function execTransaction() public {
    EnvConfig memory config = readEnv();
    if (config.signatures.length == 0) {
      revert MissingSignatures();
    }

    // Build tx
    bytes memory calls = buildSafeTx(config);

    // Exec tx
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
    console.log("Transaction executed with Safe");
  }
}
