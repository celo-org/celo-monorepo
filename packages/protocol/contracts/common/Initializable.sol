// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.5.13 <0.9.0;

contract Initializable {
  bool public initialized;

  modifier initializer() {
    require(!initialized, "contract already initialized");
    initialized = true;
    _;
  }

  constructor(bool testingDeployment) public {
    if (!testingDeployment) {
      initialized = true;
    }
  }
}
