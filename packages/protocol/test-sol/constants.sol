// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.5.13 <0.8.20;

contract TestConstants {
  // Units
  uint256 public constant FIXED1 = 1e24;
  uint256 public constant MINUTE = 60;
  uint256 public constant HOUR = 60 * MINUTE;
  uint256 public constant MONTH = 30 * 86400;
  uint256 constant WEEK = 7 * 86400;
  uint256 public constant YEAR = 365 * 86400;
  uint256 public constant L2_BLOCK_IN_EPOCH = 43200;

  // Contract names
  string constant ElectionContract = "Election";
  string constant SortedOraclesContract = "SortedOracles";
  string constant StableTokenContract = "StableToken";
  string constant GoldTokenContract = "GoldToken";
  string constant CeloTokenContract = "CeloToken";
  string constant FreezerContract = "Freezer";
  string constant AccountsContract = "Accounts";
  string constant LockedGoldContract = "LockedGold";
  string constant LockedCeloContract = "LockedCelo";
  string constant ValidatorsContract = "Validators";
  string constant GovernanceContract = "Governance";
  string constant EpochRewardsContract = "EpochRewards";
  string constant EpochManagerContract = "EpochManager";
  string constant EpochManagerEnablerContract = "EpochManagerEnabler";
  string constant ScoreManagerContract = "ScoreManager";
  string constant ReserveContract = "Reserve";
  string constant CeloUnreleasedTreasuryContract = "CeloUnreleasedTreasury";

  // Constant addresses
  address constant REGISTRY_ADDRESS = 0x000000000000000000000000000000000000ce10;
  address constant PROXY_ADMIN_ADDRESS = 0x4200000000000000000000000000000000000018;

  uint256 constant L1_MINTED_CELO_SUPPLY = 692702432463315819704447326; // as of May 15 2024

  uint256 constant CELO_SUPPLY_CAP = 1000000000 ether; // 1 billion Celo
  uint256 constant GENESIS_CELO_SUPPLY = 600000000 ether; // 600 million Celo

  uint256 constant FIFTEEN_YEAR_LINEAR_REWARD = (CELO_SUPPLY_CAP - GENESIS_CELO_SUPPLY) / 2; // 200 million Celo

  uint256 constant FIFTEEN_YEAR_CELO_SUPPLY = GENESIS_CELO_SUPPLY + FIFTEEN_YEAR_LINEAR_REWARD; // 800 million Celo (includes GENESIS_CELO_SUPPLY)

  uint256 constant MAX_L2_DISTRIBUTION = FIFTEEN_YEAR_CELO_SUPPLY - L1_MINTED_CELO_SUPPLY; // 107.2 million Celo

  uint256 constant L2_INITIAL_STASH_BALANCE = FIFTEEN_YEAR_LINEAR_REWARD + MAX_L2_DISTRIBUTION; // leftover from L1 target supply plus the 2nd 15 year term.
}
