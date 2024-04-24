// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IOracle {
  function getExchangeRateFor(address identifier)
    external
    view
    returns (uint256 numerator, uint256 denominator);
}
