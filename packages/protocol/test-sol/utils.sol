pragma solidity ^0.5.13;

import "celo-foundry/Test.sol";

contract Utils is Test {
  function timeTravel(uint256 timeDelta) public {
    vm.warp(block.timestamp + timeDelta);
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

}
