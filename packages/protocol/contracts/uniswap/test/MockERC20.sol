pragma solidity ^0.5.13;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
  function mint(address account, uint256 amount) external {
    _mint(account, amount);
  }
}
