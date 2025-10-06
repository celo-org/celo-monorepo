// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

// Test imports
import { TestWithUtils08 } from "@test-sol/TestWithUtils08.sol";

// Celo contracts imports
import { IAccounts } from "@celo-contracts/common/interfaces/IAccounts.sol";
import { ICeloUnreleasedTreasury } from "@celo-contracts/common/interfaces/ICeloUnreleasedTreasury.sol";
import { ICeloToken } from "@celo-contracts/common/interfaces/ICeloToken.sol";
import { IElection } from "@celo-contracts/governance/interfaces/IElection.sol";
import { IEpochRewards } from "@celo-contracts/governance/interfaces/IEpochRewards.sol";
import { IEpochManagerEnabler } from "@celo-contracts/common/interfaces/IEpochManagerEnabler.sol";
import { IEpochManager } from "@celo-contracts/common/interfaces/IEpochManager.sol";
import { IEscrow } from "@celo-contracts/identity/interfaces/IEscrow.sol";
import { IFederatedAttestations } from "@celo-contracts/identity/interfaces/IFederatedAttestations.sol";
import { FeeCurrencyDirectory } from "@celo-contracts-8/common/FeeCurrencyDirectory.sol";
import { IFeeHandler } from "@celo-contracts/common/interfaces/IFeeHandler.sol";
import { IFreezer } from "@celo-contracts/common/interfaces/IFreezer.sol";
import { IGovernance } from "@celo-contracts/governance/interfaces/IGovernance.sol";
import { ILockedGold } from "@celo-contracts/governance/interfaces/ILockedGold.sol";
import { IOdisPayments } from "@celo-contracts/identity/interfaces/IOdisPayments.sol";
import { IRandom } from "@celo-contracts/identity/interfaces/IRandom.sol";
import { IScoreManager } from "@celo-contracts-8/common/interfaces/IScoreManager.sol";
import { ISortedOracles } from "@celo-contracts/stability/interfaces/ISortedOracles.sol";
import { IValidators } from "@celo-contracts/governance/interfaces/IValidators.sol";

contract Devchain is TestWithUtils08 {
  // All core contracts that are expected to be in the Registry on the devchain
  // TODO: Change all contracts to be imported as interfaces
  IAccounts accounts;
  ICeloUnreleasedTreasury celoUnreleasedTreasuryContract;
  ICeloToken celoTokenContract;
  IElection election;
  IEpochRewards epochRewards;
  IEpochManagerEnabler epochManagerEnablerContract;
  IEpochManager epochManagerContract;
  IEscrow escrow;
  IFederatedAttestations federatedAttestations;
  FeeCurrencyDirectory feeCurrencyDirectory;
  IFeeHandler feeHandler;
  IFreezer freezer;
  IGovernance governance;
  ILockedGold lockedCelo;
  IOdisPayments odisPayments;
  IRandom randomContract;
  IScoreManager scoreManager;
  ISortedOracles sortedOracles;
  IValidators validators;

  constructor() {
    // Fetch all core contracts that are expected to be in the Registry on the devchain
    // TODO: Ensure all contracts have getters in UsingRegistry
    accounts = getAccounts();
    celoUnreleasedTreasuryContract = getCeloUnreleasedTreasury();
    celoTokenContract = ICeloToken(registryContract.getAddressForOrDie(GOLD_TOKEN_REGISTRY_ID));
    election = getElection();
    epochRewards = getEpochRewards();
    epochManagerEnablerContract = getEpochManagerEnabler();
    epochManagerContract = getEpochManager();
    escrow = getEscrow();
    federatedAttestations = getFederatedAttestations();
    feeCurrencyDirectory = FeeCurrencyDirectory(
      registryContract.getAddressForOrDie(FEE_CURRENCY_DIRECTORY_REGISTRY_ID)
    ); // FIXME: FeeCurrencyDirectory is not in UsingRegistry.sol
    feeHandler = getFeeHandler();
    freezer = getFreezer();
    governance = getGovernance();
    lockedCelo = getLockedGold();
    odisPayments = getOdisPayments();
    randomContract = getRandom();
    scoreManager = IScoreManager(address(getScoreReader()));
    sortedOracles = getSortedOracles();
    validators = getValidators();

    // TODO: Consider asserting that all contracts we expect are available in the Devchain class
    // (see list in migrations_sol/constants.sol)
  }
  function setUp() public virtual override {
    // Added to avoid adding a setup function in each e2e test, when its not required.
    // Note: This function does not call `super.setUp()`, because we dont want to run the parent's setup.
  }
}
