// SPDX-License-Identifier: MIT
pragma solidity ^0.5.13;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "./InitializableProxy.sol";

contract ProxyCloneFactory is Ownable {
  event ProxyCreated(InitializableProxy proxy);

  address public proxyAddress;

  function() external payable {}

  function setProxyAddress(address _proxyAddress) external onlyOwner {
    proxyAddress = _proxyAddress;
  }

  // Copied from open-zeppelin.
  // TODO: Upgrade solc version and import from open-zeppelin instead.
  function clone(address master) internal returns (address instance) {
    // solhint-disable-next-line no-inline-assembly
    assembly {
      let ptr := mload(0x40)
      mstore(ptr, 0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000)
      mstore(add(ptr, 0x14), shl(0x60, master))
      mstore(add(ptr, 0x28), 0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000)
      instance := create(0, ptr, 0x37)
    }
    require(instance != address(0), "ERC1167: create failed");
  }

  function deploy(address implementation, bytes calldata initCallData) external {
    // Cast to prevent compiler from complaining about the output of clone() not being payable.
    InitializableProxy proxy = InitializableProxy(address(uint160(clone(proxyAddress))));
    proxy._initialize(address(this));
    proxy._setAndInitializeImplementation(implementation, initCallData);
    // TODO(asa): In the current version of Komenci we transfer proxy ownership to the user.
    // Need to decide which to do.
    proxy._transferOwnership(address(proxy));
    emit ProxyCreated(proxy);
  }
}
