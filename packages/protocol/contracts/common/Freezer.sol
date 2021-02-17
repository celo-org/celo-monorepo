pragma solidity ^0.5.13;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "./Initializable.sol";
import "./interfaces/IFreezer.sol";

contract Freezer is Ownable, Initializable, IFreezer {
  mapping(address => bool) public isFrozen;

  /**
   * @notice Sets initialized == true on implementation contracts
   * @param test  Set to true to skip implementation initialization
   */
  constructor(bool test) public Initializable(test) {}

  /**
    * @notice Returns the storage, major, minor, and patch version of the contract.
    * @return The storage, major, minor, and patch version of the contract.
    */
  function getVersionNumber() external pure returns (uint256, uint256, uint256, uint256) {
    return (1, 1, 1, 0);
  }

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
