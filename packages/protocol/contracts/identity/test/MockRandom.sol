pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";


contract MockRandom {

  bytes32 public random;

  function setRandom(bytes32 value) external {
    random = value;
  }
}
