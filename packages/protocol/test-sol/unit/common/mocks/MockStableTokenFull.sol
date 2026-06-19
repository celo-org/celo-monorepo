// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "@openzeppelin/contracts8/utils/math/SafeMath.sol";

/**
 * @title A minimal 0.8 mock StableToken for FeeHandler tests.
 * Supports mint, burn, transfer, transferFrom (no allowance check), approve (no-op),
 * and balanceOf.
 */
contract MockStableTokenFull {
  using SafeMath for uint256;

  uint8 public constant decimals = 18;
  uint256 public totalSupply;
  mapping(address => uint256) private balances;
  mapping(address => mapping(address => uint256)) private allowances;

  bytes32 private _exchangeRegistryId;

  constructor(bytes32 exchangeRegistryId) {
    _exchangeRegistryId = exchangeRegistryId;
  }

  function getExchangeRegistryId() external view returns (bytes32) {
    return _exchangeRegistryId;
  }

  function mint(address to, uint256 value) external returns (bool) {
    require(to != address(0), "0 is a reserved address");
    balances[to] = balances[to].add(value);
    totalSupply = totalSupply.add(value);
    emit Transfer(address(0), to, value);
    return true;
  }

  function burn(uint256 value) external returns (bool) {
    require(balances[msg.sender] >= value, "insufficient balance");
    balances[msg.sender] = balances[msg.sender].sub(value);
    totalSupply = totalSupply.sub(value);
    emit Transfer(msg.sender, address(0), value);
    return true;
  }

  function transfer(address to, uint256 value) external returns (bool) {
    return _transfer(msg.sender, to, value);
  }

  function transferFrom(address from, address to, uint256 value) external returns (bool) {
    return _transfer(from, to, value);
  }

  function approve(address, uint256) external pure returns (bool) {
    // No-op: MockExchange08.transferFrom does not check allowances.
    return true;
  }

  function balanceOf(address account) external view returns (uint256) {
    return balances[account];
  }

  event Transfer(address indexed from, address indexed to, uint256 value);

  function _transfer(address from, address to, uint256 value) internal returns (bool) {
    require(balances[from] >= value, "insufficient balance");
    balances[from] = balances[from].sub(value);
    balances[to] = balances[to].add(value);
    emit Transfer(from, to, value);
    return true;
  }
}
