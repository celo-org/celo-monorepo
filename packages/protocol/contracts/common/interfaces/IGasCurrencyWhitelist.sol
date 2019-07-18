pragma solidity ^0.5.8;


interface IGasCurrencyWhitelist {

  function initialize() external;
  function addToken(address) external;
  function getWhitelist() external view returns (address[] memory);
}
