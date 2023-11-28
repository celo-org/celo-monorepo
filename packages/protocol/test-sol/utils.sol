pragma solidity ^0.5.13;

import "celo-foundry/Test.sol";

contract Utils is Test {
  function timeTravel(uint256 timeDelta) public {
    vm.warp(block.timestamp + timeDelta);
  }

}
