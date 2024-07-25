// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.7 <0.8.20;

contract IdentityProxyTest {
  address public lastAddress;
  uint256 public x;
  uint256 public amountLastPaid;

  function callMe() external {
    lastAddress = msg.sender;
  }

  function payMe() external payable {
    amountLastPaid = msg.value;
  }

  function setX(uint256 _x) external {
    x = _x;
  }
}
