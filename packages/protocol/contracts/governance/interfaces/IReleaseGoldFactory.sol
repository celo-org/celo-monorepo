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
    address,
    address payable,
    bool,
    uint256,
    bool,
    bool
  ) external returns (address);
}
