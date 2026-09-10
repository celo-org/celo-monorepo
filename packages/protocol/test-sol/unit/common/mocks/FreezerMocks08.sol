// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "@celo-contracts-8/common/Freezer.sol";

// Hack to force forge to compile the 0.8 Freezer so it can be
// deployed (via deployCodeTo) from the 0.5 test files.
contract FreezerCompile is Freezer(true) {}
