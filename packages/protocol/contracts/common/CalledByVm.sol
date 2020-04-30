pragma solidity ^0.5.3;

contract CalledByVm {
  modifier onlyVm() {
    require(msg.sender == address(0), "Only VM can call");
    _;
  }
}
