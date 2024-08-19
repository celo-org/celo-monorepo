pragma solidity >=0.5.13 <0.9.0;

import "celo-foundry-8/Test.sol";

contract Utils08 {
  function timeTravel(Vm vm, uint256 timeDelta) public {
    vm.warp(block.timestamp + timeDelta);
  }

  function blockTravel(Vm vm, uint256 blockDelta) public {
    vm.roll(block.number + blockDelta);
  }

  // This function can be also found in OpenZeppelin's library, but in a newer version than the one
  function compareStrings(string memory a, string memory b) public pure returns (bool) {
    return (keccak256(abi.encodePacked((a))) == keccak256(abi.encodePacked((b))));
  }
}
