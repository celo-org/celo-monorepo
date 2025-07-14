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
}
