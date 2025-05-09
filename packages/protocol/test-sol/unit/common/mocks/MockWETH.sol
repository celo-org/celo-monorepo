// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.7 <0.8.20;

import "@openzeppelin/contracts8/token/ERC20/ERC20.sol";

contract MockWETH is ERC20 {
  event Deposit(address indexed dst, uint wad);
  event Withdrawal(address indexed src, uint wad);

  uint256 public totalDeposited;

  constructor() ERC20("Mock Wrapped Ether", "MWETH") {}

  function deposit() external payable {
    _mint(msg.sender, msg.value);
    totalDeposited += msg.value;
    emit Deposit(msg.sender, msg.value);
  }

  function withdraw(uint256 wad) external {
    require(balanceOf(msg.sender) >= wad, "MockWETH: insufficient balance");
    _burn(msg.sender, wad);
    payable(msg.sender).transfer(wad);
    emit Withdrawal(msg.sender, wad);
    totalDeposited -= wad;
  }
}
