pragma solidity >=0.5.13 <0.9.0;

import "celo-foundry-8/Test.sol";

contract Utils08 {
  uint256 public constant secondsInOneBlock = 5;

  function timeTravel(Vm vm, uint256 timeDelta) public {
    vm.warp(block.timestamp + timeDelta);
  }

  function blockTravel(Vm vm, uint256 blockDelta) public {
    vm.roll(block.number + blockDelta);
  }

  function travelEpochL1(Vm vm) public {
    uint256 blocksInEpoch = 17280;
    uint256 timeDelta = blocksInEpoch * 5;
    blockTravel(vm, blocksInEpoch);
    timeTravel(vm, timeDelta);
  }

  // This function can be also found in OpenZeppelin's library, but in a newer version than the one
  function compareStrings(string memory a, string memory b) public pure returns (bool) {
    return (keccak256(abi.encodePacked((a))) == keccak256(abi.encodePacked((b))));
  }

  function whenL2(Vm vm) public {
    vm.etch(0x4200000000000000000000000000000000000018, abi.encodePacked(bytes1(0x01)));
  }

  function actorWithPK(Vm vm, string memory name) public returns (address, uint256) {
    uint256 pk = uint256(keccak256(bytes(name)));
    address addr = vm.addr(pk);
    vm.label(addr, name);
    return (addr, pk);
  }

}
