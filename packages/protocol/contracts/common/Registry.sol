pragma solidity ^0.5.8;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "./interfaces/IRegistry.sol";
import "./Initializable.sol";


/**
 * @title Routes identifiers to addresses.
 */
contract Registry is IRegistry, Ownable, Initializable {

  mapping (bytes32 => address) public registry;

  event RegistryUpdated(
    string identifier,
    bytes32 indexed identifierHash,
    address addr
  );

  function initialize() external initializer {
    _transferOwnership(msg.sender);
  }

  /**
   * @notice Associates the given address with the given identifier.
   * @param identifier Identifier of contract whose address we want to set.
   * @param addr Address of contract.
   */
  function setAddressFor(string calldata identifier, address addr) external onlyOwner {
    bytes32 hash = keccak256(
      abi.encodePacked(identifier)
    );
    registry[hash] = addr;
    emit RegistryUpdated(identifier, hash, addr);
  }

  /**
   * @notice Gets address associated with the given identifier.
   * @param identifier Identifier hash of contract whose address we want to look up.
   * @dev Throws if address not set.
   */
  function getAddressForOrDie(bytes32 identifier) external view returns (address) {
    require(registry[identifier] != address(0), "identifier has no registry entry");
    return registry[identifier];
  }

  /**
   * @notice Gets address associated with the given identifier.
   * @param identifier Identifier hash of contract whose address we want to look up.
   */
  function getAddressFor(bytes32 identifier) external view returns (address) {
    return registry[identifier];
  }
}
