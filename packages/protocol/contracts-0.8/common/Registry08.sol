// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.7 <0.8.20;

import "@openzeppelin/contracts8/utils/math/SafeMath.sol";
import "@openzeppelin/contracts8/access/Ownable.sol";

import "../../contracts/common/interfaces/IRegistry.sol";
import "../../contracts/common/interfaces/IRegistryInitializer.sol";
import "../../contracts/common/Initializable.sol";

/**
 * @title Routes identifiers to addresses.
 */
contract Registry08 is IRegistry, IRegistryInitializer, Ownable, Initializable {
  using SafeMath for uint256;

  mapping(bytes32 => address) public registry;

  event RegistryUpdated(string identifier, bytes32 indexed identifierHash, address indexed addr);

  /**
   * @notice Sets initialized == true on implementation contracts
   * @param test Set to true to skip implementation initialization
   */
  constructor(bool test) public Initializable(test) {}

  /**
   * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
   */
  function initialize() external initializer {
    _transferOwnership(msg.sender);
  }

  /**
   * @notice Associates the given address with the given identifier.
   * @param identifier Identifier of contract whose address we want to set.
   * @param addr Address of contract.
   */
  function setAddressFor(string calldata identifier, address addr) external onlyOwner {
    bytes32 identifierHash = keccak256(abi.encodePacked(identifier));
    registry[identifierHash] = addr;
    emit RegistryUpdated(identifier, identifierHash, addr);
  }

  /**
   * @notice Gets address associated with the given identifierHash.
   * @param identifierHash Identifier hash of contract whose address we want to look up.
   * @dev Throws if address not set.
   */
  function getAddressForOrDie(bytes32 identifierHash) external view returns (address) {
    require(registry[identifierHash] != address(0), "identifier has no registry entry");
    return registry[identifierHash];
  }

  /**
   * @notice Gets address associated with the given identifierHash.
   * @param identifierHash Identifier hash of contract whose address we want to look up.
   */
  function getAddressFor(bytes32 identifierHash) external view returns (address) {
    return registry[identifierHash];
  }

  /**
   * @notice Gets address associated with the given identifier.
   * @param identifier Identifier of contract whose address we want to look up.
   * @dev Throws if address not set.
   */
  function getAddressForStringOrDie(string calldata identifier) external view returns (address) {
    bytes32 identifierHash = keccak256(abi.encodePacked(identifier));
    require(registry[identifierHash] != address(0), "identifier has no registry entry");
    return registry[identifierHash];
  }

  /**
   * @notice Gets address associated with the given identifier.
   * @param identifier Identifier of contract whose address we want to look up.
   */
  function getAddressForString(string calldata identifier) external view returns (address) {
    bytes32 identifierHash = keccak256(abi.encodePacked(identifier));
    return registry[identifierHash];
  }

  /**
   * @notice Iterates over provided array of identifiers, getting the address for each.
   *         Returns true if `sender` matches the address of one of the provided identifiers.
   * @param identifierHashes Array of hashes of approved identifiers.
   * @param sender Address in question to verify membership.
   * @return True if `sender` corresponds to the address of any of `identifiers`
   *         registry entries.
   */
  function isOneOf(
    bytes32[] calldata identifierHashes,
    address sender
  ) external view returns (bool) {
    for (uint256 i = 0; i < identifierHashes.length; i = i.add(1)) {
      if (registry[identifierHashes[i]] == sender) {
        return true;
      }
    }
    return false;
  }
}
