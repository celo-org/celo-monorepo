pragma solidity ^0.5.13;

contract MockERC20 {
  string private _name;
  string private _symbol;

  constructor(string memory name_, string memory symbol_) public {
    _name = name_;
    _symbol = symbol_;
  }

  function name() public view returns (string memory) {
    return _name;
  }

  function symbol() public view returns (string memory) {
    return _symbol;
  }
}
