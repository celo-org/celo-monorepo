// SPDX-License-Identifier: LGPL-3.0-only
// pragma solidity >=0.8.7 <0.8.20;

contract CalledByVm8 {
  modifier onlyVm() {
    require(msg.sender == address(0), "Only VM can call");
    _;
  }
}
