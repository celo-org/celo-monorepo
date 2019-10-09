pragma solidity ^0.5.3;


contract Initializable {
  bool public initialized;

  modifier initializer() {
    require(!initialized);
    initialized = true;
    _;
  }
}
