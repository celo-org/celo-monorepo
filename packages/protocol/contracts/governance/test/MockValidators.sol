pragma solidity ^0.5.3;

import "../interfaces/IValidators.sol";

/**
 * @title Holds a list of addresses of validators
 */
contract MockValidators is IValidators {

  mapping(address => bool) private _isValidating;
  mapping(address => bool) private _isVoting;
  address[] private validators;
  uint256 private quorum;
  uint256 private epoch;

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

  function validatorAddressFromCurrentSet(uint256 idx) external view returns (address) {
    return validators[idx];
  }

  function numberValidatorsInCurrentSet() external view returns (uint256) {
    return validators.length;
  }

  function getByzantineQuorumForCurrentSet() external view returns (uint256) {
    return quorum;
  }

  function setByzantineQuorumForCurrentSet(uint256 q) external {
    quorum = q;
  }

  function getEpochNumber() external view returns (uint256) {
    return epoch;
  }

  function setEpochNumber(uint256 e) external {
    epoch = e;
  }
}
