pragma solidity ^0.5.13;

contract InitializableV2 {
  bool public initialized;

  constructor(bool testingDeployment) public {
    if (!testingDeployment) {
      _initialize();
    }
  }

  modifier initializer() {
    require(!initialized, "contract already initialized");
    _initialize();
    _;
  }

  function _initialize() private {
    initialized = true;
  }
}
