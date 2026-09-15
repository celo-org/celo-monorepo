// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "@celo-contracts-8/governance/LockedGold.sol";

// Hack to force forge to compile the 0.8 LockedGold contract so it can be
// deployed (via deployCodeTo) from the 0.5 test files.
contract LockedGoldCompile is LockedGold(true) {}
