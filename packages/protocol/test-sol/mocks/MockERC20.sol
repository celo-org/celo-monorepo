// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.7 <0.8.20;

import "@openzeppelin/contracts8/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {

  constructor () ERC20("MockERC20", "MERC") {}

  function mint(address account, uint256 amount) external {
    _mint(account, amount);
  }
}
