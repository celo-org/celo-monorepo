pragma solidity ^0.5.3;


contract Freezable {
  bool public frozen;
  address public freezer;

  modifier onlyFreezer() {
      require(msg.sender == freezer);
      _;
  }

  modifier onlyWhenNotFrozen() {
    if (!frozen) {
        _;
    }
  }

  modifier onlyWhenNotFrozenOrThrow() {
    require(!frozen);
    _;
  }

  function _setFreezer(address _freezer) internal {
      freezer = _freezer;
  }

  function freeze() external onlyFreezer {
      frozen = true;
  }

  function unfreeze() external onlyFreezer {
      frozen = false;
  }
}

