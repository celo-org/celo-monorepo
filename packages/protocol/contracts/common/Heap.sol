pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../common/FixidityLib.sol";

library Heap {
  using FixidityLib for FixidityLib.Fraction;
  using SafeMath for uint256;

  /**
   * @notice Fixes the heap invariant if top has been changed.
   */
  function heapifyDown(uint256[] memory keys, FixidityLib.Fraction[] memory values) internal pure {
    uint256 i = 0;
    while (true) {
      uint256 leftChild = i.mul(2).add(1);
      uint256 rightChild = i.mul(2).add(2);
      uint256 maxIndex = i;
      if (leftChild < keys.length && values[keys[leftChild]].gt(values[keys[maxIndex]])) {
        maxIndex = leftChild;
      }
      if (rightChild < keys.length && values[keys[rightChild]].gt(values[keys[maxIndex]])) {
        maxIndex = rightChild;
      }
      if (maxIndex == i) break;
      uint256 tmpKey = keys[i];
      keys[i] = keys[maxIndex];
      keys[maxIndex] = tmpKey;
      i = maxIndex;
    }
  }
}
