pragma solidity ^0.5.3;

interface IVestingFactory {
  function createVestingInstance(
    address payable,
    uint256,
    uint256,
    uint256,
    uint256,
    uint256,
    bool,
    address payable,
    uint256
  ) external returns (address);
}
