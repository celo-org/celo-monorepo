// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.7 <0.8.20;

// Minimal local copy of the Mento Exchange interface. The Mento core IExchange
// is pinned at Solidity 0.5 (a git submodule) and cannot be imported by 0.8
// code; the 0.8 MentoFeeHandlerSeller only needs the sell entrypoint.
interface IExchange {
  function buy(uint256, uint256, bool) external returns (uint256);
  function sell(uint256, uint256, bool) external returns (uint256);
  function exchange(uint256, uint256, bool) external returns (uint256);
  function getBuyTokenAmount(uint256, bool) external view returns (uint256);
  function getSellTokenAmount(uint256, bool) external view returns (uint256);
  function getBuyAndSellBuckets(bool) external view returns (uint256, uint256);
}
