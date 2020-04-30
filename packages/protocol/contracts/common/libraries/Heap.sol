pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../FixidityLib.sol";

/**
 * @title Simple heap implementation
 */
library Heap {
  using FixidityLib for FixidityLib.Fraction;
  using SafeMath for uint256;

  /**
   * @notice Fixes the heap invariant.
   * @param keys Pointers to values
   * @param values Values that are compared, only the pointers are changed by this method.
   * @param start Node for which the invariant might have changed.
   * @param length Size of the heap.
   */
  function siftDown(
    uint256[] memory keys,
    FixidityLib.Fraction[] memory values,
    uint256 start,
    uint256 length
  ) internal pure {
    require(keys.length == values.length, "key and value array length mismatch");
    require(start < keys.length, "heap start index out of range");
    require(length <= keys.length, "heap length out of range");
    uint256 i = start;
    while (true) {
      uint256 leftChild = i.mul(2).add(1);
      uint256 rightChild = i.mul(2).add(2);
      uint256 maxIndex = i;
      if (leftChild < length && values[keys[leftChild]].gt(values[keys[maxIndex]])) {
        maxIndex = leftChild;
      }
      if (rightChild < length && values[keys[rightChild]].gt(values[keys[maxIndex]])) {
        maxIndex = rightChild;
      }
      if (maxIndex == i) break;
      uint256 tmpKey = keys[i];
      keys[i] = keys[maxIndex];
      keys[maxIndex] = tmpKey;
      i = maxIndex;
    }
  }

  /**
   * @notice Fixes the heap invariant if top has been changed.
   * @param keys Pointers to values
   * @param values Values that are compared, only the pointers are changed by this method.
   */
  function heapifyDown(uint256[] memory keys, FixidityLib.Fraction[] memory values) internal pure {
    siftDown(keys, values, 0, keys.length);
  }

}
