// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.0 <0.8.20;

contract Initializable {
  bool public initialized;

  constructor(bool testingDeployment) public {
    if (!testingDeployment) {
      initialized = true;
    }
  }

  modifier initializer() {
    require(!initialized, "contract already initialized");
    initialized = true;
    _;
  }
}
