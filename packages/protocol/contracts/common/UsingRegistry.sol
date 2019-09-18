pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "./interfaces/IRegistry.sol";

// Ideally, UsingRegistry should inherit from Initializable and implement initialize() which calls
// setRegistry(). TypeChain currently has problems resolving overloaded functions, so this is not
// possible right now.
// TODO(amy): Fix this when the TypeChain issue resolves.

contract UsingRegistry is Ownable {

  event RegistrySet(address indexed registryAddress);

  // solhint-disable state-visibility
  bytes32 constant ATTESTATIONS_REGISTRY_ID = keccak256(abi.encodePacked("Attestations"));
  bytes32 constant LOCKED_GOLD_REGISTRY_ID = keccak256(abi.encodePacked("LockedGold"));
  bytes32 constant GAS_CURRENCY_WHITELIST_REGISTRY_ID = keccak256(
    abi.encodePacked("GasCurrencyWhitelist")
  );
  bytes32 constant GOLD_TOKEN_REGISTRY_ID = keccak256(abi.encodePacked("GoldToken"));
  bytes32 constant GOVERNANCE_REGISTRY_ID = keccak256(abi.encodePacked("Governance"));
  bytes32 constant RESERVE_REGISTRY_ID = keccak256(abi.encodePacked("Reserve"));
  bytes32 constant RANDOM_REGISTRY_ID = keccak256(abi.encodePacked("Random"));
  bytes32 constant SORTED_ORACLES_REGISTRY_ID = keccak256(abi.encodePacked("SortedOracles"));
  bytes32 constant VALIDATORS_REGISTRY_ID = keccak256(abi.encodePacked("Validators"));
  // solhint-enable state-visibility

  IRegistry public registry;

  /**
   * @notice Updates the address pointing to a Registry contract.
   * @param registryAddress The address of a registry contract for routing to other contracts.
   */
  function setRegistry(address registryAddress) public onlyOwner {
    registry = IRegistry(registryAddress);
    emit RegistrySet(registryAddress);
  }
}
