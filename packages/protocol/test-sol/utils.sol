pragma solidity ^0.5.13;

import "celo-foundry/Test.sol";

// This contract is only required for Solidity 0.5
contract Utils is Test {
  function timeTravel(uint256 timeDelta) public {
    vm.warp(block.timestamp + timeDelta);
  }

}
