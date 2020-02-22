pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "./Initializable.sol";
import "./interfaces/Freezable.sol";

contract Freezer is Ownable, Initializable, IFreezer {
  mapping(address => bool) public isFrozen;

  function initialize() external initializer {
    _transferOwnership(msg.sender);
  }

  /**
   * @notice Associates the given address with the given identifier.
   * @param identifier Identifier of contract whose address we want to set.
  /**
   * @notice Freezes the contract, disabling `onlyWhenNotFrozen` functions.
   */
  function freeze(address destination) external onlyOwner {
    frozen[destination] = true;
  }

  /**
   * @notice Unreezes the contract, enabling `onlyWhenNotFrozen` functions.
   */
  function unfreeze(address destination) external onlyOwner {
    frozen[destination] = false;
  }
}
