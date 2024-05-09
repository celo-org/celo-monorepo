// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.5.13 <0.9.0;

interface IBlockchainParametersInitializer {
  function initialize(
    uint256 _gasForNonGoldCurrencies,
    uint256 gasLimit,
    uint256 lookbackWindow
  ) external;
}
