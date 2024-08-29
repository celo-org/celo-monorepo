pragma solidity >=0.8.0 <0.9.0;
// solhint-disable no-unused-vars

/**
 * @title A mock StableToken for testing.
 */
contract MockCeloToken08 {
  uint256 public totalSupply_;
  uint8 public constant decimals = 18;
  mapping(address => uint256) balances;

  uint256 constant L1_MINTED_CELO_SUPPLY = 692702432463315819704447326; // as of May 15 2024

  uint256 constant CELO_SUPPLY_CAP = 1000000000 ether; // 1 billion Celo
  uint256 constant GENESIS_CELO_SUPPLY = 600000000 ether; // 600 million Celo

  uint256 constant FIFTEEN_YEAR_LINEAR_REWARD = (CELO_SUPPLY_CAP - GENESIS_CELO_SUPPLY) / 2; // 200 million Celo

  uint256 constant FIFTEEN_YEAR_CELO_SUPPLY = GENESIS_CELO_SUPPLY + FIFTEEN_YEAR_LINEAR_REWARD; // 800 million Celo (includes GENESIS_CELO_SUPPLY)

  uint256 constant MAX_L2_DISTRIBUTION = FIFTEEN_YEAR_CELO_SUPPLY - L1_MINTED_CELO_SUPPLY; // 107.2 million Celo

  uint256 constant L2_INITIAL_STASH_BALANCE = FIFTEEN_YEAR_LINEAR_REWARD + MAX_L2_DISTRIBUTION; // leftover from L1 target supply plus the 2nd 15 year term.

  function setTotalSupply(uint256 value) external {
    totalSupply_ = value;
  }

  function transfer(address to, uint256 amount) external returns (bool) {
    return _transfer(msg.sender, to, amount);
  }

  function transferFrom(address from, address to, uint256 amount) external returns (bool) {
    return _transfer(from, to, amount);
  }

  function setBalanceOf(address a, uint256 value) external {
    balances[a] = value;
  }

  function balanceOf(address a) public view returns (uint256) {
    return balances[a];
  }

  function totalSupply() public view returns (uint256) {
    return totalSupply_;
  }
  function allocatedSupply() public pure returns (uint256) {
    return CELO_SUPPLY_CAP - L2_INITIAL_STASH_BALANCE;
  }

  function _transfer(address from, address to, uint256 amount) internal returns (bool) {
    if (balances[from] < amount) {
      return false;
    }
    balances[from] -= amount;
    balances[to] += amount;
    return true;
  }
}
