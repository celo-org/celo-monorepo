// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.5.13 <0.8.20;

interface IUniswapV2RouterMin {
  function swapExactTokensForTokens(
    uint256 amountIn,
    uint256 amountOutMin,
    address[] calldata path,
    address to,
    uint256 deadline
  ) external returns (uint256[] memory amounts);
  function getAmountsOut(
    uint256 amountIn,
    address[] calldata path
  ) external view returns (uint256[] memory amounts);
  function factory() external pure returns (address);
}
