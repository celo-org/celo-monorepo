// SPDX-License-Identifier: apache-2.0
pragma solidity ^0.8.4;

/// Bare delegatecall proxy. FeeCurrencyWrapper locks its own storage in the constructor
/// (`constructor() initializer {}`), so like on mainnet it has to be initialized through a proxy.
contract MinimalProxy {
  address internal immutable implementation;

  constructor(address _implementation) {
    implementation = _implementation;
  }

  fallback() external payable {
    address impl = implementation;
    assembly {
      calldatacopy(0, 0, calldatasize())
      let ok := delegatecall(gas(), impl, 0, calldatasize(), 0, 0)
      returndatacopy(0, 0, returndatasize())
      switch ok
      case 0 { revert(0, returndatasize()) }
      default { return(0, returndatasize()) }
    }
  }
}
