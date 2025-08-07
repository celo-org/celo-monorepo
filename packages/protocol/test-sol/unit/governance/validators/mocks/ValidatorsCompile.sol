// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "@celo-contracts-8/governance/Validators.sol";

// Hack to force forge to compile the Validators contract
contract ValidatorsCompile is Validators(true) {}
