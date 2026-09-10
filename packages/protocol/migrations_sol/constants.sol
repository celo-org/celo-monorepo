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
   * @notice Resolves a contract's forge artifact path.
   * @dev Implementations compile with Solidity 0.8 into out-truffle-compat-0.8. The
   * proxies and their factory are frozen Solidity 0.5 artifacts under artifacts/solc-0.5,
   * and the vendored Mento contracts are built by the solc05 profile into out-solc-0.5.
   * Resolving by what actually exists on disk replaces the hand-maintained per-contract
   * version list this contract used to carry.
   */
  function getContractArtifactPath(string memory contractName) public returns (string memory) {
    Vm vm_ = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    string memory suffix = string.concat(contractName, ".sol/", contractName, ".json");
    string memory path08 = string.concat("out-truffle-compat-0.8/", suffix);
    if (vm_.isFile(path08)) {
      return path08;
    }
    string memory frozen = string.concat("artifacts/solc-0.5/", suffix);
    if (vm_.isFile(frozen)) {
      return frozen;
    }
    return string.concat("out-solc-0.5/", suffix);
  }
}
