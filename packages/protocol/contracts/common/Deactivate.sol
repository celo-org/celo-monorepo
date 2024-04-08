pragma solidity ^0.5.13;

contract Deactived {
  modifier deactivated {
    revert("This method has been deactivated");
    _;
  }
}
