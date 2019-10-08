pragma solidity ^0.5.3;
/* solhint-disable no-inline-assembly, no-complex-fallback, avoid-low-level-calls */

import "./libraries/AddressesHelper.sol";

/**
 * @title A Proxy utilizing the Unstructured Storage pattern.
 */
contract Proxy {
  // Used to store the address of the owner.
  bytes32 constant private OWNER_POSITION = keccak256("org.celo.owner");
  // Used to store the address of the implementation contract.
  bytes32 constant private IMPLEMENTATION_POSITION = keccak256("org.celo.implementation");

  event OwnerSet(address indexed owner);
  event ImplementationSet(address indexed implementation);

  constructor() public {
    _setOwner(msg.sender);
  }

  /**
   * @notice Throws if called by any account other than the owner.
   */
  modifier onlyOwner() {
    require(msg.sender == _getOwner(), "sender was not owner");
    _;
  }

  /**
   * @notice Delegates calls to the implementation contract.
   */
  function () external payable {
    bytes32 implementationPosition = IMPLEMENTATION_POSITION;

    address implementationAddress;

    assembly {
      implementationAddress := sload(implementationPosition)
    }

    require(AddressesHelper.isContract(implementationAddress), "Invalid contract address");

    assembly {
      let newCallDataPosition := mload(0x40)
      mstore(0x40, add(newCallDataPosition, calldatasize))

      calldatacopy(newCallDataPosition, 0, calldatasize)

      let delegatecallSuccess := delegatecall(
        gas,
        implementationAddress,
        newCallDataPosition,
        calldatasize,
        0,
        0
      )

      let returnDataSize := returndatasize
      let returnDataPosition := mload(0x40)
      mstore(0x40, add(returnDataPosition, returnDataSize))
      returndatacopy(returnDataPosition, 0, returnDataSize)

      switch delegatecallSuccess
      case 0 {
        revert(returnDataPosition, returnDataSize)
      }
      default {
        return(returnDataPosition, returnDataSize)
      }
    }
  }

  /**
   * @notice Transfers ownership of Proxy to a new owner.
   * @param newOwner Address of the new owner account.
   */
  function _transferOwnership(address newOwner) external onlyOwner {
    _setOwner(newOwner);
  }

  /**
   * @notice Sets the address of the implementation contract and calls into it.
   * @param implementation Address of the new target contract.
   * @param callbackData The abi-encoded function call to perform in the implementation
   * contract.
   * @dev Throws if the initialization callback fails.
   * @dev If the target contract does not need initialization, use
   * setImplementation instead.
   */
  function _setAndInitializeImplementation(
    address implementation,
    bytes calldata callbackData
  )
    external
    payable
    onlyOwner
  {
    _setImplementation(implementation);
    bool success;
    bytes memory returnValue;
    (success, returnValue) = implementation.delegatecall(callbackData);
    require(success, "initialization callback failed");
  }

  /**
   * @notice Returns the implementation address.
   */
  function _getImplementation() external view returns (address implementation) {
    bytes32 implementationPosition = IMPLEMENTATION_POSITION;
    assembly {
      implementation := sload(implementationPosition)
    }
  }

  /**
   * @notice Sets the address of the implementation contract.
   * @param implementation Address of the new target contract.
   * @dev If the target contract needs to be initialized, call
   * setAndInitializeImplementation instead.
   */
  function _setImplementation(address implementation) public onlyOwner {
    bytes32 implementationPosition = IMPLEMENTATION_POSITION;

    require(AddressesHelper.isContract(implementation), "Invalid contract address");

    assembly {
      sstore(implementationPosition, implementation)
    }

    emit ImplementationSet(implementation);
  }

  /**
   * @notice Returns the Proxy owner's address.
   */
  function _getOwner() public view returns (address owner) {
    bytes32 position = OWNER_POSITION;
    assembly {
      owner := sload(position)
    }
  }

  function _setOwner(address newOwner) private {
    bytes32 position = OWNER_POSITION;
    assembly {
      sstore(position, newOwner)
    }
    emit OwnerSet(newOwner);
  }
}
