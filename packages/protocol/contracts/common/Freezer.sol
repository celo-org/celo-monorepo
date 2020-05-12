pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "./Initializable.sol";
import "./interfaces/IFreezer.sol";

contract Freezer is Ownable, Initializable, IFreezer {
  mapping(address => bool) public isFrozen;

  function initialize() external initializer {
    _transferOwnership(msg.sender);
  }

  /**
   * @notice Freezes the target contract, disabling `onlyWhenNotFrozen` functions.
   * @param target The address of the contract to freeze.
   */
  function freeze(address target) external onlyOwner {
    isFrozen[target] = true;
  }

  /**
   * @notice Unfreezes the contract, enabling `onlyWhenNotFrozen` functions.
   * @param target The address of the contract to freeze.
   */
  function unfreeze(address target) external onlyOwner {
    isFrozen[target] = false;
  }
}
