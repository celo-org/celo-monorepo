pragma solidity ^0.5.8;

import "../interfaces/IValidators.sol";

/**
 * @title Holds a list of addresses of validators
 */
contract MockValidators is IValidators {

  mapping(address => bool) private _isValidating;
  mapping(address => bool) private _isVoting;
  address[] private validators;

  function isValidating(address account) external view returns (bool) {
    return _isValidating[account];
  }

  function isVoting(address account) external view returns (bool) {
    return _isVoting[account];
  }

  function getValidators() external view returns (address[] memory) {
    return validators;
  }

  function setValidating(address account) external {
    _isValidating[account] = true;
  }

  function setVoting(address account) external {
    _isVoting[account] = true;
  }

  function addValidator(address account) external {
    validators.push(account);
  }
}
