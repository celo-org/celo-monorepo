// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.5.13 <0.9.0;

/**
 * @title Used with proxied contracts that have an `initialize` function.
 * @notice Ensures the `initialize` function:
 *         - gets called only once
 *         - cannot be called on the logic contract.
 */
contract Initializable {
  bool public initialized;

  /**
   * @notice Ensures the initializer function cannot be called more than once.
   */
  modifier initializer() {
    require(!initialized, "contract already initialized");
    initialized = true;
    _;
  }

  /**
   * @notice By default, ensures that the `initialize` function cannot be called
   * on the logic contract.
   * @param testingDeployment When set to true, allows the `initialize` function
   * to be called, which is useful in testing when not setting up with a Proxy.
   */
  constructor(bool testingDeployment) public {
    if (!testingDeployment) {
      initialized = true;
    }
  }
}
