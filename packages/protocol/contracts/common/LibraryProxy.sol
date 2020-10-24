pragma solidity ^0.5.13;
/* solhint-disable no-inline-assembly, no-complex-fallback, avoid-low-level-calls */

import "openzeppelin-solidity/contracts/utils/Address.sol";
import "./Registry.sol";

/**
 * @title A library proxy utilizing the Unstructured Storage pattern, allowing
 * for calls to a linked library pointed to by a Registry.
 * @dev This contract should be inherited from (e.g. for a library called Math,
 * create `contract MathProxy is LibraryProxy`). The inheriting contract should
 * implement a fallback function that calls `_delegateToLibrary`, passing in a
 * Registry hashed identifier referencing the implementation library.
 */
contract LibraryProxy {
  // Used to store the address of the registry contract.
  // NOTE: non-standard EIP1967 value to not clash with the calling contract's
  // underlying Proxy.
  bytes32 private constant REGISTRY_POSITION = bytes32(
    uint256(keccak256("eip1967.proxy.registry")) - 1
  );

  function _setRegistry(address registryAddress) public {
    bytes32 registryPosition = REGISTRY_POSITION;

    require(Address.isContract(registryAddress), "Invalid contract address");

    // Store the address of the implementation contract in an explicit storage slot.
    assembly {
      sstore(registryPosition, registryAddress)
    }
  }

  function _getRegistry() public view returns (address registry) {
    bytes32 registryPosition = REGISTRY_POSITION;
    // Load the address of the implementation contract from an explicit storage slot.
    assembly {
      registry := sload(registryPosition)
    }
  }

  function _delegateToLibrary(bytes32 libraryIdentifier) internal {
    Registry registry = Registry(_getRegistry());

    address implementationAddress = registry.getAddressForOrDie(libraryIdentifier);

    // Avoid checking if address is a contract or executing delegated call when
    // implementation address is 0x0
    require(implementationAddress != address(0), "No Implementation set");
    require(Address.isContract(implementationAddress), "Invalid contract address");

    assembly {
      // Extract the position of the transaction data (i.e. function ID and arguments).
      let newCallDataPosition := mload(0x40)
      mstore(0x40, add(newCallDataPosition, calldatasize))
      calldatacopy(newCallDataPosition, 0, calldatasize)

      // Call the smart contract at `implementationAddress` in the context of the proxy contract,
      // with the same msg.sender and value.
      let delegatecallSuccess := delegatecall(
        gas,
        implementationAddress,
        newCallDataPosition,
        calldatasize,
        0,
        0
      )

      // Copy the return value of the call so it can be returned.
      let returnDataSize := returndatasize
      let returnDataPosition := mload(0x40)
      mstore(0x40, add(returnDataPosition, returnDataSize))
      returndatacopy(returnDataPosition, 0, returnDataSize)

      // Revert or return depending on whether or not the call was successful.
      switch delegatecallSuccess
        case 0 {
          revert(returnDataPosition, returnDataSize)
        }
        default {
          return(returnDataPosition, returnDataSize)
        }
    }
  }
}
