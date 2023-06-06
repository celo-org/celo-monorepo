pragma solidity ^0.5.13;

import "@openzeppelin/contracts/ownership/Ownable.sol";

import "./TestLibrary.sol";

contract TestParent is Ownable {
  using TestLibrary for TestLibrary.Thing;

  uint256 private p;
  address private q;

  // TestLibrary.Thing libraryThing;

}
