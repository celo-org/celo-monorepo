//SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "@openzeppelin/contracts8/utils/Create2.sol";
import "@celo-contracts/common/interfaces/IProxy.sol";

contract ProxyFactory08 {
  function deployArbitraryByteCode(
    uint256 amount,
    address owner,
    uint256 _salt,
    bytes memory initCode
  ) external returns (address) {
    return _deployArbitraryByteCode(amount, owner, _salt, initCode);
  }

  function _deployArbitraryByteCode(
    uint256 amount,
    address owner,
    uint256 _salt,
    bytes memory initCode
  ) private returns (address) {
    // will only deploy proxies
    address deployedContract = Create2.deploy(
      amount,
      keccak256(abi.encode(_salt, msg.sender)),
      abi.encodePacked(initCode)
    );

    IProxy proxy = IProxy(deployedContract);
    proxy._transferOwnership(owner);

    return deployedContract;
  }
}
