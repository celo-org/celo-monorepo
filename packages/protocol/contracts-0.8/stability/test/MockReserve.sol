// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

// solhint-disable no-unused-vars

import "@openzeppelin/contracts8/token/ERC20/IERC20.sol";

/**
 * @title A mock Reserve for testing.
 */
contract MockReserve08 {
  mapping(address => bool) public tokens;

  IERC20 public goldToken;

  // solhint-disable-next-line no-empty-blocks
  receive() external payable {}

  function setGoldToken(address goldTokenAddress) external {
    goldToken = IERC20(goldTokenAddress);
  }

  function transferGold(address to, uint256 value) external returns (bool) {
    require(goldToken.transfer(to, value), "gold token transfer failed");
    return true;
  }

  function transferExchangeGold(address to, uint256 value) external returns (bool) {
    require(goldToken.transfer(to, value), "gold token transfer failed");
    return true;
  }

  function addToken(address token) external returns (bool) {
    tokens[token] = true;
    return true;
  }

  function getUnfrozenReserveGoldBalance() external view returns (uint256) {
    return address(this).balance;
  }

  function burnToken(address) external pure returns (bool) {
    return true;
  }

  function getReserveGoldBalance() public view returns (uint256) {
    return address(this).balance;
  }
}
