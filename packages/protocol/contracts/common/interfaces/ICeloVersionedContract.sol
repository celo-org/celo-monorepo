pragma solidity ^0.5.3;

interface ICeloVersionedContract {
  function getVersionNumber() external pure returns (uint256, uint256, uint256, uint256);
}
