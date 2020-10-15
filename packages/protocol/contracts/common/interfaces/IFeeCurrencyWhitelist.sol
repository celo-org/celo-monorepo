pragma solidity ^0.5.13;

interface IFeeCurrencyWhitelist {
  function addToken(address) external;
  function getWhitelist() external view returns (address[] memory);
}
