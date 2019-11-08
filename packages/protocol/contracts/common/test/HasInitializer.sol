pragma solidity ^0.5.3;

import "../Initializable.sol";

contract HasInitializer is Initializable {
  uint256 public x;

  function initialize(uint256 _x) external initializer {
    x = _x;
  }
}
