pragma solidity ^0.5.13;

import "../Initializable.sol";

contract HasInitializer is Initializable(true) {
  uint256 public x;

  function initialize(uint256 _x) external initializer {
    x = _x;
  }
}
