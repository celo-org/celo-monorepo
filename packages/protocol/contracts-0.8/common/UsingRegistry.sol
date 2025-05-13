// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.0 <0.8.20;

// Note: This is not an exact copy of UsingRegistry or UsingRegistryV2 in the contract's folder
// because Mento's interfaces still don't support Solidity 0.8

import "@openzeppelin/contracts8/access/Ownable.sol";
import "@openzeppelin/contracts8/token/ERC20/IERC20.sol";

import "../../contracts/common/interfaces/IRegistry.sol";
import "../../contracts/common/interfaces/IAccounts.sol";
import "../../contracts/common/interfaces/IFreezer.sol";
import "../../contracts/governance/interfaces/IGovernance.sol";
import "../../contracts/governance/interfaces/ILockedGold.sol";
import "../../contracts/governance/interfaces/IValidators.sol";
import "../../contracts/stability/interfaces/ISortedOracles.sol";
import "../../contracts/common/interfaces/IFeeCurrencyWhitelist.sol";
import "../../contracts/governance/interfaces/IElection.sol";

import "../../contracts/common/interfaces/IFeeHandlerSeller.sol";

contract UsingRegistry is Ownable {
  // solhint-disable state-visibility
  bytes32 constant ACCOUNTS_REGISTRY_ID = keccak256(abi.encodePacked("Accounts"));
  bytes32 constant ATTESTATIONS_REGISTRY_ID = keccak256(abi.encodePacked("Attestations"));
  bytes32 constant DOWNTIME_SLASHER_REGISTRY_ID = keccak256(abi.encodePacked("DowntimeSlasher"));
  bytes32 constant DOUBLE_SIGNING_SLASHER_REGISTRY_ID =
    keccak256(abi.encodePacked("DoubleSigningSlasher"));
  bytes32 constant ELECTION_REGISTRY_ID = keccak256(abi.encodePacked("Election"));
  bytes32 constant EXCHANGE_REGISTRY_ID = keccak256(abi.encodePacked("Exchange"));
  bytes32 constant FEE_CURRENCY_WHITELIST_REGISTRY_ID =
    keccak256(abi.encodePacked("FeeCurrencyWhitelist"));
  bytes32 constant FREEZER_REGISTRY_ID = keccak256(abi.encodePacked("Freezer"));
  bytes32 constant GOLD_TOKEN_REGISTRY_ID = keccak256(abi.encodePacked("GoldToken"));
  bytes32 constant GOVERNANCE_REGISTRY_ID = keccak256(abi.encodePacked("Governance"));
  bytes32 constant GOVERNANCE_SLASHER_REGISTRY_ID =
    keccak256(abi.encodePacked("GovernanceSlasher"));
  bytes32 constant LOCKED_GOLD_REGISTRY_ID = keccak256(abi.encodePacked("LockedGold"));
  bytes32 constant RESERVE_REGISTRY_ID = keccak256(abi.encodePacked("Reserve"));
  bytes32 constant RANDOM_REGISTRY_ID = keccak256(abi.encodePacked("Random"));
  bytes32 constant SORTED_ORACLES_REGISTRY_ID = keccak256(abi.encodePacked("SortedOracles"));
  bytes32 constant STABLE_TOKEN_REGISTRY_ID = keccak256(abi.encodePacked("StableToken"));
  bytes32 constant VALIDATORS_REGISTRY_ID = keccak256(abi.encodePacked("Validators"));
  bytes32 constant MENTOFEEHANDLERSELLER_REGISTRY_ID =
    keccak256(abi.encodePacked("MentoFeeHandlerSeller"));
  // solhint-enable state-visibility

  IRegistry public registry;

  event RegistrySet(address indexed registryAddress);

  modifier onlyRegisteredContract(bytes32 identifierHash) {
    require(registry.getAddressForOrDie(identifierHash) == msg.sender, "only registered contract");
    _;
  }

  modifier onlyRegisteredContracts(bytes32[] memory identifierHashes) {
    require(registry.isOneOf(identifierHashes, msg.sender), "only registered contracts");
    _;
  }

  /**
   * @notice Updates the address pointing to a Registry contract.
   * @param registryAddress The address of a registry contract for routing to other contracts.
   */
  function setRegistry(address registryAddress) public onlyOwner {
    require(registryAddress != address(0), "Cannot register the null address");
    registry = IRegistry(registryAddress);
    emit RegistrySet(registryAddress);
  }

  function getGoldToken() internal view returns (IERC20) {
    return IERC20(registry.getAddressForOrDie(GOLD_TOKEN_REGISTRY_ID));
  }

  function getFreezer() internal view returns (IFreezer) {
    return IFreezer(registry.getAddressForOrDie(FREEZER_REGISTRY_ID));
  }

  function getSortedOracles() internal view returns (ISortedOracles) {
    return ISortedOracles(registry.getAddressForOrDie(SORTED_ORACLES_REGISTRY_ID));
  }

  function getFeeCurrencyWhitelist() internal view returns (IFeeCurrencyWhitelist) {
    return IFeeCurrencyWhitelist(registry.getAddressForOrDie(FEE_CURRENCY_WHITELIST_REGISTRY_ID));
  }

  function getLockedGold() internal view returns (ILockedGold) {
    return ILockedGold(registry.getAddressForOrDie(LOCKED_GOLD_REGISTRY_ID));
  }

  // Current version of Mento doesn't support 0.8
  function getStableToken() internal view returns (address) {
    return registry.getAddressForOrDie(STABLE_TOKEN_REGISTRY_ID);
  }

  function getMentoFeeHandlerSeller() internal view returns (IFeeHandlerSeller) {
    return IFeeHandlerSeller(registry.getAddressForOrDie(MENTOFEEHANDLERSELLER_REGISTRY_ID));
  }

  function getAccounts() internal view returns (IAccounts) {
    return IAccounts(registry.getAddressForOrDie(ACCOUNTS_REGISTRY_ID));
  }

  function getValidators() internal view returns (IValidators) {
    return IValidators(registry.getAddressForOrDie(VALIDATORS_REGISTRY_ID));
  }

  function getElection() internal view returns (IElection) {
    return IElection(registry.getAddressForOrDie(ELECTION_REGISTRY_ID));
  }
  function getGovernance() internal view returns (IGovernance) {
    return IGovernance(registry.getAddressForOrDie(GOVERNANCE_REGISTRY_ID));
  }
}
