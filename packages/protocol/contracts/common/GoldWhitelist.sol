pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./UsingRegistry.sol";

/**
 * @title Holds a whitelist of addresses for which Gold transfers cannot be frozen.
 */
contract GoldWhitelist is Ownable, UsingRegistry {
  address[] public whitelist;
  bytes32[] public registeredContracts;

  constructor() public {
    _transferOwnership(msg.sender);
  }

  /**
   * @dev Add an address to the whitelist
   * @param newAddress The address to add.
   */
  function addAddress(address newAddress) external onlyOwner {
    whitelist.push(newAddress);
  }

  /**
   * @dev Adds the registry id of a whitelisted contract.
   * @param registryId The id of the contract to be added.
   */
  function addRegisteredContract(bytes32 registryId) external onlyOwner {
    registeredContracts.push(registryId);
  }

  /**
   * @dev Set the whitelist of addresses.
   * @param  _whitelist The new whitelist of addresses.
   */
  function setWhitelist(address[] calldata _whitelist) external onlyOwner {
    whitelist = _whitelist;
  }

  /**
   * @dev Set the whitelist of registered contracts.
   * @param  _registeredContracts The new whitelist of registered contract ids.
   */
  function setRegisteredContracts(bytes32[] calldata _registeredContracts) external onlyOwner {
    registeredContracts = _registeredContracts;
  }

  /**
   * @return The full whitelist of addresses, including those of registered contracts.
   */
  function getWhitelist() external view returns (address[] memory) {
    uint8 len = uint8(whitelist.length + registeredContracts.length);
    address[] memory _whitelist = new address[](len);
    uint8 i = 0;
    while (i < whitelist.length) {
      _whitelist[i] = whitelist[i];
      i++;
    }
    for (uint8 j = 0; j < registeredContracts.length; j++) {
      _whitelist[i++] = registry.getAddressFor(registeredContracts[j]);
    }
    return _whitelist;
  }

  /**
   * @dev Clears all data (storage and bytecode) at this contract's address. 
   * @notice The balance of this contract is returned to the owner.
   */
  function selfDestruct() external onlyOwner {
    selfdestruct(msg.sender);
  }
}
