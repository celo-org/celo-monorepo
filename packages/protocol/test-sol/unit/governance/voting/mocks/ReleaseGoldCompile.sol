// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "@celo-contracts-8/governance/ReleaseGold.sol";

// Hack to force forge to compile the ReleaseGold contract so that
// `deployCodeTo("ReleaseGoldCompile", ...)` can resolve its artifact.
contract ReleaseGoldCompile is ReleaseGold(true) {}
