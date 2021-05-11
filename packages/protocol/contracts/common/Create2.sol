pragma solidity ^0.5.13;

library Create2 {
  function computeAddress(address deployer, bytes32 salt, bytes32 initCodeHash)
    internal
    pure
    returns (address)
  {
    return
      address(
        uint160(uint256(keccak256(abi.encodePacked(bytes1(0xff), deployer, salt, initCodeHash))))
      );
  }

  function deploy(bytes32 salt, bytes memory initCode) internal returns (address) {
    address deployedAddress;
    assembly {
      deployedAddress := create2(0, add(initCode, 32), mload(initCode), salt)
      if iszero(extcodesize(deployedAddress)) {
        revert(0, 0)
      }
    }
    return deployedAddress;
  }
}
