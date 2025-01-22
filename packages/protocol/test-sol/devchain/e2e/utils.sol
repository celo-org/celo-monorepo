// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "@celo-contracts/common/interfaces/IRegistry.sol";
import { IEpochManager } from "@celo-contracts/common/interfaces/IEpochManager.sol";
import { IAccounts } from "@celo-contracts/common/interfaces/IAccounts.sol";
import { IScoreManager } from "@celo-contracts-8/common/interfaces/IScoreManager.sol";
import { IValidators } from "@celo-contracts/governance/interfaces/IValidators.sol";
import { IElection } from "@celo-contracts/governance/interfaces/IElection.sol";
import { ILockedCelo } from "@celo-contracts/governance/interfaces/ILockedCelo.sol";
import { ICeloToken } from "@celo-contracts/common/interfaces/ICeloToken.sol";

// All core contracts that are expected to be in the Registry on the devchain
import "@celo-contracts-8/common/FeeCurrencyDirectory.sol";
import "@celo-contracts/stability/interfaces/ISortedOracles.sol";
import "@celo-contracts/common/interfaces/ICeloUnreleasedTreasury.sol";

import "@test-sol/TestWithUtils08.sol";

contract Devchain is TestWithUtils08 {
  // All core contracts that are expected to be in the Registry on the devchain
  ISortedOracles sortedOracles;
  FeeCurrencyDirectory feeCurrencyDirectory;
  IEpochManager epochManagerContract;
  ICeloUnreleasedTreasury celoUnreleasedTreasuryContract;
  IValidators validators;
  IAccounts accounts;
  IScoreManager scoreManager;
  IElection election;
  ILockedCelo lockedCelo;
  ICeloToken celoTokenContract;

  constructor() {
    // Fetch all core contracts that are expeceted to be in the Registry on the devchain
    sortedOracles = getSortedOracles();
    feeCurrencyDirectory = FeeCurrencyDirectory(
      registryContract.getAddressForStringOrDie("FeeCurrencyDirectory")
    ); // FeeCurrencyDirectory is not in UsingRegistry.sol

    epochManagerContract = getEpochManager();
    celoUnreleasedTreasuryContract = getCeloUnreleasedTreasury();
    validators = getValidators();
    accounts = getAccounts();
    scoreManager = IScoreManager(address(getScoreReader()));
    election = getElection();
    lockedCelo = getLockedCelo();
    celoTokenContract = ICeloToken(registryContract.getAddressForOrDie(GOLD_TOKEN_REGISTRY_ID));

    // TODO: Add missing core contracts below (see list in migrations_sol/constants.sol)
    // TODO: Consider asserting that all contracts we expect are available in the Devchain class
    // (see list in migrations_sol/constants.sol)
  }
  function setUp() public virtual override {
    // Added to avoid adding a setup function in each e2e test, when its not required.
  }
}
