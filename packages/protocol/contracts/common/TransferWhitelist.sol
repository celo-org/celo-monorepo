pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./UsingRegistry.sol";

/**
 * @title Holds a whitelist of addresses for which transfers should not be
 * frozen so that network initialization can take place.
 */
contract TransferWhitelist is Ownable, UsingRegistry {
  using SafeMath for uint256;

  address[] public whitelist;
  bytes32[] public registeredContracts;

  event WhitelistedAddress(address addr);
  event WhitelistedRegistryId(bytes32 registryId);

  constructor(address registryAddress) public {
    _transferOwnership(msg.sender);
    setRegistry(registryAddress);
  }

  /**
   * @notice Add an address to the whitelist.
   * @param newAddress The address to add.
   */
  function addAddress(address newAddress) external onlyOwner {
    whitelist.push(newAddress);
    emit WhitelistedAddress(newAddress);
  }

  /**
   * @notice Adds the registry id of a whitelisted contract.
   * @param registryId The id of the contract to be added.
   */
  function addRegisteredContract(bytes32 registryId) external onlyOwner {
    require(
      registry.getAddressFor(registryId) != address(0),
      "registryId does not corespond to a registered address"
    );
    registeredContracts.push(registryId);
    emit WhitelistedRegistryId(registryId);
  }

  /**
   * @notice Gets the number of registered contracts
   * @return The length of registeredContracts
   */
  function getRegisteredContractsLength() external view returns (uint256 length) {
    return registeredContracts.length;
  }

  /**
   * @notice Set the whitelist of addresses.
   * @param  _whitelist The new whitelist of addresses.
   */
  function setWhitelist(address[] calldata _whitelist) external onlyOwner {
    whitelist = _whitelist;
  }

  /**
   * @notice Set the whitelist of registered contracts.
   * @param  _registeredContracts The new whitelist of registered contract ids.
   */
  function setRegisteredContracts(bytes32[] calldata _registeredContracts) external onlyOwner {
    registeredContracts = _registeredContracts;
  }

  /**
   * @notice Appends the addresses of registered contracts to the
   * whitelist before returning the list.
   * @dev If a registry id is not yet registered, the null address
   * will be appended to the list instead.
   * @return  The full whitelist of addresses.
   */
  function getWhitelist() external view returns (address[] memory) {
    uint256 len = whitelist.length.add(registeredContracts.length);
    address[] memory _whitelist = new address[](len);
    uint256 i = 0;
    while (i < whitelist.length) {
      _whitelist[i] = whitelist[i];
      i = i.add(1);
    }
    for (uint256 j = 0; j < registeredContracts.length; j = j.add(1)) {
      _whitelist[i] = registry.getAddressFor(registeredContracts[j]);
      i = i.add(1);
    }
    return _whitelist;
  }

  /**
   * @notice Clears all data (storage and bytecode) at this contract's address.
   * @dev The balance of this contract is returned to the owner.
   */
  function selfDestruct() external onlyOwner {
    selfdestruct(msg.sender);
  }
}
