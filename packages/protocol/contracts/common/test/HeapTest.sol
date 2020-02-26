pragma solidity ^0.5.3;

import "../libraries/Heap.sol";

contract HeapTest {
  using FixidityLib for FixidityLib.Fraction;

  function swapKeys(uint256[] memory keys, uint256 i, uint256 j) internal {
    uint256 tmp = keys[i];
    keys[i] = keys[j];
    keys[j] = tmp;
  }

  function sort(uint256[] memory intValues) public returns (uint256[] memory) {
    uint256 length = intValues.length;
    FixidityLib.Fraction[] memory values = new FixidityLib.Fraction[](length);
    uint256[] memory keys = new uint256[](length);
    for (uint256 i = 0; i < length; i++) {
      keys[i] = i;
      values[i] = FixidityLib.wrap(intValues[i]);
    }
    // heapify
    for (uint256 start = length / 2; start >= 0; start--) {
      Heap.siftDown(keys, values, start, length);
    }
    for (uint256 end = length; end > 0; end--) {
      swapKeys(keys, end - 1, 0);
      Heap.siftDown(keys, values, 0, end - 2);
    }
    uint256[] memory result = new uint256[](length);
    for (uint256 i = 0; i < length; i++) {
      result[i] = values[keys[i]].unwrap();
    }
    return result;
  }

}
