// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.0 <0.9.0;
// solhint-disable no-unused-vars

import "../../common/FixidityLib.sol";

/**
 * @title A mock StableToken for testing.
 */
contract MockStableToken08 {
  using FixidityLib for FixidityLib.Fraction;

  uint8 public constant decimals = 18;
  uint256 public _totalSupply;
  FixidityLib.Fraction public inflationFactor;

  // Stored as units. Value can be found using unitsToValue().
  mapping(address => uint256) public balances;

  constructor() {
    setInflationFactor(FixidityLib.fixed1().unwrap());
  }

  function setTotalSupply(uint256 value) external {
    _totalSupply = value;
  }

  function mint(address to, uint256 value) external returns (bool) {
    require(to != address(0), "0 is a reserved address");
    balances[to] = (balances[to] + valueToUnits(value));
    _totalSupply = (_totalSupply + value);
    return true;
  }

  function burn(uint256 value) external returns (bool) {
    balances[msg.sender] = (balances[msg.sender] - valueToUnits(value));
    _totalSupply = (_totalSupply - value);
    return true;
  }

  function transfer(address to, uint256 value) external returns (bool) {
    return _transfer(msg.sender, to, value);
  }

  function transferFrom(address from, address to, uint256 value) external returns (bool) {
    return _transfer(from, to, value);
  }

  function totalSupply() external view returns (uint256) {
    return _totalSupply;
  }

  function setInflationFactor(uint256 newInflationFactor) public {
    inflationFactor = FixidityLib.wrap(newInflationFactor);
  }

  function balanceOf(address account) public view returns (uint256) {
    return unitsToValue(balances[account]);
  }

  function unitsToValue(uint256 units) public view returns (uint256) {
    return FixidityLib.newFixed(units).divide(inflationFactor).fromFixed();
  }

  function valueToUnits(uint256 value) public view returns (uint256) {
    return inflationFactor.multiply(FixidityLib.newFixed(value)).fromFixed();
  }

  function _transfer(address from, address to, uint256 value) internal returns (bool) {
    uint256 balanceValue = balanceOf(from);
    if (balanceValue < value) {
      return false;
    }
    uint256 units = valueToUnits(value);
    balances[from] = (balances[from] - units);
    balances[to] = (balances[to] + units);
    return true;
  }
}
