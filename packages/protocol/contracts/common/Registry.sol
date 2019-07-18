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
   * @param identifier Identifier of contract whose address we want to look up.
   * @dev Throws if address not set.
   */
  function getAddressForOrDie(string calldata identifier) external view returns (address) {
    bytes32 hash = keccak256(
      abi.encodePacked(identifier)
    );
    require(registry[hash] != address(0), "identifier has no registry entry");
    return registry[hash];
  }

  /**
   * @notice Gets address associated with the given identifier.
   * @param identifier Identifier of contract whose address we want to look up.
   */
  function getAddressFor(string calldata identifier) external view returns (address) {
    bytes32 hash = keccak256(
      abi.encodePacked(identifier)
    );
    return registry[hash];
  }
}
