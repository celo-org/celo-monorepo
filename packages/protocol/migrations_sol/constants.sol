pragma solidity >=0.8.7 <0.8.20;

import { TestConstants } from "@test-sol/constants.sol";

contract MigrationsConstants is TestConstants {
  // Addresses
  address constant DEPLOYER_ACCOUNT = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;

  // List of contracts that are expected to be in Registry.sol
  // TODO: Probably should be synced with Migration.s.sol
  // TODO: Change to be automatically populated and length calculated
  string[26] contractsInRegistry = [
    "Accounts",
    "BlockchainParameters",
    "CeloUnreleasedTreasury",
    "CeloToken",
    "DoubleSigningSlasher",
    "DowntimeSlasher",
    "Election",
    "EpochRewards",
    "EpochManagerEnabler",
    "EpochManager",
    "Escrow",
    "FederatedAttestations",
    "FeeCurrencyDirectory",
    "FeeHandler",
    "Freezer",
    "Governance",
    "GovernanceSlasher",
    "LockedGold",
    "OdisPayments",
    "Random",
    "Registry", // FIXME: Should Registry be inside Registry?
    "ScoreManager",
    "SortedOracles",
    "Validators",
    "MentoFeeHandlerSeller",
    "UniswapFeeHandlerSeller"
  ];

  string[26] contractsInRegistryPath = [
    string.concat("out-truffle-compat/", "Accounts", ".sol/", "Accounts", ".json"),
    string.concat(
      "out-truffle-compat/",
      "BlockchainParameters",
      ".sol/",
      "BlockchainParameters",
      ".json"
    ),
    string.concat(
      "out-truffle-compat-0.8/",
      "CeloUnreleasedTreasury",
      ".sol/",
      "CeloUnreleasedTreasury",
      ".json"
    ),
    string.concat("out-truffle-compat/", "CeloToken", ".sol/", "CeloToken", ".json"),
    string.concat(
      "out-truffle-compat/",
      "DoubleSigningSlasher",
      ".sol/",
      "DoubleSigningSlasher",
      ".json"
    ),
    string.concat("out-truffle-compat/", "DowntimeSlasher", ".sol/", "DowntimeSlasher", ".json"),
    string.concat("out-truffle-compat/", "Election", ".sol/", "Election", ".json"),
    string.concat("out-truffle-compat/", "EpochRewards", ".sol/", "EpochRewards", ".json"),
    string.concat(
      "out-truffle-compat-0.8/",
      "EpochManagerEnabler",
      ".sol/",
      "EpochManagerEnabler",
      ".json"
    ),
    string.concat("out-truffle-compat-0.8/", "EpochManager", ".sol/", "EpochManager", ".json"),
    string.concat("out-truffle-compat/", "Escrow", ".sol/", "Escrow", ".json"),
    string.concat(
      "out-truffle-compat/",
      "FederatedAttestations",
      ".sol/",
      "FederatedAttestations",
      ".json"
    ),
    string.concat(
      "out-truffle-compat-0.8/",
      "FeeCurrencyDirectory",
      ".sol/",
      "FeeCurrencyDirectory",
      ".json"
    ),
    string.concat("out-truffle-compat/", "FeeHandler", ".sol/", "FeeHandler", ".json"),
    string.concat("out-truffle-compat/", "Freezer", ".sol/", "Freezer", ".json"),
    string.concat("out-truffle-compat/", "Governance", ".sol/", "Governance", ".json"),
    string.concat(
      "out-truffle-compat/",
      "GovernanceSlasher",
      ".sol/",
      "GovernanceSlasher",
      ".json"
    ),
    string.concat("out-truffle-compat/", "LockedGold", ".sol/", "LockedGold", ".json"),
    string.concat("out-truffle-compat/", "OdisPayments", ".sol/", "OdisPayments", ".json"),
    string.concat("out-truffle-compat/", "Random", ".sol/", "Random", ".json"),
    string.concat("out-truffle-compat/", "Registry", ".sol/", "Registry", ".json"),
    string.concat("out-truffle-compat-0.8/", "ScoreManager", ".sol/", "ScoreManager", ".json"),
    string.concat("out-truffle-compat/", "SortedOracles", ".sol/", "SortedOracles", ".json"),
    string.concat("out-truffle-compat/", "Validators", ".sol/", "Validators", ".json"),
    string.concat(
      "out-truffle-compat/",
      "MentoFeeHandlerSeller",
      ".sol/",
      "MentoFeeHandlerSeller",
      ".json"
    ),
    string.concat(
      "out-truffle-compat/",
      "UniswapFeeHandlerSeller",
      ".sol/",
      "UniswapFeeHandlerSeller",
      ".json"
    )
  ];
}
