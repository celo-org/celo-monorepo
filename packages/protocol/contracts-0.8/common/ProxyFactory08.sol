//SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "../../contracts/common/interfaces/IProxy.sol";

import "@openzeppelin/contracts8/utils/Create2.sol";

/**
 * @title Used for deploying Proxy contracts using Create2.
 */
contract ProxyFactory08 {
  /**
   * @notice Deploys a new bytecode and transfers ownership to the provided address.
   * @param value Amount of Celo to transfer to the new contract.
   * @param owner The proxy owner to set.
   * @param _salt The Create2 salt to use.
   * @param initCode The contract init code to use for deployment.
   * @return Address of the deployed contract.
   * @dev Calls with initCode that results in the same bytecode, sender, and salt
   * will revert as two contracts cannot get deployed to the same address.
   * @dev Assumes the deployed contract is a Proxy with a `_transferOwnership`
   * function that will be called. Will revert if that call reverts.
   */
  function deployArbitraryByteCode(
    uint256 value,
    address owner,
    uint256 _salt,
    bytes memory initCode
  ) external returns (address) {
    address deployedContract = Create2.deploy(
      value,
      keccak256(abi.encode(_salt, msg.sender)),
      abi.encodePacked(initCode)
    );

    IProxy proxy = IProxy(deployedContract);
    proxy._transferOwnership(owner);

    return deployedContract;
  }
}
