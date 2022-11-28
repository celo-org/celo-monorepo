pragma solidity ^0.5.13;
// solhint-disable no-unused-vars

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

/**
 * @title A mock Reserve for testing.
 */
contract MockReserve {
  mapping(address => bool) public tokens;
  mapping(address => bool) public collateralAssets;

  IERC20 public goldToken;

  // solhint-disable-next-line no-empty-blocks
  function() external payable {}

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

  function transferCollateralAsset(address tokenAddress, address payable to, uint256 amount)
    external
    returns (bool)
  {
    require(IERC20(tokenAddress).transfer(to, amount), "asset transfer failed");
    return true;
  }

  function addToken(address token) external returns (bool) {
    tokens[token] = true;
    return true;
  }

  function addCollateralAsset(address token) external returns (bool) {
    collateralAssets[token] = true;
    return true;
  }

  function burnToken(address) external pure returns (bool) {
    return true;
  }

  function getUnfrozenReserveGoldBalance() external view returns (uint256) {
    return address(this).balance;
  }

  function isStableAsset(address token) external view returns (bool) {
    return tokens[token];
  }

  function isCollateralAsset(address token) external view returns (bool) {
    return collateralAssets[token];
  }
}
