pragma solidity >=0.5.13 <0.9.0;

import "@openzeppelin/contracts8/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts8/utils/Strings.sol";

import "celo-foundry-8/Test.sol";

contract Utils08 is Test {
  using EnumerableSet for EnumerableSet.AddressSet;
  using Strings for uint256;

  EnumerableSet.AddressSet addressSet;

  function timeTravel(uint256 timeDelta) public {
    vm.warp(block.timestamp + timeDelta);
  }

  function blockTravel(uint256 blockDelta) public {
    vm.roll(block.number + blockDelta);
  }

  function assertAlmostEqual(uint256 actual, uint256 expected, uint256 margin) public {
    uint256 diff = actual > expected ? actual - expected : expected - actual;
    assertTrue(diff <= margin, string(abi.encodePacked("Difference is ", diff.toString())));
  }

  function arraysEqual(address[] memory arr1, address[] memory arr2) public returns (bool) {
    if (arr1.length != arr2.length) {
      return false; // Arrays of different lengths cannot be equal
    }

    // Add addresses from arr1 to the set
    for (uint256 i = 0; i < arr1.length; i++) {
      addressSet.add(arr1[i]);
    }

    // Check if each address in arr2 is in the set
    for (uint256 i = 0; i < arr2.length; i++) {
      if (!addressSet.contains(arr2[i])) {
        clearSet(arr1);
        return false;
      }
    }

    clearSet(arr1);
    return true;
  }

  function clearSet(address[] memory arr1) private {
    for (uint256 i = 0; i < arr1.length; i++) {
      addressSet.remove(arr1[i]);
    }
  }

  // Generates pseudo random number in the range [min, max] using block attributes
  function generatePRN(uint256 min, uint256 max, uint256 salt) public view returns (uint256) {
    return
      (uint256(keccak256(abi.encodePacked(block.timestamp, block.difficulty, msg.sender, salt))) %
        (max - min + 1)) + min;
  }

  // This function can be also found in OpenZeppelin's library, but in a newer version than the one
  function compareStrings(string memory a, string memory b) public pure returns (bool) {
    return (keccak256(abi.encodePacked((a))) == keccak256(abi.encodePacked((b))));
  }
}
