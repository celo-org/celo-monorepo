pragma solidity >=0.5.13 <0.9.0;

interface IBlockable {
  function isBlocked() external view returns (bool);
  function getBlockedbyContract() external view returns (address);
  function setBlockedByContract(address _blockedBy) external;
}
