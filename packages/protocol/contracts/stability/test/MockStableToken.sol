pragma solidity ^0.5.13;
// solhint-disable no-unused-vars

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "../../common/FixidityLib.sol";

/**
 * @title A mock StableToken for testing.
 */
contract MockStableToken {
  using FixidityLib for FixidityLib.Fraction;
  using SafeMath for uint256;

  uint8 public constant decimals = 18;
  uint256 public _totalSupply;
  FixidityLib.Fraction public inflationFactor;

  // Stored as units. Value can be found using unitsToValue().
  mapping(address => uint256) public balances;

  constructor() public {
    setInflationFactor(FixidityLib.fixed1().unwrap());
  }

  function setInflationFactor(uint256 newInflationFactor) public {
    inflationFactor = FixidityLib.wrap(newInflationFactor);
  }

  function setTotalSupply(uint256 value) external {
    _totalSupply = value;
  }

  function mint(address to, uint256 value) external returns (bool) {
    require(to != address(0), "0 is a reserved address");
    balances[to] = balances[to].add(valueToUnits(value));
    _totalSupply = _totalSupply.add(value);
    return true;
  }

  function burn(uint256 value) external returns (bool) {
    balances[msg.sender] = balances[msg.sender].sub(valueToUnits(value));
    _totalSupply = _totalSupply.sub(value);
    return true;
  }

  function totalSupply() external view returns (uint256) {
    return _totalSupply;
  }

  function transfer(address to, uint256 value) external returns (bool) {
    return _transfer(msg.sender, to, value);
  }

  function transferFrom(address from, address to, uint256 value) external returns (bool) {
    return _transfer(from, to, value);
  }

  function _transfer(address from, address to, uint256 value) internal returns (bool) {
    uint256 balanceValue = balanceOf(from);
    if (balanceValue < value) {
      return false;
    }
    uint256 units = valueToUnits(value);
    balances[from] = balances[from].sub(units);
    balances[to] = balances[to].add(units);
    return true;
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
}
