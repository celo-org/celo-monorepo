pragma solidity ^0.5.13;

contract Initializable {
  bool public initialized;

  modifier initializer() {
    require(!initialized, "contract already initialized");
    initialized = true;
    _;
  }
}
