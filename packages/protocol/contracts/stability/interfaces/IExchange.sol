pragma solidity ^0.5.8;


interface IExchange {

  function initialize(
    address,
    address,
    uint256,
    uint256,
    uint256,
    uint256,
    uint256,
    uint256
  ) external;

  function exchange(uint256, uint256, bool) external returns (uint256);
  function setUpdateFrequency(uint256) external;
  function getBuyTokenAmount(uint256, bool) external view returns (uint256);
  function getSellTokenAmount(uint256, bool) external view returns (uint256);
  function getBuyAndSellBuckets(bool) external view returns (uint256, uint256);
}
