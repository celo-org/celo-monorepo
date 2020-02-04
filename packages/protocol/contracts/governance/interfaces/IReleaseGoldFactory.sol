pragma solidity ^0.5.3;

interface IReleaseGoldFactory {
  function createReleaseGoldInstance(
    uint256,
    uint256,
    uint256,
    uint256,
    uint256,
    bool,
    address payable,
    address payable,
    bool,
    bool,
    bool
  ) external returns (address);
}
