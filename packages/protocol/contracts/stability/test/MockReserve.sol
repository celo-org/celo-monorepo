pragma solidity ^0.5.8;
// solhint-disable no-unused-vars

import "../../common/interfaces/IERC20Token.sol";


/**
 * @title A mock Reserve for testing.
 */
contract MockReserve {

  mapping(address => bool) public tokens;

  IERC20Token public goldToken;

  // solhint-disable-next-line no-empty-blocks
  function () external payable {}

  function setGoldToken(address goldTokenAddress) external {
    goldToken = IERC20Token(goldTokenAddress);
  }

  function transferGold(address to, uint256 value) external returns (bool) {
    require(goldToken.transfer(to, value), "gold token transfer failed");
    return true;
  }

  function addToken(address token) external returns (bool) {
    tokens[token] = true;
    return true;
  }

  function burnToken(address) external pure returns (bool) {
    return true;
  }

  function mintToken(address, address, uint256) external pure returns (bool) {
    return true;
  }
}
