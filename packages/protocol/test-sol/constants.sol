pragma solidity ^0.5.13;

// This contract is only required for Solidity 0.5
contract Constants {
  uint256 public constant FIXED1 = 1e24;
  uint256 constant YEAR = 365 * 24 * 60 * 60;

  // uint256 constant EPOCH_SIZE = (24*60*60)/5;
  uint256 constant EPOCH_SIZE = 100; // TODO roll back

  // contract names
  string constant ElectionContract = "Election";
  string constant SortedOraclesContract = "SortedOracles";
  string constant StableTokenContract = "StableToken";
  string constant GoldTokenContract = "GoldToken";
  string constant FreezerContract = "Freezer";
}
