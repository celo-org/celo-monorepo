pragma solidity ^0.5.3;

interface ILockedGold {
  function incrementNonvotingAccountBalance(address, uint256) external;
  function decrementNonvotingAccountBalance(address, uint256) external;
  function getAccountTotalLockedGold(address) external view returns (uint256);
  function getTotalLockedGold() external view returns (uint256);
  function slash(
    address account,
    uint256 penalty,
    address reporter,
    uint256 reward,
    address[] calldata lessers,
    address[] calldata greaters,
    uint256[] calldata indices
  ) external;
  function isSlasher(address) external view returns (bool);
}
