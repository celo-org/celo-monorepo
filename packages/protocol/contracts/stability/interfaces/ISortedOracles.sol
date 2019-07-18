pragma solidity ^0.5.8;


interface ISortedOracles {

  function addOracle(address, address) external;
  function removeOracle(address, address, uint256) external;
  function report(address, uint128, uint128, address, address) external;
  function removeExpiredReports(address, uint256) external;
  function numRates(address) external view returns (uint256);
  function medianRate(address) external view returns (uint128, uint128);
  function numTimestamps(address) external view returns (uint256);
  function medianTimestamp(address) external view returns (uint128);
}
