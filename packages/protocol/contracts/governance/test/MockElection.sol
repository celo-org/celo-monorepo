pragma solidity ^0.5.3;

import "../interfaces/IElection.sol";

/**
 * @title Holds a list of addresses of validators
 */
contract MockElection is IElection {

  mapping(address => bool) public isIneligible;

  function markGroupIneligible(address account) external {
    isIneligible[account] = true;
  }
}
