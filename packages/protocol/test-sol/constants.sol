// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.5.13 <0.8.20;

contract TestConstants {
  // Units
  uint256 public constant FIXED1 = 1e24;
  uint256 public constant MINUTE = 60;
  uint256 public constant HOUR = 60 * MINUTE;
  uint256 public constant DAY = 24 * HOUR;
  uint256 public constant MONTH = 30 * DAY;
  uint256 constant WEEK = 7 * DAY;
  uint256 public constant YEAR = 365 * DAY;

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
  string constant ScoreManagerContract = "ScoreManager";
  string constant ReserveContract = "Reserve";
  string constant CeloUnreleasedTreasureContract = "CeloUnreleasedTreasure";

  // Constant addresses
  address constant REGISTRY_ADDRESS = 0x000000000000000000000000000000000000ce10;
  address constant PROXY_ADMIN_ADDRESS = 0x4200000000000000000000000000000000000018;
}
