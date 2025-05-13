pragma solidity ^0.5.13;

import "celo-foundry/Test.sol";
import "openzeppelin-solidity/contracts/utils/EnumerableSet.sol";

contract Utils is Test {
  using EnumerableSet for EnumerableSet.AddressSet;

  EnumerableSet.AddressSet addressSet;

  function timeTravel(uint256 timeDelta) public {
    vm.warp(block.timestamp + timeDelta);
  }

  function blockTravel(uint256 blockDelta) public {
    vm.roll(block.number + blockDelta);
  }

  function assertAlmostEqual(uint256 actual, uint256 expected, uint256 margin) public {
    uint256 diff = actual > expected ? actual - expected : expected - actual;
    assertTrue(diff <= margin, string(abi.encodePacked("Difference is ", uintToStr(diff))));
  }

  function uintToStr(uint256 _i) internal pure returns (string memory _uintAsString) {
    uint256 number = _i;
    if (number == 0) {
      return "0";
    }
    uint256 j = number;
    uint256 len;
    while (j != 0) {
      len++;
      j /= 10;
    }
    bytes memory bstr = new bytes(len);
    uint256 k = len - 1;
    while (number != 0) {
      bstr[k--] = bytes1(uint8(48 + (number % 10)));
      number /= 10;
    }
    return string(bstr);
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
}
