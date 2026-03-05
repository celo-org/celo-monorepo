pragma solidity >=0.8.7 <0.8.20;

import { TestConstants } from "@test-sol/constants.sol";

contract MigrationsConstants is TestConstants {
  // Addresses
  // address constant DEPLOYER_ACCOUNT = 0x95a40aA01d2d72b4122C19c86160710D01224ada;
  address constant DEPLOYER_ACCOUNT = 0xa3A3a43E2de78070129C697A5CdCa0618B1f574d;

  // List of contracts that are expected to be in Registry.sol
  string[] contractsInRegistry = [
    "Accounts",
    "CeloUnreleasedTreasury",
    "CeloToken",
    "Election",
    "EpochRewards",
    "EpochManagerEnabler",
    "EpochManager",
    "Escrow",
    "FederatedAttestations",
    "FeeCurrencyDirectory",
    "Freezer",
    "FeeHandler",
    "Governance",
    "GovernanceSlasher",
    "LockedGold",
    "OdisPayments",
    // "Registry", // Registry is deployed by the migration script and has a different proxy FIXME
    "SortedOracles",
    "UniswapFeeHandlerSeller",
    "MentoFeeHandlerSeller",
    "Validators",
    "ScoreManager"
  ];
}
