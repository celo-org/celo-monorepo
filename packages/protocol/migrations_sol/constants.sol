pragma solidity >=0.8.7 <0.8.20;

import { Vm } from "forge-std-8/Vm.sol";

import { TestConstants } from "@test-sol/constants.sol";

contract MigrationsConstants is TestConstants {

  // List of contracts that are expected to be in Registry.sol
  string[] contractsInRegistry = [
    "Accounts",
    "CeloUnreleasedTreasury",
    "CeloToken",
    "Election",
    "EpochRewards",
    "EpochManager",
    "Escrow",
    "FederatedAttestations",
    "FeeCurrencyDirectory",
    "FeeHandler",
    "Freezer",
    "Governance",
    "GovernanceSlasher",
    "LockedGold", // TODO: eventually has to be renamed to LockedCelo
    "OdisPayments",
    "Registry",
    "ScoreManager",
    "SortedOracles",
    "Validators",
    "MentoFeeHandlerSeller",
    "UniswapFeeHandlerSeller"
  ];

  // Mento contracts deployed by the migration but not part of the core
  // contractsInRegistry set (kept around mainly for StableToken compatibility).
  string[] mentoContractsInRegistry = [
    "Reserve",
    "StableToken",
    "StableTokenEUR",
    "StableTokenBRL"
  ];

  /**
   * @notice Resolves a contract's forge artifact path across the two build trees.
   * @dev All implementations now compile with Solidity 0.8 into out-truffle-compat-0.8,
   * so that dir is checked first; only the 0.5 leftovers (proxies and their helpers)
   * still come from out-truffle-compat. Resolving by what actually exists on disk
   * replaces the hand-maintained per-contract version list this contract used to carry.
   */
  function getContractArtifactPath(string memory contractName) public returns (string memory) {
    Vm vm_ = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    string memory suffix = string.concat(contractName, ".sol/", contractName, ".json");
    string memory path08 = string.concat("out-truffle-compat-0.8/", suffix);
    if (vm_.isFile(path08)) {
      return path08;
    }
    return string.concat("out-truffle-compat/", suffix);
  }
}
