pragma solidity ^0.5.13;

import "@celo-contracts/common/Create2.sol";
import "@celo-contracts/common/Accounts.sol";
import "celo-foundry/Test.sol";


contract Create2Test is Test {

// use stdutils after moving to 0.8
    /// @dev returns the hash of the init code (creation code + no args) used in CREATE2 with no constructor arguments
    // /// @param creationCode the creation code of a contract C, as returned by type(C).creationCode
    // function hashInitCode(bytes memory creationCode) internal pure returns (bytes32) {
    //     return hashInitCode(creationCode, "");
    // }

    // /// @dev returns the hash of the init code (creation code + ABI-encoded args) used in CREATE2
    // /// @param creationCode the creation code of a contract C, as returned by type(C).creationCode
    // /// @param args the ABI-encoded arguments to the constructor of C
    // function hashInitCode(bytes memory creationCode, bytes memory args) internal pure returns (bytes32) {
    //     return keccak256(abi.encodePacked(creationCode, args));
    // }

  //   function deploy(bytes memory bytecode, uint _salt) public {
  //     address addr;
  //     assembly {
  //         addr := create2(0, add(bytecode, 0x20), mload(bytecode), _salt)

  //         if iszero(extcodesize(addr)) {
  //             revert(0, 0)
  //         }
  //     }

  //     emit Deployed(addr, _salt);
  // }


  function test_create() public{
    // bytes memory implementationBytecode = abi.encodePacked(type(Accounts).creationCode);
    bytes memory implementationBytecode = abi.encodePacked(type(Accounts).creationCode, abi.encode(false));
    // bytes memory implementationBytecode = vm.getCode("Registry.sol");
    bytes32 salt = "124"; 

    Create2.deploy(salt, implementationBytecode);
  }

}