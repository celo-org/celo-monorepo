pragma solidity ^0.5.13;

// This contract is only required for Solidity 0.5
contract Constants {
  uint256 public constant FIXED1 = 1e24;
  uint256 public constant HOUR = 60 * 60;
  uint256 public constant DAY = 24 * HOUR;
  uint256 public constant YEAR = 365 * DAY;
  uint256 public constant EPOCH_SIZE = DAY / 5;

  // contract names
  string constant ElectionContract = "Election";
  string constant SortedOraclesContract = "SortedOracles";
  string constant StableTokenContract = "StableToken";
  string constant GoldTokenContract = "GoldToken";
  string constant FreezerContract = "Freezer";
  string constant AccountsContract = "Accounts";
  string constant LockedGoldContract = "LockedGold";
  string constant ValidatorsContract = "Validators";
}
