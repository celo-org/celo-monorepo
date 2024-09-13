// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;

import "celo-foundry/Test.sol";
import "@celo-contracts/common/libraries/Heap.sol";

contract HeapMock {
  using FixidityLib for FixidityLib.Fraction;

  function swapKeys(uint256[] memory keys, uint256 i, uint256 j) internal pure {
    uint256 tmp = keys[i];
    keys[i] = keys[j];
    keys[j] = tmp;
  }

  function sort(uint256[] memory intValues) public pure returns (uint256[] memory) {
    uint256 length = intValues.length;
    FixidityLib.Fraction[] memory values = new FixidityLib.Fraction[](length);
    uint256[] memory keys = new uint256[](length);
    for (uint256 i = 0; i < length; i++) {
      keys[i] = i;
      values[i] = FixidityLib.wrap(intValues[i]);
    }
    // heapify
    for (int256 start = int256(length / 2); start >= 0; start--) {
      Heap.siftDown(keys, values, uint256(start), length);
    }
    for (uint256 end = length; end > 0; end--) {
      swapKeys(keys, end - 1, 0);
      Heap.siftDown(keys, values, 0, end - 1);
    }
    uint256[] memory result = new uint256[](length);
    for (uint256 i = 0; i < length; i++) {
      result[i] = values[keys[i]].unwrap();
    }
    return result;
  }
}

contract HeapTest is Test {
  HeapMock heapTest;

  mapping(uint256 => bool) public helperMapping;

  function setUp() public {
    heapTest = new HeapMock();
  }

  function generatePRN(uint256 min, uint256 max, uint256 salt) public view returns (uint256) {
    return
      (uint256(keccak256(abi.encodePacked(block.timestamp, block.difficulty, msg.sender, salt))) %
        (max - min + 1)) + min;
  }

  function generateRandomArray(
    uint256 min,
    uint256 max,
    uint256 length,
    bool repeatingAllowed
  ) public returns (uint256[] memory) {
    require(max > min, "Max must be greater than min");
    require(length <= (max - min + 1) || repeatingAllowed, "Not enough unique numbers available");

    uint256[] memory array = new uint256[](length);

    for (uint256 i = 0; i < length; ) {
      uint256 randomNumber = generatePRN(min, max, i);

      if (repeatingAllowed) {
        array[i] = randomNumber;
        i++;
      } else {
        if (!helperMapping[randomNumber]) {
          array[i] = randomNumber;
          i++;
        } else {
          helperMapping[randomNumber] = true;
        }
      }
    }

    if (!repeatingAllowed) {
      for (uint256 i = 0; i < length; i++) {
        helperMapping[array[i]] = false;
      }
    }

    return array;
  }

  function test_SortWithRandomListsNonRepeatingItems() public {
    for (uint256 i = 0; i < 1000; i++) {
      uint256[] memory array = generateRandomArray(0, 10, 10, false);
      uint256[] memory sortedArray = heapTest.sort(array);
      for (uint256 j = 0; j < 9; j++) {
        assertEq(sortedArray[j] <= sortedArray[j + 1], true, "Array is not sorted");
      }
    }
  }

  function test_SortWithRandomListsRepeatingItems() public {
    for (uint256 i = 0; i < 1000; i++) {
      uint256[] memory array = generateRandomArray(0, 10, 10, true);
      uint256[] memory sortedArray = heapTest.sort(array);
      for (uint256 j = 0; j < 9; j++) {
        assertEq(sortedArray[j] <= sortedArray[j + 1], true, "Array is not sorted");
      }
    }
  }
}
