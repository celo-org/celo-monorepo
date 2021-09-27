pragma solidity ^0.5.13;

import "contracts/stability/Reserve.sol";

contract ReserveHarness is Reserve {
  constructor() public Reserve(true) {}

  function contractBalance() public view returns (uint256) {
    return address(this).balance;
  }

  function getExchangeAddress() public view returns (address) {
    return address(getExchange());
  }
}
