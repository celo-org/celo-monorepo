// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.5.13 < 0.9;

/**
 * @title This interface describes the non- ERC20 shared interface for all Celo Tokens, and
 * in the absence of interface inheritance is intended as a companion to IERC20.sol.
 */
interface ICeloTokenInitializer {
  function initialize(address) external;
}
