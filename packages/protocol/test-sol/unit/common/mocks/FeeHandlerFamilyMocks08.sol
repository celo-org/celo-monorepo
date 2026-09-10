// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "@celo-contracts-8/common/FeeHandler.sol";
import "@celo-contracts-8/common/MentoFeeHandlerSeller.sol";
import "@celo-contracts-8/common/UniswapFeeHandlerSeller.sol";

// Hack to force forge to compile the 0.8 FeeHandler family so they can be deployed
// (via deployCodeTo) from the 0.5 test files. These are plain `.sol` (not
// `.t.sol`) so forge does not treat them as test contracts.
contract FeeHandlerCompile is FeeHandler(true) {}

contract MentoFeeHandlerSellerCompile is MentoFeeHandlerSeller(true) {}

contract UniswapFeeHandlerSellerCompile is UniswapFeeHandlerSeller(true) {}
