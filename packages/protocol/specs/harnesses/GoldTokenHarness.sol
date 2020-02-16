pragma solidity ^0.5.8;

import "contracts/common/GoldToken.sol";

contract GoldTokenHarness is GoldToken {
  function init_state() public {}

  function _transfer(address to, uint256 value) internal returns (bool) {
    require(to != address(0), "transfer attempted to reserved address 0x0");
	require(to != address(this), "GoldToken cannot transfer to itself");
    require(value <= balanceOf(msg.sender), "transfer value exceeded balance of sender");

    address(uint160(to)).transfer(value); // TRANSFER.call.value(0).gas(gasleft())(abi.encode(msg.sender, to, value));
    emit Transfer(msg.sender, to, value);
    return true;
  }
  
  
}
