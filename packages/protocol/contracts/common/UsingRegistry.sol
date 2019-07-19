pragma solidity ^0.5.8;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "./interfaces/IRegistry.sol";

// Ideally, UsingRegistry should inherit from Initializable and implement initialize() which calls
// setRegistry(). TypeChain currently has problems resolving overloaded functions, so this is not
// possible right now.
// TODO(amy): Fix this when the TypeChain issue resolves.

contract UsingRegistry is Ownable {

  event RegistrySet(address indexed registryAddress);

  // solhint-disable state-visibility
  string constant ATTESTATIONS_REGISTRY_ID = "Attestations";
  string constant BONDED_DEPOSITS_REGISTRY_ID = "BondedDeposits";
  string constant GAS_CURRENCY_WHITELIST_REGISTRY_ID = "GasCurrencyWhitelist";
  string constant GOLD_TOKEN_REGISTRY_ID = "GoldToken";
  string constant GOVERNANCE_REGISTRY_ID = "Governance";
  string constant QUORUM_REGISTRY_ID = "Quorum";
  string constant RESERVE_REGISTRY_ID = "Reserve";
  string constant RANDOM_REGISTRY_ID = "Random";
  string constant SORTED_ORACLES_REGISTRY_ID = "SortedOracles";
  string constant VALIDATORS_REGISTRY_ID = "Validators";
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
