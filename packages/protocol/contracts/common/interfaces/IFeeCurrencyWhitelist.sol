// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.5.13 <0.9.0;

interface IFeeCurrencyWhitelist {
  function initialize() external;
  function addToken(address) external;
  function getWhitelist() external view returns (address[] memory);
}
