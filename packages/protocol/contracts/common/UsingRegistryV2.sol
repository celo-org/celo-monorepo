pragma solidity ^0.5.13;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

import "./interfaces/IAccounts.sol";
import "./interfaces/IFeeCurrencyWhitelist.sol";
import "./interfaces/IFreezer.sol";
import "./interfaces/IRegistry.sol";

import "../governance/interfaces/IElection.sol";
import "../governance/interfaces/IGovernance.sol";
import "../governance/interfaces/ILockedGold.sol";
import "../governance/interfaces/IValidators.sol";

import "../identity/interfaces/IRandom.sol";
import "../identity/interfaces/IAttestations.sol";
import "../identity/interfaces/IFederatedAttestations.sol";

import "../stability/interfaces/IExchange.sol";
import "../stability/interfaces/IReserve.sol";
import "../stability/interfaces/ISortedOracles.sol";
import "../stability/interfaces/IStableToken.sol";

contract UsingRegistryV2 {
  address internal constant registryAddress = 0x000000000000000000000000000000000000ce10;
  IRegistry public constant registryContract = IRegistry(registryAddress);

  bytes32 internal constant ACCOUNTS_REGISTRY_ID = keccak256(abi.encodePacked("Accounts"));
  bytes32 internal constant ATTESTATIONS_REGISTRY_ID = keccak256(abi.encodePacked("Attestations"));
  bytes32 internal constant DOWNTIME_SLASHER_REGISTRY_ID = keccak256(
    abi.encodePacked("DowntimeSlasher")
  );
  bytes32 internal constant DOUBLE_SIGNING_SLASHER_REGISTRY_ID = keccak256(
    abi.encodePacked("DoubleSigningSlasher")
  );
  bytes32 internal constant ELECTION_REGISTRY_ID = keccak256(abi.encodePacked("Election"));
  bytes32 internal constant EXCHANGE_REGISTRY_ID = keccak256(abi.encodePacked("Exchange"));
  bytes32 internal constant EXCHANGE_EURO_REGISTRY_ID = keccak256(abi.encodePacked("ExchangeEUR"));
  bytes32 internal constant EXCHANGE_REAL_REGISTRY_ID = keccak256(abi.encodePacked("ExchangeBRL"));

  bytes32 internal constant FEE_CURRENCY_WHITELIST_REGISTRY_ID = keccak256(
    abi.encodePacked("FeeCurrencyWhitelist")
  );
  bytes32 internal constant FEDERATED_ATTESTATIONS_REGISTRY_ID = keccak256(
    abi.encodePacked("FederatedAttestations")
  );
  bytes32 internal constant FREEZER_REGISTRY_ID = keccak256(abi.encodePacked("Freezer"));
  bytes32 internal constant GOLD_TOKEN_REGISTRY_ID = keccak256(abi.encodePacked("GoldToken"));
  bytes32 internal constant GOVERNANCE_REGISTRY_ID = keccak256(abi.encodePacked("Governance"));
  bytes32 internal constant GOVERNANCE_SLASHER_REGISTRY_ID = keccak256(
    abi.encodePacked("GovernanceSlasher")
  );
  bytes32 internal constant LOCKED_GOLD_REGISTRY_ID = keccak256(abi.encodePacked("LockedGold"));
  bytes32 internal constant RESERVE_REGISTRY_ID = keccak256(abi.encodePacked("Reserve"));
  bytes32 internal constant RANDOM_REGISTRY_ID = keccak256(abi.encodePacked("Random"));
  bytes32 internal constant SORTED_ORACLES_REGISTRY_ID = keccak256(
    abi.encodePacked("SortedOracles")
  );
  bytes32 internal constant STABLE_TOKEN_REGISTRY_ID = keccak256(abi.encodePacked("StableToken"));
  bytes32 internal constant STABLE_EURO_TOKEN_REGISTRY_ID = keccak256(
    abi.encodePacked("StableTokenEUR")
  );
  bytes32 internal constant STABLE_REAL_TOKEN_REGISTRY_ID = keccak256(
    abi.encodePacked("StableTokenBRL")
  );
  bytes32 internal constant VALIDATORS_REGISTRY_ID = keccak256(abi.encodePacked("Validators"));

  modifier onlyRegisteredContract(bytes32 identifierHash) {
    require(
      registryContract.getAddressForOrDie(identifierHash) == msg.sender,
      "only registered contract"
    );
    _;
  }

  modifier onlyRegisteredContracts(bytes32[] memory identifierHashes) {
    require(registryContract.isOneOf(identifierHashes, msg.sender), "only registered contracts");
    _;
  }

  function getAccounts() internal view returns (IAccounts) {
    return IAccounts(registryContract.getAddressForOrDie(ACCOUNTS_REGISTRY_ID));
  }

  function getAttestations() internal view returns (IAttestations) {
    return IAttestations(registryContract.getAddressForOrDie(ATTESTATIONS_REGISTRY_ID));
  }

  function getElection() internal view returns (IElection) {
    return IElection(registryContract.getAddressForOrDie(ELECTION_REGISTRY_ID));
  }

  function getExchange() internal view returns (IExchange) {
    return IExchange(registryContract.getAddressForOrDie(EXCHANGE_REGISTRY_ID));
  }

  function getExchangeDollar() internal view returns (IExchange) {
    return getExchange();
  }

  function getExchangeEuro() internal view returns (IExchange) {
    return IExchange(registryContract.getAddressForOrDie(EXCHANGE_EURO_REGISTRY_ID));
  }

  function getExchangeREAL() internal view returns (IExchange) {
    return IExchange(registryContract.getAddressForOrDie(EXCHANGE_REAL_REGISTRY_ID));
  }

  function getFeeCurrencyWhitelistRegistry() internal view returns (IFeeCurrencyWhitelist) {
    return
      IFeeCurrencyWhitelist(
        registryContract.getAddressForOrDie(FEE_CURRENCY_WHITELIST_REGISTRY_ID)
      );
  }

  function getFederatedAttestations() internal view returns (IFederatedAttestations) {
    return
      IFederatedAttestations(
        registryContract.getAddressForOrDie(FEDERATED_ATTESTATIONS_REGISTRY_ID)
      );
  }

  function getFreezer() internal view returns (IFreezer) {
    return IFreezer(registryContract.getAddressForOrDie(FREEZER_REGISTRY_ID));
  }

  function getGoldToken() internal view returns (IERC20) {
    return IERC20(registryContract.getAddressForOrDie(GOLD_TOKEN_REGISTRY_ID));
  }

  function getGovernance() internal view returns (IGovernance) {
    return IGovernance(registryContract.getAddressForOrDie(GOVERNANCE_REGISTRY_ID));
  }

  function getLockedGold() internal view returns (ILockedGold) {
    return ILockedGold(registryContract.getAddressForOrDie(LOCKED_GOLD_REGISTRY_ID));
  }

  function getRandom() internal view returns (IRandom) {
    return IRandom(registryContract.getAddressForOrDie(RANDOM_REGISTRY_ID));
  }

  function getReserve() internal view returns (IReserve) {
    return IReserve(registryContract.getAddressForOrDie(RESERVE_REGISTRY_ID));
  }

  function getSortedOracles() internal view returns (ISortedOracles) {
    return ISortedOracles(registryContract.getAddressForOrDie(SORTED_ORACLES_REGISTRY_ID));
  }

  function getStableToken() internal view returns (IStableToken) {
    return IStableToken(registryContract.getAddressForOrDie(STABLE_TOKEN_REGISTRY_ID));
  }

  function getStableDollarToken() internal view returns (IStableToken) {
    return getStableToken();
  }

  function getStableEuroToken() internal view returns (IStableToken) {
    return IStableToken(registryContract.getAddressForOrDie(STABLE_EURO_TOKEN_REGISTRY_ID));
  }

  function getStableRealToken() internal view returns (IStableToken) {
    return IStableToken(registryContract.getAddressForOrDie(STABLE_REAL_TOKEN_REGISTRY_ID));
  }

  function getValidators() internal view returns (IValidators) {
    return IValidators(registryContract.getAddressForOrDie(VALIDATORS_REGISTRY_ID));
  }
}
