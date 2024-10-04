pragma solidity >=0.5.13 < 0.9;

interface IBlockable {
  function setBlockedByContract(address _blockedBy) external;
  function isBlocked() external view returns (bool);
  function getBlockedbyContract() external view returns (address);
}
