// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import { Script } from "forge-std/Script.sol";
import { console2 as console } from "forge-std/console2.sol";

import { ECDSA } from "@openzeppelin/contracts8/utils/cryptography/ECDSA.sol";

contract Recover is Script {
  function run() external {
    bytes32 hash_ = vm.envBytes32("HASH");
    bytes memory sig_ = vm.envBytes("SIG");
    address signer_ = ECDSA.recover(hash_, sig_);
    console.logBytes32(hash_);
    console.logBytes(sig_);
    console.logAddress(signer_);
  }
}
