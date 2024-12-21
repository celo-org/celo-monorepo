// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.0 <0.8.20;

// Note: This is not an exact copy of UsingRegistry or UsingRegistryV2 in the contract's folder
// because Mento's interfaces still don't support Solidity 0.8

import "@openzeppelin/contracts8/access/Ownable.sol";
import "@openzeppelin/contracts8/token/ERC20/IERC20.sol";

import "./interfaces/IScoreReader.sol";

import "../../contracts/common/interfaces/IAccounts.sol";
import "../../contracts/common/interfaces/IEpochManager.sol";
import "../../contracts/common/interfaces/IFeeCurrencyWhitelist.sol";
import "../../contracts/common/interfaces/IFreezer.sol";
import "../../contracts/common/interfaces/IRegistry.sol";
import "../../contracts/common/interfaces/ICeloUnreleasedTreasury.sol";

import "../../contracts/governance/interfaces/IElection.sol";
import "../../contracts/governance/interfaces/IEpochRewards.sol";
import "../../contracts/governance/interfaces/IGovernance.sol";
import "../../contracts/governance/interfaces/ILockedGold.sol";
import "../../contracts/governance/interfaces/ILockedCelo.sol";
import "../../contracts/governance/interfaces/IValidators.sol";

import "../../contracts/identity/interfaces/IRandom.sol";
import "../../contracts/identity/interfaces/IAttestations.sol";
import "../../contracts/identity/interfaces/IFederatedAttestations.sol";

// import "../../lib/mento-core/contracts/interfaces/IExchange.sol";
// import "../../lib/mento-core/contracts/interfaces/IReserve.sol";
// import "../../lib/mento-core/contracts/interfaces/IStableToken.sol";
import "../../contracts/stability/interfaces/ISortedOracles.sol";

