pragma solidity ^0.5.8;

import "fixidity/contracts/FixidityLib.sol";


contract UsingFixidity {
  using FixidityLib for int256;

  int256 public constant FIXED1 = 1000000000000000000000000;
  int256 public constant FIXED_HALF = 500000000000000000000000;

  function toFixed(uint256 n) internal pure returns (int256) {
    return int256(n).newFixed();
  }
}
