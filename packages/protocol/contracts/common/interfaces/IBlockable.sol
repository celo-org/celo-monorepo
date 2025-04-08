pragma solidity >=0.5.13 <0.9.0;

interface IBlockable {
  function setBlockedByContract(address _blockedBy) external;
  function isBlocked() external view returns (bool);
  function getBlockedByContract() external view returns (address);
}
