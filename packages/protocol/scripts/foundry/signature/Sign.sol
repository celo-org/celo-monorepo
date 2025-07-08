// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import { Script } from "forge-std/Script.sol";
import { console2 as console } from "forge-std/console2.sol";

contract Sign is Script {
  function run() external {
    uint256 pk_ = vm.envUint("PK");
    bytes32 hash_ = vm.envBytes32("HASH");
    (uint8 v, bytes32 r, bytes32 s) = vm.sign(pk_, hash_);
    bytes memory sig_ = abi.encodePacked(r, s, v);
    console.logAddress(vm.addr(pk_));
    console.logBytes32(hash_);
    console.logBytes(sig_);
  }
}
