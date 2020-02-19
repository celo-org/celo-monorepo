pragma solidity ^0.5.3;

contract Freezable {
  bool public frozen;
  address public freezer;

  // onlyFreezer functions can only be called by the specified `freezer` address
  modifier onlyFreezer() {
    require(msg.sender == freezer, "only freezer can make this call");
    _;
  }

  // onlyWhenNotFrozen functions can only be called when `frozen` is false, otherwise they will
  // revert.
  modifier onlyWhenNotFrozen() {
    require(!frozen, "can't call when contract is frozen");
    _;
  }

  /**
   * @notice Sets the address that is allowed to freeze/unfreeze the contract.
   * @param _freezer The address that is allowed to freeze/unfree the contract
   * @dev This function is `internal` and leaves its permissioning up to the inheriting contract.
   */
  function _setFreezer(address _freezer) internal {
    freezer = _freezer;
  }

  /**
   * @notice Freezes the contract, disabling `onlyWhenNotFrozen` functions.
   */
  function freeze() external onlyFreezer {
    frozen = true;
  }

  /**
   * @notice Unreezes the contract, enabling `onlyWhenNotFrozen` functions.
   */
  function unfreeze() external onlyFreezer {
    frozen = false;
  }
}