contract UsingRegistryV2NoMento {
  address internal constant registryAddress = 0x000000000000000000000000000000000000ce10;
  IRegistry public constant registryContract = IRegistry(registryAddress);

  bytes32 internal constant ACCOUNTS_REGISTRY_ID = keccak256(abi.encodePacked("Accounts"));
  bytes32 internal constant ATTESTATIONS_REGISTRY_ID = keccak256(abi.encodePacked("Attestations"));
  bytes32 internal constant DOWNTIME_SLASHER_REGISTRY_ID =
    keccak256(abi.encodePacked("DowntimeSlasher"));
  bytes32 internal constant DOUBLE_SIGNING_SLASHER_REGISTRY_ID =
    keccak256(abi.encodePacked("DoubleSigningSlasher"));
  bytes32 internal constant ELECTION_REGISTRY_ID = keccak256(abi.encodePacked("Election"));
  bytes32 internal constant EXCHANGE_REGISTRY_ID = keccak256(abi.encodePacked("Exchange"));
  bytes32 internal constant EXCHANGE_EURO_REGISTRY_ID = keccak256(abi.encodePacked("ExchangeEUR"));
  bytes32 internal constant EXCHANGE_REAL_REGISTRY_ID = keccak256(abi.encodePacked("ExchangeBRL"));

  bytes32 internal constant FEE_CURRENCY_WHITELIST_REGISTRY_ID =
    keccak256(abi.encodePacked("FeeCurrencyWhitelist"));
  bytes32 internal constant FEDERATED_ATTESTATIONS_REGISTRY_ID =
    keccak256(abi.encodePacked("FederatedAttestations"));
  bytes32 internal constant FREEZER_REGISTRY_ID = keccak256(abi.encodePacked("Freezer"));
  bytes32 internal constant GOLD_TOKEN_REGISTRY_ID = keccak256(abi.encodePacked("GoldToken"));
  bytes32 internal constant GOVERNANCE_REGISTRY_ID = keccak256(abi.encodePacked("Governance"));
  bytes32 internal constant GOVERNANCE_SLASHER_REGISTRY_ID =
    keccak256(abi.encodePacked("GovernanceSlasher"));
  bytes32 internal constant LOCKED_GOLD_REGISTRY_ID = keccak256(abi.encodePacked("LockedGold"));
  bytes32 internal constant RESERVE_REGISTRY_ID = keccak256(abi.encodePacked("Reserve"));
  bytes32 internal constant RANDOM_REGISTRY_ID = keccak256(abi.encodePacked("Random"));
  bytes32 internal constant SORTED_ORACLES_REGISTRY_ID =
    keccak256(abi.encodePacked("SortedOracles"));
  bytes32 internal constant STABLE_TOKEN_REGISTRY_ID = keccak256(abi.encodePacked("StableToken"));
  bytes32 internal constant STABLE_EURO_TOKEN_REGISTRY_ID =
    keccak256(abi.encodePacked("StableTokenEUR"));
  bytes32 internal constant STABLE_REAL_TOKEN_REGISTRY_ID =
    keccak256(abi.encodePacked("StableTokenBRL"));
  bytes32 internal constant VALIDATORS_REGISTRY_ID = keccak256(abi.encodePacked("Validators"));
  bytes32 internal constant CELO_UNRELEASED_TREASURY_REGISTRY_ID =
    keccak256(abi.encodePacked("CeloUnreleasedTreasury"));

  bytes32 internal constant CELO_TOKEN_REGISTRY_ID = keccak256(abi.encodePacked("CeloToken"));
  bytes32 internal constant LOCKED_CELO_REGISTRY_ID = keccak256(abi.encodePacked("LockedCelo"));
  bytes32 internal constant EPOCH_REWARDS_REGISTRY_ID = keccak256(abi.encodePacked("EpochRewards"));
  bytes32 internal constant EPOCH_MANAGER_ENABLER_REGISTRY_ID =
    keccak256(abi.encodePacked("EpochManagerEnabler"));
  bytes32 internal constant EPOCH_MANAGER_REGISTRY_ID = keccak256(abi.encodePacked("EpochManager"));
  bytes32 internal constant SCORE_MANAGER_REGISTRY_ID = keccak256(abi.encodePacked("ScoreManager"));

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

  // function getExchange() internal view returns (IExchange) {
  //   return IExchange(registryContract.getAddressForOrDie(EXCHANGE_REGISTRY_ID));
  // }

  // function getExchangeDollar() internal view returns (IExchange) {
  //   return getExchange();
  // }

  // function getExchangeEuro() internal view returns (IExchange) {
  //   return IExchange(registryContract.getAddressForOrDie(EXCHANGE_EURO_REGISTRY_ID));
  // }

  // function getExchangeREAL() internal view returns (IExchange) {
  //   return IExchange(registryContract.getAddressForOrDie(EXCHANGE_REAL_REGISTRY_ID));
  // }

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

  function getCeloToken() internal view returns (IERC20) {
    return IERC20(registryContract.getAddressForOrDie(CELO_TOKEN_REGISTRY_ID));
  }

  function getGovernance() internal view returns (IGovernance) {
    return IGovernance(registryContract.getAddressForOrDie(GOVERNANCE_REGISTRY_ID));
  }

  function getLockedGold() internal view returns (ILockedGold) {
    return ILockedGold(registryContract.getAddressForOrDie(LOCKED_GOLD_REGISTRY_ID));
  }

  function getLockedCelo() internal view returns (ILockedCelo) {
    return ILockedCelo(registryContract.getAddressForOrDie(LOCKED_CELO_REGISTRY_ID));
  }

  function getRandom() internal view returns (IRandom) {
    return IRandom(registryContract.getAddressForOrDie(RANDOM_REGISTRY_ID));
  }

  // function getReserve() internal view returns (IReserve) {
  //   return IReserve(registryContract.getAddressForOrDie(RESERVE_REGISTRY_ID));
  // }

  function getSortedOracles() internal view returns (ISortedOracles) {
    return ISortedOracles(registryContract.getAddressForOrDie(SORTED_ORACLES_REGISTRY_ID));
  }

  // function getStableToken() internal view returns (IStableToken) {
  //   return IStableToken(registryContract.getAddressForOrDie(STABLE_TOKEN_REGISTRY_ID));
  // }

  // function getStableDollarToken() internal view returns (IStableToken) {
  //   return getStableToken();
  // }

  // function getStableEuroToken() internal view returns (IStableToken) {
  //   return IStableToken(registryContract.getAddressForOrDie(STABLE_EURO_TOKEN_REGISTRY_ID));
  // }

  // function getStableRealToken() internal view returns (IStableToken) {
  //   return IStableToken(registryContract.getAddressForOrDie(STABLE_REAL_TOKEN_REGISTRY_ID));
  // }

  function getValidators() internal view returns (IValidators) {
    return IValidators(registryContract.getAddressForOrDie(VALIDATORS_REGISTRY_ID));
  }

  function getCeloUnreleasedTreasury() internal view returns (ICeloUnreleasedTreasury) {
    return
      ICeloUnreleasedTreasury(
        registryContract.getAddressForOrDie(CELO_UNRELEASED_TREASURY_REGISTRY_ID)
      );
  }

  function getEpochRewards() internal view returns (IEpochRewards) {
    return IEpochRewards(registryContract.getAddressForOrDie(EPOCH_REWARDS_REGISTRY_ID));
  }

  function getEpochManager() internal view returns (IEpochManager) {
    return IEpochManager(registryContract.getAddressForOrDie(EPOCH_MANAGER_REGISTRY_ID));
  }

  function getScoreReader() internal view returns (IScoreReader) {
    return IScoreReader(registryContract.getAddressForOrDie(SCORE_MANAGER_REGISTRY_ID));
  }
}
