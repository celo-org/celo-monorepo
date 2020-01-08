pragma solidity ^0.5.3;

interface IVestingFactory {
  function createVestingInstance(
    address,
    uint256,
    uint256,
    uint256,
    uint256,
    uint256,
    bool,
    address,
    address
  ) external returns (address);
}
