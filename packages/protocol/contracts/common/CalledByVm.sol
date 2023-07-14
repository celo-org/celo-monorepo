// SPDX-License-Identifier: LGPL-3.0-only
//
pragma solidity ^0.5.13;
//

contract CalledByVm {
  modifier onlyVm() {
    require(msg.sender == address(0), "Only VM can call");
    _;
  }
}
