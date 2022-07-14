pragma solidity ^0.5.13;

/**
 * @notice Sqrt helper library
 * @dev https://github.com/Uniswap/v2-core/blob/v1.0.1/contracts/libraries/Math.sol
 */
library BabylonianMath {
  // babylonian method (https://en.wikipedia.org/wiki/Methods_of_computing_square_roots#Babylonian_method)
  function sqrt(uint256 y) internal pure returns (uint256 z) {
    if (y > 3) {
      z = y;
      uint256 x = y / 2 + 1;
      while (x < z) {
        z = x;
        x = (y / x + x) / 2;
      }
    } else if (y != 0) {
      z = 1;
    }
  }
}
