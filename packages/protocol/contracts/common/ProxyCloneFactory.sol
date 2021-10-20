// SPDX-License-Identifier: MIT
pragma solidity ^0.5.13;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "./InitializableProxy.sol";

/**
 * @title A factory for deploying EIP-1167 clones of upgradable Proxy contracts.
 */
contract ProxyCloneFactory is Ownable {
  // The address of the Proxy implementation to clone.
  address public proxyImplementationAddress;
  event ProxyCloneCreated(address proxyClone);

  /**
   * @notice Sets the address of the Proxy implementation to clone.
   * @param _proxyImplementationAddress The address of the Proxy implementation to clone.
   */
  function setImplementationAddress(address _proxyImplementationAddress) external onlyOwner {
    proxyImplementationAddress = _proxyImplementationAddress;
  }

  // TODO: Upgrade solc version and import from OpenZeppelin instead.
  /**
   * @notice Creates an EIP-1167 style clone of the specified `_proxyImplementationAddress`.
   * @param _proxyImplementationAddress The address of the Proxy implementation to clone.
   * @return The address of the clone.
   * @dev Copied from OpenZeppelin.
   */
  function clone(address _proxyImplementationAddress) internal returns (address instance) {
    // solhint-disable-next-line no-inline-assembly
    assembly {
      let ptr := mload(0x40)
      mstore(ptr, 0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000)
      mstore(add(ptr, 0x14), shl(0x60, _proxyImplementationAddress))
      mstore(add(ptr, 0x28), 0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000)
      instance := create(0, ptr, 0x37)
    }
    require(instance != address(0), "ERC1167: create failed");
  }

  /**
   * @notice Creates an EIP-1167 style clone of a Proxy contract, points the Proxy to an
   *         implementation and initializes it.
   * @dev Grants ownership of the deployed proxy to itself, allowing the proxy to invoke
   *      its own administrative functions if the logic contract permits (use extra caution
   *      with implementations that permit arbitrary function calls).
   * @param implementation The address to point the Proxy to.
   * @param initCallData The function to call on the implementation and the corresponding args.
   */
  function deploy(address implementation, bytes calldata initCallData) external {
    // Cast to prevent compiler from complaining about the output of clone() not being payable.
    InitializableProxy proxyClone = InitializableProxy(
      address(uint160(clone(proxyImplementationAddress)))
    );
    proxyClone._initialize(address(this));
    proxyClone._setAndInitializeImplementation(implementation, initCallData);
    // TODO(asa): In the current version of Komenci we transfer proxy ownership to the user.
    // Need to decide which to do.
    proxyClone._transferOwnership(address(proxyClone));
    emit ProxyCloneCreated(address(proxyClone));
  }
}
