pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "./interfaces/IERC20Token.sol";
import "./interfaces/IRegistry.sol";
import "./interfaces/IAccounts.sol";

import "../governance/interfaces/IElection.sol";
import "../governance/interfaces/IGovernance.sol";
import "../governance/interfaces/ILockedGold.sol";
import "../governance/interfaces/IValidators.sol";

import "../identity/interfaces/IRandom.sol";

import "../stability/interfaces/ISortedOracles.sol";
import "../stability/interfaces/IStableToken.sol";

// Ideally, UsingRegistry should inherit from Initializable and implement initialize() which calls
// setRegistry(). TypeChain currently has problems resolving overloaded functions, so this is not
// possible right now.
// TODO(amy): Fix this when the TypeChain issue resolves.

contract UsingRegistry is Ownable {
  event RegistrySet(address indexed registryAddress);

  // solhint-disable state-visibility
  bytes32 constant ACCOUNTS_REGISTRY_ID = keccak256(abi.encodePacked("Accounts"));
  bytes32 constant ATTESTATIONS_REGISTRY_ID = keccak256(abi.encodePacked("Attestations"));
  bytes32 constant ELECTION_REGISTRY_ID = keccak256(abi.encodePacked("Election"));
  bytes32 constant EXCHANGE_REGISTRY_ID = keccak256(abi.encodePacked("Exchange"));
  bytes32 constant GAS_CURRENCY_WHITELIST_REGISTRY_ID = keccak256(
    abi.encodePacked("FeeCurrencyWhitelist")
  );
  bytes32 constant GOLD_TOKEN_REGISTRY_ID = keccak256(abi.encodePacked("GoldToken"));
  bytes32 constant GOVERNANCE_REGISTRY_ID = keccak256(abi.encodePacked("Governance"));
  bytes32 constant LOCKED_GOLD_REGISTRY_ID = keccak256(abi.encodePacked("LockedGold"));
  bytes32 constant RESERVE_REGISTRY_ID = keccak256(abi.encodePacked("Reserve"));
  bytes32 constant RANDOM_REGISTRY_ID = keccak256(abi.encodePacked("Random"));
  bytes32 constant SORTED_ORACLES_REGISTRY_ID = keccak256(abi.encodePacked("SortedOracles"));
  bytes32 constant STABLE_TOKEN_REGISTRY_ID = keccak256(abi.encodePacked("StableToken"));
  bytes32 constant VALIDATORS_REGISTRY_ID = keccak256(abi.encodePacked("Validators"));
  // solhint-enable state-visibility

  IRegistry public registry;

  modifier onlyRegisteredContract(bytes32 identifierHash) {
    require(registry.getAddressForOrDie(identifierHash) == msg.sender, "only registered contract");
    _;
  }

  /**
   * @notice Updates the address pointing to a Registry contract.
   * @param registryAddress The address of a registry contract for routing to other contracts.
   */
  function setRegistry(address registryAddress) public onlyOwner {
    registry = IRegistry(registryAddress);
    emit RegistrySet(registryAddress);
  }

  function getAccounts() internal view returns (IAccounts) {
    return IAccounts(registry.getAddressForOrDie(ACCOUNTS_REGISTRY_ID));
  }

  function getElection() internal view returns (IElection) {
    return IElection(registry.getAddressForOrDie(ELECTION_REGISTRY_ID));
  }

  function getGoldToken() internal view returns (IERC20Token) {
    return IERC20Token(registry.getAddressForOrDie(GOLD_TOKEN_REGISTRY_ID));
  }

  function getGovernance() internal view returns (IGovernance) {
    return IGovernance(registry.getAddressForOrDie(GOVERNANCE_REGISTRY_ID));
  }

  function getLockedGold() internal view returns (ILockedGold) {
    return ILockedGold(registry.getAddressForOrDie(LOCKED_GOLD_REGISTRY_ID));
  }

  function getRandom() internal view returns (IRandom) {
    return IRandom(registry.getAddressForOrDie(RANDOM_REGISTRY_ID));
  }

  function getSortedOracles() internal view returns (ISortedOracles) {
    return ISortedOracles(registry.getAddressForOrDie(SORTED_ORACLES_REGISTRY_ID));
  }

  function getStableToken() internal view returns (IStableToken) {
    return IStableToken(registry.getAddressForOrDie(STABLE_TOKEN_REGISTRY_ID));
  }

  function getValidators() internal view returns (IValidators) {
    return IValidators(registry.getAddressForOrDie(VALIDATORS_REGISTRY_ID));
  }
}
