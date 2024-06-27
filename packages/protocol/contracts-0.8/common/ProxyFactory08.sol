//SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "../../contracts/common/interfaces/IProxy.sol";

import "@openzeppelin/contracts8/utils/Create2.sol";

contract ProxyFactory08 {
  // Deploys a new bytecode and transfers ownership to the provided address
  // Calls with the same initCode that results in the same bytecode, sender and salt
  // will revert as two contracts can not get deployed to the same address
  function deployArbitraryByteCode(
    uint256 value,
    address owner,
    uint256 _salt,
    bytes memory initCode
  ) external returns (address) {
    return _deployArbitraryByteCode(value, owner, _salt, initCode);
  }

  function _deployArbitraryByteCode(
    uint256 value,
    address owner,
    uint256 _salt,
    bytes memory initCode
  ) private returns (address) {
    address deployedContract = Create2.deploy(
      value,
      keccak256(abi.encode(_salt, msg.sender)),
      abi.encodePacked(initCode)
    );

    // function will fail if contract doesn't implement
    // _transferOwnership function
    IProxy proxy = IProxy(deployedContract);
    proxy._transferOwnership(owner);

    return deployedContract;
  }
}
