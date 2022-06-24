pragma solidity ^0.5.13;
// solhint-disable no-unused-vars

import "forge-std/Vm.sol";
import "contracts/common/GoldToken.sol";

/**
 * @title A mock GoldToken for testing that uses foundry cheat codes
 * instead of precompiles
 */
contract MockGoldToken is GoldToken(true) {
  address private constant VM_ADDRESS = address(
    bytes20(uint160(uint256(keccak256("hevm cheat code"))))
  );

  Vm public constant vm = Vm(VM_ADDRESS);
  uint8 public constant decimals = 18;
  uint256 public totalSupply;

  function setTotalSupply(uint256 value) external {
    totalSupply = value;
  }

  function mint(address to, uint256 value) external returns (bool) {
    totalSupply = totalSupply + value;
    vm.deal(to, to.balance + value);
    emit Transfer(address(0), to, value);
    return true;
  }

  function balanceOf(address a) public view returns (uint256) {
    return a.balance;
  }
}
