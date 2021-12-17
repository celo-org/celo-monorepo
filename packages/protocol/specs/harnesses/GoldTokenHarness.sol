pragma solidity ^0.5.13;

import "contracts/common/GoldToken.sol";
import "openzeppelin-solidity/contracts/utils/Address.sol";

contract GoldTokenHarness is GoldToken {
  using Address for address payable; // prettier-ignore
  /* solhint-disable no-empty-blocks */
  function init_state() public {}
  constructor(bool test) public GoldToken(test) {}

  function _transfer(address to, uint256 value) internal returns (bool) {
    require(to != address(0), "Transfer attempted to reserved address 0x0");
    require(to != address(this), "GoldToken cannot transfer to itself");
    require(value <= balanceOf(msg.sender), "Transfer value exceeded balance of sender");

    address(uint160(to)).sendValue(value); // TRANSFER.call.value(0).gas(gasleft())(abi.encode(msg.sender, to, value));
    emit Transfer(msg.sender, to, value);
    return true;
  }

}
