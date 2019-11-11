pragma solidity ^0.5.8;

import "../Freezable.sol";

contract FreezableTest is Freezable {
  event FunctionCalled();

  function setFreezer(address _freezer) external {
    _setFreezer(_freezer);
  }

  function freezableFunction() external onlyWhenNotFrozen {
    emit FunctionCalled();
  }

  function nonfreezableFunction() external {
    emit FunctionCalled();
  }
}
