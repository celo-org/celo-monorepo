// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;

import "contracts/stability/StableToken.sol";
import "contracts/common/Registry.sol";
import "forge-std/Vm.sol";

contract MockStableToken is StableToken(true) {
  address private constant VM_ADDRESS = address(
    bytes20(uint160(uint256(keccak256("hevm cheat code"))))
  );

  Vm public constant vm = Vm(VM_ADDRESS);

  function mint(address to, uint256 value) external returns (bool) {
    require(to != address(0), "0 is a reserved address");
    if (value == 0) {
      return true;
    }

    uint256 units = __valueToUnits(inflationState.factor, value);
    totalSupply_ = totalSupply_.add(units);
    balances[to] = balances[to].add(units);
    emit Transfer(address(0), to, value);
    return true;
  }

  function __valueToUnits(FixidityLib.Fraction memory inflationFactor, uint256 value)
    private
    pure
    returns (uint256)
  {
    return inflationFactor.multiply(FixidityLib.newFixed(value)).fromFixed();
  }
}
