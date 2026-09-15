// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "@celo-contracts/common/Initializable.sol";

// 0.8 ports of the small implementation-under-proxy fixtures used by the Proxy tests.
// The Proxy contract itself stays 0.5 and is deployed via deployCodeTo.

contract GetSetV0 {
  uint256 public x;

  function set(uint256 _x) external {
    x = _x;
  }

  function get() external view returns (uint256) {
    return x;
  }
}

contract GetSetV1 {
  uint256 public x;
  string public y;

  function set(uint256 _x, string calldata _y) external {
    x = _x;
    y = _y;
  }

  function get() external view returns (uint256, string memory) {
    return (x, y);
  }
}

contract HasInitializer is Initializable(true) {
  uint256 public x;

  function initialize(uint256 _x) external initializer {
    x = _x;
  }
}

contract MsgSenderCheck {
  function checkMsgSender(address addr) external view {
    require(addr == msg.sender, "address was not msg.sender");
  }
}
