// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "@celo-contracts-8/common/MultiSig.sol";
import "@celo-contracts-8/governance/GovernanceApproverMultiSig.sol";
import "@celo-contracts-8/governance/ReleaseGoldMultiSig.sol";

// Hack to force forge to compile the 0.8 MultiSig family so they can be deployed
// (via deployCodeTo) from the 0.5 test files. These are plain `.sol` (not
// `.t.sol`) so forge does not treat them as test contracts.
contract MultiSigCompile is MultiSig(true) {}

contract GovernanceApproverMultiSigCompile is GovernanceApproverMultiSig(true) {}

contract ReleaseGoldMultiSigCompile is ReleaseGoldMultiSig(true) {}
