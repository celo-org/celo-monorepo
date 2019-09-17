pragma solidity ^0.5.3;


interface IReserve {

  function initialize(address, uint256) external;
  function setTobinTaxStalenessThreshold(uint256) external;
  function addToken(address) external returns (bool);
  function removeToken(address, uint256) external returns (bool);
  function transferGold(address, uint256) external returns (bool);
  function getOrComputeTobinTax() external returns (uint256, uint256);
  function getTokens() external view returns (address[] memory);
}
