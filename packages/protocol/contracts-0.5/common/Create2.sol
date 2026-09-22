pragma solidity ^0.5.13;

/**
 * @title Used for deploying contracts using the CREATE2 opcode.
 */
library Create2 {
  /**
   * @notice Deploys a contract with CREATE2.
   * @param salt The CREATE2 salt.
   * @param initCode The contract init code to use for deployment.
   * @return Address of the deployed contract.
   */
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

  /**
   * @notice Computes the CREATE2 address for given inputs.
   * @param deployer Address of the deployer.
   * @param salt The CREATE2 salt.
   * @param initCodeHash Hash of the init code used for deployment.
   * @return The address at which such a contract would be deployed.
   */
  function computeAddress(
    address deployer,
    bytes32 salt,
    bytes32 initCodeHash
  ) internal pure returns (address) {
    return
      address(
        uint160(uint256(keccak256(abi.encodePacked(bytes1(0xff), deployer, salt, initCodeHash))))
      );
  }
}
