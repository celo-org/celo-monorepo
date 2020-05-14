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

  address[] private directlyWhitelistedAddresses;
  bytes32[] public whitelistedContractIdentifiers;

  event WhitelistedAddress(address indexed addr);
  event WhitelistedAddressRemoved(address indexed addr);
  event WhitelistedContractIdentifier(bytes32 indexed contractIdentifier);

  constructor(address registryAddress) public {
    _transferOwnership(msg.sender);
    setRegistry(registryAddress);
  }

  /**
   * @notice Add an address to the whitelist.
   * @param newAddress The address to add.
   */
  function whitelistAddress(address newAddress) public onlyOwner {
    directlyWhitelistedAddresses.push(newAddress);
    emit WhitelistedAddress(newAddress);
  }

  /**
   * @notice Remove an address from the whitelist.
   * @param removedAddress The address to add.
   * @param index Index of address in the whitelist.
   */
  function removeAddress(address removedAddress, uint256 index) external onlyOwner {
    require(index < directlyWhitelistedAddresses.length, "Whitelist index out of range");
    require(directlyWhitelistedAddresses[index] == removedAddress, "Bad whitelist index");
    uint256 tailIndex = directlyWhitelistedAddresses.length.sub(1);
    if (index != tailIndex) {
      directlyWhitelistedAddresses[index] = directlyWhitelistedAddresses[tailIndex];
    }
    directlyWhitelistedAddresses.length = tailIndex;
    emit WhitelistedAddressRemoved(removedAddress);
  }

  /**
   * @notice Adds the registry id of a whitelisted contract.
   * @param contractIdentifier The id of the contract to be added.
   */
  function whitelistRegisteredContract(bytes32 contractIdentifier) external onlyOwner {
    require(
      registry.getAddressFor(contractIdentifier) != address(0),
      "contractIdentifier does not correspond to a registered address"
    );
    whitelistedContractIdentifiers.push(contractIdentifier);
    emit WhitelistedContractIdentifier(contractIdentifier);
  }

  /**
   * @notice Gets the number of registered contracts
   * @return The length of whitelistedContractIdentifiers
   */
  function getNumberOfWhitelistedContractIdentifiers() external view returns (uint256 length) {
    return whitelistedContractIdentifiers.length;
  }

  /**
   * @notice Set the whitelist of addresses.
   * @param  _whitelist The new whitelist of addresses.
   */
  function setDirectlyWhitelistedAddresses(address[] calldata _whitelist) external onlyOwner {
    for (uint256 i = 0; i < directlyWhitelistedAddresses.length; i = i.add(1)) {
      emit WhitelistedAddressRemoved(directlyWhitelistedAddresses[i]);
    }
    directlyWhitelistedAddresses.length = 0;
    for (uint256 i = 0; i < _whitelist.length; i = i.add(1)) {
      whitelistAddress(_whitelist[i]);
    }
  }

  /**
   * @notice Set the whitelist of registered contracts.
   * @param  _registeredContracts The new whitelist of registered contract ids.
   */
  function setWhitelistedContractIdentifiers(bytes32[] calldata _registeredContracts)
    external
    onlyOwner
  {
    whitelistedContractIdentifiers = _registeredContracts;
  }

  /**
   * @notice Appends the addresses of registered contracts to the
   * whitelist before returning the list.
   * @dev If a registry id is not yet registered, the null address
   * will be appended to the list instead.
   * @return  The full whitelist of addresses.
   */
  function getWhitelist() external view returns (address[] memory) {
    uint256 len = directlyWhitelistedAddresses.length.add(whitelistedContractIdentifiers.length);
    address[] memory _whitelist = new address[](len);
    uint256 i = 0;
    while (i < directlyWhitelistedAddresses.length) {
      _whitelist[i] = directlyWhitelistedAddresses[i];
      i = i.add(1);
    }
    for (uint256 j = 0; j < whitelistedContractIdentifiers.length; j = j.add(1)) {
      _whitelist[i] = registry.getAddressFor(whitelistedContractIdentifiers[j]);
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
